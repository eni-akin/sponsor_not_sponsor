# Sponsor Not Sponsor — standalone implementation brief for an AI agent

Date: October 10, 2026 (America/Chicago)

This brief assumes you have no previous conversation history. Read it as your task instruction. It supplies project background, required behavior, work order, deliverables and completion criteria. The existing detailed specifications listed below remain authoritative for exact schemas and metric definitions.

## 1. Your assignment

You are working in this repository:

`/Users/eniola/Documents/Project/Sponsor_Not_Sponsor`

Implement the next development phase of **Sponsor Not Sponsor**: collect and independently review contextual job-posting datasets, and implement a tested two-stage local Laya pipeline that identifies relevant immigration/eligibility text before interpreting its meaning.

Your finished output must include both real reviewed data and working code. A plan, synthetic examples, mock worker, or successfully loaded checkpoint alone does not complete this assignment. Produce the artifacts and verification described in this brief, then hand off a training-readiness report. Training is a separate subsequent assignment.

The owner has already approved the design direction. Proceed with routine reversible implementation work, tests, collection and review within this scope. Keep meaningful progress updates and report genuine missing authority or unavailable external inputs after completing unaffected work. Do not turn ordinary implementation choices into repeated approval requests.

## 2. What the product does

Sponsor Not Sponsor is a browser extension that reads public evidence for a particular job vacancy. It identifies what the posting explicitly establishes about immigration visa sponsorship, student work authorization and separate eligibility restrictions, then displays quoted evidence and a practical headline.

The main extension badge currently uses deterministic local rules. An optional comparison path sends extracted public text to a local TypeScript service, which runs a persistent Python Laya worker. Laya returns structured choices, not free-form answers. The extension projects those choices into findings and quotes original extracted text. There is no requirement to add a cloud service or another model.

The product reports evidence in the named vacancy. It does not infer sponsorship from employer reputation, a company's past behavior, silence, another job, or an applicant's answers. It does not decide personal legal eligibility.

Two work units must remain distinct:

- A **target passage** is one original extracted paragraph/list item/block, identified by a stable ID.
- A **whole-posting decision** combines target findings, independent deterministic restrictions and evidence coverage for the named vacancy.

A correct whole-posting headline does not prove all target predictions were correct. Your evaluation interfaces must retain individual predictions, including wrong claims later hidden by conflict resolution.

## 3. Why this change is necessary

A first full-model Laya fine-tuning run completed on October 9. The frozen passage-only corpus contains 87 training, 44 calibration and 12 test passages. Fine-tuning improved overall field accuracy from 28/60 to 50/60, but sponsorship accuracy was only 7/12 and all-five-field agreement was 4/12. Seven wrong field predictions still had confidence at least 0.8 after calibration.

The training examples lacked ordinary non-immigration negatives, some scope classes and actual neighboring context. In a saved test of WTW vacancy `202605435`, the experimental model confidently invented sponsorship policies from a diversity paragraph, closing date and onboarding heading. Those examples exposed relevance/context problems. Screening alone will not fix a poor interpreter; the new data must improve both tasks.

The experimental checkpoint is not approved for production. Its calibration temperature is 5.0, and the old 0.8 interpretation threshold is provisional. Neither value is a validated screening threshold. Confidence is a model score, not proof that the answer is supported.

The October 10 design work is complete: relevance, context, v2 transport, decision projection and acceptance criteria were written and cross-reviewed. The runtime and contextual dataset described by those specifications have not been built or trained.

## 4. Read the repository evidence before editing

Start with repository/ancestor `AGENTS.md` instructions, `git status --short`, and the current commit. The last inspected commit was `2b78783`, but verify the live checkout. There were pre-existing edits to `HANDOFF.md` and an untracked `HANDOFF-2026-10-09.md`; preserve all unrelated user changes.

Read these files completely, resolving relative paths from the repository root:

