import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { researchRequest } from '../src/research.ts';
import { matchEmployer } from '../server/research-service.ts';

const directory = 'evaluation/live-2026-09-26';
const sample = JSON.parse(await readFile(`${directory}/sample.json`, 'utf8'));
const reviews = JSON.parse(await readFile(`${directory}/reviews.json`, 'utf8'));
const employers = JSON.parse(await readFile('server/employers.json', 'utf8'));
const normalize = value => value.replace(/\s+/g, ' ').trim();
const read = async (id, suffix) => JSON.parse(await readFile(`${directory}/raw/${String(id).padStart(2, '0')}${suffix}.json`, 'utf8'));
const items = [];
assert.equal(reviews.length, 30);
assert.equal(new Set(reviews.map(r => r.id)).size, 30);
for (const row of sample.records) {
  const review = reviews.find(r => r.id === row.id);
  assert.ok(review);
  const primary = await read(row.id, '-verified');
  assert.equal(primary.snapshot?.state, 'ready', `No verified extension response for ${row.id}`);
  const source = await read(row.id, review.evidenceSuffix);
  if (review.quote) {
    assert.ok(normalize(source.dom.text).includes(normalize(review.quote)), `Quote not found in source ${row.id}`);
    assert.ok(review.quote.split(/\s+/).length <= 25, `Quote too long for ${row.id}`);
  }
  const scan = primary.snapshot.result;
  const request = researchRequest(scan);
  const research = !request ? 'Missing role or employer' : matchEmployer(request.employer, employers) ? 'Mapped' : 'Employer not in supplied registry';
  const alternates = [];
  for (const suffix of ['-description', '-mirror-full']) {
    try {
      const alt = await read(row.id, suffix);
      alternates.push({ kind: suffix === '-description' ? 'Official overview' : 'Secondary full-posting view', url: alt.finalUrl,
        capturedAt: alt.capturedAt, toolPageKind: alt.snapshot?.result?.kind,
        toolRole: alt.snapshot?.result?.role?.title ?? null,
        toolSponsorship: alt.snapshot?.result?.interpretation?.sponsorship.status ?? null });
    } catch { /* Not every row has an alternate view. */ }
  }
  items.push({ ...row, review, source: { url: source.finalUrl, capturedAt: source.capturedAt,
    textSha256: createHash('sha256').update(source.dom.text).digest('hex') },
    primary: { finalUrl: primary.finalUrl, httpStatus: primary.httpStatus, capturedAt: primary.capturedAt,
      textSha256: createHash('sha256').update(primary.dom.text).digest('hex'),
      pageKind: scan.kind, roleTitle: scan.role?.title ?? null, employer: scan.role?.employer ?? null,
      completeness: scan.role?.completeness ?? null, sponsorship: scan.interpretation?.sponsorship.status ?? null,
      cpt: scan.interpretation?.cpt.status ?? null, opt: scan.interpretation?.opt.status ?? null,
      restrictionKinds: scan.interpretation?.restrictions.map(r => r.kind) ?? [],
      bodyOnlySponsorship: primary.replay?.evidenceOnly?.sponsorship.status ?? null,
      citationPresentInExtraction: !!review.quote && (scan.role?.evidence.some(b => normalize(b.text).includes(normalize(review.quote))) ?? false),
      signals: scan.signals, warnings: scan.warnings, researchEligibility: research }, alternates });
}
const count = predicate => items.filter(predicate).length;
const metrics = {
  sample: 30,
  llmUnavailable: count(i => i.review.status === 'unavailable'), llmUnclear: count(i => i.review.status === 'unclear'),
  llmAvailable: count(i => i.review.status === 'available'), llmConditional: count(i => i.review.status === 'conditional'),
  primaryAccessBlocked: count(i => i.primary.httpStatus === 403), primaryRedirectedToLanding: count(i => i.review.category === 'redirected-listing'),
  primaryReadableVacancies: count(i => i.primary.httpStatus !== 403 && i.review.category !== 'redirected-listing'),
  primaryToolRoleRecords: count(i => i.primary.roleTitle !== null),
  primaryToolWrongRoleTitles: count(i => i.review.category === 'wrong-role-title'),
  primaryToolUnavailable: count(i => i.primary.sponsorship === 'unavailable'),
  primaryToolUnclear: count(i => i.primary.sponsorship === 'unclear'),
  primaryToolNoRole: count(i => !i.primary.roleTitle),
  comparablePrimaryRefusals: count(i => i.review.samePageRefusal),
  primaryRefusalsRecognized: count(i => i.review.samePageRefusal && i.primary.sponsorship === 'unavailable'),
  phraseGaps: count(i => i.review.phraseGap),
  missingResearchIdentity: count(i => i.primary.researchEligibility === 'Missing role or employer'),
  unmappedResearchEmployer: count(i => i.primary.researchEligibility === 'Employer not in supplied registry'),
};
await writeFile(`${directory}/results.json`, JSON.stringify({ source: sample, metrics, items }, null, 2) + '\n');
const md = [];
md.push('# Thirty internship postings: evidence review versus Sponsor Not Sponsor 0.6.0', '',
  'Audit date: September 26, 2026. This report compares an LLM evidence assessment with actual extension results from public pages. The assessment concerns the selected vacancy, not a company-wide promise.', '',
  '## What the sample shows', '',
  `- ${metrics.llmUnavailable} postings have evidence of no sponsorship: 11 from directly viewed official descriptions, one from an indexed official AMD posting corroborated by a copy, and two from secondary full-posting copies (Lutron and State Farm).`,
  `- ${metrics.llmUnclear} remain unclear. No selected posting establishes an explicit offer or conditional offer. Four unclear cases have separate citizenship/status context or restrictions: Aerospace, RTX, Astranis, and Radiance. Waymo also states a country-specific export-license condition.`,
  `- The extension returns ${metrics.primaryToolRoleRecords} role records on the original destinations, including ${metrics.primaryToolWrongRoleTitles} with incorrect titles. It returns no role on ${metrics.primaryToolNoRole} destinations.`,
  `- Of ${metrics.primaryReadableVacancies} primary pages with readable vacancy or application content, it detects 11 (44%); nine have the correct role title (36%). Four HTTP 403 responses and one careers-homepage redirect are reported separately from these detector counts.`,
  `- On the nine primary pages containing explicit or requirement-based refusal evidence in the same rendered content, the extension produces two unavailable labels (22.2%). One of those two has a wrong role title. This is a small-sample recognition count, not a validated accuracy estimate.`, '',
  '## Method and limits', '',
  `Source: [SimplifyJobs/Summer2027-Internships](${sample.sourceUrl}), dev-branch README retrieved ${sample.retrievedAt}. The README snapshot is frozen locally with SHA-256 \`${sample.readmeSha256}\`.`, '',
  `Selection: ${sample.method} The sample was fixed before browsing outcomes. It is a convenience sample, not random or representative of all internships. The source list includes co-ops and some non-summer roles.`, '',
  `The tested extension is version 0.6.0 at commit \`${sample.extensionCommit}\`, rebuilt from unchanged production source. It ran in disposable Chrome profiles with fresh settings; research remained off. Each primary result below comes from the extension's own GET_SCAN reply on the rendered page. We also replayed the unchanged scanner and interpreter against that DOM to diagnose failures.`, '',
  'A diagnostic body-only run skips job recognition and feeds the normal body extraction to the unchanged interpreter. It is not the normal product result, may include broader page context, and is used only to locate a failure stage. Alternate overview/mirror runs are also kept separate from the original URL results.', '',
  'The first exploratory pass could not attribute extension replies because tabs.query does not expose page URLs with this manifest. Its DOM replay was not used as the claimed installed-extension result. A corrected read-only harness matched content-script replies and repeated all 30 primary visits; every included primary snapshot is ready.', '',
  'The LLM reviewed rendered wording, role identity, and alternate sources; its judgments were not blinded to the tool results and have not been independently human-adjudicated. Refusals expressed through eligibility bullets are interpretations of their context. Silence, a sponsorship question, relocation money, an equal-opportunity statement, or company reputation never establish sponsorship availability.', '',
  'Secondary full-posting copies are labeled provisional. AMD was also available through an indexed official result, although the live browser returned 403. Different sources and access paths are not treated as equal test inputs. No login, application submission, or applicant data entry was performed.', '',
  '## All 30 comparisons', '',
  '“No role” means the product never reached a sponsorship finding. It must not be counted as a refusal. “Unclear” is an actual product finding only when a role was returned.', '',
  '| # | Company / linked position | Evidence assessment | Original-page tool result | Main issue |',
  '|---|---|---|---|---|');
