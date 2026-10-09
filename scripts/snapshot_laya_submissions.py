#!/usr/bin/env python3
"""Validate historical candidate snapshots and the owner's dataset-level approval."""

import argparse
import copy
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "evaluation/laya-training/normalized-submissions-2026-10-08.json"
V1 = ROOT / "evaluation/laya-training/frozen-expansion-v1/training-corpus-v1.json"
AUDIT = ROOT / "evaluation/laya-training/policy-family-audit-2026-10-08.json"
REVIEW = ROOT / "evaluation/laya-training/policy-family-audit-review-2026-10-08.json"
OUTPUT = ROOT / "evaluation/laya-training/audited-candidates-v2"
CONTRACT = ROOT / "DECISION_LOGIC.md"
QUESTIONS = ROOT / "evaluation/laya-training/worker-review-v2/questions.json"
INTEGRITY = ROOT / "evaluation/laya-training/dataset-integrity-2026-10-08.json"
SPEC = importlib.util.spec_from_file_location("normalized_submissions", ROOT / "scripts/normalize_laya_submissions.py")
NORMALIZE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(NORMALIZE)
sha256 = NORMALIZE.sha256
BLOCKERS = [
    "official source URLs, vacancy identity and source-capture hashes are absent from normalized submissions",
    "no reviewed frozen employer/policy-family-disjoint held-out test split",
]


def load(path):
    return json.loads(path.read_text())


def partition(source, old_rows, audit):
    """Keep owner-intended splits and quarantine calibration families used by training."""
    NORMALIZE.validate(source)
    for name, split in (("training", "train"), ("calibration", "calibration")):
        dataset = source["datasets"][name]
        if dataset["intendedSplit"] != split or any(row["intendedSplit"] != split for row in dataset["recordsData"]):
            raise ValueError("owner-intended split drift")
    if audit["sourceHashes"]["submissions"]["sha256"] != sha256(SOURCE) or audit["sourceHashes"]["frozen-v1"]["sha256"] != sha256(V1):
        raise ValueError("audit source hash drift")
    if audit.get("contractSha256") != sha256(CONTRACT):
        raise ValueError("audit contract hash drift")
    new_rows = [row for dataset in source["datasets"].values() for row in dataset["recordsData"]]
    all_ids = {row["id"] for row in old_rows + new_rows}
    families = {row["id"]: row["policyFamilyId"] for row in audit["assignments"]}
    if len(families) != len(audit["assignments"]) or set(families) != all_ids or not all(families.values()):
        raise ValueError("audit must map every existing and submitted record exactly once")
    by_id = {row["id"]: row for row in old_rows + new_rows}
    for assignment in audit["assignments"]:
        row = by_id[assignment["id"]]
        if assignment["evidenceSha256"] != row["evidenceSha256"] or assignment["employer"] != row["employer"]:
            raise ValueError("audit evidence/employer assignment drift")
        if assignment["intendedSplit"] != row.get("intendedSplit", "train"):
            raise ValueError("audit intended split drift")
    training = old_rows + source["datasets"]["training"]["recordsData"]
    used_families = {families[row["id"]] for row in training}
    used_employers = {row["employer"].strip().casefold() for row in training}
    used_evidence = {row["evidenceSha256"] for row in training}
    quarantine = {row["id"]: row["reason"] for row in audit["assignments"] if row["quarantine"]}
    if set(quarantine) != set(audit["quarantineCalibrationIds"]) or not all(quarantine.values()):
        raise ValueError("quarantine needs unique IDs and reasons")
    calibration_ids = {row["id"] for row in source["datasets"]["calibration"]["recordsData"]}
    if not set(quarantine) <= calibration_ids:
        raise ValueError("only owner-intended calibration records may be quarantined")
    output = {"training": [], "calibration": [], "quarantine": []}
    for row in new_rows:
        item = copy.deepcopy(row)
        item["policyFamily"] = families[row["id"]]
        if row["intendedSplit"] == "train":
            item["split"] = "train"
            output["training"].append(item)
            continue
        overlap = (item["policyFamily"] in used_families or
                   row["employer"].strip().casefold() in used_employers or
                   row["evidenceSha256"] in used_evidence)
        if overlap and row["id"] not in quarantine:
            raise ValueError(f"{row['id']}: cross-split leakage must be quarantined")
        if row["id"] in quarantine:
            item["split"] = None
            item["quarantineReason"] = quarantine[row["id"]]
            output["quarantine"].append(item)
        else:
            item["split"] = "calibration"
            output["calibration"].append(item)
    return output


def documents():
    source, audit = load(SOURCE), load(AUDIT)
    groups = partition(source, load(V1)["recordsData"], audit)
    return {
        name: {
            "schemaVersion": 1,
            "status": "immutable-candidate-snapshot-pending-provenance",
            "intendedUse": {"training": "training-candidate", "calibration": "calibration-only-candidate", "quarantine": "excluded"}[name],
            "weightsTrainingAllowed": False,
            "trainingReady": False,
            "calibrationReady": False,
            "blockers": BLOCKERS,
            "privacy": {"containsApplicantData": False},
            "records": len(rows),
            "recordsData": rows,
        }
        for name, rows in groups.items()
    }


