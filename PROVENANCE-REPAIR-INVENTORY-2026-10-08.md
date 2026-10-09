# Provenance repair inventory — October 8, 2026

All 50 normalized IDs require an official URL, verified vacancy identity, source-capture hash and explicit capture/completeness verification before an operational freeze. Existing employer, job title, retrieval date, locator, evidence hash and owner-reviewed labels remain available.

Read-only inspection found the original CSVs at `/Users/eniola/Downloads/Training Dataset.csv` and `/Users/eniola/Downloads/Calibration dataset.csv`. Their SHA256 hashes match the normalized source:

- `225bf5424b6029b90028774d4909a49bd2e85454d110dbe6fe2ffe273f6b8036  /Users/eniola/Downloads/Training Dataset.csv`
- `b09faefc60e679f37c0c192694bc7ba32d1c68383eff946b310c71da65f8d667  /Users/eniola/Downloads/Calibration dataset.csv`

Every original Official Source URL field ends in literal `/...` and omits a scheme. None is a complete recoverable official posting URL. Do not reconstruct a Greenhouse or Workable URL from an ID and treat it as verified. The original vacancy values can be preserved as unverified candidate identity; several Ashby/Lever values are short prefixes, and employer-ID combinations need checking against the actual source.

Every row in the inventory inherits these missing fields:

- `officialSourceUrl`: complete verified posting URL, absent; original URL hint below is truncated.
- `vacancyIdentity`: absent from normalized records; candidate original CSV value below is recoverable but unverified.
- `capturePath` and `sourceCaptureSha256`: no immutable HTML/PDF/full-text capture and hash supplied.
- `captureCompleteness`, `completenessReviewer`, `completenessReviewedAt`: the normalized `captureStatus: owner-confirmed` does not state full-posting completeness or bind it to captured bytes. Do not infer complete status from a single evidence passage.
- `sourceOfficialVerification`: owner-confirmed extracted evidence is preserved; verification must bind the exact complete URL and vacancy to the captured source.

