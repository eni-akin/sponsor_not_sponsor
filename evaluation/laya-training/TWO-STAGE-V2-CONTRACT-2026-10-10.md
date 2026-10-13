# Two-stage Laya v2 transport and decision projection contract

Date: October 10, 2026 (America/Chicago)

Status: design complete under the approved October 10 direction; task 6 must implement and verify it. This document does not authorize training, change a running service, or approve model promotion.

This document completes the design work for the versioned response contract and decision projection in tasks 3 and 4. [DECISION_LOGIC.md](../../DECISION_LOGIC.md) remains authoritative for the five interpretation vocabularies and vacancy headline meanings. The companion [screening and context contract](TWO-STAGE-SCREENING-CONTEXT-2026-10-10.md) defines relevance and context semantics. The acceptance document defines how the completed system will be measured.

## 1. Fixed decisions

- The transport version is `laya-policy-v2`. Version 1 remains readable only by its existing v1 code path; no caller may send a v2-shaped value under the v1 version.
- The request contains every original evidence block in original order. Screening does not create a second filtered request, rewire neighbors, or join surviving passages.
- Every result contains exactly one block result for every request ID, in the same order.
- Human screening gold is binary: `relevant` or `irrelevant`. `uncertain` is a runtime route, not a third gold label.
- The existing scope, sponsorship, timing, CPT, and OPT vocabularies do not change.
- A skipped, failed, or unsupported interpretation has no answers or probabilities.
- Processing completeness reports whether both model stages ran as specified. Extraction completeness continues to come from `JobRecord.completeness` and `JobRecord.coverage`; neither can substitute for the other.
- The model returns typed choices and probabilities, not citations. The client binds a successful target result back to exact extracted evidence by ID. Model-authored text is never presented as a quote.
- `interpreted` means structurally successful inference. It does not assert that the choices are semantically supported. Human-reviewed gold determines support during development and evaluation.

## 2. V2 request

The normative TypeScript shape is:

```ts
type DecisionRequestV2 = {
  version: 'laya-policy-v2';
  title: string;
  employer: string | null;
  country: string | null;
  contextGroups: {
    id: string;
    firstPosition: number;
    lastPosition: number;
    start: 'boundary' | 'missing';
    end: 'boundary' | 'missing';
  }[];
  blocks: {
    id: string;
    text: string;
    kind: 'text' | 'application-question';
    contextGroup: string;
    position: number;
  }[];
};
```

`country` is an explicit country value when already known from reliable vacancy data. The current free-text `JobRecord.location` is not a country parser; use `null` until a reliable value exists.

`contextGroup` identifies one ordered source stream. `position` is the block's zero-based position in that stream. Positions must be unique within a group and contiguous for passages known to be adjacent. A neighbor exists only at `position - 1` or `position + 1` in the same group. Missing positions and group boundaries produce `null` context with the status specified by the companion context contract.

Every used group has exactly one `contextGroups` declaration, and unused declarations are invalid. `firstPosition` and `lastPosition` bound the positions supplied from that source. `start` and `end` distinguish a verified source boundary from evidence missing before or after the supplied range. A gap inside the range is also missing context. Without this declaration, the service cannot distinguish a natural first/last block from an incomplete extraction, so undeclared groups are invalid.

This metadata is necessary because the current scanner can append structured data, embedded-frame evidence, and recovered overview evidence to visible-page evidence. Array neighbors across those boundaries are not document neighbors. V2 construction assigns groups before inference; the worker never guesses boundaries from text.

An empty `blocks` array with empty `contextGroups` is valid. It produces a complete zero-block result without invoking passage inference. The configured model identity still appears in the result. This permits an empty/no-evidence job to follow the same client state machine while extraction completeness determines the headline.

