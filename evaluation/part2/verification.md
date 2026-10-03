# Part 2 verification — October 2, 2026

## Implemented

- Verified embedded vacancies can supplement an already selected parent role. Matching requires corroborated requisition identity or an explicit Apply destination and matching title; explicit ID/employer conflicts reject the merge. Source URLs and privacy exclusions remain intact.
- Cross-origin coordination waits for visible frame responses, rejects stale replies, clears document replacements, and refreshes child SPA navigation. The browser test exposed Chrome sender metadata retaining an initial URL after pushState; current same-origin child URLs are now carried separately while document/window/origin validation remains enforced.
- Country-scoped export obstacles have a distinct restriction type. Citations retain affected countries, denied-license timing, and adjacent exemptions. Informational export notices are context, not blanket citizenship blockers. Sponsorship refusals and genuine U.S.-person requirements still stand independently.
- Four official-source development examples, a reviewer worksheet, proposed acceptance gates, and 18 link-only holdout candidates were prepared. Labels remain provisional.

## Checks run

- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `node --import tsx --test tests/*.test.ts`: 208 passed, 0 failed.
- `node scripts/build.mjs`: passed.
- `pnpm test:browser`: smoke/accessibility/privacy, same-origin embedded, overview recovery, and cross-origin suites passed. Cross-origin coverage includes supplementation of a parent role, delayed insertion, child SPA navigation, changed-URL document replacement, same-URL reload, removal, unrelated widgets, ambiguous jobs, pause/resume, and disable/resume.
- `git diff --check`: passed.
- `node --import tsx evaluation/part2/rules-baseline.ts`: 4/4 restriction-kind sets matched, zero citation-audit errors, 3/4 provisional main decisions matched. These four deliberately selected blocker examples are not a quality estimate.

The Peraton dataset entry says extraction is partial but expects Explicit blocker found. The current completeness contract correctly returns Could not verify for partial evidence while retaining the citizenship finding. Preserve this disagreement for independent review: either the captured description is complete, or its expected main decision must change. Do not tune the interpreter to hide a labeling inconsistency.

## Live checks

- Waymo 8248060: HTTP 200; correct job/employer detected. Automatic badge showed Explicit blocker found with export-control scope, the internship-start deadline, and U.S. citizen/national/permanent-resident/refugee/asylum exemptions. Sponsorship remained unclear. This validates source interpretation, not any individual applicant's legal eligibility.
- Pinterest 8140210: HTTP 403 / Cloudflare browser challenge in disposable Chromium. No posting was accessible, so no live iframe success is claimed. No challenge bypass attempted.

## Remaining gates

- Identity-less forms, inaccessible frames, nested unsupported frames, and unsettled visible widgets may still prevent adoption; warnings must not promise every embed was read. Generic embed-gap reporting remains conservative rather than a per-frame coverage inventory.
- Confirm Pinterest in an accessible normal browser session after reloading the extension. Automated lifecycle success does not replace this live gate.
- Review development labels independently; capture/freeze source snapshots and a larger unseen holdout. Pinterest and Southwest were removed from candidate holdout links because they had already been used in this conversation.
- Laya configuration, questions, thresholds, checkpoints, and historical captures are unchanged. Model comparison and promotion remain deferred until reading and reviewed-data gates are met.
- No commit, package release, or publication was performed. Existing user work was preserved.
