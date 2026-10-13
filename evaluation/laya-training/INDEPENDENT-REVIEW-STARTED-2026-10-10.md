# Independent contextual-data review — started, not approved

> Completed October 12, 2026. The consolidated decision is in `independent-review-2026-10-10/FINAL-INDEPENDENT-REVIEW.md`: independent AI review complete, corpus not approved for training.

Date: October 10, 2026. Reviewer: current orchestrator, separate from the dataset assembly code. This is an AI review, not a claimed human signature.

## Scope and owner confirmation

The owner stated in this conversation: “I have reviewed the postings and they are real for item 2.” Accept this as owner confirmation of authenticity for the supplied posting corpus. Detailed per-record source URLs/captures remain optional under the recorded waiver. Authenticity does not establish correct labels, exact preservation of a previously captured passage, complete extraction, independence or sufficient evaluation support.

Reviewed snapshot: `contextual-v1-2026-10-10/manifest.json`, SHA-256 `1331e76b52aad385746181233801b702c26df43d8afabada011ca228b44d37ec`. Training file SHA-256 `e8d0281d1375c0b1193e16af318efe0b38e99871a1b91f3b744ea75b8cbd3d72`.

Frozen files have not been rewritten. This supplementary review supersedes any suggestion that their generated approval flags are sufficient evidence of independent review. The manifest's `trainingRunApproved: true` is not permission from this review to start training.

## What was actually reviewed

- Inspected all 167 training, 81 development and 54 calibration target texts and their gold labels; examined actual neighbors and role metadata for the findings below. This is a first-pass semantic review, not a completed per-record second-party approval ledger.
- Compared the 31 contextual WTW target IDs/texts with the saved original worker request.
- Ran both dataset validators and the design verifier before starting edits: all passed. Those checks establish structural/hash consistency, not semantic accuracy.
- Inspected assembly code that writes independent-review and exposure claims. It unconditionally sets `independentReviewPassed: true` and generates textual assertions; no reviewer signature or separate adjudication input is consumed.
- Frozen `questions.json` snapshots abbreviated interpretation prompts rather than the actual runtime `instructions`/`criteria`. A new version must pin exact model-facing questions and prove export/inference parity before training; the frozen JSON hash alone does not establish this.
- Fresh-test label counts were previously exposed during the readiness check. No fresh-test model predictions or optimizer runs have been performed. Fresh individual annotations are not used here to choose training settings. A separate reviewer should handle final fresh-gold approval and record actual exposure events, not infer blinding merely from “no optimizer training.”

## Blocking label findings and required adjudication

