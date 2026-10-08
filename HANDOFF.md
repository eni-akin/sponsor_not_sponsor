# Sponsor Not Sponsor — handoff

Updated: October 8, 2026 (America/Chicago)

## Aim

Build a browser extension that reads the active vacancy and reports what the posting actually establishes about visa sponsorship and explicit eligibility restrictions. The system must preserve uncertainty, cite the source text, keep applicant questions separate from employer policy, and keep sponsorship, citizenship, export controls, CPT, and OPT as distinct facts.

The immediate model goal is to fine-tune and evaluate the local Laya decision model against the same stable five-field passage contract used by the extension. A checkpoint must not be promoted until it beats the frozen base model on fresh, employer- and policy-family-disjoint evaluation data.

## Product decisions

The authoritative contract is [DECISION_LOGIC.md](DECISION_LOGIC.md). It governs human review, deterministic interpretation, Laya questions, evaluation, and user-facing headlines.

Each passage receives five independent labels:

- `scope`: `role`, `question`, `historical`, `company`, `other-role`, or `none`.
- `sponsorship`: `available`, `unavailable`, `conditional`, or `unclear`.
- `timing`: `now`, `future`, `now-and-future`, or `unspecified`.
- `cpt`: `explicitly-accepted`, `explicitly-excluded`, or `unclear`.
- `opt`: `explicitly-accepted`, `explicitly-excluded`, or `unclear`.

The final vacancy headline remains separate:

- `Explicit blocker found`
- `Sponsorship stated`
- `No blocker found`
- `Could not verify`

Important settled rules:

1. Applicant questions never establish employer policy.
2. Mandatory citizenship, U.S.-person, clearance, and export-control requirements are separate blockers; they do not by themselves make sponsorship `unavailable`.
3. A requirement that applicants must not need sponsorship now or later is `unavailable` for the current vacancy.
4. `conditional` means the employer may provide sponsorship under a stated condition. It does not mean the applicant is eligible only if sponsorship is unnecessary.
5. Timing is never inferred. A broad refusal such as “we do not sponsor” has `unspecified` timing.
6. CPT and OPT are decided independently from sponsorship and from each other.
7. A refusal directly including CPT or OPT makes that program `explicitly-excluded`; mentioning it only as an example of status remains `unclear`.
8. Pre-OPT is treated as OPT.

## Completed implementation

The runtime Laya questions and deterministic parser were aligned with the contract. Regression coverage now includes applicant questions, citizenship separation, explicit timing, named-employer refusals, future-sponsorship ineligibility, direct CPT/OPT exclusions, and Pre-OPT acceptance.

The original 13 reviewed passages in `worker-review-v2` now contain all five labels. They remain exposed development data and are not evaluation data.

The expansion was reconciled from two submitted passage lists plus owner-supplied provenance and duplicate rulings:

- Two duplicate records were removed: one Nexus Engineering duplicate and one Brighton Jones duplicate.
- Three Compeer, two GCM Grosvenor, three Harrison Street, and two Awetomaton vacancies were confirmed as separate vacancies but must remain grouped by employer/policy family.
- The Electronic Arts record was removed because its only supplied source was ZipRecruiter.
- The project owner confirmed that all remaining employer-controlled vacancies were fully reviewed and matched to their submitted passages.

The reconciled source is [expansion-candidates-2026-10-07.json](evaluation/laya-training/expansion-candidates-2026-10-07.json): 39 passages across 38 verified vacancies.

## Frozen training corpus

GPT-5.6 created [frozen-expansion-v1](evaluation/laya-training/frozen-expansion-v1/manifest.json).

- Corpus: `training-corpus-v1.json`
- Records: 39 passages across 38 vacancies
- Intended use: training only
- Split: every record is `train`
- Applicant data: none
- `trainingReady`: `false`

The manifest pins the approved source, frozen corpus, decision contract, complete question snapshot, and individual question definitions by SHA-256. The validator at [freeze_laya_expansion.py](scripts/freeze_laya_expansion.py) rejects duplicate IDs/evidence, missing or invalid labels, unverified sources, incomplete captures, evidence drift, source drift, hash drift, and any split other than `train`.

Validate the freeze with:

```bash
python3 scripts/freeze_laya_expansion.py
```

Do not edit or overwrite frozen v1. Corrections require a documented v2.

## Approved and normalized, pending freeze

Two additional CSV files were inspected and normalized into [normalized-submissions-2026-10-08.json](evaluation/laya-training/normalized-submissions-2026-10-08.json):

