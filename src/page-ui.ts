import styles from './page-ui.css';
import { badgePosition, badgeState } from './badge-state';
import { renderFindings } from './findings-view';
import { renderResearch } from './research-view';
import { downloadReport, reportReasons } from './report';
import type { ScannerSnapshot } from './types';

interface Actions { rescan: () => ScannerSnapshot; pause: () => Promise<void>; disableSite: () => Promise<void> }
const controls = 'input:not([type="hidden"]),textarea,select,button,a[href],[role="button"],[role="textbox"],[contenteditable]:not([contenteditable="false"]),iframe';

export class PageUI {
  private host = document.createElement('div');
  private root = this.host.attachShadow({ mode: 'open' });
  private snapshot: ScannerSnapshot | null = null;
  private dismissed = new Set<string>();
  private lastKey = '';
  private lastContent = '';
  private lastResearch = '';
  private open = false;
  private frame = 0;
  private seenJob = false;
  private priorFocus: HTMLElement | null = null;

  constructor(private actions: Actions) {
    this.host.id = 'sponsor-not-sponsor-ui';
    this.host.setAttribute('data-sns-ignore', '');
    for (const [property, value] of Object.entries({ all: 'initial', position: 'fixed', display: 'block', zIndex: '2147483647' })) {
      this.host.style.setProperty(property === 'zIndex' ? 'z-index' : property, value, 'important');
    }
    this.host.hidden = true;
    // Static extension-owned markup only; page strings are always assigned with textContent.
    this.root.innerHTML = `<style>${styles}</style><div class="ui">
      <div class="badge" id="badge"><button class="badge-main" id="toggle" type="button" aria-expanded="false" aria-controls="panel"><span class="dot" aria-hidden="true"></span><span id="badge-text"></span></button><button class="dismiss" id="dismiss" type="button" aria-label="Dismiss badge for this role" title="Dismiss for this role">×</button></div>
      <section class="panel" id="panel" role="dialog" aria-modal="false" aria-labelledby="role-title" hidden>
        <div class="panel-header"><button class="panel-close" id="close" type="button" aria-label="Close evidence panel">×</button><div class="brand">SPONSOR NOT SPONSOR</div><h2 id="role-title"></h2><p class="metadata" id="metadata"></p></div>
        <div class="panel-body" tabindex="0" role="region" aria-label="Evidence and explanations"><ul class="warnings" id="warnings"></ul><div id="findings"></div><p class="note">These findings describe page wording, not personal eligibility.</p><section id="research" class="research" aria-label="Company research"></section>
          <div class="report" id="report-form" hidden><label for="reason">What looks wrong?</label><select id="reason"></select><p class="note">The report includes the role, findings, cited wording, and page address without its query or fragment. It excludes application answers and the full page text. Review the downloaded file before sharing. Nothing is sent automatically.</p><button id="download" type="button" class="primary">Download report</button></div>
        </div>
        <div class="panel-footer"><div class="controls"><button class="primary" id="rescan" type="button">Scan again</button><button id="report" type="button">Report incorrect result</button><button id="pause" type="button">Pause everywhere</button><button id="disable" type="button">Disable this site</button></div><p id="message" class="message" role="status"></p></div>
      </section></div>`;
    for (const reason of reportReasons) { const option = document.createElement('option'); option.textContent = reason; this.get('reason').append(option); }
    this.click('toggle', () => this.open ? this.close(true) : this.show());
    this.click('close', () => this.close(true));
    this.click('dismiss', () => { this.dismissed.add(this.lastKey); this.close(false); this.hide(); });
    this.click('rescan', () => { const result = this.actions.rescan(); this.get('message').textContent = result.state === 'ready' ? 'Scan complete.' : 'The current role is not ready to read.'; });
    this.click('pause', () => this.save(this.actions.pause));
    this.click('disable', () => this.save(this.actions.disableSite));
    this.click('report', () => { this.get('report-form').hidden = false; this.get('reason').focus(); });
    this.click('download', () => {
      if (!this.snapshot?.result) return;
      try { downloadReport(this.snapshot.result, this.get<HTMLSelectElement>('reason').value); this.get('message').textContent = 'Report download started. Nothing was sent.'; }
      catch { this.get('message').textContent = 'Could not create the report. Please try again.'; }
    });
    this.root.addEventListener('keydown', event => {
      if (event instanceof KeyboardEvent && event.isTrusted && event.key === 'Escape' && this.open) { event.preventDefault(); event.stopPropagation(); this.close(true); }
    });
    document.addEventListener('pointerdown', this.outside, true);
    document.addEventListener('focusin', this.focusOutside, true);
    window.addEventListener('scroll', this.reposition, { passive: true, capture: true });
    window.addEventListener('resize', this.reposition, { passive: true });
    document.documentElement.append(this.host);
  }

