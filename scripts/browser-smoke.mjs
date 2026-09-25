import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, realpath, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { checkBetaUI } from './browser-beta.mjs';

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
  await popup.locator('#onboarding').waitFor({ state: 'visible' });
  await popup.locator('#onboarding-done').click();
  await popup.locator('#onboarding').waitFor({ state: 'hidden' });
  const status = async expected => popup.waitForFunction(value => document.querySelector('#status').textContent === value, expected, { timeout: 10000 });
  await status('Job posting detected');
  const getScan = () => popup.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return chrome.tabs.sendMessage(tab.id, { type: 'GET_SCAN' });
  });
  assert.equal(await popup.locator('#title').textContent(), 'Software Engineer');
  assert.match(await popup.locator('#metadata').textContent(), /Acme Labs/);
  assert.match(await popup.locator('#evidence').textContent(), /Visa sponsorship is available/);
  assert.doesNotMatch(await popup.locator('#evidence').textContent(), /Accountant/);
  assert.equal(await popup.locator('[data-finding="sponsorship"]').getAttribute('data-status'), 'available');
  assert.equal(await popup.locator('[data-finding="cpt"]').getAttribute('data-status'), 'unclear');
  assert.match(await popup.locator('[data-finding="sponsorship"] blockquote').textContent(), /Visa sponsorship is available/);
  const badge = page.locator('#sponsor-not-sponsor-ui #toggle');
  const panel = page.locator('#sponsor-not-sponsor-ui #panel');
  await badge.waitFor({ state: 'visible' });
  assert.match(await badge.textContent(), /Sponsorship available/);
  // Keep page-level controls reachable even if the website styles every button.
  await page.addStyleTag({ content: 'button { background: magenta !important; font-size: 80px !important; }' });
  assert.equal(await badge.evaluate(element => getComputedStyle(element).fontSize), '12px');
  await badge.focus();
  await page.keyboard.press('Enter');
  await panel.waitFor({ state: 'visible' });
  assert.equal(await page.locator('#sponsor-not-sponsor-ui #close').evaluate(element => element.getRootNode().activeElement === element), true);
  await page.locator('#sponsor-not-sponsor-ui [data-finding="sponsorship"] > summary').click();
  assert.match(await page.locator('#sponsor-not-sponsor-ui blockquote').first().textContent(), /Visa sponsorship is available/);
  assert.ok(await page.locator('#sponsor-not-sponsor-ui a').count() > 0);
  await mkdir('test-results', { recursive: true });
  await panel.screenshot({ path: 'test-results/on-page-panel.png' });
  // Host-page scripts cannot invoke a preference change with a synthetic click.
  await page.locator('#sponsor-not-sponsor-ui #pause').evaluate(element => element.click());
  assert.equal((await getScan()).state, 'ready');
  await page.locator('#sponsor-not-sponsor-ui #report').click();
  await page.locator('#sponsor-not-sponsor-ui #reason').selectOption({ label: 'Sponsorship finding looks wrong' });
  const downloadReady = page.waitForEvent('download');
  await page.locator('#sponsor-not-sponsor-ui #download').click();
  const download = await downloadReady;
  await download.saveAs('test-results/report.json');
  const report = JSON.parse(await readFile('test-results/report.json', 'utf8'));
  assert.equal(report.extensionVersion, JSON.parse(await readFile('extension/manifest.json', 'utf8')).version);
  assert.equal(report.findings.sponsorship.status, 'available');
  assert.ok(!('evidence' in report.role));
  await page.keyboard.press('Escape');
  await panel.waitFor({ state: 'hidden' });
  assert.equal(await badge.evaluate(element => element.getRootNode().activeElement === element), true);

  // Move the badge around an application button, rather than covering it.
  await page.evaluate(() => {
    const button = document.createElement('button');
    button.id = 'fixed-apply'; button.textContent = 'Apply';
    button.style.cssText = 'position:fixed;right:0;bottom:0;width:200px;height:100px';
    document.body.append(button);
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForFunction(() => {
    const host = document.querySelector('#sponsor-not-sponsor-ui');
    const badge = host.shadowRoot.getElementById('badge').getBoundingClientRect();
    const control = document.getElementById('fixed-apply').getBoundingClientRect();
    return badge.right <= control.left || badge.bottom <= control.top || badge.left >= control.right || badge.top >= control.bottom;
  });
  await page.evaluate(() => { document.getElementById('fixed-apply').remove(); window.dispatchEvent(new Event('resize')); });
  await page.locator('#sponsor-not-sponsor-ui #dismiss').click();
  await badge.waitFor({ state: 'hidden' });
  await popup.locator('#rescan').click();
  assert.equal(await badge.isVisible(), false, 'Dismissal persists for the same role');
  await popup.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { type: 'SHOW_PANEL' });
  });
  await panel.waitFor({ state: 'visible' });
  await page.locator('#sponsor-not-sponsor-ui #close').click();
  await badge.waitFor({ state: 'visible' });
  const beforeScroll = (await getScan()).result.scannedAt;
  await page.evaluate(() => {
    document.querySelector('main').classList.add('scrolled');
    document.querySelector('main').style.transform = 'translateY(1px)';
    document.body.style.setProperty('--scroll-progress', '.5');
    window.scrollTo(0, 100);
  });
  // Allow both the mutation batch and automatic scan windows to elapse.
  await new Promise(resolve => setTimeout(resolve, 800));
  assert.equal((await getScan()).result.scannedAt, beforeScroll, 'Cosmetic changes must not rescan');
  await popup.locator('#evidence-section > summary').click();
  await popup.locator('#evidence').evaluate(element => { element.scrollTop = 80; });
  const evidenceScroll = await popup.locator('#evidence').evaluate(element => element.scrollTop);
  await popup.locator('#rescan').click();
  await popup.waitForFunction(() => document.querySelector('#scan-feedback').textContent.startsWith('Scan complete'));
  assert.notEqual((await getScan()).result.scannedAt, beforeScroll, 'Manual button must run a new scan');
  assert.equal(await popup.locator('#evidence').evaluate(element => element.scrollTop), evidenceScroll, 'Manual scan must preserve evidence scroll when text is unchanged');
  await popup.locator('#evidence-section > summary').click();
  await popup.locator('main').evaluate(element => { element.scrollTop = 0; });
  await mkdir('test-results', { recursive: true });
  await popup.locator('body').screenshot({ path: 'test-results/scanner-popup.png' });

  await badge.click();
  await page.locator('#sponsor-not-sponsor-ui #pause').click();
  await status('Scanning paused');
  assert.equal(await popup.locator('#pause').isChecked(), true);
  assert.equal(await badge.isVisible(), false);
  assert.equal(await popup.locator('#evidence-section').isVisible(), false);
  assert.equal(await popup.locator('#findings').isVisible(), false);
  await popup.locator('#pause').uncheck();
  await status('Job posting detected');
  await badge.click();
  await page.locator('#sponsor-not-sponsor-ui #disable').click();
  await status('Disabled for this site');
  assert.equal(await popup.locator('#disable-site').isChecked(), true);
  await page.reload();
  await status('Disabled for this site');
  await popup.locator('#disable-site').uncheck();
  await status('Job posting detected');

  await page.goto(`${origin}/application`);
  await status('Application detected');
  await badge.waitFor({ state: 'visible' });
  await badge.click();
  await page.locator('input[name="name"]').fill('MY PRIVATE ANSWER');
  await panel.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('input[name="name"]').inputValue(), 'MY PRIVATE ANSWER');
  assert.equal(await popup.locator('[data-finding="sponsorship"]').getAttribute('data-status'), 'unclear');
  assert.doesNotMatch(await popup.locator('#evidence').textContent(), /PRIVATE/);
  assert.match(await popup.locator('#evidence').textContent(), /Will you now or in the future require sponsorship/);
  await page.goto(`${origin}/multiple-jobs`);
  await status('Multiple roles on this page');
  assert.equal(await badge.isVisible(), false);
  assert.equal(await popup.locator('#evidence-section').isVisible(), false);

  await page.goto(`${origin}/generic-job`);
  await status('Job posting detected');
  assert.equal(await popup.locator('[data-finding="cpt"]').getAttribute('data-status'), 'explicitly-accepted');
  // Reproduce the two policy sentences visible in the user's screenshot.
  await page.evaluate(() => {
    const text = document.createElement('p');
    text.textContent = 'This position is not eligible for F1 and J1 students. It is also not available for any work sponsorship.';
    document.querySelector('main').append(text);
  });
  await popup.waitForFunction(() => document.querySelector('[data-finding="sponsorship"]')?.dataset.status === 'unavailable');
  assert.match(await popup.locator('.restrictions').textContent(), /F1 and J1/);
  await popup.locator('[data-finding="sponsorship"] > summary').click();
  await popup.locator('main').evaluate(element => { element.scrollTop = 125; });
  await popup.locator('body').screenshot({ path: 'test-results/policy-findings.png' });
  await badge.click();
  await panel.waitFor({ state: 'visible' });
  await page.evaluate(() => history.pushState({}, '', '/jobs/new-role'));
  await status('Scanning…');
  await panel.waitFor({ state: 'hidden' });
  assert.equal(await popup.locator('#evidence-section').isVisible(), false);
  await page.evaluate(() => { document.querySelector('h1').textContent = 'Research Associate'; });
  await status('Job posting detected');
  assert.equal(await popup.locator('#title').textContent(), 'Research Associate');
  await badge.click();
  assert.equal(await page.locator('#sponsor-not-sponsor-ui #role-title').textContent(), 'Research Associate');
  const betaReport = await checkBetaUI({ page, popup, origin, getScan });
  await writeFile('test-results/browser-beta.json', JSON.stringify(betaReport, null, 2));
  await page.goto(`${origin}/ordinary`);
  await status('No specific job detected');
  assert.equal(await badge.isVisible(), false);
  assert.equal(await popup.locator('#evidence-section').isVisible(), false);
  assert.deepEqual(errors, []);
  console.log('PASS: onboarding, on-page badge/panel, keyboard and focus behavior, collision avoidance, style isolation, local report download, synthetic-click protection, dismissal/restore, cited findings, manual rescan, cosmetic-scroll filtering, pause/site preferences, input privacy, SPA navigation, and ordinary pages.');
  console.log('Popup screenshot: test-results/scanner-popup.png');
} finally {
  await context?.close();
  await new Promise(resolve => server.close(resolve));
}
