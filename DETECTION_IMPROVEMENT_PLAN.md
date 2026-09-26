# Section 7: post-completion detection and interpretation improvements

Date: September 24, 2026. Status: deferred until all six core project sections are complete; detection behavior has not been changed by this investigation.

Scheduling: this entire action plan is a future improvement to the finished project. Complete sections 4 (accuracy and reliability beta), 5 (company research), and 6 (release preparation) before starting it. It is not a prerequisite for completing those sections. The diagnosis and research below are retained to guide section 7; recheck the code and platform behavior when implementation begins.

## Confirmed failure on the Liberty Mutual posting

Affected posting: [2027 TechStart Summer Internship Program, job 77035](https://campus-libertymutual.icims.com/jobs/77035/2027-techstart-summer-internship-program/job). The displayed requisition ID is 2026-77035.

Read-only inspection of the user's open page confirmed:

- The outer document has no `h1` headings.
- The job is in `iframe#icims_content_iframe`, with an inner job URL using `in_iframe=1`.
- Inside that frame are the role's `h1`, Description and Qualifications headings, salary metadata, and the “Apply for this job online” link.
- The heading is inside `.iCIMS_JobContent` and `.iCIMS_JobContainer`. The inner document has no `main` landmark.

The current extension cannot see these signals because:

1. `extension/manifest.json` injects `content.js` only into the top document: it does not enable `all_frames`.
2. `src/scanner.ts` scans one `Document`. DOM queries and text walkers do not cross iframe document boundaries. Its extraction exclusions also include iframe elements; simply removing that exclusion would not traverse the inner document.
3. `roleTitle()` requires a unique visible title in that scanned document. The outer page has none, so `scanPage()` returns before it reaches the embedded-content warning.
4. `src/popup.ts` sends `RESCAN`, and `src/content.ts` calls `controller.scan()`. The button works, but repeats the same limited scan.

This is a content-access gap, not evidence of missing storage or a need for persistent caching. The current result incorrectly presents this access limitation as “No specific job detected.” The existing iframe regression test only places a frame inside a posting already recognizable in the parent; it does not cover a job wholly inside a frame.

Other potential misses found in the code, separate from this confirmed cause: role titles in ordinary `h2` elements; multiple unrelated `h1` headings; an Apply action outside the chosen description container; submit controls labeled through their `value`; and descriptions that do not contain two of the current English keyword groups. These need representative tests before changing thresholds.

## What the Simplify research establishes

| Public evidence | What it supports |
| --- | --- |
| [Copilot product FAQ](https://simplify.jobs/copilot) lists over 100 supported job boards/application portals, including iCIMS, Workday, Greenhouse, Lever, Taleo, and others. | Simplify deliberately maintains compatibility across recruiting platforms, including the one used here. |
| [Installation guide](https://help.simplify.jobs/en/articles/1749022-installing-and-setting-up-copilot) describes automatically detecting supported application forms and matching fields to the user's profile. | Recognition of a supported application and mapping its fields are explicit product behaviors. |
| [Safari setup guide](https://help.simplify.jobs/articles/8759839-turning-on-copilot-in-safari) explains that page access is needed to recognize applications because application links are not standardized. | Page inspection matters; a fixed list of job URL patterns is insufficient. This source describes Safari permissions, not the internals of the Chrome extension. |
| [Autofill guide](https://help.simplify.jobs/articles/2415391-using-copilot-to-autofill-applications) claims coverage across 80% of application websites and describes a manual fallback on unsupported pages. | Simplify itself describes bounded support. The percentage concerns autofill coverage, not measured job-detection accuracy. |

The screenshot and live page show Simplify's resume-match UI on this role. That establishes functioning integration here, but not how it obtains the description. The reviewed public sources do not disclose its selectors, iframe architecture, classifier, or whether initial detection uses an AI model. Platform-specific readers are our recommended design, not a verified description of Simplify's proprietary implementation. There is no basis here to claim that an AI API is necessary to solve our failure.

## Implementation order after core project completion

### 7A. Read embedded jobs and coordinate one result per tab

- Add frame-local scanning for eligible HTTP(S) documents and a small extension service worker to route frame results and scan requests. Chrome supports injection into matching frames through [`all_frames`](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts); each frame's URL is checked separately.
- Keep the badge/panel in the top document. Child frames supply candidates and evidence, not duplicate interfaces. The popup requests the coordinated result rather than accepting whichever frame responds first. Chrome documents this first-response behavior in its [messaging guide](https://developer.chrome.com/docs/extensions/develop/concepts/messaging).
- Identify candidates by tab, document/frame identity, role ID, and navigation generation. Validate message sender information, reject stale results, and discard results when frames disappear or navigate. Keep job text in memory; re-request frame snapshots after worker restart.
- Select the displayed, relevant role; deduplicate matching parent/frame versions and report ambiguity when different visible roles remain. Do not combine ads, hidden frames, related jobs, or different vacancies. Frame selection must account for ancestor-frame visibility, not only visibility inside the child document.
- Propagate global pause and top-level site-disable settings to child scans. An embedded job's host must not bypass the user's decision to disable the containing site.
- Route Scan again to relevant frames and return completion feedback after collection, with bounded waiting and an incomplete status for missing responses. Preserve frame-specific provenance for quotations and source navigation.

Acceptance: the Liberty Mutual wrapper detects this exact role with one badge and one coherent result; direct inner-page access also works. Browser regression coverage includes same-origin and cross-origin embeds, delayed frames, removal/replacement, navigation, pause settings, duplicate candidates, and stale messages. Merely setting `all_frames: true` is insufficient because existing content scripts each create UI and message listeners.

### 7B. Add recruiting-platform readers

- Implement iCIMS first using verified job containers, heading, requisition metadata, description sections, and Apply action. Match the platform using host plus page structure; neither alone proves a particular page is a vacancy.
- Add Greenhouse, Lever, Ashby, and Workday readers using reviewed examples from multiple employers per platform. Expand to others according to observed misses.
- Have every reader return the same candidate/evidence format, with detection reasons and completeness. A platform reader that cannot recognize its expected structure falls back gracefully.
- Extract only the selected job and public application wording. Preserve current exclusions for answers, resume uploads, editable fields, hidden content, and extension overlays, including third-party injected widgets.

Acceptance: accurate title and role identity across employer variations, selected-job panels, and application transitions; search results and career landing pages do not become single-role findings.

### 7C. Improve the generic fallback and dynamic loading

- Combine matching JobPosting metadata, scoped visible headings, role identifiers, location/employment metadata, substantial description text, and a relevant Apply action. Keep URL patterns as supporting evidence.
- Support scoped `h2` titles and open shadow-root content where practical. Use candidate ranking with explicit reasons; do not present an uncalibrated score as a probability.
- Keep ambiguity and incomplete extraction visible instead of weakening every check into a positive match. Metadata must correspond to the displayed role.
- Observe relevant changes within each scanned document, debounce actual content changes, and fingerprint selected-role text. Scrolling or a third-party overlay changing its score must not restart interpretation; genuinely newly loaded job text should.

Acceptance: supported delayed-loading and single-page-navigation fixtures update correctly without mixing jobs, flickering on cosmetic changes, or retaining stale findings.

### 7D. Give every failure a useful recovery path

- Distinguish “No job signals found,” “Job content is still loading,” “Embedded job could not be read,” and “Choose one job.” Avoid claiming a page is not a job when access is incomplete.
- Offer user-triggered analysis of selected/pasted job text, with a preview and explicit “user-provided text” provenance. Do not automatically include form answers or treat pasted text as independently verified page content.
- Where an observed embedded posting URL is available, offer opening that posting directly. Keep manual retry and an issue-report option available on missed detections as well as detected roles.
- Include only minimal diagnostic facts in an explicit local report: detector version, reason codes, frame counts, candidate counts, and sanitized source addresses. Do not silently collect browsing history or transmit page text.

Acceptance: blocked or unsupported pages explain the limit and offer an actionable fallback; manual text can produce evidence-based findings without pretending automatic detection succeeded.

### 7E. Measure accuracy and maintain coverage

- Reuse section 4's completed evaluation corpus where suitable and expand it with the platforms above, custom sites, embedded jobs, detail panels, applications, and hard negatives. Reserve fresh held-out examples for these improvements and split by employer/template before tuning to reduce leakage.
- Track job-detection precision and recall separately, role-selection accuracy, extraction completeness, unsupported/access failures, and time until detection. Report counts and performance per layout/platform, not only one aggregate percentage.
- Keep the existing sponsorship-label precision goal separate from detection metrics. A detected job can still have unclear sponsorship evidence.
- Proposed section 7 detection targets: at least 95% precision and 95% recall on the held-out supported-layout sample, with sample counts and uncertainty reported. These are acceptance targets for the future improvements, not core-release requirements, achieved results, or guarantees for the whole web.
- Require every confirmed miss to gain a sanitized regression fixture. Include frame races, multiple jobs, inaccessible content, hidden frames, private inputs, and interaction with other extensions in browser checks.

### 7F. Major improvement: recognize sponsorship wording more effectively

Added September 26, 2026 at the user's request. This is a major improvement milestone, not a claim that the current phrase rules understand arbitrary language. Keep it deferred with the rest of section 7 while section 6 release preparation proceeds.

- Expand beyond a small set of explicit phrases: collect independently reviewed real wording for sponsorship offers/refusals, immigration assistance, exceptions, and indirect formulations. Include difficult negatives such as relocation support, general work authorization, and non-immigration sponsorship.
- Preserve meaning across sentences, paragraphs, bullets, and headings. Resolve who a statement concerns, which role/location/program it covers, negation, exceptions, and current versus future timing. Never broaden a restricted offer by dropping its conditions.
- Keep sponsorship, CPT, and OPT independent; distinguish application questions, applicant preferences, company policy, historical statements, and current-role policy. Conflicts and unsupported conclusions must remain reviewable.
- Improve employer extraction alongside language recognition, including reviewed careers-domain/platform fallbacks. Add the observed Atlassian "Employer not identified" case as a regression fixture; preserve explicit employer metadata and do not collapse subsidiaries or staffing entities.
- Evaluate stronger local rules against an optional structured AI interpretation approach on the same reviewed examples. AI is a design option to assess, not approved automatic transmission or a required dependency. Any future external processing needs an explicit disclosure/opt-in, minimized input, verified verbatim citations, and an unclear fallback when evidence is unsupported.
- Split new examples by employer/template before tuning. Measure definitive-label precision and useful coverage separately for sponsorship, CPT, and OPT, with sample counts, uncertainty, false positives/negatives, and review rates. Preserve a fresh held-out set; do not call exposed regression examples independent validation.

Acceptance: demonstrate better recognition of varied real phrasing without sacrificing evidence accuracy; target at least 95% definitive sponsorship precision on fresh held-out examples with adequate sample counts, and publish coverage beside precision. Every definitive claim must retain exact supporting evidence and conditions. Add adversarial and regression cases for each confirmed interpretation failure. These are future targets, not achieved results.

## Product promise and first deferred deliverable

Universal automatic detection cannot be guaranteed: pages and permissions change, content can be inaccessible, and listings can be ambiguous. Aim for measured high coverage on supported layouts and a clear explanation/recovery path on every failure.

After sections 1–6 are complete, the first section 7 implementation deliverable should be **7A plus the iCIMS reader from 7B**, validated against this exact page (or a preserved regression fixture if the posting has expired) and frame regressions. Then broaden platform coverage and evaluate the generic fallback. Existing sponsorship/CPT/OPT interpretation remains evidence-based; finding a job must never imply that the employer offers sponsorship.
