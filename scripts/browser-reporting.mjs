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

async function checkSurfaceUI(page, name, focusSelector, contrastSelectors) {
  for (const control of await page.locator('button:visible:not(:disabled), input:visible:not([type="checkbox"]), select:visible, textarea:visible, summary:visible, .actions a:visible, #errors a:visible').all()) {
    const box=await control.boundingBox();
    assert.ok(box.width>=44 && box.height>=44, name+' control needs a 44px target: '+await control.evaluate(element=>element.id||element.tagName));
  }
  for (const selector of contrastSelectors) {
    const ratio=await page.locator(selector).first().evaluate(element=>{
      const luminance=color=>{
        const [r,g,b]=color.match(/[\d.]+/g).slice(0,3).map(Number).map(channel=>{
          const value=channel/255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;
        });
        return .2126*r+.7152*g+.0722*b;
      };
      let background=element;
      while (background.parentElement && getComputedStyle(background).backgroundColor==='rgba(0, 0, 0, 0)') background=background.parentElement;
      const values=[luminance(getComputedStyle(element).color),luminance(getComputedStyle(background).backgroundColor)].sort((a,b)=>b-a);
      return (values[0]+.05)/(values[1]+.05);
    });
    assert.ok(ratio>=4.5,name+' text contrast must meet 4.5:1: '+selector);
  }
  const viewport=page.viewportSize();
  for (const width of [320,640]) {
    await page.setViewportSize({width,height:256});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' reflows at '+width+' CSS pixels');
    await page.locator(focusSelector).focus();
    await page.locator(focusSelector).scrollIntoViewIfNeeded();
    const focusedBox=await page.locator(focusSelector).boundingBox();
    assert.ok(focusedBox.y>=-1 && focusedBox.y+focusedBox.height<=257,name+' focused control remains reachable at short height: '+JSON.stringify({width,box:focusedBox}));
  }
  await page.setViewportSize(viewport);
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  await page.keyboard.press('Tab');
  await page.locator(focusSelector).focus();
  assert.equal(await page.locator(focusSelector).evaluate(element=>element.matches(':focus-visible')&&getComputedStyle(element).outlineStyle!=='none'),true,name+' keyboard focus survives forced colours');
  assert.equal(await page.locator(focusSelector).evaluate(element=>getComputedStyle(element).transitionDuration),'0s',name+' respects reduced motion');
  await page.emulateMedia({forcedColors:'none',reducedMotion:'no-preference'});
}

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route('https://challenges.cloudflare.com/**', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: `let challenges=0;globalThis.turnstile={render(target,options){globalThis.renderedSitekey=options.sitekey;const input=document.createElement('input');input.type='hidden';input.name='cf-turnstile-response';input.value='test-token';document.querySelector(target).append(input)},reset(){document.querySelector('[name="cf-turnstile-response"]').value='test-token-'+(++challenges)}}` }));
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
  await page.locator('#submit').click();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'errors');
  assert.ok(await page.locator('#errors a').count() >= 2);
  assert.equal(await page.locator('#posting-url').getAttribute('aria-invalid'), 'true');
  for (const link of await page.locator('#errors a').all()) {
    const box=await link.boundingBox();
    assert.ok(box.width>=44&&box.height>=44,'Actionable error-summary link needs a 44px target: '+JSON.stringify(box));
  }
  await page.locator('#errors a').first().focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'posting-url','Keyboard error-summary link focuses its field');

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
  await checkSurfaceUI(page,'Public form','#submit',['#submit','.hint','label[for="posting-url"]']);
  const confirmationBox=await page.locator('.confirm').boundingBox();
  assert.ok(confirmationBox.width>=44&&confirmationBox.height>=44,'Checkbox label supplies a 44px target');
  await page.locator('#submit').click();
  await page.waitForURL('**/received.html');
  await page.locator('#receipt').filter({ hasText: 'test-receipt' }).waitFor();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'received-heading');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'copy-receipt','Receipt heading leads to copy action in keyboard order');
  await checkSurfaceUI(page,'Receipt','#copy-receipt',['#copy-receipt','#receipt','.actions .button']);
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', {value:{writeText:async text=>{globalThis.copiedReceipt=text}},configurable:true}); });
  await page.locator('#copy-receipt').click();
  await page.locator('#copy-status').filter({hasText:'Receipt copied'}).waitFor();
  assert.equal(await page.evaluate(() => globalThis.copiedReceipt), 'test-receipt');
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('denied'); }; });
  await page.locator('#copy-receipt').click();
  await page.locator('#copy-status').filter({hasText:'copy it manually'}).waitFor();
  await page.screenshot({path:'test-results/reporting-received.png',fullPage:true});
  assert.equal(await page.locator('h1').textContent(), 'Report received');
  assert.equal(submitted.turnstileToken, 'test-token');
  assert.equal(submitted.noticeVersion, REPORT_NOTICE_VERSION, 'Form and backend use the same reviewed notice');
  assert.equal(submitted.posting.roleIdentifier, 'REQ-42');
  assert.equal(submitted.diagnostic.displayedDecision.status, 'no-blocker');
  assert.equal(submitted.diagnostic.partial,false);
  assert.equal(await page.evaluate(() => localStorage.length), 0);
  assert.equal(await page.evaluate(() => sessionStorage.length), 0);
  await page.reload();
  assert.equal(await page.locator('h1').textContent(), 'No recent receipt is available');
  await page.evaluate(() => sessionStorage.setItem('sns.receipt.v1', JSON.stringify({reportId:'expired',receivedAt:'2020-01-01T00:00:00Z'})));
  await page.reload();
  assert.equal(await page.locator('#receipt-panel').isHidden(),true);
  for (const transfer of ['{invalid', JSON.stringify({reportId:'<script>bad()</script>',receivedAt:new Date().toISOString()})]) {
    await page.evaluate(value => sessionStorage.setItem('sns.receipt.v1', value), transfer);
    await page.reload();
    assert.equal(await page.locator('h1').textContent(), 'No recent receipt is available');
    assert.equal(await page.locator('#receipt-panel').isHidden(), true);
    assert.equal(await page.evaluate(() => sessionStorage.length), 0, 'Malformed transfers are consumed safely');
  }
  await page.goto(origin);
  await page.route(origin+'/api/reports', route => route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Please retry later.'})}));
  await page.locator('#report-file').setInputFiles({ name: 'report.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(diagnostic)) });
  await page.waitForFunction(() => document.querySelector('#title').value === 'Engineer');
  await page.locator('#report-file').setInputFiles({name:'unsupported.json',mimeType:'application/json',buffer:Buffer.from('{"formatVersion":99}')});
  await page.locator('#errors').filter({hasText:'supported SNS report'}).waitFor();
  assert.equal(await page.locator('#title').inputValue(),'Engineer','Failed import preserves the draft');
  await page.locator('#remove-diagnostic').click();
  assert.match(await page.locator('#diagnostic-summary').textContent(),/partial/);
  await page.locator('#explanation').fill('Preserve this draft after failure.');
  await page.locator('#notice-confirmed').check();
  await page.locator('#submit').click();
  await page.locator('#errors').filter({hasText:'Please retry later'}).waitFor();
  assert.equal(await page.locator('#explanation').inputValue(),'Preserve this draft after failure.');
  for (const width of [375,768,1024,1440]) {
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.screenshot({path:'test-results/reporting-form.png',fullPage:true});

  const attempts = [];
  const receipts = new Map();
  let releaseLostResponse;
  let firstRequestStarted;
  const lostResponse = new Promise(resolve => { releaseLostResponse = resolve; });
  const requestStarted = new Promise(resolve => { firstRequestStarted = resolve; });
  await page.route(origin+'/api/reports', async route => {
    const body = route.request().postDataJSON();
    attempts.push(body);
    const existing = receipts.has(body.submissionKey);
    if (!existing) receipts.set(body.submissionKey, 'retry-receipt-'+receipts.size);
    if (attempts.length === 1) {
      firstRequestStarted();
      await lostResponse;
      await route.abort('failed');
      return;
    }
    await route.fulfill({status:existing?200:201,contentType:'application/json',body:JSON.stringify({accepted:true,reportId:receipts.get(body.submissionKey)})});
  });
  // Denied receipt storage must keep the confirmed receipt on the editable form.
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Storage denied', 'SecurityError'); }; });
  await page.locator('#submit').click();
  await requestStarted;
  assert.equal(await page.locator('#submit').isDisabled(), true);
  assert.equal(await page.locator('#submit').textContent(), 'Submitting…');
  assert.equal(await page.locator('form').getAttribute('aria-busy'), 'true');
  releaseLostResponse();
  await page.locator('#errors').filter({hasText:'Failed to fetch'}).waitFor();
  assert.equal(await page.locator('#explanation').inputValue(), 'Preserve this draft after failure.');
  assert.equal(await page.locator('#submit').isDisabled(), false);
  assert.equal(await page.locator('form').getAttribute('aria-busy'), null);
  await page.locator('#submit').click();
  await page.locator('#submit-status').filter({hasText:'Receipt navigation is unavailable'}).waitFor();
  assert.equal(attempts.length, 2);
  assert.equal(attempts[1].submissionKey, attempts[0].submissionKey, 'Unchanged retry retains its submission key');
  assert.notEqual(attempts[1].turnstileToken, attempts[0].turnstileToken, 'Retry uses a fresh challenge');
  assert.equal(receipts.size, 1, 'Lost-response retry returns the original receipt');
  assert.match(await page.locator('#submit-status').textContent(), /retry-receipt-0/);
  assert.equal(new URL(page.url()).pathname, '/', 'Storage denial leaves the confirmed receipt visible in place');
  await page.locator('#explanation').fill('The reporter deliberately changed this draft.');
  await page.locator('#submit').click();
  await page.locator('#submit-status').filter({hasText:'retry-receipt-1'}).waitFor();
  assert.equal(attempts.length, 3);
  assert.notEqual(attempts[2].submissionKey, attempts[1].submissionKey, 'Edited draft receives a new submission key');

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
  const privateReport={id:'test-id',revision:0,title:'<script>bad()</script>',status:'new',received_at:'2026-10-27',expires_at:'2027-04-25',category:'other',severity:'normal',posting_url:'https://example.com/jobs/1',payload_json:JSON.stringify({explanation:'<img src=x onerror=bad()>',expectedOutcome:'Explicit blocker found',relevantPassage:'Fictional public policy passage.'})};
  const historyNote = 'Fictional review: '+ 'Long public-evidence review note. '.repeat(12) + '<img src=x onerror=bad()>';
  const events=[{occurred_at:'2026-10-31T12:00:00Z',actor:'owner@example.com',event_type:'review',detail:JSON.stringify({status:'reviewing',severity:'high',resolution:'',note:historyNote})}];
  const duplicateCandidates=[{id:'possible-duplicate-1',title:'A long fictional vacancy title '.repeat(4),status:'reviewing',received_at:'2026-10-30T12:00:00Z'},{id:'possible-duplicate-2',title:'<img src=x onerror=bad()>',status:'closed',received_at:'2026-10-29T12:00:00Z'}];
  const health={health:[{name:'cleanup',succeeded_at:new Date().toISOString(),failed_at:null,deleted_count:2}],counts:[{status:'new',count:1},{status:'reviewing',count:2}]};
  let action;
  let emptyInbox = false;
  let healthFailure = false;
  let listFailure = false;
  let releaseList;
  let releaseHealth;
  let detailReady;
  let detailStarted;
  const listReady = new Promise(resolve => { releaseList=resolve; });
  const healthReady = new Promise(resolve => { releaseHealth=resolve; });
  await page.route(`${origin}/api/**`,async route=>{
    const url=new URL(route.request().url());
    const path=url.pathname;
    if (path === '/api/reports') {
      await listReady;
      if (listFailure) { await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Fictional list failure.'})}); return; }
    }
    if (path === '/api/health') {
      await healthReady;
      if (healthFailure) { await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Fictional health failure.'})}); return; }
    }
    if (path === '/api/reports/test-id' && detailReady) {
      detailStarted();
      await detailReady;
    }
    let data=path==='/api/health'?health:path==='/api/reports'?{reports:[privateReport],nextOffset:Number(url.searchParams.get('offset'))===0?25:null}:{report:privateReport,events,contact:{email:'private@example.com'},duplicateCandidates};
    if (emptyInbox && path === '/api/reports') data={reports:[],nextOffset:null};
    if(route.request().method()==='POST'){
      action=route.request().postDataJSON();
      if (action.revision !== privateReport.revision) { await route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'Report changed. Reload before saving.'})}); return; }
      if (path.endsWith('/delete')) emptyInbox=true;
      data={updated:true};
    }
    await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto(origin+'/admin');
  await page.locator('#list-state').filter({hasText:'Loading reports'}).waitFor();
  releaseList();
  await page.locator('#list-state').filter({hasText:'Showing 1–1'}).waitFor();
  await page.getByText('Service health', {exact:true}).click();
  await page.locator('#health-state').filter({hasText:'Loading service health'}).waitFor();
  releaseHealth();
  await page.locator('#health-state').filter({hasText:'Service health loaded'}).waitFor();
  assert.ok((await page.locator('#health-summary').textContent()).includes(health.health[0].succeeded_at));
  await page.locator('#list button').click();
  await page.locator('#detail').waitFor({state:'visible'});
  await page.locator('#duplicates').filter({hasText:'possible-duplicate-2'}).waitFor();
  assert.match(await page.locator('#events').textContent(), /Long public-evidence review note/);
  assert.equal(await page.locator('#duplicates img, #events img').count(), 0, 'Duplicate and history text remains literal');
  await checkSurfaceUI(page,'Inbox','#review button',['#review button','#source','#list button']);
  await page.locator('#list button').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.activeElement.id==='title');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'source','Opening a report by keyboard leads from its heading to the public source');
  for (const width of [375,390,1024,1440]) {
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'Populated inbox fits '+width+'px');
    const listBox=await page.locator('.inbox-layout aside').boundingBox();
    const detailBox=await page.locator('#detail').boundingBox();
    assert.ok(width<760 ? detailBox.y>=listBox.y+listBox.height : detailBox.x>=listBox.x+listBox.width, 'Inbox layout adapts at '+width+'px');
    if (width===375 || width===1440) await page.screenshot({path:'test-results/reporting-inbox-'+width+'.png',fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('#next').click();
  await page.locator('#list-state').filter({hasText:'Showing 26–26'}).waitFor();
  assert.equal(await page.locator('#previous').isDisabled(),false);
  assert.equal(await page.locator('#next').isDisabled(),true);
  await page.locator('#previous').click();
  await page.locator('#list-state').filter({hasText:'Showing 1–1'}).waitFor();
  assert.equal(await page.locator('#delete').isDisabled(),true);
  await page.locator('#confirmation').fill('wrong');
  assert.equal(await page.locator('#delete').isDisabled(),true);
  await page.locator('#confirmation').fill('test-id');
  assert.equal(await page.locator('#delete').isDisabled(),false);
  await page.screenshot({path:'test-results/reporting-inbox.png',fullPage:true});
  assert.equal(await page.locator('#title').textContent(),'<script>bad()</script> · test-id');
  assert.equal(await page.locator('#payload img').count(),0,'Private text cannot become HTML');
  assert.equal(await page.locator('#source').getAttribute('rel'),'noopener noreferrer');
  await page.locator('[name="note"]').fill('Reviewed fictional case');
  await page.locator('#review button').click();
  await page.locator('#message').filter({hasText:'Review saved'}).waitFor();
  await page.waitForFunction(()=>document.querySelector('[name="note"]').value==='');
  assert.equal(action.note,'Reviewed fictional case');
  assert.equal(action.revision,0);
  privateReport.revision=1;
  privateReport.status='reviewing';
  privateReport.severity='high';
  await page.locator('[name="note"]').fill('Keep this unsaved note through conflict recovery.');
  await page.locator('[name="severity"]').selectOption('low');
  await page.locator('#review button').click();
  await page.locator('#message').filter({hasText:'Reload before saving'}).waitFor();
  assert.equal(action.revision,0);
  assert.equal(await page.locator('[name="note"]').inputValue(),'Keep this unsaved note through conflict recovery.');
  let releaseDetail;
  detailReady=new Promise(resolve=>{releaseDetail=resolve;});
  const recoveryStarted=new Promise(resolve=>{detailStarted=resolve;});
  await page.locator('#refresh-detail').click();
  await recoveryStarted;
  await page.locator('[name="note"]').fill('This note was edited while the latest report was loading.');
  releaseDetail();
  await page.waitForFunction(()=>document.querySelector('[name="severity"]').value==='high');
  detailReady=undefined;
  assert.equal(await page.locator('[name="note"]').inputValue(),'This note was edited while the latest report was loading.');
  await page.locator('#review button').click();
  await page.locator('#message').filter({hasText:'Review saved'}).waitFor();
  await page.waitForFunction(()=>document.querySelector('[name="note"]').value==='');
  assert.equal(action.revision,1,'Recovery saves against the current revision');
  assert.equal(action.note,'This note was edited while the latest report was loading.');

  for (const succeededAt of [new Date(Date.now()-3*60*60*1000).toISOString(),'not-a-timestamp']) {
    health.health[0].succeeded_at=succeededAt;
    await page.locator('#reload').click();
    await page.waitForFunction(value=>document.querySelector('#health-summary').textContent.includes(value),succeededAt);
    await page.locator('#health-state').filter({hasText:'Cleanup needs attention'}).waitFor();
    assert.ok((await page.locator('#health-summary').textContent()).includes(succeededAt), 'Stale or invalid success must not appear healthy');
  }
  health.health[0].succeeded_at=new Date(Date.now()-60*60*1000).toISOString();
  health.health[0].failed_at=new Date().toISOString();
  await page.locator('#reload').click();
  await page.locator('#health-state').filter({hasText:'Cleanup needs attention'}).waitFor();
  healthFailure=true;
  await page.locator('#reload').click();
  await page.locator('#health-state').filter({hasText:'Service health could not be loaded'}).waitFor();
  await page.locator('#list-state').filter({hasText:'Showing 1–1'}).waitFor();
  assert.match(await page.locator('#list-state').textContent(), /Showing 1–1/, 'Health failure leaves a successful list intact');
  assert.equal(await page.locator('#list button').count(),1);
  assert.equal(await page.locator('#health').textContent(),'','Failed health clears stale diagnostic output');
  assert.equal(await page.locator('#health-summary').textContent(),'','Failed health clears stale summaries');
  healthFailure=false;
  health.health[0].failed_at=null;
  health.health[0].succeeded_at=new Date().toISOString();
  listFailure=true;
  await page.locator('#reload').click();
  await page.locator('#list-state').filter({hasText:'Reports could not be loaded'}).waitFor();
  listFailure=false;
  await page.locator('#reload').click();
  await page.locator('#list-state').filter({hasText:'Showing 1–1'}).waitFor();
  await page.locator('#confirmation').fill('test-id');
  await page.locator('#delete').click();
  await page.locator('#message').filter({hasText:'Report deleted'}).waitFor();
  await page.locator('#list-state').filter({hasText:'No reports match'}).waitFor();
  assert.equal(action.revision,1);
  assert.equal(action.confirm,'test-id');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile page has no horizontal overflow');
  console.log('PASS: imports, validation, loading, lost-response retry identity, receipt fallbacks, populated mobile/desktop inbox, independent health, conflict recovery, pagination, typed deletion, and no draft persistence.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
