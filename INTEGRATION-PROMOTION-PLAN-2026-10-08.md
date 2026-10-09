# Integration and promotion plan — October 8, 2026

The current service and extension use `laya-policy-v1`. Production inference loads a checkpoint through `LAYA_MODEL`, while the browser keeps the deterministic findings and local-model comparison separate. A candidate checkpoint can be checked without changing the default model or release package.

## Item 7 — integration checks

1. Complete the provenance, independent calibration and locked held-out gates. Pin the exact checkpoint directory, runtime dependencies, contract, questions, fitted temperature and selected abstention threshold before testing the final candidate.
2. Run existing transport/contract tests and browser fixtures:

   ```sh
   pnpm typecheck
   pnpm test
   pnpm build
   pnpm test:decision:browser
   ```

   The browser fixture checks opt-in, model/rules comparison, popup/panel consistency, private-input exclusion, origin restrictions, opt-out and service outage. It uses deterministic model responses; passing it does not establish candidate accuracy.
3. After a real checkpoint exists, set `LAYA_MODEL` to its absolute directory and run:

   ```sh
   LAYA_MODEL=/absolute/path/to/approved-candidate LAYA_REVISION= .decision-venv/bin/python server/laya_worker.py --load-only
   LAYA_MODEL=/absolute/path/to/approved-candidate LAYA_REVISION= pnpm test:decision:browser --real
   ```

   The worker runs offline. This validates loading and actual inference through the service and extension. It does not assert model accuracy. Save the resulting `test-results/decision-real.json` and screenshot with checkpoint/run provenance. Restart the service between checkpoint variants because cached responses are held in memory.
4. Confirm every request block gets one matching response block, five known labels, finite selected-option probabilities and the existing version. Check context-overflow rejection, missing checkpoint, process restart, timeout, uncertainty and conflicts. Existing TypeScript tests cover these paths; preserve the contract while integrating any calibration configuration.
5. Verify quotations and evidence IDs trace to the captured posting and supplied neighboring passages, applicant questions and other-role text do not establish vacancy policy, and citizenship/export restrictions remain separate from sponsorship. Check incomplete coverage still yields the established uncertain headline. The current browser real-checkpoint smoke is narrower than this list; add only missing final-candidate scenarios when a checkpoint is available.

Current gaps found by code inspection: `src/decision.ts` hardcodes a provisional threshold of `0.8`. `server/laya_worker.py` loads checkpoint temperature configuration through Laya but has no promotion-manifest gate. A chosen threshold must reach the same production projection used during final evaluation, with configuration and boundary tests; recording it in a report alone is insufficient. `scripts/evaluate-laya-policy.ts` is explicitly an exposed-development evaluator and must not be presented as held-out evidence.

## Item 8 — promotion evidence and approval

Create one immutable promotion record containing:

- Candidate model directory/revision and hashes of weights, configuration, tokenizer and encoder files; base model revision/hash; runtime and code revision.
- Frozen training, calibration and held-out manifests/hashes, source provenance, policy-family audit/review hashes, and quarantined IDs/reasons. Identify which training corpora contributed weights. Calibration and test records must never contribute weight updates.
- Decision contract hash and both stored-question-file hash and runtime question-definition hash. Confirm semantic equivalence of the five label vocabularies and question text; the two files have different serialization.
- Training seed, epochs, optimizer/checkpoint state and reproducible resume record. Pin model-selection decisions before exposing held-out outcomes.
- Calibration method, fitted temperatures, confidence interpretation, calibration-only IDs, chosen abstention threshold and the objective used to choose it. Preserve the full probability vectors needed to reproduce calibration.
- Locked held-out run and results for deterministic rules, pinned base, tuned model before and after calibration; report any evaluated hybrid separately. Include per-field accuracy, definitive error/abstention coverage, citation correctness, mandatory-restriction/headline checks and uncertainty from the small sample.
- The predeclared promotion criteria and actual pass/fail outcomes, plus integration results from item 7. If criteria are absent, agree and record them before any held-out run. A threshold or method changed after inspecting test results needs a new untouched held-out set.
- Explicit project-owner approval and default-switch instructions/rollback to the pinned base. Approval follows evidence; preparing this record does not make the candidate default.

No approved checkpoint, fitted calibration, frozen independent held-out set or promotion evidence currently exists. The normalized submissions lack official source URLs, vacancy identity and source-capture hashes required by `DECISION_LOGIC.md`; the audited candidate snapshot remains blocked. Heavy calibration quarantine also leaves insufficient coverage to claim a reliable calibrated decision system without replacement reviewed examples.

Checks performed for this plan: read `server/decision-service.ts`, `server/laya_worker.py`, `src/decision.ts`, `scripts/browser-decision.ts`, `scripts/evaluate-laya-policy.ts`, package scripts and the authoritative contract. No real-checkpoint integration or promotion action was performed.
