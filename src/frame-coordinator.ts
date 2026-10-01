import { interpretJob } from './interpreter';
import type { EvidenceBlock, ScanResult, ScannerSnapshot } from './types';

export interface FrameAnnouncement { type: 'FRAME_AVAILABLE'; frameId: number; documentId: string; url: string }
interface FrameEntry { frameId: number; documentId: string; url: string; frameSrc: string; result: ScanResult | null }

function visibleFrame(frame: HTMLIFrameElement): boolean {
  for (let element: Element | null = frame; element; element = element.parentElement) {
    if (element.matches('[hidden],[aria-hidden="true"]')) return false;
    const style = element.ownerDocument.defaultView?.getComputedStyle(element);
    if (style?.display === 'none' || style?.visibility === 'hidden' || style?.visibility === 'collapse') return false;
  }
  return true;
}

function visibleCrossOriginFrames(doc: Document): HTMLIFrameElement[] {
  return [...doc.querySelectorAll('iframe')].filter(frame => {
    if (!visibleFrame(frame)) return false;
    try { return frame.contentWindow?.location.origin !== doc.defaultView?.location.origin; }
    catch { return true; }
  });
}

export function embeddedFrameResult(parent: ScanResult, child: ScanResult): ScanResult | null {
  if (parent.role || !child.role || parent.url === child.url || child.kind === 'multiple-jobs') return null;
  const sourceUrl = child.url;
  const role = { ...child.role, evidence: child.role.evidence.map((block, index): EvidenceBlock => ({
    ...block, id: `frame-${index}-${block.id}`, sourceUrl,
    source: block.source === 'visible-page' ? 'embedded-frame'
      : block.source === 'structured-data' ? 'embedded-structured-data' : block.source,
    locator: `iframe:${new URL(sourceUrl).pathname} > ${block.locator}`,
  })), coverage: child.role.coverage && { ...child.role.coverage,
    sources: child.role.coverage.sources.map(source => ({ ...source, url: sourceUrl,
      kind: source.kind === 'visible-page' ? 'embedded-frame' as const
        : source.kind === 'structured-data' ? 'embedded-structured-data' as const : source.kind })) } };
  return { ...child, url: parent.url, role, interpretation: interpretJob(role),
    signals: [...child.signals, 'Job read from a visible cross-origin frame'],
    warnings: [...child.warnings, 'Job description read from a visible embedded frame on another site.'] };
}

export class FrameCoordinator {
  private entries = new Map<HTMLIFrameElement, FrameEntry>();
  private topUrl: string;
  private disposed = false;
  private generation = 0;
  private frameLoad = (event: Event) => {
    const frame = event.target;
    if (!(frame instanceof this.doc.defaultView!.HTMLIFrameElement)) return;
    this.entries.delete(frame);
    this.changed();
    this.poll();
  };

  constructor(private doc: Document, private read: (message: FrameAnnouncement) => Promise<ScanResult | null>,
    private identifyChild: (message: FrameAnnouncement, nonce: string) => Promise<void>,
    private poll: () => void, private changed: () => void) {
    this.topUrl = doc.location?.href ?? doc.URL;
    doc.addEventListener('load', this.frameLoad, true);
    this.poll();
  }

  reset(url: string): void {
    if (this.topUrl === url) return;
    this.topUrl = url;
    this.generation++;
    this.entries.clear();
    this.poll();
  }

  async available(message: FrameAnnouncement): Promise<void> {
    if (this.disposed || !Number.isInteger(message.frameId) || message.frameId <= 0
      || typeof message.documentId !== 'string' || !message.documentId || typeof message.url !== 'string') return;
    let url: URL;
    try { url = new URL(message.url); } catch { return; }
    if (!/^https?:$/.test(url.protocol)) return;
    const topUrl = this.topUrl;
    const generation = this.generation;
    const identified = await this.identify(message, url.origin);
    if (!identified || this.disposed || this.topUrl !== topUrl || this.generation !== generation) return;
    const { frame, frameSrc } = identified;
    const entry: FrameEntry = { frameId: message.frameId, documentId: message.documentId, url: url.href, frameSrc, result: null };
    this.entries.set(frame, entry);
    const result = await this.read(message).catch(() => null);
    if (this.disposed || this.topUrl !== topUrl || this.generation !== generation || this.entries.get(frame) !== entry
      || frame.src !== frameSrc
      || !visibleCrossOriginFrames(this.doc).includes(frame)) return;
    entry.result = result?.url === url.href && result.role ? result : null;
    this.changed();
  }

  private identify(message: FrameAnnouncement, origin: string): Promise<{ frame: HTMLIFrameElement; frameSrc: string } | null> {
    const frames = visibleCrossOriginFrames(this.doc);
    if (frames.length !== 1) return Promise.resolve(null);
    const frame = frames[0]!;
    const frameSrc = frame.src;
    const nonce = crypto.randomUUID();
    return new Promise(resolve => {
      const finish = (match: { frame: HTMLIFrameElement; frameSrc: string } | null) => {
        clearTimeout(timer);
        this.doc.defaultView?.removeEventListener('message', onMessage);
        resolve(match);
      };
      const onMessage = (event: MessageEvent) => {
        if (event.data?.type !== 'SNS_FRAME_IDENTITY' || event.data.nonce !== nonce
          || event.source !== frame.contentWindow || event.origin !== origin) return;
        finish(visibleCrossOriginFrames(this.doc).length === 1 && frame.src === frameSrc ? { frame, frameSrc } : null);
      };
      const timer = setTimeout(() => finish(null), 750);
      this.doc.defaultView?.addEventListener('message', onMessage);
      void this.identifyChild(message, nonce).catch(() => finish(null));
    });
  }

  combine(snapshot: ScannerSnapshot): ScannerSnapshot {
    if (snapshot.state !== 'ready' || !snapshot.result || snapshot.result.role) return snapshot;
    // Do not briefly present the first reply as the selected job while another visible frame is still loading.
    if (visibleCrossOriginFrames(this.doc).length !== 1) return snapshot;
    const results = [...this.entries].filter(([frame, entry]) => entry.result && frame.src === entry.frameSrc
      && visibleCrossOriginFrames(this.doc).includes(frame))
      .map(([, entry]) => entry.result!);
    if (results.length !== 1) return snapshot;
    const adopted = embeddedFrameResult(snapshot.result, results[0]!);
    return adopted ? { ...snapshot, result: adopted } : snapshot;
  }

  clear(): void { this.generation++; this.entries.clear(); this.changed(); }
  refresh(): void { this.poll(); }
  dispose(): void { this.disposed = true; this.entries.clear(); this.doc.removeEventListener('load', this.frameLoad, true); }
}