| File | Why you need it |
| --- | --- |
| `DECISION_LOGIC.md` | Authoritative label meanings and evidence rules |
| `HANDOFF-2026-10-09.md` | Historical state, waivers, preserved decisions and checkpoint cautions |
| `evaluation/laya-training/TRAINING-RESULTS-2026-10-09.md` | Actual previous results and limitations |
| `evaluation/laya-training/TOKENIZER-RECOVERY-2026-10-09.json` | Loader behavior that can mutate tokenizer metadata |
| `evaluation/laya-training/TWO-STAGE-SCREENING-CONTEXT-2026-10-10.md` | Relevance rubric, exact screening question, context derivation and serialization |
| `evaluation/laya-training/TWO-STAGE-V2-CONTRACT-2026-10-10.md` | Normative request/result types, statuses, validation and projection |
| `evaluation/laya-training/TWO-STAGE-ACCEPTANCE-2026-10-10.md` | Exact metrics, denominators, support requirements and benchmark protocol |
| `evaluation/laya-training/TWO-STAGE-DESIGN-REVIEW-2026-10-10.md` | Resolved design issues and actual verification limits |
| `evaluation/laya-training/two-stage-contract-2026-10-10/` | Design manifest, 32 labeled fixtures, context cases and transport scenarios |

The original design manifest hashes nine reviewed artifacts. Check those hashes before relying on the specification. This standalone brief supplements those artifacts and is not itself part of that original manifest. If implementation uncovers a necessary contract change, record the reason and create a reviewed versioned revision; do not quietly reinterpret a frozen contract.

`DECISION_LOGIC.md` contains an older provenance requirement. The owner subsequently waived mandatory detailed per-record URLs, vacancy IDs, captures and retrieval metadata for owner-approved passage training, as recorded in the handoff. Preserve that waiver. Dataset-level hashes, review, grouping and honest whole-posting coverage remain required.

## 5. Rules the implementation must preserve

The interpreter answers exactly five fields. Keep every vocabulary unchanged:

| Field | Allowed labels and meaning |
| --- | --- |
| `scope` | `role`: policy applying to this vacancy; `question`: applicant question; `historical`: past activity; `company`: general policy without established applicability; `other-role`: another job or later conversion; `none`: unrelated text |
| `sponsorship` | `available`: explicitly offered; `unavailable`: explicitly refused or applicants must not need it; `conditional`: actual provision/consideration under a condition or exception; `unclear`: not established |
| `timing` | `now`, `future`, `now-and-future`, `unspecified`; use only explicitly stated timing |
| `cpt` | `explicitly-accepted`, `explicitly-excluded`, `unclear` |
| `opt` | `explicitly-accepted`, `explicitly-excluded`, `unclear`; Pre-OPT uses this field |

Only role-level policy may establish definitive sponsorship/CPT/OPT findings. A question about sponsorship is relevant to screening but is not an offer or refusal. Company/historical/other-role policies do not automatically apply to this vacancy. Non-role gold uses sponsorship/CPT/OPT `unclear` and timing `unspecified`.

Citizenship, permanent-residency, U.S.-person, export-control, clearance and work-authorization conditions remain separate restrictions. They may create a blocker without proving sponsorship refusal. Preserve their exact affected group, conditions and exceptions. CPT and OPT are independent; acceptance of either does not prove visa sponsorship.

Examples you must understand before implementing:

| Evidence | Required interpretation |
| --- | --- |
| “Visa sponsorship is available for this position.” | role / available / unspecified / CPT unclear / OPT unclear |
| “Applicants must not require sponsorship now or in the future.” | role / unavailable / now-and-future / CPT unclear / OPT unclear |
| “We do not sponsor except where immigration counsel approves an exception.” | role / conditional / unspecified; preserve the exception |
| “Will you require sponsorship?” | question / unclear / unspecified / CPT unclear / OPT unclear |
| “U.S. citizenship is required.” | role / sponsorship unclear; evaluate citizenship separately |
| “CPT and OPT candidates may apply; we cannot sponsor visas.” | role / unavailable / unspecified / CPT accepted / OPT accepted |
| “Full-time employees hired after this internship may receive sponsorship.” | other-role / sponsorship unclear for this internship |
| A degree requirement | immigration-irrelevant, but scope may be role; immigration fields remain unclear |

## 6. Intended pipeline and failure behavior

Use one checkpoint loaded once by the persistent local worker. Run two tasks on it:

1. **Screening:** Does the target concern immigration sponsorship or related employment eligibility? Human gold has two labels: `relevant` and `irrelevant`.
2. **Interpretation:** For a routed target, answer the five fields using its original context.

