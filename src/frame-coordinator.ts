import { interpretJob } from './interpreter';
import type { EvidenceBlock, ScanResult, ScannerSnapshot } from './types';

export interface FrameAnnouncement { type: 'FRAME_AVAILABLE'; frameId: number; documentId: string; url: string }
interface FrameEntry { frameId: number; documentId: string; url: string; frameSrc: string; settled: boolean; result: ScanResult | null }

function visibleFrame(frame: Element): boolean {
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

function atsTenant(url: string): string {
  const parsed = new URL(url);
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (parsed.hostname === 'jobs.lever.co') return `lever:${segments[0]?.toLowerCase() ?? ''}`;
  if (parsed.hostname === 'jobs.ashbyhq.com') return `ashby:${segments[0]?.toLowerCase() ?? ''}`;
  if (parsed.hostname === 'job-boards.greenhouse.io' || parsed.hostname === 'boards.greenhouse.io')
    return `greenhouse:${segments[0]?.toLowerCase() ?? ''}`;
  if (parsed.hostname.endsWith('.icims.com')) return `icims:${parsed.hostname.toLowerCase()}`;
  return '';
}

export function embeddedFrameResult(parent: ScanResult, child: ScanResult, matchedApplicationLink = false): ScanResult | null {
  if (!child.role || parent.url === child.url || child.kind === 'multiple-jobs') return null;
  if (parent.role) {
    const sameEmployer = !!parent.role.employer && !!child.role.employer
      && parent.role.employer.trim().toLowerCase() === child.role.employer.trim().toLowerCase();
    const sameRequisition = !!parent.role.identifier && parent.role.identifier.toLowerCase() === child.role.identifier?.toLowerCase();
    const parentTenant = atsTenant(parent.url);
    const sameTenant = !!parentTenant && parentTenant === atsTenant(child.url);
    const idsConflict = !!parent.role.identifier && !!child.role.identifier && !sameRequisition;
    const employersConflict = !!parent.role.employer && !!child.role.employer && !sameEmployer;
    if (idsConflict || employersConflict) return null;
    const linkedVacancy = matchedApplicationLink && !idsConflict && !employersConflict
      && parent.role.title.trim().toLowerCase() === child.role.title.trim().toLowerCase();
    if (!(sameRequisition && (sameEmployer || sameTenant)) && !linkedVacancy) return null;
  }
  const sourceUrl = child.url;
  const childEvidence = child.role.evidence.map((block, index): EvidenceBlock => {
    const fromFrame = block.source === 'visible-page' || block.source === 'structured-data';
    return { ...block, id: `frame-${index}-${block.id}`,
      ...(fromFrame ? { sourceUrl, source: block.source === 'visible-page' ? 'embedded-frame' as const : 'embedded-structured-data' as const,
        locator: `iframe:${new URL(sourceUrl).pathname} > ${block.locator}` } : {}) };
  });
  if (parent.role) {
    const seen = new Set(parent.role.evidence.map(block => block.text.toLowerCase()));
    const evidence = [...parent.role.evidence, ...childEvidence.filter(block => !seen.has(block.text.toLowerCase()))];
    const truncated = [parent.role, child.role].some(role => role.coverage?.gaps.includes('truncated'));
    const completeness = !truncated && (parent.role.completeness === 'description-found'
      || child.role.completeness === 'description-found') ? 'description-found' as const : 'incomplete' as const;
    const role = { ...parent.role, evidence, completeness,
      coverage: parent.role.coverage && child.role.coverage ? { ...parent.role.coverage,
        status: completeness,
        sources: [...parent.role.coverage.sources, ...child.role.coverage.sources.map(source => ({ ...source,
          ...(source.kind === 'visible-page' ? { url: sourceUrl, kind: 'embedded-frame' as const }
            : source.kind === 'structured-data' ? { url: sourceUrl, kind: 'embedded-structured-data' as const } : {}) }))],
        gaps: [...new Set([...parent.role.coverage.gaps, ...child.role.coverage.gaps])],
      } : parent.role.coverage };
    return { ...parent, role, interpretation: interpretJob(role),
      signals: [...parent.signals, 'Matching vacancy details read from a visible embedded frame'],
      warnings: [...parent.warnings, 'Additional public wording was read from a verified embedded frame; evidence retains its source URL.'] };
  }
  const role = { ...child.role, evidence: childEvidence, coverage: child.role.coverage && { ...child.role.coverage,
    sources: child.role.coverage.sources.map(source => ({ ...source,
      ...(source.kind === 'visible-page' ? { url: sourceUrl, kind: 'embedded-frame' as const }
        : source.kind === 'structured-data' ? { url: sourceUrl, kind: 'embedded-structured-data' as const } : {}) })) } };
  return { ...child, url: parent.url, role, interpretation: interpretJob(role),
    signals: [...child.signals, 'Job read from a visible cross-origin frame'],
    warnings: [...child.warnings, 'Job description read from a visible embedded frame.'] };
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
    const entry: FrameEntry = { frameId: message.frameId, documentId: message.documentId, url: url.href, frameSrc, settled: false, result: null };
    this.entries.set(frame, entry);
    const result = await this.read(message).catch(() => null);
    if (this.disposed || this.topUrl !== topUrl || this.generation !== generation || this.entries.get(frame) !== entry
      || frame.src !== frameSrc
      || !visibleCrossOriginFrames(this.doc).includes(frame)) return;
    if (result?.url === url.href) { entry.settled = true; entry.result = result.role ? result : null; }
    this.changed();
  }

  private identify(message: FrameAnnouncement, origin: string): Promise<{ frame: HTMLIFrameElement; frameSrc: string } | null> {
    const frames = visibleCrossOriginFrames(this.doc);
    const frameSources = new Map(frames.map(frame => [frame, frame.src]));
    const nonce = crypto.randomUUID();
    return new Promise(resolve => {
      const finish = (match: { frame: HTMLIFrameElement; frameSrc: string } | null) => {
        clearTimeout(timer);
        this.doc.defaultView?.removeEventListener('message', onMessage);
        resolve(match);
      };
      const onMessage = (event: MessageEvent) => {
        if (event.data?.type !== 'SNS_FRAME_IDENTITY' || event.data.nonce !== nonce
          || event.origin !== origin) return;
        const frame = frames.find(candidate => candidate.contentWindow === event.source && candidate.src === frameSources.get(candidate));
        finish(frame && visibleCrossOriginFrames(this.doc).includes(frame) ? { frame, frameSrc: frameSources.get(frame)! } : null);
      };
      const timer = setTimeout(() => finish(null), 750);
      this.doc.defaultView?.addEventListener('message', onMessage);
      void this.identifyChild(message, nonce).catch(() => finish(null));
    });
  }

  combine(snapshot: ScannerSnapshot): ScannerSnapshot {
    if (snapshot.state !== 'ready' || !snapshot.result) return snapshot;
    const frames = visibleCrossOriginFrames(this.doc);
    // Wait for every visible cross-origin frame; an early reply must not win a race.
    if (!frames.length || frames.some(frame => !this.entries.get(frame)?.settled)) return snapshot;
    const results = frames.map(frame => [frame, this.entries.get(frame)!] as const)
      .filter(([frame, entry]) => entry.result && entry.settled && frame.src === entry.frameSrc && visibleFrame(frame))
      .map(([frame, entry]) => ({ result: entry.result!, linked: this.hasApplicationLink(frame, entry.url) }));
    const matches = results.map(({ result, linked }) => embeddedFrameResult(snapshot.result!, result, linked))
      .filter((result): result is ScanResult => !!result);
    return matches.length === 1 ? { ...snapshot, result: matches[0]! } : snapshot;
  }

  private hasApplicationLink(frame: HTMLIFrameElement, childUrl: string): boolean {
    const targets = new Set<string>();
    try { targets.add(new URL(childUrl).href); } catch { return false; }
    const frameTarget = (() => { try { return new URL(frame.src, this.doc.URL).href; } catch { return null; } })();
    return [...this.doc.querySelectorAll('a[href]')].some(link => {
      const anchor = link as HTMLAnchorElement;
      const label = [anchor.textContent, anchor.getAttribute('aria-label'), anchor.title].filter(Boolean).join(' ');
      try {
        const href = new URL(anchor.href).href;
        return visibleFrame(anchor) && /\bapply\b/i.test(label) && (targets.has(href) || href === frameTarget);
      } catch { return false; }
    });
  }

  clear(): void { this.generation++; this.entries.clear(); this.changed(); }
  refresh(): void { this.poll(); }
  dispose(): void { this.disposed = true; this.entries.clear(); this.doc.removeEventListener('load', this.frameLoad, true); }
}
