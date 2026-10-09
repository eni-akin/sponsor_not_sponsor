# Offline calibration and registered passage evaluation

`scripts/calibrate_laya_domain.py` validates frozen datasets and every committed final checkpoint artifact without loading optimizer pickle. Only a completed preselected final-epoch checkpoint is accepted.

It fits one shared choice temperature from calibration logits only: 0.50–5.00 in increments of 0.01, equal weight per decision, minimum mean NLL, ties closest to 1 then smaller. The threshold remains 0.8 and is never fitted. Test/train predictions are rejected by the fitting function. No weight updates occur.

Before the first test inference, an exclusive registration locks dataset/question/contract/source/base/final/config hashes and temperature. Repeating the same test/final-model pair is rejected across output directories; failed registration evidence remains, with no automatic retry. Later model comparisons against this already viewed test are not fresh independent evidence.

The comparison reports frozen base, unscaled final and temperature-scaled final using the same held-out passage states. Per-field/class counts, precision/recall/confusion, exact five-field agreement, NLL, Brier and rounded selected-confidence coverage are saved. Offline role-plus-known-sponsorship confidence is not the production decision projection. Passage-only evaluation does not prove whole-vacancy completeness, citation validity, browser integration or safe conclusions from silence. No promotion happens.

The calibrated checkpoint is a small derivative configuration plus symlinks to the original committed model/encoder/tokenizer. Preserve the original training checkpoint; moving or deleting it breaks the derivative. Model weights and original configurations remain unchanged.
