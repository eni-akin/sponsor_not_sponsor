# Training provenance recovery candidates

Checked all 25 original training rows against their original CSV identity and official employer/ATS sources. The JSON sidecar preserves internal IDs, original CSV record and vacancy IDs, evidence hashes, candidate URLs and match status. No normalized record, split, label, approved audit or frozen snapshot changed.

| Finding | Internal IDs |
|---|---|
| Opened primary vacancy and matched supplied clause | 1, 2, 4, 5, 16 |
| Full primary URL and indexed matching passage recovered; fresh rendered capture still needed | 6–15 |
| Official title verified; policy text not extracted | 3 |
| Original vacancy redirects to employer board with no openings | 17 |
| Matching official vacancy not recovered | 18–25 |

Confirmed direct sources include [Clarity](https://job-boards.greenhouse.io/clarityinnovates/jobs/5155449007), [Bridgewater](https://job-boards.greenhouse.io/bridgewater89/jobs/8811654002), [Sigma](https://job-boards.greenhouse.io/sigmacomputing/jobs/8001295003), [LOOMIS](https://job-boards.greenhouse.io/theloomisagency/jobs/4367872009), and [Northmarq](https://job-boards.greenhouse.io/northmarq/jobs/5414475008). Their fresh raw HTTP responses are saved in `provenance-recovery-captures/` and SHA-256 pinned in the sidecar. Run `python3 scripts/check_laya_recovered_captures.py` to verify bytes and evidence after HTML entity/whitespace normalization; Northmarq matches ordered fragments around the submitted ellipsis. Current matches do not prove the original submitted October 8 capture. Rendered/scanner completeness and reviewer approval remain pending.

Important source differences: LOOMIS describes a future talent-pipeline opportunity rather than active hiring; Northmarq's submitted ellipsis joins two source sentences; Fab2's submitted quoted benefit includes annotation outside the literal source bullet; Forge's abbreviated phrase omits its J-1 and export-control/country conditions. [Forge's identified electrical internship URL](https://jobs.ashbyhq.com/forgeatomics/cde5a5d6-1ce5-4eb4-9681-5d48f1b5082b) opens as a JavaScript shell through the web reader, while the official indexed content exposes the material context. [SteerBridge](https://jobs.lever.co/steerbridge/4eac2efd-ced5-4691-b00b-b5830447f2dc) has a Winter 2027 title but Winter 2026 wording in the description. Preserve these differences for source review; do not silently rewrite reviewed evidence.

Riot's supplied URL currently redirects to its program board. Enterprise Knowledge's Workable URL and HRT's submitted EU Greenhouse URL were not readable; a US HRT URL with the same ID also failed. The supplied Greenhouse paths for General Dynamics IT, Lockheed Martin, Boeing, Tesla, Apple and Meta did not yield matching official vacancies. Targeted searches of those employers' careers sites did not recover supplied IDs or exact relevant text. This is bounded unsuccessful recovery, not proof the vacancies never existed. Third-party copies were excluded as verification evidence.

IDs 20 and 25 need particular identity checks: General Dynamics IT shares submitted numeric ID 5414475008 with verified Northmarq, and Meta shares 8001295003 with verified Sigma. IDs alone do not establish employer identity. Do not infer the generic sponsorship statements from employer reputation.

Concrete missing input: provide original saved full postings with full official links and record/evidence binding for all 25, or approve a versioned fresh-capture review. Row 3 needs rendered official policy text; row 17 needs an original historical capture; rows 18–25 need correct official vacancy links and capture records. Every accepted capture needs retrieval time, source hash, real locator, completeness assessment and reviewer/date before corpus approval. The existing label approval is not a substitute for those source checks.

Verification: all 25 sidecar IDs bind to current normalized training evidence hashes, and original CSV bytes match the normalized input hash. Current/source-capture fields intentionally remain pending; this sidecar does not advance training readiness.
