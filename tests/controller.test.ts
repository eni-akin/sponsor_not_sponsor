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

test('scrolling and cosmetic class/style changes retain the same stored result', async () => {
  const { dom, controller, close } = setup();
  try {
    const result = controller.getSnapshot().result;
    const main = dom.window.document.querySelector('main')!;
    main.classList.add('scrolled');
    main.style.transform = 'translateY(1px)';
    dom.window.document.body.style.setProperty('--scroll-progress', '0.5');
    dom.window.dispatchEvent(new dom.window.Event('scroll'));
    await wait(550);
    assert.equal(controller.getSnapshot().state, 'ready');
    assert.equal(controller.getSnapshot().result, result);
  } finally { close(); }
});

test('class changes that reveal job text still rescan and update interpretation', async () => {
  const { dom, controller, close } = setup();
  try {
    const style = dom.window.document.createElement('style');
    style.textContent = '.collapsed { display: none; }';
    dom.window.document.head.append(style);
    const policy = dom.window.document.createElement('p');
    policy.className = 'collapsed';
    policy.textContent = 'Visa sponsorship is not available.';
    dom.window.document.querySelector('main')!.append(policy);
    await wait(350);
    assert.equal(controller.getSnapshot().result?.interpretation?.sponsorship.status, 'unclear');
    policy.className = '';
    await wait(550);
    assert.equal(controller.getSnapshot().result?.interpretation?.sponsorship.status, 'unavailable');
  } finally { close(); }
});

test('content changes outside the main role do not clear the stored result', async () => {
  const { dom, controller, close } = setup();
  try {
    const result = controller.getSnapshot().result;
    const toast = dom.window.document.createElement('div');
    toast.textContent = 'Welcome back';
    dom.window.document.body.append(toast);
    await wait(350);
    assert.equal(controller.getSnapshot().result, result);
  } finally { close(); }
});

test('manual scan reruns analysis even when automatic scanning sees no change', () => {
  const { controller, close } = setup();
  try {
    const old = controller.getSnapshot().result;
    const fresh = controller.scan().result;
    assert.notEqual(fresh, old);
    assert.equal(fresh?.interpretation?.cpt.status, 'explicitly-accepted');
    assert.deepEqual(fresh?.role?.evidence, old?.role?.evidence);
  } finally { close(); }
});

test('subscribers immediately receive the current result and are cleared on pause', () => {
  const { controller, close } = setup();
  try {
    const received: string[] = [];
    const unsubscribe = controller.subscribe(value => received.push(value.state));
    controller.updateSettings({ paused: true, disabledHosts: [] });
    unsubscribe();
    controller.updateSettings(DEFAULT_SETTINGS);
    assert.deepEqual(received, ['ready', 'paused']);
  } finally { close(); }
});