Questions, company/historical/other-role policies and relevant eligibility restrictions are retained by screening even when their sponsorship answer is unclear. Duties, benefits, diversity statements, deadlines, onboarding headings and non-immigration event sponsorship are ordinarily irrelevant. A target does not inherit a neighbor's relevance unless its own wording actually refers to that policy.

The eventual calibrated routing rule interprets relevant and uncertain targets and skips only confidently irrelevant targets. `uncertain` is a route, not a third human label. For this pretraining implementation, use all-forward routing: every successful screen is routed uncertain and interpreted. Implement calibrated routing for later use and test it with controlled configurations; do not claim the current untrained screen can safely discard passages.

Each original ID must have one terminal result, in original request order:

- Screening `success` has a binary choice and actual selected-option probability.
- Screening `failed` has an error reason, no probability, route uncertain, and interpretation failed/screening-failed.
- Screening `unsupported` has a reason, no probability, route uncertain, and interpretation unsupported/screening-unsupported.
- Interpretation `interpreted` has all five valid answers and probabilities.
- Interpretation `skipped`, `failed` or `unsupported` has a reason and no invented answers/probabilities.

If either actual neighbor is missing, precheck the target as screening unsupported/missing-context. Run neither stage for that target. A verified natural document boundary is allowed. Oversized input is unsupported/context-too-long; do not truncate a condition to obtain a result. A fatal worker crash/timeout may produce a request-level error instead of fabricated per-ID success.

Keep three concepts separate: captured-posting completeness, model-processing completeness and semantic uncertainty. A valid partial response is a valid transport result with partial processing, not a successful complete-vacancy conclusion.

## 7. Context and transport you must implement

The v2 request version is `laya-policy-v2`. Send title, nullable employer/country, every original block, and source context-group declarations. Each block contains `id`, `text`, `kind`, `contextGroup` and zero-based `position`. Each group declares `id`, `firstPosition`, `lastPosition`, and start/end flags `boundary` or `missing`.

Visible DOM, structured data, embedded frames and recovered overview text are separate extraction streams. Appending them to one array does not establish adjacency. Derive previous/next only at adjacent positions in the same stream. An internal gap is missing context. Never replace a skipped neighbor with the next surviving relevant target.

Both stages and the optimizer exporter must receive byte-identical canonical state for the same target:

```json
{
  "job_title": "Software Intern",
  "employer": "Example Employer",
  "country": "United States",
  "previous_status": "present",
  "previous": "Qualifications",
  "TARGET": "Visa sponsorship may be considered for exceptional candidates.",
  "next": null,
  "next_status": "boundary"
}
```

Use these keys in this order, UTF-8, unescaped Unicode, JSON null and compact separators. In Python: `json.dumps(state, ensure_ascii=False, separators=(',', ':'))`. Preserve supplied extracted text exactly; normalize once during reviewed extraction. Keep labels, rationale, reviewer identity, routing decisions and IDs out of model state. Unknown country stays null; no broad geographic parser is required.

The result includes model identity, question/context/parameter SHA-256 digests, processing counts and ordered block outcomes. Derive counts from actual outcomes. Reject duplicate/missing/unexpected/reordered IDs, invalid probabilities, illegal status combinations, answer payloads on non-success states and incorrect counts. Implement the exact unions and concrete size bounds in the v2 specification rather than using this overview as a substitute for its types.

## 8. Step-by-step work: establish the implementation inventory

Search before changing shared interfaces:

```sh
rg -n 'decisionRequest|parseDecisionRequest|parseDecisionResult|applyDecision|mainDecision|decisionQuestions|laya-policy-v1' src server scripts tests evaluation
```

Trace actual callers, fixtures, exports, configuration and user-facing consumers. Pay particular attention to:

| Area | Files to inspect |
| --- | --- |
| Shared contract and findings | `src/decision.ts`, `src/types.ts`, `src/main-decision.ts` |
| Questions and inference | `server/decision-questions.ts`, `server/laya_worker.py` |
| Service/permissions | `server/decision-service.ts`, `server/decision-server.ts`, `src/background.ts` |
| Client and presentation | `src/decision-client.ts`, `src/findings-view.ts`, `src/report.ts`, popup/page consumers |
| Original source ordering | `src/scanner.ts`, `src/frame-coordinator.ts`, `src/overview-recovery.ts` |
| Data and historical runs | `scripts/build_laya_operational.py`, `scripts/validate_laya_operational.py`, `scripts/train_laya_domain.py`, preparation/export helpers |
| Evaluation/browser paths | `scripts/evaluate-decision.ts`, `scripts/evaluate-laya-policy.ts`, `scripts/capture-laya-evidence.mjs`, `scripts/browser-decision.ts` |

