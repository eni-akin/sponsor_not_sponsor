import type { ScannerSnapshot } from './types';

export function badgeState(snapshot: ScannerSnapshot): { label: string; tone: string } | null {
  const result = snapshot.result;
  if (snapshot.state === 'paused' || snapshot.state === 'disabled') return null;
  if (snapshot.state === 'scanning') return { label: 'Scanning job…', tone: 'neutral' };
  if (snapshot.state === 'error') return { label: 'Unable to read job', tone: 'neutral' };
  if (result?.kind === 'unreadable') return { label: 'Unable to identify job', tone: 'neutral' };
  if (!result?.role || !result.interpretation) return null;
  const finding = result.interpretation.sponsorship;
  const time = finding.citations.length && finding.citations.every(citation => citation.timing === 'future') ? 'Future sponsorship'
    : finding.citations.length && finding.citations.every(citation => citation.timing === 'now') ? 'Current sponsorship' : 'Sponsorship';
  const label = `${time} ${finding.status}`;
  const citizenship = result.interpretation.restrictions.some(restriction => restriction.kind === 'citizenship');
  if (result.role.completeness === 'incomplete') return { label: `${citizenship ? 'Citizenship condition · ' : ''}Incomplete scan · ${label.toLowerCase()}`, tone: 'neutral' };
  if (citizenship) return { label: `Citizenship condition · ${label.toLowerCase()}`, tone: 'conditional' };
  if (finding.requiresReview) return { label: 'Sponsorship needs review', tone: 'conditional' };
  return { label, tone: finding.status === 'unclear' ? 'conditional' : finding.status };
}

export interface Rectangle { left: number; top: number; width: number; height: number }
export function badgePosition(width: number, height: number, viewport: { width: number; height: number }, obstacles: Rectangle[]): Rectangle | null {
  const margin = 16;
  if (viewport.width < width + margin * 2 || viewport.height < height + margin * 2) return null;
  const positions = [
    { left: viewport.width - width - margin, top: viewport.height - height - margin, width, height },
    { left: margin, top: viewport.height - height - margin, width, height },
    { left: viewport.width - width - margin, top: margin, width, height },
    { left: margin, top: margin, width, height },
  ];
  return positions.find(position => !obstacles.some(obstacle => obstacle.width > 0 && obstacle.height > 0
    && position.left < obstacle.left + obstacle.width + 6 && position.left + width + 6 > obstacle.left
    && position.top < obstacle.top + obstacle.height + 6 && position.top + height + 6 > obstacle.top)) ?? null;
}
