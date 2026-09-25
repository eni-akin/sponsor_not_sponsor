import { parseSettings } from './settings';
import { renderFindings } from './findings-view';
import { renderResearch } from './research-view';
import { RESEARCH_PERMISSION } from './research';
import type { ScannerSnapshot } from './types';

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const pause = element<HTMLInputElement>('pause');
const disable = element<HTMLInputElement>('disable-site');
const rescan = element<HTMLButtonElement>('rescan');
let tabId: number | undefined;
let hostname = '';
let previous = '';
let previousEvidence = '';
let previousFindings = '';
let renderedRoleKey = '';
let settings = parseSettings(null);
let previousResearch = '';
const researchEnabled = element<HTMLInputElement>('research-enabled');
const labels = { 'job-posting': 'Job posting detected', 'job-application': 'Application detected', 'multiple-jobs': 'Multiple roles on this page', 'non-job': 'No specific job detected', 'unreadable': 'Unable to identify the role' };

function render(snapshot: ScannerSnapshot): void {
  const fingerprint = JSON.stringify(snapshot);
  if (previous === fingerprint) return;
  previous = fingerprint;
  hostname = snapshot.hostname;
  element('hostname').textContent = hostname || 'this site';
  disable.disabled = !hostname;
  disable.checked = settings.disabledHosts.includes(hostname);
  const result = snapshot.result;
  const researchFingerprint = JSON.stringify([result?.role?.key, snapshot.research]);
  if (researchFingerprint !== previousResearch) renderResearch(element('research-results'), snapshot.research);
  previousResearch = researchFingerprint;
  element('research-results').hidden = !result?.role;
  element<HTMLButtonElement>('research-retry').disabled = !researchEnabled.checked || snapshot.state !== 'ready' || !result?.role?.employer || snapshot.research?.state === 'pending';
  const role = result?.role;
  if (renderedRoleKey !== (role?.key ?? '') || snapshot.state !== 'ready') element('scan-feedback').textContent = '';
  renderedRoleKey = role?.key ?? '';
  element('status').textContent = snapshot.state === 'ready' && result ? labels[result.kind] : {
    scanning: 'Scanning…', paused: 'Scanning paused', disabled: 'Disabled for this site', error: 'Unable to read this page', ready: 'No result available',
  }[snapshot.state];
  element('title').textContent = role?.title ?? (snapshot.state === 'paused' || snapshot.state === 'disabled' ? 'You control where we scan.' : 'Open a specific job or application.');
  element('metadata').textContent = role ? [role.employer ?? 'Employer not identified', role.location, role.completeness === 'incomplete' ? 'Incomplete description' : null].filter(Boolean).join(' · ') : '';
  const warnings = element('warnings');
  warnings.replaceChildren(...(result?.warnings ?? []).map(warning => { const item = document.createElement('li'); item.textContent = warning; return item; }));
  const evidence = role?.evidence ?? [];
  const findings = result?.interpretation;
  element('findings').hidden = !findings;
  const findingsFingerprint = JSON.stringify([role?.key, findings]);
  if (findings && findingsFingerprint !== previousFindings) renderFindings(element('findings'), findings, result!);
  previousFindings = findingsFingerprint;
  const sourceTime = element('findings').querySelector('time');
  if (sourceTime && result) { sourceTime.dateTime = result.scannedAt; sourceTime.textContent = new Date(result.scannedAt).toLocaleString(); }
  element('evidence-section').hidden = !evidence.length;
  element('count').textContent = `${evidence.length} passages`;
  const evidenceFingerprint = JSON.stringify([role?.key, evidence]);
  if (evidenceFingerprint !== previousEvidence) element('evidence').replaceChildren(...evidence.map(block => {
    const container = document.createElement('div');
    container.className = 'evidence';
    const source = document.createElement('div');
    source.className = 'source';
    source.textContent = `${block.source === 'visible-page' ? 'Visible page' : 'Structured page data'}${block.kind === 'application-question' ? ' · Question wording' : ''}`;
    const text = document.createElement('p');
    text.textContent = block.text;
    container.append(source, text);
    return container;
  }));
  previousEvidence = evidenceFingerprint;
  rescan.disabled = snapshot.state === 'paused' || snapshot.state === 'disabled';
  element<HTMLButtonElement>('show-panel').disabled = !role || !findings;
}

