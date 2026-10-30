# Reporting rollout handoff — October 29, 2026

October 30 local release preparation and candidate verification are recorded in
[the execution record](REPORTING_EXECUTION_2026-10-30.md). Extension integration
and disclosure drafts are prepared and automated checks passed. They are not
published, and real production intake remains paused.

## Start here

The reporting backend is implemented. Staging passed a real fictional workflow.
Separate production infrastructure exists. The October 29 owner-run fictional
production workflow passed Turnstile, submission, same-receipt retry, optional
contact, private review, and deletion. Owner-supplied private service health also
records successful cleanup with no recorded failure or expiring reports.
Owner also confirmed production D1 totals of 0 reports, 0 contacts, 0 review
events, and 1 deletion-ledger entry after the pilot. **Production workflow
verification passed; real reporting is not launched.**

Both checked-in public configurations have `INTAKE_ENABLED: "false"`.
The last remote production health check returned `{"available":false}` after
the diagnostic window. Do not enable real intake or publish the reporting link
without finishing the gates below and receiving explicit launch approval.

This is a checkpoint from recorded work, not a fresh cloud audit. Prefer this
dated checkpoint over stale pending/completed wording in older checklists.

## What each component does

- **Public form:** lets someone import a diagnostic locally or enter a manual
  correction, review it, and explicitly submit it. Selecting a file does not upload it.
- **Public Worker:** validates submissions, verifies Turnstile, limits abuse,
  prevents duplicate retries, and writes accepted reports to the database.
- **Turnstile:** Cloudflare's visitor verification. The public sitekey identifies
  the widget; its private secret is used only by the backend to verify responses.
- **D1:** the private SQL database for reports, separate optional contacts,
  review events, acceptance counters, deletion ledger, and cleanup health.
- **Admin Worker/private inbox:** lets the owner review, update, redact, and
  delete reports. It also runs hourly retention cleanup.
- **Access:** the sign-in gate protecting every admin URL. The Worker additionally
  checks the verified audience and exact owner email; forged headers do not suffice.
- **Wrangler:** the authenticated command-line tool used to configure/deploy
  Workers, apply database migrations, and enter encrypted secrets privately.

## Completed implementation

- Bounded shared report schema and format-2 diagnostic export; legacy format-1
  imports remain supported. Posting/citation URLs are sanitized; personal form
  answers and full page extraction are not exported automatically.
- Public manual/import/review flow, optional contact, explicit acknowledgement,
  receipt display after acceptance, and in-memory draft preservation on failure.
- Origin/content-type/body-size/schema checks, real Turnstile hostname/action
  verification, daily cap, temporary network-based burst control, atomic writes,
  and idempotent retry handling.
- Private paginated inbox, contact separation, review revisions, duplicate links,
  redaction/deletion, expiry cleanup, cleanup health, and a 14-day deletion ledger.
- Dynamic `/api/config`: the form uses its environment's public widget key,
  rather than a hardcoded staging key. Paused, missing-key, and configuration-error
  states disable submission while allowing local draft preparation.
- Separate staging/production configurations, databases, widget keys, origins,
  Access audiences, and rate-limit namespaces. Previews and Workers observability
  are disabled in the configurations. No backend assets are added to the extension ZIP.

## Resource map — identifiers below are not secrets

| Resource | Staging | Production |
| --- | --- | --- |
| Public Worker | `sns-report-staging` | `sns-report` |
| Admin Worker | `sns-report-admin-staging` | `sns-report-admin` |
| D1 name | `sns-reporting-staging` | `sns-reporting` |
| D1 ID | `a4a48c1c-be4b-4aa2-9955-fc5c650f3ddb` | `6662c8f8-655e-4569-9e71-1be712be9512` |
| D1 jurisdiction | `us` | `us` |
| Turnstile sitekey | `0x4AAAAAAFoOBa5dWOLh2Knr` | `0x4AAAAAAFregK469f_n6UmO` |
| Rate-limit namespace | `1001` | `1002` |

Public URLs:

