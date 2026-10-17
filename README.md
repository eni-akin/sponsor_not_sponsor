<picture>
  <source media="(prefers-color-scheme: dark)" srcset="design/logo-kit/digital/sns-horizontal-dark.svg">
  <img src="design/logo-kit/digital/sns-horizontal-color.svg" alt="SNS — Sponsor Not Sponsor" width="280">
</picture>

# Sponsor Not Sponsor

A Chrome extension that uses deterministic text rules to inspect a job posting for explicit sponsorship and eligibility statements, with quoted evidence. It reports the posting's wording; it does not determine personal immigration eligibility. Unsupported or conflicting wording stays unclear.

Current project state is summarized in [HANDOFF.md](HANDOFF.md). The stable labeling contract is [DECISION_LOGIC.md](DECISION_LOGIC.md), and the repository layout is documented in [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

## Install and use

1. Install Node.js 22.9+ and pnpm 11.19.0, then run `pnpm install --frozen-lockfile` and `pnpm check`.
2. Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select this project's `dist/` folder.
3. Open a job posting. The extension identifies a role, reads its public evidence, and displays a badge when it can isolate that role. Open the badge for the main result and its quotations: **Explicit blocker found**, **Sponsorship stated**, **No blocker found**, or **Could not verify**. Use the toolbar popup to pause scanning, disable it for the site, or show a dismissed badge.

Automatic scanning requires access to HTTP and HTTPS pages. Analysis runs in your browser without an analysis service. One verified visible embedded frame is supported, and a narrowly matched Ashby application can recover its official overview from the same website. Chrome internal and other protected pages cannot be scanned. The extension is a development preview; its authored examples do not establish real-world accuracy. No blocker found does not prove sponsorship is available.

The on-page badge and evidence panel prefer bottom-right, but can move to another corner around floating page tools. They reassess when overlays appear, move, or resize. If all corners are occupied, the least-obstructed corner is used; the toolbar popup remains an alternative. This does not move Chrome's own toolbar popup or detect other application windows.

The floating badge is pill-shaped with a soft SNS ember underglow matching the Scan again button, independent of the website's colours. On arrival, a highlight travels once around its edge over 1.4 seconds, then fades away. Relocation and closing the evidence panel do not replay it. Reduced-motion preferences skip the sweep; sponsorship-result colours stay unchanged.

To update an unpacked installation, reload it in `chrome://extensions`, then reload the job tab. For a packaged preview, run `pnpm package`; see [release instructions](release/README.md).

## Live audit results

On October 16, 2026, an AI reviewer inspected official posting evidence and compared it with the actual installed extension in an existing Chrome session. The sample contained **30 distinct active vacancies across 21 employers**, selected by the latest listing age in SimplifyJobs/Summer2027-Internships. Three duplicate portals were excluded from the first 33 listings inspected.

| Measure | Observed result |
| --- | ---: |
| Headline agreement, excluding one disputed reviewer label | 23/29 (79.3%) |
| Headline agreement with the correct vacancy title, same subset | 22/29 (75.9%) |
| Headline agreement on English U.S. postings | 18/19 (94.7%) |
| Blocker precision: correct blockers among displayed blockers | 10/10 (100%) |
| Blocker recall: detected blockers among reviewer-identified blockers | 10/15 (66.7%) |
| Description marked complete by the extension at the tested URL | 29/30 (96.7%) |
| Correct public employer identified | 13/30 (43.3%) |

Five blockers were missed: four correlated EA UK postings outside the intended U.S. scope and one Ryan U.S. posting. One incomplete Waabi application page safely returned **Could not verify**. A Synopsys page received the wrong job title. All ten displayed blocker decisions had source-bound quotations, but only six preserved the reviewed evidence fully; a matching headline does not certify complete citations or identity.

These are **sample agreement figures, not general accuracy or release approval**. The sample was selected, small, AI-reviewed, and included repeated employer/policy families. Qualcomm's export-license label remains disputed: counting it either way gives 23–24 headline matches out of all 30 (76.7–80.0%). Incorporating additional official pages for two Ryan vacancies lowers undisputed agreement to 21/29 (72.4%). No sponsorship-offer case occurred, so this audit cannot assess **Sponsorship stated** performance.

See the [full audit, case comparisons, and limitations](evaluation/live-2026-10-16/report.md) and [evaluation guidance](evaluation/README.md). Recompute saved counts and evidence hashes with `node evaluation/live-2026-10-16/verify.mjs`; this verifies the records, not a fresh browser run. Further independent human review remains required.

## Checks

`pnpm check` type-checks, runs unit tests, and builds `dist/`. Install Chromium once with `PLAYWRIGHT_BROWSERS_PATH=node_modules/.cache/playwright pnpm exec playwright install chromium`, then run `pnpm test:browser` for the smoke, adaptive-positioning, embedded-frame, overview, and cross-origin browser checks. `pnpm test:popup` separately checks actual toolbar popup sizing.

Run `pnpm evaluate` or `pnpm evaluate:regression` for authored-scenario reports. These are development/regression checks, not independently reviewed job postings. See [evaluation limits and review protocol](evaluation/README.md).

## Deferred work

Company research has been removed from the extension's active flow. Its backend and configuration remain in the repository for possible later work; no company research currently runs from the extension. Research settings in `.env.example` are deferred backend configuration.

The current roadmap is [PLAN.md](PLAN.md). The earlier plans remain available as historical records: [implementation history](IMPLEMENTATION.md), [detection improvement history](DETECTION_IMPROVEMENT_PLAN.md), [job recognition extraction history](JOB_RECOGNITION_EXTRACTION_PLAN.md), and [original product plan](job-sponsorship-extension-plan.md).
