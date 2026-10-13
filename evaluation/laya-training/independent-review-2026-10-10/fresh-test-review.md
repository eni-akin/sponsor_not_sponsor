# Fresh-test independent review — not ready to freeze

Review completed: October 12, 2026. Requested artifact namespace: `independent-review-2026-10-10`.
Reviewer: Codex subagent `/root/blind_fresh_review`, separate from training/candidate selection. This is an independent AI semantic review, not a human signature.

## Decision

Do not freeze or approve this fresh test for model-quality evaluation. The review accounts for all **141 targets and 25 postings exactly once**, but identifies pending corrections/adjudication, operational input defects, unestablished capture completeness, two cross-split copied-policy candidates, and insufficient support in every consequential class.

The owner's confirmation that the postings are authentic is accepted. It does not establish exact original-block preservation, complete extraction, label correctness or independent policy families. The recorded waiver keeps detailed source URLs/captures optional; this review does not demand a new capture merely to re-prove authenticity.

## Blind protocol and exposure record

All five required contracts/review notes were read in full. Fresh records were projected to ID, vacancy identity/title/country, captured coverage, target and actual context. Posting views retained original blocks and context-group boundaries. Gold, rationale, tags, review metadata, `goldHeadline` and `goldSupportingEvidenceIds` were removed before display.

Every target was reviewed in its real adjacent context and each posting was reviewed as a whole. The oversized text was inspected using an exact, verified decomposition: a 76-character header plus 300 repetitions of one 168-character systems-specification sentence, with no remainder. No policy-bearing text was clipped away.

The independent six-field proposals and headline/support decisions were saved in [fresh-test-blind-labels.json](fresh-test-blind-labels.json) **before** the source gold was loaded for comparison. Its saved SHA-256 is:

```text
d684ba5573b8ea113d89c65cbf5cb8f03b3aec83282e9f2a839d1f4a3c5b5521
```

That file was not revised after comparison. The subsequent evidence-only connected-group audit updates eligibility in the comparison/support audit; it does not revise those blind labels.

The required prior review note disclosed that aggregate fresh-label counts had already been exposed. It did **not** expose individual fresh labels to this reviewer. Reading assembly metadata also disclosed the existence/types of the three operational-challenge postings before the blind pass; no individual fresh gold or model predictions were exposed by that read. Therefore this is annotation-blind and prediction-blind at initial labeling, not a claim of zero prior dataset information. Individual fresh gold was opened only after the blind file was saved and is retained only in these fresh-review artifacts. The review was resumed on October 12 without restarting or changing the initial evidence pass.

No model inference, training, calibration, optimizer run, benchmark or prediction-output inspection occurred. No other split's gold was opened. The grouping audit used only `membership-ledger.json` and gold-free `postings.json` views.

## Passage and posting outcomes

[fresh-test-comparison.json](fresh-test-comparison.json) contains each original/proposed six-field label, exact target and contextual evidence hashes, outcome, reason, eligibility, and unresolved adjudication. Final counts are:

| Outcome | Targets |
| --- | ---: |
| Accept | 120 |
| Change | 1 |
| Needs adjudication | 13 |
| Exclude | 7 |
| Total | 141 |

There are two six-field disagreements: one proposed correction and one excluded unresolved record. At posting level, 9 are accepted, 13 need adjudication and 3 are excluded from complete-headline evaluation. All 25 independent headline choices agree with the supplied headline annotations; three operational postings need supporting-evidence treatment changes. This agreement measures review consistency, not model accuracy.

Material semantic decisions:

- `ft-rec-0132`: security-clearance sponsorship processing explicitly concerns clearance eligibility, resolved by the immediately preceding mandatory clearance requirement. Propose `relevant / role`, with sponsorship/CPT/OPT `unclear` and timing `unspecified`. Clearance assistance is not employment-visa sponsorship.
- `ft-rec-0137`: “This requirement” has no antecedent because its preceding source position is missing. Do not freeze a binary relevance label. The blind artifact uses `relevance: null` as an explicit review abstention and excludes the record; null is not a third human-gold class.
- `ft-rec-0095`: the enterprise policy is expressly for full-time employees after two years, whereas the named vacancy is an internship. The blind proposal is `other-role`, which agrees with the source; retain a scope-adjudication note because general-company scope is a plausible competing reading. Neither scope can establish internship sponsorship.
- Qualification passages remain immigration-irrelevant but role-scoped. Duties, benefits and ordinary equal-opportunity statements do not inherit adjacent immigration policy.
- Current/ongoing work authorization is not silently turned into sponsorship timing; “at this time” is explicit current sponsorship timing. A permanent-visa category is not future timing. CPT and OPT are interpreted independently, including Pre-OPT under OPT.
- A refusal with an explicit executive/counsel exception remains conditional provision, preserving the condition.

