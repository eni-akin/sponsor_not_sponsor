# Implementation sections

This roadmap turns the original [development plan](job-sponsorship-extension-plan.md) into six core deliverable sections, followed by a deferred improvement section after the core project is complete. Initial scope: English-language U.S. job postings and applications across all employment types.

| Section | Work | Completion checkpoint | Status |
| --- | --- | --- | --- |
| **1. Foundation and page scanner** | Local environment, extension scaffold, shared data contracts, generic role detection, safe text extraction, page-change handling, inspection popup, starter fixtures | Load the extension, inspect a single role’s extracted text, and verify that navigation and form answers cannot contaminate that record | Implemented; validation recorded below |
| **2. Evidence-based interpretation** | Local rules for sponsorship, separate CPT and OPT, restrictions, negation, conditions, timing, questions, conflicting evidence | Every definitive finding cites an extracted passage; questions and silence remain unclear | Implemented as a local rules preview |
| **3. Everyday browsing interface** | Automatic on-page badge, accessible evidence panel, dismiss control, explicit restrictions, feedback action, onboarding; connect existing pause/site settings | End-to-end local prototype that explains findings without obstructing applications | Implemented; broader layout validation remains in section 4 |
| **4. Accuracy and reliability beta** | Approximately 150–200 manually reviewed examples, held-out evaluation, expanded layouts, accessibility and browser checks | Report precision, coverage, sample counts, and errors; aim for ≥95% definitive-label precision on held-out examples | Tooling and reliability fixes implemented; independent real-world review pending |
| **5. Company research** | Official vacancy and policy lookup, careful employer matching, historical context, backend credentials, persistent request/cache coordination, source dates, opt-in research | Sourced context that never converts historical activity into a promise about the current role | Planned |
| **6. Release preparation** | Production packaging, icons, onboarding and permission explanations, privacy disclosures, regression checks, store materials | Installable release ready for review and submission | Planned |
| **7. Post-completion detection improvements** | Embedded-frame scanning, recruiting-platform readers, stronger generic detection, recovery options, and detection coverage evaluation | Implement and evaluate the deferred detection plan after sections 1–6 are complete | Deferred until core project completion |

## Section 1: what is implemented

- Manifest V3 extension with a TypeScript content script and toolbar inspection popup.
- Five page categories: posting, application, multiple jobs, ordinary page, or unreadable.
- JSON-LD `JobPosting` support, including arrays and graphs, matched against a unique visible role title.
- Generic title, description-section, and application-action signals when structured data is absent. The URL is supporting information only.
- A single visible detail panel takes precedence over surrounding job cards. Ambiguous vacancy lists produce no combined record.
- Metadata and separately attributed text passages with page-location hints, stable role identity, scan timestamp, and completeness indicators.
- Exclusion of standard form values, uploads, editable answers, navigation, hidden content, and recognized recommendations.
- Debounced page updates; immediate record invalidation on relevant changes; address-change checks for single-page navigation; suppression of unchanged old content after navigation.
- Global pause and per-host disable settings. Text remains in the tab’s memory and is never automatically saved or sent to a server; section 3 adds an explicit local report download.
- Shared future finding types keep sponsorship, CPT, and OPT separate. Interpretation is deliberately not implemented in this section.

## Section 2: what is implemented

