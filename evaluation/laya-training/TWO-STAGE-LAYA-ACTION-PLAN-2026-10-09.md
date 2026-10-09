# Two-stage Laya implementation — action plan

Date: October 9, 2026 (America/Chicago)

Status: planned, not implemented. This document does not start training, change extension defaults, or approve model promotion. All unchecked tasks below remain to be completed and reviewed.

## 1. What we are building

First, find text about immigration or employment eligibility. Then, interpret what that text actually establishes about sponsorship, timing, CPT and OPT.

The proposed sequence is:

`Public job text → relevance screening → policy interpretation → existing decision rules → cited result`

Start with one Laya checkpoint doing two separate tasks, loaded once in the existing local worker. Two separate model files are not required. This is a two-stage pipeline, not independent verification: both stages can make related mistakes. Human-reviewed evaluation is still needed.

The relevance screen must not remove text from the existing deterministic citizenship, clearance, export-control or other blocker checks. Those checks continue to receive the original extracted posting.

## 2. What we already have, and why another iteration is needed

- The existing frozen operational dataset has 87 training, 44 calibration and 12 test passages. Keep those files and hashes unchanged.
- The completed model trained for three epochs and 132 optimizer updates. Its calibrated derivative uses temperature 5.0 and a confidence threshold of 0.8.
- The locked test improved from 28/60 to 50/60 field labels, but sponsorship was only 7/12 and complete five-field agreement only 4/12. Several errors remained confidently wrong. These results are not a promotion approval.
- The training data contained no ordinary non-immigration negatives and no `scope: none`, `other-role` or `historical` examples. All training neighbor fields were empty, unlike real-job inference.
- On the WTW posting, diversity text, a closing date and an onboarding heading produced three confident, unsupported sponsorship claims. The final conservative headline did not make those passage predictions correct.

Evidence: [completed results](TRAINING-RESULTS-2026-10-09.md), [WTW live-job test](live-job-tests/wtw-202605435/README.md), and [operational manifest](operational-v2-2026-10-09/manifest.json).

The interpretation stage needs improvement too. Adding a screen in front of the current model is not sufficient by itself.

## 3. Work order and responsibilities

The coordinator owns sequencing and reviews each deliverable. Dataset reviewers own gold labels. Implementation and training owners produce code and run evidence. The project owner approves acceptance targets and any eventual default-model change. These are work roles, not agents already dispatched.

| Phase | Work | Depends on | Required proof before advancing |
| --- | --- | --- | --- |
| A | Define screening and context rules | None | Reviewed examples and versioned contract proposal |
| B | Collect, review and freeze data | A | Split audit, coverage report and dataset hashes |
| C | Build the two-stage pipeline | A; use B fixtures as available | Worker, parser, service and extension tests |
| D | Train and select a candidate | B and C | Registered settings, resume check and development results |
| E | Calibrate the complete pipeline | D | Locked parameters and calibration report |
| F | Run fresh final evaluation | E | One locked comparison and promotion decision |
| G | Integrate and optionally promote | F passes | Opt-in browser checks, owner approval and rollback proof |

Phases B and C can proceed in parallel after A is agreed. Do not start weight updates until their required checks pass.

## Phase A — define exactly what each stage does

Owner: design/contract owner, reviewed by coordinator and dataset reviewer.

- [ ] Define the screening question: does the target passage concern immigration sponsorship, visa eligibility, CPT/OPT, or related employment-authorization restrictions?
- [ ] Use two human labels: `relevant` and `irrelevant`. Treat uncertain model results as a routing condition, not a third ground-truth class. Unresolved human labels require review before freezing.
- [ ] Mark actual sponsorship offers/refusals, work authorization, citizenship restrictions, applicant visa questions, and company/historical/other-role immigration policies as relevant. Relevance does not mean the current role offers sponsorship.
- [ ] Mark ordinary duties, benefits, diversity statements, application deadlines, application-count rules, onboarding headings and non-immigration event sponsorship as irrelevant when their real context contains no eligibility policy.
- [ ] Keep the five interpretation fields and label vocabularies from [DECISION_LOGIC.md](../../DECISION_LOGIC.md). Applicant questions do not establish employer policy; company, historical and other-role statements do not automatically establish current-role policy.
- [ ] Define the input identically for training and inference: employer/title, target passage, and its actual previous/next passages in original posting order. Missing context stays explicitly missing; do not invent it.
- [ ] Preserve attached conditions and references when splitting passages. A paragraph saying “this restriction” may need its real neighbor to be understood.
- [ ] Retain original neighbors after screening. Never replace them with neighboring survivors, which could attach unrelated policies to the target.
- [ ] Review token-limit handling: reject/report unsupported oversized input rather than silently truncating a condition.
- [ ] Agree on numerical acceptance floors before tuning: relevant-policy retention, supported-claim precision, severe-error limits, coverage, and acceptable latency. Define denominators, minimum class support and uncertainty reporting. Confidence 0.8 is not evidence of 80% accuracy.