| Internal ID | Intended split | Original record ID | Candidate vacancy ID (unverified) | Original truncated URL hint |
|---|---|---|---|---|
| 1 | train | clarity-5155449007 | 5155449007 | job-boards.greenhouse.io/clarityinnovates/... |
| 2 | train | bridgewater-8811654002 | 8811654002 | job-boards.greenhouse.io/bridgewater89/... |
| 3 | train | rational-7aecd74b | 7AECD74B8B | apply.workable.com/rational/... |
| 4 | train | sigma-8001295003 | 8001295003 | job-boards.greenhouse.io/sigmacomputing/... |
| 5 | train | loomis-4367872009 | 4367872009 | job-boards.greenhouse.io/theloomisagency/... |
| 6 | train | phoebe-1ffe3e63 | 1ffe3e63 | jobs.ashbyhq.com/phoebe-work/... |
| 7 | train | periodic-2cfb099d | 2cfb099d | jobs.ashbyhq.com/periodic-labs/... |
| 8 | train | kos-efab6ffb | efab6ffb | jobs.ashbyhq.com/kos.ai/... |
| 9 | train | ctgt-f657c2f5 | f657c2f5 | jobs.ashbyhq.com/ctgt/... |
| 10 | train | solcoa-3ee78458 | 3ee78458 | jobs.ashbyhq.com/solcoa/... |
| 11 | train | fab2-f38b33e7 | f38b33e7 | jobs.ashbyhq.com/Fab2/... |
| 12 | train | forgeatomics-cde5a5d6 | cde5a5d6 | jobs.ashbyhq.com/forgeatomics/... |
| 13 | train | primer-edd1667b | edd1667b | jobs.ashbyhq.com/primer/... |
| 14 | train | sep-4efbdbce | 4efbdbce | jobs.lever.co/sep/... |
| 15 | train | steerbridge-4eac2efd | 4eac2efd | jobs.lever.co/steerbridge/... |
| 16 | train | northmarq-5414475008 | 5414475008 | job-boards.greenhouse.io/northmarq/... |
| 17 | train | riotgames-8222015 | 8222015 | job-boards.greenhouse.io/riotgamesup/... |
| 18 | train | enterprise-b3cdb8e3 | B3CDB8E3D3 | apply.workable.com/enterprise-knowledge/... |
| 19 | train | hrt-4959300101 | 4959300101 | job-boards.eu.greenhouse.io/hudsonrivertrading/... |
| 20 | train | gd-it-5414475008 | 5414475008 | job-boards.greenhouse.io/gdit/... |
| 21 | train | lockheed-7814373003 | 7814373003 | job-boards.greenhouse.io/lockheedmartin/... |
| 22 | train | boeing-7815786003 | 7815786003 | job-boards.greenhouse.io/boeing/... |
| 23 | train | tesla-7595661003 | 7595661003 | job-boards.greenhouse.io/tesla/... |
| 24 | train | apple-8172706 | 8172706 | job-boards.greenhouse.io/apple/... |
| 25 | train | meta-8001295003 | 8001295003 | job-boards.greenhouse.io/meta/... |
| 26 | calibration | clera-9519167d | 9519167d | jobs.ashbyhq.com/clera/... |
| 27 | calibration | costello-bce9ff98 | BCE9FF987D | apply.workable.com/costello-medical/... |
| 28 | calibration | quantinuum-d36cdf8b | d36cdf8b | jobs.eu.lever.co/quantinuum/... |
| 29 | calibration | trovebrands-4429200009 | 4429200009 | job-boards.greenhouse.io/trovebrands/... |
| 30 | calibration | tandh-124738e5 | 124738e5 | jobs.lever.co/tandh/... |
| 31 | calibration | ghj-0142c010 | 0142c010 | jobs.lever.co/ghj/... |
| 32 | calibration | rmf-5257050 | 5257050 | rmf-engineering-inc.workable.com/... |
| 33 | calibration | deandorton-0ad4d773 | 0AD4D77341 | apply.workable.com/dean-dorton/... |
| 34 | calibration | hermeus-17a0b249 | 17a0b249 | jobs.lever.co/hermeus/... |
| 35 | calibration | xcimer-39fd5473 | 39fd5473 | jobs.lever.co/xcimer/... |
| 36 | calibration | theathletic-89e4e9d0 | 89e4e9d0 | jobs.lever.co/theathletic/... |
| 37 | calibration | cesiumastro-79d56d02 | 79d56d02 | jobs.lever.co/CesiumAstro/... |
| 38 | calibration | ncino-4409531009 | 4409531009 | job-boards.greenhouse.io/ncinoearlytalent/... |
| 39 | calibration | alku-6674219 | 6674219 | job-boards.greenhouse.io/alkujobs/... |
| 40 | calibration | dynamiccatholic-603f082e | 603f082e | jobs.lever.co/dynamiccatholic/... |
| 41 | calibration | fiducial-bc62c5e2 | bc62c5e2 | jobs.ashbyhq.com/fiducial/... |
| 42 | calibration | nex-5422027008 | 5422027008 | job-boards.greenhouse.io/nex/... |
| 43 | calibration | optiver-8402215002 | 8402215002 | job-boards.greenhouse.io/optiverus/... |
| 44 | calibration | thinkacademy-7980990003 | 7980990003 | job-boards.greenhouse.io/thinkacademyus/... |
| 45 | calibration | imc-4959300101 | 4959300101 | job-boards.eu.greenhouse.io/imc/... |
| 46 | calibration | roblox-8143984 | 8143984 | job-boards.greenhouse.io/roblox/... |
| 47 | calibration | captiveaire-8734835002 | 8734835002 | job-boards.greenhouse.io/captiveaire/... |
| 48 | calibration | aks-4395456009 | 4395456009 | job-boards.greenhouse.io/aks-internships/... |
| 49 | calibration | datadog-8172706 | 8172706 | job-boards.greenhouse.io/datadog/... |
| 50 | calibration | notion-8001295003 | 8001295003 | job-boards.greenhouse.io/notion/... |

## Sidecar repair approach

Create a separate, newly reviewed provenance sidecar keyed by `id` plus `evidenceSha256`. Pin the normalized source SHA256 and both original CSV hashes. For each ID record the verified complete official URL, canonical vacancy identity, retrieval timestamp, immutable capture path/hash, precise evidence locator, complete/incomplete coverage declaration and verifying reviewer/date. Bind the existing extracted passage to the exact capture; document discrepancies for owner review without silently changing the approved labels.

Keep normalized model inputs and existing candidate snapshot unchanged. A future version of the freeze validator should require all sidecar records, reject ID/evidence mismatch, verify capture hashes and official source identity, rerun employer/policy-family separation, and create a new operational corpus version only after provenance and held-out gates pass. Quarantined calibration IDs remain excluded; provenance recovery does not resolve policy-family overlap.

Additional identity caution: supplied numeric IDs recur across employers (for example Northmarq and General Dynamics IT share 5414475008; Sigma, Meta and Notion share 8001295003). This does not prove corruption across different ATS boards, but the number alone is not a globally unique vacancy identity. Use the verified employer/ATS posting URL as the binding identity.

No links, capture hashes or completeness facts were invented. Inspection establishes local recovery limits only; live source verification has not been performed.
