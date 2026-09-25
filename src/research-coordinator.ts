import { parseResearchResult, researchKey, type ResearchRequest, type ResearchResult } from './research';

export interface ResearchStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}
interface Entry { leaseUntil?: number; result?: ResearchResult }
export type ResearchReply = { state: 'pending' } | { state: 'ready'; result: ResearchResult } | { state: 'error'; message: string };

/** In-memory deduplication plus durable leases/cache across worker restarts. */
export class ResearchCoordinator {
  private active = new Map<string, Promise<ResearchReply>>();
  constructor(private store: ResearchStore, private fetchResult: (request: ResearchRequest) => Promise<unknown>, private permitted: () => Promise<boolean>, private now = Date.now) {}
  async run(request: ResearchRequest): Promise<ResearchReply> {
    if (!await this.permitted()) return { state: 'error', message: 'Company research is disabled.' };
    const key = `research:${await researchKey(request)}`;
    if (this.active.has(key)) return this.active.get(key)!;
    const work = this.execute(key, request).finally(() => this.active.delete(key));
    this.active.set(key, work); return work;
  }
  private async execute(key: string, request: ResearchRequest): Promise<ResearchReply> {
    const entry = (await this.store.get(key) ?? {}) as Entry;
    const cached = parseResearchResult(entry.result, request);
    if (cached && Date.parse(cached.expiresAt) > this.now()) return { state: 'ready', result: cached };
    if (entry.leaseUntil && entry.leaseUntil > this.now()) return { state: 'pending' };
    await this.store.set(key, { leaseUntil: this.now() + 25_000 });
    try {
      if (!await this.permitted()) throw new Error('Research disabled');
      const result = parseResearchResult(await this.fetchResult(request), request);
      if (!result || Date.parse(result.expiresAt) <= this.now()) throw new Error('Invalid or stale result');
      if (!await this.permitted()) throw new Error('Research disabled');
      await this.store.set(key, { result });
      return { state: 'ready', result };
    } catch {
      await this.store.set(key, {});
      return { state: 'error', message: 'Company research is unavailable. Check that the local research service is running, then retry.' };
    }
  }
}
