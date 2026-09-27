import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { scanPage } from '../src/scanner';
import { overviewCandidate, recoverOverview } from '../src/overview-recovery';
import { ScanController } from '../src/controller';
import { DEFAULT_SETTINGS } from '../src/settings';
import type { OverviewOutcome } from '../src/overview-recovery';
import { reportData } from '../src/report';

const id = '12345678-1234-1234-1234-123456789abc';
const applicationUrl = `https://jobs.ashbyhq.com/example/${id}/application`;
const overviewUrl = `https://jobs.ashbyhq.com/example/${id}`;
const applicationHtml = `<main><h1>Apply for Engineer Intern</h1><h2>Responsibilities</h2><form><label>Resume<input type="file"></label><label>Will you require sponsorship?<input></label></form></main>`;
const overviewHtml = (title = 'Engineer Intern') => `<main><h1>${title}</h1><h2>Responsibilities</h2><p>Build software with our engineering team, review code, and collaborate across product groups.</p><h2>Qualifications</h2><p>Current student with programming experience and an interest in reliable systems.</p><p>Visa sponsorship is not available for this internship.</p><a>Apply now</a></main>`;
const parse = (html: string, url: string) => new JSDOM(html, { url }).window.document;
const application = () => scanPage(parse(applicationHtml, applicationUrl), applicationUrl);
const fetchHtml = (html: string, url = overviewUrl): typeof fetch => (async () => ({
  ok: true, url, headers: new Headers({ 'content-type': 'text/html' }), text: async () => html,
})) as unknown as typeof fetch;
const parseHtml = (html: string) => parse(html, overviewUrl);

test('recovers exact official overview and attributes its evidence', async () => {
  const result = application();
  assert.equal(result.role?.completeness, 'incomplete');
  assert.equal(overviewCandidate(result)?.href, overviewUrl);
  const outcome = await recoverOverview(result, new AbortController().signal, fetchHtml(overviewHtml()), parseHtml);
  assert.equal(outcome.kind, 'recovered');
  if (outcome.kind !== 'recovered') return;
  assert.equal(outcome.result.role?.completeness, 'description-found');
  assert.equal(outcome.result.interpretation?.sponsorship.status, 'unavailable');
  assert.ok(outcome.result.role?.evidence.some(block => block.source === 'official-overview' && block.sourceUrl === overviewUrl));
  assert.equal(outcome.result.role?.coverage?.sources.at(-1)?.url, overviewUrl);
  assert.ok(outcome.result.role?.coverage?.gaps.includes('displayed-overview-missing'));
});

test('rejects a different role and a redirected source', async () => {
  const result = application();
  const mismatch = await recoverOverview(result, new AbortController().signal, fetchHtml(overviewHtml('Product Manager')), parseHtml);
  assert.equal(mismatch.kind, 'mismatch');
  if (mismatch.kind === 'mismatch') assert.equal(mismatch.result.role?.completeness, 'incomplete');
  const redirected = await recoverOverview(result, new AbortController().signal, fetchHtml(overviewHtml(), 'https://other.example/job'), parseHtml);
  assert.equal(redirected.kind, 'unavailable');
});

test('only constructs an official same-origin candidate for the exact application path', () => {
  const result = application();
  assert.equal(overviewCandidate({ ...result, url: 'https://other.example/example/' + id + '/application' }), null);
  assert.equal(overviewCandidate({ ...result, url: overviewUrl }), null);
  assert.equal(overviewCandidate({ ...result, role: { ...result.role!, identifier: 'different-id' } }), null);
});

test('late overview evidence is discarded after navigation or pause', async () => {
  const dom = new JSDOM(applicationHtml, { url: applicationUrl });
  let resolve!: (outcome: OverviewOutcome) => void;
  const pending = new Promise<OverviewOutcome>(done => { resolve = done; });
  const controller = new ScanController(dom.window.document, dom.window as unknown as Window, DEFAULT_SETTINGS, () => pending);
  try {
    const initial = controller.getSnapshot().result!;
    assert.equal(initial.role?.completeness, 'incomplete');
    dom.window.history.pushState({}, '', `/example/${id}/another`);
    assert.equal(controller.getSnapshot().result, null);
    resolve({ kind: 'recovered', result: { ...initial, warnings: ['stale overview'] } });
    await Promise.resolve();
    assert.equal(controller.getSnapshot().result, null);
    controller.updateSettings({ paused: true, disabledHosts: [] });
    assert.equal(controller.getSnapshot().state, 'paused');
  } finally { controller.dispose(); dom.window.close(); }
});

test('recovered overview excludes form answers and reports source kinds without URL secrets', async () => {
  const result = application();
  const html = overviewHtml().replace('</main>', '<form><label>Reference<input value="private-name"></label></form></main>');
  const outcome = await recoverOverview(result, new AbortController().signal, fetchHtml(html), parseHtml);
  assert.equal(outcome.kind, 'recovered');
  if (outcome.kind !== 'recovered') return;
  assert.ok(!outcome.result.role?.evidence.some(block => block.text.includes('private-name')));
  const report = reportData(outcome.result, 'test', 'Other problem');
  assert.ok(report.role?.descriptionSources.some(source => source.kind === 'official-overview'));
  assert.ok(!JSON.stringify(report).includes('private-name'));
});
