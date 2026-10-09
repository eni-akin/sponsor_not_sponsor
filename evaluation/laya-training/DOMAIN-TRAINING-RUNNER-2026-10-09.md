# Offline domain training runner — October 9, 2026

`scripts/train_laya_domain.py` keeps the original authored smoke command intact. It validates all three operational frozen splits before loading even the tokenizer. Calibration/test records never enter weight updates. The operational records use the supplied title/employer context and explicitly declare no neighboring blocks: this is passage-only learning and does not establish whole-vacancy completeness or production readiness.

The fixed default recipe is three epochs, seed 42, full float32 encoder/head training, AdamW encoder learning rate 0.000025/head rate 0.0001, weight decay 0.01, ten decision examples per accumulated update, gradient norm clipping at 1.0, and linear RLCD exploration from 0.4 to 0.1. Every passage supplies the existing five questions and one-hot reviewed labels. The base model, operational artifacts, source, questions, contract, runtime packages and configuration are hash-pinned before updates. Token truncation and collapsed criteria are rejected.

Run a tokenizer/device preflight in a separate new output directory:

```sh
.decision-venv/bin/python scripts/train_laya_domain.py --dataset-dir evaluation/laya-training/operational-v2-2026-10-09 --output .model-cache/training/domain-preflight-2026-10-09 --device mps --preflight
```

After independent dataset approval and the CPU resume test pass, start actual training in another new directory:

```sh
.decision-venv/bin/python scripts/train_laya_domain.py --dataset-dir evaluation/laya-training/operational-v2-2026-10-09 --output .model-cache/training/domain-2026-10-09 --device mps
```

Checkpoints are committed at epoch ends and requested interruptions, never halfway through accumulated gradients. `--checkpoint-every 25` optionally adds periodic optimizer-boundary commits. SIGINT/SIGTERM requests completion of the current update then a durable checkpoint. `--stop-after-updates N` is for engineering interruption checks, not calibration-driven early stopping. All checkpoint directories remain available; a full float32 model plus AdamW state is about 4 GB. No historical or failed artifacts are deleted. `latest.json` points to the newest committed checkpoint.

Resume with the same run directory and `--resume` naming its committed local checkpoint under `checkpoints/`. Arbitrary external pickle checkpoints, missing/corrupted artifacts, configuration/source/data/base drift and completed runs are rejected. Model and optimizer initialization/loading happens before Python/Torch/accelerator RNG restoration. Saved progress includes the permutation/cursor, epoch, optimizer update count, exploration history and optimizer moments. New partial checkpoint directories are published atomically on the same filesystem after hashes are recorded; incomplete directories never become `latest.json`.

`tests/test_laya_domain.py` uses a tiny real-Torch model with dropout and the same RLCD/update/save functions to compare uninterrupted training with checkpoint/resume. It checks exact CPU parameters, AdamW steps/moments, order/cursor, exploration, Python/Torch RNG and subsequent draws, including crossing an epoch shuffle. It also checks rejection of tampering, configuration drift and calibration optimizer inputs. It does not load the pretrained model.

Inference checkpoints preserve the existing Laya worker format with identity temperatures `[1,1,1]` and no option/language overrides. Calibration is a separate offline, frozen-weight step. Runner completion does not promote the model, prove real-world accuracy, or change the product decision contract/abstention threshold. A worker reload/inference check and final held-out diagnostic remain coordinator responsibilities after the actual run.
