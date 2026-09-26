import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const svg = await readFile('extension/icons/source.svg', 'utf8');
  await mkdir('release/store', { recursive: true });
  for (const size of [16, 32, 48, 128]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:100vw;height:100vh;display:block}</style>${svg}`);
    await page.screenshot({ path: `extension/icons/icon-${size}.png`, omitBackground: true });
  }
  await page.setViewportSize({ width: 440, height: 280 });
  await page.setContent(`<style>html,body{margin:0;width:440px;height:280px;overflow:hidden;background:#254d3e}main{height:100%;display:flex;align-items:center;justify-content:center;gap:18px}svg{width:156px;height:156px}.lines{width:128px}.line{height:12px;margin:17px 0;border-radius:8px;background:#b4cbbd}.line:nth-child(2){width:76%;background:#eac47d}.line:nth-child(3){width:90%}</style><main>${svg}<div class="lines"><div class="line"></div><div class="line"></div><div class="line"></div></div></main>`);
  await page.screenshot({ path: 'release/store/promo-440x280.png' });
  console.log('Generated four extension icons and the 440×280 store promotional image.');
} finally { await browser.close(); }
