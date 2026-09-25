# Section 4 holdout evaluation

AI-authored constructed scenarios; provisional labels; independent human review pending; not a real-world accuracy estimate.

Cases: 80 (64 policy scenarios, 16 page scenarios).

| Measure | Result |
| --- | --- |
| Cases meeting every expectation | 85.0% (68/80) |
| Job detection precision | 100.0% (8/8) |
| Job detection recall | 66.7% (8/12) |
| sponsorship: definitive precision | 87.0% (20/23) |
| sponsorship: definitive recall | 74.1% (20/27) |
| sponsorship: conclusion coverage | 39.5% (30/76) |
| cpt: definitive precision | 100.0% (8/8) |
| cpt: definitive recall | 100.0% (8/8) |
| cpt: conclusion coverage | 10.5% (8/76) |
| opt: definitive precision | 100.0% (9/9) |
| opt: definitive recall | 100.0% (9/9) |
| opt: conclusion coverage | 11.8% (9/76) |
| Cases with invalid citations | 0 |

Definitive sponsorship means available/unavailable; conditional is included in conclusion coverage but not definitive precision. Missed jobs count in recall and coverage denominators. Citation validity checks exact source text, attribution, and evidence IDs, not semantic correctness. JSON includes confusion matrices, per-family metrics, and Wilson 95% intervals; intervals describe these constructed samples only.

Numerical sponsorship target (≥95%, at least 20 definitive predictions): not met. Independent human-reviewed beta gate: PENDING.

## Errors

- **H-policy-001**: sponsorship: expected "available", got "unclear".
  Expected reasoning: A direct offer in benefits is explicit.
- **H-policy-004**: sponsorship: expected "unavailable", got "unclear".
  Expected reasoning: Negation precedes the whole promise.
- **H-policy-007**: sponsorship: expected "unclear", got "available".
  Expected reasoning: Benefit unrelated to immigration is not an offer.
- **H-policy-009**: sponsorship: expected "unavailable", got "unclear"; future: expected "unavailable", got "unclear".
  Expected reasoning: A future-only condition is not a current refusal.
- **H-policy-034**: sponsorship: expected "unclear", got "available".
  Expected reasoning: An educational quote is not employer policy.
- **H-policy-039**: sponsorship: expected "unclear", got "available".
  Expected reasoning: Applicant preference is not employer support.
- **H-policy-049**: restrictions: expected ["us-person"], got [].
  Expected reasoning: US person preserves exact language.
- **H-policy-050**: restrictions: expected ["permanent-residency"], got [].
  Expected reasoning: Green card condition is distinct.
- **H-page-013** (detection improvement deferred to section 7): sponsorship: expected "unavailable", got "unclear"; pageKind: expected job-posting, got non-job.
  Expected reasoning: Embedded role in an iCIMS-style wrapper is real job content.
- **H-page-014** (detection improvement deferred to section 7): sponsorship: expected "available", got "unclear"; pageKind: expected job-posting, got unreadable.
  Expected reasoning: A second brand heading must not hide the actual role.
- **H-page-015** (detection improvement deferred to section 7): sponsorship: expected "available", got "unclear"; pageKind: expected job-posting, got non-job.
  Expected reasoning: Short postings can lack the keyword groups.
- **H-page-016** (detection improvement deferred to section 7): sponsorship: expected "available", got "unclear"; pageKind: expected job-posting, got unreadable.
  Expected reasoning: A heading within a custom job container is still a title.

## Reproducibility

Generated: 2026-09-25T01:25:35.703Z

- corpus SHA-256: `f3623231b10c504d9d1e43fbd26bd5e4bb2ac95352c4b7e9fcd2f236556a35be`
- selected SHA-256: `09d51196fdbdb8b36d4fc7d7f37a109e377e99f39e00c3d9657b4e23aabe91bd`
- scanner SHA-256: `cbc078f5a66882f7ca18ade6dd433157038f1ed2eabb1ac856779ccc25d91cef`
- interpreter SHA-256: `184377a75e23d7917820506e589bc05af4590fa539c15853448c5a19dcf45745`
