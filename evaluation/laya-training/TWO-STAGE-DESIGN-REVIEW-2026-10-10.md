# Two-stage Laya — orchestrator design review

Date: October 10, 2026 (America/Chicago)

Result: tasks 1–5 are design-complete and internally reviewed under the owner's approved direction. The task 6 runbook is ready for a future executing agent. Runtime implementation, real contextual data collection/freezing, training, calibration fitting, final evaluation and promotion have not occurred in this work.

## Assignment and review

The owner requested GPT-5.6 subagents. Three `gpt-5.6-sol` agents completed screening/context, transport/projection, and acceptance specifications. The orchestrator reviewed the authoritative decision rules, historical action plan/results/recovery records, actual runtime callers and data utilities, and the authored outputs. Each agent cross-reviewed adjacent work; the acceptance agent independently reviewed the assembled plan and task 6 runbook.

A usage-limit interruption occurred during final peer review after the main artifacts were saved. At the owner's request, all three agents were resumed from their saved work. Their final consistency reports completed successfully. The interruption did not discard artifacts or start a new training run.

## Issues resolved before completion

| Review finding | Resolution |
| --- | --- |
| An irrelevant immigration target was assumed to always have scope `none` | Ordinary role hiring requirements may have scope `role` while all immigration fields remain unclear |
| Appended evidence streams could create invented adjacency | V2 carries source context groups, positions, extents and explicit real-boundary/missing flags |
| Screening failure behavior differed across drafts | Failed/unsupported screens do not run interpretation; every original ID is accounted for in a valid partial response |
| Missing context was not executable in the response contract | Precheck screening as unsupported/missing-context, interpretation unsupported/screening-unsupported, processing partial |
| Mixed current/future labels automatically became conditional | Explicit timing overlap/conflict mapping preserves per-time facts; only an actual condition establishes conditional provision |
| A lexical refusal override could defeat genuine exceptions | Preserve the explicit exception and remove substring-based conditional-refusal conversion in task 6 |
| Unresolved CPT/OPT could reach a no-blocker verdict | Projection specification requires review for unresolved topic evidence; ordinary silence remains distinct |
| An applicant-question fixture included a declarative policy | Split exact source wording into an adjacent question and text policy target; preserve the question guard |
| WTW examples used abbreviated wording with real IDs | Restore exact saved target/neighbor text and zero-based positions for four WTW-derived records |
| Retention denominators mixed eligible targets with unsupported challenges | Register eligibility before predictions; runtime failures on eligible targets remain misses |
| Blanket abstention could satisfy a precision-only gate | Require finding recall, emitted-claim/class support and complete no-policy usefulness |
| Posting-level intervals could ignore shared employer/policy dependence | Resample connected employer/policy/context groups and report raw counts and uncertainty |
| Historical passage-only rows could be treated as contextual optimizer inputs | Require verified complete original context; missing-context copies stay in lineage/hold/challenge inventories |
| Fixture wording implied human labeling that had not happened | Mark authored labels as assistant labels; actual human gold review remains a later data requirement |

## Actual verification

Run from the repository root:

```sh
node evaluation/laya-training/two-stage-contract-2026-10-10/verify-design.mjs
python3 scripts/validate_laya_operational.py
git diff --check
```

The reference fixture check passed:

- 32 labeled target cases with every value in relevance, scope, sponsorship, timing, CPT and OPT represented.
- One unresolved missing-context challenge without invented gold.
- Four context-derivation cases covering natural boundary, missing tail, internal gap and no cross-group adjacency.
- Four exact WTW target/neighbor/position matches against the saved request, including the three known harmful predictions.
- Six valid transport scenarios: empty, mixed complete, partial with another supported ID, known-context interpretation failure, known-context screening failure, and a stubbed overflow outcome.
- Eighteen invalid request/result mutations rejected by the reference assertions, including ID/order errors, invented skip/error answers, probability errors, configuration digests, groups/positions and processing counts.

These are authored specification checks using a reference assertion script. They do not execute a v2 production parser, prove token-budget enforcement with a real tokenizer, or measure model accuracy. The compact overflow fixture supplies a simulated outcome; task 6 must test real overflow with its actual tokenizer/header budget.

The historical frozen dataset validator passed with 87 training, 44 calibration and 12 test passages. Its pinned data, source, decision-contract and question hashes remain valid. No old held-out inference was repeated. Whitespace checks passed for the tracked diff; the new artifacts were also checked explicitly before delivery.

The [design manifest](two-stage-contract-2026-10-10/design-manifest.json) records hashes for the reviewed specifications, plan, runbook, review, fixtures and reference checker. Re-run the verifier after any fixture edit and update the manifest only as a new documented design revision.

## Remaining work and honest status

| Area | Current status | Required next evidence |
| --- | --- | --- |
| Tasks 1–5 | Design complete | Task 6 implements and tests the specified behavior |
| Contextual datasets | Not collected or frozen here | Four-way grouping, labels/context/coverage review and frozen hashes |
| Runtime migration | Not implemented here | Worker/service/parser/client/display/caller tests and browser checks |
| Latency/memory | Unmeasured | Intended-hardware benchmark and registered concrete budgets |
| Calibration thresholds | Not selected | Lock candidate weights/questions, calibrate on calibration only, then freeze |
| Model-quality gates | Unmeasured | One registered fresh comparison with sufficient class support |
| Task 7 training | Not started | Completed task 6, owner initiation, registered run and load/resume/integrity evidence |
| Promotion | Not approved | Passing quality/integration gates and explicit owner approval |

The initial 80 additional training targets and 20–30 fresh test postings are collection starting points. Actual minimum class/group support can require substantially more evidence. Design fixtures are exposed development/regression evidence and cannot count toward fresh evaluation support.

## Scope preservation

Only the new October 10 design artifacts and reference verifier were written. Existing `HANDOFF.md` changes and the untracked `HANDOFF-2026-10-09.md` were preserved. `DECISION_LOGIC.md`, runtime source, model/checkpoint/tokenizer files, frozen datasets, service environment and installed extension were not changed. No commit was made.

The Ponytail approach shaped the design: one locally loaded checkpoint, existing vocabularies/components/service patterns, an explicit minimal v2 contract, and no new semantic-verifier model, cloud service or dependency. Full application/browser/model checks remain task 6 work; this documentation review cannot establish deployment readiness.
