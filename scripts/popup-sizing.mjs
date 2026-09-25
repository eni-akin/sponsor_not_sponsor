import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, realpath, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const extensionPath = await realpath('dist');
const extensionId = createHash('sha256').update(extensionPath).digest('hex').slice(0, 32).replace(/[0-9a-f]/g, char => 'abcdefghijklmnop'[parseInt(char, 16)]);
// A real toolbar popup uses Chrome's preferred-size negotiation. A normal tab
// (even a narrow one) cannot reproduce that behavior. Use a disposable profile.
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium', headless: false, viewport: null,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});
try {
  const helper = await context.newPage();
  await helper.goto(`chrome-extension://${extensionId}/popup.html`);
  const page = await context.newPage();
  await page.goto('about:blank');
  await page.bringToFront();
  const measurements = [];
  for (const welcomeSeen of [false, true]) {
    await helper.evaluate(async seen => {
      await chrome.storage.local.set({ onboardingSeen: seen });
      await chrome.action.openPopup();
    }, welcomeSeen);
    // Wait for the real popup to finish initial rendering and size negotiation.
    await helper.waitForFunction(() => {
      const view = chrome.extension.getViews({ type: 'popup' })[0];
      return view?.document.querySelector('#status')?.textContent === 'Page unavailable';
    });
    const measured = await helper.evaluate(async () => {
      const view = chrome.extension.getViews({ type: 'popup' })[0];
      await new Promise(resolve => view.requestAnimationFrame(() => view.requestAnimationFrame(resolve)));
      const body = view.document.body;
      return { actualToolbarPopup: true, viewportWidth: view.innerWidth, bodyWidth: body.getBoundingClientRect().width,
        rootWidth: view.document.documentElement.getBoundingClientRect().width,
        headingWidth: view.document.querySelector('h1').getBoundingClientRect().width,
        viewportHeight: view.innerHeight, bodyHeight: body.getBoundingClientRect().height,
        horizontalOverflow: body.scrollWidth > body.clientWidth + 1,
        welcomeVisible: !view.document.getElementById('onboarding').hidden };
    });
    measurements.push(measured);
    console.log(JSON.stringify(measured));
    assert.equal(measured.bodyWidth, 400, 'Toolbar popup body must retain its 400px width');
    assert.equal(measured.viewportWidth, 400, 'Chrome must size the actual popup to 400px');
    assert.equal(measured.rootWidth, 400);
    assert.ok(measured.headingWidth >= 340, 'Heading must have room to wrap normally');
    assert.equal(measured.horizontalOverflow, false);
    assert.equal(measured.welcomeVisible, !welcomeSeen);
    assert.ok(measured.bodyHeight <= 600 && measured.viewportHeight <= 600);
    await helper.evaluate(() => chrome.extension.getViews({ type: 'popup' })[0].close());
  }
  await mkdir('test-results', { recursive: true });
  await writeFile('test-results/popup-sizing.json', JSON.stringify(measurements, null, 2) + '\n');
  console.log('PASS: actual toolbar popup keeps a stable width before and after onboarding.');
} finally {
  await context.close();
}
