# Laya evidence audit — October 3, 2026

## Bottom line

The corrected CSV is an outcome summary, not a model-ready evidence set. Its `Yes` description flag cannot show which exact blocks reached `interpretJob`, whether matching structured data was discarded, or whether a quoted policy came from the role evidence at all. The existing report export intentionally omits the full extraction (`src/report.ts:12-18`), so it cannot resolve that question after the fact.

Use the new `scripts/capture-laya-evidence.mjs` before changing rules or training a model. It runs the built extension in a disposable blank Chromium profile, reads the actual content-script `GET_SCAN` result, and writes only the public role record, full evidence blocks, coverage metadata, exact Laya request, URLs, and SHA-256 hashes. It does not type into forms. The scanner itself excludes inputs, textareas, selects, buttons, editable fields, and file/form values (`src/scanner.ts:4,36-77`).

No production rule, scanner, decision, or worker source was changed. No model was downloaded or run for this audit.

## How to separate acquisition failures from interpretation failures

For each case, keep these stages separate:

1. **Role acquisition:** `role === null`, an unreadable/non-job page, or a wrong title/employer is a scanner or page-access failure.
2. **Description acquisition:** `role.completeness === "incomplete"`, a coverage gap, or absence of the reviewed policy sentence from `role.evidence` is an extraction/source-selection failure.
3. **Rules interpretation:** only when the reviewed sentence is present verbatim in the hashed evidence may a wrong `interpretJob`/`mainDecision` result be called an interpreter failure.
4. **Laya interpretation:** evaluate the stored `layaInput` unchanged and bind results to `layaInputSha256`. A model result on a recreated quote is a diagnostic, not a result on the browser capture.

`description-found` is useful but not proof that every policy sentence was captured. A visible posting can pass with one description signal and 100 characters, while matching structured data may be ignored when it does not uniquely match the displayed role (`src/scanner.ts:291-329`). Therefore the CSV's `Yes` flag is insufficient; inspect the exact blocks and coverage sources.

The capture files make the decision mechanical:

- quote absent + source incomplete/ignored: extraction failure;
- quote present + rules miss: interpreter/main-decision failure;
- quote present + Laya abstains or mislabels: model/threshold failure;
- quote absent: do not use a hand-copied sentence to score either engine.

## Nine missed blockers

The audit lists eight `No blocker found` outcomes and one `Could not verify` outcome (`evaluation/part2/extension-output-audit-2026-10-03.md:54-66`). The following probe replayed the exact short quotations authored in the Qwen submission as one-block `JobRecord`s. These are **authored-snippet diagnostics, not browser proof or frozen human labels**.

| Case | Existing acquisition evidence | Authored snippet through current rules | Diagnosis to verify from capture |
| --- | --- | --- | --- |
| Vanguard 182781 | CSV says complete Workday description | `unclear` sponsorship → `no-blocker` | Likely interpreter phrase gap if either quoted Vanguard sentence is in `role.evidence` |
| Elevance Health JR209081 | CSV says complete Workday description | `unclear` sponsorship; generic work-authorization highlight only → `no-blocker` | Interpreter gap if “without future visa sponsorship requirements” is present |
| CACI 333037 | CSV says complete Workday description | `unclear` sponsorship; generic work-authorization highlight only → `no-blocker` | Interpreter gap if “without the need for employer sponsorship” is present |
| SAS 42964 | CSV says complete iCIMS description | `unclear` sponsorship; generic work-authorization highlight only → `no-blocker` | Interpreter gap if “should not require ... sponsorship” is present |
| Zipline 7991435003 | Corrected detail says visible embedded-frame description | `unclear` sponsorship → `no-blocker` | Interpreter gap if “Zipline is unable to sponsor work visas” is present; otherwise frame acquisition |
| Pacific Fusion 4398373009 | CSV says complete description | no sponsorship or restriction → `no-blocker` | Restriction interpreter gap if the mandatory U.S.-person sentence is present |
| Shure 4956 | CSV says complete iCIMS description | `unclear` sponsorship; generic work-authorization highlight only → `no-blocker` | Interpreter gap if “Shure will not sponsor applicants ... for work visas” is present |
| Publicis Groupe 172577 | CSV says complete description | `unclear` sponsorship → `no-blocker` | Interpreter gap if either reviewed refusal sentence is present |
| RF-SMART 5407206008 | Description was not extracted; product returned `Could not verify` | recreated policy still becomes `unclear` → `no-blocker` on a complete synthetic role | Proven acquisition failure first; likely a second interpreter gap after the overview is recovered |

This replay explains why blindly improving extraction will not close all nine misses: every authored quotation also misses the current interpreter. Conversely, it does not prove that the first eight were extracted. Only captured `role.evidence` can prove that.

The neighboring anomalies remain acquisition/label work, not Laya training examples yet:

