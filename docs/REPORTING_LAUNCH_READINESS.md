# Reporting launch readiness

Updated: October 30, 2026 (America/Chicago)

## Current verdict

**Not ready to advertise or enable real production intake.** Staging and the separate production infrastructure passed fictional submit/retry/contact/review/delete workflows. Production owner sign-in and second-user denial are owner-confirmed; agent probes verified Access redirects and the final remote public health/config pause. An isolated remote D1 recovery rehearsal passed on a disposable database. Local extension integration, disclosure drafts, and exact-candidate automated verification completed October 30. Provider/account and production recovery-method gaps, human accessibility review, final wording/Store review, publication, and explicit launch approval remain open. Both checked-in public configurations have intake disabled; fresh remote production checks returned `available: false`. See the [execution record](REPORTING_EXECUTION_2026-10-30.md) for candidate evidence and the [October 29 reporting handoff](REPORTING_HANDOFF_2026-10-29.md) for production workflow evidence.

This checklist records implementation and operational evidence; it is not a legal or Chrome Web Store compliance determination.

## Completed evidence

- October 30 local preparation added the separate fixed reporting link, retained local download, and updated extension/public-site/Store drafts. Both typechecks, 223 tests, build, reporting/browser/popup suites, public-site validation, and all seven extracted-package checks passed. Candidate 1.0.1 SHA-256: `c8d959af6a3817c24ba540e4b9d67ac722c52fe74cc2170521cc487177146186`. The upload version still needs comparison with the current Store version. Disclosures are local drafts, not published pages. The public form notice was unchanged, so its schema/notice version did not change.

- The extension still analyzes locally and downloads a bounded format-2 diagnostic. It includes the displayed decision and role identifier, sanitizes the posting and nested citation URLs, omits full extraction/form answers/settings, and rejects diagnostics over 256 KiB (`src/report.ts`, `shared/report-schema.ts`, report tests).
- The public form imports format 1 or 2 locally, supports a partial manual report, exposes reviewed diagnostic JSON, requires an explicit acknowledgement and submit action, and retains the in-memory draft on submission failure (`reporting/public/index.html`, `reporting/public/app.js`). Selecting a file does not submit it.
- The public Worker has strict route, origin, content-type, body-size, schema, Turnstile, retry, daily-cap, and temporary network-rate controls. The public surface has no report-reading route.
- The admin Worker verifies Access context, audience, and the exact owner email; applies no-store/security headers; and supports bounded review, redaction/deletion, retention cleanup, and private health. Local tests exercise authentication failures, concurrent retries/caps, rollback, stale review writes, deletion, and cleanup failure.
- Staging uses an independent U.S.-jurisdiction D1 database, staging Turnstile widget, disabled intake, disabled Worker observability, and disabled preview URLs. Both encrypted secret names were confirmed without retrieving their values.
- The recorded October 28 staging pilot used real Turnstile, persisted one fictional report, returned the same receipt for an unchanged retry, stored contact separately, completed review, deleted the report, confirmed the content tables empty, restored intake to disabled, and observed the first scheduled cleanup success. These are recorded deployment results, not an independent re-check of current Cloudflare state.
- The package boundary remains narrow: the manifest has only `storage`, no optional/host permission declarations beyond content-script matches, and `scripts/release-files.mjs` allowlists 14 extension assets. Reporting Worker code, D1 configuration, secrets, and private data are not packaged.
- The earlier download-only 1.0.1 archive passed all seven extracted-package checks on October 28, including the actual 400 px toolbar popup, scanner/frame/overview regressions, positioning, and screenshot/help/privacy layout (historical SHA-256 `e613d84383d61be599598aab0b65674c7c55959afc1a9ea1aeb55d2df942e60e`). The October 30 candidate above supersedes that local archive; `release/validation.json` now describes the new candidate.
- Current published disclosures have **not** been changed prematurely. They continue to say reports are downloaded locally and never submitted automatically, which matches the currently published extension.
- The GPT-5.6/medium access agent verified anonymous Access redirects on `/`, `/styles.css`, `/app.js`, `/api/health`, `/api/reports`, a nonexistent detail ID and an unknown route; forged identity headers and cross-origin writes were also denied before reaching the Worker. Hostile-origin preflight returned 403 without permissive CORS headers. The tested current-version preview hostname returned 404. These probes do not establish real second-user denial or exhaust every possible hostname.
- The recovery agent added `tests/reporting-recovery.test.ts`: two isolated local D1 databases use the real migrations, restore an older report/contact/event snapshot, merge a later deletion ledger and run cleanup. Expired and previously deleted data is removed, contacts/events cascade, a surviving duplicate loses its removed primary reference, and an injected failure appears in cleanup health. This verifies application recovery semantics, not Cloudflare Time Travel itself.
- The last full project check passed 223 tests, extension/Worker typechecks, and the extension build. Reporting browser tests passed dynamic configuration and paused/error states. The prior download-only release package passed seven extracted-package checks; repeat them after the final changes.
- Primary's read-only dashboard audit confirmed the admin Worker has only its `workers.dev` hostname, no custom domains or routes, disabled Workers Logs/Traces, and exact-owner Access covering all traffic including previews. This does not establish provider security-log retention.
- A second read-only agent pass confirmed the then-current D1 size 102400 bytes, jurisdiction `us`, read replication disabled, and a successful current Time Travel bookmark response. The bookmark value was not printed or saved. These responses do not establish the account plan, applicable limits, retention window or earliest recoverable time.
- On October 29 the owner confirmed a second signed-in identity was denied both staging and production inbox access. These are owner-reported checks, separate from agent-run anonymous/forged-header route probes; they do not establish exhaustive route coverage.
- Additional alternate/encoded/trailing/double-slash staging routes stayed behind Access and tested preview hosts returned 404. Twelve anonymous/forged-identity production GET/POST route probes redirected to Access. The production admin audience is separate, and the exact-owner reusable policy is shared across both applications; changing it affects both.
- The isolated remote Time Travel rehearsal on disposable synthetic-only D1 `sns-reporting-recovery-20261029` restored an older bookmark, replayed later deletions, reconciled a newer record, and removed expired content. No live staging or production D1 was restored. The disposable database remains for review; do not rerun its script blindly.
- The October 29 owner-run fictional production pilot passed a real Managed Turnstile challenge, accepted a report, returned the same receipt on unchanged retry, showed a separate optional contact in the private inbox, saved two review events, and deleted the report. The owner reported a production D1 count of 0 reports, contacts, and events, plus 1 deletion-ledger entry afterward. Agent GET checks then confirmed `/health` and `/api/config` returned `available: false` with the expected production sitekey. Owner-supplied private health recorded a successful cleanup, no failure, and no expiring reports. These owner-run browser/database checks are not independent agent queries.
- An October 30 agent read-only check found the paused production public version `10f5c807-2734-41bc-9a15-3132ee83c322` at 100% and again observed `available: false` on `/health` and `/api/config`. Production D1 metadata showed U.S. jurisdiction, disabled read replication, 102,400-byte size and seven tables. Its read/write figures cover a rolling 24 hours, not a UTC quota day; see [provider verification](../reporting/provider-verification.md).
- An earlier enabled production window showed a zero-height Turnstile container and no visible widget; its cause remains unknown. A later owner-run pilot succeeded without a key or rendering-code change. Do not present the earlier symptom as a current failed launch gate.

