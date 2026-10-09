# New CSV intake review — October 9, 2026

Status: reviewed candidates only; no operational split assignment, freeze or training.

## Adjustments completed

The owner authorized the necessary adjustments. [Reviewed copies](adjusted-submissions-2026-10-09/README.md) now contain 18 training candidates, 19 calibration candidates, 11 quarantined records and 10 unresolved review holds. All 58 records and exact evidence are preserved; labels, employer groups and dispositions were checked by the coordinator and two independent agents. The original source-label review below describes the intake findings; the adjusted copies record the corrections actually applied. Additions versus replacements remains unresolved, so no combined corpus was constructed or frozen.

## Received files and dataset-level hashes

| Submitted file | Records | Submitted split | SHA-256 of complete CSV bytes |
|---|---:|---|---|
| `/Users/eniola/Downloads/training_sponsorship_records.csv` | 20 | `train` | `b6090c099bbffaf781e3f61896450774cc14edc1203885069438059c743d2869` |
| `/Users/eniola/Downloads/sponsorship_records_calibration.csv` | 38 | `calibration` | `de8bd3e5885d3fb9876f265d43816daa5fe840e217be7a3d16717b25ad61c682` |

Both files parse as CSV. The first has ten columns, the second eleven including `needs_review`. Required cells are populated and record numbers are unique within each file. Numbers restart in the second file and are source-local, not assigned project IDs. IMC calibration record 38 is explicitly marked for review.

The owner confirmed that these are training and calibration, matching the filenames and every `intended_split` cell. Keep submitted intended splits; do not silently move examples between them. No rows are submitted as test. Whether these are additions to or replacements for the prior submissions remains awaiting owner confirmation before constructing the final union.

## Cross-file overlap

`T` means the first file's record number; `C` means the calibration file's record number.

| First file | Calibration file | Finding |
|---|---|---|
| T9 | C3, C28 | Identical Illinois policy passage, listed under state/department identities |
| T12 | C4 | Identical Capital One passage and employer |
| T13 | C1 | Identical passage; Micron Products versus Job Target requires employer identity resolution |
| T15 | C5 | Entire calibration passage is a verbatim subset of the Crown passage |
| T16 | C7 | Identical Thermo Fisher passage and employer |
| T17 | C6 | Identical KeyBank passage and employer |
| T18 | C30 | Same Think Academy employer, although evidence differs |
| T19 | C10 | Identical Sherwin-Williams passage and employer |
| T20 | C8 | Identical Sanofi passage and employer |

These affect nine records in the first file and ten in calibration. They cannot be treated as independent examples across splits. No records have been deleted or moved. C3/C28 and C9/C32 are exact duplicate pairs within calibration. Different source titles do not make identical evidence independent.

If prior submissions remain, also resolve Boeing C12/C24 against prior training record 22, Think Academy T18/C30 against prior calibration record 44, and IMC C38 against prior calibration record 45. Same-split employer grouping is allowed; cross-split employer reuse is not.

No exact new passages or recurring employers were found against frozen training v1, the original 13 exposed development passages, or the 15 collected held-out candidates. This is not a completed whole-vacancy independence assessment. Employer fields T10 (ZipRecruiter), C31 (JoinHandshake) and C37 (ClearanceJobs) identify platforms rather than clearly identifying the actual employer; clarify the employer names without requiring URLs or captures. Group C18/C22 together as Albertsons and the related C34/C35 healthcare sponsorship template within calibration.

## Label review

Simple wording normalization includes `role-specific` → `role`, `company policy`/`company-wide` → `company`, `applicant question` → `question`, `refusal` → `unavailable`, `now-only` → `now`, `now and future` → `now-and-future`, and accepted/excluded program labels → their `explicitly-` equivalents. `not stated` maps to `unspecified` for timing and `unclear` for sponsorship/program fields. These aliases do not resolve semantic errors.

Confirmed semantic issues to resolve under the unchanged decision contract:

- T1–T9 are submitted as company policy. Company scope must not produce definitive vacancy-level sponsorship, timing, CPT or OPT findings. Keep the original passage and proposed labels separately from reviewed canonical labels; the seven company-policy `conditional` entries are not role-level conditional sponsorship examples.
- T18 mentions CPT/OPT acceptance but no visa sponsorship. Sponsorship is `unclear`, unlike C30 which explicitly says H1B sponsorship is provided.
- C2, C3, C27 and C28 are also submitted as company scope and must retain non-definitive sponsorship/program labels and `unspecified` policy timing.
- T12/C4 directly include CPT and OPT in the immigration-support refusal; both program labels should be `explicitly-excluded`.
- T16/C7 directly exclude holders of CPT and OPT; both program labels should be `explicitly-excluded`.
- C12, C13, C24 and C37 state citizenship/clearance restrictions only. Sponsorship is `unclear`, not a sponsorship refusal. C25 also contains an explicit future work-visa sponsorship exclusion and must be reviewed separately rather than applying the same correction automatically.
- C25's explicit future sponsorship exclusion supports `unavailable` with `future` timing; its current visa-holder exclusion remains a separate restriction.
- C9/C32 give no explicit current/future timing. Timing should be `unspecified`.
- C29 excludes CPT and several statuses but does not expressly refuse visa sponsorship. Sponsorship should be `unclear`; CPT remains `explicitly-excluded`.
- C31 accepts CPT/OPT without stating visa sponsorship. Sponsorship should be `unclear`.
- C33 says `CPT I` in a laboratory/phlebotomist context. Do not assume it means immigration CPT acceptance or sponsorship; hold those conclusions for review.
- C36 gives a conditional job offer, not conditional immigration sponsorship. Sponsorship should be `unclear`.

Additional review questions include modal offers (`may be eligible`/`may be available`) in C18/C20/C22, the historical wording in C23, the exception for alternative long-term status in T20/C8, and the explicitly flagged C38. Do not silently replace the owner's labels for these judgment calls.

The coordinator read all 58 original passages, checked the two independent agent reviews, and independently reproduced the exact cross-file and internal duplicate pairs. KeyBank T17/C6 and E3 C19 can retain proposed role scope when their category-level internship policy applies to the submitted internship; do not introduce an unnecessary full-posting requirement for these passage labels. Anthropic C17 needs a confirmed conditional-versus-available judgment. A modal offer without a stated condition must not automatically become `conditional` merely by alias mapping.

## Next actions after clarification

1. Training/calibration intent is confirmed. Confirm whether the files add to or replace earlier submissions.
2. Preserve exact evidence and submitted labels; prepare reviewed canonical labels, stable project IDs, and explicit duplicate/employer-group dispositions.
3. Reassess overlap using actual duplicates, employer identity and substantial copied templates. Common short industry phrases alone do not justify quarantine.
4. Review final training/calibration coverage and lock an independent held-out test set before operational freezes and training. Search broadly without site/domain/platform filters; detailed source provenance remains optional for owner-approved passage data.

Original CSVs, frozen corpus v1, prior snapshots and model weights are unchanged. These hashes identify submitted bytes; they do not certify labels or authorize training.
