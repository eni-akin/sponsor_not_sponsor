# Sponsor Not Sponsor 1.0.1 — patch update

Prepared October 20, 2026 (America/Chicago).

## Changes

Fixed the floating badge and evidence panel bouncing between top-left and bottom-left when another tool occupies the right side and normal shadow-DOM page content sits underneath SNS. Shadow-root hit testing now excludes SNS itself after looking through page content.

The browser regression checks stability before expansion, while expanded, and after closing. Sponsorship interpretation, permissions, storage, and privacy behavior are unchanged.

## Validation

- `pnpm --config.verify-deps-before-run=false check`: typecheck, all 208 unit tests, and production build passed.
- `node scripts/release-verify.mjs`: all seven checks passed against the extracted 1.0.1 archive, including the new positioning regression.
- The original regression failed with two alternating positions before the fix and passed afterward.
- The fixed development build was tested on the live Marvell Workday vacancy with a simulated helper sidebar and shadow banner. The owner subsequently confirmed the fix in their installed extension. These are focused bug checks, not independent accuracy validation.

## Upload package

- Version: `1.0.1` in both `package.json` and `extension/manifest.json`.
- Archive: `release/sponsor-not-sponsor-1.0.1.zip`.
- SHA-256: `0ccbef3f7e84af2f42836a9b71bb2796c8690a1609de3af9887bf449f2081055`.
- Contents: 14 allowlisted runtime files, with `manifest.json` at the ZIP root.
- Machine-readable verification: `release/validation.json`.

The ZIP, checksum sidecar, and inventory are generated local release artifacts and remain ignored by Git, following the existing repository convention. To recreate them, run `node scripts/release-verify.mjs`; use the newly generated checksum when doing so.

## Next Chrome Web Store update

1. Open the existing item `gfddiacdchffgjbconhejkhbmkjmnaod` in the publisher dashboard.
2. Upload the 1.0.1 ZIP as an update to that item. Confirm the parsed version is 1.0.1 and permissions remain `storage` and HTTP/HTTPS page access.
3. Retain the existing listing, privacy declarations, reviewer demo URL, and chosen distribution settings. The refreshed submission worksheet identifies this package and checksum.
4. Suggested change note: “Fixed the floating badge and evidence panel jumping between corners when other floating tools and embedded page content are present.”
5. Submit the update for review using the owner's chosen publishing mode and retain its receipt/status.

This patch has been prepared locally for upload; no 1.0.1 dashboard upload or submission was performed.
