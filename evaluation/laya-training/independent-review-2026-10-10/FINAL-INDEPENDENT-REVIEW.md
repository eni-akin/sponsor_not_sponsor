# Final independent AI review — blocked from training

Date: October 12, 2026 (America/Chicago).

## Decision

The independent AI review is complete. **Do not freeze this corpus, start Task 7 training, calibrate, or run the fresh test.** The frozen `contextual-v1-2026-10-10` files were not changed.

The owner’s confirmation that the postings are real is accepted. This resolves source authenticity for the supplied corpus under the recorded provenance waiver; it does not establish exact historical preservation, complete extraction, label correctness, split independence, or adequate test support.

This review used separate GPT-6 Astra reviewers at ultra reasoning for training, development/calibration, fresh-test labeling, and final cross-adjudication. It is an independent **AI** review, not a human signature. Fresh labels and posting decisions were saved before opening fresh gold, and no fresh model predictions were inspected.

## Final reviewed disposition

| Split | Records | Accept | Change | Exclude | Still needs adjudication |
| --- | ---: | ---: | ---: | ---: | ---: |
| Training | 167 | 144 | 21 | 2 | 0 |
| Development | 81 | 51 | 0 | 30 | 0 |
| Calibration | 54 | 51 | 3 | 0 | 0 |
| Fresh test | 141 | 120 | 1 | 7 | 13 |

The final cross-adjudicator resolved all six training and three calibration boundary cases. Training records `ctx-tra-061` and `ctx-tra-076` must be excluded until their missing semantic antecedents are restored. They do not have safe binary relevance gold. The other seven adjudicated records have complete six-field decisions.

The 30 development exclusions are WTW records whose target or immediate context is not an exact reconstruction of the saved request. Restore all 31 WTW blocks, IDs and order from `live-job-tests/wtw-202605435/request.json` in a new corpus version and re-review them; do not transfer current labels by ID.

The fresh-test counts include seven operational/source exclusions and 12 records withheld from two postings with unresolved copied-policy relationships. The 13 “needs adjudication” rows are those 12 split-withheld records plus one scope boundary. They are not eligible independent test evidence today.

## Why the fresh test is insufficient

The generated membership ledger reports no cross-split key collisions, but evidence review found material policy overlap that the ledger did not encode:

- `ft-post-013` reuses policy wording found in training postings `post-train-032` and `post-train-015`.
- `ft-post-018` contains the full policy sentence from training posting `post-train-013`.

Until provenance or policy-family adjudication proves independence, withhold the entire two fresh postings. If they are connected to training, move or replace them; do not split a posting by field.

After that withholding, every registered consequential class misses the minimum of 20 deduplicated eligible targets across at least five postings and five connected groups:

| Class | Current targets | Current postings/groups | Additional targets needed |
| --- | ---: | ---: | ---: |
| Sponsorship available | 2 | 2 / 2 | 18 |
| Sponsorship unavailable | 5 | 5 / 5 | 15 |
| Sponsorship conditional | 2 | 2 / 2 | 18 |
| CPT explicitly accepted | 1 | 1 / 1 | 19 |
| CPT explicitly excluded | 2 | 2 / 2 | 18 |
| OPT explicitly accepted | 1 | 1 / 1 | 19 |
| OPT explicitly excluded | 2 | 2 / 2 | 18 |

The new records must also bring each class to five independent postings/groups. One passage can legitimately support both CPT and OPT when it explicitly addresses both, but no label may be inferred merely to fill a quota. Collect above the numerical minimum so later exclusions do not reopen the gate.

Ten no-policy postings are plausible semantic negatives, but none has a separate complete-capture attestation. Record a specific completeness review for each supplied evidence boundary before counting them toward `F-NOPOLICY-01`; the provenance waiver means this does not require URLs or new captures if another concrete attestation is available.

## Required path to approval

Implementation note, October 12: step 1 has started in `contextual-v2-2026-10-12`. The candidate applies resolved corrections and exclusions and remains explicitly unapproved. Exact WTW blocks are restored for step 2, but 30 targets still require new review.

1. Create `contextual-v2` as a new version. Apply the 21 reviewed training changes and three calibration changes from the comparison/adjudication ledgers. Exclude `ctx-tra-061` and `ctx-tra-076` unless repaired context is independently re-reviewed.
2. Restore exact WTW source blocks/order in development, rebuild honest neighbors, and independently review every restored target.
3. Resolve the two copied-policy components. Re-group, move, or replace connected fresh postings so training and fresh evidence are disjoint.
4. Correct the three operational challenge postings: extraction metadata for the incomplete capture, missing-context handling without invented labels, and a transport-valid long-context fixture. Operational fixtures do not count as quality support.
5. Add reviewed, deduplicated evidence until every consequential class and the no-policy completeness gate pass. Recompute support only after all corrections and grouping decisions.
6. Generate a new manifest from the completed evidence. Pin the exact model-facing runtime questions and verify exporter/runtime parity.
7. Have an independent reviewer approve the new version. If project policy requires a human reviewer, this AI review cannot substitute for that signature.
8. Make and restore-test a separate backup of the original checkpoint and calibrated derivative. Only then may the owner explicitly authorize training registration.

## Evidence

- [Training review](train-review.md) and [training ledger](train-comparison.json)
- [Development/calibration review](development-calibration-review.md) and [ledger](development-calibration-comparison.json)
- [Cross-adjudication](cross-adjudication.md) and [machine ledger](cross-adjudication.json)
- [Fresh-test review](fresh-test-review.md), [comparison](fresh-test-comparison.json), and [support/group audit](fresh-test-support-audit.json)
- [Machine-readable final summary](final-review-summary.json)

All source and review hashes are pinned in the machine-readable summary. The final assertions reconcile all 443 split records. No training, calibration, model promotion, checkpoint load, service-setting change, or fresh prediction run was performed.