V2 uses these concrete request bounds: non-empty title at most 500 characters; employer either `null` or a non-empty string at most 500 characters; country either `null` or a non-empty string at most 200 characters; ID and context-group ID at most 200 characters; block text at most 30,000 characters; at most 1,000 blocks; no more group declarations than blocks; and at most 100,000 block-text characters in total. IDs and group IDs must be non-empty and unique in their namespaces. Positions and group bounds must be non-negative integers, `firstPosition <= lastPosition`, each block position must fall within its declared group, and no position may repeat within a group. Empty blocks require empty group declarations. Request parsing strips unrelated top-level and block fields, as v1 does, after validating the required v2 fields.

## 3. Context serialization

For each target, the worker creates the state defined by the screening/context contract. In summary, it includes the named vacancy, nullable country, target text, actual previous and next text, and explicit `present`, `boundary`, or `missing` neighbor statuses. `null` means no supplied neighbor; it is not an empty policy statement.

Both stages see the same target and the same original context. Filtering happens only through the `route`; it does not alter context. A target routed to interpretation still receives its original neighbors even when either neighbor was skipped as its own target.

If complete target plus required context cannot fit, the block is `unsupported` with reason `context-too-long`. The worker must not silently truncate policy text or conditions.

If either derived neighbor status is `missing`, screening is `unsupported/missing-context`, route is `uncertain`, and interpretation is `unsupported/screening-unsupported`. A verified `boundary` is not missing. This precheck makes the processing result partial and prevents a model answer from implying absence when source order is incomplete.

## 4. V2 result

```ts
type Probability = number; // finite, 0 through 1 inclusive

type ScreeningResult =
  | { status: 'success'; choice: 'relevant' | 'irrelevant'; probability: Probability }
  | { status: 'failed'; reason: 'inference-failed' }
  | { status: 'unsupported'; reason: 'context-too-long' | 'missing-context' | 'unsupported-input' };

type Route = 'relevant' | 'uncertain' | 'skip';

type InterpretationAnswers = {
  scope: { choice: 'role' | 'question' | 'historical' | 'company' | 'other-role' | 'none'; probability: Probability };
  sponsorship: { choice: 'available' | 'unavailable' | 'conditional' | 'unclear'; probability: Probability };
  timing: { choice: 'unspecified' | 'now' | 'future' | 'now-and-future'; probability: Probability };
  cpt: { choice: 'explicitly-accepted' | 'explicitly-excluded' | 'unclear'; probability: Probability };
  opt: { choice: 'explicitly-accepted' | 'explicitly-excluded' | 'unclear'; probability: Probability };
};

type InterpretationResult =
  | { status: 'interpreted'; answers: InterpretationAnswers }
  | { status: 'skipped'; reason: 'screened-irrelevant' }
  | { status: 'failed'; reason: 'inference-failed' | 'screening-failed' }
  | { status: 'unsupported'; reason: 'context-too-long' | 'unsupported-input' | 'screening-unsupported' };

type BlockResultV2 = {
  id: string;
  screening: ScreeningResult;
  route: Route;
  interpretation: InterpretationResult;
};

type DecisionResultV2 = {
  version: 'laya-policy-v2';
  engine: 'laya';
  model: string;
  configuration: {
    questionsSha256: string;
    contextSha256: string;
    parametersSha256: string;
  };
  processing: {
    status: 'complete' | 'partial';
    inputCount: number;
    context: { complete: number; missing: number };
    screening: { success: number; failed: number; unsupported: number };
    interpretation: { interpreted: number; skipped: number; failed: number; unsupported: number };
  };
  blocks: BlockResultV2[];
};
```

`model` is the resolved checkpoint identity used or configured for this result, including the immutable revision when one exists. The three configuration values are lowercase 64-character SHA-256 digests of the exact ordered question definitions, canonical context serialization, and stage temperatures/routing/abstention parameters. Model plus all three digests are part of cache identity and display diagnostics. A directory nickname alone is insufficient for a promotion record.

The screening route is selected using the frozen calibration rule:

