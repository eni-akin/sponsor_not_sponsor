import type { Interpretation, JobRecord, MainDecision, MainDecisionStatus } from './types';

export const mainDecisionLabels: Record<MainDecisionStatus, string> = {
  'explicit-blocker': 'Explicit blocker found',
  'sponsorship-stated': 'Sponsorship stated',
  'no-blocker': 'No blocker found',
  'could-not-verify': 'Could not verify',
};

const result = (status: MainDecisionStatus, explanation: string, citations: MainDecision['citations'] = []): MainDecision =>
  ({ status, label: mainDecisionLabels[status], explanation, citations });

const blocksTemporaryAuthorization = (text: string) =>
  /\b(?:citizenship|citizens?|permanent residen(?:t|cy|ts)|green card|u\.?\s*s\.? persons?)\b/i.test(text)
  || /\b(?:permanent|unrestricted)\s+(?:work|employment)\s+authoriz/i.test(text)
  || /\b(?:f-?1|j-?1|international students?|temporary visa|student visa)\b.{0,50}\b(?:not eligible|ineligible|excluded|not accepted|not permitted|not allowed)\b/i.test(text)
  || /\b(?:not eligible|ineligible|excluded|not accepted|not permitted|not allowed)\b.{0,50}\b(?:f-?1|j-?1|international students?|temporary visa|student visa)\b/i.test(text);

/** Turn detailed evidence into the single practical answer shown to the user. */
export function mainDecision(role: JobRecord, interpretation: Interpretation): MainDecision {
  // Incomplete extraction prevents a complete-vacancy verdict.
  if (role.completeness === 'incomplete')
    return result('could-not-verify', 'The job description was incomplete, so the posting could not be checked safely.');

  const restrictions = interpretation.restrictions.filter(item => item.kind === 'export-control' || blocksTemporaryAuthorization(item.text));
  const exclusions = [interpretation.cpt, interpretation.opt].filter(item => !item.requiresReview && item.status === 'explicitly-excluded');

  const definitiveSponsorshipUnavailable = !interpretation.sponsorship.requiresReview
    && (interpretation.sponsorship.status === 'unavailable'
        || (!interpretation.sponsorshipByTiming?.now?.requiresReview && interpretation.sponsorshipByTiming?.now?.status === 'unavailable')
        || (!interpretation.sponsorshipByTiming?.future?.requiresReview && interpretation.sponsorshipByTiming?.future?.status === 'unavailable'));

  // Precedence 2: Definitive blocker found
  if (definitiveSponsorshipUnavailable || exclusions.length || restrictions.length) {
    const citations = [
      ...(definitiveSponsorshipUnavailable ? interpretation.sponsorship.citations : []),
      ...restrictions.flatMap(item => item.citations),
      ...exclusions.flatMap(item => item.citations),
    ];
    const exportControl = restrictions.some(item => item.kind === 'export-control');
    const exportExplanation = exportControl
      ? `The posting states a country-scoped export-license obstacle to accessing controlled information. The citations show the affected group and any stated deadline or exceptions.${definitiveSponsorshipUnavailable ? ' Sponsorship is also unavailable.' : ''}`
      : 'The posting states a sponsorship, citizenship, residency, or visa-status restriction.';
    return result('explicit-blocker', exportExplanation, citations);
  }

  // Precedence 3: No definitive blocker, but conflicting or unresolved sponsorship, CPT, or OPT finding
  if (interpretation.sponsorship.requiresReview || interpretation.cpt.requiresReview || interpretation.opt.requiresReview) {
    const citations = [
      ...(interpretation.sponsorship.requiresReview ? interpretation.sponsorship.citations : []),
      ...(interpretation.cpt.requiresReview ? interpretation.cpt.citations : []),
      ...(interpretation.opt.requiresReview ? interpretation.opt.citations : []),
    ];
    return result('could-not-verify', 'The posting contains conflicting or unresolved immigration/eligibility wording. Review the cited passages.', citations);
  }

  // Precedence 4: Sponsorship stated (available or conditional)
  if (interpretation.sponsorship.status === 'available' || interpretation.sponsorship.status === 'conditional')
    return result('sponsorship-stated', 'The posting explicitly offers or considers sponsorship. Read the cited conditions.', interpretation.sponsorship.citations);

  // Precedence 5: Complete evidence and processing with no explicit blocker or sponsorship statement
  return result('no-blocker', 'No explicit blocker or sponsorship statement was found in the complete posting. The role may be worth applying to, but sponsorship is not proven.');
}
