# Evaluation and review

This directory contains authored regression scenarios, exposed posting reviews, and a live installed-extension diagnostic audit. Independent human review of representative real-world examples remains outstanding; these reports do not establish general accuracy or release approval.

## Live installed-extension audit — October 16, 2026

The [audit report](live-2026-10-16/report.md) compares official-source AI reviewer decisions with observed results from the installed deterministic extension in the owner's existing Chrome session. Thirty distinct active vacancies across 21 employers came from the first 33 candidates in a frozen SimplifyJobs README order; three duplicate portals were excluded. Selection used listing age, not random sampling or official posting timestamps.

| Evaluation view | Matches / cases | Rate | Denominator |
| --- | ---: | ---: | --- |
| All tested postings, disputed Qualcomm case treated as a blocker | 23/30 | 76.7% | Includes incomplete coverage and wrong-title results. |
| All tested postings, disputed Qualcomm case treated as contextual | 24/30 | 80.0% | Same 30 cases; alternate reviewer label only. |
| Undisputed headline agreement | 23/29 | 79.3% | Excludes only Qualcomm's unresolved label. |
| Undisputed headline agreement with correct title | 22/29 | 75.9% | Wrong-title result remains in the denominator as a failure. |
| Scannable decision-quality subset | 22/27 | 81.5% | Excludes the disputed label, incomplete Waabi source, and wrong-title Synopsys result. |
| Supported English U.S. subset | 18/19 | 94.7% | Geographic subset; not the overall sample rate. |
| Additional same-vacancy official-source evidence | 21/29 | 72.4% | Undisputed set with two Ryan alternate-portal policies included. |

Against the undisputed first-linked-source labels, the extension detected 10 of 15 blockers and produced zero false blockers: **precision 10/10 (100%)**, **recall 10/15 (66.7%)**. Four misses share EA UK wording outside the intended U.S. scope; the fifth is Ryan U.S. case C27, still missed after expanding the source and rescanning. Including the two additional Ryan same-vacancy policies changes blocker recall to 10/17 (58.8%). These alternative views preserve the original observations rather than replacing source labels after seeing predictions.

The extension marked descriptions complete on 29/30 tested pages; the remaining Waabi application page safely returned `Could not verify`. Correct titles were observed in 29/30 and correct public employer names in 13/30. Ten of ten displayed blocker decisions had source-bound quotations after whitespace normalization, while only six had complete main evidence under the review rubric. These are posting-level citation measures, not independent quote-unit or per-field sponsorship/CPT/OPT accuracy. No `Sponsorship stated` case occurred; that class remains untested.

Use these artifacts together:

- [Report](live-2026-10-16/report.md): definitions, confusion matrix, subgroup results, source sensitivity, and ranked findings.
- [Selection log](live-2026-10-16/selection.md): frozen order, duplicate exclusions, and reserve candidates.
- [Case log](live-2026-10-16/cases.md): chronological reviewer checkpoints and all 30 actual observations.
- [Structured records](live-2026-10-16/results.json): per-case labels, scope, observations, and evidence-file/URL hashes.
- [Verifier](live-2026-10-16/verify.mjs): checks saved IDs, records, hashes, and core counts; run `node evaluation/live-2026-10-16/verify.mjs` from the repository root.

The verifier does not revisit websites, run the extension, establish semantic gold, or prove that current remote pages match the captures. Full HTML and exact HTTP retrieval timestamps were not archived. One known incidental badge exposure and the label/source disputes are documented. These reviewed cases are now exposed evidence; preserve the dated records and use new independent examples for later release claims. Thirty AI-reviewed cases do not satisfy the [registered human-reviewed release gates](part2/acceptance.md).

## Historical authored regression scenarios

The original Section 4 evaluation tooling and reliability fixes were implemented in version 0.4.0. Its recorded scores below describe that authored corpus, not the October 16 live audit.

`corpus.ts` contains **160 AI-authored, constructed scenarios**, each with provisional expected labels and an explanation: 128 policy scenarios and 32 HTML page scenarios. There are 80 development cases and 80 originally reserved cases, with disjoint scenario families. They cover offers, exclusions, conditional wording, timing, application questions, context, CPT/OPT distinctions, restrictions, conflicts, extraction privacy, ordinary pages, and unsupported layouts.

These are not 160 collected vacancies, independently human-reviewed labels, or randomly sampled websites. Cases within a family are related. Synthetic markup and JSDOM do not establish browser or recruiting-platform compatibility. Page-detection results apply to 32 page cases, not all 160 cases.

## Commands

```sh
pnpm evaluate
pnpm evaluate:regression
pnpm evaluate:regression --strict
pnpm check
pnpm test:browser
```

