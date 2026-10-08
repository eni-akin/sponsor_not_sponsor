#!/usr/bin/env python3
"""Normalize malformed submitted CSV labels without promoting unverified data."""

import argparse
import csv
import hashlib
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "evaluation/laya-training/normalized-submissions-2026-10-08.json"
FROZEN_V1 = ROOT / "evaluation/laya-training/frozen-expansion-v1/training-corpus-v1.json"
CONTRACT = ROOT / "DECISION_LOGIC.md"
QUESTIONS = ROOT / "evaluation/laya-training/worker-review-v2/questions.json"

LABELS = {
    "scope": {"role", "question", "historical", "company", "other-role", "none"},
    "sponsorship": {"available", "unavailable", "conditional", "unclear"},
    "timing": {"now", "future", "now-and-future", "unspecified"},
    "cpt": {"explicitly-accepted", "explicitly-excluded", "unclear"},
    "opt": {"explicitly-accepted", "explicitly-excluded", "unclear"},
}
LABEL_COLUMN = "Labels (Scope, Sponsorship, Timing, CPT, OPT)"
CORRECTIONS = {
    "thinkacademy-7980990003": {
        "field": "sponsorship",
        "submitted": "available",
        "normalized": "unclear",
        "reason": "CPT/OPT acceptance does not establish visa sponsorship under DECISION_LOGIC.md.",
    }
}
BLOCKERS = [
    "policy-family grouping has not been independently audited",
    "no fresh employer/policy-family-disjoint held-out test split",
]


def sha256(value):
    if isinstance(value, Path):
        value = value.read_bytes()
    elif not isinstance(value, bytes):
        value = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return hashlib.sha256(value).hexdigest()


def clean(value):
    return value.strip().strip('"').strip()


def normalize_csv(path, intended_split, as_of, first_id):
    with path.open(newline="", encoding="utf-8-sig") as source:
        reader = csv.DictReader(source)
        rows = list(reader)
    if LABEL_COLUMN not in (reader.fieldnames or []):
        raise ValueError(f"{path.name}: missing combined label column")

    normalized = []
    for number, row in enumerate(rows, 2):
        values = [row[LABEL_COLUMN], *(row.get(None) or [])]
        values = [clean(value) for value in values]
        if len(values) != 5:
            raise ValueError(f"{path.name}:{number}: expected five labels, got {len(values)}")
        record_labels = dict(zip(LABELS, values))
        for field, choices in LABELS.items():
            if record_labels[field] not in choices:
                raise ValueError(f"{path.name}:{number}: invalid {field} label {record_labels[field]!r}")

        submitted_id = row["Record ID"].strip()
        correction = CORRECTIONS.get(submitted_id)
        if correction:
            if record_labels[correction["field"]] != correction["submitted"]:
                raise ValueError(f"{record_id}: submitted label no longer matches documented correction")
            record_labels[correction["field"]] = correction["normalized"]
        retrieved_at = date.fromisoformat(row["Retrieval Date"].strip())
        if retrieved_at > as_of:
            raise ValueError(f"{submitted_id}: retrieval date {retrieved_at} is after {as_of}")
        text = row["Extracted Evidence Passage"].strip()
        if len(text) >= 2 and text.startswith('"') and text.endswith('"'):
            text = text[1:-1]
        normalized.append({
            "id": str(first_id + number - 2),
            "employer": row["Employer"].strip(),
            "jobTitle": row["Job Title"].strip(),
            "retrievedAt": retrieved_at.isoformat(),
            "text": text,
            "locator": row["Passage Locator"].strip(),
            **record_labels,
            "evidenceSha256": sha256(text.encode()),
            "sourceStatus": "owner-confirmed-extracted-evidence",
            "captureStatus": "owner-confirmed",
            "group": row["Employer"].strip().casefold(),
            "split": None,
            "intendedSplit": intended_split,
            "reviewState": "approved",
            "reviewer": "project-owner",
            "reviewedAt": as_of.isoformat(),
            "rationale": correction["reason"] if correction else "Labels reviewed and approved by project owner.",
        })
    return {
        "sourceCsv": {"filename": path.name, "sha256": sha256(path)},
        "intendedSplit": intended_split,
        "records": len(normalized),
        "recordsData": normalized,
    }


