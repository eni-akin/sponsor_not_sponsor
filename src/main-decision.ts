import type { Interpretation, JobRecord, MainDecision, MainDecisionStatus } from './types';

const labels: Record<MainDecisionStatus, string> = {
  'explicit-blocker': 'Explicit blocker found',
  'sponsorship-stated': 'Sponsorship stated',
  'no-blocker': 'No blocker found',
  'could-not-verify': 'Could not verify',
};

const result = (status: MainDecisionStatus, explanation: string, citations: MainDecision['citations'] = []): MainDecision =>
  ({ status, label: labels[status], explanation, citations });

const blocksTemporaryAuthorization = (text: string) =>
  /\b(?:citizenship|citizens?|permanent residen(?:t|cy|ts)|green card|u\.?\s*s\.? persons?)\b/i.test(text)
  || /\b(?:permanent|unrestricted)\s+(?:work|employment)\s+authoriz/i.test(text)
  || /\b(?:f-?1|j-?1|international students?|temporary visa|student visa)\b.{0,50}\b(?:not eligible|ineligible|excluded|not accepted|not permitted|not allowed)\b/i.test(text)
  || /\b(?:not eligible|ineligible|excluded|not accepted|not permitted|not allowed)\b.{0,50}\b(?:f-?1|j-?1|international students?|temporary visa|student visa)\b/i.test(text);

const statesConditionalRefusal = (text: string) =>
  /\b(?:sponsorship\s+(?:is\s+)?(?:unavailable|not available)|(?:do not|does not|will not)\s+sponsor|(?:cannot|unable to)\s+(?:offer|provide|support)\s+[^.]{0,30}sponsorship)\b/i.test(text);

/** Turn detailed evidence into the single practical answer shown to the user. */
export function mainDecision(role: JobRecord, interpretation: Interpretation): MainDecision {
  if (interpretation.decision?.state === 'pending' || interpretation.decision?.state === 'error')
    return result('could-not-verify', interpretation.decision.message);
  if (role.completeness === 'incomplete')
    return result('could-not-verify', 'The job description was incomplete, so the posting could not be checked safely.');
  if (interpretation.sponsorship.requiresReview)
    return result('could-not-verify', 'The posting contains conflicting or uncertain sponsorship wording. Review the cited passages.', interpretation.sponsorship.citations);

  const restrictions = interpretation.restrictions.filter(item => blocksTemporaryAuthorization(item.text));
  const exclusions = [interpretation.cpt, interpretation.opt].filter(item => item.status === 'explicitly-excluded');
  const conditionalRefusal = interpretation.sponsorship.status === 'conditional'
    && interpretation.sponsorship.citations.some(citation => statesConditionalRefusal(citation.quote));
  if (interpretation.sponsorship.status === 'unavailable' || conditionalRefusal || restrictions.length || exclusions.length) {
    const citations = [
      ...(['unavailable', 'conditional'].includes(interpretation.sponsorship.status) ? interpretation.sponsorship.citations : []),
      ...restrictions.flatMap(item => item.citations),
      ...exclusions.flatMap(item => item.citations),
    ];
    return result('explicit-blocker', 'The posting states a sponsorship, citizenship, residency, or visa-status restriction.', citations);
  }
  if (interpretation.sponsorship.status === 'available' || interpretation.sponsorship.status === 'conditional')
    return result('sponsorship-stated', 'The posting explicitly offers or considers sponsorship. Read the cited conditions.', interpretation.sponsorship.citations);
  return result('no-blocker', 'No explicit blocker or sponsorship statement was found in the complete posting. The role may be worth applying to, but sponsorship is not proven.');
}
