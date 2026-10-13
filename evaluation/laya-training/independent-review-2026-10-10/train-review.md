# Independent training-split semantic review

Date: October 10, 2026. Reviewer: AI independent semantic reviewer `/root/blind_train_review`, separate from dataset assembly. This is not a human signature or approval to train.

All 167 training records across 35 postings have a per-record outcome. The frozen files were not edited. The result is **143 accept, 18 change, 6 needs-adjudication, 0 exclude**. Twenty-three records have at least one proposed label difference. One additional record, `ctx-tra-081`, matches existing labels but still needs its antecedent adjudicated.

| Changed field | Records |
| --- | ---: |
| Relevance | 6 |
| Scope | 13 |
| Sponsorship | 9 |
| Timing | 2 |
| CPT | 0 |
| OPT | 0 |

## Review method and exposure

The reviewer first read `DECISION_LOGIC.md`, `TWO-STAGE-SCREENING-CONTEXT-2026-10-10.md`, `TWO-STAGE-V2-CONTRACT-2026-10-10.md`, and `INDEPENDENT-REVIEW-STARTED-2026-10-10.md` completely. All source records were then viewed through allowlist projections of posting metadata, target, immediate context, and evidence hashes. Gold, rationales, tags, prior review states, reviewer identities, employer groups, and policy families were excluded from those projections.

All six independent labels and a record-specific reason were saved in [train-blind-labels.json](train-blind-labels.json) before existing training gold was opened for comparison. The required starter-review document had already exposed selected earlier labels and findings for 17 training IDs. Those IDs are recorded in the blind artifact and marked individually. This is therefore a source-gold-blinded review with disclosed prior exposure, not a fully blind review. The model used no training, calibration, checkpoint inference, or fresh-test data.

[train-comparison.json](train-comparison.json) is the complete ledger. Each record contains its outcome, old/proposed six-field gold, rationale, changed fields, reviewer identity, exact posting/target/context snapshot, source evidence hash, and independently recomputed review-evidence hash. `accept` means agreement on this target's labels; it does not independently certify source capture, posting completeness, or vacancy-level consistency. Proposed labels on `needs-adjudication` rows are provisional.

## Supported corrections

- `ctx-tra-015`, `018`, `020`, `023`, `028`, `041`, `044`, `045`, `049`: use `scope: role` for explicit hiring conditions and selection rules. These remain immigration-irrelevant. The two deadline cases explicitly reject late submissions, extending beyond a bare date. Mandatory checks do not become security-clearance requirements.
- `ctx-tra-066`: the immediate antecedent of “above requirement” is completed coursework. Use irrelevant/role with unclear sponsorship; an exception to coursework does not establish immigration sponsorship.
- `ctx-tra-069`: independent permanent work authorization is relevant role eligibility with unclear sponsorship. The target does not independently restate the neighboring visa refusal.
- `ctx-tra-074`: “This policy” directly resolves to the immediately preceding now-and-future refusal. Retain that explicit timing, consistently with the analogous resolved reference in `ctx-tra-054`.
- `ctx-tra-078`: NEXT's “Provided that” restricts the sponsorship offer to active F-1 status and school authorization. Use conditional sponsorship, as for the qualifier target `ctx-tra-079`; neither passage explicitly accepts CPT or OPT.
- `ctx-tra-135`: the U.S.-intern refusal directly applies to the named U.S. internship. Use role/unavailable/unspecified. The London offer is other-role context; a future exact clause split can preserve both scopes separately.
- `ctx-tra-150`–`152`: global talent, relocation consultation, and career mobility contain no explicit immigration/work-authorization statement or reference. All are irrelevant; `150` and `151` are general prose/benefits with scope none, while `152` explicitly describes a corporate policy and retains company scope.
- `ctx-tra-154`: “only” limits sponsorship to candidates already holding valid work visas. Use conditional/unspecified. “Currently” modifies candidate status rather than sponsorship timing.

## Required adjudication

| Record | Provisional interpretation and unresolved issue |
| --- | --- |
| `ctx-tra-059` | Relevant/role, sponsorship unclear. The preceding policy already offers sponsorship; the target never says what its counsel-approved exceptions change. An exception is not automatically conditional provision. |
| `ctx-tra-061` | Irrelevant/role with unclear sponsorship. “Above policy” follows a skill/experience qualification. Establish the intended antecedent without jumping across source blocks. |
| `ctx-tra-076` | Irrelevant/role with unclear sponsorship. The immediate previous target is merely a desirable skill, not the referenced restriction. Cross-border academic exchange alone does not explicitly establish a visa or authorization policy. Both antecedent and relevance need resolution. |
| `ctx-tra-081` | Relevant/role with unclear sponsorship, matching old labels. Immigration guidelines establish relevance, but “these provisions” has no immediate policy antecedent; recover or review the reference before freezing. |
| `ctx-tra-086` | Relevant/role with unclear sponsorship. Pre-existing work authorization is explicit, but no sponsorship provision or clear exception antecedent is supplied. |
| `ctx-tra-116` | Relevant/company with unclear sponsorship. “Select positions” does not establish that this internship is eligible. Confirm current-role applicability before using a definitive conditional label. |

Recovering source context may justify a reviewed new extraction. The current records must not silently acquire distant neighbors. Structural `present` statuses do not prove that a reference is semantically resolvable.

## Context and consistency findings

Resolved references (`054`, `064`, `074`, `084`) can use their immediate policy antecedents. Unrelated intervening qualifications in `061`, `066`, `076`, `081`, and `086` cannot be skipped to find a more convenient antecedent. The paired sponsorship offer/condition in `078`–`079` should remain together as a semantically attached unit in any later reviewed extraction.

The supplied postings contain explicit contradictory policies: Illinois Tool Works (`154`–`157`) has sponsorship provision/refusal overlap; Anduril (`159`–`162`) has CPT and OPT acceptance/exclusion pairs; Bosch (`164`–`165`) has both-program acceptance/exclusion. The ledger preserves each target's explicit claim and flags the contradiction instead of importing a neighbor's label. These examples cannot support an unqualified vacancy-level conclusion. Whether the contradictions reflect authentic source wording or assembly errors was not established by this semantic review.

Bosch `166`–`167` explicitly separates a current refusal and possible future provision. Those time-specific labels are retained; different periods must not be flattened into a single conditional policy. No separate-role conversion is stated in `167`, so none is inferred.

## Verification and artifact identity

Both JSON artifacts parse. Assertions verified that all 167 source IDs appear exactly once and in source order; all six label fields use the contract vocabulary; non-role/irrelevant examples have safe immigration labels; old/proposed comparisons and outcome counts agree; and all 264 present neighbors match the frozen source block, group, and adjacent position. Full review-evidence hashes were recomputed. The frozen training bytes still match the pre-review hash.

- Frozen `contextual-v1-2026-10-10/train.json`: `e8d0281d1375c0b1193e16af318efe0b38e99871a1b91f3b744ea75b8cbd3d72`.
- Independent labels saved before gold comparison: `809f3dbda2eeda0101efd96f6fd503ee10f9d0aa4eeb4988f6b7b2b3efa79b05`.
- Complete comparison ledger: `9d11f45e494966e07fbc2026086c07cb72dfccbbd84fa2ef2322084a6b9e639a`.

No training, calibration, inference, runtime edits, or frozen-artifact rewrites were performed. Live source authenticity, exact source preservation, and extraction completeness were not independently rechecked; unresolved meanings and contradictory postings still require adjudication before a new gold freeze.
