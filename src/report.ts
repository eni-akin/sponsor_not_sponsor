import { mainDecision } from './main-decision';
import { MAX_REPORT_BYTES, validateReportFindings } from '../shared/report-schema';
import type { Citation, Finding, Interpretation, ScanResult } from './types';

export const reportReasons = ['Sponsorship finding looks wrong', 'CPT or OPT finding looks wrong', 'Wrong role or employer', 'Missing or incorrect evidence', 'Other problem'] as const;

function sanitizedUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Report URLs must use HTTP or HTTPS.');
  url.search = ''; url.hash = ''; url.username = ''; url.password = '';
  return url.toString();
}

const citation = ({ evidenceId, quote, source, sourceUrl, timing }: Citation): Citation => ({
  evidenceId, quote, source, ...(sourceUrl ? { sourceUrl: sanitizedUrl(sourceUrl) } : {}), timing,
});

const finding = <T>({ status, evidenceIds, explanation, requiresReview, citations }: Finding<T>): Finding<T> => ({
  status, evidenceIds: [...evidenceIds], explanation, requiresReview, citations: citations.map(citation),
});

function findings(value: Interpretation): Interpretation {
  return {
    sponsorship: finding(value.sponsorship), cpt: finding(value.cpt), opt: finding(value.opt),
    sponsorshipByTiming: { now: finding(value.sponsorshipByTiming.now), future: finding(value.sponsorshipByTiming.future) },
    restrictions: value.restrictions.map(({ kind, text, evidenceIds, citations }) =>
      ({ kind, text, evidenceIds: [...evidenceIds], citations: citations.map(citation) })),
    context: value.context.map(({ kind, citation: value }) => ({ kind, citation: citation(value) })),
  };
}

export function reportData(result: ScanResult, version: string, reason: string) {
  const interpretation = result.interpretation ? validateReportFindings(findings(result.interpretation)) as Interpretation : null;
  const report = {
    formatVersion: 2, extensionVersion: version, createdAt: new Date().toISOString(),
    reason: reportReasons.find(value => value === reason) ?? reportReasons[0],
    sourceUrl: sanitizedUrl(result.url), scannedAt: result.scannedAt, pageKind: result.kind,
    role: result.role ? { title: result.role.title, employer: result.role.employer, location: result.role.location,
      identifier: result.role.identifier, completeness: result.role.completeness,
      descriptionSources: result.role.coverage?.sources.map(item => ({ kind: item.kind, descriptionFound: item.descriptionFound })) ?? [],
      descriptionGaps: result.role.coverage?.gaps ?? [] } : null,
    displayedDecision: result.role && interpretation ? mainDecision(result.role, interpretation) : null,
    findings: interpretation, warnings: [...result.warnings],
    // Deliberately omit the full extraction, role key, URL query/hash, settings, and form values.
  };
  if (new TextEncoder().encode(JSON.stringify(report)).byteLength > MAX_REPORT_BYTES) throw new Error('The diagnostic exceeds 256 KiB. Please use a manual report.');
  return report;
}

export function downloadReport(result: ScanResult, reason: string): void {
  const data = reportData(result, chrome.runtime.getManifest().version, reason);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'sponsor-not-sponsor-report.json';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
