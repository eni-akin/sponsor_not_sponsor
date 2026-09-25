# Section 4 reserved-regression evaluation

AI-authored constructed scenarios; provisional labels; independent human review pending; not a real-world accuracy estimate.

The reserved set has now informed fixes. This is a regression result, not a fresh holdout score. The first run is preserved separately in holdout.md and holdout.json.

Cases: 80 (64 policy scenarios, 16 page scenarios).

| Measure | Result |
| --- | --- |
| Cases meeting every expectation | 95.0% (76/80) |
| Job detection precision | 100.0% (8/8) |
| Job detection recall | 66.7% (8/12) |
| sponsorship: definitive precision | 100.0% (23/23) |
| sponsorship: definitive recall | 85.2% (23/27) |
| sponsorship: conclusion coverage | 39.5% (30/76) |
| cpt: definitive precision | 100.0% (8/8) |
| cpt: definitive recall | 100.0% (8/8) |
| cpt: conclusion coverage | 10.5% (8/76) |
| opt: definitive precision | 100.0% (9/9) |
| opt: definitive recall | 100.0% (9/9) |
| opt: conclusion coverage | 11.8% (9/76) |
| Cases with invalid citations | 0 |

Definitive sponsorship means available/unavailable; conditional is included in conclusion coverage but not definitive precision. Missed jobs count in recall and coverage denominators. Citation validity checks exact source text, attribution, and evidence IDs, not semantic correctness. JSON includes confusion matrices, per-family metrics, and Wilson 95% intervals; intervals describe these constructed samples only.

Numerical sponsorship target (≥95%, at least 20 definitive predictions): met. Independent human-reviewed beta gate: PENDING.

## Errors

- **H-page-013** (detection improvement deferred to section 7): sponsorship: expected "unavailable", got "unclear"; pageKind: expected job-posting, got non-job.
  Expected reasoning: Embedded role in an iCIMS-style wrapper is real job content.
- **H-page-014** (detection improvement deferred to section 7): sponsorship: expected "available", got "unclear"; pageKind: expected job-posting, got unreadable.
  Expected reasoning: A second brand heading must not hide the actual role.
- **H-page-015** (detection improvement deferred to section 7): sponsorship: expected "available", got "unclear"; pageKind: expected job-posting, got non-job.
  Expected reasoning: Short postings can lack the keyword groups.
- **H-page-016** (detection improvement deferred to section 7): sponsorship: expected "available", got "unclear"; pageKind: expected job-posting, got unreadable.
  Expected reasoning: A heading within a custom job container is still a title.

## Reproducibility

Generated: 2026-09-25T01:27:05.860Z

- corpus SHA-256: `f3623231b10c504d9d1e43fbd26bd5e4bb2ac95352c4b7e9fcd2f236556a35be`
- selected SHA-256: `09d51196fdbdb8b36d4fc7d7f37a109e377e99f39e00c3d9657b4e23aabe91bd`
- scanner SHA-256: `cbc078f5a66882f7ca18ade6dd433157038f1ed2eabb1ac856779ccc25d91cef`
- interpreter SHA-256: `4df00e6202e8a5885d805468663afdc2feb06cf9f2ee9f17f871e3865f08d395`
