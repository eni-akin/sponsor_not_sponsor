import { ScanController } from './controller';
import { parseSettings } from './settings';
import { PageUI } from './page-ui';
import type { Settings, ScannerSnapshot } from './types';
import { ResearchClient } from './research-client';

let controller: ScanController | undefined;
let settingsFailed = false;
let pageUI: PageUI | undefined;
let latest: ScannerSnapshot | undefined;
const research = new ResearchClient(request => chrome.runtime.sendMessage({ type: 'RESEARCH', request }), () => {
  if (latest) pageUI?.update({ ...latest, research: research.view });
});
const withResearch = (snapshot: ScannerSnapshot) => ({ ...snapshot, research: research.view });
function start(settings: Settings): void {
  controller = new ScanController(document, window, settings);
  pageUI = new PageUI({
    rescan: () => controller!.scan(),
    pause: async () => {
      const saved = parseSettings((await chrome.storage.local.get('settings')).settings);
      await chrome.storage.local.set({ settings: { ...saved, paused: true } });
    },
    disableSite: async () => {
      const saved = parseSettings((await chrome.storage.local.get('settings')).settings);
      await chrome.storage.local.set({ settings: { ...saved, disabledHosts: [...new Set([...saved.disabledHosts, location.hostname])] } });
    },
  });
  controller.subscribe(snapshot => {
    latest = snapshot;
    research.update(snapshot);
    pageUI!.update(withResearch(snapshot));
  });
}
// Fail closed until saved settings are available: a paused user gets no initial scan.
chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  if (message?.type === 'GET_SCAN') respond(withResearch(controller?.getSnapshot() ?? { state: settingsFailed ? 'error' : 'scanning', hostname: location.hostname, result: null }));
  if (message?.type === 'RESCAN') respond(withResearch(controller?.scan() ?? { state: settingsFailed ? 'error' : 'scanning', hostname: location.hostname, result: null }));
  if (message?.type === 'RETRY_RESEARCH') { research.retry(); respond({ requested: true }); }
  if (message?.type === 'SHOW_PANEL') { pageUI?.show(); respond({ shown: !!controller?.getSnapshot().result?.role }); }
});

let settingsRevision = 0;
let researchRevision = 0;
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.researchEnabled) { researchRevision++; research.setEnabled(changes.researchEnabled.newValue === true); }
  if (!changes.settings) return;
  settingsRevision++;
  const settings = parseSettings(changes.settings.newValue);
  if (controller) controller.updateSettings(settings);
  else start(settings);
});
const initialRevision = settingsRevision;
chrome.storage.local.get(['settings', 'researchEnabled']).then(saved => {
  if (researchRevision === 0) research.setEnabled(saved.researchEnabled === true);
  if (initialRevision === settingsRevision) start(parseSettings(saved.settings));
}).catch(() => {
  settingsFailed = true;
  // Storage errors must not bypass the user's pause or site preference.
});
