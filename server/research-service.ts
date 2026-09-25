import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { scanPage, extractBlocks } from '../src/scanner';
import { interpretJob } from '../src/interpreter';
import { publicUrl, requestIdentity, parseResearchResult, type ResearchRequest, type ResearchResult, type ResearchSource } from '../src/research';
import { allowedHost, fetchPublic, type FetchPage } from './fetch-public';

export interface Employer {
  name: string; aliases: string[]; domains: string[]; verificationUrl: string; verifiedAt: string;
  policies: { url: string; location: string | null; scope: string }[];
  history: { employer: string; year: number; approvals: number; sourceUrl: string; retrievedAt: string; location: string; matchNote: string }[];
}
export const normalizeEmployer = (name: string) => name.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
export function matchEmployer(name: string, employers: Employer[]): Employer | null {
  const matches = employers.filter(e => [e.name, ...e.aliases].some(alias => normalizeEmployer(alias) === normalizeEmployer(name)));
  return matches.length === 1 ? matches[0]! : null;
}
export function validateEmployers(value: unknown): Employer[] {
  if (!Array.isArray(value) || value.length > 500) throw new Error('Employer registry must be an array (maximum 500)');
  const aliases = new Set<string>();
  for (const e of value as Employer[]) {
    if (!e || typeof e.name !== 'string' || !e.name.trim() || e.name.length > 200 || !Array.isArray(e.aliases)
      || !e.aliases.every(s => typeof s === 'string' && s.length > 0 && s.length <= 200)
      || !Array.isArray(e.domains) || !e.domains.length || e.domains.length > 10
      || !e.domains.every(d => typeof d === 'string' && /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(d) && !d.includes('..'))
      || !publicUrl(e.verificationUrl) || new URL(e.verificationUrl).protocol !== 'https:' || !Number.isFinite(Date.parse(e.verifiedAt))
      || !Array.isArray(e.policies) || e.policies.length > 5 || !Array.isArray(e.history) || e.history.length > 10) throw new Error('Invalid employer registry entry');
    for (const name of [e.name, ...e.aliases]) {
      const key = normalizeEmployer(name);
      if (aliases.has(key)) throw new Error('Employer names/aliases must be unique; do not collapse subsidiaries');
      aliases.add(key);
    }
    for (const p of e.policies) if (!publicUrl(p.url) || new URL(p.url).protocol !== 'https:' || !allowedHost(new URL(p.url).hostname, e.domains)
      || typeof p.scope !== 'string' || p.scope.length > 500 || (p.location !== null && (typeof p.location !== 'string' || p.location.length > 300))) throw new Error('Invalid policy source');
    for (const h of e.history) if (h.employer !== e.name || !Number.isInteger(h.year) || h.year < 2000 || h.year > new Date().getUTCFullYear()
      || !Number.isInteger(h.approvals) || h.approvals < 0 || !publicUrl(h.sourceUrl) || new URL(h.sourceUrl).protocol !== 'https:'
      || !allowedHost(new URL(h.sourceUrl).hostname, ['uscis.gov']) || !Number.isFinite(Date.parse(h.retrievedAt))
      || typeof h.location !== 'string' || typeof h.matchNote !== 'string' || !h.matchNote.trim()) throw new Error('Invalid historical record');
  }
  return value as Employer[];
}

export type Search = (query: string, signal: AbortSignal) => Promise<string[]>;
export function braveSearch(key: string): Search {
  return async (query, signal) => {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.search = new URLSearchParams({ q: query.slice(0, 600), count: '5', country: 'US', search_lang: 'en' }).toString();
    const response = await fetch(url, { signal, redirect: 'error', headers: { Accept: 'application/json', 'X-Subscription-Token': key } });
    if (!response.ok) throw new Error('Search provider unavailable');
    const data = await response.json() as { web?: { results?: { url?: string }[] } };
    return (data.web?.results ?? []).map(item => item.url).filter((s): s is string => typeof s === 'string').slice(0, 5);
  };
}

