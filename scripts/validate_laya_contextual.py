#!/usr/bin/env python3
"""Validate versioned contextual two-stage datasets before Laya weights are loaded."""
import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DIR = ROOT / "evaluation/laya-training/contextual-v1-2026-10-10"
ACTIVE_DIR = ROOT / "evaluation/laya-training/contextual-v2-2026-10-12"
SPLITS = ("train", "development", "calibration", "fresh-test")

LABELS = {
    "relevance": {"relevant", "irrelevant"},
    "scope": {"role", "question", "historical", "company", "other-role", "none"},
    "sponsorship": {"available", "unavailable", "conditional", "unclear"},
    "timing": {"unspecified", "now", "future", "now-and-future"},
    "cpt": {"explicitly-accepted", "explicitly-excluded", "unclear"},
    "opt": {"explicitly-accepted", "explicitly-excluded", "unclear"},
}

REQUIRED_RECORD_FIELDS = {
    "id", "postingId", "employer", "employerGroup", "policyFamily",
    "jobTitle", "country", "coverage", "split", "target", "context",
    "gold", "rationale", "tags", "reviewState", "reviewer", "reviewedAt",
    "evidenceSha256"
}
REQUIRED_TARGET_FIELDS = {"id", "kind", "text", "contextGroup", "position"}
REQUIRED_CONTEXT_FIELDS = {"previousStatus", "previous", "nextStatus", "next"}

REQUIRED_POSTING_FIELDS = {
    "id", "employer", "employerGroup", "policyFamily", "jobTitle",
    "country", "coverage", "split", "contextGroups", "blocks"
}
REQUIRED_GROUP_FIELDS = {"id", "firstPosition", "lastPosition", "start", "end"}
REQUIRED_BLOCK_FIELDS = {"id", "kind", "text", "contextGroup", "position"}

HISTORICAL_OPERATIONAL_DIR = ROOT / "evaluation/laya-training/operational-v2-2026-10-09"


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def normalize(value):
    if value is None:
        return ""
    return " ".join(re.findall(r"\w+", unicodedata.normalize("NFKC", str(value)).casefold()))


def derive_context_for_block(posting, target_block):
    """Derive exact previous and next context for a target block from posting metadata."""
    group_id = target_block["contextGroup"]
    group = next((g for g in posting["contextGroups"] if g["id"] == group_id), None)
    if not group:
        raise ValueError(f"target block {target_block['id']} references undeclared group {group_id}")

    pos = target_block["position"]

    # Previous context derivation
    if pos == group["firstPosition"]:
        prev_status = group["start"]
        prev_block = None
    else:
        prev_cand = next((b for b in posting["blocks"] if b["contextGroup"] == group_id and b["position"] == pos - 1), None)
        if prev_cand is not None:
            prev_status = "present"
            prev_block = prev_cand
        else:
            prev_status = "missing"
            prev_block = None

    # Next context derivation
    if pos == group["lastPosition"]:
        next_status = group["end"]
        next_block = None
    else:
        next_cand = next((b for b in posting["blocks"] if b["contextGroup"] == group_id and b["position"] == pos + 1), None)
        if next_cand is not None:
            next_status = "present"
            next_block = next_cand
        else:
            next_status = "missing"
            next_block = None

    return {
        "previousStatus": prev_status,
        "previous": prev_block,
        "nextStatus": next_status,
        "next": next_block,
    }


def validate_privacy(text, record_id):
    """Reject applicant PII, submitted form responses, or private applicant data."""
    patterns = [
        r"\b\d{3}-\d{2}-\d{4}\b",  # SSN
        r"\bmy name is\b",
        r"\bmy resume\b",
        r"\bhere is my\b",
        r"\bapplicant (?:ssn|phone|address|email):\b",
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",  # Personal email (contact helpdesks with support/info allowed)
    ]
    for pattern in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            # Allow generic corporate helpdesk emails (e.g. candidatehelpdesk@wtwco.com)
            if "@" in pattern and any(h in text.lower() for h in ["helpdesk@", "support@", "careers@", "recruiting@", "info@"]):
                continue
            raise ValueError(f"{record_id}: privacy violation: text matches private applicant pattern {pattern}")


