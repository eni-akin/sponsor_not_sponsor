# Contextual v2 candidate

`contextual-v2-2026-10-12` is the active corrected corpus candidate for the two-stage Laya design. It is **not frozen, training-approved, calibration-ready, or fresh-test-ready**.

## What this version changes

- Applies 21 independently reviewed training-label corrections and all three calibration corrections.
- Removes `ctx-tra-061` and `ctx-tra-076` from active training because their references cannot be resolved from the supplied model context.
- Restores all 31 WTW blocks exactly from `live-job-tests/wtw-202605435/request.json`. Only the previously valid `ctx-dev-004` remains active; the other 30 restored targets wait for new labels.
- Applies the accepted fresh correction to `ft-rec-0132`.
- Holds seven operational/source records, 12 records from copied-policy fresh postings, and `ft-rec-0095` pending scope adjudication.
- Removes whole fresh postings `ft-post-013`, `ft-post-018`, and `ft-post-025` from active posting membership because none of their records is currently eligible.
- Snapshots the complete runtime `decisionQuestions` object, including full instructions and criteria, from `server/decision-questions.ts`.

Active split counts are 165 training, 51 development, 54 calibration, and 121 fresh-test records. `review-holds.json` accounts for the other 52 v1 records: two training exclusions, 30 restored WTW reviews, 13 fresh adjudication holds, and seven fresh exclusions.

## Source-to-output flow

```text
contextual-v1 + saved WTW request + independent review ledgers
                              |
                              v
               scripts/build_contextual_v2.py
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
   active split JSON   review-holds.json   exact questions/context
          |                   |                   |
          +-------------------+-------------------+
                              v
                     candidate manifest
                              |
                 validation only; no training
```

The build script is the only writer for generated JSON in this directory. Correct review inputs or the builder and regenerate; do not patch generated records manually.

## Artifact map

| Artifact | Purpose |
| --- | --- |
| `manifest.json` | Candidate status, hashes, source v1 identity, and explicit `trainingRunApproved: false`. |
| `train.json` | Reviewed optimizer candidates; not export-authorized while the manifest is a candidate. |
| `development.json` | Reviewed development records plus the one exact WTW triplet. |
| `calibration.json` | Corrected calibration candidates; must never update weights. |
| `fresh-test.json` | Prediction-unopened candidate evidence; insufficient and not authorized for evaluation. |
| `postings.json` | Original posting blocks for active records, including exact restored WTW blocks. |
| `review-holds.json` | Every removed/pending record, its reason, and required action. |
| `independent-review.json` | Hashes of review inputs and remaining approval work; deliberately does not pass review. |
| `coverage-report.json` | Current class/no-policy support and blockers. |
| `membership-ledger.json` | Active membership plus copied-policy holds and incomplete relationship-audit status. |
| `exposure-ledger.json` | Truthful fresh-gold/prediction exposure status. |
| `questions.json` | Exact runtime question objects and source hash. |
| `context-definition.json` | Canonical eight-key state and neighbor-status contract. |

## Rebuild and validate

```sh
python3 scripts/build_contextual_v2.py
python3 scripts/validate_laya_contextual.py \
  --dataset-dir evaluation/laya-training/contextual-v2-2026-10-12 \
  --allow-candidate
python3 -m unittest discover -s tests -p 'test_laya_contextual*.py'
python3 -m unittest discover -s tests -p 'test_v2_*.py'
```

The validator must reject this directory without `--allow-candidate`. The exporter likewise requires an explicit candidate override for engineering inspection; that override never grants optimizer permission.

## Work still required before a freeze

1. Independently label the 30 restored WTW targets against their exact neighbors.
2. Resolve `ft-rec-0095` and the copied-policy relationships for `ft-post-013` and `ft-post-018`; connected evidence cannot cross train and fresh splits.
3. Replace or correct the incomplete, missing-context, and oversized operational cases with contract-valid fixtures kept outside quality denominators.
4. Add independently reviewed, split-disjoint evidence until each sponsorship/CPT/OPT consequential class has at least 20 eligible deduplicated targets across five postings and five connected groups.
5. Record a specific complete-capture attestation for the ten no-policy candidates.
6. Recompute membership, coverage, exposure, and review ledgers; resolve every hold.
7. Produce a new manifest with an actual independent approval artifact. Obtain human signoff if that remains a project requirement.
8. Back up and restore-test the original checkpoint before requesting explicit permission to train.

See `../independent-review-2026-10-10/FINAL-INDEPENDENT-REVIEW.md` for the review decision and `../COVERAGE-COMPLETION-INSTRUCTIONS-2026-10-10.md` for collection rules.