function readSource(html: string, url: string, request: ResearchRequest, employer: Employer, policy?: Employer['policies'][number]): ResearchSource | null {
  const dom = new JSDOM(html, { url }); // No scripts or external resources execute.
  try {
    const doc = dom.window.document;
    const scan = scanPage(doc, url);
    const role = scan.role;
    const sameTitle = role?.title.toLowerCase().trim() === request.title.toLowerCase().trim();
    const sameEmployer = role?.employer && matchEmployer(role.employer, [employer]);
    const sameId = request.identifier && role?.identifier === request.identifier;
    const sameAddress = publicUrl(url) === request.url;
    const sameVacancy = !!(role && sameTitle && sameEmployer && (request.identifier ? sameId : sameAddress));
    // Search hits for a different job are leads, never company-wide policy.
    if (!sameVacancy && (!policy || role)) return null;
    const blocks = sameVacancy ? role!.evidence : extractBlocks(doc.querySelector('main,[role="main"]') ?? doc.body).blocks;
    const relevant = blocks.filter(block => block.kind !== 'application-question' && /\bsponsor(?:ship|ing|ed|s)?\b|\bcpt\b|\bopt\b|practical training|citizenship|work authorization/i.test(block.text));
    // Quote full short blocks; never clip a long condition into a misleading quote.
    const quotes = relevant.filter(block => block.text.length <= 1200).slice(0, 6).map(block => block.text);
    if (!quotes.length) return null;
    const finding = sameVacancy ? interpretJob(role!).sponsorship.status : null;
    return { kind: sameVacancy ? 'vacancy' : 'company-policy', url: publicUrl(url)!, title: (doc.title || employer.name).slice(0, 300), employer: employer.name,
      retrievedAt: new Date().toISOString(), publishedAt: null, location: sameVacancy ? role!.location : policy!.location,
      scope: sameVacancy ? 'Matched vacancy: employer and title, plus identifier or exact source address.' : policy!.scope,
      quotes, summary: sameVacancy ? `This source states sponsorship as ${finding}. Compare its wording with the current posting; it does not replace the page finding.`
        : 'Official company wording. Applicability to this vacancy is unconfirmed; read its program, location and other conditions.' };
  } finally { dom.window.close(); }
}

