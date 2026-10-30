import { type Database, json, readJson } from './db';
import { adminHtml, adminCss, adminJs } from './admin-ui';

export interface AdminEnv {
  REPORTS: Database;
  OWNER_EMAIL: string;
  ACCESS_AUD: string;
  ADMIN_ORIGIN: string;
}
export interface AccessContext {
  access?: { aud: string; getIdentity(): Promise<{ email?: string } | null> };
}
const DAY = 86400000;
interface Row { id: string; revision: number; received_at: string; closed_at: string | null; expires_at: string; duplicate_of: string | null }

export async function deleteReports(db: Database, ids: string[], now = new Date()): Promise<void> {
  if (!ids.length) return;
  const statements = ids.flatMap(id => [
    db.prepare('INSERT INTO deletion_ledger(report_id, deleted_at, expires_at) VALUES (?, ?, ?) ON CONFLICT(report_id) DO UPDATE SET deleted_at=excluded.deleted_at, expires_at=excluded.expires_at')
      .bind(id, now.toISOString(), new Date(now.getTime() + 14 * DAY).toISOString()),
    db.prepare('DELETE FROM reports WHERE id = ?').bind(id),
  ]);
  await db.batch(statements);
}

export async function cleanup(env: Pick<AdminEnv, 'REPORTS'>, now = new Date()): Promise<number> {
  const db = env.REPORTS;
  try {
    const rows = await db.prepare("SELECT id FROM reports WHERE expires_at <= ? OR id IN (SELECT report_id FROM deletion_ledger) ORDER BY expires_at LIMIT 100").bind(now.toISOString()).all<{ id: string }>();
    await deleteReports(db, rows.results.map(row => row.id), now);
    await db.batch([
      db.prepare('DELETE FROM deletion_ledger WHERE expires_at <= ?').bind(now.toISOString()),
      db.prepare('DELETE FROM intake_counters WHERE day < ?').bind(new Date(now.getTime() - 90 * DAY).toISOString().slice(0, 10)),
      db.prepare("INSERT INTO operational_health(name,succeeded_at,deleted_count) VALUES ('cleanup',?,?) ON CONFLICT(name) DO UPDATE SET succeeded_at=excluded.succeeded_at, deleted_count=excluded.deleted_count").bind(now.toISOString(), rows.results.length),
    ]);
    return rows.results.length;
  } catch {
    await db.batch([db.prepare("INSERT INTO operational_health(name,failed_at) VALUES ('cleanup',?) ON CONFLICT(name) DO UPDATE SET failed_at=excluded.failed_at").bind(now.toISOString())]);
    throw new Error('Retention cleanup failed.');
  }
}

