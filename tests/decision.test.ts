import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDecision,
  decisionRequest,
  parseDecisionRequest,
  parseDecisionResult,
  deriveCanonicalState,
  serializeCanonicalState,
  computeConfigurationDigests,
  DECISION_VERSION,
  type BlockResultV2,
  type DecisionRequestV2,
  type DecisionResultV2,
  type InterpretationAnswers,
  type Route,
} from '../src/decision';
import { decisionQuestions } from '../server/decision-questions';
import { DecisionClient } from '../src/decision-client';
import { interpretJob } from '../src/interpreter';
import { DecisionService } from '../server/decision-service';
import { badgeState } from '../src/badge-state';
import { mainDecision } from '../src/main-decision';
import type { JobRecord, ScannerSnapshot } from '../src/types';

const role = (texts = ['This role has a visa-support restriction.']): JobRecord => ({
  key: 'job-1',
  title: 'Engineering Intern',
  employer: 'Example',
  location: null,
  identifier: '1',
  employmentTypes: [],
  completeness: 'description-found',
  evidence: texts.map((text, i) => ({
    id: `b${i}`,
    text,
    kind: 'text',
    source: 'visible-page',
    locator: `p${i}`,
    contextGroup: 'visible-0',
    position: i,
  })),
});

const defaultAnswers = (patch: Partial<InterpretationAnswers> = {}): InterpretationAnswers => ({
  scope: { choice: 'role', probability: 0.99 },
  sponsorship: { choice: 'unavailable', probability: 0.99 },
  timing: { choice: 'unspecified', probability: 0.99 },
  cpt: { choice: 'unclear', probability: 0.99 },
  opt: { choice: 'unclear', probability: 0.99 },
  ...patch,
});

const output = (
  r = role(),
  a = defaultAnswers(),
  route: Route = 'relevant',
  screenChoice: 'relevant' | 'irrelevant' = 'relevant',
): DecisionResultV2 => {
  const req = decisionRequest(r);
  const digests = computeConfigurationDigests(decisionQuestions);
  const blocks: BlockResultV2[] = req.blocks.map(b => ({
    id: b.id,
    screening: { status: 'success', choice: screenChoice, probability: 0.99 },
    route,
    interpretation:
      route === 'skip'
        ? { status: 'skipped', reason: 'screened-irrelevant' }
        : { status: 'interpreted', answers: structuredClone(a) },
  }));
  return {
    version: DECISION_VERSION,
    engine: 'laya',
    model: 'test-model',
    configuration: digests,
    processing: {
      status: 'complete',
      inputCount: req.blocks.length,
      context: { complete: req.blocks.length, missing: 0 },
      screening: { success: req.blocks.length, failed: 0, unsupported: 0 },
      interpretation: {
        interpreted: route === 'skip' ? 0 : req.blocks.length,
        skipped: route === 'skip' ? req.blocks.length : 0,
        failed: 0,
        unsupported: 0,
      },
    },
    blocks,
  };
};

const snapshot = (r = role()): ScannerSnapshot => ({
  state: 'ready',
  hostname: 'example.test',
  result: {
    version: 1,
    kind: 'job-posting',
    url: 'https://example.test/job/1',
    scannedAt: new Date().toISOString(),
    role: r,
    interpretation: interpretJob(r),
    signals: [],
    warnings: [],
  },
});

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

test('decision request allows only public extracted text and strips extraneous fields', () => {
  const r = decisionRequest(role());
  assert.equal(r.version, 'laya-policy-v2');
  assert.deepEqual(
    parseDecisionRequest({ ...r, url: 'https://example.test?private', apiKey: 'secret', answers: 'private' }),
    r,
  );
  assert.equal(parseDecisionRequest({ ...r, blocks: [r.blocks[0], r.blocks[0]] }), null);
  assert.equal(parseDecisionRequest({ ...r, blocks: [{ ...r.blocks[0], text: 'x'.repeat(30_001) }] }), null);
  assert.equal(parseDecisionRequest({ ...r, title: '' }), null);
  assert.equal(parseDecisionRequest({ ...r, title: 'x'.repeat(501) }), null);
});

