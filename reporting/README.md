# Private reporting operations

Run commands from the repository root. Production intake was enabled October 30;
read-only October 31 probes returned HTTP 200 and `available: true` on both
`/health` and `/api/config`. The production admin root redirected anonymous
traffic to Cloudflare Access. These probes do not verify private cleanup health,
owner sign-in or current report counts. Staging remains separately configured.

The 1.3 admin/public UI was deployed October 31 under owner approval; the live
fictional workflow is awaiting normal challenge verification. Website 1.3
publication remains held behind that gate. Start with the
[rollout checkpoint](../docs/UI_REFRESH_ROLLOUT_2026-10-31.md),
[UI handoff](../docs/UI_REFRESH_HANDOFF_2026-10-31.md) and
[closeout plan](../docs/UI_REFRESH_CLOSEOUT_PLAN_2026-10-31.md).
The [October 29 workflow record](../docs/REPORTING_HANDOFF_2026-10-29.md)
preserves fictional submission/retry/review/deletion evidence; its paused state
is historical. Recheck live state and exact production bindings before changes.

## Checks and local development

```sh
pnpm --config.verify-deps-before-run=false check
pnpm --config.verify-deps-before-run=false test:reporting
pnpm --config.verify-deps-before-run=false test:browser
pnpm --config.verify-deps-before-run=false test:popup
```

The unit suite uses ephemeral Miniflare D1, real migrations, fictional data,
challenge stubs and verified-context stubs. There is no production authentication
or challenge bypass in either Worker. Browser tests intercept challenge delivery
and exercise import, review, submission, private rendering and review actions.

`pnpm build:reporting` produces the shared browser validator. Wrangler runs this
build automatically. The extension allowlist does not include backend assets.
To run the disabled public form locally:

```sh
pnpm --config.verify-deps-before-run=false exec wrangler dev --config reporting/wrangler.public.jsonc --local
```

Never add `--remote` to local development. Use ephemeral tests for enabled intake.
An ordinary local form does not accept the staging Turnstile hostname; challenge
stubs exist only inside tests. Keep downloaded diagnostic JSON and D1 exports out
of Git. Local state and development secret files are ignored.

## Owner authentication and secret entry

```sh
pnpm --config.verify-deps-before-run=false exec wrangler login
```

Wrangler login, separate Access sign-in and both encrypted secret names were
verified; the owner also confirmed a staging secret rotation on October 29.
If a secret later needs replacement, use Wrangler's secret prompt; never paste
credentials or tokens into chat. Use the existing Free
account; do not enable paid products.

## Staging setup record

The resources and synthetic workflow below were completed. Treat these as a
setup record and recheck account-specific open gates in the current handoff;
do not re-create existing resources.

1. Review both Wrangler configurations. Confirm the staging D1 ID and that
   `INTAKE_ENABLED` is `false`; production bindings must never be substituted.
2. Apply the committed migrations only to staging:

   `pnpm --config.verify-deps-before-run=false exec wrangler d1 migrations apply sns-reporting-staging --remote --config reporting/wrangler.public.jsonc`
3. Deploy the disabled public Worker, then the admin Worker. Use
   `wrangler deploy --config reporting/wrangler.public.jsonc` and the corresponding
   `wrangler.admin.jsonc`. The admin Worker rejects all traffic with blank audience.
4. In the admin Worker's Access tab, protect **all traffic** with Worker-level
   Access, including all domains and previews. In Zero Trust, restrict the allow
   policy to exactly `eni.akinpel@gmail.com`; do not allow the gmail.com domain.
   Select the owner's sign-in method and verify a second identity is denied.
5. Copy that Access application's non-secret audience into `ACCESS_AUD` in the
   admin config and redeploy it. All admin routes check Cloudflare's verified
   `ctx.access`, the audience, and the exact owner email. No identity header is
   trusted. The admin Worker intentionally has no static-assets binding because
   Cloudflare's asset router does not forward this verified context.
6. Add `TURNSTILE_SECRET` using `wrangler secret put TURNSTILE_SECRET --config
   reporting/wrangler.public.jsonc`. Enter it only in Wrangler's secret prompt.
7. Add a fresh random secret of at least 32 bytes as `NETWORK_KEY_SECRET` using
   the same encrypted secret flow. This keys daily scoped HMAC network values;
   they are never stored in reports or application logs.
