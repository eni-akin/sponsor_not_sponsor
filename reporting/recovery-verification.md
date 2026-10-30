# Remote D1 recovery verification

Verified: October 29, 2026 (America/Chicago)

## Scope and target

This rehearsal used only the newly created, empty, synthetic-only database:

- Name: `sns-reporting-recovery-20261029`
- UUID: `e8b49205-75de-421b-85a1-99532adb1a40`
- Jurisdiction: `us`

The script and Wrangler configuration hard-pin all three target facts and assert them before migration and again after restore. The configuration has exactly one D1 binding and no Worker entrypoint or deployed binding. No staging or production database was restored or modified.

The database is preserved after the passing run for root review. Do not delete it until that review is complete.

## Procedure and evidence

Command run with the existing authenticated Wrangler installation:

```sh
node scripts/reporting-recovery-rehearsal.mjs
```

The script captured Wrangler JSON and the Time Travel bookmark in process. It did not print or save the bookmark.

1. Verified the remote database name, UUID, and U.S. jurisdiction; asserted that the reports table was empty.
2. Applied the real `0001_reports.sql` and `0002_review.sql` migrations remotely and verified the five required reporting/recovery tables.
3. Seeded three fictional `example.com` reports, each with contact and event rows:
   - an expired primary;
   - a live report linked as its duplicate; and
   - a report that would be deliberately deleted after the bookmark.
4. Captured a private Time Travel bookmark.
5. Added the 14-day deletion-ledger entry and deleted the designated fixture, then created a fourth, post-bookmark report. Captured the current ledger and newer report/contact/event rows in memory.
6. Restored the disposable database in place to the old bookmark. Verified that the deleted fixture returned, the newer fixture was absent, and the later deletion ledger was absent.
7. Reapplied the captured ledger and reconciled the post-bookmark report, contact, and event before retention cleanup.
8. Ran the same cleanup selection, ledger upsert, report deletion, expired-ledger/counter cleanup, and health-update SQL used by `reporting/admin.ts`.

Final remote assertions passed:

| State | Expected and observed |
| --- | --- |
| Reports | 2: the live duplicate and reconciled post-bookmark report |
| Contacts | 2, proving deleted-report contact cascades |
| Events | 2, proving deleted-report event cascades |
| Non-null duplicate links | 0, proving deletion of the expired primary cleared the survivor's reference |
| Deletion ledger | 2 entries: the earlier deliberate deletion and expired primary |
| Cleanup health | `deleted_count = 2` |
| Acceptance counter | 4, preserving the three original accepts plus the later report |

Wrangler exited successfully with:

```text
PASS: disposable remote recovery restored, replayed deletions, reconciled newer data, and cleaned expired fixtures.
Preserved sns-reporting-recovery-20261029 (e8b49205-75de-421b-85a1-99532adb1a40) for root review; no staging or production database was touched.
```

## Safety properties

- The script invokes Wrangler without a shell and never accepts a database argument, environment override, UUID, bookmark, or SQL target from the caller.
- It validates the checked-in recovery config before the first remote call and validates remote target metadata before any migration or data write.
- It refuses a database whose reports table is not empty. The completed database is therefore intentionally not rerunnable without a separately reviewed disposal/recreation step.
- All report contents, addresses, contacts, and actors are explicitly fictional and use `example.com`.
- The restore used the documented destructive in-place Time Travel operation only on the authorized disposable database.

## Limitations

- A deployed Worker binding cannot be attached to an arbitrary remote D1 database without deploying or changing live configuration. The rehearsal therefore mirrors `deleteReports` and `cleanup` SQL precisely through Wrangler instead of calling the TypeScript functions against the remote binding.
- Wrangler executes the mirrored SQL remotely, but this run does not independently prove the application's `db.batch()` atomicity or cleanup failure recording. The existing Miniflare integration and recovery tests cover transactional batches, rollback/failure health, cascades, and ledger behavior with the same migrations.
- The exercise proves one current bookmark restore and application-level reconciliation on a disposable database. It does not prove recovery at every point in the documented retention window, provider availability during an incident, or absence of deleted content from Cloudflare recovery/security systems.
- Time Travel still overwrites its target in place and does not clone to an isolated database. A real incident requires paused intake, a separately controlled recovery target/export strategy, the latest deletion ledger, and explicit reconciliation of records newer than the recovery point before any binding switch.
