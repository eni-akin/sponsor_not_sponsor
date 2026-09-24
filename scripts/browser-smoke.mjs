import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const fixtures = ['structured-job', 'generic-job', 'application', 'multiple-jobs'];
const pages = new Map(await Promise.all(fixtures.map(async name => [`/${name}`, await readFile(`tests/fixtures/${name}.html`, 'utf8')])));
const server = createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(pages.get(new URL(request.url, 'http://localhost').pathname) ?? '<main><h1>Our company</h1><p>Welcome to our website.</p></main>');
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const origin = `http://127.0.0.1:${server.address().port}`;
let context;
try {
  const extensionPath = await realpath('dist');
  // Unpacked extensions without a manifest key derive their ID from their absolute path.
  const extensionId = createHash('sha256').update(extensionPath).digest('hex').slice(0, 32).replace(/[0-9a-f]/g, char => 'abcdefghijklmnop'[parseInt(char, 16)]);
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    viewport: { width: 420, height: 850 },
  });
  const errors = [];
  context.on('weberror', error => errors.push(error.error().message));
  const page = await context.newPage();
  await page.goto(`${origin}/structured-job`);
  const popup = await context.newPage();
  await page.bringToFront();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  const status = async expected => popup.waitForFunction(value => document.querySelector('#status').textContent === value, expected, { timeout: 10000 });
  await status('Job posting detected');
  assert.equal(await popup.locator('#title').textContent(), 'Software Engineer');
  assert.match(await popup.locator('#metadata').textContent(), /Acme Labs/);
  assert.match(await popup.locator('#evidence').textContent(), /Visa sponsorship is available/);
  assert.doesNotMatch(await popup.locator('#evidence').textContent(), /Accountant/);
  await mkdir('test-results', { recursive: true });
  await popup.screenshot({ path: 'test-results/scanner-popup.png', fullPage: true });

  await popup.locator('#pause').check();
  await status('Scanning paused');
  assert.equal(await popup.locator('#evidence-section').isVisible(), false);
  await popup.locator('#pause').uncheck();
  await status('Job posting detected');
  await popup.locator('#disable-site').check();
  await status('Disabled for this site');
  await page.reload();
  await status('Disabled for this site');
  await popup.locator('#disable-site').uncheck();
  await status('Job posting detected');

  await page.goto(`${origin}/application`);
  await status('Application detected');
  assert.doesNotMatch(await popup.locator('#evidence').textContent(), /PRIVATE/);
  assert.match(await popup.locator('#evidence').textContent(), /Will you now or in the future require sponsorship/);
  await page.goto(`${origin}/multiple-jobs`);
  await status('Multiple roles on this page');
  assert.equal(await popup.locator('#evidence-section').isVisible(), false);

  await page.goto(`${origin}/generic-job`);
  await status('Job posting detected');
  await page.evaluate(() => history.pushState({}, '', '/jobs/new-role'));
  await status('Scanning…');
  assert.equal(await popup.locator('#evidence-section').isVisible(), false);
  await page.evaluate(() => { document.querySelector('h1').textContent = 'Research Associate'; });
  await status('Job posting detected');
  assert.equal(await popup.locator('#title').textContent(), 'Research Associate');
  await page.goto(`${origin}/ordinary`);
  await status('No specific job detected');
  assert.equal(await popup.locator('#evidence-section').isVisible(), false);
  assert.deepEqual(errors, []);
  console.log('PASS: unpacked extension loading, real extension messaging, popup, pause/resume, saved site preference, privacy filtering, multi-job isolation, SPA navigation, and ordinary pages.');
  console.log('Popup screenshot: test-results/scanner-popup.png');
} finally {
  await context?.close();
  await new Promise(resolve => server.close(resolve));
}