def build(training_path, calibration_path, as_of):
    datasets = {
        "training": normalize_csv(training_path, "train", as_of, 1),
        "calibration": normalize_csv(calibration_path, "calibration", as_of, 26),
    }
    frozen = json.loads(FROZEN_V1.read_text())["recordsData"]
    submitted = [row for dataset in datasets.values() for row in dataset["recordsData"]]
    employers = {row["employer"].casefold() for row in submitted}
    frozen_employers = {row["employer"].casefold() for row in frozen}
    training_employers = {row["employer"].casefold() for row in datasets["training"]["recordsData"]}
    calibration_employers = {row["employer"].casefold() for row in datasets["calibration"]["recordsData"]}
    training_ids = {row["id"] for row in datasets["training"]["recordsData"]}
    calibration_ids = {row["id"] for row in datasets["calibration"]["recordsData"]}
    training_evidence = {row["evidenceSha256"] for row in datasets["training"]["recordsData"]}
    calibration_evidence = {row["evidenceSha256"] for row in datasets["calibration"]["recordsData"]}
    return {
        "schemaVersion": 1,
        "contract": "laya-policy-v1",
        "importStatus": "approved-pending-freeze",
        "trainingReady": False,
        "calibrationReady": True,
        "privacy": {"containsApplicantData": False},
        "normalizedAt": as_of.isoformat(),
        "retrievalDateAssessment": {
            "allDates": sorted({row["retrievedAt"] for row in submitted}),
            "asOf": as_of.isoformat(),
            "notFuture": all(date.fromisoformat(row["retrievedAt"]) <= as_of for row in submitted),
            "verified": True,
        },
        "blockers": BLOCKERS,
        "decisionContract": {"path": "../../DECISION_LOGIC.md", "sha256": sha256(CONTRACT)},
        "questions": {"path": "worker-review-v2/questions.json", "sha256": sha256(QUESTIONS)},
        "labelCorrections": [{"id": record_id, **correction} for record_id, correction in CORRECTIONS.items()],
        "integrity": {
            "crossSplitEmployerDisjoint": training_employers.isdisjoint(calibration_employers),
            "frozenV1EmployerDisjoint": employers.isdisjoint(frozen_employers),
            "crossSplitRecordIdDisjoint": training_ids.isdisjoint(calibration_ids),
            "frozenV1RecordIdDisjoint": {row["id"] for row in submitted}.isdisjoint({row["id"] for row in frozen}),
            "crossSplitExactEvidenceDisjoint": training_evidence.isdisjoint(calibration_evidence),
            "frozenV1ExactEvidenceDisjoint": {row["evidenceSha256"] for row in submitted}.isdisjoint(
                {row["evidenceSha256"] for row in frozen}
            ),
        },
        "datasets": datasets,
    }


def validate(data):
    if data.get("importStatus") != "approved-pending-freeze" or data.get("trainingReady") is not False or data.get("calibrationReady") is not True:
        raise ValueError("approved submissions must remain pending freeze until a held-out test exists")
    if data.get("privacy") != {"containsApplicantData": False}:
        raise ValueError("submissions must explicitly exclude applicant data")
    if data.get("blockers") != BLOCKERS or data["retrievalDateAssessment"].get("verified") is not True:
        raise ValueError("submission blockers or retrieval-date status changed")
    if data["decisionContract"]["sha256"] != sha256(CONTRACT) or data["questions"]["sha256"] != sha256(QUESTIONS):
        raise ValueError("decision contract or question hash drift")
    seen_ids = set()
    for dataset in data["datasets"].values():
        if dataset["records"] != 25 or dataset["records"] != len(dataset["recordsData"]):
            raise ValueError("each submitted dataset must contain 25 records")
        for row in dataset["recordsData"]:
            if row["id"] in seen_ids:
                raise ValueError(f"duplicate submitted id: {row['id']}")
            seen_ids.add(row["id"])
            for field, choices in LABELS.items():
                if row[field] not in choices:
                    raise ValueError(f"{row['id']}: invalid {field} label")
            if row["split"] is not None or row["reviewState"] != "approved":
                raise ValueError(f"{row['id']}: approved record was assigned before freeze")
            if "sourceUrl" in row or "vacancyId" in row:
                raise ValueError(f"{row['id']}: unused source identifiers must not be retained")
            if sha256(row["text"].encode()) != row["evidenceSha256"]:
                raise ValueError(f"{row['id']}: evidence hash drift")
    for name, passed in data["integrity"].items():
        if passed is not True:
            raise ValueError(f"integrity check failed: {name}")
    think = next(row for row in data["datasets"]["calibration"]["recordsData"] if row["employer"] == "Think Academy")
    if think["sponsorship"] != "unclear":
        raise ValueError("CPT/OPT acceptance must not establish sponsorship")
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--training", type=Path, required=True)
    parser.add_argument("--calibration", type=Path, required=True)
    parser.add_argument("--as-of", type=date.fromisoformat, default=date.today())
    parser.add_argument("--output", type=Path, default=OUTPUT)
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()
    if args.output.exists() and not args.overwrite:
        raise FileExistsError(f"{args.output} exists; pass --overwrite to replace this non-frozen normalization")
    data = validate(build(args.training, args.calibration, args.as_of))
    args.output.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"normalized {sum(dataset['records'] for dataset in data['datasets'].values())} approved records pending freeze")


if __name__ == "__main__":
    main()
