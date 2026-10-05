#!/usr/bin/env python3
"""Validate reviewed labels and export rows for Laya's upstream fine-tuning loop."""

import argparse
import hashlib
import json
import subprocess
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REGISTRY = ROOT / "evaluation/laya-training/seed-labels.json"
DEFAULT_OUTPUT = ROOT / "evaluation/laya-training/prepared-role-v0"

CHOICES = {
    "main_decision": {
        "explicit-blocker": "An explicit eligibility or sponsorship blocker applies to this role.",
        "sponsorship-stated": "The posting explicitly offers or conditionally considers sponsorship.",
        "no-blocker": "The reviewed posting contains no explicit blocker.",
        "could-not-verify": "The source was incomplete or inaccessible, so no decision is justified.",
    },
    "sponsorship": {
        "available": "The employer explicitly offers sponsorship for this role.",
        "unavailable": "The employer explicitly refuses sponsorship for this role.",
        "conditional": "Sponsorship depends on a stated condition.",
        "unclear": "The reviewed evidence does not establish a sponsorship policy.",
    },
}

QUESTIONS = {
    "main_decision": {
        "type": "choice",
        "instructions": "What conclusion is supported by the reviewed evidence for this job?",
        "criteria": CHOICES["main_decision"],
    },
    "sponsorship": {
        "type": "choice",
        "instructions": "What does the evidence establish about employer visa sponsorship for this job?",
        "criteria": CHOICES["sponsorship"],
    },
    "sponsorship_now": {
        "type": "choice",
        "instructions": "What does the evidence establish about sponsorship now?",
        "criteria": CHOICES["sponsorship"],
    },
    "sponsorship_future": {
        "type": "choice",
        "instructions": "What does the evidence establish about future sponsorship?",
        "criteria": CHOICES["sponsorship"],
    },
    **{
        f"restriction_{kind.replace('-', '_')}": {
            "type": "noul",
            "instructions": f"Does the evidence explicitly impose a {kind} restriction for this job?",
        }
        for kind in ("citizenship", "us-person", "clearance", "export-control")
    },
}


def sha256(data):
    if isinstance(data, Path):
        data = data.read_bytes()
    elif not isinstance(data, bytes):
        data = json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return hashlib.sha256(data).hexdigest()


def one_hot(options, label):
    if label not in options:
        raise ValueError(f"unsupported label {label!r}; expected one of {list(options)}")
    return {"probabilities": {option: float(option == label) for option in options},
            "target_source": "human-hard-label-one-hot"}


def load_verified(registry_path):
    registry = json.loads(registry_path.read_text())
    if registry.get("schemaVersion") != 1:
        raise ValueError("seed registry schemaVersion must be 1")
    if registry.get("privacy") != {"containsApplicantData": False}:
        raise ValueError("registry must explicitly declare that it contains no applicant data")

    def verified_file(spec, name):
        path = ROOT / spec["path"]
        if sha256(path) != spec["sha256"]:
            raise ValueError(f"{name} hash changed; re-review before updating the registry")
        return path

    source_path = verified_file(registry["source"], "label source")
    verified_file(registry["review"]["record"], "review record")
    if registry["review"].get("state") != "human-reviewed":
        raise ValueError("only human-reviewed labels may be exported")
    source = json.loads(source_path.read_text())
    cases = {case["id"]: case for case in source["cases"]}
    return registry, cases, source.get("split")