Deliverable: a reviewed relevance rubric, example fixtures, context format and v2 response proposal. Exit gate: both reviewers agree on boundary cases before bulk labeling.

## Phase B — build data that teaches both relevance and meaning

Owner: data collection/review owner; coordinator audits membership and coverage.

### B1. Collect the missing training examples

Initial collection target: 80 additional target passages, with their real posting context. This is a starting batch, not a guarantee that the model will be ready.

- [ ] Collect 40 ordinary negatives: duties, benefits, diversity, deadlines, onboarding, application restrictions, and non-immigration uses of “sponsor.” Include confusing wording such as “we do not accept multiple applications.”
- [ ] Collect 20 context-sensitive targets: unrelated text next to an actual policy, policies requiring an adjacent condition, and references that change meaning without their neighbor.
- [ ] Collect 10 explicit role-level conditional policies: sponsorship may be provided under a stated condition. Do not confuse these with requiring the applicant to need no sponsorship.
- [ ] Collect 10 historical or other-role immigration policies, with enough text to identify that scope. Balance both categories rather than collecting only one.
- [ ] Treat these as primary collection buckets; add more if scope, sponsorship, timing, CPT or OPT classes remain underrepresented. Label every target individually; do not assign `scope: none` merely because it was collected as a negative.
- [ ] Collect broadly. Do not use `site:` filters, domain allowlists or recruiting-platform restrictions as a search standard. Ordinary repeated industry wording is expected; materially copied policies or related vacancies must be grouped.

For each supplied posting, return employer, job title, country, the public job-description text in original paragraph/list order, target passage identifiers, relevance labels and the five interpretation labels. Country provides context, not an assumed U.S. visa outcome. No applicant answers or personal data.

Full posting context helps train and test the new behavior; it does not reinstate mandatory per-record URLs, capture hashes or retrieval metadata for owner-approved passage training. Keep detailed source metadata optional under the existing owner waiver. Dataset-level hashes remain required. Whole-vacancy evaluation must still declare whether extraction was complete or incomplete.

### B2. Keep four different uses separate

- [ ] Training: copy eligible existing training examples into a new version and add reviewed relevance/context annotations plus the new examples. Do not overwrite the frozen 87-record source.
- [ ] Development: collect approximately 10 additional complete postings for debugging, comparing training settings and selecting the candidate. The exposed WTW posting belongs in regression/development checks, not the fresh test.
- [ ] Calibration: retain the existing 44 calibration examples only for calibration where usable, and collect approximately 10 additional complete postings containing relevant and irrelevant text. Never update weights from this split.
- [ ] Fresh test: collect 20–30 new complete postings with employers absent from training, development and calibration. Include positive policies, refusals, conditional cases, scope distinctions, CPT/OPT and jobs with no sponsorship statement. Size upward if rare classes have insufficient support.
- [ ] Keep the already viewed 12-test-passage set as a historical benchmark. Do not silently rewrite its split or claim it is a fresh independent evaluation again.
- [ ] Group all passages from the same posting, related employer or materially copied policy family into one split. Keep original context with its target; context text itself must not leak across splits.
- [ ] Review relevance and all five interpretation labels. Audit class coverage, duplicates, cross-split overlap and complete/incomplete declarations. Keep unresolved records out of the frozen sets.
- [ ] Freeze new files and a manifest pinning membership, dataset hashes, label/question definitions, context format, review decisions and intended use. Avoid embedding labels or reviewer explanations in model inputs.

