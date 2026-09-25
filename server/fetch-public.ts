import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request as httpsRequest } from 'node:https';

export function publicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a = 0, b = 0] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0))
      || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)));
  }
  // Accept only global unicast IPv6; excludes loopback, private/link-local and mapped IPv4.
  return isIP(address) === 6 && /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:db8:/i.test(address);
}
export function allowedHost(hostname: string, domains: string[]): boolean {
  return domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
}
export interface FetchedPage { url: string; text: string; contentType: string }
export type FetchPage = (url: string, domains: string[], signal: AbortSignal) => Promise<FetchedPage>;

/** Pin a validated DNS address to the TLS request; revalidate every redirect. */
export const fetchPublic: FetchPage = async (raw, domains, signal) => {
  let url = new URL(raw);
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')
      || isIP(url.hostname) || !allowedHost(url.hostname, domains)) throw new Error('Source address is not allowed');
    const addresses = await lookup(url.hostname, { all: true });
    if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw new Error('Source address is not public');
    signal.throwIfAborted();
    const address = addresses[0]!;
    const result = await new Promise<{ status: number; location?: string; text: string; contentType: string }>((resolve, reject) => {
      const req = httpsRequest(url, { signal, family: address.family, headers: { 'User-Agent': 'SponsorNotSponsorResearch/0.5', Accept: 'text/html,application/json', 'Accept-Encoding': 'identity' },
        // Keep TLS hostname verification, but connect only to the validated address.
        lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
      }, response => {
        const chunks: Buffer[] = []; let bytes = 0;
        response.on('error', reject);
        response.on('data', (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > 1_000_000) { response.destroy(new Error('Source exceeded size limit')); return; }
          chunks.push(chunk);
        });
        response.on('end', () => resolve({ status: response.statusCode ?? 0, location: response.headers.location,
          text: Buffer.concat(chunks).toString('utf8'), contentType: response.headers['content-type'] ?? '' }));
      });
      req.setTimeout(6000, () => req.destroy(new Error('Source timeout')));
      req.on('error', reject); req.end();
    });
    if ([301, 302, 303, 307, 308].includes(result.status) && result.location) { url = new URL(result.location, url); continue; }
    if (result.status !== 200) throw new Error('Source unavailable');
    if (!/text\/html|application\/json/i.test(result.contentType)) throw new Error('Unsupported source format');
    return { url: url.href, text: result.text, contentType: result.contentType };
  }
  throw new Error('Too many redirects');
};
