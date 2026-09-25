# Sponsor Not Sponsor

A local-first Chrome extension for inspecting job sponsorship requirements. **Sections 1–3, Section 4's evaluation tooling/reliability fixes, and Section 5's company research preview are implemented.** The extension explains separate sponsorship, CPT, and OPT findings with exact quotations. Optional research adds separately scoped official-source and historical context. Independent real-world beta validation remains pending.

See [the implementation roadmap](IMPLEMENTATION.md), [evaluation results and limitations](evaluation/README.md), and [the original plan](job-sponsorship-extension-plan.md).

## Try the built extension

1. Open `chrome://extensions` in Chrome and enable **Developer mode**.
2. Choose **Load unpacked** and select this project’s **`dist`** folder.
3. Open or reload a job posting. A compact badge appears when a specific role is detected. Click it to open the evidence panel; use Escape or the close button to return to the badge. The toolbar popup provides a first-use explanation of access, privacy, and controls.
4. Inspect the detected role and expand each finding for exact evidence, source attribution, and the scan date. Stated restrictions appear separately; unsupported or conflicting wording remains unclear.
5. Use **Scan again** for an immediate new scan with visible completion feedback. Cosmetic scrolling changes retain the stored result; new relevant text still triggers analysis. Pause and site controls work from both the panel and popup.
6. The badge’s **×** dismisses it for the current role until the page reloads. A different role gets its own badge. Use **Show on page** in the toolbar popup to restore a dismissed badge and open its panel.

**Updating an existing installation:** click the extension’s reload button in `chrome://extensions`, then reload the job-page tab. Version 0.5.0 displays “Research preview · Section 5 of 6” and retains the fixed-width toolbar popup.

The extension asks for access to HTTP and HTTPS pages so it can scan automatically. Scanning runs in the top-level page only and stays local. Optional company research starts off and requires explicit enablement plus access to the local research service. No AI is used. Preferences and welcome-screen status are persisted; page text stays in memory unless you explicitly download a report. Enabled research caches limited role metadata and public-source excerpts. Chrome internal pages and other protected pages are unavailable.

## Optional company research

Run `pnpm research:serve`, then enable **Company research settings → Enable automatic company research** in the popup. The disclosure explains the limited role details shared with the service. It checks unclear findings and presents sources separately without changing the posting's badge. Research failures leave local scanning available.

The preview includes one verified employer mapping (Atlassian), no preloaded historical records, and optional Brave Search integration requiring a server-side key for wider discovery. Other employers need reviewed mappings. See [research setup, data handling, and limitations](server/README.md). No API credentials or historical claims have been invented.

The badge checks four corners for room around application controls. If none is clear, it hides; the toolbar popup and **Show on page** remain available. The panel opens only on request, does not trap keyboard focus, and closes when you return to the webpage to type. Placement handles ordinary light-DOM controls; unusual embedded/shadow controls and complex layouts still need broader beta testing.

**Report incorrect result** opens a local download flow. Choose the issue and select **Download report**. The JSON file contains the role, findings and cited wording, scan date, and page address with query/fragment removed. It excludes settings, the full extraction, and application answers. No report is sent automatically; review the file before sharing it.

## Local environment

The project has a local `.env`, a shareable `.env.example`, and a Python `.venv`. Both `.env` and `.venv` are ignored by version control. Activate the Python environment with:

```sh
source .venv/bin/activate
```

On a fresh checkout, create those local files with:

```sh
python3 -m venv .venv
cp .env.example .env
```

The Python environment is ready for future Python tooling; the extension uses TypeScript and does not require Python packages. `.env` is loaded only by the research service and is **never bundled into the extension**. `APP_ENV=development` remains a tooling placeholder. Optional search credentials stay on the backend; see `.env.example` for settings.

## Build and test

Install Node.js 22.9 or later and pnpm 11.19.0 (the pinned package manager), then:

```sh
pnpm install --frozen-lockfile
pnpm check
```

This type-checks the source, runs the scanner/controller and interpretation tests, and builds the unpacked extension in `dist/`. The build copies only the manifest, popup assets, and bundled TypeScript entry points. Dependencies are locked in `pnpm-lock.yaml`; only esbuild’s installation script is allowed.

For the real-browser smoke test:

```sh
PLAYWRIGHT_BROWSERS_PATH=node_modules/.cache/playwright pnpm exec playwright install chromium
pnpm test:browser
```

This launches a temporary browser profile, serves only local fixtures, and tests the built extension’s popup, badge, panel, navigation, keyboard behavior, control avoidance, and report download. Screenshots and a sample report are saved in `test-results/`. It does not modify your personal Chrome profile.

Run `pnpm test:popup` to check actual toolbar-popup sizing in a temporary visible Chrome for Testing window. It verifies a 400-pixel width with and without onboarding, using Chrome's [popup-opening API](https://developer.chrome.com/docs/extensions/reference/api/action#method-openPopup). This catches automatic popup-sizing failures that opening `popup.html` in a normal tab cannot reproduce. Measurements are saved to `test-results/popup-sizing.json`; your personal browser profile is not used.

Section 4 adds short/narrow viewport and 200% browser zoom checks. Run `pnpm evaluate` for the development report and `pnpm evaluate:regression` for the exposed reserved set. Reports are saved in `evaluation/results/`. The 160 authored scenarios are engineering examples with provisional labels, not 160 independently reviewed real job postings. The original reserved result is preserved separately; subsequent runs are regression checks. See [the review protocol](evaluation/README.md) for the remaining beta-validation work.

## Project layout

| Location | Purpose |
| --- | --- |
| `src/scanner.ts` | Role detection and safe text extraction |
| `src/controller.ts` | Page changes, navigation, and in-memory scan lifecycle |
| `src/interpreter.ts` | Local policy rules, timing, restrictions, conflicts, and citations |
| `src/findings-view.ts` | Expandable findings and verbatim evidence |
| `src/page-ui.ts`, `src/page-ui.css` | Isolated on-page badge and evidence panel |
| `src/badge-state.ts` | Badge labels, colors, and placement |
| `src/report.ts` | Local report download, without automatic transmission |
| `src/content.ts` | Extension messaging and saved preferences |
| `src/background.ts`, `src/research*.ts` | Opt-in research coordination, request validation, caching, and source display |
| `server/` | Local research service, official-source retrieval, employer mappings, and historical-record adapter |
| `src/types.ts` | Scan records and future interpretation contracts |
| `src/popup.ts`, `extension/` | Inspection interface and manifest |
| `tests/` | Scanner/controller tests and local HTML fixtures |
| `evaluation/` | Authored corpus, reproducible metrics, error reports, and review protocol |
| `scripts/` | Build and browser verification |

The preview deliberately favors an unreadable or ambiguous result when it cannot isolate a role. The interpretation engine recognizes a bounded set of explicit English phrases; it is not a general language-understanding system. Unsupported wording appears for review, and company/history context does not establish this vacancy’s policy. Support for more layouts, embedded forms, and reliable posting-to-application matching remains future work; this build makes no broad accuracy claim.
