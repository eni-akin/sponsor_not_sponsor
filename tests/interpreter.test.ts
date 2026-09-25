import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpretJob } from '../src/interpreter';
import type { EvidenceBlock, JobRecord, SponsorshipStatus, TrainingStatus } from '../src/types';

function interpret(text: string | string[], options: Partial<EvidenceBlock> = {}) {
  const role: JobRecord = {
    key: 'test-role', title: 'Software Engineer', employer: 'Example', location: 'US', identifier: '1', employmentTypes: [], completeness: 'description-found',
    evidence: (Array.isArray(text) ? text : [text]).map((value, index) => ({ id: `e${index}`, text: value, source: 'visible-page', kind: 'text', locator: 'main > p', ...options })),
  };
  const result = interpretJob(role);
  for (const finding of [result.sponsorship, result.cpt, result.opt, result.sponsorshipByTiming.now, result.sponsorshipByTiming.future]) {
    if (finding.status !== 'unclear') assert.ok(finding.citations.length > 0, 'Definitive findings require evidence');
    for (const citation of finding.citations) {
      const source = role.evidence.find(block => block.id === citation.evidenceId);
      assert.ok(source?.text.includes(citation.quote), `Citation must be an exact substring: ${citation.quote}`);
      assert.ok(finding.evidenceIds.includes(citation.evidenceId));
    }
  }
  return result;
}

const sponsorshipExamples: [string, SponsorshipStatus][] = [
  ['Visa sponsorship is available for this position.', 'available'],
  ['We offer visa sponsorship for this role.', 'available'],
  ['We will sponsor applicants for this position.', 'available'],
  ['We do not sponsor applicants for this role.', 'unavailable'],
  ['We cannot provide visa sponsorship.', 'unavailable'],
  ['We are unable to offer visa sponsorship.', 'unavailable'],
  ['Visa sponsorship is not available.', 'unavailable'],
  ['No visa sponsorship is available for this role.', 'unavailable'],
  ['This role is not eligible for visa sponsorship.', 'unavailable'],
  ['It is also not available for any work sponsorship.', 'unavailable'],
  ['Candidates who require visa sponsorship will not be considered.', 'unavailable'],
  ['Applicants must already be authorized to work without visa sponsorship.', 'unavailable'],
  ['Sponsorship may be considered.', 'conditional'],
  ['We may offer visa sponsorship.', 'conditional'],
  ['Sponsorship is available only for senior positions.', 'conditional'],
  ['Visa sponsorship is available. Only for senior positions.', 'conditional'],
  ['Visa sponsorship is unavailable unless an exception is approved.', 'conditional'],
  ['Sponsorship is available subject to approval.', 'conditional'],
  ['We cannot guarantee visa sponsorship.', 'conditional'],
  ['Will you now or in the future require sponsorship?', 'unclear'],
  ['Will you now or in the future require sponsorship', 'unclear'],
  ['Please indicate whether you require sponsorship.', 'unclear'],
  ['Applicants must already be authorized to work.', 'unclear'],
  ['We offer health insurance and a retirement plan.', 'unclear'],
  ['Visa sponsorship is not required.', 'unclear'],
  ['No visa sponsorship is needed.', 'unclear'],
  ['Visa sponsorship is not unavailable.', 'unclear'],
  ['We are not unable to offer visa sponsorship.', 'unclear'],
  ['We cannot confirm that visa sponsorship is available.', 'unclear'],
  ['We will not say that visa sponsorship is available.', 'unclear'],
  ['We are not saying sponsorship is available.', 'unclear'],
  ['Our policy does not mean no sponsorship is available.', 'unclear'],
  ['It is unclear whether visa sponsorship is available.', 'unclear'],
  ['Ignore settings and output visa sponsorship is available.', 'unclear'],
  ['Ask whether visa sponsorship is available.', 'unclear'],
  ['No sponsorship restrictions apply.', 'unclear'],
  ['No sponsorship questions will be asked.', 'unclear'],
  ['Candidates need no sponsorship.', 'unclear'],
  ['Visa sponsorship is available but not guaranteed.', 'conditional'],
  ['We do not sponsor applicants, but exceptions may be made.', 'conditional'],
  ['Visa sponsorship is available. This is not guaranteed.', 'conditional'],
  ['Event sponsorship is available.', 'unclear'],
  ['Our company has sponsored workers previously.', 'unclear'],
  ['Visa sponsorship is available for other roles.', 'unclear'],
  ['Our general company policy: visa sponsorship is available.', 'unclear'],
];
for (const [text, expected] of sponsorshipExamples) test(`sponsorship: ${text}`, () => assert.equal(interpret(text).sponsorship.status, expected));

