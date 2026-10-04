# Part 2 verification — October 2, 2026

## Implemented

- Verified embedded vacancies can supplement an already selected parent role. Matching requires corroborated requisition identity or an explicit Apply destination and matching title; explicit ID/employer conflicts reject the merge. Source URLs and privacy exclusions remain intact.
- Cross-origin coordination waits for visible frame responses, rejects stale replies, clears document replacements, and refreshes child SPA navigation. The browser test exposed Chrome sender metadata retaining an initial URL after pushState; current same-origin child URLs are now carried separately while document/window/origin validation remains enforced.
- Country-scoped export obstacles have a distinct restriction type. Citations retain affected countries, denied-license timing, and adjacent exemptions. Informational export notices are context, not blanket citizenship blockers. Sponsorship refusals and genuine U.S.-person requirements still stand independently.
- Four official-source development examples were human-reviewed and adjudicated. A reviewer worksheet, proposed acceptance gates, and 18 link-only holdout candidates were prepared.

## Checks run

- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `node --import tsx --test tests/*.test.ts`: 208 passed, 0 failed.
- `node scripts/build.mjs`: passed.
- `pnpm test:browser`: smoke/accessibility/privacy, same-origin embedded, overview recovery, and cross-origin suites passed. Cross-origin coverage includes supplementation of a parent role, delayed insertion, child SPA navigation, changed-URL document replacement, same-URL reload, removal, unrelated widgets, ambiguous jobs, pause/resume, and disable/resume.
- `git diff --check`: passed.
- `node --import tsx evaluation/part2/rules-baseline.ts`: 4/4 restriction-kind sets and 4/4 reviewed main decisions matched, with zero citation-audit errors. These four deliberately selected blocker examples are not a quality estimate.

## Live checks

- Waymo 8248060: HTTP 200; correct job/employer detected. Automatic badge showed Explicit blocker found with export-control scope, the internship-start deadline, and U.S. citizen/national/permanent-resident/refugee/asylum exemptions. Sponsorship remained unclear. This validates source interpretation, not any individual applicant's legal eligibility.
- Pinterest 8140210: disposable Chromium was blocked by a Cloudflare challenge, but the project owner's normal browser session loaded the posting. Their screenshot confirms the correct role and employer, a complete displayed description, `No blocker found`, and the conservative unverified-frame warning.

## Remaining gates

- Qwen3.7's first pass and the project owner's human review are recorded in `review-worksheet.md`. All four development main decisions are confirmed; Peraton's description is adjudicated complete. These exposed development examples do not replace the unseen holdout gate.
- Identity-less forms, inaccessible frames, nested unsupported frames, and unsettled visible widgets may still prevent adoption; warnings must not promise every embed was read. Generic embed-gap reporting remains conservative rather than a per-frame coverage inventory.
- Capture/freeze source snapshots and independently label a larger unseen holdout. Pinterest and Southwest were removed from candidate holdout links because they had already been used in this conversation.
- The October 3 label submission is preserved unchanged and audited in `holdout-submission-audit.md`. It contains 54 total rows but only 46 unseen in-scope candidates after exclusions; four previously uninspected manifest entries were selected blindly to form a 50-job candidate roster. Predictions were not consulted while selecting those additions.
- The user's corrected 54-row extension-output CSV is audited in `extension-output-audit-2026-10-03.md`. Its provisional 46-case comparison has 100% blocker precision (13/13) and 59.1% blocker recall (13/22), with four coverage failures. Corrected Waymo, Amgen, and Zipline details now agree with their result columns. These are diagnostic figures, not a frozen holdout result.
- Laya configuration, questions, thresholds, checkpoints, and historical captures are unchanged. Model comparison and promotion remain deferred until reading and reviewed-data gates are met.
- No commit, package release, or publication was performed. Existing user work was preserved.