test('empty blocks produces valid empty complete request and result', () => {
  const emptyReq = decisionRequest(role([]));
  assert.equal(emptyReq.blocks.length, 0);
  assert.equal(emptyReq.contextGroups.length, 0);
  const parsedReq = parseDecisionRequest(emptyReq);
  assert.ok(parsedReq);
  assert.equal(parsedReq.blocks.length, 0);

  const digests = computeConfigurationDigests(decisionQuestions);
  const emptyRes: DecisionResultV2 = {
    version: DECISION_VERSION,
    engine: 'laya',
    model: 'test-model',
    configuration: digests,
    processing: {
      status: 'complete',
      inputCount: 0,
      context: { complete: 0, missing: 0 },
      screening: { success: 0, failed: 0, unsupported: 0 },
      interpretation: { interpreted: 0, skipped: 0, failed: 0, unsupported: 0 },
    },
    blocks: [],
  };
  assert.ok(parseDecisionResult(emptyRes, parsedReq));
});

test('canonical model state derivation and serialization match exact key order and parity', () => {
  const r = role(['First paragraph.', 'Target paragraph.', 'Third paragraph.']);
  const req = decisionRequest(r);
  const { state, contextComplete } = deriveCanonicalState(req, 1);
  assert.equal(contextComplete, true);
  assert.equal(state.job_title, 'Engineering Intern');
  assert.equal(state.previous_status, 'present');
  assert.equal(state.previous, 'First paragraph.');
  assert.equal(state.TARGET, 'Target paragraph.');
  assert.equal(state.next, 'Third paragraph.');
  assert.equal(state.next_status, 'present');

  const jsonStr = serializeCanonicalState(state);
  const expectedKeys = ['job_title', 'employer', 'country', 'previous_status', 'previous', 'TARGET', 'next', 'next_status'];
  assert.deepEqual(Object.keys(JSON.parse(jsonStr)), expectedKeys);
});

test('model response must include every input block exactly once and valid typed probabilities', () => {
  const request = decisionRequest(role());
  assert.ok(parseDecisionResult(output(), request));
  for (const value of [{ ...output(), blocks: [] }, { ...output(), engine: 'other' as const }, output(role(['a', 'b']))]) {
    assert.equal(parseDecisionResult(value, request), null);
  }
  for (const probability of [NaN, -1, 1.1, undefined]) {
    const value = output();
    (value.blocks[0]!.screening as any).probability = probability as number;
    assert.equal(parseDecisionResult(value, request), null);
  }
  const value = output();
  (value.blocks[0]!.screening as any).choice = 'definitely-yes';
  assert.equal(parseDecisionResult(value, request), null);
});

test('rejection of invalid transport mutations: out-of-order, bad digests, bad counts', () => {
  const r = role(['a', 'b']);
  const req = decisionRequest(r);
  const out = output(r);

  // Out of order IDs
  const outOfOrder = structuredClone(out);
  [outOfOrder.blocks[0], outOfOrder.blocks[1]] = [outOfOrder.blocks[1]!, outOfOrder.blocks[0]!];
  assert.equal(parseDecisionResult(outOfOrder, req), null);

  // Missing digest
  const missingDigest = structuredClone(out);
  delete (missingDigest.configuration as any).contextSha256;
  assert.equal(parseDecisionResult(missingDigest, req), null);

  // Bad digest format
  const badDigest = structuredClone(out);
  badDigest.configuration.parametersSha256 = 'Z'.repeat(64);
  assert.equal(parseDecisionResult(badDigest, req), null);

  // Bad counts
  const badCounts = structuredClone(out);
  badCounts.processing.interpretation.interpreted = 0;
  assert.equal(parseDecisionResult(badCounts, req), null);

  // Partial marked complete
  const partialComplete = structuredClone(out);
  partialComplete.blocks[0]!.screening = { status: 'failed', reason: 'inference-failed' };
  partialComplete.blocks[0]!.route = 'uncertain';
  partialComplete.blocks[0]!.interpretation = { status: 'failed', reason: 'screening-failed' };
  assert.equal(parseDecisionResult(partialComplete, req), null); // mismatched counts with complete status
});

test('model replaces a missed rule finding, with exact extracted evidence and independent CPT/OPT', () => {
  const r = role();
  assert.equal(interpretJob(r).sponsorship.status, 'unclear');
  const result = applyDecision(r, interpretJob(r), output(r));
  assert.equal(result.sponsorship.status, 'unavailable');
  assert.equal(result.sponsorship.citations[0]!.quote, r.evidence[0]!.text);
  assert.equal(result.sponsorship.citations[0]!.citationRole, 'target');
  assert.equal(result.cpt.status, 'unclear');
  assert.equal(result.opt.status, 'unclear');
  assert.equal(result.decision?.engine, 'laya');
});

