# Offline Laya policy experiment

This development-only experiment compares the production rules, validated raw Laya choices projected through the production confidence/citation adapter, and the integrated rules-plus-Laya result on identical reviewed evidence excerpts.

```sh
node --import tsx scripts/evaluate-laya-policy.ts --dry-run
node --import tsx scripts/evaluate-laya-policy.ts --self-test
node --import tsx scripts/evaluate-laya-policy.ts
```

Use `--limit N` for a bounded prefix or `--input PATH` for another compatible reviewed development corpus. Dry runs validate inputs and execute the rules baseline, but do not load the model or write files. Real runs use the existing offline worker and create a new `runs/<timestamp>-<id>/results.json`; existing runs are never overwritten.

The default corpus is four reviewed official-source evidence excerpts in `evaluation/part2/development.json`, followed by four explicitly authored diagnostic negatives. They are not full scanner captures; their completeness labels come from the supplied review record rather than a scanner run. The 54-row review and exported CSV are exposed development summaries, not complete extracted job inputs, so this evaluator does not reconstruct evidence from them. The 18 candidate manifest entries and four additions are also exposed and are not a holdout here.

When a reviewed evidence block lacks its own URL, the evaluator attaches the case's official posting `sourceUrl` so displayed citations remain linkable. It also preserves `captureUrl` separately as the more specific retrieval endpoint; it does not claim that the posting URL was the literal transport used for every excerpt.

Current Laya questions cover sponsorship, timing, CPT, and OPT only. Restrictions (including citizenship, U.S.-person, and export-control findings) remain deterministic rule output in the integrated result. Accordingly, that result is **rules plus Laya**, not a pure-model result and not proof of improved quality.
