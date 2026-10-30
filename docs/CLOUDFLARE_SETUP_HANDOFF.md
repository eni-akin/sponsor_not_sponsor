# Cloudflare reporting setup handoff

Updated: October 30, 2026 (America/Chicago)

For the consolidated current checkpoint, blocker, and next steps, start with
[Reporting handoff — October 29](REPORTING_HANDOFF_2026-10-29.md).

## Goal

Build the private incorrect-result reporting system described in
`docs/CLOUDFLARE_REPORTING_PLAN.md`. Staging and production are deployed with
public intake disabled. The fictional workflows passed; real intake remains
disabled pending provider/disclosure, release, accessibility, and approval gates.

## Completed account setup

- Cloudflare account created and email verified.
- Two-factor authentication enabled; backup codes saved privately.
- Administrator email: `eni.akinpel@gmail.com`
- Public support email: `eni.akinpel@gmail.com`
- Workers subdomain: `sponsor-not-sponsor.workers.dev`
- Zero Trust team name: `sponsor-not-sponsor`
- Zero Trust plan: Free
- Staging D1 database created: `sns-reporting-staging`
- Staging D1 jurisdiction: United States
- Staging Turnstile widget created: `sns-report-staging`
- Turnstile mode: Managed
- Authorized Turnstile hostname:
  `sns-report-staging.sponsor-not-sponsor.workers.dev`
- Turnstile sitekey saved.
- Turnstile secret key saved privately.

## Approved operating decisions

- Current launch scope: United States; multiple countries are a future goal.
- Retention: delete at the earlier of 90 days after closure or 180 days after
  receipt.
- Daily acceptance cap: 100 new reports per UTC day.
- Short-term limit: 5 submission attempts per minute from the same temporary
  network source.
- Maximum imported file and submission request: 256 KiB.
- Optional reporter email: included, stored separately, and never emailed
  automatically.
- Review cadence: twice per week, with no public response-time promise.

## Approved service names

| Environment | Public Worker | Admin Worker | Database |
| --- | --- | --- | --- |
| Staging | `sns-report-staging` | `sns-report-admin-staging` | `sns-reporting-staging` |
| Production | `sns-report` | `sns-report-admin` | `sns-reporting` |

## Recorded safe configuration values

These identifiers are not secrets:

```text
Staging D1 database ID: a4a48c1c-be4b-4aa2-9955-fc5c650f3ddb
Staging Turnstile sitekey: 0x4AAAAAAFoOBa5dWOLh2Knr
```

Do not put the Turnstile secret key, API tokens, passwords, recovery codes, or
private report data in this file, chat, Git, screenshots, or example config.

## Current action after October 29 verification

The owner-run fictional production workflow passed the real Turnstile challenge,
submission, unchanged same-receipt retry, separate optional contact, private
review, and deletion. The owner reported 0 reports, contacts, and review events,
plus 1 deletion-ledger entry in production D1 afterward. Owner-supplied private
health showed successful cleanup with no failure or expiring reports. Agent
remote GET checks verified `/health` and `/api/config` returned
`available: false` after the owner redeployed the paused configuration. Production owner
sign-in and second-user denial were owner-confirmed; anonymous/forged-identity
route checks were agent-run. This is recorded evidence, not a fresh cloud audit.

An October 30 read-only agent check found production public version
`10f5c807-2734-41bc-9a15-3132ee83c322` at 100% deployment, created October 29
at 22:02:57 UTC. A fresh agent GET check again found `/health` and `/api/config`
paused with the expected production sitekey. Read-only D1 metadata confirmed
production ID `6662c8f8-655e-4569-9e71-1be712be9512`, U.S. jurisdiction,
disabled read replication, 102,400-byte size, and seven tables. Its 24-hour
query/row counters are rolling-window metrics, not UTC-day quotas; see
[provider verification](../reporting/provider-verification.md).