- `/Users/eniola/Downloads/Training Dataset.csv`: 25 passages from 25 new employers.
- `/Users/eniola/Downloads/Calibration dataset.csv`: 25 passages from 25 other new employers.

The malformed combined label values are now separate `scope`, `sponsorship`, `timing`, `cpt`, and `opt` fields. The project owner confirmed the October 8 retrieval date and reviewed the 25 calibration labels. URLs and external vacancy IDs were removed because they are not model inputs. The records now use unique internal IDs `1` through `50`, remain unassigned (`split: null`), and are approved pending an immutable freeze. Think Academy sponsorship remains `unclear`: accepting CPT/OPT establishes those work-authorization fields, not whether the employer will file or transfer a sponsored visa. The normalized records do not overlap the frozen corpus or each other by employer, internal ID, or exact evidence.

## What needs to happen next

### 1. Audit policy-family grouping

Review the proposed employer-based groups for materially identical policy templates across different employers. Keep any repeated policy family in a single split. URLs and external vacancy IDs are intentionally not part of the training records.

### 2. Decide the new training records

The 25 records in `Training Dataset.csv` may become a separate frozen training-corpus v2. Do not overwrite v1. Before freezing v2, finish the shared-policy-template audit against v1.

### 3. Freeze calibration data

The owner-reviewed 25 calibration employers are disjoint from the current training employers. After the policy-family audit, freeze them in a calibration-only corpus. Calibration data may be used to choose the model temperature, probability calibration, and abstention threshold. It must not be used to update model weights or rewrite decision rules.

### 4. Collect a fresh held-out test set

There is still no held-out test set. Collect new vacancies from employers absent from both training and calibration. Keep repeated policy families in one split. Lock the test set before model tuning and use it only after the model, prompt/questions, calibration method, and threshold are fixed.

The held-out set should cover:

- Explicit sponsorship availability
- Genuine conditional sponsorship
- Explicit current, future, and now-and-future refusals
- Applicant questions
- Citizenship, U.S.-person, clearance, and export-control restrictions
- CPT and OPT acceptance and exclusion
- Silence, ambiguity, and conflicting evidence
- Complete and incomplete-source behavior

### 5. Extend training only after the data gate passes

Once training v2, calibration, and held-out test manifests validate, extend the existing smoke runner into the minimum resumable multi-epoch domain trainer. Preserve optimizer state, use the calibration split for temperature/threshold selection, and compare:

- Deterministic rules
- Base Laya
- Tuned Laya before calibration
- Tuned Laya after calibration
- Any hybrid, if still desired

Use identical inputs and report per-class counts, precision, recall, coverage/abstention, confusion matrices, citation validity, and extraction failures separately from interpretation errors.

### 6. Promotion gate

Do not promote a checkpoint merely because training completes. Promotion requires a frozen held-out evaluation showing acceptable definitive-label precision, useful coverage, no material regression on questions/silence/restrictions, valid citations, and successful browser integration. Record the checkpoint revision, dataset manifests, contract hash, questions hash, threshold, calibration parameters, and evaluation report.

## Current blockers

1. The two normalized submissions need a policy-family grouping audit and immutable train/calibration freezes.
2. No frozen calibration corpus exists.
3. No fresh held-out test corpus exists.
4. The multi-epoch domain trainer, calibration step, and resumable optimizer state do not yet exist.
5. No production checkpoint, threshold, or default setting has been approved.

## Repository organization

Current operational files remain at stable paths. Superseded Laya prototypes, review v1, the initial smoke-run record, and October 5 research notes are retained under `evaluation/laya-training/archive/`. The October 6 handoff is retained under `docs/archive/handoffs/`; this file is the single current handoff. Empty legacy output directories were removed. See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for the maintained layout.

## Validation completed

At the latest check:

- Frozen-corpus validator passed for 39 records.
- Ten Python training-data tests passed.
- 217 TypeScript tests passed.
- TypeScript typecheck passed.
- Production build passed after the decision-contract work.
- `git diff --check` passed.

No model training, checkpoint promotion, release, pull request, or commit was performed as part of this work.

## Working tree

The working tree intentionally contains uncommitted training-data changes. Preserve unrelated user work. Before committing, review `git status` and include only the decision/data files intended for this milestone.

Suggested commit subject:

```text
chore: organize and approve Laya dataset records
```

Suggested commit body:

```text
- preserve the immutable 39-passage training corpus v1
- normalize and approve 50 new train/calibration candidates
- remove unused URLs and external vacancy identifiers from those records
- archive superseded prototypes, review v1, smoke evidence, and old handoff
- document the active repository layout and remaining evaluation gate
```
