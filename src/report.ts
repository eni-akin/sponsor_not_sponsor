import type { ScanResult } from './types';

export const reportReasons = ['Sponsorship finding looks wrong', 'CPT or OPT finding looks wrong', 'Wrong role or employer', 'Missing or incorrect evidence', 'Other problem'] as const;

export function reportData(result: ScanResult, version: string, reason: string) {
  const source = new URL(result.url);
  source.search = ''; source.hash = ''; source.username = ''; source.password = '';
  return {
    formatVersion: 1, extensionVersion: version, createdAt: new Date().toISOString(),
    reason: reportReasons.find(value => value === reason) ?? reportReasons[0],
    sourceUrl: source.toString(), scannedAt: result.scannedAt, pageKind: result.kind,
    role: result.role ? { title: result.role.title, employer: result.role.employer, location: result.role.location, completeness: result.role.completeness } : null,
    findings: result.interpretation ?? null,
    warnings: result.warnings,
    // Deliberately omit the full extraction, role key, URL query/hash, settings, and form values.
  };
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
