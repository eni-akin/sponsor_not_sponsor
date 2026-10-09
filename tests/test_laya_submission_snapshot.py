import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("snapshot", ROOT / "scripts/snapshot_laya_submissions.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class SubmissionSnapshotTest(unittest.TestCase):
    def test_owner_approved_dataset_hashes_and_tampering(self):
        approval = MODULE.validate_dataset_integrity()
        self.assertEqual(50, approval["dataset"]["records"])
        self.assertFalse(approval["sourceMetadataRequired"])
        changed = copy.deepcopy(approval)
        changed["dataset"]["sha256"] = "changed"
        original_load = MODULE.load
        with patch.object(MODULE, "load", side_effect=lambda path: changed if path == MODULE.INTEGRITY else original_load(path)):
            with self.assertRaisesRegex(ValueError, "dataset-level hash drift"):
                MODULE.validate_dataset_integrity()

    def test_checked_in_snapshot_remains_blocked_and_accounts_for_all_submissions(self):
        manifest = MODULE.validate_snapshot()
        self.assertEqual(50, sum(spec["records"] for spec in manifest["content"].values()))
        self.assertEqual(25, manifest["content"]["training"]["records"])
        self.assertFalse(manifest["trainingReady"])
        self.assertFalse(manifest["calibrationReady"])

    def setUp(self):
        self.source = MODULE.load(MODULE.SOURCE)
        self.old = MODULE.load(MODULE.V1)["recordsData"]
        rows = self.old + [row for dataset in self.source["datasets"].values() for row in dataset["recordsData"]]
        self.audit = {
            "sourceHashes": {"submissions": {"sha256": MODULE.sha256(MODULE.SOURCE)}, "frozen-v1": {"sha256": MODULE.sha256(MODULE.V1)}},
            "contractSha256": MODULE.sha256(MODULE.CONTRACT),
            "assignments": [{"id": row["id"], "policyFamilyId": "family-" + row["id"], "employer": row["employer"], "evidenceSha256": row["evidenceSha256"], "intendedSplit": row.get("intendedSplit", "train"), "quarantine": False, "reason": "unique"} for row in rows],
            "quarantineCalibrationIds": [],
        }

    def test_leaking_family_requires_quarantine_and_never_changes_intended_split(self):
        for row in self.audit["assignments"]:
            if row["id"] == "26":
                row["policyFamilyId"] = "family-1"
        with self.assertRaisesRegex(ValueError, "cross-split leakage"):
            MODULE.partition(self.source, self.old, self.audit)
        self.audit["quarantineCalibrationIds"] = ["26"]
        next(row for row in self.audit["assignments"] if row["id"] == "26").update(quarantine=True, reason="shares train policy family")
        groups = MODULE.partition(self.source, self.old, self.audit)
        self.assertEqual((25, 24, 1), tuple(len(groups[name]) for name in ("training", "calibration", "quarantine")))
        self.assertEqual("calibration", groups["quarantine"][0]["intendedSplit"])
        self.assertIsNone(groups["quarantine"][0]["split"])
        self.assertIsNone(self.source["datasets"]["calibration"]["recordsData"][0]["split"])

    def test_missing_duplicate_or_drifted_audit_rejected(self):
        changes = [lambda audit: audit["assignments"].pop(),
                   lambda audit: audit["assignments"].append(audit["assignments"][0]),
                   lambda audit: audit.update(contractSha256="bad"),
                   lambda audit: audit["sourceHashes"]["submissions"].update(sha256="bad")]
        for mutate in changes:
            with self.subTest(mutate=mutate):
                audit = copy.deepcopy(self.audit)
                mutate(audit)
                with self.assertRaises(ValueError):
                    MODULE.partition(self.source, self.old, audit)

    def test_snapshot_create_validate_reject_overwrite_and_tampering(self):
        with tempfile.TemporaryDirectory(dir=ROOT) as directory:
            directory = Path(directory)
            audit_path = directory / "audit.json"
            audit_path.write_text(json.dumps(self.audit))
            review_path = directory / "review.json"
            review_path.write_text(json.dumps({"reviewer": "orchestrator", "approvedFor": "blocked-candidate-snapshot", "auditSha256": "bad"}))
            output = directory / "snapshot"
            before = (MODULE.sha256(MODULE.SOURCE), MODULE.sha256(MODULE.V1))
            with patch.object(MODULE, "AUDIT", audit_path), patch.object(MODULE, "REVIEW", review_path):
                with self.assertRaisesRegex(ValueError, "orchestrator audit review"):
                    MODULE.create_snapshot(output)
                review_path.write_text(json.dumps({"reviewer": "orchestrator", "approvedFor": "blocked-candidate-snapshot", "auditSha256": MODULE.sha256(audit_path)}))
                manifest = MODULE.create_snapshot(output)
                self.assertFalse(manifest["weightsTrainingAllowed"])
                self.assertEqual(25, manifest["content"]["calibration"]["records"])
                with self.assertRaises(FileExistsError):
                    MODULE.create_snapshot(output)
                path = output / "calibration-candidates.json"
                original = path.read_text()
                doc = json.loads(original)
                doc["weightsTrainingAllowed"] = True
                path.write_text(json.dumps(doc))
                with self.assertRaisesRegex(ValueError, "content/hash drift"):
                    MODULE.validate_snapshot(output)
                path.write_text(original)
                doc = MODULE.load(output / "manifest.json")
                doc["trainingReady"] = True
                (output / "manifest.json").write_text(json.dumps(doc))
                with self.assertRaisesRegex(ValueError, "must stay unusable"):
                    MODULE.validate_snapshot(output)
            self.assertEqual(before, (MODULE.sha256(MODULE.SOURCE), MODULE.sha256(MODULE.V1)))


if __name__ == "__main__":
    unittest.main()
