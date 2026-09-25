import type { ScanResult } from './types';

export const RESEARCH_ORIGIN = 'http://127.0.0.1:4318';
export const RESEARCH_PERMISSION = `${RESEARCH_ORIGIN}/*`;
export interface ResearchRequest { url: string; title: string; employer: string; identifier: string | null; location: string | null }
export interface ResearchSource {
  kind: 'vacancy' | 'company-policy' | 'historical' | 'lead';
  url: string; title: string; employer: string; retrievedAt: string;
  publishedAt: string | null; location: string | null; scope: string;
  quotes: string[]; summary: string;
}
export interface ResearchResult {
  request: ResearchRequest; researchedAt: string; expiresAt: string;
  state: 'complete' | 'unmatched' | 'unavailable'; sources: ResearchSource[]; notes: string[];
}
export interface ResearchView {
  state: 'off' | 'idle' | 'pending' | 'ready' | 'error';
  message: string; result?: ResearchResult;
}
export function publicUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    url.search = ''; url.hash = '';
    return url.href;
  } catch { return null; }
}
export function parseResearchRequest(value: unknown): ResearchRequest | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const valid = (x: unknown, max: number): x is string => typeof x === 'string' && x.trim().length > 0 && x.length <= max && !/[\u0000-\u001f]/.test(x);
  if (!valid(v.url, 2048) || !valid(v.title, 200) || !valid(v.employer, 200)) return null;
  const url = publicUrl(v.url);
  if (!url) return null;
  if (v.identifier !== null && !valid(v.identifier, 200)) return null;
  if (v.location !== null && !valid(v.location, 300)) return null;
  return { url, title: v.title.trim(), employer: v.employer.trim(), identifier: v.identifier as string | null, location: v.location as string | null };
}
export function researchRequest(scan: ScanResult | null): ResearchRequest | null {
  if (!scan?.role?.employer) return null;
  const { title, employer, identifier, location } = scan.role;
  return parseResearchRequest({ url: scan.url, title, employer, identifier, location });
}
export const requestIdentity = (request: ResearchRequest) => JSON.stringify([request.url, request.title, request.employer, request.identifier, request.location]);
export async function researchKey(request: ResearchRequest): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(requestIdentity(request)));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
export function parseResearchResult(value: unknown, request: ResearchRequest): ResearchResult | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as ResearchResult;
  const parsed = parseResearchRequest(v.request);
  const text = (s: unknown, max = 2000): s is string => typeof s === 'string' && s.length <= max;
  const date = (s: unknown) => typeof s === 'string' && Number.isFinite(Date.parse(s));
  if (!parsed || requestIdentity(parsed) !== requestIdentity(request) || !date(v.researchedAt) || !date(v.expiresAt)
    || !['complete', 'unmatched', 'unavailable'].includes(v.state) || !Array.isArray(v.sources) || v.sources.length > 12
    || !Array.isArray(v.notes) || v.notes.length > 12 || !v.notes.every(s => text(s))) return null;
  if (!v.sources.every(s => s && ['vacancy', 'company-policy', 'historical', 'lead'].includes(s.kind)
    && text(s.url, 2048) && publicUrl(s.url) && new URL(s.url).protocol === 'https:'
    && text(s.title, 300) && text(s.employer, 200) && date(s.retrievedAt) && (s.publishedAt === null || text(s.publishedAt, 100))
    && (s.location === null || text(s.location, 300)) && text(s.scope) && text(s.summary)
    && Array.isArray(s.quotes) && s.quotes.length <= 6 && s.quotes.every(q => text(q, 1200)))) return null;
  return v;
}
