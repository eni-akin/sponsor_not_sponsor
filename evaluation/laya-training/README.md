# Laya fine-tuning data gate

The authoritative labeling and headline rules are in [DECISION_LOGIC.md](../../DECISION_LOGIC.md).

## Operational freeze and completed training — October 9

The owner's subsequent instruction authorized necessary preparation and completing local fine-tuning. [Operational v2](operational-v2-2026-10-09/manifest.json) now freezes 87 training, 44 calibration and 12 held-out test passages, with an independently reviewed split ledger and dataset-level hashes. Earlier originals and frozen v1 remain unchanged. Latest submissions are additive, not replacements. Common short industry wording is permitted; actual employer/template overlap and duplicate evidence cannot cross splits. Think Academy remains calibration-only and Boeing training-only. Four fresh role-level conditional examples were added before locking the test.

Run `python3 scripts/validate_laya_operational.py` to check the operational freeze. The [fixed run plan](TRAINING-RUN-PLAN-2026-10-09.md) has completed three epochs and 132 optimizer updates on Apple MPS. [The resumable runner](../../scripts/train_laya_domain.py) saves full weights, optimizer state, shuffle/cursor and RNG state. Final checkpoint: `.model-cache/training/domain-2026-10-09/checkpoints/step-000132`; run metadata: `.model-cache/training/domain-2026-10-09/run.json`.

[Completed results and caveats](TRAINING-RESULTS-2026-10-09.md): temperature 5.0, unchanged threshold 0.8; test field accuracy 50/60 versus base 28/60, but sponsorship only 7/12 and exact five-field agreement 4/12. No promotion. The calibrated inference directory is `.model-cache/training/domain-2026-10-09/posttraining/calibrated-checkpoint`; preserve the linked original checkpoint. It has private normalized tokenizer metadata so inference does not rewrite the immutable source. Worker loading, all 217 TypeScript tests and type checking passed. Future tuning requires fresh held-out evidence.

Next: the [two-stage Laya action plan](TWO-STAGE-LAYA-ACTION-PLAN-2026-10-09.md) defines relevance screening, improved interpretation, context-aware collection, fresh evaluation and safe integration. This is a future implementation checklist, not an implemented or promoted model.

Historical pending membership, missing test and strict template-quarantine descriptions below are superseded by this operational freeze, not retroactively edited out of historical snapshots.

## Dataset collection searches

Search broadly. Do not narrow dataset searches with `site:` filters, domain allowlists, or recruiting-platform restrictions. Greenhouse, Lever and Ashby were examples, not a required or preferred set of sources. Discover passages across all relevant sources; assess evidence accuracy and dataset suitability separately from search discovery.

## Latest submission — October 9

The owner confirmed the latest CSVs are training (20 records) and calibration (38 records) and authorized label and overlap adjustments. [Reviewed copies](adjusted-submissions-2026-10-09/README.md) retain all 58 passages: 18 training candidates, 19 calibration candidates, 11 quarantined records and 10 review holds. Original CSVs and earlier corpora are unchanged. The manifest pins dataset-level hashes; no detailed source-provenance gate was added. These candidates are not frozen or training-ready. Whether these add to or replace the earlier 25 + 25 submissions must be confirmed before a combined corpus is built.

## Earlier datasets

October 7: all five fields have been reviewed for the 13 per-block records compatible with the current worker. They remain exposed development excerpts with no independent calibration or test split, so they are not training-ready. The earlier smoke checkpoint is uncalibrated and must not be deployed.

The approved expansion source is recorded in [expansion-candidates-2026-10-07.json](expansion-candidates-2026-10-07.json): 39 reconciled passages across 38 owner-verified vacancies after two confirmed duplicates and the third-party Electronic Arts record were removed. Those passages are frozen as training-only data in [frozen-expansion-v1](frozen-expansion-v1/manifest.json); every record is assigned to `train`. The manifest pins the source, corpus content, decision contract, and current worker questions by SHA-256. It remains `trainingReady: false` until fresh employer/policy-family-disjoint calibration and test sets exist. See [the reconciliation record](EXPANSION_RECONCILIATION_2026-10-07.md).

Validate the immutable freeze without creating or replacing data:

```bash
python3 scripts/freeze_laya_expansion.py
```

On October 8, the malformed label columns in the two additional submitted CSVs were normalized into [normalized-submissions-2026-10-08.json](normalized-submissions-2026-10-08.json). The owner confirmed the retrieval date and reviewed all 25 calibration labels. URLs and external vacancy IDs were removed because they are not model inputs; the 50 records instead use unique internal IDs `1` through `50`. The normalized source remains unassigned (`split: null`). Think Academy sponsorship is `unclear`: accepting CPT/OPT establishes those two work-authorization fields, but does not say the employer will file or transfer a sponsored visa.

The subsequent [policy-family audit](POLICY-FAMILY-AUDIT-2026-10-08.md) assessed all 89 existing and submitted passages. Coordinator review accepted quarantine of 19 calibration passages whose material templates overlap training; six remain calibration candidates. The original normalized source and frozen v1 are unchanged. [Audited candidates v2](audited-candidates-v2/manifest.json) is an immutable **blocked candidate snapshot**, containing 25 training candidates, six calibration candidates, and 19 quarantined records. It is not an operational train/calibration freeze: all readiness flags and permission to update weights remain false.

The owner subsequently confirmed that the supplied information is accurate and waived the detailed source-metadata requirement for these 50 passage records. [Dataset-level integrity approval](dataset-integrity-2026-10-08.json) records that decision and SHA-256 fingerprints for the entire normalized dataset and its three partitions. URLs, original vacancy IDs, capture files, locators and source/completeness review dates are optional for these approved passages. This explicit, scoped owner decision supersedes the earlier metadata requirement without changing the five labels, runtime headlines, frozen files or their contract hashes.

The historical snapshot still records its original blockers. Its missing-provenance blocker is now waived by the approval above; independent calibration coverage and a locked held-out test remain unresolved. The original normalization's `calibrationReady: true` does not establish those requirements. A dataset hash detects changed bytes; it does not prove accuracy. Accuracy is accepted from owner confirmation.

Validate the reviewed audit and blocked snapshot:

```bash
python3 scripts/audit_laya_policy_families.py
python3 scripts/snapshot_laya_submissions.py
python3 -m unittest discover -s tests -p test_laya_submission_snapshot.py
```

The snapshot command also verifies the dataset-level approval and hashes. Complete job capture is unnecessary for labeling a supplied passage. The browser must still distinguish a fully read vacancy from a partially read vacancy when making a whole-job headline, especially a conclusion based on silence; that remains a separate product/integration check.

See the [orchestration plan](ORCHESTRATION-2026-10-08.md), [model execution brief](MODEL-EXECUTION-PLAN-2026-10-08.md), and [held-out collection](heldout-candidates/README.md). Held-out candidates are evidence-collection artifacts with proposed labels and honest completeness limitations, not a locked test set.

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
