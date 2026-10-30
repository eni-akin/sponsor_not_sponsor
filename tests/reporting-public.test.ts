import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handlePublicRequest, type PublicEnv } from '../reporting/public';

class FakeStatement {
  values: unknown[] = [];
  constructor(readonly sql: string, private readonly database: FakeDatabase) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async first<T>() { return this.database.prior as T | null; }
}

class FakeDatabase {
  prior: { id: string; payload_hash: string } | null = null;
  batchStatements: FakeStatement[] = [];
  prepare(sql: string) { return new FakeStatement(sql, this); }
  async batch(statements: FakeStatement[]) { this.batchStatements = statements; return []; }
}

const submission = () => ({
  schemaVersion: 1,
  noticeVersion: '2026-10-27',
  submissionKey: 'retry-123',
  turnstileToken: 'challenge-token',
  category: 'sponsorship',
  expectedOutcome: 'Explicit blocker found',
  explanation: 'The displayed result does not match the public policy.',
  relevantPassage: 'We cannot sponsor this position.',
  email: 'reporter@example.com',
  posting: { url: 'https://example.com/jobs/1?private=yes', title: 'Engineer' },
});

const setup = (enabled = 'true') => {
  const database = new FakeDatabase();
  const env: PublicEnv = {
    REPORTS: database,
    INTAKE_ENABLED: enabled,
    PUBLIC_ORIGIN: 'https://reports.example.com',
    TURNSTILE_SITEKEY: 'public-test-sitekey',
    TURNSTILE_SECRET: 'private-test-secret',
    TURNSTILE_EXPECTED_HOSTNAME: 'reports.example.com',
    TURNSTILE_EXPECTED_ACTION: 'report-submit',
    DAILY_ACCEPTANCE_CAP: '100',
    NETWORK_KEY_SECRET: 'fictional-local-network-secret',
    BURST_LIMITER: { async limit() { return { success:true }; } },
  };
  const request = (body: object = submission(), headers: Record<string, string> = {}) => new Request('https://reports.example.com/api/reports', {
    method: 'POST',
    headers: { origin: env.PUBLIC_ORIGIN, 'content-type': 'application/json', 'cf-connecting-ip':'192.0.2.1', ...headers },
    body: JSON.stringify(body),
  });
  return { database, env, request };
};

test('public config exposes only availability and the public Turnstile sitekey', async () => {
  const { env } = setup();
  const response = await handlePublicRequest(new Request(env.PUBLIC_ORIGIN + '/api/config'), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const text = await response.text();
  assert.deepEqual(JSON.parse(text), { available: true, turnstileSitekey: 'public-test-sitekey' });
  assert.doesNotMatch(text, /private-test-secret|fictional-local-network-secret|TURNSTILE_SECRET|NETWORK_KEY_SECRET/);

  env.INTAKE_ENABLED = 'false';
  env.TURNSTILE_SITEKEY = undefined;
  assert.deepEqual(await (await handlePublicRequest(new Request(env.PUBLIC_ORIGIN + '/api/config'), env)).json(), { available: false, turnstileSitekey: '' });
  assert.equal((await handlePublicRequest(new Request(env.PUBLIC_ORIGIN + '/api/config', { method: 'POST' }), env)).status, 405);
});

test('disabled intake rejects before reading or verifying a submission', async () => {
  const { env, request } = setup('false');
  let verified = false;
  const response = await handlePublicRequest(request(), env, async () => { verified = true; return true; });
  assert.equal(response.status, 503);
  assert.equal(verified, false);
});

test('public intake rejects cross-origin, wrong-content-type, and oversized requests', async () => {
  const { env, request } = setup();
  assert.equal((await handlePublicRequest(request(submission(), { origin: 'https://attacker.example' }), env)).status, 403);
  assert.equal((await handlePublicRequest(request(submission(), { 'content-type': 'text/plain' }), env)).status, 415);
  assert.equal((await handlePublicRequest(request(submission(), { 'content-length': '262145' }), env)).status, 413);
});

test('accepted submission stores contact separately and never stores the challenge token', async () => {
  const { database, env, request } = setup();
  const response = await handlePublicRequest(request(), env, async token => token === 'challenge-token');
  assert.equal(response.status, 201);
  assert.equal(database.batchStatements.length, 4);
  const reportInsert = database.batchStatements.find(statement => statement.sql.startsWith('INSERT INTO reports'))!;
  const storedPayload = String(reportInsert.values.at(-1));
  assert.doesNotMatch(storedPayload, /challenge-token|reporter@example\.com/);
  assert.match(storedPayload, /https:\/\/example\.com\/jobs\/1/);
  const contactInsert = database.batchStatements.find(statement => statement.sql.startsWith('INSERT INTO report_contacts'))!;
  assert.equal(contactInsert.values[1], 'reporter@example.com');
  assert.deepEqual(Object.keys(await response.json()), ['reportId', 'accepted']);
});

test('failed challenge writes nothing', async () => {
  const { database, env, request } = setup();
  const response = await handlePublicRequest(request(), env, async () => false);
  assert.equal(response.status, 400);
  assert.equal(database.batchStatements.length, 0);
});

test('burst rejection and missing secrets fail before challenge verification',async()=>{
  const {env,request}=setup();
  env.BURST_LIMITER={async limit(){return {success:false}}};
  assert.equal((await handlePublicRequest(request(),env,async()=>{throw Error('must not verify')})).status,429);
  env.NETWORK_KEY_SECRET='';
  assert.equal((await handlePublicRequest(request(),env)).status,503);
});

test('streamed oversized bodies are bounded without content-length',async()=>{
  const {env}=setup();
  const stream=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(262145));controller.close();}});
  const request=new Request(env.PUBLIC_ORIGIN+'/api/reports',{method:'POST',headers:{origin:env.PUBLIC_ORIGIN,'content-type':'application/json','cf-connecting-ip':'192.0.2.1'},body:stream,duplex:'half'} as RequestInit);
  assert.equal((await handlePublicRequest(request,env)).status,413);
});

test('Turnstile host/action, upstream failure and database failure never accept',async()=>{
  const {env,request,database}=setup();
  const original=globalThis.fetch;
  try {
    for(const result of [{success:false},{success:true,hostname:'attacker.example',action:'report-submit'},{success:true,hostname:env.TURNSTILE_EXPECTED_HOSTNAME,action:'wrong'}]) {
      globalThis.fetch=async()=>new Response(JSON.stringify(result));
      assert.equal((await handlePublicRequest(request(),env)).status,400);
    }
    globalThis.fetch=async()=>{throw Error('network unavailable')};
    assert.equal((await handlePublicRequest(request(),env)).status,503);
    database.prepare=()=>{throw Error('private SQL detail')};
    const response=await handlePublicRequest(request(),env,async()=>true);
    assert.equal(response.status,503);
    assert.doesNotMatch(await response.text(),/private SQL detail/);
  } finally {globalThis.fetch=original;}
});
