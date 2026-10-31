# SNS 1.3 UI refresh — closeout plan

Prepared October 31, 2026 · America/Chicago.

Execution checkpoint: local fixes and expanded verification in steps 1–3 have
been completed to the scope recorded in the [1.3 release worksheet](../release/RELEASE_1.3.md).
Current public Store status is 1.2 and public reporting is available. Commits,
pushes, production rollout verification and 1.3 submission/publication remain
pending; the operational gates below still apply.

The refresh exists locally, but UI acceptance and rollout remain incomplete.
This plan follows the [UI handoff](UI_REFRESH_HANDOFF_2026-10-31.md),
[implementation note](UI_REFRESH_1.3.md), and
[approved design system](../design-system/sponsor-not-sponsor/MASTER.md).
It records review findings and proposed execution; it does not authorize a push,
deployment, production test write, or Store submission.

## Evidence checked for this plan

- Local HEAD: `acfbb1c`; a fresh read-only `git ls-remote` observed remote
  `master` at `ba20a28d15c722817af0086d42fde4b400c687c5`.
- Existing 1.3 ZIP checksum was recomputed and matches the handoff:
  `4b92e67e3f537a37289036819e6817eeca65bf6982a25ce9d4440799238c66a4`.
  Agent inspection also checked the 14-entry inventory and preserved 1.2 archive.
  This is integrity evidence, not a new full release-suite pass.
- An isolated jsdom check reproduced both the stale-review recovery loop and
  list-success/health-failure misreporting against current `adminJs`.
- Source inspection confirmed that the inbox's existing “Mobile page” assertion
  runs at 1440px after the public-form width loop.
- `.github/workflows/pages.yml` publishes website changes automatically on a
  matching `master` push. The current working tree includes website CSS.
- Production config declares intake enabled; older operator documents still
  say paused. The latest handoff records October 30 enablement. No fresh cloud
  or Store state was checked for this plan.

The earlier description “implementation-complete” was too strong: review found
remaining behavior defects and acceptance gaps.

## Work allocation and order

For execution, give each implementation agent exclusive files; the orchestrator
reviews the integrated result and owns final verification and release decisions.
The current review used three agents: UI behavior, test coverage, and release
readiness. All findings below were checked against current source by the
orchestrator; the two behavior defects were also reproduced locally.

| Order | Owner | Work | Required completion evidence |
| --- | --- | --- | --- |
| 1A | Inbox/UI agent | Fix stale review recovery and separate list/health states in `reporting/admin-ui.ts`. | Conflict → offered recovery → current revision → successful save; successful list remains usable when health fails. |
| 1B | Visual agent | Resolve actual size-rule mismatches in popup/panel/reporting CSS; review populated health, duplicate, and history presentation. | Computed sizes and representative narrow/desktop screenshots; keyboard and short-height behavior verified. |
| 2 | Verification agent | Extend `scripts/browser-reporting.mjs` after 1A; add real mobile inbox, conflict recovery, health failure, and client retry cases. | Tests exercise changed revisions, populated fixtures, lost responses and explicit viewport widths. |
| 3 | Orchestrator | Review diffs, reconcile release wording/state, verify integrated candidate, freeze artifacts. | Passing checks, reviewed screenshots, final checksum and scoped commit manifest. |
| 4 | Orchestrator with owner release authority | Push non-website work; deploy admin then public; verify production; publish website; perform approved Store action. | Deployment/run IDs, sanitized live evidence and actual Store outcome. |

## 1. Finish the UI acceptance work

### A. Make stale-review recovery actionable

`reporting/admin-ui.ts` sends `current.revision` on saves, but Reload only
refreshes the list and health. The server's 409 tells the owner to reload;
following that instruction through the visible button leaves the detail stale.

Provide an explicit way to reload the selected report and obtain its current
revision. Preserve the unsaved review note through conflict and make any
replacement of unsaved review fields deliberate and explained. Do not silently
resubmit stale edits over a newer review. Test a real revision transition from
0 to 1 and a successful save after recovery. The existing test merely checks
the error string and an already empty note.

Reach: admin markup/script and reporting browser tests. Preserve server revision
guards, typed-ID confirmation, literal text rendering and owner-only access.

### B. Give health independent feedback

The list and health share one catch in `load()`. A health failure after a
successful list request labels the populated list as failed and can retain old
health output. Keep list success visible and show health loading/failure in its
own region, without presenting stale health as current.

Test healthy, degraded, loading and failed health with populated list/detail
fixtures. Inspect cleanup status and timestamps without exposing report content.

### C. Verify the approved sizes and populated layouts

The design master requires 44px controls, at least 12px supporting text on
compact extension surfaces and 14px on full pages. Current source contains:

- Finding summary `min-height:32px` in popup and injected panel styles.
- Remaining 11px popup count/review/scan-feedback text and injected
  finding-value/review-label/warnings/control text.
- 13px admin `pre` and public diagnostic-editor text.

Inspect computed styles and actual hit regions, including specificity and later
overrides; change only the selectors that still fail the approved rules. Extend
the relevant check beyond its current 24px target threshold. Recheck actual
400px popup sizing, narrow/short viewport scrolling, placement, focus restoration,
zoom/reflow, contrast, reduced motion and forced colours after size changes.

Health, duplicates and review history are still raw JSON in the inbox. Populate
them with representative long notes, multiple candidates and warning states.
If they do not provide the approved readability, add the smallest readable
summary with diagnostics available separately. Do not infer a requirement for
a new dashboard or framework from their current implementation.

### D. Repair and complete meaningful browser coverage