- Staging form: https://sns-report-staging.sponsor-not-sponsor.workers.dev/
- Staging inbox: https://sns-report-admin-staging.sponsor-not-sponsor.workers.dev/
- Production form: https://sns-report.sponsor-not-sponsor.workers.dev/
- Production inbox: https://sns-report-admin.sponsor-not-sponsor.workers.dev/

Production Access application: `f063fdbf-24ff-46e0-8d89-5c0dfd96876b`.
Production audience: `854db58a505e07a88b15522fe23bc611fe61cf122055f3a1693da89a61d129f7`.
It covers **all traffic, production and previews**, and reuses the exact-email
policy named `SNS staging owner only`. The name is historical: the policy is now
shared by both applications. Changing that reusable policy can affect both.
Only `eni.akinpel@gmail.com` is allowed; there is no gmail.com-wide allowance.

Both production secret names, `NETWORK_KEY_SECRET` and `TURNSTILE_SECRET`, were
verified installed without reading their values. The network secret was generated
independently and uploaded without printing or saving it locally. Secret presence
alone does not prove the Turnstile secret matches the production widget; the later
successful real-challenge production submission verified that pairing.

Earlier recorded disabled production public version:
`1c37084b-a4af-42ed-8a24-805758fc16b9`.
The successful enabled pilot used version `0df4176c-8358-4c56-a137-699eac589136`.
The owner subsequently deployed the paused configuration. An October 30
read-only deployment-list check identified the latest production version as
`10f5c807-2734-41bc-9a15-3132ee83c322`, deployed at
`2026-10-29T22:02:57.65548Z` with 100% traffic. Agent GET checks verified both
`/health` and `/api/config` returned `available: false` afterward, including a
fresh October 30 check with the expected production public sitekey.
Production admin version: `afe45a28-c80c-49c1-94f1-59509d4a0da3`.
Latest recorded staging public version: `9f544753-1ad8-44e3-8302-5e5709f00519`.

## Verification completed

### Staging

- Real Turnstile submission, persistence, same-receipt retry, separate optional
  contact, private review, deletion, paused intake, and scheduled cleanup passed.
- Report/contact/event tables were empty after the fictional pilot cleanup.
- Owner reported successful sign-in and successful second-user denial.
- Anonymous/forged-header, alternate/encoded/trailing/double-slash admin routes
  stayed behind Access; tested preview URLs returned 404. See route evidence.
- A staging secret exposure during an earlier dashboard audit was treated as
  compromised. The owner confirmed rotation and replacement upload October 29.
  Do not retrieve or copy old values; no secret belongs in this handoff.

### Production

- Separate U.S. D1 created; both real migrations applied successfully.
- Both Workers deployed; public intake paused; admin hourly cleanup configured.
- Owner approved and agent applied all-traffic owner-only Access and its audience.
- Twelve anonymous/forged-identity GET/POST route probes redirected to Access.
- Owner confirmed sign-in and second-user denial, explicitly confirming the
  production URL **without `-staging`**. These are owner-reported checks.
- Authenticated production inbox also loaded during the agent's pilot attempt.
- During the later October 29 owner-run pilot, the Managed widget displayed
  Cloudflare's Success state and a fictional `example.com` report was accepted.
  The owner confirmed an unchanged retry returned the same receipt.
- Owner confirmed the private inbox showed the report and separate optional
  contact `test@example.com`. Pasted inbox output showed the stored synthetic
  payload, initial receipt event, and two authenticated review events updating
  status to `reviewing` and severity to `low`; both saved notes were empty.
- Owner confirmed deletion succeeded after an initial exact-ID confirmation
  rejection. Owner then ran the read-only aggregate query in the production
  `sns-reporting` D1 console and confirmed 0 reports, 0 report_contacts,
  0 report_events, and 1 deletion_ledger entry. These are owner-reported database
  checks, not an independent agent query or inspection of ledger contents.
