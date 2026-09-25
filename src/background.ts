import { ResearchCoordinator } from './research-coordinator';
import { parseResearchRequest, publicUrl, RESEARCH_ORIGIN, RESEARCH_PERMISSION } from './research';
import { parseSettings } from './settings';

const permitted = async () => {
  const saved = await chrome.storage.local.get(['settings', 'researchEnabled']);
  return saved.researchEnabled === true && !parseSettings(saved.settings).paused
    && await chrome.permissions.contains({ origins: [RESEARCH_PERMISSION] });
};
const coordinator = new ResearchCoordinator({
  get: async key => (await chrome.storage.session.get(key))[key],
  set: async (key, value) => {
    await chrome.storage.session.set({ [key]: value });
    const all = await chrome.storage.session.get(null);
    const keys = Object.keys(all).filter(key => key.startsWith('research:'));
    if (keys.length > 50) await chrome.storage.session.remove(keys.filter(k => k !== key).slice(0, keys.length - 50));
  },
}, async request => {
  const response = await fetch(`${RESEARCH_ORIGIN}/research`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request), credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(22_000) });
  if (!response.ok) throw new Error('Service unavailable');
  const text = await response.text();
  if (text.length > 150_000) throw new Error('Oversized response');
  return JSON.parse(text) as unknown;
}, permitted);

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== 'RESEARCH') return;
  const request = parseResearchRequest(message.request);
  if (sender.id !== chrome.runtime.id || sender.tab?.id === undefined || sender.frameId !== 0 || !request
    || !sender.url || publicUrl(sender.url) !== request.url) { respond({ state: 'error', message: 'Invalid research request.' }); return; }
  void (async () => {
    const settings = parseSettings((await chrome.storage.local.get('settings')).settings);
    if (settings.disabledHosts.includes(new URL(sender.url!).hostname)) return { state: 'error', message: 'Scanning is disabled on this site.' };
    const reply = await coordinator.run(request);
    const latest = parseSettings((await chrome.storage.local.get('settings')).settings);
    if (!await permitted() || latest.disabledHosts.includes(new URL(sender.url!).hostname)) return { state: 'error', message: 'Company research is disabled.' };
    return reply;
  })().then(respond, () => respond({ state: 'error', message: 'Company research is unavailable.' }));
  return true;
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.researchEnabled?.newValue !== true && changes.researchEnabled) {
    void chrome.storage.session.get(null).then(saved => chrome.storage.session.remove(Object.keys(saved).filter(key => key.startsWith('research:'))));
  }
});
