# Two-stage Laya acceptance contract

Date: October 10, 2026 (America/Chicago)

Status: design complete under the approved October 10 direction; numerical gates remain unmeasured. This document defines gates for later development, calibration, fresh evaluation and promotion. It does not approve training, load a model, change a default, or report that any numerical gate has passed.

Authority: [DECISION_LOGIC.md](../../DECISION_LOGIC.md) remains authoritative for scope, sponsorship, timing, CPT, OPT and vacancy headlines. This document defines how to measure a two-stage implementation against that contract; it does not change the labels or their meaning.

## 1. Acceptance principle

The pipeline must retain immigration and employment-eligibility evidence, avoid unsupported policy claims, remain useful on complete postings with no policy, and account honestly for every requested passage.

A conservative final headline cannot hide bad passage predictions. Passage claims are scored before headline conflict resolution. A pipeline that emits unsupported claims and later collapses them to `Could not verify` fails the claim gates. A pipeline that returns `Could not verify` for everything fails recall and no-policy usefulness.

These gates assess what the captured posting states. They do not determine an applicant's legal status or provide immigration advice.

## 2. Frozen terms and evaluation units

### 2.1 Ground truth

Human screening gold is exactly `relevant` or `irrelevant`.

A target passage is `relevant` when the target itself states, asks about or refers to immigration sponsorship, visa eligibility, CPT/OPT, work authorization, citizenship/permanent-residence/U.S.-person requirements, export controls or clearance eligibility. Company, historical and other-role immigration policies are relevant to screening even though they do not establish policy for the current vacancy. Mere adjacency to a relevant neighbor does not make an unrelated target relevant.

Model uncertainty is a routing state, not a third human label. A valid screen result has a binary choice and probability. The runtime routes valid `relevant` results and calibrated uncertain results to interpretation. It skips only valid, confidently `irrelevant` results.

The five interpretation fields remain:

- `scope`: `role`, `question`, `historical`, `company`, `other-role`, `none`
- `sponsorship`: `available`, `unavailable`, `conditional`, `unclear`
- `timing`: `now`, `future`, `now-and-future`, `unspecified`
- `cpt`: `explicitly-accepted`, `explicitly-excluded`, `unclear`
- `opt`: `explicitly-accepted`, `explicitly-excluded`, `unclear`

### 2.2 Units

- **Posting:** one captured vacancy with a declared extraction status. All its targets, neighbors and copied policy text stay in one split.
- **Target passage:** one original extracted block ID. It is the unit for screening retention and five-field exactness.
- **Quality-eligible target:** a reviewed target whose derived previous/next context has no `missing` side and whose canonical input is within the registered type and size support. Missing-context, oversized and otherwise unsupported targets belong to the pre-registered operational challenge set, not model-quality denominators. A runtime failure or unsupported result on a target registered as eligible still counts as a miss.
- **Claim unit:** one non-`unclear` sponsorship, CPT or OPT field from an interpreted target that passes the frozen interpretation confidence/abstention rule and is accepted for downstream projection or display. Sponsorship timing is part of the sponsorship claim when the gold or prediction states explicit timing. Multiple fields from one target are separate claim units but remain in the same connected evaluation group.
- **Gold policy-finding unit:** one gold non-`unclear` sponsorship, CPT or OPT field on a quality-eligible role-level target. An abstention, skip, failure, unsupported result, screen miss or wrong label is a missed finding. Raw units retain every reviewed occurrence; the independent view collapses materially identical occurrences in the same connected employer/policy/context group and class.
- **Headline unit:** one complete posting after passage results, deterministic restrictions and extraction coverage are combined.
- **Operational job:** one complete request through the worker/service path. It is the unit for latency, timeout and memory reporting.

Percentages never replace counts. Every metric reports numerator, denominator, excluded records and posting count.

### 2.3 Processing and extraction completeness

The v2 result must return one block for every original request ID, in the same order.

