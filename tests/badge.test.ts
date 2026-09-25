import { test } from 'node:test';
import assert from 'node:assert/strict';
import { badgePosition, badgeState } from '../src/badge-state';
import { interpretJob } from '../src/interpreter';
import { reportData } from '../src/report';
import type { JobRecord, ScannerSnapshot } from '../src/types';

function snapshot(text: string): ScannerSnapshot {
  const role: JobRecord = { key: 'a', title: 'Engineer', employer: 'Example', location: 'US', identifier: null, employmentTypes: [], completeness: 'description-found', evidence: [{ id: 'e1', source: 'visible-page', kind: 'text', text, locator: 'main > p' }] };
  return { state: 'ready', hostname: 'example.com', result: { version: 1, url: 'https://example.com/jobs/1?token=PRIVATE#PRIVATE', scannedAt: '2026-09-24T12:00:00Z', kind: 'job-posting', role, signals: [], warnings: [], interpretation: interpretJob(role) } };
}

test('badge shows words as well as colors for explicit and unclear policies', () => {
  assert.deepEqual(badgeState(snapshot('Visa sponsorship is available.')), { label: 'Sponsorship available', tone: 'available' });
  assert.deepEqual(badgeState(snapshot('Visa sponsorship is not available.')), { label: 'Sponsorship unavailable', tone: 'unavailable' });
  assert.deepEqual(badgeState(snapshot('Welcome to the team.')), { label: 'Sponsorship unclear', tone: 'conditional' });
});
test('future-only sponsorship label preserves its timing', () => assert.equal(badgeState(snapshot('Visa sponsorship is not available in the future.'))?.label, 'Future sponsorship unavailable'));
test('current-only sponsorship label preserves its timing', () => assert.equal(badgeState(snapshot('Visa sponsorship is not available now.'))?.label, 'Current sponsorship unavailable'));
test('citizenship condition is prominent on the badge', () => assert.match(badgeState(snapshot('U.S. citizenship is required.'))!.label, /^Citizenship condition/));
test('incomplete scans have a neutral label even when metadata offers sponsorship', () => {
  const value = snapshot('Visa sponsorship is available.');
  value.result!.role!.completeness = 'incomplete';
  assert.equal(badgeState(value)?.tone, 'neutral');
  assert.match(badgeState(value)!.label, /Incomplete/);
});
test('ordinary pages and disabled scans have no badge', () => {
  const value = snapshot('Visa sponsorship is available.');
  value.state = 'paused'; assert.equal(badgeState(value), null);
  value.state = 'disabled'; assert.equal(badgeState(value), null);
  value.state = 'ready'; value.result!.role = null; value.result!.kind = 'non-job'; assert.equal(badgeState(value), null);
});
test('badge moves away from a bottom-right application control', () => {
  const result = badgePosition(300, 44, { width: 1000, height: 800 }, [{ left: 650, top: 720, width: 350, height: 80 }]);
  assert.equal(result?.left, 16); assert.equal(result?.top, 740);
});
test('badge yields when no corner is clear or the viewport is too small', () => {
  assert.equal(badgePosition(300, 44, { width: 1000, height: 800 }, [{ left: 0, top: 0, width: 1000, height: 800 }]), null);
  assert.equal(badgePosition(300, 44, { width: 310, height: 800 }, []), null);
});
test('report includes cited findings but excludes URL secrets and unreferenced extraction', () => {
  const value = snapshot('Visa sponsorship is available.');
  value.result!.role!.evidence.push({ id: 'e2', source: 'visible-page', kind: 'text', text: 'UNRELATED PRIVATE CONTENT', locator: 'p' });
  const result = reportData(value.result!, '0.3.0', 'Sponsorship finding looks wrong');
  assert.equal(result.sourceUrl, 'https://example.com/jobs/1');
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
  assert.ok(!('evidence' in result.role!));
  assert.match(JSON.stringify(result.findings), /Visa sponsorship is available/);
});
