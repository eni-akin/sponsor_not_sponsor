# Job Sponsorship Chrome Extension — Development Plan

Implementation is organized into [six deliverable sections](IMPLEMENTATION.md). Setup, build, and preview instructions are in [README.md](README.md).

Build this as a **Chrome extension that automatically recognizes job postings and application pages, checks the employer’s requirements, and shows a small badge with evidence.** It should work with links from any source and cover internships, full-time jobs, part-time jobs, and contract roles.

The development order should be: **page scanning → interpretation → badge → accuracy testing → company research → release.**

## 1. Define exactly what the extension reports

Keep the interface simple while tracking these findings separately:

| Finding | Possible results |
|---|---|
| Visa sponsorship | Available · Unavailable · Conditional · Unclear |
| CPT acceptance | Explicitly accepted · Explicitly excluded · Unclear |
| OPT acceptance | Explicitly accepted · Explicitly excluded · Unclear |
| Additional restrictions | Citizenship requirement, permanent-residency requirement, or other stated conditions |

Separate CPT and OPT internally because a posting may mention only one. Preserve any distinction between sponsorship now and sponsorship in the future.

Every definitive result must have a supporting sentence. “Unclear” is a valid outcome, not a failure.

The extension reports **what the employer states and what the research supports**. It should not claim to determine your personal immigration eligibility.

## 2. Design the automatic browsing experience

The normal flow should be:

1. You open a link.
2. The extension checks whether the page contains a job posting or application.
3. It identifies the current role and reads its requirements.
4. A small badge appears with the sponsorship finding.
5. Clicking it opens the evidence and CPT/OPT findings.
6. If the posting is silent, the extension can research the employer and update the evidence panel.

On ordinary pages, it stays out of the way.

Automatic scanning across websites requires browser permission to access those websites. Explain that during installation and request the access needed for automatic operation. A click-only permission model would not deliver the experience you described. Chrome documents these access requirements in its [permissions guidance](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions).

Include controls to pause scanning globally, disable it for a particular website, and dismiss the badge.

## 3. Build a generic page detector

The first engineering challenge is recognizing jobs without requiring a list of supported websites.

Use several signals together:

| Signal | How it helps |
|---|---|
| Structured job information embedded in the page | Identifies the employer, title, description, location, and sometimes eligibility requirements |
| Page headings and layout | Finds sections such as responsibilities, qualifications, and application instructions |
| Application elements | Detects an application form or an “Apply” action associated with a role |
| Page address | Provides a supporting clue when it contains job-related terms |
| Role identity | Helps distinguish a specific vacancy from a general careers page |

