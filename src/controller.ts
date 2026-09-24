import { hash, scanPage } from './scanner';
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
      if (relevant) this.schedule();
    });
    this.observer.observe(doc.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'aria-hidden', 'aria-selected', 'class', 'style'] });
    // pushState does not emit popstate. Check the address cheaply, without reading page text.
    this.polling = setInterval(() => this.checkNavigation(), 500);
    this.win.addEventListener('popstate', this.navigation);
    this.win.addEventListener('hashchange', this.navigation);
    this.scan();
  }

  private navigation = () => this.checkNavigation();
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
    return this.snapshot;
  }
  getSnapshot(): ScannerSnapshot { this.checkNavigation(); return this.snapshot; }
  updateSettings(settings: Settings): void { this.settings = settings; this.scan(); }
  dispose(): void {
    this.observer.disconnect();
    clearTimeout(this.timer);
    clearInterval(this.polling);
    this.win.removeEventListener('popstate', this.navigation);
    this.win.removeEventListener('hashchange', this.navigation);
  }
}
