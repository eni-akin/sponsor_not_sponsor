# Reporting launch goal — October 30, 2026

This tracks the owner's nine-step goal beyond the local preparation checkpoint.
Production intake remains paused until the final release and launch approvals.
An item is complete only for its stated evidence scope.
The owner's latest October 30 instructions are **do not use VoiceOver** and
**do not do final publishing**. Continue local preparation only; do not push
Pages changes, submit to the Store, or enable real intake.

| Step | Status | Evidence / next action |
| --- | --- | --- |
| 1. Cloudflare account checks | Reviewed; known limitations recorded | Live read-only dashboard and filtered deployment audit in [provider verification](../reporting/provider-verification.md). Undocumented provider metadata/key retention stays unknown; no eligible usage alert was offered. Recheck at launch. |
| 2. Recovery procedure | Validated with disposable data | Encrypted remote fixture capture, authenticated decrypt on a verified encrypted image, empty local D1 import, and deletion/newer-record/review/counter reconciliation passed. Owner supplies private passphrase/workspace at use; no live restore or private production export. See [recovery evidence](../reporting/recovery-verification.md). |
| 3. Wording review | Technical review complete; owner approval pending | Reviewed extension help/privacy, public support/privacy, Store listing/worksheet and form against the implementation. Clarified pre-submit technical requests, role identifier, first-closure retention, and 14-day minimal deletion ledger. Notice version updated together; 226 tests and reporting browser checks passed. These are local drafts, not published policy or legal certification. |
| 4. Keyboard and screen reader | Partial keyboard evidence; screen reader not performed at owner request | Current local form/inbox keyboard flows exercised on synthetic data; installed extension's older report controls exercised. Current packaged controls pass automated browser checks. Manual new-link check after extension reload remains open. No screen-reader pass claimed. |
| 5. Final version | Provisional candidate rebuilt; Store version unconfirmed | Chrome refuses scripted Store access. Owner must confirm Package version; keep `1.0.1` provisional. Fresh ZIP/hash and all seven extracted-package checks recorded below. |
| 6. Exact candidate approval | Pending | Present the final version, ZIP/hash, evidence, wording, and limitations for owner approval. |
| 7. Public pages | Held at owner's request | Do not push master or publish Pages. Later approval and live verification required. |
| 8. Store and real intake | Held at owner's request | Do not submit to the Store or enable real intake. Final dashboard choices and explicit launch approval remain open. |
| 9. Maintenance | Pending setup | Establish twice-weekly inbox/cleanup and weekly provider-usage review with the approved thresholds. |

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
- Installed SNS on a fictional local vacancy: keyboard opened the badge/panel,
  reached reporting controls and focused the reason selector. This installed
  copy had the older Download-only UI, not the new form link. Reload and manual
  checking of the latest copy remain required; do not equate it with candidate
  evidence. The packaged browser suite independently checks the new link.
- VoiceOver launch timed out and the app inventory showed it not running.
  The owner then explicitly instructed not to use it. No VoiceOver/screen-reader
  announcement or human accessibility certification is claimed.

Fresh candidate `release/sponsor-not-sponsor-1.0.1.zip`, 14 allowlisted runtime
files, SHA-256
`bce22afe01b49ace3951ee94fb58e855298ae1194a9bc7ca9bf3c16f3fcc77af`.
Verification timestamp `2026-10-30T16:52:27.674Z`: 226 tests, both typechecks,
build, reporting browser suite, all seven extracted-package checks, public-site
release validation and whitespace checks passed. This supersedes the earlier
ZIP/hash for local review; it is not release approval. Store screenshots were
regenerated by the package suite. Chrome's official dashboard link returned
"The extensions gallery cannot be scripted"; no Store values were read or changed.
Owner confirmation of the uploaded version and independent human-reviewed
real-world validation remain open. No push, upload, submission or intake launch
occurred. Maintenance cadence is documented but recurring maintenance is not yet
configured.
