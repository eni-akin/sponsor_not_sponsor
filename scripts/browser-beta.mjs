import assert from 'node:assert/strict';

function contrastRatio(foreground, background) {
  const luminance = color => {
    const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    assert.equal(channels?.length, 3, `Expected an RGB colour, got ${color}`);
    const [red, green, blue] = channels.map(channel => {
      const value = channel / 255;
      return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    });
    return .2126 * red + .7152 * green + .0722 * blue;
  };
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + .05) / (darker + .05);
}

async function assertTextContrast(text, background, label) {
  const foreground = await text.evaluate(element => getComputedStyle(element).color);
  const backgroundColor = await background.evaluate(element => getComputedStyle(element).backgroundColor);
  assert.ok(contrastRatio(foreground, backgroundColor) >= 4.5, `${label} must meet 4.5:1 text contrast`);
}

async function assertCompactSizing(root, label) {
  const smallText = await root.locator('*:visible').evaluateAll(elements => elements
    .filter(element => [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()))
    .filter(element => Number.parseFloat(getComputedStyle(element).fontSize) < 12)
    .map(element => `${element.tagName}.${element.className}: ${getComputedStyle(element).fontSize}`));
  assert.deepEqual(smallText, [], `${label} supporting text must be at least 12px`);
  for (const target of await root.locator('button:visible, a:visible, summary:visible, select:visible, label.setting:visible').all()) {
    const box = await target.boundingBox();
    assert.ok(box.width >= 44 && box.height >= 44,
      `${label} target must be at least 44×44px: ${await target.textContent()} (${box.width}×${box.height})`);
  }
}

