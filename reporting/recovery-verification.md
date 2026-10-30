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

## Current-state capture validation — October 30

`scripts/reporting-recovery-capture.mjs` is a separate, read-only export path. It checks the exact database name/UUID against a single-binding config and remote `d1 info`, then sends Wrangler's full-schema/full-data export through a mode-0600 FIFO in a mode-0700 operator directory directly into AES-256-GCM encryption. Scrypt derives the key from a hidden, twice-entered owner passphrase. The source UUID is authenticated as GCM associated data; decryption requires that exact UUID. Wrangler's output, including its temporary signed download URL, is discarded, and its disk logging is disabled for these subprocesses. The tool publishes the archive with an atomic no-overwrite link. It has no restore or binding-switch command.

Disposable tests passed with the installed Wrangler: a local D1 exported through the FIFO, authenticated into SQL, and imported into a distinct empty local D1. Crypto tests covered wrong passphrase, changed ciphertext, wrong source UUID, output mode 0600, and no overwrite. The Miniflare test covered a later deletion, newer report/contact/event, review revision/event on an older report, expired primary, duplicate clearing, cascades, cleanup health, and the latest acceptance counter including the deleted report. These tests use only fictional records. The local Wrangler test required loopback access outside the restricted sandbox; no remote D1 was accessed.

The actual Mac had FileVault **off** at the October 30 check. A separate native macOS rehearsal created a temporary 64 MiB AES-256 encrypted disk image with a fictional in-memory key, verified `hdiutil isencrypted` returned `YES`, round-tripped synthetic SQL through a mounted image, rejected a wrong passphrase, remounted with the correct passphrase, and then detached and removed the synthetic image. This proves a local encrypted-volume path can work; it did not establish an owner recovery key or capture real data. No production or staging capture or decrypted import has been run. The `decrypt` CLI requires an explicit encrypted-volume confirmation, but that flag is an operator attestation, not a filesystem encryption detector. The owner must establish and verify an encrypted mounted volume before decrypted SQL is written there. Wrangler remote import reads a file's size and content, so a FIFO cannot replace that protected SQL file. Removing plaintext later is ordinary deletion, not a secure-erasure guarantee. Cloudflare's temporary export/download and provider recovery copies remain subject to provider retention.

The capture FIFO requires POSIX `mkfifo` on macOS or Linux; add a platform-specific capture path if Windows operation becomes necessary.

A second disposable native rehearsal chained the full local path: streamed an archive, authenticated and decrypted it only into a private directory on an `hdiutil`-verified AES-256 image, and imported that SQL with the installed Wrangler into an isolated local D1 carrying the real migrations. Queries found one fictional report, contact, event, ledger entry and counter, with `accepted = 1`. The test files, archive and image were removed after detach; the fictional key stayed in memory. This did not involve production, staging, an owner key, or a remote import.

The current-state archive preserves the latest ledger, reports, contacts, review events, counters, and health available in a full D1 export. It does not create a historical snapshot or prove an isolated historical restore. Cloudflare Time Travel restores in place. A real historical incident still needs a verified older archive or a separately approved in-place Time Travel restore, followed by reconciliation and private review before any binding switch.

### Guarded remote capture and encrypted-volume import — October 30

The parent subsequently checked the exact existing disposable database UUID and
U.S. jurisdiction, then aggregate guards confirmed that its two reports had only
the expected fixture IDs and `example.com` URLs, with two fictional contacts and
two fixture-actor events. No report text was printed. It did not rerun the
destructive Time Travel rehearsal or change the remote database.

Using the actual installed Wrangler remote export path, the parent streamed that
synthetic-only database through the capture FIFO into an authenticated encrypted
archive. The archive had mode 0600. It was decrypted inside a separately verified
AES-256 mounted disk image and imported with Wrangler into an explicitly empty,
new local D1. Aggregate assertions passed: 2 reports, 2 contacts, 2 events,
2 deletion-ledger entries, 0 duplicate links, and 4 accepted reports. This checks
the current-state remote export/encryption/decrypt/import chain with real schema
and fixture data, separately from the earlier remote historical restore drill.

Wrangler disk logging and metrics were disabled for the subprocesses. Keys stayed
in process memory; no signed URL, bookmark, passphrase, SQL body, or private report
data was printed. The parent removed the generated synthetic local files and
archive, detached the encrypted image, and removed that generated image. The
remote synthetic source remains unchanged. No staging or production data was
exported, restored, or imported. The owner still supplies a private passphrase
and encrypted workspace when the procedure is actually used.

Final project verification passed both typechecks, all **226 tests**, and build.