Deliverable: a new versioned four-way dataset with a membership ledger and coverage report. Exit gate: independent split/label review passes and validators reject mutations or cross-split membership.

## Phase C — implement the smallest complete two-stage path

Owner: runtime/integration owner, reviewed by coordinator.

- [ ] Add the relevance question and versioned two-stage request/response definitions. Preserve the existing five interpretation labels; the transport change must be explicit, not a silent change to v1.
- [ ] Screen every original passage. Forward relevant and uncertain passages to interpretation; skip interpretation only for confidently irrelevant passages under the calibrated screening rule.
- [ ] Interpret forwarded targets using their original, unfiltered neighbors. Batch with explicit IDs and restore original order; context is not an extra target or an employer policy by itself.
- [ ] Return a status for every input ID, including screening result, routing decision, interpretation status and supported outputs. A skipped passage must not receive invented five-field labels or confidence 1.0.
- [ ] Make `skipped`, `failed`, `unsupported` and `interpreted` distinct. A partial/failed scan must not look like a complete successful scan or a finding of “no sponsorship.”
- [ ] Update all callers together: the worker, service, response parser, decision projection, extension client, display logic, evaluation utilities and fixtures. The current parser expects five answers for every input block; it cannot accept skips without a deliberate contract change.
- [ ] Preserve independent deterministic blockers on unfiltered text, existing scope/uncertainty rules, citations, extraction coverage warnings and opt-in behavior.
- [ ] Load one checkpoint once; keep local processing, current bounded/serialized service behavior, timeouts and input validation. Add no cloud service or dependency without a demonstrated need.
- [ ] Test filtering without neighbor rewiring; uncertain routing; skipped IDs; malformed/partial responses; mixed successes/errors; overflow; role changes; navigation; cancellation; stale results; and empty/no-policy jobs.

Primary touchpoints to inspect before editing: `server/decision-questions.ts`, `server/laya_worker.py`, `server/decision-service.ts`, `src/decision.ts`, `src/decision-client.ts`, relevant shared types/views, `scripts/browser-decision.ts`, `scripts/evaluate-laya-policy.ts`, training/export/validation utilities and their tests. Update actual callers found by search, not just this list.

Deliverable: tested v2 pipeline and matching clients with defaults unchanged. Exit gate: contract and integration tests pass, including every original passage ID being accounted for.

## Phase D — train relevance and improve interpretation together

Owner: training owner; coordinator verifies settings, checkpoint identity and results.

- [ ] Reuse the resumable training machinery, but create a new versioned run implementation/configuration wherever changes would alter the prior registered run's pinned code. Keep old runs reproducible.
- [ ] Fix loader compatibility in the new path before training/resume: use a private compatible tokenizer copy and verify that loading does not mutate immutable source checkpoints. Preserve the prior calibrated derivative and its linked source.
- [ ] Train the shared checkpoint on relevance and the five interpretation tasks. Include interpretation targets for ordinary negatives so false-positive screening does not immediately create confident policy claims.
- [ ] Use the identical context template at training, development, calibration and runtime. Record question order, task weighting, loss, batching, precision and context handling.
- [ ] Register a small candidate schedule before running: initialization, learning rates, epochs/update limits, noise, seed, optimizer, clipping and stopping/selection criteria. Include a controlled fresh-base candidate; do not assume more epochs on the current overconfident model are better.
- [ ] Choose candidate settings using training/development only. Neither calibration nor fresh test may guide weight training or checkpoint selection.
- [ ] Verify interrupted versus uninterrupted execution with optimizer, RNG, shuffle order and cursor restored. Perform the relevant hardware check, not just a saved-state-file existence check.
- [ ] Save settings, losses, finite-gradient checks, checkpoints and dataset/question hashes. Keep model and optimizer artifacts out of Git; arrange a separate backup so a Git commit is not mistaken for a weights backup.
- [ ] Compare development performance with the previous experimental model and deterministic baseline. Diagnose screen misses and unsupported interpretation claims separately.

Deliverable: selected immutable candidate and reproducible training/development report. Exit gate: resume/integrity checks pass and the selected candidate meets the pre-agreed development criteria.

## Phase E — calibrate the actual deployed pipeline

Owner: calibration owner; coordinator checks split use and runtime equivalence.

