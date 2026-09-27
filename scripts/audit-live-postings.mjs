import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';

// Read-only audit of public pages in a disposable browser. No applications,
// consent buttons, accounts, or application fields are submitted or filled.
const directory = 'evaluation/live-2026-09-26';
await mkdir(`${directory}/raw`, { recursive: true });
const mode = process.argv[2] ?? 'select';
if (mode === 'select') {
  const source = await readFile('/tmp/sns-summer2027-readme.md', 'utf8');
  const doc = new JSDOM(source).window.document;
  const records = [], seen = new Set();
  let employer = '', rowIndex = 0;
  for (const row of doc.querySelectorAll('table:first-of-type tbody tr')) {
    const cells = [...row.querySelectorAll('td')];
    if (cells.length < 4) continue;
    rowIndex++;
    const name = cells[0].textContent.trim();
    if (name && !name.includes('↳')) employer = name.replace(/🔥/g, '').trim();
    if (seen.has(employer)) continue;
    const links = [...cells[3].querySelectorAll('a')].map(a => a.href);
    if (!links[0] || !/^https:/.test(links[0])) continue;
    seen.add(employer);
    const clean = raw => { const u = new URL(raw); for (const key of ['utm_source', 'utm_medium', 'ref']) u.searchParams.delete(key); return u.href; };
    records.push({ id: records.length + 1, repositoryRow: rowIndex, company: employer,
      title: cells[1].textContent.trim(), location: cells[2].textContent.trim(),
      url: clean(links[0]), mirror: links[1] ? clean(links[1]) : null });
    if (records.length === 30) break;
  }
  if (records.length !== 30) throw new Error(`Selected only ${records.length} records`);
  await writeFile(`${directory}/sample.json`, JSON.stringify({
    sourceUrl: 'https://github.com/SimplifyJobs/Summer2027-Internships',
    readmeUrl: 'https://raw.githubusercontent.com/SimplifyJobs/Summer2027-Internships/dev/README.md',
    retrievedAt: new Date().toISOString(), readmeSha256: createHash('sha256').update(source).digest('hex'),
    extensionCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    method: 'First 30 distinct employers with application links, in README software-engineering table order; no filtering by outcome. All selected rows have U.S. locations. Includes co-ops listed in the repository.',
    records,
  }, null, 2) + '\n');
  await writeFile(`${directory}/raw/repository-readme.md`, source);
  console.log(records.map(r => `${r.id}. ${r.company}: ${r.title}`).join('\n'));
  process.exit(0);
}