def prepare(registry_path=DEFAULT_REGISTRY, output_dir=DEFAULT_OUTPUT, overwrite=False):
    registry, cases, source_split = load_verified(Path(registry_path))
    rows = defaultdict(list)
    groups = {}
    leakage_keys = {key: {} for key in ("case id", "employer", "evidence digest")}
    seen = set()
    label_counts = defaultdict(Counter)

    for seed in registry["seeds"]:
        case_id, split = seed["id"], seed["split"]
        if split not in {"train", "calibration", "test"}:
            raise ValueError(f"{case_id}: invalid split {split!r}")
        if seed.get("provenance") == "exposed-development" and split != "train":
            raise ValueError(f"{case_id}: exposed development data may only be training data")
        if source_split == "development" and split != "train":
            raise ValueError(f"{case_id}: cases from a development source may only be training data")
        if case_id in seen:
            raise ValueError(f"duplicate case: {case_id}")
        seen.add(case_id)
        case = cases.get(case_id)
        if not case or sha256(case) != seed["sourceCaseSha256"]:
            raise ValueError(f"{case_id}: source case missing or changed; re-review it")
        group = seed["group"]
        if group in groups and groups[group] != split:
            raise ValueError(f"group leakage: {group!r} occurs in {groups[group]} and {split}")
        groups[group] = split
        evidence_digest = sha256([{"kind": item["kind"], "text": item["text"]} for item in case["evidence"]])
        for key, value in (("case id", case_id), ("employer", case["employer"].casefold().strip()),
                           ("evidence digest", evidence_digest)):
            other_split = leakage_keys[key].get(value)
            if other_split and other_split != split:
                raise ValueError(f"{key} leakage: {value!r} occurs in {other_split} and {split}")
            leakage_keys[key][value] = split

        expected = case["expected"]
        # Model input contains public posting text only. Reviewer rationale stays outside `state`.
        state = {
            "job_title": case["title"],
            "employer": case["employer"],
            "location": case["location"],
            "completeness_status": case["completeness"]["status"],
            "evidence": [{"kind": item["kind"], "text": item["text"]} for item in case["evidence"]],
        }
        gold = {
            "main_decision": one_hot(CHOICES["main_decision"], expected["mainDecision"]),
            "sponsorship": one_hot(CHOICES["sponsorship"], expected["sponsorship"]),
            "sponsorship_now": one_hot(CHOICES["sponsorship"], expected["now"]),
            "sponsorship_future": one_hot(CHOICES["sponsorship"], expected["future"]),
        }
        restrictions = set(expected["restrictionKinds"])
        for kind in ("citizenship", "us-person", "clearance", "export-control"):
            gold[f"restriction_{kind.replace('-', '_')}"] = one_hot(("false", "true"), str(kind in restrictions).lower())
        for question, target in gold.items():
            label_counts[question][max(target["probabilities"], key=target["probabilities"].get)] += 1

        rows[split].append({
            "id": case_id,
            "contract": "offline-role-policy-experiment-v0",
            "incompatible_with_current_worker": True,
            "state": json.dumps(state, ensure_ascii=False, separators=(",", ":")),
            "questions": json.dumps(QUESTIONS, ensure_ascii=False, separators=(",", ":")),
            "gold": json.dumps(gold, ensure_ascii=False, separators=(",", ":")),
            "target_kind": "human-hard-label-one-hot",
            "source_case_sha256": seed["sourceCaseSha256"],
            "group": group,
            "provenance": {
                "source_url": case["sourceUrl"],
                "capture_url": case["captureUrl"],
                "retrieved_at": case["retrievedAt"],
                "evidence": [{
                    "source": item["source"],
                    "locator": item["locator"],
                    "sha256": sha256(item["text"].encode()),
                } for item in case["evidence"]],
            },
        })

    output_dir = Path(output_dir)
    if output_dir.exists() and any(output_dir.iterdir()) and not overwrite:
        raise FileExistsError(f"output directory is not empty: {output_dir}; pass --overwrite to replace generated files")
    output_dir.mkdir(parents=True, exist_ok=True)
    outputs = {}
    for split in ("train", "calibration", "test"):
        path = output_dir / f"prototype-{split}.jsonl"
        content = "".join(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n" for row in rows[split])
        path.write_text(content)
        outputs[split] = {"path": path.name, "rows": len(rows[split]), "sha256": sha256(content.encode())}

    blockers = ["offline role-level question contract does not match the current TARGET-block worker"]
    if not rows["calibration"]:
        blockers.append("no independent calibration split")
    if not rows["test"]:
        blockers.append("no independent held-out test split")
    if len(label_counts["main_decision"]) < 2:
        blockers.append("main_decision has only one observed class")
    manifest = {
        "schemaVersion": 1,
        "trainingReady": False,
        "contract": "offline-role-policy-experiment-v0",
        "incompatibleWithCurrentWorker": True,
        "blockers": blockers,
        "targetKind": "human-hard-label-one-hot; not teacher confidence or calibrated probability",
        "privacy": registry["privacy"],
        "outputs": outputs,
        "decisions": sum(len(json.loads(row["gold"])) for split_rows in rows.values() for row in split_rows),
        "labelCounts": {key: dict(value) for key, value in label_counts.items()},
        "upstream": registry["upstream"],
    }
    (output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--registry", type=Path, default=DEFAULT_REGISTRY)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--worker-review", action="store_true", help="export unlabeled per-block review records for the current worker")
    args = parser.parse_args()
    if args.worker_review:
        manifest = prepare_worker_review(args.registry, args.output)
    else:
        manifest = prepare(args.registry, args.output, args.overwrite)
    print(json.dumps(manifest, indent=2))
    return 0


def prepare_worker_review(registry_path, output_dir):
    """Keep reviewed role labels separate from as-yet unreviewed block labels."""
    registry, cases, _ = load_verified(Path(registry_path))
    questions = json.loads(subprocess.check_output([
        "node", "--import", "tsx", "--input-type=module", "-e",
        "import {decisionQuestions} from './server/decision-questions.ts'; console.log(JSON.stringify(decisionQuestions));",
    ], cwd=ROOT, text=True))
    records = []
    for seed in registry["seeds"]:
        case = cases[seed["id"]]
        if sha256(case) != seed["sourceCaseSha256"]:
            raise ValueError(f"{seed['id']}: source case changed; re-review it")
        evidence = case["evidence"]
        for index, block in enumerate(evidence):
            records.append({
                "id": f"{case['id']}:block-{index}", "group": seed["group"], "split": "train",
                "provenance": "exposed-official-source-development-excerpt",
                "sourceCaseSha256": seed["sourceCaseSha256"], "sourceUrl": case["sourceUrl"],
                "locator": block["locator"], "evidenceSha256": sha256(block["text"].encode()),
                "state": json.dumps({"job_title": case["title"], "employer": case["employer"],
                    "previous": evidence[index - 1]["text"] if index else "", "TARGET": block["text"],
                    "next": evidence[index + 1]["text"] if index + 1 < len(evidence) else ""}, ensure_ascii=False),
                "labels": {key: None for key in questions}, "reviewState": "pending-per-block-review",
                "reviewer": None, "rationale": "",
            })
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=False)
    for name, value in [("questions.json", questions), ("review-records.json", records)]:
        (output_dir / name).write_text(json.dumps(value, indent=2) + "\n")
    manifest = {"schemaVersion": 1, "contract": "laya-policy-v1", "trainingReady": False,
                "records": len(records), "questionsSha256": sha256(output_dir / "questions.json"),
                "recordsSha256": sha256(output_dir / "review-records.json"),
                "blockers": ["per-block labels require review", "no calibration or test split",
                             "source excerpts are not full scanner captures"], "privacy": registry["privacy"]}
    (output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return manifest


if __name__ == "__main__":
    raise SystemExit(main())