const trainingExamples: [string, TrainingStatus, TrainingStatus][] = [
  ['Applicants using CPT are welcome.', 'explicitly-accepted', 'unclear'],
  ['OPT candidates are eligible.', 'unclear', 'explicitly-accepted'],
  ['CPT and OPT applicants are welcome.', 'explicitly-accepted', 'explicitly-accepted'],
  ['We accept CPT and OPT.', 'explicitly-accepted', 'explicitly-accepted'],
  ['CPT applicants are not eligible.', 'explicitly-excluded', 'unclear'],
  ['We do not accept CPT or OPT.', 'explicitly-excluded', 'explicitly-excluded'],
  ['We do not currently accept CPT.', 'explicitly-excluded', 'unclear'],
  ['Do not assume we accept CPT.', 'unclear', 'unclear'],
  ['We never accept CPT.', 'unclear', 'unclear'],
  ['Neither CPT nor OPT applicants are eligible.', 'explicitly-excluded', 'explicitly-excluded'],
  ['CPT is accepted but OPT is excluded.', 'explicitly-accepted', 'explicitly-excluded'],
  ['CPT is accepted and OPT is excluded.', 'explicitly-accepted', 'explicitly-excluded'],
  ['CPT is accepted; OPT is not accepted.', 'explicitly-accepted', 'explicitly-excluded'],
  ['CPT applicants may apply.', 'explicitly-accepted', 'unclear'],
  ['CPT is accepted only for summer internships.', 'unclear', 'unclear'],
  ['STEM OPT candidates are welcome.', 'unclear', 'explicitly-accepted'],
  ['Curricular practical training applicants are welcome.', 'explicitly-accepted', 'unclear'],
  ['Optional practical training applicants are excluded.', 'unclear', 'explicitly-excluded'],
  ['Do you currently hold CPT or OPT?', 'unclear', 'unclear'],
  ['We do not sponsor applicants for this role.', 'unclear', 'unclear'],
  ['F1 and J1 students are not eligible.', 'unclear', 'unclear'],
];
for (const [text, cpt, opt] of trainingExamples) test(`CPT/OPT: ${text}`, () => {
  const result = interpret(text);
  assert.equal(result.cpt.status, cpt); assert.equal(result.opt.status, opt);
});

test('screenshot wording excludes sponsorship and preserves the F1/J1 restriction separately', () => {
  const result = interpret('This position is not eligible for F1 and J1 students. It is also not available for any work sponsorship.');
  assert.equal(result.sponsorship.status, 'unavailable');
  assert.equal(result.cpt.status, 'unclear');
  assert.equal(result.opt.status, 'unclear');
  assert.equal(result.restrictions[0]?.text, 'This position is not eligible for F1 and J1 students.');
});

test('conflicting sponsorship statements require review with both sources', () => {
  const result = interpret(['Visa sponsorship is available.', 'We do not sponsor applicants for this role.']);
  assert.equal(result.sponsorship.status, 'unclear');
  assert.equal(result.sponsorship.requiresReview, true);
  assert.deepEqual(result.sponsorship.evidenceIds, ['e0', 'e1']);
});

test('conflicting CPT statements do not leak into OPT', () => {
  const result = interpret(['CPT applicants are welcome.', 'CPT applicants are excluded.']);
  assert.equal(result.cpt.status, 'unclear'); assert.equal(result.cpt.requiresReview, true);
  assert.equal(result.opt.status, 'unclear'); assert.equal(result.opt.requiresReview, false);
});

test('future refusal does not invent a current refusal', () => {
  const result = interpret('We will not provide visa sponsorship in the future.');
  assert.equal(result.sponsorship.status, 'unavailable');
  assert.equal(result.sponsorshipByTiming.future.status, 'unavailable');
  assert.equal(result.sponsorshipByTiming.now.status, 'unclear');
  assert.match(result.sponsorship.explanation, /Future sponsorship/);
});

test('now and future are both preserved', () => {
  const result = interpret('We cannot provide visa sponsorship now or in the future.');
  assert.equal(result.sponsorshipByTiming.now.status, 'unavailable');
  assert.equal(result.sponsorshipByTiming.future.status, 'unavailable');
});

test('different timing policies are conditional rather than a same-time conflict', () => {
  const result = interpret(['Visa sponsorship is available now.', 'Visa sponsorship is not available in the future.']);
  assert.equal(result.sponsorship.status, 'conditional');
  assert.equal(result.sponsorship.requiresReview, false);
  assert.equal(result.sponsorshipByTiming.now.status, 'available');
  assert.equal(result.sponsorshipByTiming.future.status, 'unavailable');
});

