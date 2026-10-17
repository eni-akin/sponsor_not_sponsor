# Sponsor Not Sponsor — deterministic publication handoff

Updated: October 17, 2026 (America/Chicago)

For the latest session checkpoint, final ember glow/1.4-second animation, verified package, and remaining owner decisions, start with [HANDOFF-2026-10-17.md](HANDOFF-2026-10-17.md). The history below provides the earlier cleanup and implementation context.

## Current direction

Prepare the current deterministic extension for publication on `master`. Preserve the accumulated deterministic rules and scanning improvements. This is a focused removal of the experimental classifier integration, not a rollback to an older branch.

## Product behavior

The current posting's extracted public evidence feeds `interpretJob`, then `mainDecision` supplies the badge and the popup/page-panel result. Headlines are Explicit blocker found, Sponsorship stated, No blocker found, and Could not verify. Sponsorship, timing, CPT, OPT, and separate eligibility restrictions retain their existing meanings in [DECISION_LOGIC.md](DECISION_LOGIC.md).

Scanner improvements include vacancy identity checks, same-origin and bounded cross-origin frame reading, frame lifecycle protection, structured job data, and matched Ashby overview recovery. Preserve exact citations, private-answer exclusions, pause/site controls, incomplete-description handling, and diagnostic exports.

Company research remains deferred; its existing backend and unit tests are retained.

## Cleanup completed

The experimental runtime, comparison controls, service permission and transport, classifier-specific types, dataset/training tools, artifacts, and obsolete workflow documents were removed. Existing deterministic source and evaluation documentation were retained and updated where needed.

All 230 removed files, including uncommitted planning and review work, were preserved in a source archive outside the repository and restore-verified byte-for-byte before removal. Ignored local environments and weights remain on disk and are not used or bundled by the extension. Git history and branch pointers are unchanged.

## Verification and publication

Use [README.md](README.md) for local setup and [release/README.md](release/README.md) for packaging. Automated checks exercise authored fixtures and exposed development evidence. Independent real-world validation and human accessibility review remain outstanding.

Verified October 16, 2026:

- Typecheck, 205 unit tests, and production build passed through `pnpm --config.verify-deps-before-run=false check` using existing dependencies.
- The four reviewed deterministic development cases retained their expected headlines and restriction types, with zero citation errors.
- `node scripts/release-verify.mjs` passed all six browser/package checks against the extracted archive, including embedded frames, overview recovery, cross-origin lifecycle, actual popup sizing, and help/privacy layout.
- A saved opt-in from the removed feature had no effect, and fixture scans made no analysis-service requests.
- The packaged text assets contain no classifier implementation or settings; the archive hash matches `release/validation.json`.
- Deterministic interpreter, policy-scope helper, controller, and existing interpreter/scanner/frame regression files remain byte-identical to the starting commit. Local Markdown links and `git diff --check` passed.

No commit, push, default-branch change, or public submission is part of this cleanup. Further product changes follow a separate owner request.

## Current validation task

The 30-vacancy installed-extension diagnostic audit is complete in [evaluation/live-2026-10-16/report.md](evaluation/live-2026-10-16/report.md). It found 23/29 undisputed headline agreements and 22/27 on the scannable decision-quality subset. Blocker precision was 10/10 and recall 10/15: the five misses were four correlated EA UK vacancies outside supported U.S. scope and Ryan C27. Supported-scope headline agreement was 18/19. One incomplete Waabi application page safely produced `Could not verify`, one Synopsys page selected the wrong title, public employer identity matched 13/30, and four of ten cited blocker decisions had semantically partial main evidence despite all ten being exact source substrings. Qualcomm C02 remains disputed and is excluded from undisputed quality totals.

This AI-reviewed, selected 30-case diagnostic is separate from the registered minimum 50-vacancy/20-employer human-reviewed release gate and does not establish general accuracy. Product fixes are not authorized by this audit request.

## Approved branding

The owner selected “Between” (concept C), approved the SNS identity kit, and authorized its integration. The new artwork appears in the README (light/dark variants), Chrome icons, popup, on-page badge/evidence panel, and help/privacy pages. Asset generation uses the small cut at 16/32 px and detailed mark at 48/128 px; the build bundles on-page SVGs inline without new permissions or image requests. See the [kit guide](design/logo-kit/GUIDE.md) and its integration checks. Sponsorship rules, result colours, and evaluation artifacts are unchanged by branding work. Release readiness, trademark clearance, and public submission remain separate.

