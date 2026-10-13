# Task 7 Entry Readiness Report: Two-Stage Contextual Fine-Tuning Readiness

**Date:** October 10, 2026
**Assignee:** V2 Runtime Engineer
**Status:** Training not started / independent AI review complete / corpus blocked

October 12 update: `contextual-v2-2026-10-12` now exists as a reproducible candidate with all resolved corrections applied, exact WTW blocks restored, and review holds removed from active splits. Its manifest explicitly denies training approval. See its `README.md` and `review-holds.json`; creation of the candidate does not clear the coverage, restored-target review, human-signoff, or checkpoint-backup gates below.

The October 12 consolidated review supersedes the original unconditional readiness claims; see `independent-review-2026-10-10/FINAL-INDEPENDENT-REVIEW.md`. The owner has confirmed posting authenticity. Independent AI review is complete and found blocking gold, exact-source, split-independence, completeness and coverage issues. Generated approval booleans in the frozen dataset are not independent sign-off. Do not register training as ready until a corrected new version passes every gate and backup prerequisites are completed.

---

## 1. Readiness Gate Summary

| Gate Requirement | Status | Evidence / Location |
|---|---|---|
| **1. Implementation Inventory** | **PASSED** | `evaluation/laya-training/implementation-inventory.md` complete and all callers migrated |
| **2. Four Contextual Splits & Ledgers** | **PENDING SEMANTIC/COVERAGE REVIEW** | Artifacts exist and owner confirms authenticity; proposed gold corrections, exact WTW restoration, independence audit and class coverage remain pending |
| **3. Dataset Manifest & Hash Validation** | **PASSED** | `manifest.json` locked; `scripts/validate_laya_contextual.py` passes (167 train, 81 dev, 54 cal, 141 fresh-test); historical `validate_laya_operational.py` passes |
| **4. Versioned V2 Question & Context Exports** | **PARTIAL** | Runtime questions exist and the parity test now invokes the real TypeScript serializer. Frozen `questions.json` uses abbreviated interpretation prompts and does not snapshot full runtime instructions/criteria. New-version exact question export must be pinned before training |
| **5. Worker, Service, Client & Tests** | **PASSED** | `server/laya_worker.py`, `server/decision-service.ts`, `src/decision.ts`, `src/main-decision.ts`; 226 TS tests and 58 Python tests pass |
| **6. Benchmark & Hardware Registration** | **PASSED REVIEWED CPU PROFILE** | `benchmark-results-reviewed-final-2026-10-10.json`: 30 warm jobs per path, three cold starts, exact WTW capture; v1 p95 13.022s, v2 p95 15.743s (1.209x), sampled peak worker RSS 2560.09 MiB; all operational gates pass |
| **7. Private Tokenizer & Checkpoint Backup** | **PARTIAL / BACKUP PENDING** | Browser/benchmark probes use private copied tokenizers and cached base weights only. Historical training checkpoints were not loaded. Separate recoverable backup and restore verification have not been performed in this review |
| **8. Independent Review Gate** | **AI REVIEW COMPLETE / NOT APPROVED** | All split records were accounted for and training/calibration boundary cases adjudicated. Fresh evidence remains insufficient and split holds remain. This is not a human signature; obtain one if project policy requires it. |

---

## 2. Checkpoint Preservation and Backup Procedures

- **Original Resumable Step Checkpoint:**
  `.model-cache/training/domain-2026-10-09/checkpoints/step-000132`
- **Calibrated Inference Checkpoint:**
  `.model-cache/training/domain-2026-10-09/posttraining/calibrated-checkpoint`
  *(Symlinked to step-000132 encoder files; do not delete or rename)*
- **Offline Integrity:**
  Keep `HF_HUB_OFFLINE=1` and `TRANSFORMERS_OFFLINE=1`.
- **Pre-Training Tokenizer Isolation:**
  When loading for optimizer runs, use a private copied tokenizer directory to prevent in-place metadata mutation.

---

## 3. Training Status

- **Status:** **TRAINING NOT STARTED**.
- No model weights were updated during Task 6.
- `train:laya:smoke` was preserved for historical regression and not executed.
- Task 7 is **not yet data-ready**. Follow `COVERAGE-COMPLETION-INSTRUCTIONS-2026-10-10.md`, resolve the independent review findings in a new dataset version, pin actual runtime questions, and verify checkpoint backup before requesting training initiation. Neither this report nor a generated dataset flag starts training.

## 4. Reviewed browser integration

`pnpm test:decision:browser` and `pnpm test:decision:browser --real` both passed using ephemeral local ports and disposable extension/profile copies. The real probe used a private tokenizer and cached base model, not an immutable experimental checkpoint. Existing services and installed settings were not modified.

Mock checks cover opt-in/out, privacy, popup/on-page consistency, honest partial processing, malformed replies, disable-while-pending, delayed old-role results after navigation, unchanged deterministic badge, host/origin rejection and service outage. Real probe covers live worker/service/browser transport and those basic lifecycle/security checks; mock failure scenarios are engineering tests, not model-quality evaluation.

Evidence: `test-results/decision-integration-mock-review.json`, `test-results/decision-integration-real-review.json`, `test-results/decision-partial.png` and `test-results/decision-real.png`. Full TypeScript suite: 226 passed. Targeted Python benchmark/context/worker/parity tests: 25 passed. `git diff --check` identified a pre-existing extra EOF blank line in `server/decision-questions.ts`; it was left untouched.

## 5. Final reviewed benchmark

Reproduce with `.decision-venv/bin/python scripts/benchmark_v2_runtime.py --output evaluation/laya-training/benchmark-results-new-run.json`. Existing output paths are rejected to preserve evidence. No model training or calibration is performed.

Machine: Mac17,3, 16 GiB RAM, CPU four threads, float32. Warm jobs use five-, six- and 31-block complete development inputs, interleaved v1/v2 and service-cache bypassed. V2 runs screening plus interpretation for every target. Exact original WTW request overrides the altered contextual WTW text for the large case. The v1 comparator is the current compatibility branch, not a reconstructed historical binary.

V1 p50/p95/max: 1.964 / 13.022 / 13.088 seconds. V2 p50/p95/max: 2.441 / 15.743 / 15.813 seconds. P95 ratio: 1.209x, below 2x and the actual 150-second worker timeout. Three cold observations, first-job times, before/after load RSS, raw job timings, configuration/input/model/code hashes and all failure counters are saved in the final JSON. Sampled peak worker RSS: 2560.09 MiB, below the registered 4096 MiB limit; cold-load budget is 60 seconds. All five benchmark gates passed, with no timeouts, malformed responses, partial/unsupported jobs, stage failures or worker exits. No OOM event was observed; the benchmark does not independently diagnose kernel OOM causes.

Source cache hashes were unchanged, and benchmark script SHA-256 was stable throughout the final run. Earlier benchmark outputs are retained but superseded. This establishes CPU engineering performance on those inputs, not model-quality acceptance or MPS performance. RSS sampling is every 100ms and can miss transient peaks. Separate recoverable training-checkpoint backup still remains pending.
