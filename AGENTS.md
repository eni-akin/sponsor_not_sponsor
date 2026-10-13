## Agent skills

## Project safety and current workflow

Before changing sponsorship logic, Laya data, model code, or evaluation artifacts, read these in order:

1. `DECISION_LOGIC.md` — authoritative label and headline rules.
2. `HANDOFF.md` — current project state and explicit prohibitions.
3. `docs/agents/laya-workflow.md` — complete agent-facing product, data, review, validation, and authorization flow.
4. `evaluation/laya-training/contextual-v2-2026-10-12/README.md` — current candidate-corpus artifact map, holds, and commands.
5. `evaluation/laya-training/independent-review-2026-10-10/FINAL-INDEPENDENT-REVIEW.md` — why v1 was rejected and the reviewed corrections.
6. `evaluation/laya-training/TWO-STAGE-V2-CONTRACT-2026-10-10.md`, `TWO-STAGE-SCREENING-CONTEXT-2026-10-10.md`, and `TWO-STAGE-ACCEPTANCE-2026-10-10.md` — runtime and acceptance contracts.

Current data roles:

- `contextual-v1-2026-10-10/` is an immutable historical snapshot. Its generated approval flags are superseded by independent review.
- `contextual-v2-2026-10-12/` is the active **candidate**, built reproducibly by `python3 scripts/build_contextual_v2.py`. It is not frozen and does not authorize training.
- `independent-review-2026-10-10/` is review evidence. Do not rewrite it to make v2 appear approved.
- `.model-cache/training/domain-2026-10-09/` contains ignored model state. A Git commit is not a checkpoint backup.

Never train, calibrate, run fresh-test predictions, promote a checkpoint, change service defaults, or rewrite frozen artifacts unless the current user explicitly authorizes that action. Dataset preparation is not training authorization. Preserve unrelated working-tree changes.

For contextual data changes, edit source/review inputs or `scripts/build_contextual_v2.py`, rebuild v2, and run:

```sh
python3 scripts/build_contextual_v2.py
python3 scripts/validate_laya_contextual.py --dataset-dir evaluation/laya-training/contextual-v2-2026-10-12 --allow-candidate
python3 -m unittest discover -s tests -p 'test_laya_contextual*.py'
python3 -m unittest discover -s tests -p 'test_v2_*.py'
```

Do not hand-edit generated v2 JSON. Do not pass `--allow-candidate` to an optimizer workflow as a substitute for approval. A future frozen manifest must derive approval from completed review evidence, not from a hard-coded Boolean.

### Issue tracker

Issues are tracked in this repository's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The tracker uses the default five-role triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Domain documentation uses a single-context layout. See `docs/agents/domain.md`.