Output: `implementation-inventory.md` with each caller's migration, needed tests, preserved historical compatibility and files you will leave untouched. Treat the list above as a starting map, not an exhaustive instruction to edit every file.

## 9. Step-by-step work: build the contextual data path

Create a new versioned dataset format and validator. Preserve the existing passage-only recipe: the old validator requires empty neighbors, three splits and v1; the old training runner rejects real neighbors and exports five tasks. Do not weaken it to accept the new format or alter a historically pinned run's behavior.

Use whole public postings as contextual source records. Each posting needs:

- Stable internal posting ID, employer, title, known country or null, and coverage declaration.
- Normalized employer/parent grouping and materially copied policy-family membership.
- Intended split, original ordered blocks and trustworthy context-group boundaries.
- Reviewed target annotations: relevance, all five labels, rationale and review state.
- Whole-posting gold headline and supporting evidence IDs where it is an evaluation posting.

Store annotation metadata separately from the model input. Keep enough original text to reproduce and audit every context. Detailed per-record URLs/capture dates remain optional under the waiver; internal identity, review and grouping are necessary. Exclude applicant answers, resumes, uploads, private form values and personal data.

Maintain `train`, `development`, `calibration` and `fresh-test` as distinct uses. Assign connected posting/employer/policy/context groups before exposing examples to implementation. No connected group crosses splits. Audit against historical training/calibration/test ownership. Ordinary short industry wording is not automatic leakage; investigate actual duplicates and material policy copying.

Old training records may enter the new optimizer export only after their complete original context is verified. Preserve rows without context in lineage/hold/challenge inventories. Do not label a missing historical neighbor as a natural boundary. Old calibration remains calibration where usable. The viewed 12-test-passage set remains historical, never fresh evidence for another tuning cycle. WTW and all authored design fixtures are exposed development/regression evidence.

Outputs: schema/examples, new reader/validator, `membership-ledger.json`, historical lineage, exclusion/hold reasons, and meaningful tests for duplicate IDs, non-role findings, cross-split groups, invalid contexts and privacy.

## 10. Step-by-step work: collect and review real examples

Search broadly across employers and platforms. Do not use `site:` filters, domain allowlists or recruiting-platform restrictions as the search standard. Preserve the public description/qualification text in original paragraph/list order.

Start with 80 additional training targets, each with real context and six reviewed labels:

| Primary collection bucket | Initial count | Examples |
| --- | ---: | --- |
| Ordinary negatives | 40 | duties, benefits, diversity, deadlines, onboarding, multiple-application rules, event sponsorship |
| Context-sensitive targets | 20 | unrelated target next to policy, genuine policy references, adjacent conditions and exceptions |
| Conditional sponsorship | 10 | actual stated conditions under which this vacancy may provide sponsorship |
| Historical/other-role | 10 | both past activity and policies for another job/later conversion |

Count a target once toward its primary bucket; record secondary tags. Include company policies, applicant questions, all scope/timing classes and independent CPT/OPT acceptance/exclusion where support is weak. An irrelevant degree requirement can be scope role. An unrelated paragraph next to a refusal remains irrelevant. Label interpretation on negatives too, so false-positive screening is not immediately followed by a confident policy claim.

For every candidate, independently review relevance and all five fields with actual context. Resolve disagreements before freeze; preserve unresolved cases outside optimizer/test-quality inputs. Conditions beyond the supported immediate neighbors require a reviewed coherent extraction unit or an unsupported/hold decision, not a guessed label.

Begin separate collection with approximately 10 development postings, 10 additional calibration postings and 20–30 fresh-test postings. These are starting counts. Increase collection until coverage requirements are satisfied. Label all original targets in whole-posting evaluation data, including irrelevant text, and review completeness and whole-posting outcomes. Include complete jobs with no relevant policy and a separately registered incomplete/oversized/missing-context operational challenge set.