def create_snapshot(output=OUTPUT):
    if output.exists():
        raise FileExistsError(f"{output} exists; create a new version instead")
    validate_review()
    docs = documents()
    manifest = {
        "schemaVersion": 1,
        "status": "immutable-candidate-snapshot-pending-provenance",
        "trainingReady": False,
        "calibrationReady": False,
        "weightsTrainingAllowed": False,
        "blockers": BLOCKERS,
        "inputs": {name: {"path": str(path.relative_to(ROOT)), "sha256": sha256(path)} for name, path in {
            "source": SOURCE, "frozenV1": V1, "policyAudit": AUDIT, "auditReview": REVIEW,
            "decisionContract": CONTRACT, "questions": QUESTIONS,
        }.items()},
        "sourceCsv": {name: value["sourceCsv"] for name, value in load(SOURCE)["datasets"].items()},
        "questionHashes": {name: sha256(value) for name, value in load(QUESTIONS).items()},
        "content": {},
    }
    output.mkdir(parents=True)
    for name, doc in docs.items():
        path = output / f"{name}-candidates.json"
        path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
        manifest["content"][name] = {"path": path.name, "sha256": sha256(path), "recordsSha256": sha256(doc["recordsData"]), "records": doc["records"]}
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    return validate_snapshot(output)


def validate_review():
    review = load(REVIEW)
    if review.get("auditSha256") != sha256(AUDIT) or review.get("reviewer") != "orchestrator" or review.get("approvedFor") != "blocked-candidate-snapshot":
        raise ValueError("orchestrator audit review missing or hash drift")


def validate_snapshot(output=OUTPUT):
    validate_review()
    manifest = load(output / "manifest.json")
    if any(manifest.get(flag) is not False for flag in ("trainingReady", "calibrationReady", "weightsTrainingAllowed")):
        raise ValueError("candidate snapshots must stay unusable for training/calibration")
    if manifest.get("blockers") != BLOCKERS or manifest.get("status") != "immutable-candidate-snapshot-pending-provenance":
        raise ValueError("snapshot blockers/status drift")
    inputs = {"source": SOURCE, "frozenV1": V1, "policyAudit": AUDIT, "auditReview": REVIEW, "decisionContract": CONTRACT, "questions": QUESTIONS}
    if set(manifest["inputs"]) != set(inputs):
        raise ValueError("snapshot input set drift")
    for name, path in inputs.items():
        if manifest["inputs"][name] != {"path": str(path.relative_to(ROOT)), "sha256": sha256(path)}:
            raise ValueError(f"{name} hash/path drift")
    if manifest["questionHashes"] != {name: sha256(value) for name, value in load(QUESTIONS).items()}:
        raise ValueError("question hash drift")
    if manifest["sourceCsv"] != {name: value["sourceCsv"] for name, value in load(SOURCE)["datasets"].items()}:
        raise ValueError("source CSV provenance drift")
    expected = documents()
    if set(manifest["content"]) != set(expected):
        raise ValueError("snapshot content set drift")
    for name, doc in expected.items():
        spec = manifest["content"][name]
        path = output / f"{name}-candidates.json"
        if spec != {"path": path.name, "sha256": sha256(path), "recordsSha256": sha256(doc["recordsData"]), "records": doc["records"]} or load(path) != doc:
            raise ValueError(f"{name} candidate content/hash drift")
    return manifest


def validate_dataset_integrity():
    approval = load(INTEGRITY)
    if approval.get("metadataPolicy") != "owner-confirmed-passages-dataset-level-hashes":
        raise ValueError("dataset metadata policy drift")
    if approval.get("accuracyConfirmation") != {"reviewer": "project-owner", "statement": "the information is accurate"}:
        raise ValueError("owner accuracy confirmation missing")
    if approval.get("sourceMetadataRequired") is not False or approval.get("fullPostingCaptureRequired") is not False:
        raise ValueError("passage metadata waiver drift")
    if approval.get("trainingRunApproved") is not False:
        raise ValueError("dataset hash approval does not approve a training run")
    if approval["dataset"]["path"] != SOURCE.name:
        raise ValueError("dataset identity drift")
    for spec in [approval["dataset"], *approval["partitions"].values()]:
        if sha256(INTEGRITY.parent / spec["path"]) != spec["sha256"]:
            raise ValueError("dataset-level hash drift")
    manifest = validate_snapshot()
    if approval["dataset"]["records"] != 50 or approval["partitions"] != {
        name: {"path": "audited-candidates-v2/" + spec["path"], "sha256": spec["sha256"], "records": spec["records"]}
        for name, spec in manifest["content"].items()
    }:
        raise ValueError("dataset partition/count drift")
    return approval


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot", action="store_true", help="create blocked immutable candidate snapshot once")
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    manifest = create_snapshot(args.output) if args.snapshot else validate_snapshot(args.output)
    print("validated blocked candidates: " + ", ".join(f"{name}={spec['records']}" for name, spec in manifest["content"].items()))
    if args.output == OUTPUT and INTEGRITY.exists():
        validate_dataset_integrity()
        print("Dataset-level hashes verified; owner-approved passages do not require URLs or posting captures.")


if __name__ == "__main__":
    main()
