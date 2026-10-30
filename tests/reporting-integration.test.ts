import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { handlePublicRequest, type PublicEnv } from '../reporting/public';
import { handleAdminRequest, cleanup, type AdminEnv } from '../reporting/admin';

test('real local D1: concurrent cap/retries, private inbox, revision checks, retention and cascading deletion', async () => {
  const mf = new Miniflare(convertV4MiniflareOptions({ modules:true, script:'export default {fetch(){return new Response("local test")}}', compatibilityDate:'2026-10-27', d1Databases:['REPORTS'] }));
  try {
    const db = await mf.getD1Database('REPORTS');
    for (const file of ['0001_reports.sql','0002_review.sql']) {
      const sql = await readFile(new URL('../reporting/migrations/'+file,import.meta.url),'utf8');
      // D1 exec treats lines separately; keep trigger bodies as single statements.
      const triggers: string[] = [];
      const remainder=sql.replace(/CREATE TRIGGER[\s\S]*?END;/g, value=>{triggers.push(value);return '';});
      const statements = [...remainder.split(';').map(value=>value.trim()).filter(Boolean),...triggers];
      for (const statement of statements) await db.prepare(statement).run();
    }
    const env: PublicEnv = {REPORTS:db,INTAKE_ENABLED:'true',PUBLIC_ORIGIN:'https://reports.example',TURNSTILE_SECRET:'test',NETWORK_KEY_SECRET:'fictional-network-key',TURNSTILE_EXPECTED_HOSTNAME:'reports.example',TURNSTILE_EXPECTED_ACTION:'report-submit',DAILY_ACCEPTANCE_CAP:'2',BURST_LIMITER:{async limit(){return {success:true}}}};
    const draft = (key:string,email='reporter@example.com') => ({schemaVersion:1,noticeVersion:'2026-10-30',submissionKey:key,turnstileToken:'test',category:'other',expectedOutcome:'Missing badge',explanation:'Fictional report',relevantPassage:'No public passage available',posting:{url:'https://example.com/jobs/1'},email});
    const request = (body:unknown) => new Request(env.PUBLIC_ORIGIN+'/api/reports',{method:'POST',headers:{origin:env.PUBLIC_ORIGIN,'content-type':'application/json','cf-connecting-ip':'192.0.2.1'},body:JSON.stringify(body)});
    const same = await Promise.all(Array.from({length:4},()=>handlePublicRequest(request(draft('same')),env,async()=>true)));
    assert.ok(same.every(result=>[200,201].includes(result.status)));
    const first = await same[0]!.json() as {reportId:string};
    const limited = await Promise.all(Array.from({length:5},(_,i)=>handlePublicRequest(request(draft('unique-'+i)),env,async()=>true)));
    assert.equal(limited.filter(result=>result.status===201).length,1);
    assert.equal(limited.filter(result=>result.status===429).length,4);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM reports').first<{n:number}>())!.n,2);
    assert.equal((await db.prepare('SELECT accepted FROM intake_counters').first<{accepted:number}>())!.accepted,2);
    await db.prepare("CREATE TRIGGER reject_test_contact BEFORE INSERT ON report_contacts WHEN NEW.email='blocked@example.com' BEGIN SELECT RAISE(ABORT,'synthetic contact write failure'); END").run();
    env.DAILY_ACCEPTANCE_CAP='3';
    assert.equal((await handlePublicRequest(request(draft('rollback','blocked@example.com')),env,async()=>true)).status,503);
    assert.equal((await db.prepare('SELECT accepted FROM intake_counters').first<{accepted:number}>())!.accepted,2);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM reports').first<{n:number}>())!.n,2);
    await db.prepare('DROP TRIGGER reject_test_contact').run();
    assert.equal((await handlePublicRequest(request(draft('same','different@example.com')),env,async()=>true)).status,409);
    const stored = await db.prepare('SELECT payload_json FROM reports WHERE id=?').bind(first.reportId).first<{payload_json:string}>();
    assert.doesNotMatch(stored!.payload_json,/reporter@example.com|turnstileToken/);
    const admin:AdminEnv={REPORTS:db,OWNER_EMAIL:'owner@example.com',ACCESS_AUD:'test-aud',ADMIN_ORIGIN:'https://admin.example'};
    const ctx={access:{aud:'test-aud',async getIdentity(){return {email:'owner@example.com'}}}};
    const adminRequest=(path:string,body?:unknown)=>new Request(admin.ADMIN_ORIGIN+path,body?{method:'POST',headers:{origin:admin.ADMIN_ORIGIN,'content-type':'application/json','x-sns-admin':'1'},body:JSON.stringify(body)}:{});
    assert.equal((await handleAdminRequest(adminRequest('/'),admin,{})).status,403);
    assert.equal((await handleAdminRequest(adminRequest('/api/reports'),admin,{access:{aud:'wrong',async getIdentity(){return {email:'owner@example.com'}}}})).status,403);
    assert.equal((await handleAdminRequest(adminRequest('/'),admin,{access:{aud:'test-aud',async getIdentity(){return {email:'intruder@example.com'}}}})).status,403);
    const list=await (await handleAdminRequest(adminRequest('/api/reports'),admin,ctx)).text();
    assert.doesNotMatch(list,/payload_json|reporter@example.com/);
    const noOrigin = new Request(admin.ADMIN_ORIGIN+'/api/reports/'+first.reportId+'/update',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
    assert.equal((await handleAdminRequest(noOrigin,admin,ctx)).status,403);
    const review={revision:0,status:'closed',resolution:'confirmed',severity:'normal',duplicateOf:'',issueUrl:'',fixedVersion:'',note:'Fictional note'};
    const edits=await Promise.all([handleAdminRequest(adminRequest('/api/reports/'+first.reportId+'/update',review),admin,ctx),handleAdminRequest(adminRequest('/api/reports/'+first.reportId+'/update',review),admin,ctx)]);
    assert.deepEqual(edits.map(response=>response.status).sort(),[200,409]);
    assert.equal((await handleAdminRequest(adminRequest('/api/reports/'+first.reportId+'/update',review),admin,ctx)).status,409);
    const closed=await db.prepare('SELECT received_at,expires_at,closed_at FROM reports WHERE id=?').bind(first.reportId).first<{received_at:string;expires_at:string;closed_at:string}>();
    assert.ok(Date.parse(closed!.expires_at)<=Date.parse(closed!.closed_at)+90*86400000);
    await db.prepare('UPDATE reports SET expires_at=? WHERE id=?').bind('2000-01-01T00:00:00Z',first.reportId).run();
    await db.prepare("CREATE TRIGGER reject_test_delete BEFORE DELETE ON reports BEGIN SELECT RAISE(ABORT,'synthetic cleanup failure'); END").run();
    await assert.rejects(cleanup(admin),/cleanup failed/);
    assert.ok(await db.prepare("SELECT failed_at FROM operational_health WHERE name='cleanup'").first());
    await db.prepare('DROP TRIGGER reject_test_delete').run();
    assert.equal(await cleanup(admin),1);
    assert.equal(await db.prepare('SELECT * FROM report_contacts WHERE report_id=?').bind(first.reportId).first(),null);
    assert.equal(await db.prepare('SELECT * FROM report_events WHERE report_id=?').bind(first.reportId).first(),null);
    assert.ok(await db.prepare('SELECT * FROM deletion_ledger WHERE report_id=?').bind(first.reportId).first());
    const other=await db.prepare('SELECT id FROM reports LIMIT 1').first<{id:string}>();
    assert.equal((await handleAdminRequest(adminRequest('/api/reports/'+other!.id+'/redact',{revision:0,confirm:other!.id}),admin,ctx)).status,200);
    assert.equal((await db.prepare('SELECT payload_json FROM reports WHERE id=?').bind(other!.id).first<{payload_json:string}>())!.payload_json,'{}');
    assert.equal(await db.prepare('SELECT * FROM report_contacts WHERE report_id=?').bind(other!.id).first(),null);
    assert.equal(await cleanup(admin),1);
  } finally {await mf.dispose();}
});