## Required staging credential follow-up

During the dashboard audit, the existing user tab had the Turnstile secret
revealed and the browser tool included it in output. The field was hidden again;
the value is not recorded in repository files or this checklist. Treat it as
exposed. On October 29 the owner confirmed that the staging key was rotated and
its replacement uploaded through Wrangler. This resolves the follow-up on
owner-reported evidence, without requesting or recording the new value.
Production must use its own independent widget and secret. Intake stays disabled
until the remaining rollout gates pass.

## Agent-doable work remaining

### Finish provider and recovery operations

- Record current account plan/capacity, D1 usage and recovery window, available alerts, and actual Access/Worker/Turnstile/security-log settings and retention. The recorded Workers Free dashboard count is a point-in-time baseline only. See [provider verification](../reporting/provider-verification.md) for official documentation versus account-only gaps.
- Confirm rate-limit namespaces `1001` and `1002` do not collide with another account Worker. Keep manual usage and private cleanup-health review until an account-supported alert is established.
- Review the recovery runbook with the owner. A Time Travel restore overwrites its selected D1; the successful rehearsal used an isolated disposable database and does not justify restoring a live database for another check. Verify the current recovery window before relying on it.
- Validate a private current-ledger/newer-record capture method and an actual production recovery strategy before claiming isolated historical production recovery is supported. The expanded runbook explicitly records this remaining gap.

### Preserve the verified production pause

- Production D1, Workers, independent widget/secret names, origins, bindings, migrations, Access application/audience, hourly cleanup, fictional workflow, and final public pause are recorded complete in the dated handoff. Do not repeat the pilot for documentation alone.
- Recheck remote pause and private inbox usability after any deployment or Access change. The owner-reported zero content counts and one deletion-ledger row are a post-pilot snapshot, not a guarantee about later account state.

### Local integration acceptance criteria — implemented October 30

Use the verified HTTPS public Worker origin `https://sns-report.sponsor-not-sponsor.workers.dev/`. Keep intake paused until launch approval. The smallest complete extension change is:

