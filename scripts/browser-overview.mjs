import assert from 'node:assert/strict';
import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const id = '12345678-1234-1234-1234-123456789abc';
const application = `https://jobs.ashbyhq.com/example/${id}/application`;
const overview = `https://jobs.ashbyhq.com/example/${id}`;
const applicationHtml = '<main><h1>Apply for Engineer Intern</h1><h2>Responsibilities</h2><form><label>Resume<input type="file"></label><label>Will you require sponsorship?<input></label></form></main>';
const overviewHtml = '<main><h1>Engineer Intern</h1><h2>Responsibilities</h2><p>Build software with our engineering team, review code, and collaborate across product groups.</p><h2>Qualifications</h2><p>Current student with programming experience and an interest in reliable systems.</p><p>Visa sponsorship is not available for this internship.</p><a>Apply now</a></main>';
let context;
try {
  const extensionPath = await realpath(process.env.EXTENSION_DIR ?? 'dist');
  context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`] });
  const fetched = [];
  await context.route('https://jobs.ashbyhq.com/**', route => {
    fetched.push(route.request().url());
    const url = route.request().url();
    return route.fulfill({ status: 200, contentType: 'text/html', body: url === application ? applicationHtml : url === overview ? overviewHtml : '' });
  });
  const page = await context.newPage();
  await page.goto(application);
  await page.waitForFunction(() => {
    const host = document.querySelector('#sponsor-not-sponsor-ui');
    return host?.shadowRoot?.getElementById('metadata')?.textContent?.includes('Description: official job overview');
  }, null, { timeout: 15000 });
  const observed = await page.evaluate(() => {
    const root = document.querySelector('#sponsor-not-sponsor-ui').shadowRoot;
    return { badge: root.getElementById('badge-text').textContent, metadata: root.getElementById('metadata').textContent,
      quote: root.querySelector('[data-finding="main"] blockquote')?.textContent,
      source: root.querySelector('[data-finding="main"] .source')?.textContent };
  });
  assert.ok(fetched.includes(overview), 'The matching overview was fetched');
  assert.match(observed.badge, /Explicit blocker found/);
  assert.match(observed.quote, /Visa sponsorship is not available/);
  assert.match(observed.source, /Official job overview/);
  console.log('Overview browser check passed: matching official description was fetched, cited, and interpreted.');
} finally { await context?.close(); }
