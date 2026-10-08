# Laya evaluation and fine-tuning plan

Date: October 3, 2026
Status (October 5): Offline evaluation and evidence capture implemented; full-model local MPS smoke update passed and a separate checkpoint saved/reloaded. Domain training data review and calibration remain pending; no model promotion.

Historical setup evidence: [October 5 research and initialization](evaluation/laya-training/archive/research/RESEARCH-2026-10-05.md). MPS works outside the execution sandbox on this 16 GB Mac. The cached multilingual checkpoint has 321,908,995 parameters. The CPU-only finding below is historical and superseded. Current dataset status is recorded in [HANDOFF.md](HANDOFF.md).

## Goal

October 5 scope update: prioritize sponsorship for the specific vacancy. Later conversion or other future jobs are outside that decision. Timing is supporting metadata, not a separate review task or sponsorship-confidence gate. See [active review guidance](evaluation/laya-training/review-guidance.md).

Determine whether a domain-trained Laya improves decisions on public job text, then connect a validated checkpoint through the existing opt-in model service.

Reliable extraction is a continuing workstream, not a requirement to support every job website before experiments can begin. A decision model cannot recover a policy paragraph absent from its input. Evaluate extraction and interpretation separately.

## Assigned work

| Owner | Work | Deliverable |
| --- | --- | --- |
| GPT-5.6: offline evaluation | Reuse the installed worker and existing decision schema | Repeatable comparison of rules, raw model answers, model-only sponsorship findings, and the integrated hybrid; preserved outputs and timings |
| GPT-5.6: training preparation | Verify Laya's actual training architecture and prepare reviewed data | Validated training records, source hashes, split checks, preparation command, and a documented training path |
| GPT-5.6: evidence audit | Trace extraction failures and capture actual scanner inputs | Diagnostic audit and development-only capture command for specified URLs |
| Primary agent | Reconcile interfaces, test changes, and maintain this plan | Verified commands, limitations, and next implementation step |

## 1. Establish a reproducible experiment

Use the four reviewed official examples and clearly marked authored diagnostic examples first. Run every engine on identical evidence blocks and the same role identity. Keep raw model probabilities, final decisions, citations, errors, and latency.

Preserve historical captures. Write each experiment into a new directory with a corpus hash, model identifier/revision, questions, threshold, and run settings. A dry run validates inputs without loading the model; the self-check verifies rule/model separation.

The existing model contract asks about scope, sponsorship, timing, CPT, and OPT. It does **not** independently classify citizenship or export restrictions. The current hybrid retains rule-generated restrictions and explicit sponsorship refusals. Its success cannot be presented as model-only success.

Completion: a bounded real inference run and a reproducible report that distinguishes raw predictions, thresholded model results, and rule contributions.

## 2. Capture actual public evidence

For each exposed failure, capture the scanner's evidence blocks, selected role, source URL, description coverage, and warnings. Use a fresh browser profile without applicant answers. Do not substitute CSV summaries for model inputs.

Compare the reviewed blocker sentence against the captured evidence:

- Present but misunderstood: interpretation development case.
- Missing: extraction development case.
- Wrong vacancy or contradictory source: identity/evidence development case.

Capture the reported failures before adjusting rules or model questions. Rechecking a live posting can expose content changes; record capture times and hashes.

Completion: evidence presence is known for the reported failures, and interpretation experiments exclude absent-text cases from model-quality claims while reporting them as end-to-end failures.

## 3. Define training labels

Keep the four user-facing results, but train the underlying facts separately:

| Field | What a reviewer labels |
| --- | --- |
| Scope | This vacancy, application question, another role, company context, history, or unrelated text |
| Sponsorship | Explicit offer, refusal, conditional policy, or unclear |
| Timing | Current, future, both, or unspecified; distinguish internship from later full-time conversion |
| Restriction | Citizenship, permanent residency, U.S. person, student status, scoped export obstacle, or none |
| Conditions | Who is affected, stated exceptions, and deadline |
| Evidence | Exact existing passages and their source identifiers |

Use the shared decision resolver only after these facts are available. A definition or application option is not sufficient evidence of a mandatory requirement. Generic work authorization does not establish a sponsorship refusal. Future conversion policy must not become a current internship refusal.

For the first executable experiment, keep the installed sponsorship schema. Introduce an offline restriction-question version as a separate experiment once reviewed labels exist; adapt the browser contract only after it passes evaluation. Laya is a typed classifier, so exact quotations come from validated extracted evidence, not generated prose.

Completion: versioned questions and reviewed labels represent the agreed meaning without forcing unsupported answers.

## 4. Prepare training, calibration, and test data

The 54 submitted jobs are exposed development material. Use them for error analysis and, after review, training. They are not a final test set. The four source-backed seed cases establish the preparation workflow, not adequate training volume or deployment quality.

Group related records by employer/vacancy and duplicated policy family before assigning splits. Keep every passage from a job in one split. Reserve calibration data separately from training and final test data. Reject conflicting IDs, duplicate evidence across splits, missing evidence references, and unreviewed labels in training exports.