- A pure local interpretation module produces separate sponsorship, CPT, and OPT findings. No API calls, credentials, AI service, or new permissions are needed.
- Recognized explicit phrases handle negation, conditional sponsorship, adjacent conditions, application questions, timing, and conflicting statements. Silence remains unclear; no sponsorship refusal is used to infer CPT/OPT acceptance or exclusion.
- Exact quotations retain their original source block IDs and source attribution. Conflicts produce “Unclear” and “Needs review,” with both sources retained. Conditional CPT/OPT wording remains unclear for review.
- Current and future sponsorship are tracked separately. A future-only exclusion is labeled as such. Different policies at different times are distinguished from contradictory policies for the same period.
- Stated citizenship, permanent-residency, U.S.-person, work-authorization, and F1/J1 conditions are preserved in a separate requirements area. These statements do not determine a user's eligibility.
- Historical, explicitly company-wide, other-role, question, and unclassified wording stays separately inspectable. The screenshot’s two sentences are regression-tested: sponsorship unavailable, F1/J1 restriction preserved, no invented CPT/OPT conclusions.
- The popup shows all three findings with expandable explanations and evidence. Section 3 reuses these findings in the on-page panel.
- Cosmetic page changes compare scanner inputs before scheduling a new scan, so scrolling does not discard a result merely because classes or styles changed. Visibility changes that reveal job text still trigger analysis. Unchanged manual scans preserve the evidence list's scroll position and show completion feedback.

The rules deliberately support a bounded set of English formulations. They do not cover arbitrary prose, and some explicit but unrecognized wording will remain unclear. These tests verify development behavior, not population-wide accuracy; held-out evaluation remains section 4.

## Section 3: what is implemented

- An automatic badge for detected roles uses text and color, preserves current/future timing, and calls out citizenship conditions. Incomplete scans are neutral, and ordinary/multiple-job pages have no role badge.
- An isolated Shadow DOM panel reuses the interpretation view, including exact quotations, source links, scan dates, separate training findings, prominent requirements, and explicitly separate historical/company context. It opens only on request.
- Keyboard-operable buttons, labeled controls, Escape-to-close, focus return, and non-modal behavior keep page typing available. Clicking or focusing the page closes the panel without stealing focus.
- The badge checks four viewport corners against standard page controls and yields when no corner is clear. Complex third-party layouts, shadow controls, and zoom cases still need the broader section 4 evaluation.
- Dismissal is scoped to a role in the current tab, and the toolbar’s “Show on page” action restores it. Navigation clears the old panel before the next role is analyzed.
- Pause and per-host disable controls work from the panel and toolbar, synchronize through local storage, and survive reloads. A first-use popup explains automatic site access, local processing, and controls without introducing new permissions.
- “Report incorrect result” offers a local JSON download with selected issue type, role, findings/citations, and source address stripped of query/fragment. Nothing is transmitted automatically. Full extraction, form answers, and settings are excluded.
- Extension-created markup is excluded from scanning. Host CSS is isolated from the panel, and synthetic website clicks cannot invoke panel preference/download actions.

## Section 4: implemented tooling and remaining validation

- Version 0.4.0 adds a reproducible evaluation runner, 160 authored scenarios with provisional labels, per-family metrics, confusion matrices, coverage, citation checks, and an explicit error ledger. See [evaluation methodology and results](evaluation/README.md).
- An 80-case development set and an 80-case reserved set have disjoint scenario families. The first reserved run reached 20/23 (87.0%) definitive sponsorship precision. Its results are preserved; after its failures informed fixes, subsequent runs are explicitly labeled regression results.
- Final regression runs meet all expectations in 152/160 scenarios. All eight remaining failures concern detection improvements deferred to section 7 and remain counted in coverage. Definitive sponsorship precision is 19/19 on development and 23/23 on exposed reserved cases, with zero citation-integrity failures. These constructed samples do not establish real-world accuracy.
- Fixed lost approval conditions, non-immigration sponsorship false positives, applicant/educational wording, additional employer formulations, and missed U.S.-person/green-card restrictions.
- Expanded isolated-browser checks cover narrow and short viewports, long titles, 200% browser zoom, keyboard access, focus return, action labels, and private-answer exclusion. Short-height evidence access and text/focus styling were corrected.
- **Outstanding:** independently human-reviewed real-world collection and fresh held-out evaluation, plus human accessibility review. The engineering implementation is complete; the full beta-validation milestone is not yet complete. No detection expansion has been pulled forward from section 7.

## Section 7: post-completion detection improvements

