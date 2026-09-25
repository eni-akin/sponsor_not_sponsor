import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { scanPage } from '../src/scanner';
import { interpretJob } from '../src/interpreter';
import type { Citation, Interpretation, JobRecord, ScanResult } from '../src/types';
import { corpus, type Case, type Split } from './corpus';

export function ratio(numerator: number, denominator: number) {
  if (!denominator) return { numerator, denominator, value: null, interval95: null };
  const value = numerator / denominator, z = 1.96, scale = 1 + z * z / denominator;
  const center = (value + z * z / (2 * denominator)) / scale;
  const margin = z * Math.sqrt(value * (1 - value) / denominator + z * z / (4 * denominator ** 2)) / scale;
  return { numerator, denominator, value, interval95: [Math.max(0, center - margin), Math.min(1, center + margin)] };
}

export function validateCorpus(cases: Case[]): void {
  const ids = new Set<string>(), families = new Map<string, Split>();
  for (const item of cases) {
    if (ids.has(item.id)) throw new Error(`Duplicate case ID: ${item.id}`);
    ids.add(item.id);
    if (families.has(item.family) && families.get(item.family) !== item.split) throw new Error(`Family crosses splits: ${item.family}`);
    families.set(item.family, item.split);
    if (!item.rationale || !item.family || (!!item.text === (item.html !== undefined))) throw new Error(`Invalid input: ${item.id}`);
    if (item.html !== undefined && !item.pageKind) throw new Error(`Missing page label: ${item.id}`);
    if (!['development', 'holdout'].includes(item.split)) throw new Error(`Invalid split: ${item.id}`);
    for (const key of ['sponsorship', 'now', 'future'] as const) {
      if (item.expected[key] !== undefined && !['available', 'unavailable', 'conditional', 'unclear'].includes(item.expected[key]!)) throw new Error(`Invalid ${key}: ${item.id}`);
    }
    for (const key of ['cpt', 'opt'] as const) if (!['explicitly-accepted', 'explicitly-excluded', 'unclear'].includes(item.expected[key])) throw new Error(`Invalid ${key}: ${item.id}`);
  }
}

export function citationErrors(role: JobRecord, result: Interpretation): string[] {
  const errors: string[] = [];
  const check = (citation: Citation) => {
    const block = role.evidence.find(block => block.id === citation.evidenceId);
    if (!block || !citation.quote || !block.text.includes(citation.quote) || block.source !== citation.source) errors.push(`Invalid citation: ${citation.evidenceId}`);
  };
  for (const finding of [result.sponsorship, result.cpt, result.opt, ...Object.values(result.sponsorshipByTiming)]) {
    if (finding.status !== 'unclear' && !finding.citations.length) errors.push('Policy label without evidence');
    if (JSON.stringify([...new Set(finding.citations.map(citation => citation.evidenceId))].sort()) !== JSON.stringify([...finding.evidenceIds].sort())) errors.push('Evidence ID/citation mismatch');
    finding.citations.forEach(check);
  }
  result.restrictions.forEach(restriction => restriction.citations.forEach(check));
  result.context.forEach(context => check(context.citation));
  return [...new Set(errors)];
}

