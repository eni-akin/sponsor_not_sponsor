import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { cleanup, deleteReports } from '../reporting/admin';

const migrations = ['0001_reports.sql', '0002_review.sql'];

async function migrate(db: Awaited<ReturnType<Miniflare['getD1Database']>>) {
  for (const file of migrations) {
    const sql = await readFile(new URL('../reporting/migrations/' + file, import.meta.url), 'utf8');
    const triggers: string[] = [];
    const remainder = sql.replace(/CREATE TRIGGER[\s\S]*?END;/g, value => { triggers.push(value); return ''; });
    for (const statement of [...remainder.split(';').map(value => value.trim()).filter(Boolean), ...triggers]) {
      await db.prepare(statement).run();
    }
  }
}

async function insertRows(db: Awaited<ReturnType<Miniflare['getD1Database']>>, table: string, rows: Record<string, unknown>[]) {
  for (const row of rows) {
    const columns = Object.keys(row);
    await db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`).bind(...Object.values(row)).run();
  }
}

test('isolated recovery reapplies the deletion ledger before restored data is exposed', async () => {
  const mf = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    script: 'export default {fetch(){return new Response("local recovery rehearsal")}}',
    compatibilityDate: '2026-10-27',
    d1Databases: ['SOURCE', 'RECOVERED'],
  }));
  try {
    const source = await mf.getD1Database('SOURCE');
    const recovered = await mf.getD1Database('RECOVERED');
    await migrate(source);
    await migrate(recovered);

    await source.prepare("INSERT INTO intake_counters(day,accepted,acceptance_cap) VALUES ('2026-01-01',0,100)").run();
    const report = (id: string, expiresAt: string, duplicateOf: string | null = null) => [
      id, '2026-01-01T00:00:00.000Z', '2026-01-01', expiresAt, 1, 'test-notice', id + '-key', id + '-hash',
      'other', 'new', 'https://example.com/jobs/' + id, id, 'Example', 'Remote', id, '{}', 0, null, '', 'normal', duplicateOf, '', '',
    ];
    const insertReport = 'INSERT INTO reports(id,received_at,received_day,expires_at,schema_version,notice_version,submission_key,payload_hash,category,status,posting_url,title,employer,location,role_identifier,payload_json,revision,closed_at,resolution,severity,duplicate_of,issue_url,fixed_version) VALUES (' + Array(23).fill('?').join(',') + ')';
    await source.prepare(insertReport).bind(...report('expired-primary', '2026-01-02T00:00:00.000Z')).run();
    await source.prepare(insertReport).bind(...report('surviving-duplicate', '2027-01-01T00:00:00.000Z', 'expired-primary')).run();
    await source.prepare(insertReport).bind(...report('previously-deleted', '2027-01-01T00:00:00.000Z')).run();
    for (const id of ['expired-primary', 'previously-deleted']) {
      await source.prepare('INSERT INTO report_contacts(report_id,email,expires_at) VALUES (?,?,?)').bind(id, id + '@example.com', '2027-01-01T00:00:00.000Z').run();
      await source.prepare("INSERT INTO report_events(report_id,occurred_at,actor,event_type) VALUES (?,'2026-01-01T00:00:00.000Z','fixture','created')").bind(id).run();
    }

    // Capture a recovery point before the later deletion.
    const snapshot = {
      reports: (await source.prepare('SELECT * FROM reports ORDER BY id').all<Record<string, unknown>>()).results,
      contacts: (await source.prepare('SELECT * FROM report_contacts ORDER BY report_id').all<Record<string, unknown>>()).results,
      events: (await source.prepare('SELECT * FROM report_events ORDER BY id').all<Record<string, unknown>>()).results,
    };
    await deleteReports(source, ['previously-deleted'], new Date('2026-01-03T00:00:00.000Z'));
    const ledger = (await source.prepare('SELECT * FROM deletion_ledger').all<Record<string, unknown>>()).results;

    // Restore the older snapshot into an isolated database, then merge the current ledger.
    await recovered.prepare("INSERT INTO intake_counters(day,accepted,acceptance_cap) VALUES ('2026-01-01',0,100)").run();
    await insertRows(recovered, 'reports', snapshot.reports);
    await insertRows(recovered, 'report_contacts', snapshot.contacts);
    await insertRows(recovered, 'report_events', snapshot.events);
    await insertRows(recovered, 'deletion_ledger', ledger);

    await recovered.prepare("CREATE TRIGGER rehearsal_cleanup_failure BEFORE DELETE ON reports BEGIN SELECT RAISE(ABORT,'synthetic recovery failure'); END").run();
    await assert.rejects(cleanup({ REPORTS: recovered }, new Date('2026-01-04T00:00:00.000Z')), /Retention cleanup failed/);
    assert.ok(await recovered.prepare("SELECT failed_at FROM operational_health WHERE name='cleanup' AND failed_at IS NOT NULL").first());
    assert.equal((await recovered.prepare('SELECT COUNT(*) AS count FROM reports').first<{ count: number }>())!.count, 3);

    await recovered.prepare('DROP TRIGGER rehearsal_cleanup_failure').run();
    assert.equal(await cleanup({ REPORTS: recovered }, new Date('2026-01-04T00:00:00.000Z')), 2);
    assert.equal(await recovered.prepare("SELECT id FROM reports WHERE id IN ('expired-primary','previously-deleted')").first(), null);
    assert.equal((await recovered.prepare("SELECT duplicate_of FROM reports WHERE id='surviving-duplicate'").first<{ duplicate_of: string | null }>())!.duplicate_of, null);
    assert.equal((await recovered.prepare('SELECT COUNT(*) AS count FROM report_contacts').first<{ count: number }>())!.count, 0);
    assert.equal((await recovered.prepare('SELECT COUNT(*) AS count FROM report_events').first<{ count: number }>())!.count, 0);
    assert.equal((await recovered.prepare("SELECT deleted_count FROM operational_health WHERE name='cleanup'").first<{ deleted_count: number }>())!.deleted_count, 2);
    assert.ok(await recovered.prepare("SELECT report_id FROM deletion_ledger WHERE report_id='previously-deleted'").first());
  } finally {
    await mf.dispose();
  }
});
