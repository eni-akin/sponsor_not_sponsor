import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const html = await readFile('release/demo.html', 'utf8');
const server = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(html);
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
let context;
try {
  const extensionPath = await realpath(process.env.EXTENSION_DIR ?? 'dist');
  const id = createHash('sha256').update(extensionPath).digest('hex').slice(0, 32).replace(/[0-9a-f]/g, c => 'abcdefghijklmnop'[parseInt(c, 16)]);
  context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true,
    viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`] });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/demo-job`);
  const badge = page.locator('#sponsor-not-sponsor-ui #toggle');
  await badge.waitFor();
  assert.match(await badge.textContent(), /Explicit blocker found/);
  await mkdir('release/store', { recursive: true });
  await page.screenshot({ path: 'release/store/01-job-badge-1280x800.png' });
  await badge.click();
  const sponsor = page.locator('#sponsor-not-sponsor-ui [data-finding="main"]');
  await sponsor.locator('summary').click();
  assert.equal(await sponsor.getAttribute('data-status'), 'explicit-blocker');
  assert.equal(await sponsor.locator('.finding-value').evaluate(element => getComputedStyle(element).color), 'rgb(150, 59, 47)');
  await page.screenshot({ path: 'release/store/02-quoted-evidence-1280x800.png' });
  const help = await context.newPage();
  await mkdir('test-results', { recursive: true });
  for (const file of ['help', 'privacy']) {
    await help.goto(`chrome-extension://${id}/${file}.html`);
    await help.locator('h1').waitFor();
    await help.locator('.brand-logo').evaluate(image => image.decode());
    assert.equal(await help.locator('.brand-logo').getAttribute('alt'), 'SNS — Sponsor Not Sponsor');
    assert.deepEqual(await help.locator('html').evaluate(element => {
      const style = getComputedStyle(element);
      return [style.color, style.backgroundColor];
    }), ['rgb(41, 35, 46)', 'rgb(255, 248, 242)']);
    assert.equal(await help.getByRole('main').count(), 1);
    assert.equal(await help.getByRole('heading', { level: 1 }).count(), 1);
    assert.equal(await help.locator('a').first().getAttribute('href'), file === 'help' ? 'privacy.html' : 'help.html');
    await help.setViewportSize({ width: 320, height: 640 });
    assert.ok(await help.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${file} must reflow at 320 CSS pixels`);
    await help.emulateMedia({ forcedColors: 'active' });
    await help.locator('a').first().focus();
    assert.equal(await help.locator('a').first().evaluate(link => link.matches(':focus-visible') && getComputedStyle(link).outlineStyle !== 'none'), true, `${file} link focus must remain visible in forced colours`);
    await help.emulateMedia({ forcedColors: 'none' });
    await help.setViewportSize({ width: 390, height: 844 });
    assert.ok(await help.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${file} must fit a narrow viewport`);
    await help.screenshot({ path: `test-results/${file}-mobile.png`, fullPage: true });
  }
  console.log('Captured actual extension UI on a labeled fictional posting; help/privacy pages fit a narrow viewport.');
} finally { await context?.close(); await new Promise(resolve => server.close(resolve)); }