def validate_postings(postings_data):
    """Validate structure, uniqueness, and context boundaries of postings."""
    if not isinstance(postings_data, dict) or "postings" not in postings_data:
        raise ValueError("postings.json must contain a 'postings' array")

    postings = postings_data["postings"]
    if not postings:
        raise ValueError("postings.json contains no postings")

    posting_ids = set()
    postings_by_id = {}

    for posting in postings:
        missing = REQUIRED_POSTING_FIELDS - posting.keys()
        if missing:
            raise ValueError(f"posting {posting.get('id')}: missing fields {sorted(missing)}")

        pid = posting["id"]
        if pid in posting_ids:
            raise ValueError(f"duplicate posting id: {pid}")
        posting_ids.add(pid)
        postings_by_id[pid] = posting

        if posting["split"] not in SPLITS:
            raise ValueError(f"posting {pid}: invalid split {posting['split']}")

        # Validate contextGroups
        groups = posting["contextGroups"]
        if not groups:
            raise ValueError(f"posting {pid}: contextGroups is empty")

        group_ids = set()
        for g in groups:
            g_missing = REQUIRED_GROUP_FIELDS - g.keys()
            if g_missing:
                raise ValueError(f"posting {pid} group {g.get('id')}: missing fields {sorted(g_missing)}")
            gid = g["id"]
            if gid in group_ids:
                raise ValueError(f"posting {pid}: duplicate group id {gid}")
            group_ids.add(gid)

            if not isinstance(g["firstPosition"], int) or not isinstance(g["lastPosition"], int):
                raise ValueError(f"posting {pid} group {gid}: positions must be integers")
            if g["firstPosition"] < 0 or g["firstPosition"] > g["lastPosition"]:
                raise ValueError(f"posting {pid} group {gid}: firstPosition {g['firstPosition']} > lastPosition {g['lastPosition']}")
            if g["start"] not in ("boundary", "missing") or g["end"] not in ("boundary", "missing"):
                raise ValueError(f"posting {pid} group {gid}: invalid start/end flags")

        # Validate blocks
        blocks = posting["blocks"]
        if not blocks:
            raise ValueError(f"posting {pid}: blocks is empty")

        block_ids = set()
        seen_positions = set()
        used_group_ids = set()

        for b in blocks:
            b_missing = REQUIRED_BLOCK_FIELDS - b.keys()
            if b_missing:
                raise ValueError(f"posting {pid} block {b.get('id')}: missing fields {sorted(b_missing)}")
            bid = b["id"]
            if bid in block_ids:
                raise ValueError(f"posting {pid}: duplicate block id {bid}")
            block_ids.add(bid)

            gid = b["contextGroup"]
            if gid not in group_ids:
                raise ValueError(f"posting {pid} block {bid}: contextGroup {gid} not declared in groups")
            used_group_ids.add(gid)

            pos = b["position"]
            if not isinstance(pos, int) or pos < 0:
                raise ValueError(f"posting {pid} block {bid}: position must be nonnegative integer")

            target_g = next(g for g in groups if g["id"] == gid)
            if pos < target_g["firstPosition"] or pos > target_g["lastPosition"]:
                raise ValueError(f"posting {pid} block {bid}: position {pos} outside group bounds [{target_g['firstPosition']}, {target_g['lastPosition']}]")

            pos_key = (gid, pos)
            if pos_key in seen_positions:
                raise ValueError(f"posting {pid}: duplicate position {pos} in group {gid}")
            seen_positions.add(pos_key)

            validate_privacy(b["text"], f"posting {pid} block {bid}")

        if used_group_ids != group_ids:
            unused = group_ids - used_group_ids
            raise ValueError(f"posting {pid}: declared unused context groups {sorted(unused)}")

    return postings_by_id