test('model cannot reverse an explicit sponsorship blocker', () => {
  const r = role(['Ability to work in the United States for an indefinite period without sponsorship.']);
  const interpreted = applyDecision(
    r,
    interpretJob(r),
    output(r, defaultAnswers({ sponsorship: { choice: 'available', probability: 0.99 } })),
  );
  assert.equal(interpreted.sponsorship.status, 'unavailable');
  const value = snapshot(r);
  value.result!.interpretation = interpreted;
  assert.equal(badgeState(value)?.label, 'Explicit blocker found');
});

test('questions, historical evidence and other-role policies cannot determine this role', () => {
  for (const scope of ['question', 'historical', 'company', 'other-role', 'none'] as const) {
    const r = role();
    const result = applyDecision(r, interpretJob(r), output(r, defaultAnswers({ scope: { choice: scope, probability: 0.99 } })));
    assert.equal(result.sponsorship.status, 'unclear');
  }
  const r = role();
  r.evidence[0]!.kind = 'application-question';
  assert.equal(applyDecision(r, interpretJob(r), output(r)).sponsorship.status, 'unclear');
});

test('uncertain or contradictory model evidence stays unclear', () => {
  const r = role(['Sponsorship available.', 'Sponsorship unavailable.']);
  const result = output(r);
  result.blocks[0]!.interpretation = {
    status: 'interpreted',
    answers: defaultAnswers({ sponsorship: { choice: 'available', probability: 0.99 } }),
  };
  result.blocks[1]!.interpretation = {
    status: 'interpreted',
    answers: defaultAnswers({ sponsorship: { choice: 'unavailable', probability: 0.99 } }),
  };
  assert.equal(applyDecision(r, interpretJob(r), result).sponsorship.status, 'unclear');

  const uncertain = output(r, defaultAnswers({ sponsorship: { choice: 'unavailable', probability: 0.79 } }));
  assert.equal(applyDecision(r, interpretJob(r), uncertain).sponsorship.requiresReview, true);
  assert.equal(applyDecision(r, interpretJob(r), uncertain).sponsorship.citations[0]!.quote, r.evidence[0]!.text);
});

test('different current and future policies retain timing instead of becoming conditional', () => {
  const r = role(['We sponsor currently.', 'We cannot sponsor in the future.']);
  const req = decisionRequest(r);
  const digests = computeConfigurationDigests(decisionQuestions);
  const result: DecisionResultV2 = {
    version: DECISION_VERSION,
    engine: 'laya',
    model: 'test-model',
    configuration: digests,
    processing: {
      status: 'complete',
      inputCount: 2,
      context: { complete: 2, missing: 0 },
      screening: { success: 2, failed: 0, unsupported: 0 },
      interpretation: { interpreted: 2, skipped: 0, failed: 0, unsupported: 0 },
    },
    blocks: [
      {
        id: 'b0',
        screening: { status: 'success', choice: 'relevant', probability: 0.99 },
        route: 'relevant',
        interpretation: {
          status: 'interpreted',
          answers: defaultAnswers({
            sponsorship: { choice: 'available', probability: 0.99 },
            timing: { choice: 'now', probability: 0.99 },
          }),
        },
      },
      {
        id: 'b1',
        screening: { status: 'success', choice: 'relevant', probability: 0.99 },
        route: 'relevant',
        interpretation: {
          status: 'interpreted',
          answers: defaultAnswers({
            sponsorship: { choice: 'unavailable', probability: 0.99 },
            timing: { choice: 'future', probability: 0.99 },
          }),
        },
      },
    ],
  };

  const interpreted = applyDecision(r, interpretJob(r), result, false);
  // Rule 3: overall becomes unavailable due to future refusal, while preserving both timed facts!
  assert.equal(interpreted.sponsorship.status, 'unavailable');
  assert.equal(interpreted.sponsorshipByTiming.now.status, 'available');
  assert.equal(interpreted.sponsorshipByTiming.future.status, 'unavailable');

  const dec = mainDecision(r, interpreted);
  assert.equal(dec.status, 'explicit-blocker');
});

