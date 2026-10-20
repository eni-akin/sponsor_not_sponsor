# Chrome Web Store Developer Dashboard submission worksheet

Updated for 1.0.1: October 20, 2026
Package: `release/sponsor-not-sponsor-1.0.1.zip`
Version: `1.0.1`
SHA-256: `0ccbef3f7e84af2f42836a9b71bb2796c8690a1609de3af9887bf449f2081055`

This worksheet is paste-ready for the current verified package. Rebuild and re-audit it after any package-affecting change. Text in `[OWNER: ...]` brackets requires genuine owner or publisher input; do not submit the brackets.

## Store listing

### Product details

| Field | Entry |
| --- | --- |
| Name | Sponsor Not Sponsor |
| Summary | Read explicit sponsorship, CPT, and OPT statements in job postings, with local analysis and supporting evidence. |
| Category | Workflow & Planning |
| Language | English |
| Mature content | No |

### Detailed description

```text
Sponsor Not Sponsor reads a supported job posting using deterministic text rules and shows a small badge: Explicit blocker found, Sponsorship stated, No blocker found, or Could not verify. Open the evidence panel to read exact quotations and source links.

The rules distinguish visa sponsorship from CPT, OPT, and separate citizenship, residency, work-authorization, or export-control restrictions. Application questions do not establish employer policy. No blocker found does not prove sponsorship is available.

Analysis runs in your browser without an account, key, or analysis service. Pause scanning, disable individual sites, dismiss the badge, or download an incorrect-result report. Reports are never sent automatically.

The extension targets English-language U.S. job postings. It supports bounded embedded-frame reading and matching Ashby overview recovery; unusual wording, inaccessible pages, PDFs, and unsupported layouts can remain unreadable or incomplete. It does not carry findings to an unrelated vacancy. Independent accuracy validation is pending. Findings describe posting wording, not personal eligibility.
```

### Graphic assets

| Dashboard field | File |
| --- | --- |
| Store icon, 128×128 | `extension/icons/icon-128.png` |
| Screenshot 1, 1280×800 | `release/store/01-job-badge-1280x800.png` |
| Screenshot 2, 1280×800 | `release/store/02-quoted-evidence-1280x800.png` |
| Small promotional tile, 440×280 | `release/store/promo-440x280.png` |
| Marquee promotional tile | Leave empty; optional and not prepared. |

The screenshots show the current extension on a labeled fictional posting. They do not establish independent real-world accuracy.

### Publisher and support fields

| Field | Entry |
| --- | --- |
| Publisher/display name | Eniola Akinpelumi |
| Support email | eni.akinpel@gmail.com |
| Support URL | https://eni-akin.github.io/sponsor_not_sponsor/support.html |
| Homepage URL | https://eni-akin.github.io/sponsor_not_sponsor/ |
| Privacy-policy URL | https://eni-akin.github.io/sponsor_not_sponsor/privacy.html |

## Privacy tab

### Single purpose

```text
Explain stated sponsorship and eligibility requirements for the vacancy being viewed using traceable evidence.
```

### Permission justifications

#### `storage`

```text
Stores the user's scanning preferences, disabled sites, and onboarding-dismissal state in Chrome local storage. It does not store browsing history or extracted job text.
```

#### `https://*/*` and `http://*/*` page access

```text
Automatic cross-site job recognition is the extension's core function. The content script reads visible job-posting text and metadata in the current page and verified embedded frames so it can show local, quoted sponsorship and eligibility findings. Users can pause scanning, disable individual sites, or restrict access with Chrome controls. A narrowly matched Ashby application may fetch the same vacancy's official overview from the same website when the application page lacks a description.
```

The package declares no optional permissions and no active company-research or analysis-service permission.

### Remote code

Select: **No, I am not using remote code.**

```text
All executable extension logic is bundled in the submitted Manifest V3 package. The extension does not load remote scripts, evaluate fetched strings, or fetch commands or executable logic.
```

### Data-use selections

Select only the applicable data types below.

| Dashboard data type | Select | Explanation |
| --- | :---: | --- |
| Website content | **Yes** | Locally reads visible job-posting text and job metadata to recognize and analyze the vacancy. Public page text can contain personal information even though standard form values, editable answers, uploads, and hidden content are excluded. |
| Web history / web browsing activity | **Yes** | Observes the current page address and content only to recognize and analyze the vacancy being viewed. It does not build or upload a browsing-history profile. |
| Personally identifiable information | **No** | The extension does not request or create an account or intentionally collect identity data. Do not use this answer to imply that public website content can never contain personal information. |
| Health information | **No** | Not used. |
| Financial and payment information | **No** | Not used. |
| Authentication information | **No** | Credentials are not read or used. |
| Personal communications | **No** | Messages and communications are not read or used. |
| Location | **No** | Precise or coarse location is not read or used. |
| User activity | **No** | Clicks, keystrokes, mouse position, scrolling, and network activity are not collected for tracking or profiling. Interactions with the extension's own controls only operate the requested feature. |

