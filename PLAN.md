# Sponsor Not Sponsor — streamlined plan

September 29, 2026. Active roadmap following the whole-repository audit.
Implementation has started. Per the user's instruction, complete the non-model cleanup and review preparation first; Laya development comes last. Model validation remains a prerequisite for a model-powered release.

## What we are building

You open a job. The extension reads the correct vacancy and looks first for wording that blocks an international applicant. It shows the exact evidence and helps answer the practical question: **does this posting contain a reason not to apply?** It does not determine personal immigration eligibility.

The intended flow is **open job → extract its text → find explicit blockers or support → validate the quoted evidence → badge and explanation**.

## Decision contract

The first release has one main result:

| Result | Meaning | Badge |
| --- | --- | --- |
| **Explicit blocker found** | The posting excludes sponsorship or states an immigration/status requirement that blocks the applicant. | Red |
| **Sponsorship stated** | The posting explicitly offers or considers immigration sponsorship for this role. This is expected to be uncommon. | Green |
| **No blocker found** | A complete readable posting contains no explicit blocker and no explicit sponsorship statement. The role may be worth applying to; sponsorship is not proven. | Neutral/positive |
| **Could not verify** | The description is incomplete, unreadable, conflicting, or cannot be matched safely to the role. | Gray/amber |

Explicit blockers include:

- no sponsorship now or in the future;
- the applicant must not require sponsorship;
- U.S. citizenship or permanent residency is required;
- permanent or unrestricted work authorization is required in wording that excludes temporary/student authorization;
- international students or temporary visa holders are explicitly excluded;
- CPT or OPT is explicitly excluded.

A sponsorship question is not a blocker. Security-clearance, export-control, work-authorization, and location wording count only when the posting actually states the disqualifying citizenship or immigration condition. Silence is reported as **No blocker found**, never as factual proof that the company sponsors.

Each blocker or explicit sponsorship result requires an exact role-specific quotation. Conflicting positive and negative wording becomes **Could not verify** and shows both quotes.

Separate CPT and OPT cards move to the backlog. Their explicit exclusion language still counts as a blocker in the main result.

## Evidence and source rules

Evidence collected so far supports the blocker-first design but does not justify calling silence sponsorship:

- The September 26 review of 30 current internships found **0 explicit offers, 14 refusal/blocker outcomes, and 16 unclear outcomes**.
- A later 20-role convenience check found **1 explicit offer, 3 explicit refusals, 6 readable postings with no clear statement, and 10 pages the research browser could not verify**. The positive example was Primer, whose role page explicitly offered J-1 and F-1 sponsorship.
- Neither sample is random or large enough to estimate how common sponsorship is. The useful conclusion is narrower: explicit positive wording exists, explicit negative wording exists, and silence proves neither.
- The September 30 human review of 12 selected postings produced **4 explicit blockers, 1 explicit sponsorship statement, 6 no-blocker results, and 1 expired posting**. The extension detected 9 of 11 open roles, handled the positive control, missed two pages, and did not promote any of the four blockers into its main sponsorship result. See [the validation report](evaluation/results/current-internship-validation.md).

Use sources in this order:

1. **The official posting for the exact role.** This is the only source that directly controls the main result.
2. **The official overview for the same vacancy.** Use it only after matching the employer, title and role identifier.
3. **An official employer hiring or immigration policy.** Show it later as company context; do not silently convert it into a role-specific claim.
4. **Historical government sponsorship data.** Show it only as history; it cannot prove that the current role sponsors.
5. **Job lists and aggregators.** Use them to discover postings, never as the final policy evidence.

Authoritative references guide the vocabulary:

- [DHS practical-training overview](https://studyinthestates.dhs.gov/assets/SEVP_PracticalTrainingOverview_1-pager.pdf): CPT and OPT are forms of F-1 practical training with different authorization and employer requirements. This is why they are not treated as synonyms for future visa sponsorship.
- [USCIS H-1B characteristics](https://www.uscis.gov/sites/default/files/document/foia/Characteristics_of_H-1B_Specialty_Occupation_Workers_FY17.pdf): an employer obtains a certified labor condition application and files the H-1B petition. This supports treating employer-filed visa sponsorship separately from a student's existing practical-training authorization.
- [Department of Justice citizenship-status FAQ](https://www.justice.gov/crt/iers-frequently-asked-questions-faqs): employers may ask whether an applicant has work authorization and will need employment-visa sponsorship. The question alone does not state the employer's policy.
- [Department of Justice recruiting guidance](https://www.justice.gov/crt/best-practices-recruiting-and-hiring-workers): citizenship-status restrictions can be unlawful unless supported by a law, regulation, executive order or government contract. The extension reports exact wording; it does not decide whether a restriction is lawful.
- [USCIS Form I-9](https://www.uscis.gov/sites/default/files/document/forms/i-9.pdf): employment-authorization verification is a separate process and workers choose from acceptable documents. Generic I-9 or work-authorization language is not automatically a no-sponsorship statement.
- [SimplifyJobs Summer 2027 list](https://github.com/SimplifyJobs/Summer2027-Internships): a frequently updated discovery pool for validation examples. Each label must still be verified against the linked official posting.

These references define terms and evidence boundaries; they do not provide immigration or legal advice for an individual applicant.

## What works now

1. The extension recognizes supported job pages and extracts role details and passages.
2. It handles page changes, same-origin embedded jobs, a bounded cross-origin frame path, and a narrowly matched Ashby overview recovery path. These are implemented features, not proof of universal website coverage.
3. Text rules now feed the blocker-first result above. The older sponsorship, CPT and OPT findings remain internal evidence inputs instead of separate user-facing cards.
4. Local Laya can replace those three older findings when explicitly enabled. It uses a separate process on this computer; it is not embedded inside Chrome. Its questions and outputs must eventually be simplified to the same blocker-first contract.
5. The badge and panel show findings and source quotations. Pause, site-disable, rescan, keyboard controls and diagnostic export exist.
6. Company research is deferred. Its service and tests are retained, but the active extension's research controls and requests have been removed.

**Main gap:** Laya is installed and connected, but useful decision quality is not established. Both recorded checkpoints returned zero definitive sponsorship results on 12 authored probes, missing all six examples needing a definitive answer. Passing integration tests shows that messages and safeguards work; it does not show that the model understands sponsorship.

Evidence: [model results](evaluation/results/laya-development.md), [model setup](server/DECISIONS.md), [evaluation limitations](evaluation/README.md).

## Work order

1. **Complete:** simplify the active extension, consolidate documentation, and run all existing browser coverage through one command.
2. **Complete:** review the first real examples using [the review worksheet](evaluation/REVIEW_WORKSHEET.md) and record the results in [the validation report](evaluation/results/current-internship-validation.md). Prepare a fresh untouched holdout before tuning.
3. **Complete:** replace the extension's old three-topic presentation with the four-result blocker contract. Keep exact quotations and treat a missed blocker as the highest-severity error.
4. **In progress:** the first fixes for Cloudflare description coverage, Lever overview recovery, and redirected iframe adoption are implemented with automated regressions. Next verify the named live pages and finish the iframe lifecycle checks below before more decision tuning.
5. **Last development phase:** simplify Laya to classify the same four results, validate it, and integrate a proven configuration. The existing opt-in experiment remains available unchanged while this work is deferred.
6. **Release gate:** private beta and release follow model validation; putting Laya last does not permit publishing unvalidated model decisions.

The milestone numbers below are identifiers, not the execution order above.

### Active job-detection implementation — September 30

Keep detection separate from policy interpretation: identify the exact vacancy, capture its public description, then interpret it. Laya development remains deferred.

| Workstream | Implementation | Acceptance checks |
| --- | --- | --- |
| Description coverage (Cloudflare) | Extend shared recognition of observed description sections; preserve the stricter checks for application-only pages. | Full Greenhouse description is captured with its alternate headings; form-only pages, careers pages and unrelated articles do not become complete jobs. |
| Application overview (Neighbor/Lever) | Extend the existing bounded official-overview recovery to the matching Lever `/apply` route. Coordinate scanner recognition if needed. | Matching vacancy is recovered with source attribution; wrong title/employer/identifier, redirects, navigation and cancelled requests cannot supply evidence. |
| Embedded posting (H&R Block/iCIMS) | Diagnose and fix parent/child coordination, including URL changes during frame loading. Bind results to the actual visible frame and current document. | Representative wrapper adopts one complete child; delayed load, redirect, removal/replacement and rescan work. Hidden/multiple frames, stale replies, navigation, pause and site-disable cannot leak a result. |
| Integration and review | Review all three diffs together, run typecheck/unit/build and the browser suites, then repeat the named live-page checks where accessible. | Record automated results separately from live verification. Keep failures explicit; do not claim universal ATS coverage from fixtures. |

Three lower-cost subagents own the independent workstreams. Shared scanner edits have one owner; integration and this roadmap remain with the primary agent. Broader platform readers, shadow-DOM support and additional websites remain follow-up work driven by observed failures, rather than a rewrite in this pass.

September 30 implementation checkpoint:

October 1 H&R Block correction: downloaded official child HTML reproduced `non-job` independently of frame transport. Its responsive Apply link has `title="Apply"` but concatenated text `ApplyApply`; the scanner missed the action, while metadata's alternate slug URL did not match the current route. Shared action detection now considers the link's title alongside its other labels. The same captured child returns `Machine Learning Intern - S` with `description-found`, and parent-wrapper replay adopts it. The embedded browser regression now includes this exact duplicated-label structure. Live confirmation in the user's reloaded extension remains separate from these checks.

- Implemented shared alternate-heading recognition; Cloudflare's application-page regression fails with the old patterns and passes with the fix. Form-only descriptions remain incomplete.
- Implemented generic Lever application recognition and exact-route overview recovery using the existing bounded fetch and identity checks. No employer-specific production exceptions were added.
- Implemented redirected iframe identification through an extension message targeted to Chrome's frame/document identity, followed by verification of the responding window and origin. Reads preserve final child-source URLs. Both rescan controls clear frame results and request fresh ones.
- Verified: `pnpm check` (**186 tests**, typecheck and build), `pnpm test:browser` (including Ashby/Lever overview recovery and a redirected cross-origin wrapper), and `git diff --check` passed. Coordinator regressions reject a hidden child and late reads after clear, parent navigation, removal, src replacement or hiding.
- Still pending: live confirmation on Cloudflare, Neighbor and the actual H&R Block wrapper after extension reload. The redirect browser fixture represents the coordination failure; it is not a capture or proof of the live iCIMS page. Add explicit browser checks for delayed insertion, same-src document replacement, child-only SPA navigation and site-disable/resume before marking milestone 4 complete. Preserve uncertainty when an unsupported flow cannot be verified.

October 1 live-feedback follow-up:

- User confirmed scans on Cloudflare, Neighbor, H&R Block, Southwest, Dandy and Enova; reported missing employer metadata, Greenhouse badges, AMCA recognition and Peraton's citizenship blocker.
- Reproduced Greenhouse removing the extension UI host during page initialization while content-script scans continued to work. The UI now remounts when removed; a browser regression removes the host and verifies its automatic return.
- AMCA has multiple description h1 headings. Exact Greenhouse page-title agreement now selects the visible vacancy and supplies its employer. Lever uses matching page-title branding; iCIMS accepts canonical slug aliases only for the same host and numeric vacancy ID.
- Peraton's required citizenship bullet now cites both “Required Qualifications” and “US Citizenship”; bare citizenship outside a required section remains non-blocking. Enova's “we are not able to sponsor visas” is now recognized by the shared sponsorship rule, with conditional and negated examples covered.
- AMCA's extracted “All applicants must be U.S. persons within the meaning of ITAR.” exposed a punctuation mismatch in the final badge rule. It now recognizes both US and U.S. person wording; a badge regression covers the exact statement.
- Live disposable-browser verification restored Cloudflare's badge and employer, AMCA recognition, and Neighbor/H&R Block employer metadata. Peraton now shows Explicit blocker found. Enova's refusal is an explicit blocker; the earlier No blocker found result was incorrect.
- Verification: 194 tests, typecheck, build and all four browser regression suites passed. The browser check includes removal/restoration of the badge host; `git diff --check` passed.
- Iframe lifecycle checks listed above remain pending. These live checks use the named public ATS URLs, not a proof of every employer wrapper or application flow. Laya remains last.

| Step | Work | Done when |
| --- | --- | --- |
| 1. Narrow the product | Keep job reading, local model experimentation, evidence display and user controls. Pause company-research expansion, additional model providers and store-promotion work. Use this plan as the current roadmap. | The README has one installation path, one normal browsing flow and one link to model experiments. Older plans are marked historical, with their evidence links preserved. |
| 2. Make examples reviewable | Review current public internships. Record the expected main result, blocker/support type, exact quote and source before viewing the extension result. | Every example is labeled Explicit blocker, Sponsorship stated, No blocker found, or Could not verify, with a reason and exact evidence where required. |
| 3. Reformat the extension | Reuse the scanner, citations and evidence panel. Replace the old three-topic summary with the blocker-first result. Put detailed CPT/OPT cards in the backlog. | The badge and panel use the four labels above. “No blocker found” never claims proven sponsorship. Explicit CPT/OPT exclusions still trigger a blocker. |
| 4. Harden observed page reading | Fix shared scanner and frame-coordination causes rather than adding employer-specific exceptions. A parent wrapper may adopt exactly one visible child job only when its identity and source are preserved. Cover late-loading and redirected iframe documents, navigation, frame replacement/removal, hidden or multiple frames, pause/site-disable state, and stale child replies. Add matching overview recovery only for ATS application URLs with a verifiable role identity. | H&R Block's iCIMS wrapper returns the child role and complete description; equivalent one-job iframe wrappers work through the same path. Neighbor's Lever application resolves only to its matching overview. Cloudflare's visible description is complete. Browser regressions prove that ambiguous, hidden, stale, or mismatched child content is never adopted. |
| 5. Improve Laya outside the browsing loop | Reuse the evaluator and downloaded models. Ask whether each passage contains a role-specific blocker, explicit support, or neither. Change one configuration at a time and preserve each baseline. | Laya identifies blockers and rare explicit support with valid quotes, while silence becomes No blocker found and incomplete/conflicting evidence remains unverifiable. |
| 6. Validate on unseen examples | Expand toward 150–200 representative examples. Split by employer/template before tuning and reserve a fresh reviewed holdout. Measure extraction failures separately from decision failures. | Report blocker precision and recall, missed blockers, false blockers, explicit-support results, no-blocker coverage, counts and latency. Require at least 95% precision on definitive blocker/support results with enough reviewed examples, without treating the number alone as beta approval. |
| 7. Use the proven model in the app | Reuse the opt-in integration; avoid a new backend or abstraction. Test navigation, pause, opt-out, unavailable service and incomplete evidence. | The tested configuration passes the quality gate and browser checks; only then consider making it the normal decision engine. |
| 8. Private beta, then release | Try normal application browsing on representative supported sites. Fix observed blockers. Package the tested extension and document the separate local model setup. | Human review confirms useful answers, correct role matching, understandable uncertainty and unobtrusive UI. Run artifact verification before distributing a release. |

Personal examples are **test inputs**, not automatic training. Adding a passage or correcting its expected answer does not change downloaded model weights. Changing the typed questions changes what is asked; fine-tuning would be a separate, currently unimplemented training task.

## Ranked cleanup recommendations

The implementation status below records which recommendations have been applied. Historical material and deferred backend code remain recoverable in place.

1. **yagni: Remove company research from the first release's active scope.** Its separate service, registry, search, cache and settings add a second problem before the primary decision problem is solved. The current registry contains one employer and no policy/history records. Keep the implementation recoverable; remove its runtime/UI hooks together only if applying this scope cut. Revisit after direct posting interpretation passes validation. [Registry](server/employers.json:1), [service](server/research-service.ts:84), [UI](extension/popup.html:25).
2. **shrink: Consolidate the four overlapping roadmaps.** They total 731 lines and mix original requirements, historical problems and current progress. Keep this active plan; label or archive the older documents instead of continuing to maintain all four. Preserve linked audit/checkpoint evidence. [Original plan](job-sponsorship-extension-plan.md), [implementation](IMPLEMENTATION.md), [detection plan](DETECTION_IMPROVEMENT_PLAN.md), [extraction plan](JOB_RECOGNITION_EXTRACTION_PLAN.md).
3. **delete: Remove unused Python setup and placeholder instructions.** The README directs users to a generic `.venv` reserved for future tooling, while Laya actually uses `.decision-venv`. Remove that obsolete setup flow and the unused `APP_ENV` placeholder from the example configuration. Do not remove a user's environment merely to shorten the repository. [.env.example](.env.example:3), [README](README.md:40).
4. **shrink: Make the README a starting guide.** Put the short app flow, current limitations and build/load instructions first; link to Laya setup and evaluation details. Correct its statement that only the research service loads `.env`: decision commands also load it. [README](README.md:55), [commands](package.json:20).
5. **shrink: Give browser regressions one documented entry point.** The overview and cross-origin runners are not reached by the normal `test:browser` command. Invoke the distinct suites through an existing script or package command before attempting to merge their setup. Preserve same-origin, cross-origin, overview, popup, navigation and privacy assertions. Similar browser setup does not make their behavior checks interchangeable. [Browser scripts](scripts/browser-smoke.mjs), [overview](scripts/browser-overview.mjs), [cross-origin](scripts/browser-cross-origin.mjs), [embedded](scripts/browser-embedded.mjs).
6. **yagni: Stop expanding release materials until accuracy is ready.** Keep existing packaging and archive verification for the eventual release. Do not spend current effort on more store screenshots or promotional assets. [Release verification](scripts/release-verify.mjs:7).

## What should stay

- **Local Laya and its evaluator:** this is the explicitly chosen direction. Keep the existing experiment off by default; do not throw away the integration merely because its first accuracy results are poor.
- **Scanner, frame coordination and overview matching:** retain implemented coverage and identity checks. Add readers only for observed misses; a wholesale frame rewrite is not needed for this plan.
- **Safety and accessibility:** preserve input/schema validation, exact source attribution, stale-response rejection, private-answer exclusion, request limits, pause/disable controls and keyboard behavior.
- **Diagnostic export:** it works as a local file for manual review. A remote receiver is unnecessary. Consider the clearer label “Export diagnostic report.”
- **Tests and dependencies:** no unused dependency was confirmed. Preserve meaningful regression coverage; do not reduce test counts as a goal.
- **Historical evidence:** preserve the first holdout, its lock, model baselines, live samples, reviews and captured pages. Live pages change, so those captures cannot simply be regenerated. Current-run outputs such as `dist/` and `test-results/` are different from historical baselines.
- **Small shared build helpers:** `release-files.mjs` is used by both build and release tooling; deleting it would duplicate the asset list.

## Local model locations

All paths below are relative to this project directory:

| Location | Meaning |
| --- | --- |
| `.decision-venv/lib/python3.12/site-packages/laya/` | Installed Laya Python library |
| `.model-cache/hub/models--convaiinnovations--laya-multilingual/` | Downloaded multilingual checkpoint cache |
| `.model-cache/hub/models--convaiinnovations--laya-typed-decisions/` | Downloaded decision checkpoint cache |
| `server/laya_worker.py` | Project code that loads the model and classifies passages |
| `server/decision-questions.ts` | The typed questions asked about passages |
| `scripts/evaluate-decision.ts` | Editable development examples and expected sponsorship labels |

The existing development evaluator writes its current-run JSON, so preserve that output before a new comparison. Keep frozen baseline files unchanged. No model download or training is required for this audit's recommendations.

## Validation and audit scope

Three GPT-6 Luna agents reviewed the extension/UI, Laya/research services, and tests/tooling/evidence. The primary agent reconciled their findings against the user's local-Laya goal. Broad deletions, replacing polling with notifications, and rewriting all frame handling were not justified as immediate simplifications.

Initial audit check on September 29: `node --import tsx --test tests/*.test.ts` — **178 passed, 0 failed**. Existing uncommitted work was preserved.

## Implementation status

October 2 Part 2 checkpoint: shared scoped-export interpretation and iframe supplementation/lifecycle improvements pass 208 tests, typecheck/build, and Chromium regressions. Live Waymo confirms scoped citations; Pinterest remains inaccessible behind a 403 challenge. Independent dataset review and Laya quality work remain pending. See [Part 2](IMPROVEMENT_PLAN_PART_2.md) and [verification](evaluation/part2/verification.md).

- Applied: research UI, requests and permission disconnected from the active extension; deferred research source and tests retained.
- Applied: README simplified, old roadmaps marked historical, obsolete generic Python setup and `APP_ENV` example removed.
- Applied: badge, popup and on-page panel now use Explicit blocker found, Sponsorship stated, No blocker found, or Could not verify from one shared resolver; separate CPT/OPT cards were removed from the user-facing summary while explicit exclusions still trigger a blocker.
- Applied: `test:browser` runs smoke/accessibility, same-origin embedded, overview and cross-origin suites sequentially. Packaged-release verification includes the same additional suites. Actual toolbar sizing remains a separate check.
- Completed: one reviewer labeled the 12-posting current-internship development batch. The report isolates four blocker regressions and two reading failures. Second review, missing-category collection and a fresh holdout remain pending.
- In progress: shared description, Lever overview and redirected-frame fixes pass automated checks; see the September 30 checkpoint for live verification and remaining lifecycle coverage. The iframe browser regression exercises parent-to-child adoption, not only the child scanner.
- Deferred until last: Laya questions, models, training, thresholds and accuracy experiments. Existing model installations and baselines are untouched.
- Deferred until validation: promotion, new research features and production release.

No dependency was removed. Historical JSON line counts are not application-code savings.

### Verification after cleanup

- `pnpm check`: type-check, **178/178 tests**, and build passed.
- `pnpm test:browser`: smoke/accessibility, embedded, overview and cross-origin suites passed.
- `pnpm test:popup`: actual toolbar retained 400-pixel width with no horizontal overflow, before and after onboarding.
- `pnpm test:decision:browser`: simulated model connection, opt-in/out, privacy, outage and origin checks passed. This verifies the retained connection, not model quality.
- `git diff --check`: passed.

Tests needed local sockets/browser access outside the sandbox. Live model inference, training, fresh human-reviewed accuracy evaluation and packaged-release verification were not run. No release was published.