test('mixed timing current available and future conditional becomes conditional', () => {
  const r = role(['Current sponsorship is available.', 'Future sponsorship may be considered for high performers.']);
  const digests = computeConfigurationDigests(decisionQuestions);
  const result: DecisionResultV2 = {
    version: DECISION_VERSION,
    engine: 'laya',
    model: 'test-model',
    configuration: digests,
    processing: {
      status: 'complete',
      inputCount: 2,
      context: { complete: 2, missing: 0 },
      screening: { success: 2, failed: 0, unsupported: 0 },
      interpretation: { interpreted: 2, skipped: 0, failed: 0, unsupported: 0 },
    },
    blocks: [
      {
        id: 'b0',
        screening: { status: 'success', choice: 'relevant', probability: 0.99 },
        route: 'relevant',
        interpretation: {
          status: 'interpreted',
          answers: defaultAnswers({
            sponsorship: { choice: 'available', probability: 0.99 },
            timing: { choice: 'now', probability: 0.99 },
          }),
        },
      },
      {
        id: 'b1',
        screening: { status: 'success', choice: 'relevant', probability: 0.99 },
        route: 'relevant',
        interpretation: {
          status: 'interpreted',
          answers: defaultAnswers({
            sponsorship: { choice: 'conditional', probability: 0.99 },
            timing: { choice: 'future', probability: 0.99 },
          }),
        },
      },
    ],
  };

  const interpreted = applyDecision(r, interpretJob(r), result, false);
  assert.equal(interpreted.sponsorship.status, 'conditional');
  assert.equal(interpreted.sponsorshipByTiming.now.status, 'available');
  assert.equal(interpreted.sponsorshipByTiming.future.status, 'conditional');
  const dec = mainDecision(r, interpreted);
  assert.equal(dec.status, 'sponsorship-stated');
});

test('genuine conditional provision with exception stays conditional', () => {
  const r = role(['We do not sponsor, except where immigration counsel approves an exception.']);
  const interpreted = applyDecision(
    r,
    interpretJob(r),
    output(r, defaultAnswers({ sponsorship: { choice: 'conditional', probability: 0.99 } })),
    false,
  );
  assert.equal(interpreted.sponsorship.status, 'conditional');
  assert.equal(mainDecision(r, interpreted).status, 'sponsorship-stated');
});

test('unresolved CPT or OPT prevents No blocker found', () => {
  const r = role(['Ordinary job description.']);
  const digests = computeConfigurationDigests(decisionQuestions);
  // Screen was relevant, but CPT probability is below threshold (abstention)
  const result: DecisionResultV2 = {
    version: DECISION_VERSION,
    engine: 'laya',
    model: 'test-model',
    configuration: digests,
    processing: {
      status: 'complete',
      inputCount: 1,
      context: { complete: 1, missing: 0 },
      screening: { success: 1, failed: 0, unsupported: 0 },
      interpretation: { interpreted: 1, skipped: 0, failed: 0, unsupported: 0 },
    },
    blocks: [
      {
        id: 'b0',
        screening: { status: 'success', choice: 'relevant', probability: 0.99 },
        route: 'relevant',
        interpretation: {
          status: 'interpreted',
          answers: defaultAnswers({
            sponsorship: { choice: 'unclear', probability: 0.99 },
            cpt: { choice: 'explicitly-accepted', probability: 0.6 }, // below MIN_DECISION_PROBABILITY
          }),
        },
      },
    ],
  };

  const interpreted = applyDecision(r, interpretJob(r), result, false);
  assert.equal(interpreted.cpt.requiresReview, true);
  const dec = mainDecision(r, interpreted);
  assert.equal(dec.status, 'could-not-verify');
});

test('definitive OPT exclusion beats sponsorship ambiguity', () => {
  const r = role(['Ambiguous sponsorship language.', 'We do not accept OPT applicants.']);
  const digests = computeConfigurationDigests(decisionQuestions);
  const result: DecisionResultV2 = {
    version: DECISION_VERSION,
    engine: 'laya',
    model: 'test-model',
    configuration: digests,
    processing: {
      status: 'complete',
      inputCount: 2,
      context: { complete: 2, missing: 0 },
      screening: { success: 2, failed: 0, unsupported: 0 },
      interpretation: { interpreted: 2, skipped: 0, failed: 0, unsupported: 0 },
    },
    blocks: [
      {
        id: 'b0',
        screening: { status: 'success', choice: 'relevant', probability: 0.99 },
        route: 'relevant',
        interpretation: {
          status: 'interpreted',
          answers: defaultAnswers({
            sponsorship: { choice: 'available', probability: 0.6 }, // uncertain
          }),
        },
      },
      {
        id: 'b1',
        screening: { status: 'success', choice: 'relevant', probability: 0.99 },
        route: 'relevant',
        interpretation: {
          status: 'interpreted',
          answers: defaultAnswers({
            sponsorship: { choice: 'unclear', probability: 0.99 },
            opt: { choice: 'explicitly-excluded', probability: 0.99 },
          }),
        },
      },
    ],
  };

  const interpreted = applyDecision(r, interpretJob(r), result, false);
  assert.equal(interpreted.sponsorship.requiresReview, true);
  assert.equal(interpreted.opt.status, 'explicitly-excluded');
  // Precedence 2 wins over Precedence 3!
  const dec = mainDecision(r, interpreted);
  assert.equal(dec.status, 'explicit-blocker');
});

