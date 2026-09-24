import type { EvidenceBlock, ScanResult } from './types';

const EXCLUDED = 'script,style,noscript,nav,footer,aside,svg,iframe,input,textarea,select,button,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[data-sns-ignore],.related-jobs,.recommended-jobs,[data-recommended-jobs]';
const DETAILS = '[data-job-detail],#job-detail,#job-details,.job-details,.job-description,[itemtype="https://schema.org/JobPosting"],[itemtype="http://schema.org/JobPosting"],[role="tabpanel"]';
const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
const titleKey = (text: string) => normalize(text).toLowerCase().replace(/^(apply (now )?(for|to)|application for)\s*:?\s*/, '').replace(/[^a-z0-9]+/g, ' ').trim();
const scalar = (value: unknown): string | null => typeof value === 'string' || typeof value === 'number' ? normalize(String(value)).slice(0, 500) || null : null;
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function hash(text: string): string {
  let result = 2166136261;
  for (let i = 0; i < text.length; i++) result = Math.imul(result ^ text.charCodeAt(i), 16777619);
  return (result >>> 0).toString(36);
}

function visible(element: Element): boolean {
  for (let current: Element | null = element; current; current = current.parentElement) {
    if (current.matches('[hidden],[aria-hidden="true"]')) return false;
    const style = current.ownerDocument.defaultView?.getComputedStyle(current);
    if (style?.display === 'none' || style?.visibility === 'hidden' || style?.visibility === 'collapse') return false;
  }
  return true;
}