The first command reruns the development set. The second reruns the exposed reserved set and writes `results/reserved-regression.json` and `.md`. It does not overwrite the original reserved results. `--strict` checks the numerical sponsorship target (at least 95% precision with at least 20 definitive predictions); this convenience check is not independent beta approval. A development run has only 19 definitive predictions after fixes, so its sample-count threshold remains unmet even with no incorrect definitive labels.

Unit tests validate the metric calculations, empty denominators, citation checks, split integrity, and the 152 scenarios within current scope. The eight deferred detection cases remain in evaluation denominators and error reports. They are explicitly excluded from the passing regression assertion because their implementation is scheduled for section 7.

## Recorded results

| Run | Cases meeting all expectations | Definitive sponsorship precision | Interpretation |
| --- | --- | --- | --- |
| Development baseline | 75/80 | 19/20 (95.0%) | Found a missed approval condition across paragraphs |
| First reserved run | 68/80 | 20/23 (87.0%) | Below target; archived unchanged in `results/holdout.*` |
| Development after fixes | 76/80 | 19/19 (100%) | Regression result; small constructed sample |
| Exposed reserved set after fixes | 76/80 | 23/23 (100%) | Regression result, not a fresh holdout score |

Across the final two sets, **152/160 cases meet every expectation**. The remaining eight are the detection improvements explicitly deferred to section 7. Detection precision is 15/15; detection recall is 15/23. Those misses are counted rather than removed to improve the score. Both final runs have zero citation-integrity errors. See the JSON for separate CPT/OPT metrics, coverage, confusion matrices, per-family results, and sample intervals.

The first reserved evaluation was run only after the development approval-condition fix. Its frozen case hash is in `holdout-lock.json`. Once its errors were inspected and used for fixes, it became a regression set. Do not describe its subsequent 100% precision as unseen-data accuracy. Source and corpus hashes are included in each report.

## Fixes prompted by the evaluation

- Approval conditions beginning “Subject to” in a following sentence or paragraph remain attached to sponsorship/CPT/OPT evidence.
- Certification funding, educational quotations, and applicant preferences are not interpreted as employer sponsorship offers.
- Employer wording such as “the company offers,” “we never offer,” and future sponsorship exclusions is recognized.
- “U.S. persons” and “green card” restrictions reach the restriction classifier and preserve the cited wording.
- Short windows and browser zoom allow the whole evidence panel to scroll, preventing the header and footer from squeezing out the evidence area. Long text wraps, the evidence region is keyboard-focusable, and popup source links receive a visible focus outline.

Those historical Section 4 results predate the subsequent frame-reading and detection improvements. See [the Part 2 verification](part2/verification.md) and the live audit above for later evidence; do not treat the older coverage figures as a measurement of the current build.

## Browser and accessibility checks

`scripts/browser-beta.mjs` extends the isolated Chrome extension smoke suite. It covers 320×568, 640×360, and 320×256 viewports with a long role title; actual 200% browser zoom; panel bounds and horizontal overflow; accessible dialog/action names; keyboard disclosure, source-link focus and Escape focus return; action target size; and private-answer exclusion. The existing smoke suite also covers navigation, pause/site preferences, mutation handling, report downloads, and application-control avoidance.

Screenshots and the machine-readable browser report are written to `test-results/`. These are targeted accessibility checks, not a comprehensive accessibility certification. Screen-reader testing and broader platform/browser coverage remain part of independent beta review. Network/research failure scenarios belong to section 5, when that functionality exists.

## Remaining beta validation

1. Collect approximately 150–200 representative public examples with source address, retrieval date, employer/platform, layout category, and a sanitized local fixture. Exclude applicant answers and private profile data. Record inaccessible pages as coverage limitations rather than silently dropping them.
2. Have a human reviewer label job identity, relevant excerpts, sponsorship/CPT/OPT statuses, timing, restrictions, and ambiguity before seeing predictions. Record reviewer, date, rationale, and disputed labels. The authored cases here can help train reviewers but do not replace this collection.
3. Split by employer/template before tuning. Keep a fresh holdout separate; none of the 160 exposed cases should be relabeled as untouched holdout data. Freeze its content and expected labels before execution.
4. Run the same scanner/interpreter evaluation against those reviewed fixtures, report counts and errors, and separately measure definitive-label precision and coverage. Retain known section 7 limitations in overall coverage reporting; show any supported-layout subset explicitly.
5. Complete human browser/screen-reader review, record findings, and update the roadmap's validation status only when that work is actually complete. If errors inform further fixes, archive the first run and obtain a new held-out set before claiming fresh held-out accuracy.

No human sign-off or real-world accuracy claim has been recorded by this implementation.
