# Two-stage Laya — reviewed design and execution plan

Date: October 10, 2026 (America/Chicago)

## Objective and scope

Improve relevance screening and policy interpretation while preserving the five label vocabularies and vacancy decision meanings in `DECISION_LOGIC.md`. The pipeline is public posting evidence → screen → interpret retained targets with original context → existing decision rules → cited result.

The October 10 work completes the design deliverables for tasks 1–5 and supplies instructions for task 6. Specification completion does not mean the v2 runtime is implemented or that any accuracy gate has passed. Task 6 produces reviewed contextual data and tested runtime integration. Task 7 starts only afterward as separately initiated training work. Calibration, fresh final evaluation and owner-approved promotion follow candidate selection.

The owner endorsed the proposed direction and requested GPT-5.6 subagents. Three `gpt-5.6-sol` agents were assigned focused deliverables; the orchestrator resolves contradictions, reviews fixtures against the authoritative rules and verifies artifact integrity. Agent review is design review, not independent human gold-label adjudication or deployment approval.

## Deliverables and ownership

| Task | Assigned work | Design deliverable | Later proof |
| --- | --- | --- | --- |
| 1 — relevance | Screening/context agent | Relevance rubric and authored boundary fixtures | Reviewed real-data labels and screening retention |
| 2 — context | Screening/context agent | Original-source adjacency, missing-context and canonical state contract | Runtime/export parity and no neighbor rewiring |
| 3 — transport | Transport/projection agent | Explicit v2 unions, validation, per-ID accounting and failure semantics | Worker/service/parser/client contract tests |
| 4 — decisions | Transport/projection agent | Projection/uncertainty rules and correction cases | Projection and headline regression tests |
| 5 — acceptance | Acceptance agent | Registered metric definitions, support requirements and benchmark protocol | Locked calibration/test counts and measured latency |
| 6 — data and implementation | Future executing agent, with data review | Step-by-step runbook | Four-way frozen data plus verified v2 pipeline |
| 7 — training | Future training task | Registered candidate schedule and immutable run inputs | Weight updates, resume/integrity checks and development selection |

Authoritative task 1–5 specifications:

1. [Screening and context](TWO-STAGE-SCREENING-CONTEXT-2026-10-10.md).
2. [V2 transport and decision projection](TWO-STAGE-V2-CONTRACT-2026-10-10.md).
3. [Acceptance criteria](TWO-STAGE-ACCEPTANCE-2026-10-10.md).

The [orchestrator review record](TWO-STAGE-DESIGN-REVIEW-2026-10-10.md) records the review findings, actual checks and remaining later-phase requirements. These new artifacts supplement the October 9 action plan; they do not rewrite its historical status.

## Design decisions to carry into implementation

### Relevance is about the target

Use two human labels: `relevant` and `irrelevant`. Uncertainty is a runtime routing condition. Applicant questions, historical/company/other-role policies and immigration-related eligibility restrictions are relevant even though they may not establish current-role sponsorship. A target beside a policy does not inherit relevance or policy labels unless its own wording refers to that policy.

### Context is original evidence, not surviving neighbors

Both stages and every dataset/export use the same state format. Keep actual source neighbors and conditions. Preserve separate extraction streams for visible, structured, embedded and recovered-overview evidence; concatenated evidence arrays do not prove original adjacency. Unknown country or missing context stays explicitly unknown. Oversized or unresolved contextual inputs do not receive silent truncation or a falsely complete verdict.

### V2 accounts for every original ID

Screen every original target. A successful confident-irrelevance skip has no five-field answer payload. Failed/unsupported blocks are distinct from skips. Processing completeness differs from captured-posting completeness, and both differ from semantic uncertainty. Worker-level fatal errors remain errors rather than fabricated block responses. Transport parsers must reject malformed combinations and identity/order mismatches.

### Passage meaning and whole-posting projection remain distinct

Only role-level interpretation supports definitive sponsorship/CPT/OPT findings. Deterministic blockers keep unfiltered text. Timing stays explicit, CPT/OPT remain independent, and restrictions keep their affected groups and exceptions. A current/future label difference alone does not mean conditional sponsorship. Unresolved CPT/OPT evidence must prevent an unsupported no-blocker verdict. Details can remain visible when the overall result is uncertain.

### Quality means supported useful claims

Confidence is not proof of accuracy. Count accepted passage claims before aggregation so an uncertain final headline cannot hide confident wrong claims. Measure recall as well as precision so abstaining on everything cannot pass. Apply class support and complete-posting usefulness gates. The viewed old test and WTW remain exposed historical/regression evidence.

## Work sequence after design

Use [the task 6 agent runbook](TWO-STAGE-TASK-6-AGENT-RUNBOOK-2026-10-10.md). It is deliberately imperative and specifies output and exit criteria at each step.

1. Inspect instructions, dirty state and every actual caller; deliver an implementation inventory.
2. Establish new contextual data schemas/validators while preserving old passage-only utilities.
3. Assign grouped four-way split ownership and historical lineage before exposing examples to development.
4. Collect/review the missing training cases and separate complete-posting development/calibration/fresh-test evidence.
5. Resolve disagreements, audit coverage/leakage/privacy, and freeze the new dataset with hashes and an independent review.
6. Implement types/questions/context/validators; then worker routing and per-block outcomes.
7. Migrate service/client/cache/projection/display/evaluation together and verify original-text deterministic checks.
8. Prepare six-task training exports and acceptance scoring without performing weight updates or fresh final inference.
9. Run engineering/browser checks, measure the intended hardware latency profile and register its concrete limit before tuning.
10. Deliver a task 7 entry packet with data/code/question/context hashes, verification evidence, unresolved limitations and checkpoint handling.

Data collection/review and runtime implementation may proceed in parallel after the design contract is consistent. Neither substitutes for the other at task 6 completion. Fresh test data review should be separated from implementation/training feedback; expose only coverage/membership aggregates until final evaluation.

## Required artifacts from task 6

Artifact names may use the actual execution date and a new versioned directory. Their content and purpose are required:

- Implementation inventory and caller migration decisions.
- Ordered public posting evidence and reviewed relevance plus five-field targets, without applicant data.
- Four split files, grouping/membership ledger, exclusions, exposure ledger and class/context/coverage counts.
- Frozen manifest, independent data review and validator commands; all exact hashes pinned.
- V2 questions/context exports, worker/service/client/display changes and meaningful tests.
- Per-block routing/processing diagnostics and citation-support review plumbing.
- Engineering verification report, disposable browser artifacts and hardware latency registration.
- Task 7 readiness report and draft run identity; training has not started.

Use the provenance waiver recorded in the handoff: detailed per-record source metadata is optional for approved passage training. Internal identities, original context and split ownership remain needed. Complete-posting evaluation requires honest coverage. Existing frozen data/checkpoints and ignored model backups remain separate from these new artifacts.

## Entry gate for task 7

The next training task must be initiated after task 6 is complete and reviewed. Before its first weight update, pin the contextual data, all six question definitions/order, context/template, training code, initialization candidates, precision/batching, schedule, optimizer, stopping/selection rules and backup location. Only training updates weights; only development selects candidates. Verify private tokenizer loading and resume behavior on the relevant hardware, with exact source-integrity checks.

After selection, lock weights/questions, calibrate actual stage/routing behavior using calibration only, then run one registered fresh test comparison. A failed test used for corrective tuning becomes exposed evidence and requires a new fresh test for the next iteration. Explicit owner approval remains necessary for any model-default or main-badge promotion.
