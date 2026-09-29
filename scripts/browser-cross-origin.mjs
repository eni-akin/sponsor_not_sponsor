import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const child = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.end('<main><h1>Engineer Intern</h1><h2>Responsibilities</h2><p>Build reliable tools for the team.</p><h2>Qualifications</h2><p>Current student with software experience.</p><p id="policy">Visa sponsorship is not available for this role.</p><a href="/apply">Apply</a></main>');
});
const listen = server => new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
await listen(child);
const childUrl = `http://127.0.0.1:${child.address().port}/jobs/123/job`;
const parent = createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  const second = request.url?.includes('multiple') ? `<iframe src="${childUrl.replace('/123/', '/124/')}" title="Other job"></iframe>` : '';
  response.end(`<main><h1>Careers</h1><iframe id="job" src="${childUrl}" title="Job"></iframe>${second}</main>`);
});
await listen(parent);
let context;
try {
  const extensionPath = await realpath(process.env.EXTENSION_DIR ?? 'dist');
  context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`] });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${parent.address().port}/careers`);
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent?.includes('Sponsorship unavailable'), null, { timeout: 15000 });
  const initial = await page.evaluate(() => {
    const root = document.querySelector('#sponsor-not-sponsor-ui').shadowRoot;
    return { source: root.querySelector('[data-finding="sponsorship"] .source')?.textContent,
      quote: root.querySelector('[data-finding="sponsorship"] blockquote')?.textContent };
  });
  assert.match(initial.source, /Embedded job frame/);
  assert.match(initial.quote, /not available/);
  await page.frameLocator('#job').locator('#policy').evaluate(element => { element.textContent = 'Visa sponsorship is available for this role.'; });
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent?.includes('Sponsorship available'), null, { timeout: 15000 });
  await page.locator('#job').evaluate(element => element.remove());
  await page.waitForFunction(() => !document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent?.includes('Sponsorship available'), null, { timeout: 15000 });
  await page.goto(`http://127.0.0.1:${parent.address().port}/careers-multiple`);
  await page.waitForTimeout(1000);
  const ambiguous = await page.evaluate(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent ?? '');
  assert.doesNotMatch(ambiguous, /Sponsorship (available|unavailable)/);
  await page.goto(`http://127.0.0.1:${parent.address().port}/careers`);
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById('badge-text')?.textContent?.includes('Sponsorship unavailable'), null, { timeout: 15000 });
  await page.locator('#sponsor-not-sponsor-ui #toggle').click();
  await page.locator('#sponsor-not-sponsor-ui #pause').click();
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.style.display === 'none', null, { timeout: 15000 });
  console.log('Cross-origin browser check passed: frame evidence appeared, updated, cleared on removal, stayed ambiguous with two frames, and cleared on pause.');
} finally {
  await context?.close();
  await Promise.all([new Promise(resolve => child.close(resolve)), new Promise(resolve => parent.close(resolve))]);
}
