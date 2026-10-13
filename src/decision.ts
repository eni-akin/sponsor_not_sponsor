import type {
  Citation,
  ContextGroup,
  Finding,
  Interpretation,
  JobRecord,
  SponsorshipStatus,
  Timing,
  TrainingStatus,
  DecisionRequestV2,
  DecisionResultV2,
  BlockResultV2,
  ScreeningResult,
  InterpretationResult,
  Route,
  Probability,
  InterpretationAnswers,
} from './types';
import { isOtherRolePolicy } from './policy-scope';

export const DECISION_PERMISSION = 'http://127.0.0.1:4319/*';
export const DECISION_ORIGIN = 'http://127.0.0.1:4319';
export const DECISION_VERSION = 'laya-policy-v2';
export const DECISION_VERSION_V1 = 'laya-policy-v1';
export const MIN_DECISION_PROBABILITY = 0.8; // Provisional abstention threshold, not an accuracy claim.

export type {
  DecisionRequestV2,
  DecisionResultV2,
  BlockResultV2,
  ScreeningResult,
  InterpretationResult,
  Route,
  Probability,
  InterpretationAnswers,
  ContextGroup,
};

export type DecisionRequest = DecisionRequestV2;
export type DecisionResult = DecisionResultV2;
export type BlockDecision = BlockResultV2;
export type DecisionReply =
  | { state: 'pending' }
  | { state: 'ready'; result: DecisionResultV2 }
  | { state: 'error'; message: string };

export const vocabularies = {
  relevance: ['relevant', 'irrelevant'],
  scope: ['role', 'question', 'historical', 'company', 'other-role', 'none'],
  sponsorship: ['available', 'unavailable', 'conditional', 'unclear'],
  timing: ['unspecified', 'now', 'future', 'now-and-future'],
  cpt: ['explicitly-accepted', 'explicitly-excluded', 'unclear'],
  opt: ['explicitly-accepted', 'explicitly-excluded', 'unclear'],
} as const;

export type CanonicalModelState = {
  job_title: string;
  employer: string | null;
  country: string | null;
  previous_status: 'present' | 'boundary' | 'missing';
  previous: string | null;
  TARGET: string;
  next: string | null;
  next_status: 'present' | 'boundary' | 'missing';
};

export const CANONICAL_CONTEXT_DEFINITION = {
  version: 1,
  keys: ['job_title', 'employer', 'country', 'previous_status', 'previous', 'TARGET', 'next', 'next_status'],
  statuses: ['present', 'boundary', 'missing'],
};

export const DEFAULT_PARAMETERS = {
  routing: 'all-forward',
  minDecisionProbability: MIN_DECISION_PROBABILITY,
};

function sha256Hex(ascii: string): string {
  function rightRotate(value: number, amount: number) { return (value >>> amount) | (value << (32 - amount)); }
  const mathPow = Math.pow; const maxWord = mathPow(2, 32); const words: any[] = []; const K: any[] = []; const H: any[] = [];
  let compositeCount = 0;
  for (let candidate = 2; compositeCount < 64; candidate++) {
    let isPrime = true;
    for (let factor = 2; factor * factor <= candidate; factor++) { if (candidate % factor === 0) { isPrime = false; break; } }
    if (isPrime) {
      if (compositeCount < 8) H[compositeCount] = (mathPow(candidate, 0.5) * maxWord) | 0;
      K[compositeCount] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      compositeCount++;
    }
  }
  const bytes: any[] = [];
  for (let i = 0; i < ascii.length; i++) {
    let code = ascii.charCodeAt(i);
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0xd800 || code >= 0xe000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    else { i++; code = 0x10000 + (((code & 0x3ff) << 10) | (ascii.charCodeAt(i) & 0x3ff)); bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f)); }
  }
  const byteBitLength = bytes.length * 8; bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push((byteBitLength / mathPow(2, i * 8)) & 0xff);
  for (let i = 0; i < bytes.length; i += 4) words.push((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]);
  for (let i = 0; i < words.length; i += 16) {
    const w: any[] = words.slice(i, i + 16); const oldH = [...H];
    for (let j = 0; j < 64; j++) {
      if (j >= 16) {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      const S1 = rightRotate(H[4], 6) ^ rightRotate(H[4], 11) ^ rightRotate(H[4], 25);
      const ch = (H[4] & H[5]) ^ (~H[4] & H[6]);
      const temp1 = (H[7] + S1 + ch + K[j] + w[j]) | 0;
      const S0 = rightRotate(H[0], 2) ^ rightRotate(H[0], 13) ^ rightRotate(H[0], 22);
      const maj = (H[0] & H[1]) ^ (H[0] & H[2]) ^ (H[1] & H[2]);
      const temp2 = (S0 + maj) | 0;
      H[7] = H[6]; H[6] = H[5]; H[5] = H[4]; H[4] = (H[3] + temp1) | 0; H[3] = H[2]; H[2] = H[1]; H[1] = H[0]; H[0] = (temp1 + temp2) | 0;
    }
    for (let j = 0; j < 8; j++) H[j] = (H[j] + oldH[j]) | 0;
  }
  return H.map(h => (h >>> 0).toString(16).padStart(8, '0')).join('');
}

