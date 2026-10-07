import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decisionQuestions } from '../server/decision-questions';

test('runtime questions retain the authoritative decision contract', () => {
  const contract = readFileSync(new URL('../DECISION_LOGIC.md', import.meta.url), 'utf8');
  const questions = decisionQuestions as Record<string, { instructions: string; criteria: Record<string, string> }>;
  assert.match(contract, /Status: authoritative/);
  assert.match(questions.scope!.instructions, /Applicant questions never establish policy/);
  assert.match(questions.sponsorship!.criteria.conditional!, /may provide sponsorship/);
  assert.match(questions.sponsorship!.criteria.unclear!, /citizenship.*U\.S\.-person.*export-control/);
  assert.match(questions.timing!.instructions, /Never infer timing/);
  assert.match(questions.opt!.instructions, /Treat Pre-OPT as OPT/);
});
