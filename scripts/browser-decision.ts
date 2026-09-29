import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, writeFile, mkdir, realpath, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createDecisionServer } from '../server/decision-server';
import { DecisionService, LayaWorker } from '../server/decision-service';
import { DECISION_PERMISSION, DECISION_VERSION, type DecisionRequest, type DecisionResult } from '../src/decision';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const directory = await mkdtemp(join(tmpdir(), 'sns-decision-browser-'));
await cp('dist', join(directory, 'extension'), { recursive: true });
const extensionPath = await realpath(join(directory, 'extension'));
const manifest = JSON.parse(await readFile(join(extensionPath, 'manifest.json'), 'utf8'));
manifest.host_permissions = [DECISION_PERMISSION]; // Disposable profile only; production asks on opt-in.
await writeFile(join(extensionPath, 'manifest.json'), JSON.stringify(manifest));
const extensionId = createHash('sha256').update(extensionPath).digest('hex').slice(0, 32).replace(/[0-9a-f]/g, c => 'abcdefghijklmnop'[parseInt(c, 16)]!);
const fixture = createServer((_request, response) => {
  response.setHeader('Content-Type', 'text/html');
  response.end('<main><h1>Engineering Intern</h1><h2>Responsibilities</h2><p>Build useful software and collaborate with the team.</p><h2>Qualifications</h2><p id="policy">We do not sponsor applicants for this role.</p><a href="/apply">Apply</a><input value="PRIVATE_ANSWER"><textarea>PRIVATE_UPLOAD</textarea></main>');
});
const real = process.argv.includes('--real');
const worker = new LayaWorker();
const requests: DecisionRequest[] = [];
const service = new DecisionService(async request => {
  requests.push(request);
  if (real) return worker.run(request);
  await new Promise(resolve => setTimeout(resolve, 100));
  return { version: DECISION_VERSION, engine: 'laya', model: 'mock-browser-contract', blocks: request.blocks.map(block => ({ id: block.id,
    answers: { scope: { choice: 'role', probability: 0.99 }, sponsorship: { choice: block.text.includes('sponsor applicants') ? 'unavailable' : 'unclear', probability: 0.99 },
      timing: { choice: 'unspecified', probability: 0.99 }, cpt: { choice: 'unclear', probability: 0.99 }, opt: { choice: 'unclear', probability: 0.99 } } })) } satisfies DecisionResult;
});
const server = createDecisionServer(service, extensionId);
let context: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | undefined;
try {
  await new Promise<void>((ok, fail) => { fixture.once('error', fail); fixture.listen(0, '127.0.0.1', ok); });
  await new Promise<void>((ok, fail) => { server.once('error', fail); server.listen(4319, '127.0.0.1', ok); });
  const denied = await fetch('http://127.0.0.1:4319/decision', { method: 'POST', headers: { Origin: 'https://untrusted.test', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(denied.status, 403); assert.equal(requests.length, 0);
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
  await popup.waitForFunction(() => document.getElementById('findings')!.textContent!.includes('Local Laya preview'), null, { timeout: 180_000 });
  assert.equal(requests.length, 1);
  assert.doesNotMatch(JSON.stringify(requests), /PRIVATE_ANSWER|PRIVATE_UPLOAD|PRIVATE_URL/);
  if (!real) {
    assert.equal(await popup.locator('[data-finding="sponsorship"]').getAttribute('data-status'), 'unavailable');
    assert.match(await page.locator('#sponsor-not-sponsor-ui #toggle').innerText(), /unavailable/);
  }
  await popup.locator('[data-finding="sponsorship"] > summary').click();
  await mkdir('test-results', { recursive: true });
  await popup.screenshot({ path: `test-results/decision-${real ? 'real' : 'mock'}.png`, fullPage: true });
  const snapshot = await popup.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return chrome.tabs.sendMessage(tab!.id!, { type: 'GET_SCAN' });
  });
  assert.equal(snapshot.result.interpretation.decision.state, 'ready');
  await writeFile(`test-results/decision-${real ? 'real' : 'mock'}.json`, JSON.stringify(snapshot, null, 2));
  await popup.locator('#decision-enabled').uncheck();
  await popup.waitForFunction(() => !document.getElementById('findings')!.textContent!.includes('Local Laya preview'));
  await new Promise<void>(ok => server.close(() => ok()));
  await popup.locator('#decision-enabled').check();
  await popup.waitForFunction(() => document.getElementById('findings')!.textContent!.includes('Local Laya is unavailable'));
  assert.equal(await popup.locator('[data-finding="sponsorship"]').getAttribute('data-status'), 'unclear');
  assert.match(await page.locator('#sponsor-not-sponsor-ui #toggle').innerText(), /Laya unavailable/);
  assert.deepEqual(errors, []);
  console.log(`PASS: ${real ? 'real local Laya' : 'mock model'} browser path, opt-in, evidence transport, private-answer exclusion, popup/panel consistency, opt-out, service outage, origin restriction. This checks integration, not accuracy.`);
} finally {
  worker.close(); await context?.close();
  await Promise.all([fixture, server].map(s => new Promise<void>(ok => s.close(() => ok()))));
  await rm(directory, { recursive: true, force: true });
}