- Screening status is `success`, `failed` or `unsupported`. Only `success` has a binary choice and probability.
- Routing is `relevant`, `uncertain` or `skip`.
- Interpretation status is `interpreted`, `skipped`, `failed` or `unsupported`. Only `interpreted` has the five answers and probabilities. Other statuses have a reason and no invented answers or confidence.
- Processing context counts classify each target once as `complete` or `missing`, based on its original group extents, gaps and declared boundaries. Verified `boundary` is complete context; either neighbor status `missing` makes the target context-missing.
- Processing is `complete` only when no target is context-missing and every target has a successful screen followed by either a successful interpretation after `relevant`/`uncertain` routing or a valid skip after `skip` routing. Any missing-context, failed or unsupported target makes processing `partial`.

A missing-context target is prechecked as screening `unsupported` and does not run model inference. A screening failure is not a confident negative. A failed or unsupported screen has no interpreted answers for that target, earns no retention credit when the target was quality-eligible, and makes overall processing `partial`.

Extraction completeness belongs to the captured posting and remains separate. Processing success cannot turn an incomplete extraction into a complete posting.

An ordinary `unclear` CPT/OPT label caused only by silence is a valid finding and can coexist with `No blocker found` on a complete, fully processed posting. Conflict, ambiguity requiring review, low-confidence non-`unclear` output, failed/unsupported interpretation, incomplete extraction or partial processing is unresolved and prevents `No blocker found`.

## 3. Gate registry

The registry below is the normative list for run registration. `Design` and `Task 6` gates must be satisfied before weight updates. `Calibration` gates are checked after candidate weights are locked. `Fresh test` gates are measured once on newly locked evidence. The exposed WTW case is a development regression and never contributes fresh-test counts.

| Gate ID | Phase | Requirement | Passing rule |
| --- | --- | --- | --- |
| `A-CONTRACT-01` | Design | Rubric, context format, v2 transport and projection agree with `DECISION_LOGIC.md` | Reviewed examples cover every relevance boundary, all five fields, each status and complete/partial behavior |
| `A-SPLIT-01` | Task 6 data | No employer, related vacancy, material policy family or original context crosses train/development/calibration/fresh-test splits | Zero audited cross-split groups; unresolved records excluded |
| `C-ID-01` | Task 6 | Exact original-ID accounting and honest processing status | 100% IDs exactly once and in order; zero malformed responses accepted; zero falsely `complete` jobs |
| `C-SAFETY-01` | Task 6 | Incomplete/partial work cannot imply absence | Zero `No blocker found` results when extraction is incomplete or v2 processing is partial |
| `C-LATENCY-01` | Task 6 | Runtime budget is measured and frozen before tuning | Fixed benchmark completed; registered warm-p95 limit is met by the implemented path |
| `E-CAL-01` | Calibration | Stage-specific calibration uses calibration data and deployed runtime settings only | Weights/questions already locked; parameters reproduce through worker/service; no calibration records update weights |
| `F-RET-01` | Fresh test | Relevant targets survive screening and reach interpretation | At least 98% routed retention and at least 98% usable retention, with failures counted as misses |
| `F-CRITICAL-01` | Fresh test | Critical negative evidence remains usable and is emitted correctly | Zero availability failures and zero exact-finding misses for explicit role-level sponsorship refusals or CPT/OPT exclusions |
| `F-PRECISION-01` | Fresh test | Emitted policy claims are supported | At least 98% supported claims among all emitted claim units |
| `F-RECALL-01` | Fresh test | Gold policy findings are actually emitted | At least 90% of gold policy-finding units correctly emitted |
| `F-SEVERE-01` | Fresh test | No severe unsupported claim | Zero severe errors in raw accepted passage claims and projected outputs |
| `F-NOPOLICY-01` | Fresh test | Complete no-policy postings remain useful | At least 90% receive the gold `No blocker found` headline; minimum 10 independent postings |
| `F-COVERAGE-01` | Fresh test | Denominators support the claims being made | At least 100 emitted claim units overall and required per-class support in Section 7 |
| `R-WTW-01` | Development regression | The three known WTW negatives stay harmless | All three targets produce no non-`unclear` sponsorship claim |

Passing every numerical gate is necessary for promotion consideration, not sufficient for automatic promotion. Owner approval, integration evidence, rollback and model identity verification remain separate.