export function computeConfigurationDigests(questions: unknown, parameters: unknown = DEFAULT_PARAMETERS) {
  return {
    questionsSha256: sha256Hex(JSON.stringify(questions)),
    contextSha256: sha256Hex(JSON.stringify(CANONICAL_CONTEXT_DEFINITION)),
    parametersSha256: sha256Hex(JSON.stringify(parameters)),
  };
}

export function deriveNeighbor(
  q: { contextGroups: ContextGroup[]; blocks: { contextGroup: string; position: number; text?: string; id?: string }[] },
  b: { contextGroup: string; position: number },
  delta: -1 | 1,
): { status: 'present' | 'boundary' | 'missing'; position: number | null; text: string | null } {
  const g = q.contextGroups.find(group => group.id === b.contextGroup);
  if (!g) return { status: 'missing', position: null, text: null };
  const n = q.blocks.find(block => block.contextGroup === b.contextGroup && block.position === b.position + delta);
  if (n) return { status: 'present', position: n.position, text: n.text ?? null };
  const outside = delta < 0 ? b.position === g.firstPosition : b.position === g.lastPosition;
  return { status: outside ? (delta < 0 ? g.start : g.end) : 'missing', position: null, text: null };
}

export function deriveCanonicalState(request: DecisionRequestV2, blockIndex: number): {
  state: CanonicalModelState;
  contextComplete: boolean;
} {
  const b = request.blocks[blockIndex]!;
  const prev = deriveNeighbor(request, b, -1);
  const next = deriveNeighbor(request, b, 1);
  const contextComplete = prev.status !== 'missing' && next.status !== 'missing';
  const state: CanonicalModelState = {
    job_title: request.title,
    employer: request.employer,
    country: request.country,
    previous_status: prev.status,
    previous: prev.text,
    TARGET: b.text,
    next: next.text,
    next_status: next.status,
  };
  return { state, contextComplete };
}

export function serializeCanonicalState(state: CanonicalModelState): string {
  return JSON.stringify({
    job_title: state.job_title,
    employer: state.employer,
    country: state.country,
    previous_status: state.previous_status,
    previous: state.previous,
    TARGET: state.TARGET,
    next: state.next,
    next_status: state.next_status,
  });
}