test('complete no-policy posting yields No blocker found', () => {
  const r = role(['We offer health insurance.', 'Collaborate with friendly colleagues.']);
  const digests = computeConfigurationDigests(decisionQuestions);
  // All blocks screened irrelevant and skipped
  const result: DecisionResultV2 = {
    version: DECISION_VERSION,
    engine: 'laya',
    model: 'test-model',
    configuration: digests,
    processing: {
      status: 'complete',
      inputCount: 2,
      context: { complete: 2, missing: 0 },
      screening: { success: 2, failed: 0, unsupported: 0 },
      interpretation: { interpreted: 0, skipped: 2, failed: 0, unsupported: 0 },
    },
    blocks: [
      {
        id: 'b0',
        screening: { status: 'success', choice: 'irrelevant', probability: 0.99 },
        route: 'skip',
        interpretation: { status: 'skipped', reason: 'screened-irrelevant' },
      },
      {
        id: 'b1',
        screening: { status: 'success', choice: 'irrelevant', probability: 0.99 },
        route: 'skip',
        interpretation: { status: 'skipped', reason: 'screened-irrelevant' },
      },
    ],
  };

  const interpreted = applyDecision(r, interpretJob(r), result, false);
  const dec = mainDecision(r, interpreted);
  assert.equal(dec.status, 'no-blocker');
});

test('partial processing in no-policy posting produces Could not verify', () => {
  const r = role(['We offer health insurance.', 'Collaborate with colleagues.']);
  const digests = computeConfigurationDigests(decisionQuestions);
  // One screen succeeded and skipped, but one failed
  const result: DecisionResultV2 = {
    version: DECISION_VERSION,
    engine: 'laya',
    model: 'test-model',
    configuration: digests,
    processing: {
      status: 'partial',
      inputCount: 2,
      context: { complete: 2, missing: 0 },
      screening: { success: 1, failed: 1, unsupported: 0 },
      interpretation: { interpreted: 0, skipped: 1, failed: 1, unsupported: 0 },
    },
    blocks: [
      {
        id: 'b0',
        screening: { status: 'success', choice: 'irrelevant', probability: 0.99 },
        route: 'skip',
        interpretation: { status: 'skipped', reason: 'screened-irrelevant' },
      },
      {
        id: 'b1',
        screening: { status: 'failed', reason: 'inference-failed' },
        route: 'uncertain',
        interpretation: { status: 'failed', reason: 'screening-failed' },
      },
    ],
  };

  const interpreted = applyDecision(r, interpretJob(r), result, false);
  const dec = mainDecision(r, interpreted);
  assert.equal(dec.status, 'could-not-verify');
});

test('relevant role-level eligibility text with all policy answers unclear requires review', () => {
  const r = role(['Eligibility text that is relevant to hiring.']);
  const interpreted = applyDecision(
    r,
    interpretJob(r),
    output(
      r,
      defaultAnswers({
        scope: { choice: 'role', probability: 0.99 },
        sponsorship: { choice: 'unclear', probability: 0.99 },
        cpt: { choice: 'unclear', probability: 0.99 },
        opt: { choice: 'unclear', probability: 0.99 },
      }),
      'relevant',
      'relevant',
    ),
    false,
  );
  assert.equal(interpreted.sponsorship.requiresReview, true);
  assert.equal(mainDecision(r, interpreted).status, 'could-not-verify');
});

