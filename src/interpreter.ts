import type { Citation, EvidenceBlock, Finding, Interpretation, JobRecord, SponsorshipStatus, Timing, TrainingStatus } from './types';

type Claim<T> = { status: T; citation: Citation };
const SPONSOR = String.raw`(?:(?:visa|work|employment|immigration|employer|h-?1b)\s+)?sponsorship`;
const sponsorTopic = /\bsponsor(?:ship|ing|ed|s)?\b|\bh-?1b\b/i;
const trainingTerms = { cpt: String.raw`(?:\bcpt\b|\bcurricular practical training\b)`, opt: String.raw`(?:\b(?:stem\s+)?opt\b|\boptional practical training\b)` };
const normalize = (text: string) => text.toLowerCase().replace(/[’‘]/g, "'").replace(/\bu\.\s*s\./g, 'us').replace(/\bwon't\b/g, 'will not').replace(/\bcan't\b/g, 'cannot').replace(/\bdon't\b/g, 'do not').replace(/\bdoesn't\b/g, 'does not').replace(/\bisn't\b/g, 'is not').replace(/\baren't\b/g, 'are not').replace(/\s+/g, ' ').trim();
const matches = (text: string, expression: string) => new RegExp(expression, 'i').test(text);
const conditional = /\b(?:if|unless|except|only|depending|subject to|case.by.case|may|might|could|limited to|not guaranteed|cannot guarantee|do not guarantee)\b/i;
const ambiguousNegation = /\bnot\s+(?:unavailable|unable|ineligible|excluded|only|necessarily)|\b(?:cannot|do not)\s+rule out/;
const continuation = /^(?:only\b|except\b|unless\b|exceptions\b|subject to\b|this (?:is |will be )?(?:subject to|not guaranteed)|we cannot guarantee (?:this|it)\b)/i;
const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });

function timing(text: string): Timing {
  const future = /\b(future|later|after graduation|subsequently)\b/.test(text);
  const now = /\b(now|currently|current|at this time|at present|initially)\b/.test(text);
  return future && now ? 'now-and-future' : future ? 'future' : now ? 'now' : 'unspecified';
}

function sentences(block: EvidenceBlock): { quote: string; text: string }[] {
  const parts = [...segmenter.segment(block.text)].map(part => ({
    text: part.segment.trim(), start: part.index + part.segment.length - part.segment.trimStart().length,
    end: part.index + part.segment.trimEnd().length,
  })).filter(part => part.text);
  // Preserve an adjacent condition such as “Only for senior roles.” with its policy.
  const joined: { start: number; end: number }[] = [];
  for (const part of parts) {
    if (joined.length && continuation.test(part.text)) joined[joined.length - 1]!.end = part.end;
    else joined.push({ start: part.start, end: part.end });
  }
  return joined.map(({ start, end }) => { const quote = block.text.slice(start, end); return { quote, text: normalize(quote) }; });
}

function clauses(text: string): string[] {
  return text.split(/\s*;\s*|\s*,?\s*\b(?:but|whereas|while|however)\b\s*|,\s*(?=(?:cpt|opt)\b)/).flatMap(clause => {
    const index = clause.search(/\band\s+(?=(?:cpt|opt)(?:\s+(?:candidates|applicants))?\s+(?:is|are|not|accepted|excluded)\b)/);
    return index >= 0 && /\b(accept(?:ed)?|welcome|eligible|excluded|permitted|allowed|support(?:ed)?)\b/.test(clause.slice(0, index))
      ? [clause.slice(0, index), clause.slice(index + 3)] : [clause];
  });
}