- Mindex and Epic Games lack descriptions; Demco lacks a recognized role.
- Immuta's application-only source must remain `Could not verify` unless a matching overview is captured.
- Saronic has a U.S.-person definition but no captured sentence making the status mandatory.
- Missing employer metadata weakens model scope context but does not invalidate a role by itself because the decision contract allows `employer: null` (`src/decision.ts:7,20-38`).

## Amgen future-FTE policy

The prior audit proposes conditional, future-only `Sponsorship stated`, not a blocker for the internship (`evaluation/part2/holdout-submission-audit.md:41`). This remains a label to adjudicate: “not guaranteed” alone is not necessarily an explicit offer of sponsorship. Verify the complete wording before treating that proposed label as training gold. Current rules return `no-blocker` for the authored sentence “Sponsorship for future FTE roles is not guaranteed.”

The Laya contract has a structural ambiguity:

- `timing` can represent `future` (`src/decision.ts:12-17`).
- `scope` says a policy for a different role is `other-role`, while sponsorship asks specifically about “this vacancy” (`server/decision-questions.ts:5-17`).
- `applyDecision` discards every non-`role` scope before constructing sponsorship findings (`src/decision.ts:81-95`).

Thus a semantically careful model may label future FTE wording `other-role` and lose it; a `role + conditional + future` answer survives and `mainDecision` would show `Sponsorship stated` (`src/main-decision.ts:47-49`), but that answer conflicts with the present scope definition and may overstate non-guarantee wording.

Before fine-tuning, adjudicate whether this wording should be retained as conditional context or remain unclear, then add a reviewed target for **future employment/conversion related to this internship**, distinct from an unrelated vacancy. The smallest future contract change is one scope value such as `future-employment`, accepted only into `sponsorshipByTiming.future`; it must never create a current internship blocker. Do not train the model to misuse `role` to work around the missing label.

## Other decision-contract gaps

1. Laya only returns scope, sponsorship, timing, CPT, and OPT. Restrictions remain the rule interpreter's output (`src/decision.ts:9-18,118-120`). Laya therefore cannot repair Pacific Fusion or learn affected group, restriction condition, exceptions, and timing, although the acceptance gate explicitly scores them (`evaluation/part2/acceptance.md:7-11`).
2. The Laya request removes evidence source, source URL, locator, and coverage (`src/decision.ts:20-22`). Provenance remains enforceable after inference because citations are rebound to stored evidence, but the model cannot use source type or completeness.
3. The worker supplies only previous/target/next blocks (`server/laya_worker.py:37-52`). A policy whose requirement and exception span more blocks can be under-scoped.
4. The current 0.8 cutoff is provisional and must not be lowered after seeing holdout results (`src/decision.ts:6`; `evaluation/part2/acceptance.md:8`). Both pretrained checkpoints already produced zero definitive final labels on the 12 authored probes, with raw scope and topic errors beyond thresholding (`evaluation/results/laya-development.md:3-18`).

## Capture format and commands

Each run creates `evaluation/laya-experiment/captures/<timestamp-random>/manifest.json` and numbered case files. A case contains:

- `role.evidence`: exact public text, role/source attribution, kind, and locator;
- `extraction`: page kind, completeness, inspected sources, gaps, signals, and warnings;
- `sourceHashes`: exact source URL plus URL/evidence SHA-256;
- `layaInput`: the current `laya-policy-v1` request;
- `layaInputSha256`: binding for evaluation/training outputs.

Build first, then pass only explicitly approved URLs; the script has no default roster and cannot silently fetch holdout candidates:

```sh
pnpm build
node scripts/capture-laya-evidence.mjs 'https://approved-official-job-url.example/job/123'
```

For a known local fixture only:

```sh
CAPTURE_OUTPUT_ROOT=/tmp/sns-laya-capture-test node scripts/capture-laya-evidence.mjs --allow-local 'http://127.0.0.1:PORT/job'
```

Do not use `--allow-local` for evaluation acquisition. Do not enter applicant data, sign in, reuse a personal browser profile, or replace an inaccessible posting after seeing its policy.

## Verification performed

- `node --check scripts/capture-laya-evidence.mjs`: passed.
- Disposable fixture: a failed first URL was recorded as `navigation-failed`; a second URL still captured a complete role and exact Laya input. Planted `PRIVATE_ANSWER`/`PRIVATE_UPLOAD` values were absent.
- Already-exposed Waymo development URL: live blank-session smoke passed with 88 public evidence blocks, complete role metadata, exact input/source hashes, and the export-control policy/exception text. The capture retained an `embedded-content-unread` gap rather than hiding it. This smoke is not a holdout score.
- The two unchanged 750 ms post-ready samples cover the current frame handshake. This is a bounded acquisition heuristic, not proof that every late-loading site has settled; retain the warnings/gaps and reacquire rather than asserting completeness.

Use the repository's [Laya fine-tuning plan](../../LAYA_FINE_TUNING_PLAN.md) only after these source captures and human labels are frozen.
