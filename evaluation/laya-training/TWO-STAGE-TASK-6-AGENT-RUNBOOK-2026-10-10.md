# Task 6 — collect contextual data and implement the two-stage path

Date: October 10, 2026 (America/Chicago)

Status: executable instructions for a later implementation task. This document does not assert that collection, implementation, training, calibration or promotion has occurred.

## Mission for the executing agent

Complete task 6 of the October 10 proposal: produce independently reviewed contextual datasets and a tested two-stage worker/service/extension path that implements tasks 1–5. Deliver enough evidence for a separate task 7 training registration. Finish both the data and engineering tracks; a functioning mock pipeline alone is insufficient.

Read these specifications completely before editing:

- `DECISION_LOGIC.md` — authoritative label meanings and evidence boundary.
- `HANDOFF-2026-10-09.md`, the October 9 results report and tokenizer recovery record.
- `TWO-STAGE-SCREENING-CONTEXT-2026-10-10.md` and its authored fixtures.
- `TWO-STAGE-V2-CONTRACT-2026-10-10.md` and its transport fixtures.
- `TWO-STAGE-ACCEPTANCE-2026-10-10.md` — metric definitions and future acceptance gates.
- `TWO-STAGE-DETAILED-PLAN-2026-10-10.md` — orchestration and completion criteria.

Paths above, except root documents, are relative to `evaluation/laya-training/`.

Training, calibration fitting, final test inference and promotion follow in later tasks. You may prepare their interfaces and fixtures. Do not execute the old training smoke command: it performs a weight update. Loader verification, if needed for engineering, must use a private compatible tokenizer path and development evidence only.

## 1. Establish the exact starting state

Inspect repository instructions and `git status --short`. Preserve existing user edits, including handoff changes. Record commit, relevant tool versions and the baseline files you will touch. Use a separate new artifact directory for collection; never refresh an existing frozen directory.

Search all actual callers of `decisionRequest`, `parseDecisionRequest`, `parseDecisionResult`, `applyDecision`, `mainDecision`, `decisionQuestions` and `laya-policy-v1`. Also trace evidence extraction/merging, question exports, dataset loaders and browser mocks. Record each caller's required migration or deliberate historical compatibility behavior.

Known touchpoints to verify, not a substitute for search:

| Area | Existing files |
| --- | --- |
| Request, result, validation, projection | `src/decision.ts`, `src/main-decision.ts`, `src/types.ts` |
| Questions and Python execution | `server/decision-questions.ts`, `server/laya_worker.py` |
| Worker lifecycle and HTTP boundary | `server/decision-service.ts`, `server/decision-server.ts`, `src/background.ts` |
| Polling, lifecycle and display | `src/decision-client.ts`, `src/findings-view.ts`, `src/report.ts`, popup/page consumers |
| Original context boundaries | `src/scanner.ts`, `src/frame-coordinator.ts`, `src/overview-recovery.ts` |
| Evaluation/capture/browser consumers | `scripts/evaluate-decision.ts`, `scripts/evaluate-laya-policy.ts`, `scripts/capture-laya-evidence.mjs`, `scripts/browser-decision.ts` |
| Data preparation and training interfaces | `scripts/prepare_laya_training.py`, `scripts/build_laya_operational.py`, `scripts/validate_laya_operational.py`, `scripts/train_laya_domain.py`, question export helpers |
| Regression fixtures | decision/contract/main-decision/client/server tests, scanner/frame/overview tests, Python data/worker tests |

Expected output: `implementation-inventory.md` listing callers, planned changes, tests, historical compatibility and untouched frozen inputs.

## 2. Create a new dataset schema before collecting in bulk

Implement a versioned contextual-data path. The current `validate_laya_operational.py` requires `neighbors: []`, three splits and `laya-policy-v1`; `train_laya_domain.py` rejects nonempty neighbors and creates five decisions per target. Preserve those historical behaviors. Reuse safe digest, grouping, normalization and atomic-write helpers where appropriate; do not weaken old validators to accept a new format.

Use ordered public posting evidence as the primary contextual source. Each posting needs an internal stable posting ID, employer/title, known country or null, normalized employer group, policy-family membership, intended split, extraction coverage, and original ordered blocks with context boundaries. Each reviewed target references its posting/block ID and has relevance plus all five labels, review state and rationale. Store gold/reviewer material outside model input. Persist the canonical context format/version and reproducible derived target states.