function sponsorshipStatus(text: string): Exclude<SponsorshipStatus, 'unclear'> | null {
  if (!sponsorTopic.test(text) || ambiguousNegation.test(text)) return null;
  if (/\b(?:whether|example|sample wording|unclear|uncertain|unknown|doubt)|\b(?:cannot|do not|does not|will not|not)\s+(?:say|saying|confirm|promise|state|mean|imply)\b|\b(?:need|require)\s+no\b/.test(text)) return null;
  // Needing no sponsorship describes the applicant, not an employer's willingness to sponsor.
  if (matches(text, String.raw`\bno\s+${SPONSOR}\s+(?:is\s+)?(?:required|needed|necessary)\b`) || matches(text, String.raw`${SPONSOR}\s+(?:is\s+)?not\s+(?:required|needed|necessary)\b`)) return null;
  const unavailable = [
    String.raw`\b${SPONSOR}\s+(?:(?:is|will be|can be)\s+)?(?:(?:currently|generally|presently)\s+)?(?:unavailable|not\s+(?:available|offered|provided|supported|possible|permitted))\b`,
    String.raw`\bno\s+(?:(?:current|future|any)\s+)?${SPONSOR}(?=\s*(?:[.!;,]|$)|\s+(?:is|will|for|now|in the future|at this time|available|offered|provided)\b)`,
    String.raw`\b(?:we|the (?:company|employer|organization))\s+(?:do not|does not|will not|cannot|never|are unable to|is unable to)\s+(?:(?:currently|presently|ever)\s+)?(?:(?:offer|provide|support)\s+(?:any\s+)?${SPONSOR}|sponsor\s+(?:applicants|candidates|workers|employees|this (?:role|position)))\b`,
    String.raw`\b(?:position|role|job|internship|it)\s+(?:is|will be)\s+(?:also\s+)?not\s+(?:eligible|available)\s+for\s+(?:any\s+)?${SPONSOR}\b`,
    String.raw`\b(?:applicants|candidates)\s+(?:who\s+)?(?:require|need)\s+${SPONSOR}\s+(?:(?:now(?: or in the future)?|in the future|currently)\s+)?(?:are not eligible|will not be considered|cannot be considered)\b`,
    String.raw`\bmust\b[^.!?;]{0,100}\b(?:authorized|eligible)\s+to\s+work\b[^.!?;]{0,60}\bwithout\s+${SPONSOR}\b`,
  ].some(pattern => matches(text, pattern));
  const available = [
    String.raw`\b${SPONSOR}\s+(?:is|will be)\s+(?:available|offered|provided|supported)\b`,
    String.raw`\b${SPONSOR}\s+available\b`,
    String.raw`\b(?:we|the (?:company|employer|organization))\s+(?:(?:can|will|do)\s+)?(?:offers?|provides?)\s+${SPONSOR}\b`,
    String.raw`\b(?:we|the (?:company|employer|organization))\s+(?:can|will)\s+sponsor\s+(?:applicants|candidates|workers|employees)\b`,
  ].some(pattern => matches(text, pattern));
  const considered = matches(text, String.raw`\b${SPONSOR}\s+(?:(?:may|might|could)\s+(?:be\s+)?(?:considered|available|offered|provided)|(?:is\s+)?(?:subject to|limited to|considered on))\b`)
    || matches(text, String.raw`\b(?:may|might|could)\s+(?:consider|offer|provide)\s+${SPONSOR}\b`)
    || matches(text, String.raw`\b(?:cannot|do not)\s+guarantee\s+${SPONSOR}\b`);
  if (available && !unavailable && /\b(?:not|never|unable|cannot)\b/.test(text) && !conditional.test(text)) return null;
  if ((available || unavailable || considered) && conditional.test(text)) return 'conditional';
  if (unavailable) return 'unavailable';
  if (available) return 'available';
  if (considered) return 'conditional';
  return null;
}

