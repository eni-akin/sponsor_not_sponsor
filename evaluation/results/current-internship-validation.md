# Current internship validation

Review date: September 30, 2026

Source batch: [current internship validation worksheet](../REVIEW_WORKSHEET.md)

Review status: single-reviewer development evidence; not a fresh holdout or general accuracy estimate

The reviewer read each official posting before recording the extension result. Labels use the blocker-first contract in [PLAN.md](../../PLAN.md#decision-contract).

## Results

| # | Company | Human result | Evidence | Extension result | Diagnosis |
| ---: | --- | --- | --- | --- | --- |
| 1 | Primer | Sponsorship stated | “Competitive salary and benefits package, with J-1 and F-1 visa sponsorship available.” | Sponsorship available | Match |
| 2 | Perchwell | No blocker found | No blocker or sponsorship statement found | Sponsorship unclear | Presentation/decision contract gap |
| 3 | Cloudflare | No blocker found | No blocker or sponsorship statement found; the application question and conditional export notice are not blockers | Sponsorship unclear | Presentation/decision contract gap |
| 4 | Thrivent | Explicit blocker: no sponsorship | “Ability to work in the United States for an indefinite period without sponsorship” | Sponsorship unclear | Missed blocker |
| 5 | RTX | Explicit blocker: citizenship | “U.S. citizenship is required, as only U.S. citizens are eligible for a security clearance” | Sponsorship unclear; citizenship restriction was quoted separately | Main-result mapping gap; extraction succeeded |
| 6 | AbbVie | No blocker found | No blocker or sponsorship statement found | Sponsorship unclear | Presentation/decision contract gap |
| 7 | H&R Block | No blocker found | No blocker or sponsorship statement found | No job result | Reading/detection failure |
| 8 | Neighbor | No blocker found | No restrictive policy; an application authorization question is not a blocker | No job result | Reading/detection failure |
| 9 | Microsoft | No blocker found | No blocker or sponsorship statement found; application questions are not policy | Sponsorship unclear | Presentation/decision contract gap |
| 10 | Lazard | Explicit blocker: no sponsorship | “Authorization to work in the United States without visa sponsorship” | Sponsorship unclear | Missed blocker |
| 11 | Renesas Electronics | Could not verify | Official posting had expired | No comparable result recorded | Closed posting; exclude from decision accuracy |
| 12 | Johns Hopkins APL | Explicit blocker: citizenship | “Eligibility requirements include U.S. citizenship.” | Sponsorship unclear | Missed blocker |

## Counts

Human labels across all 12 postings:

- Explicit blocker found: **4**
- Sponsorship stated: **1**
- No blocker found: **6**
- Could not verify because the posting expired: **1**

Among the 11 open postings:

- Correct role detected: **9/11**
- Reading/detection failures: **2/11** — H&R Block and Neighbor
- Explicit sponsorship offers correctly surfaced: **1/1**
- Explicit blockers surfaced in the main sponsorship result: **0/4**
- One blocker, RTX citizenship, was extracted and displayed as a separate stated requirement but was not promoted to the main result.
- The six No blocker found cases still displayed the old Unclear label. This is expected until the blocker-first result contract is implemented; it should not be counted as evidence that the scanner missed text.

## What this changes

1. Implement the blocker-first result before evaluating Laya. A complete readable role with no positive or negative policy becomes **No blocker found**.
2. Promote explicit citizenship, permanent-residency, no-sponsorship, and equivalent work-authorization exclusions into **Explicit blocker found**.
3. Add the Thrivent, RTX, Lazard, and Johns Hopkins wording as blocker regression cases.
4. Diagnose H&R Block and Neighbor as scanner/source-coverage work, separately from decision logic.
5. Preserve Primer as a positive control proving that explicit sponsorship wording does occur.

The reviewer saw the extension output during this exercise, so these examples are now development cases. Use different employers and templates for a future untouched holdout.