- Confidently relevant screening uses route `relevant`.
- Confidently irrelevant screening uses route `skip`.
- Any successful screen that does not meet a decisive threshold uses route `uncertain` and is interpreted.
- Failed screening uses route `uncertain` plus interpretation status `failed` with reason `screening-failed`. Unsupported screening uses route `uncertain` plus interpretation status `unsupported` with reason `screening-unsupported`. That target does not fail open into interpretation. Other successfully screened IDs in the same valid partial response may still be interpreted and displayed.

Until a screening routing configuration has been calibrated and registered, every successful screen uses route `uncertain`, every such target is interpreted, and no target is skipped. The historical `0.8` interpretation threshold is not a screening threshold.

Only route `skip` may produce `interpretation.status: skipped`, and it must use reason `screened-irrelevant`. Routes `relevant` and `uncertain` must never be represented as successful skips.

For processing counts, a target has complete context when neither derived neighbor status is `missing`; verified `boundary` is complete context. A target is counted once as context-missing when either side is `missing`.

`processing.status` is `complete` only when no target has missing context, every block has successful screening, and then either:

1. route `relevant` or `uncertain` with an `interpreted` result, or
2. route `skip` with a `skipped` result.

Any missing context or failed/unsupported stage makes processing `partial`, even if the same or another target yielded useful answers. Low-confidence screening routed to `uncertain` is not a processing error when interpretation succeeds.

All counts are non-negative integers. `context.complete + context.missing`, the sum of screening counts, and the sum of interpretation counts must each equal `inputCount`, which must equal `blocks.length` and the request block count. Each interpretation terminal status is counted once. For an empty result, every count is zero and status is `complete`.

## 5. Validation and error behavior

The service and client accept a ready v2 result only when all of these checks pass:

| Check | Required behavior |
| --- | --- |
| Version, engine, model | Exact v2 version, `laya`, non-empty model identity of at most 250 characters |
| Configuration identity | All three required digests are lowercase 64-character SHA-256 strings |
| ID accounting | Same count, IDs, and order as the request |
| Duplicate ID | Reject the whole ready result |
| Missing ID | Reject the whole ready result |
| Unexpected ID | Reject the whole ready result |
| Out-of-order ID | Reject the whole ready result; do not reorder a malformed reply |
| Probability | Present only on successful choices; finite and within `[0, 1]` |
| Vocabulary | Every successful choice belongs to its fixed vocabulary |
| Interpreted answers | Exactly all five answer fields are present |
| Non-success answers | `answers`, `choice`, and `probability` are absent |
| Skip consistency | Only route `skip`, successful `irrelevant` screen, and `screened-irrelevant` reason |
| Relevant route | Successful `relevant` screen and a frozen threshold decision |
| Uncertain route | Successful low-confidence screen or a failed/unsupported screen; never a successful skip |
| Processing counts | Exact recomputation from block results |
| Context counts | Exact recomputation from request group extents, gaps, and boundary/missing flags |
| Complete processing | All screens successful and all terminal outcomes interpreted or valid skips |
| Partial processing | At least one missing-context target or failed/unsupported stage |
| Empty input | Exact empty, complete result with zero counts |

The parser validates structure and route consistency. Calibration thresholds are configuration, so the parser cannot independently prove whether a numeric probability deserved `relevant`, `uncertain`, or `skip`; tests must pass the frozen routing configuration to the routing function and verify it separately.

A service timeout, worker exit, invalid JSON line, or malformed result that prevents trustworthy full ID accounting remains a service-level error reply. Per-block failure statuses are used only when the worker completed a structurally valid response accounting for every original ID. The client never projects a malformed ready result.

The extension continues to discard replies after navigation, evidence-generation changes, opt-out, or cancellation. V2 request JSON, version, model identity, and all three configuration digests form the cache identity. V1 cache entries must not satisfy v2 requests. A service that hot-reloads any question, context, temperature, routing, or abstention setting must produce a new digest before accepting more work; otherwise the service must restart and clear its in-memory cache.

## 6. Citation and claim rules

A successful interpretation is an input to the existing authoritative decision rules, subject to scope and confidence gates:

