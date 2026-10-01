import { interpretJob } from './interpreter';
import { hash, scanPage } from './scanner';
import type { DescriptionCoverage, ScanResult } from './types';

const identity = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const MAX_HTML = 1_000_000;

async function readBoundedHtml(response: Response): Promise<string | null> {
  if (!response.body) {
    const html = await response.text();
    return html.length <= MAX_HTML ? html : null;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let html = '';
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_HTML) { await reader.cancel(); return null; }
      html += decoder.decode(chunk.value, { stream: true });
    }
    return html + decoder.decode();
  } finally { reader.releaseLock(); }
}

export function overviewCandidate(result: ScanResult): URL | null {
  if (result.kind !== 'job-application' || !result.role || result.role.completeness !== 'incomplete') return null;
  const page = new URL(result.url);
  if (page.protocol !== 'https:') return null;
  if (page.hostname === 'jobs.ashbyhq.com') {
    const match = /^\/([^/]+)\/([a-z0-9-]{8,})\/application\/?$/i.exec(page.pathname);
    if (!match || (result.role.identifier && identity(result.role.identifier) !== identity(match[2]!))) return null;
    return new URL(`https://jobs.ashbyhq.com/${encodeURIComponent(match[1]!)}/${match[2]}`);
  }
  if (page.hostname === 'jobs.lever.co') {
    const match = /^\/([a-z0-9-]+)\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/apply\/?$/i.exec(page.pathname);
    if (!match || (result.role.identifier && identity(result.role.identifier) !== identity(match[2]!))) return null;
    return new URL(`https://jobs.lever.co/${encodeURIComponent(match[1]!)}/${match[2]}`);
  }
  return null;
}

export type OverviewOutcome = { kind: 'recovered' | 'unavailable' | 'mismatch'; result: ScanResult } | { kind: 'not-applicable' };

function failure(result: ScanResult, gap: DescriptionCoverage['gaps'][number], message: string): OverviewOutcome {
  const role = result.role!;
  return { kind: gap === 'overview-identity-mismatch' ? 'mismatch' : 'unavailable', result: {
    ...result, warnings: [...result.warnings, message], role: { ...role, coverage: role.coverage && {
      ...role.coverage, gaps: [...new Set([...role.coverage.gaps, gap])],
    } },
  } };
}

/** Reads only the public overview paired with a supported ATS application URL. */
export async function recoverOverview(
  result: ScanResult, signal: AbortSignal, fetchPage: typeof fetch = fetch,
  parseHtml: (html: string) => Document = html => new DOMParser().parseFromString(html, 'text/html'),
): Promise<OverviewOutcome> {
  const candidate = overviewCandidate(result);
  if (!candidate) return { kind: 'not-applicable' };
  try {
    const timedSignal = AbortSignal.any([signal, AbortSignal.timeout(12_000)]);
    const response = await fetchPage(candidate.href, { credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: timedSignal });
    if (signal.aborted) return { kind: 'not-applicable' };
    if (!response.ok || response.url !== candidate.href || !/\btext\/html\b/i.test(response.headers.get('content-type') ?? '')) {
      return failure(result, 'overview-unavailable', 'The official job overview could not be read; this description remains incomplete.');
    }
    const length = Number(response.headers.get('content-length'));
    if (length > MAX_HTML) return failure(result, 'overview-unavailable', 'The official job overview is too large to read safely.');
    const html = await readBoundedHtml(response);
    if (signal.aborted) return { kind: 'not-applicable' };
    if (html === null) return failure(result, 'overview-unavailable', 'The official job overview is too large to read safely.');
    const overview = scanPage(parseHtml(html), candidate.href);
    const current = result.role!;
    const matched = (overview.kind === 'job-posting' || overview.kind === 'job-application') && overview.role?.completeness === 'description-found'
      && identity(overview.role.title) === identity(current.title)
      && (!current.employer || !overview.role.employer || identity(current.employer) === identity(overview.role.employer))
      && (!overview.role.identifier || identity(overview.role.identifier) === identity(candidate.pathname.split('/')[2]!));
    if (!matched) return failure(result, 'overview-identity-mismatch', 'The official overview could not be confirmed as this exact role; its text was excluded.');
    const existing = new Set(current.evidence.map(block => identity(block.text)));
    const added = overview.role!.evidence.filter(block => block.kind === 'text' && block.text.length > 20 && !existing.has(identity(block.text)))
      .map((block, index) => ({ ...block, id: `overview-${index}-${hash(block.text)}`, source: 'official-overview' as const,
        sourceUrl: candidate.href, locator: `overview:${block.locator}` }));
    const coverage: DescriptionCoverage = { status: 'description-found',
      sources: [...(current.coverage?.sources ?? []), { kind: 'official-overview', url: candidate.href, passages: added.length, descriptionFound: true }],
      gaps: (current.coverage?.gaps ?? []).filter(gap => gap !== 'description-not-found' && gap !== 'overview-unavailable'),
    };
    const role = { ...current, evidence: [...current.evidence, ...added], completeness: 'description-found' as const, coverage };
    return { kind: 'recovered', result: { ...result, role, interpretation: interpretJob(role),
      warnings: [...result.warnings.filter(warning => !warning.startsWith('The job description is incomplete.')),
        'Description read from the matching official job overview. The application page itself has no displayed overview.'] } };
  } catch {
    if (signal.aborted) return { kind: 'not-applicable' };
    return failure(result, 'overview-unavailable', 'The official job overview could not be read; this description remains incomplete.');
  }
}
