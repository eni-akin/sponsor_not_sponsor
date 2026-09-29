import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import { createHash } from 'node:crypto';
import { decisionQuestions } from './decision-questions';
import { parseDecisionResult, type DecisionRequest, type DecisionResult, type DecisionReply } from '../src/decision';

export class LayaWorker {
  private child: ChildProcessWithoutNullStreams | undefined;
  private pending: { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> } | undefined;
  run(request: DecisionRequest): Promise<DecisionResult> {
    if (this.pending) return Promise.reject(new Error('Local model is busy. Please retry.'));
    if (!this.child) {
      const child = spawn(process.env.DECISION_PYTHON || '.decision-venv/bin/python', ['server/laya_worker.py'], {
        env: { ...process.env, HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' }, stdio: 'pipe',
      });
      this.child = child;
      // Libraries can log input on errors. Keep stderr out of the UI and stored logs.
      child.stderr.resume();
      createInterface({ input: child.stdout }).on('line', line => {
        if (this.child !== child || !this.pending) return;
        const pending = this.pending; this.pending = undefined; clearTimeout(pending.timer);
        try { pending.resolve(JSON.parse(line)); } catch { pending.reject(new Error('Invalid local model response.')); }
      });
      const failed = () => { if (this.child === child) this.close(); };
      child.on('error', failed); child.on('exit', failed); child.stdin.on('error', failed);
    }
    return new Promise<unknown>((resolve, reject) => {
      this.pending = { resolve, reject, timer: setTimeout(() => this.close(), 150_000) };
      this.child!.stdin.write(JSON.stringify({ request, questions: decisionQuestions }) + '\n');
    }).then(raw => {
      if ((raw as { error?: string })?.error === 'context-too-long') throw new Error('A passage exceeds the local model context limit. No decision was made.');
      const result = parseDecisionResult(raw, request);
      if (!result) throw new Error('Laya could not produce a complete decision. Check the model setup and retry.');
      return result;
    });
  }
  close(): void {
    const child = this.child; this.child = undefined;
    if (this.pending) { clearTimeout(this.pending.timer); this.pending.reject(new Error('Local Laya stopped or timed out. Check setup and scan again.')); this.pending = undefined; }
    child?.kill();
  }
}

/** Pollable work keeps Chrome worker messages short while CPU inference runs. No disk cache. */
export class DecisionService {
  private entries = new Map<string, { reply: DecisionReply; expires: number }>();
  private active = false;
  constructor(private infer: (request: DecisionRequest) => Promise<DecisionResult>) {}
  run(request: DecisionRequest): DecisionReply {
    const now = Date.now();
    for (const [key, entry] of this.entries) if (entry.expires < now) this.entries.delete(key);
    const key = createHash('sha256').update(JSON.stringify(request)).digest('hex');
    const cached = this.entries.get(key);
    if (cached) return cached.reply;
    if (this.active) return { state: 'pending' };
    while (this.entries.size >= 10) this.entries.delete(this.entries.keys().next().value!);
    const entry: { reply: DecisionReply; expires: number } = { reply: { state: 'pending' }, expires: now + 180_000 };
    this.entries.set(key, entry); this.active = true;
    void this.infer(request).then(result => {
      const valid = parseDecisionResult(result, request);
      if (!valid) throw new Error('Invalid model result');
      entry.reply = { state: 'ready', result: valid }; entry.expires = Date.now() + 15 * 60_000;
    }).catch(() => {
      entry.reply = { state: 'error', message: 'Local Laya could not finish. Check model setup or passage length, then scan again.' };
      entry.expires = Date.now() + 5000;
    }).finally(() => { this.active = false; });
    return entry.reply;
  }
}
