# Chrome Web Store publishing action plan

For the current 1.0.1 patch package and update steps, see [UPDATE-1.0.1.md](UPDATE-1.0.1.md). The original 1.0.0 preparation checklist below is historical; the owner reports its dashboard submission steps completed.

Updated: October 18, 2026
Release candidate: Sponsor Not Sponsor 1.0.0
Current decision: **No-go until every required owner row in Lane B is complete.**

Use the paste-ready [Developer Dashboard submission worksheet](CHROME_WEB_STORE_DASHBOARD_WORKSHEET.md) for the exact fields prepared from the current package and policy audit.

## Lane A — agent-executable work

These tasks can be completed from the repository without publisher credentials or an owner policy decision.

| Required | Work | Status | Evidence |
| :---: | --- | --- | --- |
| Yes | Build, package, and test the exact release candidate. | **Complete for current ZIP** | `release/sponsor-not-sponsor-1.0.0.zip`; `release/validation.json`; SHA-256 `b18f37588e30bcc47642480c8328e8dcb7682059e7159722e6e35ff6c56f2b38`. Typecheck, 208 unit tests, production build, and seven extracted-package checks passed. |
| Yes | Audit manifest permissions, bundled code, privacy disclosure, listing copy, screenshots, and package contents against official Chrome Web Store policy. | **Complete for current ZIP** | `docs/chrome-web-store-publication-readiness.md` records the October 17 audit. Manifest V3, bundled executable code, `storage`, broad HTTP/HTTPS content-script access, assets, and disclosure coverage were checked. |
| Yes | Prepare accurate listing and dashboard text without unsupported quality claims. | **Complete** | `release/STORE_LISTING.md` and `release/CHROME_WEB_STORE_DASHBOARD_WORKSHEET.md`. Independent validation remains explicitly pending. |
| Yes | Prepare host-ready privacy, support, homepage, and fictional reviewer-demo pages without publishing them. | **Complete; owner values required before deployment** | `release/public-site/`; template validation passes and `--release` intentionally blocks until publisher name and support email are supplied. |
| Yes | Complete the automated accessibility preflight and document the remaining human-only review. | **Complete** | `docs/accessibility-preflight-2026-10-17.md`; popup, badge/panel, help, and privacy checks cover keyboard behavior, focus, reflow, contrast, reduced motion, and forced colours. |
| Recommended | Audit the 128×128 Store icon against Chrome's visual-weight guidance. | **Complete** | The approved regular tile is exported at 96×96 with a 16 px transparent inset. Generated copies match and the packaged alpha bounds are regression-tested. |
| Yes | Regenerate package evidence after any package-affecting change. | **Complete after Store-icon correction** | `pnpm --config.verify-deps-before-run=false check`, `node scripts/release-verify.mjs`, and `git diff --check` passed; the regenerated archive SHA-256 is recorded above. |

Lane A completion does not authorize upload, submission, publication, quality claims, or changes to the publisher account.

## Lane B — explicit owner input or action

These tasks require publisher credentials, a human review, a public hosting decision, or explicit owner approval. An agent may prepare materials but cannot truthfully complete them from repository evidence.

| Order | Required | Owner action/input | Completion evidence | Status |
| ---: | :---: | --- | --- | --- |
| 1 | Yes | Complete the registered independent human-reviewed real-world validation gate. | Acceptance record meets `evaluation/part2/acceptance.md`; limitations remain documented. | **Open** |
| 2 | Yes | Complete a human accessibility review of popup, badge, evidence panel, help, and privacy surfaces. | Signed checklist covers keyboard, focus, zoom, contrast, reduced motion, forced colours, and screen-reader clarity. | **Open** |
| 3 | Yes | Confirm publisher registration, verified and monitored contact email, accepted agreements, and two-step verification. | Developer Dashboard account settings reviewed by the publisher. | **Open** |
| 4 | Yes | Choose the HTTPS hosting destination; approve and publish the prepared `release/public-site/site/` pages. Publisher: Eniola Akinpelumi. Support: eni.akinpel@gmail.com. | GitHub Pages is enabled with HTTPS enforced; release validation passes; homepage, privacy, support, and demo URLs return HTTP 200. | **Complete** |
| 5 | Yes | Decide whether to provide optional separate support and homepage URLs beyond the prepared public site. | The published GitHub Pages site supplies both URLs and the monitored support email. | **Complete** |
| 6 | Yes | Review and save every Store Listing, Privacy, and Distribution field using the submission worksheet and exact 1.0.0 ZIP. | Dashboard has no incomplete required fields and saved values match the worksheet/package. | **Open** |
| 7 | Yes | Choose visibility, geographic distribution, and automatic or deferred publishing. | Choices are recorded in the worksheet and dashboard. | **Open** |
| 8 | Recommended | Approve the prepared fictional demonstration page and provide its deployed URL for reviewer instructions. | `https://eni-akin.github.io/sponsor_not_sponsor/demo.html` loads without authentication and contains the verified fixture for **Explicit blocker found**. | **Complete** |
| 9 | Recommended | Review the 128×128 icon at Store scale and decide whether the approved full-canvas mark needs more transparent padding. | **Agent audit complete:** the regular rounded-square tile did not qualify for Chrome's irregular-mark exception. The unchanged approved artwork is now a 96×96 footprint with 16 px transparent padding; generated copies match and the packaged PNG alpha bounds are regression-tested. Owner approval remains part of row 10. | **Complete** |
| 10 | Yes | Confirm trademark/name/logo/screenshot rights and approve the listing copy, declarations, screenshots, and exact archive. | Dated owner sign-off names version 1.0.0 and the current SHA-256. | **Open** |
| 11 | Yes | Upload only the approved archive and confirm the dashboard parsed version and permissions correctly. | Dashboard shows version 1.0.0, `storage`, and HTTP/HTTPS page access; uploaded archive matches the signed-off SHA-256. | **Open** |
| 12 | Yes | Submit for review and monitor the verified publisher email. | Submission receipt and review status are recorded; reviewer questions are answered. | **Open** |

## Final go/no-go gate

Submit only when:

- every required Lane B row is complete;
- public disclosures, dashboard answers, listing copy, screenshots, and the uploaded ZIP describe the same behavior;
- any package-affecting change has triggered a fresh Lane A verification and SHA-256;
- the owner has approved the exact archive and chosen the publication timing.

Automated tests and the AI-reviewed diagnostic audit do not replace Chrome Web Store review, human accessibility review, or the registered independent real-world validation gate.
