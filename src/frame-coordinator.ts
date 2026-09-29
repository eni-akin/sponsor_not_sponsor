import { interpretJob } from './interpreter';
import type { EvidenceBlock, ScanResult, ScannerSnapshot } from './types';

export interface FrameAnnouncement { type: 'FRAME_AVAILABLE'; frameId: number; documentId: string; url: string }
interface FrameEntry { frameId: number; documentId: string; url: string; result: ScanResult | null }

function visibleFrame(frame: HTMLIFrameElement): boolean {
  for (let element: Element | null = frame; element; element = element.parentElement) {
    if (element.matches('[hidden],[aria-hidden="true"]')) return false;
    const style = element.ownerDocument.defaultView?.getComputedStyle(element);
    if (style?.display === 'none' || style?.visibility === 'hidden' || style?.visibility === 'collapse') return false;
  }
  return true;
}

function matchFrame(doc: Document, url: string): HTMLIFrameElement | null {
  const matches = [...doc.querySelectorAll('iframe')].filter(frame => {
    if (!visibleFrame(frame) || frame.src !== url) return false;
    try { return frame.contentWindow?.location.origin !== doc.defaultView?.location.origin; }
    catch { return true; }
  });
  return matches.length === 1 ? matches[0]! : null;
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
  private frameLoad = (event: Event) => {
    const frame = event.target;
    if (!(frame instanceof this.doc.defaultView!.HTMLIFrameElement)) return;
    this.entries.delete(frame);
    this.changed();
    this.poll();
  };

  constructor(private doc: Document, private read: (message: FrameAnnouncement) => Promise<ScanResult | null>,
    private poll: () => void, private changed: () => void) {
    this.topUrl = doc.location?.href ?? doc.URL;
    doc.addEventListener('load', this.frameLoad, true);
    this.poll();
  }

  reset(url: string): void {
    if (this.topUrl === url) return;
    this.topUrl = url;
    this.entries.clear();
    this.poll();
  }

  async available(message: FrameAnnouncement): Promise<void> {
    if (this.disposed || !Number.isInteger(message.frameId) || message.frameId <= 0
      || typeof message.documentId !== 'string' || !message.documentId || typeof message.url !== 'string') return;
    let url: URL;
    try { url = new URL(message.url); } catch { return; }
    if (!/^https?:$/.test(url.protocol)) return;
    const frame = matchFrame(this.doc, url.href);
    if (!frame) return;
    const topUrl = this.topUrl;
    const entry: FrameEntry = { frameId: message.frameId, documentId: message.documentId, url: url.href, result: null };
    this.entries.set(frame, entry);
    const result = await this.read(message).catch(() => null);
    if (this.disposed || this.topUrl !== topUrl || this.entries.get(frame) !== entry || matchFrame(this.doc, url.href) !== frame) return;
    entry.result = result?.url === url.href && result.role ? result : null;
    this.changed();
  }

  combine(snapshot: ScannerSnapshot): ScannerSnapshot {
    if (snapshot.state !== 'ready' || !snapshot.result || snapshot.result.role) return snapshot;
    // Do not briefly present the first reply as the selected job while another visible frame is still loading.
    if (visibleCrossOriginFrames(this.doc).length !== 1) return snapshot;
    const results = [...this.entries].filter(([frame, entry]) => entry.result && matchFrame(this.doc, entry.url) === frame)
      .map(([, entry]) => entry.result!);
    if (results.length !== 1) return snapshot;
    const adopted = embeddedFrameResult(snapshot.result, results[0]!);
    return adopted ? { ...snapshot, result: adopted } : snapshot;
  }

  clear(): void { this.entries.clear(); this.changed(); }
  refresh(): void { this.poll(); }
  dispose(): void { this.disposed = true; this.entries.clear(); this.doc.removeEventListener('load', this.frameLoad, true); }
}