export function runCase(item: Case) {
  let scan: ScanResult | undefined;
  let role: JobRecord | null;
  if (item.html !== undefined) {
    const dom = new JSDOM(item.html, { url: `https://example.test/jobs/${item.id}` });
    try { scan = scanPage(dom.window.document, dom.window.location.href); role = scan.role; }
    finally { dom.window.close(); }
  } else {
    role = { key: item.id, title: 'Evaluation role', employer: null, location: null, identifier: null, employmentTypes: [], completeness: 'description-found',
      evidence: item.text!.map((text, i) => ({ id: `${item.id}-${i}`, text, source: 'visible-page', kind: item.question ? 'application-question' : 'text', locator: `paragraph-${i}` })) };
  }
  const interpretation = role ? interpretJob(role) : null;
  const actual = { sponsorship: interpretation?.sponsorship.status ?? 'unclear', cpt: interpretation?.cpt.status ?? 'unclear', opt: interpretation?.opt.status ?? 'unclear',
    now: interpretation?.sponsorshipByTiming.now.status ?? 'unclear', future: interpretation?.sponsorshipByTiming.future.status ?? 'unclear',
    restrictions: [...new Set(interpretation?.restrictions.map(item => item.kind) ?? [])].sort(),
    review: interpretation ? [interpretation.sponsorship, interpretation.cpt, interpretation.opt].some(finding => finding.requiresReview) : false };
  const errors: string[] = [];
  for (const [key, expected] of Object.entries(item.expected)) {
    const comparison = Array.isArray(expected) ? [...expected].sort() : expected;
    if (JSON.stringify(actual[key as keyof typeof actual]) !== JSON.stringify(comparison)) errors.push(`${key}: expected ${JSON.stringify(comparison)}, got ${JSON.stringify(actual[key as keyof typeof actual])}`);
  }
  if (item.pageKind && scan?.kind !== item.pageKind) errors.push(`pageKind: expected ${item.pageKind}, got ${scan?.kind}`);
  if (item.title && role?.title !== item.title) errors.push(`title: expected ${item.title}, got ${role?.title}`);
  const extracted = role?.evidence.map(block => block.text).join('\n') ?? '';
  for (const text of item.contains ?? []) if (!extracted.includes(text)) errors.push(`Missing required text: ${text}`);
  for (const text of item.excludes ?? []) if (extracted.includes(text)) errors.push(`Excluded text leaked: ${text}`);
  const evidenceErrors = role && interpretation ? citationErrors(role, interpretation) : [];
  errors.push(...evidenceErrors);
  return { id: item.id, family: item.family, deferred: item.deferred ?? false, rationale: item.rationale, expected: item.expected, actual,
    expectedKind: item.pageKind, actualKind: scan?.kind, detected: !!role, evidenceErrors, errors };
}
export type Observation = ReturnType<typeof runCase>;
const isJob = (kind: string | undefined) => kind === 'job-posting' || kind === 'job-application';

export function summarize(observations: Observation[]) {
  const pages = observations.filter(item => item.expectedKind);
  const jobs = observations.filter(item => !item.expectedKind || isJob(item.expectedKind));
  // Include false detections on ordinary pages in policy precision: a stray definitive
  // label is wrong even when the detector should never have produced a role.
  const fields = Object.fromEntries((['sponsorship', 'cpt', 'opt'] as const).map(field => {
    const definitive = (value: string) => field === 'sponsorship' ? ['available', 'unavailable'].includes(value) : value !== 'unclear';
    const predictions = observations.filter(item => definitive(item.actual[field]));
    const expectedDefinitive = jobs.filter(item => definitive(item.expected[field]));
    const correct = predictions.filter(item => (!item.expectedKind || isJob(item.expectedKind)) && item.actual[field] === item.expected[field]);
    const confusion: Record<string, Record<string, number>> = {};
    for (const item of observations) {
      const row = confusion[item.expected[field]] ??= {};
      row[item.actual[field]] = (row[item.actual[field]] ?? 0) + 1;
    }
    return [field, { definitivePrecision: ratio(correct.length, predictions.length), definitiveRecall: ratio(correct.length, expectedDefinitive.length),
      conclusionCoverage: ratio(jobs.filter(item => item.actual[field] !== 'unclear').length, jobs.length),
      exactAccuracy: ratio(observations.filter(item => item.actual[field] === item.expected[field]).length, observations.length), confusion }];
  }));
  const truePositive = pages.filter(item => item.detected && isJob(item.expectedKind)).length;
  return { count: observations.length, policyOnlyCount: observations.length - pages.length, pageCount: pages.length,
    casesWithoutErrors: ratio(observations.filter(item => !item.errors.length).length, observations.length), fields,
    detection: { precision: ratio(truePositive, pages.filter(item => item.detected).length), recall: ratio(truePositive, pages.filter(item => isJob(item.expectedKind)).length),
      kindAccuracy: ratio(pages.filter(item => item.actualKind === item.expectedKind).length, pages.length) },
    citationErrorCases: observations.filter(item => item.evidenceErrors.length).length,
    failedCases: observations.filter(item => item.errors.length).map(item => ({ id: item.id, deferred: item.deferred, errors: item.errors })) };
}

