import { hash, pageInputFingerprint, scanPage } from './scanner';
import { interpretJob } from './interpreter';
import type { ScannerSnapshot, Settings } from './types';

const IGNORED_CHANGES = 'nav,footer,aside,input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[data-sns-ignore]';

export class ScanController {
  private snapshot: ScannerSnapshot;
  private settings: Settings;
  private url: string;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private polling: ReturnType<typeof setInterval>;
  private pendingSince = 0;
  private observer: MutationObserver;
  private lastRoleSignature = '';
  private navigationSignature = '';
  private inputFingerprint = '';
  private probeTimer: ReturnType<typeof setTimeout> | undefined;
  private listeners = new Set<(snapshot: ScannerSnapshot) => void>();

  subscribe(listener: (snapshot: ScannerSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => { this.listeners.delete(listener); };
  }
  private publish(): void { this.listeners.forEach(listener => listener(this.snapshot)); }

  constructor(private doc: Document, private win: Window, settings: Settings) {
    this.settings = settings;
    this.url = win.location.href;
    this.snapshot = { state: 'scanning', hostname: win.location.hostname, result: null };
    this.observer = new (doc.defaultView!.MutationObserver)(mutations => {
      const relevant = mutations.some(mutation => {
        const element = mutation.target.nodeType === 1 ? mutation.target as Element : mutation.target.parentElement;
        if (element?.closest(IGNORED_CHANGES)) return false;
        if (mutation.type === 'childList') {
          return [...mutation.addedNodes, ...mutation.removedNodes].some(node =>
            node.nodeType === 3 || (node.nodeType === 1 && !(node as Element).matches(IGNORED_CHANGES)),
          );
        }
        return true;
      });
      if (!relevant || this.stopped()) return;
      if (mutations.some(mutation => mutation.type !== 'attributes' || !['class', 'style'].includes(mutation.attributeName ?? ''))) this.checkContent();
      else if (!this.probeTimer) {
        // Scroll-driven style changes are common. Inspect their semantic effect in a batch,
        // leaving the stored result intact when the job's visible content has not changed.
        this.probeTimer = setTimeout(() => { this.probeTimer = undefined; this.checkContent(); }, 150);
      }
    });
    this.observer.observe(doc.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'aria-hidden', 'aria-selected', 'class', 'style'] });
    // pushState does not emit popstate. Check the address cheaply, without reading page text.
    this.polling = setInterval(() => this.checkNavigation(), 500);
    this.win.addEventListener('popstate', this.navigation);
    this.win.addEventListener('hashchange', this.navigation);
    this.scan();
  }

  private navigation = () => this.checkNavigation();
  private checkContent(): void {
    if (this.stopped()) return;
    try {
      const fingerprint = pageInputFingerprint(this.doc);
      if (fingerprint !== this.inputFingerprint) {
        this.inputFingerprint = fingerprint;
        this.schedule();
      }
    } catch { this.schedule(); }
  }
  private checkNavigation(): void {
    if (this.url !== this.win.location.href) {
      this.navigationSignature = this.lastRoleSignature;
      this.url = this.win.location.href;
      this.schedule();
    }
  }
  private stopped(): 'paused' | 'disabled' | null {
    return this.settings.paused ? 'paused' : this.settings.disabledHosts.includes(this.win.location.hostname) ? 'disabled' : null;
  }
  private schedule(): void {
    this.snapshot = { state: this.stopped() ?? 'scanning', hostname: this.win.location.hostname, result: null };
    this.publish();
    clearTimeout(this.timer);
    if (this.stopped()) return;
    const now = Date.now();
    this.pendingSince ||= now;
    this.timer = setTimeout(() => this.scan(), Math.max(0, Math.min(300, 1500 - (now - this.pendingSince))));
  }
  scan(): ScannerSnapshot {
    clearTimeout(this.timer);
    this.pendingSince = 0;
    if (this.url !== this.win.location.href) this.navigationSignature = this.lastRoleSignature;
    this.url = this.win.location.href;
    const stopped = this.stopped();
    if (stopped) this.snapshot = { state: stopped, hostname: this.win.location.hostname, result: null };
    else {
      try {
        const result = scanPage(this.doc, this.url);
        this.inputFingerprint = pageInputFingerprint(this.doc);
        if (result.role) result.interpretation = interpretJob(result.role);
        const signature = result.role ? hash(JSON.stringify({ ...result.role, key: undefined })) : '';
        if (signature && signature === this.navigationSignature) {
          // Navigation can precede the new DOM. Never relabel the old content with a new URL.
          this.snapshot = { state: 'scanning', hostname: this.win.location.hostname, result: null };
        } else {
          this.navigationSignature = '';
          this.lastRoleSignature = signature;
          this.snapshot = { state: 'ready', hostname: this.win.location.hostname, result };
        }
      } catch {
        this.snapshot = { state: 'error', hostname: this.win.location.hostname, result: null };
      }
    }
    this.publish();
    return this.snapshot;
  }
  getSnapshot(): ScannerSnapshot { this.checkNavigation(); return this.snapshot; }
  updateSettings(settings: Settings): void { this.settings = settings; this.scan(); }
  dispose(): void {
    this.observer.disconnect();
    clearTimeout(this.timer);
    clearInterval(this.polling);
    clearTimeout(this.probeTimer);
    this.win.removeEventListener('popstate', this.navigation);
    this.win.removeEventListener('hashchange', this.navigation);
    this.listeners.clear();
  }
}
