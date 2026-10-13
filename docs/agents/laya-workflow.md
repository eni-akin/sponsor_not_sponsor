# Laya and sponsorship workflow for agents

## Mission

Sponsor Not Sponsor reads public job-posting text and reports only what that posting establishes about visa sponsorship, timing, CPT, OPT, and separate deterministic eligibility restrictions. Preserve uncertainty and exact citations. Do not use applicant answers, resumes, uploads, private form state, employer reputation, or silence as policy evidence.

`DECISION_LOGIC.md` is authoritative. Applicant questions, historical policies, company-wide policies of uncertain applicability, and policies for another role may be relevant evidence, but they do not establish the named vacancy’s sponsorship result. Citizenship, permanent-residence, U.S.-person, export-control, and clearance rules remain separate from sponsorship.

## Current state

- The October 9 single-stage experimental model was trained and calibrated but was not promoted. Its confident unsupported claims motivated the two-stage design.
- The runtime now supports relevance screening followed by five-field interpretation, with explicit per-passage status and preserved original neighbors.
- `contextual-v1-2026-10-10` is an immutable historical snapshot. Independent review supersedes its generated approval flags.
- `contextual-v2-2026-10-12` is the active corrected candidate. It has 165 training, 51 development, 54 calibration, and 121 fresh-test records, plus 52 explicit holds. Its manifest says `candidate` and `trainingRunApproved: false`.
- No Task 7 training, calibration, fresh-test inference, model promotion, or default-service change is authorized by the current artifacts.

Read `HANDOFF.md`, `evaluation/laya-training/contextual-v2-2026-10-12/README.md`, and `evaluation/laya-training/independent-review-2026-10-10/FINAL-INDEPENDENT-REVIEW.md` for details.

## End-to-end flow

```text
public posting blocks
        |
        v
scanner/frame extraction -> contextGroup + integer position + coverage
        |
        v
v2 request validation -> exact canonical eight-key state
        |
        +--> deterministic blockers always inspect unfiltered text
        |
        v
relevance screen -> forward relevant and uncertain passages
        |
        v
five-field interpretation -> scope/sponsorship/timing/CPT/OPT
        |
        v
strict result parser -> status for every original passage ID
        |
        v
projection/headline -> citations distinguish target from context
```

Screening is not independent verification when the same checkpoint performs both stages. Skipped, failed, missing-context, or unsupported passages do not receive invented labels or confidence. Filtering must not join unrelated survivors or discard the original adjacent conditions.

## Data lifecycle

1. Collect authentic posting text broadly without platform/domain allowlists.
2. Preserve block IDs, original order, context groups, positions, and honest boundaries.
3. Assign connected employer, related-vacancy, copied-policy, and original-context groups before split use.
4. Label relevance plus scope, sponsorship, timing, CPT, and OPT against the target and only its valid context.
5. Keep training, development, calibration, and fresh-test groups disjoint.
6. Have a separate reviewer label before seeing existing gold where possible; adjudicate every disagreement.
7. Record exclusions, exposure, completeness, support, hashes, and unresolved holds.
8. Build a new version. Never rewrite a frozen version or historical split membership.
9. Validate and review the candidate. A successful validator proves structure and hashes, not semantic correctness.
10. Freeze only after every registered gate passes and review evidence actually grants approval.

Build the current candidate with `python3 scripts/build_contextual_v2.py`. The builder verifies the hashes of the independent review inputs, restores the saved WTW source, applies adjudicated changes, removes held records from active splits, snapshots runtime questions, writes the manifest, and validates the result.

Do not hand-edit generated files under `contextual-v2-2026-10-12`. Change reviewed inputs or the builder and regenerate.

## Split rules

- **Training** updates weights. Only approved training records may reach the optimizer.
- **Development** chooses architecture, questions, settings, checkpoints, and routing. It does not update weights.
- **Calibration** fits temperatures, thresholds, or abstention parameters after weights/questions are locked. It never updates weights.
- **Fresh test** is opened once after design and calibration are fixed. Do not inspect predictions during data preparation or use its gold to make training decisions.
- **Operational challenges** test missing, incomplete, oversized, or unsupported inputs. They do not count toward model-quality support.