export function decisionRequest(role: JobRecord): DecisionRequestV2 {
  const title = (role.title || '').trim().slice(0, 500);
  const employer = role.employer ? role.employer.trim().slice(0, 500) || null : null;
  const country = role.country ? role.country.trim().slice(0, 200) || null : null;

  if (!role.evidence || !role.evidence.length) {
    return {
      version: DECISION_VERSION,
      title,
      employer,
      country,
      contextGroups: [],
      blocks: [],
    };
  }

  if (role.contextGroups && role.contextGroups.length) {
    return {
      version: DECISION_VERSION,
      title,
      employer,
      country,
      contextGroups: role.contextGroups,
      blocks: role.evidence.map((b, index) => ({
        id: b.id,
        text: b.text,
        kind: b.kind,
        contextGroup: b.contextGroup ?? 'visible-0',
        position: b.position ?? index,
      })),
    };
  }

  // Derive context groups from evidence
  const groupIndices = new Map<string, number[]>();
  const blocks = role.evidence.map((b, index) => {
    const contextGroup = b.contextGroup ?? (b.source === 'visible-page' ? 'visible-0' : `${b.source}-0`);
    const indices = groupIndices.get(contextGroup) ?? [];
    const position = typeof b.position === 'number' && Number.isInteger(b.position) && b.position >= 0 ? b.position : indices.length;
    indices.push(position);
    groupIndices.set(contextGroup, indices);
    return {
      id: b.id,
      text: b.text,
      kind: b.kind,
      contextGroup,
      position,
    };
  });

  const contextGroups: ContextGroup[] = [];
  for (const [id, positions] of groupIndices) {
    const firstPosition = Math.min(...positions);
    const lastPosition = Math.max(...positions);
    const start = firstPosition === 0 ? 'boundary' : 'missing';
    const end = role.coverage?.gaps?.includes('truncated') ? 'missing' : 'boundary';
    contextGroups.push({ id, firstPosition, lastPosition, start, end });
  }

  return {
    version: DECISION_VERSION,
    title,
    employer,
    country,
    contextGroups,
    blocks,
  };
}

export function parseDecisionRequest(input: unknown): DecisionRequestV2 | null {
  const r = input as DecisionRequestV2 | null;
  if (!r || r.version !== DECISION_VERSION || typeof r.title !== 'string' || !r.title || r.title.length > 500)
    return null;
  if (r.employer !== null && (typeof r.employer !== 'string' || !r.employer || r.employer.length > 500))
    return null;
  if (r.country !== null && (typeof r.country !== 'string' || !r.country || r.country.length > 200))
    return null;
  if (!Array.isArray(r.contextGroups) || !Array.isArray(r.blocks))
    return null;

  if (r.blocks.length === 0) {
    if (r.contextGroups.length !== 0) return null;
    return {
      version: DECISION_VERSION,
      title: r.title,
      employer: r.employer,
      country: r.country,
      contextGroups: [],
      blocks: [],
    };
  }

  if (r.blocks.length > 1000 || r.contextGroups.length > r.blocks.length)
    return null;

  const groupMap = new Map<string, ContextGroup>();
  for (const g of r.contextGroups) {
    if (!g || typeof g.id !== 'string' || !g.id || g.id.length > 200 || groupMap.has(g.id))
      return null;
    if (!Number.isInteger(g.firstPosition) || !Number.isInteger(g.lastPosition) || g.firstPosition < 0 || g.firstPosition > g.lastPosition)
      return null;
    if (!['boundary', 'missing'].includes(g.start) || !['boundary', 'missing'].includes(g.end))
      return null;
    groupMap.set(g.id, {
      id: g.id,
      firstPosition: g.firstPosition,
      lastPosition: g.lastPosition,
      start: g.start,
      end: g.end,
    });
  }

  let totalTextLength = 0;
  const seenIds = new Set<string>();
  const seenPositions = new Set<string>();
  const usedGroups = new Set<string>();
  const parsedBlocks: DecisionRequestV2['blocks'] = [];

  for (const b of r.blocks) {
    if (!b || typeof b.id !== 'string' || !b.id || b.id.length > 200 || seenIds.has(b.id))
      return null;
    seenIds.add(b.id);
    if (typeof b.text !== 'string' || !b.text || b.text.length > 30_000)
      return null;
    totalTextLength += b.text.length;
    if (!['text', 'application-question'].includes(b.kind))
      return null;
    const g = groupMap.get(b.contextGroup);
    if (!g) return null;
    if (!Number.isInteger(b.position) || b.position < g.firstPosition || b.position > g.lastPosition)
      return null;
    const posKey = `${b.contextGroup}:${b.position}`;
    if (seenPositions.has(posKey)) return null;
    seenPositions.add(posKey);
    usedGroups.add(b.contextGroup);

    parsedBlocks.push({
      id: b.id,
      text: b.text,
      kind: b.kind,
      contextGroup: b.contextGroup,
      position: b.position,
    });
  }

  if (totalTextLength > 100_000) return null;
  // All declared groups must have at least one block
  if (usedGroups.size !== groupMap.size) return null;

  return {
    version: DECISION_VERSION,
    title: r.title,
    employer: r.employer,
    country: r.country,
    contextGroups: [...groupMap.values()],
    blocks: parsedBlocks,
  };
}

