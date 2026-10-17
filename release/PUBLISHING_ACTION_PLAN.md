# Chrome Web Store publishing action plan

Updated: October 17, 2026
Release candidate: Sponsor Not Sponsor 0.6.0
Current decision: **No-go until every required row below is complete.**

| Order | Required | Action | Owner | Completion evidence | Status |
| ---: | :---: | --- | --- | --- | --- |
| 1 | Yes | Publish the current privacy disclosure at a stable public HTTPS URL. It must describe webpage content, URLs, local settings, same-site overview recovery, optional report downloads, retention/deletion, recipients, and Limited Use. | Publisher | Public URL loads without authentication and matches `extension/privacy.html`. | Open |
| 2 | Yes | Confirm the publisher account is registered, the contact email is verified and monitored, and two-step verification is enabled. | Publisher | Developer Dashboard account page reviewed. | Open |
| 3 | Yes | Complete the Privacy tab against the exact 0.6.0 ZIP. | Publisher | Saved dashboard fields reviewed against the declaration matrix below. | Open |
| 4 | Yes | Complete the Store Listing and Distribution tabs: category, language, mature-content answer, visibility, countries, support details, and automatic or deferred publishing. | Publisher | Dashboard shows no incomplete required fields. | Open |
| 5 | Yes | Complete the registered independent human-reviewed real-world validation gate. | Product owner / human reviewers | Acceptance record meets `evaluation/part2/acceptance.md`; limitations remain documented. | Open |
| 6 | Yes | Complete a human accessibility review of popup, badge, panel, help, and privacy surfaces. | Human reviewer | Signed checklist covering keyboard, focus, zoom, contrast, reduced motion, forced colours, and screen-reader clarity. | Open |
| 7 | Yes | Approve publisher identity, support route, trademark clearance, listing copy, screenshots, privacy declarations, and the exact upload archive. | Product owner | Dated owner sign-off identifying version and SHA-256. | Open |
| 8 | Recommended | Publish a stable fictional demonstration page and use it in reviewer instructions. Do not reference repository-only `release/demo.html`. | Publisher | Public URL works without login and produces a predictable extension result. | Open |
| 9 | Recommended | Review the 128×128 icon against Chrome's recommended visual weight and transparent padding. Change only if the current full-canvas mark looks oversized beside Store icons. | Brand owner | Store-scale comparison approved; regenerate assets if changed. | Open |
| 10 | Yes | Run final verification after every package-affecting change. | Release owner | `pnpm --config.verify-deps-before-run=false check`, `node scripts/release-verify.mjs`, and `git diff --check` pass. | Complete for current ZIP |
| 11 | Yes | Upload only the verified archive and recheck the dashboard's parsed manifest and permission list before submission. | Release owner / publisher | Uploaded version is 0.6.0 and local SHA-256 is recorded as `5d30101744f569e14217d957cf571c8223f0a61ea53a4f856bc0ab729805c777`. | Open |
| 12 | Yes | Submit for review and monitor the verified publisher email for questions or rejection notices. | Publisher | Submission receipt and review status recorded. | Open |

## Privacy-tab declaration matrix

| Dashboard field | Submission text or selection to verify |
| --- | --- |
| Single purpose | Explain stated sponsorship and eligibility requirements for the vacancy being viewed using traceable evidence. |
| `storage` | Saves scanning preferences, disabled sites, and onboarding state locally. |
| HTTP/HTTPS host access | Required for the advertised automatic cross-site job-posting scanner, including verified embedded frames. Users can pause scanning, disable individual sites, and further restrict access with Chrome controls. |
| Remote code | **No.** All executable extension logic is bundled in the submitted package. |
| Website content | **Disclose.** The extension locally inspects visible job-posting text and job metadata. |
| Web browsing activity | **Disclose.** The extension observes the current page address and content only to recognize and analyze the vacancy being viewed. It does not build or upload browsing history. |
| Form and sensitive input | Standard form values, editable answers, uploads, and hidden content are excluded; do not claim this guarantees that public webpage text never contains personal information. |
| Network behavior | A narrowly matched Ashby application may fetch the same vacancy's official overview from the same website. Extracted text is not sent to an analysis service. |
| Local storage and retention | Settings persist in Chrome local storage. Scan text and findings remain in tab memory and are replaced on navigation or rescan. |
| Reports | An incorrect-result report is created only when the user downloads it. It includes role details, findings, quotations, scan time, and a sanitized page URL; it is not automatically submitted. |
| Sharing and monetization | No developer collection, analytics, advertising, sale, or unrelated third-party transfer is implemented. |
| Limited Use | Certify compliance and use the same Limited Use statement as the public privacy policy. |
| Privacy-policy URL | Enter the final public HTTPS policy URL and confirm it matches the extension and all dashboard selections. |

## Final go/no-go gate

Submit only when:

- every **Required** row is complete;
- public disclosures, dashboard answers, listing copy, screenshots, and the uploaded ZIP describe the same behavior;
- the final archive passes all automated checks and has a newly recorded SHA-256;
- the owner has approved the exact archive and selected automatic or deferred publishing.

Passing automated tests does not replace Chrome Web Store review, human accessibility review, or the project's independent real-world validation gate.
