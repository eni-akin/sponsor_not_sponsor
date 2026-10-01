import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDecision, decisionRequest, parseDecisionRequest, parseDecisionResult, DECISION_VERSION, type BlockDecision, type DecisionResult } from '../src/decision';
import { DecisionClient } from '../src/decision-client';
import { interpretJob } from '../src/interpreter';
import { DecisionService } from '../server/decision-service';
import { badgeState } from '../src/badge-state';
import type { JobRecord, ScannerSnapshot } from '../src/types';

const role = (texts = ["We don't sponsor visas for internships"]): JobRecord => ({ key: 'job-1', title: 'Engineering Intern', employer: 'Example',
  location: null, identifier: '1', employmentTypes: [], completeness: 'description-found',
  evidence: texts.map((text, i) => ({ id: `b${i}`, text, kind: 'text', source: 'visible-page', locator: `p${i}` })) });
const answers = (patch: Partial<BlockDecision['answers']> = {}): BlockDecision['answers'] => ({ scope: { choice: 'role', probability: 0.99 },
  sponsorship: { choice: 'unavailable', probability: 0.99 }, timing: { choice: 'unspecified', probability: 0.99 },
  cpt: { choice: 'unclear', probability: 0.99 }, opt: { choice: 'unclear', probability: 0.99 }, ...patch });
const output = (r = role(), a = answers()): DecisionResult => ({ version: DECISION_VERSION, engine: 'laya', model: 'test-model', blocks: r.evidence.map(b => ({ id: b.id, answers: structuredClone(a) })) });
const snapshot = (r = role()): ScannerSnapshot => ({ state: 'ready', hostname: 'example.test', result: { version: 1, kind: 'job-posting', url: 'https://example.test/job/1',
  scannedAt: new Date().toISOString(), role: r, interpretation: interpretJob(r), signals: [], warnings: [] } });
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

