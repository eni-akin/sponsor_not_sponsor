import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const server = createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(new URL(request.url, 'http://localhost').pathname === '/wrapper'
    ? '<h1>Careers</h1><iframe style="width:900px;height:700px" src="/job"></iframe>'
    : '<h1>Software Engineer Intern</h1><h2>Responsibilities</h2><p>Build tools for customers.</p><h2>Qualifications</h2><p>Students with software coursework.</p><p id="policy">Visa sponsorship is not available for this role.</p><a href="/apply">Apply</a>');
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const origin = `http://127.0.0.1:${server.address().port}`;
let context;
try {
  const path = await realpath('dist');
  const extensionId = createHash('sha256').update(path).digest('hex').slice(0, 32).replace(/[0-9a-f]/g, c => 'abcdefghijklmnop'[parseInt(c, 16)]);
  context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${path}`, `--load-extension=${path}`] });
  const page = await context.newPage();
  await page.goto(`${origin}/wrapper`);
  const popup = await context.newPage();
  await page.bringToFront();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.locator('#onboarding-done').click();
  await popup.waitForFunction(() => document.querySelector('#title')?.textContent === 'Software Engineer Intern', null, { timeout: 10000 });
  assert.equal(await popup.locator('[data-finding="sponsorship"]').getAttribute('data-status'), 'unavailable');
  assert.match(await popup.locator('#evidence').textContent(), /Embedded job frame/);
  await page.frameLocator('iframe').locator('#policy').evaluate(element => { element.textContent = 'Visa sponsorship is available for this role.'; });
  await popup.waitForFunction(() => document.querySelector('[data-finding="sponsorship"]')?.getAttribute('data-status') === 'available', null, { timeout: 10000 });
  console.log('Embedded browser check passed: the wrapper reads and updates the same-origin job.');
} finally {
  await context?.close();
  await new Promise(resolve => server.close(resolve));
}
