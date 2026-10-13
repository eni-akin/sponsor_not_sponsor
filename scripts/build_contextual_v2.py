#!/usr/bin/env python3
"""Build the reviewed contextual-v2 candidate without modifying frozen v1."""
import argparse
import copy
import hashlib
import json
import subprocess
from collections import Counter
from pathlib import Path

from validate_laya_contextual import derive_context_for_block, normalize, validate_contextual

ROOT = Path(__file__).resolve().parents[1]
V1 = ROOT / "evaluation/laya-training/contextual-v1-2026-10-10"
REVIEW = ROOT / "evaluation/laya-training/independent-review-2026-10-10"
WTW_REQUEST = ROOT / "evaluation/laya-training/live-job-tests/wtw-202605435/request.json"
DEFAULT_OUTPUT = ROOT / "evaluation/laya-training/contextual-v2-2026-10-12"
VERSION = "contextual-v2-2026-10-12"
SPLITS = ("train", "development", "calibration", "fresh-test")
FIELDS = ("relevance", "scope", "sponsorship", "timing", "cpt", "opt")


def load(path):
    return json.loads(Path(path).read_text())


def write(path, value):
    Path(path).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def runtime_questions():
    source = ROOT / "server/decision-questions.ts"
    command = [
        "node", "--import", "tsx", "--input-type=module", "-e",
        "import {decisionQuestions} from './server/decision-questions.ts';"
        "console.log(JSON.stringify(decisionQuestions));",
    ]
    questions = json.loads(subprocess.check_output(command, cwd=ROOT, text=True))
    return {
        "schemaVersion": 2,
        "contract": "laya-policy-v2",
        "corpusVersion": VERSION,
        "questionOrder": list(FIELDS),
        "runtimeSource": "server/decision-questions.ts",
        "runtimeSourceSha256": digest(source),
        "questions": questions,
    }


def verify_review_inputs():
    summary = load(REVIEW / "final-review-summary.json")
    if summary["status"] != "independent-ai-review-complete-not-approved" or summary["trainingAuthorized"] is not False:
        raise ValueError("final independent review status is not the expected blocked decision")
    expected = summary["sha256"]
    paths = {
        "frozenManifest": V1 / "manifest.json",
        "trainComparison": REVIEW / "train-comparison.json",
        "developmentCalibrationComparison": REVIEW / "development-calibration-comparison.json",
        "crossAdjudication": REVIEW / "cross-adjudication.json",
        "freshComparison": REVIEW / "fresh-test-comparison.json",
        "freshSupportAudit": REVIEW / "fresh-test-support-audit.json",
    }
    for key, path in paths.items():
        if digest(path) != expected[key]:
            raise ValueError(f"review input hash drift: {path}")


def restore_wtw(posting):
    request = load(WTW_REQUEST)
    restored = copy.deepcopy(posting)
    group_id = restored["contextGroups"][0]["id"]
    restored["blocks"] = [
        {**block, "contextGroup": group_id, "position": index}
        for index, block in enumerate(request["blocks"])
    ]
    restored["contextGroups"] = [{
        "id": group_id,
        "firstPosition": 0,
        "lastPosition": len(restored["blocks"]) - 1,
        "start": "boundary",
        "end": "boundary",
    }]
    restored["sourceRestoration"] = {
        "path": "evaluation/laya-training/live-job-tests/wtw-202605435/request.json",
        "sha256": digest(WTW_REQUEST),
        "status": "exact-blocks-restored-pending-target-review",
    }
    return restored


def update_record_evidence(record, posting):
    updated = copy.deepcopy(record)
    target = next(block for block in posting["blocks"] if block["id"] == record["target"]["id"])
    updated["target"] = copy.deepcopy(target)
    updated["context"] = derive_context_for_block(posting, target)
    updated["evidenceSha256"] = hashlib.sha256(target["text"].encode()).hexdigest()
    return updated


def apply_labels(record, labels, rationale, reviewer):
    updated = copy.deepcopy(record)
    updated["gold"] = copy.deepcopy(labels)
    updated["rationale"] = rationale
    updated["reviewState"] = "independent-ai-reviewed"
    updated["reviewer"] = reviewer
    updated["reviewedAt"] = "2026-10-12"
    return updated