function trainingStatus(text: string, topic: 'cpt' | 'opt'): TrainingStatus | null {
  if (!matches(text, trainingTerms[topic]) || ambiguousNegation.test(text)) return null;
  const other = trainingTerms[topic === 'cpt' ? 'opt' : 'cpt'];
  // Normalize a shared subject (“CPT and OPT applicants”) without transferring a separate clause's policy.
  const subject = text.replace(new RegExp(String.raw`\s*(?:and|or|nor|/)\s*${other}`, 'g'), '')
    .replace(new RegExp(String.raw`${other}\s*(?:and|or|nor|/)\s*`, 'g'), '');
  const term = trainingTerms[topic];
  const people = String.raw`(?:\s+(?:applicants|candidates|students|holders|applications))?`;
  const negative = [
    String.raw`${term}${people}\s+(?:(?:are|is)\s+)?(?:not\s+(?:accepted|welcome|eligible|permitted|allowed|supported)|ineligible|excluded)\b`,
    String.raw`\b(?:do not|cannot|will not)\s+(?:(?:currently|presently|ever)\s+)?(?:accept|consider|hire|support|allow)\s+(?:(?:applicants|candidates|students)\s+(?:using|on|with)\s+)?${term}`,
    String.raw`\b(?:no|not)\s+${term}${people}(?:\s+(?:accepted|allowed|permitted))?(?:[.!]|$)`,
    String.raw`\bneither\s+${term}${people}\s+(?:are|is)\s+(?:accepted|eligible|welcome)\b`,
    String.raw`\bmust not\s+(?:be\s+)?(?:on|use)\s+${term}`,
  ].some(pattern => matches(subject, pattern));
  const positive = [
    String.raw`${term}${people}\s+(?:(?:are|is)\s+)?(?:accepted|welcome|eligible|permitted|allowed|supported)\b`,
    String.raw`\b(?:accept|welcome|consider|hire|support|allow)\s+(?:(?:applicants|candidates|students)\s+(?:using|on|with)\s+)?${term}`,
    String.raw`${term}${people}\s+(?:may|can)\s+apply\b`,
  ].some(pattern => matches(subject, pattern));
  if (!negative && !positive) return null;
  if (positive && !negative && /\b(?:not|never|unable|cannot)\b/.test(subject)) return null;
  // The output vocabulary has no conditional CPT/OPT label; retain evidence as unclear.
  if (conditional.test(subject.replace(/\bmay apply\b/g, 'can apply'))) return 'unclear';
  return negative ? 'explicitly-excluded' : 'explicitly-accepted';
}

function finding<T extends string>(status: T, citations: Citation[], explanation: string, requiresReview = false): Finding<T> {
  const unique = citations.filter((citation, index) => citations.findIndex(other => other.evidenceId === citation.evidenceId && other.quote === citation.quote && other.timing === citation.timing) === index);
  return { status, citations: unique, evidenceIds: [...new Set(unique.map(citation => citation.evidenceId))], explanation, requiresReview };
}

function resolveSponsorship(claims: Claim<SponsorshipStatus>[], allowTimingDifference = true): Finding<SponsorshipStatus> {
  if (!claims.length) return finding('unclear', [], 'No explicit sponsorship policy was found in the extracted text.');
  const statuses = new Set(claims.map(claim => claim.status));
  const citations = claims.map(claim => claim.citation);
  if (statuses.has('available') && statuses.has('unavailable')) {
    const positives = claims.filter(claim => claim.status === 'available');
    const negatives = claims.filter(claim => claim.status === 'unavailable');
    const separateTimes = allowTimingDifference && positives.every(a => negatives.every(b =>
      (a.citation.timing === 'now' && b.citation.timing === 'future') || (a.citation.timing === 'future' && b.citation.timing === 'now')));
    return separateTimes
      ? finding('conditional', citations, 'The posting states different policies for current and future sponsorship. Read both timing-specific statements.')
      : finding('unclear', citations, 'Conflicting sponsorship statements require review.', true);
  }
  if (statuses.has('conditional')) return finding('conditional', citations, 'Sponsorship depends on stated conditions or employer consideration. Read the complete evidence.');
  const status = claims[0]!.status;
  const futureOnly = citations.every(citation => citation.timing === 'future');
  return finding(status, citations, `${futureOnly ? 'Future sponsorship' : 'Sponsorship'} is explicitly ${status === 'available' ? 'offered' : 'excluded'} in the cited text.${futureOnly ? ' Current sponsorship is not established by this statement.' : ''}`);
}