There are 134 provisionally semantically/structurally eligible targets before the split audit. Seven operational/source targets are excluded. Twelve additional targets from two postings are withheld while copied-policy relationships are adjudicated, leaving **122 provisional quality targets**. A self-contained target from an incomplete posting can remain passage-eligible when its actual context is complete; that never makes the whole posting complete.

These are provisional review counts. No human signoff or measured runtime input-limit verification is claimed.

## Connected groups and split integrity

The declared ledger and posting metadata agree for all 82 postings. Unioning normalized employer, employerGroup, policyFamily and shared context-group IDs produces 82 metadata components, including 25 fresh components, with zero cross-split **key** collisions.

That is not enough for `A-SPLIT-01`. The evidence review identifies these omitted material-policy relationships:

| Fresh posting | Training posting(s) | Observed relationship | Disposition |
| --- | --- | --- | --- |
| `ft-post-013` | `post-train-032`, `post-train-015` | The full policy sentence in `itw-04` is contained in the fresh target; `rmp-02` differs by an inserted immigration qualifier. | Withhold the whole fresh posting pending copied-family/provenance adjudication. |
| `ft-post-018` | `post-train-013` | The full policy sentence in `snw-02` is contained in the fresh target alongside additional CPT/OPT text. | Withhold the whole fresh posting pending copied-family/provenance adjudication. |

Common wording can arise independently, so these are not assertions that an employer copied another employer. They are material policy-family candidates that the current one-name-per-family ledger does not resolve. Conservatively count each candidate as connected to training until reviewed evidence establishes otherwise. Do not split a posting by which of its fields happened to overlap.

Distinct employer strings do not establish corporate-parent independence, related-vacancy independence or separately captured policy provenance. No external corporate/source research was conducted under this task. The support audit lists all metadata components, detected edges, evidence snippets for these relationships, and provisional additional connected components. `A-SPLIT-01` is not approved.

## Deduplicated support

[fresh-test-support-audit.json](fresh-test-support-audit.json) lists raw and deduplicated support, posting IDs and connected-group membership for every consequential class. Materially identical occurrences within a connected group contribute once; the current fresh candidates have only one supported occurrence per applicable class/posting, so deduplication does not increase any count.

| Consequential class | Before split withholding | After withholding | Eligible postings/groups |
| --- | ---: | ---: | ---: |
| Sponsorship available | 2 | 2 | 2 / 2 |
| Sponsorship unavailable | 7 | 5 | 5 / 5 |
| Sponsorship conditional | 2 | 2 | 2 / 2 |
| CPT explicitly accepted | 2 | 1 | 1 / 1 |
| CPT explicitly excluded | 2 | 2 | 2 / 2 |
| OPT explicitly accepted | 2 | 1 | 1 / 1 |
| OPT explicitly excluded | 2 | 2 | 2 / 2 |

Every class requires at least 20 deduplicated eligible targets across five postings and five connected groups. **All seven are insufficient even before withholding.** There are 19 provisional gold policy-finding units before withholding and 15 afterward. These are not emitted claims. The 100-emitted-claim precision denominator is unmeasured; no precision, recall, intervals or model-quality pass is claimed.

After withholding, descriptive scope support is role 42, question 1, historical 0, company 0, other-role 1 and none 78. Timing support is now 1, future 0, now-and-future 0 and unspecified 121. Zero-support classes are untested, not perfect.

## No-policy completeness

The first ten fresh postings each contain six supplied blocks with declared complete boundaries and no explicit immigration policy, mandatory immigration-related restriction or unresolved reference. Their independent supplied-evidence headline is `No blocker found`; all 60 blocks were inspected.

