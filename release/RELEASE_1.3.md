# SNS 1.3 release worksheet

Prepared October 31, 2026 · America/Chicago. Worker/site rollout verified;
Store release pending.
This is a separate sign-off from the historical
[1.2 dashboard worksheet](CHROME_WEB_STORE_DASHBOARD_WORKSHEET.md).

Rollout update: source was pushed and both Workers deployed under explicit owner
approval. The owner confirmed same-receipt retry, production review/recovery and
exact-test deletion passed, and matching website publication was verified. See the
[rollout checkpoint](../docs/UI_REFRESH_ROLLOUT_2026-10-31.md) for exact deployments
and current evidence. Earlier observations below retain their recorded context.

## Earlier October 31 observations

Read-only observations on October 31:

- [Public Store listing](https://chromewebstore.google.com/detail/sponsor-not-sponsor/gfddiacdchffgjbconhejkhbmkjmnaod)
  returned HTTP 200, heading Sponsor Not Sponsor, Version 1.2, Updated October
  31, 2026. This verifies public listing/version, not the uploaded 1.2 ZIP hash
  or the publisher dashboard's current draft/settings.
- Production `/health` and `/api/config` returned HTTP 200, `available: true`.
- Anonymous admin-root GET returned 302 to a Cloudflare Access hostname.
  No authentication, private report read, aggregate database check or cleanup
  health check was performed.
- Remote `master` was observed at `ba20a28d15c722817af0086d42fde4b400c687c5`.
  Local HEAD is `acfbb1c`; UI changes remain uncommitted.

## Exact candidate

Version is exactly `1.3` in package and manifest. Permissions remain `storage`
with existing HTTP/HTTPS content-script matches and a 14-file runtime allowlist.
The package excludes reporting Workers, private data and configuration.

Final local candidate verified October 31 at `2026-10-31T14:46:49.499Z`:

- ZIP: `release/sponsor-not-sponsor-1.3.zip`.
- SHA-256: `51ba08d8ab7ca49f8980e5828dd957bc242d46a88a19330d693103ffabc225bb`.
- Both typechecks, all 226 unit/integration tests and build passed through
  `pnpm --config.verify-deps-before-run=false check` using installed dependencies.
- Expanded reporting browser suite passed after its final fixes, including
  delayed-note recovery, current/stale/invalid cleanup health, lost-response
  retries, mobile inbox, keyboard/reflow/contrast/target/forced-colour checks.
- All seven extracted-package checks passed, including scanner/frame/overview,
  placement, actual 400px toolbar popup and screenshots/help/privacy layout.
- Public-site release validation and whitespace checks passed.
- Orchestrator visually inspected receipt, populated mobile/desktop inbox,
  popup, short-viewport panel, help and Store evidence screenshots. Store
  screenshot capture now waits until the expanded panel fits the viewport.

The [closeout plan](../docs/UI_REFRESH_CLOSEOUT_PLAN_2026-10-31.md) describes
scope and remaining operational gates. The previous October 30 1.3 hash is
historical and must not be used for this candidate:
`4b92e67e3f537a37289036819e6817eeca65bf6982a25ce9d4440799238c66a4`.
The preserved 1.2 ZIP hash was recomputed unchanged:
`f5283d07235179e1cf950dbdddb841c6e9bf085a6cc9f8af9711e3c3bab1f6b2`.

## Listing and disclosure review

Use the existing [listing copy](STORE_LISTING.md) for unchanged purpose,
permissions and limitations. Its 1.2 status paragraph is historical. Proposed
1.3 release note:

> Refreshed light interface, clearer reporting validation and submission receipt,
> and improvements to private inbox review and recovery feedback.

Use regenerated badge/evidence screenshots and the existing icon/promo assets.
Reviewer demo: https://eni-akin.github.io/sponsor_not_sponsor/demo.html
Support: https://eni-akin.github.io/sponsor_not_sponsor/support.html
Privacy: https://eni-akin.github.io/sponsor_not_sponsor/privacy.html

Public privacy now explicitly covers 1.2 and 1.3 and explains the receipt's
one-time local session transfer. No additional submitted fields, recipients,
server retention, permissions or automatic uploads were introduced. The
notice version `2026-10-30`, report schema version `1`, and disclosure effective date are retained;
this clarifies local confirmation storage, not new collection. Confirm the live
policy matches this source before submission. Dashboard declarations still need
review against saved publisher values; this document does not certify them.

## Release actions and approvals

- [x] Final automated local checks and tool-driven visual/keyboard review recorded.
- [ ] Exact archive/hash/screenshots reviewed and approved for Store submission.
- [x] Default-branch push explicitly authorized; unrelated files kept separate.
- [x] Non-website source committed/pushed, remote commit `869c0ee` recorded.
- [x] Existing admin/public deployment IDs and matching rollback source recorded.
- [x] Production deployment and fictional write/retry/review/delete test authorized.
- [x] Admin deployed first; Access, bindings and cleanup verified to recorded scope.
- [x] Public Worker/receipt assets deployed and source matched; owner live submission/retry confirmed with documented limits.
- [x] Fictional test content removed; current operational health recorded.
- [x] Website commit pushed after workflow checks; Pages run `41222439926` and live files verified.
- [ ] Existing Store draft/review status reconciled, publishing behavior approved.
- [ ] Exact 1.3 candidate submitted; dashboard version/permissions confirmed.
- [ ] Actual Store publication outcome recorded; maintenance verified.

No push, deployment, production write or Store action is authorized by checking
repository tests. Preserve the owner's no-VoiceOver instruction. Fixture success
does not establish independent real-world accuracy or live Turnstile accessibility.
Full-page CSS reflow was checked; actual browser zoom was exercised only on the
extension surfaces. No native screen-reader or exhaustive human interaction audit
is claimed. Production cleanup, counts and deployment IDs were subsequently
checked to the scope in the rollout checkpoint. Retry is owner-confirmed;
exact-test removal and post-test availability were independently verified.
Chrome blocks scripted Store dashboard access, so the owner must review saved
declarations and complete the upload/submission manually after final approval.

## Final Store handoff

Upload only `release/sponsor-not-sponsor-1.3.zip` with SHA-256
`51ba08d8ab7ca49f8980e5828dd957bc242d46a88a19330d693103ffabc225bb`.
Confirm the dashboard parses version `1.3`, permission `storage` and the existing
HTTP/HTTPS page access. Use the reviewed screenshots, privacy/support/demo URLs
and release note above, not historical 1.2 status or placeholder instructions.
Review saved data-use declarations against the existing optional reporting flow.
Confirm the intended publishing choice before final submission. No final Store
submission approval has been supplied yet, and no Store fields were changed.
