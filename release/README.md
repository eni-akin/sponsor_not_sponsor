# Release preparation — 0.6.0

Section 6 prepares a reviewable private preview package. It does not certify independent accuracy or publish a store listing.

## Build and install

Run `pnpm check`, then `pnpm package`. The package command rebuilds the extension, verifies version/manifest assets/icon dimensions, archives only an explicit runtime allowlist, verifies the archive's entries and hashes, and writes:

- `release/sponsor-not-sponsor-0.6.0.zip`
- `release/sponsor-not-sponsor-0.6.0.zip.sha256`
- `release/sponsor-not-sponsor-0.6.0.zip.inventory.json`

Unzip into a new folder and load that folder through Chrome's **Load unpacked** control. The manifest must be at the extracted folder's root. Existing development installs can continue loading `dist`; reload the extension and job tabs after rebuilding. The archive excludes source, tests, `.env`, API keys, node_modules, reports, and research caches. It contains no separate research backend.

Icons are checked-in generated PNGs; ordinary builds do not require a browser. `pnpm assets` regenerates them from the code-native SVG and makes the promotional image. `pnpm screenshots` captures the real built UI on the labeled fictional demonstration. Browser tooling uses an isolated profile and local fixtures.

## Verification commands

```sh
pnpm check
pnpm test:browser
pnpm test:popup
pnpm test:research
pnpm package
pnpm screenshots
pnpm release:verify
```

`pnpm release:verify` rebuilds and packages, extracts into a fresh temporary directory, runs the browser/popup checks against that extracted copy, captures store screenshots, checks help/privacy layout, and records the archive hash in `release/validation.json`.

The research smoke test needs port 4318 free. Do not stop another service without checking its owner. To test the archive itself, unpack it into a temporary directory and set `EXTENSION_DIR` for `pnpm test:browser` and `pnpm test:popup`. The default remains `dist`.

## Changes

- Version 0.6.0, extension/action icons, and minimum Chrome version 120.
- Bundled help and privacy pages linked from the popup; onboarding and research consent retained.
- User-facing preview description replaces internal section numbering.
- Explicit-allowlist ZIP packaging with file inventory and SHA-256 checksum.
- Store listing draft, permission explanations, reviewer instructions, real UI screenshots, and promotional artwork.
- Major sponsorship wording recognition work recorded in section 7F for later implementation.

## Before public submission

- Complete section 4's independently reviewed real-world beta and human accessibility review. Existing authored regression examples are not independent validation.
- Review the declared limitations: employer identification (including the observed Atlassian miss), embedded jobs, bounded English interpretation, and research source access/coverage. The preview keeps these limits visible.
- Supply the publisher identity/support contact, publish an accurate privacy-policy page, and provide optional-service setup/source access. Add those real URLs to the listing; no placeholder URL should be submitted.
- Review the generated package, screenshots, listing, and dashboard data-use declarations. Decide the release audience and submit through the publisher's own account when ready.

These publication tasks remain open. No store submission, hosted backend, policy hosting, paid search, or broad accuracy claim is included.

## Validation recorded September 26, 2026

- TypeScript checks and all 147 automated tests pass; the production build succeeds.
- The archive contains exactly 13 allowlisted runtime files. Version, manifest references, PNG dimensions, extracted bytes, and hashes pass verification.
- The extracted ZIP passes the existing browser suite, including navigation, controls, evidence, privacy, narrow/short layouts, and zoom. Both new popup links are present.
- Real toolbar width remains 400 pixels with onboarding visible and dismissed, with no horizontal overflow.
- Actual UI screenshots, icons/promotional artwork, and narrow help/privacy renders were visually reviewed. Both document pages fit a 390-pixel viewport.
- The additional research integration rerun could not bind port 4318 because a service was already using it. That service was left untouched. Research unit tests passed; prior section 5 integration results are not represented as a fresh run.

This workstation's pnpm dependency preflight reports changed workspace structure after the package version update. Validation used `pnpm --config.verify-deps-before-run=false check` with the existing locked dependencies; browser/package scripts were invoked directly with Node. No dependencies or lockfile were changed. For a fresh checkout, run the documented frozen-lockfile install first. If retaining this installation until its dependency metadata is refreshed, `node scripts/package.mjs` builds the package without triggering pnpm's automatic reinstall.
