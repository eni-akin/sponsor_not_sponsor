# Repository structure

The current operational entry points are intentionally kept small:

- `src/`, `server/`, and `extension/`: extension and local decision-service implementation.
- `tests/`: active TypeScript and Python regression tests.
- `scripts/`: active build, evaluation, dataset, and training utilities.
- `evaluation/laya-training/worker-review-v2/`: current five-field review snapshot.
- `evaluation/laya-training/frozen-expansion-v1/`: immutable approved training corpus v1.
- `evaluation/laya-training/normalized-submissions-2026-10-08.json`: approved training/calibration candidates pending freeze.
- `evaluation/laya-training/archive/`: superseded prototypes, reviews, research notes, and smoke-run evidence retained for auditability.
- `docs/archive/handoffs/`: superseded dated handoffs.
- `release/`: store and packaging material.

Use [HANDOFF.md](HANDOFF.md) for current status and [DECISION_LOGIC.md](DECISION_LOGIC.md) for labeling decisions. Files under an `archive/` directory are read-only historical references, not inputs to current training or evaluation. Generated local outputs should go under `evaluation/laya-training/generated/` and should not be treated as reviewed artifacts.
