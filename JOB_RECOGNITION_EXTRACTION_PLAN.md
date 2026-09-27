# Job recognition and description extraction: research and implementation plan

Date: September 26, 2026. Status: implementation underway. See [the first implementation checkpoint](evaluation/live-2026-09-26/IMPLEMENTATION_CHECKPOINT.md) for completed work, measured results, and remaining phases. The phases and targets below remain the broader plan.

This expands sections 7A–7E of [the detection improvement plan](DETECTION_IMPROVEMENT_PLAN.md). The initial implementation follows this research plan; the full program and accuracy beta remain in progress. Section 7F remains the separate work on understanding sponsorship language.

## 1. The intended result, in plain language

The extension should answer three questions separately:

1. **Which exact job is this?** Identify the vacancy, employer, requisition, and relevant page sections without confusing branding, another vacancy, or a careers homepage for the job.
2. **How much of that job have we read?** Collect the description, qualifications, eligibility statements, closing notices, and relevant public application questions. Explain any unavailable content.
3. **What does the collected evidence say?** Run sponsorship interpretation on attributed evidence. A question about sponsorship is not an offer; missing text is not a refusal.

The proposed flow is: **find candidate jobs → select one vacancy → collect its sources → check coverage and conflicts → interpret → show evidence and limitations**.

“Complete” cannot mean that an employer has disclosed every relevant policy. It should mean that the supported, identified public description has been captured with no known unresolved extraction gap. Even then, the employer may say nothing about sponsorship. Prefer the product wording **“Description captured; no known gaps”** over “Entire website analyzed.”

## 2. What the current code actually reads

The [30-posting audit](evaluation/live-2026-09-26/REPORT.md) returned 11 role records, two with wrong titles. Of 25 destinations containing readable vacancy or application content, only nine had correctly identified role titles. Four access failures and one homepage redirect are separate problems. These are observations from a convenience sample, not general accuracy estimates.

| Current behavior | Consequence | Evidence in this project |
|---|---|---|
| `roleTitle()` accepts only a unique visible `h1`, `data-job-title`, or `itemprop=title`. | Ordinary `h2` titles fail; branding and template headings can win. | Workday misses; Northwestern Mutual and Boston Scientific wrong titles. |
| Structured `JobPosting` is matched against that title, after which missing titles still cause early return. | Useful metadata cannot independently rescue a valid job page. | `src/scanner.ts`, `structuredJobs()` and `scanPage()`. |
| `scanRoot()` selects one detail container, otherwise the first `main`/main landmark or body. | Important job sections and Apply controls outside that root may be omitted. | Direct code finding; needs targeted regression fixtures. |
| The generic detector needs two English section-word groups plus an Apply action, unless another recognition branch succeeds. | Unfamiliar headings or “I’m interested” buttons fail recognition. | Ralliant, AbbVie, RRS Group. |
| Content scripts run only in the top document; extraction excludes iframe elements. | Jobs entirely inside frames are inaccessible to the scanner. | Previously inspected Liberty Mutual iCIMS case, documented in section 7A. |
| The text walker does not enter shadow roots. | Web-component content can be missed. | Code finding; not established as a cause among the 30 audited postings. |
| It excludes scripts, navigation, footer, aside, forms’ editable controls, related jobs, and certain hidden elements. | Useful exclusions protect attribution and answers, but blanket structural exclusions can discard genuine notices. | `EXCLUDED` and `visible()` in `src/scanner.ts`. |
| Extraction stops after 100,000 input text characters or 1,000 groups. | Large documents can be truncated before a closing policy. | Limit and warning already exist; avoid silently treating that result as complete. |
| One section-word group and at least 100 characters count as description presence. | A small application form can be marked `description-found`. | Flint, Bedrock, Qumulo. |
| Structured description is only appended if the visible description heuristic fails. | A partial visible description can prevent richer metadata from being examined. | Direct code finding; disagreement handling needs tests. |
| The controller observes document mutations and polls URL changes. It ignores changes within footer/aside/navigation and some other regions. | Dynamic support already exists, but follows the same incomplete document scope. | `src/controller.ts`; do not replace working SPA safeguards unnecessarily. |

