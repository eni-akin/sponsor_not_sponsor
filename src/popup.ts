import { parseSettings } from './settings';
import type { ScannerSnapshot } from './types';

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const pause = element<HTMLInputElement>('pause');
const disable = element<HTMLInputElement>('disable-site');
const rescan = element<HTMLButtonElement>('rescan');
let tabId: number | undefined;
let hostname = '';
let previous = '';
let settings = parseSettings(null);
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
  const role = result?.role;
  element('status').textContent = snapshot.state === 'ready' && result ? labels[result.kind] : {
    scanning: 'Scanning…', paused: 'Scanning paused', disabled: 'Disabled for this site', error: 'Unable to read this page', ready: 'No result available',
  }[snapshot.state];
  element('title').textContent = role?.title ?? (snapshot.state === 'paused' || snapshot.state === 'disabled' ? 'You control where we scan.' : 'Open a specific job or application.');
  element('metadata').textContent = role ? [role.employer ?? 'Employer not identified', role.location, role.completeness === 'incomplete' ? 'Incomplete description' : null].filter(Boolean).join(' · ') : '';
  const warnings = element('warnings');
  warnings.replaceChildren(...(result?.warnings ?? []).map(warning => { const item = document.createElement('li'); item.textContent = warning; return item; }));
  const evidence = role?.evidence ?? [];
  element('evidence-section').hidden = !evidence.length;
  element('count').textContent = `${evidence.length} passages`;
  element('evidence').replaceChildren(...evidence.map(block => {
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
  rescan.disabled = snapshot.state === 'paused' || snapshot.state === 'disabled';
}

async function refresh(type = 'GET_SCAN'): Promise<void> {
  if (tabId === undefined) return;
  try {
    const snapshot = await chrome.tabs.sendMessage(tabId, { type }) as ScannerSnapshot | undefined;
    if (!snapshot) throw new Error('No response');
    element('feedback').textContent = '';
    render(snapshot);
  } catch {
    element('status').textContent = 'Page unavailable';
    element('title').textContent = 'Open or reload a regular website.';
    element('metadata').textContent = 'Chrome’s internal pages, PDFs, and some protected pages cannot be scanned.';
    element('evidence-section').hidden = true;
    element('warnings').replaceChildren();
    disable.disabled = true;
    rescan.disabled = true;
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
rescan.addEventListener('click', () => void refresh('RESCAN'));

async function start(): Promise<void> {
  const saved = await chrome.storage.local.get('settings');
  settings = parseSettings(saved.settings);
  pause.checked = settings.paused;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id;
  await refresh();
  setInterval(() => void refresh(), 700);
}
void start().catch(() => { element('status').textContent = 'Unable to load settings'; });
