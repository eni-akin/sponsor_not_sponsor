# Repository structure

The current operational entry points are intentionally kept small:

- `src/`, `server/`, and `extension/`: extension and local decision-service implementation.
- `tests/`: active TypeScript and Python regression tests.
- `scripts/`: active build, evaluation, dataset, and training utilities.
- `evaluation/laya-training/worker-review-v2/`: current five-field review snapshot.
- `evaluation/laya-training/contextual-v2-2026-10-12/`: active corrected two-stage data candidate; not training-approved.
- `evaluation/laya-training/independent-review-2026-10-10/`: independent AI review, adjudication, and support audit that drive contextual v2.
- `evaluation/laya-training/contextual-v1-2026-10-10/`: immutable historical contextual snapshot; its generated approval flags are superseded.
- `evaluation/laya-training/frozen-expansion-v1/`: immutable approved training corpus v1.
- `evaluation/laya-training/normalized-submissions-2026-10-08.json`: approved training/calibration candidates pending freeze.
- `evaluation/laya-training/archive/`: superseded prototypes, reviews, research notes, and smoke-run evidence retained for auditability.
- `docs/archive/handoffs/`: superseded dated handoffs.
- `docs/agents/`: stable agent index, Laya workflow, domain-document guidance, and issue-tracker conventions.
- `release/`: store and packaging material.

Use [HANDOFF.md](HANDOFF.md) for current status, [DECISION_LOGIC.md](DECISION_LOGIC.md) for labeling decisions, and [the contextual-v2 README](evaluation/laya-training/contextual-v2-2026-10-12/README.md) for the active data flow. Files under an `archive/` directory are read-only historical references, not inputs to current training or evaluation. Generated local outputs should go under `evaluation/laya-training/generated/` and should not be treated as reviewed artifacts.
