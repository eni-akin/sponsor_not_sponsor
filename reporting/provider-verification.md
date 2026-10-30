# Cloudflare provider verification

Checked: October 30, 2026 (America/Chicago)

This note separates project-recorded account facts from public Cloudflare documentation and account checks still required. It does not certify provider behavior, privacy compliance, or production readiness. The October 30 documentation review used public official pages; the recorded account checks below are separately attributed and did not expose secret values or private report content.

## Project-recorded account facts

These are owner-reported or previously recorded in the [dated rollout handoff](../docs/REPORTING_HANDOFF_2026-10-29.md), except where an agent check is identified:

- Zero Trust was recorded on Free. Staging and production use separate U.S.-jurisdiction D1 databases with read replication disabled; the recorded production size on October 30 was 102,400 bytes.
- Workers Logs and Traces were disabled in the checked deployments, and all four checked-in Wrangler configurations set `observability.enabled` to `false`.
- Exact-owner Access covers both admin Workers, including production and previews. The owner reports a second signed-in identity was denied in each environment; agent anonymous/forged-identity route probes were separate checks.
- The owner confirms that the exposed staging Turnstile secret was rotated and the replacement uploaded through the encrypted secret flow on October 29. No secret value is recorded here.
- Production Workers, D1, Turnstile, and Access exist. The owner-run fictional production workflow passed and synthetic content was deleted; the owner reported 0 report/contact/event rows and 1 deletion-ledger row. Agent GET checks confirmed public intake was paused afterward. Real reporting is not launched.

Those facts do not establish provider-managed retention, available alerts, current quota consumption, or all account settings.

### Account dashboard check — October 29

The orchestrator subsequently inspected the signed-in account without changing
settings. Workers plans showed **Free — Current plan**. Workers & Pages showed
two deployed staging Workers, **21 / 100,000 requests today**, and **0 / 200,000
observability events today**. These are point-in-time counts, not availability
or future capacity guarantees.

Platform Notifications showed its initial empty-state screen. In Create a
notification → Account & billing → Usage based billing, the product selector
reported **No eligible usage-based products are available on this account**.
No alert was created and no plan was upgraded. Use the existing manual usage
review; this result does not establish eligibility for every other alert type
or for separate D1-specific notifications.

### Read-only production metadata — October 30

An agent's `wrangler d1 info sns-reporting --config reporting/wrangler.public.production.jsonc --json` returned production database ID `6662c8f8-655e-4569-9e71-1be712be9512`, jurisdiction `us`, read replication disabled, size 102,400 bytes, and seven tables. It reported 186 read queries, 42 write queries, 497 rows read, and 102 rows written over a **rolling 24-hour window**; these are not UTC-day quota totals. The latest production public deployment inventory showed version `10f5c807-2734-41bc-9a15-3132ee83c322` at 100%, created October 29 at 22:02:57 UTC. Agent public GET checks on October 30 again found `/health` and `/api/config` paused (`available: false`) with the expected production sitekey. These are point-in-time read-only checks, not an audit of private content, retention, or account quotas.

## Official documentation reviewed October 30, 2026

The limits below are documentation claims, not measurements of this account.

