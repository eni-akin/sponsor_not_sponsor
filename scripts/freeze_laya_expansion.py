#!/usr/bin/env python3
"""Create once, then validate, the approved expansion training corpus."""

import argparse
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "evaluation/laya-training/expansion-candidates-2026-10-07.json"
FREEZE_DIR = ROOT / "evaluation/laya-training/frozen-expansion-v1"
CORPUS = FREEZE_DIR / "training-corpus-v1.json"
MANIFEST = FREEZE_DIR / "manifest.json"
CONTRACT = ROOT / "DECISION_LOGIC.md"
QUESTIONS = ROOT / "evaluation/laya-training/worker-review-v2/questions.json"

LABELS = {
    "scope": {"role", "question", "historical", "company", "other-role", "none"},
    "sponsorship": {"available", "unavailable", "conditional", "unclear"},
    "timing": {"now", "future", "now-and-future", "unspecified"},
    "cpt": {"explicitly-accepted", "explicitly-excluded", "unclear"},
    "opt": {"explicitly-accepted", "explicitly-excluded", "unclear"},
}
REQUIRED = {
    "id", "text", *LABELS, "rationale", "employer", "jobTitle", "vacancyId",
    "sourceUrl", "retrievedAt", "sourceStatus", "captureStatus", "locator",
    "evidenceSha256", "group", "policyFamilySha256", "split", "reviewState",
    "reviewer", "reviewedAt",
}
BLOCKERS = [
    "no fresh employer/policy-family-disjoint calibration split",
    "no fresh employer/policy-family-disjoint held-out test split",
]


def sha256(value):
    if isinstance(value, Path):
        value = value.read_bytes()
    elif not isinstance(value, bytes):
        value = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return hashlib.sha256(value).hexdigest()


def load(path):
    return json.loads(path.read_text())


def validate_records(rows):
    seen_ids = set()
    seen_evidence = set()
    for row in rows:
        missing = REQUIRED - row.keys()
        if missing:
            raise ValueError(f"{row.get('id', '<missing id>')}: missing fields {sorted(missing)}")
        if row["id"] in seen_ids:
            raise ValueError(f"duplicate id: {row['id']}")
        seen_ids.add(row["id"])
        evidence_key = (row["sourceUrl"], row["evidenceSha256"])
        if evidence_key in seen_evidence:
            raise ValueError(f"duplicate vacancy evidence: {row['id']}")
        seen_evidence.add(evidence_key)
        for label, choices in LABELS.items():
            if row[label] not in choices:
                raise ValueError(f"{row['id']}: missing or invalid {label} label")
        if row["split"] != "train":
            raise ValueError(f"{row['id']}: frozen records must stay in train")
        if row["sourceStatus"] != "owner-verified-official":
            raise ValueError(f"{row['id']}: source is not owner-verified official")
        if row["captureStatus"] != "complete-owner-verified":
            raise ValueError(f"{row['id']}: source capture is not complete and owner-verified")
        if not all(row[field] for field in REQUIRED - {"split"}):
            raise ValueError(f"{row['id']}: required field is empty")
        if sha256(row["text"].encode()) != row["evidenceSha256"]:
            raise ValueError(f"{row['id']}: evidence hash drift")


def frozen_rows(source):
    rows = copy.deepcopy(source["recordsData"])
    for row in rows:
        row["split"] = "train"
    return rows


def create_freeze():
    if FREEZE_DIR.exists():
        raise FileExistsError(f"{FREEZE_DIR} already exists; create a new version instead of overwriting it")
    source = load(SOURCE)
    rows = frozen_rows(source)
    validate_records(rows)
    vacancies = len({(row["employer"], row["vacancyId"]) for row in rows})
    if (len(rows), vacancies) != (39, 38):
        raise ValueError("approved source must contain 39 records across 38 vacancies")

    corpus = {
        "schemaVersion": 1,
        "corpusVersion": "frozen-expansion-v1",
        "contract": "laya-policy-v1",
        "intendedUse": "training-only",
        "trainingReady": False,
        "records": len(rows),
        "vacancies": vacancies,
        "frozenAt": "2026-10-07",
        "reviewer": source["reviewer"],
        "privacy": {"containsApplicantData": False},
        "blockers": BLOCKERS,
        "recordsData": rows,
    }
    questions = load(QUESTIONS)
    FREEZE_DIR.mkdir(parents=True)
    CORPUS.write_text(json.dumps(corpus, indent=2, ensure_ascii=False) + "\n")
    manifest = {
        "schemaVersion": 1,
        "corpusVersion": "frozen-expansion-v1",
        "trainingOnly": True,
        "trainingReady": False,
        "blockers": BLOCKERS,
        "content": {
            "path": CORPUS.name,
            "sha256": sha256(CORPUS),
            "recordsSha256": sha256(rows),
            "records": len(rows),
            "vacancies": vacancies,
        },
        "source": {
            "path": "../expansion-candidates-2026-10-07.json",
            "sha256": sha256(SOURCE),
            **source["inputs"],
        },
        "decisionContract": {
            "path": "../../../DECISION_LOGIC.md",
            "version": 1,
            "sha256": sha256(CONTRACT),
        },
        "questions": {
            "path": "../worker-review-v2/questions.json",
            "sha256": sha256(QUESTIONS),
            "itemSha256": {name: sha256(question) for name, question in questions.items()},
        },
        "privacy": corpus["privacy"],
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    return validate_freeze()


def validate_freeze():
    manifest = load(MANIFEST)
    corpus = load(CORPUS)
    if manifest.get("trainingOnly") is not True or manifest.get("trainingReady") is not False:
        raise ValueError("manifest must remain training-only and not training-ready")
    if corpus.get("intendedUse") != "training-only" or corpus.get("trainingReady") is not False:
        raise ValueError("corpus must remain training-only and not training-ready")
    if manifest.get("blockers") != BLOCKERS or corpus.get("blockers") != BLOCKERS:
        raise ValueError("fresh calibration/test blockers must remain recorded")
    for name in ("content", "source", "decisionContract", "questions"):
        spec = manifest[name]
        path = FREEZE_DIR / spec["path"]
        if sha256(path) != spec["sha256"]:
            raise ValueError(f"{name} hash drift")
    rows = corpus["recordsData"]
    validate_records(rows)
    if sha256(rows) != manifest["content"]["recordsSha256"]:
        raise ValueError("record content hash drift")
    source = load(SOURCE)
    if rows != frozen_rows(source):
        raise ValueError("frozen content no longer matches its approved source")
    counts = (len(rows), len({(row["employer"], row["vacancyId"]) for row in rows}))
    if counts != (manifest["content"]["records"], manifest["content"]["vacancies"]):
        raise ValueError("manifest record counts do not match the corpus")
    questions = load(QUESTIONS)
    if manifest["questions"]["itemSha256"] != {name: sha256(value) for name, value in questions.items()}:
        raise ValueError("question hash drift")
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--create", action="store_true", help="create frozen-expansion-v1 once")
    args = parser.parse_args()
    manifest = create_freeze() if args.create else validate_freeze()
    print(f"validated {manifest['content']['records']} frozen training records")


if __name__ == "__main__":
    main()