def validate_records(datasets, postings_by_id):
    """Validate contextual dataset records across all splits."""
    all_record_ids = set()
    ownership = {key: {} for key in ("employer", "policy family", "exact evidence", "copied template")}

    # Check against historical operational splits if present
    historical_cal_employers = set()
    historical_test_employers = set()
    if HISTORICAL_OPERATIONAL_DIR.exists():
        cal_path = HISTORICAL_OPERATIONAL_DIR / "calibration.json"
        test_path = HISTORICAL_OPERATIONAL_DIR / "test.json"
        if cal_path.exists():
            cal_data = json.loads(cal_path.read_text())
            historical_cal_employers = {normalize(r["employerGroup"]) for r in cal_data["recordsData"]}
        if test_path.exists():
            test_data = json.loads(test_path.read_text())
            historical_test_employers = {normalize(r["employerGroup"]) for r in test_data["recordsData"]}

    for split in SPLITS:
        rows = datasets[split]
        if not rows:
            raise ValueError(f"{split}: dataset is empty")

        for row in rows:
            missing = REQUIRED_RECORD_FIELDS - row.keys()
            if missing:
                raise ValueError(f"record {row.get('id')}: missing fields {sorted(missing)}")

            rid = row["id"]
            if rid in all_record_ids:
                raise ValueError(f"duplicate record id: {rid}")
            all_record_ids.add(rid)

            if row["split"] != split:
                raise ValueError(f"record {rid}: split mismatch ({row['split']} vs expected {split})")

            # Validate target structure
            target = row["target"]
            t_missing = REQUIRED_TARGET_FIELDS - target.keys()
            if t_missing:
                raise ValueError(f"record {rid} target: missing fields {sorted(t_missing)}")
            if target["kind"] not in ("text", "application-question"):
                raise ValueError(f"record {rid} target: invalid kind {target['kind']}")

            # Validate context structure
            ctx = row["context"]
            c_missing = REQUIRED_CONTEXT_FIELDS - ctx.keys()
            if c_missing:
                raise ValueError(f"record {rid} context: missing fields {sorted(c_missing)}")

            for side in ("previous", "next"):
                status = ctx[f"{side}Status"]
                neighbor = ctx[side]
                if status not in ("present", "boundary", "missing"):
                    raise ValueError(f"record {rid}: invalid {side}Status {status}")
                if status == "present":
                    if neighbor is None:
                        raise ValueError(f"record {rid}: {side}Status is 'present' but {side} block is null")
                    n_missing = REQUIRED_BLOCK_FIELDS - neighbor.keys()
                    if n_missing:
                        raise ValueError(f"record {rid} {side}: missing fields {sorted(n_missing)}")
                    if neighbor["contextGroup"] != target["contextGroup"]:
                        raise ValueError(f"record {rid}: {side} block has different contextGroup")
                    expected_pos = target["position"] - 1 if side == "previous" else target["position"] + 1
                    if neighbor["position"] != expected_pos:
                        raise ValueError(f"record {rid}: {side} block position {neighbor['position']} != expected {expected_pos}")
                else:
                    if neighbor is not None:
                        raise ValueError(f"record {rid}: {side}Status is '{status}' but {side} block is not null")

            # Cross-reference with posting
            pid = row["postingId"]
            if pid not in postings_by_id:
                raise ValueError(f"record {rid}: postingId {pid} not found in postings.json")

            posting = postings_by_id[pid]
            if posting["split"] != split:
                raise ValueError(f"record {rid}: split {split} does not match posting split {posting['split']}")
            if normalize(posting["employerGroup"]) != normalize(row["employerGroup"]):
                raise ValueError(f"record {rid}: employerGroup does not match posting")

            # Verify target block matches posting block exactly
            p_block = next((b for b in posting["blocks"] if b["id"] == target["id"]), None)
            if not p_block:
                raise ValueError(f"record {rid}: target block {target['id']} not in posting {pid}")
            if p_block["text"] != target["text"] or p_block["position"] != target["position"] or p_block["contextGroup"] != target["contextGroup"]:
                raise ValueError(f"record {rid}: target block does not match posting block {target['id']}")

            # Verify derived context continuity
            derived = derive_context_for_block(posting, target)
            for side in ("previous", "next"):
                if ctx[f"{side}Status"] != derived[f"{side}Status"]:
                    raise ValueError(f"record {rid}: {side}Status ({ctx[f'{side}Status']}) != derived ({derived[f'{side}Status']})")
                if ctx[side] is not None:
                    if derived[side] is None or ctx[side]["id"] != derived[side]["id"] or ctx[side]["text"] != derived[side]["text"]:
                        raise ValueError(f"record {rid}: {side} block does not match derived posting neighbor")
                elif derived[side] is not None:
                    raise ValueError(f"record {rid}: {side} block is null but derived posting neighbor is {derived[side]['id']}")

            # Validate labels
            gold = row["gold"]
            for field, choices in LABELS.items():
                if gold.get(field) not in choices:
                    raise ValueError(f"record {rid}: missing or invalid {field} label '{gold.get(field)}'")

            # Non-role invariant
            if gold["scope"] != "role":
                if gold["sponsorship"] != "unclear" or gold["timing"] != "unspecified" or gold["cpt"] != "unclear" or gold["opt"] != "unclear":
                    raise ValueError(f"record {rid}: non-role scope '{gold['scope']}' requires sponsorship=unclear, timing=unspecified, cpt=unclear, opt=unclear")

            # Application-question invariant
            if target["kind"] == "application-question" and gold["scope"] != "question":
                raise ValueError(f"record {rid}: application-question must have scope='question'")

            # Irrelevant invariant
            if gold["relevance"] == "irrelevant":
                if gold["sponsorship"] != "unclear" or gold["timing"] != "unspecified" or gold["cpt"] != "unclear" or gold["opt"] != "unclear":
                    raise ValueError(f"record {rid}: irrelevant gold requires sponsorship=unclear, timing=unspecified, cpt=unclear, opt=unclear")

            # Review state and hashes
            if row["reviewState"] not in ("assistant-reviewed", "independent-ai-reviewed"):
                raise ValueError(f"record {rid}: review not complete ({row['reviewState']})")
            if not row.get("reviewer") or not row.get("reviewedAt"):
                raise ValueError(f"record {rid}: missing reviewer identity or date")
            if hashlib.sha256(target["text"].encode()).hexdigest() != row["evidenceSha256"]:
                raise ValueError(f"record {rid}: evidence hash drift")

            # Privacy check
            validate_privacy(target["text"], rid)

            # Historical cross-check: zero leakage from historical calibration/test into new train
            emp_norm = normalize(row["employerGroup"])
            if split == "train":
                if emp_norm in historical_cal_employers:
                    raise ValueError(f"record {rid}: employer '{row['employerGroup']}' is in historical calibration; cannot enter train")
                if emp_norm in historical_test_employers:
                    raise ValueError(f"record {rid}: employer '{row['employerGroup']}' is in historical test; cannot enter train")
            elif split == "calibration":
                if emp_norm in historical_test_employers:
                    raise ValueError(f"record {rid}: employer '{row['employerGroup']}' is in historical test; cannot enter calibration")
            elif split == "fresh-test":
                if emp_norm in historical_cal_employers:
                    raise ValueError(f"record {rid}: employer '{row['employerGroup']}' is in historical calibration; cannot enter fresh-test")
                if emp_norm in historical_test_employers:
                    raise ValueError(f"record {rid}: employer '{row['employerGroup']}' is in historical test; cannot enter fresh-test")

            # Leakage check: employer, policy family, exact text, 32-word template spans
            tokens = normalize(target["text"]).split()
            spans = {" ".join(tokens[i:i + 32]) for i in range(len(tokens) - 31)}
            keys = [
                ("employer", emp_norm),
                ("policy family", normalize(row["policyFamily"])),
                ("exact evidence", normalize(target["text"])),
            ]
            keys.extend(("copied template", span) for span in spans)

            for kind, key in keys:
                if not key:
                    continue
                prior = ownership[kind].get(key)
                if prior and prior[0] != split:
                    raise ValueError(f"{kind} leakage: {prior[1]} ({prior[0]}) and {rid} ({split})")
                ownership[kind][key] = (split, rid)

    return datasets


