import { applyDecision, decisionRequest, modelDecisionBase, parseDecisionResult, type DecisionReply } from './decision';
import type { ScannerSnapshot, Interpretation } from './types';

/** Apply async decisions only to the exact role and evidence generation that requested them. */
export class DecisionClient {
  private enabled = false;
  private identity = '';
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private latest: ScannerSnapshot | undefined;
  private interpretation: Interpretation | undefined;
  private state: 'disabled' | 'pending' | 'ready' | 'error' = 'disabled';
  private message = 'Local Laya comparison is off.';
  constructor(private send: (request: ReturnType<typeof decisionRequest>) => Promise<unknown>, private publish: () => void) {}
  setEnabled(value: boolean): void {
    if (value === this.enabled) return;
    this.enabled = value; this.reset(); this.publish();
  }
  reset(): void { this.identity = ''; this.generation++; clearTimeout(this.timer); this.interpretation = undefined; this.state = 'disabled'; this.message = 'Local Laya comparison is off.'; }
  update(snapshot: ScannerSnapshot): ScannerSnapshot {
    this.latest = snapshot;
    const role = snapshot.state === 'ready' ? snapshot.result?.role : null;
    if (!this.enabled || !role || !snapshot.result?.interpretation) {
      if (this.enabled) this.reset();
      return { ...snapshot, result: snapshot.result ? { ...snapshot.result, decisionComparison: { state: 'disabled', message: 'Local Laya comparison is off.' } } : null };
    }
    const request = decisionRequest(role);
    const identity = JSON.stringify([snapshot.result.url, role, request]);
    if (identity !== this.identity) {
      this.reset(); this.identity = identity;
      this.interpretation = undefined; this.state = 'pending'; this.message = 'Laya is reading the job evidence…';
      void this.run(request, this.generation, Date.now());
    }
    return { ...snapshot, result: { ...snapshot.result, decisionComparison: { state: this.state, message: this.message, interpretation: this.interpretation } } };
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
    if (result) {
      this.interpretation = applyDecision(this.latest.result.role, modelDecisionBase(), result, false);
      this.state = 'ready'; this.message = this.interpretation.decision!.message;
    } else {
      this.interpretation = undefined; this.state = 'error';
      this.message = reply.state === 'error' ? reply.message : 'Laya did not return a complete, valid decision. Scan again to retry.';
    }
    this.publish();
  }
}