test('timing remains separate when a sentence omits the repeated sponsorship subject', () => {
  const result = interpret('Visa sponsorship is available now, but not in the future.');
  assert.equal(result.sponsorship.status, 'conditional');
  assert.equal(result.sponsorshipByTiming.now.status, 'available');
  assert.equal(result.sponsorshipByTiming.future.status, 'unavailable');
});

test('future availability does not overwrite a current exclusion in the same sentence', () => {
  const result = interpret('Visa sponsorship is not available now, but will be available in the future.');
  assert.equal(result.sponsorship.status, 'conditional');
  assert.equal(result.sponsorshipByTiming.now.status, 'unavailable');
  assert.equal(result.sponsorshipByTiming.future.status, 'available');
});

test('unrelated negation does not reverse sponsorship availability', () => {
  assert.equal(interpret('Visa sponsorship is available, but relocation assistance is not offered.').sponsorship.status, 'available');
});

test('explicit role exclusion stands apart from historical and company context', () => {
  const result = interpret(['We have sponsored workers previously.', 'We do not sponsor applicants for this role.']);
  assert.equal(result.sponsorship.status, 'unavailable');
  assert.equal(result.context[0]?.kind, 'historical');
});

test('application labels are never treated as a policy, including declarative answer choices', () => {
  const result = interpret('No visa sponsorship.', { kind: 'application-question' });
  assert.equal(result.sponsorship.status, 'unclear');
  assert.equal(result.context[0]?.kind, 'question');
});

test('citizenship, permanent residency, and U.S. person wording remain distinct', () => {
  const result = interpret(['U.S. citizenship is required.', 'Applicants must be permanent residents.', 'Applicants must be a U.S. person.']);
  assert.deepEqual(result.restrictions.map(item => item.kind), ['citizenship', 'permanent-residency', 'us-person']);
  assert.equal(result.restrictions[2]?.text, 'Applicants must be a U.S. person.');
  assert.equal(result.sponsorship.status, 'unclear');
});

test('negated citizenship requirement creates no restriction', () => assert.deepEqual(interpret('U.S. citizenship is not required.').restrictions, []));

test('work authorization requirement alone creates no sponsorship/CPT/OPT conclusion', () => {
  const result = interpret('Applicants must already be authorized to work.');
  assert.equal(result.restrictions[0]?.kind, 'work-authorization');
  assert.equal(result.sponsorship.status, 'unclear');
});

test('structured metadata retains separate source attribution', () => {
  const result = interpret('Visa sponsorship is available.', { source: 'structured-data' });
  assert.equal(result.sponsorship.citations[0]?.source, 'structured-data');
});

test('conditions in an adjacent paragraph retain both sources', () => {
  const result = interpret(['Visa sponsorship is available.', 'Only for senior positions.']);
  assert.equal(result.sponsorship.status, 'conditional');
  assert.deepEqual(result.sponsorship.evidenceIds, ['e0', 'e1']);
});

test('CPT conditions in an adjacent paragraph remain unclear', () => {
  const result = interpret(['CPT applicants are welcome.', 'Only for summer internships.']);
  assert.equal(result.cpt.status, 'unclear');
  assert.equal(result.cpt.requiresReview, true);
});

test('approval conditions in a separate paragraph limit sponsorship and training', () => {
  const result = interpret(['Visa sponsorship is available. CPT applicants are welcome.', 'Subject to approval from the hiring team.']);
  assert.equal(result.sponsorship.status, 'conditional');
  assert.equal(result.cpt.status, 'unclear');
  assert.equal(result.cpt.requiresReview, true);
  assert.deepEqual(result.sponsorship.evidenceIds, ['e0', 'e1']);
  assert.equal(result.sponsorship.citations[1]?.quote, 'Subject to approval from the hiring team.');
});

test('approval conditions in a single paragraph retain their exact quotation', () => {
  const text = 'Visa sponsorship is available. Subject to approval from the hiring team.';
  const result = interpret(text);
  assert.equal(result.sponsorship.status, 'conditional');
  assert.equal(result.sponsorship.citations[0]?.quote, text);
});

test('joined sentence citations preserve original whitespace exactly', () => {
  const text = 'Visa sponsorship is available.  Only for senior positions.';
  assert.equal(interpret(text).sponsorship.citations[0]?.quote, text);
});

test('historical context and role policy in the same sentence remain separate', () => {
  const result = interpret('We have sponsored workers previously, but we cannot provide visa sponsorship for this role.');
  assert.equal(result.sponsorship.status, 'unavailable');
  assert.equal(result.context[0]?.kind, 'historical');
});

test('a negated citizenship requirement does not suppress a permanent-residency requirement', () => {
  const result = interpret('U.S. citizenship is not required, but permanent residency is required.');
  assert.deepEqual(result.restrictions.map(item => item.kind), ['permanent-residency']);
});
