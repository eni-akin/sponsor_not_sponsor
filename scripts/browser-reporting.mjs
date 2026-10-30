import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { adminHtml, adminCss, adminJs } from '../reporting/admin-ui.ts';
import { REPORT_NOTICE_VERSION } from '../shared/report-schema.ts';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
const root = resolve('reporting/public');
const publicHtml = await readFile(resolve(root,'index.html'),'utf8');
assert.match(publicHtml,/<button id="submit" type="submit" disabled>/,'Submit starts disabled');
assert.doesNotMatch(publicHtml,/data-sitekey|challenges\.cloudflare\.com/,'HTML contains no hardcoded Turnstile key or eager loader');
let configStatus = 200;
let publicConfig = { available: true, turnstileSitekey: 'public-test-sitekey' };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if(pathname==='/api/config') {
    response.writeHead(configStatus,{'Content-Type':'application/json','Cache-Control':'no-store'});
    response.end(JSON.stringify(publicConfig));return;
  }
  if(pathname.startsWith('/admin')) {
    const asset=pathname==='/admin'?adminHtml:pathname==='/admin/app.js'?adminJs:adminCss;
    response.writeHead(200,{'Content-Type':pathname.endsWith('.js')?'text/javascript':pathname.endsWith('.css')?'text/css':'text/html'});
    response.end(asset);return;
  }
  const path = resolve(root, pathname === '/' ? 'index.html' : `.${pathname}`);
  if (!path.startsWith(root)) { response.writeHead(404).end(); return; }
  try { response.writeHead(200, { 'Content-Type': `${types[extname(path)] ?? 'application/octet-stream'}; charset=utf-8` }); response.end(await readFile(path)); }
  catch { response.writeHead(404).end(); }
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route('https://challenges.cloudflare.com/**', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: `globalThis.turnstile={render(target,options){globalThis.renderedSitekey=options.sitekey;const input=document.createElement('input');input.name='cf-turnstile-response';input.value='test-token';document.querySelector(target).append(input)},reset(){}}` }));
  let submitted;
  await page.route(`${origin}/api/reports`, async route => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ reportId: 'test-receipt', accepted: true }) });
  });
  await page.goto(origin);
  await page.locator('#submit').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('#submit').disabled);
  assert.equal(await page.locator('h1').textContent(), 'Report an incorrect result');
  assert.equal(await page.locator('#posting-url').getAttribute('required'), '');
  assert.equal(await page.locator('#report-file').getAttribute('accept'), 'application/json,.json');
  assert.equal(await page.locator('#turnstile').getAttribute('data-sitekey'), null);
  assert.equal(await page.evaluate(() => globalThis.renderedSitekey), 'public-test-sitekey');

  const diagnostic = {
    formatVersion: 2, extensionVersion: '1.0.1', createdAt: '2026-10-27T12:00:00Z',
    reason: 'Sponsorship finding looks wrong', sourceUrl: 'https://example.com/jobs/1?private=yes',
    scannedAt: '2026-10-27T11:59:00Z', pageKind: 'job-posting',
    role: { title: 'Engineer', employer: 'Example', location: 'Chicago', identifier: 'REQ-42' },
    displayedDecision: { status: 'no-blocker', label: 'No blocker found', explanation: 'No blocker was found.' }, warnings: [],
  };
  await page.locator('#report-file').setInputFiles({ name: 'report.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(diagnostic)) });
  await page.locator('#import-status').waitFor();
  assert.equal(await page.locator('#posting-url').inputValue(), 'https://example.com/jobs/1');
  assert.match(await page.locator('#diagnostic-summary').textContent(), /Displayed result: No blocker found/);
  await page.locator('#explanation').fill('The quoted policy is an explicit refusal.');
  await page.locator('#relevant-passage').fill('We cannot sponsor this position.');
  await page.locator('#notice-confirmed').check();
  await page.locator('#submit').click();
  await page.locator('#submit-status').filter({ hasText: 'test-receipt' }).waitFor();
  assert.equal(submitted.turnstileToken, 'test-token');
  assert.equal(submitted.noticeVersion, REPORT_NOTICE_VERSION, 'Form and backend use the same reviewed notice');
  assert.equal(submitted.posting.roleIdentifier, 'REQ-42');
  assert.equal(submitted.diagnostic.displayedDecision.status, 'no-blocker');
  assert.equal(submitted.diagnostic.partial,false);
  assert.equal(await page.evaluate(() => localStorage.length), 0);
  assert.equal(await page.evaluate(() => sessionStorage.length), 0);
  await page.locator('#report-file').setInputFiles({name:'unsupported.json',mimeType:'application/json',buffer:Buffer.from('{"formatVersion":99}')});
  await page.locator('#errors').filter({hasText:'supported SNS report'}).waitFor();
  assert.equal(await page.locator('#title').inputValue(),'Engineer','Failed import preserves the draft');
  await page.locator('#remove-diagnostic').click();
  assert.match(await page.locator('#diagnostic-summary').textContent(),/partial/);

  publicConfig = { available: false, turnstileSitekey: 'paused-sitekey' };
  const pausedPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let pausedChallenges = 0;
  let pausedSubmissions = 0;
  await pausedPage.route('https://challenges.cloudflare.com/**', route => { pausedChallenges++; return route.abort(); });
  await pausedPage.route(`${origin}/api/reports`, route => { pausedSubmissions++; return route.abort(); });
  await pausedPage.goto(origin);
  await pausedPage.locator('#submit-status').filter({hasText:'temporarily unavailable'}).waitFor();
  assert.equal(await pausedPage.locator('#submit').isDisabled(),true);
  assert.equal(pausedChallenges,0,'Paused startup must not load Turnstile');
  await pausedPage.locator('#report-file').setInputFiles({ name: 'report.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(diagnostic)) });
  await pausedPage.locator('#import-status').waitFor();
  assert.equal(await pausedPage.locator('#posting-url').inputValue(), 'https://example.com/jobs/1');
  await pausedPage.locator('form').evaluate(form => form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  await pausedPage.locator('#errors').filter({hasText:'temporarily unavailable'}).waitFor();
  assert.equal(pausedSubmissions,0,'Paused submission guard must not call the API');
  assert.equal(await pausedPage.locator('#posting-url').inputValue(), 'https://example.com/jobs/1','Paused submission preserves the draft');
  await pausedPage.close();

  publicConfig = { available: true, turnstileSitekey: '' };
  const missingKeyPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let missingKeyChallenges = 0;
  await missingKeyPage.route('https://challenges.cloudflare.com/**', route => { missingKeyChallenges++; return route.abort(); });
  await missingKeyPage.goto(origin);
  await missingKeyPage.locator('#submit-status').filter({hasText:'temporarily unavailable'}).waitFor();
  assert.equal(await missingKeyPage.locator('#submit').isDisabled(),true);
  assert.equal(missingKeyChallenges,0,'Missing public sitekey must not load Turnstile');
  await missingKeyPage.close();

  configStatus = 503;
  publicConfig = { error: 'unavailable' };
  const failedConfigPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let failedConfigChallenges = 0;
  await failedConfigPage.route('https://challenges.cloudflare.com/**', route => { failedConfigChallenges++; return route.abort(); });
  await failedConfigPage.goto(origin);
  await failedConfigPage.locator('#submit-status').filter({hasText:'could not be checked'}).waitFor();
  assert.equal(await failedConfigPage.locator('#submit').isDisabled(),true);
  assert.equal(failedConfigChallenges,0,'Config failure must not load Turnstile');
  await failedConfigPage.close();

  await page.route(`${origin}/app.js`,route=>route.fulfill({contentType:'text/javascript',body:adminJs}));
  await page.route(`${origin}/styles.css`,route=>route.fulfill({contentType:'text/css',body:adminCss}));
  const privateReport={id:'test-id',revision:0,title:'<script>bad()</script>',status:'new',received_at:'2026-10-27',expires_at:'2027-04-25',category:'other',severity:'normal',posting_url:'https://example.com/jobs/1',payload_json:'{"explanation":"<img src=x onerror=bad()>"}'};
  let action;
  await page.route(`${origin}/api/**`,async route=>{
    const path=new URL(route.request().url()).pathname;
    let data=path==='/api/health'?{health:[],counts:[]}:path==='/api/reports'?{reports:[privateReport],nextOffset:null}:{report:privateReport,events:[],contact:{email:'private@example.com'},duplicateCandidates:[]};
    if(route.request().method()==='POST'){action=route.request().postDataJSON();data={updated:true};}
    await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.goto(origin+'/admin');
  await page.locator('#list button').click();
  await page.locator('#detail').waitFor({state:'visible'});
  assert.equal(await page.locator('#title').textContent(),'<script>bad()</script> · test-id');
  assert.equal(await page.locator('#payload img').count(),0,'Private text cannot become HTML');
  assert.equal(await page.locator('#source').getAttribute('rel'),'noopener noreferrer');
  await page.locator('[name="note"]').fill('Reviewed fictional case');
  await page.locator('#review button').click();
  await page.locator('#message').filter({hasText:'Review saved'}).waitFor();
  assert.equal(action.note,'Reviewed fictional case');
  assert.equal(action.revision,0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile page has no horizontal overflow');
  console.log('PASS: local diagnostic import, explicit review, bounded submission, receipt, mobile layout, and no draft persistence.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
