# Part 2 source review worksheet

For each development case, open only its official source listed in `development.json`. Before looking at that file's `expected` fields, record the source date, role identity, relevant passages, completeness/gaps, sponsorship status for current and future, restriction scope, affected group, conditions, timing, and exceptions. Record the exact passages and page section/question. Do not enter application answers.

- Reviewer: Qwen3.7
- Date: Saturday, October 3, 2026
- Source snapshot/hash: Web extraction performed on 2026-10-03 by direct URL access; no cryptographic snapshot or hash supplied.

| Case | Correct role/source? | Sponsorship (now/future) | Main decision | Affected group and condition | Timing / exception | Completeness and gaps | Exact evidence / locator | Disagreement or rationale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [Waymo 8248060](https://careers.withwaymo.com/jobs/2027-summer-intern-ms-phd-ai-driven-ml-performance-engineering-intern-mountain-view-california-united-states?gh_jid=8248060) | Yes | Not explicitly denied; CPT, OPT, TN, and J-1 are listed as options. Export-control restrictions apply. | Considers various work authorizations, but restricts access based on export-control laws for specific countries of citizenship or permanent residence. | Applicants whose most recent country of citizenship or permanent residence is Cuba, Iran, North Korea, Syria, Crimea, DNR, or LNR. | Summer internship start date. Exception: U.S. citizens, nationals, lawful permanent residents, or people granted refugee or asylum status in the U.S. | No blanket sponsorship statement. Complete on the export-control restriction. | Application form: “If yes, what kind? (If you do not require work authorization sponsorship please select Not Applicable.)” Options include CPT, OPT, TN, J-1, and Other. Export section: “Would you require an export license under the circumstances described below?” | None recorded by first reviewer. |
| [Peraton 171547](https://careers-peraton.icims.com/jobs/171547/spring-%26-summer-2027-software-engineering-co-op/job) | Yes | No sponsorship statement; U.S. citizenship required. | Requires U.S. citizenship as a mandatory qualification. | All applicants for the Spring and Summer 2027 Software Engineering Co-op. | January–August 2027. No exception stated. | Complete and explicit regarding citizenship. | Required Qualifications: “US Citizenship” | None recorded by first reviewer. |
| [Enova 8239619](https://job-boards.greenhouse.io/enova/jobs/8239619) | Yes | Reviewer classified sponsorship as unavailable now and in the future. | Will not sponsor visas or take over sponsorship for employment-based immigration cases. | Applicants must be eligible to work in the U.S.; the sponsorship refusal applies to this role. | Current and future according to the first reviewer. No exception stated. | Complete and explicit regarding the current refusal. | Description: “We are interested in every qualified candidate who is eligible to work in the United States. However, we are not able to sponsor visas or take over sponsorship at this time.” Question: “Will you now or in the future require Enova sponsorship for employment visa status? (e.g. H1-B or other employment-based immigration case)” | None recorded by first reviewer. |
| [AMCA 4425120009](https://job-boards.greenhouse.io/amca/jobs/4425120009) | Yes | Reviewer described this as no sponsorship for non-U.S. persons. | Requires U.S.-person status—citizen, permanent resident, or protected person—because of ITAR. | All applicants for this ITAR-controlled Software Engineering Internship. | Summer 2027. The posting's U.S.-person definition supplies the qualifying statuses. | Complete and explicit regarding the ITAR requirement. | “This position requires use of information which is subject to the International Traffic in Arms Regulations (ITAR). All applicants must be U.S. persons within the meaning of ITAR. ITAR defines a US person as: any individual who is granted U.S. citizenship; or. any individual who is granted U.S. permanent residence (\"Green Card\" holder); or. any individual who is granted status as a \"protected person\" under 8 U.S.C 1324b(a)(3).” | None recorded by first reviewer. |

After recording an independent first pass, compare against the provisional `expected` fields. Preserve disagreements; a second reviewer should adjudicate them before this set is promoted beyond development.

## Comparison and adjudication queue

This first pass was produced by Qwen3.7, so it is an independent model review, not the human review required by the acceptance gate.

| Case | Agreement | Preserved disagreement requiring adjudication |
| --- | --- | --- |
| Waymo 8248060 | The scoped export-control obstacle, affected group, deadline, and exceptions agree with the provisional label. | Listing CPT, OPT, TN, or J-1 as application choices does not prove that Waymo accepts or sponsors those statuses. Sponsorship remains `unclear` unless employer-policy text states otherwise. |
| Peraton 171547 | The U.S.-citizenship blocker and role scope agree. | The first reviewer says the posting is complete; the captured development entry says partial because the separate application form was not inspected. A second reviewer must decide whether the complete job description is sufficient. This determines `Explicit blocker found` versus `Could not verify`. |
| Enova 8239619 | The current sponsorship refusal agrees. | “At this time” establishes the current refusal. The now-or-future application question asks about the applicant and does not itself establish Enova's future policy. Provisional future status remains `unclear`. |
| AMCA 4425120009 | The U.S.-person eligibility blocker and definition agree. | The posting states an ITAR eligibility rule, not a sponsorship policy. Sponsorship remains `unclear`; do not relabel it as “no sponsorship for non-U.S. persons” without an explicit employer statement. |

## Human review and final development labels

- Reviewer: Project owner
- Recorded: October 2, 2026
- Review: The human reviewer agreed with Qwen3.7's conclusions for all four postings.

The agreement confirms all four **main results** as `Explicit blocker found`. Detailed fields still follow the evidence contract: application choices and questions are not employer-policy answers, and an ITAR eligibility requirement is not automatically a sponsorship refusal.

| Case | Final development label | Adjudication |
| --- | --- | --- |
| Waymo 8248060 | `Explicit blocker found`; sponsorship `unclear`; restriction `export-control` | Confirmed country-scoped export obstacle, deadline, and exceptions. CPT/OPT/TN/J-1 choices remain context only. |
| Peraton 171547 | `Explicit blocker found`; sponsorship `unclear`; restriction `citizenship` | Human review confirms the job description is complete and “US Citizenship” is a required qualification. |
| Enova 8239619 | `Explicit blocker found`; sponsorship currently `unavailable`, future `unclear` | “At this time” is an explicit current refusal. The now-or-future applicant question does not state Enova's future policy. |
| AMCA 4425120009 | `Explicit blocker found`; sponsorship `unclear`; restriction `us-person` | Confirmed ITAR U.S.-person requirement. No separate sponsorship policy is stated. |

The URLs in `holdout-candidates.json` are link-only candidates. Do not open or label their content during rule/model development. The repository is only a discovery source; only official employer text can support a label. Record access failures and duplicates rather than silently replacing them after reading policy text.
