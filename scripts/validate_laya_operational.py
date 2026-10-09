#!/usr/bin/env python3
"""Validate pinned passage-only datasets before Laya weights are loaded."""
import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path

from freeze_laya_expansion import LABELS

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DIR = ROOT / "evaluation/laya-training/operational-v2-2026-10-09"
SPLITS = ("train", "calibration", "test")


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def normalize(value):
    return " ".join(re.findall(r"\w+", unicodedata.normalize("NFKC", value).casefold()))


def validate_rows(datasets):
    ids = set()
    ownership = {key: {} for key in ("employer", "policy family", "exact evidence", "copied template")}
    for split in SPLITS:
        rows = datasets[split]
        if not rows:
            raise ValueError(f"{split}: dataset is empty")
        for row in rows:
            missing = {"id", "text", "employer", "jobTitle", "employerGroup", "policyFamily", "evidenceSha256", "split", "reviewer", "reviewedAt", "reviewState", "inputContext", *LABELS} - row.keys()
            if missing:
                raise ValueError(f"{row.get('id')}: missing fields {sorted(missing)}")
            if row["id"] in ids:
                raise ValueError(f"duplicate id: {row['id']}")
            ids.add(row["id"])
            if row["split"] != split:
                raise ValueError(f"{row['id']}: incorrect split")
            if not all(isinstance(row[key], str) and row[key].strip() for key in ("id", "text", "employer", "employerGroup", "policyFamily", "reviewer", "reviewedAt")):
                raise ValueError(f"{row['id']}: missing identity, evidence or review")
            for field, choices in LABELS.items():
                if row[field] not in choices:
                    raise ValueError(f"{row['id']}: invalid {field}")
            if row["scope"] != "role" and any(row[field] != value for field, value in {"sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear"}.items()):
                raise ValueError(f"{row['id']}: non-role policy finding")
            if row["reviewState"] != "assistant-reviewed":
                raise ValueError(f"{row['id']}: review not complete")
            if hashlib.sha256(row["text"].encode()).hexdigest() != row["evidenceSha256"]:
                raise ValueError(f"{row['id']}: evidence hash drift")
            if row["inputContext"] != {"employer": row["employer"], "jobTitle": row["jobTitle"], "neighbors": []}:
                raise ValueError(f"{row['id']}: passage-only input context changed")
            tokens = normalize(row["text"]).split()
            # Generic short industry phrasing is permitted; long copied spans are not.
            spans = {" ".join(tokens[i:i + 32]) for i in range(len(tokens) - 31)}
            keys = [("employer", normalize(row["employerGroup"])), ("policy family", normalize(row["policyFamily"])), ("exact evidence", normalize(row["text"]))]
            keys.extend(("copied template", span) for span in spans)
            for kind, key in keys:
                prior = ownership[kind].get(key)
                if prior and prior[0] != split:
                    raise ValueError(f"{kind} leakage: {prior[1]} ({prior[0]}) and {row['id']} ({split})")
                if prior and kind == "exact evidence" and split != "train":
                    raise ValueError(f"duplicate {split} evidence: {prior[1]} and {row['id']}")
                ownership[kind][key] = (split, row["id"])
    return datasets


def validate_operational(dataset_dir=DEFAULT_DIR, require_frozen=True):
    directory = Path(dataset_dir)
    manifest = json.loads((directory / "manifest.json").read_text())
    if manifest.get("schemaVersion") != 1 or manifest.get("contract") != "laya-policy-v1":
        raise ValueError("invalid operational dataset manifest")
    if manifest.get("inputMode") != "passage-only-context" or manifest.get("privacy") != {"containsApplicantData": False}:
        raise ValueError("unsupported input mode or privacy declaration")
    if require_frozen and (manifest.get("status") != "frozen" or manifest.get("trainingRunApproved") is not True or not manifest.get("review", {}).get("independentReviewPassed")):
        raise ValueError("datasets are not frozen and independently approved")
    for name in ("decisionContract", "questions"):
        spec = manifest[name]
        if digest(ROOT / spec["path"]) != spec["sha256"]:
            raise ValueError(f"{name} hash drift")
    if require_frozen:
        review = manifest["review"]
        review_path = directory / review["path"]
        if digest(review_path) != review["sha256"]:
            raise ValueError("independent review hash drift")
        approval = json.loads(review_path.read_text())
        expected = {split: manifest["datasets"][split]["sha256"] for split in SPLITS}
        if (approval.get("independentReviewPassed") is not True
                or approval.get("datasetHashes") != expected
                or approval.get("decisionContractSha256") != manifest["decisionContract"]["sha256"]
                or approval.get("questionsSha256") != manifest["questions"]["sha256"]
                or not approval.get("reviewer") or not approval.get("reviewedAt")):
            raise ValueError("independent review does not approve these inputs")
    for spec in manifest["sources"]:
        if digest(ROOT / spec["path"]) != spec["sha256"]:
            raise ValueError(f"source hash drift: {spec['path']}")
    datasets = {}
    for split in SPLITS:
        spec = manifest["datasets"][split]
        if spec["path"] != f"{split}.json":
            raise ValueError("unexpected split filename")
        path = directory / spec["path"]
        if digest(path) != spec["sha256"]:
            raise ValueError(f"{split} dataset hash drift")
        dataset = json.loads(path.read_text())
        if dataset.get("schemaVersion") != 1 or dataset.get("contract") != "laya-policy-v1" or dataset.get("split") != split:
            raise ValueError(f"{split}: invalid dataset header")
        rows = dataset["recordsData"]
        if len(rows) != spec["records"] or len(rows) != dataset["records"]:
            raise ValueError(f"{split}: record count drift")
        datasets[split] = rows
    return validate_rows(datasets)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset-dir", type=Path, default=DEFAULT_DIR)
    parser.add_argument("--allow-candidate", action="store_true")
    args = parser.parse_args()
    rows = validate_operational(args.dataset_dir, require_frozen=not args.allow_candidate)
    print(json.dumps({"validated": {split: len(data) for split, data in rows.items()}, "frozenRequired": not args.allow_candidate}))
