import type { EvidenceBlock, JobRecord } from './types';

export function coverageLabel(role: JobRecord): string {
  if (role.completeness === 'incomplete') return 'Description incomplete';
  const sources = role.coverage?.sources ?? [];
  if (sources.some(source => source.kind === 'official-overview' && source.descriptionFound)) return 'Description: official job overview';
  if (sources.some(source => source.kind === 'structured-data' && source.descriptionFound)) return 'Description: matching job data';
  if (sources.some(source => source.kind === 'embedded-frame' && source.descriptionFound)) return 'Description: embedded job frame';
  return 'Description: displayed page';
}

export function evidenceSourceLabel(source: EvidenceBlock['source']): string {
  return { 'visible-page': 'Visible page', 'structured-data': 'Structured page data',
    'embedded-frame': 'Embedded job frame', 'official-overview': 'Official job overview' }[source];
}
