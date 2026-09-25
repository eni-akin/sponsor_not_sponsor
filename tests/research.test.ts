import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { parseResearchRequest, parseResearchResult, publicUrl, researchKey, researchRequest, type ResearchRequest, type ResearchResult } from '../src/research';
import { ResearchCoordinator, type ResearchStore } from '../src/research-coordinator';
import { ResearchClient } from '../src/research-client';
import { ResearchService, matchEmployer, validateEmployers, type Employer } from '../server/research-service';
import { allowedHost, publicAddress } from '../server/fetch-public';
import { scanPage } from '../src/scanner';
import { interpretJob } from '../src/interpreter';
import type { ScannerSnapshot } from '../src/types';

const request: ResearchRequest = { url: 'https://careers.example.test/jobs/42', title: 'Research Engineer', employer: 'Example Labs LLC', identifier: '42', location: 'Austin, TX, US' };
const employer: Employer = { name: request.employer, aliases: ['Example Laboratories LLC'], domains: ['example.test'], verificationUrl: 'https://example.test/about', verifiedAt: '2026-09-25T00:00:00Z', policies: [], history: [] };
const result = (r = request): ResearchResult => ({ request: r, researchedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400_000).toISOString(), state: 'complete', sources: [], notes: [] });
const html = (policy: string, id = '42', name = employer.name) => `<html><head><title>Research Engineer</title><script type="application/ld+json">${JSON.stringify({ '@type': 'JobPosting', title: request.title, identifier: { value: id }, hiringOrganization: { name } })}</script></head><body><main><h1>${request.title}</h1><h2>Responsibilities</h2><p>Develop reliable data services for our customers and work with teams to deliver research.</p><h2>Qualifications</h2><p>${policy}</p><a>Apply</a></main></body></html>`;
const store = (): ResearchStore => {
  const values = new Map<string, unknown>();
  return { get: async key => values.get(key), set: async (key, value) => { values.set(key, value); } };
};

test('research sends only allowlisted role metadata and strips URL credentials/query/fragment', () => {
  const parsed = parseResearchRequest({ ...request, url: request.url + '?token=PRIVATE#secret', evidence: 'PRIVATE ANSWER', apiKey: 'SECRET' });
  assert.deepEqual(parsed, request);
  assert.equal(publicUrl('https://user:secret@example.test/job'), null);
  assert.equal(publicUrl('javascript:alert(1)'), null);
  assert.equal(parseResearchRequest({ ...request, employer: '' }), null);
});

test('employer matching is exact and unique; no parent or subsidiary substitution', () => {
  assert.equal(matchEmployer('example labs llc', [employer]), employer);
  assert.equal(matchEmployer('Example Laboratories LLC', [employer]), employer);
  assert.equal(matchEmployer('Example Labs Inc', [employer]), null);
  assert.equal(matchEmployer('Example', [employer]), null);
  assert.equal(matchEmployer(employer.name, [employer, employer]), null);
  assert.throws(() => validateEmployers([employer, employer]), /unique/);
});

