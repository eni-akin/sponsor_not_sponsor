import { ScanController } from './controller';
import { parseSettings } from './settings';

let controller: ScanController | undefined;
let settingsFailed = false;
// Fail closed until saved settings are available: a paused user gets no initial scan.
chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  if (message?.type === 'GET_SCAN') respond(controller?.getSnapshot() ?? { state: settingsFailed ? 'error' : 'scanning', hostname: location.hostname, result: null });
  if (message?.type === 'RESCAN') respond(controller?.scan() ?? { state: settingsFailed ? 'error' : 'scanning', hostname: location.hostname, result: null });
});

let settingsRevision = 0;
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.settings) return;
  settingsRevision++;
  const settings = parseSettings(changes.settings.newValue);
  if (controller) controller.updateSettings(settings);
  else controller = new ScanController(document, window, settings);
});
const initialRevision = settingsRevision;
chrome.storage.local.get('settings').then(saved => {
  if (initialRevision === settingsRevision) controller = new ScanController(document, window, parseSettings(saved.settings));
}).catch(() => {
  settingsFailed = true;
  // Storage errors must not bypass the user's pause or site preference.
});
