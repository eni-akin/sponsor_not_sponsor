# Sponsor Not Sponsor — deterministic publication plan

Updated: October 16, 2026

## Publication scope

Publish the existing deterministic extension while preserving its rule and scanning improvements. Additional product changes are deferred.

## Decision contract

[DECISION_LOGIC.md](DECISION_LOGIC.md) governs the result:

| Result | Meaning |
| --- | --- |
| Explicit blocker found | The posting states a sponsorship refusal, CPT/OPT exclusion, or mandatory eligibility restriction. Preserve its exact scope and conditions. |
| Sponsorship stated | The posting explicitly offers or considers sponsorship for this vacancy, with no overriding blocker. |
| No blocker found | A complete posting has no recognized blocker or sponsorship statement. Sponsorship remains unproven. |
| Could not verify | The description is incomplete, unreadable, conflicting, or cannot be matched safely. |

Application questions, employer history, other vacancies, and silence do not establish this vacancy's policy. CPT and OPT remain independent. Citizenship, U.S.-person, work-authorization, clearance, and export-control restrictions remain distinct from visa sponsorship.

## Implemented behavior to retain

- Role identification, structured job data, and public-text extraction.
- Same-origin and bounded cross-origin iframe reading with vacancy/document identity checks and navigation lifecycle handling.
- Verified Ashby overview recovery and explicit coverage warnings.
- Deterministic sponsorship, current/future timing, CPT/OPT, other-role guards, and scoped export-license findings.
- Automatic badge, popup, accessible page panel, citations, pause/site controls, rescan, and local diagnostic download.

Company research is deferred. Its backend remains available for separate development.

## Evidence and remaining validation

The [Part 2 plan](IMPROVEMENT_PLAN_PART_2.md) and [verification](evaluation/part2/verification.md) record the retained frame and scoped-restriction work. [Evaluation guidance](evaluation/README.md) distinguishes authored scenarios, exposed reviews, and an independent holdout.

Before public submission, complete independently reviewed real-world validation and human accessibility review, review the privacy disclosures and permission explanations, and supply publisher/support details. Automated regression passes alone do not establish real-world accuracy.

[Release instructions](release/README.md) cover packaging and testing the extracted archive. Public submission and changing the repository's default branch are separate owner actions.

## Remaining action order

1. **Completed October 16, 2026:** audited 30 of the latest currently open postings from SimplifyJobs/Summer2027-Internships in the owner's existing Chrome session. The [live diagnostic report](evaluation/live-2026-10-16/report.md) preserves reviewer checkpoints, actual extension results, exclusions, coverage failures, discrepancies, and explicit denominators. This is not human-reviewed release approval.
2. Review the [ranked audit findings](evaluation/live-2026-10-16/report.md#ranked-findings-and-next-actions): prioritize the supported-U.S. Ryan miss, same-vacancy portal coverage, citation completeness, and vacancy identity; assess the correlated EA UK wording misses separately from supported scope. Resolve the Qualcomm label dispute before treating it as a scored error. Implementation follows a separate owner request; preserve the original audit evidence for comparison.
3. Complete clean-install/upgrade verification, independent real-world evaluation, and manual accessibility checks.
4. Finalize public documentation, licensing, support/privacy details, and the publication/development branch workflow.
5. Review release readiness, package contents, and the remaining publication requirements.
6. **Logo direction approved and applied October 16, 2026:** the owner selected “Between” (concept C) and approved the SNS kit. Updated toolbar icons, popup and on-page branding, help/privacy headers, the theme-aware README logo, asset generation, and release images. See the [identity kit](design/logo-kit/GUIDE.md). Branding approval does not complete the independent evaluation, accessibility, or publication requirements above.