function resolveTraining(claims: Claim<TrainingStatus>[], name: string): Finding<TrainingStatus> {
  if (!claims.length) return finding('unclear', [], `No explicit ${name} acceptance or exclusion was found. Silence and sponsorship policy do not establish ${name} acceptance.`);
  const statuses = new Set(claims.map(claim => claim.status));
  const citations = claims.map(claim => claim.citation);
  if (statuses.has('explicitly-accepted') && statuses.has('explicitly-excluded')) return finding('unclear', citations, `Conflicting ${name} statements require review.`, true);
  if (statuses.has('unclear')) return finding('unclear', citations, `${name} wording includes conditions that need review.`, true);
  const status = claims[0]!.status;
  return finding(status, citations, `${name} is explicitly ${status === 'explicitly-accepted' ? 'accepted' : 'excluded'} in the cited text.`);
}

function restrictionKind(text: string): Interpretation['restrictions'][number]['kind'] | null {
  if (/\b(?:not required|not necessary|no requirement|do not require|does not require)\b/.test(text)) return null;
  const required = /\b(?:must|require[ds]?|only|limited to|not eligible|ineligible|not available|excluded)\b/.test(text);
  if (!required) return null;
  if (/\bus persons?\b/.test(text)) return 'us-person';
  if (/\b(?:citizenship|citizens?)\b/.test(text)) return 'citizenship';
  if (/\b(?:permanent residen(?:t|cy|ts)|green card)\b/.test(text)) return 'permanent-residency';
  if (/\b(?:authorized|authorization|eligible)\b.{0,30}\b(?:work|employment)\b/.test(text)) return 'work-authorization';
  if (/\b(?:f-?1|j-?1)\b/.test(text)) return 'stated-condition';
  return null;
}

