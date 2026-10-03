import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
let reloaded = false;
const child = createServer((_request, response) => {
  if (_request.url?.startsWith('/hrblock/')) {
    response.writeHead(302, { Location: _request.url.replace('/hrblock/jobs/', '/jobs/') });
    response.end();
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/html' });
  const policy = _request.url?.includes('replacement') ? (reloaded ? 'We cannot provide visa sponsorship.' : 'Employer sponsorship is unavailable for this role.') : 'Visa sponsorship is not available for this role.';
  response.end(`<main><h1>Engineer Intern</h1><h2>Responsibilities</h2><p>Build reliable tools for the team.</p><h2>Qualifications</h2><p>Current student with software experience.</p><p id="policy">${policy}</p><a href="/apply">Apply</a></main>`);
});
const listen = server => new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
await listen(child);
const widgetServer = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.end('<main><h1>Calendar</h1><p>Select a date for your appointment.</p></main>');
});
await listen(widgetServer);
const childUrl = `http://127.0.0.1:${child.address().port}/jobs/123/job`;
const embedUrl = childUrl.replace('/jobs/123/', '/hrblock/jobs/123/');
const widgetUrl = `http://127.0.0.1:${widgetServer.address().port}/widget`;
const parent = createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  const second = request.url?.includes('multiple') ? `<iframe src="${embedUrl.replace('/123/', '/124/')}" title="Other job"></iframe>` : '';
  const widget = request.url?.includes('widget') ? `<iframe src="${widgetUrl}"></iframe>` : '';
  const initial = request.url?.includes('delayed') ? '' : `<iframe id="job" src="${embedUrl}" title="Job"></iframe>`;
  const description = request.url?.includes('matching')
    ? `<h1>Engineer Intern</h1><h2>Responsibilities</h2><p>Build reliable tools for customers and collaborate with the engineering team.</p><h2>Qualifications</h2><p>Current student with software experience.</p><a href="${embedUrl}">Apply</a>` : '<h1>Careers</h1>';
  response.end(`<main>${description}${initial}${second}${widget}</main>`);
});
await listen(parent);
let context;
try {
  const extensionPath = await realpath(process.env.EXTENSION_DIR ?? 'dist');
  context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`] });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${parent.address().port}/careers`);
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent?.includes('Explicit blocker found'), null, { timeout: 15000 });
  const initial = await page.evaluate(() => {
    const root = document.querySelector('#sponsor-not-sponsor-ui').shadowRoot;
    return { source: root.querySelector('[data-finding="main"] .source')?.textContent,
      quote: root.querySelector('[data-finding="main"] blockquote')?.textContent };
  });
  assert.match(initial.source, /Embedded job frame/);
  assert.match(initial.quote, /not available/);
  await page.frameLocator('#job').locator('html').evaluate(() => history.pushState({}, '', `${location.pathname}?spa=updated`));
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.style.display === 'none' || !document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent?.includes('Explicit blocker found'), null, { timeout: 15000 });
  await page.frameLocator('#job').locator('#policy').evaluate(element => { element.textContent = 'Visa sponsorship is available for this role.'; });
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent?.includes('Sponsorship stated'), null, { timeout: 15000 });
  await page.locator('#job').evaluate((frame, url) => { frame.src = `${url}?replacement=1`; }, embedUrl);
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.querySelector('[data-finding="main"] blockquote')?.textContent?.includes('Employer sponsorship is unavailable'), null, { timeout: 15000 });
  reloaded = true;
  await page.frameLocator('#job').locator('html').evaluate(() => location.reload());
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.querySelector('[data-finding="main"] blockquote')?.textContent?.includes('We cannot provide visa sponsorship'), null, { timeout: 15000 });
  await page.locator('#job').evaluate(element => element.remove());
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.style.display === 'none' || !document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.querySelector('[data-finding="main"] blockquote')?.textContent?.includes('We cannot provide visa sponsorship'), null, { timeout: 15000 });
  await page.goto(`http://127.0.0.1:${parent.address().port}/careers-multiple`);
  await page.waitForTimeout(1000);
  const ambiguous = await page.evaluate(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent ?? '');
  assert.doesNotMatch(ambiguous, /Explicit blocker found|Sponsorship stated/);
  await page.goto(`http://127.0.0.1:${parent.address().port}/careers-widget`);
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent?.includes('Explicit blocker found'), null, { timeout: 15000 });
  await page.goto(`http://127.0.0.1:${parent.address().port}/careers-matching`);
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent?.includes('Explicit blocker found'), null, { timeout: 15000 });
  assert.match(await page.locator('#sponsor-not-sponsor-ui [data-finding="main"] .source').first().textContent(), /Embedded job frame/);
  await page.goto(`http://127.0.0.1:${parent.address().port}/careers-delayed`);
  await page.evaluate(url => {
    const frame = document.createElement('iframe'); frame.id = 'job'; frame.src = url; document.querySelector('main').append(frame);
  }, embedUrl);
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent?.includes('Explicit blocker found'), null, { timeout: 15000 });
  await page.goto(`http://127.0.0.1:${parent.address().port}/careers`);
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent?.includes('Explicit blocker found'), null, { timeout: 15000 });
  await page.locator('#sponsor-not-sponsor-ui #toggle').click();
  await page.locator('#sponsor-not-sponsor-ui #pause').click();
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.style.display === 'none', null, { timeout: 15000 });
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  await worker.evaluate(async () => { const { settings } = await chrome.storage.local.get('settings'); await chrome.storage.local.set({ settings: { ...settings, paused: false } }); });
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.style.display !== 'none' && document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent?.includes('Explicit blocker found'), null, { timeout: 15000 });
  await worker.evaluate(async () => { const { settings } = await chrome.storage.local.get('settings'); await chrome.storage.local.set({ settings: { ...settings, disabledHosts: ['127.0.0.1'] } }); });
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.style.display === 'none', null, { timeout: 15000 });
  await worker.evaluate(async () => { const { settings } = await chrome.storage.local.get('settings'); await chrome.storage.local.set({ settings: { ...settings, disabledHosts: [] } }); });
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.style.display !== 'none' && document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent?.includes('Explicit blocker found'), null, { timeout: 15000 });
  console.log('Cross-origin browser check passed: delayed insertion, child SPA, document replacement and same-URL reload, unrelated widgets, removal, ambiguous frames, pause/resume, and disable/resume.');
} finally {
  await context?.close();
  await Promise.all([child, parent, widgetServer].map(server => new Promise(resolve => server.close(resolve))));
}