Finish provider account/retention/capacity verification, recovery-runbook owner
review, reporting-link and disclosure integration, exact-package and public-site
checks, human accessibility review, and explicit launch approval. Do not repeat
the fictional pilot solely to close documentation. See the
[launch checklist](REPORTING_LAUNCH_READINESS.md) and
[latest handoff](REPORTING_HANDOFF_2026-10-29.md).

## Earlier production preparation and diagnostic history — October 29

Production preparation on October 29: created independent U.S. D1 `sns-reporting`
(`6662c8f8-655e-4569-9e71-1be712be9512`), applied both migrations, and deployed
`sns-report` and `sns-report-admin` using the new `*.production.jsonc` configs.
The public widget sitekey is `0x4AAAAAAFregK469f_n6UmO`; rate-limit namespace
is `1002`, separate from staging. A fresh 32-byte `NETWORK_KEY_SECRET` was
generated and uploaded without displaying or saving its value.

At this preparation checkpoint, intake remained false and the admin audience
was configured separately through production Access. Public config and paused
submissions were verified remotely; sampled admin root/API/assets requests with
a forged owner header initially returned 403 before Access setup. Admin hourly
cleanup was scheduled. Both production secret names were verified installed
without reading values. The owner/second-user checks and fictional workflow
listed as pending at this point were completed later on October 29.

Historical owner-only secret-entry command from the repository root (already
completed; do not rerun for this handoff):

```sh
pnpm exec wrangler secret put TURNSTILE_SECRET --config reporting/wrangler.public.production.jsonc
```

Use only the production widget's secret in Wrangler's hidden prompt. Never send
it through chat. The initial public deployment version was
`008a24cb-8ca0-485b-8124-d367539cff70` (secret updates create later versions);
admin version after audience binding `afe45a28-c80c-49c1-94f1-59509d4a0da3`.

Production Access was applied with owner approval for all traffic, including
previews. It reuses the existing exact-email reusable policy named `SNS staging
owner only` (no broad domain/account allowance). The separate production Access
application ID is `f063fdbf-24ff-46e0-8d89-5c0dfd96876b`; audience
`854db58a505e07a88b15522fe23bc611fe61cf122055f3a1693da89a61d129f7` is bound in
the production admin config. Twelve anonymous/forged-identity GET/POST requests
to root, API, assets, and alternate paths returned 302 to the expected Access
hostname. Production health still reports `available: false`. Owner sign-in and
second-user denial against this production application were subsequently
confirmed by the owner, who explicitly confirmed the production URL without
`-staging`. This is owner-reported evidence.

### Production pilot attempt — October 29

The owner approved a temporary fictional submission/retry/review/deletion pilot.
Intake was temporarily enabled, and the authenticated production inbox loaded.
The public form retained fictional `example.com` fields and blocked submission
with “Complete the verification challenge before submitting.” No Turnstile
widget was visible in the tested Chrome page. The cause is not yet established.
Browser console inspection was blocked by the safety reviewer because logs may
expose tokens/session data; no logs were read and that restriction was not bypassed.

Intake was restored to false immediately, public version
`c92cb8d1-388d-4359-a7fa-c116c2f0f96d`. Aggregate remote database checks confirmed
zero reports, contacts, and events; no deletion was necessary. This first
production pilot attempt did not pass. The later owner-run pilot did pass; see
the current checkpoint above. The first attempt's rendering cause remains unknown.

Follow-up diagnostic window: the owner authorized browser error inspection.
The old tab had closed; a fresh enabled page reproduced the missing widget.
Captured warning/error logs were empty (no values printed). DOM-only geometry
inspection showed a visible `#turnstile` container with one DIV child and zero
height; no challenge/session values or closed-shadow contents were accessed.
The safe Turnstile inventory page confirms production uses Managed mode and one
hostname, but the exact hostname was not displayed in that list. No cause is
established yet. No report was submitted. Intake was restored disabled in public
version `1c37084b-a4af-42ed-8a24-805758fc16b9`.

