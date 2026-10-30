# Chrome Web Store listing draft — 1.2

Status: prepared for review; not submitted or published. Owner confirmed human validation complete on October 30, 2026. No new accuracy metrics or independent agent verification are claimed. Store declarations will be completed together with the owner.

## Name

Sponsor Not Sponsor

## Short description

Read explicit sponsorship, CPT, and OPT statements in job postings, with local analysis and supporting evidence.

## Detailed description

Sponsor Not Sponsor reads a supported job posting using deterministic text rules and shows a small badge: Explicit blocker found, Sponsorship stated, No blocker found, or Could not verify. Open the evidence panel to read exact quotations and source links.

The rules distinguish visa sponsorship from CPT, OPT, and separate citizenship, residency, work-authorization, or export-control restrictions. Application questions do not establish employer policy. No blocker found does not prove sponsorship is available.

Analysis runs in your browser without an account, key, or analysis service. Pause scanning, disable individual sites, dismiss the badge, or download an incorrect-result report. A separate form lets you import, review, and explicitly submit a correction. Reports are never sent automatically.

The extension targets English-language U.S. job postings. It supports bounded embedded-frame reading and matching Ashby overview recovery; unusual wording, inaccessible pages, PDFs, and unsupported layouts can remain unreadable or incomplete. It does not carry findings to an unrelated vacancy. Findings describe posting wording, not personal eligibility, and are not a guarantee of accuracy.

## Images

- Extension icon: `extension/icons/icon-128.png`.
- Small promotional image: `release/store/promo-440x280.png`.
- Badge screenshot: `release/store/01-job-badge-1280x800.png`.
- Evidence screenshot: `release/store/02-quoted-evidence-1280x800.png`.

Screenshots show the actual extension on the labeled fictional `release/demo.html` posting. Generate them with `pnpm screenshots` after building.

## Purpose and permissions

Single purpose: explain stated sponsorship and eligibility requirements for the vacancy being viewed using traceable evidence.

HTTP/HTTPS content scripts recognize supported jobs and read public text in the top document and verified frames. The `storage` permission saves scanning preferences and onboarding. There is no optional local-service permission. Executable extension code is bundled.

## Privacy declarations

The extension reads website content and job metadata. Analysis remains in tab memory. Standard form answers, uploads, and editable fields are excluded. Matched Ashby overview recovery can fetch the same vacancy's overview from the same website. Optional reports can be explicitly submitted through a separate form, including an optional email address. No analytics, advertising, sale of data, or browsing-history upload is implemented.

Describe data use consistently with the bundled privacy page. Before submission, supply real publisher/support details and a public privacy-policy URL. These have not been invented or published by this preparation.

## Reviewer instructions

Load the extracted package, allow website access, and open an English-language U.S. job posting with a visible title, description, and Apply control. The badge should either show a result supported by quoted page text or stay hidden/report that it could not verify the posting. Test pause, site disable, dismissal/restoration, rescan, and local report download. Open reporting form is a separate link; visiting it sends no report or job details but makes an ordinary web request. Import and review the downloaded file, then explicitly submit if intake is available. Help and privacy links are in the popup. No account or credentials are required.

Before submission, replace this general path with a stable public demonstration URL if one is available. Do not give reviewers the repository-only `release/demo.html`; it is not included in the submitted ZIP.

Company research is deferred and has no active extension controls or requests.

## References checked September 26, 2026

- [Prepare the extension ZIP](https://developer.chrome.com/docs/webstore/prepare)
- [Icons, promotional images, and screenshot requirements](https://developer.chrome.com/docs/webstore/images)
- [Manifest icons](https://developer.chrome.com/docs/extensions/reference/manifest/icons)
