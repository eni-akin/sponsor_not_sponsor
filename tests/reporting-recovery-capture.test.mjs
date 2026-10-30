import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath, readdir, stat, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { constants, createReadStream } from 'node:fs';
import { decryptSql, encryptSql, privateDirectory } from '../scripts/reporting-recovery-capture.mjs';

test('private workspace must be mode 0700 and outside the repository', async () => {
  const outside = await mkdtemp(join(tmpdir(), 'sns-private-'));
  const inside = await mkdtemp(join(resolve('.'), '..sns-private-'));
  try {
    assert.equal(await privateDirectory(outside), await realpath(outside));
    await assert.rejects(privateDirectory(inside), /outside the repository/);
    const { chmod } = await import('node:fs/promises');
    await chmod(outside, 0o755);
    await assert.rejects(privateDirectory(outside), /mode 0700/);
  } finally {
    await rm(outside, { recursive: true, force: true });
    await rm(inside, { recursive: true, force: true });
  }
});

test('private recovery SQL encrypts, authenticates, and never overwrites output', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sns-recovery-test-'));
  const source = join(dir, 'fictional.sql');
  const archive = join(dir, 'fictional.snsd1');
  const output = join(dir, 'restored.sql');
  const passphrase = 'fictional-owner-held-secret';
  try {
    const sql = 'INSERT INTO reports(id) VALUES (\'fictional\');\n'.repeat(1024);
    await writeFile(source, sql);
    await encryptSql(source, archive, passphrase);
    assert.equal((await stat(archive)).mode & 0o777, 0o600);
    assert.ok(!(await readFile(archive)).includes(Buffer.from('fictional')));
    await assert.rejects(encryptSql(source, archive, passphrase), /EEXIST/);
    const blocked = join(dir, 'blocked.snsd1');
    await assert.rejects(encryptSql(source, blocked, passphrase, '', async () => { throw new Error('export failed'); }), /export failed/);
    await assert.rejects(stat(blocked), /ENOENT/);
    const empty = join(dir, 'empty.sql');
    await writeFile(empty, '');
    await assert.rejects(encryptSql(empty, blocked, passphrase), /Empty D1 export/);
    await assert.rejects(stat(blocked), /ENOENT/);
    await assert.rejects(decryptSql(archive, output, 'wrong-fictional-secret'), /authentication failed/);
    await assert.rejects(stat(output), /ENOENT/);
    const tampered = await readFile(archive);
    tampered[100] ^= 1;
    const bad = join(dir, 'tampered.snsd1');
    await writeFile(bad, tampered);
    await assert.rejects(decryptSql(bad, output, passphrase), /authentication failed/);
    await assert.rejects(stat(output), /ENOENT/);
    await decryptSql(archive, output, passphrase);
    assert.equal((await stat(output)).mode & 0o777, 0o600);
    assert.equal(await readFile(output, 'utf8'), sql);
    await assert.rejects(decryptSql(archive, output, passphrase), /EEXIST/);
    assert.equal(await readFile(output, 'utf8'), sql);
    assert.deepEqual((await readdir(dir)).sort(), ['empty.sql', 'fictional.snsd1', 'fictional.sql', 'restored.sql', 'tampered.snsd1']);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('installed Wrangler local D1 export streams through a FIFO and imports into an isolated target', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sns-wrangler-fifo-'));
  const wrangler = resolve('node_modules/wrangler/bin/wrangler.js');
  const config = join(dir, 'wrangler.jsonc');
  const archive = join(dir, 'snapshot.snsd1');
  const sql = join(dir, 'authenticated.sql');
  const fifo = join(dir, 'export.pipe');
  const identity = '11111111-1111-4111-8111-111111111111';
  const run = args => {
    const result = spawnSync(process.execPath, [wrangler, ...args, '--config', config], { cwd: dir, encoding: 'utf8', env: { ...process.env, WRANGLER_WRITE_LOGS: 'false', WRANGLER_SEND_METRICS: 'false' } });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  };
  try {
    await writeFile(config, JSON.stringify({ name: 'fictional-recovery-local', compatibility_date: '2026-10-27', d1_databases: [{ binding: 'SOURCE', database_name: 'fictional-source', database_id: identity }, { binding: 'TARGET', database_name: 'fictional-target', database_id: '22222222-2222-4222-8222-222222222222' }] }));
    for (const migration of ['0001_reports.sql', '0002_review.sql']) run(['d1', 'execute', 'fictional-source', '--local', '--file', resolve('reporting/migrations', migration), '--yes']);
    run(['d1', 'execute', 'fictional-source', '--local', '--command', "INSERT INTO intake_counters(day,accepted,acceptance_cap) VALUES ('2026-10-30',0,100); INSERT INTO reports(id,received_at,received_day,expires_at,schema_version,notice_version,submission_key,payload_hash,category,status,posting_url,title,employer,location,role_identifier,payload_json,revision) VALUES ('fictional','2026-10-30T00:00:00Z','2026-10-30','2027-01-01T00:00:00Z',1,'fixture','fictional-key','fixture-hash','other','reviewing','https://example.com/job','Fictional','Example','Remote','fictional','{}',1); INSERT INTO report_contacts(report_id,email,expires_at) VALUES ('fictional','fictional@example.com','2027-01-01T00:00:00Z'); INSERT INTO report_events(report_id,occurred_at,actor,event_type) VALUES ('fictional','2026-10-30T00:00:00Z','fixture','review'); INSERT INTO deletion_ledger(report_id,deleted_at,expires_at) VALUES ('past','2026-10-30T00:00:00Z','2026-11-13T00:00:00Z');", '--yes']);
    assert.equal(spawnSync('mkfifo', ['-m', '600', fifo]).status, 0);
    const holder = await import('node:fs/promises').then(fs => fs.open(fifo, constants.O_RDWR | constants.O_NONBLOCK));
    const reader = createReadStream(fifo);
    const child = spawn(process.execPath, [wrangler, 'd1', 'export', 'fictional-source', '--local', '--output', fifo, '--config', config], { cwd: dir, stdio: 'ignore', env: { ...process.env, WRANGLER_WRITE_LOGS: 'false', WRANGLER_SEND_METRICS: 'false' } });
    const finished = new Promise(resolveChild => child.on('close', async code => { await holder.close(); if (code) reader.destroy(new Error('Wrangler failed')); resolveChild(code); }));
    await encryptSql(reader, archive, 'fictional-local-passphrase', identity, async () => assert.equal(await finished, 0));
    await assert.rejects(decryptSql(archive, sql, 'fictional-local-passphrase', '33333333-3333-4333-8333-333333333333'), /authentication failed/);
    await decryptSql(archive, sql, 'fictional-local-passphrase', identity);
    assert.match(await readFile(sql, 'utf8'), /fictional@example.com/);
    run(['d1', 'execute', 'fictional-target', '--local', '--file', sql, '--yes']);
    for (const table of ['reports', 'report_contacts', 'report_events', 'deletion_ledger', 'intake_counters']) {
      const result = run(['d1', 'execute', 'fictional-target', '--local', '--command', `SELECT COUNT(*) AS count FROM ${table}`, '--json']);
      assert.equal(JSON.parse(result)[0].results[0].count, 1, table);
    }
    const review = run(['d1', 'execute', 'fictional-target', '--local', '--command', "SELECT status,revision FROM reports WHERE id='fictional'", '--json']);
    assert.deepEqual(JSON.parse(review)[0].results[0], { status: 'reviewing', revision: 1 });
    const counter = run(['d1', 'execute', 'fictional-target', '--local', '--command', "SELECT accepted FROM intake_counters WHERE day='2026-10-30'", '--json']);
    assert.equal(JSON.parse(counter)[0].results[0].accepted, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
