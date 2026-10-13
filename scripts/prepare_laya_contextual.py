#!/usr/bin/env python3
"""Export 6-task optimizer training items with canonical v2 state from reviewed contextual data."""
import argparse
import json
from pathlib import Path

from validate_laya_contextual import ACTIVE_DIR, ROOT, validate_contextual

EXPORT_FIELDS = ("relevance", "scope", "sponsorship", "timing", "cpt", "opt")


def canonical_model_state(job_title, employer, country, previous_status, previous, target, next_text, next_status):
    """Serialize canonical model state matching the v2 worker contract byte-for-byte.

    Keys in exact order:
    job_title, employer, country, previous_status, previous, TARGET, next, next_status
    """
    state = {
        "job_title": job_title,
        "employer": employer,
        "country": country,
        "previous_status": previous_status,
        "previous": previous,
        "TARGET": target,
        "next": next_text,
        "next_status": next_status,
    }
    return json.dumps(state, ensure_ascii=False, separators=(",", ":"))


def record_to_canonical_state(record):
    """Convert a reviewed dataset record into its canonical model state string."""
    ctx = record["context"]
    prev_text = ctx["previous"]["text"] if ctx["previous"] is not None else None
    next_text = ctx["next"]["text"] if ctx["next"] is not None else None
    return canonical_model_state(
        job_title=record["jobTitle"],
        employer=record["employer"],
        country=record["country"],
        previous_status=ctx["previousStatus"],
        previous=prev_text,
        target=record["target"]["text"],
        next_text=next_text,
        next_status=ctx["nextStatus"],
    )


def export_contextual_training_rows(records, allow_non_train=False):
    """Export 6-task optimizer items for quality-eligible training records."""
    exported = []
    absent_context = []

    for record in records:
        # Strict split ownership validation
        if record["split"] != "train":
            if not allow_non_train:
                raise ValueError(f"Split ownership violation: record {record['id']} from split '{record['split']}' rejected; strictly 'train' records permitted in optimizer exporter")
            continue

        ctx = record["context"]
        # Handle absent context rows explicitly
        if ctx["previousStatus"] == "missing" or ctx["nextStatus"] == "missing":
            absent_context.append({
                "id": record["id"],
                "reason": "missing-context",
                "previousStatus": ctx["previousStatus"],
                "nextStatus": ctx["nextStatus"],
            })
            continue

        state_str = record_to_canonical_state(record)
        labels = {field: record["gold"][field] for field in EXPORT_FIELDS}

        exported.append({
            "id": record["id"],
            "target_id": record["target"]["id"],
            "posting_id": record["postingId"],
            "state": state_str,
            "labels": labels,
        })

    return exported, absent_context


def prepare_contextual(dataset_dir=ACTIVE_DIR, require_frozen=True, output_path=None):
    dataset_dir = Path(dataset_dir)
    manifest = json.loads((dataset_dir / "manifest.json").read_text())
    # 1. Full validation pass
    datasets = validate_contextual(dataset_dir, require_frozen=require_frozen)

    # 2. Strict split ownership: only train split enters export
    train_records = datasets["train"]

    # Also verify that if calibration or development records are mistakenly passed, exporter rejects them
    exported, absent_context = export_contextual_training_rows(train_records)

    payload = {
        "contract": "laya-policy-v2",
        "corpusVersion": manifest["corpusVersion"],
        "tasks": list(EXPORT_FIELDS),
        "exportedCount": len(exported),
        "absentContextCount": len(absent_context),
        "absentContextRecords": absent_context,
        "items": exported,
    }

    if output_path:
        out_p = Path(output_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        out_p.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")

    return payload


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset-dir", type=Path, default=ACTIVE_DIR)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--allow-candidate", action="store_true")
    args = parser.parse_args()

    result = prepare_contextual(args.dataset_dir, require_frozen=not args.allow_candidate, output_path=args.output)
    print(json.dumps({
        "exported": result["exportedCount"],
        "absentContext": result["absentContextCount"],
        "tasks": result["tasks"],
    }))
