import { parseSettings } from './settings';
import { DECISION_ORIGIN, DECISION_PERMISSION, parseDecisionRequest } from './decision';

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type === 'DECISION') {
    const request = parseDecisionRequest(message.request);
    if (sender.id !== chrome.runtime.id || sender.tab?.id === undefined || sender.frameId !== 0 || !sender.url || !request) {
      respond({ state: 'error', message: 'Invalid decision request.' }); return;
    }
    const allowed = async () => {
      const saved = await chrome.storage.local.get(['settings', 'decisionEnabled']);
      const settings = parseSettings(saved.settings);
      return saved.decisionEnabled === true && !settings.paused && !settings.disabledHosts.includes(new URL(sender.url!).hostname)
        && await chrome.permissions.contains({ origins: [DECISION_PERMISSION] });
    };
    void (async () => {
      if (!await allowed()) return { state: 'error', message: 'Enable Local Laya in the extension popup and grant local service access.' };
      const response = await fetch(`${DECISION_ORIGIN}/decision`, { method: 'POST', credentials: 'omit', redirect: 'error',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Unavailable');
      const body = await response.text();
      if (body.length > 1_000_000 || !await allowed()) throw new Error('Invalid response');
      return JSON.parse(body);
    })().then(respond, () => respond({ state: 'error', message: 'Local Laya is unavailable. Start pnpm decision:serve, then scan again.' }));
    return true;
  }
  if (message?.type === 'FRAME_AVAILABLE') {
    if (sender.id === chrome.runtime.id && sender.tab?.id !== undefined && (sender.frameId ?? 0) > 0
      && sender.documentId && sender.url && /^https?:\/\//.test(sender.url)) {
      void chrome.tabs.sendMessage(sender.tab.id, { type: 'FRAME_AVAILABLE', frameId: sender.frameId,
        documentId: sender.documentId, url: sender.url }, { frameId: 0 }).catch(() => {});
    }
    respond({ received: true });
    return;
  }
  if (message?.type === 'FRAME_POLL') {
    if (sender.id === chrome.runtime.id && sender.tab?.id !== undefined && sender.frameId === 0) {
      void chrome.tabs.sendMessage(sender.tab.id, { type: 'FRAME_POLL_CHILDREN' }).catch(() => {});
    }
    respond({ requested: true });
    return;
  }
  if (message?.type === 'FRAME_READ') {
    const frameId = message.frameId;
    const documentId = message.documentId;
    const url = message.url;
    if (sender.id !== chrome.runtime.id || sender.tab?.id === undefined || sender.frameId !== 0
      || !sender.url || !Number.isInteger(frameId) || frameId <= 0 || typeof documentId !== 'string'
      || !documentId || typeof url !== 'string' || !/^https?:\/\//.test(url)) { respond(null); return; }
    void (async () => {
      const settings = parseSettings((await chrome.storage.local.get('settings')).settings);
      if (settings.paused || settings.disabledHosts.includes(new URL(sender.url!).hostname)) return null;
      const result = await chrome.tabs.sendMessage(sender.tab!.id!, { type: 'FRAME_READ_CHILD' }, { frameId, documentId });
      return result?.url === url ? result : null;
    })().then(respond, () => respond(null));
    return true;
  }
  if (message?.type === 'FRAME_IDENTIFY') {
    const frameId = message.frameId;
    const documentId = message.documentId;
    const nonce = message.nonce;
    if (sender.id !== chrome.runtime.id || sender.tab?.id === undefined || sender.frameId !== 0
      || !Number.isInteger(frameId) || frameId <= 0 || typeof documentId !== 'string' || !documentId
      || typeof nonce !== 'string' || nonce.length > 100) { respond(null); return; }
    void chrome.tabs.sendMessage(sender.tab.id, { type: 'FRAME_IDENTIFY_CHILD', nonce }, { frameId, documentId })
      .then(respond, () => respond(null));
    return true;
  }
});
