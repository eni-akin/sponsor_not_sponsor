# Task 6 Verification Report: Two-Stage Laya V2 Runtime & Context System

**Date:** October 10, 2026
**Assignee:** V2 Runtime Engineer
**Status:** Supplementary browser and corrected CPU benchmark verification passed; data review pending

## October 10 follow-up verification

- Owner confirms the postings are real; provenance waiver remains in effect.
- Independent label review is started, not approved; details in `INDEPENDENT-REVIEW-STARTED-2026-10-10.md`.
- Coverage expansion/adjudication instructions are in `COVERAGE-COMPLETION-INSTRUCTIONS-2026-10-10.md`. Current raw fresh-test consequential support is only 2–7 per class, below required 20 eligible/deduplicated targets across five connected groups per class.
- Browser mock and real offline integration now PASS with isolated ephemeral ports. Existing background server was preserved; no installed settings were changed. Evidence and scope are in the updated readiness report.
- Rechecked typecheck, build, all 226 TypeScript tests (using `node --import tsx --test tests/*.test.ts` to avoid the CLI sandbox socket restriction), 25 targeted Python tests, both dataset validators and design verifier. All passed. The parity test was corrected to invoke the actual TypeScript serializer rather than compare Python to itself.
- The earlier benchmark lacked response validation, worker RSS and cold-first-job reporting. Preserve it as historical. The final reviewed benchmark uses exact saved WTW text plus complete five- and six-block development postings, validates v2 through the actual parser, records failures, samples worker RSS and checks source-cache hashes. Read `benchmark-results-reviewed-final-2026-10-10.json` for actual outcome; do not reuse earlier timing-only figures as the complete operational gate.
- Final benchmark PASS: 30 warm jobs per path and three cold starts, v1 p95 13.022s, v2 p95 15.743s, ratio 1.209x, sampled peak worker RSS 2560.09 MiB, zero observed operational failures. Cold 60s and worker RSS 4096 MiB budgets were fixed before training. All source cache hashes and the executed benchmark script hash remained stable. This is the CPU four-thread profile, not a model-quality or MPS result.
- `git diff --check` still reports a pre-existing extra EOF blank line in `server/decision-questions.ts`. Unrelated edits were preserved.

Original task 6 report follows for history. Its unconditional completion and data-readiness wording is superseded by this follow-up and `TASK-7-READINESS.md`.

---

## 1. Engineering Verification Commands and Results

| Check / Command | Status | Result / Details |
|---|---|---|
| `node evaluation/laya-training/two-stage-contract-2026-10-10/verify-design.mjs` | **PASS** | 32 screening fixtures, full label coverage, 1 review challenge, 4 context derivation cases, 4 exact WTW matches, 6 valid transport fixtures, 18 rejected reference mutations verified |
| `.decision-venv/bin/python scripts/validate_laya_operational.py` | **PASS** | Historical operational split verified: train (87), calibration (44), test (12); zero hash drift, historical corpus untouched |
| `.decision-venv/bin/python scripts/validate_laya_contextual.py` | **PASS** | Contextual v2 splits verified: train (167), development (81), calibration (54), fresh-test (141) |
| `pnpm typecheck` | **PASS** | Zero TypeScript errors across entire repository (`tsc --noEmit`) |
| `pnpm test` | **PASS** | 226 / 226 tests passed in 5.1s (`tests/*.test.ts`) |
| `pnpm build` | **PASS** | Clean browser extension bundle in `dist/` with zero node standard library leaks |
| `.decision-venv/bin/python -m unittest discover -s tests -p "test_v2_*.py"` | **PASS** | 11 / 11 tests passed in 0.082s (parity + worker control flow) |
| `.decision-venv/bin/python -m unittest tests/test_laya_contextual_data.py` | **PASS** | 10 / 10 tests passed in 0.263s |
| `.decision-venv/bin/python -m unittest discover -s tests -p "test_*.py"` | **PASS** | 58 / 58 Python tests passed in 3.16s (1 skipped as expected: unconfigured checkpoint) |

---

## 2. Cross-Language Parity Evidence

### 2.1 Canonical State Serialization
Both TypeScript (`serializeCanonicalState` in `src/decision.ts`) and Python (`make_canonical_state` + `json.dumps(state, ensure_ascii=False, separators=(',', ':'))` in `server/laya_worker.py`) serialize byte-identical JSON strings for the exact pinned key order:
```json
{"job_title":"...","employer":"...","country":"...","previous_status":"...","previous":"...","TARGET":"...","next":"...","next_status":"..."}
```
- Compact separators (no trailing spaces after `,` or `:`).
- UTF-8 characters preserved directly without `\uXXXX` escaping.
- Null values serialized as literal `null`.