Use a separate data-review role for fresh-test collection/labeling/freezing. The implementation/training role may inspect aggregate coverage and split integrity but must not use individual fresh-test examples/labels for debugging or candidate selection. A single execution context that reads fresh gold and then tunes on it cannot claim blind evaluation. Record exposure and obtain a new fresh test if that happens. If actual human gold review is unavailable, complete candidate collection, code and automated checks and report the review gate as pending; do not invent reviewer approval.

Outputs: candidate split files, reviewed posting/target records, class/context coverage, disagreements and resolutions, no-policy subset membership, operational challenges, and fresh-test exposure ledger.

## 11. Step-by-step work: validate and freeze the data

Your validator must reject wrong schema/split headers; duplicate posting/target/block IDs; missing target references; invalid enum labels; definitive non-role immigration findings; invalid group/position/boundary metadata; cross-split group/context leakage; hash drift; missing review completion; and unsupported inputs incorrectly included in optimizer export.

Pre-register which targets are quality-eligible using reviewed context and input support before viewing predictions. Runtime failure on an eligible target remains a miss. Do not remove difficult records from denominators after inference.

Require independent review of label correctness, split membership, copied policies, context, privacy and completeness. Freeze into a new directory only after the required reviews pass. Never overwrite or refresh an old frozen directory. Hashes detect change; they do not establish correctness.

Expected release structure, with the actual execution version/date chosen once:

```text
evaluation/laya-training/<new-contextual-dataset-version>/
  manifest.json
  train.json
  development.json
  calibration.json
  fresh-test.json
  postings.json
  membership-ledger.json
  coverage-report.json
  exclusions.json
  exposure-ledger.json
  independent-review.json
  questions.json
  context-definition.json
```

Equivalent structures are acceptable if the existing project pattern fits better and every listed responsibility is preserved. The manifest pins exact files, counts, hashes, membership, contract/context/questions, review evidence and intended use. Keep fresh-test content out of training/export logs. No model weights are updated in this step.

## 12. Step-by-step work: implement v2 context, questions and worker

Implement the matching request/result types, parser, grouped context derivation and immutable question exports first. Question order is `relevance`, `scope`, `sponsorship`, `timing`, `cpt`, `opt`. Preserve pinned v1 definitions for historical runs. Cross-language parity fixtures must prove the Python worker and training exporter use identical states.

Then implement worker control flow:

```text
Validate the request and configured identities.
Derive each target's original context before filtering.
For each original target:
    If context is missing or input is unsupported:
        Return typed unsupported outcomes without model calls.
    Otherwise run the binary screening question.
    If screening fails:
        Return screening-failed terminal state without interpretation.
    Otherwise compute the route from the registered configuration.
    If a calibrated confident-irrelevance skip applies:
        Return skipped without five-field answers.
    Otherwise run the five interpretation questions on the same state.
    Preserve successful answers or typed interpretation failure.
Restore original ID order and recompute every processing count.
Return a structurally valid complete/partial result.
```

Load one model once, remain offline, retain timeouts and bounded/serialized behavior. Pretraining default is all-forward for successful screens. Test calibrated routes using injected configurations, without fitting them here. Avoid per-target model reloads or a second independent-verifier model.

The installed Laya temperature array is keyed by question type, not stage. Inspect the actual installed runtime when implementing stage parameters; do not assume two array entries represent screening and interpretation. Any temporary shared configuration must be restored reliably between stages/requests and tested for leakage. Result/cache identity includes the actual model and question/context/parameter digests.

Use a fake model to test control flow and failures. For any real loader probe, create a private compatible tokenizer directory and verify original source hashes before/after. Do not load an immutable source checkpoint directly if the loader can rewrite its tokenizer metadata.

Outputs: real worker implementation, reusable existing-style context/configuration code, exact v2 validators, question/context exports, fake-worker tests and safely obtained real-loader evidence where available.

## 13. Step-by-step work: migrate service, client, projection and UI

Update all actual callers together. Preserve loopback host/origin authorization, payload bounds, safe errors, opt-in permission, private-answer exclusion, polling, cancellation and navigation/evidence-generation guards. A stale response cannot appear on a different job. V1 results cannot satisfy v2 requests or caches.

A ready transport reply may contain partial processing. Show that honestly. A malformed reply or fatal service failure remains an error. The deterministic main badge remains authoritative during this phase and must still receive all original unfiltered evidence, including text the model skips. Use disposable test profiles/services instead of modifying installed extension settings or the default backend checkpoint.

