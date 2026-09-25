import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseResearchRequest } from '../src/research';
import { ResearchService, braveSearch, validateEmployers } from './research-service';

export function createResearchServer(service: Pick<ResearchService, 'research'>, extensionId: string, port = 4318) {
  if (!/^[a-p]{32}$/.test(extensionId)) throw new Error('Invalid extension ID');
  const origin = `chrome-extension://${extensionId}`;
  let active = 0;
  const recent: number[] = [];
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    // Loopback-only service. Refuse web origins, DNS rebinding hostnames, forms,
    // and extensions other than the configured client. Never enable wildcard CORS.
    if (request.headers.host !== `127.0.0.1:${port}` || request.headers.origin !== origin) {
      response.writeHead(403); response.end(); return;
    }
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'POST');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      response.writeHead(204); response.end(); return;
    }
    const send = (status: number, value: unknown) => {
      if (!response.destroyed) { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(value)); }
    };
    if (request.method !== 'POST' || request.url !== '/research' || !/^application\/json(?:;|$)/i.test(request.headers['content-type'] ?? '')) { send(400, { error: 'Invalid request' }); return; }
    while (recent.length && recent[0]! < Date.now() - 60_000) recent.shift();
    if (active >= 3 || recent.length >= 30) { send(429, { error: 'Please retry later' }); return; }
    active++; recent.push(Date.now());
    try {
      const chunks: Buffer[] = []; let bytes = 0;
      for await (const raw of request) {
        const chunk = Buffer.from(raw); bytes += chunk.length;
        if (bytes > 8192) { send(413, { error: 'Request too large' }); return; }
        chunks.push(chunk);
      }
      const input = parseResearchRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      if (!input) { send(400, { error: 'Invalid role metadata' }); return; }
      send(200, await service.research(input));
    } catch { send(503, { error: 'Research unavailable; try again later' }); }
    finally { active--; }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const extensionPath = await realpath('dist');
  const extensionId = process.env.RESEARCH_EXTENSION_ID || createHash('sha256').update(extensionPath).digest('hex').slice(0, 32).replace(/[0-9a-f]/g, char => 'abcdefghijklmnop'[parseInt(char, 16)]!);
  const registryPath = resolve(process.env.RESEARCH_EMPLOYERS_FILE || 'server/employers.json');
  const employers = validateEmployers(JSON.parse(await readFile(registryPath, 'utf8')));
  const search = process.env.BRAVE_SEARCH_API_KEY ? braveSearch(process.env.BRAVE_SEARCH_API_KEY) : undefined;
  const service = new ResearchService(employers, resolve(process.env.RESEARCH_CACHE_DIR || '.research-cache'), search);
  const server = createResearchServer(service, extensionId);
  server.requestTimeout = 25_000; server.headersTimeout = 10_000;
  server.listen(4318, '127.0.0.1', () => console.log(`Research service ready at http://127.0.0.1:4318 for extension ${extensionId}. ${employers.length} verified employer entries; web search ${search ? 'configured' : 'not configured'}.`));
}