export class ResearchService {
  private inFlight = new Map<string, Promise<ResearchResult>>();
  private revision: string;
  constructor(private employers: Employer[], private cacheDir: string, private search?: Search, private fetchPage: FetchPage = fetchPublic) {
    this.revision = createHash('sha256').update(JSON.stringify(employers)).digest('hex');
  }
  async research(request: ResearchRequest): Promise<ResearchResult> {
    const key = createHash('sha256').update(`v1:${this.revision}:${!!this.search}:${requestIdentity(request)}`).digest('hex');
    if (this.inFlight.has(key)) return this.inFlight.get(key)!;
    const work = this.cached(key, request).finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, work); return work;
  }
  private async cached(key: string, request: ResearchRequest): Promise<ResearchResult> {
    await mkdir(this.cacheDir, { recursive: true, mode: 0o700 });
    const path = join(this.cacheDir, `${key}.json`);
    try {
      const saved = parseResearchResult(JSON.parse(await readFile(path, 'utf8')), request);
      if (saved && Date.parse(saved.expiresAt) > Date.now()) return saved;
    } catch { /* Missing/corrupt cache is a cache miss. */ }
    const result = await this.lookup(request);
    const temporary = `${path}.${crypto.randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(result), { mode: 0o600 }); await rename(temporary, path);
    // Bound disk retention; do not retain an unlimited browsing history.
    const files = (await readdir(this.cacheDir)).filter(name => /^[a-f0-9]{64}\.json$/.test(name));
    for (const name of files) {
      try { const entry = JSON.parse(await readFile(join(this.cacheDir, name), 'utf8')) as ResearchResult;
        if (Date.parse(entry.expiresAt) <= Date.now()) await unlink(join(this.cacheDir, name));
      } catch { /* A concurrent lookup may have removed an expired file. */ }
    }
    if (files.length > 200) for (const name of files.filter(name => name !== `${key}.json`).slice(0, files.length - 200)) await unlink(join(this.cacheDir, name)).catch(() => {});
    return result;
  }
  private async lookup(request: ResearchRequest): Promise<ResearchResult> {
    const employer = matchEmployer(request.employer, this.employers);
    const now = new Date();
    const result: ResearchResult = { request, researchedAt: now.toISOString(), expiresAt: new Date(+now + 86400_000).toISOString(), state: 'complete', sources: [], notes: [] };
    if (!employer) return { ...result, state: 'unmatched', notes: ['The employer has not been uniquely verified in the research service. No parent, subsidiary, or similarly named company was substituted.'] };
    const signal = AbortSignal.timeout(18_000);
    const candidates: { url: string; policy?: Employer['policies'][number] }[] = [];
    const discoveredPolicies: typeof candidates = [];
    if (new URL(request.url).protocol === 'https:' && allowedHost(new URL(request.url).hostname, employer.domains)) candidates.push({ url: request.url });
    // Look for the same vacancy first, then configured company policy. Search snippets
    // are discovery leads only; evidence must be read from the fetched source page.
    if (this.search) {
      try {
        const urls = await this.search(`${employer.name} ${request.title} ${request.identifier ?? ''} sponsorship ${employer.domains.map(d => `site:${d}`).join(' OR ')}`, signal);
        for (const raw of urls.slice(0, 3)) {
          const url = publicUrl(raw);
          if (url && new URL(url).protocol === 'https:' && allowedHost(new URL(url).hostname, employer.domains)) candidates.push({ url });
        }
        const policies = await this.search(`${employer.name} visa sponsorship CPT OPT hiring FAQ policy (${employer.domains.map(d => `site:${d}`).join(' OR ')})`, signal);
        for (const raw of policies) {
          const url = publicUrl(raw);
          if (url && new URL(url).protocol === 'https:' && allowedHost(new URL(url).hostname, employer.domains)
            && /(?:faq|benefits|immigration|sponsorship|hiring|polic)/i.test(new URL(url).pathname)) {
            discoveredPolicies.push({ url, policy: { url, location: null, scope: 'Discovered official hiring/policy page. Role, program and location applicability are unconfirmed.' } });
          }
        }
      } catch { result.notes.push('Search was unavailable. Direct official sources were still checked.'); }
    } else result.notes.push('Web search is not configured. Only the current official posting, configured policies, and imported history were checked.');
    candidates.push(...employer.policies.map(policy => ({ url: policy.url, policy })), ...discoveredPolicies.slice(0, 2));
    const seen = new Set<string>(); let failures = 0;
    for (const candidate of candidates.slice(0, 10)) {
      const identity = `${candidate.url}:${!!candidate.policy}`;
      if (seen.has(identity)) continue; seen.add(identity);
      try {
        const page = await this.fetchPage(candidate.url, employer.domains, signal);
        const source = readSource(page.text, page.url, request, employer, candidate.policy);
        if (source) result.sources.push(source);
      } catch { failures++; }
    }
    // Keep the response within the extension's source limit, retaining history.
    result.sources = result.sources.slice(0, 8);
    if (!employer.history.length) result.notes.push('No reviewed historical dataset is configured for this employer. Historical sponsorship was not checked.');
    for (const h of employer.history.slice(0, 3)) {
      // A zero count is never evidence of refusal. Imported data is not represented
      // as having been fetched today; preserve the actual retrieval date.
      result.sources.push({ kind: 'historical', url: h.sourceUrl, title: `USCIS H-1B employer data · FY ${h.year}`, employer: h.employer,
        retrievedAt: h.retrievedAt, publishedAt: `Fiscal year ${h.year}`, location: h.location,
        scope: `Historical entity match: ${h.matchNote}`, quotes: [],
        summary: `${h.approvals} approved petitions recorded for this employer in FY ${h.year}. Historical petition activity does not confirm sponsorship for this vacancy, CPT, or OPT acceptance.` });
    }
    if (failures) result.notes.push(`${failures} source(s) could not be read. Research is incomplete.`);
    if (!result.sources.length) result.notes.push('No verified relevant evidence was found. This does not establish a refusal to sponsor.');
    if (failures && !result.sources.length) { result.state = 'unavailable'; result.expiresAt = new Date(Date.now() + 60_000).toISOString(); }
    return result;
  }
}