function locationHint(element: Element, root: Element): string {
  const path: string[] = [];
  for (let current: Element | null = element; current; current = current.parentElement) {
    const siblings = current.parentElement ? [...current.parentElement.children].filter(child => child.tagName === current!.tagName) : [current];
    path.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(current) + 1})`);
    if (current === root || path.length === 10) break;
  }
  return path.join(' > ');
}

/** Only text nodes are read. Form values, file names, and editable answers are excluded. */
export function extractBlocks(root: Element): { blocks: EvidenceBlock[]; truncated: boolean } {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, 5 /* SHOW_ELEMENT | SHOW_TEXT */);
  const groups: { element: Element; parts: string[] }[] = [];
  const visibility = new Map<Element, boolean>();
  let total = 0;
  let truncated = false;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === 1) {
      if ((node as Element).tagName === 'BR') groups.at(-1)?.parts.push('\n');
      continue;
    }
    const element = node.parentElement;
    if (!element || element.closest(EXCLUDED)) continue;
    let isVisible = visibility.get(element);
    if (isVisible === undefined) { isVisible = visible(element); visibility.set(element, isVisible); }
    if (!isVisible) continue;
    const text = node.textContent ?? '';
    if (!normalize(text)) {
      groups.at(-1)?.parts.push(text);
      continue;
    }
    total += text.length;
    if (total > 100_000 || groups.length >= 1000) { truncated = true; break; }
    const block = element.closest('p,li,h1,h2,h3,h4,label,legend,dt,dd,div,section,article,main,form,fieldset') ?? root;
    const previous = groups.at(-1);
    if (previous?.element === block) previous.parts.push(text);
    else groups.push({ element: block, parts: [text] });
  }
  return {
    truncated,
    blocks: groups.map(({ element, parts }, index) => {
      const text = normalize(parts.join(''));
      return {
        id: `page-${index}-${hash(text)}`,
        text,
        source: 'visible-page',
        kind: element.matches('label,legend') || text.endsWith('?') ? 'application-question' : 'text',
        locator: locationHint(element, root),
      };
    }),
  };
}

function structuredJobs(doc: Document): { jobs: Record<string, unknown>[]; malformed: boolean } {
  const jobs: Record<string, unknown>[] = [];
  let malformed = false;
  const visit = (value: unknown, depth = 0) => {
    if (depth > 20 || jobs.length > 100) return;
    if (Array.isArray(value)) { value.forEach(item => visit(item, depth + 1)); return; }
    if (!value || typeof value !== 'object') return;
    const item = object(value);
    const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
    if (types.some(type => typeof type === 'string' && /(^|[/#])JobPosting$/.test(type))) jobs.push(item);
    for (const [key, child] of Object.entries(item)) if (key !== '@context') visit(child, depth + 1);
  };
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const text = script.textContent ?? '';
      if (text.length > 1_000_000) { malformed = true; continue; }
      visit(JSON.parse(text));
    } catch { malformed = true; }
  }
  return { jobs, malformed };
}

function roleTitle(root: Element): string | null {
  const titles = [...root.querySelectorAll('h1,[data-job-title],[itemprop="title"]')]
    .filter(element => visible(element) && !element.closest(EXCLUDED))
    .map(element => normalize(extractBlocks(element).blocks.map(block => block.text).join(' ')))
    .filter(Boolean);
  const unique = [...new Set(titles)];
  if (unique.length !== 1) return null;
  const title = unique[0]!;
  if (title.length > 200 || /^(careers?|jobs?|job (search|openings|opportunities)|open (roles|positions)|search (jobs|results)|join (us|our team)|apply( now)?|application|welcome)$/i.test(title)) return null;
  return title;
}

function hasApply(root: Element): boolean {
  return [...root.querySelectorAll('a,button,input[type="submit"]')].some(element =>
    visible(element) && /\b(apply|submit application)\b/i.test(element.getAttribute('aria-label') ?? element.textContent ?? ''),
  );
}

function descriptionSignals(text: string): number {
  return [ /\b(responsibilities|what you.ll do|duties)\b/i, /\b(qualifications|requirements|what you.ll bring)\b/i, /\b(benefits|salary|compensation|employment type)\b/i ].filter(pattern => pattern.test(text)).length;
}

/** Deliberately conservative: ambiguity produces no combined vacancy record. */
export function scanPage(doc: Document, href: string): ScanResult {
  const result: ScanResult = { version: 1, url: href, scannedAt: new Date().toISOString(), kind: 'non-job', role: null, signals: [], warnings: [] };
  if (!doc.body) return { ...result, kind: 'unreadable', warnings: ['The page body is not available.'] };
  const { jobs, malformed } = structuredJobs(doc);
  if (malformed) result.warnings.push('Some structured page data could not be read.');
  // Prefer a single explicit detail panel over a surrounding list of vacancies.
  const detailCandidates = [...doc.querySelectorAll(DETAILS)].filter(element => visible(element) && roleTitle(element));
  const details = detailCandidates.filter(element => !detailCandidates.some(other => other !== element && other.contains(element)));
  const root = details.length === 1 ? details[0]! : doc.querySelector('main,[role="main"]') ?? doc.body;
  const title = roleTitle(root);
  const extracted = extractBlocks(root);
  const text = extracted.blocks.map(block => block.text).join('\n');
  const listCards = [...root.querySelectorAll('article,[data-job-card],.job-card')].filter(element => visible(element) && element.querySelector('h2,h3,[data-job-title]') && hasApply(element));
  const matching = title ? jobs.filter(job => titleKey(scalar(job.title) ?? '') === titleKey(title)) : [];
  const structured = matching.length === 1 ? matching[0] : undefined;
  if (jobs.length) result.signals.push('Structured JobPosting data');
  if (/\b(jobs?|careers?|apply|positions?)\b/i.test(new URL(href).pathname)) result.signals.push('Job-related page address (supporting signal only)');
  if ((jobs.length > 1 && !structured) || listCards.length > 1 || details.length > 1) {
    result.kind = 'multiple-jobs';
    result.warnings.push('Select a single role with a distinct detail panel to avoid mixing vacancies.');
    return result;
  }
  if (!title) {
    if (jobs.length || descriptionSignals(text) >= 2) {
      result.kind = 'unreadable';
      result.warnings.push('A unique visible role title could not be identified.');
    }
    return result;
  }
  const apply = hasApply(root);
  const sections = descriptionSignals(text);
  const application = [...root.querySelectorAll('form')].some(form => visible(form)
    && /\b(resume|résumé|cover letter|work authorization|sponsorship|applicant|submit application)\b/i.test(extractBlocks(form).blocks.map(block => block.text).join(' ')));
  const explicitlyApplying = /^(apply (now )?(for|to)|application for)\b/i.test(title);
  const looksLikeJob = !!structured || (sections >= 2 && apply);
  if (!looksLikeJob && !(application && (explicitlyApplying || sections >= 1))) return result;
  result.kind = application ? 'job-application' : 'job-posting';
  result.signals.push('Unique visible role title');
  if (apply) result.signals.push('Apply action');
  if (sections) result.signals.push(`${sections} job-description section signals`);
  if (application) result.signals.push('Application form wording');
  if (jobs.length && !structured) result.warnings.push('Structured data did not uniquely match the displayed role and was ignored.');
  if (extracted.truncated) result.warnings.push('The page is unusually large; extracted text is incomplete.');
  const evidence = extracted.blocks;
  const hasDescription = sections >= 1 && text.length >= 100;
  // Structured descriptions remain separately attributed, never silently mixed into visible text.
  if (!hasDescription && structured && typeof structured.description === 'string') {
    const detached = doc.implementation.createHTMLDocument('');
    detached.body.innerHTML = structured.description;
    const structuredText = extractBlocks(detached.body).blocks;
    evidence.push(...structuredText.map((block, index): EvidenceBlock => ({ ...block, id: `structured-${index}-${hash(block.text)}`, source: 'structured-data', locator: 'JobPosting.description' })));
    result.warnings.push('Description comes from structured page data; verify it against the displayed vacancy.');
    // Missing displayed content remains incomplete even when metadata supplies a description.
  }
  if (root.querySelector('iframe')) result.warnings.push('Embedded form content is not scanned in this preview.');
  if (!hasDescription) result.warnings.push('The displayed description is incomplete. Findings are not carried over from other pages.');
  const organization = object(structured?.hiringOrganization);
  const jobLocation = object(Array.isArray(structured?.jobLocation) ? structured.jobLocation[0] : structured?.jobLocation);
  const address = object(jobLocation.address);
  const location = [scalar(address.addressLocality), scalar(address.addressRegion), scalar(address.addressCountry) ?? scalar(object(address.addressCountry).name)].filter(Boolean).join(', ') || scalar(jobLocation.name);
  const identifier = scalar(object(structured?.identifier).value) ?? scalar(structured?.identifier);
  const employerElement = root.querySelector('[itemprop="hiringOrganization"],[data-employer]');
  const employer = scalar(organization.name) ?? (employerElement ? scalar(extractBlocks(employerElement).blocks.map(block => block.text).join(' ')) : null);
  const employmentTypes = (Array.isArray(structured?.employmentType) ? structured.employmentType : [structured?.employmentType]).map(scalar).filter((value): value is string => !!value);
  result.role = {
    key: hash(`${href}|${titleKey(title)}|${employer ?? ''}|${identifier ?? ''}`),
    title: title.replace(/^(apply (now )?(for|to)|application for)\s*:?\s*/i, ''),
    employer, location, identifier, employmentTypes, evidence,
    completeness: hasDescription && !extracted.truncated ? 'description-found' : 'incomplete',
  };
  return result;
}
