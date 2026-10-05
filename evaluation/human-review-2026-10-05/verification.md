# CSV corrections and official-source spot checks

Date: October 5, 2026 (America/Chicago).

Input: `/Users/eniola/Downloads/human_review.csv`, unchanged.
Output: `human_review_corrected.csv`, 54 cases, 20 columns.

Three GPT-6 Luna agents performed read-only checks of nine exposed vacancies at the user's request. Their source findings were reconciled against the product contract by the primary agent. These are assistant checks, not new human adjudications or scanner captures. No applicant information was entered or inspected.

## Changes

- Repair Waymo's malformed CSV quoting (13 parsed fields instead of 10).
- Remove excess trailing quotation marks in RF-SMART, Zipline, and Walmart evidence cells.
- Preserve original sponsorship, logic, and main-decision columns alongside corrections; retain the original input file.
- Correct Enova to current refusal with future policy unclear.
- Remove inferred refusals based solely on work authorization, location, SSN, or applicant questions.
- Keep citizenship, U.S.-person, export-control, and clearance statements separate from sponsorship policy. Preserve stated conditions and alternatives.
- Treat Amgen's future full-time non-guarantee as uncertainty, not an offer or an internship refusal.
- Do not infer citizenship from Booz Allen's quoted clearance requirement.
- Add official source URLs, verification date/status, short verified source excerpts, limitations, and correction/review status. Existing identity/completeness judgments are historical user-provided fields; the new verification columns describe this check.

Twenty-three rows have substantive interpretation or quotation-format corrections. All records gain traceability columns. Assistant corrections await human confirmation before becoming training labels. The original 13-passage review file and model-training inputs were not changed.

## Verification results

| Case | Evidence obtained | Result |
|---|---|---|
| Intuit 101444103552 | Complete official description; matching URL/title. Page shows requisition 24477. | General authorization requirement; no explicit sponsorship refusal found. |
| Enova 8239619 | Official description and public form. | Current sponsorship refusal; future applicant question is not future employer policy. |
| AMCA 4425120009 | Official description and public form. | Mandatory U.S.-person status; sponsorship policy separate and unclear. |
| Shield AI 8c850c75 | Same-UUID overview and public form. | No explicit blocker identified in either source. Form screening and conditional controlled-access notice do not establish refusal or mandatory U.S.-person status. |
| Amgen R-255719 | Exact requisition in official search-index text; direct description unreadable. | Partial verification. Future FTE non-guarantee is not a current refusal or an explicit offer. |
| Saronic cffe4bc2 | Exact-UUID official indexed posting; direct page JavaScript shell and application unreadable. | Partial verification. Indexed text supplies a U.S.-location-conditioned U.S.-person requirement missing from the original abbreviated definition. Preserve finding with an incomplete-evidence headline. |
| Epic Games 6183293004 | Direct page unreadable; localized indexed result has conflicting gh_jid. | Partial/identity limitation. Do not accept the alternate result as fresh exact-vacancy policy proof. |
| Pinterest 8140210 | Official vacancy and ATS content unavailable to tools. | Unverified. Other vacancies' application questions excluded. |
| Southwest R-2026-73270 | Official vacancy unreadable. Mirrors report additional refusal wording. | Unverified; do not use mirror wording as official proof or conclude sponsorship availability. |

Four cases have readable official descriptions and relevant application/policy context. Three are partial; two could not be verified from official vacancy content. “Unavailable to tools” does not establish that a job is closed. Search-index text does not establish current page availability.

The CSV provides each exact source URL. These checks do not prove what the extension's scanner extracted. Unchecked rows retain their earlier evidence and are explicitly marked as not live-checked in this batch. The full CSV remains exposed development material, not independent calibration or final test data.