- Only a confidently interpreted `scope: role` target may create a definitive sponsorship, CPT, or OPT finding.
- `application-question` blocks remain questions even if the model predicts otherwise. Existing explicit other-role guards remain in force.
- Applicant questions, historical statements, company policy, other-role policy, and `scope: none` never establish this vacancy's policy.
- CPT and OPT remain independent. Acceptance of either does not establish visa sponsorship.
- Citizenship, permanent-residency, U.S.-person, clearance, work-authorization, and export-control checks continue to inspect the unfiltered original evidence.
- A result probability is not proof that the passage supports the claim.

For every projected claim, the anchor citation is the exact extracted target block selected by result ID. Where adjacent text carries a condition, the display may include the exact original context blocks from the same context group. Context citations must remain distinguishable from the target in implementation data, and their wording cannot be merged into a synthetic quote. No citation may come from a filtered neighbor, a different context group, a model-generated explanation, or an ID absent from the current role.

Semantic support is measured against human-reviewed gold. V2 deliberately does not add a lexical sponsorship validator or a second semantic-verifier model. Those would duplicate the policy task without providing independent evidence.

## 7. Corrected projection rules

The current `applyDecision` converts different confident `now` and `future` labels into overall `conditional`. That conversion must be removed. `conditional` means the employer may provide sponsorship under an explicit condition or exception; it does not mean two time periods differ.

Resolve and retain current and future findings independently. Then resolve the overall sponsorship finding with this mapping:

1. For conflict detection only, `unspecified` and `now-and-future` claims overlap both time periods; `now` and `future` do not overlap each other. An `unspecified` claim never populates the `now` or `future` finding and is never relabeled with inferred timing.
2. An `available` or `conditional` claim that overlaps an `unavailable` claim is unresolved and requires review. A genuine refusal-with-exception should be interpreted as one `conditional` policy, preserving the exception, rather than as two competing claims.
3. If no overlap conflict exists, any explicit `unavailable` claim makes the overall finding `unavailable`, including a refusal only for now or only for the future.
4. Otherwise, any actual `conditional` claim makes the overall finding `conditional`.
5. Otherwise, any `available` claim makes the overall finding `available`.
6. With no definitive claim, the overall finding is `unclear`.

Thus different time labels are not inherently a conflict and are never automatically renamed `conditional`. The actual timed labels determine the overall mapping.

The current headline also ignores unresolved CPT or OPT unless it is an explicit exclusion. V2 must prevent `No blocker found` when a CPT or OPT finding is unresolved because of conflict, ambiguous non-unclear evidence, failed/unsupported interpretation, or confidence abstention.

Derive review state without adding another model label:

- A successfully screened `relevant` target whose interpretation does not establish a confident scope is unresolved.
- A successfully screened `relevant`, confidently role-scoped target with `unclear` for sponsorship, CPT, and OPT is unresolved because the role-level eligibility wording was not explained by the five policy answers. An independently established deterministic blocker may still win under headline precedence while this uncertainty remains visible.
- A confident non-role scope (`question`, `historical`, `company`, `other-role`, or `none`) is context, not unresolved role policy.
- Ordinary silence consists of confidently irrelevant skips or interpreted irrelevant targets with role-safe unclear answers. That silence is not unresolved and does not by itself prevent `No blocker found` on a complete no-policy posting.

The headline precedence is:

1. Pending/error service state, partial v2 processing, or incomplete extraction: `Could not verify`. Preserve and show any supported findings and citations in details, including apparent blockers, with the completeness warning. Do not present a complete-vacancy verdict.
2. Complete evidence and processing with a definitive same-role sponsorship refusal, current/future refusal, CPT/OPT exclusion, or independent mandatory eligibility restriction: `Explicit blocker found`.
3. No definitive blocker, but a conflicting or unresolved sponsorship, CPT, or OPT finding: `Could not verify`.
4. No blocker or unresolved finding, with explicit same-role sponsorship availability or genuine conditional provision: `Sponsorship stated`.
5. Complete evidence and processing with no explicit blocker or sponsorship statement: `No blocker found`.

