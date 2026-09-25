# Company research preview (Section 5)

This local TypeScript service looks for the same official vacancy, then official hiring policies, then reviewed historical employer records. Research is displayed separately from the current posting. It never changes the page's sponsorship/CPT/OPT findings or badge based on company history or general policy.

## Start and enable

1. Install project dependencies and build the extension (`pnpm install --frozen-lockfile`, `pnpm build`). Node 22.9+ is required for the environment-file startup option.
2. Run `pnpm research:serve` from the project directory. The service listens only on `http://127.0.0.1:4318`. Leave that terminal running while using research.
3. Reload the unpacked extension in Chrome and reload the job page.
4. In the popup, expand **Company research settings**, read the sharing explanation, and enable **automatic company research**. Accept Chrome's optional access prompt for the local service if shown.

Research begins automatically for a detected role with an identified employer when sponsorship, CPT, or OPT is unclear. Pause and site-disable controls also stop new research. Turning research off clears the extension's research cache and hides results. Already-started service lookups may finish; their results are discarded by the disabled client. Turning it off does not erase the separate server disk cache.

No API key is required to fetch a configured official posting or policy URL. For broader source discovery, set `BRAVE_SEARCH_API_KEY` in the local `.env` and restart the service. The extension never loads that file or receives the key. The integration uses Brave's documented [web search endpoint](https://api-dashboard.search.brave.com/app/documentation/web-search) and [server-side authentication](https://api-dashboard.search.brave.com/documentation/guides/authentication). No search account is created, subscription purchased, or credential supplied by this implementation.

## Current coverage

The default registry contains only the exact name **Atlassian**, associated with `atlassian.com` using its [official careers page](https://www.atlassian.com/company/careers). It does not treat every subsidiary or legal entity containing “Atlassian” as the same employer. No company-wide sponsorship policy or historical counts are preloaded. The public careers page was successfully retrieved through the live fetcher during validation; broad live-site accuracy and paid search have not been validated.

Missing employer identification produces a message rather than guessing. Unverified employers return an unmatched result. Without a search key, the service checks only the current URL if it is on that employer's verified domain, configured policy URLs, and imported history. Search snippets are discovery leads only. Official sources must be fetched before they can supply quoted evidence; unreadable, JavaScript-only, PDF, or blocked sources remain unavailable.

## Verify employer mappings

Use `RESEARCH_EMPLOYERS_FILE` to point to a reviewed JSON array. The default is `server/employers.json`. Each entry has:

```json
{
  "name": "Exact employer name",
  "aliases": [],
  "domains": ["employer.example"],
  "verificationUrl": "https://employer.example/about",
  "verifiedAt": "2026-09-25T00:00:00Z",
  "policies": [
    {
      "url": "https://employer.example/careers/faq",
      "location": "US",
      "scope": "State the actual program/location covered by this source"
    }
  ],
  "history": []
}
```

This is a schema example, not real employer evidence. Check the legal entity and its official source before adding an entry or alias. Do not collapse parents, subsidiaries, staffing agencies, and end clients. Duplicate names/aliases are rejected. Employer matching normalizes casing and whitespace, but does not remove legal suffixes or use fuzzy substring matching. Domain mappings are a curated trust input, not proof inferred from search ranking.

The same-vacancy classifier requires matching employer and title, plus a matching role identifier when supplied, otherwise an exact sanitized source address. A contradictory role identifier cannot be overridden by a matching URL. Policies found through search use a verified domain and policy-like address, but their relevance to the specific role, program, and location remains explicitly unconfirmed. Another identifiable vacancy is not relabeled as company policy.

## Historical records

Historical support is a reviewed-data adapter, not a live USCIS crawler. To add a record, obtain an official employer dataset, verify the legal entity and location, and add a `history` entry with these fields:

| Field | Meaning |
| --- | --- |
| `employer` | Exact registry name; registry validation rejects other entities |
| `year` | Dataset fiscal year |
| `approvals` | Nonnegative integer count of approved petitions from the selected dataset; document which approval columns were included |
| `sourceUrl` | HTTPS link to the actual official USCIS dataset/source |
| `retrievedAt` | When the data was obtained, not the current lookup time |
| `location` | State/city scope used for the entity match |
| `matchNote` | How the employer and location were verified, and the aggregation/count definition |

No synthetic history is included in the production registry. Automated tests use explicitly fictitious records. The [USCIS reporting documentation](https://www.uscis.gov/sites/default/files/document/reports/ola_signed_h1b_characteristics_congressional_report_FY24.pdf) describes employer petition activity; it does not establish sponsorship for a new vacancy. Even a positive count cannot imply current-role sponsorship or CPT/OPT acceptance. Zero or missing data cannot establish refusal. When no reviewed dataset is configured, the UI says historical sponsorship was not checked.

## Data flow and retention

The extension sends only employer, title, role ID, location, and source URL with query/fragment removed. It excludes the full page text, form answers, uploaded documents, and resumes. The service fetches public sources; when configured, Brave receives search terms containing the employer and role details. Search credentials stay on the server. Source text is untrusted: scripts do not run and rendered results use text content, never page-supplied markup.

The background worker uses session storage for pending leases and up to 50 cached requests, allowing recovery after worker suspension. This follows Chrome's guidance to [persist worker state](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle). Pending leases expire after 25 seconds and client polling is bounded. Late results are discarded on role changes, pause, or opt-out. The backend deduplicates concurrent requests and stores atomic cache files keyed by role, registry revision, and search mode.

Successful results are reused for 24 hours; unavailable results for one minute. Server files live in `.research-cache` (or `RESEARCH_CACHE_DIR`), are ignored by Git, and are bounded to approximately 200 entries. Expired files are removed during later requests, not by a wall-clock deletion guarantee. Stop the service and remove that cache directory to erase its saved role metadata and source excerpts. Editing the registry invalidates prior entries for reuse.

## Security and operation

The service accepts JSON POST requests only from the configured extension origin and the fixed loopback host. It rejects website origins, oversized bodies, and excessive concurrent/rate-limited requests. Outbound source retrieval allows HTTPS only on reviewed domains, checks DNS for private addresses, pins the validated address for TLS, revalidates redirects, and limits size/time. Search credentials are sent only to Brave's fixed API endpoint. No external server deployment is included; adding remote hosting needs separate authentication and deployment work.

`RESEARCH_EXTENSION_ID` overrides the default ID derived from the real `dist/` path. Use it if Chrome shows a different extension ID. `RESEARCH_EMPLOYERS_FILE` and `RESEARCH_CACHE_DIR` are optional server-only settings. Changes require restarting the service. The popup's retry action reuses a fresh cache entry; it does not force an external re-fetch.

## Verification

- `pnpm check`: source type checking, unit/regression tests, build.
- `pnpm test:research`: real extension worker → local HTTP service → fixture source integration, using an isolated temporary browser and cache. No external searches. Port 4318 must be free; stop your running research service first.
- `pnpm test:browser`: existing scanning, popup, panel, zoom, privacy, and navigation checks with research off by default.
- `pnpm test:popup`: actual toolbar sizing before and after onboarding.

Integration tests cover opt-in, CORS rejection, request minimization, source/history separation, cache reuse, opt-out, and an offline service without losing local findings. Unit tests cover exact matching, conflicting role IDs, source validation, worker restarts, expired leases, stale results, private-address rejection, disk persistence, and discovery of policy pages. Optional host access is pregranted only in the integration test's disposable extension copy; the shipped manifest requests it when the user enables research.