The [job detection diagnosis and improvement plan](DETECTION_IMPROVEMENT_PLAN.md) is deferred until all six core sections are complete. It is an improvement to the finished project, not a prerequisite for sections 4–6. Section 4 retains its accuracy, reliability, accessibility, and browser evaluation scope; the additional detection capabilities in this plan belong to section 7.

A live iCIMS posting confirmed that jobs entirely inside embedded frames are missed by the top-document scanner. Preserve this diagnosis and the Simplify research for section 7. When that section begins, first implement coordinated frame scanning plus an iCIMS reader, then the remaining improvements. No detection changes have been implemented by this investigation.

## Validation and boundaries

Section 1 baseline: 25 automated scanner/controller tests passed; Python virtual-environment isolation and its pip installation were also verified.

Section 2 validation: **115 automated tests pass**, covering the scanner, page lifecycle, and interpretation. TypeScript checks and the production build pass. The unpacked-extension browser smoke test passes in Chrome for Testing, including cited findings, the screenshot’s policy wording, real messaging and saved controls, private-answer exclusion, SPA navigation, no rescan on cosmetic scroll changes, a new scan from the manual button, visible completion feedback, and preservation of evidence scrolling. The updated popup screenshots were visually reviewed. These are development checks, not a measured real-world accuracy score.

Section 3 validation: **125 automated tests pass**, with TypeScript checks and the rebuilt 0.3.0 extension also passing. Real-browser checks cover first-use onboarding, badge and panel rendering, keyboard open/close and focus return, typing without interference, collision avoidance, host-style isolation, dismissal/restoration, on-page pause/site controls synchronized with the popup, a local report download, rejection of synthetic preference clicks, and clearing the old panel during role navigation. Popup and on-page screenshots were visually reviewed. Broad-site accuracy, placement, and accessibility evaluation remains the next section.

The initial suite covers structured and unstructured postings, applications, multiple jobs, selected detail panels, ordinary pages, malformed/stale metadata, conditions, hidden/private input, embedded-form warnings, large pages, pause/settings, delayed loading, and navigation. The browser smoke test exercises the built unpacked extension using real extension messaging and storage.

Section 4 engineering validation: **132 automated tests pass**, along with TypeScript checks, the production build, and the expanded isolated-browser suite against version 0.4.0. Narrow and short panel screenshots were visually inspected. The 160-case evaluation reports 152 cases meeting every expectation and eight deferred detection failures; this is a constructed regression result, not independent beta validation.

Version 0.4.1 fixes a toolbar-popup sizing regression: the viewport-relative body cap could shrink Chrome's actual popup to 81 pixels. The root and body now establish a stable 400-pixel width. A dedicated test reproduces Chrome's real popup size negotiation and passes with onboarding visible and dismissed (400-pixel viewport/body/root, no horizontal overflow). The rebuilt extension includes the fix; ordinary-tab popup tests alone did not catch this failure.

These fixtures are development examples, **not** the held-out accuracy dataset. Evaluation of employer-site coverage remains section 4 work; the additional detection capabilities in the deferred plan belong to section 7. This preview does not scan embedded-frame documents, closed shadow roots, canvas/PDF text, or roles without a reliably identifiable visible title. Unknown metadata stays unknown. A structured-only description is marked incomplete. It does not carry evidence between posting and application pages yet. Conservatively, an address change with identical role content stays in the scanning state until that content changes or the page is reloaded.

## Rules carried into section 2

Every definitive result needs exact evidence. Silence is unclear. An application question is not policy. Current authorization and future sponsorship must remain distinct. CPT and OPT never imply each other. Conflicts require review. Preserve exact restrictions, including the distinction between “U.S. person” and “U.S. citizen.” Page text is untrusted data. No personal immigration-eligibility determination.

## Implementation references

- [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [Chrome content-script manifest](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)
- [Schema.org JobPosting](https://schema.org/JobPosting)
- [Playwright extension testing](https://playwright.dev/docs/chrome-extensions)
- [pnpm build-script allowlist](https://github.com/pnpm/pnpm.io/blob/main/versioned_docs/version-10.x/settings.md#allowbuilds)