  private get<T extends HTMLElement = HTMLElement>(id: string): T { return this.root.getElementById(id) as T; }
  private click(id: string, action: () => void): void {
    this.get(id).addEventListener('click', event => { if (event.isTrusted) action(); });
  }
  private async save(action: () => Promise<void>): Promise<void> {
    try { await action(); }
    catch { this.get('message').textContent = 'Could not save your preference. Please try again.'; }
  }
  private outside = (event: Event) => { if (this.open && !event.composedPath().includes(this.host)) this.close(false); };
  private focusOutside = (event: Event) => { this.outside(event); this.reposition(); };
  private hide(): void { this.host.style.setProperty('display', 'none', 'important'); }
  private reveal(): void { this.host.hidden = false; this.host.style.setProperty('display', 'block', 'important'); }
  private reposition = () => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => { this.frame = 0; this.position(); });
  };
  private position(): void {
    if (!this.snapshot || !badgeState(this.snapshot) || this.dismissed.has(this.lastKey) || (!this.seenJob && !this.snapshot.result?.role)) return;
    if (this.open) {
      this.get('panel').style.right = '16px';
      this.get('panel').style.bottom = '16px';
      return;
    }
    this.reveal();
    const size = this.get('badge').getBoundingClientRect();
    const obstacles = [...document.querySelectorAll(controls)].map(element => element.getBoundingClientRect()).filter(rect => rect.width && rect.height && rect.bottom > 0 && rect.top < innerHeight);
    const target = badgePosition(size.width, size.height, { width: innerWidth, height: innerHeight }, obstacles);
    if (!target) { this.hide(); return; }
    this.host.style.setProperty('left', `${target.left}px`, 'important');
    this.host.style.setProperty('top', `${target.top}px`, 'important');
  }
  show(): void {
    if (!this.snapshot?.result?.role || !this.snapshot.result.interpretation) return;
    this.dismissed.delete(this.lastKey);
    this.priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.open = true;
    this.reveal();
    this.get('panel').hidden = false;
    this.get('badge').hidden = true;
    this.get('toggle').setAttribute('aria-expanded', 'true');
    this.position();
    this.get('close').focus();
  }
  private close(restore: boolean): void {
    const wasOpen = this.open;
    this.open = false;
    this.get('panel').hidden = true;
    this.get('badge').hidden = false;
    this.get('toggle').setAttribute('aria-expanded', 'false');
    if (wasOpen && restore) {
      this.position();
      if (this.host.style.display !== 'none') this.get('toggle').focus();
      else this.priorFocus?.focus();
    }
    if (wasOpen) this.reposition();
  }
  update(snapshot: ScannerSnapshot): void {
    this.snapshot = snapshot;
    const researchKey = JSON.stringify([snapshot.result?.role?.key, snapshot.research]);
    if (researchKey !== this.lastResearch) {
      renderResearch(this.get('research'), snapshot.research);
      this.lastResearch = researchKey;
    }
    const state = badgeState(snapshot);
    const role = snapshot.result?.role;
    if (!state || (!role && !this.seenJob)) { this.close(false); this.hide(); this.seenJob = false; return; }
    if (role) this.seenJob = true;
    if (role && this.lastKey !== role.key) { this.close(false); this.lastContent = ''; this.lastKey = role.key; this.get('report-form').hidden = true; }
    if (!role) { this.close(false); this.get('findings').replaceChildren(); this.lastContent = ''; }
    if (this.dismissed.has(this.lastKey)) { this.hide(); return; }
    this.get('badge-text').textContent = state.label;
    this.get('badge').dataset.tone = state.tone;
    this.get<HTMLButtonElement>('toggle').disabled = !role;
    if (role && snapshot.result?.interpretation) {
      const key = JSON.stringify([role.key, snapshot.result.interpretation, snapshot.result.warnings]);
      if (key !== this.lastContent) {
        this.get('role-title').textContent = role.title;
        this.get('metadata').textContent = [role.employer ?? 'Employer not identified', role.location].filter(Boolean).join(' · ');
        renderFindings(this.get('findings'), snapshot.result.interpretation, snapshot.result);
        this.get('warnings').replaceChildren(...snapshot.result.warnings.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
        this.lastContent = key;
        this.get('message').textContent = '';
      }
      const time = this.get('findings').querySelector('time');
      if (time) { time.dateTime = snapshot.result.scannedAt; time.textContent = new Date(snapshot.result.scannedAt).toLocaleString(); }
    }
    this.reveal();
    this.position();
  }
  dispose(): void {
    document.removeEventListener('pointerdown', this.outside, true);
    document.removeEventListener('focusin', this.focusOutside, true);
    window.removeEventListener('scroll', this.reposition, true);
    window.removeEventListener('resize', this.reposition);
    cancelAnimationFrame(this.frame);
    this.host.remove();
  }
}