On October 29 the owner confirmed that the exposed staging Turnstile secret was
rotated and its replacement uploaded through Wrangler. This resolves the
credential follow-up on owner-reported evidence; no secret value was requested
or recorded. Intake remains disabled for the remaining verification gates.

At this staging checkpoint, owner sign-in, both encrypted secret names, and the
first real Turnstile submission/private review/deletion pilot were verified.
Staging route checks and remote recovery passed later; provider settings remain
open. Intake remains disabled in both environments.

### October 29 continuation

- Owner confirmed staging Turnstile rotation/upload; no replacement value was read.
- Additional anonymous/forged-header encoded, trailing-slash, and double-slash
  admin route checks passed; current preview hosts returned 404. See
  [route evidence](../reporting/route-verification.md).
- Workers Free and current low account usage were checked in the dashboard.
  Usage-based billing alerts reported no eligible products; none were created.
  See [provider evidence](../reporting/provider-verification.md).
- Removed the form's hardcoded staging widget key. Public configuration now
  comes from `/api/config`; paused/config-failure/missing-key states keep submit
  disabled while allowing local draft preparation. Typechecks, 223 tests,
  extension build, and reporting browser checks passed.
- Deployed that change to staging with intake still false, version
  `9f544753-1ad8-44e3-8302-5e5709f00519`. A real enabled-widget check remains separate.
- Created isolated synthetic-only recovery database
  `sns-reporting-recovery-20261029`, ID `e8b49205-75de-421b-85a1-99532adb1a40`,
  U.S. jurisdiction. It is not bound to a public or admin Worker. Remote recovery
  rehearsal results are tracked separately. The subsequent remote drill passed;
  see the latest handoff and [recovery evidence](../reporting/recovery-verification.md).

## Staging checkpoint — October 28

- Wrangler OAuth login verified as `eni.akinpel@gmail.com` in the expected account.
- D1 ID and United States jurisdiction verified; both migrations applied remotely.
- Public Worker deployed: https://sns-report-staging.sponsor-not-sponsor.workers.dev
- Admin Worker deployed: https://sns-report-admin-staging.sponsor-not-sponsor.workers.dev
- Public current disabled deployment version: `b4fb450b-042d-4181-8b19-694e56e9305c`.
- Admin current deployment version: `ef3fa544-f5c1-4b52-99d2-0c8ac4035324`.
- Fresh random 32-byte `NETWORK_KEY_SECRET` sent directly to Cloudflare encrypted
  secret storage without printing or saving the value. Secret-name listing confirmed it.
- Owner approved saving and applying `SNS staging owner only` to all admin Worker
  traffic, including previews. Policy matches exactly `eni.akinpel@gmail.com`.
- Access application ID: `47fd3da9-010d-47bd-9f32-6e7dce6c450a`.
- Reusable policy ID: `5e935524-0bfe-4a89-bef0-41affc99d84f`.
- Audience recorded in admin config:
  `1f0ebfb0a3ebc535052f91ebecfb82e5ede050474ba4c3be96cfad42cd0f5409`.
- Public form responds 200 with CSP, no-referrer, nosniff and permission restrictions.
- Health returns `available:false`; submission POST returns 503.
- Admin returned 403 before Access setup. After Access setup/redeployment, anonymous
  API and forged email/JWT-header requests redirect to Access sign-in (302).
- Database report count is zero. Hourly cleanup schedule is deployed.
- Owner completed Access sign-in and uploaded `TURNSTILE_SECRET`. Secret-name
  listing confirmed both encrypted secrets without retrieving their values.
- Authenticated inbox, list, detail/contact, review update and health view verified.
- Owner explicitly approved a single fictional report, its unchanged retry,
  temporary enabled intake and permanent deletion of only that disposable report.
