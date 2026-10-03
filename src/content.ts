import { ScanController } from './controller';
import { parseSettings } from './settings';
import { PageUI } from './page-ui';
import type { Settings, ScannerSnapshot } from './types';
import { recoverOverview } from './overview-recovery';
import { pageInputFingerprint, scanPage } from './scanner';
import { interpretJob } from './interpreter';
import { FrameCoordinator, type FrameAnnouncement } from './frame-coordinator';
import { DecisionClient } from './decision-client';

if (window.top !== window) {
  let frameSettings: Settings | null = null;
  let announceTimer: ReturnType<typeof setTimeout> | undefined;
  let lastFrameUrl = location.href;
  let navigationPending = false;
  let lastReadFingerprint = pageInputFingerprint(document);
  let navigationFingerprint = lastReadFingerprint;
  const noteNavigation = () => {
    if (location.href === lastFrameUrl) return;
    lastFrameUrl = location.href;
    navigationFingerprint = lastReadFingerprint;
    navigationPending = pageInputFingerprint(document) === navigationFingerprint;
    announceSoon();
  };
  const announce = () => { if (frameSettings) void chrome.runtime.sendMessage({ type: 'FRAME_AVAILABLE', url: location.href }).catch(() => {}); };
  const announceSoon = () => {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(announce, 250);
  };
  chrome.runtime.onMessage.addListener((message, _sender, respond) => {
    if (message?.type === 'FRAME_IDENTIFY_CHILD' && typeof message.nonce === 'string') {
      window.parent.postMessage({ type: 'SNS_FRAME_IDENTITY', nonce: message.nonce }, '*');
      respond({ received: true }); return;
    }
    if (message?.type === 'FRAME_POLL_CHILDREN') { announce(); respond({ received: true }); return; }
    if (message?.type !== 'FRAME_READ_CHILD') return;
    noteNavigation();
    if (!frameSettings || frameSettings.paused || frameSettings.disabledHosts.includes(location.hostname)) { respond(null); return; }
    if (navigationPending) { respond(null); return; }
    try {
      const result = scanPage(document, location.href);
      if (result.role) result.interpretation = interpretJob(result.role);
      lastReadFingerprint = pageInputFingerprint(document);
      respond(result);
    } catch { respond(null); }
  });
  const observer = new MutationObserver(mutations => {
    if (mutations.some(mutation => {
      const element = mutation.target.nodeType === 1 ? mutation.target as Element : mutation.target.parentElement;
      return !element?.closest('input,textarea,select,[contenteditable],nav,footer,[data-sns-ignore]');
    })) announceSoon();
    if (navigationPending) {
      const fingerprint = pageInputFingerprint(document);
      if (fingerprint !== navigationFingerprint) navigationPending = false;
    }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ['hidden', 'aria-hidden', 'class', 'style'] });
  const announceNavigation = noteNavigation;
  window.addEventListener('popstate', announceNavigation);
  window.addEventListener('hashchange', announceNavigation);
  setInterval(() => {
    if (location.href !== lastFrameUrl) announceNavigation();
  }, 500);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) { frameSettings = parseSettings(changes.settings.newValue); announceSoon(); }
  });
  void chrome.storage.local.get('settings').then(saved => { frameSettings = parseSettings(saved.settings); announce(); });
} else {

let controller: ScanController | undefined;
let settingsFailed = false;
let pageUI: PageUI | undefined;
let latest: ScannerSnapshot | undefined;
let frames: FrameCoordinator | undefined;
let refreshDecision: (() => void) | undefined;
const decision = new DecisionClient(request => chrome.runtime.sendMessage({ type: 'DECISION', request }), () => refreshDecision?.());
function start(settings: Settings): void {
  controller = new ScanController(document, window, settings, recoverOverview);
  pageUI = new PageUI({
    rescan: () => { decision.reset(); frames?.clear(); frames?.refresh(); controller!.scan(); return latest ?? controller!.getSnapshot(); },
    pause: async () => {
      const saved = parseSettings((await chrome.storage.local.get('settings')).settings);
      await chrome.storage.local.set({ settings: { ...saved, paused: true } });
    },
    disableSite: async () => {
      const saved = parseSettings((await chrome.storage.local.get('settings')).settings);
      await chrome.storage.local.set({ settings: { ...saved, disabledHosts: [...new Set([...saved.disabledHosts, location.hostname])] } });
    },
  });
  frames = new FrameCoordinator(document,
    async message => {
      if (controller?.getSnapshot().state === 'paused' || controller?.getSnapshot().state === 'disabled') return null;
      return await chrome.runtime.sendMessage({ type: 'FRAME_READ', frameId: message.frameId,
        documentId: message.documentId, url: message.url }) as import('./types').ScanResult | null;
    },
    async (message, nonce) => { await chrome.runtime.sendMessage({ type: 'FRAME_IDENTIFY',
      frameId: message.frameId, documentId: message.documentId, nonce }); },
    () => { void chrome.runtime.sendMessage({ type: 'FRAME_POLL' }).catch(() => {}); },
    () => { if (controller) update(controller.getSnapshot()); });
  function update(snapshot: ScannerSnapshot): void {
    frames?.reset(location.href);
    latest = decision.update(frames?.combine(snapshot) ?? snapshot);
    pageUI!.update(latest);
  }
  refreshDecision = () => update(controller!.getSnapshot());
  controller.subscribe(snapshot => {
    update(snapshot);
  });
}
// Fail closed until saved settings are available: a paused user gets no initial scan.
chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  if (message?.type === 'FRAME_AVAILABLE') { void frames?.available(message as FrameAnnouncement); respond({ received: true }); return; }
  if (message?.type === 'GET_SCAN') {
    respond(latest ?? { state: settingsFailed ? 'error' : 'scanning', hostname: location.hostname, result: null });
  }
  if (message?.type === 'RESCAN') {
    decision.reset(); frames?.clear(); frames?.refresh(); controller?.scan();
    respond(latest ?? { state: settingsFailed ? 'error' : 'scanning', hostname: location.hostname, result: null });
  }
  if (message?.type === 'SHOW_PANEL') { pageUI?.show(); respond({ shown: !!latest?.result?.role }); }
});

let settingsRevision = 0;
let decisionRevision = 0;
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.decisionEnabled) { decisionRevision++; decision.setEnabled(changes.decisionEnabled.newValue === true); }
  if (!changes.settings) return;
  settingsRevision++;
  const settings = parseSettings(changes.settings.newValue);
  if (controller) {
    controller.updateSettings(settings);
    if (settings.paused || settings.disabledHosts.includes(location.hostname)) frames?.clear();
    else frames?.refresh();
  }
  else start(settings);
});
const initialRevision = settingsRevision;
chrome.storage.local.get(['settings', 'decisionEnabled']).then(saved => {
  if (decisionRevision === 0) decision.setEnabled(saved.decisionEnabled === true);
  if (initialRevision === settingsRevision) start(parseSettings(saved.settings));
}).catch(() => {
  settingsFailed = true;
  // Storage errors must not bypass the user's pause or site preference.
});
}
