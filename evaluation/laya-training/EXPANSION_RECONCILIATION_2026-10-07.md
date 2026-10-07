# Expansion reconciliation — October 7, 2026

The two submitted expansion lists are candidate data, not training data. Apply [the decision contract](../../DECISION_LOGIC.md) and the corrections below before import. Do not assign a split until official-source provenance and employer/policy-family grouping are complete.

## Label corrections

- `middlebury-college-49B2582038:block-0`: sponsorship `unclear`; citizenship remains a separate blocker.
- `secretariat-advisors-4399032009:block-0`: sponsorship `unclear`, timing `unspecified`; the target is an applicant question.
- `compeer-financial-5398243008:block-0`: sponsorship `unclear`, timing `unspecified`; CPT and OPT remain explicitly accepted.
- `compeer-financial-5421837008:block-0` and `compeer-financial-5406940008:block-0`: sponsorship `unavailable`, timing `unspecified`; CPT and OPT remain explicitly accepted.
- `gcm-grosvenor-7992997003:block-0` and `gcm-grosvenor-7761842003:block-0`: sponsorship `unavailable`, timing `future`; CPT and OPT remain unclear because they are examples of current status.
- `agwest-farm-credit-4372303009:block-0`, `kroll-bond-rating-8787016002:block-0`, `lightcast-69c5168b:block-0`, `nexus-engineering-0eff47b7:block-0`, and `nexus-engineering-group-0eff47b7:block-0`: timing `unspecified`; broad refusal does not establish timing.

All direct applicant questions remain sponsorship/CPT/OPT unclear with unspecified timing. Gitai, Varda, and General Dynamics remain sponsorship unclear because mandatory citizenship is a separate restriction. Awetomaton remains unavailable because the same target explicitly refuses visa sponsorship. Direct refusals that include CPT or OPT retain explicit exclusion. Pre-OPT maps to OPT.

## Identity and duplicate review

- Treat `nexus-engineering` and `nexus-engineering-group` as one employer; the identical evidence should be imported once.
- Compare the Brighton Jones records sharing `af9a24ce` against their source before import.
- Compare the similar Compeer, GCM Grosvenor, Harrison Street, and Awetomaton records by official vacancy ID. Distinct vacancies may remain, but every record from the same employer or reused policy family must stay in one split.

## Missing import requirements

Each candidate still needs its official source URL, vacancy title, normalized employer identity, retrieval date, locator, capture/completeness status, reviewer, and source/evidence hashes. Until then, none of these candidates may be marked `trainingReady` or used as calibration/test data.