## 4. Metric definitions

### 4.1 Relevant-target retention

For `F-RET-01`:

```text
denominator = all quality-eligible human-gold relevant target passages
numerator   = denominator targets with screening.status=success
              and route in {relevant, uncertain}
retention   = numerator / denominator
```

`failed`, `unsupported`, absent-result/ID, malformed or confidently skipped relevant targets are misses. Pre-registered missing-context operational challenges are outside this model-quality denominator. Failed and unsupported screens do not proceed to interpretation.

Report a second pipeline-availability measure:

```text
usable relevant targets = quality-eligible gold relevant targets with a valid route
                          and interpretation.status=interpreted
usable retention        = usable relevant targets / all quality-eligible gold relevant targets
```

Both routing retention and usable retention must be at least 98% for `F-RET-01`. The separate values show whether loss happened in screening or interpretation.

An **explicit refusal** is role-level text that directly refuses immigration visa sponsorship or requires applicants not to need it now or later. Citizenship, work authorization, export-control or clearance wording alone is not a sponsorship refusal. A **CPT/OPT exclusion** must directly name that program and apply to the role.

`F-CRITICAL-01` has two separately reported zero-tolerance checks:

- **availability failure:** a quality-eligible explicit refusal or named exclusion lacks a successful screen routed to a successful interpretation;
- **exact-finding miss:** the interpreted quality-eligible target does not emit the exact gold `unavailable`, `cpt: explicitly-excluded` or `opt: explicitly-excluded` finding after frozen confidence/abstention rules.

The first isolates evidence loss; the second isolates interpretation/abstention failure. Both must be zero.

### 4.2 Supported-claim precision

For `F-PRECISION-01`, score every raw accepted passage claim before headline aggregation. A claim still counts when a conflict later yields `Could not verify`, when the UI hides it, or when another passage supplies the correct answer.

```text
denominator = all emitted non-unclear sponsorship, CPT and OPT claim units
numerator   = denominator claims semantically supported by reviewed gold evidence
precision   = numerator / denominator
```

A claim is supported only when all applicable conditions hold:

1. Its source ID resolves to the original target evidence and any cited condition is preserved.
2. The target, read with only its real original neighbors, semantically supports the predicted field label.
3. A definitive sponsorship/CPT/OPT policy has gold `scope=role`; a question, company statement, historical statement, other-role policy or unrelated target cannot be promoted to current-role policy.
4. Explicit timing matches the evidence. Timing is never inferred.
5. CPT and OPT are evaluated independently, and neither establishes visa sponsorship.

Source binding and semantic support are separate report fields. A quote that exists in the posting passes source binding but can still fail semantic support.

Citation reconstruction may copy original evidence; the model does not author a quote. A claim whose support depends on omitted condition text is unsupported even if the short quote matches exactly.

If no claims are emitted, precision is `null` and the gate is insufficient, not 100%. `F-COVERAGE-01`, `F-RECALL-01` and `F-NOPOLICY-01` prevent blanket abstention from passing.

### 4.3 Gold-finding recall

For `F-RECALL-01`:

```text
denominator = every quality-eligible human-gold role-level non-unclear
              sponsorship, CPT and OPT field
numerator   = denominator findings emitted with the exact field label,
              correct scope and correct explicit timing where applicable
recall      = numerator / denominator
```

`unclear`, abstained, screened out, skipped, failed, unsupported, absent-result/ID and wrong-label outputs are misses. Pre-registered missing-context operational challenges remain outside this model-quality denominator under Section 4.7. Compute recall twice:

- **raw recall:** every reviewed gold occurrence remains in the denominator;
- **group-deduplicated recall:** materially identical occurrences in the same connected employer/policy/context group and class contribute once.

Both pooled measures must be at least 90%. Report both raw and group-deduplicated recall separately for each consequential class; a pooled score never turns an absent or weak class into a pass.

### 4.4 Severe errors

`F-SEVERE-01` requires zero observed severe errors. A severe error is any of:

- an unsupported statement that sponsorship is `available`;
- an unsupported statement that sponsorship is `conditional`;
- an unsupported statement that sponsorship is `unavailable`;
- an unsupported CPT or OPT exclusion;
- transfer of a question, company, historical, other-role or unrelated passage into a current-role policy claim;
- invented or omitted timing/condition that materially changes eligibility;
- a `No blocker found` headline despite incomplete extraction, partial processing, an explicit blocker, or unresolved conflict/review state;
- a falsely complete response caused by missing, duplicate, unexpected or out-of-order IDs.

The 98% precision gate covers all emitted policy claims. The zero-severe gate is stricter for the subset most likely to change a user's decision. A run can meet 98% precision and still fail because its one unsupported claim is severe.

Every severe error is listed individually with posting ID, target ID, raw screen result, raw interpretation, citations, gold labels, projected headline and cause category.

### 4.5 No-policy usefulness

`F-NOPOLICY-01` uses only independently reviewed postings that have:

- complete extraction for the declared evidence boundary;
- no explicit role-level sponsorship statement;
- no explicit CPT/OPT acceptance or exclusion;
- no mandatory deterministic restriction or other explicit blocker;
- no evidence conflict or ambiguity requiring review.

Their gold headline is `No blocker found`. Ordinary field-level `unclear` caused by silence is expected. `Could not verify`, `Sponsorship stated` and `Explicit blocker found` are incorrect for this subset. A runtime failure or partial processing therefore counts as an incorrect `Could not verify`; it cannot remove the posting from the denominator. The minimum 10 postings must come from 10 distinct connected employer/policy/context groups. At least 9 of 10 must be correct; if more are collected, use the full frozen denominator and require at least 90%.

Report headline confusion across all fresh-test postings as a descriptive companion measure. The no-policy subset cannot be selected after predictions are viewed.

### 4.6 Five-field descriptive metrics

Report the following on every gold target that receives interpretation and again on all gold targets with non-interpretation counted as incorrect:

- exact accuracy for each of scope, sponsorship, timing, CPT and OPT;
- support, predicted count, precision and recall for every label in each field;
- a confusion matrix for each field;
- all-five-fields exact passage agreement;
- counts of `skipped`, `failed`, `unsupported` and abstained results by gold label;
- confidence distributions and calibration error by field and class.

Scope classes `role`, `question`, `historical`, `company`, `other-role` and `none`, and timing classes `now`, `future`, `now-and-future` and `unspecified`, must all appear explicitly in the report. A zero-support class is `untested`, never perfect. These descriptive metrics diagnose the pipeline; they do not override the normative claim, retention, safety and usefulness gates.

### 4.7 Operational challenge set

Report missing-context, oversized and deliberately unsupported targets separately. They pass their engineering behavior only when they return the registered unsupported reason, have no invented answers/probabilities, make processing partial, and cannot produce `No blocker found` from absence. Any independently supported deterministic detail may remain visible with the incomplete-processing qualification. These targets do not enter retention, finding-recall or class-support denominators, and their omission and counts must be explicit.

## 5. Structural and headline checks

For every request, compare the ordered request-ID list with the ordered response-ID list. Missing, duplicate, unexpected or reordered IDs invalidate the response. The parser must reject it and the job must not be marked complete.

`C-ID-01` records:

- requested, returned, interpreted, skipped, failed and unsupported counts;
- complete-context and missing-context counts, summing to the request count;
- exact-order equality;
- reason codes for every non-interpreted target;
- whether answer/probability fields were absent from skip/error states;
- whether top-level counts match recomputation from block results.

`C-SAFETY-01` covers both deterministic fixtures and complete integration requests. Partial processing or incomplete extraction yields `Could not verify`, while any independently supported blocker/detail may remain visible with a qualification. A low-confidence non-`unclear` CPT/OPT result, conflict or ambiguity requiring review also prevents `No blocker found`. Silence-only `unclear` does not.

Projection must preserve time-specific findings. Differing current and future answers do not automatically become `conditional`; only a genuine explicit sponsorship condition or exception does.

## 6. Known-regression gate

WTW posting `202605435` is exposed development evidence. It is never fresh test or calibration data. `R-WTW-01` evaluates these original IDs separately:

| Target | Gold screening | Required policy result |
| --- | --- | --- |
| `wtw-04` diversity/equal-opportunity paragraph | `irrelevant` | no `available`, `unavailable` or `conditional` sponsorship claim |
| `wtw-22` closing date | `irrelevant` | no `available`, `unavailable` or `conditional` sponsorship claim |
| `wtw-29` offer/onboarding heading | `irrelevant` | no `available`, `unavailable` or `conditional` sponsorship claim |

The preferred path is a confident irrelevant screen and valid skip. An uncertain route followed by a successful role-safe interpretation with `sponsorship=unclear` avoids the known harmful claim but still records the screening error. A failed or unsupported status does not pass merely because it emitted no claim. All three must finish through a valid skip or successful unclear interpretation and avoid unsupported policy claims individually; a final `Could not verify` does not rescue a bad passage result.

## 7. Minimum evidence and class coverage

Fresh-test readiness requires at least 100 emitted claim units in the `F-PRECISION-01` denominator. Accepted claims from otherwise partial postings remain in precision scoring; an uncertain headline cannot hide them.

Each consequential gold class below requires at least 20 distinct quality-eligible target passages across at least five postings and at least five connected employer/policy/context groups:

- sponsorship `available`
- sponsorship `unavailable`
- sponsorship `conditional`
- CPT `explicitly-accepted`
- CPT `explicitly-excluded`
- OPT `explicitly-accepted`
- OPT `explicitly-excluded`

For a class count, materially copied policy text contributes once per policy family, and at most one occurrence of the same policy per posting contributes. A target may support both CPT and OPT and count once in each applicable class. Employer, related-vacancy, policy-family and context grouping still governs independence.

The fresh-test collection target of 20–30 postings is only an initial estimate. Expand it until every required class and the 10-posting no-policy subset are present. If a required class remains below support, its gate is `insufficient`; do not infer readiness from the pooled result.

Report support for every scope and timing class even though they do not share the 20-target promotion minimum. Any product claim about a specific scope or timing class requires adequate independent support stated in the evaluation report.

These minimums limit obviously weak conclusions; they do not prove reliability.

## 8. Statistical reporting

Use connected-group-clustered uncertainty because passages and claims can remain correlated across vacancies from the same employer, materially copied policy family or shared original context. The cluster is the highest connected employer/policy/context group in the frozen membership ledger and is never narrower than one posting.

For retention, claim precision, finding recall, no-policy usefulness and headline accuracy:

1. Compute the point estimate from all eligible frozen units.
2. Resample connected groups with replacement, retaining all their postings, passages and claims together.
3. Use a registered deterministic seed and at least 10,000 cluster-bootstrap replicates.
4. Report the two-sided 95% percentile interval with the point estimate and raw counts.
5. If stratified resampling is needed to preserve rare registered classes, specify strata before predictions are opened and use the same method for all compared systems.

Gates use the observed point and minimum-support rules. Intervals show uncertainty; they are not silently substituted for the registered threshold after results are known.

For zero severe events, also report a one-sided 95% upper bound on the probability that an independent connected group with at least one severe-error opportunity contains a severe error. Use the independent group count, not raw claims or postings. Under the registered exact binomial group-level method, zero events in `n` independent groups has upper bound `1 - 0.05^(1/n)`. With few groups this bound will remain wide even after observing zero errors.

A zero denominator, failed bootstrap or unsupported class returns `null`/`insufficient`, never 0% or 100% by convention.

## 9. Split, review and exposure protocol

- Training and development data may be viewed during design and candidate selection.
- WTW and the previously viewed 12-passage test are exposed historical/development benchmarks only.
- Calibration data may tune temperatures, screening thresholds, interpretation abstention and routing parameters only after weights and questions are locked. It never updates weights or decision rules.
- Fresh-test employers, related vacancies, policy families and original context must be absent from training, development and calibration.
- Human reviewers label the fresh evidence and resolve disagreements before model predictions are opened. The frozen gold, membership ledger, rubric version, context version and dataset hashes are recorded first.
- The training/candidate-selection owner must not inspect fresh-test labels or predictions before the run configuration, model hashes, questions, calibration parameters, thresholds and evaluator version are registered.
- Run the fixed comparison once. A failure turns that test into exposed development evidence. Any later tuned candidate requires a newly collected and locked fresh test.
- Authored fixtures verify engineering behavior only. They never contribute accuracy, precision, recall, class support or statistical intervals.

