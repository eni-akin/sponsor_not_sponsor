# Development and calibration independent semantic review

Date: October 10, 2026. Reviewer: AI agent `/root/blind_dev_cal_review`, separate from corpus assembly. This is an AI review, not a human signature.

Status: **review complete; corrections, WTW evidence restoration and adjudication remain pending. Not approved for training.**

## Scope and method

All **81 development and 54 calibration records** were reviewed against `DECISION_LOGIC.md`, the October 10 screening/context contract and v2 contract. No training, calibration, checkpoint loading or inference was performed. Frozen contextual-v1 files were not edited.

The reviewer read only a projection of each corpus record's ID, posting ID, employer, job title, supplied country, coverage, TARGET and immediate context before saving six independent labels and a reason for every record. Existing gold, rationale, tags, reviewer fields, policy-family metadata and stored evidence hashes were excluded from that projection. The saved [blind labels](development-calibration-blind-labels.json) include the complete projected evidence, an independently computed evidence hash and exact target-text hash. Only after this file was saved did the reviewer inspect old gold and compare the saved WTW request.

This was **masked corpus-label review with disclosed prior issue exposure**, not pristine blinded review: the required `INDEPENDENT-REVIEW-STARTED-2026-10-10.md` already identified suggested corrections for `ctx-dev-010`, `011`, `012`, `016` and `ctx-cal-054`, and reported WTW text changes. The broader prior note was read as instructed. No corpus gold or corpus rationales were inspected before independent labels were saved.

The [comparison ledger](development-calibration-comparison.json) records every ID, final review status, old/proposed six-field gold, differing fields, evidence hashes, rationale, missing-context restriction and WTW source binding. “Accept” means semantic agreement for the supplied evidence; it is not an authenticity, connected-group independence, human approval or training approval claim. The owner's authenticity confirmation is respected; exact preservation is a separate check.

## Outcomes

| Split | Records | Accept | Change | Needs adjudication | Exclude |
| --- | ---: | ---: | ---: | ---: | ---: |
| Development | 81 | 51 | 0 | 0 | 30 |
| Calibration | 54 | 51 | 1 | 2 | 0 |
| Total | 135 | 102 | 1 | 2 | 30 |

There are **eight semantic disagreements**, five within excluded WTW records. All proposed differences require a separate adjudicator before a new freeze; the two “needs-adjudication” cases additionally involve an unresolved interpretive boundary.

| Record | Old → proposed | Outcome and reason |
| --- | --- | --- |
| `ctx-dev-010` | scope `none → role` | The supplied learning-mindset text is a vacancy qualification. Excluded because the original `wtw-10` is instead a presentation duty. |
| `ctx-dev-011` | scope `none → role` | The supplied problem-solving text is a qualification. Original `wtw-11` differs; restore evidence before relabeling. |
| `ctx-dev-012` | scope `none → role` | The supplied communication-ability text is a qualification. Original `wtw-12` instead discusses potential later graduate employment. |
| `ctx-dev-016` | scope `none → role` | The supplied project-experience text is a qualification. Original source wording differs. |
| `ctx-dev-023` | scope `none → role` | The one-programme-per-year rule controls applicant eligibility. The target is exact, but its immediate next block was altered. |
| `ctx-cal-030` | sponsorship `available → conditional` | “Visa sponsorship is available for eligible appointments.” The qualifier prevents an unconditional reading. Adjudicate whether this supports conditional provision for the named vacancy or leaves applicability unresolved; do not invent the eligibility criteria. |
| `ctx-cal-051` | scope `none → role` | “Welcomes applicants from all educational backgrounds” explicitly addresses ordinary educational eligibility. Adjudicate the boundary between that clause and general diversity prose. Relevance remains irrelevant. |
| `ctx-cal-054` | scope `none → role` | “Experience with Vivado and Verilog required” is an ordinary role qualification. |

All remaining fields for the scope corrections stay unchanged. The Brown sponsorship proposal leaves timing unspecified and CPT/OPT unclear.

## WTW source-ID audit

Authoritative saved input for this check: [original request](../live-job-tests/wtw-202605435/request.json), SHA-256 `786c7d0c55f6c606dc058d040d60dcb1a4293869b853bad7e7118f67c0a68fcd`.

All 31 contextual source IDs exist in the saved request. Only five TARGET ID/kind/text bindings match exactly: `wtw-03`, `wtw-04`, `wtw-05`, `wtw-22`, `wtw-23`. The other **26 targets have changed text**. The unchanged targets `wtw-03`, `wtw-05`, `wtw-22` and `wtw-23` each have at least one altered immediate neighbor. Only `ctx-dev-004` preserves the entire target-plus-neighbors triplet.

Consequently 30 supplied WTW records are marked `exclude` from exact-source regression/frozen gold pending restoration. No record was physically removed. Their independent semantic labels remain visible as judgments about the supplied altered text, not labels for the original source-ID contents.

For example, contextual `wtw-28` says “Stage 5: Offer and onboarding”; saved `wtw-28` is the Stage 4 virtual assessment centre. The Stage 5 sentence was originally `wtw-29`. This is a substantive source-ID substitution. Other substitutions change whether a target is a duty, qualification, benefit or later-role statement, even though all WTW targets remain immigration-irrelevant.

Restore all 31 original texts, IDs and order in a new version, derive honest context metadata and re-review each restored target. Do not copy the altered targets' labels back by ID. The saved v1 request supplies array order but no context-group declarations; this audit verifies preservation against that request, not independent DOM adjacency or full-page coverage.

## Missing context

`ctx-dev-078`, `ctx-cal-052` and `ctx-cal-053` have a missing immediate neighbor. Their targets are self-contained, allowing the recorded semantic judgments; none resolves a dangling reference by inventing absent evidence. They must remain explicitly unsupported/missing-context runtime challenges. Their label acceptance does not make them complete inference examples or permit a complete-vacancy conclusion. The other records in those incomplete postings also do not prove full posting coverage.

## Validation and limits

An assert-based read-only check passed for exact counts, one occurrence of every source ID, six legal labels per record, complete old/proposed comparisons, per-record reasons, status totals, evidence/target hashes, complete neighbor positions and group equality where neighbors are present, and absence of prohibited annotation fields from the blind evidence projection. Development/calibration file hashes still match the pre-review snapshots. The saved blind-label artifact hash was verified before and after comparison:

`349948ced7064bc17ed10b8caf12812f27186dccfcc22cb07b031e3f9abc0f7a`.

No fresh-test records, model outputs or training settings were inspected. This pass did not recover live source pages, establish connected-group independence, authorize training, or supply human sign-off. WTW reconstruction and separate adjudication are the remaining blockers for this review.