**The screen boundary is not the extraction boundary.** The scanner walks DOM text, not a screenshot, and does not require text to be inside the viewport. Ordinary text below the fold is readable without scrolling. Missing content becomes a problem when it is outside the selected root, in another document, not yet loaded, collapsed/hidden, truncated, or only on the overview. The current visibility test is also not a complete model of rendered visibility; closed disclosure elements, clipping, and shadow-host visibility need browser tests.

Reading `document.body.innerText` alone would broaden collection but would not solve identity, iframe, source completeness, or unrelated-job contamination. MDN distinguishes rendered `innerText` from raw node text; neither property is a universal job extractor. [MDN: innerText](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText)

## 3. What research establishes about Simplify

These are public product claims and documented behavior, not an independent accuracy benchmark or an inspection of proprietary source code.

| Confirmed public information | What we can learn | What it does not establish |
|---|---|---|
| Copilot advertises support for over 100 job boards/application portals, including Workday, iCIMS, Greenhouse, Lever, and SmartRecruiters. | Maintain explicit compatibility across platforms and employer variations. | Its selectors, model architecture, or detection precision. [Product FAQ](https://simplify.jobs/copilot) |
| Its installation guide describes automatically detecting a supported application form and matching fields against the user's profile. | Application recognition is a distinct capability. | That detection retrieves the entire job description. [Installation guide](https://help.simplify.jobs/en/articles/1749022-installing-and-setting-up-copilot) |
| Its autofill guide acknowledges unsupported pages and provides a manual profile-copy fallback. | Unsupported cases deserve a useful fallback, not an invented success. | Its advertised coverage percentage is not sponsorship-recognition accuracy. [Autofill guide](https://help.simplify.jobs/articles/2415391-using-copilot-to-autofill-applications) |
| The job board offers structured requirements/responsibilities, a summary/full-description switch, and company sponsorship history when available. | Preserve the full source separately from summaries and company context. | A company-history signal does not prove an individual vacancy offers sponsorship. [Job-board guide](https://help.simplify.jobs/en/help/articles/2830264-viewing-jobs-on-simplifys-job-board) |
| Its Safari guide explains that page access is needed because application URLs are not standardized. | URL keywords alone are insufficient. | Safari permissions do not document Chrome internals. [Safari guide](https://help.simplify.jobs/articles/8759839-turning-on-copilot-in-safari) |

The earlier audit also observed that Simplify’s Full posting view contained fuller text than its initial summary. The previous Liberty Mutual investigation observed Simplify UI working on that embedded role. These support the need to handle alternate views and embedded jobs; they do not reveal how Simplify obtained the text.

I reviewed Simplify's public help/product material and its [public GitHub organization](https://github.com/SimplifyJobs). The sources inspected do not disclose its production job-recognition/extraction pipeline. A public utility repository, job list, or browser-automation fork is not proof that Copilot uses that implementation. We cannot honestly claim it relies on particular selectors, a particular LLM, frame aggregation, private APIs, or a particular scraping service.

**Our design inference:** a maintained set of platform readers, a generic fallback, explicit support limits, and full-description provenance would reproduce useful observable capabilities. This is our recommendation, not a verified reconstruction of Simplify. We should not make Simplify's mirror or undocumented endpoints a required production dependency.

## 4. The recommended recognition design

### 4.1 Collect candidates before rejecting the page

Inspect known platform containers, matching structured metadata, scoped headings (`h1`, `h2`, and accessible heading roles), active detail panels, requisition identifiers, and application-to-overview links. Retain the reason and source for every identity field. Titles in document metadata or the URL are supporting signals, not sufficient by themselves.

Select a candidate when independent signals agree. Prefer an exact platform/tenant/requisition match, then a matching canonical job URL plus compatible title/employer/location. If IDs are absent, require stronger scoped agreement and preserve uncertainty. A company name, page title such as “Single Position,” or a title shared by several locations must not be enough. Do not merge parent/subsidiary entities automatically.

An Apply action is supporting evidence; an actual job can be closed or have an action outside its description. Recognize relevant link/button text, accessible names, and submit-control `value`, including reviewed platform alternatives such as “I’m interested.” Do not solve this by accepting every button.

Multiple listing cards should not defeat a clearly selected detail panel. Select only the active, identity-matched panel; otherwise return “Choose one job.” Old structured data must not override the current visible vacancy.

Google describes `JobPosting.description` as a full HTML job description and supplies identity fields. This makes it useful evidence, but publisher compliance and freshness must still be checked. A schema record is a candidate, not proof that the rendered page still displays that job. [Google job-posting documentation](https://developers.google.com/search/docs/appearance/structured-data/job-posting)

### 4.2 Use platform readers and a shared fallback

Each reader should return the same candidate, source, section, and coverage structure. A reader that encounters an unknown layout should report the limit and fall back to generic recognition; it should not fabricate empty successful results. Platform identity should combine host/tenant information with page structure.

| Priority | Reader work | Why |
|---|---|---|
| First | Workday, SmartRecruiters, Eightfold; generic title/root improvements | Largest observed title failures and the two incorrect titles; missed application-action wording. |
| First | Ashby overview/application distinction | Demonstrated missing refusal evidence and false description-completeness labels. |
| First infrastructure | iCIMS embedded jobs | Independently confirmed Liberty Mutual frame failure. A 403 response still requires an access-failure result. |
| Next | Greenhouse and Oracle; strengthen employer and scope extraction | Preserve current successes, recover identity, and handle custom wrappers and parent/operating-company distinctions. |
| Next | Lever and additional custom sites | Extend coverage using fresh examples and documented description components. |

Readers should scope genuine job notices even if an employer places them in an aside or footer. Keep unrelated navigation, recommendations, user answers, and third-party extension widgets excluded. Public application questions need their own evidence kind so they cannot become offers.

## 5. The recommended extraction design

### 5.1 Collect sections, not a single undifferentiated string

For the selected vacancy, retain description sections in document order: introduction, duties, qualifications, eligibility, compensation, and closing notices. Preserve heading ancestry, paragraph/list boundaries, and neighboring clauses. This lets later language work recognize that a citizenship bullet belongs under Requirements and that “This includes…” refers to the preceding policy.

Do not require every job to have a salary section or English headings to qualify. Section labels are supporting context; completeness concerns whether the identified source was fully read. Never discard a section just because it lacks a sponsorship keyword.

Retain exact source text for citations, alongside normalized text for matching. Deduplicate repeated copies without losing separate provenance. Do not silently overwrite a disagreement between visible text and metadata. Keep the conflicting passages and require review.

### 5.2 Read the relevant documents and components

Enable frame-local collection in eligible matching frames, and aggregate one selected result per browser tab. Chrome supports `all_frames`; normal parent-document queries do not traverse embedded documents. Keep UI only in the top frame. [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)

Route each result through a coordinator keyed by tab, browser-supplied frame/document identity, navigation generation, and vacancy identity. Do not accept the first frame reply as the tab result: Chrome messaging only uses the first response from competing listeners. Reject late replies after navigation, remove detached-frame results, and re-collect after worker restart. [Chrome messaging](https://developer.chrome.com/docs/extensions/develop/concepts/messaging), [MessageSender reference](https://developer.chrome.com/docs/extensions/reference/api/runtime#type-MessageSender)

Require top-level pause/site-disable policy to apply before child extraction. Frame relevance must include ancestor visibility and identity; if a cross-origin child cannot be reliably associated with the displayed role, keep it unselected rather than merging it. A bounded collection timeout produces partial coverage, not endless loading.

Traverse accessible open shadow roots and assigned slot content with deduplication. Observe each included root separately, and account for the host's visibility. Normal `shadowRoot` access returns null for closed roots; treat inaccessible content as a coverage limit. Do not promise universal web-component access. [MDN shadowRoot](https://developer.mozilla.org/en-US/docs/Web/API/Element/shadowRoot)

### 5.3 Handle loading, collapsed text, and navigation

Keep the current useful mutation observation, debouncing, and stale-navigation protection. Extend observation to selected frames and open shadow roots. Track changes to role identity, relevant sections, disclosure state, and source completion rather than all cosmetic changes. Mutation observation is scoped to the node/subtree being observed; it is not a whole-browser content-completeness guarantee. [MDN MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe)

Use an immediate provisional scan, then bounded follow-up collection while relevant content changes. Proposed initial budgets for measurement: 300–500 ms quiet period, a 5-second initial settling deadline, and continued event-driven updates afterward. These are tunable defaults, not proof that all content has loaded.

If a verified disclosure contains the selected job's description, support a deliberate “Read full description” action or a tested read-only source path. Unknown controls should prompt the user to expand the section. Do not indiscriminately click buttons or scroll every page. Lazy-loaded or virtualized descriptions need a supported reader or an explicit partial result. Form submission and applicant values are outside this feature.

### 5.4 Supplement from matching official sources

Compare sources even when some visible description exists. Use exact identity to attach an overview or documented public posting response, not employer/title similarity alone. Prefer already-rendered content first to minimize latency and new requests. A source can supplement missing sections without being mislabeled as text displayed on the application page.

| Platform/source | Documented capability | Proposed use and limit |
|---|---|---|
| Ashby public posting API | Returns description HTML/plain text, job URL, and apply URL for a board. | Match the current posting to its overview; board-level responses need size limits and exact filtering. Missing fields remain missing. [Ashby documentation](https://developers.ashbyhq.com/docs/public-job-posting-api) |
| Greenhouse Job Board API | Public GET endpoints expose job data; listing content can be requested; individual job data is available. | Use exact board/posting identity. Decode content safely and distinguish job description from application questions. [Greenhouse documentation](https://docs.greenhouse.io/job-board.html) |
| Lever Postings API | Individual posting retrieval separates description, lists, and additional closing text, with hosted/apply URLs. | Collect all description components, including closing content; `descriptionPlain` alone is insufficient for the full posting. Respect global/EU endpoint identity. [Lever documentation](https://github.com/lever/postings-api/blob/master/README.md) |
| SmartRecruiters public Posting API | Posting details and structured job-ad sections are documented. | Include qualifications and additional information as well as description. Its documentation notes posting updates require reposting; check freshness against visible content. [Endpoints](https://developers.smartrecruiters.com/docs/endpoints), [objects](https://developers.smartrecruiters.com/docs/objects) |
| Matching page `JobPosting` | Structured identity and description. | Keep independently attributed; detect stale, conflicting, or multiple records. [Google documentation](https://developers.google.com/search/docs/appearance/structured-data/job-posting) |
| Workday, iCIMS, Eightfold, Oracle/custom wrappers | This investigation established layout needs but did not validate a suitable universal public description API. | Begin with rendered-page readers. Do not depend on guessed internal endpoints or label them documented public APIs. |

Cross-origin retrieval needs a separate permission/design step. The present manifest has broad content-script matches but only localhost research as an optional host permission. Do not assume page injection grants background access to every ATS API. Chrome distinguishes content-script requests from extension-origin requests with host permissions. [Chrome network requests](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests)

Proposed retrieval policy: limited HTTPS hosts for supported providers, adapter-constructed requests, exact posting identifiers, explicit source attribution, time/size limits, and cancellation on navigation or pause. Validate every redirect target. Do not accept arbitrary fetch URLs from page messages. Parse returned data inertly; never execute remote scripts or insert untrusted HTML into live UI. Keep credentialed application pages out of this public-source path. A missing permission or blocked response should leave a useful local-only result.

Do not strip query parameters indiscriminately: some identify the job. Preserve tenant, requisition, locale, and meaningful embedded-view parameters. Validate the fetched vacancy even if the URL shape looks familiar. A homepage redirect is not a recovered description.

### 5.5 Make coverage a first-class result

Replace the binary completeness heuristic with separate fields rather than one overloaded confidence score:

| Dimension | Proposed values or data |
|---|---|
| Recognition | selected job, ambiguous jobs, no job signals, inaccessible/unsupported job content |
| Identity | title, employer, platform/tenant, requisition, canonical URL, field provenance, conflicts |
| Description coverage | application only, partial, description captured with no known gaps, unavailable |
| Collection activity | settling, ready, awaiting user expansion; separate from coverage |
| Gaps | uncollected relevant frame, hidden description, missing overview, pending source, truncation, failed request, unsupported component |
| Source | URL, retrieval time, frame/document identity, source kind, source hash, reader version |
| Evidence | original text, section heading path, block order, locator/source field, question/context classification |

“No known gaps” requires a selected identity, an identified description source whose relevant contents were captured, no truncation, no pending known sections/frames, and no unresolved source-identity conflict. It remains a bounded claim about inspected sources. If completeness cannot be established, retain partial status even when the text is long.

Useful UI examples: “Application read; description not yet found,” “Description read from the matching employer overview,” and “Embedded job could not be read.” Keep sponsorship status independent: an explicit refusal found in partial evidence can be shown with its quote and limited coverage, but absence must never become proof of availability or refusal. Conflicting source statements require review.

Preserve a fallback to explicitly selected/pasted text with a preview and user-provided provenance. It does not count as successful automatic extraction.

## 6. Approaches considered

| Approach | Decision | Reason |
|---|---|---|
| Broaden existing regular expressions only | Insufficient | Helps title/action wording but cannot read a different document or recover an omitted overview. |
| Read all body text | Diagnostic fallback only | Broadens context while increasing unrelated-job and widget contamination; still misses inaccessible sources. |
| Use structured metadata only | One source, not the entire solution | It can be missing, stale, partial, or describe multiple jobs. |
| Use documented ATS APIs only | Supplement, not requirement | Useful stable data, but not available uniformly and needs permissions, identity checks, and freshness handling. |
| Use a generic article extractor | Optional comparison baseline | Mozilla Readability targets readable/article content and acknowledges heuristic errors. It does not establish vacancy identity or complete job-policy coverage. Benchmark before adding a dependency. [Readability documentation](https://github.com/mozilla/readability/blob/main/README.md) |
| Send screenshots or whole pages to an LLM | Defer from first implementation | An LLM cannot analyze absent content and could overlook a short policy notice. The observed access/layout defects have deterministic fixes. Any later assisted recognition should propose source locations, pass identity/evidence validation, and never invent missing text. |
| Run a remote browser for every job | Defer | Adds operational cost and diverges from the user's rendered session. Consider only if measured residual misses justify an opt-in service. |
| Layered local readers, scoped fallback, coverage checks, optional official-source recovery | Recommended | Directly addresses the demonstrated failures while keeping sources and uncertainty inspectable. |

## 7. Implementation phases and exit criteria

These are proposed work packages, not started changes. Preserve existing sponsorship rules initially so recognition/extraction improvements can be measured independently. Each phase must pass existing regression checks plus its targeted browser cases before moving on.

| Phase | Work | Concrete exit criterion |
|---|---|---|
| 0 — Freeze the baseline | Convert confirmed audit failures into sanitized, minimal DOM/browser fixtures; label correct identity, intended sections, missing sources, and expected exclusions. Define the coverage contract and reason codes. | Reproduce the existing title, root, form-completeness, and frame failures. Distinguish observed defects from hypothetical test cases. Preserve original audit results. |
| 1 — Correct identity and page scope | Candidate collection/ranking, scoped headings and metadata, action variants, Workday/SmartRecruiters/Eightfold readers, generic root selection. | All corresponding baseline fixtures select the correct title; no company/template heading wins; search pages and related-job cards remain unselected unless one detail is clearly active. |
| 2 — Accurate local extraction and coverage | Section-preserving extraction; scoped notices; question separation; explicit partial/truncated states; metadata comparison; Ashby application/overview distinction. | The three audited Ashby application forms cannot claim full description capture by themselves. Known local notice blocks and heading context survive extraction. No private answers or unrelated notices enter evidence. |
| 3 — Embedded and dynamic content | Frame coordinator, top-only UI, iCIMS reader, open shadow roots, relevant mutation observation, stale-result cancellation. | Liberty Mutual's wrapper and direct frame identify the same vacancy. Nested/hidden/removed frames and SPA changes never combine vacancies or retain stale results. One panel per tab; disabled sites do not trigger child scans. |
| 4 — Verified description recovery | Matching overview recovery; optional documented API readers; permissions and source-provenance UI. Add provider integrations incrementally. | Qumulo overview evidence is recovered with matching identity and attributed source. Flint's missing overview is recovered even though its separate phrase bug may remain. Denied permissions, 403, timeout, stale metadata, and redirects produce explicit gaps. |
| 5 — Holdout evaluation and release decision | Fresh employer/template holdout, browser performance measurement, end-to-end review, user-facing copy, permission/release notes. | Meet the proposed supported-scope gates below, report remaining gaps by platform, and retain a local-only fallback. Do not claim universal coverage. |

Phases 1 and 2 give the fastest improvements on the 30-posting sample. The shared coverage/identity contract must precede frame coordination and additional-source recovery. The prior 7A–7E plan's topics remain valid; this more detailed ordering prioritizes the new audit findings without dropping the embedded-job requirement.

Likely implementation boundaries, to be finalized when implementation is authorized:

| Existing area | Proposed responsibility/change |
|---|---|
| `src/scanner.ts` | Delegate candidate recognition and scoped extraction instead of one title-first monolith. |
| New recognition/platform-reader modules | Common candidate contract, generic ranking, reviewed per-platform readers. |
| New extraction/coverage modules | Section-aware traversal, provenance, gap tracking, conflict handling, deduplication. |
| `src/types.ts` | Versioned identity/coverage/source contracts and compatible citation fields. |
| `src/controller.ts` | Per-document lifecycle, semantic updates, navigation invalidation, bounded collection. |
| `src/content.ts`, `src/background.ts` | Frame collection and one tab result; preserve the existing separate research service. |
| `extension/manifest.json` | Reviewed frame injection and optional supported-source permissions; retain compatibility with the declared minimum Chrome version. |
| `src/popup.ts`, `src/page-ui.ts`, findings/report views | Distinct recognition/coverage messages, evidence navigation, recovery controls. |
| Tests and evaluation tooling | Fixture labels, frame/source integration tests, holdout metrics and versioned reports. |

Description recovery must be separate from company research. Recovering the selected vacancy is not a lookup of the employer's historical sponsorship record. Expanding the employer registry alone would not fix these misses.

## 8. How we will prove improvement

### 8.1 Measure each stage separately

| Metric | Definition |
|---|---|
| Detection precision | Correct single-vacancy detections divided by all single-vacancy detections, including false detections on negative pages. |
| Detection recall | Accessible labeled single-vacancy pages correctly detected divided by accessible labeled single-vacancy pages in the supported test scope. |
| Identity accuracy | Correct selected title, employer where available, and requisition/source association; report missing fields separately from wrong fields. |
| Extraction recall | Human-labeled relevant source blocks recovered divided by all labeled relevant blocks in the inspected description sources. Also report macro averages by posting so long jobs do not dominate. |
| Policy-block recall | Labeled sponsorship/work-authorization/citizenship policy blocks captured, regardless of whether the unchanged interpreter understands them. |
| Contamination | Included blocks belonging to other jobs, unrelated widgets, or applicant answers; private answer inclusion is an automatic failure. |
| False-complete rate | Results claiming no known gaps when a labeled relevant source/section is omitted or truncated. |
| Access coverage | Jobs readable through current page, frame, overview, or optional API; report each path and failures separately. |
| End-to-end findings | Correctly attributed sponsorship findings with correct vacancy identity. Report this separately from extraction and language-only performance. |

Keep the 30 postings as a development/regression set. They are already seen and cannot be the independent holdout. Do not convert their 16 unclear cases into sponsorship refusals to make scoring easier.

Proposed evaluation set: at least 120 new, labeled cases across supported ATS families and custom sites, including at least 40 negatives or ambiguous/access-limited cases. Reserve employers/templates not used in tuning. Include fresh same-template employer variations and a separate entirely unseen-template challenge set. A human should review identity, expected source boundaries, and policy blocks; a second review should resolve ambiguous labels. Report counts and uncertainty rather than only percentages.

Proposed release gates for the declared supported scope: at least 95% detection precision and recall, at least 98% selected-identity accuracy, and at least 98% policy-block extraction recall. Require every known baseline policy block to be retained, zero applicant-answer leakage or cross-vacancy merges in the regression suite, and zero falsely complete known-incomplete fixtures. These are proposed acceptance goals, not achieved results or statistical guarantees. Low per-platform sample sizes must be disclosed; do not hide a weak platform inside an aggregate score.

### 8.2 Essential browser cases

- An ordinary `h2` is the role title; branding `h1` and multiple unrelated headings exist.
- An Apply action is outside the description, labeled “I’m interested,” or represented by submit `value`.
- A selected detail panel is surrounded by other jobs; stale JSON-LD describes the previous role.
- An application form has 100+ characters and Requirements wording but no actual job overview.
- A key notice is in the last paragraph, a scoped footer/aside, a collapsed description, or a delayed section.
- A job is inside same-origin, cross-origin, nested, delayed, hidden, removed, or replaced frames.
- Open shadow content and slotted content are collected once; unsupported components produce a limit.
- The job changes while frame/API results are in flight; no old quote survives under the new title.
- A matched API includes separate closing content; a different tenant returns the same title or numeric ID.
- A source disagrees with metadata, a posting expires, or a request returns 403/404/429/redirect/timeout.
- The text limit is exceeded before a final refusal; truncation cannot claim complete coverage.
- A third-party extension shows sponsorship history beside the job; that widget is not employer evidence.
- Form answers, resume file names, editable fields, hidden application values, and private uploaded text stay excluded.
- Pausing or disabling the top-level site stops collection, requests, and child-frame activity.

Use real-browser tests for visibility, frame isolation, loading, messaging, and shadow DOM; DOM-only fixtures cannot validate those properties. Use sanitized fixtures rather than copied applicant sessions. Measure scan count, CPU time, and time to usable result on defined hardware. Initial performance target: local results within one second after relevant content settles at p95, with bounded retries and no scan loop from the extension's own UI. Treat this as a target to validate, not a fixed web-loading promise.

## 9. Decisions to carry into implementation

The recommended initial scope is English public descriptions on the audited ATS families, plus a conservative generic fallback. Recognize and report unsupported language/content explicitly; localization can expand with labeled fixtures. Do not imply that the initial reader set covers every careers platform.

Start with local identity, extraction, and coverage changes. Add optional official-source recovery after its request/permission behavior is reviewable. Avoid automatically following arbitrary links, using aggregator summaries as employer statements, or treating a successful HTTP response as proof of a correct match.

Before each provider integration, verify several current employer variations, public endpoint availability where relevant, identity fields, and all description components. This research reviewed official API documentation; it did not benchmark these APIs against all 30 employers or implement any of the proposed integrations.

After recognition and extraction are reliable, address section 7F's six observed phrase/context gaps. Qumulo illustrates a source-recovery fix; Rockwell illustrates both a title and language fix. Reporting those stages separately will show which change actually helped.

**Implementation progress:** title/root selection, relevant application actions, matching structured-description recovery, and same-origin embedded jobs are measured in the [first checkpoint](evaluation/live-2026-09-26/IMPLEMENTATION_CHECKPOINT.md). Source-specific description coverage and exact-path Ashby overview recovery are implemented in the next package. The overview reader only fetches the same-origin public job URL derived from an Ashby application URL, requires matching title and requisition identity, bounds the response, and attributes recovered evidence to that overview. A failed or mismatched overview remains incomplete. This recovery path passes unit fixtures and a mocked Ashby URL in Chromium, but has not yet been measured on a live application page that lacks local structured description data.

The remaining work is cross-origin frame coordination, broader provider overview/API readers, hidden/open-shadow-root coverage, the separate sponsorship language-rule failures, and a fresh labeled holdout. These require separate browser and outcome measurements before claiming improved accuracy beyond the previous checkpoint.
