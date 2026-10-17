import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const svg = await readFile('extension/icons/source.svg', 'utf8');
  const small = await readFile('extension/icons/source-small.svg', 'utf8');
  const logo = await readFile('extension/icons/logo.svg', 'utf8');
  await mkdir('release/store', { recursive: true });
  for (const size of [16, 32, 48, 128]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:100vw;height:100vh;display:block}</style>${size <= 32 ? small : svg}`);
    await page.screenshot({ path: `extension/icons/icon-${size}.png`, omitBackground: true });
  }
  await page.setViewportSize({ width: 440, height: 280 });
  await page.setContent(`<style>html,body{margin:0;width:440px;height:280px;overflow:hidden;background:#FFF8F2;color:#29232E;font:16px system-ui,sans-serif}main{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}svg{width:308px;height:112px}p{margin:0}</style><main>${logo}<p>Sponsor Not Sponsor</p></main>`);
  await page.screenshot({ path: 'release/store/promo-440x280.png' });
  console.log('Generated four extension icons and the 440×280 store promotional image.');
} finally { await browser.close(); }