export function parseDecisionResult(input: unknown, request: DecisionRequestV2): DecisionResultV2 | null {
  const r = input as DecisionResultV2 | null;
  if (!r || r.version !== DECISION_VERSION || r.engine !== 'laya' || typeof r.model !== 'string' || !r.model || r.model.length > 250)
    return null;
  if (!r.configuration || typeof r.configuration !== 'object')
    return null;
  for (const k of ['questionsSha256', 'contextSha256', 'parametersSha256'] as const) {
    if (typeof r.configuration[k] !== 'string' || !/^[0-9a-f]{64}$/.test(r.configuration[k]))
      return null;
  }
  if (!Array.isArray(r.blocks) || r.blocks.length !== request.blocks.length)
    return null;

  const context = { complete: 0, missing: 0 };
  const screening = { success: 0, failed: 0, unsupported: 0 };
  const interpretation = { interpreted: 0, skipped: 0, failed: 0, unsupported: 0 };

  const parsedBlocks: BlockResultV2[] = [];

  for (let i = 0; i < r.blocks.length; i++) {
    const b = r.blocks[i];
    const reqBlock = request.blocks[i]!;
    if (!b || b.id !== reqBlock.id) return null;

    const isMissingContext = [-1, 1].some(delta => deriveNeighbor(request, reqBlock, delta as -1 | 1).status === 'missing');
    context[isMissingContext ? 'missing' : 'complete']++;

    const s = b.screening;
    const t = b.interpretation;
    if (!s || !(s.status in screening)) return null;
    screening[s.status]++;
    if (!t || !(t.status in interpretation)) return null;
    interpretation[t.status]++;

    if (!['relevant', 'uncertain', 'skip'].includes(b.route)) return null;

    if (s.status === 'success') {
      if (isMissingContext) return null;
      if (!('choice' in s) || !['relevant', 'irrelevant'].includes(s.choice)) return null;
      if (typeof s.probability !== 'number' || !Number.isFinite(s.probability) || s.probability < 0 || s.probability > 1)
        return null;

      if (b.route === 'skip') {
        if (s.choice !== 'irrelevant') return null;
        if (t.status !== 'skipped' || t.reason !== 'screened-irrelevant') return null;
      } else {
        if (t.status === 'skipped') return null;
        if (b.route === 'relevant' && s.choice !== 'relevant') return null;
      }
    } else {
      if ('choice' in s || 'probability' in s) return null;
      if (b.route !== 'uncertain') return null;
      if (t.status !== s.status) return null;
      if (t.reason !== (s.status === 'failed' ? 'screening-failed' : 'screening-unsupported')) return null;
      if (isMissingContext) {
        if (s.status !== 'unsupported' || s.reason !== 'missing-context') return null;
      } else if (s.status === 'failed') {
        if (s.reason !== 'inference-failed') return null;
      } else {
        if (!['context-too-long', 'missing-context', 'unsupported-input'].includes(s.reason)) return null;
      }
    }

    if (t.status === 'interpreted') {
      if (s.status !== 'success') return null;
      if (!t.answers || typeof t.answers !== 'object') return null;
      const expectedKeys = ['scope', 'sponsorship', 'timing', 'cpt', 'opt'];
      const actualKeys = Object.keys(t.answers);
      if (actualKeys.length !== expectedKeys.length || !expectedKeys.every(k => k in t.answers))
        return null;

      for (const k of expectedKeys as (keyof InterpretationAnswers)[]) {
        const ans = t.answers[k];
        if (!ans || typeof ans !== 'object') return null;
        const vocab = vocabularies[k] as readonly string[];
        if (!vocab.includes(ans.choice)) return null;
        if (typeof ans.probability !== 'number' || !Number.isFinite(ans.probability) || ans.probability < 0 || ans.probability > 1)
          return null;
      }
    } else {
      if ('answers' in t || 'choice' in t || 'probability' in t) return null;
      if (!t.reason) return null;
    }

    parsedBlocks.push(b);
  }

  const expectedProcessingStatus: 'complete' | 'partial' =
    context.missing || screening.failed || screening.unsupported || interpretation.failed || interpretation.unsupported
      ? 'partial'
      : 'complete';

  const expectedProcessing = {
    status: expectedProcessingStatus,
    inputCount: request.blocks.length,
    context,
    screening,
    interpretation,
  };

  const p = r.processing;
  if (!p || p.status !== expectedProcessing.status || p.inputCount !== expectedProcessing.inputCount)
    return null;
  if (!p.context || p.context.complete !== context.complete || p.context.missing !== context.missing)
    return null;
  if (!p.screening || p.screening.success !== screening.success || p.screening.failed !== screening.failed || p.screening.unsupported !== screening.unsupported)
    return null;
  if (
    !p.interpretation ||
    p.interpretation.interpreted !== interpretation.interpreted ||
    p.interpretation.skipped !== interpretation.skipped ||
    p.interpretation.failed !== interpretation.failed ||
    p.interpretation.unsupported !== interpretation.unsupported
  )
    return null;

  return {
    version: DECISION_VERSION,
    engine: 'laya',
    model: r.model,
    configuration: {
      questionsSha256: r.configuration.questionsSha256,
      contextSha256: r.configuration.contextSha256,
      parametersSha256: r.configuration.parametersSha256,
    },
    processing: expectedProcessing,
    blocks: parsedBlocks,
  };
}

