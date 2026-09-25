# Section 4 development evaluation

AI-authored constructed scenarios; provisional labels; independent human review pending; not a real-world accuracy estimate.

Cases: 80 (64 policy scenarios, 16 page scenarios).

| Measure | Result |
| --- | --- |
| Cases meeting every expectation | 95.0% (76/80) |
| Job detection precision | 100.0% (7/7) |
| Job detection recall | 63.6% (7/11) |
| sponsorship: definitive precision | 100.0% (19/19) |
| sponsorship: definitive recall | 82.6% (19/23) |
| sponsorship: conclusion coverage | 38.7% (29/75) |
| cpt: definitive precision | 100.0% (6/6) |
| cpt: definitive recall | 100.0% (6/6) |
| cpt: conclusion coverage | 8.0% (6/75) |
| opt: definitive precision | 100.0% (6/6) |
| opt: definitive recall | 100.0% (6/6) |
| opt: conclusion coverage | 8.0% (6/75) |
| Cases with invalid citations | 0 |

Definitive sponsorship means available/unavailable; conditional is included in conclusion coverage but not definitive precision. Missed jobs count in recall and coverage denominators. Citation validity checks exact source text, attribution, and evidence IDs, not semantic correctness. JSON includes confusion matrices, per-family metrics, and Wilson 95% intervals; intervals describe these constructed samples only.

Numerical sponsorship target (≥95%, at least 20 definitive predictions): not met. Independent human-reviewed beta gate: PENDING.

## Errors

- **D-page-013** (detection improvement deferred to section 7): sponsorship: expected "available", got "unclear"; pageKind: expected job-posting, got non-job.
  Expected reasoning: A genuine job wholly in a frame is currently missed.
- **D-page-014** (detection improvement deferred to section 7): sponsorship: expected "available", got "unclear"; pageKind: expected job-posting, got unreadable.
  Expected reasoning: A job title may be an h2; detection expansion is deferred.
- **D-page-015** (detection improvement deferred to section 7): sponsorship: expected "available", got "unclear"; pageKind: expected job-posting, got non-job.
  Expected reasoning: Apply can be outside the main description.
- **D-page-016** (detection improvement deferred to section 7): sponsorship: expected "available", got "unclear"; pageKind: expected job-posting, got non-job.
  Expected reasoning: Submit value labels can be the only Apply action.

## Reproducibility

Generated: 2026-09-25T01:27:06.182Z

- corpus SHA-256: `f3623231b10c504d9d1e43fbd26bd5e4bb2ac95352c4b7e9fcd2f236556a35be`
- selected SHA-256: `77339a41af57798781cda0c3ed6d79c376a0a0cb4cc0a70fc075abd7042afef4`
- scanner SHA-256: `cbc078f5a66882f7ca18ade6dd433157038f1ed2eabb1ac856779ccc25d91cef`
- interpreter SHA-256: `4df00e6202e8a5885d805468663afdc2feb06cf9f2ee9f17f871e3865f08d395`
