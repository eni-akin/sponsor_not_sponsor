# Separate deterministic and probabilistic results

For each scanned vacancy, show the rule result and Laya result independently in both the popup and expanded page panel.

1. Preserve the existing deterministic interpretation and use it for the compact badge.
2. Store Laya's interpretation separately for the same evidence generation. Discard stale replies when the vacancy or evidence changes.
3. Give both results the existing four decision labels, their own explanations and exact source quotes. Show model disabled, pending and unavailable states explicitly while retaining the rule result.
4. The probabilistic comparison must not inherit rule sponsorship refusals or rule-derived restrictions. Laya currently classifies sponsorship, CPT and OPT; explain this coverage difference beside its result. Keep the existing hybrid evaluation behavior available for historical experiments.
5. Verify disagreements, pending/error states, opt-out and navigation; run typecheck, relevant tests, build and the mocked browser integration where available.

Scope: display and transport changes only. Retain explicit opt-in, current vacancy scope, confidence threshold, evidence privacy and source completeness checks. No training, threshold tuning or deployment is required.

Implemented October 6, 2026. The popup and page panel show separate results and reports include both. Typecheck, 212 unit tests, build and mocked browser integration passed, including deliberate rule/model disagreement, opt-out and service failure. The browser mock checks integration; it does not establish model accuracy.
