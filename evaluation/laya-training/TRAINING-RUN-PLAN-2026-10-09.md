# Laya domain run — October 9, 2026

Owner authorization: perform necessary preparation, then train/fine-tune the local Laya model continuously until training completes. Preparation and training are authorized; public upload, release, model promotion and replacing the browser extension's default are not part of this run.

## Decisions before training

- Treat the latest submissions as additions to earlier approved submissions. Preserve originals, earlier snapshots and frozen training corpus v1. This is the least destructive membership assumption; do not silently retire the earlier datasets.
- Use reviewed canonical labels only. Exclude unresolved employer identities and ambiguous-label holds rather than guessing. Preserve excluded records and reasons in the membership ledger.
- Keep Think Academy in calibration and exclude its new intended-training passage. Keep Boeing in training and exclude its new intended-calibration passages. No calibration record is automatically moved to training.
- Replace the earlier broad policy-family heuristic with an explicit audit of employer relationships, actual duplicate evidence and substantially copied templates. Ordinary short industry wording alone is not a quarantine reason. Same-employer, distinct-vacancy repetitions within training remain identifiable and grouped.
- Add fresh role-level conditional sponsorship examples before training. Previously proposed but never locked/evaluated test candidates may be explicitly reassigned to training; their entire employer group must then be excluded from the final held-out test.
- Lock reviewed train, calibration and test memberships and hashes before the first optimizer update. Test gold is never used for weight training, question changes, temperature selection, threshold selection or checkpoint selection.
- Inputs are supplied passage states: job title, employer, target text and genuinely supplied neighbors only. Missing neighbors remain empty and are explicitly declared. Passage evaluation does not establish whole-vacancy extraction completeness or safe conclusions from silence.

## Fixed training settings

Base: cached `convaiinnovations/laya-multilingual`, revision `e4e9ddf21a7b1903b7acffd8814ad4307bf63a67`, installed Laya 0.3.21 / PyTorch 2.14.0. No model download or external inference service is needed.

Use the established full-model RLCD recipe, preserving one-hot human targets as human labels, not teacher confidences. Settings: seed 42; three epochs; encoder learning rate 2.5e-5; head learning rate 1e-4; AdamW weight decay 0.01; accumulated batch of ten question decisions; four exploration samples; exploration sigma 0.4 to 0.1; gradient norm clip 1.0; float32; encoder/head gradient checkpointing. Preserve production question ordering and token/option truncation guards. Pin the actual executable configuration and dataset/contract/question/source hashes in the run before updates.

Run on Apple MPS, confirmed available outside the execution sandbox. Save full weights, optimizer moments, progress, permutation/cursor and RNG state at optimizer boundaries on epoch completion or a controlled stop. Restore RNG after loading model/optimizer. Preserve committed checkpoints and failed partial writes; do not prune earlier task artifacts by default. Rough disk budget for three resumable epoch checkpoints is 12 GB plus temporary serialization overhead; 324 GiB was free during preparation.

## Post-training checks

Confirm all three epochs and expected optimizer updates finished with finite losses and gradients. Verify interruption/resume continuity on a deterministic small CPU fixture before the domain run. Verify final inference-checkpoint reload, five-field worker compatibility, model hash and unchanged cached base.

Fit one shared choice temperature using frozen calibration predictions only, bounded to the installed runtime's [0.5, 5.0] interval. Export temperature as `[T, 1, 1]` with option-bucket overrides removed. Keep the production abstention threshold at its existing 0.8 for this experiment; no new target precision floor or deployment threshold is inferred.

If final passage-level test evaluation is run, select the final epoch checkpoint in advance, lock the calibration algorithm/temperature and use one registered comparison of frozen base versus tuned model. Report per-field/class counts and exact five-field agreement, not just a percentage. Do not adjust the model after seeing the test and reuse that test as fresh evidence.

Completing training does not establish superiority or production readiness. Small test/calibration slices and remaining class coverage gaps must be stated explicitly. Production default remains unchanged unless separately approved.
