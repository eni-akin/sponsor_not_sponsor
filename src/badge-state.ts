import type { ScannerSnapshot } from './types';
import { mainDecision } from './main-decision';

export function badgeState(snapshot: ScannerSnapshot): { label: string; tone: string } | null {
  const result = snapshot.result;
  if (snapshot.state === 'paused' || snapshot.state === 'disabled') return null;
  if (snapshot.state === 'scanning') return { label: 'Scanning job…', tone: 'neutral' };
  if (snapshot.state === 'error') return { label: 'Unable to read job', tone: 'neutral' };
  if (result?.kind === 'unreadable') return { label: 'Unable to identify job', tone: 'neutral' };
  if (!result?.role || !result.interpretation) return null;
  const decision = mainDecision(result.role, result.interpretation);
  const tone = { 'explicit-blocker': 'unavailable', 'sponsorship-stated': 'available', 'no-blocker': 'neutral', 'could-not-verify': 'neutral' }[decision.status];
  return { label: decision.label, tone };
}

export function badgePosition(width: number, height: number, viewport: { width: number; height: number }, obstruction: (position: { left: number; top: number }) => number = () => 0): { left: number; top: number } | null {
  const margin = 16;
  if (viewport.width < width + margin * 2 || viewport.height < height + margin * 2) return null;
  const right = viewport.width - width - margin, bottom = viewport.height - height - margin;
  const corners = [{ left: right, top: bottom }, { left: margin, top: bottom }, { left: right, top: margin }, { left: margin, top: margin }];
  let best = corners[0]!, least = Infinity;
  for (const corner of corners) {
    const score = obstruction(corner);
    if (score < least) { best = corner; least = score; }
    if (score === 0) break;
  }
  return best;
}
