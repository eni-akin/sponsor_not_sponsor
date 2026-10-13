import assert from 'node:assert/strict';
import { createServer, request as httpRequest } from 'node:http';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, writeFile, mkdir, realpath, rm, symlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createDecisionServer } from '../server/decision-server';
import { DecisionService, LayaWorker } from '../server/decision-service';
import { decisionQuestions } from '../server/decision-questions';
import { DECISION_ORIGIN, DECISION_VERSION, computeConfigurationDigests, type DecisionRequest, type DecisionResult } from '../src/decision';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const directory = await mkdtemp(join(tmpdir(), 'sns-decision-browser-'));
await cp('dist', join(directory, 'extension'), { recursive: true });
const extensionPath = await realpath(join(directory, 'extension'));
const manifest = JSON.parse(await readFile(join(extensionPath, 'manifest.json'), 'utf8'));
const extensionId = createHash('sha256').update(extensionPath).digest('hex').slice(0, 32).replace(/[0-9a-f]/g, c => 'abcdefghijklmnop'[parseInt(c, 16)]!);
const fixture = createServer((request, response) => {
  response.setHeader('Content-Type', 'text/html');
  const scenario = new URL(request.url!, 'http://localhost').pathname.replace(/[^a-z-]/g, '');
  response.end(`<main><h1>Engineering Intern ${scenario}</h1><h2>Responsibilities</h2><p>Build useful software and collaborate with the team.</p><h2>Qualifications</h2><p id="policy">We do not sponsor applicants for this role.</p><a href="/apply">Apply</a><input value="PRIVATE_ANSWER"><textarea>PRIVATE_UPLOAD</textarea></main>`);
});
const real = process.argv.includes('--real');
if (real) {
  const revision = 'e4e9ddf21a7b1903b7acffd8814ad4307bf63a67';
  const base = resolve('.model-cache/hub/models--convaiinnovations--laya-multilingual/snapshots', revision);
  const privateModel = join(directory, 'model');
  await mkdir(privateModel);
  await cp(join(base, 'tokenizer'), join(privateModel, 'tokenizer'), { recursive: true, dereference: true });
  await cp(join(base, 'rl_agent_config.json'), join(privateModel, 'rl_agent_config.json'), { dereference: true });
  await symlink(await realpath(join(base, 'model.safetensors')), join(privateModel, 'model.safetensors'));
  await symlink(await realpath(join(base, 'encoder')), join(privateModel, 'encoder'));
  process.env.LAYA_MODEL = privateModel;
  process.env.LAYA_REVISION = revision;
  delete process.env.LAYA_FAKE_WORKER;
}
const worker = new LayaWorker();
const requests: DecisionRequest[] = [];
let mode: 'complete' | 'partial' | 'malformed' | 'delayed' = 'complete';
const service = new DecisionService(async request => {
  requests.push(request);
  if (real) return worker.run(request);
  const requestMode = mode;
  console.log(`Browser fixture: ${requestMode}, ${request.title}, ${request.blocks.length} blocks`);
  await new Promise(resolve => setTimeout(resolve, requestMode === 'delayed' ? 1500 : 100));
  const digests = computeConfigurationDigests(decisionQuestions);
  const blocks = request.blocks.map(block => ({
    id: block.id,
    screening: { status: 'success' as const, choice: block.text.includes('sponsor applicants') ? ('relevant' as const) : ('irrelevant' as const), probability: 0.99 },
    route: 'uncertain' as const,
    interpretation: {
      status: 'interpreted' as const,
      answers: {
        scope: { choice: block.text.includes('sponsor applicants') ? ('role' as const) : ('none' as const), probability: 0.99 },
        sponsorship: { choice: block.text.includes('sponsor applicants') ? (requestMode === 'delayed' ? ('unavailable' as const) : ('available' as const)) : ('unclear' as const), probability: 0.99 },
        timing: { choice: 'unspecified' as const, probability: 0.99 },
        cpt: { choice: 'unclear' as const, probability: 0.99 },
        opt: { choice: 'unclear' as const, probability: 0.99 },
      },
    },
  }));
  const result: DecisionResult = {
    version: DECISION_VERSION,
    engine: 'laya',
    model: 'mock-browser-contract',
    configuration: digests,
    processing: {
      status: 'complete',
      inputCount: request.blocks.length,
      context: { complete: request.blocks.length, missing: 0 },
      screening: { success: request.blocks.length, failed: 0, unsupported: 0 },
      interpretation: { interpreted: request.blocks.length, skipped: 0, failed: 0, unsupported: 0 },
    },
    blocks,
  };
  if (requestMode === 'partial') {
    const last = result.blocks.at(-1)!;
    last.screening = { status: 'failed', reason: 'inference-failed' };
    last.route = 'uncertain';
    last.interpretation = { status: 'failed', reason: 'screening-failed' };
    result.processing.status = 'partial';
    result.processing.screening.success--;
    result.processing.screening.failed++;
    result.processing.interpretation.interpreted--;
    result.processing.interpretation.failed++;
  }
  if (requestMode === 'malformed') result.processing.inputCount++;
  return result;
});
const server = createDecisionServer(service, extensionId, 0);
let context: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | undefined;
try {
  await new Promise<void>((ok, fail) => { fixture.once('error', fail); fixture.listen(0, '127.0.0.1', ok); });
  await new Promise<void>((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok); });
  const decisionOrigin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  // Only the disposable bundle/profile uses this test server; installed settings stay unchanged.
  manifest.host_permissions = [`${decisionOrigin}/*`];
  manifest.optional_host_permissions = [`${decisionOrigin}/*`];
  await writeFile(join(extensionPath, 'manifest.json'), JSON.stringify(manifest));
  for (const name of ['background.js', 'content.js', 'popup.js']) {
    const path = join(extensionPath, name);
    const source = await readFile(path, 'utf8');
    await writeFile(path, source.replaceAll(DECISION_ORIGIN, decisionOrigin));
  }
  const denied = await fetch(`${decisionOrigin}/decision`, { method: 'POST', headers: { Origin: 'https://untrusted.test', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(denied.status, 403); assert.equal(requests.length, 0);
  const authorizedOrigin = `chrome-extension://${extensionId}`;
  const invalid = await fetch(`${decisionOrigin}/decision`, { method: 'POST', headers: { Origin: authorizedOrigin, 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(invalid.status, 400, 'Actual ephemeral Host is accepted before input validation');
  const wrongHostStatus = await new Promise<number>(resolve => {
    const request = httpRequest(`${decisionOrigin}/decision`, { method: 'POST', headers: { Origin: authorizedOrigin, Host: 'localhost:1', 'Content-Type': 'application/json' } }, response => {
      response.resume(); resolve(response.statusCode!);
    });
    request.end('{}');
  });
  assert.equal(wrongHostStatus, 403, 'Host guard remains strict on the isolated server');
  const port = (fixture.address() as { port: number }).port;
  context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`], viewport: { width: 420, height: 850 } });
  const errors: string[] = []; context.on('weberror', error => errors.push(error.error().message));
  const page = await context.newPage(); await page.goto(`http://127.0.0.1:${port}/job?private=PRIVATE_URL`);
  const popup = await context.newPage(); await page.bringToFront(); await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.locator('#onboarding-done').click();
  await popup.waitForFunction(() => document.getElementById('status')!.textContent === 'Job posting detected');
  assert.equal(requests.length, 0);
  await popup.locator('.decision-settings > summary').click(); await popup.locator('#decision-enabled').check();
  await popup.waitForFunction(() => document.querySelector('[data-comparison-state="ready"]'), null, { timeout: 180_000 });
  assert.equal(requests.length, 1);
  assert.doesNotMatch(JSON.stringify(requests), /PRIVATE_ANSWER|PRIVATE_UPLOAD|PRIVATE_URL/);
  if (!real) {
    assert.equal(await popup.locator('[data-finding="main"]').getAttribute('data-status'), 'explicit-blocker');
    assert.equal(await popup.locator('[data-finding="model-main"]').getAttribute('data-status'), 'sponsorship-stated');
    assert.match(await page.locator('#sponsor-not-sponsor-ui #toggle').innerText(), /Explicit blocker found/);
    assert.equal(await page.locator('#sponsor-not-sponsor-ui [data-finding="main"]').getAttribute('data-status'), 'explicit-blocker');
    assert.equal(await page.locator('#sponsor-not-sponsor-ui [data-finding="model-main"]').getAttribute('data-status'), 'sponsorship-stated');
  }
  await popup.locator('[data-finding="main"] > summary').click();
  await popup.locator('[data-finding="model-main"] > summary').click();
  await mkdir('test-results', { recursive: true });
  await popup.locator('#findings').screenshot({ path: `test-results/decision-${real ? 'real' : 'mock'}.png` });
  const snapshot = await popup.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return chrome.tabs.sendMessage(tab!.id!, { type: 'GET_SCAN' });
  });
  assert.equal(snapshot.result.decisionComparison.state, 'ready');
  assert.equal(snapshot.result.interpretation.sponsorship.status, 'unavailable');
  if (!real) assert.equal(snapshot.result.decisionComparison.interpretation.sponsorship.status, 'available');
  await writeFile(`test-results/decision-${real ? 'real' : 'mock'}.json`, JSON.stringify(snapshot, null, 2));
  if (!real) {
    const openScenario = async (name: string) => {
      await page.goto(`http://127.0.0.1:${port}/${name}`);
      await page.bringToFront();
      await popup.waitForFunction(value => document.querySelector('#title')?.textContent?.includes(value), name);
    };
    const waitComparison = (state: string) => popup.waitForFunction(
      value => document.querySelector(`[data-comparison-state="${value}"]`), state,
    );
    mode = 'partial';
    await openScenario('partial');
    await waitComparison('ready');
    await popup.waitForFunction(() => document.body.textContent?.includes('partial processing'));
    assert.equal(await popup.locator('[data-finding="model-main"]').getAttribute('data-status'), 'could-not-verify');
    assert.equal(await popup.locator('[data-finding="main"]').getAttribute('data-status'), 'explicit-blocker');
    await page.waitForFunction(() => document.querySelector('#sponsor-not-sponsor-ui')?.shadowRoot?.textContent?.includes('partial processing'));
    assert.equal(await page.locator('#sponsor-not-sponsor-ui [data-finding="model-main"]').getAttribute('data-status'), 'could-not-verify');
    await popup.locator('#findings').screenshot({ path: 'test-results/decision-partial.png' });

    mode = 'malformed';
    await openScenario('malformed');
    await waitComparison('error');
    assert.equal(await popup.locator('[data-finding="model-main"]').count(), 0);
    assert.equal(await popup.locator('[data-finding="main"]').getAttribute('data-status'), 'explicit-blocker');

    mode = 'delayed';
    await openScenario('old-job');
    await popup.waitForFunction(() => document.querySelector('[data-comparison-state="pending"]'));
    await popup.locator('#decision-enabled').uncheck();
    await waitComparison('disabled');
    await new Promise(resolve => setTimeout(resolve, 1800));
    assert.equal(await popup.locator('[data-finding="model-main"]').count(), 0);

    await popup.locator('#decision-enabled').check();
    await waitComparison('ready');
    mode = 'delayed';
    await openScenario('stale-job');
    await waitComparison('pending');
    mode = 'complete';
    await openScenario('current-job');
    await waitComparison('ready');
    const current = await popup.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return chrome.tabs.sendMessage(tab!.id!, { type: 'GET_SCAN' });
    });
    assert.match(current.result.role.title, /current-job/);
    assert.equal(current.result.decisionComparison.state, 'ready');
    assert.equal(current.result.decisionComparison.interpretation.sponsorship.status, 'available', 'Delayed old-role refusal cannot replace current-role offer');
    assert.equal(await popup.locator('[data-finding="main"]').getAttribute('data-status'), 'explicit-blocker');
    assert.doesNotMatch(JSON.stringify(requests), /PRIVATE_ANSWER|PRIVATE_UPLOAD|PRIVATE_URL/);
  }
  await popup.locator('#decision-enabled').uncheck();
  await popup.waitForFunction(() => document.querySelector('[data-comparison-state="disabled"]'));
  assert.equal(await popup.locator('[data-finding="main"]').getAttribute('data-status'), 'explicit-blocker');
  await new Promise<void>(ok => server.close(() => ok()));
  await popup.locator('#decision-enabled').check();
  await popup.waitForFunction(() => document.querySelector('[data-comparison-state="error"]'));
  assert.equal(await popup.locator('[data-finding="main"]').getAttribute('data-status'), 'explicit-blocker');
  assert.match(await page.locator('#sponsor-not-sponsor-ui #toggle').innerText(), /Explicit blocker found/);
  assert.deepEqual(errors, []);
  await writeFile(`test-results/decision-integration-${real ? 'real' : 'mock'}-review.json`, JSON.stringify({
    status: 'passed', isolatedServer: true, installedSettingsChanged: false,
    checks: ['opt-in', 'opt-out', 'privacy', 'popup-panel-parity', 'deterministic-badge', 'origin-denial', 'host-denial', 'service-outage',
      ...(real ? [] : ['partial-processing', 'malformed-reply', 'disable-pending', 'navigation-stale-reply'])],
    requests: requests.length,
  }, null, 2));
  console.log(`PASS: ${real ? 'real local Laya' : 'mock model'} isolated browser path, opt-in/out, privacy, popup/panel consistency, service outage, origin restriction${real ? '' : ', partial processing, malformed reply, disable-pending, stale navigation'}. This checks integration, not accuracy.`);
} finally {
  worker.close(); await context?.close();
  await Promise.all([fixture, server].map(s => new Promise<void>(ok => s.close(() => ok()))));
  await rm(directory, { recursive: true, force: true });
}
