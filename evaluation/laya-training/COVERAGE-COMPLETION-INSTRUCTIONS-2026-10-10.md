# Coverage completion — standalone collection and review instructions

You are preparing evaluation data for Sponsor Not Sponsor, a browser extension that reports explicit sponsorship/CPT/OPT evidence for a named job. Repository: `/Users/eniola/Documents/Project/Sponsor_Not_Sponsor`. Do not train, calibrate, open fresh-test model predictions, promote a checkpoint, or overwrite frozen datasets while performing this assignment.

## 1. Read the rules and protect existing evidence

Read `DECISION_LOGIC.md`, `TWO-STAGE-SCREENING-CONTEXT-2026-10-10.md`, `TWO-STAGE-ACCEPTANCE-2026-10-10.md`, the standalone task 6 brief and `INDEPENDENT-REVIEW-STARTED-2026-10-10.md` under `evaluation/laya-training/`. Inspect Git status and applicable repository instructions first. Preserve unrelated changes and the frozen `contextual-v1-2026-10-10` directory.

Continue from `contextual-v2-2026-10-12`, the generated candidate built by `scripts/build_contextual_v2.py`; do not create a competing v2 directory. Its manifest is `candidate`, training not approved. Add evidence through reviewed source inputs and the builder rather than hand-editing generated JSON. The owner has confirmed existing postings are real. Do not demand waived per-record URL/capture fields. Still require exact original text, role identity, honest completeness, context, labels, grouping, review outcomes and dataset-level hashes. A hash does not prove a label correct.

## 2. Establish the current shortfall

After review exclusions and copied-policy withholding, contextual v2 has these eligible candidate counts:

| Consequential class | Current raw count | Minimum qualifying support | Minimum additional class memberships |
| --- | ---: | ---: | ---: |
| Sponsorship available | 2 | 20 | 18 |
| Sponsorship unavailable | 5 | 20 | 15 |
| Sponsorship conditional | 2 | 20 | 18 |
| CPT accepted | 1 | 20 | 19 |
| CPT excluded | 2 | 20 | 18 |
| OPT accepted | 1 | 20 | 19 |
| OPT excluded | 2 | 20 | 18 |

Every class also requires at least five postings and five independent connected employer/policy/context groups. The 20 targets must survive the rules below; 20 copied paragraphs do not count. The listed deficits total 124 class memberships, not necessarily 124 paragraphs or jobs: one direct CPT-and-OPT acceptance may contribute once to each class. Conversely, one sponsorship target cannot be both available and unavailable.

The current 25-posting count is not enough by itself. Continue collection until actual qualifying counts pass; the original 20–30 job target was an estimate, not a gate.

## 3. Assign splits before looking at model outputs

Have a collector/reviewer outside model implementation/candidate selection own the fresh pool. They may label gold but must not show individual fresh gold to the training owner. Share only aggregate deficits and readiness status. Keep private files outside routine training searches and exports; repo folder names alone are not access control. Record actual exposure events, including who saw what, purpose and whether labels/predictions were visible. No training exposure is not equivalent to no design/tuning exposure.

Audit employer aliases, parent/subsidiary relationships, copied policy families, related vacancies and shared original contexts. Form connected components: if any employer, copied-policy or original-context connection links two records, the entire connected group goes into one split. A component crossing existing train/dev/cal cannot become fresh. Existing WTW and the viewed historical 12 passages remain exposed regression/development evidence.

Check new candidates against historical as well as current split membership. Resolve discovered leakage in a new version with an explicit change ledger; never silently rewrite the old split history. Do not quarantine independent passages simply because ordinary short industry wording overlaps.

## 4. Collect real policy evidence broadly

Search across the public web without `site:` filters, platform allowlists or employer-domain restrictions. Greenhouse, Lever and Ashby are examples, not requirements. Search concepts such as sponsorship available for this position, sponsorship may be considered, CPT applicants welcome, OPT candidates eligible, CPT not accepted, and OPT holders not eligible. Search for both student-program acceptance and explicit exclusion independently; a generic no-sponsorship statement is not automatically a CPT/OPT exclusion.

For each candidate, read the whole named vacancy, not only a search snippet. Preserve its original block order and immediate neighbors. Capture public question wording where relevant but exclude entered applicant answers, resumes, uploaded files, account identifiers and private form state. Record known missing text honestly.

Do not manufacture employers, expand a sentence into many paraphrases, clone templates under different names, replace missing neighbors, or turn a company-wide/historical policy into current-role policy. No-policy jobs require complete reviewed vacancy evidence; do not infer no policy from an excerpt or failure to fetch the rest.

## 5. Label all six tasks using the actual target

- Relevance: immigration sponsorship/visa/employment authorization/CPT/OPT or citizenship/residency/U.S.-person/export/clearance eligibility, including explicit references resolved by actual neighbors. Ordinary qualifications, event sponsorship and onboarding remain irrelevant. An unrelated target does not inherit relevance from a neighbor.
- Scope: role/question/historical/company/other-role/none. Role applies to hiring/eligibility conditions even when immigration-irrelevant. Only role can establish definitive sponsorship/CPT/OPT.
- Sponsorship: available/unavailable/conditional/unclear. Conditional requires stated provision under conditions; needing no sponsorship is unavailable, not conditional. Work authorization or citizenship alone is unclear sponsorship.
- Timing: now/future/now-and-future/unspecified. Current visa status does not imply current sponsorship. Preserve distinct current/future policies as separate target facts.
- CPT/OPT: explicitly-accepted/explicitly-excluded/unclear independently. Direct statements only; mention as a status example, a question or visa refusal alone is unclear. Pre-OPT uses OPT. Acceptance does not establish visa sponsorship.

