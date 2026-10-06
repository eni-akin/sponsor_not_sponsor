# Local Laya decision preview

The extension can compare deterministic findings with a separate Laya result for sponsorship, CPT and OPT. The compact badge remains deterministic; the popup and page panel show both results, including each result's citations. Laya does not evaluate citizenship, work authorization, export controls or other rule restrictions. The preview is opt-in and its quality is not established.

**This integration is operational but is not an accuracy upgrade yet.** On September 28, both tested pretrained checkpoints produced only `unclear` after the evidence and uncertainty checks on 12 authored development probes. Six silent/question/ambiguous examples matched their expected `unclear` label; all six examples needing a definitive sponsorship finding were missed. Do not interpret 6/12 as a validated accuracy score. See [the evaluation report](../evaluation/results/laya-development.md).

Laya is off by default. When enabled, its independent result appears alongside the deterministic findings; it does not replace them. An unavailable, invalid, or unfinished model result displays its status while the deterministic result stays visible. Turning Laya off shows a disabled comparison status and retains the deterministic interpreter.

## Setup

Use Python 3.10+ (tested with Python 3.12 on this Mac). The project's older `.venv` has Python 3.9, so this uses a separate environment:

```sh
python3.12 -m venv .decision-venv
.decision-venv/bin/python -m pip install -r server/requirements-decision.lock.txt
pnpm decision:download
pnpm build
pnpm decision:serve
```

The full requirements lock records the versions tested on macOS ARM64. `requirements-decision.txt` pins Laya alone for installations where the full platform-tested lock is unavailable. Model downloads are large and inference requires local memory and CPU resources. Setup downloads weights into `.model-cache`; inference subsequently forces Hugging Face and Transformers offline. It never sends job text to Jev, Hugging Face, or another model service. No Jev API key is required and no hosted Jev adapter has been added in this local-first package.

On this workspace the Python environment, both tested checkpoints, and the rebuilt extension are already present. Start `pnpm decision:serve`, reload the unpacked extension and job tab, then open **Decision engine → Use Local Laya (preview)** in the toolbar popup. Accept local service access. Keep the service running. The release ZIP has not been rebuilt or published with this experimental feature.

The service derives the unpacked extension ID from `dist`. If yours differs, set `DECISION_EXTENSION_ID` in `.env` to the ID shown in `chrome://extensions`, then restart the service. Preferences are not enabled in your personal browser by setup commands.

## Configuration

Both `decision:download` and `decision:serve` load `.env` on the backend only:

```dotenv
DECISION_PYTHON=.decision-venv/bin/python
DECISION_EXTENSION_ID=
LAYA_MODEL=convaiinnovations/laya-multilingual
LAYA_REVISION=
LAYA_DEVICE=cpu
LAYA_THREADS=4
```

The known multilingual and typed-decisions checkpoint revisions are pinned in `laya_worker.py`. An explicit `LAYA_REVISION` overrides that pin for evaluation of another revision. Changing model settings requires restarting the service; cached results are memory-only and vanish on restart. To compare the decision-focused checkpoint, set `LAYA_MODEL=convaiinnovations/laya-typed-decisions`, download it, and restart. Neither tested checkpoint is approved for dependable sponsorship decisions.

## Data and decision flow

1. Browser scanning excludes standard typed answers, uploads, navigation, and unrelated jobs.
2. With Laya enabled, only extracted passage IDs/text/question markers, job title and employer are sent to the loopback service at `127.0.0.1:4319`. URLs, locator details, and the full HTML are excluded from the request. Extracted public text may itself contain personal information.
3. A persistent Python worker judges each passage with its immediately adjacent passages as context. No keyword filter chooses which passages the model sees.
4. Typed choices cover policy scope, sponsorship, timing, CPT and OPT. This is semantic classification, not text generation. The model does not author citations.
5. Browser validation requires a result for every input passage, known labels and finite probabilities. Definitive choices require a provisional selected-option probability of at least 0.8 for the relevant classification and scope. This is an abstention setting, not a promise of 80% accuracy or validated calibration.
6. Citations are copied from the original extracted passages and include adjacent context. Conflicts and uncertain decisions remain unclear. An application-question block cannot become an offer. Quotes existing in the page do not prove the model interpreted them correctly.
7. The browser binds results to the current role, URL and exact evidence. Navigation, pause, site-disable and opt-out discard late results.

Long passages are tokenized before inference. If the target plus neighboring context cannot fit the 8,192-token request budget, the worker refuses the entire result rather than silently truncating it. Unsupported length, errors, missing model weights and timeouts produce an explicit unavailable/unclear result. The service does one inference job at a time, returns pending immediately, and the extension polls. Jobs exceeding the timeout are not partially presented as complete.

The loopback server checks the configured extension origin and exact Host header, bounds requests, and admits at most three simultaneous HTTP bodies. Model work is serialized. Up to ten completed decisions remain in memory for 15 minutes; expired entries are removed on later requests. No job text or decisions are logged or saved to disk by the service. Opt-out stops new requests, but in-flight inference may finish; stop the service to clear all cached results. The model weights and Python environment persist until manually removed.

## Validation

```sh
pnpm check
pnpm test:decision:browser
pnpm test:decision:browser --real
pnpm evaluate:decision
```

The first browser command uses deterministic model fixtures to test UI and transport. `--real` uses the downloaded local checkpoint and verifies the end-to-end flow; it does not assert that the model is accurate. `evaluate:decision` records real model choices, probabilities, final labels and latency in `evaluation/results/laya-development.json`. Authored labels are development expectations, not independent human-reviewed data. The frozen checkpoint baselines remain separate.

Next accuracy work should compare an appropriately trained sponsorship model on unseen, reviewed job evidence. Fine-tuning Laya or evaluating hosted Jev are possible next experiments; neither has been performed or proven by this integration.

References: [Laya repository](https://github.com/NandhaKishorM/laya), [official Jev JavaScript SDK](https://github.com/typesafe-ai/typesafe-sdk-js). Laya is an independent open-source compatible implementation, not Jev's model weights.
