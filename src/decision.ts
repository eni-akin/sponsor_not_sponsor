import type { Citation, Finding, Interpretation, JobRecord, SponsorshipStatus, Timing, TrainingStatus } from './types';

export const DECISION_PERMISSION = 'http://127.0.0.1:4319/*';
export const DECISION_ORIGIN = 'http://127.0.0.1:4319';
export const DECISION_VERSION = 'laya-policy-v1';
export const MIN_DECISION_PROBABILITY = 0.8; // Provisional abstention threshold, not an accuracy claim.
export type DecisionRequest = { version: typeof DECISION_VERSION; title: string; employer: string | null; blocks: { id: string; text: string; kind: 'text' | 'application-question' }[] };
export type ChoiceAnswer = { choice: string; probability: number };
export type BlockDecision = { id: string; answers: Record<'scope' | 'sponsorship' | 'timing' | 'cpt' | 'opt', ChoiceAnswer> };
export type DecisionResult = { version: typeof DECISION_VERSION; engine: 'laya'; model: string; blocks: BlockDecision[] };
export type DecisionReply = { state: 'pending' } | { state: 'ready'; result: DecisionResult } | { state: 'error'; message: string };
const vocabularies = {
  scope: ['role', 'question', 'historical', 'company', 'other-role', 'none'],
  sponsorship: ['available', 'unavailable', 'conditional', 'unclear'],
  timing: ['unspecified', 'now', 'future', 'now-and-future'],
  cpt: ['explicitly-accepted', 'explicitly-excluded', 'unclear'],
  opt: ['explicitly-accepted', 'explicitly-excluded', 'unclear'],
} as const;

export function decisionRequest(role: JobRecord): DecisionRequest {
  return { version: DECISION_VERSION, title: role.title, employer: role.employer,
    blocks: role.evidence.map(({ id, text, kind }) => ({ id, text, kind })) };
}
export function parseDecisionRequest(input: unknown): DecisionRequest | null {
  const r = input as DecisionRequest | null;
  if (!r || r.version !== DECISION_VERSION || typeof r.title !== 'string' || !r.title || r.title.length > 500
    || (r.employer !== null && (typeof r.employer !== 'string' || r.employer.length > 500))
    || !Array.isArray(r.blocks) || !r.blocks.length || r.blocks.length > 1000) return null;
  let length = 0;
  const seen = new Set<string>();
  for (const b of r.blocks) {
    if (!b || typeof b.id !== 'string' || !b.id || b.id.length > 200 || seen.has(b.id)
      || typeof b.text !== 'string' || !b.text || b.text.length > 30_000 || !['text', 'application-question'].includes(b.kind)) return null;
    seen.add(b.id); length += b.text.length;
  }
  if (length > 100_000) return null;
  return { version: DECISION_VERSION, title: r.title, employer: r.employer,
    blocks: r.blocks.map(({ id, text, kind }) => ({ id, text, kind })) };
}
export function parseDecisionResult(input: unknown, request: DecisionRequest): DecisionResult | null {
  const r = input as DecisionResult | null;
  if (!r || r.version !== DECISION_VERSION || r.engine !== 'laya' || typeof r.model !== 'string'
    || !r.model || r.model.length > 250 || !Array.isArray(r.blocks) || r.blocks.length !== request.blocks.length) return null;
  for (let i = 0; i < r.blocks.length; i++) {
    const b = r.blocks[i];
    if (!b || b.id !== request.blocks[i]!.id || !b.answers) return null;
    for (const [field, vocabulary] of Object.entries(vocabularies)) {
      const a = b.answers[field as keyof BlockDecision['answers']];
      if (!a || !(vocabulary as readonly string[]).includes(a.choice) || !Number.isFinite(a.probability)
        || a.probability < 0 || a.probability > 1) return null;
    }
  }
  return r;
}
export function unresolvedDecision(base: Interpretation, message: string, state: 'pending' | 'error'): Interpretation {
  const unknown = (): Finding<'unclear'> => ({ status: 'unclear', citations: [], evidenceIds: [], explanation: message, requiresReview: state === 'error' });
  return { ...base, sponsorship: unknown(), cpt: unknown(), opt: unknown(), sponsorshipByTiming: { now: unknown(), future: unknown() },
    decision: { engine: 'laya', state, message } };
}