- [ ] Lock weights and questions first. Use only the calibration split to fit confidence parameters and routing/abstention thresholds.
- [ ] Calibrate screening for retaining real policies; false negatives here permanently hide evidence from stage two. Review uncertain/ambiguous cases instead of aggressively discarding them.
- [ ] Calibrate interpretation for avoiding unsupported confident claims. Evaluate the rows actually forwarded by screening, including irrelevant false positives; do not calibrate only on clean policy excerpts.
- [ ] Implement explicit stage-specific confidence parameters if supported by the chosen design. The installed Laya temperature array is keyed by question type, not automatically by these two stages or the five fields. Validate supported limits and avoid leaking temporary settings between requests.
- [ ] Match calibration to runtime precision, batch shape and context. Test that saved settings reload and reproduce results. Temperature adjusts confidence; it does not repair a wrong top label.
- [ ] Select thresholds against the agreed metrics, report abstention and class support, then freeze parameters and hashes. Do not lower a threshold merely to make an example appear successful.

Deliverable: locked calibrated candidate, screening/interpreting thresholds and report. Exit gate: the serialized configuration produces the same decisions through the real worker and service.

## Phase F — evaluate once on the new locked test

Owner: evaluation owner, independently reviewed by coordinator.

- [ ] Fix models, questions, parameters, thresholds and comparison protocol before opening final test results.
- [ ] Compare the previous experimental model, the newly trained interpreter without screening, and the complete new two-stage pipeline. This separates the benefit of better training from the benefit of screening.
- [ ] Measure relevant-policy retention, missed offers/refusals/restrictions and irrelevant passages forwarded. Report counts and uncertainty, not just a percentage.
- [ ] Measure interpretation precision/recall by class, confusion matrices, five-field agreement, confidence errors and abstention. Report classes absent from the test as untested, not perfect.
- [ ] Measure complete-posting outcomes and whether the cited text actually supports each claim. An exact quote match alone does not establish semantic support.
- [ ] Require WTW regression checks to reject unsupported claims from diversity text, the deadline and onboarding heading individually. Also test real adjacent policy conditions, applicant questions, country context, CPT/OPT and incomplete extraction.
- [ ] Review severe false claims even when conflicting predictions happen to produce an uncertain final headline. Include runtime latency and failure/coverage behavior.
- [ ] Record pass/fail against the pre-agreed acceptance criteria. If the test exposes failures requiring tuning, record the failure and collect another fresh test for the next iteration; do not keep tuning against this test and call it independent.

Deliverable: one locked comparison and explicit promotion recommendation. Exit gate: sufficient class coverage and acceptance criteria pass; otherwise return to development, not promotion.

## Phase G — integrate safely and promote only with approval

Owner: integration owner; project owner approves promotion.

- [ ] Run the new candidate locally in opt-in comparison mode. Verify the actual service/worker model identity, not just a directory name or training report.
- [ ] Configure and restart the backend deliberately; clear/version cached results as needed. Rebuild/reload the extension and verify it speaks the matching v2 contract. Do not assume extension reload alone changes the backend checkpoint.
- [ ] Keep the deterministic main badge unchanged initially. Display skipped/uncertain/partial model results honestly and test permission, timeout and navigation behavior in the real browser.
- [ ] Record the checkpoint/hash, linked tokenizer dependencies, dataset manifests, questions/contract/context hashes, calibration parameters, thresholds, evaluation report and service configuration in a promotion manifest.
- [ ] Back up the model plus optimizer state separately and test rollback to the previous known configuration. Preserve immutable original datasets and checkpoint dependencies.
- [ ] Obtain explicit owner approval before changing the default checkpoint or making model output authoritative for the main badge. Those are separate product decisions.

Deliverable: browser verification, promotion record if approved, and working rollback instructions. Exit gate: approved model identity is demonstrably running; otherwise the existing default remains in place.

## First three actions when implementation is authorized

1. Finish Phase A's relevance rubric, context format and response proposal using ordinary negatives, genuine policies and the WTW boundary cases.
2. Start Phase B's collection/review and Phase C's contract/fixture work. Freeze data only after overlap and coverage review.
3. Complete the tested worker/client path and register the new training settings before any new weight updates.

No fixed completion date or accuracy guarantee is implied. Data review, independent coverage and acceptance gates determine when it is safe to advance.