This order lets a definitive independent blocker decide a complete posting even when another topic is merely silent. A finding involved in a direct conflict is not definitive. In partial scans, known findings remain visible without turning a partial scan into a complete result.

Remove the current lexical `conditionalRefusal` override. A genuine policy such as “We do not sponsor except for candidates approved by immigration counsel” is `conditional`, not a blanket refusal merely because the same quote contains “do not sponsor.” An explicit exception must retain its exact condition. A separate unconditional role-level refusal that genuinely conflicts with it produces review-required uncertainty rather than a substring-based winner.

## 8. Boundary examples

| Evidence for the same vacancy | Per-time result | Overall/headline when complete |
| --- | --- | --- |
| “We sponsor candidates who already hold OPT.” | timing unspecified; sponsorship `conditional`; OPT is not inferred accepted unless directly stated | `Sponsorship stated`, with the exact condition |
| “We do not sponsor, except where immigration counsel approves an exception.” | timing unspecified; sponsorship `conditional` | `Sponsorship stated`, absent another blocker |
| “We sponsor currently.” + “Applicants needing future sponsorship are not eligible.” | now `available`; future `unavailable`; overall cannot be flattened to `conditional` | `Explicit blocker found` because the explicit future refusal applies to this vacancy; show both citations |
| “We cannot sponsor at the start date.” + “After one year, sponsorship is available.” | now `unavailable`; future `available`; overall cannot be flattened | `Explicit blocker found` because current sponsorship is refused; show future availability separately |
| “Current sponsorship is available.” + “Future sponsorship may be considered for high performers.” | now `available`; future `conditional` | `Sponsorship stated`; preserve the future condition |
| “Sponsorship is available now.” + “Sponsorship is not available now.” | conflicting now evidence | `Could not verify`; neither side is a definitive winner |
| “CPT candidates are welcome; future visa sponsorship is unavailable.” | CPT `explicitly-accepted`; sponsorship future `unavailable` | `Explicit blocker found`; CPT acceptance does not cancel the future refusal |
| No sponsorship wording; all ordinary blocks successfully skipped; complete extraction | successful silence, CPT/OPT `unclear` without review | `No blocker found`; sponsorship is not proven |
| Same no-policy posting, but one screen fails | processing partial | `Could not verify`, even if all completed blocks were ordinary negatives |
| Complete posting with explicit OPT exclusion and unrelated sponsorship ambiguity | OPT exclusion definitive | `Explicit blocker found`; show the unrelated ambiguity in details |
| Relevant role-level eligibility wording, but sponsorship/CPT/OPT all remain `unclear` | derived review required | `Could not verify`, unless an independent explicit blocker wins precedence |

## 9. Truth table for block processing

| Screening | Route | Interpretation | Processing contribution | Valid? |
| --- | --- | --- | --- | --- |
| success/relevant, decisive | relevant | interpreted with five answers | complete | yes |
| success/relevant, not decisive | uncertain | interpreted with five answers | complete | yes |
| success/irrelevant, not decisive | uncertain | interpreted with five answers | complete | yes |
| success/irrelevant, decisive | skip | skipped/screened-irrelevant | complete | yes |
| failed | uncertain | failed/screening-failed | partial | yes |
| unsupported | uncertain | unsupported/screening-unsupported | partial | yes |
| success/relevant | relevant or uncertain | failed/inference-failed | partial | yes |
| success/irrelevant | uncertain | failed/inference-failed | partial | yes |
| success/relevant | relevant or uncertain | unsupported/context-too-long or unsupported-input | partial | yes |
| success/irrelevant | uncertain | unsupported/context-too-long or unsupported-input | partial | yes |
| derived context missing | uncertain | unsupported/screening-unsupported | partial | yes; screening is unsupported/missing-context |
| success/relevant | skip | any | none | reject |
| success/irrelevant | skip | interpreted | none | reject |
| any success | relevant or uncertain | skipped | none | reject |
| failed/unsupported | skip | skipped | none | reject |
| any non-success interpretation with answers | any | answers present | none | reject |
| interpreted without all five answers | any | incomplete answers | none | reject |
| valid blocks but mismatched counts/status | any | any | none | reject whole result |