- Real Turnstile passed; report `6b6d2077-b1be-4e18-aa7d-9cabf0fa71c2` was accepted
  at `2026-10-28T21:14:47.173Z`. The unchanged retry returned the same receipt;
  D1 had one report and an acceptance count of one.
- The fictional optional contact was stored separately. Review closed the report
  with `expected-behavior`, revision 1, an authenticated owner event, and expiry
  `2027-01-26T21:15:44.906Z` (90 days after closure).
- The owner-approved synthetic report was deleted through the inbox at
  `2026-10-28T21:16:01.704Z`. Direct D1 checks confirmed zero reports, contacts and
  events afterward. Only the random-ID deletion ledger (expires November 11) and
  non-content daily acceptance count remain; temporary provider recovery copies
  may still contain the synthetic data.
- Intake was returned to disabled immediately after submission/retry, before review.
  Final health returns `available:false`, and POST returns 503.
- First deployed cleanup run succeeded at `2026-10-28T21:17:28.060Z`
  (4:17 p.m. America/Chicago), with no recorded failure and zero expired rows.
  The authenticated private health view displayed that success and an empty inbox.
- Provider logging/recovery and remaining route verification remain staging gates.

## Owner verification — October 29

- Owner reports that a second signed-in user was denied access and unauthorized
  users could not gain access to the staging inbox. Mark second-user denial
  complete on this owner-reported evidence; this was not an additional agent-run
  identity test and does not claim exhaustive per-route or production verification.

## Local implementation completed

- Strict 256 KiB submission contract and sanitized posting URLs.
- Staging public Worker configuration with intake disabled.
- Public intake handler with origin/content-type checks, Turnstile verification,
  retry identity, private contact separation, and atomic daily-cap enforcement.
- D1 migration for reports, contacts, events, counters, expiry, and inbox indexes.
- Public form with local format-1/format-2 import, editable review,
  explicit submission, private receipt, and no draft persistence.
- Shared browser/server validation for bounded findings, citations, coverage,
  timestamps, warnings, optional contact, and privacy notice acknowledgement.
- Daily scoped keyed network limiter (5 attempts/minute per Cloudflare location).
- Private inbox with verified Access-context audience and exact owner allowlist;
  anonymous, wrong-audience, and wrong-owner requests fail closed.
- Paginated summaries, private detail/contact, status, resolution, severity, notes,
  duplicate suggestions/manual grouping, GitHub issue and fixed-version tracking.
- Transactional revision guards, CSRF/origin checks, no-store responses and safe
  plain-text rendering of untrusted reports.
- Confirmed deletion/redaction, cascade removal, duplicate-reference clearing,
  hourly bounded retention cleanup, private health and minimal recovery ledger.
- Pinned Wrangler/Miniflare tooling, isolated Worker typecheck and local operations
  and recovery runbook. Public/admin Wrangler dry-run bundles passed.
- Unit/contract tests and real local D1 checks cover concurrent retries/caps,
  rollback, simultaneous review edits, redaction, cascades and cleanup failure.
  Browser checks cover import, draft preservation, explicit submission, receipts,
  private rendering and review actions. Real Access/Turnstile and human assistive
  technology verification remain staging/owner gates.
- Final verification: 221 unit/integration tests, extension and Worker typechecks,
  production extension build, reporting browser flow, and all five extension
  browser suites passed. The extension smoke check timed out once at the
  multiple-role transition and passed on rerun. The separate actual-toolbar
  popup check could not complete: Chromium reported no active browser window.
  Packaged-release verification and human accessibility review remain launch gates.

## Remaining after owner sign-in

### Historical parallel verification plan — October 28

Owner requested GPT-5.6 subagents with medium reasoning; three scoped agents are
assigned, with the primary agent reviewing their evidence and integrating results:

