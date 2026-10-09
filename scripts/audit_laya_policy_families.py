#!/usr/bin/env python3
"""Reproduce the agent-reviewed 89-passage policy-family audit; never edit inputs."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "evaluation/laya-training"
SOURCES = {"frozen-v1": BASE / "frozen-expansion-v1/training-corpus-v1.json", "submissions": BASE / "normalized-submissions-2026-10-08.json"}
OUTPUT = BASE / "policy-family-audit-2026-10-08.json"

# Human grouping of material phrase templates, not a classifier of policy labels.
FAMILIES = {
    "application-now-future-sponsorship": {
        "ids": ["csc-generation-687984bb:block-0", "empire-state-realty-787bd17d:block-0", "brave-health-8d81587d:block-0", "recovery-village-c8c714a3fe:block-0", "royal-electric-225EB059F5:block-0", "cloudflare-8245197:block-1", "belvedere-trading-10746b3d:block-0", "29", "30", "31", "32", "33", "34", "35", "36", "37", "47", "48"],
        "rationale": "Repeated applicant question: will/do you require sponsorship now or in the future, followed optionally by employment-visa/work-authorization wording and visa examples. Changes in punctuation, tense, visa examples or employment wording do not make an independent template.",
        "anchors": ["Will you now, or in the future, require sponsorship for employment visa status", "Will you now or in the future require visa sponsorship?"],
    },
    "role-not-eligible-sponsorship": {
        "ids": ["3", "17", "46"],
        "rationale": "Roblox repeats verbatim Riot's first sentence, which Rational repeats with role in place of position. Extra refusal/conversion sentences do not remove the shared template.",
        "anchors": ["This position is not eligible for visa sponsorship."],
    },
    "sponsor-eligible-candidates": {
        "ids": ["8", "19", "23", "24", "25", "50"],
        "rationale": "Same sponsorship-for-eligible/qualified-candidates clause after removing employer name; H1B specialization and provide/sponsor inflection are minor variations. No condition unique to Notion differentiates its template.",
        "anchors": ["provides visa sponsorship for eligible candidates", "We sponsor visas for eligible candidates."],
    },
    "sponsorship-available-position": {
        "ids": ["singlestore-8154399:block-0", "26", "49"],
        "rationale": "Same complete affirmative sponsorship-is-available clause, with optional for-this-position/role tail. These very short passages offer no independent surrounding context; retain conservatively as one family.",
        "anchors": ["Sponsorship is available for this position", "Visa sponsorship is available for this role."],
    },
    "visa-sponsorship-not-available-position": {
        "ids": ["4", "5", "42"],
        "rationale": "Repeated Visa sponsorship is not available for this position/role clause. Internship qualifier and now/future tail are extensions of that same template.",
        "anchors": ["Visa sponsorship is not available for this position", "Visa sponsorship is not available for this role."],
    },
    "unable-sponsor-take-over-employment-visa": {
        "ids": ["compeer-financial-5421837008:block-0", "compeer-financial-5406940008:block-0", "39"],
        "rationale": "ALKU repeats the distinctive unable to sponsor or take over sponsorship of an employment visa clause from Compeer; at-this-time is a timing addition.",
        "anchors": ["unable to sponsor or take over sponsorship of an employment visa"],
    },
    "authorization-without-current-future-sponsorship": {
        "ids": ["falcomm-156AD9A12B:block-0", "qvest-us-2ae75be2:block-0", "veris-insights-b823324a:block-0", "3", "16", "28", "40"],
        "rationale": "Applicants must hold work authorization without sponsorship now/in the future. Repeated authorization/require-sponsorship condition and timing pair are the material template; OPT/CPT exclusions and appended refusal are additional clauses. This family overlaps Rational's not-eligible family, so both connect transitively.",
        "anchors": ["work authorization that does not now or in the future require sponsorship", "authorized to work in the U.S. without sponsorship now or in the future"],
    },
    "awetomaton-citizenship-refusal": {"ids": ["awetomaton-5394074008:block-0", "awetomaton-5394046008:block-0"], "rationale": "Identical same-employer passage.", "anchors": ["U.S. citizenship is required, as we are unable to provide visa sponsorship."]},
    "harrison-no-sponsorship-now-future": {"ids": ["harrison-street-4594ead7:block-0", "harrison-street-london-7d1a258e:block-0", "harrison-street-e82d538e:block-0"], "rationale": "Identical same-employer passage.", "anchors": ["The company is not able to provide employment visa sponsorship now or in the future for this position."]},
    "gcm-future-authorization": {"ids": ["gcm-grosvenor-7992997003:block-0", "gcm-grosvenor-7761842003:block-0"], "rationale": "Identical same-employer passage.", "anchors": ["Applicants requiring future sponsorship for continued work authorization"]},
    "compeer-cpt-pre-opt": {"ids": ["compeer-financial-5398243008:block-0", "compeer-financial-5421837008:block-0", "compeer-financial-5406940008:block-0"], "rationale": "Repeated distinctive CPT & Pre-Opt candidates invited to apply sentence; connects to Compeer refusal family.", "anchors": ["CPT & Pre-Opt candidates invited to apply."]},
    "citizenship-clearance": {"ids": ["gitai-5437128008:block-0", "varda-space-8010109003:block-0", "1"], "rationale": "Same citizenship-required-to-obtain-clearance template.", "anchors": ["citizenship is required", "clearance"]},
    "citizenship-required": {"ids": ["20", "21"], "rationale": "Identical standalone mandatory citizenship sentence after case normalization.", "anchors": ["U.S. citizenship is required."]},
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build():
    frozen = json.loads(SOURCES["frozen-v1"].read_text())["recordsData"]
    submitted = json.loads(SOURCES["submissions"].read_text())["datasets"]
    rows = [("train", row, "frozen-v1") for row in frozen]
    rows += [(dataset["intendedSplit"], row, "submissions") for dataset in submitted.values() for row in dataset["recordsData"]]
    by_id = {row["id"]: (split, row, source) for split, row, source in rows}
    assert len(by_id) == len(rows) == 89
    assert all(set(family["ids"]) <= by_id.keys() for family in FAMILIES.values())
    # Connected components ensure a passage with two shared clauses joins both families.
    groups = {key: {key} for key in by_id}
    for family in FAMILIES.values():
        combined = set().union(*(groups[key] for key in family["ids"]))
        for key in combined:
            groups[key] = combined
    employers = {}
    for _, row, _ in rows:
        employers.setdefault(row["employer"].casefold(), []).append(row["id"])
    for ids in employers.values():
        combined = set().union(*(groups[key] for key in ids))
        for key in combined:
            groups[key] = combined
    assignments = []
    for split, row, source in rows:
        members = sorted(groups[row["id"]])
        names = sorted(name for name, family in FAMILIES.items() if set(family["ids"]) & set(members))
        family_id = "family:" + "+".join(names) if names else "singleton:" + row["id"]
        overlap = len({by_id[key][0] for key in members}) > 1
        quarantine = split == "calibration" and overlap
        reason = "Quarantine calibration: material policy-family overlap with training." if quarantine else "Training member of a cross-split family; quarantine its calibration relatives." if overlap else "No cross-split material template found in supplied passages."
        assignments.append({"id": row["id"], "source": source, "employer": row["employer"], "intendedSplit": split, "evidenceSha256": row["evidenceSha256"], "policyFamilyId": family_id, "familyMembers": members, "crossSplitFamilyOverlap": overlap, "quarantine": quarantine, "reason": reason})
    quarantined = [row["id"] for row in assignments if row["quarantine"]]
    return {"schemaVersion": 1, "reviewedAt": "2026-10-08", "status": "agent-reviewed-material-template-overlap-found", "reviewer": "policy-audit-agent", "scope": "All 39 frozen v1 and 50 normalized submission passages; captured excerpts only.", "sourceHashes": {name: {"path": str(path.relative_to(ROOT)), "sha256": digest(path)} for name, path in SOURCES.items()}, "contractSha256": digest(ROOT / "DECISION_LOGIC.md"), "recordsAssessed": 89, "families": FAMILIES, "assignments": assignments, "quarantineCalibrationIds": quarantined, "remainingCalibrationIds": [row["id"] for row in assignments if row["intendedSplit"] == "calibration" and not row["quarantine"]], "recommendation": "Freeze all 25 new training records with component family IDs. Preserve owner intended calibration membership but quarantine overlapping records; freeze remaining calibration only after orchestrator review. Never relocate quarantined calibration into training automatically. Collect replacement independent calibration examples and fresh employer/family-disjoint held-out examples before tuning.", "limitations": ["Cannot establish template reuse outside supplied captured excerpts; ellipsized passages could hide additional overlap.", "Short available/unavailable clauses grouped conservatively because their entire excerpt repeats the same template.", "Generic shared vocabulary or identical labels alone do not establish a family: broad refusal versus direct CPT/OPT exclusion, citizenship versus clearance, applicant answers versus sponsorship questions remain distinct when template differs."]}


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    result = build()
    if args.write:
        if OUTPUT.exists():
            raise FileExistsError(OUTPUT)
        OUTPUT.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    else:
        assert json.loads(OUTPUT.read_text()) == result, "audit drift"
    print(f"Validated {result['recordsAssessed']} assignments; quarantine {len(result['quarantineCalibrationIds'])} calibration records: {', '.join(result['quarantineCalibrationIds'])}")