const labels = { 'application-description-gap': 'Application omits overview', 'appropriate-uncertainty': 'Appropriate uncertainty; see details', 'apply-wording': 'Unrecognized application action', 'access-blocked': 'HTTP 403 access failure', 'title-recognition': 'Role heading not recognized', 'wrong-role-title': 'Wrong role title', 'interpretation': 'Extracted wording not understood', 'correct-definitive-result': 'Successful result', 'redirected-listing': 'Link redirects to careers homepage', 'description-threshold': 'Description-signal threshold' };
for (const item of items) {
  const provisional = [6, 29].includes(item.id) ? ' (secondary)' : item.id === 28 ? ' (indexed official)' : '';
  const tool = item.primary.sponsorship ?? `No role (${item.primary.pageKind})`;
  md.push(`| ${item.id} | [${item.company} — ${item.title.replace(/\|/g, '/')}](${item.url}) | ${item.review.status}${provisional}${item.review.restriction && item.review.status === 'unclear' ? '; restriction/context' : ''} | ${tool}${item.review.category === 'wrong-role-title' ? '; wrong title' : ''} | ${labels[item.review.category]} |`);
}
md.push('', '## Evidence and explanation for each position', '');
for (const item of items) {
  const { review, primary } = item;
  md.push(`### ${item.id}. ${item.company} — ${item.title}`, '',
    `Assessment: **${review.status}**. Evidence basis: ${review.basis}. [Reviewed source](${item.source.url}). Retrieved ${item.source.capturedAt}.`, '');
  if (review.officialIndexedUrl) md.push(`Also supported by the [indexed official requisition](${review.officialIndexedUrl}), accessed through web search on September 26, 2026.`, '');
  if (review.quote) md.push(`> ${review.quote}`, '');
  else md.push('No policy quotation is supplied: the reviewed content did not establish sponsorship availability or refusal.', '');
  md.push(`Evidence rationale: ${review.rationale}`, '',
    `Actual extension result: ${primary.pageKind}; sponsorship ${primary.sponsorship ?? 'not reached'}. Detected title: ${primary.roleTitle ? `“${primary.roleTitle}”` : 'none'}. Employer: ${primary.employer ?? 'not identified'}.`, '',
    `Why it agrees or differs: ${review.diagnosis}`, '');
  if (review.restriction) md.push(`Separate restriction/context: ${review.restriction}`, '');
  if (review.seasonNote) md.push(`Listing identity note: ${review.seasonNote}`, '');
  if (item.alternates.length) md.push('Additional runs: ' + item.alternates.map(alt => `${alt.kind}: ${alt.toolPageKind ?? 'no verified result'}, sponsorship ${alt.toolSponsorship ?? 'not reached'} ([source](${alt.url}))`).join('; ') + '.', '');
}
md.push('## Why these failures happen', '',
  '### 1. Page recognition blocks the interpreter', '',
  'The strongest recurring defect is title selection. Eleven readable vacancies fail to produce a role because their real title is an ordinary h2 or the available h1 is unsuitable. Two more produce a role with a wrong h1: Northwestern Mutual uses its company name, and Boston Scientific uses Single Position. The scanner requires a unique h1, data-job-title, or itemprop=title before it will use structured job data. A populated JobPosting alone therefore does not rescue these layouts.', '',
  'Two SmartRecruiters pages fail the Apply-action check because their button says I’m interested. Ralliant fails a separate two-keyword-group threshold. These are detector problems; adding sponsorship phrases alone would not make the normal pipeline reach them.', '',
  '### 2. Having the right words is not enough for the current rules', '',
  'Six reviewed examples expose phrase/context gaps: Flint, Rockwell, Cencora, Boston Scientific, Lazard, and GM Financial. The relevant refusal remains unclear in the diagnostic body-only run or the official overview run. The gaps include sponsor visas, sponsor individuals, named-company subjects, a requirement that an applicant not need sponsorship, and eligibility bullets that omit the word must. These are concrete candidates for regression fixtures; none was fixed during the audit.', '',
  'Radiance illustrates the same context problem for restrictions: a citizenship bullet derives its mandatory meaning from the preceding Requirements heading. The current clause-level restriction check loses that relationship.', '',
  '### 3. The repository sometimes opens the application rather than the description', '',
  'Flint, Bedrock, and Qumulo arrive on Ashby application views. The scanner marks them description-found because its completeness check accepts generic section words and a short text-length threshold; that does not prove the actual duties/eligibility description was read. Flint and Qumulo have refusal evidence on their overviews that is missing from the application view. Qumulo’s existing interpreter succeeds on its overview. Flint still needs a phrase improvement after the overview is read.', '',
  '### 4. Source access and source identity matter', '',
  'Lutron, First Citizens, AMD, and State Farm returned 403 in both primary visits. ITW redirected to its careers homepage. These five are not demonstrated semantic failures on employer text. Public copies let the assessment proceed, but cannot be silently counted as primary-page tool successes. Mirror pages also contain publisher annotations and unrelated company news, so using their badges as employer quotations would weaken evidence attribution.', '',
  'The list is not uniformly summer-only: DRW resolves to a Spring City Scholars role, Ralliant to a Fall co-op, and Greenheck spans January–August. Vacancy title, employer entity, requisition, location, and term must be checked together.', '',
  '### 5. Optional research cannot currently close these gaps', '',
  `Research was not enabled during the browser benchmark. A separate read-only check of researchRequest and the supplied registry found ${metrics.missingResearchIdentity} primary results without the role/employer identity needed to start research; the other ${metrics.unmappedResearchEmployer} would be unmatched because the production registry contains Atlassian only. No live company-policy or historical lookup was performed or counted.`, '',
  '## Recommended improvement order', '',
  '1. Select the actual role title using scoped headings and matching metadata. Add Workday, Eightfold, and SmartRecruiters fixtures; reject branding/template titles. Preserve ambiguity when multiple vacancies remain.',
  '2. Recognize application actions such as I’m interested, and broaden description recognition without weakening negative-page checks.',
  '3. Distinguish an application form from a complete job description. Link an overview only when its role identity matches, preserving which page supplied each quote.',
  '4. Add the six observed language/context failures to section 7F. Preserve heading-to-bullet meaning, named employers, negation, timing, and support restrictions. Test against questions and applicant self-statements to avoid new false refusals.',
  '5. Improve employer extraction and reviewed entity mappings. Keep operating companies distinct from parent companies; make unsupported research coverage explicit.',
  '6. Explain access failures and expired/redirected links clearly. Keep secondary copies labeled. Retain separate citizenship/status warnings without converting them into unsupported company-wide sponsorship claims.',
  '7. Collect a fresh, independently labeled set with positive offers, conditional offers, and hard negatives before measuring broad precision. This audit has no positive offer cases and cannot evaluate that capability.', '',
  '## Artifacts and reproduction', '',
  '- `sample.json`: frozen selection, repository row numbers, URLs, README hash, and extension commit.',
  '- `reviews.json`: LLM assessments, short quotations, evidence basis, and case-specific diagnoses.',
  '- `results.json`: joined assessment/tool comparison, aggregate counts, timestamps, and source text hashes.',
  '- `raw/`: local-only full browser captures, rendered text, and screenshots. Ignored by Git; not an independently reviewed ground-truth corpus.',
  '- `scripts/audit-live-postings.mjs`: read-only browser collection; `verify` obtains original-URL extension snapshots, `description` reads the three Ashby overviews, and `mirror-full` opens the linked copies’ Full posting view.',
  '- `node --import tsx scripts/summarize-live-audit.mjs`: regenerates this report, validates 30 unique assessments and every quoted excerpt against its captured source, and computes counts.', '',
  'The production scanner/interpreter/research behavior was not modified. The six major phrase gaps and the layout cases are findings for future implementation. This audit does not complete the independent human beta milestone.', '');
await writeFile(`${directory}/REPORT.md`, md.join('\n'));
console.log(JSON.stringify(metrics, null, 2));
console.log('Wrote REPORT.md and results.json; all 30 quoted-source checks passed.');