Read adjacent conditions before labeling an apparent unconditional offer. Resolve explicit references only when the supplied original neighbors establish the antecedent. Do not jump past a skills paragraph to attach a remote exception. Split combined question/policy and mixed current-role/other-role text where feasible while retaining original source binding.

## 6. Count only qualifying support

For each consequential class, record target IDs, posting IDs, connected-group IDs and materially copied-policy fingerprints. A qualifying target must have correct adjudicated role gold, complete immediate context with no `missing` neighbor, valid input types/size and verified tokenizer support under the registered runtime. Deliberate gaps, oversized text and unsupported inputs belong to operational challenges, not quality denominators.

Count materially copied policy once per family; count the same policy at most once per posting. Different wording of the same source policy is not automatically independent. Report both raw and deduplicated support; use the deduplicated eligible count for the class gate. One target can count once for CPT and once for OPT if it explicitly covers both.

Maintain at least ten complete no-policy postings across ten independent connected groups. Include unrelated ordinary negatives and policy-adjacent negatives; missing/failed evidence is not a no-policy example. Report every scope and timing class, including absent classes as untested. Add company/historical/other-role/question and nuanced timing coverage where currently missing; do not invent a universal numerical gate not present in the acceptance specification.

## 7. Improve training, development and calibration coverage too

Do not fill only the test pool. Current development has seven relevant targets, no CPT/OPT exclusions, and very limited scope/timing diversity. Calibration has six relevant targets, no conditional sponsorship and no CPT/OPT exclusions. Training is also sparse for CPT/OPT and contains the pending label issues in the independent review.

Collect different, split-disjoint groups for these pools. Development must support candidate selection and challenge diagnostics. Calibration must support estimation and routing/abstention for both stages and consequential labels under actual runtime batching, precision and context. Determine/report uncertainty and insufficiency honestly; do not import fresh gold to repair missing calibration classes. There is no agreed universal “20 per class” calibration/training gate: propose adequate support and freeze the protocol before tuning, rather than silently treating missing classes as calibrated.

After corrections, recheck the original training buckets: at least 40 ordinary negatives, 20 context-sensitive cases, 10 genuine role-level conditional policies and 10 historical/other-role cases. These remain starting quotas, not proof of readiness. Correcting gold may reduce previously claimed counts.

## 8. Independent review and adjudication

The primary annotator supplies six labels and a rationale tied to exact TARGET and necessary context. A separate reviewer labels before seeing the primary labels where possible. Record both annotations, disagreements, final decision, rationale, reviewer identity and evidence hashes. Unresolved disputes stay pending/excluded with a reason; never generate a `passed` flag merely because the files exist.

Restore WTW regression from the exact saved original request in the new development version; 26 current contextual target texts differ from that saved request. Re-review scope and context after restoring. Keep any other owner-approved capture explicitly distinct if it is genuinely a separate capture.

Fresh review remains private and prediction-blind. The review is semantic: existence of a quote, matching hash and a valid enum do not prove correct interpretation.

## 9. Required deliverables and checks

Deliver a new versioned directory with train/development/calibration/fresh-test splits, original posting evidence, connected-group membership ledger, coverage/exclusion/exposure ledgers, question/context snapshots, record-level review/adjudication ledger and a manifest pinning every artifact. Preserve old corpus as historical. Do not label a draft frozen or approved until review and validation pass.

Snapshot the actual `decisionQuestions` object from `server/decision-questions.ts`, including every `type`, full `instructions`, ordered `criteria` and class descriptions, plus the runtime context definition and routing parameters. The old corpus's interpretation prompts are abbreviations, not an exact runtime-question snapshot. Record and verify the same model-facing question/state bytes at training export and inference; a file hash alone does not establish that parity.

Provide `COVERAGE-READINESS.json` and a short Markdown report containing:

1. Seven class rows: raw, eligible, deduplicated targets, postings, independent groups, remaining deficits and pass/insufficient.
2. No-policy count and distinct connected groups; all scope/timing support; operational challenges separately.
3. Train quotas after adjudication; development/calibration support and unresolved limitations.
4. Exact duplicate/related-employer/policy-family audit, split leakage results and exposure status.
5. Review totals, disagreements resolved/unresolved, exact artifact hashes and validator commands/results.

Run the new corpus validator against the new directory (read its `--help`; do not regenerate old artifacts), then historical validator, context parity tests and optimizer-export rejection tests. Export optimizer inputs only from the approved training split; do not include dev/cal/test gold. Keep fresh-test inputs/gold out of ordinary diagnostics and benchmark scripts.

Structural collection readiness requires all seven minimum-support rows plus the ten-group no-policy subset and completed independent review. Later, the actual frozen evaluation must also produce at least **100 emitted policy claims** for the precision denominator. This cannot be guaranteed by gold counts: prepare ample correctly labeled policy opportunities, then evaluate once. If the model emits fewer than 100, report insufficient rather than forcing predictions or relaxing thresholds after seeing results.

After training/calibration, the locked evaluation must meet retention >=98%, supported claims >=98%, raw and deduplicated finding recall >=90%, no-policy usefulness >=90%, zero critical finding misses and zero severe unsupported claims. Use registered connected-group intervals with >=10,000 bootstrap replicates. Collection support is necessary, not a prediction of those results.

Stop before training and deliver a truthful readiness report. Never declare the model production-ready because coverage quotas were met.