const format = (metric: ReturnType<typeof ratio>) => metric.value === null ? `N/A (${metric.numerator}/${metric.denominator})` : `${(metric.value * 100).toFixed(1)}% (${metric.numerator}/${metric.denominator})`;
export async function evaluate(split: Split, outputRoot = 'evaluation/results') {
  validateCorpus(corpus);
  const selected = corpus.filter(item => item.split === split);
  const digest = (value: string) => createHash('sha256').update(value).digest('hex');
  const hashes = { corpus: digest(JSON.stringify(corpus)), selected: digest(JSON.stringify(selected)),
    scanner: digest(await readFile(new URL('../src/scanner.ts', import.meta.url), 'utf8')),
    interpreter: digest(await readFile(new URL('../src/interpreter.ts', import.meta.url), 'utf8')) };
  if (split === 'holdout') {
    const lock = JSON.parse(await readFile(new URL('./holdout-lock.json', import.meta.url), 'utf8')) as { selectedSha256: string };
    if (hashes.selected !== lock.selectedSha256) throw new Error('Reserved corpus changed. Create a new version and review split integrity before evaluation.');
  }
  const observations = selected.map(runCase);
  const metrics = summarize(observations);
  const sponsorship = metrics.fields.sponsorship!;
  const numericTargetMet = sponsorship.definitivePrecision.value !== null && sponsorship.definitivePrecision.value >= .95 && sponsorship.definitivePrecision.denominator >= 20;
  // The first reserved run is archived in holdout.json/md. Those observations
  // informed fixes, so future executions are explicitly regression runs.
  const runName = split === 'holdout' ? 'reserved-regression' : split;
  const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), split, evaluationUse: split === 'holdout' ? 'regression-after-holdout-exposure' : 'development', provenance: 'AI-authored constructed scenarios; provisional labels; independent human review pending; not a real-world accuracy estimate.',
    hashes, numericTarget: { minimumPrecision: .95, minimumPredictions: 20, met: numericTargetMet },
    betaReleaseGate: 'pending-independent-human-reviewed-evaluation', metrics,
    byFamily: Object.fromEntries([...new Set(selected.map(item => item.family))].map(family => [family, summarize(observations.filter(item => item.family === family))])), observations };
  const lines = [`# Section 4 ${runName} evaluation`, '', report.provenance, '', ...(split === 'holdout' ? ['The reserved set has now informed fixes. This is a regression result, not a fresh holdout score. The first run is preserved separately in holdout.md and holdout.json.', ''] : []), `Cases: ${metrics.count} (${metrics.policyOnlyCount} policy scenarios, ${metrics.pageCount} page scenarios).`, '',
    '| Measure | Result |', '| --- | --- |',
    `| Cases meeting every expectation | ${format(metrics.casesWithoutErrors)} |`,
    `| Job detection precision | ${format(metrics.detection.precision)} |`, `| Job detection recall | ${format(metrics.detection.recall)} |`,
    ...Object.entries(metrics.fields).flatMap(([name, value]) => [
      `| ${name}: definitive precision | ${format(value.definitivePrecision)} |`, `| ${name}: definitive recall | ${format(value.definitiveRecall)} |`,
      `| ${name}: conclusion coverage | ${format(value.conclusionCoverage)} |`]),
    `| Cases with invalid citations | ${metrics.citationErrorCases} |`, '',
    'Definitive sponsorship means available/unavailable; conditional is included in conclusion coverage but not definitive precision. Missed jobs count in recall and coverage denominators. Citation validity checks exact source text, attribution, and evidence IDs, not semantic correctness. JSON includes confusion matrices, per-family metrics, and Wilson 95% intervals; intervals describe these constructed samples only.', '',
    `Numerical sponsorship target (≥95%, at least 20 definitive predictions): ${numericTargetMet ? 'met' : 'not met'}. Independent human-reviewed beta gate: PENDING.`, '',
    '## Errors', '', ...observations.filter(item => item.errors.length).flatMap(item => [`- **${item.id}**${item.deferred ? ' (detection improvement deferred to section 7)' : ''}: ${item.errors.join('; ')}.`, `  Expected reasoning: ${item.rationale}`]), '',
    '## Reproducibility', '', `Generated: ${report.generatedAt}`, '', ...Object.entries(hashes).map(([name, hash]) => `- ${name} SHA-256: \`${hash}\``), ''];
  await mkdir(outputRoot, { recursive: true });
  await writeFile(`${outputRoot}/${runName}.json`, JSON.stringify(report, null, 2) + '\n');
  await writeFile(`${outputRoot}/${runName}.md`, lines.join('\n'));
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const split = process.argv.includes('--holdout') ? 'holdout' : 'development';
  const report = await evaluate(split);
  console.log(`${split}: ${report.metrics.count} cases; ${report.metrics.failedCases.length} failed cases; sponsorship precision ${format(report.metrics.fields.sponsorship!.definitivePrecision)}. See evaluation/results/${split === 'holdout' ? 'reserved-regression' : split}.md`);
  if (process.argv.includes('--strict') && !report.numericTarget.met) process.exitCode = 1;
}
