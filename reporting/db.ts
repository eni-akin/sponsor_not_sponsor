export interface Statement {
  bind(...values: unknown[]): Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
}
export interface Database {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
}
export const json = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' },
});
export async function readJson(request: Request, maximum = 262144): Promise<{ value: unknown; bytes: number }> {
  if (Number(request.headers.get('content-length')) > maximum) throw new RangeError('Request is too large.');
  if (!request.body) throw new Error('A JSON body is required.');
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0, content = '';
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      bytes += item.value.byteLength;
      if (bytes > maximum) { await reader.cancel(); throw new RangeError('Request is too large.'); }
      content += decoder.decode(item.value, { stream: true });
    }
    content += decoder.decode();
    return { value: JSON.parse(content), bytes };
  } finally { reader.releaseLock(); }
}