| Product | Current documented Free allowance relevant here | Operational consequence |
| --- | --- | --- |
| Workers | 100,000 requests per account per day, resetting at 00:00 UTC; 10 ms CPU per HTTP or Cron invocation; 128 MB memory; 50 subrequests per invocation; 100 Workers and 5 Cron Triggers per account. The daily request limit returns Error 1027 when exceeded. | Confirm the account is actually on Workers Free, current aggregate use by every Worker, remaining Cron capacity, and fail-closed behavior. The reporting system must not rely on uninterrupted availability. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) — updated Oct. 29, 2026. |
| D1 | 10 databases, 500 MB per database, 5 GB total storage, 5 million rows read/day, 100,000 rows written/day, 50 queries per Worker invocation, and 7 days of Time Travel. Daily read/write limits reset at 00:00 UTC; queries fail after they are reached. | The app's 100-report cap is abuse control, not a capacity guarantee. Continue weekly size/read/write review and pause before provider limits. [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) — updated Oct. 24, 2026; [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) — updated Apr. 21, 2026. |
| Turnstile | Up to 20 widgets/account, unlimited challenges and verification requests, 10 hostnames/widget, all widget modes, and a 7-day analytics lookback. Free does not support any-hostname widgets. | Separate staging and production widgets fit the documented allowance. Verify the exact hostname list, widget count/mode, analytics, and rotated-secret status in the account before production. [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/) — updated Aug. 14, 2026. |
| Access / Zero Trust | Cloudflare's current pricing page lists Free as $0 with a 50-user limit and standard logs up to 24 hours. Default Access limits include 500 applications, 50 service tokens, 50 identity providers, and 500 reusable policies; the separate Application Library limit is 50 custom applications on Free. | The two recorded owner-only applications are within the published limits. Verify the actual subscription, active/enrolled user count, remaining capacity, and account-specific entitlements. [Cloudflare plans](https://www.cloudflare.com/plans/) — no page update date exposed; [Cloudflare One account limits](https://developers.cloudflare.com/cloudflare-one/account-limits/) — updated Oct. 16, 2026. |

### Data location and recovery

- A D1 `us` jurisdiction constrains where that database runs and persists data, and it must be chosen at database creation. Workers can still access it from anywhere; it does not establish where Workers, Turnstile, Access, network metadata, or other Cloudflare systems process data. A location hint is not a residency guarantee. [D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/) — updated Oct. 2, 2026.
- D1 Time Travel is always on for databases using the production storage backend. Free retains seven days, and the documented restore rate is 10 restores per 10 minutes per database. Confirm `version: production` for each database. [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) and [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) — updated Apr. 21, 2026.
- A Time Travel restore is destructive: it overwrites the selected database in place and cancels in-flight queries. Cloudflare documents branching/cloning as future work. The October 29 rehearsal therefore restored only disposable synthetic-only D1 `sns-reporting-recovery-20261029`, then replayed later deletions and reconciled newer records. No staging or production database was restored. [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/).
- The isolated drill proves one remote recovery point and the project's reconciliation procedure worked. It does not prove the full seven-day history is usable, every recovery point works, or deleted content is absent from all provider systems. A current bookmark lookup has narrower meaning.

### Logs and retention are separate systems