- Production intake was returned to false locally and redeployed by the owner.
  Agent remote GET checks then confirmed `/health` returned `{"available":false}`
  and `/api/config` returned the same availability with the expected sitekey.
  Owner subsequently supplied private service health showing cleanup succeeded
  at `2026-10-29T22:17:28.492Z` (5:17 p.m. America/Chicago), `failed_at: null`,
  `deleted_count: 0`, and `expiring.count: 0`. This verifies recorded cleanup
  health; zero deletions are consistent with the earlier manual deletion. The
  returned `counts: []` does not establish report/contact/event table totals.

### Recovery and automated checks

- Local recovery tests use real migrations and check deletion-ledger replay,
  expiry, cascades, duplicate clearing, and cleanup failure recording.
- A real remote Time Travel rehearsal passed on a disposable synthetic-only D1:
  `sns-reporting-recovery-20261029`, ID `e8b49205-75de-421b-85a1-99532adb1a40`.
  It restored an older bookmark, replayed later deletions, reconciled a newer
  record, and removed expired content. No staging/production database was restored.
  The disposable database remains for review; do not rerun its script blindly.
- Remote cleanup mirrored the application SQL; local tests cover application
  batch atomicity/failure behavior. This does not prove every recovery point works.
- Last full project check passed both typechecks, **223 tests**, and extension build.
  Reporting browser tests passed the dynamic configuration and paused/error cases.
- The prior download-only release package passed all seven extracted-package
  checks. Those checks must be repeated after integration/disclosure changes.

## Earlier Turnstile rendering failure and successful retest

Two temporary production test windows were used with owner approval. The first
prepared only fictional `example.com` data. The form blocked submission with
“Complete the verification challenge before submitting.” No challenge widget
was visible; there was no accepted report or receipt.

The initial attempt to inspect console logs was blocked by the safety reviewer
because logs could expose tokens/session material. The owner later explicitly
approved error-log inspection. A fresh tab reproduced the symptom; captured
warning/error logs were empty. No tokens or session values were displayed.

Observed DOM geometry: `#turnstile` was visible, `display: block`, with one DIV
child but **zero height**. No closed-shadow contents or token values were read.
The safe Cloudflare widget inventory confirms `SNS production` is **Managed**
and has one hostname. It did not display that hostname. The cause is **not yet
established**; do not claim a bad secret, browser restriction, or code defect as fact.

During the later guided retest, the owner confirmed the widget's allowed hostname
is exactly:

`sns-report.sponsor-not-sponsor.workers.dev`

The owner also listed both installed production secret names without exposing
their values. No key replacement or Turnstile rendering-code change was made
during this retest. Do not ask the owner to share the secret.
Avoid inspecting an existing Turnstile secret page: it previously exposed a key.

Both windows ended with intake disabled. After the first attempt, aggregate D1
checks showed **0 reports, 0 contacts, 0 events**. No submission was attempted in
the second diagnostic window. The last health check confirmed intake false.
No deletion was required in those earlier windows.

In the subsequent owner-run window, intake was enabled and the widget rendered
successfully. Submission, same-receipt retry, separate contact, private review,
and deletion passed as recorded above. The earlier zero-height symptom was not
reproduced; its cause remains unestablished. Paused intake intentionally skips
loading the widget, but that does not establish the cause of the earlier failures
during enabled windows. Final remote health/config checks confirmed intake false.
No real launch was approved. Scheduled cleanup health was subsequently confirmed
from owner-supplied private inbox output. Aggregate database cleanup verification
passed through the owner's production D1 console count check: 0 reports,
0 contacts, 0 review events, and 1 deletion-ledger entry.

## Provider/account findings and open limits

- Dashboard confirmed Workers Free as the current plan; a point-in-time check
  showed 21/100,000 daily requests and 0/200,000 observability events.
- Usage-based billing alert setup reported no eligible products on this account.
  No alerts, upgrades, or paid products were enabled. Retain manual usage review.
- Disabled Workers Logs/Traces do not mean Cloudflare retains no Access, security,
  analytics, audit, recovery, or operational metadata.
- Published Free D1 Time Travel retention is seven days; the deletion ledger is
  14 days. A restore overwrites its selected database in place. Never rehearse an
  in-place restore on live staging/production merely to finish a checklist.
