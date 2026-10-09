# Trained Laya live-posting test: WTW 202605435

Job: **2027 Software Developer Internship – Reigate**, WTW, Reigate, Surrey, United Kingdom (Hybrid).

[Official posting](https://eedu.fa.em3.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1003/job/202605435).

## Outcome

The trained calibrated model was actually run on Apple MPS through `server/laya_worker.py`: 31 public text passages, 155 five-field answers. The checkpoint is the completed October 9 full-model run, SHA-256 `0ba97a3ced5ee87b3f9c2dc946762c5e6a7a657b4d40733a63c6fa9a7d226377`; temperature 5.0 and threshold 0.8. No weights, training/calibration/test membership or production defaults were changed.

The model gave contradictory unsupported sponsorship classifications. Applying the existing `applyDecision` and `mainDecision` functions to these same saved outputs yields **Could not verify**, sponsorship `unclear` with review required. CPT/OPT remain `unclear`. The deterministic rules independently yield **No blocker found**, with sponsorship still `unclear`.

Neither outcome proves sponsorship availability or refusal. Human inspection found no explicit sponsorship policy in the visible description or qualifications. The appropriate evidence-based sponsorship conclusion is **not stated / unknown**. The model did not pass the passage-level uncertainty test; the final conservative result comes from conflict/uncertainty handling, not consistently correct model predictions.

| Passage | Unsupported model sponsorship answer | Selected-option probability |
| --- | --- | ---: |
| Equal-opportunity and diversity paragraph (`wtw-04`) | Available | 91.28% |
| Closing date (`wtw-22`) | Unavailable | 92.77% |
| Offer/onboarding application stage (`wtw-29`) | Available | 93.66% |

These probabilities are model scores, not evidence that the answers are true. None of these passages states anything about visa sponsorship. Other non-unclear answers fell below the existing threshold; no threshold was changed to obtain this result.

## Capture and coverage

The supplied Oracle page was rendered in Chrome after the web text reader failed. Job identity and UK location matched the supplied requisition. Only visible paragraphs/list items in Job Description and Qualifications were extracted, with whitespace normalized. Standalone section labels were omitted. Real adjacent passages were passed as context by the existing worker. Navigation, map, similar jobs, cookie controls and a third-party matching overlay were excluded.

This is a standalone posting-text test plus the existing decision projection, **not** a claim that the installed extension's automatic extraction was tested. No application form, applicant answers or linked policy pages were accessed. Visible-description coverage does not establish that the employer disclosed every policy. CPT/OPT are US-specific; their `unclear` outputs do not establish eligibility for this UK internship. This ad hoc example is outside the locked held-out evaluation and was not added to any frozen dataset.

Files: `request.json` contains the input text; `model-output.json` the actual worker answers; `run.json` checkpoint/config/input hashes and coverage; `projection.json` the existing model/rules decision outputs.

Skipped application-form and linked-policy review; do not infer personal eligibility or sponsorship from silence. Further model changes require separate authorization and fresh independent evaluation.