1. Keep the existing **Download report** action and local fallback.
2. In `src/page-ui.ts`, add a separate, plainly named **Open reporting form** link beside the download action. Give it the fixed production URL only—no job URL, query, fragment, diagnostic, or installation value—with `target="_blank"`, `rel="noopener noreferrer"`, and `referrerpolicy="no-referrer"`.
3. State beside the actions: download stays local; opening the form sends no diagnostic or job contents, though ordinary hosting, network, and Turnstile processing occurs; the user must import/review the file and press **Submit report** on the separate site.
4. Do not add a content-script POST, background upload, runtime host permission, remote extension code, or automatic form attachment.

Add focused regressions to `scripts/browser-smoke.mjs` for the exact fixed origin, blank query/fragment, no referrer/opener, no request when the panel/report controls open, separate download and form actions, and local usability while the form is unavailable. Keep the existing diagnostic/privacy assertions in `tests/badge.test.ts`. `scripts/release-files.mjs` should remain unchanged unless a genuinely new extension-owned asset is required; the hosted reporting app must remain outside the ZIP.

### Disclosure acceptance criteria — local drafts prepared October 30

The surfaces below were updated locally and checked with the candidate. Final
wording review and publication remain pending; publishing these pages is separate
from editing them. Retain these criteria for any follow-up change.

- `extension/help.html`: replace “no automatic support inbox” with the download → open form → import/review → explicit submit workflow, offline/paused fallback, and support/deletion contact.
- `extension/privacy.html`: distinguish ordinary local scans from optional form submission. Describe the submitted report fields, posting URL, correction text/public passage, optional email, recipient (Eniola), Cloudflare processing/storage, temporary abuse processing, retention rule, temporary recovery copies, manual deletion requests, and possible retention of sanitized confirmed issues without reporter identity.
- `release/public-site/site/support.html`: provide the same steps, state that download/opening alone sends no diagnostic or job contents, retain email fallback, and explain that a receipt helps locate a request but does not by itself prove ownership.
- `release/public-site/site/privacy.html`: remove the unqualified “no developer collection” claim while preserving the local-analysis distinction; add the verified production collection/processor/retention facts and a new effective date/version.
- `release/public-site/site/index.html`: qualify “Local analysis” so optional reporting is not contradicted.
- `release/CHROME_WEB_STORE_DASHBOARD_WORKSHEET.md` and reviewer instructions: replace “reports are never sent” with “never sent automatically”; document the separate explicit form flow. Reassess dashboard data-use selections against the final flow, especially optional email and submitted report content, rather than copying the current selections. Update permission explanations only if the package actually changes; no new permission is planned.
- Update the public-form notice version if its wording changes, validate the public site, rebuild the exact extension package, and save a new worksheet/hash. Publish the revised disclosures before or atomically with exposing the form link; never ship a collection link under the old download-only claims.

## Genuine owner inputs and human gates

- Second-user denial is complete for both staging and production on the owner's October 29 confirmations. Repeat only if Access configuration changes.
- Confirm the Cloudflare account remains owner-controlled, MFA/recovery material is usable, and no paid product or automatic upgrade has been enabled unintentionally.
- Reuse the recorded production addresses and identifiers and approved U.S. jurisdiction, public support contact, optional email, retention/cap/burst settings, and twice-weekly review commitment; do not re-request settled decisions unless implementation requires a material change.
- Verify in the Cloudflare account: current plan and quotas, D1 Time Travel window and daily use, Worker/Access/Turnstile logging settings, security/internal-metadata retention, rate-limit counter retention, and available alerts. Record only facts the account or an authoritative provider answer establishes; a U.S. D1 jurisdiction is not a claim that all processing stays in the United States.
- Complete a human keyboard and screen-reader review of the extension flow, public form, success/receipt state, failure recovery, and private inbox. Automated/browser checks do not replace this.
- Approve the final public wording and exact release archive/hash. Revisit Store data declarations and distribution/publishing choices in the dashboard; do not treat this document as approval to submit or publish.
- Maintain the inbox and cleanup-health/capacity checks at the approved cadence after launch, and decide when a manual reply or verified deletion request is appropriate.

The requested separate submission-success page and broader reporting UI polish are deferred enhancements, not launch gates, provided the current success state remains clear, focusable, and shown only after persistence succeeds.

## Final verification commands

Run after production integration and disclosure edits, with intake still disabled except for the approved synthetic window:

```sh
pnpm --config.verify-deps-before-run=false check
pnpm --config.verify-deps-before-run=false test:reporting
pnpm --config.verify-deps-before-run=false test:browser
pnpm --config.verify-deps-before-run=false test:popup
pnpm --config.verify-deps-before-run=false release:verify
node release/public-site/validate.mjs --release
git diff --check
```

Inspect the extracted ZIP inventory and manifest after those commands: no backend files/secrets, unchanged permissions unless explicitly reviewed, and help/privacy text matching the published pages. Remote staging/production, owner identity, recovery, provider settings, and accessibility gates require separate recorded evidence; local fixtures do not establish them or real-world sponsorship accuracy.