Project role-scoped successful answers through the reviewed confidence rules. A score alone does not prove semantic support. Bind quotes to exact source IDs; distinguish the target quote from clarifying context; preserve exceptions and affected groups.

Implement these known projection corrections:

- Remove automatic conditional sponsorship from different current/future labels. Disjoint now-available/future-unavailable evidence makes the overall policy unavailable, preserves both timed facts, and establishes an explicit blocker when complete. Overlapping contradictory evidence remains unresolved.
- Genuine explicit conditional provision stays conditional even when its wording includes “do not sponsor except...”. Remove the lexical conditional-refusal override.
- Unresolved sponsorship/CPT/OPT prevents an unsupported no-blocker conclusion. Successful silence is distinct from unresolved relevant policy.
- Relevant role-scoped eligibility text left unexplained by all three unclear policy answers requires review under the v2 specification; retain separately established deterministic restrictions.

Whole-posting precedence is: pending/error/partial/incomplete → Could not verify; otherwise a definitive blocker → Explicit blocker found; otherwise unresolved policy → Could not verify; otherwise explicit available/conditional sponsorship → Sponsorship stated; otherwise → No blocker found. A directly conflicting claim is not definitive. Preserve known details even when the overall scan is partial. “No blocker found” never proves sponsorship availability.

Keep model-only comparison coverage distinct from combined deterministic/model decisions. Do not imply a model-only result evaluated citizenship/export restrictions when it did not. Use existing accessible components and presentation patterns.

Outputs: migrated worker/service/background/client/display/evaluation consumers, cache identity, partial-result presentation and projection/lifecycle tests.

## 14. Step-by-step work: prepare training exports and evaluation

Build a new contextual optimizer-facing exporter without changing the old recipe. Export six tasks per eligible reviewed target, including interpretation examples for negatives. Validate split ownership before any model load. Calibration, development and test records must be rejected by the optimizer-facing path. Preserve question order, class definitions, context and artifact hashes.

Prepare scoring for raw accepted passage claims before aggregation, routing and usable retention, exact finding recall, per-class confusion/support, all-five-field agreement, semantic citation support, whole-posting outcomes, operational failures and runtime timings. Authored fixtures are engineering evidence, not fresh accuracy evidence.

The later acceptance gates are:

| Gate | Required later result |
| --- | --- |
| Relevant retention | At least 98% routed and usable retention on pre-registered eligible relevant targets |
| Critical findings | Zero availability failures or exact-finding misses for explicit role refusals/CPT/OPT exclusions |
| Supported claims | At least 98% semantically supported emitted sponsorship/CPT/OPT claims |
| Finding recall | At least 90% raw and group-deduplicated exact finding recall |
| Severe errors | Zero unsupported offers/conditional offers/refusals/exclusions, scope transfers or materially invented conditions/timing |
| No-policy usefulness | At least 90% correct No blocker found across at least 10 independent no-policy groups |
| Claim/class support | At least 100 emitted claims overall; each consequential gold class has at least 20 distinct targets across five postings, with copied policies counted as specified |
| Structural safety | Every original ID accounted for; zero falsely complete or malformed accepted responses |

Consequential classes are sponsorship available/unavailable/conditional and CPT/OPT explicitly accepted/excluded. Report counts, missing classes, abstention and connected-group uncertainty intervals. See the acceptance specification for exact independence, duplicate and denominator definitions. A zero denominator is insufficient, never perfect.

Prepare the fixed comparison of deterministic rules, the previous experimental interpreter, the newly trained interpreter with screening bypassed, and the full two-stage pipeline. Implement comparison/scoring plumbing now; actual final fresh-test inference happens after training and calibration.

Outputs: validated training exports, development scoring interfaces, machine-readable gate registry and a proposed future run manifest explicitly marked training not started.

## 15. Step-by-step work: verify engineering and measure runtime

Run targeted tests while editing, then the full engineering checks appropriate to the completed change:

```sh
node evaluation/laya-training/two-stage-contract-2026-10-10/verify-design.mjs
python3 scripts/validate_laya_operational.py
pnpm typecheck
pnpm test
pnpm build
```