- Rate limiting is approximate/per-location, not a strict global quota. Its
  counting window is not proof of counter-key retention. Provider metadata
  retention and account-specific capacity/alerts remain disclosure/operations gates.

## Approved operating decisions — do not re-ask unnecessarily

- U.S. launch scope; public support/owner contact `eni.akinpel@gmail.com`.
- 100 accepted reports per UTC day; 5 attempts/minute per temporary network source;
  256 KiB maximum import/request size.
- Optional email stored separately; no automatic emails.
- Expiry: earlier of 180 days from receipt or 90 days after closure, followed by
  scheduled deletion; reopening does not extend retention.
- Review twice weekly, without a promised public response time.
- Owner approved the fictional production workflow and cleanup, not real launch.
  Follow applicable action-time confirmation requirements if repeating sensitive
  browser actions. Disable intake on failures or before a human handoff.

## Remaining work, in order

Production submission, same-receipt retry, separate contact, private review,
deletion, aggregate cleanup counts, recorded cleanup health, and final remote
pause checks passed. Browser/database actions were owner-run; agent checks
independently verified public health/config availability. Do not repeat the
production pilot merely to finish documentation.

1. Finish provider retention/logging/capacity verification and recovery procedures.
   Keep disclosures honest where provider guarantees are not documented.
2. Review the October 30 local extension link and coordinated disclosure/Store
   drafts. Local Download report remains available; the fixed form link adds no
   job data, query parameters, automatic attachment/upload, or new permissions.
   Publish revised disclosures before or alongside exposing the link.
3. Finish final wording/data-use review, account-only provider checks, and the
   production recovery-method validation documented in the operations runbook.
4. Complete human keyboard/screen-reader review and select the final upload
   version. Automated project/browser/package/public-site checks passed for the
   candidate archive/hash in the execution record; rerun affected checks if it changes.
5. Obtain explicit launch approval, then enable real intake and verify it.

Deferred until the full end-to-end flow works: a separate successful-submission
closeout page and general public-form/private-inbox UI improvements. These were
requested for later; do not silently turn the blocker investigation into a redesign.

## Resume safely: files, commands, and evidence

Read repository `AGENTS.md` and `HANDOFF.md` first. Read `DECISION_LOGIC.md` before
any sponsorship-logic change. Preserve unrelated dirty files; no commit, push,
Store publication, or live launch was performed in this rollout work.

Key implementation: `reporting/public.ts`, `reporting/public/app.js`,
`reporting/public/index.html`, `reporting/admin.ts`, `reporting/admin-ui.ts`,
`reporting/migrations/`, `shared/report-schema.ts`, and `src/report.ts`.

Configs: `reporting/wrangler.public.jsonc`, `reporting/wrangler.admin.jsonc`,
`reporting/wrangler.public.production.jsonc`,
`reporting/wrangler.admin.production.jsonc`. Do not swap database bindings or
copy the staging audience/key into production.

Run from the repository root:

```sh
pnpm check
pnpm test:reporting
pnpm test:browser
pnpm test:popup
pnpm release:verify
node release/public-site/validate.mjs --release
git diff --check
```

Safe production pause deployment (checked-in intake must remain false):

```sh
pnpm exec wrangler deploy --config reporting/wrangler.public.production.jsonc
```

Verify remote health after deployment propagation, not merely command success.
Secret **names** can be checked with `wrangler secret list`; never request values.
Secret replacement, only if actually necessary, must use the owner's private
Wrangler prompt, not chat, command arguments, screenshots, or repository files.

Supporting records:

- [Detailed setup history](CLOUDFLARE_SETUP_HANDOFF.md)
- [Launch checklist and exact disclosure surfaces](REPORTING_LAUNCH_READINESS.md)
- [Operations and recovery runbook](../reporting/README.md)
- [Route verification](../reporting/route-verification.md)
- [Provider facts and unresolved retention questions](../reporting/provider-verification.md)
- [Remote recovery evidence](../reporting/recovery-verification.md)

Screenshots previously saved under `/tmp` are temporary evidence, not durable
project artifacts. The handoff records their findings without depending on them.
