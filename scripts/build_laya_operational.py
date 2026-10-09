#!/usr/bin/env python3
"""Build additive, reviewed passage datasets without changing archived inputs."""
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

from validate_laya_operational import DEFAULT_DIR, ROOT, SPLITS, digest, normalize, validate_rows

BASE = ROOT / "evaluation/laya-training"
FROZEN = BASE / "frozen-expansion-v1/training-corpus-v1.json"
PRIOR = BASE / "normalized-submissions-2026-10-08.json"
NEW = BASE / "adjusted-submissions-2026-10-09/adjusted-records.json"
FIELDS = ("scope", "sponsorship", "timing", "cpt", "opt")


def employer_group(row):
    group = normalize(row.get("employerGroup", row["employer"]))
    return {
        "general dynamics it": "general dynamics",
        "general dynamics mission systems": "general dynamics",
        "hca healthcare": "hca healthcare",
        "centerpoint medical center": "hca healthcare",
        "think academy us": "think academy",
        "imc trading": "imc",
        "spl via indeed": "spl",
    }.get(group, group)


def record(row, split, source, legacy=False):
    group = employer_group(row)
    result = {
        "id": f"prior-2026-10-08-{row['id']}" if legacy else row["id"],
        "sourceDataset": str(source.relative_to(ROOT)), "sourceRecord": row.get("sourceRecord", row["id"]),
        "employer": row["employer"], "employerGroup": group, "policyFamily": row.get("policyFamily", group),
        "jobTitle": row.get("jobTitle", ""), "text": row["text"],
        **{field: row[field] for field in FIELDS},
        "evidenceSha256": hashlib.sha256(row["text"].encode()).hexdigest(),
        "split": split, "inputContext": {"employer": row["employer"], "jobTitle": row.get("jobTitle", ""), "neighbors": []},
        "reviewer": "assistant-operational-data", "reviewedAt": "2026-10-09", "reviewState": "assistant-reviewed",
    }
    if "vacancyId" in row:
        result["sourceVacancyId"] = row["vacancyId"]
    if legacy and row["id"] == "39":
        result["timing"] = "now"
        result["reviewNote"] = "At this time explicitly refers to current sponsorship; corrected without changing the original submission."
    return result


def build(collection_path, output=DEFAULT_DIR, refresh_candidate=False):
    collection_path, output = Path(collection_path).resolve(), Path(output)
    if output.exists():
        if not refresh_candidate:
            raise FileExistsError(f"{output} exists; preserve frozen datasets and use a new version")
        existing = json.loads((output / "manifest.json").read_text())
        if existing.get("status") != "candidate" or existing.get("trainingRunApproved") is not False:
            raise ValueError("cannot refresh a frozen or approved dataset")
    sources = [FROZEN, PRIOR, NEW, collection_path]
    inputs = [json.loads(path.read_text()) for path in sources]
    datasets = {split: [] for split in SPLITS}
    excluded = []
    datasets["train"] = [record(row, "train", FROZEN) for row in inputs[0]["recordsData"]]
    for dataset in inputs[1]["datasets"].values():
        split = dataset["intendedSplit"]
        for row in dataset["recordsData"]:
            if split == "calibration" and row["id"] == "48":
                excluded.append({"sourceDataset": str(PRIOR.relative_to(ROOT)), "sourceRecord": row["id"], "intendedSplit": split, "reason": "Exact duplicate calibration passage of prior record 47; keep one."})
            else:
                datasets[split].append(record(row, split, PRIOR, legacy=True))
    for row in inputs[2]["recordsData"]:
        if row["disposition"] == "candidate" or row["id"] == "submission-2026-10-09-calibration-030":
            datasets[row["intendedSplit"]].append(record(row, row["intendedSplit"], NEW))
        else:
            reasons = row["holdReasons"]
            if row["id"] == "submission-2026-10-09-train-018":
                reasons = ["Think Academy remains in its earlier calibration split; do not move calibration evidence into training."]
            elif row["id"] in {"submission-2026-10-09-calibration-012", "submission-2026-10-09-calibration-024"}:
                reasons = ["Boeing remains in earlier training; new calibration passages would cross employer splits."]
            excluded.append({"sourceDataset": str(NEW.relative_to(ROOT)), "sourceRecord": row["sourceRecord"], "id": row["id"], "intendedSplit": row["intendedSplit"], "reason": " ".join(reasons)})
    for row in inputs[3]["recordsData"]:
        datasets[row["split"]].append(record(row, row["split"], collection_path))
    validate_rows(datasets)
    output.mkdir(exist_ok=refresh_candidate)
    specs = {}
    for split in SPLITS:
        content = {"schemaVersion": 1, "contract": "laya-policy-v1", "split": split, "inputMode": "passage-only-context", "records": len(datasets[split]), "recordsData": datasets[split]}
        path = output / f"{split}.json"
        path.write_text(json.dumps(content, indent=2, ensure_ascii=False) + "\n")
        specs[split] = {"path": path.name, "sha256": digest(path), "records": len(datasets[split]), "employers": len({r["employerGroup"] for r in datasets[split]}), "labelCounts": {field: dict(Counter(row[field] for row in datasets[split])) for field in FIELDS}}
    multiplicities = Counter((row["employerGroup"], normalize(row["text"])) for row in datasets["train"])
    contract = ROOT / "DECISION_LOGIC.md"
    questions = BASE / "worker-review-v2/questions.json"
    manifest = {
        "schemaVersion": 1, "corpusVersion": "operational-v2-2026-10-09", "contract": "laya-policy-v1",
        "status": "candidate", "trainingRunApproved": False, "createdAt": "2026-10-09", "review": {"independentReviewPassed": False},
        "privacy": {"containsApplicantData": False}, "inputMode": "passage-only-context", "sourceMetadataRequired": False,
        "membershipAssumption": "New submissions add to earlier submissions; owner requested necessary adjustments and training. No calibration-to-training transfers.",
        "decisionContract": {"path": str(contract.relative_to(ROOT)), "sha256": digest(contract)},
        "questions": {"path": str(questions.relative_to(ROOT)), "sha256": digest(questions)},
        "sources": [{"path": str(path.relative_to(ROOT)), "sha256": digest(path)} for path in sources] + inputs[2]["sources"],
        "datasets": specs, "excluded": excluded,
        "policyFamilyReview": {"reviewer": "assistant-operational-data", "reviewedAt": "2026-10-09", "method": "Common short industry wording and matching labels are not automatic leakage. All records from the same normalized employer/parent group stay together. Exact passages and explicit shared policy families cannot cross splits; 32-word copied spans are mechanically rejected. The prior broad topic/template quarantine is superseded only for this operational version."},
        "limitations": ["Small passage-only datasets; no full-vacancy completeness or deployment-quality claim.", "Other-role and none scope coverage may be absent; report per-class counts rather than claiming complete coverage.", "Known same-employer repeated passages in frozen v1 are retained as distinct vacancies, not independent new language.", "Unresolved identity and ambiguous-label records stay excluded, preserved in archived submissions."],
        "trainingExactPassageMultiplicities": [{"employerGroup": employer, "normalizedText": text, "records": count} for (employer, text), count in multiplicities.items() if count > 1],
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--collection", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=DEFAULT_DIR)
    parser.add_argument("--refresh-candidate", action="store_true")
    args = parser.parse_args()
    result = build(args.collection, args.output, args.refresh_candidate)
    print(json.dumps({"status": result["status"], "datasets": {split: spec["records"] for split, spec in result["datasets"].items()}, "excluded": len(result["excluded"])}))
