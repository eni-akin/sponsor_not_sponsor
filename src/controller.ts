import { hash, pageInputFingerprint, scanPage } from './scanner';
import { interpretJob } from './interpreter';
import { overviewCandidate, type OverviewOutcome } from './overview-recovery';
import type { ScanResult, ScannerSnapshot, Settings } from './types';

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
  private frameObservers = new Map<HTMLIFrameElement, { doc: Document; observer: MutationObserver }>();
  private listeners = new Set<(snapshot: ScannerSnapshot) => void>();
  private recovery: AbortController | undefined;

  subscribe(listener: (snapshot: ScannerSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => { this.listeners.delete(listener); };
  }
  private publish(): void { this.listeners.forEach(listener => listener(this.snapshot)); }

  constructor(private doc: Document, private win: Window, settings: Settings,
    private recover?: (result: ScanResult, signal: AbortSignal) => Promise<OverviewOutcome>) {
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
      this.refreshFrames();
      if (mutations.some(mutation => mutation.type !== 'attributes' || !['class', 'style'].includes(mutation.attributeName ?? ''))) this.checkContent();
      else if (!this.probeTimer) {
        // Scroll-driven style changes are common. Inspect their semantic effect in a batch,
        // leaving the stored result intact when the job's visible content has not changed.
        this.probeTimer = setTimeout(() => { this.probeTimer = undefined; this.checkContent(); }, 150);
      }
    });
    this.observer.observe(doc.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'aria-hidden', 'aria-selected', 'class', 'style'] });
    if (!this.stopped()) this.refreshFrames();
    doc.addEventListener('load', this.frameLoad, true);
    // pushState does not emit popstate. Check the address cheaply, without reading page text.
    this.polling = setInterval(() => this.checkNavigation(), 500);
    this.win.addEventListener('popstate', this.navigation);
    this.win.addEventListener('hashchange', this.navigation);
    this.scan();
  }

  private navigation = () => this.checkNavigation();
  private frameLoad = (event: Event) => {
    if (!this.stopped() && (event.target as Element | null)?.tagName === 'IFRAME') { this.refreshFrames(); this.checkContent(); }
  };
  private refreshFrames(): void {
    const present = new Set(this.doc.querySelectorAll('iframe'));
    for (const [frame, entry] of this.frameObservers) {
      if (present.has(frame) && frame.contentDocument === entry.doc) continue;
      entry.observer.disconnect();
      this.frameObservers.delete(frame);
    }
    for (const frame of present) {
      if (this.frameObservers.has(frame)) continue;
      try {
        const child = frame.contentDocument;
        if (!child?.documentElement || child.defaultView?.location.origin !== this.win.location.origin) continue;
        const observer = new (child.defaultView.MutationObserver)(() => this.checkContent());
        observer.observe(child.documentElement, { subtree: true, childList: true, characterData: true,
          attributes: true, attributeFilter: ['hidden', 'aria-hidden', 'class', 'style'] });
        this.frameObservers.set(frame, { doc: child, observer });
      } catch { /* Cross-origin and inaccessible frames stay unscanned. */ }
    }
  }
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
    this.recovery?.abort();
    this.recovery = undefined;
    this.snapshot = { state: this.stopped() ?? 'scanning', hostname: this.win.location.hostname, result: null };
    this.publish();
    clearTimeout(this.timer);
    if (this.stopped()) return;
    const now = Date.now();
    this.pendingSince ||= now;
    this.timer = setTimeout(() => this.scan(), Math.max(0, Math.min(300, 1500 - (now - this.pendingSince))));
  }
  scan(): ScannerSnapshot {
    this.recovery?.abort();
    this.recovery = undefined;
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
        // Coverage contains the current URL; it must not make stale DOM look new after SPA navigation.
        const signature = result.role ? hash(JSON.stringify({ ...result.role, key: undefined, coverage: undefined })) : '';
        if (signature && signature === this.navigationSignature) {
          // Navigation can precede the new DOM. Never relabel the old content with a new URL.
          this.snapshot = { state: 'scanning', hostname: this.win.location.hostname, result: null };
        } else {
          this.navigationSignature = '';
          this.lastRoleSignature = signature;
          this.snapshot = { state: 'ready', hostname: this.win.location.hostname, result };
          if (this.recover && overviewCandidate(result)) this.startRecovery(result);
        }
      } catch {
        this.snapshot = { state: 'error', hostname: this.win.location.hostname, result: null };
      }
    }
    this.publish();
    return this.snapshot;
  }
  private startRecovery(result: ScanResult): void {
    const recovery = new AbortController();
    this.recovery = recovery;
    void this.recover!(result, recovery.signal).then(outcome => {
      if (recovery.signal.aborted || this.recovery !== recovery || this.stopped()
        || this.url !== this.win.location.href || this.snapshot.result !== result) return;
      this.recovery = undefined;
      if (outcome.kind === 'not-applicable') return;
      this.snapshot = { ...this.snapshot, result: outcome.result };
      this.publish();
    }).catch(() => { if (this.recovery === recovery) this.recovery = undefined; });
  }
  getSnapshot(): ScannerSnapshot { this.checkNavigation(); return this.snapshot; }
  updateSettings(settings: Settings): void {
    this.settings = settings;
    if (this.stopped()) {
      for (const entry of this.frameObservers.values()) entry.observer.disconnect();
      this.frameObservers.clear();
    } else this.refreshFrames();
    this.scan();
  }
  dispose(): void {
    this.recovery?.abort();
    this.recovery = undefined;
    this.observer.disconnect();
    for (const entry of this.frameObservers.values()) entry.observer.disconnect();
    this.frameObservers.clear();
    this.doc.removeEventListener('load', this.frameLoad, true);
    clearTimeout(this.timer);
    clearInterval(this.polling);
    clearTimeout(this.probeTimer);
    this.win.removeEventListener('popstate', this.navigation);
    this.win.removeEventListener('hashchange', this.navigation);
    this.listeners.clear();
  }
}
