import type { Citation, Finding, Interpretation, SponsorshipStatus, TrainingStatus } from './types';

const labels: Record<SponsorshipStatus | TrainingStatus, string> = {
  available: 'Available', unavailable: 'Unavailable', conditional: 'Conditional', unclear: 'Unclear',
  'explicitly-accepted': 'Explicitly accepted', 'explicitly-excluded': 'Explicitly excluded',
};
const timingLabels = { unspecified: '', now: 'Current sponsorship', future: 'Future sponsorship', 'now-and-future': 'Now and in the future' };

function textElement(tag: string, text: string, className = ''): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = text;
  element.className = className;
  return element;
}

function citationView(citation: Citation): HTMLElement {
  const container = document.createElement('div');
  container.className = 'citation';
  container.append(textElement('blockquote', citation.quote));
  container.append(textElement('p', [citation.source === 'visible-page' ? 'Current page · Explicit text' : 'Structured page data · Verify against the displayed role', timingLabels[citation.timing]].filter(Boolean).join(' · '), 'source'));
  return container;
}

function findingView(name: string, finding: Finding<SponsorshipStatus | TrainingStatus>, field: string): HTMLElement {
  const details = document.createElement('details');
  details.className = 'finding';
  details.dataset.finding = field;
  details.dataset.status = finding.status;
  details.open = false;
  const summary = document.createElement('summary');
  const label = labels[finding.status];
  const futureOnly = field === 'sponsorship' && finding.citations.length > 0 && finding.citations.every(citation => citation.timing === 'future');
  const nowOnly = field === 'sponsorship' && finding.citations.length > 0 && finding.citations.every(citation => citation.timing === 'now');
  summary.append(textElement('span', name), textElement('span', `${label}${futureOnly ? ' · future only' : nowOnly ? ' · now only' : ''}`, 'finding-value'));
  details.append(summary);
  if (finding.requiresReview) details.append(textElement('p', 'Needs review', 'review-label'));
  details.append(textElement('p', finding.explanation, 'explanation'));
  finding.citations.forEach(citation => details.append(citationView(citation)));
  return details;
}

export function renderFindings(container: HTMLElement, interpretation: Interpretation, source?: { url: string; scannedAt: string }): void {
  const nodes: HTMLElement[] = [];
  if (interpretation.restrictions.length) {
    const restrictions = document.createElement('section');
    restrictions.className = 'restrictions';
    restrictions.append(textElement('h2', 'Stated requirements'));
    interpretation.restrictions.forEach(restriction => restriction.citations.forEach(citation => restrictions.append(citationView(citation))));
    nodes.push(restrictions);
  }
  nodes.push(findingView('Visa sponsorship', interpretation.sponsorship, 'sponsorship'));
  const { now, future } = interpretation.sponsorshipByTiming;
  if (now.citations.length || future.citations.length) nodes.push(textElement('p', `Current: ${labels[now.status]} · Future: ${labels[future.status]}`, 'timing-summary'));
  nodes.push(findingView('CPT', interpretation.cpt, 'cpt'), findingView('OPT', interpretation.opt, 'opt'));
  if (interpretation.context.length) {
    const details = document.createElement('details');
    details.className = 'context';
    details.append(textElement('summary', 'Other relevant wording'));
    const reasons = {
      question: 'Application question — does not establish policy',
      historical: 'Historical wording — does not confirm this role',
      company: 'Company-wide wording — applicability to this role is unconfirmed',
      'other-role': 'Another role — excluded from this role’s findings',
      unrecognized: 'Unclassified wording — review the original text',
    };
    interpretation.context.forEach(item => {
      details.append(textElement('p', reasons[item.kind], 'explanation'), citationView(item.citation));
    });
    nodes.push(details);
  }
  if (source) {
    const url = new URL(source.url);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      const reference = textElement('p', '', 'source');
      const link = document.createElement('a');
      link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'View source posting';
      const time = document.createElement('time');
      time.dateTime = source.scannedAt; time.textContent = new Date(source.scannedAt).toLocaleString();
      reference.append(link, document.createTextNode(' · Scanned '), time);
      nodes.push(reference);
    }
  }
  container.replaceChildren(...nodes);
}
