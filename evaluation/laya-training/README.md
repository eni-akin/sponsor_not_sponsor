# Laya fine-tuning data gate

The authoritative labeling and headline rules are in [DECISION_LOGIC.md](../../DECISION_LOGIC.md).

October 7: all five fields have been reviewed for the 13 per-block records compatible with the current worker. They remain exposed development excerpts with no independent calibration or test split, so they are not training-ready. The earlier smoke checkpoint is uncalibrated and must not be deployed.

The approved expansion source is recorded in [expansion-candidates-2026-10-07.json](expansion-candidates-2026-10-07.json): 39 reconciled passages across 38 owner-verified vacancies after two confirmed duplicates and the third-party Electronic Arts record were removed. Those passages are frozen as training-only data in [frozen-expansion-v1](frozen-expansion-v1/manifest.json); every record is assigned to `train`. The manifest pins the source, corpus content, decision contract, and current worker questions by SHA-256. It remains `trainingReady: false` until fresh employer/policy-family-disjoint calibration and test sets exist. See [the reconciliation record](EXPANSION_RECONCILIATION_2026-10-07.md).

Validate the immutable freeze without creating or replacing data:

```bash
python3 scripts/freeze_laya_expansion.py
```

On October 8, the malformed label columns in the two additional submitted CSVs were normalized into [normalized-submissions-2026-10-08.json](normalized-submissions-2026-10-08.json). The owner confirmed the retrieval date and reviewed all 25 calibration labels. URLs and external vacancy IDs were removed because they are not model inputs; the 50 records instead use unique internal IDs `1` through `50`. The records remain unassigned (`split: null`) pending an immutable freeze. Think Academy sponsorship is `unclear`: accepting CPT/OPT establishes those two work-authorization fields, but does not say the employer will file or transfer a sponsored visa. Policy-family grouping still needs an audit, and no held-out test corpus exists.

Prepare the four reviewed development cases without downloading a model or starting training:

```bash
python3 scripts/prepare_laya_training.py --output evaluation/laya-training/local-prepared
python3 -m unittest tests/test_laya_training.py
```

The exporter refuses a non-empty output directory. Pass `--overwrite` only when intentionally replacing generated prototype files.

The exporter verifies the label source, human-review record, and each case by SHA-256. It rejects duplicate cases, exposed development data assigned to calibration/test, and employer/template groups crossing splits. Its prototype JSONL rows use Laya's documented `state`, `questions`, and `gold` columns. Targets are explicitly tagged `human-hard-label-one-hot`; they are not teacher confidence distributions, calibrated probabilities, or pseudo-labels. Model input contains only job identity, extraction completeness status, and public evidence text. Reviewer scope/timing/exception rationale, completeness notes, URLs, locators, and hashes stay outside `state`; no applicant response or applicant data is present.

The superseded `prepared-role-v0` output, worker review v1, initial smoke run, and October 5 research notes are retained under [archive](archive/README.md). They are historical evidence only and must not be used as current training or evaluation data. New disposable exports belong under `generated/`, which is created on demand.

The installed runtime is `laya==0.3.21`. Its package exposes inference, not a training command. The supported recipe is full-model RLCD plus temperature calibration in the upstream notebook pinned here to the v0.3.21 commit:

- [Fine-tuning guide](https://github.com/NandhaKishorM/laya/blob/9d955671415fc19f069b9cc998928075c1f255ec/docs/finetune.md)
- [2xT4 Kaggle notebook](https://github.com/NandhaKishorM/laya/blob/9d955671415fc19f069b9cc998928075c1f255ec/notebooks/laya_finetune_typed_decisions_2xT4_kaggle.ipynb)

The earlier sandbox probe reported CUDA and MPS unavailable. An October 5 probe outside the sandbox verified MPS on this 16 GB Mac, and the cached multilingual model actually contains 321,908,995 parameters. A full-model smoke update now passes using PyTorch 2.14.0. The first domain experiment will use the current worker's five questions; review the per-block labels and collect varied training examples plus disjoint calibration/test groups before extending the smoke into a domain training run.