/** Pure local rules. Statements remain untrusted text, never instructions or executable actions. */
export function interpretJob(role: JobRecord): Interpretation {
  const sponsorship: Claim<SponsorshipStatus>[] = [];
  const training: Record<'cpt' | 'opt', Claim<TrainingStatus>[]> = { cpt: [], opt: [] };
  const restrictions: Interpretation['restrictions'] = [];
  const context: Interpretation['context'] = [];
  let previousBlockId = '';
  for (const block of role.evidence) {
    if (block.kind !== 'application-question' && continuation.test(block.text)) {
      // A condition in the next paragraph still limits the preceding policy. Cite both blocks.
      const previousSponsor = sponsorship.filter(claim => claim.citation.evidenceId === previousBlockId);
      if (previousSponsor.length) {
        previousSponsor.forEach(claim => { claim.status = 'conditional'; });
        sponsorship.push({ status: 'conditional', citation: { evidenceId: block.id, quote: block.text, source: block.source, timing: previousSponsor[0]!.citation.timing } });
      }
      for (const topic of ['cpt', 'opt'] as const) {
        const previous = training[topic].filter(claim => claim.citation.evidenceId === previousBlockId);
        if (previous.length) {
          previous.forEach(claim => { claim.status = 'unclear'; });
          training[topic].push({ status: 'unclear', citation: { evidenceId: block.id, quote: block.text, source: block.source, timing: 'unspecified' } });
        }
      }
    }
    for (const { quote, text } of sentences(block)) {
      const relevant = sponsorTopic.test(text) || matches(text, trainingTerms.cpt) || matches(text, trainingTerms.opt) || /\b(?:citizenship|citizens?|permanent residen\w*|green card|us persons?|authorized to work|f-?1|j-?1)\b/.test(text);
      if (!relevant) continue;
      const citation: Citation = { evidenceId: block.id, quote, source: block.source, timing: timing(text) };
      const question = block.kind === 'application-question' || quote.endsWith('?') || /^(?:will|would|do|does|did|are|is|can|could|have)\s+(?:you|the applicant)\b|^(?:please\s+)?(?:indicate|select|confirm|answer)\b/.test(text);
      if (question) { context.push({ kind: 'question', citation }); continue; }
      if (/\b(?:ignore (?:previous|prior|all|the|settings)|pretend|output|classify this|label this)\b/.test(text)) { context.push({ kind: 'unrecognized', citation }); continue; }
      if (/\b(?:event|conference|sports|athlete|brand|charit(?:y|able)|certification|tuition)\s+sponsorship\b|\bsponsorship\s+(?:of|for)\s+(?:(?:professional|educational)\s+)?(?:certification|exams?|events?|conferences?|sports|tuition|scholarships?)\b/.test(text)) { context.push({ kind: 'unrecognized', citation }); continue; }
      // Educational quotations and applicant preferences are not employer policy.
      if (/\b(?:guide|article|tutorial|example)\b.{0,60}\b(?:explains?|illustrates?|describes?)\b|\bi\s+(?:prefer|need|require|want|am seeking)\b|\bmy\s+(?:preference|requirement)\b/.test(text)) { context.push({ kind: 'unrecognized', citation }); continue; }
      let recognized = false;
      let sponsorshipAntecedent = false;
      for (const clause of clauses(text)) {
        const scopedCitation = { ...citation, timing: timing(clause) };
        const contextKind = /\b(?:historically|previously|in the past|has sponsored|have sponsored|used to sponsor)\b/.test(clause) ? 'historical'
          : /\b(?:other (?:roles|positions|jobs)|unrelated vacancy)\b/.test(clause) ? 'other-role'
          : /\b(?:company.wide|across (?:the |our )?company|general company policy)\b/.test(clause) ? 'company' : null;
        if (contextKind) { context.push({ kind: contextKind, citation: scopedCitation }); recognized = true; continue; }
        const restriction = restrictionKind(clause);
        if (restriction) { restrictions.push({ kind: restriction, text: quote, evidenceIds: [block.id], citations: [scopedCitation] }); recognized = true; }
        let status = sponsorshipStatus(clause);
        // Preserve an omitted repeated subject: “available now, but not in the future.”
        if (!status && sponsorshipAntecedent && !sponsorTopic.test(clause)
          && /^(?:(?:is|will be|it is|it will be)\s+)?(?:not(?:\s+available)?|unavailable|available)\s+(?:now|currently|in the future|at this time|later)[.!\s]*$/.test(clause.trim())) {
          status = /\b(?:not|unavailable)\b/.test(clause) ? 'unavailable' : 'available';
        }
        if (status && /\b(?:exceptions?\b.*\b(?:may|might|possible)|not guaranteed|cannot guarantee)\b/.test(text)) status = 'conditional';
        if (status) { sponsorship.push({ status, citation: scopedCitation }); recognized = true; sponsorshipAntecedent = true; }
        for (const topic of ['cpt', 'opt'] as const) {
          const status = trainingStatus(clause, topic);
          if (status) { training[topic].push({ status, citation: scopedCitation }); recognized = true; }
        }
      }
      if (!recognized) context.push({ kind: 'unrecognized', citation });
    }
    previousBlockId = block.id;
  }
  const overall = resolveSponsorship(sponsorship);
  if (overall.status === 'unclear' && !sponsorship.length && context.some(item => item.kind === 'question' && sponsorTopic.test(item.citation.quote))) {
    overall.explanation += ' Application questions do not establish employer policy.';
  }
  return {
    sponsorship: overall,
    cpt: resolveTraining(training.cpt, 'CPT'), opt: resolveTraining(training.opt, 'OPT'),
    sponsorshipByTiming: {
      now: resolveSponsorship(sponsorship.filter(claim => ['now', 'now-and-future'].includes(claim.citation.timing)), false),
      future: resolveSponsorship(sponsorship.filter(claim => ['future', 'now-and-future'].includes(claim.citation.timing)), false),
    },
    restrictions, context,
  };
}