Source URLs, vacancy IDs, retrieval dates and capture files remain optional for owner-approved passage training under the existing waiver. Internal grouping identities, review status and dataset-level hashes remain necessary. Whole-posting evaluation requires reviewed coverage declarations and preserved complete text sufficient to audit them. Never collect applicant answers, resumes, uploads or personal form values.

Give unavailable context an explicit reason. A true document edge differs from unknown omitted text or an unverified source boundary. Preserve this distinction using the request's context-group descriptors as well as block positions. Do not reconstruct historical neighbors from unrelated or current replacement postings. If a policy depends on a condition farther away than the supported immediate context, preserve it in a reviewed coherent block or hold it as unsupported; do not imply that an arbitrary three-block window is sufficient.

Expected output: schema/example records, versioned reader/validator, and tests rejecting invalid labels, duplicate IDs, wrong context references, privacy violations and unsupported context. Use the final context/transport specifications for field names.

## 3. Assign groups to splits before using examples for design

Create a membership ledger joining same posting, employer/parent group, materially copied policy families and original contextual evidence. Assign the entire connected group to exactly one of training, development, calibration or fresh test. Audit against all historical split ownership, including the viewed test; do not silently move historical calibration/test groups into training or development.

Copy old training records into the contextual optimizer split only after their complete original context is verified. Records with unavailable neighbors may be preserved with lineage and explicitly missing context in the new version's hold/challenge inventory, outside optimizer export. An old passage-only row is not automatically eligible: recover verified source context or record a reviewed exclusion/hold. Missing historical neighbors are not verified document boundaries. If a record needs context to resolve meaning, collect verified context or keep it unresolved; do not invent it. Existing calibration stays calibration where usable and representative. Preserve the old 12-passage test as a historical benchmark, separate from the new fresh test. WTW and authored contract examples are exposed regression evidence and never fresh calibration/test evidence.

Do not use ordinary repeated short wording alone as grounds for quarantine. Report actual exact duplicates, shared employer relationships and materially copied text. Audit target and context leakage together, with the policy-family review supplementing mechanical matching.

Expected output: `membership-ledger.json`, exclusions with reasons, group counts by split, and a validator that fails cross-split groups. Newly designed fixture labels are not independent gold merely because an agent wrote them.

## 4. Collect the missing training examples broadly

Search broadly across employers and recruiting platforms; do not use `site:` filters, domain allowlists or platform restrictions as the collection standard. Prefer public job-description evidence. Retain original paragraph/list order, attached conditions and context boundaries.

Collect at least the starting batch of 80 additional reviewed target passages:

| Primary bucket | Starting count | Required variation |
| --- | ---: | --- |
| Ordinary negatives | 40 | duties, benefits, diversity, deadlines, onboarding, application-count rules, non-immigration sponsorship |
| Context-sensitive | 20 | unrelated target beside policy; pronoun/reference conditions; real adjacent exceptions; recovered verified context |
| Conditional provision | 10 | explicit role-level sponsorship consideration under an actual condition/exception |
| Historical/other-role | 10 | both categories, including internship conversion and another vacancy |

These are primary buckets, so count each target once toward the 80. Also annotate secondary characteristics. Cases whose meaning depends on unrecovered missing context remain review holds or operational partial/unsupported fixtures, outside frozen training gold. Add company-policy and applicant-question examples, country variation, scope `none`, CPT and OPT acceptance/exclusion, and all timing classes wherever the coverage report reveals gaps. An irrelevant ordinary hiring requirement can have scope `role` with unclear immigration findings; do not assign scope `none` to every negative.

Annotate interpretation even for negatives. This teaches the interpreter to remain unclear if the screen forwards irrelevant text. Screen labels depend on the target's meaning with real context; merely having a policy neighbor does not make unrelated target text relevant.

Expected output: candidate training collection, bucket/label/context coverage report, and reviewer disagreements. Quantity alone does not close this step.

## 5. Collect development, calibration and fresh test evidence separately

Start with roughly 10 development postings, 10 additional calibration postings, and 20–30 fresh test postings. Increase collection to meet the acceptance specification's class/posting support and no-policy coverage requirements. Record actual counts; do not present initial targets as guarantees that support gates are met.

Development may be used to debug and compare settings. Calibration labels may be reviewed by the data reviewers but must not inform weight updates, question design or candidate selection. Fresh test gold and individual examples must stay outside the implementation/training team's design/debug feedback. Have a separate data reviewer collect/label/freeze test evidence and disclose only membership integrity and coverage aggregates until the final evaluation.

