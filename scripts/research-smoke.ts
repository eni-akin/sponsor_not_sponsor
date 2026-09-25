import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, rm, writeFile, mkdir, realpath } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createResearchServer } from '../server/index';
import { ResearchService, type Employer } from '../server/research-service';
import { RESEARCH_PERMISSION } from '../src/research';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const directory = await mkdtemp(join(tmpdir(), 'sns-research-browser-'));
await cp('dist', join(directory, 'extension'), { recursive: true });
const extensionPath = await realpath(join(directory, 'extension'));
const manifest = JSON.parse(await readFile(join(extensionPath, 'manifest.json'), 'utf8'));
// Pregrant only the loopback test service in this disposable extension copy.
// The shipped manifest retains optional permission and explicit user opt-in.
manifest.host_permissions = [RESEARCH_PERMISSION];
await writeFile(join(extensionPath, 'manifest.json'), JSON.stringify(manifest));
const extensionId = createHash('sha256').update(extensionPath).digest('hex').slice(0, 32).replace(/[0-9a-f]/g, char => 'abcdefghijklmnop'[parseInt(char, 16)]!);
const html = await readFile('tests/fixtures/generic-job.html', 'utf8');
const fixtureServer = createServer((_request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(html); });
const employer: Employer = { name: 'Example Analytics', aliases: [], domains: ['example.test'], verificationUrl: 'https://example.test/about', verifiedAt: '2026-09-25T00:00:00Z',
  policies: [{ url: 'https://example.test/faq', location: 'US', scope: 'Research program only' }],
  history: [{ employer: 'Example Analytics', year: 2024, approvals: 3, sourceUrl: 'https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub', retrievedAt: '2025-01-01T00:00:00Z', location: 'IL', matchNote: 'Fictitious browser-test fixture, not actual USCIS data' }] };
let sourceReads = 0, requests = 0;
const service = new ResearchService([employer], join(directory, 'cache'), undefined, async url => {
  sourceReads++; return { url, contentType: 'text/html', text: '<main><h1>Research program FAQ</h1><p>Visa sponsorship is available only for approved research hires.</p></main>' };
});
const researchServer = createResearchServer({ research: async request => { requests++; return service.research(request); } }, extensionId);
let context: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | undefined;
try {
  await new Promise<void>((ok, fail) => { fixtureServer.once('error', fail); fixtureServer.listen(0, '127.0.0.1', ok); });
  await new Promise<void>((ok, fail) => { researchServer.once('error', fail); researchServer.listen(4318, '127.0.0.1', ok); });
  const address = fixtureServer.address() as { port: number };
  const origin = `http://127.0.0.1:${address.port}`;
  // A website cannot call the local research service or consume search credits.
  const denied = await fetch('http://127.0.0.1:4318/research', { method: 'POST', headers: { Origin: 'https://untrusted.test', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(denied.status, 403); assert.equal(requests, 0);
  context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`], viewport: { width: 420, height: 850 } });
  const page = await context.newPage(); await page.goto(`${origin}/job?private=DO_NOT_SEND`);
  const popup = await context.newPage(); await page.bringToFront(); await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.locator('#onboarding-done').click();
  await popup.waitForFunction(() => document.getElementById('status')!.textContent === 'Job posting detected');
  assert.equal(requests, 0);
  assert.match(await popup.locator('#research-results').innerText(), /research is off/i);
  await popup.locator('.research-settings > summary').click();
  await popup.locator('#research-enabled').check();
  await popup.waitForFunction(() => document.getElementById('research-results')!.textContent!.includes('Company research completed'));
  assert.equal(requests, 1); assert.equal(sourceReads, 1);
  assert.equal(await popup.locator('[data-finding="sponsorship"]').getAttribute('data-status'), 'unclear', 'Company policy must not promote the local finding');
  assert.match(await popup.locator('#research-results').innerText(), /current role unconfirmed/i);
  await mkdir('test-results', { recursive: true });
  await popup.locator('#research-results details').first().locator('summary').click();
  await popup.locator('#research-results blockquote').scrollIntoViewIfNeeded();
  await popup.screenshot({ path: 'test-results/research-sources.png' });
  const snapshot = await popup.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return chrome.tabs.sendMessage(tab!.id!, { type: 'GET_SCAN' });
  });
  assert.equal(snapshot.research.result.request.url, `${origin}/job`);
  assert.doesNotMatch(JSON.stringify(snapshot.research.result.request), /DO_NOT_SEND|evidence|answers/);
  const badge = page.locator('#sponsor-not-sponsor-ui #toggle');
  assert.match(await badge.innerText(), /unclear/i);
  await badge.click();
  assert.match(await page.locator('#sponsor-not-sponsor-ui #research').innerText(), /Historical evidence/);
  await page.keyboard.press('Escape');
  await popup.locator('#research-retry').click();
  await popup.waitForFunction(() => !((document.getElementById('research-retry') as HTMLButtonElement).disabled));
  assert.equal(requests, 1, 'Worker cache should satisfy retry');
  await popup.locator('#research-enabled').uncheck();
  await popup.waitForFunction(() => document.getElementById('research-results')!.textContent!.includes('research is off'));
  assert.doesNotMatch(await popup.locator('#research-results').innerText(), /approved petitions/);
  // Simulate an unavailable service on a new role; local analysis continues.
  await new Promise<void>(resolve => researchServer.close(() => resolve()));
  await page.locator('h1').evaluate(el => { el.textContent = 'Different Research Intern'; });
  await popup.locator('#research-enabled').check();
  await popup.waitForFunction(() => document.getElementById('research-results')!.textContent!.includes('unavailable'));
  assert.equal(await popup.locator('[data-finding="sponsorship"]').getAttribute('data-status'), 'unclear');
  await mkdir('test-results', { recursive: true });
  await popup.screenshot({ path: 'test-results/research-unavailable.png' });
  console.log('PASS: opt-in, real worker-to-service messaging, CORS rejection, source attribution, history separation, persistent cache, opt-out, and offline research without losing local findings. All remote evidence was a local test fixture.');
} finally {
  await context?.close();
  await Promise.all([fixtureServer, researchServer].map(server => new Promise<void>(resolve => server.close(() => resolve()))));
  await rm(directory, { recursive: true, force: true });
}