def validate_contextual(dataset_dir=DEFAULT_DIR, require_frozen=True):
    directory = Path(dataset_dir)
    manifest_path = directory / "manifest.json"
    if not manifest_path.exists():
        raise ValueError(f"manifest.json not found in {directory}")

    manifest = json.loads(manifest_path.read_text())
    if manifest.get("schemaVersion") not in (1, 2) or manifest.get("contract") != "laya-policy-v2":
        raise ValueError("invalid contextual dataset manifest version or contract")
    corpus_version = manifest.get("corpusVersion")
    if not isinstance(corpus_version, str) or not re.fullmatch(r"contextual-v\d+-\d{4}-\d{2}-\d{2}", corpus_version):
        raise ValueError("invalid corpusVersion in manifest")
    if manifest.get("inputMode") != "contextual-two-stage" or manifest.get("privacy") != {"containsApplicantData": False}:
        raise ValueError("unsupported input mode or privacy declaration in manifest")

    if require_frozen:
        if manifest.get("status") != "frozen" or manifest.get("trainingRunApproved") is not True:
            raise ValueError("dataset is not frozen and approved")
        review = manifest.get("review", {})
        if not review.get("independentReviewPassed"):
            raise ValueError("independent review is not passed")
        review_path = directory / review["path"]
        if digest(review_path) != review["sha256"]:
            raise ValueError("independent review hash drift")
        approval = json.loads(review_path.read_text())
        if approval.get("independentReviewPassed") is not True:
            raise ValueError("independent review file does not approve inputs")
    elif manifest.get("status") == "candidate" and manifest.get("trainingRunApproved") is not False:
        raise ValueError("candidate dataset must explicitly deny training approval")

    # Validate decision contract, questions, context definition, postings, ledgers
    for spec_name in ("decisionContract", "questions", "contextDefinition", "postings", "membershipLedger", "coverageReport", "exclusions", "reviewHolds", "exposureLedger", "review"):
        if spec_name in manifest:
            spec = manifest[spec_name]
            p = (ROOT / spec["path"]) if (ROOT / spec["path"]).exists() else (directory / spec["path"])
            if digest(p) != spec["sha256"]:
                raise ValueError(f"{spec_name} hash drift: {spec['path']}")

    # Validate postings.json
    postings_spec = manifest["postings"]
    postings_file = directory / postings_spec["path"]
    postings_data = json.loads(postings_file.read_text())
    postings_by_id = validate_postings(postings_data)

    # Validate each split file
    datasets = {}
    manifest_splits = tuple(manifest["datasets"].keys()) if "datasets" in manifest else SPLITS
    for split in manifest_splits:
        spec = manifest["datasets"][split]
        if spec["path"] != f"{split}.json":
            raise ValueError(f"unexpected split filename {spec['path']}")
        split_path = directory / spec["path"]
        if digest(split_path) != spec["sha256"]:
            raise ValueError(f"{split} dataset hash drift")
        dataset = json.loads(split_path.read_text())
        if dataset.get("schemaVersion") != 1 or dataset.get("contract") != "laya-policy-v2" or dataset.get("split") != split:
            raise ValueError(f"{split}: invalid dataset header")
        if dataset.get("corpusVersion") != corpus_version:
            raise ValueError(f"{split}: corpusVersion mismatch")
        rows = dataset["recordsData"]
        if len(rows) != spec["records"] or len(rows) != dataset["records"]:
            raise ValueError(f"{split}: record count drift")
        datasets[split] = rows

    return validate_records(datasets, postings_by_id)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset-dir", type=Path, default=ACTIVE_DIR)
    parser.add_argument("--allow-candidate", action="store_true")
    args = parser.parse_args()
    rows = validate_contextual(args.dataset_dir, require_frozen=not args.allow_candidate)
    summary = {split: len(data) for split, data in rows.items()}
    print(json.dumps({"validated": summary, "frozenRequired": not args.allow_candidate}))
