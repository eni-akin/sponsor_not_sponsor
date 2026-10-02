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

test('badge shows the four blocker-first results in words as well as colors', () => {
  assert.deepEqual(badgeState(snapshot('Visa sponsorship is available.')), { label: 'Sponsorship stated', tone: 'available' });
  assert.deepEqual(badgeState(snapshot('Visa sponsorship is not available.')), { label: 'Explicit blocker found', tone: 'unavailable' });
  assert.deepEqual(badgeState(snapshot('Welcome to the team.')), { label: 'No blocker found', tone: 'neutral' });
  const incomplete = snapshot('Welcome to the team.'); incomplete.result!.role!.completeness = 'incomplete';
  assert.deepEqual(badgeState(incomplete), { label: 'Could not verify', tone: 'neutral' });
});
test('citizenship, permanent residency, and explicit student-status exclusions are blockers', () => {
  for (const text of ['U.S. citizenship is required.', 'Eligibility requirements include U.S. citizenship.', 'Applicants must be permanent residents.', 'All applicants must be U.S. persons within the meaning of ITAR.', 'F-1 students are not eligible.', 'This position is not eligible for F-1 students.'])
    assert.equal(badgeState(snapshot(text))?.label, 'Explicit blocker found');
});
test('reviewed work-without-sponsorship phrases are blockers', () => {
  for (const text of ['Ability to work in the United States for an indefinite period without sponsorship.', 'Authorization to work in the United States without visa sponsorship.'])
    assert.equal(badgeState(snapshot(text))?.label, 'Explicit blocker found');
});
test('Thrivent structured graduation date does not turn a refusal into a conditional offer', () => {
  const value = snapshot('Expected graduation date between December 2027 and May 2028 Proven history of strong academic performance (GPA 3.0+ preferred) Ability to work in the United States for an indefinite period without sponsorship Additional Program Information Competitive compensation: $27.00 - $30.00 per hour');
  value.result!.role!.evidence[0]!.source = 'structured-data';
  value.result!.interpretation = interpretJob(value.result!.role!);
  assert.equal(value.result!.interpretation.sponsorship.status, 'unavailable');
  assert.equal(badgeState(value)?.label, 'Explicit blocker found');
});
test('generic work authorization wording alone is not treated as a blocker', () => {
  assert.equal(badgeState(snapshot('Applicants must already be authorized to work.'))?.label, 'No blocker found');
});
test('conditional offers and conditional refusals keep their practical direction', () => {
  assert.equal(badgeState(snapshot('Sponsorship may be considered.'))?.label, 'Sponsorship stated');
  assert.equal(badgeState(snapshot('Visa sponsorship is unavailable unless an exception is approved.'))?.label, 'Explicit blocker found');
});
test('incomplete scans cannot produce a definitive result', () => {
  const value = snapshot('Visa sponsorship is available.');
  value.result!.role!.completeness = 'incomplete';
  assert.deepEqual(badgeState(value), { label: 'Could not verify', tone: 'neutral' });
});
test('ordinary pages and disabled scans have no badge', () => {
  const value = snapshot('Visa sponsorship is available.');
  value.state = 'paused'; assert.equal(badgeState(value), null);
  value.state = 'disabled'; assert.equal(badgeState(value), null);
  value.state = 'ready'; value.result!.role = null; value.result!.kind = 'non-job'; assert.equal(badgeState(value), null);
});
test('badge stays in the bottom-right corner', () => {
  assert.deepEqual(badgePosition(300, 44, { width: 1000, height: 800 }), { left: 684, top: 740 });
  assert.equal(badgePosition(300, 44, { width: 310, height: 800 }), null);
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
