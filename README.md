# Sponsor Not Sponsor

A local-first Chrome extension that inspects a job posting and shows separate sponsorship, CPT, and OPT findings with quoted evidence. It reports the posting's wording; it does not determine personal immigration eligibility. The default uses text rules, and unsupported or conflicting wording stays unclear.

Current project state is summarized in [HANDOFF.md](HANDOFF.md). The stable labeling contract is [DECISION_LOGIC.md](DECISION_LOGIC.md), and the repository layout is documented in [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

## Install and use

1. Install Node.js 22.9+ and pnpm 11.19.0, then run `pnpm install --frozen-lockfile` and `pnpm check`.
2. Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select this project's `dist/` folder.
3. Open a job posting. The extension identifies a role, reads its visible evidence, and displays a badge when it can isolate that role. Open the badge to inspect the sponsorship, CPT, and OPT findings. Use the toolbar popup to pause scanning, disable it for the site, or show a dismissed badge.

Automatic scanning requires access to HTTP and HTTPS pages. Page text stays in memory and is not sent to a service by the default rules. One verified visible embedded frame is supported. Chrome internal and other protected pages cannot be scanned. The extension is a development preview; its authored examples do not establish real-world accuracy.

To update an unpacked installation, reload it in `chrome://extensions`, then reload the job tab. For a packaged preview, run `pnpm package`; see [release instructions](release/README.md).

## Checks

`pnpm check` type-checks, runs unit tests, and builds `dist/`. Install Chromium once with `PLAYWRIGHT_BROWSERS_PATH=node_modules/.cache/playwright pnpm exec playwright install chromium`, then run `pnpm test:browser` for the smoke, embedded-frame, overview, and cross-origin browser checks. `pnpm test:popup` separately checks actual toolbar popup sizing.

Run `pnpm evaluate` or `pnpm evaluate:regression` for authored-scenario reports. These are development/regression checks, not independently reviewed job postings. See [evaluation limits and review protocol](evaluation/README.md).

## Deferred work

Company research has been removed from the extension's active flow. Its backend and configuration remain in the repository for possible later work; no company research currently runs from the extension. Research settings in `.env.example` are deferred backend configuration.

Local Laya is an experimental, opt-in comparison that runs a separate local model service for sponsorship, CPT, and OPT decisions. The deterministic result remains the compact badge result; Laya does not evaluate citizenship, work authorization, export controls, or other rule restrictions. Its quality is not established, and development results are distinct from integration checks. See [local model setup and limitations](server/DECISIONS.md) if you want to work on that path.

The current roadmap is [PLAN.md](PLAN.md). The earlier plans remain available as historical records: [implementation history](IMPLEMENTATION.md), [detection improvement history](DETECTION_IMPROVEMENT_PLAN.md), [job recognition extraction history](JOB_RECOGNITION_EXTRACTION_PLAN.md), and [original product plan](job-sponsorship-extension-plan.md).