The design verifier is a reference assertion script, not proof of a production v2 parser. Add actual runtime tests using its fixtures. Add the new contextual validator and pure Python context/worker/export tests, then record their actual commands. Read existing Python tests before running them: some smoke/training commands load models or update weights. Do not run `pnpm train:laya:smoke` during this assignment.

Your meaningful tests must cover valid complete/partial/empty responses; relevant/uncertain/skip routes; failed/unsupported stages; every original ID; invalid probabilities/enums/counts/digests; source-group boundaries and gaps; no survivor rewiring; real token budget without truncation; stage configuration leakage; exact quote binding; applicant-question guard; genuine exceptions; timed conflicts/refusals; unresolved CPT/OPT; complete no-policy jobs; stale/navigation/cancelled replies; permissions/origin rejection; private-answer exclusion; and service outage.

Use the existing browser integration path with a disposable profile and controlled v2 mock first. Verify popup/page consistency, opt-in/out, partial-state messaging and unchanged deterministic main badge. Do not kill an existing service merely to free a test port; use isolated configuration or report that test prerequisite. Any real worker/browser probe uses development or authored evidence, never fresh gold or the old held-out evaluation as if fresh.

Measure intended local hardware with the acceptance specification's protocol: same frozen development benchmark postings, cold load separately, warm-up, caches bypassed, at least 30 warm operational jobs per compared path, and a v2 all-forward worst-case profile. Record hardware, device, precision, batching, context sizes, model/code/configuration hashes, p50/p95/max times, memory and all failures.

Register warm v2 p95 at no more than twice measured v1 p95 and below the actual worker timeout, currently 150 seconds. Re-read the configured timeout. Establish cold-load/memory budgets from actual hardware and operating margin before tuning. A pretraining latency probe measures engineering performance, not trained policy accuracy.

Outputs: `TASK-6-VERIFICATION.md` with exact commands, pass/fail/skipped checks, browser artifacts, context parity evidence, unchanged historical integrity and measured latency/memory registration. Never substitute mock success for a skipped real integration check.

## 16. Protected artifacts and boundaries

Preserve the historical operational corpus, source submissions, question snapshots and checkpoints. Create new versioned artifacts rather than overwriting them. Never move calibration/test examples into training or quietly change historical membership.

The original resumable checkpoint is:

`.model-cache/training/domain-2026-10-09/checkpoints/step-000132`

The calibrated inference derivative is:

`.model-cache/training/domain-2026-10-09/posttraining/calibrated-checkpoint`

The derivative links model/encoder files to the original. Preserve both; deleting or moving the original breaks it. Large weights and optimizer files are ignored by Git, so commits are not a model backup. Produce backup/rollback instructions and verify the backup prerequisites before later training work.

During this assignment, do not update weights, fit calibration, run final fresh-test evaluation, change the default checkpoint, make the model authoritative for the main badge, or promote the experimental checkpoint. Prepare the inputs and implementation those later activities need. Keep job text and sensitive exception details out of logs. Reuse installed dependencies and existing patterns; add no cloud service, unnecessary abstraction or dependency.

## 17. Completion and final handoff

Deliver the following packet with actual paths and reproducible commands:

1. Implementation inventory and summary of final runtime/caller changes.
2. Four contextual splits plus original posting evidence, membership/exposure/coverage/exclusion ledgers and independent review.
3. Frozen dataset manifest, exact hashes and passing new/historical validators.
4. Versioned v2 question/context exports and validated six-task optimizer input.
5. Worker/service/client/display implementation and passing meaningful tests.
6. Browser/integration evidence, hardware benchmark and registered limits.
7. Private tokenizer/load-integrity procedure, checkpoint backup/rollback instructions and known dependencies.
8. `TASK-7-READINESS.md` stating each entry requirement as passed, failed or pending, with evidence; proposed training settings remain unexecuted.

Use the readiness report to distinguish data readiness, engineering readiness and model-quality evidence. Task 6 is complete only when its required data and engineering gates pass. An unavailable independent review, missing class support, failing runtime test or unmeasured hardware requirement stays pending; do not mark completion from file existence.

Your final response must state what is completed, where the deliverables are, what was actually tested, what remains blocked/pending, and whether a separate training task can now be registered. After this handoff, stop before weight updates. The subsequent owner-initiated task will register candidate training, verify resume behavior, train using training only, select using development only, then later calibrate and evaluate under the locked protocol.
