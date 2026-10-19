# Release preparation — 1.0.0

This prepares a reviewable deterministic extension package. Store submission and independent accuracy validation remain separate steps.

## Build and install

Run `pnpm check`, then `pnpm package`. Packaging rebuilds the extension, checks versions and manifest permissions/assets, and writes:

- `release/sponsor-not-sponsor-1.0.0.zip`
- `release/sponsor-not-sponsor-1.0.0.zip.sha256`
- `release/sponsor-not-sponsor-1.0.0.zip.inventory.json`

The archive contains 14 allowlisted runtime files, including the local logo SVG. Its entries and hashes are verified. It excludes source, tests, credentials, local environments, caches, and backend services.

Unzip into a new folder and load that folder in Chrome through **Load unpacked**. The manifest must be at the folder's root. Development installs can load `dist/`; reload the extension and job tabs after rebuilding.

## Verification

```sh
pnpm check
pnpm test:browser
pnpm test:popup
pnpm package
pnpm release:verify
```

`pnpm release:verify` tests a freshly extracted archive with seven checks: smoke, adaptive positioning, embedded-frame, overview, cross-origin, actual-toolbar-sizing, and screenshot/help/privacy. The positioning check covers late closed-shadow overlays, moving inner tools, transparent full-screen hosts, iframe helpers, removal, focus, viewport resizing, and the pill badge's one-shot 1.4-second arrival tracer. It also checks the shared ember button/glow accent, independence from website colour changes, unchanged result colours, reduced motion, and natural animation completion without replay on relocation or panel close. The run records the archive hash and completed checks in `release/validation.json`. Browser tools use disposable profiles and local fictional fixtures.

Icons are checked-in PNGs. `pnpm assets` regenerates 16/32 px icons from `extension/icons/source-small.svg`, 48/128 px icons from `extension/icons/source.svg`, and the store promotion from `extension/icons/logo.svg`. `pnpm screenshots` captures the current built UI on the fictional demonstration. Ordinary builds require no asset regeneration. The approved SNS identity, light/dark README artwork, and usage rules are in the [logo kit](../design/logo-kit/GUIDE.md). Brand colours do not replace semantic result colours.

## Before public submission

Complete independently reviewed real-world validation and human accessibility review. Review the limited English wording and layout coverage; authored regression results are not an independent accuracy estimate.

Supply the publisher identity/support contact and a public privacy-policy page matching the bundled disclosure. Review the package, current screenshots, [listing draft](STORE_LISTING.md), and dashboard data-use declarations before submitting through the publisher's account.

Company research remains inactive in the extension. No local backend or optional service permission is needed.

## Current quality evidence

The [October 16 live audit](../evaluation/live-2026-10-16/report.md) completed 30 actual installed-extension comparisons. It recorded 23/29 undisputed headline agreements, five missed blockers, one safe incomplete-description abstention, a wrong-title result, and incomplete evidence in four of ten cited blocker decisions. Supported English U.S. headline agreement was 18/19; those 19 cases are a subset, not the entire audit.

This audit is diagnostic evidence, not completion of the [human-reviewed acceptance gates](../evaluation/part2/acceptance.md). The minimum sample/reviewer requirements remain unmet. The observed first-source blocker recall was 10/15 (66.7%), below the registered 90% target; including additional official pages for two same-vacancy Ryan postings lowers it to 10/17 (58.8%). The gates apply to a properly frozen human-reviewed evaluation, so these figures identify risks without granting or replacing that approval.

Before a quality claim, diagnose the supported-scope Ryan miss, resolve the disputed Qualcomm label and same-vacancy source boundary, and verify that identity and citation conditions are preserved. Four EA misses occurred outside intended U.S. scope and share one wording family; report that limitation rather than implying broad international support. No sponsorship-offer example was evaluated.

Keep technical package validation in `release/validation.json` separate from these quality results. Rerunning `release:verify` checks the packaged extension on local fixtures; it does not repeat the live audit or establish real-world accuracy. Use the dated report when describing measured behavior in the listing, rather than an unqualified success-rate claim.

## Existing dependency installation

If this workstation's pnpm preflight reports changed workspace metadata, `pnpm --config.verify-deps-before-run=false check` uses the installed locked dependencies. `node scripts/package.mjs` and `node scripts/release-verify.mjs` also run directly. For a fresh checkout, install with `pnpm install --frozen-lockfile`.
