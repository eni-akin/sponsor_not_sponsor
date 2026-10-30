import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DATABASE = 'sns-reporting-recovery-20261029';
const DATABASE_ID = 'e8b49205-75de-421b-85a1-99532adb1a40';
const CONFIG = 'reporting/wrangler.recovery.jsonc';
const WRANGLER = resolve('node_modules/wrangler/bin/wrangler.js');
const NOW = '2026-10-29T18:00:00.000Z';
const LEDGER_EXPIRY = '2026-11-12T18:00:00.000Z';
const IDS = {
  expired: 'recovery-expired-primary',
  duplicate: 'recovery-live-duplicate',
  deleted: 'recovery-deliberately-deleted',
  newer: 'recovery-post-bookmark',
};

const config = JSON.parse(await readFile(CONFIG, 'utf8'));
assert.equal(config.name, 'sns-reporting-recovery-rehearsal-local-only');
assert.equal(config.d1_databases?.length, 1);
assert.deepEqual(config.d1_databases[0], {
  binding: 'REPORTS', database_name: DATABASE, database_id: DATABASE_ID, migrations_dir: 'migrations',
});

function wrangler(args, input) {
  return execFileSync(process.execPath, [WRANGLER, ...args, '--config', CONFIG], {
    cwd: resolve('.'), encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function json(args, input) {
  return JSON.parse(wrangler([...args, '--json'], input));
}

function sqlLiteral(value) {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(value);
  assert.equal(typeof value, 'string');
  return `'${value.replaceAll("'", "''")}'`;
}

function execute(command) {
  const value = json(['d1', 'execute', DATABASE, '--remote', '--command', command, '--yes']);
  const batches = Array.isArray(value) ? value : [value];
  for (const batch of batches) assert.equal(batch.success, true);
  return batches.flatMap(batch => batch.results ?? []);
}

function insert(table, row) {
  const columns = Object.keys(row);
  execute(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(key => sqlLiteral(row[key])).join(',')})`);
}

function report(id, expiresAt, duplicateOf = null) {
  return {
    id, received_at: '2026-10-29T16:00:00.000Z', received_day: '2026-10-29', expires_at: expiresAt,
    schema_version: 1, notice_version: 'recovery-fixture', submission_key: `${id}-key`, payload_hash: `${id}-hash`,
    category: 'other', status: 'new', posting_url: `https://example.com/jobs/${id}`, title: id,
    employer: 'Example Fictional Employer', location: 'Remote', role_identifier: id,
    payload_json: JSON.stringify({ fictional: true, rehearsal: id }), revision: 0, closed_at: null,
    resolution: '', severity: 'normal', duplicate_of: duplicateOf, issue_url: '', fixed_version: '',
  };
}

function related(id) {
  return {
    contact: { report_id: id, email: `${id}@example.com`, expires_at: '2027-04-27T16:00:00.000Z' },
    event: { report_id: id, occurred_at: '2026-10-29T16:00:00.000Z', actor: 'fictional-recovery-fixture', event_type: 'created', detail: null },
  };
}

function seedReport(row) {
  insert('reports', row);
  const rows = related(row.id);
  insert('report_contacts', rows.contact);
  insert('report_events', rows.event);
}

function rows(command) {
  return execute(command);
}

function scalar(command, key = 'count') {
  const result = rows(command);
  assert.equal(result.length, 1);
  return result[0][key];
}

function assertTarget() {
  const info = json(['d1', 'info', DATABASE]);
  const value = info.result ?? info;
  assert.equal(value.uuid ?? value.id, DATABASE_ID);
  assert.equal(value.name, DATABASE);
  assert.equal(value.jurisdiction, 'us');
}

console.log('Checking the hard-pinned disposable recovery database.');
assertTarget();

console.log('Applying the real reporting migrations remotely.');
wrangler(['d1', 'migrations', 'apply', DATABASE, '--remote']);
assert.equal(scalar("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name IN ('reports','report_contacts','report_events','deletion_ledger','operational_health')"), 5);
assert.equal(scalar('SELECT COUNT(*) AS count FROM reports'), 0, 'Recovery database must start empty.');

console.log('Seeding fictional pre-bookmark reports.');
insert('intake_counters', { day: '2026-10-29', accepted: 0, acceptance_cap: 100 });
seedReport(report(IDS.expired, '2000-01-01T00:00:00.000Z'));
seedReport(report(IDS.duplicate, '2027-04-27T16:00:00.000Z', IDS.expired));
seedReport(report(IDS.deleted, '2027-04-27T16:00:00.000Z'));
assert.equal(scalar('SELECT COUNT(*) AS count FROM reports'), 3);
assert.equal(scalar('SELECT COUNT(*) AS count FROM report_contacts'), 3);
assert.equal(scalar('SELECT COUNT(*) AS count FROM report_events'), 3);

// Capture but never print the destructive recovery point.
const bookmarkResult = json(['d1', 'time-travel', 'info', DATABASE]);
const bookmark = bookmarkResult.bookmark ?? bookmarkResult.result?.bookmark;
assert.equal(typeof bookmark, 'string');
assert.ok(bookmark.length >= 20);

console.log('Creating the post-bookmark deletion ledger and later report.');
// Mirrors deleteReports' ledger-upsert + report-delete SQL. Wrangler cannot invoke the application D1 binding remotely,
// so this rehearsal does not replace the local transactional batch tests.
execute(`INSERT INTO deletion_ledger(report_id,deleted_at,expires_at) VALUES (${sqlLiteral(IDS.deleted)},${sqlLiteral(NOW)},${sqlLiteral(LEDGER_EXPIRY)}) ON CONFLICT(report_id) DO UPDATE SET deleted_at=excluded.deleted_at,expires_at=excluded.expires_at; DELETE FROM reports WHERE id=${sqlLiteral(IDS.deleted)}`);
seedReport(report(IDS.newer, '2027-04-27T16:00:00.000Z'));
const latestLedger = rows(`SELECT * FROM deletion_ledger WHERE report_id=${sqlLiteral(IDS.deleted)}`);
const newerReport = rows(`SELECT * FROM reports WHERE id=${sqlLiteral(IDS.newer)}`);
const newerContact = rows(`SELECT * FROM report_contacts WHERE report_id=${sqlLiteral(IDS.newer)}`);
const newerEvent = rows(`SELECT * FROM report_events WHERE report_id=${sqlLiteral(IDS.newer)}`);
assert.equal(latestLedger.length, 1);
assert.equal(newerReport.length, 1);
assert.equal(newerContact.length, 1);
assert.equal(newerEvent.length, 1);
assert.equal(scalar('SELECT COUNT(*) AS count FROM reports'), 3);

console.log('Restoring only the disposable database to the private bookmark.');
json(['d1', 'time-travel', 'restore', DATABASE, '--bookmark', bookmark], 'y\n');
assertTarget();
assert.equal(scalar(`SELECT COUNT(*) AS count FROM reports WHERE id=${sqlLiteral(IDS.deleted)}`), 1);
assert.equal(scalar(`SELECT COUNT(*) AS count FROM reports WHERE id=${sqlLiteral(IDS.newer)}`), 0);
assert.equal(scalar('SELECT COUNT(*) AS count FROM deletion_ledger'), 0);

console.log('Reapplying the latest ledger and reconciling the newer report before cleanup.');
insert('deletion_ledger', latestLedger[0]);
insert('reports', newerReport[0]);
insert('report_contacts', newerContact[0]);
const { id: _oldEventId, ...eventWithoutId } = newerEvent[0];
insert('report_events', eventWithoutId);
assert.equal(scalar('SELECT COUNT(*) AS count FROM reports'), 4);

console.log('Running the application cleanup SQL against the recovered state.');
const cleanupIds = rows(`SELECT id FROM reports WHERE expires_at <= ${sqlLiteral(NOW)} OR id IN (SELECT report_id FROM deletion_ledger) ORDER BY expires_at LIMIT 100`).map(row => row.id);
assert.deepEqual(cleanupIds, [IDS.expired, IDS.deleted]);
for (const id of cleanupIds) {
  execute(`INSERT INTO deletion_ledger(report_id,deleted_at,expires_at) VALUES (${sqlLiteral(id)},${sqlLiteral(NOW)},${sqlLiteral(LEDGER_EXPIRY)}) ON CONFLICT(report_id) DO UPDATE SET deleted_at=excluded.deleted_at,expires_at=excluded.expires_at; DELETE FROM reports WHERE id=${sqlLiteral(id)}`);
}
execute(`DELETE FROM deletion_ledger WHERE expires_at <= ${sqlLiteral(NOW)}; DELETE FROM intake_counters WHERE day < '2026-07-31'; INSERT INTO operational_health(name,succeeded_at,deleted_count) VALUES ('cleanup',${sqlLiteral(NOW)},${cleanupIds.length}) ON CONFLICT(name) DO UPDATE SET succeeded_at=excluded.succeeded_at,deleted_count=excluded.deleted_count`);

assert.equal(scalar('SELECT COUNT(*) AS count FROM reports'), 2);
assert.equal(scalar(`SELECT COUNT(*) AS count FROM reports WHERE id IN (${sqlLiteral(IDS.duplicate)},${sqlLiteral(IDS.newer)})`), 2);
assert.equal(scalar('SELECT COUNT(*) AS count FROM report_contacts'), 2);
assert.equal(scalar('SELECT COUNT(*) AS count FROM report_events'), 2);
assert.equal(scalar('SELECT COUNT(*) AS count FROM reports WHERE duplicate_of IS NOT NULL'), 0);
assert.equal(scalar(`SELECT COUNT(*) AS count FROM deletion_ledger WHERE report_id IN (${sqlLiteral(IDS.expired)},${sqlLiteral(IDS.deleted)})`), 2);
assert.equal(scalar("SELECT deleted_count AS count FROM operational_health WHERE name='cleanup'"), 2);
assert.equal(scalar("SELECT accepted AS count FROM intake_counters WHERE day='2026-10-29'"), 4);

console.log('PASS: disposable remote recovery restored, replayed deletions, reconciled newer data, and cleaned expired fixtures.');
console.log(`Preserved ${DATABASE} (${DATABASE_ID}) for root review; no staging or production database was touched.`);