8. Confirm rate-limit namespace `1001` is unused by other account applications;
   choose another integer if occupied. The binding deters bursts at each Cloudflare
   location; it is approximate. The D1 accepted-report cap is transactional.
9. Verify anonymous requests, forged email/JWT headers, another identity, wrong
   audience, alternate domains, preview URLs, and cross-origin writes are denied
   on every admin surface. Verify the owner can read the inbox.
10. Audit actual Cloudflare logging and recovery settings. Worker observability
    is disabled. Verify provider metadata retention before finalizing public
    disclosures; D1 jurisdiction does not cover all Cloudflare processing.
11. Only after these controls are verified, temporarily enable staging intake
    for a synthetic pilot. Verify real Turnstile host/action, successful persistence,
    retry with a fresh challenge and unchanged submission key, optional contact,
    review, deletion, pause, and cleanup health. Delete synthetic records afterward.
    Do not send load tests to the public service.

## Review and retention

Review twice weekly without a public response-time promise. Reports are claims;
confirm vacancy identity, public source wording, exact citations, scope and timing
before recording a confirmed issue. Keep sponsorship, CPT, OPT and separate
eligibility restrictions distinct. Opening submitted URLs is deliberate and uses
no opener or referrer; the service never fetches source URLs automatically.

An October 30 local in-thread automation, **SNS reporting maintenance**, is active
for Monday/Thursday at 09:00 local app time (currently America/Chicago); Thursday
also includes the weekly provider check. Keep the computer/app running and verify
the schedule after any timezone change. It checks public availability and private
aggregate operational metadata only, escalating risks or missing access without
changing production. It does not review report contents, decide claims or replace
the owner's private inbox review. Its first scheduled run remains unverified;
see the [launch progress record](../docs/REPORTING_LAUNCH_PROGRESS_2026-10-30.md).

The inbox supports new/reviewing/closed states, severity, a closure resolution,
bounded notes, manually confirmed duplicate links, GitHub issue URL and fixed
version. Spam is deleted immediately. Revision checks prevent stale writes.
Duplicate suggestions never merge or delete reports automatically. List pages
contain 25 summaries and exclude diagnostic bodies and contacts.

Expiry is the earlier of first closure plus 90 days or receipt plus 180 days.
Reopening never extends it. The hourly cleanup processes at most 100 records per
run, removes contacts/events through foreign keys, clears duplicate references,
and records success or failure in the private health view. Check health at every
twice-weekly review; investigate missing/stale success or a failure newer than
the last success. Hourly batches provide margin for the daily acceptance cap.
Backlogs require repeated controlled
cleanup runs before declaring deletion complete.

Redaction removes diagnostic content, identity summary, contact and old text notes.
It also records a minimal deletion ledger; cleanup subsequently removes the row.
Delete requires the exact report ID typed into the confirmation field. IDs are
receipts, not public read/delete credentials. Handle manual deletion requests via
support and verify ownership proportionately before acting.

## Pause, failures and capacity

Set `INTAKE_ENABLED` to `false` in the correct public config, review its D1 ID and
origin, then redeploy that public Worker. For production use
`pnpm exec wrangler deploy --config reporting/wrangler.public.production.jsonc`.
After propagation, check `/health` and `/api/config` return `available: false`
with the expected sitekey, and verify the private inbox remains accessible. A
paused POST returns 503. If the deploy cannot be verified, treat intake state as
unknown and keep the reporting link unadvertised. The downloaded report and
support email remain the fallback.

For Turnstile failure, check the public config, widget hostname/action and
challenge outcomes without exposing tokens or secret values; an unavailable
challenge returns 503, a failed challenge 400. For D1 failure, preserve the
user's local draft and investigate D1 availability and private health; the
Worker returns 503 when it cannot save. Do not bypass challenge, validation,
Access or database controls. Re-enable only after the cause is understood, the
binding and public config are checked, and a controlled fictional
submission/retry/read/delete and health check pass. Remove synthetic content and
pause again unless real launch has been approved.

At each twice-weekly inbox review, inspect cleanup success/failure and expiring
count. A stale or failed hourly cleanup calls for an intake pause if expiry can
be missed: fix the cause, run controlled cleanup until the 100-row batches clear
the backlog, and verify report/contact/event removal and private health. Do not
claim deletion complete from one successful run if a backlog remains.

