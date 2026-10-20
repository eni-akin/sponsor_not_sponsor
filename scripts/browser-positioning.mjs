import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const html = await readFile('tests/fixtures/structured-job.html', 'utf8');
const server = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(html.replace('</head>', '<meta name="theme-color" content="#7652bf" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#309caa" media="(prefers-color-scheme: dark)"></head>'));
});
await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
let context;
try {
  const extensionPath = await realpath(process.env.EXTENSION_DIR ?? 'dist');
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium', headless: true, viewport: { width: 1000, height: 760 },
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  const page = await context.newPage();
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.goto(`http://127.0.0.1:${server.address().port}/job`);
  const badge = page.locator('#sponsor-not-sponsor-ui #toggle');
  await badge.waitFor({ state: 'visible' });
  const glow = () => page.locator('#sponsor-not-sponsor-ui #badge').evaluate(el => getComputedStyle(el).getPropertyValue('--sns-glow').trim());
  assert.equal(await glow(), '#C94F32', 'Glow should use SNS ember regardless of the website theme');
  assert.equal(await page.locator('#sponsor-not-sponsor-ui #rescan').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(201, 79, 50)', 'Scan again must share the glow accent');
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.querySelector('#tracer')?.getAnimations().length === 1);
  assert.deepEqual(await page.evaluate(() => {
    const root = document.querySelector('#sponsor-not-sponsor-ui').shadowRoot;
    const tracer = root.getElementById('tracer');
    const animation = tracer.getAnimations()[0];
    window.arrivalAnimation = animation;
    animation.pause();
    animation.currentTime = 700;
    const rect = root.getElementById('badge').getBoundingClientRect();
    return {
      duration: animation.effect.getTiming().duration, iterations: animation.effect.getTiming().iterations,
      offsets: animation.effect.getKeyframes().map(frame => frame.strokeDashoffset),
      normalizedPerimeter: tracer.getAttribute('pathLength'),
      fitsPill: Math.abs(tracer.width.baseVal.value - (rect.width - 2)) < 1 && Math.abs(tracer.rx.baseVal.value * 2 - (rect.height - 2)) < 1,
      ignoresPointer: getComputedStyle(tracer.parentElement).pointerEvents,
      decorative: tracer.parentElement.getAttribute('aria-hidden'),
      pill: getComputedStyle(root.getElementById('badge')).borderRadius,
    };
  }), { duration: 1400, iterations: 1, offsets: ['0', '-8', '-80', '-100'], normalizedPerimeter: '100', fitsPill: true, ignoresPointer: 'none', decorative: 'true', pill: '999px' });
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#sponsor-not-sponsor-ui').shadowRoot.getElementById('tracer')).strokeDashoffset === '-50px');
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/badge-arrival.png' });
  await page.evaluate(() => window.arrivalAnimation.finish());
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui').shadowRoot.getElementById('tracer').getAnimations().length === 0);
  assert.equal(await page.locator('#sponsor-not-sponsor-ui #tracer').evaluate(el => getComputedStyle(el).opacity), '0', 'Tracer should dissolve, leaving only the static glow');
  const bottomRight = async id => page.waitForFunction(id => {
    const element = document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.getElementById(id);
    const r = element?.getBoundingClientRect();
    return r && Math.abs(r.right - (innerWidth - 16)) < 1 && Math.abs(r.bottom - (innerHeight - 16)) < 1;
  }, id, { timeout: 2000 });
  await bottomRight('badge');
  // A tool can mount a closed-shadow overlay after the job and SNS are ready.
  await page.evaluate(() => {
    const overlay = document.createElement('aside');
    overlay.id = 'floating-tool';
    overlay.style.cssText = 'position:fixed;right:0;bottom:0;width:360px;height:300px;z-index:2147483647';
    overlay.attachShadow({ mode: 'closed' }).innerHTML = '<button style="width:100%;height:100%">Application helper</button>';
    document.body.append(overlay);
    window.positioningObstacle = overlay;
  });
  const isClear = async id => page.waitForFunction(id => {
    const root = document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot;
    const element = root?.getElementById(id);
    const overlay = window.positioningObstacle;
    if (!element || element.hidden || !overlay) return false;
    const a = element.getBoundingClientRect(), b = overlay.getBoundingClientRect();
    return a.width > 0 && a.left >= 0 && a.top >= 0 && a.right <= innerWidth && a.bottom <= innerHeight
      && (a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
  }, id, { timeout: 2000 }).then(() => true, () => false);
  assert.equal(await isClear('badge'), true, 'SNS badge must move clear of a late tool overlay');
  await badge.click();
  assert.equal(await isClear('panel'), true, 'SNS evidence panel must also avoid the tool overlay');
  assert.equal(await page.locator('#sponsor-not-sponsor-ui #close').evaluate(el => el.getRootNode().activeElement === el), true);
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/positioning-overlay.png' });
  await page.evaluate(() => document.getElementById('floating-tool').remove());
  await bottomRight('panel');
  assert.equal(await page.locator('#sponsor-not-sponsor-ui #close').evaluate(el => el.getRootNode().activeElement === el), true, 'Relocation must not lose keyboard focus');
  await page.keyboard.press('Escape');
  await badge.waitFor({ state: 'visible' });
  await bottomRight('badge');
  assert.equal(await page.locator('#sponsor-not-sponsor-ui #tracer').evaluate(el => el.getAnimations().length), 0, 'Relocation and closing the panel must not replay the sweep');
  // A transparent, full-screen shadow host must not reserve the whole screen.
  await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'floating-tool';
    host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    const root = host.attachShadow({ mode: 'closed' });
    const tool = document.createElement('button');
    tool.textContent = 'Floating helper';
    tool.style.cssText = 'position:fixed;right:0;bottom:0;width:360px;height:220px;pointer-events:auto';
    root.append(tool);
    document.body.append(host);
    window.positioningObstacle = tool;
  });
  assert.equal(await isClear('badge'), true, 'Closed-shadow tool should not block unrelated corners');
  // Normal page content in an open shadow root can sit underneath the relocated UI.
  await page.evaluate(() => {
    document.getElementById('floating-tool').remove();
    const host = document.createElement('div');
    host.id = 'floating-tool';
    host.style.cssText = 'position:fixed;right:0;top:0;width:360px;height:100vh;z-index:2147483647';
    const tool = document.createElement('button');
    tool.textContent = 'Floating helper';
    tool.style.cssText = 'position:fixed;right:0;top:0;width:360px;height:100vh;z-index:2147483647';
    host.attachShadow({ mode: 'closed' }).append(tool);
    document.body.append(host);
    window.positioningObstacle = tool;
    const content = document.createElement('div');
    content.id = 'shadow-content';
    content.style.cssText = 'position:absolute;left:0;top:0;width:400px;height:100vh';
    content.attachShadow({ mode: 'open' }).innerHTML = '<div style="height:100%">Page content</div>';
    document.body.append(content);
  });
  const stableLeft = async id => {
    await page.waitForTimeout(600);
    const positions = await page.evaluate(async id => {
      const element = document.querySelector('#sponsor-not-sponsor-ui').shadowRoot.getElementById(id);
      const positions = [];
      for (let i = 0; i < 75; i++) {
        await new Promise(requestAnimationFrame);
        const { left, top } = element.getBoundingClientRect();
        positions.push({ left, top });
      }
      return positions;
    }, id);
    assert.equal(new Set(positions.map(p => JSON.stringify(p))).size, 1, `${id} must not bounce between left corners`);
    assert.equal(positions[0].left, 16);
  };
  await stableLeft('badge');
  await badge.click();
  await stableLeft('panel');
  await page.keyboard.press('Escape');
  await stableLeft('badge');
  await page.evaluate(() => {
    document.getElementById('shadow-content').remove();
    document.getElementById('floating-tool').style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    window.positioningObstacle.style.height = '220px';
    window.positioningObstacle.style.top = 'auto';
    window.positioningObstacle.style.bottom = '0';
  });
  // Only the closed-root child changes: the periodic check must catch it.
  await page.evaluate(() => {
    window.positioningObstacle.style.right = 'auto';
    window.positioningObstacle.style.left = '0';
  });
  assert.equal(await isClear('badge'), true, 'SNS must follow a tool moved inside a closed shadow root');
  await bottomRight('badge');
  await page.evaluate(() => {
    document.getElementById('floating-tool').remove();
    const frame = document.createElement('iframe');
    frame.id = 'floating-tool';
    frame.srcdoc = '<button>Embedded helper</button>';
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:360px;height:300px;z-index:2147483647';
    document.body.append(frame);
    window.positioningObstacle = frame;
  });
  assert.equal(await isClear('badge'), true, 'An iframe-based helper must also be avoided');
  // Frame removal also invalidates the scan, so do not expect an open dialog to persist across it.
  await page.evaluate(() => document.getElementById('floating-tool').remove());
  await bottomRight('badge');
  await page.setViewportSize({ width: 320, height: 568 });
  await bottomRight('badge');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.evaluate(() => {
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.content = '#309caa');
    document.querySelectorAll('a').forEach(link => link.style.color = '#a14581');
    const button = document.createElement('button');
    button.id = 'theme-action';
    button.textContent = 'Apply';
    button.style.backgroundColor = '#a14581';
    document.body.append(button);
  });
  await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui').shadowRoot.getElementById('badge-text').textContent === 'Sponsorship stated');
  assert.equal(await glow(), '#C94F32', 'Website colour changes must not override the SNS glow');
  assert.equal(await page.locator('#sponsor-not-sponsor-ui .dot').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(39, 116, 72)', 'Ember glow must not recolour sponsorship indicators');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await badge.waitFor({ state: 'visible' });
  assert.equal(await page.locator('#sponsor-not-sponsor-ui #tracer').evaluate(el => el.getAnimations().length), 0, 'Reduced motion should skip the arrival sweep');
  assert.equal(await page.locator('#sponsor-not-sponsor-ui .arrival-trace').evaluate(el => getComputedStyle(el).display), 'none');
  assert.notEqual(await page.locator('#sponsor-not-sponsor-ui #badge').evaluate(el => getComputedStyle(el).boxShadow), 'none', 'Reduced motion retains the gentle static glow');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await badge.waitFor({ state: 'visible' });
  await page.locator('#sponsor-not-sponsor-ui #tracer').evaluate(async el => {
    const animation = el.getAnimations()[0];
    if (!animation) throw new Error('A new page arrival must start its single sweep');
    await animation.finished;
  });
  assert.equal(await page.locator('#sponsor-not-sponsor-ui #tracer').evaluate(el => el.getAnimations().length), 0, 'The sweep must finish naturally without looping');
  await page.emulateMedia({ forcedColors: 'active' });
  assert.equal(await page.locator('#sponsor-not-sponsor-ui .arrival-trace').evaluate(el => getComputedStyle(el).display), 'none');
  await badge.focus();
  assert.equal(await badge.evaluate(el => el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none'), true, 'Badge focus must remain visible in forced colours');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#sponsor-not-sponsor-ui #close').evaluate(el => el.getRootNode().activeElement === el && el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none'), true, 'Panel focus must remain visible in forced colours');
  await page.keyboard.press('Escape');
  await page.emulateMedia({ forcedColors: 'none' });
  console.log('PASS: faster one-shot pill tracer, shared ember button/glow accent, website-colour independence, reduced motion, forced colours, unchanged result colours, dynamic badge/panel corners, shadow/iframe tools, focus, and resize.');
} finally {
  await context?.close();
  await new Promise(done => server.close(done));
}