test('decision request allows only public extracted text and strips extraneous fields', () => {
  const r = decisionRequest(role());
  assert.deepEqual(parseDecisionRequest({ ...r, url: 'https://example.test?private', apiKey: 'secret', answers: 'private' }), r);
  assert.equal(parseDecisionRequest({ ...r, blocks: [r.blocks[0], r.blocks[0]] }), null);
  assert.equal(parseDecisionRequest({ ...r, blocks: [{ ...r.blocks[0], text: 'x'.repeat(30_001) }] }), null);
});
test('model response must include every input block exactly once and valid typed probabilities', () => {
  const request = decisionRequest(role());
  assert.ok(parseDecisionResult(output(), request));
  for (const value of [{ ...output(), blocks: [] }, { ...output(), engine: 'other' }, output(role(['a', 'b']))]) assert.equal(parseDecisionResult(value, request), null);
  for (const probability of [NaN, -1, 1.1, undefined]) {
    const value = output(); value.blocks[0]!.answers.scope.probability = probability as number;
    assert.equal(parseDecisionResult(value, request), null);
  }
  const value = output(); value.blocks[0]!.answers.sponsorship.choice = 'definitely-yes';
  assert.equal(parseDecisionResult(value, request), null);
});
test('model replaces a missed rule finding, with exact extracted evidence and independent CPT/OPT', () => {
  const r = role(); assert.equal(interpretJob(r).sponsorship.status, 'unclear');
  const result = applyDecision(r, interpretJob(r), output(r));
  assert.equal(result.sponsorship.status, 'unavailable');
  assert.equal(result.sponsorship.citations[0]!.quote, r.evidence[0]!.text);
  assert.equal(result.cpt.status, 'unclear'); assert.equal(result.opt.status, 'unclear');
  assert.equal(result.decision?.engine, 'laya');
});
test('questions, historical evidence and other-role policies cannot determine this role', () => {
  for (const scope of ['question', 'historical', 'company', 'other-role', 'none']) {
    const r = role(); const result = applyDecision(r, interpretJob(r), output(r, answers({ scope: { choice: scope, probability: 0.99 } })));
    assert.equal(result.sponsorship.status, 'unclear');
  }
  const r = role(); r.evidence[0]!.kind = 'application-question';
  assert.equal(applyDecision(r, interpretJob(r), output(r)).sponsorship.status, 'unclear');
});
test('uncertain or contradictory model evidence stays unclear', () => {
  const r = role(['Sponsorship available.', 'Sponsorship unavailable.']);
  const result = output(r); result.blocks[0]!.answers.sponsorship.choice = 'available';
  assert.equal(applyDecision(r, interpretJob(r), result).sponsorship.status, 'unclear');
  const uncertain = output(r, answers({ sponsorship: { choice: 'unavailable', probability: 0.79 } }));
  assert.equal(applyDecision(r, interpretJob(r), uncertain).sponsorship.requiresReview, true);
  assert.equal(applyDecision(r, interpretJob(r), uncertain).sponsorship.citations[0]!.quote, r.evidence[0]!.text);
});
test('different current and future policies retain timing instead of becoming a blanket refusal', () => {
  const r = role(['We sponsor currently.', 'We cannot sponsor in the future.']); const result = output(r);
  result.blocks[0]!.answers.sponsorship.choice = 'available'; result.blocks[0]!.answers.timing.choice = 'now';
  result.blocks[1]!.answers.timing.choice = 'future';
  const interpreted = applyDecision(r, interpretJob(r), result);
  assert.equal(interpreted.sponsorship.status, 'conditional'); assert.equal(interpreted.sponsorshipByTiming.now.status, 'available');
  assert.equal(interpreted.sponsorshipByTiming.future.status, 'unavailable');
});
test('model-selected evidence preserves source URLs and adjacent conditions', () => {
  const r = role(['Visa sponsorship is available.', 'Only with manager approval.']);
  r.evidence[0]!.source = 'official-overview'; r.evidence[0]!.sourceUrl = 'https://example.test/overview';
  const result = output(r, answers({ sponsorship: { choice: 'conditional', probability: 0.99 } }));
  const interpreted = applyDecision(r, interpretJob(r), result);
  assert.equal(interpreted.sponsorship.status, 'conditional');
  assert.equal(interpreted.sponsorship.citations[0]!.sourceUrl, 'https://example.test/overview');
  assert.ok(interpreted.sponsorship.citations.some(c => c.quote === 'Only with manager approval.'));
});
test('decision client is opt-in, deduplicates updates and discards results after navigation or disable', async () => {
  const responses: ((value: any) => void)[] = []; let calls = 0;
  const client = new DecisionClient(() => { calls++; return new Promise(resolve => responses.push(resolve)); }, () => {});
  const original = snapshot(); assert.equal(client.update(original), original); assert.equal(calls, 0);
  client.setEnabled(true);
  const pending = client.update(original); client.update(original);
  assert.equal(calls, 1); assert.equal(pending.result?.interpretation?.decision?.state, 'pending');
  assert.equal(badgeState(pending)?.tone, 'neutral');
  const next = snapshot(role(['Sponsorship is offered.'])); client.update(next);
  responses[0]!({ state: 'ready', result: output() }); await tick();
  assert.equal(client.update(next).result?.interpretation?.decision?.state, 'pending');
  client.setEnabled(false); responses[1]!({ state: 'ready', result: output(next.result!.role!) }); await tick();
  assert.equal(client.update(next), next);
});
test('model failure never silently falls back to a definitive rule label', async () => {
  const r = role(['We do not sponsor applicants.']); assert.equal(interpretJob(r).sponsorship.status, 'unavailable');
  const client = new DecisionClient(async () => { throw new Error('offline'); }, () => {}); client.setEnabled(true);
  const s = snapshot(r); client.update(s); await tick(); const result = client.update(s);
  assert.equal(result.result?.interpretation?.sponsorship.status, 'unclear');
  assert.equal(result.result?.interpretation?.decision?.state, 'error');
  assert.equal(badgeState(result)!.label, 'Could not verify');
});
test('malformed transport replies become visible errors rather than an unhandled rejection', async () => {
  for (const raw of [null, {}, { state: 'unknown' }, { state: 'error', message: {} }, { state: 'ready', result: {} }]) {
    const client = new DecisionClient(async () => raw, () => {}); client.setEnabled(true);
    const s = snapshot(); client.update(s); await tick();
    assert.equal(client.update(s).result?.interpretation?.decision?.state, 'error');
  }
});
test('service deduplicates identical work and never stores invalid model responses as ready', async () => {
  let calls = 0;
  const service = new DecisionService(async r => { calls++; return output(role(r.blocks.map(b => b.text))); });
  const r = decisionRequest(role()); assert.equal(service.run(r).state, 'pending'); service.run(r); await tick();
  assert.equal(service.run(r).state, 'ready'); assert.equal(calls, 1);
  const broken = new DecisionService(async () => ({ ...output(), blocks: [] })); broken.run(r); await tick();
  assert.equal(broken.run(r).state, 'error');
});