/** Section 4 checks run inside the existing isolated extension test browser. */
export async function checkBetaUI({ page, popup, origin, getScan }) {
  await page.goto(`${origin}/structured-job`);
  const host = '#sponsor-not-sponsor-ui';
  const badge = page.locator(`${host} #toggle`);
  const panel = page.locator(`${host} #panel`);
  const longTitle = 'Senior Research Engineer — Distributed Systems and International Infrastructure '.repeat(2).trim();
  await page.locator('h1').evaluate((element, title) => { element.textContent = title; }, longTitle);
  await page.waitForFunction(title => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot.getElementById('role-title').textContent === title, longTitle);
  assert.equal(await popup.getByRole('checkbox', { name: 'Pause scanning everywhere' }).count(), 1);
  assert.equal(await popup.getByRole('checkbox', { name: /Disable on/ }).count(), 1);
  const popupRescan = popup.getByRole('button', { name: 'Scan again' });
  await popupRescan.focus();
  await popup.keyboard.press('Enter');
  await popup.waitForFunction(() => document.querySelector('#scan-feedback').textContent.startsWith('Scan complete'));
  await popup.keyboard.press('Tab');
  assert.equal(await popup.locator('#show-panel').evaluate(element => document.activeElement === element), true, 'Popup actions must remain in keyboard order');
  const popupEvidence = popup.locator('#evidence-section > summary');
  await popupEvidence.focus();
  await popup.keyboard.press('Enter');
  assert.equal(await popup.locator('#evidence-section').getAttribute('open'), '');
  await assertCompactSizing(popup.locator('body'), 'Popup');
  await popup.keyboard.press('Enter');
  await assertTextContrast(popupRescan, popupRescan, 'Popup primary action');
  await assertTextContrast(popup.locator('.privacy'), popup.locator('html'), 'Popup supporting text');
  await assertTextContrast(popup.locator('a[href="help.html"]'), popup.locator('html'), 'Popup link');
  await popup.emulateMedia({ forcedColors: 'active' });
  await popupRescan.focus();
  assert.equal(await popupRescan.evaluate(element => element.matches(':focus-visible') && getComputedStyle(element).outlineStyle !== 'none'), true, 'Popup focus must remain visible in forced colours');
  await popup.emulateMedia({ forcedColors: 'none' });
  const checks = [];
  for (const viewport of [{ width: 320, height: 568 }, { width: 640, height: 360 }, { width: 320, height: 256 }]) {
    await page.setViewportSize(viewport);
    await badge.waitFor({ state: 'visible' });
    await badge.focus();
    await page.keyboard.press('Enter');
    await panel.waitFor({ state: 'visible' });
    assert.equal(await page.getByRole('dialog', { name: longTitle }).count(), 1);
    const geometry = await panel.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { fits: rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight,
        horizontalOverflow: element.scrollWidth > element.clientWidth + 1,
        bodyHeight: element.querySelector('.panel-body').clientHeight };
    });
    assert.equal(geometry.fits, true, `Panel must fit ${JSON.stringify(viewport)}`);
    assert.equal(geometry.horizontalOverflow, false, `No horizontal overflow ${JSON.stringify(viewport)}`);
    assert.ok(geometry.bodyHeight >= 48, `Evidence must remain reachable ${JSON.stringify(viewport)}: ${JSON.stringify(geometry)}`);
    if (!checks.length) {
      await assertTextContrast(panel.locator('#rescan'), panel.locator('#rescan'), 'Panel primary action');
      await assertTextContrast(panel.locator('.note').first(), panel, 'Panel supporting text');
      await assertTextContrast(panel.locator('.finding-value'), panel.locator('.finding'), 'Panel result text');
    }
    await assertCompactSizing(panel, 'Panel');
    // Every visible panel button must retain an accessible label.
    for (const button of await panel.locator('button:visible').all()) {
      assert.ok(await button.evaluate(el => (el.getAttribute('aria-label') || el.textContent).trim().length > 0));
    }
    await page.locator(`${host} [data-finding="main"] > summary`).focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator(`${host} [data-finding="main"]`).getAttribute('open'), '');
    const source = page.locator(`${host} a`).first();
    await assertCompactSizing(panel, 'Expanded panel');
    await source.focus();
    assert.equal(await source.evaluate(element => element.getRootNode().activeElement === element), true);
    await panel.screenshot({ path: `test-results/beta-panel-${viewport.width}x${viewport.height}.png` });
    if (viewport.height === 256) {
      await panel.locator('#report').click();
      await assertCompactSizing(panel, 'Short-viewport report controls');
      assert.equal(await panel.evaluate(element => element.scrollWidth > element.clientWidth + 1), false, 'Report controls must not cause horizontal overflow');
    }
    await page.keyboard.press('Escape');
    await panel.waitFor({ state: 'hidden' });
    assert.equal(await badge.evaluate(element => element.getRootNode().activeElement === element), true);
    // Close the disclosure before the next viewport without page-script UI events.
    await badge.click();
    await page.locator(`${host} [data-finding="main"] > summary`).click();
    await page.keyboard.press('Escape');
    checks.push({ viewport, geometry });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  // Actual browser zoom, rather than scaling a screenshot or only the document font.
  await popup.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.setZoom(tab.id, 2);
  });
  try {
    await badge.click();
    await panel.waitFor({ state: 'visible' });
    assert.equal(await panel.evaluate(element => { const r = element.getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; }), true);
    await page.locator(`${host} #close`).click();
  } finally {
    await popup.evaluate(async () => { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); await chrome.tabs.setZoom(tab.id, 1); });
  }
  // A recovered, temporarily unavailable tab must clear errors and reconnect.
  await page.goto(`${origin}/ordinary`);
  await page.goto(`${origin}/application`);
  await badge.waitFor({ state: 'visible' });
  await badge.click();
  await page.locator('input[name="name"]').focus();
  await page.keyboard.type('PRIVATE BETA ANSWER');
  await panel.waitFor({ state: 'hidden' });
  assert.doesNotMatch(JSON.stringify(await getScan()), /PRIVATE BETA ANSWER/);
  await page.setViewportSize({ width: 420, height: 850 });
  return { checks, browserZoom: '200%', contrast: 'WCAG AA text pairs passed', keyboard: 'popup and panel passed', forcedColors: 'popup passed', privateAnswers: 'excluded' };
}
