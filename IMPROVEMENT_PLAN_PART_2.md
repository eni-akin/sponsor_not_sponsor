# Sponsor Not Sponsor — Part 2 Improvement Plan

Date: October 2, 2026  
Status: Shared rule fixes and automated iframe checks verified; independent dataset review and live iframe confirmation pending.  
Related roadmap: [PLAN.md](PLAN.md)

## Objective and sequence

Finish reliable page reading, clarify how scoped restrictions are presented, establish a reviewed evaluation set, and then test whether Laya improves decisions.

Laya remains the last development phase. Preparing its evaluation requirements does not require changing the current model integration. Use minimal shared root-cause fixes, reuse existing infrastructure, and preserve existing work and historical evaluation captures.

## Phase 1 — Establish the baseline

Record the current commit, extension version, test results, and known limitations before implementation.

The baseline should include the corrected Greenhouse, Lever, and iCIMS behavior and these outstanding issues:

- Embedded application content cannot supplement a job already identified on the parent page.
- Some iframe lifecycle cases remain untested.
- Export-control notices can become overly broad citizenship blockers.
- Laya's current configuration has not demonstrated useful decision quality.

Preserve historical evaluation captures so future results can be compared against them.

**Completion criterion:** Each outstanding issue has a reproduction, expected behavior, and verification method.

## Phase 2 — Finish page and iframe reading

Interpretation can only be reliable when the relevant evidence is available. Extend existing iframe coordination to read public application wording belonging to the selected vacancy. Supplement parent-page evidence while preserving job identity and each passage's source URL.

| Scenario | Expected behavior |
| --- | --- |
| Iframe appears after page load | Relevant content becomes available automatically. |
| Iframe document is replaced | Previous evidence is cleared and fresh evidence is read. |
| Navigation happens inside the iframe | Evidence follows the current document. |
| Iframe is removed | Its evidence disappears. |
| Application frame appears alongside unrelated widgets | Only verified job/application content is considered. |
| Scanning is paused or the site is disabled | Reading stops and stale evidence is cleared. |
| Reading resumes | Current content is scanned without duplicate coordination. |
| Frame cannot be verified | The limitation remains visible. |

Continue excluding entered answers, uploads, hidden content, and editable fields. Preserve frame/document identity checks and protections against stale replies.

Replace the generic iframe warning with a description of what actually remains unread. Do not claim that every possible embedded frame is supported.

**Completion criterion:** Automated browser tests cover these cases, and representative live pages confirm the behavior. Record inaccessible live pages separately from functional failures.

## Phase 3 — Define the decision contract for scoped restrictions

The user authorized proceeding with this plan on October 2, 2026. The contract below guides implementation and evaluation; it does not infer individual eligibility.

Keep **Explicit blocker found** when the posting states an actual eligibility obstacle, and explain its scope. The extension reports posting conditions; it does not decide personal eligibility.

| Evidence | Treatment |
| --- | --- |
| Explicit sponsorship refusal | Blocker. |
| Required U.S. citizenship or U.S.-person status | Blocker with the exact requirement. |
| Informational export-license notice alone | Contextual notice. |
| Country-scoped licensing obstacle with a stated deadline or refusal | Blocker with affected group, conditions, and exemptions. |
| CPT/OPT/J-1 application choices | Application context; no inferred acceptance. |
| Complete description with no qualifying evidence | No blocker found. |
| Incomplete or materially conflicting evidence | Could not verify. |

For the reported Waymo example, distinguish its country/status restriction from a general sponsorship refusal. Preserve the licensing deadline and applicable exemptions rather than citing only the country list.

