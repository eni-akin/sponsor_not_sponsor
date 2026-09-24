# Sponsor Not Sponsor

A local-first Chrome extension for inspecting job sponsorship requirements. **Section 1 is a scanner preview:** it identifies a job and displays extracted text. Sponsorship, CPT, and OPT classifications will be added in section 2.

See [the six implementation sections](IMPLEMENTATION.md) and [the original plan](job-sponsorship-extension-plan.md).

## Try the built extension

1. Open `chrome://extensions` in Chrome and enable **Developer mode**.
2. Choose **Load unpacked** and select this project’s **`dist`** folder.
3. Open or reload a job posting, then click **Sponsor Not Sponsor** in the extensions menu.
4. Inspect the detected title, metadata, extracted passages, and incomplete-content warnings. Use the popup to pause scanning or disable it on the current website.

The extension asks for access to HTTP and HTTPS pages so it can scan automatically. Scanning runs in the top-level page only. It does not send network requests, use AI, or require an API key. Only pause/site preferences are persisted; page text stays in memory. Chrome internal pages and other protected pages are unavailable. Reload existing website tabs after installing or reloading the extension.

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

The Python environment is ready for future Python tooling; the extension uses TypeScript and does not require Python packages. `.env` is reserved for local tooling and is **not loaded or bundled into the extension**. `APP_ENV=development` is an initial placeholder, not an active feature flag. Future research-service secrets must remain on the backend.

## Build and test

Install Node.js 22 or later and pnpm 11.19.0 (the pinned package manager), then:

```sh
pnpm install --frozen-lockfile
pnpm check
```

This type-checks the source, runs the scanner/controller tests, and builds the unpacked extension in `dist/`. The build copies only the manifest, popup assets, and bundled TypeScript entry points. Dependencies are locked in `pnpm-lock.yaml`; only esbuild’s installation script is allowed.

For the real-browser smoke test:

```sh
PLAYWRIGHT_BROWSERS_PATH=node_modules/.cache/playwright pnpm exec playwright install chromium
pnpm test:browser
```

This launches a temporary browser profile, serves only local fixtures, loads the built extension, tests the popup and navigation, and writes `test-results/scanner-popup.png`. It does not modify your personal Chrome profile.

## Project layout

| Location | Purpose |
| --- | --- |
| `src/scanner.ts` | Role detection and safe text extraction |
| `src/controller.ts` | Page changes, navigation, and in-memory scan lifecycle |
| `src/content.ts` | Extension messaging and saved preferences |
| `src/types.ts` | Scan records and future interpretation contracts |
| `src/popup.ts`, `extension/` | Inspection interface and manifest |
| `tests/` | Scanner/controller tests and local HTML fixtures |
| `scripts/` | Build and browser verification |

The preview deliberately favors an unreadable or ambiguous result when it cannot isolate a role. Support for more layouts, embedded forms, and reliable posting-to-application matching remains future work; this build makes no broad accuracy claim.