- Explicitly set 375/390px before testing populated inbox/detail/review/deletion
  controls and pagination; check desktop separately. The existing mobile claim
  at the end of the script actually runs at 1440px.
- Exercise submission loading and an uncertain response: simulate acceptance
  followed by lost response, retry an unchanged draft with a fresh challenge,
  and assert stable submission key and same receipt. An edited draft must get
  a new submission key. Existing real local D1 tests cover server idempotency;
  the browser test must cover the client's behavior.
- Add conflict recovery and independent health-failure cases described above.
- Retain receipt navigation/focus, one-time consumption, expiry, copy fallback,
  failed-import preservation, draft retention and literal untrusted-text checks.
  Verify storage-denied receipt fallback and malformed transfer if needed to
  support their declared acceptance behavior.
- Perform focused manual keyboard/visual checks on populated form, receipt and
  inbox states. Do not run VoiceOver or claim a screen-reader pass.

## 2. Reconcile current release state and wording

Read current Store state without changing the existing 1.2 submission or its
automatic-publication choice. Use a public listing where available; if dashboard
access is unavailable, obtain the owner's status evidence. Record the source of
each fact and distinguish submitted, approved and published.

Recheck public production health/config, exact Worker identities, Access,
aggregate counts and cleanup before proposing a deployment. Historical enabled
intake and checked-in config do not prove current remote availability.

Update active entrypoints such as `reporting/README.md`, `release/README.md` and
launch-readiness pointers with dated current status. Preserve the 1.2 worksheet,
submitted ZIP/hash and historical records. Add a separate 1.3 release worksheet
with candidate, listing, privacy, screenshots and final approval fields. Review
website privacy's explicit 1.2 applicability for 1.3; cosmetic changes alone do
not justify changing disclosure meaning, effective date or notice/schema version.

## 3. Freeze one reviewed source and artifact set

After fixes and review, run the following against the final integrated source:

```sh
pnpm check
pnpm test:reporting
node release/public-site/validate.mjs --release
pnpm release:verify
git diff --check
```

The installed-dependency fallback documented in `release/README.md` is available
if pnpm's metadata preflight requires it. `release:verify` already rebuilds,
packages and runs all five extension browser suites, actual popup sizing and
screenshot/help/privacy checks against the extracted archive. Avoid duplicating
those same commands in the unchanged final pass. Add targeted checks only for
requirements those suites do not cover, such as a changed target-size assertion.

Inspect regenerated screenshots and archive manifest, 14-file allowlist,
permissions and checksum. Record the new hash if rebuilding changes it. Preserve
the submitted 1.2 archive. Check scanner/iframe/source identity/overview/privacy/
accessibility/rule regressions, keeping sponsorship/CPT/OPT/eligibility distinct.

Stage by explicit reviewed paths. Preserve these pre-existing changes separately:
root `HANDOFF.md`, root `HANDOFF-2026-10-20.md`, and
`docs/REPORTING_HANDOFF_2026-10-30.md`.

Prepare separate non-website and website commits. Do not include
`release/public-site/site/**` or Pages workflow changes in the initial push:
that would trigger website publication before Worker verification. Obtain the
explicit default-branch push direction required by the prior approval rejection.

## 4. Execute the authorized rollout

1. Record current admin/public deployment IDs and preserve matching source and
   the previous candidate. Use the existing pause runbook if an authorized
   incident response requires it; no schema rollback belongs to this UI release.
2. Push reviewed non-website work under explicit authorization.
3. Deploy `reporting/wrangler.admin.production.jsonc` first. Verify owner Access,
   anonymous denial, exact bindings, migrations, cleanup and security headers.
4. Deploy `reporting/wrangler.public.production.jsonc`, including built validator,
   form and receipt assets. Verify current intake state, correct Turnstile
   hostname/action, notice alignment, routes and public health/config.
5. Under explicit production-test authority, run a fictional submit → uncertain
   retry/same receipt → review → conflict recovery → delete flow. Verify
   removal of that record/contact/events and healthy cleanup. Record only
   sanitized evidence, without printing bodies, contacts, tokens or secrets.
6. Push the held website changes after Worker verification, inspect the Pages
   run and verify matching live pages and links. Keep the tested source fixed;
   unexpected remote changes require review before proceeding.
7. Reconcile 1.2's actual Store state, obtain final approval for the exact 1.3
   ZIP/listing/declarations/publishing behavior, then perform the approved Store
   action. Do not cancel/replace a pending submission without explicit direction.
8. Record actual Store outcome and live deployment evidence. Continue the
   existing read-only maintenance workflow and verify its first unattended run
   if that evidence is still missing.

## Completion criteria

- **UI accepted:** behavior defects fixed, planned surfaces reviewed, meaningful
  regression coverage and documented accessibility/size requirements verified.
- **Candidate frozen:** source, tests, screenshots, archive and validation refer
  to one reviewed candidate; unrelated work and 1.2 artifacts are preserved.
- **Rollout verified:** authorized commits/pushes, Workers and matching website
  have current evidence, including fictional flow cleanup and recovery targets.
- **Store submitted:** Google has received the approved exact candidate; review
  pending is recorded honestly.
- **1.3 released:** intended Store publication is actually verified alongside
  the matching production/site rollout. Submission alone does not meet this gate.

Deferred scope remains dark mode, company research, attachments/accounts/report
lookup, automatic email, AI triage and new UI dependencies. Local fixtures do not
establish independent real-world accuracy or production Turnstile accessibility.

The initial review added only planning documentation. Subsequent implementation,
verification and read-only public checks are recorded in the release worksheet;
they do not establish production rollout or comprehensive human accessibility.