Some pages contain standardized `JobPosting` data, including fields for employment type and work eligibility. Use it when available, then compare it with the displayed posting. [Schema.org documentation](https://schema.org/JobPosting)

Do not decide that a page is a job merely because its address contains “careers.” Likewise, the absence of structured data must not prevent scanning.

Classify pages into:

- A specific job posting.
- An application for an identifiable role.
- A page containing several jobs.
- A non-job page.
- A page that cannot be interpreted reliably.

Initially, analyze the selected role on pages containing multiple jobs. Avoid combining requirements from unrelated vacancies.

**Deliverable:** a detector that identifies the current role across a varied collection of employer websites.

## 4. Extract the correct content

Once a job is detected, extract:

- Job title, employer, location, and role identifier when available.
- Description, qualifications, and eligibility requirements.
- Application question wording and relevant explanatory text.
- Supporting sentences and their location within the page.

Exclude navigation, recommended jobs, advertisements, your typed answers, and uploaded documents.

Store each relevant statement with enough surrounding text to preserve its meaning. For example, extracting “sponsorship available” from “sponsorship available only for senior positions” would lose a crucial condition.

Handle changing pages explicitly:

- Rescan when more description text loads.
- Detect navigation between roles without a full page reload.
- Clear the old badge immediately when the role changes.
- Discard delayed results belonging to a previous role.
- Avoid rescanning continuously when unrelated page elements change.

Application pages sometimes omit the job description. Carry findings forward only when the application can be reliably matched to the same vacancy. Otherwise, mark the available evidence as incomplete.

**Deliverable:** a clean job record with evidence that belongs to the correct vacancy.

## 5. Build the interpretation engine

Start with local text rules for explicit language. Add AI only where it improves interpretation of ambiguous or complicated wording.

The rules need to understand negation, conditions, timing, and the difference between a question and a policy.

| Example wording | Expected interpretation |
|---|---|
| “Visa sponsorship is available for this position.” | Sponsorship available |
| “We do not sponsor applicants for this role.” | Sponsorship unavailable |
| “Sponsorship may be considered.” | Conditional |
| “Applicants using CPT are welcome.” | CPT accepted; OPT remains unclear |
| “Will you now or in the future require sponsorship?” | Application question; policy remains unclear |
| “Applicants must already be authorized to work.” | Record the requirement; do not infer sponsorship policy |
| “U.S. citizenship is required.” | Explicit citizenship restriction |
| No relevant statement | Unclear |

Additional rules:

- Never infer CPT or OPT acceptance from silence.
- Never infer eligibility solely from “no sponsorship.”
- Preserve distinctions between current authorization and future sponsorship.
- Treat conflicting statements as requiring review.
- Keep role-specific evidence separate from company-wide information.
- Do not equate “U.S. person” with “U.S. citizen”; preserve the exact restriction.

If AI is used, require structured results containing the classification, supporting text, and explanation. Verify that its cited text actually exists in the supplied material. Unsupported conclusions fall back to “Unclear.”

Page content must be treated as untrusted input: it cannot instruct the extension to change settings, reveal information, or perform actions.

**Deliverable:** an interpretation engine whose conclusions can be traced to evidence.

## 6. Create the badge and evidence panel

Use a compact badge with text and color:

| Appearance | Meaning |
|---|---|
| Green | Sponsorship explicitly available |
| Red | Sponsorship explicitly unavailable |
| Amber | Conditional, conflicting, or unclear |
| Gray | Scanning, incomplete scan, or unable to read |

Show an explicit citizenship restriction prominently when present, rather than hiding it under the sponsorship label.

Clicking the badge should reveal:

- The employer and role being analyzed.
- Sponsorship, CPT, and OPT findings.
- The exact supporting sentences.
- Whether the evidence comes from the current posting or company research.
- Source links and research dates.
- A “Report incorrect result” action.

Avoid displaying an invented confidence percentage. Labels such as **“Explicitly stated,” “Company policy,”** and **“Historical evidence”** explain the basis more clearly.

The badge must not cover application controls or interfere with typing. Make it keyboard accessible, dismissible, and readable without relying on color alone.

**Deliverable:** a usable extension that scans and explains the current posting.

## 7. Add company research for unclear cases

This is the second major development stage. Build it after direct page analysis works reliably.

Research in this order:

1. **The same vacancy on the employer’s official website.**
2. **Official hiring policies or FAQs** applicable to the role, location, or program.
3. **Historical sponsorship records**, such as employer petition data.
4. Other sources as leads that need stronger verification.

Match the correct employer carefully. A parent company, subsidiary, staffing agency, and end client may have different policies.

For every research result, save the source, retrieval date, applicable location, relevant evidence, and whether it concerns the specific role or the employer generally.

Historical records should produce wording such as:

> This employer has sponsored workers previously. Sponsorship for this vacancy is unconfirmed.

They must not produce a definitive “Sponsors” badge for a silent posting. Similarly, finding no historical record does not establish that an employer refuses sponsorship.

USCIS describes its employer data hub as providing information about H-1B petition activity; that makes it useful historical context. [USCIS report](https://www.uscis.gov/sites/default/files/document/reports/ola_signed_h1b_characteristics_congressional_report_FY24.pdf)

Make automatic research a setting enabled during onboarding. Once enabled, it can run without an extra click when the posting is unclear.

**Deliverable:** researched context with sources, while preserving uncertainty about individual roles.

## 8. Use a small, maintainable architecture

My proposed technical structure is:

| Component | Responsibility | Initial implementation |
|---|---|---|
| Page scanner | Detect jobs and extract text | TypeScript content scripts |
| Interpretation engine | Apply rules and resolve evidence | Shared TypeScript module |
| Badge and panel | Display findings | HTML/CSS with isolated styling |
| Background coordinator | Manage requests and cached results | Manifest V3 service worker |
| Local storage | Save settings and recent findings | Chrome storage |
| Research service | Retrieve public sources and optionally call AI | Small TypeScript backend, added later |
| Research database | Cache employer evidence and source dates | Add when research becomes necessary |

Chrome content scripts support reading page content and adding interface elements. [Chrome documentation](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)

Keep the initial scanner and explicit-language interpretation local. This makes the core feature usable without a backend or recurring AI expense.

When adding research, keep API credentials on the server. Persist request state and cached results because Chrome can stop an idle background worker. [Service-worker lifecycle guidance](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)

## 9. Validate accuracy and reliability before release

Create a manually reviewed collection of approximately **150–200 examples**, including ordinary pages and varied job layouts. Keep some examples separate from development so the final evaluation measures behavior on unfamiliar cases.

Test four areas:

| Area | What to verify |
|---|---|
| Detection | Correctly identifies jobs and ignores ordinary pages |
| Extraction | Captures requirements from the correct role |
| Interpretation | Handles explicit, conditional, missing, and conflicting evidence |
| Browser behavior | Updates correctly during navigation and does not disrupt applications |

Include cases with:

- CPT accepted but OPT unmentioned.
- No future sponsorship.
- Citizenship restrictions.
- Sponsorship questions without a policy.
- Historical company sponsorship but a role-specific exclusion.
- Multiple jobs on one page.
- Delayed loading, embedded forms, missing descriptions, and unsupported content.
- Network failures and delayed research results.

Track definitive-label accuracy separately from coverage. A system that labels everything “Unclear” is safe but unhelpful; one that guesses frequently is untrustworthy.

A proposed beta target is **at least 95% precision for definitive sponsorship labels on the held-out examples**, reported with sample counts and errors. Treat that as an engineering target, not a claim about all websites. Also measure how often the extension reaches a useful conclusion.

## 10. Package and release in stages

| Phase | Main work | Completion condition |
|---|---|---|
| 1: Specification | Finalize labels, examples, scope, and data handling | Clear interpretation rules and test cases |
| 2: Scanner | Detection, extraction, and page-change handling | Correct role identified across varied layouts |
| 3: Local prototype | Rules, badge, evidence, and settings | End-to-end analysis without a server |
| 4: Private beta | Accuracy evaluation and browsing tests | Main errors fixed; limitations documented |
| 5: Research | Official sources, historical context, and caching | Research results are sourced and scoped correctly |
| 6: Release | Packaging, onboarding, privacy disclosures, and store submission | Installable release ready for review |

For planning, I would initially scope **English-language U.S. job postings across all employment types**, because your sponsorship and CPT/OPT needs are U.S.-specific. Other countries and languages can follow.

Allow roughly **4–6 focused development weeks for a tested local-scanning beta**, with additional time for reliable company research. That is an estimate for one developer; broad website coverage is the largest uncertainty.

Before store submission, make the privacy disclosures match the actual behavior, particularly any job-page information sent to a server. Chrome’s policies specifically address collection and transmission of browsing data. [Chrome Web Store privacy requirements](https://developer.chrome.com/docs/webstore/user_data)

**The first concrete milestone is an installable prototype that recognizes a job you open, shows separate sponsorship/CPT/OPT findings, and lets you inspect every supporting sentence.** That gives you something useful to test during your normal application process before investing in the research layer.