Reference example: [Waymo job 8248060](https://careers.withwaymo.com/jobs/2027-summer-intern-ms-phd-ai-driven-ml-performance-engineering-intern-mountain-view-california-united-states?gh_jid=8248060). Its [public application data](https://boards-api.greenhouse.io/v1/boards/waymo/jobs/8248060?questions=true) was inspected during diagnosis; capture reviewed evidence for evaluation because live content can change.

**Completion criterion:** Each category has reviewed examples, including examples that should not trigger it, and regression coverage verifies the agreed contract.

## Phase 4 — Repair shared rule interpretation

Implement the smallest shared changes needed to satisfy the agreed contract. Distinguish:

- what is required;
- who is affected;
- whether the requirement concerns employment eligibility or access to controlled information;
- whether exceptions or deadlines change its meaning.

Preserve the relevant heading, policy sentence, adjacent condition, and exception paragraph as evidence. Do not treat every export-control notice as harmless or every citizenship mention as a blanket requirement. Avoid employer-specific exemptions.

Add meaningful regressions for:

1. The exact Waymo notice.
2. An informational licensing notice without a stated obstacle.
3. A licensing obstacle with a deadline and exemptions.
4. A genuine U.S.-person requirement.
5. A separate sponsorship refusal beside an export notice.
6. Application choices that must not imply acceptance.

**Completion criterion:** These examples classify correctly, existing blocker tests still pass, and explanations show the scope accurately.

## Phase 5 — Build a reviewed comparison dataset

Use [SimplifyJobs Summer 2027 Internships](https://github.com/SimplifyJobs/Summer2027-Internships) to discover postings, then review official employer/application text. Repository labels are discovery aids, not classification evidence.

Record for each example:

- job identity and source URL;
- captured evidence and review date;
- expected main result;
- restriction type and affected group;
- conditions, exemptions, and timing;
- exact supporting passages;
- extraction completeness.

Include straightforward statements, difficult scoped restrictions, application questions, silence, and conflicting evidence. Preserve a fresh unseen holdout for final evaluation. Examples used to tune rules or model questions become development examples.

**Completion criterion:** Disagreements can be traced to missing evidence or incorrect interpretation, and the holdout remains untouched.

## Phase 6 — Evaluate Laya outside the extension

Simplify Laya's questions to match the agreed decision contract. Its current sponsorship/CPT/OPT questions cannot directly resolve export restrictions; current rule-generated restrictions remain in the integrated result.

Supply the complete relevant section and require decisions tied to extracted evidence. Start with existing installed configurations, change one variable at a time, and preserve each result. Reuse the existing evaluator rather than introducing another backend.

Compare:

1. Rules alone.
2. Laya alone.
3. Rules plus Laya reviewing ambiguous cases.

| Measure | What it reveals |
| --- | --- |
| False blockers | Valid opportunities discouraged. |
| Missed blockers | Explicit obstacles overlooked. |
| Abstentions | How often the system cannot decide. |
| Scope and exception accuracy | Whether the explanation identifies the affected group. |
| Evidence accuracy | Whether cited passages support the conclusion. |
| Latency and failures | Whether local inference is usable. |

Set acceptance thresholds before inspecting holdout results. Do not lower confidence thresholds simply to obtain more definitive answers. The existing small diagnostic results are not a real-world accuracy estimate; see [Laya development results](evaluation/results/laya-development.md).

**Completion criterion:** A configuration demonstrates measurable improvement on unseen examples. If none does, keep Laya experimental.

## Phase 7 — Integrate proven behavior

Proceed only if Phase 6 supports adoption. Reuse the existing opt-in connection.

Keep extraction, source attribution, privacy exclusions, and response validation deterministic. Define how rule/model disagreements are handled; one engine must not silently erase contradictory evidence.

Verify navigation, rescans, pause/resume, stale replies, model outages, and incomplete evidence.

**Completion criterion:** Both decision quality and browser integration pass their checks.

## Phase 8 — Run fresh live validation

Select a new batch from the internship repository after rebuilding and reloading the extension. Compare human review with the displayed result, explanation, quotation, and source for each posting. Record closed or inaccessible postings separately.

Release decisions follow this validation, not merely successful automated tests.

**Completion criterion:** The reviewed live batch meets the agreed quality gate, unresolved failures are documented, and release readiness is explicitly assessed.

## Immediate next actions

1. Record the baseline and reproduce the remaining iframe cases.
2. Complete iframe reading and lifecycle coverage.
3. Agree on the scoped-restriction contract.
4. Repair the shared Waymo interpretation and add regressions.
5. Freeze reviewed development examples and a separate unseen holdout.
6. Begin Laya experiments only after extraction and rule-contract work is stable.

## Progress checklist

- [x] Phase 1: Baseline recorded in [evaluation/part2/baseline.md](evaluation/part2/baseline.md); committed tree passed 194 tests, typecheck, and build.
- [ ] Phase 2: Automated reading/lifecycle checks pass; live Pinterest confirmation remains blocked by a Cloudflare 403 challenge. Identity-less forms remain unread.
- [x] Phase 3: Scoped-restriction contract authorized by the instruction to implement this plan; independent example review remains part of Phase 5.
- [x] Phase 4: Shared rule fixes verified with exact Waymo text, negative controls, and live Waymo confirmation.
- [ ] Phase 5: Reviewed dataset and unseen holdout prepared.
- [ ] Phase 6: Laya quality evaluated.
- [ ] Phase 7: Proven behavior integrated, if justified.
- [ ] Phase 8: Fresh live validation and release assessment completed.

### October 2 implementation checkpoint

See [verification and remaining gates](evaluation/part2/verification.md). The current tree passes **208 tests**, typecheck, build, and all four Chromium suites. No dependency, model, confidence threshold, or release setting changed. Three GPT-6 Luna agents prepared frame, rule, and dataset work; the primary agent reconciled and verified it after agent usage limits interrupted their work.

Next: reload `dist` and verify Pinterest in a normal browser session that can access the posting; independently review the four development examples and resolve the Peraton completeness/label conflict. Freeze a sufficiently large unseen dataset before model-quality comparisons. The 18 link-only holdout candidates are not a reviewed holdout and cannot satisfy the proposed 50-vacancy gate.
