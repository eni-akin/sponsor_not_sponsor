# Staging route verification

Verified October 29, 2026 (America/Chicago). These were read-only HTTP and
deployment-metadata checks. Redirect query strings, cookies, credentials and
secret values were not printed or read. No deployment, setting, identity,
database or intake change was made.

## Admin route denial

Anonymous requests included forged identity email and JWT headers. Redirects
were not followed. Every request below returned `302` to the sanitized Cloudflare
Access path
`sponsor-not-sponsor.cloudflareaccess.com/cdn-cgi/access/login/sns-report-admin-staging.sponsor-not-sponsor.workers.dev`:

| Method | Path variants |
| --- | --- |
| `GET` | `/api/reports/`, `//api/reports`, `/api//reports`, `/%61pi/reports`, `/api/%72eports` |
| `GET` | `/styles.css/`, `//styles.css`, `/%73tyles.css` |
| `POST` | `/api/reports/not-a-real-report/update/`, `//api/reports/not-a-real-report/update`, `/api//reports/not-a-real-report/update`, `/api/reports/not-a-real-report/%75pdate` |

The write probes used a nonexistent report ID, hostile origin, JSON content type
and forged admin/identity headers. They did not reach an authenticated action.

A standards-compliant hostile-origin preflight to the admin update route returned
`403`. `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials` were
both absent.

## Current version hosts

Read-only Wrangler deployment metadata identified current version prefixes
`bb9a7c14` for the admin Worker and `dd059ba4` for the public Worker. Their exact
version-host forms both returned `404`:

- `bb9a7c14-sns-report-admin-staging.sponsor-not-sponsor.workers.dev`
- `dd059ba4-sns-report-staging.sponsor-not-sponsor.workers.dev`

## Public Worker

- `GET /health` returned `200` with `available: false`.
- `POST /api/reports` returned `503`.
- A hostile-origin preflight to `/api/reports` returned `405`, with neither
  `Access-Control-Allow-Origin` nor `Access-Control-Allow-Credentials`.

## Owner-confirmed checks

The owner reports that a second identity was denied staging access and that a
replacement staging Turnstile secret was rotated and uploaded. This verification
did not read the secret or repeat either identity workflow.

## Limits

These status-only probes establish anonymous and forged-header denial for the
listed routes at the time checked. They do not replace authenticated owner access
checks, prove denial for identities other than the owner-confirmed second-user
test, or exercise Turnstile while intake is disabled. Provider recovery,
retention and plan limits are separate verification topics.