For complete-posting examples, label all original targets and the whole-posting gold outcome, including cited supporting IDs, conditions, exceptions, scope and whether any uncertainty is legitimate. Include complete jobs with no immigration policy, positive policies, refusals, conditional provision, applicant questions, historical/other-role/company scope and restrictions separate from sponsorship. Include intentionally incomplete examples as a separate operational challenge set; they must yield honest uncertainty and cannot count as complete no-policy jobs. Register quality-eligible versus operational-challenge membership from reviewed context and supported input limits before predictions; runtime failures cannot move an eligible target out of quality denominators.

Expected output: four candidate splits, aggregate coverage report, independent review record and a fresh-test exposure ledger. If test evidence is exposed during tuning, record that and collect a new fresh test; a new filename cannot restore freshness.

## 6. Review, validate and freeze the contextual dataset

Require a second review of relevance, all five labels, contextual references, condition preservation, country handling, grouping and coverage. Resolve disagreements; retain unresolved records outside frozen datasets. Review dates/hashes document the review but do not prove label accuracy.

The new validator must check four split headers; record and block ID uniqueness; target existence; original neighbor derivation; context format; allowed vocabularies; non-role label invariants; employer/policy-family/context ownership; copied duplicates; privacy; counts; review completion; and exact hashes. A condition longer than supported context must be declared unsupported rather than truncated or silently dropped. Report how that exclusion affects whole-posting evaluation.

Freeze under a new versioned name. Include split files, ordered posting evidence, membership ledger, class/context coverage, exclusion log, independent review, input/context/question definitions, source lineage and a manifest with dataset-level hashes. Keep question/context gold versions separate from the historical frozen manifest. Do not mark the new run approved to train merely because freezing succeeded.

Expected output: a frozen four-way dataset and a successful reproducible validation command. The manifest identifies what is immutable and which later run may consume it. Deliver a separate checkpoint-backup plan; Git does not contain ignored model weights.

## 7. Implement v2 types, context and boundary validation first

Implement the reviewed request/result and block unions exactly. Reject wrong versions, malformed enums/probabilities, illegal status combinations, duplicate/missing/unexpected IDs and incorrect output order. Reject five invented answers on skipped/failed/unsupported blocks. Distinguish processing completeness, extraction completeness and semantic uncertainty.

Carry all original blocks to the worker. Derive context from original source order/boundaries before routing. Deduplication and multi-source merges must not create false adjacency. Where source order is unavailable, represent missing context honestly. Use one canonical model-state format across runtime and Python data/training export, with fixture parity tests across languages. Do not add a broad geographic parser; unknown country remains null.

Expose explicit screening and interpretation questions. Keep five interpretation vocabularies unchanged and publish a stable question order for six training targets per target passage. Version exported question definitions; preserve pinned historical definitions/files.

Expected output: typed v2 contract, canonical context serialization, question exports and boundary tests. Mock tests establish engineering behavior, not trained accuracy.

## 8. Implement the worker's two-stage control flow

Load one checkpoint once. Preserve offline/local execution and protected tokenizer handling. For each original block, derive and validate original context before inference. A missing neighbor is unsupported under the v2 contract; a verified natural boundary is allowed. Validate the full context budget including question headers. Screening answers use actual selected-option probabilities. Forward relevant and uncertain targets; skip only under the registered confident-irrelevance rule. Missing calibration must be explicit: use a conservative development configuration that skips nothing until parameters are calibrated, rather than pretending 0.8 is validated for screening.

Interpret forwarded targets with their precomputed original context. Return results in original input order. A confidently irrelevant skip is a valid completed processing outcome; an inference or context failure is not. Emit a result for every original ID even when one block fails. For a worker-level fatal crash/timeout, the service may return a request-level error without manufacturing per-block successes. Use fixed reason codes and keep job text/exception details out of logs.

Do not mutate a shared stage temperature and accidentally reuse it for another stage/request. Implement stage-specific configuration through the installed runtime's actual supported mechanism; verify it with a fake agent and private-path real worker probe when available. The existing temperature array is keyed by question type, not by stage. Include configuration identity in results/cache identity.

Expected output: worker with fake-agent tests covering routing, original neighbors, mixed failures, oversized inputs, complete accounting, stage configuration isolation and one-load behavior.

## 9. Migrate service, client, cache and projection together

Keep loopback host/origin permission checks, input limits, serialized bounded inference, safe error messages and timeouts. A valid partial v2 result can be delivered as ready transport with partial processing; it must not become a falsely complete interpretation. A broken transport remains an error. Update parser, background transport, polling and cache keys to match v2 and model/question/context/parameter identity. No old v1 result may masquerade as v2.

