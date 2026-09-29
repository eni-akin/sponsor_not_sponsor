import { applyDecision, decisionRequest, parseDecisionResult, unresolvedDecision, type DecisionReply } from './decision';
import type { ScannerSnapshot, Interpretation } from './types';

/** Apply async decisions only to the exact role and evidence generation that requested them. */
export class DecisionClient {
  private enabled = false;
  private identity = '';
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private latest: ScannerSnapshot | undefined;
  private interpretation: Interpretation | undefined;
  constructor(private send: (request: ReturnType<typeof decisionRequest>) => Promise<unknown>, private publish: () => void) {}
  setEnabled(value: boolean): void {
    if (value === this.enabled) return;
    this.enabled = value; this.reset(); this.publish();
  }
  reset(): void { this.identity = ''; this.generation++; clearTimeout(this.timer); this.interpretation = undefined; }
  update(snapshot: ScannerSnapshot): ScannerSnapshot {
    this.latest = snapshot;
    const role = snapshot.state === 'ready' ? snapshot.result?.role : null;
    if (!this.enabled || !role || !snapshot.result?.interpretation) { this.reset(); return snapshot; }
    const request = decisionRequest(role);
    const identity = JSON.stringify([snapshot.result.url, role, request]);
    if (identity !== this.identity) {
      this.reset(); this.identity = identity;
      this.interpretation = unresolvedDecision(snapshot.result.interpretation, 'Laya is reading the job evidence…', 'pending');
      void this.run(request, this.generation, Date.now());
    }
    return { ...snapshot, result: { ...snapshot.result, interpretation: this.interpretation! } };
  }
  private async run(request: ReturnType<typeof decisionRequest>, generation: number, start: number): Promise<void> {
    let reply: DecisionReply;
    try {
      const raw = await this.send(request) as DecisionReply | null;
      if (!raw || !['pending', 'ready', 'error'].includes(raw.state)
        || (raw.state === 'error' && (typeof raw.message !== 'string' || raw.message.length > 500))) throw new Error('Invalid reply');
      reply = raw;
    }
    catch { reply = { state: 'error', message: 'Local Laya is unavailable. Start pnpm decision:serve, then scan again.' }; }
    if (generation !== this.generation || !this.enabled || !this.latest?.result?.role || !this.latest.result.interpretation) return;
    if (reply.state === 'pending' && Date.now() - start < 180_000) {
      this.timer = setTimeout(() => void this.run(request, generation, start), 1500); return;
    }
    const result = reply.state === 'ready' ? parseDecisionResult(reply.result, request) : null;
    this.interpretation = result ? applyDecision(this.latest.result.role, this.latest.result.interpretation, result)
      : unresolvedDecision(this.latest.result.interpretation, reply.state === 'error' ? reply.message : 'Laya did not return a complete, valid decision. Scan again to retry.', 'error');
    this.publish();
  }
}
