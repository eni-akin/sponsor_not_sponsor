# Independent cross-adjudication

Date: October 12, 2026 (America/Chicago). Reviewer: **independent AI adjudicator `/root/cross_adjudication`**, separate from corpus assembly and the initial reviewers. This is disclosed adjudication after reading original labels and reviewer proposals, not a blind review or human signature.

The nine requested records resolve to **1 accept, 6 change, 2 exclude**. Seven have complete six-field decisions suitable for consideration in a new gold version; two must remain outside frozen gold until their reference context is repaired. The frozen corpus was not edited. This review does not authorize training.

| Record | Disposition | Final relevance / scope / sponsorship | Evidence and decision |
| --- | --- | --- | --- |
| `ctx-tra-059` | Change | relevant / role / unclear | “Exceptions to this policy” follows an existing offer. Requiring counsel approval of unspecified exceptions does not itself promise sponsorship under an exception. |
| `ctx-tra-061` | Exclude | unresolved / role / unclear | “The above policy” follows a skills qualification. The sponsorship policy is outside the immediate context; neither relevant nor irrelevant is secure gold. |
| `ctx-tra-076` | Exclude | unresolved / role / unclear | “This restriction” follows a desirable skill, not the restriction. Academic exchange alone does not identify an immigration policy or sponsorship provision. |
| `ctx-tra-081` | Accept | relevant / role / unclear | Federal immigration guidelines establish relevance. A warning that unspecified provisions may change establishes neither an offer nor a refusal; the conservative original labels stand. |
| `ctx-tra-086` | Change | relevant / role / unclear | Pre-existing work authorization establishes relevant role eligibility. Unspecified exceptions for authorized co-op students do not establish employer sponsorship or explicit CPT/OPT acceptance. |
| `ctx-tra-116` | Change | relevant / company / unclear | “Select positions” does not establish this internship's inclusion in the general sponsorship policy. |
| `ctx-cal-030` | Change | relevant / company / unclear | “Eligible appointments” restricts the appointment category. Neither the target nor its neighbors establishes this internship's eligibility, so even the reviewer’s conditional role label would overclaim. |
| `ctx-cal-051` | Change | irrelevant / role / unclear | Welcoming applicants from all educational backgrounds is a concrete ordinary applicant-eligibility statement, beyond the opening diversity prose. |
| `ctx-cal-054` | Change | irrelevant / role / unclear | Required Vivado/Verilog experience is an ordinary role qualification. It does not inherit the adjacent U.S.-person requirement. |

All nine use timing `unspecified`, CPT `unclear` and OPT `unclear`. The [JSON ledger](cross-adjudication.json) preserves original labels, exact reviewer proposals and reasons, final fields, target and original neighbor snapshots, applicability/context limits, and SHA-256 digests of all 19 reviewed input artifacts. Approved changes affect scope in four rows and sponsorship in four rows; no approved relevance, timing, CPT or OPT change is made.

The rulings follow [DECISION_LOGIC.md](../../../DECISION_LOGIC.md), particularly the target evidence boundary and requirement that only role-level passages establish definitive sponsorship. The [screening/context contract](../TWO-STAGE-SCREENING-CONTEXT-2026-10-10.md) requires actual immediate neighbors and excludes unresolved gold. Its [authored fixtures](../two-stage-contract-2026-10-10/screening-context-fixtures.json) distinguish generic company eligibility (`screen-context-012`), explicit sponsorship exceptions (`screen-context-032`), and an unresolved reference (`review-hold-001`).

Both excluded targets have structurally present neighbors; their semantic antecedents are still unavailable within the model's triplet. The JSON therefore uses `null` for their unresolved final relevance. It is an audit marker, never a third relevance label or exportable gold. The supplied conservative five interpretation values must not be used to bypass their exclusion.

By contrast, `ctx-tra-081` and `ctx-tra-086` explicitly contain immigration/work-authorization content and support conservative six-field labels without resolving their distant references. Acceptance does not resolve those policies or permit a sponsorship claim. `ctx-cal-054` has enough local context for its self-contained target, while its posting remains incomplete because position 1 is absent.

Validation passed: all nine IDs appear exactly once; original and proposed labels match their sources; seven retained records have six legal labels; only the two excluded records have null relevance. All nine target bindings, 12 present-neighbor bindings and six boundary declarations match the source postings. Counts and field-change totals agree, and all 19 input-artifact hashes remain unchanged.

No fresh-test gold or fresh-test review artifacts were inspected; only the eight postings associated with these nine records were semantically reviewed. No model predictions, checkpoint, training, calibration, runtime changes or live-source recapture were used. Live authenticity and full extraction completeness were not independently checked; the two exclusions require reviewed context repair before inclusion.