For selected data types, select **App functionality** as the purpose. Do not select advertising, analytics, personalization, creditworthiness, or unrelated purposes.

### Data handling and retention explanation

```text
Analysis runs locally in the browser. Scan text and findings remain in tab memory and are replaced on navigation or rescan. Settings persist in Chrome local storage until changed or the extension is uninstalled. A narrowly matched Ashby application may request the same vacancy's official overview from the same website; extracted text is not sent to an analysis service. An incorrect-result report is created only when the user downloads it and remains wherever the user saves it. Reports are not automatically submitted. The package implements no developer collection, analytics, advertising, sale, or unrelated third-party transfer.
```

### Limited Use and disclosure certifications

Confirm every dashboard certification stating that:

- data use is limited to the prominently disclosed single purpose and app functionality;
- data is not sold or used for advertising, creditworthiness, lending, or unrelated profiling;
- data is not transferred to unrelated third parties or used by humans except as permitted by Chrome Web Store policy;
- the public privacy policy matches the package and dashboard selections;
- use of information received from Google APIs complies with the Chrome Web Store User Data Policy, including Limited Use.

Public privacy-policy URL:

```text
https://eni-akin.github.io/sponsor_not_sponsor/privacy.html
```

## Reviewer instructions

### Test instructions

```text
No account, payment, credentials, or special configuration is required.

1. Install the submitted extension and allow its requested website access.
2. Open https://eni-akin.github.io/sponsor_not_sponsor/demo.html.
3. The page presents one English-language U.S. job posting. The extension should show a small badge. Open it to see the result, exact quoted evidence, and source link.
4. Use the toolbar popup to pause and resume scanning and to disable and re-enable the site.
5. Dismiss the on-page badge, then restore it from the toolbar popup and choose Scan again.
6. Open the evidence panel and choose Report incorrect result. The extension downloads a local JSON report; it does not upload or submit the report.
7. Open Help and Privacy from the toolbar popup.

The extension can return Could not verify when a page is incomplete or unsupported. Company research is deferred and has no active controls or network requests.
```

If no public demonstration page is supplied, the reviewer path remains less reproducible; do not substitute repository-only `release/demo.html`, which is not included in the ZIP.

## Distribution tab

| Field | Owner selection |
| --- | --- |
| Visibility | `[OWNER: PUBLIC / UNLISTED / PRIVATE]` |
| Geographic distribution | `[OWNER: ALL REGIONS OR SELECTED COUNTRIES]` |
| Publishing | `[OWNER: AUTOMATIC OR DEFERRED]` |

Deferred publishing is the cautious option because approval will not immediately make the extension public; an approved staged submission must be published within Chrome Web Store's allowed window.

## Account and final submission confirmations

- [ ] `[OWNER]` Developer account registration and fee are complete; current agreements/policies are accepted.
- [ ] `[OWNER]` Publisher contact email is verified and monitored; two-step verification is enabled.
- [ ] `[OWNER]` Publisher identity, support route, public URLs, and any official publisher website verification are correct.
- [ ] `[OWNER/HUMAN REVIEWERS]` Registered independent real-world validation and human accessibility review are complete.
- [ ] `[OWNER]` Product name, logo, screenshots, and website-content rights/trademark clearance are approved.
- [ ] `[OWNER]` Listing copy, screenshots, privacy selections, permissions, and distribution choices match the uploaded ZIP.
- [ ] `[OWNER]` Exact archive approval: version `1.0.1`, SHA-256 `0ccbef3f7e84af2f42836a9b71bb2796c8690a1609de3af9887bf449f2081055`, approved on `[OWNER: DATE]` by `[OWNER: NAME]`.
- [ ] `[PUBLISHER]` Uploaded manifest shows version 1.0.1, `storage`, and HTTP/HTTPS content-script access.
- [ ] `[PUBLISHER]` Submission receipt/status and any reviewer correspondence are recorded.

Do not submit until all required items in `release/PUBLISHING_ACTION_PLAN.md` Lane B are complete.
