# Adjusted October 9 submissions

These are reviewed candidate copies, not frozen datasets or permission to train. The owner's submitted split intentions are preserved. The originals in Downloads, prior submissions and frozen corpus v1 are unchanged.

| File | Records | Use |
|---|---:|---|
| `training-candidates.csv` | 18 | New training candidates with resolved labels and no current hold |
| `calibration-candidates.csv` | 19 | New calibration candidates with resolved labels and no current hold |
| `review-required.csv` | 21 | 11 quarantined records plus 10 unresolved review holds; not usable for training/calibration |
| `adjusted-records.json` | 58 | Complete record history, original labels/flags, corrections, grouping and disposition |
| `manifest.json` | — | Dataset-level source, adjusted JSON and CSV hashes; training permission remains false |

IDs are unique across this submission and distinct from earlier record IDs. Exact passage text, job titles and submitted employer names are preserved. Canonical labels use the unchanged five-field decision contract. Employer aliases and policy groups are separate metadata; no employers were guessed from platform names.

## Adjustments applied

- Standardized all five label fields.
- Removed definitive vacancy sponsorship/program findings from company-level passages and applicant questions.
- Corrected citizenship-only restrictions, explicit CPT/OPT exclusions, acceptance without sponsorship, and timing without an explicit time statement.
- Preserved Sanofi's alternative-status exception through non-definitive CPT/OPT labels.
- Kept conditional job offers distinct from conditional immigration sponsorship, and historical sponsorship activity distinct from current-role policy.
- Resolved calibration record 38's literal sponsorship refusal through coordinator review; retained its original review flag and did not claim owner verification.
- Quarantined calibration records 1, 3, 4, 5, 6, 7, 8, 10, 28 and 30 for cross-split evidence/employer overlap. Quarantined record 32 as a duplicate of calibration record 9. None was silently moved to training or deleted.
- Did not quarantine ordinary short industry phrases merely for similar wording.

## Ten review holds

Record numbers below refer to the original CSVs, not the new project IDs.

| Original split / records | What remains unresolved |
|---|---|
| Training 10; calibration 31, 37 | Identify the actual hiring employer: ZipRecruiter, JoinHandshake and ClearanceJobs are platform names. No URLs/captures are required. |
| Training 18; calibration 12, 24 | Think Academy and Boeing conflict with earlier split membership if earlier submissions remain. Holds are provisional pending additions versus replacements. |
| Calibration 18, 20, 22 | Modal sponsorship offers say `may` without a clear provision condition. Corrected sponsorship is `unclear` pending semantic review. |
| Calibration 33 | `CPT I` in a phlebotomist qualification is not established as immigration CPT. Corrected sponsorship/CPT are `unclear` pending clarification. |

## Before freezing

Confirm whether the new files add to or replace the earlier 25 training and 25 calibration submissions. No earlier record has been retired, moved or merged. Resolve the holds and final employer/policy-family membership before deriving combined counts.

These new training candidates contain nine role refusals and nine company-policy examples; none provides role-level available or conditional sponsorship or explicit CPT/OPT acceptance. The new calibration candidates have four conditional examples but no available-sponsorship example. Assess coverage against the eventual combined corpus, not these files alone. Do not relabel company policy as a role-level offer to fill a gap.

A locked independent held-out test is still required before tuning. Detailed source provenance remains optional for owner-approved passage data. Search broadly without site/domain/platform filters.

## Verification

The coordinator and two independent agents reviewed the actual outputs against all 58 original passages. Checks passed for canonical labels, unique IDs, exact text/title/employer preservation, original-label/review-flag retention, candidate cross-split employer/family/exact-text separation, calibration deduplication, complete 58-record accounting, CSV round trips, and source/output/legacy hashes.

Eight adjustment self-checks, the 15 existing dataset tests, the 39-record frozen-v1 validator and whitespace checks passed. No model training, calibration fitting, test evaluation or operational freeze was performed.

The generator is `scripts/adjust_laya_submissions.mjs`. It pins reviewed input hashes and refuses to overwrite this directory. Run its `--self-test` for the small correction checks; do not rerun generation over an existing version.