## 10. Fixed comparison and runtime benchmark

### 10.1 Accuracy comparison

Register these four rows before opening fresh-test results:

1. deterministic decision rules;
2. the October 9 experimental interpreter;
3. the newly trained interpreter with screening bypassed so every target is interpreted;
4. the complete calibrated two-stage pipeline.

Use identical frozen posting inputs wherever the system supports the metric. Mark non-applicable fields rather than inventing values for the deterministic baseline. The comparison separates training improvement from screening effects.

### 10.2 Task 6 benchmark protocol

Task 6 must establish and register the numerical runtime limit before tuning or training. Measure on the intended local deployment hardware without inventing a machine profile in advance.

Record hardware model, memory, operating system, accelerator, Python/PyTorch versions, precision, batch size, source revision, checkpoint hash, question/context hashes, service timeout and benchmark-input hash.

Use the same frozen complete-posting inputs for the current v1 worker and v2 path. Include small, medium and large passage counts. For the v2 worst-case profile, run screening and force every target through interpretation without replacing original neighbors. This is a latency profile, not an accuracy result.

- **Warm:** load once, perform an untimed warm-up, bypass result caches, then record at least 30 complete operational jobs per compared model path. Report median, p95 and maximum end-to-end time.
- **Cold:** use fresh worker processes, record model-load-to-ready time and first-job time for each start, and report every observation plus median and maximum. Do not label a small cold-start sample as a reliable p95.
- **Memory:** record resident memory before load, after load and peak during the all-forward job. Report model/worker exits and out-of-memory events.
- **Failures:** report timeout, malformed, partial and unsupported counts separately from latency; failed jobs never disappear from the sample.

The warm full two-stage p95 limit is fixed as both:

```text
v2 warm p95 <= 2.0 * measured v1 warm p95
v2 warm p95 < 150,000 ms current worker response timeout
```

The current timeout comes from `server/decision-service.ts`; task 6 must re-read and register the actual configured value rather than assume it remains unchanged. Cold-start and peak-memory acceptance limits must be chosen from the intended hardware measurements and operating margin, documented, and frozen before tuning. This document does not invent those values.

## 11. Later run-registration and report shape

Every candidate run pins this document's SHA-256 and a machine-readable gate registry copied without changing definitions. Each gate record contains:

```json
{
  "gateId": "F-PRECISION-01",
  "definitionVersion": "2026-10-10",
  "split": "fresh-test",
  "unit": "emitted-policy-claim",
  "numerator": null,
  "denominator": null,
  "pointEstimate": null,
  "interval95GroupClustered": null,
  "operator": ">=",
  "threshold": 0.98,
  "minimumSupport": 100,
  "status": "unmeasured",
  "evidence": []
}
```

Use `pass`, `fail`, `insufficient` or `unmeasured`. Record counts as integers and derive rates; do not store only rounded percentages. Evidence paths include the frozen manifest, raw predictions, scoring output, human review and comparison report.

Hypothetical reporting example only: 201 supported claims out of 204 emitted claims gives 98.53% point precision. It passes the point threshold only if class support, recall, severe-error, split and all other gates also pass. These are illustrative numbers, not a measured result.

## 12. Advancement rule

Before training, the coordinator signs off `A-CONTRACT-01`, `A-SPLIT-01`, `C-ID-01`, `C-SAFETY-01` and `C-LATENCY-01` using design, fixture, implementation and benchmark evidence. No model-quality gate is claimed from these checks.

After candidate weights are locked, calibration must pass `E-CAL-01`. The single fresh-test run then evaluates every `F-*` gate and the fixed comparison. `R-WTW-01` must also pass as an exposed regression.

Any failed or insufficient fresh-test gate blocks promotion. Remediation occurs on training/development evidence, followed by a newly frozen test for another claim of independent evaluation. Passing does not change the default model without explicit owner approval.