const { records } = JSON.parse(await readFile(`${directory}/sample.json`, 'utf8'));
const requestedIds = process.argv[3]?.split(',').map(Number);
const sample = requestedIds ? records.filter(r => requestedIds.includes(r.id)) : records;
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const extensionPath = await realpath('dist');
const extensionId = createHash('sha256').update(extensionPath).digest('hex').slice(0, 32).replace(/[0-9a-f]/g, c => 'abcdefghijklmnop'[parseInt(c, 16)]);
const bundled = await build({ stdin: { contents: `import { scanPage, extractBlocks } from './src/scanner'; import { interpretJob } from './src/interpreter'; export { scanPage, extractBlocks, interpretJob };`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', globalName: 'SNSAudit', target: 'chrome120' });
const bundle = bundled.outputFiles[0].text;
const context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true,
  viewport: { width: 1440, height: 1000 },
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`] });
const helper = await context.newPage();
await helper.goto(`chrome-extension://${extensionId}/popup.html`);
let next = 0;
async function visit(record) {
  const suffix = mode === 'mirror' ? '-mirror' : mode === 'mirror-full' ? '-mirror-full' : mode === 'description' ? '-description' : mode === 'verify' ? '-verified' : mode === 'implementation' ? '-implementation' : '';
  const prefix = `${directory}/raw/${String(record.id).padStart(2, '0')}${suffix}`;
  let url = mode.startsWith('mirror') ? record.mirror : record.url;
  if (mode === 'description' && url.includes('jobs.ashbyhq.com/')) { const u = new URL(url); u.pathname = u.pathname.replace(/\/application\/?$/, ''); u.search = ''; url = u.href; }
  const page = await context.newPage();
  const startedAt = new Date().toISOString();
  const errors = [];
  let httpStatus = null;
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    httpStatus = response?.status() ?? null;
  } catch (error) { errors.push(String(error.message).slice(0, 500)); }
  try {
    await page.waitForFunction(() => (document.body?.innerText.length ?? 0) > 1000, null, { timeout: 12000 });
  } catch { /* A short/blocked page remains an observed access outcome. */ }
  await page.waitForTimeout(1800);
  if (mode === 'mirror-full') {
    try {
      await page.getByText('Full posting', { exact: true }).click({ timeout: 5000 });
      await page.waitForTimeout(1200);
    } catch (error) { errors.push(`Full posting could not be opened: ${String(error.message).slice(0, 250)}`); }
  }
  try {
    const snapshot = await helper.evaluate(async href => {
      const tabs = await chrome.tabs.query({});
      // The production manifest intentionally has no tabs permission, so URLs
      // are not exposed by tabs.query. Match the content-script reply instead.
      const replies = await Promise.all(tabs.filter(t => t.id).map(async tab => {
        try { return await chrome.tabs.sendMessage(tab.id, { type: 'GET_SCAN' }); }
        catch { return null; }
      }));
      const exact = replies.find(reply => reply?.result?.url === href);
      if (exact) return exact;
      const sameHost = replies.filter(reply => reply?.hostname === new URL(href).hostname);
      return sameHost.length === 1 ? sameHost[0] : { auditError: 'No unambiguous content-script reply', replyCount: replies.filter(Boolean).length };
    }, page.url());
    const dom = await page.evaluate(() => ({
      title: document.title, text: document.body?.innerText ?? '',
      headings: [...document.querySelectorAll('h1,h2')].map(e => ({ tag: e.tagName, text: e.textContent?.trim(), visible: !!(e.getClientRects().length), inMain: !!e.closest('main,[role="main"]') })),
      apply: [...document.querySelectorAll('a,button,input[type="submit"]')].filter(e => /apply|submit application/i.test(e.getAttribute('aria-label') ?? e.textContent ?? '')).map(e => ({ tag: e.tagName, text: e.textContent?.trim().slice(0, 150), href: e.getAttribute('href'), visible: !!e.getClientRects().length })),
      metadata: [...document.querySelectorAll('script[type="application/ld+json"]')].map(e => e.textContent),
      frames: [...document.querySelectorAll('iframe')].map(e => ({ src: e.src, visible: !!e.getClientRects().length })),
      employerElements: [...document.querySelectorAll('[itemprop="hiringOrganization"],[data-employer]')].map(e => e.textContent?.trim()),
    }));
    // Diagnostic replay is separate from the actual extension result above.
    // This also permits evidence-only checks later without changing the tool.
    const replay = await page.evaluate(code => {
      const api = (new Function(`${code}; return SNSAudit;`))();
      const scan = api.scanPage(document, location.href);
      if (scan.role) scan.interpretation = api.interpretJob(scan.role);
      const bodyBlocks = api.extractBlocks(document.body).blocks;
      const evidenceOnly = api.interpretJob({ key: 'audit', title: document.title, employer: null, location: null, identifier: null, employmentTypes: [], completeness: 'incomplete', evidence: bodyBlocks });
      return { scan, evidenceOnly, bodyBlocks };
    }, bundle).catch(error => ({ auditError: String(error) }));
    const result = { id: record.id, company: record.company, requestedUrl: url, finalUrl: page.url(), startedAt, capturedAt: new Date().toISOString(), httpStatus, errors, snapshot, dom, replay };
    await writeFile(`${prefix}.json`, JSON.stringify(result, null, 2));
    await writeFile(`${prefix}.txt`, dom.text);
    await page.screenshot({ path: `${prefix}.png` }).catch(() => {});
    const scan = snapshot.result ?? replay.scan;
    console.log(JSON.stringify({ id: record.id, company: record.company, mode, status: httpStatus, chars: dom.text.length, kind: scan?.kind, employer: scan?.role?.employer, sponsorship: scan?.interpretation?.sponsorship.status, evidenceOnly: replay.evidenceOnly?.sponsorship.status, errors }));
  } catch (error) {
    await writeFile(`${prefix}.json`, JSON.stringify({ id: record.id, requestedUrl: url, finalUrl: page.url(), startedAt, errors: [...errors, String(error)] }, null, 2));
    console.log(JSON.stringify({ id: record.id, error: String(error) }));
  } finally { await page.close(); }
}
try {
  await Promise.all(Array.from({ length: 3 }, async () => { while (next < sample.length) { const record = sample[next++]; await visit(record); } }));
} finally { await context.close(); }
