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

export function badgePosition(width: number, height: number, viewport: { width: number; height: number }): { left: number; top: number } | null {
  const margin = 16;
  if (viewport.width < width + margin * 2 || viewport.height < height + margin * 2) return null;
  return { left: viewport.width - width - margin, top: viewport.height - height - margin };
}
