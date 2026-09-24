import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setTimeout as wait } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { ScanController } from '../src/controller';
import { DEFAULT_SETTINGS } from '../src/settings';

const html = readFileSync(new URL('./fixtures/generic-job.html', import.meta.url), 'utf8');
const setup = (paused = false) => {
  const dom = new JSDOM(html, { url: 'https://example.com/jobs/123' });
  const controller = new ScanController(dom.window.document, dom.window as unknown as Window, { ...DEFAULT_SETTINGS, paused });
  return { dom, controller, close: () => { controller.dispose(); dom.window.close(); } };
};

test('delayed relevant text invalidates the old result and triggers a new scan', async () => {
  const { dom, controller, close } = setup();
  try {
    const paragraph = dom.window.document.createElement('p');
    paragraph.textContent = 'No future sponsorship is available.';
    dom.window.document.querySelector('main')!.append(paragraph);
    await wait(0);
    assert.equal(controller.getSnapshot().result, null);
    await wait(350);
    assert.ok(controller.getSnapshot().result?.role?.evidence.some(block => block.text.includes('No future sponsorship')));
  } finally { close(); }
});

test('SPA navigation clears old results immediately, even before the new DOM arrives', async () => {
  const { dom, controller, close } = setup();
  try {
    dom.window.history.pushState({}, '', '/jobs/456');
    assert.equal(controller.getSnapshot().result, null);
    await wait(350);
    assert.equal(controller.getSnapshot().result, null);
    dom.window.document.querySelector('h1')!.textContent = 'Research Scientist';
    await wait(350);
    assert.equal(controller.getSnapshot().result?.role?.title, 'Research Scientist');
    assert.equal(controller.getSnapshot().result?.url, 'https://example.com/jobs/456');
  } finally { close(); }
});

test('switching a role without changing the URL clears the previous result', async () => {
  const { dom, controller, close } = setup();
  try {
    const oldKey = controller.getSnapshot().result?.role?.key;
    dom.window.document.querySelector('h1')!.textContent = 'Product Analyst';
    await wait(0);
    assert.equal(controller.getSnapshot().result, null);
    await wait(350);
    assert.notEqual(controller.getSnapshot().result?.role?.key, oldKey);
  } finally { close(); }
});

test('manual rescan immediately after navigation cannot attach stale text to the new URL', () => {
  const { dom, controller, close } = setup();
  try {
    dom.window.history.pushState({}, '', '/jobs/another');
    assert.equal(controller.scan().result, null);
    assert.equal(controller.getSnapshot().state, 'scanning');
  } finally { close(); }
});

test('pause is honored on startup and clears text; site disable and resume also work', () => {
  const { controller, close } = setup(true);
  try {
    assert.equal(controller.getSnapshot().state, 'paused');
    assert.equal(controller.getSnapshot().result, null);
    controller.updateSettings({ paused: false, disabledHosts: ['example.com'] });
    assert.equal(controller.getSnapshot().state, 'disabled');
    controller.updateSettings(DEFAULT_SETTINGS);
    assert.equal(controller.getSnapshot().result?.kind, 'job-posting');
    controller.updateSettings({ paused: true, disabledHosts: [] });
    assert.equal(controller.getSnapshot().result, null);
  } finally { close(); }
});

test('navigation decoration and typed input do not repeatedly rescan', async () => {
  const { dom, controller, close } = setup();
  try {
    const nav = dom.window.document.createElement('nav');
    dom.window.document.body.prepend(nav);
    await wait(0);
    const result = controller.getSnapshot().result;
    nav.textContent = 'Notification count: 8';
    await wait(350);
    assert.equal(controller.getSnapshot().result, result);
    const input = dom.window.document.createElement('input');
    dom.window.document.querySelector('main')!.append(input);
    input.value = 'PRIVATE ANSWER';
    await wait(350);
    assert.equal(controller.getSnapshot().result, result);
  } finally { close(); }
});