test('model-selected evidence preserves source URLs and adjacent conditions with context citationRole', () => {
  const r = role(['Visa sponsorship is available.', 'Only with manager approval.']);
  r.evidence[0]!.source = 'official-overview';
  r.evidence[0]!.sourceUrl = 'https://example.test/overview';
  const result = output(r, defaultAnswers({ sponsorship: { choice: 'conditional', probability: 0.99 } }));
  const interpreted = applyDecision(r, interpretJob(r), result);
  assert.equal(interpreted.sponsorship.status, 'conditional');
  assert.equal(interpreted.sponsorship.citations[0]!.sourceUrl, 'https://example.test/overview');
  assert.equal(interpreted.sponsorship.citations[0]!.citationRole, 'target');
  const contextCitation = interpreted.sponsorship.citations.find(c => c.quote === 'Only with manager approval.');
  assert.ok(contextCitation);
  assert.equal(contextCitation.citationRole, 'context');
});

test('decision client is opt-in, deduplicates updates and discards results after navigation or disable', async () => {
  const responses: ((value: any) => void)[] = [];
  let calls = 0;
  const client = new DecisionClient(
    () => {
      calls++;
      return new Promise(resolve => responses.push(resolve));
    },
    () => {},
  );
  const original = snapshot(role(['We do not sponsor applicants.']));
  assert.equal(client.update(original).result?.decisionComparison?.state, 'disabled');
  assert.equal(calls, 0);
  client.setEnabled(true);
  const pending = client.update(original);
  client.update(original);
  assert.equal(calls, 1);
  assert.equal(pending.result?.decisionComparison?.state, 'pending');
  assert.equal(pending.result?.interpretation?.sponsorship.status, 'unavailable');
  assert.equal(badgeState(pending)?.tone, 'unavailable');
  const next = snapshot(role(['Sponsorship is offered.']));
  client.update(next);
  responses[0]!({ state: 'ready', result: output() });
  await tick();
  assert.equal(client.update(next).result?.decisionComparison?.state, 'pending');
  client.setEnabled(false);
  responses[1]!({ state: 'ready', result: output(next.result!.role!) });
  await tick();
  assert.equal(client.update(next).result?.decisionComparison?.state, 'disabled');
});

test('model disagreement and failure remain separate from deterministic findings', async () => {
  const r = role(['We do not sponsor applicants.']);
  assert.equal(interpretJob(r).sponsorship.status, 'unavailable');
  let resolve!: (value: unknown) => void;
  const client = new DecisionClient(
    () =>
      new Promise(done => {
        resolve = done;
      }),
    () => {},
  );
  client.setEnabled(true);
  const s = snapshot(r);
  const pending = client.update(s);
  assert.equal(pending.result?.decisionComparison?.state, 'pending');
  resolve({ state: 'ready', result: output(r, defaultAnswers({ sponsorship: { choice: 'available', probability: 0.99 } })) });
  await tick();
  const compared = client.update(s);
  assert.equal(compared.result?.interpretation?.sponsorship.status, 'unavailable');
  assert.equal(compared.result?.decisionComparison?.interpretation?.sponsorship.status, 'available');
  assert.equal(compared.result?.decisionComparison?.interpretation?.restrictions.length, 0);

  const failed = new DecisionClient(async () => {
    throw new Error('offline');
  }, () => {});
  failed.setEnabled(true);
  failed.update(s);
  await tick();
  const result = failed.update(s);
  assert.equal(result.result?.interpretation?.sponsorship.status, 'unavailable');
  assert.equal(result.result?.decisionComparison?.state, 'error');
  assert.equal(result.result?.decisionComparison?.interpretation, undefined);
  assert.equal(badgeState(result)!.label, 'Explicit blocker found');
});

test('malformed transport replies become visible errors rather than an unhandled rejection', async () => {
  for (const raw of [null, {}, { state: 'unknown' }, { state: 'error', message: {} }, { state: 'ready', result: {} }]) {
    const client = new DecisionClient(async () => raw, () => {});
    client.setEnabled(true);
    const s = snapshot();
    client.update(s);
    await tick();
    assert.equal(client.update(s).result?.decisionComparison?.state, 'error');
  }
});

test('service deduplicates identical work and never stores invalid model responses as ready', async () => {
  let calls = 0;
  const service = new DecisionService(async r => {
    calls++;
    return output(role(r.blocks.map(b => b.text)));
  });
  const r = decisionRequest(role());
  assert.equal(service.run(r).state, 'pending');
  service.run(r);
  await tick();
  assert.equal(service.run(r).state, 'ready');
  assert.equal(calls, 1);
  const broken = new DecisionService(async () => ({ ...output(), blocks: [] }));
  broken.run(r);
  await tick();
  assert.equal(broken.run(r).state, 'error');
});
