# Thirty internship postings: evidence review versus Sponsor Not Sponsor 0.6.0

Audit date: September 26, 2026. This report compares an LLM evidence assessment with actual extension results from public pages. The assessment concerns the selected vacancy, not a company-wide promise.

## What the sample shows

- 14 postings have evidence of no sponsorship: 11 from directly viewed official descriptions, one from an indexed official AMD posting corroborated by a copy, and two from secondary full-posting copies (Lutron and State Farm).
- 16 remain unclear. No selected posting establishes an explicit offer or conditional offer. Four unclear cases have separate citizenship/status context or restrictions: Aerospace, RTX, Astranis, and Radiance. Waymo also states a country-specific export-license condition.
- The extension returns 11 role records on the original destinations, including 2 with incorrect titles. It returns no role on 19 destinations.
- Of 25 primary pages with readable vacancy or application content, it detects 11 (44%); nine have the correct role title (36%). Four HTTP 403 responses and one careers-homepage redirect are reported separately from these detector counts.
- On the nine primary pages containing explicit or requirement-based refusal evidence in the same rendered content, the extension produces two unavailable labels (22.2%). One of those two has a wrong role title. This is a small-sample recognition count, not a validated accuracy estimate.

## Method and limits

Source: [SimplifyJobs/Summer2027-Internships](https://github.com/SimplifyJobs/Summer2027-Internships), dev-branch README retrieved 2026-09-26T16:48:41.949Z. The README snapshot is frozen locally with SHA-256 `fb859bce146d36261776191f6fd71870e159c00570d27dce1eac889518a9dc64`.

Selection: First 30 distinct employers with application links, in README software-engineering table order; no filtering by outcome. All selected rows have U.S. locations. Includes co-ops listed in the repository. The sample was fixed before browsing outcomes. It is a convenience sample, not random or representative of all internships. The source list includes co-ops and some non-summer roles.

The tested extension is version 0.6.0 at commit `3cb47e77ec8a4505f1ebabf615e2b4fc06d5b560`, rebuilt from unchanged production source. It ran in disposable Chrome profiles with fresh settings; research remained off. Each primary result below comes from the extension's own GET_SCAN reply on the rendered page. We also replayed the unchanged scanner and interpreter against that DOM to diagnose failures.

A diagnostic body-only run skips job recognition and feeds the normal body extraction to the unchanged interpreter. It is not the normal product result, may include broader page context, and is used only to locate a failure stage. Alternate overview/mirror runs are also kept separate from the original URL results.

The first exploratory pass could not attribute extension replies because tabs.query does not expose page URLs with this manifest. Its DOM replay was not used as the claimed installed-extension result. A corrected read-only harness matched content-script replies and repeated all 30 primary visits; every included primary snapshot is ready.

The LLM reviewed rendered wording, role identity, and alternate sources; its judgments were not blinded to the tool results and have not been independently human-adjudicated. Refusals expressed through eligibility bullets are interpretations of their context. Silence, a sponsorship question, relocation money, an equal-opportunity statement, or company reputation never establish sponsorship availability.

Secondary full-posting copies are labeled provisional. AMD was also available through an indexed official result, although the live browser returned 403. Different sources and access paths are not treated as equal test inputs. No login, application submission, or applicant data entry was performed.

## All 30 comparisons

“No role” means the product never reached a sponsorship finding. It must not be counted as a refusal. “Unclear” is an actual product finding only when a role was returned.

| # | Company / linked position | Evidence assessment | Original-page tool result | Main issue |
|---|---|---|---|---|
| 1 | [Flint — Engineering Intern - Summer 2027](https://jobs.ashbyhq.com/flint/39f9e665-7037-4dff-b77a-ff7039df2bfc/application?embed=true) | unavailable | unclear | Application omits overview |
| 2 | [Waymo — Software Engineer Intern - Driver Refinement Foundations](https://careers.withwaymo.com/jobs?gh_jid=8224900) | unclear; restriction/context | unclear | Appropriate uncertainty; see details |
| 3 | [Bedrock Robotics — Safety Engineer Intern - Agentic Safety Case Assessment](https://jobs.ashbyhq.com/bedrock-robotics/cb06dc4f-3e78-4546-897d-b39ba12a9178/application?embed=true) | unclear | unclear | Appropriate uncertainty; see details |
| 4 | [AbbVie — Business Technology Solutions Intern - Data & Software Engineering](https://jobs.smartrecruiters.com/AbbVie/3743990015684476) | unclear | No role (non-job) | Unrecognized application action |
| 5 | [RRS Group — Associate Software Engineer Intern - Sophomore Only](https://jobs.smartrecruiters.com/RRSGroup/744000151931819) | unclear | No role (non-job) | Unrecognized application action |
| 6 | [Lutron Electronics — Software Engineering Co-op](https://careers.lutron.com/jobs/5616?icims=1) | unavailable (secondary) | No role (non-job) | HTTP 403 access failure |
| 7 | [First Citizens BancShares — IT Intern - Software Developer](https://firstcitizens.jibeapply.com/jobs/35709?icims=1) | unclear | No role (non-job) | HTTP 403 access failure |
| 8 | [Electronic Arts — Gameplay Engineer Intern](https://jobs.ea.com/en_US/careers/JobDetail/Gameplay-Engineer-Intern/216245) | unavailable | No role (unreadable) | Role heading not recognized |
| 9 | [The Aerospace Corporation — Software Systems Engineer Intern - Acquisition](https://aero.wd5.myworkdayjobs.com/external/job/El-Segundo-CA/XMLNAME-2027-Software-Systems-Engineer-and-Acquisition-Intern_R016431) | unclear; restriction/context | No role (non-job) | Role heading not recognized |
| 10 | [RTX — Software Engineer Intern - Summer 2027](https://globalhr.wd5.myworkdayjobs.com/rec_rtx_ext_gateway/job/US-UT-WEST-VALLEY-CITY-338--1127--1128-w-2400-S--BLDG-338/Software-Engineering-Intern--Summer-2027-_01875358) | unclear; restriction/context | No role (unreadable) | Role heading not recognized |
| 11 | [Rockwell Automation — AI Software Engineer Intern](https://rockwellautomation.wd1.myworkdayjobs.com/External-Rockwell-Automation-Early-Careers/job/Mayfield-Heights-Ohio-United-States/Intern--AI-Software-Engineering--June-August-2027-_R26-6980) | unavailable | No role (unreadable) | Role heading not recognized |
| 12 | [Pacific Life — Software Engineering Intern](https://pacificlife.wd1.myworkdayjobs.com/en-US/PacificLifeCareers/job/Newport-Beach-CA-700/Summer-2027-Software-Engineering-Internship_R17826) | unclear | No role (unreadable) | Role heading not recognized |
| 13 | [Northwestern Mutual — Actuarial Systems Intern](https://northwesternmutual.wd5.myworkdayjobs.com/corporate-careers/job/Milwaukee-WI-Corporate/Actuarial-Systems-Intern--Summer-2027_JR-46073) | unavailable | unavailable; wrong title | Wrong role title |
| 14 | [Motorola — Software Engineer Intern - Summer 2027](https://motorolasolutions.wd5.myworkdayjobs.com/Careers/job/Greater-Chicago-Area/Software-Engineer-Intern---Summer-2027_R68679) | unclear | No role (unreadable) | Role heading not recognized |
| 15 | [Intel — Software Research Intern - PhD 🎓](https://intel.wd1.myworkdayjobs.com/en-us/external/job/US-Oregon-Hillsboro/Software-Solutions-PhD-Intern-New-2027_JR0287314) | unclear | No role (unreadable) | Role heading not recognized |
| 16 | [Greenheck Group — Application Developer Co-op](https://greenheckgroup.wd5.myworkdayjobs.com/external/job/Schofield-WI/Application-Developer-Co-op_JR104721) | unclear | No role (unreadable) | Role heading not recognized |
| 17 | [Cencora — Software Intern](https://myhrabc.wd5.myworkdayjobs.com/Global/job/Remote-USA/Software-Intern_R2613763) | unavailable | No role (unreadable) | Role heading not recognized |
| 18 | [American Century Investments — Software Developer Intern](https://americancentury.wd5.myworkdayjobs.com/AmericanCenturyInvestments/job/Kansas-City-Missouri/Software-Developer-Intern_R0005749-1) | unavailable | No role (unreadable) | Role heading not recognized |
| 19 | [DRW — Software Developer Intern](https://job-boards.greenhouse.io/drwuniversityjobs/jobs/8220587) | unclear | unclear | Appropriate uncertainty; see details |
| 20 | [Boston Scientific — Software Engineer Intern - R&D](https://bostonscientific.eightfold.ai/careers/job/563602813542900) | unavailable | unclear; wrong title | Wrong role title |
| 21 | [Lazard — AI and Data Transformation Intern](https://icbpjb.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/LazardProfessionalCareers/job/6650) | unavailable | unclear | Extracted wording not understood |
| 22 | [Astranis — Network Software Intern](https://job-boards.greenhouse.io/astranis/jobs/4705597006) | unclear; restriction/context | unclear | Appropriate uncertainty; see details |
| 23 | [Arconic — Software Developer Intern](https://hdnn.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX/job/114233) | unavailable | unavailable | Successful result |
| 24 | [Radiance Technologies — Software Engineer Intern](https://radiancetech.wd12.myworkdayjobs.com/Radiance_External/job/Dayton-Office/Software-Engineer-Intern-Spring-Summer-2027_HR102442) | unclear; restriction/context | No role (unreadable) | Role heading not recognized |
| 25 | [Illinois Tool Works — Software Engineer Intern](https://careers.itw.com/global/en/job/JR10261) | unclear | No role (non-job) | Link redirects to careers homepage |
| 26 | [Qumulo — Software Development Engineer Intern](https://jobs.ashbyhq.com/qumulo/43855947-3a85-4d1c-8b8e-e0c0ddcaf183/application?embed=true) | unavailable | unclear | Application omits overview |
| 27 | [GM financial — Software Development Engineer Intern](https://fa-exvu-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/job/260943) | unavailable | unclear | Extracted wording not understood |
| 28 | [AMD — AI Engineering Intern 🎓](https://careers.amd.com/jobs/91005?icims=1) | unavailable (indexed official) | No role (non-job) | HTTP 403 access failure |
| 29 | [State Farm — Software Developer Intern - HR&D](https://jobs.statefarm.com/jobs/45689?icims=1) | unavailable (secondary) | No role (non-job) | HTTP 403 access failure |
| 30 | [Ralliant — Research and Development Co-op](https://ibwujb.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/10637) | unclear | No role (non-job) | Description-signal threshold |

## Evidence and explanation for each position

### 1. Flint — Engineering Intern - Summer 2027

Assessment: **unavailable**. Evidence basis: Official job overview. [Reviewed source](https://jobs.ashbyhq.com/flint/39f9e665-7037-4dff-b77a-ff7039df2bfc). Retrieved 2026-09-26T16:52:14.419Z.

> We don't sponsor visas for internships

Evidence rationale: The internship overview explicitly refuses visa sponsorship and requires authorization for the whole term. The application page alone does not contain that refusal.

Actual extension result: job-posting; sponsorship unclear. Detected title: “Engineering Intern — Summer 2027”. Employer: Flint.

Why it agrees or differs: The repository links directly to Ashby's application view. The extension reads that view and labels it description-found, although its relevant job overview is elsewhere. On the overview it still returns unclear: the refusal patterns recognize sponsoring applicants/candidates but not the formulation sponsor visas for internships. Both content coverage and interpretation need improvement.

Separate restriction/context: Existing work authorization required for the full internship term.

Additional runs: Official overview: job-posting, sponsorship unclear ([source](https://jobs.ashbyhq.com/flint/39f9e665-7037-4dff-b77a-ff7039df2bfc)).

### 2. Waymo — Software Engineer Intern - Driver Refinement Foundations

Assessment: **unclear**. Evidence basis: Official posting and application. [Reviewed source](https://careers.withwaymo.com/jobs/2027-summer-intern-bs-software-engineer-driver-refinement-foundations-mountain-view-california-united-states?gh_jid=8224900). Retrieved 2026-09-26T16:51:01.892Z.

> Do you require work authorization?

Evidence rationale: The application asks about work authorization and offers several status choices. Asking which status an applicant holds does not promise sponsorship. The job text reviewed supplies no explicit offer or refusal.

Actual extension result: job-application; sponsorship unclear. Detected title: “2027 Summer Intern, BS, Software Engineer, Driver Refinement Foundations”. Employer: Waymo.

Why it agrees or differs: The extension identifies the role and employer and correctly keeps sponsorship, CPT, and OPT unclear. It also surfaces an export-related condition. This is not a missed sponsorship offer.

Separate restriction/context: Country-specific export-license wording is present; it is not a blanket U.S.-citizenship-only requirement.

### 3. Bedrock Robotics — Safety Engineer Intern - Agentic Safety Case Assessment

Assessment: **unclear**. Evidence basis: Official application plus separately reviewed overview. [Reviewed source](https://jobs.ashbyhq.com/bedrock-robotics/cb06dc4f-3e78-4546-897d-b39ba12a9178/application?embed=true). Retrieved 2026-09-26T16:51:00.907Z.

> Will you now or in the future require visa sponsorship to work in the United States?

Evidence rationale: This is an applicant question. The separate role overview also contains no explicit sponsorship commitment or refusal. The company's background and equal-opportunity language do not establish an offer.

Actual extension result: job-posting; sponsorship unclear. Detected title: “2027 Internship Safety Engineer, Agentic Safety Case Assessment”. Employer: Bedrock Robotics Inc.

Why it agrees or differs: The unclear label is justified. However, the application view is labeled description-found despite omitting the overview. The separate overview also returns unclear. Employer metadata identifies Bedrock Robotics Inc, which would still need a reviewed research registry entry.

Additional runs: Official overview: job-posting, sponsorship unclear ([source](https://jobs.ashbyhq.com/bedrock-robotics/cb06dc4f-3e78-4546-897d-b39ba12a9178)).

### 4. AbbVie — Business Technology Solutions Intern - Data & Software Engineering

Assessment: **unclear**. Evidence basis: Official posting. [Reviewed source](https://jobs.smartrecruiters.com/AbbVie/3743990015684476). Retrieved 2026-09-26T16:51:03.506Z.

No policy quotation is supplied: the reviewed content did not establish sponsorship availability or refusal.

Evidence rationale: The description discusses responsibilities, degree requirements, pay, and relocation support but does not establish visa sponsorship. Relocation support does not imply immigration support.

Actual extension result: non-job; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The actual vacancy is readable, but the SmartRecruiters action says I'm interested. hasApply only recognizes Apply or Submit application. With no usable structured JobPosting in the captured DOM, the generic detector's Apply requirement fails and it returns non-job.

### 5. RRS Group — Associate Software Engineer Intern - Sophomore Only

Assessment: **unclear**. Evidence basis: Linked recruiting-platform posting. [Reviewed source](https://jobs.smartrecruiters.com/RRSGroup/744000151931819). Retrieved 2026-09-26T16:51:04.572Z.

No policy quotation is supplied: the reviewed content did not establish sponsorship availability or refusal.

Evidence rationale: The posting describes a sophomore internship and international collaboration, but contains no explicit sponsorship policy. Working with international colleagues does not establish visa support. Employer legitimacy was not independently investigated in this audit.

Actual extension result: non-job; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: As with AbbVie, SmartRecruiters uses I'm interested for the application action. The scanner misses this action and has no matched structured job record, so the readable vacancy becomes non-job.

### 6. Lutron Electronics — Software Engineering Co-op

Assessment: **unavailable**. Evidence basis: Secondary full-posting copy; official URL returned HTTP 403. [Reviewed source](https://simplify.jobs/p/06121173-b783-44a5-bd34-4a7465768bbb/Software-Engineering-Co-op). Retrieved 2026-09-26T16:55:19.567Z.

> Lutron does not offer work visa sponsorship for this position.

Evidence rationale: The linked full-posting copy explicitly refuses sponsorship, and its surrounding wording covers present and future work-visa needs. This conclusion is provisional because the live employer page was inaccessible in this browser.

Actual extension result: non-job; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The employer URL served only a 403 Forbidden page. No job wording reached the extension, which reports non-job. That is an access outcome, not proof of a language-rule failure. A separate visit to the mirror returns unavailable, but the mirror also contains a publisher-supplied sponsorship tag; its result must retain secondary-source attribution.

Separate restriction/context: No present or future work-visa sponsorship in the copied posting.

Additional runs: Secondary full-posting view: job-posting, sponsorship unavailable ([source](https://simplify.jobs/p/06121173-b783-44a5-bd34-4a7465768bbb/Software-Engineering-Co-op)).

### 7. First Citizens BancShares — IT Intern - Software Developer

Assessment: **unclear**. Evidence basis: Secondary full-posting copy; official URL returned HTTP 403. [Reviewed source](https://simplify.jobs/p/074a0da6-73e2-402d-90a7-ca4bf302d862/IT-Intern). Retrieved 2026-09-26T16:55:19.486Z.

No policy quotation is supplied: the reviewed content did not establish sponsorship availability or refusal.

Evidence rationale: The accessible copy of this specific IT internship provides duties, academic qualifications, dates, and benefits but no sponsorship policy. The blocked employer page prevents confirming whether the copy is complete and current.

Actual extension result: non-job; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The primary browser visit received 403 Forbidden, so the extension had no vacancy to analyze and returned non-job. On the secondary copy it detects the internship and returns unclear. Neither result establishes a refusal.

Additional runs: Secondary full-posting view: job-posting, sponsorship unclear ([source](https://simplify.jobs/p/074a0da6-73e2-402d-90a7-ca4bf302d862/IT-Intern)).

### 8. Electronic Arts — Gameplay Engineer Intern

Assessment: **unavailable**. Evidence basis: Official posting. [Reviewed source](https://jobs.ea.com/en_US/careers/JobDetail/Gameplay-Engineer-Intern/216245). Retrieved 2026-09-26T16:51:16.479Z.

> Visa sponsorship is not available for this position.

Evidence rationale: The exclusion is explicit and is attached to this internship's eligibility paragraph. The surrounding requirement for authorization during the internship reinforces its scope.

Actual extension result: unreadable; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The job title is an h2. The page's h1 is the employer branding outside the relevant job area; the scanner does not accept an ordinary h2 as the role title. It stops with unreadable before interpretation. Feeding the extracted body passages directly to the unchanged interpreter recognizes the refusal, isolating this as a detection failure.

Separate restriction/context: Authorization required throughout the 12-week internship.

### 9. The Aerospace Corporation — Software Systems Engineer Intern - Acquisition

Assessment: **unclear**. Evidence basis: Official posting; company sidebar context. [Reviewed source](https://aero.wd5.myworkdayjobs.com/external/job/El-Segundo-CA/XMLNAME-2027-Software-Systems-Engineer-and-Acquisition-Intern_R016431). Retrieved 2026-09-26T16:51:20.723Z.

> U.S. citizenship is required for those positions.

Evidence rationale: The vacancy lists an active clearance as a preferred qualification. Separate company context says technical positions require clearance and citizenship. That is relevant context to verify for this role, not an explicit role-specific sponsorship offer or refusal.

Actual extension result: non-job; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The visible role title is h2, while the visible h1 is Welcome!. It does not match the structured job title, and detection ends at non-job. The company-context citizenship sentence is also absent from the body extraction diagnostic, so it would need separately scoped extraction rather than being silently applied to this vacancy.

Separate restriction/context: Company-context citizenship/clearance condition; applicability to this internship needs confirmation.

### 10. RTX — Software Engineer Intern - Summer 2027

Assessment: **unclear**. Evidence basis: Official posting with explicit eligibility restriction. [Reviewed source](https://globalhr.wd5.myworkdayjobs.com/rec_rtx_ext_gateway/job/US-UT-WEST-VALLEY-CITY-338--1127--1128-w-2400-S--BLDG-338/Software-Engineering-Intern--Summer-2027-_01875358). Retrieved 2026-09-26T16:51:21.652Z.

> U.S. citizenship is required

Evidence rationale: This role explicitly requires citizenship. That is a decisive stated restriction for a noncitizen applicant, but it is a different claim from whether RTX sponsors other positions. The sponsorship field itself is not explicitly answered.

Actual extension result: unreadable; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The Workday role title is h2 and the h1 is empty, so the scanner reports unreadable even though JobPosting metadata exists. The body-only diagnostic does recognize the citizenship restriction, showing that this particular restriction is blocked primarily by job recognition.

Separate restriction/context: U.S. citizenship expressly required for this program/contract.

### 11. Rockwell Automation — AI Software Engineer Intern

Assessment: **unavailable**. Evidence basis: Official posting. [Reviewed source](https://rockwellautomation.wd1.myworkdayjobs.com/External-Rockwell-Automation-Early-Careers/job/Mayfield-Heights-Ohio-United-States/Intern--AI-Software-Engineering--June-August-2027-_R26-6980). Retrieved 2026-09-26T16:51:22.888Z.

> We will not sponsor individuals for employment visas, now or in the future, for this job opening.

Evidence rationale: The sentence directly refuses sponsorship for this opening, covering both present and future needs. No company-history inference is required.

Actual extension result: unreadable; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The Workday title is h2 with an empty h1, so no role is produced. There is a second failure: the unchanged interpreter still returns unclear when given the extracted body. Its sponsor-verb refusal rule enumerates applicants, candidates, workers, employees, or this role, but not individuals for employment visas.

Separate restriction/context: No present or future employment-visa sponsorship.

### 12. Pacific Life — Software Engineering Intern

Assessment: **unclear**. Evidence basis: Official posting. [Reviewed source](https://pacificlife.wd1.myworkdayjobs.com/en-US/PacificLifeCareers/job/Newport-Beach-CA-700/Summer-2027-Software-Engineering-Internship_R17826). Retrieved 2026-09-26T16:51:24.333Z.

No policy quotation is supplied: the reviewed content did not establish sponsorship availability or refusal.

Evidence rationale: The posting describes the software internship, compensation, and a relocation stipend, without an explicit sponsorship policy. A relocation stipend is insufficient evidence of visa support.

Actual extension result: unreadable; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The role appears as h2 and the h1 is empty. Although structured job metadata and an Apply link exist, the scanner requires a supported visible title before it can use that metadata. It returns unreadable.

### 13. Northwestern Mutual — Actuarial Systems Intern

Assessment: **unavailable**. Evidence basis: Official posting. [Reviewed source](https://northwesternmutual.wd5.myworkdayjobs.com/corporate-careers/job/Milwaukee-WI-Corporate/Actuarial-Systems-Intern--Summer-2027_JR-46073). Retrieved 2026-09-26T16:51:25.010Z.

> Employer immigration sponsorship is not available for this role.

Evidence rationale: This is an explicit refusal within the internship qualifications. The extension's sponsorship label agrees with the evidence.

Actual extension result: job-posting; sponsorship unavailable. Detected title: “Northwestern Mutual”. Employer: not identified.

Why it agrees or differs: The label is correct, but the tool selects Northwestern Mutual, the employer-brand h1, as the role title instead of the Actuarial Systems Intern h2. It therefore discards the mismatching structured job metadata and loses the employer field. This is a label success with an identity defect, not a fully correct job record.

### 14. Motorola — Software Engineer Intern - Summer 2027

Assessment: **unclear**. Evidence basis: Official posting. [Reviewed source](https://motorolasolutions.wd5.myworkdayjobs.com/Careers/job/Greater-Chicago-Area/Software-Engineer-Intern---Summer-2027_R68679). Retrieved 2026-09-26T16:51:26.518Z.

No policy quotation is supplied: the reviewed content did not establish sponsorship availability or refusal.

Evidence rationale: The description states degree requirements, location, and no relocation assistance, but no sponsorship policy. Relocation and visa sponsorship are separate questions.

Actual extension result: unreadable; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The visible Workday title is h2 and the h1 is empty. The scanner returns unreadable before it interprets the job description. This is a job-detection miss even though the correct sponsorship assessment remains unclear.

### 15. Intel — Software Research Intern - PhD 🎓

Assessment: **unclear**. Evidence basis: Official posting. [Reviewed source](https://intel.wd1.myworkdayjobs.com/en-us/external/job/US-Oregon-Hillsboro/Software-Solutions-PhD-Intern-New-2027_JR0287314). Retrieved 2026-09-26T16:51:28.257Z.

No policy quotation is supplied: the reviewed content did not establish sponsorship availability or refusal.

Evidence rationale: The PhD internship's technical qualifications, compensation, and general employment statement do not explicitly answer sponsorship. Intel's reputation or history cannot fill that gap for this requisition.

Actual extension result: unreadable; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The job title is h2. Branding and cookie-dialog headings do not provide the unique supported role title required by the scanner, which returns unreadable despite matching-looking structured job information.

### 16. Greenheck Group — Application Developer Co-op

Assessment: **unclear**. Evidence basis: Official posting. [Reviewed source](https://greenheckgroup.wd5.myworkdayjobs.com/external/job/Schofield-WI/Application-Developer-Co-op_JR104721). Retrieved 2026-09-26T16:51:28.888Z.

No policy quotation is supplied: the reviewed content did not establish sponsorship availability or refusal.

Evidence rationale: The January–August 2027 co-op lists degree requirements and housing/sign-on support but does not state a visa-sponsorship policy. Financial assistance alone is not sponsorship evidence.

Actual extension result: unreadable; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The Workday role heading is h2 and does not satisfy roleTitle. The scanner reports unreadable. A title fix would restore a job record; the reviewed wording would still justify unclear.

Listing identity note: January–August 2027 co-op, not a summer-only internship.

### 17. Cencora — Software Intern

Assessment: **unavailable**. Evidence basis: Official posting. [Reviewed source](https://myhrabc.wd5.myworkdayjobs.com/Global/job/Remote-USA/Software-Intern_R2613763). Retrieved 2026-09-26T16:51:30.038Z.

> Must not require sponsorship to work in the United States now or in the future.

Evidence rationale: Under the role's qualifications, applicants must have no present or future sponsorship need. That establishes an exclusion for applicants requiring employer sponsorship.

Actual extension result: unreadable; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: Workday's h2 title blocks job recognition. A body-only run also stays unclear: the phrase rules handle several employer-refusal sentences but not this requirement-style formulation. Both job-title recognition and the interpretation of qualification bullets need work.

Separate restriction/context: No present or future sponsorship need.

### 18. American Century Investments — Software Developer Intern

Assessment: **unavailable**. Evidence basis: Official posting. [Reviewed source](https://americancentury.wd5.myworkdayjobs.com/AmericanCenturyInvestments/job/Kansas-City-Missouri/Software-Developer-Intern_R0005749-1). Retrieved 2026-09-26T16:51:31.703Z.

> This position is not eligible for visa sponsorship.

Evidence rationale: The posting explicitly excludes sponsorship, with surrounding wording extending the authorization requirement to present and future needs.

Actual extension result: unreadable; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The h2 role heading blocks the scanner, which returns unreadable. The body-only interpreter correctly returns unavailable. Fixing recognition would expose a refusal that the existing language rules already understand.

Separate restriction/context: Work authorization without sponsorship now or in the future.

### 19. DRW — Software Developer Intern

Assessment: **unclear**. Evidence basis: Official posting and application. [Reviewed source](https://job-boards.greenhouse.io/drwuniversityjobs/jobs/8220587). Retrieved 2026-09-26T16:51:31.234Z.

> Will you now or in the future require sponsorship for employment visa status

Evidence rationale: The application asks about sponsorship needs and requests an explanation. That is information collection, not an offer or refusal. No explicit policy was established in the reviewed vacancy.

Actual extension result: job-application; sponsorship unclear. Detected title: “Spring 2027 City Scholars Software Developer Intern”. Employer: not identified.

Why it agrees or differs: The extension correctly detects the role and keeps the question from becoming policy. It does not identify DRW as the employer because the Greenhouse page lacks the particular employer markup it uses. This would block optional research despite a valid job record.

Listing identity note: Live title is Spring 2027 City Scholars Software Developer Intern; the repository's shortened title omits that program and season.

### 20. Boston Scientific — Software Engineer Intern - R&D

Assessment: **unavailable**. Evidence basis: Official posting. [Reviewed source](https://bostonscientific.eightfold.ai/careers/job/563602813542900). Retrieved 2026-09-26T16:51:33.668Z.

> Boston Scientific will not offer sponsorship or take over sponsorship

Evidence rationale: The posting directly refuses sponsorship or transfer at present. Its qualification list additionally requires work eligibility without company sponsorship now or in the future.

Actual extension result: job-posting; sponsorship unclear. Detected title: “Single Position”. Employer: not identified.

Why it agrees or differs: The scanner calls the role Single Position, a template h1, instead of the h2 internship title. It discards the real job metadata and loses the employer. It extracts both restriction passages but leaves sponsorship unclear: the patterns do not support this named-company subject, and company sponsorship is absent from the generic without-sponsorship expression.

Separate restriction/context: Present refusal plus a qualification requiring no current/future company sponsorship.

### 21. Lazard — AI and Data Transformation Intern

Assessment: **unavailable**. Evidence basis: Official posting; requirement interpreted in context. [Reviewed source](https://icbpjb.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/LazardStudentCareers/job/6650). Retrieved 2026-09-26T16:51:36.058Z.

> Authorization to work in the United States without visa sponsorship

Evidence rationale: This appears in the role's eligibility list, making independent work authorization a condition of the internship. I interpret it as no sponsorship for the role. It does not establish a separate lifetime or future-employment policy.

Actual extension result: job-posting; sponsorship unclear. Detected title: “AI & Data Transformation Intern”. Employer: Lazard Student.

Why it agrees or differs: Title, employer, and the relevant passage are extracted. The rules require a formulation such as must be authorized or an explicit offer/refusal sentence, and do not carry the eligibility-list context into this noun-phrase bullet. The result remains unclear.

### 22. Astranis — Network Software Intern

Assessment: **unclear**. Evidence basis: Official posting with explicit eligibility restriction. [Reviewed source](https://job-boards.greenhouse.io/astranis/jobs/4705597006). Retrieved 2026-09-26T16:51:33.870Z.

> U.S. Citizenship, Lawful Permanent Residency, or Refugee/Asylee Status Required

Evidence rationale: The posting states a restricted set of immigration/citizenship categories. It does not offer visa sponsorship. Preserve the full alternatives: this is broader than a citizens-only rule, and sponsorship willingness is not directly stated.

Actual extension result: job-application; sponsorship unclear. Detected title: “Software Developer, Network Software Intern (Summer 2027)”. Employer: not identified.

Why it agrees or differs: The extension detects the role, keeps sponsorship unclear, and surfaces the restriction. Its generic Citizenship condition label should not be read as citizens-only; the full quote matters. Employer extraction is missing, which would block research.

Separate restriction/context: Citizenship, lawful permanent residence, refugee/asylee or other stated protected-individual status; not citizens only.

### 23. Arconic — Software Developer Intern

Assessment: **unavailable**. Evidence basis: Official posting. [Reviewed source](https://hdnn.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX/job/114233). Retrieved 2026-09-26T16:51:38.586Z.

> Visa sponsorship is not available for this position.

Evidence rationale: The posting explicitly refuses sponsorship for this vacancy. Its separate U.S.-person restriction should remain separate from that refusal and should not be rewritten as citizens-only.

Actual extension result: job-posting; sponsorship unavailable. Detected title: “Software Developer Intern”. Employer: Arconic.

Why it agrees or differs: The tool identifies the role and employer, recognizes the explicit refusal, and records the U.S.-person condition. This is a successful end-to-end example in the audited sample.

Separate restriction/context: U.S.-person condition stated separately.

### 24. Radiance Technologies — Software Engineer Intern

Assessment: **unclear**. Evidence basis: Official posting with explicit eligibility restriction. [Reviewed source](https://radiancetech.wd12.myworkdayjobs.com/Radiance_External/job/Dayton-Office/Software-Engineer-Intern-Spring-Summer-2027_HR102442). Retrieved 2026-09-26T16:51:37.152Z.

> US Citizenship with the ability to obtain a security clearance

Evidence rationale: This bullet appears under Requirements, making citizenship a stated condition. It is not an explicit sponsorship policy and should not be generalized to the whole employer.

Actual extension result: unreadable; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The h2 title prevents job detection. Even the body-only diagnostic misses the restriction because restrictionKind expects a word such as must, required, or only inside the same clause. The obligation is instead carried by the preceding Requirements heading, whose context is lost.

Separate restriction/context: U.S. citizenship and ability to obtain a clearance are required.

### 25. Illinois Tool Works — Software Engineer Intern

Assessment: **unclear**. Evidence basis: Secondary full-posting copy; primary URL redirected to careers homepage. [Reviewed source](https://simplify.jobs/p/9e770238-e3ff-491f-baa6-08a85518e661/Software-Engineer-Intern). Retrieved 2026-09-26T16:55:19.474Z.

No policy quotation is supplied: the reviewed content did not establish sponsorship availability or refusal.

Evidence rationale: The copied MTS/ITW internship description has no explicit sponsorship policy. The repository's employer link no longer opened that vacancy in the audited visit, so the live primary policy could not be confirmed.

Actual extension result: non-job; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The primary URL redirects to the general ITW careers page. Returning non-job for that destination is appropriate; it does not mean the extension missed a visible vacancy. The mirror detects the job and returns unclear. The copy identifies MTS as an ITW company, so future research must preserve the operating-entity distinction.

Additional runs: Secondary full-posting view: job-posting, sponsorship unclear ([source](https://simplify.jobs/p/9e770238-e3ff-491f-baa6-08a85518e661/Software-Engineer-Intern)).

### 26. Qumulo — Software Development Engineer Intern

Assessment: **unavailable**. Evidence basis: Official job overview. [Reviewed source](https://jobs.ashbyhq.com/qumulo/43855947-3a85-4d1c-8b8e-e0c0ddcaf183). Retrieved 2026-09-26T16:52:14.107Z.

> We are unable to provide visa sponsorship or transfer.

Evidence rationale: The separate job overview expressly refuses sponsorship and transfer. The repository's application view only asks about the applicant's visa situation, so that view alone cannot establish the refusal.

Actual extension result: job-posting; sponsorship unclear. Detected title: “Software Development Engineer (Seattle) - Internship 2027”. Employer: Qumulo.

Why it agrees or differs: The actual application-page scan returns unclear; the overview scan returns unavailable with the correct role and employer. This isolates missing description/navigation coverage rather than a phrase-rule defect. The application is also incorrectly marked description-found, so the UI understates the missing context.

Additional runs: Official overview: job-posting, sponsorship unavailable ([source](https://jobs.ashbyhq.com/qumulo/43855947-3a85-4d1c-8b8e-e0c0ddcaf183)).

### 27. GM financial — Software Development Engineer Intern

Assessment: **unavailable**. Evidence basis: Official posting. [Reviewed source](https://fa-exvu-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/job/260943). Retrieved 2026-09-26T16:51:42.919Z.

> GM FINANCIAL DOES NOT PROVIDE IMMIGRATION-RELATED SPONSORSHIP FOR THIS ROLE.

Evidence rationale: This explicitly refuses sponsorship. The following sentence also declines employer-of-record and paperwork support for listed arrangements including OPT, STEM OPT, and CPT. That support restriction must be preserved rather than simplified into an unsupported claim about every person's eligibility.

Actual extension result: job-posting; sponsorship unclear. Detected title: “Intern - Software Development Engineer”. Employer: GM Financial United States.

Why it agrees or differs: The correct role and employer are extracted, including the complete restriction paragraph. The rules do not recognize the named-company subject and immigration-related wording, and they do not connect the next sentence's This includes list to the refusal. Sponsorship, CPT, and OPT all remain unclear.

Separate restriction/context: Explicit refusal of employer immigration support, including the listed CPT/OPT arrangements.

### 28. AMD — AI Engineering Intern 🎓

Assessment: **unavailable**. Evidence basis: Search-indexed official posting, corroborated by secondary full-posting copy; browser URL returned HTTP 403. [Reviewed source](https://simplify.jobs/p/4dd92b4d-fcb3-4e7f-ab7e-984aa0260f5e/AI-Engineering-Intern). Retrieved 2026-09-26T16:55:23.664Z.

Also supported by the [indexed official requisition](https://careers.amd.com/careers-home/jobs/91005), accessed through web search on September 26, 2026.

> This role is not eligible for visa sponsorship.

Evidence rationale: The indexed official page matches requisition 91005 and directly excludes sponsorship. The linked full-posting copy contains the same exclusion. The direct browser could not retrieve the employer content.

Actual extension result: non-job; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The exact repository destination returned 403, leaving the extension no job text. It returns unavailable on the readable mirror, but that is a different source and is not counted as a primary-page success. The indexed source and live browser have different access paths.

Additional runs: Secondary full-posting view: job-posting, sponsorship unavailable ([source](https://simplify.jobs/p/4dd92b4d-fcb3-4e7f-ab7e-984aa0260f5e/AI-Engineering-Intern)).

### 29. State Farm — Software Developer Intern - HR&D

Assessment: **unavailable**. Evidence basis: Secondary full-posting copy; official URL returned HTTP 403. [Reviewed source](https://simplify.jobs/p/d824265f-dd15-4d91-8ad3-661f123098c7/Software-Developer-Intern). Retrieved 2026-09-26T16:55:23.672Z.

> employer will not sponsor applicants for U.S. work authorization

Evidence rationale: The full-posting copy expressly refuses employer work-authorization sponsorship for this opportunity. The same requisition is also reproduced elsewhere, but the live employer page was inaccessible; keep the conclusion marked as secondary-source evidence.

Actual extension result: non-job; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: The browser receives a 403 page, so the extension returns non-job without access to the policy. On the mirror it returns unavailable. This is an access limitation, not evidence that the phrase interpreter failed on the original policy.

Additional runs: Secondary full-posting view: job-posting, sponsorship unavailable ([source](https://simplify.jobs/p/d824265f-dd15-4d91-8ad3-661f123098c7/Software-Developer-Intern)).

### 30. Ralliant — Research and Development Co-op

Assessment: **unclear**. Evidence basis: Official posting. [Reviewed source](https://ibwujb.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/10637). Retrieved 2026-09-26T16:51:46.728Z.

No policy quotation is supplied: the reviewed content did not establish sponsorship availability or refusal.

Evidence rationale: The Qualitrol/Ralliant posting describes the co-op and its qualifications but does not establish sponsorship. The live role is a fall co-op despite appearing in the summer repository.

Actual extension result: non-job; sponsorship not reached. Detected title: none. Employer: not identified.

Why it agrees or differs: A valid h1 and Apply Now button exist, but the DOM has no usable JobPosting metadata. The generic detector requires two prescribed description keyword groups; this page supplies only the duties group and uses Who We're Looking For for qualifications. It is therefore labeled non-job.

Listing identity note: Live posting is a six-month Fall 2027 co-op; operating company is Qualitrol.

## Why these failures happen

### 1. Page recognition blocks the interpreter

The strongest recurring defect is title selection. Eleven readable vacancies fail to produce a role because their real title is an ordinary h2 or the available h1 is unsuitable. Two more produce a role with a wrong h1: Northwestern Mutual uses its company name, and Boston Scientific uses Single Position. The scanner requires a unique h1, data-job-title, or itemprop=title before it will use structured job data. A populated JobPosting alone therefore does not rescue these layouts.

Two SmartRecruiters pages fail the Apply-action check because their button says I’m interested. Ralliant fails a separate two-keyword-group threshold. These are detector problems; adding sponsorship phrases alone would not make the normal pipeline reach them.

### 2. Having the right words is not enough for the current rules

Six reviewed examples expose phrase/context gaps: Flint, Rockwell, Cencora, Boston Scientific, Lazard, and GM Financial. The relevant refusal remains unclear in the diagnostic body-only run or the official overview run. The gaps include sponsor visas, sponsor individuals, named-company subjects, a requirement that an applicant not need sponsorship, and eligibility bullets that omit the word must. These are concrete candidates for regression fixtures; none was fixed during the audit.

Radiance illustrates the same context problem for restrictions: a citizenship bullet derives its mandatory meaning from the preceding Requirements heading. The current clause-level restriction check loses that relationship.

### 3. The repository sometimes opens the application rather than the description

Flint, Bedrock, and Qumulo arrive on Ashby application views. The scanner marks them description-found because its completeness check accepts generic section words and a short text-length threshold; that does not prove the actual duties/eligibility description was read. Flint and Qumulo have refusal evidence on their overviews that is missing from the application view. Qumulo’s existing interpreter succeeds on its overview. Flint still needs a phrase improvement after the overview is read.

### 4. Source access and source identity matter

Lutron, First Citizens, AMD, and State Farm returned 403 in both primary visits. ITW redirected to its careers homepage. These five are not demonstrated semantic failures on employer text. Public copies let the assessment proceed, but cannot be silently counted as primary-page tool successes. Mirror pages also contain publisher annotations and unrelated company news, so using their badges as employer quotations would weaken evidence attribution.

The list is not uniformly summer-only: DRW resolves to a Spring City Scholars role, Ralliant to a Fall co-op, and Greenheck spans January–August. Vacancy title, employer entity, requisition, location, and term must be checked together.

### 5. Optional research cannot currently close these gaps

Research was not enabled during the browser benchmark. A separate read-only check of researchRequest and the supplied registry found 23 primary results without the role/employer identity needed to start research; the other 7 would be unmatched because the production registry contains Atlassian only. No live company-policy or historical lookup was performed or counted.

## Recommended improvement order

1. Select the actual role title using scoped headings and matching metadata. Add Workday, Eightfold, and SmartRecruiters fixtures; reject branding/template titles. Preserve ambiguity when multiple vacancies remain.
2. Recognize application actions such as I’m interested, and broaden description recognition without weakening negative-page checks.
3. Distinguish an application form from a complete job description. Link an overview only when its role identity matches, preserving which page supplied each quote.
4. Add the six observed language/context failures to section 7F. Preserve heading-to-bullet meaning, named employers, negation, timing, and support restrictions. Test against questions and applicant self-statements to avoid new false refusals.
5. Improve employer extraction and reviewed entity mappings. Keep operating companies distinct from parent companies; make unsupported research coverage explicit.
6. Explain access failures and expired/redirected links clearly. Keep secondary copies labeled. Retain separate citizenship/status warnings without converting them into unsupported company-wide sponsorship claims.
7. Collect a fresh, independently labeled set with positive offers, conditional offers, and hard negatives before measuring broad precision. This audit has no positive offer cases and cannot evaluate that capability.

## Artifacts and reproduction

- `sample.json`: frozen selection, repository row numbers, URLs, README hash, and extension commit.
- `reviews.json`: LLM assessments, short quotations, evidence basis, and case-specific diagnoses.
- `results.json`: joined assessment/tool comparison, aggregate counts, timestamps, and source text hashes.
- `raw/`: local-only full browser captures, rendered text, and screenshots. Ignored by Git; not an independently reviewed ground-truth corpus.
- `scripts/audit-live-postings.mjs`: read-only browser collection; `verify` obtains original-URL extension snapshots, `description` reads the three Ashby overviews, and `mirror-full` opens the linked copies’ Full posting view.
- `node --import tsx scripts/summarize-live-audit.mjs`: regenerates this report, validates 30 unique assessments and every quoted excerpt against its captured source, and computes counts.

The production scanner/interpreter/research behavior was not modified. The six major phrase gaps and the layout cases are findings for future implementation. This audit does not complete the independent human beta milestone.
