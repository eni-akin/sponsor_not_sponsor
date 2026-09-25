import type { ResearchView } from './research';

export function renderResearch(container: HTMLElement, view: ResearchView | undefined): void {
  container.replaceChildren();
  const text = (tag: string, value: string) => { const node = document.createElement(tag); node.textContent = value; return node; };
  container.append(text('h2', 'Company research'), text('p', view?.message ?? 'Company research is off. Enable it in the extension popup.'));
  if (!view?.result) return;
  const result = view.result;
  container.append(text('p', `Checked ${new Date(result.researchedAt).toLocaleString()}. Research does not change the posting’s badge or determine your eligibility.`));
  for (const source of result.sources) {
    const details = document.createElement('details'); details.className = 'finding';
    const labels = { vacancy: 'Matched official vacancy', 'company-policy': 'Company policy · applicability unconfirmed', historical: 'Historical evidence · current role unconfirmed', lead: 'Unverified lead' };
    details.append(text('summary', labels[source.kind]), text('p', source.summary));
    source.quotes.forEach(quote => details.append(text('blockquote', quote)));
    details.append(text('p', `${source.employer} · ${source.location ?? 'Location not established'} · ${source.scope}`));
    const link = document.createElement('a'); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = source.title || 'View source';
    details.append(link, text('p', `Retrieved ${new Date(source.retrievedAt).toLocaleString()}${source.publishedAt ? ` · ${source.publishedAt}` : ' · Publication date unknown'}`));
    container.append(details);
  }
  result.notes.forEach(note => container.append(text('p', note)));
}
