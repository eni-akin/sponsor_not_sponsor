import type { Citation, Interpretation, JobRecord } from './types';
import { mainDecision } from './main-decision';

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
  const source = citation.source === 'visible-page' ? 'Current page · Explicit text'
    : citation.source === 'embedded-frame' ? 'Embedded job frame · Explicit text'
      : citation.source === 'embedded-structured-data' ? 'Structured data in embedded frame · Verify against the displayed role'
      : citation.source === 'official-overview' ? 'Official job overview · Matched role'
        : 'Structured page data · Verify against the displayed role';
  container.append(textElement('p', [source, timingLabels[citation.timing]].filter(Boolean).join(' · '), 'source'));
  if (citation.sourceUrl) {
    const url = new URL(citation.sourceUrl);
    if (url.protocol === 'https:' && !url.username && !url.password) {
      const link = textElement('a', 'Open evidence source', 'source') as HTMLAnchorElement;
      link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
      container.append(link);
    }
  }
  return container;
}

function decisionView(role: JobRecord, interpretation: Interpretation): HTMLElement {
  const decision = mainDecision(role, interpretation);
  const details = document.createElement('details');
  details.className = 'finding';
  details.dataset.finding = 'main';
  details.dataset.status = decision.status;
  details.open = false;
  const summary = document.createElement('summary');
  summary.append(textElement('span', 'Main result'), textElement('span', decision.label, 'finding-value'));
  details.append(summary);
  details.append(textElement('p', decision.explanation, 'explanation'));
  decision.citations.forEach(citation => details.append(citationView(citation)));
  return details;
}

export function renderFindings(container: HTMLElement, role: JobRecord, interpretation: Interpretation, source?: { url: string; scannedAt: string }): void {
  const nodes: HTMLElement[] = [];
  if (interpretation.decision) nodes.push(textElement('p', interpretation.decision.message, 'source'));
  nodes.push(decisionView(role, interpretation));
  if (interpretation.context.length) {
    const details = document.createElement('details');
    details.className = 'context';
    details.append(textElement('summary', 'Other relevant wording'));
    const reasons = {
      question: 'Application question — does not establish policy',
      historical: 'Historical wording — does not confirm this role',
      company: 'Company-wide wording — applicability to this role is unconfirmed',
      'other-role': 'Another role — excluded from this role’s findings',
      'export-notice': 'Export-license information — no stated licensing obstacle',
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