/** Convert typed model choices to existing findings. Quotes always come from our extracted blocks. */
export function applyDecision(role: JobRecord, base: Interpretation, result: DecisionResult): Interpretation {
  type Claim = { status: string; citations: Citation[] };
  const claims: Record<'sponsorship' | 'cpt' | 'opt', Claim[]> = { sponsorship: [], cpt: [], opt: [] };
  const uncertain = new Set<string>();
  const uncertainEvidence: Record<string, Citation[]> = {};
  const context: Interpretation['context'] = [];
  result.blocks.forEach((decision, index) => {
    const block = role.evidence[index]!;
    const { scope, timing } = decision.answers;
    const time: Timing = timing.probability >= MIN_DECISION_PROBABILITY ? timing.choice as Timing : 'unspecified';
    const cite = (i: number): Citation => {
      const evidence = role.evidence[i]!;
      return { evidenceId: evidence.id, quote: evidence.text, source: evidence.source, sourceUrl: evidence.sourceUrl, timing: time };
    };
    const contextCitations = () => [index - 1, index, index + 1].filter(i => i >= 0 && i < role.evidence.length).map(cite);
    const markUncertain = (topic: string) => {
      uncertain.add(topic);
      (uncertainEvidence[topic] ??= []).push(...contextCitations());
    };
    if (block.kind === 'application-question') { context.push({ kind: 'question', citation: cite(index) }); return; }
    if (scope.choice !== 'role' || scope.probability < MIN_DECISION_PROBABILITY) {
      if (['question', 'historical', 'company', 'other-role'].includes(scope.choice)) context.push({ kind: scope.choice as Interpretation['context'][number]['kind'], citation: cite(index) });
      for (const topic of ['sponsorship', 'cpt', 'opt'] as const) {
        if (scope.probability < MIN_DECISION_PROBABILITY && decision.answers[topic].choice !== 'unclear') markUncertain(topic);
      }
      return;
    }
    for (const topic of ['sponsorship', 'cpt', 'opt'] as const) {
      const answer = decision.answers[topic];
      if (answer.choice === 'unclear') continue;
      if (answer.probability < MIN_DECISION_PROBABILITY || (topic === 'sponsorship' && timing.probability < MIN_DECISION_PROBABILITY)) { markUncertain(topic); continue; }
      // Include the neighboring context actually supplied to the model, preserving adjacent conditions.
      claims[topic].push({ status: answer.choice, citations: contextCitations() });
    }
  });
  const resolve = (items: Claim[], topic: string): Finding<any> => {
    const citations = [...items.flatMap(c => c.citations), ...(uncertainEvidence[topic] ?? [])].filter((c, i, all) => all.findIndex(x => x.evidenceId === c.evidenceId && x.timing === c.timing) === i);
    const statuses = new Set(items.map(c => c.status));
    const conflict = statuses.size > 1;
    const review = conflict || uncertain.has(topic);
    return { status: review || !items.length ? 'unclear' : items[0]!.status,
      citations, evidenceIds: [...new Set(citations.map(c => c.evidenceId))], requiresReview: review,
      explanation: review ? 'The local model found conflicting or uncertain evidence. Review the original passages.'
        : !items.length ? 'The local model did not establish an explicit policy for this topic.'
          : 'Laya classified the cited passages for this role. Neighboring passages are included to preserve conditions; verify the wording.' };
  };
  const atTime = (time: 'now' | 'future') => claims.sponsorship.filter(c => ['now-and-future', time].includes(c.citations[0]!.timing));
  const now = resolve(atTime('now'), 'sponsorship');
  const future = resolve(atTime('future'), 'sponsorship');
  let sponsorship = resolve(claims.sponsorship, 'sponsorship') as Finding<SponsorshipStatus>;
  if (!uncertain.has('sponsorship') && sponsorship.requiresReview && now.status !== 'unclear' && future.status !== 'unclear'
    && now.status !== future.status && claims.sponsorship.every(c => ['now', 'future'].includes(c.citations[0]!.timing))) {
    sponsorship.status = 'conditional'; sponsorship.requiresReview = false;
    sponsorship.explanation = 'The local model found different current and future sponsorship policies. Read both statements.';
  }
  if (base.sponsorship.status === 'unavailable') sponsorship = base.sponsorship;
  return { ...base, sponsorship, cpt: resolve(claims.cpt, 'cpt') as Finding<TrainingStatus>, opt: resolve(claims.opt, 'opt') as Finding<TrainingStatus>,
    sponsorshipByTiming: { now, future }, context,
    decision: { engine: 'laya', state: 'ready', model: result.model, message: 'Local Laya preview · sponsorship, CPT and OPT use model decisions. Stated-requirement highlights still use local text rules.' } };
}