Review account-wide Workers requests/errors/CPU, D1 rows read/written and
storage, Turnstile outcomes, Access denials and active-user capacity weekly,
and more often during incidents or growth. Compare each available metric to the
account's actual Free limits. At 50%, investigate the trend; at 75%, pause
intake and make a disclosed owner decision before resuming. The 100-accepts/day
application cap is abuse protection, not a provider quota. Provider limits can
make requests fail before the application can respond. No eligible usage alert
was available in the recorded account check, so continue manual review; do not
enable billing, logging or new telemetry automatically. If the owner loses
Access or Cloudflare account access, pause intake if an authorized route remains;
otherwise treat both private review and pause state as unavailable, use the
account's established recovery channel, and do not weaken the owner-only policy
or request credentials in chat.

## Recovery and binding switch

The [remote rehearsal](recovery-verification.md) passed on a disposable,
synthetic-only D1. It restored an older bookmark **in place**, replayed a later
deletion, reconciled a newer report, then cleaned expired data. It did not
restore staging or production. Cloudflare Time Travel does not clone a database:
`restore` overwrites its selected target and cancels in-flight queries. The
checked-in rehearsal script is hard-pinned to its now-used disposable target and
must not be rerun blindly. There is no tested production clone/historical
isolated-restore procedure or live data export in this repository.

For a current-state capture during an approved recovery exercise, create a
dedicated outside-repository directory with mode 0700, record its exact absolute
path, and use an owner-held passphrase entered in a private terminal. Confirm the
source config has exactly one D1 binding and independently check its database
name, UUID, jurisdiction, and paused intake before running this command:

Freeze owner/admin review writes and scheduled cleanup for the capture window,
or verify no such write occurred between the chosen recovery point and the
completed export. If any write occurred, repeat the capture before a destructive
restore; otherwise the archive is not the latest authoritative state. Keep the
freeze until the incident reconciliation boundary is recorded. The capture
directory must be outside the repository, including through symlinks.

```sh
node scripts/reporting-recovery-capture.mjs capture reporting/wrangler.public.production.jsonc sns-reporting 6662c8f8-655e-4569-9e71-1be712be9512 /ABSOLUTE/PRIVATE/0700/DIR /ABSOLUTE/PRIVATE/0700/DIR/current.snsd1
```

This reads the full remote D1 schema and data. Wrangler warns that export can
make D1 briefly unavailable; schedule it with intake paused. The script checks
the configured and remote UUID, streams export SQL through a private FIFO into
AES-256-GCM, suppresses Wrangler logs containing its temporary signed URL, and
never stores plaintext SQL. It refuses an existing archive. Keep the passphrase
separate from the archive; losing it makes the archive unrecoverable. Record the
source UUID and capture time in the restricted incident record. The archive
does not itself prove which historical point it represents.

To examine or import an archive, first verify that the **destination is a mounted,
encrypted volume** with a mode-0700 operator directory. FileVault was off on
the checked Mac on October 30, so an ordinary directory there is not suitable
for decrypted reporting data. Decrypt only to that encrypted volume:

```sh
node scripts/reporting-recovery-capture.mjs decrypt /ABSOLUTE/PRIVATE/0700/DIR/current.snsd1 /ENCRYPTED/VOLUME/PRIVATE/0700/DIR/current.sql 6662c8f8-655e-4569-9e71-1be712be9512 --encrypted-volume-confirmed
```

The flag records an operator assertion; the command cannot detect encryption.
The output directory must be mode 0700 and outside the repository.
Wrong passphrase, wrong source UUID, or tampering publishes no SQL. The target
file must not exist. Keep the decrypted file restricted and delete it after
verification, including after a failed import; deletion is not secure erasure.
Use a separate, explicitly named/configured D1 target. Before import, verify its
remote name, UUID, jurisdiction, and that `sqlite_master` has no user tables or
reporting rows. Never point an import at the source or an existing disposable
database. Only then import the full SQL with `wrangler d1 execute TARGET --remote
--file /ENCRYPTED/VOLUME/PRIVATE/0700/DIR/current.sql --config TARGET_CONFIG`
and compare tables, row counts, IDs, ledger, contacts, events, counters, and
health to the source privately. The imported database remains isolated; this
command does not deploy a Worker or switch bindings.

