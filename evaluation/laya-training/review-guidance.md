# Active review scope — October 5, 2026

## Simplified review — October 6

Use [the readable worksheet](worker-review-v2/review-worksheet.md) instead of editing raw JSON. It groups the 13 passages into four jobs. For each job, answer with the deterministic system's exact headline: **Explicit blocker found**, **Sponsorship stated**, **No blocker found**, or **Could not verify**. Also give the sponsorship fact (available / unavailable / conditional / unclear) and supporting passage numbers. These two answers are distinct: an eligibility blocker does not prove sponsorship is refused, and no blocker does not prove sponsorship is offered.

The worksheet leaves answers blank. Job-level decisions cannot automatically fill the worker's five per-passage labels. Those still need review before training. The extension already shares its final decision function across rule/model-derived interpretations; this change aligns the human review format, not model weights or predictions.

## Five-field passage review completed — October 6

The project owner reviewed all five questions for all 13 passages. The sponsorship adjudication remains in [sponsorship-review.json](worker-review-v2/sponsorship-review.json): 12 `unclear` labels and one `unavailable` label for Enova block 0. The complete per-passage labels are in [review-records.json](worker-review-v2/review-records.json). U.S.-citizenship and ITAR/U.S.-person requirements remain separate eligibility restrictions and were not converted into sponsorship refusals. The set is still not training-ready because it has no independent calibration/test split and contains excerpts rather than full scanner captures.

The user narrowed the objective to: **Does this specific job posting offer visa sponsorship?**

Review each TARGET in the context of the named vacancy and adjacent passages. Choose sponsorship available, unavailable, conditional, or unclear. Silence is unclear, never a refusal or proof of sponsorship. If source coverage is incomplete, retain that gap separately.

Scope is needed to distinguish an actual policy for this job from an application question, another job, historical activity, or general company context. Policies solely about later full-time conversion or another future job are other-role and do not determine sponsorship for the current vacancy. There is no need to research the employer's future sponsorship plans.

A current posting that explicitly excludes applicants needing sponsorship now or in the future still states an eligibility policy for this vacancy. Preserve that quoted condition. Do not exclude it merely because it contains the word future.

For the existing 13 passages, prioritize scope and sponsorship. Timing is optional supporting annotation; do not make additional research into future employment a prerequisite. CPT/OPT and citizenship/export restrictions remain separate facts and must not be relabeled as sponsorship refusals. No other-role passage should be labeled as an offer/refusal for this vacancy.

Examples:

| Posting wording | Sponsorship for the named job |
|---|---|
| We offer visa sponsorship for this internship. | Available |
| We cannot sponsor visas at this time. | Unavailable |
| Sponsorship may be considered for this role. | Conditional |
| Will you need sponsorship now or in the future? | Unclear; application question |
| Sponsorship for future FTE roles is not guaranteed. | Unclear; other-role context |
| Applicants for this job must work without sponsorship now or in the future. | Unavailable; requirement for this vacancy |
| Applicants must be U.S. persons. | Sponsorship unclear; separate stated restriction |

The authoritative rules are in [DECISION_LOGIC.md](../../DECISION_LOGIC.md). The original CSV, corrected CSV, previous question snapshots and smoke run remain historical artifacts. Current server questions encode the same contract; subsequent training preparations snapshot those questions and their hashes. No checkpoint has been retrained or promoted under the updated wording.