Start with a manageable pilot of reviewed, varied examples. Include explicit offers, refusals, silence, questions, conditional language, exceptions, future policies, and actual eligibility requirements. Increase data based on validation errors and learning curves; do not invent a minimum count that guarantees success.

The previous job roster still needs independent label adjudication and captured evidence. Select a fresh final test set before examining its model outputs. A separate calibration slice must never be fitted on the final test set.

Completion: reviewed records and frozen split/source hashes; preparation fails clearly when inputs are insufficient or leaked.

## 5. Train using Laya's supported method

The installed Laya 0.3.21 runtime exposes inference, not a general training API. Use the user's official [Laya repository](https://github.com/NandhaKishorM/laya), with the [fine-tuning guide pinned to revision 9d955671](https://github.com/NandhaKishorM/laya/blob/9d955671415fc19f069b9cc998928075c1f255ec/docs/finetune.md). It uses typed questions, soft target distributions, RLCD, and calibration. Begin from that documented workflow rather than assuming a generative chat fine-tuning recipe applies.

Pin the upstream training revision, base model revision, data hash, seed, dependencies, and question version. Keep human hard labels distinct from teacher probability distributions: a one-hot conversion is an explicit training choice, not measured reviewer confidence. Verify compatibility and run a tiny training smoke test before a full experiment.

Write trained weights/configuration into a new checkpoint directory. Preserve the base checkpoints. The published guide uses GPU training. The available runtime currently reports CPU only (CUDA and MPS unavailable); confirm suitable hardware before a full run. Cloud accounts, paid compute, and publication are separate user-authorized steps.

Completion: a new reloadable checkpoint, a training log, and a comparison against the unchanged base model. Preparation alone must not be called a fine-tuned model.

## 6. Calibrate and evaluate

Fit calibration only on the reserved calibration set. Choose abstention thresholds from development/calibration evidence and freeze them before final testing. Report false blockers, missed blockers, abstentions, citation validity, scope/exception correctness, latency, and inference failures with raw counts.

Compare rules alone, model alone for the tasks it actually predicts, and the hybrid on identical inputs. Report classification quality separately from end-to-end page-reading coverage. Require meaningful improvement over the rules without increased false blockers or invalid citations. Existing proposed release gates remain quality targets, not evidence that four successful examples qualify a model.

Completion: a frozen unseen comparison supports deployment, or the model stays experimental with its limitations documented.

## 7. Integrate a proven checkpoint

Load the checkpoint through the current local service. Retain opt-in, response validation, evidence identifiers, navigation invalidation, incomplete-input handling, and pause/resume. Test model outages, stale replies, contradictory findings, and unsupported citations. Revalidate scoped restrictions if the model contract expands.

Completion: demonstrated model-quality improvement and the browser integration both pass; enabling the model by default is a separate release decision.

## Initial experiment — October 3

The cached base model completed all eight development probes (four reviewed official-source excerpts and four authored negatives). [Recorded run](evaluation/laya-experiment/runs/2026-10-04T01-22-51-475Z-7094f96b/results.json):

| System | Main-decision mismatches | Missed blocker labels | Invalid citations |
| --- | --- | --- | --- |
| Rules | 0/8 | 0/4 | 0 |
| Laya sponsorship projection | 6/8 | 4/4 | 0 |
| Current hybrid | 5/8 | 3/4 | 0 |

The model does not predict restrictions in this schema, so model-only blocker totals are diagnostic contract limitations, not a fair standalone restriction benchmark. More importantly, the current hybrid keeps rule findings but can change the headline to “Could not verify” when Laya adds a low-confidence review flag. This must be resolved and regression-tested before promotion. These exposed probes do not estimate real-world accuracy.

No model weights, production thresholds, or default model settings have changed. CPU inference works; training is still a separate next stage.

## Immediate sequence

1. Finish and test the evaluator and preparation tools.
2. Run a bounded installed-model comparison and record the outcome.
3. Capture real evidence for the exposed failure cases.
4. Review the captured passages and prepare a pilot training/calibration split.
5. Adapt the supported trainer and run a small smoke experiment, then evaluate before expanding training.

## Implemented commands

```sh
pnpm evaluate:laya --dry-run
pnpm evaluate:laya --self-test
pnpm evaluate:laya
pnpm capture:laya 'https://approved-official-job-url.example/job/123'
pnpm prepare:laya --output /tmp/sns-laya-reviewed-prototype
pnpm test:laya:training
pnpm test:laya:capture
```

The [training-data prototype](evaluation/laya-training/README.md) uses only the four existing role-level reviewed cases. Its proposed role-level question contract is explicitly incompatible with the current per-block worker, and its manifest remains `trainingReady: false`. It cannot replace the current checkpoint. Choose and review a training contract before adapting the upstream trainer; the preferred first current-service experiment needs independently reviewed per-block labels.

Preparation refuses to overwrite a nonempty output directory unless explicitly requested. Use a new output path for each preparation run. Capture requires a current `pnpm build`, runs with a blank browser profile, and preserves reading gaps rather than assuming every embedded source was read.