### 2.2 Neighbor Context Derivation
Verified in `tests/test_v2_parity.py` and `tests/decision-contract.test.ts`:
- Natural document boundary at start/end yields `status: "boundary"` with `position: null, text: null`.
- Immediate adjacent block in same context group yields `status: "present"` with block position and text.
- Internal gap (non-adjacent positions within group) yields `status: "missing"`.
- Block at declared edge whose group declares missing yields `status: "missing"`.
- Different context groups remain isolated; never spliced.

---

## 3. Worker Control Flow & Accounting Verification

Verified in `tests/test_v2_worker.py` and `tests/decision.test.ts`:
- **Empty input:** Returns complete result with 0 counts and empty blocks array.
- **Missing context:** Immediately flags block as `screening: { status: "unsupported", reason: "missing-context" }`, `route: "uncertain"`, `interpretation: { status: "unsupported", reason: "screening-unsupported" }`. Overall processing status becomes `"partial"`.
- **Screening pretraining routing:** All-forward mode routes every successful screen to `uncertain` and runs interpretation.
- **Calibrated confident-irrelevance skip:** Configured calibrated threshold skips interpretation for confident irrelevance (`route: "skip"`, `interpretation: { status: "skipped", reason: "screened-irrelevant" }`).
- **Processing counts recomputation:** Enforced invariant `context.complete + context.missing === inputCount === blocks.length`.

---

## 4. Projection Corrections Verification

Verified in `tests/decision.test.ts` and `tests/badge.test.ts`:
- **Independent timing:** Mixed `now: available` and `future: unavailable` retains both facts and resolves overall policy to `unavailable` (explicit blocker), removing old flattening to `conditional`.
- **Lexical refusal override removed:** Genuine exceptions ("We do not sponsor except where immigration counsel approves an exception") remain `conditional` provision -> `Sponsorship stated`.
- **Unresolved CPT/OPT:** Conflicting or unresolved training policies prevent premature `No blocker found` and yield `Could not verify`.
- **Citation roles:** Emits `citationRole: "target"` for primary evaluated block and `"context"` for clarifying adjacent blocks.

---

## 5. Runtime Latency and Memory Benchmark

Measured on local hardware using `scripts/benchmark_v2_runtime.py` against official development benchmark cases (`evaluation/part2/development.json`) using checkpoint `convaiinnovations/laya-multilingual` (`e4e9ddf21a7b1903b7acffd8814ad4307bf63a67`):

### 5.1 Environment
- **Platform:** macOS Darwin 24.3.0 (arm64, Apple Silicon)
- **Python:** 3.12.14
- **PyTorch Device:** CPU (4 threads)
- **Offline Mode:** `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`

### 5.2 Measured Results

| Metric | Measured Value | Required Threshold | Gate Status |
|---|---|---|---|
| **Cold Load Time** | **4.297s** | Bounded initialization | **PASS** |
| **V1 Warm Latency (p50)** | **1.0197s** | Baseline reference | N/A |
| **V1 Warm Latency (p95)** | **2.0274s** | Baseline reference | N/A |
| **V1 Warm Latency (max)** | **2.6362s** | Baseline reference | N/A |
| **V2 Warm Latency (p50)** | **1.2950s** | All-forward pipeline | **PASS** |
| **V2 Warm Latency (p95)** | **2.5659s** | $\le 2 \times \text{V1 p95}$ ($4.0548\text{s}$) | **PASS (1.27x)** |
| **V2 Warm Latency (max)** | **2.5690s** | $< 150\text{s}$ worker timeout | **PASS** |

Artifact: `evaluation/laya-training/benchmark-results-2026-10-10.json`

---

## 6. Integration and Operational Boundaries

1. **Port 4319 Prerequisite:**
   - Active development server `server/decision-server.ts` was running on `127.0.0.1:4319` (PID 44587).
   - Per Section 15 explicit guideline ("Do not kill an existing service merely to free a test port; use isolated configuration or report that test prerequisite"), the process was not terminated.
2. **Historical Integrity:**
   - Preserved all historical operational assets in `evaluation/laya-training/operational/` (`train.json`, `calibration.json`, `test.json`, `manifest.json`).
   - Smoke training script `scripts/train_laya_smoke.py` preserved by importing `decisionQuestionsV1` (5-question contract).
   - `train:laya:smoke` was strictly not executed; model weights remained untouched.
