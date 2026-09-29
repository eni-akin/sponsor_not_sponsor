# Laya decision integration: real-model development results

Date: September 28, 2026. These are 12 authored diagnostic examples, not a human-reviewed holdout or a real-world accuracy estimate.

| Checkpoint | Correct final sponsorship labels | Definitive final labels | Expected definitive labels |
| --- | ---: | ---: | ---: |
| `laya-multilingual` | 6/12 | 0/12 | 6/12 |
| `laya-typed-decisions` | 6/12 | 0/12 | 6/12 |

Both checkpoints returned choices, but the integration's evidence-scope, classification and timing probability checks abstained on every example. Six correct `unclear` labels do not demonstrate an effective decision brain: all six required definitive decisions were missed. Definitive-label precision is undefined because the denominator is zero.

Raw results are preserved in [multilingual baseline](laya-multilingual-baseline.json) and [typed-decisions baseline](laya-typed-decisions-baseline.json). Each file includes inputs, expected labels, old rule labels, selected choices/probabilities, final labels and elapsed times. Multilingual revision: `e4e9ddf21a7b1903b7acffd8814ad4307bf63a67`. Typed-decisions revision: `1a793eb568e6718f15941d08f85432581df534e3`. Runtime: Laya 0.3.21, Python 3.12, CPU. The first multilingual run used the runtime's default CPU thread count; the decision-focused run used four threads. Do not treat these as controlled latency benchmarks.

The examples cover explicit offers/refusals, the previously missed internship refusal, conditional sponsorship, current/future wording, application questions, existing authorization alone, silence, historical activity, unrelated sponsorship, an instruction embedded in page text, and CPT independence.

Observed problems are not merely the conservative threshold: some raw choices misclassified scope and inferred training-program acceptance/exclusion without supporting wording. An additional four-case diagnostic using a simpler single question and plain text with the typed-decisions checkpoint chose `available` for the internship refusal and for a benefits-only passage, at low probabilities. That exploratory prompt did not replace the integrated questions. Lowering the abstention threshold would expose incorrect decisions rather than establish better accuracy.

**Decision:** retain the integration as opt-in experimental infrastructure. Do not enable it by default or claim that pretrained Laya solves sponsorship interpretation. The model checkpoints need domain evaluation and potentially fine-tuning before reliance. Hosted Jev has not been tested.

Integration tests use controlled outputs to verify source-bound quotations, topic separation, conflicts, timing, invalid/missing results, stale-response rejection, opt-out, and unavailable-service behavior. Those tests establish correct plumbing, not correct model judgments.
