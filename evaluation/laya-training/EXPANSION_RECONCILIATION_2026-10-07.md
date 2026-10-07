# Expansion reconciliation — October 7, 2026

The project owner approved the reconciled labels and supplied provenance and duplicate rulings on October 7. After removing two duplicates and the third-party Electronic Arts record, the resulting 39 passages across 38 vacancies are stored in [expansion-candidates-2026-10-07.json](expansion-candidates-2026-10-07.json) and frozen as training-only data in [frozen-expansion-v1](frozen-expansion-v1/manifest.json). Fresh employer/policy-family-disjoint evaluation data is still required.

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

The supplied provenance provides source URLs, vacancy titles and IDs, employers, and retrieval dates. Evidence hashes and normalized employer groups are recorded in the candidate file. On October 7, the project owner confirmed that all 38 employer-controlled vacancies were fully reviewed and matched to the submitted passages. Their source, completeness, and passage-match status is recorded as owner-verified. The Electronic Arts candidate was removed because only a third-party ZipRecruiter source was available. The remaining blocker is the absence of fresh employer/policy-family-disjoint calibration and test sets.
