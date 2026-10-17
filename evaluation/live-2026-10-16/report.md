# Live extension audit — October 16, 2026

Status: completed diagnostic audit. Reviewer: Codex AI subagent; this is AI review, not the independently human-reviewed acceptance holdout.

## Protocol and frozen source

Requested: 30 newest distinct, currently open vacancies from SimplifyJobs/Summer2027-Internships, official-page review followed by observed extension output in the user's existing Chrome profile.

Frozen discovery snapshot: [README at repository revision 283f6bf9ab799d8492b02b965905d6f2881e9a68](https://github.com/SimplifyJobs/Summer2027-Internships/blob/283f6bf9ab799d8492b02b965905d6f2881e9a68/README.md). GitHub reported repository update October 16 at 10:32 PM CDT; README last changed in commit 51ad199, October 16 at 9:01 PM CDT. Snapshot contains 1,888 advertised open roles across five categories. All categories were inspected in the frozen README blob, which rendered beyond the root-page cutoff.

“Latest” is ascending published README Age in whole days across every category, ties by original README row order (software engineering, product, data/AI, quant, hardware). This is day-resolution discovery recency, not an assertion about official posting timestamps. No geography/platform/policy filter. Follow order until 30 distinct official vacancies are verified open. Duplicate ATS requisitions, closed pages, inaccessible pages and replacements remain in selection accounting. GitHub sponsorship/citizenship symbols are discovery metadata only.

Before reading each extension result, checkpoint reviewer labels/rationale from official public evidence under DECISION_LOGIC.md. Page badges can appear automatically; any incidental prediction exposure must be recorded. No job applications, logins, uploads, answers or private applicant data are permitted. No product changes.

## Installed build preflight

- Existing Google Chrome profile “Your Chrome”, browser extension connection; unrelated tabs untouched.
- Native extension details: Sponsor Not Sponsor enabled, version 0.6.0, ID `ndfnnajgacnlonkcabmhfgbnabfjiifi`, unpacked source `~/Documents/Project/Sponsor_Not_Sponsor/dist`, existing access On all sites.
- Clicked extension Reload and observed “Reloaded” before cases. Deterministic popup shows main-result interface and no Local Laya controls. Initial welcome introduction remains undismissed; scanning pause checkbox off.
- Source baseline HEAD `8fd40dc5a63560a979f0753e50e68f1915910ad4`, dirty publication-removal tree. Parent supplied current dist SHA-256: content.js `382d60a002cd6d4e022bb534b1291bcc6fbb0de204f05342d1102bf26de6038d`; background.js `294a71e9d7812eccd3a106049f5a5f530aa7b163e56807483a59417f1c7bbb76`; popup.js `84d7fc91d2020ea3f5c904d564248fdc411c4cafa366c461e6f5f5ed4ac309d8`; manifest.json `4a9732024d69032a07217902705cade71b21ce5198ae9c297e974120e5451f6d`.
- Build identity evidence is source-path plus observed reload and current UI, not an in-memory asset hash extracted from Chrome.

## Metrics

### Denominators

The operational denominator is all 30 distinct active vacancies. The undisputed headline denominator excludes only C02, whose gold label needs human adjudication. The scannable decision-quality denominator is the 27 records with `qualityEligible=true`: it also excludes C10 (the tested `/apply` source was incomplete, so the extension safely abstained) and C21 (the displayed title was the company name rather than the vacancy). It does not exclude misses, non-U.S. pages, correlated policies, or incidental prediction exposure C01.

| Measure | Count | Rate |
| --- | ---: | ---: |
| Headline agreement, all 30, C02 treated as the initial blocker label | 23/30 | 76.7% |
| Headline agreement, all 30, C02 treated as contextual/no-blocker | 24/30 | 80.0% |
| Headline agreement, undisputed cases | 23/29 | 79.3% |
| Headline agreement with correct title, undisputed cases | 22/29 | 75.9% |
| Headline agreement, scannable decision-quality subset | 22/27 | 81.5% |
| Complete decision delivered on the tested source | 29/30 | 96.7% |
| Correct vacancy title | 29/30 | 96.7% |
| Correct public employer | 13/30 | 43.3% |
| Identity completeness: correct title and public employer | 13/30 | 43.3% |

Strict identity requires both the vacancy title and public employer to match. A blank employer fails that usability measure but does not, by itself, prove the wrong vacancy was analyzed. C21 is the only wrong-title case. C30 displayed an internal entity and code-like location rather than the public employer/location.

### Headline confusion matrix

The undisputed 29-case matrix is:

| Gold \\ actual | Explicit blocker found | No blocker found | Could not verify | Total |
| --- | ---: | ---: | ---: | ---: |
| Explicit blocker found | 10 | 5 | 0 | 15 |
| No blocker found | 0 | 13 | 1 | 14 |
| Total | 10 | 18 | 1 | 29 |

On the 27-case scannable decision-quality subset, the matrix is 10 blocker true positives, five blocker false negatives, zero blocker false positives, and 12 correct no-blocker results. Blocker precision is **10/10 (100%)** and blocker recall is **10/15 (66.7%)**. The five missed blockers are C05–C08 and C27. Precision has a real denominator here, but the small, selected, policy-correlated sample does not establish general precision. No `Sponsorship stated` case occurred, so accuracy for that class is **null**, not perfect.

### Scope, platform and source sensitivity

The registered extension language/scope is English U.S. postings. In that supported subset, headline agreement was **18/19 (94.7%)**; blocker precision was **8/8 (100%)** and recall **8/9 (88.9%)**, with C27 the only headline miss. The other/mixed-geography subset had five agreements among ten undisputed cases (50.0%); including disputed C02 gives either 5/11 (45.5%, initial blocker label) or 6/11 (54.5%, contextual label). On the quality-eligible non-U.S. subset, agreement was 4/8 (50.0%).

| Platform subgroup | Undisputed agreement | Interpretation |
| --- | ---: | --- |
| EA | 2/6 | Four correlated UK `visa/relocation support` misses; two Canada explicit sponsorship refusals detected. |
| Workday | 3/4 | C27 missed; C28/C29 agree only on the frozen first-linked source. |
| Lever | 0/1 | C10 safely abstained on an incomplete application-only source. |
| Avature | 1/1 | Headline text agreed, but C21 selected the wrong title and is not quality-eligible. |
| Eightfold | 2/2 | Excludes disputed C02; the two undisputed U.S. cases agreed. |
| All other platforms | 15/15 | Small per-platform counts; identity and citation defects remain separate. |

The EA misses are four vacancies from one employer and one wording family, so they are not four independent policy families. They are also outside supported U.S. scope. Conversely, EA Canada C14/C15 were detected, so this is not a blanket EA-page failure.

C28 and C29 use frozen first-linked Students-Graduates pages whose reviewed text had no policy. Later duplicate RyanCareers portals for those same requisitions contain the same U.S. no-now/future-sponsorship refusal seen at C27. Treating that same-vacancy official evidence as the whole-vacancy gold label changes undisputed agreement to **21/29 (72.4%)**, quality-subset agreement to **20/27 (74.1%)**, and blocker recall to **10/17 (58.8%)**. These are two additional policy-source coverage misses, not two extra cases. C27 remains a miss under either view.

### Coverage and citations

C10 is the one coverage failure: the original Waabi Lever `/apply` page was incomplete and the observed `Could not verify` was the safe source-level result. The independently reviewed official overview had no blocker, so it still fails all-30 full-vacancy decision delivery. No alternate overview prediction was substituted.

All ten displayed blocker decisions had citations that were exact source substrings after whitespace normalization: **10/10 posting-level source binding**. This denominator applies only to cited decisions; citation validity for the other 20 outputs is **null**. Six of the ten cited decisions preserved the main reviewed evidence semantically; four were partial:

- C01 ended during the Department of State organization name but retained the eligible-authorization alternative.
- C11 showed the current refusal but omitted the separate now-or-future requirement from main evidence.
- C22 dropped leading `U.S.` from the citizenship quote and did not surface the STEM OPT-support policy.
- C30 dropped `U.S.` and omitted the later role-specific clearance/company-period condition.

The UI sometimes repeated a passage or joined it to adjacent text, so the saved `mainQuoteCount` is not treated as a denominator of independently validated quote units. The exposed UI did not show all internal sponsorship, CPT, OPT, timing, and eligibility fields consistently; this audit therefore does not claim per-field policy accuracy.

## Case summary

Full chronological checkpoints and observed output are in [cases.md](cases.md); each evidence link below is the immutable sanitized reviewer excerpt whose hash is recorded in [results.json](results.json).

| Case | Official source / evidence | Gold → actual | Outcome |
| --- | --- | --- | --- |
| C01 | [Impulse Space](https://impulsespace.pinpointhq.com/en/postings/66981a77-8e79-4050-9818-4ed4209c5579?ats=pinpointhq&utm_source=Simplify&ref=Simplify) / [evidence](evidence/C01.md) | Blocker → Blocker | Agree; citation partial; incidental badge exposure. |
| C02 | [Qualcomm](https://qualcomm.eightfold.ai/careers/job/446721615591?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C02.md) | Disputed → No blocker | Human adjudication needed; initial label was blocker. |
| C03 | [Wellmark](https://jobs.smartrecruiters.com/WellmarkInc/744000156043218?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C03.md) | Blocker → Blocker | Agree; employer blank. |
| C04 | [Amazon UK](https://amazon.jobs/en/jobs/10554586/2027-software-dev-engineer-intern-united-kingdom?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C04.md) | No blocker → No blocker | Agree; employer blank. |
| C05 | [EA Gameplay UI](https://jobs.ea.com/en_US/careers/JobDetail/Software-Engineer-Intern-Gameplay-UI/216190?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C05.md) | Blocker → No blocker | Missed UK visa-support refusal. |
| C06 | [EA Client AI](https://jobs.ea.com/en_US/careers/JobDetail/Client-AI-Software-Engineer-Intern/216364?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C06.md) | Blocker → No blocker | Missed UK visa-support refusal. |
| C07 | [EA Tools](https://jobs.ea.com/en_US/careers/JobDetail/Software-Engineer-Intern-Tools/216192?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C07.md) | Blocker → No blocker | Missed UK visa-support refusal. |
| C08 | [EA UI Scripter](https://jobs.ea.com/en_US/careers/JobDetail/UI-Scripter-Intern/216359?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C08.md) | Blocker → No blocker | Missed UK visa-support refusal. |
| C09 | [Together AI](https://job-boards.greenhouse.io/togetherai/jobs/5267198007?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C09.md) | No blocker → No blocker | Agree; questions not treated as policy. |
| C10 | [Waabi `/apply`](https://jobs.lever.co/waabi/480d9d41-33d0-429a-8883-7f9ec305a30f/apply?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C10.md) | No blocker → Could not verify | Safe abstention; full-vacancy coverage failure. |
| C11 | [Boston Scientific AI/Data](https://bostonscientific.eightfold.ai/careers/job/563602813519129?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C11.md) | Blocker → Blocker | Agree; future-timing evidence partial. |
| C12 | [Lumen](https://internaljobs.centurylink.com/job/Remote-Data,-Analytics-&-Decision-Science-Summer-2027-Internship-Pathway/1440961600/?ats=successfactors&utm_source=Simplify&ref=Simplify) / [evidence](evidence/C12.md) | No blocker → No blocker | Agree; employer blank. |
| C13 | [Veeam](https://job-boards.eu.greenhouse.io/veeamsoftware/jobs/4996533101?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C13.md) | Blocker → Blocker | Agree; employer blank. |
| C14 | [EA Analytics](https://jobs.ea.com/en_US/careers/JobDetail/Analytics-Intern/216232?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C14.md) | Blocker → Blocker | Agree; Canada refusal detected. |
| C15 | [EA AI/ML](https://jobs.ea.com/en_US/careers/JobDetail/AI-ML-Software-Engineer-Intern-Summer-2027-8-Months-Masters-QVS/216234?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C15.md) | Blocker → Blocker | Agree; Canada refusal detected. |
| C16 | [Cummins](https://fa-espx-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/job/2436714?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C16.md) | No blocker → No blocker | Agree; UK, employer blank. |
| C17 | [Nutanix](https://jobs.jobvite.com/nutanix/job/oqjOAfwR?nl=1&nl=1&fr=false&utm_source=Simplify&ref=Simplify) / [evidence](evidence/C17.md) | Blocker → Blocker | Agree; employer blank. |
| C18 | [onsemi](https://hctz.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/2506972?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C18.md) | No blocker → No blocker | Agree; employer blank. |
| C19 | [AGCO](https://careers.agcocorp.com/job/Hesston-Embedded-Software-Engineering-Intern-Summer-2027-KS-67062/1440993300/?ats=successfactors&utm_source=Simplify&ref=Simplify) / [evidence](evidence/C19.md) | No blocker → No blocker | Agree; employer blank. |
| C20 | [Boston Scientific Hardware](https://bostonscientific.eightfold.ai/careers/job/563602813563527?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C20.md) | Blocker → Blocker | Agree. |
| C21 | [Synopsys](https://synopsys.avature.net/careers/JobDetail/19195?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C21.md) | No blocker → No blocker | Superficial agreement; wrong vacancy title. |
| C22 | [ADT](https://fa-erqb-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/job/3022475?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C22.md) | Blocker → Blocker | Agree; jurisdiction/OPT evidence partial. |
| C23 | [DoorDash](https://job-boards.greenhouse.io/doordashusa/jobs/8274095?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C23.md) | No blocker → No blocker | Agree; questions not treated as policy. |
| C24 | [Abridge](https://jobs.ashbyhq.com/abridge/aab11857-7ed3-4fc5-aab3-35256601117e/application?embed=true&utm_source=Simplify&ref=Simplify) / [evidence](evidence/C24.md) | No blocker → No blocker | Agree; structured source supplied complete description. |
| C25 | [Healthpeak NYC](https://healthpeak.applytojob.com/apply/ss4v1Qi95q/Forward-Deployed-Software-Engineer-Internship?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C25.md) | No blocker → No blocker | Agree. |
| C26 | [Healthpeak Irvine](https://healthpeak.applytojob.com/apply/RTf9TfJE4h/Forward-Deployed-Software-Engineer-Internship?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C26.md) | No blocker → No blocker | Agree. |
| C27 | [Ryan Software Engineering](https://ryan.wd1.myworkdayjobs.com/RyanCareers/job/Plano/Summer-2027-Intern--Software-Engineering_R0020843-1?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C27.md) | Blocker → No blocker | Missed expanded About Us refusal; rescan still missed. |
| C28 | [Ryan Application Development](https://ryan.wd1.myworkdayjobs.com/Students-Graduates/job/Plano/Summer-2027-Intern--Application-Development_R0020820?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C28.md) | No blocker → No blocker | First-source agree; duplicate portal contains refusal. |
| C29 | [Ryan Software Development](https://ryan.wd1.myworkdayjobs.com/Students-Graduates/job/Plano/Summer-2027-Intern--Software-Development_R0020822?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C29.md) | No blocker → No blocker | First-source agree; duplicate portal contains refusal. |
| C30 | [Northrop Grumman](https://ngc.wd1.myworkdayjobs.com/Northrop_Grumman_External_Site/job/United-States-Colorado-Aurora/XMLNAME-2027-Software-Engineering-Intern---Aurora-CO_R10256243?utm_source=Simplify&ref=Simplify) / [evidence](evidence/C30.md) | Blocker → Blocker | Agree; identity display and citation scope partial. |

## Ranked findings and next actions

1. **Diagnose the supported-scope C27 miss first.** The expanded public About Us refusal remained undetected after `Scan again`. This is the only headline miss among 19 supported U.S. cases. The page-panel record cannot establish whether extraction or interpretation failed, so reproduce with diagnostics before editing shared code.
2. **Then investigate the larger EA UK wording cluster.** Four correlated complete pages missed explicit `without ... visa/relocation support` language, while the Canada `visa sponsorship is not available` wording passed. This cluster is more frequent in the sample but outside registered U.S. scope. Add one root-cause diagnosis before changing rules, then retain distinct sponsorship and relocation semantics.
3. **Test same-vacancy source selection.** C28/C29 show that official portal variants for one requisition can expose different policy text. Define the authoritative source/recovery boundary without transferring policy across unrelated vacancies.
4. **Preserve citation scope, not only substring validity.** Add regressions for the four partial cases, especially jurisdiction words, alternatives, conditions, and the separate STEM OPT policy. Avoid treating repeated UI quotations as independent evidence.
5. **Fix identity presentation separately from decision logic.** C21 selected the company as the title; 17 postings did not show the public employer, and C30 showed an internal entity/location code. Identity failures should prevent confident vacancy attribution where the title is wrong, but employer blanks need not invalidate an otherwise matched decision.
6. **Adjudicate C02 before using it in any quality total.** `May require` a license and `may impact` participation do not state denial or a deadline. Preserve the original blocker label and the contextual alternative until a human reviewer applies the contract.

Do not implement fixes from this audit without a separate owner request. After any authorized fix, rerun focused platform regressions first, then a fresh independent human-reviewed set meeting the registered 50-vacancy/20-employer gate.

## Integrity and limitations

`node evaluation/live-2026-10-16/verify.mjs` verifies 30 ordered case IDs, HTTPS URLs, distinct tested source URLs, unique tested Workday requisitions, every evidence hash, every source-locator hash, checkpoint/actual presence, and the reported core metrics. The source-locator hash covers the URL string; the evidence hash covers the sanitized checkpoint file. Neither is a raw remote-page hash. Full HTML, exact HTTP retrieval timestamps, and the native diagnostic extraction for C27 were not captured.

Selection was latest-by-README-age rather than random, used day-resolution discovery metadata rather than official post dates, and is employer/policy-family correlated. The first 33 candidate rows yielded 30 distinct active vacancies across 21 normalized employers, three duplicate official Ryan portals, and zero closed/inaccessible pages. The sample is only 30 AI-reviewed cases, below the registered 50 human-reviewed vacancies even though it spans more than 20 employers, and cannot pass the release gate or establish general accuracy. C01 had one known incidental badge exposure. Authored fixtures and previously exposed development reviews remain outside this diagnostic sample.
