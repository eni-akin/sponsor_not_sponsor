# Chrome Web Store publication-readiness checklist

Research date: October 17, 2026
Scope: current Chrome Web Store preparation, listing, privacy, quality, and review requirements. Sources are limited to official Chrome/Google documentation. This checklist reduces avoidable rejection risk; it cannot guarantee approval because every submission is reviewed against the current policies and may receive additional scrutiny.

## 1. Mandatory rejection and enforcement risks

### Package and manifest

- [ ] Test the exact packaged extension locally and confirm every advertised feature works. Broken or non-functioning extensions are not allowed. The ZIP must put `manifest.json` at its root, be valid, and be no larger than 2 GB. ([Prepare your extension](https://developer.chrome.com/docs/webstore/prepare), [Minimum Functionality](https://developer.chrome.com/docs/webstore/program-policies/minimum-functionality), [Publish](https://developer.chrome.com/docs/webstore/publish))
- [ ] Confirm `name`, `version`, `icons`, and `description` in the uploaded manifest. The manifest description is at most 132 characters; a later correction requires a larger version and a replacement ZIP. ([Prepare your extension](https://developer.chrome.com/docs/webstore/prepare))
- [ ] Request only the narrowest permissions needed by features that exist now, including optional permissions. Do not retain permissions for possible future features. Broader-than-needed permissions may cause rejection, and broad host or sensitive execution permissions increase scrutiny. ([Use of Permissions](https://developer.chrome.com/docs/webstore/program-policies/permissions), [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), [Review process](https://developer.chrome.com/docs/webstore/review-process))
- [ ] For Manifest V3, keep executable logic self-contained in the submitted package. Do not load remote scripts, evaluate fetched strings, or fetch commands for an interpreter. Remote data and server operations are allowed only when they do not supply extension logic and still comply with user-data rules. ([Manifest V3 requirements](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements))
- [ ] Do not obfuscate or conceal functionality. Minification, name shortening, and bundling are allowed, but code must remain reviewable enough for Google to determine the full behavior. ([Code Readability Requirements](https://developer.chrome.com/docs/webstore/program-policies/code-readability), [Review process](https://developer.chrome.com/docs/webstore/review-process))

### Product purpose, behavior, and claims

- [ ] State one narrow, easy-to-understand purpose. Every feature, permission, persistent UI element, and listing claim must directly serve it. Persistent UI must complement the user's task and cause minimal distraction. ([Quality guidelines](https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines), [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy))
- [ ] Provide real, working utility in the extension itself. Do not submit a shell that merely launches another site or an item with little or no unique utility. ([Minimum Functionality](https://developer.chrome.com/docs/webstore/program-policies/minimum-functionality), [Program Policies](https://developer.chrome.com/docs/webstore/program-policies))
- [ ] Ensure behavior and marketing are honest and predictable: disclose all functionality, avoid misleading claims or unexpected behavior, and do not imply Store status or performance that has not been awarded. Policies cover the entire experience, including the extension, listing, images, landing pages, and support materials. ([Program Policies](https://developer.chrome.com/docs/webstore/program-policies), [Creating a great listing](https://developer.chrome.com/docs/webstore/best-listing))
- [ ] Resolve rights to the product name, logo, screenshots, website content, and any third-party marks; do not impersonate another product or publisher. ([Impersonation and Intellectual Property](https://developer.chrome.com/docs/webstore/program-policies/impersonation-and-intellectual-property))

### User data and privacy

- [ ] Treat inspected or scraped webpage content, URLs/domains, browsing activity, form data, and locally stored data as user data. Local-only processing still requires accurate disclosure. ([User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq))
- [ ] Publish an accurate, current privacy policy and enter its public URL in the dashboard whenever the product handles user data. It must comprehensively explain what is collected, how it is used, and every party with whom it is shared. ([Privacy Policies](https://developer.chrome.com/docs/webstore/program-policies/privacy), [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy))
- [ ] Make extension behavior, dashboard data-use selections, permission justifications, Store listing, and privacy policy mutually consistent. A contradiction is itself a policy violation and can lead to rejection or removal. ([Listing Requirements](https://developer.chrome.com/docs/webstore/program-policies/listing-requirements), [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq))
- [ ] Limit collection, use, and transfer to what is necessary for the prominently disclosed user-facing single purpose. Browsing activity cannot be used for advertising, profiling, or generalized research; prohibited transfers and human access remain prohibited. Include a Limited Use compliance statement on the product website or a page one click away, such as the privacy policy. ([Limited Use](https://developer.chrome.com/docs/webstore/program-policies/limited-use), [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq))
- [ ] If data is transmitted, use a secure connection such as HTTPS/WSS and secure handling at rest. If collection or use is not obvious from a user-facing feature, give a prominent in-product disclosure and obtain affirmative, informed consent before handling the data; a Store description or privacy policy alone is not enough. ([User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), [Disclosure Requirements](https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements), [Handling Requirements](https://developer.chrome.com/docs/webstore/program-policies/handling-requirements))

### Listing and dashboard disclosures

- [ ] Supply a nonblank, accurate title/summary and detailed description, correct category/language, a 128x128 Store icon, and at least one current screenshot. Missing description, icon, or screenshots causes rejection. Avoid irrelevant/repeated keywords and unattributed or anonymous testimonials. ([Listing Requirements](https://developer.chrome.com/docs/webstore/program-policies/listing-requirements), [Complete your listing](https://developer.chrome.com/docs/webstore/cws-dashboard-listing))
- [ ] Use screenshots of the actual current experience, full bleed and not distorted, blurry, padded, rotated, or text-heavy. Official guidance accepts 1280x800 or 640x400 screenshots; the dashboard listing guide specifies at least one 1280x800 screenshot, so use 1280x800 for the safest submission. ([Creating a great listing](https://developer.chrome.com/docs/webstore/best-listing), [Complete your listing](https://developer.chrome.com/docs/webstore/cws-dashboard-listing))
- [ ] Complete the Privacy tab: precise single-purpose statement, justification for every manifest permission, remote-code declaration, all applicable data-type disclosures, Limited Use certifications, and privacy-policy URL. An undeclared remote-code use is rejected; Manifest V3 generally prohibits it anyway. ([Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy))
- [ ] Choose visibility and geographic distribution deliberately. Public, unlisted, and private submissions all undergo the same policy review. If publishing a separate test build beside production, label its name `DEVELOPMENT BUILD` or `BETA` and state `THIS EXTENSION IS FOR BETA TESTING` in its description. ([Distribution](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution))

## 2. Recommended quality and review-time items

- [ ] Make the title concise, descriptive, and distinct; begin the detailed description with the core value, then use a short feature list. Avoid superlatives, competitor references, excessive keywords, and claims broader than verified behavior. ([Creating a great listing](https://developer.chrome.com/docs/webstore/best-listing))
- [ ] Keep icon, screenshots, promo assets, website, help content, and product UI visually and factually consistent. A 440x280 small promo tile improves listing completeness; a 1400x560 marquee tile is optional. Confirm the dashboard's current required fields at submission because the older listing guide also depicts video/promo inputs. ([Complete your listing](https://developer.chrome.com/docs/webstore/cws-dashboard-listing), [Creating a great listing](https://developer.chrome.com/docs/webstore/best-listing))
- [ ] Provide a homepage and dedicated support URL. These are described as optional listing fields but help establish publisher trust and meaningful support. ([Complete your listing](https://developer.chrome.com/docs/webstore/cws-dashboard-listing), [Program Policies](https://developer.chrome.com/docs/webstore/program-policies))
- [ ] Make the reviewer path obvious. Test instructions are optional, but provide concise steps and credentials if any capability is gated by a paid or restricted account. ([Test instructions](https://developer.chrome.com/docs/webstore/cws-dashboard-test-instructions))
- [ ] Prefer narrowly scoped host access and easy-to-review code. New extensions, broad host permissions, sensitive permissions, large/hard-to-review code, and significant changes can extend review time. Most reviews finish within days, but some take weeks. ([Review process](https://developer.chrome.com/docs/webstore/review-process))
- [ ] Consider deferred publishing so approval does not immediately make the item public. An approved staged submission must be published within 30 days or it returns to draft. ([Publish](https://developer.chrome.com/docs/webstore/publish))

## 3. Dashboard/owner-only confirmations

These cannot be proven from repository files and must be checked by the publisher in the live Developer Dashboard.

- [ ] Developer account is registered, the one-time fee is paid, the Developer Agreement/policies are accepted, and the registration country is supported. ([Register](https://developer.chrome.com/docs/webstore/register))
- [ ] Publisher name and verified contact email are correct and actively monitored; enable publication/staging notifications. A physical address is required if the extension sells items, features, or subscriptions. ([Set up account](https://developer.chrome.com/docs/webstore/set-up-account), [Publish](https://developer.chrome.com/docs/webstore/publish))
- [ ] Two-step verification is enabled for the publisher account, as required by the technical program policies. ([2-Step Verification](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification))
- [ ] Dashboard single-purpose text, each permission justification, remote-code answer, data-type selections, Limited Use certification, privacy-policy URL, category, language, mature-content selection, visibility, and regions are reviewed against the exact submitted ZIP.
- [ ] Public privacy-policy, homepage, and support URLs load without authentication, accurately describe this release, identify the publisher/contact route, and do not contradict the dashboard or extension.
- [ ] Any official publisher URL is verified through Search Console; otherwise accept the ordinary `Offered by` publisher display. ([Complete your listing](https://developer.chrome.com/docs/webstore/cws-dashboard-listing))
- [ ] The publisher has selected automatic versus deferred publishing and has a monitored process for responding to review emails. Policy reviews also occur after publication, and unresolved warnings can cause takedown. ([Publish](https://developer.chrome.com/docs/webstore/publish), [Review process](https://developer.chrome.com/docs/webstore/review-process))

## 4. Suggested evidence to retain before clicking Submit

- Exact submitted ZIP, SHA-256, manifest version, and file allowlist.
- Passing automated/unit/browser checks run against that extracted ZIP.
- Screenshots and listing copy tied to the same version.
- Permission-to-feature map and the final text entered for every dashboard justification.
- Final privacy/data-use matrix showing webpage content, URLs, local settings, transmissions, recipients, retention/deletion, and human access.
- Human accessibility and representative real-world validation records, including known limits and unsupported cases.
- Owner sign-off on publisher identity, trademark/asset rights, public URLs, regions, visibility, and publish timing.

## Bottom line

The highest avoidable rejection risks are an inaccurate privacy/data declaration, an overbroad or unjustified permission, any remotely supplied executable logic, a listing that overstates verified behavior, stale/mismatched screenshots, or an incomplete dashboard/account setup. Passing repository tests is necessary evidence of functionality, but it does not resolve owner-only declarations or guarantee Store approval.

## 5. Sponsor Not Sponsor assessment

Assessment date: October 18, 2026. Audited artifact: `release/sponsor-not-sponsor-1.0.0.zip`.

### Passes verified from the repository

- [x] The 48 KB ZIP contains 14 allowlisted runtime files with `manifest.json` at its root. Its SHA-256 matches `release/validation.json` and `release/sponsor-not-sponsor-1.0.0.zip.sha256`.
- [x] The manifest is valid Manifest V3 and includes a concise name, increasing version, 128-pixel icon, and a 112-character description.
- [x] The package contains bundled JavaScript only. No remotely hosted script, fetched executable logic, `eval`, or `new Function` use was found.
- [x] `storage` supports saved scan preferences and onboarding. HTTP/HTTPS content-script access directly supports automatic job-page recognition and analysis; no unrelated permission is declared.
- [x] The listing states one narrow purpose, distinguishes findings from personal immigration eligibility, names important limitations, and avoids unsupported accuracy or Store-status claims.
- [x] The required 128x128 PNG, 440x280 promo tile, and two current 1280x800 screenshots exist. The screenshots show the actual extension on a clearly labeled fictional posting and match the current branding.
- [x] The bundled privacy disclosure covers webpage text, metadata, local settings, same-site overview recovery, optional report downloads, retention, and the absence of analytics, ads, accounts, and automatic developer transfer. It now includes the Chrome Web Store Limited Use statement.
- [x] On this audit run, `pnpm --config.verify-deps-before-run=false check` passed typechecking, 208 unit tests, and the production build. `node scripts/release-verify.mjs` passed all seven extracted-package browser, popup, asset, help, and privacy checks.

### Submission blockers

- [ ] Publish the privacy policy at a stable public HTTPS URL and enter that URL in the dashboard. The bundled `privacy.html` is useful in-product disclosure but does not replace the required dashboard-accessible public policy.
- [ ] Complete and cross-check every Privacy-tab answer against the exact ZIP: single purpose; `storage`; broad HTTP/HTTPS host access; no remote code; website content; web browsing activity; local-only processing; same-site overview fetch; user-initiated report download; no sale, ads, analytics, or third-party transfer; and Limited Use certifications.
- [ ] Confirm publisher registration, verified support email, two-step verification, category, language, mature-content answer, visibility, countries, and automatic versus deferred publishing in the live dashboard.
- [ ] Replace the general reviewer path with a stable public demonstration URL if available. The previous repository-only `release/demo.html` instruction was unusable by Store reviewers and has been removed.
- [ ] Complete the already registered independent human-reviewed real-world validation and human accessibility review before presenting this as a publication-ready quality release. Existing automated fixtures and the 30-posting AI-reviewed diagnostic do not satisfy that gate.
- [ ] Obtain owner sign-off for publisher/support identity, public privacy/support/homepage content, trademark clearance, listing screenshots/copy, data-use declarations, and the exact archive to upload.

### Review sensitivity, not a policy failure by itself

The content script runs automatically on all HTTP and HTTPS pages and in frames. That access is broader than a site-specific extension, but it is tied to the advertised cross-site automatic scanner and the code excludes typed answers, uploads, editable fields, and hidden content. Keep the broad-access justification explicit in the dashboard; changing to click-to-run or a fixed domain allowlist would materially change the product rather than merely reduce review time.