def build_candidate(output_dir=DEFAULT_OUTPUT):
    verify_review_inputs()
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    source = {split: load(V1 / f"{split}.json")["recordsData"] for split in SPLITS}
    postings_source = load(V1 / "postings.json")["postings"]
    postings_by_id = {posting["id"]: copy.deepcopy(posting) for posting in postings_source}
    postings_by_id["post-dev-001"] = restore_wtw(postings_by_id["post-dev-001"])

    train_review = {row["id"]: row for row in load(REVIEW / "train-comparison.json")["records"]}
    devcal_review = {row["id"]: row for row in load(REVIEW / "development-calibration-comparison.json")["records"]}
    fresh_review = {row["id"]: row for row in load(REVIEW / "fresh-test-comparison.json")["records"]}
    adjudication = {row["id"]: row for row in load(REVIEW / "cross-adjudication.json")["records"]}

    active = {split: [] for split in SPLITS}
    holds = []

    for record in source["train"]:
        decision = adjudication.get(record["id"])
        if decision and decision["disposition"] == "exclude":
            holds.append({
                "id": record["id"], "split": "train", "postingId": record["postingId"],
                "status": "exclude", "reason": decision["rationale"],
                "requiredAction": "Restore and independently review the referenced antecedent before inclusion.",
            })
            continue
        if decision and decision["disposition"] == "change":
            record = apply_labels(record, decision["finalLabels"], decision["rationale"], "independent-ai-cross-adjudication")
        elif train_review[record["id"]]["outcome"] == "change":
            review = train_review[record["id"]]
            record = apply_labels(record, review["proposedGold"], review["rationale"], review["reviewer"])
        active["train"].append(record)

    for record in source["development"]:
        review = devcal_review[record["id"]]
        if review["status"] == "exclude":
            original = next(block for block in postings_by_id[record["postingId"]]["blocks"] if block["id"] == record["target"]["id"])
            holds.append({
                "id": record["id"], "split": "development", "postingId": record["postingId"],
                "target": original, "status": "pending-review-restored-source",
                "reason": review["rationale"],
                "requiredAction": "Label the restored target with its actual adjacent context; do not reuse the altered v1 label by ID.",
            })
            continue
        record = update_record_evidence(record, postings_by_id[record["postingId"]])
        active["development"].append(record)

    for record in source["calibration"]:
        decision = adjudication.get(record["id"])
        if decision and decision["disposition"] == "change":
            record = apply_labels(record, decision["finalLabels"], decision["rationale"], "independent-ai-cross-adjudication")
        elif devcal_review[record["id"]]["status"] == "change":
            review = devcal_review[record["id"]]
            record = apply_labels(record, review["proposedGold"], review["rationale"], review["reviewer"])
        active["calibration"].append(record)

    for record in source["fresh-test"]:
        review = fresh_review[record["id"]]
        if review["outcome"] in ("exclude", "needs-adjudication"):
            holds.append({
                "id": record["id"], "split": "fresh-test", "postingId": record["postingId"],
                "status": review["outcome"],
                "reason": review["exclusionReason"] or review["adjudication"] or review["reason"],
                "requiredAction": "Resolve the recorded source, context, scope, or split-independence issue before inclusion.",
            })
            continue
        if review["outcome"] == "change":
            record = apply_labels(record, review["proposedGold"], review["reason"], "independent-ai-fresh-review")
        active["fresh-test"].append(record)

    active_posting_ids = {record["postingId"] for rows in active.values() for record in rows}
    postings = [postings_by_id[posting["id"]] for posting in postings_source if posting["id"] in active_posting_ids]
    active_postings_by_id = {posting["id"]: posting for posting in postings}
    for split in SPLITS:
        active[split] = [update_record_evidence(record, active_postings_by_id[record["postingId"]]) for record in active[split]]

    postings_payload = {
        "schemaVersion": 2, "contract": "laya-policy-v2", "corpusVersion": VERSION,
        "totalPostings": len(postings), "postings": postings,
    }
    write(out / "postings.json", postings_payload)

    dataset_specs = {}
    for split in SPLITS:
        payload = {
            "schemaVersion": 1, "contract": "laya-policy-v2", "corpusVersion": VERSION,
            "split": split, "records": len(active[split]), "recordsData": active[split],
        }
        path = out / f"{split}.json"
        write(path, payload)
        dataset_specs[split] = {
            "path": path.name,
            "sha256": digest(path),
            "records": len(active[split]),
            "postings": len({record["postingId"] for record in active[split]}),
            "employers": len({normalize(record["employerGroup"]) for record in active[split]}),
            "labelCounts": {field: dict(Counter(record["gold"][field] for record in active[split])) for field in FIELDS},
        }

    questions_path = out / "questions.json"
    write(questions_path, runtime_questions())
    context_path = out / "context-definition.json"
    context_definition = load(V1 / "context-definition.json")
    context_definition.update({"schemaVersion": 2, "corpusVersion": VERSION})
    write(context_path, context_definition)

    holds_payload = {
        "schemaVersion": 1, "corpusVersion": VERSION, "status": "blocking",
        "counts": dict(Counter(f"{hold['split']}:{hold['status']}" for hold in holds)),
        "records": holds,
    }
    holds_path = out / "review-holds.json"
    write(holds_path, holds_payload)

    membership_entries = [{
        "postingId": posting["id"], "employer": posting["employer"],
        "employerGroup": normalize(posting["employerGroup"]),
        "policyFamily": normalize(posting["policyFamily"]), "split": posting["split"],
        "coverage": posting["coverage"], "blocksCount": len(posting["blocks"]),
    } for posting in postings]
    membership_path = out / "membership-ledger.json"
    write(membership_path, {
        "schemaVersion": 2, "contract": "laya-policy-v2", "corpusVersion": VERSION,
        "entries": membership_entries,
        "audit": {
            "activeRecordsDisjoint": True,
            "copiedPolicyHoldsApplied": ["ft-post-013", "ft-post-018"],
            "fullRelationshipAuditComplete": False,
            "trainingRunApproved": False,
        },
    })

    fresh_support = load(REVIEW / "fresh-test-support-audit.json")
    coverage_path = out / "coverage-report.json"
    write(coverage_path, {
        "schemaVersion": 2, "contract": "laya-policy-v2", "corpusVersion": VERSION,
        "status": "insufficient",
        "splits": dataset_specs,
        "freshConsequentialClassSupport": fresh_support["classSupport"],
        "noPolicy": fresh_support["noPolicy"],
        "blockers": fresh_support["blockers"],
        "note": "Counts describe reviewed candidate evidence only; they do not authorize training or evaluation.",
    })

    exposure_path = out / "exposure-ledger.json"
    write(exposure_path, {
        "schemaVersion": 2, "contract": "laya-policy-v2", "corpusVersion": VERSION,
        "status": "annotation-blind-review-complete-predictions-unopened",
        "unexposedToOptimizerTraining": True,
        "predictionsOpenedDuringFreshReview": False,
        "knownExposure": ["Aggregate fresh label counts were exposed before independent review; individual labels were not exposed before blind labels were saved."],
        "trainingRunApproved": False,
    })

    exclusions_path = out / "exclusions.json"
    write(exclusions_path, {
        "schemaVersion": 2, "corpusVersion": VERSION,
        "recordsHeld": len(holds), "path": "review-holds.json",
        "wholePostingHolds": ["ft-post-013", "ft-post-018", "ft-post-025"],
    })

    review_sources = [
        REVIEW / "train-comparison.json", REVIEW / "development-calibration-comparison.json",
        REVIEW / "cross-adjudication.json", REVIEW / "fresh-test-comparison.json",
        REVIEW / "fresh-test-support-audit.json", REVIEW / "final-review-summary.json",
    ]
    review_path = out / "independent-review.json"
    write(review_path, {
        "schemaVersion": 2, "corpusVersion": VERSION,
        "status": "independent-ai-review-applied-not-approved",
        "independentReviewPassed": False, "humanSignoff": False, "trainingAuthorized": False,
        "reviewedAt": "2026-10-12",
        "reviewArtifacts": {str(path.relative_to(ROOT)): digest(path) for path in review_sources},
        "activeDisposition": {split: len(active[split]) for split in SPLITS},
        "heldRecords": len(holds),
        "requiredNext": [
            "Review the 30 restored WTW targets.",
            "Resolve copied-policy and operational holds.",
            "Add and independently review sufficient coverage.",
            "Obtain human signoff if the project retains that gate.",
        ],
    })

    manifest_path = out / "manifest.json"
    artifacts = {
        "questions": questions_path, "contextDefinition": context_path,
        "postings": out / "postings.json", "membershipLedger": membership_path,
        "coverageReport": coverage_path, "exclusions": exclusions_path,
        "reviewHolds": holds_path, "exposureLedger": exposure_path,
        "review": review_path,
    }
    manifest = {
        "schemaVersion": 2, "corpusVersion": VERSION, "contract": "laya-policy-v2",
        "status": "candidate", "trainingRunApproved": False, "createdAt": "2026-10-12",
        "privacy": {"containsApplicantData": False}, "inputMode": "contextual-two-stage",
        "decisionContract": {"path": "DECISION_LOGIC.md", "sha256": digest(ROOT / "DECISION_LOGIC.md")},
        **{key: {"path": path.name, "sha256": digest(path)} for key, path in artifacts.items()},
        "datasets": dataset_specs,
        "source": {"corpusVersion": "contextual-v1-2026-10-10", "manifestSha256": digest(V1 / "manifest.json")},
    }
    write(manifest_path, manifest)
    validate_contextual(out, require_frozen=False)
    print(json.dumps({
        "built": str(out), "status": "candidate", "trainingApproved": False,
        "active": {split: len(active[split]) for split in SPLITS}, "held": len(holds),
    }))
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    build_candidate(args.output)
