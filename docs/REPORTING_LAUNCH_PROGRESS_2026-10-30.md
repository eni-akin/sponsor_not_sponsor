# Reporting launch goal — October 30, 2026

This tracks the owner's nine-step goal beyond the local preparation checkpoint.
Production intake remains paused until the final release and launch approvals.
An item is complete only for its stated evidence scope.
Latest owner updates on October 30: human validation is done; version `1.2` is
selected; dashboard items are done; the owner submitted to Google for review
with automatic publishing after approval; and **all completed GitHub work may
now be pushed**, including the Pages deployment that push triggers. These are
owner-reported Store facts, not an independent dashboard inspection. The earlier
GitHub publishing hold is superseded by the explicit push request. **Do not use
VoiceOver or enable real reporting intake.** No Worker deployment is requested.

| Step | Status | Evidence / next action |
| --- | --- | --- |
| 1. Cloudflare account checks | Reviewed; known limitations recorded | Live read-only dashboard and filtered deployment audit in [provider verification](../reporting/provider-verification.md). Undocumented provider metadata/key retention stays unknown; no eligible usage alert was offered. Recheck at launch. |
| 2. Recovery procedure | Validated with disposable data | Encrypted remote fixture capture, authenticated decrypt on a verified encrypted image, empty local D1 import, and deletion/newer-record/review/counter reconciliation passed. Owner supplies private passphrase/workspace at use; no live restore or private production export. See [recovery evidence](../reporting/recovery-verification.md). |
| 3. Wording review | Technical review complete; dashboard completion owner-reported | Local disclosures describe optional submission, email, first-closure retention and the 14-day ledger. The owner reports all dashboard items done. GitHub push/public page verification is now authorized; no legal certification is claimed. |
| 4. Keyboard and screen reader | Keyboard flows exercised; screen reader not performed at owner request | Current local form/inbox keyboard flows exercised on synthetic data. Existing SNS was reloaded from this repo's dist; native keyboard exercised reason selection, completed local download and opened the new form link, which showed paused intake. Current packaged controls also pass automated browser checks. No screen-reader pass claimed. |
| 5. Final version | Owner selected `1.2`; local candidate verified | All 226 tests and seven extracted-package checks passed; current ZIP/hash below. Owner reports dashboard items complete and submission made; uploaded manifest/hash were not independently inspected. |
| 6. Exact candidate approval | Owner proceeded with submission | Owner reports submission after the 1.2 candidate was supplied. This is not independent proof of which ZIP/hash Google received. |
| 7. Public pages | Push authorized; deployment verification pending | Owner explicitly requested all GitHub pushes. Live privacy/support were still old at the pre-push check; verify Pages after pushing master. |
| 8. Store and real intake | Store review submitted, auto-publish selected; intake remains paused | Owner reports Google submission and automatic publishing after approval. Approval/publication is not yet verified. No separate approval to enable real intake. |
| 9. Maintenance | Read-only schedule active; first scheduled run pending | SNS reporting maintenance runs Mondays/Thursdays at 09:00 local app time (currently Chicago); Thursday includes weekly provider review. Baseline aggregate check passed. Owner privately reviews claims; no automated production changes. |

## Account review evidence

October 30 at approximately 10:40–10:43 a.m. America/Chicago: Workers Free;
49/100,000 daily requests; D1 daily rows 24/5,000,000 read and 6/100,000 written;
3/10 databases using 307.2 kB/5 GB. Production Time Travel is available from its
October 29 creation; the dashboard states a seven-day policy. Zero Trust Free
shows 1/50 seats. Production Access protects every admin URL and preview with
the exact owner. Disabled Workers logging and namespace separation were reviewed.
No configuration was changed, no credentials were inspected, and no alert was saved.

Earlier local tests and the candidate hash remain in the
[execution record](REPORTING_EXECUTION_2026-10-30.md). They do not substitute for
final version selection, actual screen-reader review, or owner approval.

## Recovery method investigation

