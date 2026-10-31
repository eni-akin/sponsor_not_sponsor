# SNS 1.3 rollout — October 31 checkpoint

The owner explicitly approved the coordinated source push, admin/public
deployment, one fictional report/retry/review/deletion flow, and website
publication after verification. Store submission remains a separate final step.

## Completed

- Source commit `869c0ee` was pushed to `origin/master` after explicit approval.
  Website commit `8e374a0` was pushed after the live workflow gate passed.
- Local candidate checks and exact ZIP are recorded in
  [the 1.3 worksheet](../release/RELEASE_1.3.md). The ZIP SHA-256 remains
  `51ba08d8ab7ca49f8980e5828dd957bc242d46a88a19330d693103ffabc225bb`.
- Admin deployed first with `--strict`; public deployed second with `--strict`.
  Both deployed version annotations identify source `869c0ee`.
- Independent read-only Wrangler inspection verified both current versions
  receive 100% traffic and preserve expected bindings and Access variables.
  Public backend script hash is unchanged; its public assets changed.
- Production migrations have none pending. Before the fictional test, aggregate
  reports, contacts, events and expired reports were all zero. Cleanup success
  was `2026-10-31T14:17:25.826Z`, with no recorded failure and zero deletions.
- Anonymous GETs of admin root, script, stylesheet, health and list API all
  redirected to Cloudflare Access. The owner's normal Cloudflare sign-in reached
  the refreshed inbox, showing no reports and loaded health.
- Production public health/config returned HTTP 200, `available: true`.
  Form HTML, app JS, CSS, receipt HTML/JS and schema JS each returned HTTP 200
  and matched local reviewed source byte-for-byte, with security headers.
- The existing maintenance automation was inspected read-only. Its current
  configuration is `PAUSED` and still refers to an older publishing hold.
  No resume or prompt change was made. Its first unattended success is unverified;
  reconcile its baseline and obtain direction before resuming it.

| Worker | Current deployment | Current version | Prior rollback version |
| --- | --- | --- | --- |
| Admin | `93944d80-71d8-455f-9d9d-6373dcf0331f` | `fcf3a68c-5cb1-4b2e-b256-b5e20e9d431e` | `6f33b269-72ba-47d2-9155-c0bdd564baec` |
| Public | `e8f7a602-f491-4329-8989-560e5c000ca6` | `26f9fdf4-b8ee-4900-9a94-87e85d9a10a8` | `d6e22808-fb51-4f49-9194-e76d80fa266e` |

Prior deployments were admin `57e8ff3a-8cd6-4d52-80d4-5ae6acf71e99` and public
`d77e5ba8-9936-475f-b3d4-8656068c5c67`. Their matching source is retained at
`acfbb1c`; backend/config/migrations are unchanged between it and `869c0ee`.
Admin deployment output confirmed the hourly `17 * * * *` trigger. Wrangler's
inspected read-only metadata did not expose remote cron/observability settings;
no independent dashboard settings audit is claimed.

## Live workflow evidence and limitations

A fresh Chrome tab was prepared with fictional vacancy text and a fictional
example.com contact. No real report or personal information was imported.
Submission stopped at the verification guard before making an accepted report.
The Turnstile container had a zero-height child, no iframe, and sanitized browser
errors reported `300030`. No challenge tokens or secret values were read.

Cloudflare documents the `300*` family as a generic challenge failure, including
bot detection; that does not prove which browser/environment condition caused
this instance. See [Turnstile error codes](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/).
The earlier October 29 zero-height symptom also lacked a proven cause; a later
owner-run pilot succeeded. This new observation must not be presented as a
successful 1.3 production submit/retry test or proof of a regression.

The owner subsequently confirmed submission and a receipt. A fresh aggregate
query found one report, zero contacts, one event and zero expired reports.
The authenticated inbox showed a single fictional entry titled `test`; only
that entry was opened for authorized verification. The owner appears to have
used another form tab: the agent-created draft remained on the form, and no
dedicated receipt-page navigation was independently observed in that tab.

Production review was verified with two native Chrome inbox tabs: a review in
the second view saved, the stale first view produced the expected 409 message,
explicit recovery retained its unsaved fictional note, and the recovered review
saved successfully. An additional save occurred while locating the first tab;
do not invent an exact event total without querying it. The browser's DOM
inspection API timed out, so normal native Chrome controls were used instead.

The owner subsequently confirmed that retrying the unchanged report returned
the same receipt. Independent pre-deletion queries still found exactly one
report, zero contacts and four events, all associated with the identified test.
The receipt/retry comparison is owner-reported, not an independently observed
network-response comparison. Dedicated receipt-page navigation was locally
tested but was not independently observed during the owner's live submission.

The agent deleted only the identified test through the authenticated inbox's
typed-ID guard. An initial stale deletion was safely rejected; explicit refresh,
retyping the same ID and retrying succeeded. The UI reported “Report deleted”
and an empty inbox. Independent post-delete read-only queries confirmed:

- Zero reports, contacts, events and expired reports in production.
- Zero exact-test report/contact/event rows and one minimal deletion-ledger entry.
- Cleanup succeeded `2026-10-31T16:17:25.815Z`, with no recorded failure and
  scheduled-cleanup deleted count zero. Manual deletion is separate from that
  scheduled counter. No synthetic contact had been submitted, so this live flow
  does not independently exercise contact cascade deletion.
- Public health/config remained HTTP 200 and `available: true`.

No challenge bypass, test-key substitution, security-setting change, synthetic
token or backend insertion was used. No unrelated private report was opened.

## Website publication verified

After retry confirmation and exact-test cleanup, commit `8e374a0` was pushed.
[Pages run 41222439926](https://github.com/eni-akin/sponsor_not_sponsor/actions/runs/41222439926)
completed successfully for `8e374a05a7973d00136061b88d293bb87ade4719`.
All seven site files returned HTTP 200 and matched approved local source
byte-for-byte: home, demo, privacy, support, CSS, logo and favicon.

The coordinated Worker/site rollout is complete to the evidence scope above.
This is not Store 1.3 publication or a claim of exhaustive human accessibility.

## Remaining, in order

1. Obtain final approval for Store 1.3 submission of the exact candidate and
   publishing choice. Chrome rejected read-only scripted dashboard access with
   “The extensions gallery cannot be scripted.” Do not bypass that restriction;
   the owner must review saved declarations, upload and submit manually.
2. Record actual Store submission/publication evidence. Public Store 1.2 was
   the last verified listing; no 1.3 Store action has been taken by the agent.
3. Obtain direction on the currently paused maintenance automation, reconcile
   its obsolete hold prompt and verify the first successful unattended run.

The full 1.3 release remains incomplete until its intended Store publication is
verified. Local fixture checks, owner-reported receipt comparison and operational
probes do not establish independent accuracy, provider settings coverage or human
accessibility. VoiceOver remains excluded by owner instruction.
