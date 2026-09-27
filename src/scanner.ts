import type { EvidenceBlock, ScanResult } from './types';

const EXCLUDED = 'script,style,noscript,nav,svg,iframe,input,textarea,select,button,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[data-sns-ignore],.related-jobs,.recommended-jobs,[data-recommended-jobs]';
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
export function extractBlocks(root: Element, skipForms = false, includeNotices = false): { blocks: EvidenceBlock[]; truncated: boolean } {
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
    if (!element || element.closest(EXCLUDED) || (skipForms && element.closest('form'))
      || (element.closest('aside,footer') && !(includeNotices || root.matches(DETAILS)))) continue;
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

function matchesPageIdentity(job: Record<string, unknown>, href: string): boolean {
  const page = new URL(href);
  const id = scalar(object(job.identifier).value) ?? scalar(job.identifier);
  if (page.hostname === 'jobs.ashbyhq.com' && id) return page.pathname.split('/')[2]?.toLowerCase() === id.toLowerCase();
  const publishedUrl = scalar(job.url);
  if (publishedUrl) {
    try {
      const published = new URL(publishedUrl);
      if (published.hostname === page.hostname && published.pathname !== page.pathname && !page.pathname.startsWith(`${published.pathname}/application`)) return false;
    } catch { return false; }
  }
  return true;
}

const GENERIC_TITLE = /^(careers?|jobs?|job (search|openings|opportunities|description)|open (roles|positions)|search (jobs|results)|join (us|our team)|apply( now)?|application|welcome|single position|work summary)$/i;
const ROLE_WORD = /\b(intern(ship)?|co[ -]?op|engineer|developer|scientist|analyst|designer|manager|associate|architect|specialist|technician|researcher|consultant|director|coordinator|programmer)\b/i;

function roleTitle(root: Element, jobs: Record<string, unknown>[] = []): string | null {
  const headings = [...root.querySelectorAll('h1,h2,[data-job-title],[itemprop="title"]')]
    .filter(element => visible(element) && !element.closest(EXCLUDED))
    .map(element => ({ element, text: normalize(extractBlocks(element).blocks.map(block => block.text).join(' ')) }))
    .filter(({ text }) => text && text.length <= 200 && !GENERIC_TITLE.test(text));
  const metadataMatches = [...new Set(headings.filter(({ text }) => jobs.some(job => titleKey(scalar(job.title) ?? '') === titleKey(text))).map(({ text }) => text))];
  if (metadataMatches.length === 1) return metadataMatches[0]!;
  if (metadataMatches.length > 1) return null;
  const employerNames = jobs.map(job => titleKey(scalar(object(job.hiringOrganization).name) ?? '')).filter(Boolean);
  const primary = [...new Set(headings.filter(({ element, text }) =>
    (element.matches('h1,[data-job-title],[itemprop="title"]')) && !employerNames.includes(titleKey(text)),
  ).map(({ text }) => text))];
  if (primary.length === 1 && ROLE_WORD.test(primary[0]!)) return primary[0]!;
  const roleHeadings = [...new Set(headings.filter(({ text }) => ROLE_WORD.test(text)).map(({ text }) => text))];
  if (roleHeadings.length === 1) return roleHeadings[0]!;
  // Preserve the generic path for job titles outside the common vocabulary.
  return primary.length === 1 && !roleHeadings.length ? primary[0]! : null;
}

function hasApply(root: Element): boolean {
  return [...root.querySelectorAll('a,button,input[type="submit"]')].some(element =>
    visible(element) && /\b(apply|submit application|i.m interested)\b/i.test(element.getAttribute('aria-label') ?? element.getAttribute('value') ?? element.textContent ?? ''),
  );
}

function descriptionSignals(text: string): number {
  return [ /\b(responsibilities|what you.ll do|duties|description)\b/i, /\b(qualifications|requirements|what you.ll bring|who we.re looking for)\b/i, /\b(benefits|salary|compensation|employment type)\b/i ].filter(pattern => pattern.test(text)).length;
}

function scanRoot(doc: Document, jobs: Record<string, unknown>[]): { root: Element; details: Element[] } {
  const candidates = [...doc.querySelectorAll(DETAILS)].filter(element => visible(element) && roleTitle(element, jobs));
  const details = candidates.filter(element => !candidates.some(other => other !== element && other.contains(element)));
  const main = doc.querySelector('main,[role="main"]');
  // Some career sites put their active job outside an unrelated or empty main.
  const root = details.length === 1 ? details[0]! : main && roleTitle(main, jobs) ? main : doc.body;
  return { root, details };
}

function readableFrame(frame: HTMLIFrameElement, parentUrl: string): { doc: Document; url: string } | null {
  if (!visible(frame)) return null;
  try {
    const url = frame.contentWindow?.location.href;
    const doc = frame.contentDocument;
    if (!url || !doc?.body || !/^https?:$/.test(new URL(url).protocol) || new URL(url).origin !== new URL(parentUrl).origin) return null;
    return { doc, url };
  } catch { return null; }
}

function embeddedJob(doc: Document, href: string, depth: number): ScanResult | null {
  if (depth >= 2) return null;
  const found: ScanResult[] = [];
  for (const frame of doc.querySelectorAll('iframe')) {
    const child = readableFrame(frame, href);
    if (!child) continue;
    const result = scanPage(child.doc, child.url, depth + 1);
    if (result.role) found.push(result);
  }
  if (!found.length) return null;
  if (found.length > 1) return { version: 1, url: href, scannedAt: new Date().toISOString(), kind: 'multiple-jobs', role: null,
    signals: ['Embedded job frames'], warnings: ['More than one embedded job was found; select a single vacancy.'] };
  const child = found[0]!;
  return { ...child, url: href, signals: [...child.signals, 'Job read from an embedded frame'],
    warnings: [...child.warnings, 'This job description was read from a same-origin embedded frame.'],
    role: { ...child.role!, evidence: child.role!.evidence.map(block => ({ ...block,
      source: block.source === 'visible-page' ? 'embedded-frame' as const : block.source,
      locator: `iframe:${new URL(child.url).pathname} > ${block.locator}` })) } };
}

/** Compare scanner inputs, not cosmetic DOM attributes or scrolling positions. */
export function pageInputFingerprint(doc: Document, depth = 0): string {
  if (!doc.body) return '';
  const { jobs } = structuredJobs(doc);
  const { root, details } = scanRoot(doc, jobs);
  return hash(JSON.stringify({
    title: roleTitle(root, jobs),
    detailTitles: details.map(detail => roleTitle(detail, jobs)),
    blocks: extractBlocks(root).blocks.map(block => [block.text, block.kind]),
    apply: hasApply(root),
    forms: [...root.querySelectorAll('form,iframe')].filter(visible).map(element => element.tagName),
    cards: [...root.querySelectorAll('article,[data-job-card],.job-card')].filter(visible).map(element => [!!element.querySelector('h2,h3,[data-job-title]'), hasApply(element)]),
    metadata: [...doc.querySelectorAll('script[type="application/ld+json"]')].map(element => element.textContent),
    embedded: depth < 2 ? [...doc.querySelectorAll('iframe')].map(frame => {
      const child = readableFrame(frame, doc.URL);
      return child ? [child.url, pageInputFingerprint(child.doc, depth + 1)] : null;
    }) : [],
  }));
}

/** Deliberately conservative: ambiguity produces no combined vacancy record. */
export function scanPage(doc: Document, href: string, depth = 0): ScanResult {
  const result: ScanResult = { version: 1, url: href, scannedAt: new Date().toISOString(), kind: 'non-job', role: null, signals: [], warnings: [] };
  if (!doc.body) return { ...result, kind: 'unreadable', warnings: ['The page body is not available.'] };
  const { jobs, malformed } = structuredJobs(doc);
  if (malformed) result.warnings.push('Some structured page data could not be read.');
  // Prefer a single explicit detail panel over a surrounding list of vacancies.
  const { root, details } = scanRoot(doc, jobs);
  const title = roleTitle(root, jobs);
  const extracted = extractBlocks(root);
  const text = extracted.blocks.map(block => block.text).join('\n');
  const listCards = [...root.querySelectorAll('article,[data-job-card],.job-card')].filter(element => visible(element) && element.querySelector('h2,h3,[data-job-title]') && hasApply(element));
  const matching = title ? jobs.filter(job => titleKey(scalar(job.title) ?? '') === titleKey(title) && matchesPageIdentity(job, href)) : [];
  const structured = matching.length === 1 ? matching[0] : undefined;
  if (jobs.length) result.signals.push('Structured JobPosting data');
  if (/\b(jobs?|careers?|apply|positions?)\b/i.test(new URL(href).pathname)) result.signals.push('Job-related page address (supporting signal only)');
  if ((jobs.length > 1 && !structured) || listCards.length > 1 || details.length > 1) {
    result.kind = 'multiple-jobs';
    result.warnings.push('Select a single role with a distinct detail panel to avoid mixing vacancies.');
    return result;
  }
  if (!title) {
    const embedded = embeddedJob(doc, href, depth);
    if (embedded) return embedded;
    const inaccessibleJobFrame = [...doc.querySelectorAll('iframe')].some(frame => {
      if (!visible(frame) || readableFrame(frame, href)) return false;
      try { const url = new URL(frame.src); return /^https?:$/.test(url.protocol) && /\b(job|jobs|career|careers|apply|icims)\b/i.test(`${url.hostname}${url.pathname}`); }
      catch { return false; }
    });
    if (inaccessibleJobFrame) {
      result.kind = 'unreadable';
      result.warnings.push('A visible embedded job could not be read from this page. Open the job frame directly if possible.');
      return result;
    }
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
  const ashbyApplication = new URL(href).hostname === 'jobs.ashbyhq.com' && /\/application\/?$/.test(new URL(href).pathname);
  const explicitlyApplying = /^(apply (now )?(for|to)|application for)\b/i.test(title);
  const looksLikeJob = !!structured || (sections >= 2 && apply);
  if (!looksLikeJob && !((application || ashbyApplication) && (explicitlyApplying || sections >= 1))) return embeddedJob(doc, href, depth) ?? result;
  result.kind = application || ashbyApplication ? 'job-application' : 'job-posting';
  result.signals.push('Unique visible role title');
  if (apply) result.signals.push('Apply action');
  if (sections) result.signals.push(`${sections} job-description section signals`);
  if (application) result.signals.push('Application form wording');
  if (ashbyApplication) result.signals.push('Ashby application address');
  if (jobs.length && !structured) result.warnings.push('Structured data did not uniquely match the displayed role and was ignored.');
  if (extracted.truncated) result.warnings.push('The page is unusually large; extracted text is incomplete.');
  const evidence = extracted.blocks;
  const descriptionText = extractBlocks(root, true).blocks.map(block => block.text).join('\n');
  const hasVisibleDescription = ashbyApplication ? false : application
    ? descriptionSignals(descriptionText) >= 2 && descriptionText.length >= 500
    : sections >= 1 && text.length >= 100;
  // Application forms often contain a full, matching JobPosting description even
  // when the visible form itself has no overview. Keep its source explicit.
  let hasStructuredDescription = false;
  if (structured && typeof structured.description === 'string') {
    const detached = doc.implementation.createHTMLDocument('');
    detached.body.innerHTML = structured.description;
    const structuredExtraction = extractBlocks(detached.body, false, true);
    const structuredText = structuredExtraction.blocks;
    const plain = structuredText.map(block => block.text).join(' ');
    hasStructuredDescription = plain.length >= 300 && !structuredExtraction.truncated;
    const visible = normalize(text).toLowerCase();
    const missing = structuredText.filter(block => block.text.length > 20 && !visible.includes(normalize(block.text).toLowerCase()));
    if (hasStructuredDescription && missing.length) {
      evidence.push(...missing.map((block, index): EvidenceBlock =>
        ({ ...block, id: `structured-${index}-${hash(block.text)}`, source: 'structured-data', locator: 'JobPosting.description' })));
      result.warnings.push('Additional description read from matching structured job data on this page; check its source when reviewing a finding.');
    } else if (!hasStructuredDescription && !hasVisibleDescription && structuredText.length) {
      evidence.push(...structuredText.map((block, index): EvidenceBlock =>
        ({ ...block, id: `structured-${index}-${hash(block.text)}`, source: 'structured-data', locator: 'JobPosting.description' })));
      result.warnings.push('Partial description comes from structured page data; verify it against the displayed vacancy.');
    }
    if (structuredExtraction.truncated) result.warnings.push('Structured job description was truncated.');
  }
  if (root.querySelector('iframe')) result.warnings.push('Embedded form content is not scanned in this preview.');
  if (!hasVisibleDescription && !hasStructuredDescription) result.warnings.push('The job description is incomplete. Findings are not carried over from other pages.');
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
    completeness: (hasVisibleDescription || hasStructuredDescription) && !extracted.truncated ? 'description-found' : 'incomplete',
  };
  return result;
}
