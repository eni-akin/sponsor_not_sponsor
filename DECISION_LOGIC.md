# Sponsor Not Sponsor decision contract

Status: authoritative  
Version: 1  
Effective: October 7, 2026

This document is the stable source of truth for human labels, deterministic rules, Laya questions, evaluation, and user-facing decisions. Planning notes and historical datasets do not override it. A rule changes only through an explicit product decision accompanied by updated examples and tests.

## Evidence boundary

Judge the named vacancy from its captured posting evidence. Do not infer policy from employer reputation, silence, applicant answers, historical activity, another vacancy, or later full-time conversion. Adjacent passages may clarify a target passage but do not transfer their labels to it. Split a combined policy-and-question passage when possible.

## Passage labels

### Scope

- `role`: a hiring or eligibility policy applying to this vacancy or its applicants.
- `question`: an applicant question. A question alone never establishes employer policy.
- `historical`: past activity, not policy for this vacancy.
- `company`: general company policy whose application to this vacancy is not established.
- `other-role`: another vacancy or later employment/conversion.
- `none`: unrelated wording, headings, dates, or no hiring policy.

Only `role` passages may produce definitive sponsorship, CPT, or OPT findings.

### Sponsorship

- `available`: the employer explicitly offers immigration visa sponsorship for this vacancy.
- `unavailable`: the employer explicitly refuses sponsorship or requires applicants for this vacancy not to need it. A future-sponsorship requirement is still unavailable for this vacancy.
- `conditional`: the employer may provide sponsorship under a stated condition or exception.
- `unclear`: no explicit policy, an applicant question, conflicting or ambiguous wording, or only a citizenship, U.S.-person, export-control, clearance, or general work-authorization restriction.

`conditional` means conditional provision of sponsorship. It does not mean “eligible only if sponsorship is unnecessary.”

Mandatory U.S. citizenship, permanent residence, U.S.-person status, clearance, and export-control requirements are separate eligibility restrictions. They may create an explicit blocker but do not by themselves prove sponsorship is unavailable.

### Timing

- `now`: explicitly current sponsorship only.
- `future`: explicitly future sponsorship only.
- `now-and-future`: both are explicit.
- `unspecified`: timing is not explicit, or the target is not a role-level sponsorship policy.

A broad refusal such as “we do not sponsor” is `unspecified`; timing is never inferred.

### CPT and OPT

Label each independently as `explicitly-accepted`, `explicitly-excluded`, or `unclear`.

- Acceptance or exclusion must be direct and apply to this vacancy.
- Silence, questions, conditions needing interpretation, and mention as examples of current status are `unclear`.
- A refusal that directly includes CPT or OPT makes the named program `explicitly-excluded`.
- CPT never determines OPT, and OPT never determines CPT.
- Pre-completion OPT and “Pre-OPT” use the OPT label.
- CPT/OPT acceptance does not establish visa sponsorship. A vacancy may accept CPT/OPT while refusing later employment-visa sponsorship.

## Vacancy headline

After passage labels and rule-derived restrictions are combined:

- `Explicit blocker found`: an explicit sponsorship refusal, CPT/OPT exclusion, or other mandatory eligibility restriction applies.
- `Sponsorship stated`: sponsorship is explicitly available or conditionally considered, with no overriding blocker.
- `No blocker found`: a complete posting has no explicit blocker or sponsorship statement. This does not prove sponsorship is available.
- `Could not verify`: coverage is incomplete, evidence conflicts, or uncertainty prevents a safe conclusion.

Citizenship, U.S.-person, clearance, work-authorization, and export-control restrictions must retain their exact scope, affected group, conditions, and exceptions. They do not silently become sponsorship findings.

## Canonical examples

| Target passage | Scope | Sponsorship | Timing | CPT | OPT |
|---|---|---|---|---|---|
| “Visa sponsorship is available for this position.” | `role` | `available` | `unspecified` | `unclear` | `unclear` |
| “Sponsorship may be considered for exceptional candidates.” | `role` | `conditional` | `unspecified` | `unclear` | `unclear` |
| “Applicants must not require sponsorship now or in the future.” | `role` | `unavailable` | `now-and-future` | `unclear` | `unclear` |
| “Applicants requiring future sponsorship are not eligible.” | `role` | `unavailable` | `future` | `unclear` | `unclear` |
| “Will you require sponsorship?” | `question` | `unclear` | `unspecified` | `unclear` | `unclear` |
| “U.S. citizenship is required.” | `role` | `unclear` | `unspecified` | `unclear` | `unclear` |
| “CPT and Pre-OPT candidates are invited to apply; we cannot sponsor visas.” | `role` | `unavailable` | `unspecified` | `explicitly-accepted` | `explicitly-accepted` |
| “We do not provide sponsorship of any kind, including CPT and OPT.” | `role` | `unavailable` | `unspecified` | `explicitly-excluded` | `explicitly-excluded` |

## Data integrity

Training records require an official source URL, vacancy and employer identity, retrieval date, evidence locator, capture/completeness status, reviewer, rationale, and source/evidence hashes. Applicant data is prohibited.

Deduplicate the same source vacancy and evidence. Normalize employer identities. Different vacancies may remain separate, but every record from the same employer or reused policy family must stay in one dataset split. Development examples exposed during rule design may be training data only, never calibration or held-out test data.

