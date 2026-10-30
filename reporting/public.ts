import { MAX_REPORT_BYTES, parseReportSubmission, type ReportSubmission } from '../shared/report-schema';
import { readJson } from './db';

interface Statement {
  bind(...values: unknown[]): Statement;
  first<T>(): Promise<T | null>;
}

interface Database {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
}

export interface PublicEnv {
  REPORTS: Database;
  INTAKE_ENABLED: string;
  PUBLIC_ORIGIN: string;
  TURNSTILE_SITEKEY?: string;
  TURNSTILE_SECRET: string;
  TURNSTILE_EXPECTED_HOSTNAME: string;
  TURNSTILE_EXPECTED_ACTION: string;
  DAILY_ACCEPTANCE_CAP: string;
  NETWORK_KEY_SECRET: string;
  BURST_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

interface ChallengeResult { success: boolean; hostname?: string; action?: string }
type VerifyChallenge = (token: string, request: Request, env: PublicEnv) => Promise<boolean>;

const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const json = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });

async function verifyTurnstile(token: string, _request: Request, env: PublicEnv): Promise<boolean> {
  const body = new FormData();
  body.set('secret', env.TURNSTILE_SECRET);
  body.set('response', token);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', body, signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return false;
  const result = await response.json() as ChallengeResult;
  return result.success === true
    && result.hostname === env.TURNSTILE_EXPECTED_HOSTNAME
    && result.action === env.TURNSTILE_EXPECTED_ACTION;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function storedPayload(report: ReportSubmission): Omit<ReportSubmission, 'turnstileToken' | 'email'> {
  const { turnstileToken: _token, email: _email, ...stored } = report;
  return stored;
}

export async function handlePublicRequest(request: Request, env: PublicEnv, verify: VerifyChallenge = verifyTurnstile): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '/health' && request.method === 'GET') return json(200, { available: env.INTAKE_ENABLED === 'true' });
  if (url.pathname === '/api/config') return request.method === 'GET'
    ? json(200, { available: env.INTAKE_ENABLED === 'true', turnstileSitekey: env.TURNSTILE_SITEKEY ?? '' })
    : new Response(null, { status: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' } });
  if (url.pathname !== '/api/reports') return json(404, { error: 'Not found.' });
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
  if (env.INTAKE_ENABLED !== 'true') return json(503, { error: 'Reporting is temporarily unavailable. Keep the downloaded report and try again later.' });
  if (request.headers.get('origin') !== env.PUBLIC_ORIGIN) return json(403, { error: 'This submission origin is not allowed.' });
  if (request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !== 'application/json') return json(415, { error: 'Use application/json.' });
  try {
    if (!env.TURNSTILE_SECRET || !env.NETWORK_KEY_SECRET || !env.BURST_LIMITER) return json(503,{error:'Reporting is temporarily unavailable.'});
    const ip = request.headers.get('cf-connecting-ip');
    if (!ip) return json(503,{error:'Reporting is temporarily unavailable.'});
    const key = await crypto.subtle.importKey('raw',new TextEncoder().encode(env.NETWORK_KEY_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const signature = await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${new Date().toISOString().slice(0,10)}:${ip}`));
    const networkKey = [...new Uint8Array(signature)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
    if (!(await env.BURST_LIMITER.limit({key:networkKey})).success) return json(429,{error:'Too many attempts. Wait a minute and retry.'});
  } catch { return json(503,{error:'Reporting is temporarily unavailable.'}); }

  let report: ReportSubmission;
  try {
    const body = await readJson(request, MAX_REPORT_BYTES);
    report = parseReportSubmission(body.value, body.bytes);
  } catch (error) {
    const status = error instanceof RangeError ? 413 : 400;
    return json(status, { error: error instanceof Error ? error.message : 'Invalid report.' });
  }

  try {
    if (!await verify(report.turnstileToken, request, env)) return json(400, { error: 'Challenge verification failed. Complete a new challenge and retry.' });
  } catch {
    return json(503, { error: 'Challenge verification is temporarily unavailable. Try again later.' });
  }

  const payload = JSON.stringify(storedPayload(report));
  const payloadHash = await sha256(JSON.stringify({payload:JSON.parse(payload),email:report.email ?? null}));
  try {
  const prior = await env.REPORTS.prepare('SELECT id, payload_hash FROM reports WHERE submission_key = ?')
    .bind(report.submissionKey).first<{ id: string; payload_hash: string }>();
  if (prior) return prior.payload_hash === payloadHash
    ? json(200, { reportId: prior.id, accepted: true, retry: true })
    : json(409, { error: 'The submission key was already used for different report contents.' });

  const now = new Date();
  const receivedAt = now.toISOString();
  const day = receivedAt.slice(0, 10);
  const expiresAt = new Date(now.getTime() + 180 * 86_400_000).toISOString();
  const reportId = crypto.randomUUID();
  const cap = Number(env.DAILY_ACCEPTANCE_CAP);
  if (!Number.isSafeInteger(cap) || cap < 1) return json(503, { error: 'Reporting is temporarily unavailable.' });

  const statements = [
    env.REPORTS.prepare('INSERT INTO intake_counters(day, accepted, acceptance_cap) VALUES (?, 0, ?) ON CONFLICT(day) DO UPDATE SET acceptance_cap = excluded.acceptance_cap').bind(day, cap),
    env.REPORTS.prepare('INSERT INTO reports(id, received_at, received_day, expires_at, schema_version, notice_version, submission_key, payload_hash, category, posting_url, title, employer, location, role_identifier, payload_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(reportId, receivedAt, day, expiresAt, report.schemaVersion, report.noticeVersion, report.submissionKey, payloadHash, report.category, report.posting.url, report.posting.title ?? null, report.posting.employer ?? null, report.posting.location ?? null, report.posting.roleIdentifier ?? null, payload),
    ...(report.email ? [env.REPORTS.prepare('INSERT INTO report_contacts(report_id, email, expires_at) VALUES (?, ?, ?)').bind(reportId, report.email, expiresAt)] : []),
    env.REPORTS.prepare('INSERT INTO report_events(report_id, occurred_at, actor, event_type) VALUES (?, ?, ?, ?)').bind(reportId, receivedAt, 'system', 'received'),
  ];
  try {
    await env.REPORTS.batch(statements);
    return json(201, { reportId, accepted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const existing = await env.REPORTS.prepare('SELECT id,payload_hash FROM reports WHERE submission_key=?').bind(report.submissionKey).first<{id:string;payload_hash:string}>();
    if (existing) return existing.payload_hash === payloadHash ? json(200,{accepted:true,retry:true,reportId:existing.id}) : json(409,{error:'The submission key was already used for different report contents.'});
    if (message.includes('daily acceptance cap reached')) return json(429, { error: 'The daily reporting limit has been reached. Keep the downloaded report and try again tomorrow.' });
    return json(503, { error: 'The report could not be saved. Keep the downloaded report and try again later.' });
  }
  } catch { return json(503,{error:'The report could not be saved. Keep the draft and retry later.'}); }
}

export default { fetch(request: Request, env: PublicEnv) { return handlePublicRequest(request,env); } };