Preserve navigation/cancellation/generation safeguards. A late response for an earlier vacancy must not publish into the current vacancy. Model comparison stays opt-in; the deterministic main badge continues using original unfiltered text and existing settings.

Project only successfully interpreted, sufficiently supported-confidence, role-scoped answers. Screening is relevance, never policy proof. Respect questions and non-role contexts. Keep timing explicit, CPT/OPT independent and exact extracted citations with real clarifying context. Correct the mixed-time automatic `conditional` conversion and ensure unresolved CPT/OPT findings prevent a complete no-blocker verdict. Test genuine conditional exceptions so a broad refusal phrase elsewhere does not erase them incorrectly. Use the precedence and examples in the v2 specification rather than inventing a new product rule.

Preserve independently supported details in partial/uncertain scans while showing the appropriate overall uncertainty. In the model-only comparison, disclose that deterministic restrictions are outside model coverage; in combined projection keep independent blockers. Do not add an invented semantic verifier based on confidence or a keyword whitelist.

Expected output: migrated clients/display/evaluation callers and tests for each projection/lifecycle invariant, including no-policy jobs and mixed current/future cases.

## 10. Prepare exports and evaluation for later training

Create a new contextual training exporter that emits one relevance task plus the five interpretation tasks per reviewed target, validates split ownership before any model load, and exactly reproduces worker context. Do not change the old runner's pinned behavior. Add meaningful tests showing contextual targets exported intact, historical absent-context rows explicitly handled, calibration/test rejected by optimizer-facing export, and all six questions represented in the declared order.

Add evaluation interfaces for the acceptance registry: routing retention; supported passage claims before aggregation; gold-finding recall; complete-posting outcomes; class support; all-field agreement; abstention; failures; semantic citation review; and runtime timing. Keep authored diagnostics separate from test scores. Register the planned old-model/new-interpreter/new-pipeline comparison, but do not run fresh final evaluation here.

Expected output: validated training-ready exports, development evaluation plumbing and a proposed task 7 run manifest with `trainingStarted: false`. Specify which later work remains: initialization candidates, schedule, hardware resume verification, calibration parameters and final evaluation.

## 11. Verify engineering and establish the latency profile

Run appropriate targeted tests during edits, then TypeScript typecheck, full tests, build, the new dataset validator and Python context/worker/data-export tests. Validate the historical dataset unchanged. Inspect Python tests first: run pure fixtures, not historical commands that load/mutate originals or update weights. Record commands, results and environmental limitations; never claim a skipped real-worker/browser check passed.

Use the existing browser script with a disposable profile and mock v2 results first. Cover opt-in/out, private-answer exclusion, partial display, permission denial, origin rejection, service outage and navigation/stale responses. Preserve the deterministic main badge. Use authored/development evidence for any private-path real-worker integration probe; do not update the installed extension or service defaults simply to run it.

Execute the acceptance specification's latency protocol on intended local hardware. Record cold load separately from warm worker execution, actual device/precision/batching/context sizes and all-forward routing. Lock the concrete time budget before training/tuning. A benchmark of the old untrained screen establishes an engineering baseline, not future quality or a calibrated filter's speed. If the candidate exceeds existing worker/client timeout budgets, resolve in development and re-register before final test.

Expected output: `TASK-6-VERIFICATION.md`, test output summaries, browser artifacts, context parity evidence and latency registration. Any blocked check has an explicit effect on readiness.

## 12. Hand off a reviewable task 7 entry packet

Deliver an implementation summary and reproducible commands; a frozen dataset manifest with four-way split review; all v2 fixtures/tests and migration inventory; parameter identity/configuration schema; private-tokenizer/load-integrity plan; checkpoint backup/rollback instructions; and the latency registration. List remaining deficiencies rather than marking readiness from document existence.

Task 6 is complete only when both data and engineering outputs above exist and pass review. Training may begin later when the owner initiates task 7 and the training manifest pins eligible data, questions, context, code and settings. Training must never consume calibration/test gold; candidate choice uses development only. Calibration and a fresh locked final comparison still follow weight selection.

## Copyable task instruction

> Implement task 6 using `evaluation/laya-training/TWO-STAGE-TASK-6-AGENT-RUNBOOK-2026-10-10.md` and its referenced specifications. Complete the contextual four-way data collection/review/freeze and the tested v2 two-stage pipeline. Preserve existing user edits, historical data/checkpoints and old run reproducibility. Produce the stated artifacts and engineering verification, disclose blocked requirements, and finish with a task 7 readiness report. Training, calibration fitting, final held-out inference and promotion are later tasks; prepare their inputs without executing them.