If an older snapshot is restored in a separate approved recovery path, use the
latest capture to reconcile before exposing a recovered inbox: apply every
unexpired deletion-ledger ID, remove reports already expired under their original
deadlines, preserve post-snapshot reports and contacts, and apply later review
revisions/events exactly once. Check ID/submission-key conflicts manually.
Restoring report rows fires acceptance triggers; replace/reconcile each UTC day's
counter with the authoritative latest accepted total, including accepts later
deleted, rather than counting surviving reports. Verify contact/event cascades,
duplicate links, ledger expiry, cleanup health, and report/acceptance counts
against the latest capture. The local tests cover these invariants with fictional
data; they do not automate a production merge or authorize a Time Travel restore.

1. Pause and verify the correct public Worker as above. Keep admin access
   restricted and avoid review writes during recovery. Record the incident time,
   selected database name/UUID/jurisdiction, both Workers' current D1 bindings,
   migration state and deployment versions. Verify the intended Time Travel
   bookmark lies in the actual recovery window. Never target a database from a
   similar name alone.
2. Before any destructive restore, arrange secure preservation of the **current**
   deletion ledger and every record newer than the recovery point, including
   reports, separate contacts, review events and current acceptance counters.
   This requires an owner-approved private capture method with restricted access,
   encryption and a retention/deletion plan. Do not print or place report bodies,
   contacts, tokens, bookmarks or exports in Git, chat or ordinary logs. No such
   capture or production restore has been executed here.
3. Use a separately controlled recovery database only if an actual provider
   export/import or equivalent method has been validated for this schema and
   target. Time Travel alone cannot populate that target from a different
   database's history. If isolation cannot be established, keep intake paused and
   obtain an explicit incident decision before an in-place restore of the live
   database. Do not treat the disposable rehearsal as that authorization.
4. Before exposing recovered data, reconcile the preserved ledger: purge every
   restored report listed there, including reports later deleted or redacted;
   remove anything already expired under its original receipt/first-closure
   deadline. Verify contacts and events cascade and duplicate links clear.
   Reconcile newer reports, contacts and review events exactly once, preserving
   submission keys, revisions and review state. Reconcile acceptance counters
   by UTC day, including accepted reports subsequently deleted; they are not
   simply the count of surviving rows. Check ledger expiry and the cleanup
   cutoff before pruning ledger or counters. Resolve ID/key conflicts explicitly;
   never overwrite a newer record silently.
5. Compare source and candidate counts/IDs, expiry, ledger, counters and cleanup
   health privately. Run bounded cleanup until no overdue report remains, then
   verify a fictional create/retry/read/delete flow and absence of synthetic
   content. Review both public/admin bindings, Access audience and cron config
   before switching them together to a validated candidate. Keep the old target
   restricted for the approved recovery period. Recheck remote health and inbox
   after propagation; enable real intake only with launch/incident approval.
   If validation fails, keep intake paused. Reverse a binding switch only while
   no new writes occurred; otherwise reconcile those writes first.

Provider recovery/security copies may retain deleted content temporarily; do
not promise immediate erasure from them.

## Production and extension launch gate

Independent production resources, owner-only Access, and the fictional
production workflow are complete. Real launch is still gated by provider
retention/capacity findings, final disclosures, extension integration, human
accessibility review and explicit owner approval. See the
[current handoff](../docs/REPORTING_HANDOFF_2026-10-29.md) for exact status and
resource IDs.

Then integrate the fixed production reporting URL into the extension with no URL
parameters, opener or referrer, keeping download and open-form actions separate.
Update extension help/privacy, public support/privacy and Store disclosures to
describe optional collection accurately. These live claims and links are held
until production is verified. Run all browser suites and extracted-package
`pnpm release:verify`, inspect the exact package for secrets/backend code, and
complete human keyboard/screen-reader review before enabling real intake. The
recorded production pilot and disposable recovery rehearsal need not be repeated
just to complete documentation; any new recovery target or method needs its own
validation. No Store submission is authorized by this runbook.

Platform references: [Access and verified identity](https://developers.cloudflare.com/workers/configuration/cloudflare-access/),
[rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/),
[Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