async function refresh(type = 'GET_SCAN'): Promise<void> {
  if (tabId === undefined) return;
  try {
    if (type === 'RESCAN') {
      rescan.disabled = true;
      element('scan-feedback').textContent = 'Scanning the current page…';
    }
    const snapshot = await chrome.tabs.sendMessage(tabId, { type }) as ScannerSnapshot | undefined;
    if (!snapshot) throw new Error('No response');
    element('feedback').textContent = '';
    render(snapshot);
    if (type === 'RESCAN') {
      element('scan-feedback').textContent = snapshot.state === 'ready'
        ? `Scan complete · ${snapshot.result?.role?.evidence.length ?? 0} passages checked.`
        : snapshot.state === 'scanning' ? 'Waiting for the new role’s content to load.'
        : snapshot.state === 'error' ? 'The page could not be scanned. Try again.'
        : 'Scanning is paused or disabled for this site.';
      rescan.disabled = snapshot.state === 'paused' || snapshot.state === 'disabled';
    }
  } catch {
    element('research-results').hidden = true;
    element<HTMLButtonElement>('research-retry').disabled = true;
    element('status').textContent = 'Page unavailable';
    element('title').textContent = 'Open or reload a regular website.';
    element('metadata').textContent = 'Chrome’s internal pages, PDFs, and some protected pages cannot be scanned.';
    element('evidence-section').hidden = true;
    element('findings').hidden = true;
    element('scan-feedback').textContent = '';
    element('warnings').replaceChildren();
    disable.disabled = true;
    rescan.disabled = true;
    element<HTMLButtonElement>('show-panel').disabled = true;
    hostname = '';
    previous = '';
  }
}

async function saveSettings(change: 'pause' | 'site'): Promise<void> {
  pause.disabled = disable.disabled = true;
  try {
    const latest = parseSettings((await chrome.storage.local.get('settings')).settings);
    if (change === 'pause') latest.paused = pause.checked;
    else latest.disabledHosts = disable.checked ? [...new Set([...latest.disabledHosts, hostname])] : latest.disabledHosts.filter(host => host !== hostname);
    await chrome.storage.local.set({ settings: latest });
    settings = latest;
    previous = '';
    await refresh();
  } catch { element('feedback').textContent = 'Could not save your preference. Please try again.'; }
  finally { pause.disabled = false; disable.disabled = !hostname; }
}
pause.addEventListener('change', () => void saveSettings('pause'));
disable.addEventListener('change', () => void saveSettings('site'));
researchEnabled.addEventListener('change', event => {
  if (!event.isTrusted) return;
  const enabled = researchEnabled.checked;
  researchEnabled.disabled = true;
  void (async () => {
    if (enabled && !await chrome.permissions.request({ origins: [RESEARCH_PERMISSION] })) {
      researchEnabled.checked = false;
      element('research-feedback').textContent = 'Research stays off because service access was not granted.';
      return;
    }
    await chrome.storage.local.set({ researchEnabled: enabled });
    element('research-feedback').textContent = enabled ? 'Company research enabled for unclear findings.' : 'Company research turned off.';
    previous = ''; await refresh();
  })().catch(() => { researchEnabled.checked = !enabled; element('research-feedback').textContent = 'Could not save the research preference.'; })
    .finally(() => { researchEnabled.disabled = false; });
});
element('research-retry').addEventListener('click', event => {
  if (!event.isTrusted || tabId === undefined) return;
  void chrome.tabs.sendMessage(tabId, { type: 'RETRY_RESEARCH' }).then(() => refresh()).catch(() => { element('research-feedback').textContent = 'Reload the job page and try again.'; });
});
rescan.addEventListener('click', () => void refresh('RESCAN'));
element('show-panel').addEventListener('click', async () => {
  if (tabId === undefined) return;
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'SHOW_PANEL' });
    if (response?.shown) window.close();
    else element('feedback').textContent = 'No current job is available. Scan the page again.';
  } catch { element('feedback').textContent = 'Reload the job page to show the panel.'; }
});

async function finishOnboarding(paused: boolean): Promise<void> {
  try {
    const saved = parseSettings((await chrome.storage.local.get('settings')).settings);
    await chrome.storage.local.set({ onboardingSeen: true, settings: { ...saved, paused } });
    element('onboarding').hidden = true;
  } catch { element('feedback').textContent = 'Could not save your preference. Please try again.'; }
}
element('onboarding-done').addEventListener('click', () => void finishOnboarding(settings.paused));
element('onboarding-pause').addEventListener('click', () => void finishOnboarding(true));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.researchEnabled) { researchEnabled.checked = changes.researchEnabled.newValue === true; previous = ''; void refresh(); }
  if (changes.onboardingSeen) element('onboarding').hidden = changes.onboardingSeen.newValue === true;
  if (changes.settings) {
    settings = parseSettings(changes.settings.newValue);
    pause.checked = settings.paused;
    disable.checked = settings.disabledHosts.includes(hostname);
    previous = '';
    void refresh();
  }
});

async function start(): Promise<void> {
  const saved = await chrome.storage.local.get(['settings', 'onboardingSeen', 'researchEnabled']);
  researchEnabled.checked = saved.researchEnabled === true;
  element('onboarding').hidden = saved.onboardingSeen === true;
  settings = parseSettings(saved.settings);
  pause.checked = settings.paused;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id;
  await refresh();
  setInterval(() => void refresh(), 700);
}
void start().catch(() => { element('status').textContent = 'Unable to load settings'; });