The installed Wrangler supports full schema/data export with `d1 export --remote
--output` and import into a different database with `d1 execute --file`. Official
[import/export documentation](https://developers.cloudflare.com/d1/best-practices/import-export-data/)
confirms that flow. [Time Travel documentation](https://developers.cloudflare.com/d1/reference/time-travel/)
still says restore overwrites the selected database and does not clone historical
state into a new target. A current export alone cannot be presented as an isolated
historical restore.

Next validation must demonstrate: a protected current-state capture including
ledger, reports, contacts, events and acceptance counters; restoration of an older
disposable state; removal of deleted/expired content; preservation of newer
reports and review changes; counter reconciliation; and successful isolated
import before exposing a recovered inbox. Encryption and owner-held recovery-key
handling must be validated, including failed decryption without exposing plaintext.
No production export, restore, key creation, or recovery-tool installation has
occurred. Existing disposable rehearsal data has not been overwritten.

The October 30 local prerequisite check returned **FileVault is Off**. Therefore
ordinary temporary plaintext SQL files are not an acceptable completed capture
method on this machine. The implemented tool streams through
a private FIFO directly into authenticated encryption. The installed Wrangler
export code supports a file/pipe output, but prints a short-lived signed download
URL; child output stays private and `WRANGLER_WRITE_LOGS=false` suppresses ordinary
on-disk logs. The later guarded synthetic-only export generated a provider URL
internally but did not print or persist it in Wrangler logs.

The parent verified AES-256 disk-image encryption, wrong-password rejection, and
the actual new-helper decrypt/import chain on a mounted encrypted volume. Then
the existing synthetic-only remote recovery database was identity/fixture-guarded,
exported through encryption, decrypted on a verified encrypted image, and imported
into a new empty local D1. Counts matched all 2 reports/contacts/events/ledger,
0 duplicate links, and 4 accepts. The remote source stayed unchanged. Generated
local synthetic artifacts were removed and images unmounted. All 226 project
tests, typechecks, and build passed. This validates the method, not an actual
production incident or a historical cloning capability Cloudflare does not offer.

### Wording review completed after recovery

The code/disclosure cross-check identified and corrected these details in step 3:

- The public form's introduction now scopes pre-submission non-upload to report
  contents and explains ordinary hosting and Turnstile verification requests.
- Form, extension privacy, public privacy and Store worksheet now separate the
  minimal 14-day random-ID deletion ledger from report/contact contents and
  provider recovery copies. Retention specifies first closure, matching code.

Browser/schema notice versions are both `2026-10-30`; stale-notice rejection and
browser/backend notice parity are tested. Both typechecks, 226 tests, build,
reporting browser suite, public-site release validation, and whitespace checks
passed. Initial sandbox IPC/localhost denials were resolved with runtime access;
the site validator was rerun in its required `--release` mode. The current
deployed notice remains unchanged until a reviewed deployment. The earlier ZIP
and hash do not cover these updated extension privacy contents; rebuild and
package verification remain required after final version selection.

## Keyboard evidence and current local candidate

October 30 tool-driven keyboard checks used loopback-only servers with current
public form assets and current private inbox HTML/CSS/JS. APIs were in-memory
synthetic fixtures, not production or an authentication/Turnstile test. The local
challenge replaced Cloudflare with a clearly labelled test control. No report,
contact or review was sent to Cloudflare.

- Form: Tab reached file input, posting and optional fields, category, consent,
  local challenge and Submit. A simulated API error focused the error message;
  the draft remained editable. A successful retry focused the receipt message.
- Inbox: native Chrome for Testing keyboard navigation opened a report and
  optional contact; the native status menu selected reviewing and Save review
  updated the list. Attempting deletion without the ID focused the safeguard
  message. No deletion was performed. Disabled pagination controls were skipped.
- The first installed-SNS check used an older Download-only copy, not candidate
  evidence. A subsequent native Chrome check verified its existing unpacked
  source was this repository's `dist`, version `1.0.1`, and reloaded it without
  changing permissions. On the published fictional reviewer demo, Tab/Enter
  opened the badge/panel and reporting controls. The native reason menu selected
  Other problem; keyboard Download report produced a completed 2,748-byte local
  `sponsor-not-sponsor-report.json` and the status "Nothing was sent." Tab reached
  Open reporting form; Enter opened a separate production form tab with empty
  fields, disabled Submit and "Reporting is temporarily unavailable." No report
  was submitted. This confirms keyboard operation of the current installed
  controls, not independent accuracy or screen-reader announcements. The live
  form still has the old notice, as expected with the publishing hold. Visual
  evidence is the ignored local `test-results/reporting-paused-keyboard.png`.
- VoiceOver launch timed out and the app inventory showed it not running.
  The owner then explicitly instructed not to use it. No VoiceOver/screen-reader
  announcement or human accessibility certification is claimed.

Historical candidate before the owner-selected version change:
`release/sponsor-not-sponsor-1.0.1.zip`, 14 allowlisted runtime
files, SHA-256
`bce22afe01b49ace3951ee94fb58e855298ae1194a9bc7ca9bf3c16f3fcc77af`.
Verification timestamp `2026-10-30T16:52:27.674Z`: 226 tests, both typechecks,
build, reporting browser suite, all seven extracted-package checks, public-site
release validation and whitespace checks passed. This supersedes the earlier
ZIP/hash for local review; it is not release approval. Store screenshots were
regenerated by the package suite. Chrome's official dashboard link returned
"The extensions gallery cannot be scripted"; no Store values were read or changed.
At that checkpoint, Store version confirmation and human-validation confirmation
were open; the later owner statement below updates the human-validation status.
No push, upload, submission or intake launch
occurred during candidate preparation. The recurring maintenance setup below
was subsequently added; it does not authorize publication or intake changes.

## Read-only maintenance setup

Created and read back the active in-thread heartbeat **SNS reporting maintenance**
(`sns-reporting-maintenance`). The persisted schedule is Mondays and Thursdays
at 09:00 local app time; Thursday's prompt includes weekly provider usage. The
checked machine currently uses CDT, matching the owner's Chicago timezone. The
automation file does not explicitly store a timezone, so verify scheduling if
the app/machine timezone changes. Local checks require the computer and desktop
app to remain running; the first scheduled execution has not happened yet.

The prompt allows public availability checks and aggregate private operational
counts/timestamps only. New claims are referred to the owner for private review;
private report bodies, contact values, notes and submitted posting URLs are not
retrieved. Weekly account metrics are checked read-only if authorized access is
available; missing access is reported as missing evidence. At the runbook's 50%
and 75% thresholds it reports the necessary owner investigation/pause action,
but cannot itself deploy or change intake. It retains the publishing hold and
no-VoiceOver instructions and stays quiet for unchanged healthy state.

A baseline test at `2026-10-30T17:01:14.993Z` found 0 reports, 0 contacts,
0 review events and 0 expired reports. The cleanup row's last success was
`2026-10-30T16:17:25.074Z`, failure was null, and deleted count was 0. Public
`/health` and `/api/config` each returned HTTP 200 with `available: false`.
An initial combined check failed without exposing raw errors; separate bounded
checks then succeeded. No content was read and no database, deployment, billing,
security or logging settings were changed. This baseline and saved schedule do
not prove future unattended access or replace owner inbox review.

## Owner-selected 1.2 and human validation confirmation

On October 30 the owner instructed: change the current package version to `1.2`,
human validation is done, and Store declarations will be completed together.
Human validation is recorded as **owner-confirmed complete**, not independently
reperformed by the agent. No new sample sizes, reviewer records, measured accuracy,
or evidence establishing the registered evaluation requirements were supplied
with this statement. Do not invent those results or infer a screen-reader pass;
the no-VoiceOver instruction remains in force.

`package.json` and `extension/manifest.json` now both use the exact requested
version `1.2`. Current release/public privacy drafts and the worksheet match it.
Historical diagnostic fixtures still use older versions intentionally. Public
copy no longer states human validation is pending, but retains limitations and
makes no new accuracy claim. Exact archive approval and Store declarations are
separate from human validation. No push, upload, submission, deployment or intake
enablement is authorized by this version change.

The rebuilt `release/sponsor-not-sponsor-1.2.zip` contains 14 allowlisted runtime
files. SHA-256:
`f5283d07235179e1cf950dbdddb841c6e9bf085a6cc9f8af9711e3c3bab1f6b2`.
At `2026-10-30T17:45:02.240Z`, both typechecks, all 226 tests, build and all
seven extracted-package checks passed. Public-site release validation and
whitespace checks also passed. The manifest still declares only `storage`;
no sponsorship logic, collection behavior, dependency or permission was changed.
This candidate supersedes the historical 1.0.1 ZIP for the next joint Store review.

## Owner submission and GitHub push authorization

The owner subsequently confirmed all dashboard items complete, then explicitly
reported submission for review with automatic publishing after approval. Do not
report the extension as approved or published without later evidence. The owner
then requested all GitHub pushes. Push the completed reporting/release commits
on master and verify the automatic Pages deployment; preserve unrelated dirty
handoff files. This does not authorize enabling reporting intake.

The pre-push live privacy page returned HTTP 200 but still identified version
1.0.0 and lacked optional submission/email/ledger disclosures; support likewise
lacked the new form flow. Both differed from prepared local files. At
`2026-10-30T19:35:45.696Z`, production `/api/config` returned HTTP 200 and
`available: false`. Public page publication is therefore needed to align the
live disclosures with the submitted candidate, without changing intake.
