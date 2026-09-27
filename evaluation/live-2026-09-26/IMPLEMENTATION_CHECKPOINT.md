# Job recognition and extraction: first implementation checkpoint

Date: September 26, 2026 (America/Chicago). This compares the frozen [30-posting baseline](REPORT.md) with a fresh browser run of the changed extension on the same 30 original destinations. The sample is a development set; it is not an independent accuracy estimate or a new sponsorship-label evaluation.

## Result

| Measure | Baseline 0.6.0 | Current build |
|---|---:|---:|
| Original destinations returning a role | 11/30 | 25/30 |
| Readable vacancy/application destinations returning the right live role title | 9/25 | 25/25 |
| Explicit/requirement-based refusals on original rendered pages labeled unavailable | 2/9 | 4/9 |
| Original destinations with access/redirect limits | 5 | 5 |

The five destinations without a detected role are four HTTP 403 pages (Lutron, First Citizens, AMD, State Farm) and ITW's redirect to a careers homepage. They are not counted as recognition failures on readable vacancy content. All 30 final `-implementation.json` snapshots returned `state: ready`. The baseline uses the original `-verified.json` captures and remains unchanged.

The two previously incorrect titles are fixed: Northwestern Mutual now reads “Actuarial Systems Intern, Summer 2027,” and Boston Scientific reads “R&D Software Engineer Intern.” EA’s actual “Gameplay Engineer Intern” is now selected outside an unrelated `main` element. Workday `h2` titles, SmartRecruiters “I’m interested” actions, and Ralliant's description headings now produce role records.

Flint, Bedrock, and Qumulo application URLs contain full, matching `JobPosting.description` data even when the displayed form is short. The scanner now includes the missing description blocks as **structured page data**, checks Ashby's requisition identifier against the URL, and marks those pages as applications. Qumulo's refusal is now found. Flint's refusal wording is present in extracted evidence but still receives an unclear sponsorship label; that is the separate language-rule gap identified in section 7F. Bedrock's extracted description does not establish a sponsorship policy.

The nine same-page refusal quotations are all present in the current role evidence. Four are labeled unavailable (EA, Northwestern Mutual, American Century Investments, Arconic). Five remain unclear despite extraction (Rockwell, Cencora, Boston Scientific, Lazard, GM Financial). This distinction is important: better extraction cannot by itself fix the interpreter's phrase/context rules.

## Implemented behavior

- `src/scanner.ts` chooses a matching visible job heading over a company/template `h1`, supports reviewed `h2` title and application-action variants, and falls back to the body when the first `main` does not contain the role.
- Matching structured descriptions supplement omitted visible blocks even when some description text appears on the page. A short application form no longer suppresses full matching description data. Mismatched Ashby requisition data is rejected. Long descriptions and truncation keep warnings.
- Job-scoped closing notices in a selected detail container are included; unrelated site footers and recommended jobs stay excluded.
- Same-origin embedded jobs can supply a single role with frame-specific evidence attribution. The controller watches the frame for changes and refreshes the result. A visible inaccessible job frame produces an unreadable explanation rather than being called an ordinary non-job page.
- UI citation and evidence labels distinguish embedded-frame text from the top page and structured data.

## Verification

- TypeScript typecheck passed.
- 159 automated tests passed, including new cases for full Ashby metadata, stale requisition rejection, partial-overview supplementation, wrong headings, application actions, scoped closing notices, same-origin frames, dynamic frame changes, and inaccessible frames.
- The existing real-browser smoke test passed. A new real-browser embedded-job test confirmed the wrapper's finding changes when policy text inside its frame changes.
- A fresh isolated Chromium run visited all 30 original URLs through the built extension. The local full browser captures use the `raw/*-implementation.*` suffix and are ignored by Git.

## Remaining work in the plan

1. **Cross-origin frames.** The current implementation reads same-origin frames. Chrome content scripts are not yet coordinated across unrelated frame origins. The extension reports a likely inaccessible job frame; it does not silently claim to have read it. Frame-level injection, tab coordination, parent visibility, and pause propagation need the next implementation package.
2. **Descriptions unavailable on the current page.** Matching `JobPosting` data solves the three audited Ashby application examples. Jobs with neither a visible full description nor matching structured data still need verified overview links or documented ATS API recovery, with source identity and permission checks.
3. **Coverage model.** The existing binary `description-found`/`incomplete` field remains coarse. Replace it with source-specific coverage and explicit gaps before claiming full descriptions broadly. Open shadow roots, collapsed/virtualized sections, and unfamiliar layouts also need measured support.
4. **Language interpretation and employer identity.** Five same-page refusals remain unclear because of phrase/context rules. Several Workday employer names include internal codes or operating entities. Treat both as separate work from job-title detection.
5. **Independent evaluation.** The 30 cases were used to guide these changes. Run the planned labeled holdout across new employers, templates, positive sponsorship offers, and hard negatives before making general precision/recall claims.

Production source has changed for this checkpoint; no release package or deployment was created. The existing 0.6.0 baseline report remains a description of the older build.