The branded build passed typecheck, all 206 unit tests (including artwork parity), and all six packaged-extension release checks. The new archive contains 14 allowlisted runtime files, including the logo SVG. Store screenshots and promotional artwork were regenerated and inspected. The owner's existing Chrome session was not changed; reload the installed extension and job tabs to use the new assets.

On October 17, the owner also requested matching UI and button colours. Popup, on-page badge/panel, and help/privacy surfaces now use paper/ink neutrals, ember primary actions, warm secondary controls, and matching links/focus rings. Semantic sponsorship-result colours, warnings, layouts, and all analysis logic remain unchanged. See the [UI palette](design/logo-kit/GUIDE.md#extension-ui).

The palette follow-up passed typecheck, 206 unit tests, all six packaged-extension checks, computed theme/result-colour assertions, and contrast checks for enabled controls and supporting text. The release archive/validation record and UI screenshots were refreshed. No live-job audit was rerun or public submission performed.

## Adaptive on-page placement — October 17, 2026

The owner requested avoiding other floating tools, specifically Simplify. Replaced the hard-coded bottom-right placement for both the badge and evidence panel with four-corner obstruction scoring. Bottom-right remains the clear-space preference; when every corner has an obstruction, choose the least-obstructed one deterministically. Hit-tests inspect geometry/styles only, ignore SNS itself, and avoid treating normal page flow as an overlay. Document mutations, UI resizing, scroll/resize, and a 500 ms visible-tab fallback cover late overlays and closed-shadow/CSS-only changes. Observers and the timer are disposed with the UI.

The original local overlap test failed before the fix, then passed. Typecheck, 208 unit tests, and all seven extracted-package checks passed, including the new `scripts/browser-positioning.mjs`. Tests cover badge/panel relocation, closed-shadow movement, transparent shells, iframe tools, returning to the default corner, keyboard focus, and resize. Existing frame lifecycle, privacy, zoom, and UI regressions remain passing. The on-page panel can close when an iframe change invalidates the role; this existing scan-safety behaviour was preserved rather than bypassed for a placement test.

The actual Chrome session showed Simplify Copilot installed but disabled. Permission was requested to temporarily enable it and restore its disabled state; real Simplify overlap verification is pending that approval. No Simplify setting was changed. The local tool fixtures are not a claim of live Simplify compatibility. Nine-point corner sampling is a bounded heuristic, not a guarantee against every narrow overlay; browser toolbar popups, other app windows, and screen-wide modal obstructions cannot be made clear by choosing another page corner.

The owner subsequently reported testing the placement successfully. This is owner-reported confirmation, not an additional agent-run live audit; no Simplify setting was changed by the agent.

## Pill badge arrival interaction — October 17, 2026

The owner requested a pill-shaped floating badge, soft underglow, and exactly one perimeter sweep fading into the static glow. The existing badge now has fully rounded ends and a decorative SVG tracer that follows its measured outline. Its normalized perimeter is 100 units; the browser animates the dash offset from 0 to -100 once with a gentle opacity fade. On follow-up, the owner requested matching the Scan again button instead of the website theme and a faster sweep: duration is now 1.4 seconds, down from 2.4. No JS animation loop or new dependency was added. See the platform references for [SVG path length](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/pathLength) and [element animation](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate).

The glow and Scan again button now share the `--sns-accent` ember token (`#C94F32`) in the on-page stylesheet. The previous website-theme sampler, hidden colour probe, and theme listener were removed; website colours no longer affect the glow. There are no new network requests or permissions. Sponsorship colours, analysis, and evidence panel layout remain unchanged.

The tracer starts only on the first visible badge for the current role, not on ordinary result updates, relocation, or evidence-panel close. Hiding/opening the panel cancels an in-progress sweep. Reduced motion skips it, and reduced-motion/forced-colour CSS hides the decorative trace immediately. Its overlay cannot capture clicks or keyboard focus; disposal cancels the animation.

The initial interaction passed typecheck, all 208 unit tests, production build, and all seven extracted-package checks. The faster ember follow-up retains checks for a single normalized circuit, halfway position, matching pill geometry, natural completion/fade, no replay, reduced motion, unchanged result indicators, and existing placement/focus cases; website theme sampling checks were replaced with button/glow accent parity and website-colour independence. A mid-sweep screenshot is saved at `test-results/badge-arrival.png`. No live-site animation audit, commit, push, or public submission was performed.

The faster ember follow-up also passed typecheck, all 208 unit tests, production build, and all seven extracted-package checks. The updated ember screenshot was visually inspected, and the release archive, validation record, and store screenshots were refreshed.