| Workstream | Agent scope | Completion evidence |
| --- | --- | --- |
| Access verification | Read-only deployed route/preview and forged-header checks; inspect authentication code | Verified surfaces and results, with real second-identity testing kept separate |
| Recovery rehearsal | Isolated local database restore/expiry/deletion-ledger tests using real migrations | Passing automated recovery tests; report any bug before changing shared code |
| Launch readiness | Inspect extension, disclosures, package boundaries and account-setting gaps | Concrete remaining checklist and proposed integration/disclosure changes |
| Primary integration | Review agent changes, run combined checks and extracted-package tests, reconcile this handoff | Evidence-backed checkpoint and exact remaining owner actions |

Intake stays disabled. Agents do not deploy, read secrets, create production
resources or change Access. Deployed recovery, production resources, final
reporting links/disclosures and human accessibility review follow the remaining
gates below. The success page and general UI polish remain deferred.

Results reviewed by the primary agent:

- Access agent: current standard admin routes, forged identity headers, alternate
  methods and hostile-origin writes require Access; hostile CORS preflight is
  denied. The tested current-version preview hostname is unavailable (404).
  These agent probes were separate from the owner's October 29 second-user denial
  confirmation; the primary subsequently checked the current domain inventory.
- Recovery agent: `tests/reporting-recovery.test.ts` passed with isolated local
  D1 databases and real migrations, including snapshot restore, reapplication of
  the current deletion ledger, expiry, cascades, duplicate-reference clearing and
  recorded cleanup failure. Cloudflare's remote restore tooling was untested at
  this checkpoint; the later isolated remote rehearsal passed.
- Primary: actual toolbar popup passed at 400 px with no horizontal overflow before
  and after onboarding. All seven extracted-package checks passed for the current
  1.0.1 archive; `release/validation.json` records its hash. Regenerated fixture
  screenshots and validation remain local; nothing was published.
- Combined verification: 222 tests, typechecks, builds and reporting browser
  checks passed. Final production link/disclosure changes must repeat release checks.
- Primary's dashboard audit confirmed no admin custom domains or routes, disabled
  Workers Logs/Traces, and exact-owner Access over all Worker traffic and previews.
  Provider security-log retention is still unverified. See the credential follow-up
  in Next action before further enabled intake.
- Read-only provider metadata confirms D1 size 102400 bytes, U.S. jurisdiction,
  disabled read replication and a successful current Time Travel bookmark response
  without printing/saving its value. Plan limits and recovery retention are not
  established by those responses; no remote recovery operation was performed.

See [the consolidated launch checklist](REPORTING_LAUNCH_READINESS.md) for the
remaining work and exact integration/disclosure surfaces. These updates do not
establish production readiness or independent sponsorship accuracy.

This October 28/early October 29 plan was superseded by the completed Access,
route, isolated recovery, production-secret, and fictional production pilot
checks in the [latest handoff](REPORTING_HANDOFF_2026-10-29.md). Provider
account/retention/capacity verification, final reporting link and disclosures,
human accessibility and owner recovery review, exact-package checks, and
explicit launch approval remain.

Use Wrangler browser authentication when deployment work begins rather than
creating a broad permanent API token. Add the Turnstile secret directly as an
encrypted Worker secret only after the staging public Worker exists.

## Deferred polish — after the full end-to-end flow is working

Owner requested October 28; record for later implementation, not the current
verification work:

- [ ] Add a separate submission-success / closeout page clearly confirming that
  the report was successfully received, with its receipt. Show it only after
  persistence succeeds; retain the draft and retry guidance on failure.
- [ ] Improve the reporting UI generally, including the public form and private
  inbox. Preserve accessibility, explicit submission, privacy and failure handling.

## Deliberately not done

- Production Workers and D1 are deployed, but real intake remains disabled.
- Production uses its separate Turnstile widget and encrypted secret. The
  owner-run real-challenge fictional pilot passed; no secret value was read.
- Owner-only Access covers both admin Workers; production has a separate audience.
- No real report has been collected.
- No billing or paid Cloudflare product has been enabled.
- No Cloudflare secret has been committed to the repository.