## 10. Task 6 implementation reach

Task 6 must update all actual v2 callers together:

- `src/types.ts`: carry reliable country only when available; represent model processing state separately from extraction coverage; add any citation-role marker needed to distinguish target from context.
- `src/decision.ts`: add v2 types, request construction, context-group declarations/assignment, strict request/result parsing, processing derivation, and projection without the mixed-time conditional rewrite. Keep v1 explicit or remove it only after every caller migrates in the same change.
- `server/decision-questions.ts`: add the binary relevance question and preserve the five authoritative interpretation questions.
- `server/laya_worker.py`: screen every target, apply frozen routing, interpret relevant/uncertain targets with original grouped neighbors, account for every ID, and emit typed non-success statuses without invented probabilities. Load one checkpoint once.
- `server/decision-service.ts`: validate v2, preserve bounded serialized work, cache by full v2 identity, and distinguish valid partial results from service-level errors.
- `server/decision-server.ts` and `src/background.ts`: accept only the matching version and retain origin, payload-size, and public-evidence validation.
- `src/decision-client.ts`: parse v2, discard stale generations, expose complete/partial state, and never project skips/errors as five-field answers.
- `src/main-decision.ts`: apply the precedence above, remove lexical conditional-refusal conversion, consider timed refusals and unresolved CPT/OPT, and preserve known details on partial scans.
- `src/findings-view.ts`, `src/badge-state.ts`, `src/popup.ts`, and `src/report.ts`: display processing completeness, model identity, supported findings, and extraction warnings without representing partial as successful absence.
- `src/scanner.ts`, `src/frame-coordinator.ts`, and `src/overview-recovery.ts`: preserve enough source-stream identity and position information for context groups when visible, structured, embedded, and recovered evidence are combined. Do not parse free-text location into country as part of this task.
- `scripts/browser-decision.ts`, `scripts/evaluate-laya-policy.ts`, and saved evaluation fixtures: use v2 and report screen routing, terminal status, support metrics, processing completeness, and model identity.
- `tests/decision.test.ts`, `tests/decision-contract.test.ts`, plus scanner/frame/overview and browser tests affected by request construction: cover all truth-table rows, grouped context, malformed ID accounting, empty inputs, stale replies, partial display, mixed timing, genuine exceptions, unresolved CPT/OPT, and independent blockers.

Expected regressions during migration are compile failures from changed result unions; v1 fixtures rejected by v2 parsers; old tests expecting five answers for every block; old mixed-timing tests expecting overall `conditional`; snapshots that assume incomplete extraction hides all known facts; and cache identities that omit the version, model, context grouping, or routing configuration. Fix these deliberately rather than adding compatibility defaults that invent answers.

## 11. Design completion record

- The screening/context contract and this contract use the same request grouping, state, routes, and status names.
- Boundary examples preserve the meanings in `DECISION_LOGIC.md`, including genuine exceptions and explicit timing.
- The union represents every original ID without placeholder labels or invented confidence.
- Semantic support remains human-scored, and processing completeness cannot improve precision by dropping failures.
- Task 6 must prove the runtime and UI behavior with fixtures and integration checks before task 7 begins.

## 12. Values task 6 and later phases must register

1. Before training, register the calibration method, permitted threshold search, optimization target, and tie-break rules. Choose the actual routing thresholds only after weights and questions are locked, using calibration data, then freeze them before fresh-test evaluation. Task 6 uses all-forward routing.
2. A reliable country source is not present in the current `JobRecord`; v2 sends `null` until one exists. Free-text geocoding is outside task 6.
3. Task 6 uses a citation-role marker (`target` or `context`) in projected data and the smallest existing findings-view presentation that preserves exact wording.
4. Latency and maximum batch behavior must be measured on the intended runtime hardware, and the concrete acceptance limit registered before task 7.
