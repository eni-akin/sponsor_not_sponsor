import { parseSettings } from './settings';

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type === 'FRAME_AVAILABLE') {
    if (sender.id === chrome.runtime.id && sender.tab?.id !== undefined && (sender.frameId ?? 0) > 0
      && sender.documentId && sender.url && /^https?:\/\//.test(sender.url)) {
      // Chrome's sender URL can retain the document's initial address after pushState.
      // The content script supplies its current same-origin URL; document/window checks still bind the read.
      let url = sender.url;
      try {
        if (typeof message.url === 'string' && new URL(message.url).origin === new URL(sender.url).origin) url = new URL(message.url).href;
      } catch { /* Keep the browser-supplied URL for malformed announcements. */ }
      void chrome.tabs.sendMessage(sender.tab.id, { type: 'FRAME_AVAILABLE', frameId: sender.frameId,
        documentId: sender.documentId, url }, { frameId: 0 }).catch(() => {});
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