They are **10 semantic no-policy candidates in 10 declared groups**, not ten independently verified complete official captures. The allowed metadata contains no separate completeness attestation, capture/retrieval trail or preserved official evidence boundary establishing that each six-block extract is the whole relevant posting. The owner's authenticity confirmation alone does not settle that question.

Record a specific completeness review and settle the connected-group relationships before freezing this subset. Under the existing waiver, that review need not require source URLs/captures if another concrete completeness attestation is provided. Currently there are zero finally approved no-policy postings; `F-NOPOLICY-01` support remains pending/insufficient. No prediction was used to select the candidates.

## Operational challenges

The three supplied challenge postings contain nine targets. The audit explicitly preserves all nine in operational accounting while excluding seven targets from quality denominators and treating two self-contained targets as provisionally passage-eligible.

- `ft-post-023`: incomplete capture, an ellipsis-ended duty fragment, and a crawler timeout message encoded as a posting block. The group nevertheless declares an end boundary. The diagnostic should be extraction metadata; the original source end and target preservation require correction in a new version. Incomplete extraction forces `Could not verify`, but does not itself force partial model processing under the currently supplied complete context boundaries. Do not claim that engineering behavior has been demonstrated.
- `ft-post-024`: missing position 1 creates two missing-context targets. They must be prechecked as unsupported/missing-context, with no invented interpretation answers or probabilities and partial processing. The unresolved antecedent has no safe binary gold. Its self-contained final benefit target does not repair the posting.
- `ft-post-025`: the 50,476-character block exceeds the 30,000-character transport bound and appears in neighboring canonical states. The complete request must be rejected before inference. It is a request-validation challenge, not a valid request expected to return per-block `context-too-long`. A separate authored, transport-valid engineering fixture would be needed to test verified model-limit overflow; it could never contribute quality support.

All expected behaviors here are contract-based requirements, not measured runtime results.

## Source integrity and validation

Frozen source hashes used:

| Source | SHA-256 |
| --- | --- |
| `fresh-test.json` | `3cc8b0a2dcef85a66b320fe5912feee0a572424c71be71392e59f8833dfb2a09` |
| `postings.json` | `ff6a71f5ea6156a8f6c69b96a212830d3c47a9af98137ed56e954a758b2b7e3b` |
| `membership-ledger.json` | `4998354d06a7f260ed92ad130a9cc359ad1152152ffc70e1fa8405e52d537b62` |

Contract pins:

- `DECISION_LOGIC.md`: `bca4f8b83a24b11f7360ce0da698bedf03fc4d0f8473c6b6893f5b3232c1b4f2`.
- Screening/context: `90364151c5bfdd6119f9408a37b251d0b4eb636fe0f00539a8dde3a4a9b473ca`.
- V2 contract: `76a09ef969199f5bff0d172ba52dcdffec7f0f5802e12b9527dcbd306e1ec442`.
- Acceptance: `57e6c51ed501916af6432600cf0fcfdae5d3ba284ac45f81078ce83bc1157432`.
- Prior review note: `f5a0eeb840a79c15c4ecff855a3883bbc8dfb1c2606ca433c12b1f041aab16d3`.

Validation checks parse all three JSON artifacts; match 141 ordered, unique record IDs and 25 unique posting IDs to the frozen corpus; require exactly six proposed label fields; allow only the documented excluded relevance abstention; bind every target/support ID to its original posting; reconcile eligibility and support counts; and recheck source/initial-blind hashes. The markdown report is not a fourth JSON artifact.

No frozen file was edited. No automatic approval flag was treated as an independent review signature.

## Next authorized review work

Adjudicate the one semantic correction, unresolved scope and antecedent decisions; correct operational metadata/support handling in a new version; resolve or exclude the copied-policy components; attest no-policy completeness; expand each consequential class to the registered minimum; then obtain actual independent human signoff and derive a new manifest from that completed evidence. No training or fresh-test model run is authorized by this review.

Skipped: inference, training, calibration, benchmarks, prediction inspection and external source/corporate research.
Risk: this set cannot support an independent fresh-test readiness or promotion claim in its current form.