| Data surface | Official documentation | What the staging setting proves |
| --- | --- | --- |
| Workers Logs | When enabled, Workers Free includes 200,000 log events/day with three-day retention. Invocation logs can contain request, response, and related metadata. [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) — updated Oct. 12, 2026. | `observability.enabled: false` establishes only that Workers Logs/Traces are disabled for the checked deployment. It does **not** establish that Cloudflare stores no aggregate metrics, billing, security, abuse, audit, Access, Turnstile, D1 recovery, or internal operational metadata. |
| Zero Trust logs | On Free, Access logs are documented as retained for 24 hours; Zero Trust admin logs are retained for 18 months. [Zero Trust logs](https://developers.cloudflare.com/cloudflare-one/insights/logs/) — updated Oct. 15, 2026. | Disabling Workers observability does not disable Access or admin logs. |
| Account audit logs | Cloudflare account audit logs are retained for 18 months; the v2 dashboard queries 90 days, while API/Logpush can expose the retained period. [Audit Logs v2](https://developers.cloudflare.com/fundamentals/account/account-security/audit-logs/) — updated Oct. 22, 2026. | These are account/configuration audit records, not the reporting app's content-retention mechanism. |
| Turnstile analytics | Free analytics lookback is seven days. [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/). | This does not state all Turnstile/provider security-metadata retention. |
| D1 billing analytics and recovery | Billable-usage history is stored for at most 30 days; Time Travel retains database history for seven days on Free. [D1 billing](https://developers.cloudflare.com/d1/observability/billing/) — updated Apr. 21, 2026; [D1 limits](https://developers.cloudflare.com/d1/platform/limits/). | Application deletion cannot promise immediate removal from Time Travel, audit, security, or other provider-managed records. |

Before final disclosures, verify the account's actual log settings and consult the applicable Cloudflare privacy/DPA/support material for any provider-security or internal-metadata retention claim. Do not infer it from the Workers observability toggle.

## Rate-limiter facts and gaps

Cloudflare documents the Workers Rate Limiting binding as:

- limited to 10- or 60-second windows;
- local to each Cloudflare location, not one worldwide counter;
- approximate and eventually consistent, so bursts can exceed the threshold;
- shared for the same account, namespace, and key across Workers within a location; and
- not currently visible in the dashboard. A unique namespace prevents accidental sharing; monitoring requires Workers Logs/Traces or explicit Analytics Engine events.

Source: [Workers Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) — updated Oct. 21, 2026.

The documentation does **not** state how long counter keys are retained, when they are deleted, where they are stored, or whether key strings appear in other provider telemetry. The 60-second counting window is not a documented retention period. Keep the project's daily-scoped secret-keyed network value, shared-network warning, and transactional D1 acceptance cap; do not describe the binding as a strict quota or identity. Confirm namespaces `1001` (staging) and `1002` (production) are unused by other account Workers before another deployment.

## Alerts and monitoring

- D1 documents dashboard billing notifications for rows read and rows written, but does not state their Free-plan eligibility or threshold options on that page. A September 2026 D1 enforcement notice says Cloudflare emails when the Free daily row limit is reached; that is a 100% limit warning, not the project's desired 50%/75% early warning. [D1 billing](https://developers.cloudflare.com/d1/observability/billing/) and [D1 limit enforcement](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/).
- The current Platform Notifications catalog says generic usage-based billing alerts require Professional or higher and pay-as-you-go. It lists no general Workers, D1, Turnstile, or Access-capacity alert. Available types are plan/product/account dependent, so absence from the catalog is not proof that an account-specific alert is impossible. [Platform Notifications](https://developers.cloudflare.com/notifications/notification-available/) — updated Oct. 21, 2026.
- Rate-limiting binding counters have no dashboard view or documented native alert. Workers observability or custom Analytics Engine events are the documented monitoring options; either would be a new data/retention choice and is not justified merely to launch this small service.
- No official source reviewed here established a proactive Free-plan alert for Workers request/CPU usage, Turnstile usage, Access user capacity, D1 storage, or rate-limiter saturation.

Until account eligibility is verified, retain the runbook's manual weekly review of Workers requests/errors, D1 rows read/written/storage, Turnstile outcomes, Access denials, and private cleanup health. Use the account's available-alerts view or read-only API later to record which alerts actually exist; do not enable paid products, logging, or new telemetry automatically.

## Remaining account checks

These are verification tasks, not requests to revisit settled operating decisions:

- Confirm current Workers plan, account-wide requests/CPU/errors, remaining Worker/Cron capacity, and fail-closed behavior. The October 29 Workers Free dashboard count is a historical snapshot.
- Confirm each D1 `version: production`, current UTC-day row use and recoverable Time Travel span. Jurisdiction/read replication and production size were recorded, and the isolated remote drill passed; do not restore a live database solely to recheck recovery.
- Confirm current staging/production Turnstile widget inventory, exact hostnames, modes, analytics, and secret-rotation state. The owner has confirmed staging rotation and a successful real production challenge; do not request values.
- Confirm current Zero Trust plan/active user count, Access/admin log views and retention, and application coverage after any Access change. Both second-user denials are settled on owner-reported evidence unless configuration changes.
- Inspect the account's actually available alert types and threshold controls. Record whether D1 row notifications work on Free and whether any Workers, D1 storage, Turnstile, or Access-capacity alert is offered.
- Obtain an authoritative provider answer before publishing an exact retention/deletion statement for rate-limit keys or provider security/internal metadata; public product docs reviewed here do not supply one.

Public documentation can change. Recheck these sources immediately before production launch and record the account-specific results separately from this documentation snapshot.
