# SNS 1.3 rollout — October 31 checkpoint

The owner explicitly approved the coordinated source push, admin/public
deployment, one fictional report/retry/review/deletion flow, and website
publication after verification. Store submission remains a separate final step.

## Completed

- Source commit `869c0ee` was pushed to `origin/master` after explicit approval.
  Website commit `8e374a0` is held locally until the live workflow gate passes.
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

## Live workflow gate still open

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

Unchanged same-receipt retry confirmation is pending with the owner before
deleting the fictional record. No challenge bypass, test-key substitution,
security-setting change, synthetic token or backend insertion was used. No
unrelated private report was opened. The authenticated inbox and fictional draft
tabs are marked for handoff.

## Remaining, in order

1. Verify an unchanged retry returns the same receipt without creating another
   record. The owner's initial receipt confirmation is recorded above.
2. Delete only that fictional record after retry verification and check
   report/contact/event removal plus cleanup health. Review and revision recovery
   have passed. Do not open any
   unrelated report that arrives meanwhile.
3. Push the held website commit only after the live gate passes, verify the
   Pages deployment and matching live pages. Preserve unrelated root handoffs.
4. Update this checkpoint with actual outcomes, then obtain final approval for
   Store 1.3 submission of the exact candidate. The public Store currently
   lists 1.2; no 1.3 Store action has been taken.

The rollout remains incomplete. Local fixture checks and public health probes
do not replace the outstanding live workflow, provider review or human
accessibility evidence. VoiceOver remains excluded by owner instruction.
