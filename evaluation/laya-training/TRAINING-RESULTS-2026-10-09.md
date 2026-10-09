# Completed Laya fine-tuning — October 9, 2026

Training and post-training checks are complete. This is a local experimental checkpoint, **not approved for production**. The existing decision service and extension defaults were not changed.

## Saved model

- Calibrated inference directory: `/Users/eniola/Documents/Project/Sponsor_Not_Sponsor/.model-cache/training/domain-2026-10-09/posttraining/calibrated-checkpoint`.
- Original full resumable checkpoint: `.model-cache/training/domain-2026-10-09/checkpoints/step-000132`.
- Earlier resumable epoch checkpoints: `step-000044` and `step-000088`.
- [Fixed plan](TRAINING-RUN-PLAN-2026-10-09.md), [completed run record](TRAINING-RUN-2026-10-09.json), [calibration and test results](TRAINING-RESULTS-2026-10-09.json), [metadata recovery record](TOKENIZER-RECOVERY-2026-10-09.json).

The calibrated directory links the trained model weights and encoder to the original checkpoint. Preserve both directories; deleting or moving the original breaks the calibrated model. Tokenizer files have a private compatible copy, not a link to mutable original metadata. Large checkpoints are intentionally ignored by Git; these small records document the run but do not contain its weights or optimizer state.

## Data and training

The [operational freeze](operational-v2-2026-10-09/manifest.json) locks 87 training, 44 calibration and 12 held-out test passages. This combines reviewed additions with earlier approved passages, without replacing original CSVs or frozen v1. Actual employer groups, duplicate evidence and substantially copied policy templates cannot cross splits. Short ordinary industry phrasing is allowed. The independent review records exclusions, membership rulings and hashes.

Only the 87 training passages updated model weights. Each produces the same five questions as the decision worker: 435 question decisions per epoch. Training used the cached multilingual base, full-model RLCD plus cross-entropy, three epochs, 132 optimizer updates, seed 42, accumulated batches of ten decisions, encoder/head learning rates 2.5e-5/1e-4, AdamW weight decay 0.01, gradient clip 1.0, exploration sigma 0.4–0.1, float32 and Apple MPS. The last batch in each epoch contains five decisions and is scaled accordingly.

All 321,908,995 parameters were loaded; encoder and head weights changed. Training completed in 314.406 seconds. Losses and gradient norms were finite; the cached base was unchanged. Mean training cross-entropy decreased from 2.0097 in epoch one to 1.2800 in epoch three. These are online training losses, not independent accuracy measurements or proof against memorization.

Checkpoints preserve model weights, AdamW moments, shuffled order/cursor, progress and RNG state. Four engineering tests include exact interrupted-versus-uninterrupted continuity on a small CPU fixture. This is not a claim of bit-for-bit full-model reproducibility across GPU devices.

## Calibration

The final epoch checkpoint was selected before evaluation. One shared choice temperature was fitted using only the 44 calibration passages / 220 decisions. The preselected deterministic grid was 0.50–5.00, step 0.01, minimizing equal-weight decision NLL. Temperature is **5.0**, the runtime upper bound. Calibration NLL decreased from 1.7766 to 0.4396. The boundary optimum signals residual overconfidence; the grid was not expanded after seeing results.

Inference config uses `[5.0, 1.0, 1.0]`; option/language/binned overrides are removed. No calibration labels updated weights. The abstention threshold remains 0.8 and was not optimized. Temperature changes probabilities, not predicted labels.

## One registered held-out comparison

The questions, datasets, final checkpoint, calibration algorithm/temperature and threshold were registered before the first test prediction. The same test logits are used for unscaled and calibrated metrics; no adaptive retraining, checkpoint selection or repeated test inference occurred.

| Metric | Frozen base | Fine-tuned | Fine-tuned + calibrated |
| --- | ---: | ---: | ---: |
| Correct field labels, out of 60 | 28 | 50 | 50 |
| All five labels correct, out of 12 passages | 0 | 4 | 4 |
| Mean NLL, lower is better | 1.4035 | 2.3029 | 0.5620 |
| Mean multiclass Brier, lower is better | 0.7383 | 0.2980 | 0.2609 |

| Field | Base correct / 12 | Fine-tuned correct / 12 |
| --- | ---: | ---: |
| Scope | 6 | 10 |
| Sponsorship | 4 | 7 |
| Timing | 6 | 10 |
| CPT | 8 | 12 |
| OPT | 4 | 11 |

The 83.3% overall label accuracy is not 83.3% sponsorship accuracy: sponsorship is **7/12 (58.3%)**. Fine-tuning overstates sponsorship in several unclear/conditional cases. For sponsorship, available precision is 1/5, conditional recall is 0/1, and unclear recall is 2/6. Even after calibration, seven of the ten wrong field labels have confidence at least 0.8. All-field exact agreement is only 4/12. These are material reasons not to promote.

This tiny test has no historical/other-role/none scope cases, no future-only timing case and no accepted-CPT case. The training set also lacks other-role/none scope examples. Per-class results with no support are unavailable, not perfect performance. Future changes need fresh locked evaluation data; this viewed test is no longer fresh evidence for another tuning cycle.

## Verification and metadata recovery

All 217 TypeScript tests and type checking passed. The existing Python worker loaded the calibrated checkpoint on CPU and passed the four smoke contract/tokenization/worker tests. An additional Apple MPS worker probe loaded the same calibrated model and returned valid five-field results for an authored engineering example, without accessing the held-out set. Frozen dataset validation passed. The calibration/recovery logic has seven pure tests. An independent read-only agent reproduced report metrics from saved predictions, matched every test ID/label/option to the frozen set, and verified restored checkpoint hashes. This verifies loading and the established five-field response contract, not end-to-end browser accuracy.

Laya's loader rewrote `tokenizer_config.json` for compatibility, changing `TokenizersBackend` to `PreTrainedTokenizerFast` and removing two backend metadata keys. The post-inference integrity gate correctly stopped report publication. The normalized metadata was preserved in a private derivative tokenizer, and the exact original checkpoint bytes were restored from the independently hash-matching epoch-two tokenizer. All 143 passages' encoded question/evidence items matched before/after; original checkpoint, base, executable source and calibrated-config hashes were reverified. Final metrics were reconstructed solely from saved predictions, without another model load or test evaluation. The recovery record preserves both metadata versions and hashes.

The registered calibrator is retained unchanged for audit; do not rerun it on an immutable checkpoint without arranging private tokenizer files first. The same loader compatibility behavior must be handled before any future full-model resume. No resume was necessary for this uninterrupted completed run.

Skipped live browser/vacancy evaluation and GPU-worker probability equivalence: offline evaluation used float32 per-question inference, while the production MPS worker may batch questions with reduced precision. Passage-only inputs had real supplied title/employer and empty missing neighbors; no whole-vacancy completeness claim was made. Production promotion remains a separate approval after stronger data and integration evidence.
