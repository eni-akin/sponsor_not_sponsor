import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decisionQuestions, screeningQuestion, interpretationQuestions } from '../server/decision-questions';
import { parseDecisionResult, parseDecisionRequest, type DecisionRequestV2, type DecisionResultV2 } from '../src/decision';

test('runtime questions retain the authoritative decision contract', () => {
  const contract = readFileSync(new URL('../DECISION_LOGIC.md', import.meta.url), 'utf8');
  const questions = decisionQuestions as Record<string, { instructions: string; criteria: Record<string, string> }>;
  assert.match(contract, /Status: authoritative/);

  // Exact pinned key order
  assert.deepEqual(Object.keys(decisionQuestions), ['relevance', 'scope', 'sponsorship', 'timing', 'cpt', 'opt']);
  assert.deepEqual(Object.keys(interpretationQuestions), ['scope', 'sponsorship', 'timing', 'cpt', 'opt']);

  // Relevance screening rubric
  assert.match(screeningQuestion.instructions, /Does TARGET itself concern immigration sponsorship/);
  assert.match(screeningQuestion.criteria.relevant!, /TARGET itself states, asks about, qualifies or explicitly refers to/);
  assert.match(screeningQuestion.criteria.irrelevant!, /TARGET has no such content or reference/);

  // Interpretation fields
  assert.match(questions.scope!.instructions, /Applicant questions never establish policy/);
  assert.match(questions.sponsorship!.criteria.conditional!, /may provide sponsorship/);
  assert.match(questions.sponsorship!.criteria.unclear!, /citizenship.*U\.S\.-person.*export-control/);
  assert.match(questions.timing!.instructions, /Never infer timing/);
  assert.match(questions.opt!.instructions, /Treat Pre-OPT as OPT/);
});

test('production v2 parsers validate all reference design transport fixtures and reject mutations', () => {
  const rawTransport = readFileSync(
    new URL('../evaluation/laya-training/two-stage-contract-2026-10-10/transport-fixtures.json', import.meta.url),
    'utf8',
  );
  const transport = JSON.parse(rawTransport) as {
    valid: { id: string; request: DecisionRequestV2; result: DecisionResultV2 }[];
    invalidMutations: { id: string; base: string }[];
  };

  // Test all valid fixtures
  for (const f of transport.valid) {
    const validReq = parseDecisionRequest(f.request);
    assert.ok(validReq, `Valid request ${f.id} should parse`);
    const validRes = parseDecisionResult(f.result, validReq);
    assert.ok(validRes, `Valid result ${f.id} should parse`);
  }

  // Test all mutations from design verifier
  for (const m of transport.invalidMutations) {
    const baseFixture = transport.valid.find(f => f.id === m.base);
    assert.ok(baseFixture);
    const f = structuredClone(baseFixture);
    const { request: q, result: r } = f;

    switch (m.id) {
      case 'missing-id':
        r.blocks.splice(1, 1);
        break;
      case 'duplicate-id':
        r.blocks[2]!.id = 'b2';
        break;
      case 'unexpected-id':
        r.blocks[1]!.id = 'unknown';
        break;
      case 'out-of-order':
        [r.blocks[0], r.blocks[1]] = [r.blocks[1]!, r.blocks[0]!];
        break;
      case 'answers-on-skip':
        (r.blocks[0]!.interpretation as any).answers = {};
        break;
      case 'missing-answer':
        delete (r.blocks[1]!.interpretation as any).answers.opt;
        break;
      case 'invented-probability':
        (r.blocks[0]!.screening as any).probability = 1;
        break;
      case 'invalid-probability':
        (r.blocks[1]!.interpretation as any).answers.sponsorship.probability = 1.1;
        break;
      case 'skip-relevant':
        (r.blocks[0]!.screening as any).choice = 'relevant';
        break;
      case 'partial-marked-complete':
        r.processing.status = 'complete';
        break;
      case 'bad-counts':
        r.processing.interpretation.skipped = 0;
        break;
      case 'bad-context-counts':
        r.processing.context.missing = 0;
        break;
      case 'missing-configuration-digest':
        delete (r.configuration as any).contextSha256;
        break;
      case 'bad-configuration-digest':
        r.configuration.parametersSha256 = 'A'.repeat(64);
        break;
      case 'missing-context-group':
        q.contextGroups = q.contextGroups.filter(g => g.id !== 'application-0');
        break;
      case 'unused-context-group':
        q.contextGroups.push({ id: 'unused', firstPosition: 0, lastPosition: 0, start: 'boundary', end: 'boundary' });
        break;
      case 'duplicate-position':
        q.blocks[1]!.position = 0;
        break;
      case 'position-outside-group':
        q.blocks[1]!.position = 2;
        break;
      default:
        throw new Error('unhandled mutation ' + m.id);
    }

    const parsedQ = parseDecisionRequest(q);
    const parsedR = parsedQ ? parseDecisionResult(r, parsedQ) : null;
    assert.equal(parsedR, null, `Mutation ${m.id} should be rejected`);
  }
});
