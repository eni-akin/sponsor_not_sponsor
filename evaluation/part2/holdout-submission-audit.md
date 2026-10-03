# Holdout submission audit — October 3, 2026

Source: [Qwen3.7 submission](holdout-submission-qwen-2026-10-03.md)

The submission contains **54 rows**, not 50 unseen holdout cases. It is preserved unchanged before any rule-system predictions are run.

## Eligibility count

| Removal | Cases | Reason |
| --- | ---: | --- |
| Development examples | 4 | Waymo, Peraton, Enova, and AMCA were used to design and test the rules. |
| Previously exposed live examples | 2 | Pinterest and Southwest were already inspected during development. |
| Outside the U.S. internship target | 2 | Google is a U.K./EMEA role; Tradeweb is a London role with inconsistent 2026 dates. |
| Remaining unseen U.S. candidates | **46** | Four additional jobs are required to reach 50. |

Do not replace an inaccessible or closed posting after viewing its policy. Record it as a coverage outcome.

### Blind additions selected before policy review

These four unused candidates were already present in `holdout-candidates.json`. Only their repository metadata and URLs have been seen; their job-policy text remains unopened for this evaluation.

| Case | Employer | Role | Official URL |
| --- | --- | --- | --- |
| northrop-R10254007 | Northrop Grumman | Software Engineer Intern | https://ngc.wd1.myworkdayjobs.com/Northrop_Grumman_External_Site/job/United-States-Utah-Roy/XMLNAME-2027-Software-Engineering-Intern---Colorado-Springs-CO_R10254007 |
| mfs-MFS-231985 | MFS | Software Engineer Intern | https://mfs.wd1.myworkdayjobs.com/en-US/MFS-Careers/job/Boston/Summer-2027-Software-Engineer-Intern--June---August-_MFS-231985 |
| invesco-R-15621-1 | Invesco | Early Career Intern — Fixed Income Global Technology | https://invesco.wd1.myworkdayjobs.com/en-US/IVZ/job/Atlanta-Georgia/Early-Career-Intern---Fixed-Income-Global-Technology_R-15621-1 |
| hmh-JR102458 | HMH | AI & Automation Development Intern | https://hmhw.wd12.myworkdayjobs.com/hmh_careers/job/Houston-TX/AI---Automation-Development-Intern_JR102458 |

The candidate roster is now **50 unseen, in-scope jobs**, but it is not label-frozen until the corrections and human review below are complete.

## Label corrections required before freezing

The project reports explicit page wording. It does not infer that ordinary work authorization, location, or clearance language means “no sponsorship.”

| Case | Submitted label issue | Evidence-contract label |
| --- | --- | --- |
| Intuit 101444103552 | “Legally authorized ... during the internship” was treated as a functional sponsorship denial. | `No blocker found`; this does not say authorization must exist without sponsorship. |
| Epic Games 6183293004 | Authorization for the internship duration was treated as a functional denial. | `No blocker found` unless explicit without-sponsorship wording is captured. |
| Booz Allen R0249188 | “Ability to obtain a Secret clearance” was converted into an unstated citizenship rule. | `No blocker found` under the explicit-text contract unless the posting itself states the citizenship/status condition. |
| Shield AI 8c850c75 | An application question listing U.S.-person statuses and “Other” was treated as a requirement. | `No blocker found` unless adjacent employer-policy text explicitly excludes “Other.” |
| Amgen R-255719 | “Sponsorship for future FTE roles is not guaranteed” was treated as a denial for the internship. | `Sponsorship stated` with conditional, future-only evidence; it is not a current internship blocker. |
| Saronic cffe4bc2 | A definition of “U.S. Person” was treated as proof that the role requires it. | `Could not verify` until the exact sentence making U.S.-person status mandatory is captured. |

Pinterest and Southwest have similar unsupported functional-denial inferences, but they are excluded for prior exposure regardless.

## Normalization required

- `Not Mentioned / Gap` is not a product result. A complete posting with no explicit qualifying evidence maps to `No blocker found`; an incomplete posting maps to `Could not verify`.
- Citizenship, U.S.-person, ITAR/EAR, and clearance restrictions are eligibility blockers. They do not automatically prove a sponsorship policy; sponsorship stays `unclear` unless separately stated.
- Application questions record what the employer asks. They do not supply the employer's answer.
- “U.S.-based applicants only,” U.S. residence, a Social Security number, or generic authorization language is not an explicit sponsorship refusal.

## Freeze status

**Not frozen.** Required before running the rule system:

1. Review the four blind additions and retain exact evidence without replacing inaccessible postings.
2. Apply the corrections above and map every row to one of the four product results.
3. Record whether each source was complete and retain exact supporting evidence.
4. Record a human reviewer/date. The submitted file identifies Qwen3.7 as the reviewer, so it is model-generated review evidence rather than the required human review.

No rule predictions were run while preparing this label audit. The project owner later supplied a separate extension-output CSV, audited in `extension-output-audit-2026-10-03.md`.
