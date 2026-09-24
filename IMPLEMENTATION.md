# Implementation sections

This roadmap turns the original [development plan](job-sponsorship-extension-plan.md) into six deliverable sections. Initial scope: English-language U.S. job postings and applications across all employment types.

| Section | Work | Completion checkpoint | Status |
| --- | --- | --- | --- |
| **1. Foundation and page scanner** | Local environment, extension scaffold, shared data contracts, generic role detection, safe text extraction, page-change handling, inspection popup, starter fixtures | Load the extension, inspect a single role’s extracted text, and verify that navigation and form answers cannot contaminate that record | Implemented; validation recorded below |
| **2. Evidence-based interpretation** | Local rules for sponsorship, separate CPT and OPT, restrictions, negation, conditions, timing, questions, conflicting evidence | Every definitive finding cites an extracted passage; questions and silence remain unclear | Next |
| **3. Everyday browsing interface** | Automatic on-page badge, accessible evidence panel, dismiss control, explicit restrictions, feedback action, onboarding; connect existing pause/site settings | End-to-end local prototype that explains findings without obstructing applications | Planned |
| **4. Accuracy and reliability beta** | Approximately 150–200 manually reviewed examples, held-out evaluation, expanded layouts, accessibility and browser checks | Report precision, coverage, sample counts, and errors; aim for ≥95% definitive-label precision on held-out examples | Planned |
| **5. Company research** | Official vacancy and policy lookup, careful employer matching, historical context, backend credentials, persistent request/cache coordination, source dates, opt-in research | Sourced context that never converts historical activity into a promise about the current role | Planned |
| **6. Release preparation** | Production packaging, icons, onboarding and permission explanations, privacy disclosures, regression checks, store materials | Installable release ready for review and submission | Planned |

## Section 1: what is implemented

- Manifest V3 extension with a TypeScript content script and toolbar inspection popup.
- Five page categories: posting, application, multiple jobs, ordinary page, or unreadable.
- JSON-LD `JobPosting` support, including arrays and graphs, matched against a unique visible role title.
- Generic title, description-section, and application-action signals when structured data is absent. The URL is supporting information only.
- A single visible detail panel takes precedence over surrounding job cards. Ambiguous vacancy lists produce no combined record.
- Metadata and separately attributed text passages with page-location hints, stable role identity, scan timestamp, and completeness indicators.
- Exclusion of standard form values, uploads, editable answers, navigation, hidden content, and recognized recommendations.
- Debounced page updates; immediate record invalidation on relevant changes; address-change checks for single-page navigation; suppression of unchanged old content after navigation.
- Global pause and per-host disable settings. Text remains in the tab’s memory and is never saved or sent to a server.
- Shared future finding types keep sponsorship, CPT, and OPT separate. Interpretation is deliberately not implemented in this section.

## Validation and boundaries

Validation on 2026-09-24: 25 automated scanner/controller tests pass; TypeScript checks and the production build pass. The unpacked-extension browser smoke test passes in Chrome for Testing, including real messaging, saved controls, private-answer exclusion, and SPA navigation. The popup screenshot was visually reviewed. Python virtual-environment isolation and its pip installation were also verified.

The initial suite covers structured and unstructured postings, applications, multiple jobs, selected detail panels, ordinary pages, malformed/stale metadata, conditions, hidden/private input, embedded-form warnings, large pages, pause/settings, delayed loading, and navigation. The browser smoke test exercises the built unpacked extension using real extension messaging and storage.

These fixtures are development examples, **not** the held-out accuracy dataset. Broad employer-site coverage remains section 4 work. This preview does not scan cross-origin frames, closed shadow roots, canvas/PDF text, or roles without a reliably identifiable visible title. Unknown metadata stays unknown. A structured-only description is marked incomplete. It does not carry evidence between posting and application pages yet. Conservatively, an address change with identical role content stays in the scanning state until that content changes or the page is reloaded.

## Rules carried into section 2

Every definitive result needs exact evidence. Silence is unclear. An application question is not policy. Current authorization and future sponsorship must remain distinct. CPT and OPT never imply each other. Conflicts require review. Preserve exact restrictions, including the distinction between “U.S. person” and “U.S. citizen.” Page text is untrusted data. No personal immigration-eligibility determination.

## Implementation references

- [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [Chrome content-script manifest](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)
- [Schema.org JobPosting](https://schema.org/JobPosting)
- [Playwright extension testing](https://playwright.dev/docs/chrome-extensions)
- [pnpm build-script allowlist](https://github.com/pnpm/pnpm.io/blob/main/versioned_docs/version-10.x/settings.md#allowbuilds)