| Record | Finding | Proposed action |
| --- | --- | --- |
| `ctx-tra-078` | TARGET offers sponsorship; immediate NEXT says “Provided that the candidate holds active F-1 student status with school authorization.” Gold is unconditional `available`. | Change to `conditional` in a new version; preserve the condition and leave CPT/OPT unclear. |
| `ctx-tra-154` | “We can only sponsor candidates who currently hold valid work visas.” Gold is `available / now`. “Currently” describes status, not the timing of sponsorship. | `conditional / unspecified`; do not transfer NEXT's future refusal into TARGET timing. Keep the future refusal as a separate finding. |
| `ctx-tra-135` | TARGET contrasts London offers with “but not for U.S. intern postings.” Named role is a U.S. software intern. Gold `other-role / unclear` drops the applicable refusal. | Split London and U.S. clauses when feasible; current-role clause is `role / unavailable / unspecified`. Keep London as other-role context. |
| `ctx-tra-066` | “Exceptions to the above requirement...” directly follows a coursework requirement, not a sponsorship policy. Gold invents conditional sponsorship from a more distant paragraph. | For the supplied immediate context: `irrelevant / role / unclear / unspecified`, CPT/OPT unclear; do not jump across intervening qualifications. |
| `ctx-tra-086` | Exception describes university co-op students with pre-existing work authorization. No visa sponsorship provision is stated in TARGET or its immediate neighbor. | Remove `conditional` sponsorship; use `unclear` unless a reviewed contextual revision explicitly establishes visa provision. Relevance can remain relevant. |
| `ctx-tra-076` | An academic-exchange exception references a restriction but immediate PREVIOUS is an ordinary skill preference. Gold assumes an immigration sponsorship offer. | Adjudicate the actual antecedent. With current supplied neighbors sponsorship is `unclear`, not proven conditional provision. Preserve text; do not invent longer context. |
| `ctx-tra-059` | Exceptions to an already positive sponsorship policy require counsel approval. Gold treats approval of unspecified exceptions as a conditional offer. | Adjudicate what the exception changes; absent explicit conditional provision, sponsorship is `unclear` for this target. Do not infer that every exception is an offer. |
| `ctx-tra-150`, `ctx-tra-151`, `ctx-tra-152` | Global talent, relocation consultation and international career mobility are marked immigration-relevant without explicit immigration/authorization content. | Apply screening rubric to each TARGET; ordinary relocation/career mobility does not automatically mean work-visa policy. Relabel or record evidence supporting relevance. |
| `ctx-tra-018`, `ctx-tra-020`, `ctx-tra-023`, `ctx-tra-028`, `ctx-tra-041`, `ctx-tra-045`, `ctx-tra-049` | Hiring conditions such as mandatory checks, application limits and reapplication eligibility are labeled scope `none`; analogous qualifications elsewhere use `role`. | Normalize scope using the authoritative definition: hiring/eligibility policy for this vacancy is `role`, even when immigration-irrelevant. Sponsorship remains unclear. |
| `ctx-dev-010`, `ctx-dev-011`, `ctx-dev-012`, `ctx-dev-016`, `ctx-cal-054` | Skill/qualification requirements labeled `none` while other qualifications use `role`. | Review qualification scope consistently. Do not change immigration relevance merely because scope becomes role. |

These are proposed gold corrections, not committed label changes. Some co-reference cases require owner/second-party adjudication. Review remaining references, exceptions, general-company policies and delayed-conversion statements for the same failure pattern; do not assume the above list is exhaustive.

## Original WTW preservation finding

All 31 contextual IDs exist in the original request, but only five target texts match exactly. Twenty-six differ: `wtw-01`, `wtw-02`, `wtw-06` through `wtw-21`, `wtw-24` through `wtw-31`. In particular original `wtw-28` is “Stage 4: A virtual assessment centre, where you’ll get to meet members of the team”; contextual `wtw-28` is “Stage 5: Offer and onboarding.” This changes source-ID binding, not just punctuation.

This does not contradict the owner's authenticity confirmation. It means this dataset is not an exact reconstruction of the saved WTW regression input despite the generator's claim. Use the saved request as authoritative for WTW regression. In a new dataset version restore exact original texts/order/neighbors and re-review labels; do not overwrite the frozen corpus or claim the altered passages are exact historical evidence.

## Required outputs to finish independent review

1. New-version correction ledger with each record ID, old/new six-field gold, reason, exact evidence hashes and reviewer identity.
2. Actual second-party per-record review outcomes: accept/change/disagreement, with a separate adjudicator resolving every disagreement before freezing.
3. Employer/related-vacancy/policy/context connected-group audit based on real relationships and copied material; different employer strings alone are not independence.
4. Private fresh-gold review by someone outside training/candidate selection, with truthful exposure ledger and no model predictions.
5. Updated coverage support after adjudication. Quotas based on incorrect labels are not satisfied.
6. New versioned manifest and review report that derives approval from completed review evidence. Leave old corpus and approval claims intact as historical artifacts, but label them superseded in the new handoff.

Status: **review started; semantic corrections/adjudication required; not approved for training**. Owner confirmation resolves the authenticity question only. Human independent sign-off remains pending unless actual evidence of that sign-off is supplied.
