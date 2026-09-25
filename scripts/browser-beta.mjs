import assert from 'node:assert/strict';

/** Section 4 checks run inside the existing isolated extension test browser. */
export async function checkBetaUI({ page, popup, origin, getScan }) {
  await page.goto(`${origin}/structured-job`);
  const host = '#sponsor-not-sponsor-ui';
  const badge = page.locator(`${host} #toggle`);
  const panel = page.locator(`${host} #panel`);
  const longTitle = 'Senior Research Engineer — Distributed Systems and International Infrastructure '.repeat(2).trim();
  await page.locator('h1').evaluate((element, title) => { element.textContent = title; }, longTitle);
  await page.waitForFunction(title => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot.getElementById('role-title').textContent === title, longTitle);
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
    // Every visible panel action must have a label and be large enough to target.
    for (const button of await panel.locator('button:visible').all()) {
      assert.ok(await button.evaluate(el => (el.getAttribute('aria-label') || el.textContent).trim().length > 0));
      const box = await button.boundingBox();
      assert.ok(box.width >= 24 && box.height >= 24);
    }
    await page.locator(`${host} [data-finding="sponsorship"] > summary`).focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator(`${host} [data-finding="sponsorship"]`).getAttribute('open'), '');
    const source = page.locator(`${host} a`).first();
    await source.focus();
    assert.equal(await source.evaluate(element => element.getRootNode().activeElement === element), true);
    await panel.screenshot({ path: `test-results/beta-panel-${viewport.width}x${viewport.height}.png` });
    await page.keyboard.press('Escape');
    await panel.waitFor({ state: 'hidden' });
    assert.equal(await badge.evaluate(element => element.getRootNode().activeElement === element), true);
    // Close the disclosure before the next viewport without page-script UI events.
    await badge.click();
    await page.locator(`${host} [data-finding="sponsorship"] > summary`).click();
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
  return { checks, browserZoom: '200%', keyboard: 'passed', privateAnswers: 'excluded' };
}
