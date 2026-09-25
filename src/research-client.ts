import { parseResearchResult, researchRequest, requestIdentity, type ResearchView } from './research';
import type { ScannerSnapshot } from './types';
import type { ResearchReply } from './research-coordinator';

/** Binds asynchronous research to the current role/content generation. */
export class ResearchClient {
  private identity = '';
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private enabled = false;
  private latest: ScannerSnapshot | null = null;
  private value: ResearchView = { state: 'off', message: 'Company research is off. Enable it in the extension popup.' };
  constructor(private send: (request: unknown) => Promise<ResearchReply>, private publish: () => void) {}
  get view(): ResearchView { return this.value; }
  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled; this.identity = ''; this.generation++; clearTimeout(this.timer);
    if (this.latest) this.update(this.latest);
  }
  update(snapshot: ScannerSnapshot): void {
    this.latest = snapshot;
    const request = snapshot.state === 'ready' ? researchRequest(snapshot.result) : null;
    const unclear = snapshot.result?.interpretation && [snapshot.result.interpretation.sponsorship, snapshot.result.interpretation.cpt, snapshot.result.interpretation.opt].some(f => f.status === 'unclear');
    const identity = this.enabled && request && unclear ? requestIdentity(request) : '';
    if (identity && identity === this.identity) return;
    this.generation++; clearTimeout(this.timer); this.identity = identity;
    this.value = !this.enabled ? { state: 'off', message: 'Company research is off. Enable it in the extension popup.' }
      : !request ? { state: 'idle', message: 'Research needs a detected role and an identified employer.' }
      : !unclear ? { state: 'idle', message: 'The posting already has explicit findings for all three topics.' }
      : { state: 'pending', message: 'Checking official sources and available employer history…' };
    this.publish();
    if (identity && request) void this.run(request, this.generation, 0);
  }
  retry(): void { this.identity = ''; if (this.latest) this.update(this.latest); }
  private async run(request: NonNullable<ReturnType<typeof researchRequest>>, generation: number, attempt: number): Promise<void> {
    let reply: ResearchReply;
    try { reply = await this.send(request); }
    catch { reply = { state: 'error', message: 'Company research could not connect. Start the local research service and retry.' }; }
    if (generation !== this.generation || !this.enabled) return;
    if (reply.state === 'pending' && attempt < 15) { this.timer = setTimeout(() => void this.run(request, generation, attempt + 1), 2000); return; }
    if (reply.state === 'ready') {
      const result = parseResearchResult(reply.result, request);
      this.value = result ? { state: 'ready', message: 'Company research completed. Sources are separate from the page findings.', result }
        : { state: 'error', message: 'The research response could not be verified. Please retry.' };
    } else this.value = { state: 'error', message: reply.state === 'error' ? reply.message : 'Research did not finish. Please retry.' };
    this.publish();
  }
}
