import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { realpath } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parseDecisionRequest } from '../src/decision';
import { DecisionService, LayaWorker } from './decision-service';

export function createDecisionServer(service: Pick<DecisionService, 'run'>, extensionId: string, port = 4319) {
  if (!/^[a-p]{32}$/.test(extensionId)) throw new Error('Invalid extension ID');
  const origin = `chrome-extension://${extensionId}`;
  let active = 0;
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    if (request.headers.host !== `127.0.0.1:${port}` || request.headers.origin !== origin) { response.writeHead(403); response.end(); return; }
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    const send = (status: number, body: unknown) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(body)); };
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'POST'); response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      response.writeHead(204); response.end(); return;
    }
    if (request.method !== 'POST' || request.url !== '/decision' || !/^application\/json(?:;|$)/i.test(request.headers['content-type'] ?? '')) { send(400, { error: 'Invalid request' }); return; }
    if (active >= 3) { send(429, { error: 'Busy' }); return; }
    active++;
    try {
      let bytes = 0; const chunks: Buffer[] = [];
      for await (const raw of request) {
        const chunk = Buffer.from(raw); bytes += chunk.length;
        if (bytes > 800_000) { send(413, { error: 'Request too large' }); return; }
        chunks.push(chunk);
      }
      const input = parseDecisionRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      if (!input) { send(400, { error: 'Invalid evidence' }); return; }
      send(200, service.run(input));
    } catch { send(503, { error: 'Local decision unavailable' }); }
    finally { active--; }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const extensionId = process.env.DECISION_EXTENSION_ID || createHash('sha256').update(await realpath('dist')).digest('hex').slice(0, 32).replace(/[0-9a-f]/g, char => 'abcdefghijklmnop'[parseInt(char, 16)]!);
  const worker = new LayaWorker();
  const server = createDecisionServer(new DecisionService(request => worker.run(request)), extensionId);
  server.requestTimeout = 10_000; server.headersTimeout = 5000;
  const shutdown = () => { worker.close(); server.close(); };
  process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
  server.listen(4319, '127.0.0.1', () => console.log(`Local Laya decision service: http://127.0.0.1:4319 · extension ${extensionId}. Inference is offline; preload the model before use.`));
}