export function unresolvedDecision(base: Interpretation, message: string, state: 'pending' | 'error'): Interpretation {
  const unknown = (): Finding<'unclear'> => ({
    status: 'unclear',
    citations: [],
    evidenceIds: [],
    explanation: message,
    requiresReview: state === 'error',
  });
  return {
    ...base,
    sponsorship: unknown(),
    cpt: unknown(),
    opt: unknown(),
    sponsorshipByTiming: { now: unknown(), future: unknown() },
    decision: { engine: 'laya', state, message },
  };
}

export function modelDecisionBase(): Interpretation {
  const finding = (): Finding<'unclear'> => ({
    status: 'unclear',
    citations: [],
    evidenceIds: [],
    explanation: 'Laya has not established an explicit policy for this topic.',
    requiresReview: false,
  });
  return {
    sponsorship: finding(),
    cpt: finding(),
    opt: finding(),
    sponsorshipByTiming: { now: finding(), future: finding() },
    restrictions: [],
    context: [],
  };
}

/** Convert typed model choices to existing findings. Quotes always come from our extracted blocks. */
export function applyDecision(
  role: JobRecord,
  base: Interpretation,
  result: DecisionResultV2,
  preserveRuleRefusal = true,
): Interpretation {
  type Claim = { status: string; timing: Timing; citations: Citation[] };
  const claims: Record<'sponsorship' | 'cpt' | 'opt', Claim[]> = { sponsorship: [], cpt: [], opt: [] };
  const uncertain = new Set<string>();
  const uncertainEvidence: Record<string, Citation[]> = {};
  const context: Interpretation['context'] = [];

  result.blocks.forEach((decision, index) => {
    const block = role.evidence[index]!;
    const cite = (i: number, roleKind: 'target' | 'context', time: Timing = 'unspecified'): Citation => {
      const evidence = role.evidence[i]!;
      return {
        evidenceId: evidence.id,
        quote: evidence.text,
        source: evidence.source,
        sourceUrl: evidence.sourceUrl,
        timing: time,
        citationRole: roleKind,
      };
    };

    if (block.kind === 'application-question') {
      context.push({ kind: 'question', citation: cite(index, 'target') });
      return;
    }
    if (isOtherRolePolicy(block.text)) {
      context.push({ kind: 'other-role', citation: cite(index, 'target') });
      return;
    }

    // Non-success screening or non-interpreted interpretation
    if (decision.screening.status !== 'success' || decision.interpretation.status !== 'interpreted') {
      if (decision.screening.status === 'success' && decision.screening.choice === 'relevant') {
        uncertain.add('sponsorship');
        uncertain.add('cpt');
        uncertain.add('opt');
        (uncertainEvidence['sponsorship'] ??= []).push(cite(index, 'target'));
      }
      return;
    }

    const { scope, timing, sponsorship, cpt, opt } = decision.interpretation.answers;
    const time: Timing = timing.probability >= MIN_DECISION_PROBABILITY ? (timing.choice as Timing) : 'unspecified';

    const contextCitations = () => {
      const citations: Citation[] = [];
      const prevIndex = index - 1;
      const nextIndex = index + 1;
      if (prevIndex >= 0 && role.evidence[prevIndex]?.contextGroup === block.contextGroup) {
        citations.push(cite(prevIndex, 'context', time));
      }
      citations.push(cite(index, 'target', time));
      if (nextIndex < role.evidence.length && role.evidence[nextIndex]?.contextGroup === block.contextGroup) {
        citations.push(cite(nextIndex, 'context', time));
      }
      return citations;
    };

    const markUncertain = (topic: string) => {
      uncertain.add(topic);
      (uncertainEvidence[topic] ??= []).push(...contextCitations());
    };

    // If scope is not confident role
    if (scope.choice !== 'role' || scope.probability < MIN_DECISION_PROBABILITY) {
      if (['question', 'historical', 'company', 'other-role'].includes(scope.choice)) {
        context.push({ kind: scope.choice as Interpretation['context'][number]['kind'], citation: cite(index, 'target', time) });
      }
      if (decision.screening.choice === 'relevant' && scope.probability < MIN_DECISION_PROBABILITY) {
        for (const topic of ['sponsorship', 'cpt', 'opt'] as const) markUncertain(topic);
      }
      return;
    }

    // Role-level relevant target where sponsorship, cpt, and opt all remain unclear requires review
    if (decision.screening.choice === 'relevant' && sponsorship.choice === 'unclear' && cpt.choice === 'unclear' && opt.choice === 'unclear') {
      markUncertain('sponsorship');
      return;
    }

    // Sponsorship
    if (sponsorship.choice !== 'unclear') {
      if (sponsorship.probability < MIN_DECISION_PROBABILITY) {
        markUncertain('sponsorship');
      } else {
        claims.sponsorship.push({ status: sponsorship.choice, timing: time, citations: contextCitations() });
      }
    }

    // CPT & OPT
    for (const topic of ['cpt', 'opt'] as const) {
      const answer = decision.interpretation.answers[topic];
      if (answer.choice === 'unclear') continue;
      if (answer.probability < MIN_DECISION_PROBABILITY) {
        markUncertain(topic);
      } else {
        claims[topic].push({ status: answer.choice, timing: time, citations: contextCitations() });
      }
    }
  });

  const resolve = (items: Claim[], topic: string, forceReview = false): Finding<any> => {
    const citations = [...items.flatMap(c => c.citations), ...(uncertainEvidence[topic] ?? [])].filter(
      (c, i, all) => all.findIndex(x => x.evidenceId === c.evidenceId && x.timing === c.timing && x.citationRole === c.citationRole) === i,
    );
    const statuses = new Set(items.map(c => c.status));
    const conflict = statuses.size > 1;
    const review = forceReview || conflict || uncertain.has(topic);
    return {
      status: review || !items.length ? 'unclear' : items[0]!.status,
      citations,
      evidenceIds: [...new Set(citations.map(c => c.evidenceId))],
      requiresReview: review,
      explanation: review
        ? 'The local model found conflicting or uncertain evidence. Review the cited passages.'
        : !items.length
          ? 'The local model did not establish an explicit policy for this topic.'
          : 'Laya classified the cited passages for this role. Neighboring passages are included to preserve conditions; verify the wording.',
    };
  };

  const atTime = (time: 'now' | 'future') =>
    claims.sponsorship.filter(c => ['now-and-future', time].includes(c.timing));

  const nowClaims = atTime('now');
  const futureClaims = atTime('future');
  const unspecifiedClaims = claims.sponsorship.filter(c => c.timing === 'unspecified');

  // Conflict detection according to Section 7 of V2 contract:
  // unspecified and now-and-future overlap both time periods; now and future do not overlap each other.
  const nowStatuses = new Set(nowClaims.map(c => c.status));
  const futureStatuses = new Set(futureClaims.map(c => c.status));

  const hasNowConflict = (nowStatuses.has('unavailable') && (nowStatuses.has('available') || nowStatuses.has('conditional')));
  const hasFutureConflict = (futureStatuses.has('unavailable') && (futureStatuses.has('available') || futureStatuses.has('conditional')));

  const hasUnspecifiedUnavailable = unspecifiedClaims.some(c => c.status === 'unavailable');
  const hasUnspecifiedPositive = unspecifiedClaims.some(c => c.status === 'available' || c.status === 'conditional');

  const anyPositive = claims.sponsorship.some(c => c.status === 'available' || c.status === 'conditional');
  const anyUnavailable = claims.sponsorship.some(c => c.status === 'unavailable');

  const hasOverlapConflict =
    hasNowConflict ||
    hasFutureConflict ||
    (hasUnspecifiedUnavailable && anyPositive) ||
    (hasUnspecifiedPositive && anyUnavailable);

  const now = resolve(nowClaims, 'sponsorship', hasNowConflict);
  const future = resolve(futureClaims, 'sponsorship', hasFutureConflict);

  // Overall sponsorship finding:
  const allSponsorshipCitations = [
    ...claims.sponsorship.flatMap(c => c.citations),
    ...(uncertainEvidence['sponsorship'] ?? []),
  ].filter((c, i, all) => all.findIndex(x => x.evidenceId === c.evidenceId && x.timing === c.timing && x.citationRole === c.citationRole) === i);
  const allEvidenceIds = [...new Set(allSponsorshipCitations.map(c => c.evidenceId))];

  let overallSponsorship: Finding<SponsorshipStatus>;
  if (hasOverlapConflict || uncertain.has('sponsorship')) {
    overallSponsorship = {
      status: 'unclear',
      citations: allSponsorshipCitations,
      evidenceIds: allEvidenceIds,
      requiresReview: true,
      explanation: 'The local model found conflicting or uncertain evidence. Review the cited passages.',
    };
  } else if (claims.sponsorship.some(c => c.status === 'unavailable')) {
    overallSponsorship = {
      status: 'unavailable',
      citations: allSponsorshipCitations,
      evidenceIds: allEvidenceIds,
      requiresReview: false,
      explanation: 'Laya classified the cited passages for this role. Neighboring passages are included to preserve conditions; verify the wording.',
    };
  } else if (claims.sponsorship.some(c => c.status === 'conditional')) {
    overallSponsorship = {
      status: 'conditional',
      citations: allSponsorshipCitations,
      evidenceIds: allEvidenceIds,
      requiresReview: false,
      explanation: 'Laya classified the cited passages for this role. Neighboring passages are included to preserve conditions; verify the wording.',
    };
  } else if (claims.sponsorship.some(c => c.status === 'available')) {
    overallSponsorship = {
      status: 'available',
      citations: allSponsorshipCitations,
      evidenceIds: allEvidenceIds,
      requiresReview: false,
      explanation: 'Laya classified the cited passages for this role. Neighboring passages are included to preserve conditions; verify the wording.',
    };
  } else {
    overallSponsorship = {
      status: 'unclear',
      citations: allSponsorshipCitations,
      evidenceIds: allEvidenceIds,
      requiresReview: false,
      explanation: 'The local model did not establish an explicit policy for this topic.',
    };
  }

  if (preserveRuleRefusal && base.sponsorship.status === 'unavailable') {
    overallSponsorship = base.sponsorship;
  }

  const cpt = resolve(claims.cpt, 'cpt') as Finding<TrainingStatus>;
  const opt = resolve(claims.opt, 'opt') as Finding<TrainingStatus>;

  const processingMessage =
    result.processing.status === 'partial'
      ? 'Local Laya preview (partial processing) · some blocks were not evaluated completely. Verify original passages.'
      : preserveRuleRefusal
        ? 'Local Laya preview · sponsorship, CPT and OPT use model decisions. Stated-requirement highlights still use local text rules.'
        : 'Model coverage: sponsorship, CPT and OPT only. Citizenship, work authorization, export controls and other restrictions are not evaluated here.';

  return {
    ...base,
    sponsorship: overallSponsorship,
    cpt,
    opt,
    sponsorshipByTiming: { now, future },
    context,
    decision: {
      engine: 'laya',
      state: 'ready',
      model: result.model,
      processingStatus: result.processing.status,
      message: processingMessage,
    },
  };
}