export async function handleAdminRequest(request: Request, env: AdminEnv, ctx: AccessContext): Promise<Response> {
  try {
    if (!env.ACCESS_AUD || !env.OWNER_EMAIL || !ctx.access || ctx.access.aud !== env.ACCESS_AUD) return json(403, { error: 'Owner sign-in required.' });
    const identity = await ctx.access.getIdentity();
    if (identity?.email?.toLowerCase() !== env.OWNER_EMAIL.toLowerCase()) return json(403, { error: 'Owner sign-in required.' });
    const url = new URL(request.url);
    const db = env.REPORTS;
    if (request.method === 'GET') {
      if (url.pathname === '/api/health') {
        const health = await db.prepare('SELECT * FROM operational_health').all();
        const counts = await db.prepare('SELECT status, COUNT(*) AS count FROM reports GROUP BY status').all();
        const expiring = await db.prepare('SELECT COUNT(*) AS count FROM reports WHERE expires_at <= ?').bind(new Date(Date.now() + 7 * DAY).toISOString()).first();
        return json(200, { health: health.results, counts: counts.results, expiring });
      }
      if (url.pathname === '/api/reports') {
        const offset = Number(url.searchParams.get('offset') ?? 0);
        const status = url.searchParams.get('status') ?? '';
        if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000 || !['', 'new', 'reviewing', 'closed'].includes(status)) return json(400, { error: 'Invalid page or status.' });
        const list = await db.prepare('SELECT id,received_at,expires_at,category,status,title,employer,revision,severity FROM reports WHERE (? = ? OR status = ?) ORDER BY received_at DESC,id LIMIT 26 OFFSET ?').bind(status, '', status, offset).all();
        return json(200, { reports: list.results.slice(0, 25), nextOffset: list.results.length > 25 ? offset + 25 : null });
      }
      const match = /^\/api\/reports\/([a-zA-Z0-9-]{1,100})$/.exec(url.pathname);
      if (match) {
        const row = await db.prepare('SELECT * FROM reports WHERE id = ?').bind(match[1]).first<Row>();
        if (!row) return json(404, { error: 'Report not found.' });
        const contact = await db.prepare('SELECT email FROM report_contacts WHERE report_id = ?').bind(row.id).first();
        const events = await db.prepare('SELECT occurred_at,actor,event_type,detail FROM report_events WHERE report_id = ? ORDER BY id DESC LIMIT 100').bind(row.id).all();
        const duplicates = await db.prepare('SELECT id,title,status FROM reports WHERE id <> ? AND posting_url = (SELECT posting_url FROM reports WHERE id=?) AND category=(SELECT category FROM reports WHERE id=?) LIMIT 10').bind(row.id,row.id,row.id).all();
        return json(200, { report: row, contact, events: events.results, duplicateCandidates: duplicates.results });
      }
      if (url.pathname.startsWith('/api/')) return json(404, { error: 'Not found.' });
      const asset = url.pathname === '/' ? [adminHtml,'text/html'] : url.pathname === '/styles.css' ? [adminCss,'text/css'] : url.pathname === '/app.js' ? [adminJs,'text/javascript'] : null;
      if (!asset) return json(404,{error:'Not found.'});
      const response = new Response(asset[0],{headers:{'Content-Type':asset[1]+'; charset=utf-8'}});
      const headers = new Headers(response.headers);
      headers.set('Cache-Control','no-store');
      headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
      headers.set('Referrer-Policy','no-referrer');
      return new Response(response.body, { status: response.status, headers });
    }
    if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' });
    if (request.headers.get('origin') !== env.ADMIN_ORIGIN || request.headers.get('x-sns-admin') !== '1') return json(403, { error: 'Same-origin admin action required.' });
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return json(415, { error: 'Use JSON.' });
    const match = /^\/api\/reports\/([a-zA-Z0-9-]{1,100})\/(update|delete|redact)$/.exec(url.pathname);
    if (!match) return json(404, { error: 'Not found.' });
    let body: Record<string, unknown>;
    try { body = (await readJson(request, 8192)).value as Record<string, unknown>; }
    catch { return json(400, { error: 'Invalid action body.' }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json(400, { error: 'Invalid action body.' });
    const row = await db.prepare('SELECT id,revision,received_at,closed_at,expires_at,duplicate_of FROM reports WHERE id=?').bind(match[1]).first<Row>();
    if (!row) return json(404, { error: 'Report not found.' });
    if (body.revision !== row.revision) return json(409, { error: 'Report changed. Reload before editing.' });
    const now = new Date();
    const guard = () => db.prepare('UPDATE reports SET revision=CASE WHEN revision=? THEN revision ELSE NULL END WHERE id=?').bind(row.revision,row.id);
    if (match[2] === 'delete') {
      if (Object.keys(body).some(key => !['revision','confirm'].includes(key)) || body.confirm !== row.id) return json(400, { error: 'Confirm the report ID to delete.' });
      // The revision guard and deletion share one transaction; a stale action cannot delete a newer edit.
      await db.batch([
        guard(),
        db.prepare('INSERT INTO deletion_ledger(report_id,deleted_at,expires_at) SELECT id,?,? FROM reports WHERE id=? AND revision=?').bind(now.toISOString(),new Date(now.getTime()+14*DAY).toISOString(),row.id,row.revision),
        db.prepare('DELETE FROM reports WHERE id=? AND revision=?').bind(row.id,row.revision),
      ]);
      return json(200, { deleted: true });
    }
    if (match[2] === 'redact') {
      if (Object.keys(body).some(key => !['revision','confirm'].includes(key)) || body.confirm !== row.id) return json(400, { error: 'Confirm the report ID to redact.' });
      await db.batch([
        guard(),
        db.prepare('INSERT INTO deletion_ledger(report_id,deleted_at,expires_at) VALUES (?,?,?) ON CONFLICT(report_id) DO UPDATE SET deleted_at=excluded.deleted_at,expires_at=excluded.expires_at').bind(row.id,now.toISOString(),new Date(now.getTime()+14*DAY).toISOString()),
        db.prepare("UPDATE reports SET payload_json='{}',posting_url='',title=NULL,employer=NULL,location=NULL,role_identifier=NULL,payload_hash='',resolution='',issue_url='',fixed_version='',revision=revision+1 WHERE id=? AND revision=?").bind(row.id,row.revision),
        db.prepare('DELETE FROM report_contacts WHERE report_id=?').bind(row.id),
        db.prepare('DELETE FROM report_events WHERE report_id=?').bind(row.id),
        db.prepare("INSERT INTO report_events(report_id,occurred_at,actor,event_type) VALUES (?,?,?,'redacted')").bind(row.id,now.toISOString(),identity.email),
      ]);
      return json(200,{ redacted:true });
    }
    const allowed = ['revision','status','resolution','severity','duplicateOf','issueUrl','fixedVersion','note'];
    if (Object.keys(body).some(key => !allowed.includes(key))) return json(400,{error:'Unexpected field.'});
    const statuses = ['new','reviewing','closed','spam'];
    const resolutions = ['', 'confirmed','not-reproduced','expected-behavior','duplicate','insufficient-evidence'];
    if (!statuses.includes(String(body.status)) || !resolutions.includes(String(body.resolution)) || !['normal','low','high','critical'].includes(String(body.severity))) return json(400,{error:'Invalid review state.'});
    for (const key of ['duplicateOf','issueUrl','fixedVersion','note']) if (typeof body[key] !== 'string' || (body[key] as string).length > (key === 'note' ? 2000 : 300)) return json(400,{error:'Invalid review field.'});
    if (body.status === 'closed' && !body.resolution) return json(400,{error:'Closing requires a resolution.'});
    if (body.issueUrl && !/^https:\/\/github\.com\/[^/?#]+\/[^/?#]+\/issues\/\d+$/.test(String(body.issueUrl))) return json(400,{error:'Use a GitHub issue URL.'});
    if (body.duplicateOf) {
      const dependent = await db.prepare('SELECT id FROM reports WHERE duplicate_of=? LIMIT 1').bind(row.id).first();
      if(dependent) return json(400,{error:'A primary report with duplicates cannot itself become a duplicate.'});
      const target = await db.prepare('SELECT id,duplicate_of FROM reports WHERE id=?').bind(body.duplicateOf).first<Row>();
      if (!target || target.id === row.id || target.duplicate_of) return json(400,{error:'Choose an existing primary report.'});
    }
    if (body.status === 'spam') {
      await db.batch([guard(), db.prepare('INSERT INTO deletion_ledger(report_id,deleted_at,expires_at) VALUES (?,?,?) ON CONFLICT(report_id) DO UPDATE SET deleted_at=excluded.deleted_at,expires_at=excluded.expires_at').bind(row.id,now.toISOString(),new Date(now.getTime()+14*DAY).toISOString()),db.prepare('DELETE FROM reports WHERE id=?').bind(row.id)]);
      return json(200,{deleted:true});
    }
    const closed = body.status === 'closed' ? row.closed_at ?? now.toISOString() : row.closed_at;
    const expiry = new Date(Math.min(Date.parse(row.received_at)+180*DAY, closed ? Date.parse(closed)+90*DAY : Infinity)).toISOString();
    await db.batch([
      guard(),
      db.prepare('UPDATE reports SET status=?,resolution=?,severity=?,duplicate_of=?,issue_url=?,fixed_version=?,closed_at=?,expires_at=?,revision=revision+1 WHERE id=? AND revision=?').bind(body.status,body.resolution,body.severity,body.duplicateOf || null,body.issueUrl,body.fixedVersion,closed,expiry,row.id,row.revision),
      db.prepare('UPDATE report_contacts SET expires_at=? WHERE report_id=?').bind(expiry,row.id),
      db.prepare("INSERT INTO report_events(report_id,occurred_at,actor,event_type,detail) SELECT id,?,?,'review',? FROM reports WHERE id=? AND revision=?").bind(now.toISOString(),identity.email,JSON.stringify(body),row.id,row.revision+1),
    ]);
    return json(200,{updated:true});
  } catch(error) {
    if(error instanceof Error && error.message.includes('invalid duplicate primary')) return json(409,{error:'Duplicate grouping changed. Reload and select a primary report.'});
    if (error instanceof Error && error.message.includes('reports.revision')) return json(409,{error:'Report changed. Reload before editing.'});
    return json(503,{error:'The inbox is temporarily unavailable. Reload and try again.'});
  }
}

export default {
  fetch: handleAdminRequest,
  async scheduled(_event: unknown, env: AdminEnv) { await cleanup(env); },
};
