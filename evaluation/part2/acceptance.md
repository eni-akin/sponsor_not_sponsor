# Part 2 evaluation gates

Use only independently human-reviewed labels. Freeze labels and source snapshots before running any engine on the final holdout. Report raw counts and abstentions alongside percentages.

| Comparison | Measures | Gate to pass |
| --- | --- | --- |
| Rules alone | False blockers, missed blockers, definitive precision/recall, abstentions, restriction scope/exceptions, exact-source citations | On at least 50 reviewed vacancies from 20 employers: ≥95% definitive precision (at least 20 definitive outputs), ≥90% blocker recall, no more than one false blocker, 100% valid source-bound citations, and ≥95% correct scope/exception labels. |
| Laya alone | Same decision measures; evidence accuracy; p50/p95 latency and failures | Meet the rules precision and citation gates, improve blocker recall by ≥10 percentage points over rules on the same cases, with no more than one additional false blocker. Report latency/failures; do not lower confidence cutoffs after seeing results. |
| Rules + Laya | Same measures overall and on rule-ambiguous cases; disagreement and failure outcomes | Preserve explicit rule findings; on ambiguous cases, reduce decision errors by ≥5 percentage points versus rules alone without increasing false blockers. A model failure or unsupported citation must remain abstention/review, not a definitive label. |

Label an eligibility restriction separately from sponsorship. A scoped restriction passes only when affected group, condition, exceptions, and stated timing are all retained. Sponsorship questions and unanswered application choices do not count as employer policy. Score the existing main-decision output as well as sponsorship and restriction fields; incomplete extraction must produce Could not verify even when a detailed restriction was found.

The four Part 2 development cases are for rule development and reviewer calibration only. Their small size cannot pass any quality gate. The 18 URLs in `holdout-candidates.json` are an unreviewed sampling frame; Pinterest and Southwest were removed due to prior exposure. Close/inaccessible/redirected links count as coverage outcomes. The holdout remains pending until a reviewer freezes the selected examples, evidence, labels, reviewer/date, and source hashes without first seeing engine predictions.