The optimizer exporter now defaults to active contextual v2 and therefore fails closed while its manifest is a candidate. `--allow-candidate` is for engineering inspection only and is never training permission.

## Current blockers

1. Thirty exact restored WTW targets need new independent labels.
2. `ctx-tra-061` and `ctx-tra-076` need repaired antecedent context before they can return to training.
3. `ft-rec-0095` needs scope adjudication.
4. Fresh postings `ft-post-013` and `ft-post-018` are withheld for material copied-policy relationships with training.
5. Seven fresh operational/source records are excluded; operational fixtures must remain outside quality denominators.
6. Every consequential fresh class remains below 20 eligible deduplicated targets across five postings and five connected groups.
7. Ten no-policy candidates need specific complete-capture attestations.
8. Final independent approval is absent; obtain human signoff if that remains a project gate.
9. The original and calibrated checkpoints need a separate restore-tested backup before any optimizer run.

See `contextual-v2-2026-10-12/review-holds.json` and `coverage-report.json` for machine-readable details.

## Change map

When changing the transport or model contract, inspect all callers before editing:

- Questions and worker: `server/decision-questions.ts`, `server/laya_worker.py`.
- Service and transport: `server/decision-service.ts`, `server/decision-server.ts`, `src/decision.ts`, `src/decision-client.ts`, `src/types.ts`.
- Projection and display: `src/main-decision.ts`, `src/findings-view.ts`, badge/view tests.
- Extraction and context: `src/scanner.ts`, `src/frame-coordinator.ts`, `src/overview-recovery.ts`.
- Data/export/validation: `scripts/build_contextual_v2.py`, `scripts/validate_laya_contextual.py`, `scripts/prepare_laya_contextual.py`.
- Verification: `tests/test_laya_contextual_data.py`, `tests/test_v2_worker.py`, `tests/test_v2_parity.py`, `tests/decision-contract.test.ts`, `tests/decision.test.ts`.

Keep deterministic blockers on unfiltered text. Keep the six label vocabularies stable unless a versioned contract changes every producer and consumer together.

## Safe commands

```sh
git status --short
python3 scripts/build_contextual_v2.py
python3 scripts/validate_laya_contextual.py --allow-candidate
python3 scripts/validate_laya_operational.py
python3 -m unittest discover -s tests -p 'test_laya_contextual*.py'
python3 -m unittest discover -s tests -p 'test_v2_*.py'
pnpm typecheck
pnpm test
pnpm build
```

The full TypeScript test command may need permission to create a temporary local IPC socket. None of these commands train or calibrate a model. Do not run the old calibrator against an immutable checkpoint merely to test loading.

## Training authorization boundary

Before training, require all of the following:

- A frozen manifest derived from completed review evidence, not a hard-coded flag.
- No unresolved active-record holds or split leakage.
- Sufficient development, calibration, and fresh coverage for the registered protocol.
- Exact runtime-question/export parity.
- Private tokenizer isolation and verified resume inputs.
- A separate checkpoint backup with a tested restore.
- Explicit owner authorization for the registered run.

After training, calibration uses calibration only. Fresh evaluation occurs once after weights, questions, routing, thresholds, and batching are locked. Promotion additionally requires the registered quality and browser-integration gates plus explicit owner approval and rollback preservation.

## Reporting

Distinguish these claims precisely:

- “Validated” means structure/hash checks passed.
- “Reviewed” means a named reviewer examined evidence and labels.
- “Frozen” means bytes and membership are locked.
- “Training-approved” means the manifest and current owner authorization permit optimizer work.
- “Production-approved” means fresh evaluation and rollout gates passed and the owner approved promotion.

Never report an uncertain headline as proof that every passage prediction was correct. Never present previously viewed evidence as a fresh test.
