# Operational Laya datasets

Prepared October 9, 2026. Dataset membership is additive: the original 39 training passages, the prior 50 submitted passages, the latest 58 submitted passages, and the separately reviewed collection are preserved in their original files. This directory contains operational copies only.

| Split | Passages | Employer groups | Use |
|---|---:|---:|---|
| Training | 87 | 78 | Model-weight updates only |
| Calibration | 44 | 41 | Temperature, confidence and abstention selection only |
| Held-out test | 12 | 11 | One locked evaluation after settings are fixed |

The model receives the exact target passage plus the supplied public employer and job title. Previous and next passages are empty. This is passage classification, not a claim that a complete vacancy has been reviewed. Reviewer notes, labels, IDs and hashes never enter model state.

## Membership decisions

- Keep all 39 original training records, including verified different vacancies that reuse the same employer's language. The manifest lists repeated-passage multiplicities.
- Restore the prior calibration examples rejected solely for common industry phrases or topic similarity. Exclude prior record 48 because it exactly repeats record 47. Correct prior record 39 timing to `now` because it says “at this time.”
- Keep Think Academy in calibration. Exclude latest training record 18; retain prior calibration record 44 and latest calibration record 30. No calibration passage is moved into training.
- Keep Boeing in training; exclude latest calibration records 12 and 24.
- Exclude unresolved employer identities, ambiguous modal sponsorship claims and the unresolved “CPT I” medical qualification. Keep their submitted text and review reasons in the original adjusted records and this manifest's `excluded` list.
- Add four role-level conditional training examples from CertiK, HASI, Inferact and SW Law Group, plus HASI's separate current-sponsorship refusal. CertiK and HASI were proposed test candidates, never locked or used for model evaluation; they enter training before test lock.

Every employer/parent group and reviewed copied-policy family stays in one split. Exact evidence cannot cross splits. The automated validator also rejects shared 32-word spans; common shorter industry phrasing is allowed unless review establishes actual copying. Detailed URLs and per-record captures remain optional for the owner-supplied passages; whole-file dataset hashes are required.

## Coverage limits

Training contains all four sponsorship and timing labels, including four conditional-provision examples. Training scope covers `role`, `question` and `company`, but not `historical`, `other-role` or `none`. Calibration includes one historical example. No split contains `other-role` or `none` examples. Test lacks future-only timing and CPT acceptance. Report these gaps with results; do not claim all classes or real-world conditions have been evaluated.

## Validation and freeze

Before approval:

```sh
python3 scripts/validate_laya_operational.py --allow-candidate
```

After independent root review, `independent-review.json` must pin the three dataset hashes, decision-contract hash and question hash. Its own hash goes into `manifest.json`; the manifest must explicitly become `frozen` and approve training. The trainer must use the default strict validator before loading weights:

```sh
python3 scripts/validate_laya_operational.py
```

The builder refuses to overwrite frozen or approved datasets. Later changes require a new version; do not refresh this directory after freeze. Training completion does not authorize making the checkpoint the browser-extension default.
