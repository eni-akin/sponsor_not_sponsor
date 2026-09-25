# Section 4 evaluation and review

The evaluation tooling and reliability fixes are implemented in version 0.4.0. Independent review of representative real-world examples remains outstanding. The current reports do not establish general accuracy or completion of that beta-validation requirement.

## What is included

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

No frame scanner, platform-specific reader, or generic detection expansion was implemented. Those remain in section 7.

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