test('sources cannot use deceptive domains, private IPs, or invalid historical attribution', () => {
  assert.equal(allowedHost('example.test.evil.test', employer.domains), false);
  assert.equal(allowedHost('jobs.example.test', employer.domains), true);
  for (const ip of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.1.1', '172.20.1.1', '100.64.0.1', '::1', '::ffff:127.0.0.1', 'fc00::1']) assert.equal(publicAddress(ip), false, ip);
  assert.equal(publicAddress('8.8.8.8'), true);
  assert.throws(() => validateEmployers([{ ...employer, history: [{ employer: 'Other LLC', year: 2024, approvals: 2, sourceUrl: 'https://www.uscis.gov/data', retrievedAt: '2025-01-01', location: 'US', matchNote: 'Exact entity' }] }]), /historical/);
});

test('response validation rejects mismatched roles and executable source links', () => {
  assert.ok(parseResearchResult(result(), request));
  assert.equal(parseResearchResult(result({ ...request, identifier: '43' }), request), null);
  const malicious = { ...result(), sources: [{ kind: 'vacancy', url: 'javascript:alert(1)' }] };
  assert.equal(parseResearchResult(malicious, request), null);
});

test('coordinator deduplicates concurrent work and reuses cache after worker restart', async () => {
  const saved = store(); let calls = 0;
  const fetchResult = async () => { calls++; await new Promise(resolve => setTimeout(resolve, 10)); return result(); };
  const coordinator = new ResearchCoordinator(saved, fetchResult, async () => true);
  await Promise.all([coordinator.run(request), coordinator.run(request)]);
  assert.equal(calls, 1);
  const restarted = new ResearchCoordinator(saved, fetchResult, async () => true);
  assert.equal((await restarted.run(request)).state, 'ready');
  assert.equal(calls, 1);
});

test('pending lease survives worker restart and expires to permit recovery', async () => {
  const saved = store(); let now = Date.now(), calls = 0;
  await saved.set(`research:${await researchKey(request)}`, { leaseUntil: now + 25_000 });
  const coordinator = new ResearchCoordinator(saved, async () => { calls++; return result(); }, async () => true, () => now);
  assert.equal((await coordinator.run(request)).state, 'pending'); assert.equal(calls, 0);
  now += 26_000;
  assert.equal((await coordinator.run(request)).state, 'ready'); assert.equal(calls, 1);
});

test('disabled research sends nothing and late results are rejected after opt-out', async () => {
  let enabled = false, calls = 0;
  const coordinator = new ResearchCoordinator(store(), async () => { calls++; enabled = false; return result(); }, async () => enabled);
  assert.equal((await coordinator.run(request)).state, 'error'); assert.equal(calls, 0);
  enabled = true;
  assert.equal((await coordinator.run(request)).state, 'error'); assert.equal(calls, 1);
});

test('expired cache is refreshed and network errors release the request lease', async () => {
  const saved = store(); let fail = true;
  await saved.set(`research:${await researchKey(request)}`, { result: { ...result(), expiresAt: '2000-01-01T00:00:00Z' } });
  const coordinator = new ResearchCoordinator(saved, async () => { if (fail) throw new Error('network'); return result(); }, async () => true);
  assert.equal((await coordinator.run(request)).state, 'error');
  fail = false; assert.equal((await coordinator.run(request)).state, 'ready');
});

test('research client discards results for a previous role and clears on pause', async () => {
  const dom = new JSDOM(html('We value collaboration.'), { url: request.url });
  try {
    const scan = scanPage(dom.window.document, request.url); scan.interpretation = interpretJob(scan.role!);
    const snapshot: ScannerSnapshot = { state: 'ready', hostname: 'careers.example.test', result: scan };
    const responses: ((reply: { state: 'ready'; result: ResearchResult }) => void)[] = [];
    const client = new ResearchClient(() => new Promise(resolve => responses.push(resolve)), () => {});
    client.setEnabled(true); client.update(snapshot);
    const first = researchRequest(scan)!;
    const next = structuredClone(snapshot); next.result!.role!.identifier = '43'; next.result!.role!.key = 'next';
    client.update(next);
    responses[0]!({ state: 'ready', result: result(first) }); await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(client.view.state, 'pending');
    client.update({ ...snapshot, state: 'paused', result: null });
    responses[1]!({ state: 'ready', result: result(researchRequest(next.result)!) }); await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(client.view.state, 'idle'); assert.equal(client.view.result, undefined);
  } finally { dom.window.close(); }
});

test('service reads cited official evidence and reuses a persistent disk cache', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sns-research-')); let calls = 0;
  const fetchPage = async (url: string) => { calls++; return { url, contentType: 'text/html', text: html('Visa sponsorship is available. Only for senior roles.') }; };
  try {
    const service = new ResearchService([employer], directory, undefined, fetchPage);
    const first = await service.research(request);
    assert.equal(first.sources[0]?.kind, 'vacancy');
    assert.match(first.sources[0]!.summary, /conditional/);
    assert.deepEqual(first.sources[0]?.quotes, ['Visa sponsorship is available. Only for senior roles.']);
    assert.equal((await new ResearchService([employer], directory, undefined, fetchPage).research(request)).researchedAt, first.researchedAt);
    assert.equal(calls, 1);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('a different role ID or subsidiary never becomes matched vacancy evidence', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sns-research-'));
  try {
    for (const [id, name] of [['43', employer.name], ['42', 'Example Parent Inc']] as const) {
      const service = new ResearchService([employer], join(directory, id + name), undefined, async url => ({ url, contentType: 'text/html', text: html('Sponsorship is available.', id, name) }));
      assert.equal((await service.research(request)).sources.length, 0);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('company policy and imported history remain separately scoped; zero does not mean refusal', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sns-research-'));
  const configured = { ...employer, policies: [{ url: 'https://example.test/faq', location: 'US', scope: 'Graduate program only' }],
    history: [{ employer: employer.name, year: 2024, approvals: 0, sourceUrl: 'https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub', retrievedAt: '2025-02-01T00:00:00Z', location: 'TX', matchNote: 'Exact legal entity and city; reviewed import' }] };
  try {
    validateEmployers([configured]);
    const service = new ResearchService([configured], directory, undefined, async url => ({ url, contentType: 'text/html', text: url.endsWith('/faq') ? '<main><h1>Graduate FAQ</h1><p>Sponsorship is available only for eligible graduate hires.</p></main>' : html('We value teamwork.') }));
    const found = await service.research(request);
    assert.deepEqual(found.sources.map(s => s.kind), ['company-policy', 'historical']);
    assert.equal(found.sources[0]?.scope, 'Graduate program only');
    assert.equal(found.sources[1]?.retrievedAt, '2025-02-01T00:00:00Z');
    assert.match(found.sources[1]!.summary, /does not confirm sponsorship/);
    assert.equal('interpretation' in found, false);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('search snippets are not evidence and foreign-domain search hits are never fetched', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sns-research-')); const fetched: string[] = [];
  try {
    const service = new ResearchService([employer], directory, async () => ['https://untrusted.test/jobs/42', 'http://127.0.0.1/private'], async url => { fetched.push(url); return { url, contentType: 'text/html', text: html('Nothing about sponsorship here.') }; });
    const found = await service.research(request);
    assert.deepEqual(fetched, [request.url]);
    assert.equal(found.sources[0]?.quotes[0], 'Nothing about sponsorship here.');
    assert.match(found.sources[0]!.summary, /unclear/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('unmatched employers and unreadable official sources remain explicit uncertainty', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sns-research-')); let calls = 0;
  try {
    const service = new ResearchService([employer], directory, undefined, async () => { calls++; throw new Error('blocked'); });
    assert.equal((await service.research({ ...request, employer: 'Other Employer' })).state, 'unmatched'); assert.equal(calls, 0);
    const failed = await service.research(request);
    assert.equal(failed.state, 'unavailable');
    assert.ok(failed.notes.some(note => note.includes('does not establish a refusal')));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('official policy discovery fetches the page and never turns another vacancy into company policy', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sns-research-'));
  try {
    const service = new ResearchService([employer], directory, async query => query.includes('FAQ') ? ['https://example.test/hiring-faq', 'https://example.test/hiring/other-job'] : [],
      async url => ({ url, contentType: 'text/html', text: url.endsWith('hiring-faq') ? '<main><h1>Hiring FAQ</h1><p>Visa sponsorship may be considered for approved programs.</p></main>' : html('Visa sponsorship is available.', '99') }));
    const found = await service.research(request);
    assert.equal(found.sources.length, 1);
    assert.equal(found.sources[0]?.kind, 'company-policy');
    assert.equal(found.sources[0]?.url, 'https://example.test/hiring-faq');
    assert.ok(found.notes.some(note => note.includes('Historical sponsorship was not checked')));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
