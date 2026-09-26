# Chrome Web Store listing draft — 0.6.0

Status: materials prepared for review; not submitted or published. Independent real-world beta validation remains open. This draft describes the current preview, not future detection or AI capabilities.

## Name

Sponsor Not Sponsor

## Short description

Read explicit sponsorship, CPT, and OPT statements in job postings, with local analysis and supporting evidence.

## Detailed description

Read what a job posting says about visa sponsorship, CPT, and OPT, with the wording behind each finding.

Sponsor Not Sponsor recognizes supported job pages and displays a small badge. Open the evidence panel to inspect separate findings, exact quotations, current/future sponsorship wording, and additional stated restrictions. If the wording is missing, unsupported, or conflicting, the result stays unclear or asks for review.

Core scanning runs locally in your browser without an account or AI service. Pause scanning, disable individual sites, dismiss the badge, or download an incorrect-result report for your own review. Reports are never sent automatically.

Optional company research is an advanced local-service preview, off by default. It requires separately installing and running the service from the project source distribution. The browser package does not install it. The supplied registry currently covers Atlassian only, has no preloaded historical records or company policy pages, and needs a server-side Brave Search key for wider discovery. Research appears separately and never changes the posting's badge.

This preview targets English-language U.S. job postings. It uses limited page and wording rules; some sites, embedded jobs, employer names, and phrases will not be recognized. It does not read PDFs or transfer findings to a separate application page. Independent real-world accuracy validation is pending. Findings describe employer wording, not personal eligibility or a guarantee of sponsorship.

## Images

- Extension icon: `extension/icons/icon-128.png` (128×128 PNG with transparent padding).
- Small promotional image: `release/store/promo-440x280.png`.
- Screenshot 1: `release/store/01-job-badge-1280x800.png` — actual badge on a labeled fictional posting.
- Screenshot 2: `release/store/02-quoted-evidence-1280x800.png` — actual evidence panel on the same posting.
- Generate with `pnpm assets`, `pnpm build`, then `pnpm screenshots`. Screenshots contain no real applicant or employer claims.

## Single purpose and permission explanations

Single purpose: explain stated sponsorship, CPT, and OPT requirements for the job being viewed using traceable evidence.

- HTTP/HTTPS content-script access: detect jobs automatically from arbitrary links and read their requirements. The preview runs in the top document. It needs automatic access for this browsing workflow; users can pause or disable sites.
- `storage`: persist controls/onboarding and manage optional research request state and caches.
- Optional `http://127.0.0.1:4318/*`: communicate only with the user's local research service after opt-in. It is not required for local scanning.
- All executable extension code is bundled. The service returns evidence data, not remote code.

## Privacy declarations to enter and review

Do not claim that the extension never accesses website content. It reads visible page text and job metadata locally. Do not claim that no information ever leaves the device: opt-in research can send job-related queries to Brave and fetch public sites. No analytics, advertising, sale of data, or general browsing-history upload is implemented.

Describe website content and job-page addresses consistently with the bundled privacy page, including limited metadata retained in the separate local service cache. Review the current dashboard's category definitions when completing the declaration; use the actual behavior rather than copying an unverified checkbox list.

Before submission, supply a real publisher/support contact, a public privacy-policy URL reproducing the bundled disclosure, and an accessible source/setup URL for the optional service. None has been invented or published by this release preparation.

## Reviewer instructions

Core use needs no login, payment, key, or service. Load the package, allow website access, and open a supported job page. For a reproducible demonstration, serve `release/demo.html` from a local HTTP server. It is explicitly fictional. Expect sponsorship unavailable, OPT explicitly accepted, CPT unclear, and exact quotations in the panel. Test pause, site disable, dismissal/restoration, and the local report download. Help and privacy links are in the popup.

Optional research setup is documented in `server/README.md`. Set `RESEARCH_EXTENSION_ID` to the actual installed ID, start the local service, and explicitly enable research. An unavailable service must not prevent local findings. The automated research smoke test uses fictitious sources and a disposable profile; it does not prove live employer coverage.

## References checked September 26, 2026

- [Prepare the extension ZIP](https://developer.chrome.com/docs/webstore/prepare)
- [Icons, promotional images, and screenshot requirements](https://developer.chrome.com/docs/webstore/images)
- [Manifest icons](https://developer.chrome.com/docs/extensions/reference/manifest/icons)
