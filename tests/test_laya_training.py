import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("prepare_laya_training", ROOT / "scripts/prepare_laya_training.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
FREEZE_SPEC = importlib.util.spec_from_file_location("freeze_laya_expansion", ROOT / "scripts/freeze_laya_expansion.py")
FREEZE_MODULE = importlib.util.module_from_spec(FREEZE_SPEC)
FREEZE_SPEC.loader.exec_module(FREEZE_MODULE)


class LayaTrainingPreparationTest(unittest.TestCase):
    def test_frozen_expansion_v1_is_training_only_and_hash_verified(self):
        manifest = FREEZE_MODULE.validate_freeze()
        corpus = json.loads(FREEZE_MODULE.CORPUS.read_text())
        self.assertEqual((39, 38), (manifest["content"]["records"], manifest["content"]["vacancies"]))
        self.assertTrue(manifest["trainingOnly"])
        self.assertFalse(manifest["trainingReady"])
        self.assertTrue(all(row["split"] == "train" for row in corpus["recordsData"]))
        self.assertEqual(2, len(manifest["blockers"]))

    def test_frozen_expansion_rejects_invalid_records(self):
        rows = json.loads(FREEZE_MODULE.CORPUS.read_text())["recordsData"]
        cases = {
            "duplicate id": lambda data: data[1].update(id=data[0]["id"]),
            "missing fields": lambda data: data[0].pop("scope"),
            "not owner-verified": lambda data: data[0].update(sourceStatus="unverified"),
            "evidence hash drift": lambda data: data[0].update(text=data[0]["text"] + " changed"),
        }
        for error, mutate in cases.items():
            with self.subTest(error=error):
                changed = copy.deepcopy(rows)
                mutate(changed)
                with self.assertRaisesRegex(ValueError, error):
                    FREEZE_MODULE.validate_records(changed)

    def test_expansion_candidates_are_reconciled_but_quarantined(self):
        path = ROOT / "evaluation/laya-training/expansion-candidates-2026-10-07.json"
        data = json.loads(path.read_text())
        rows = data["recordsData"]
        self.assertFalse(data["trainingReady"])
        self.assertEqual((39, 38), (len(rows), len({(row["employer"], row["vacancyId"]) for row in rows})))
        self.assertEqual(len(rows), len({row["id"] for row in rows}))
        self.assertTrue(all(row["split"] is None and row["captureStatus"].startswith("complete-owner-verified") for row in rows))
        self.assertNotIn("nexus-engineering-0eff47b7:block-0", {row["id"] for row in rows})
        self.assertTrue(all(row["sourceStatus"] == "owner-verified-official" for row in rows))
        self.assertEqual(["ea-software-engineer-intern:block-0"], [row["id"] for row in data["excluded"]])

    def test_worker_review_is_unlabeled_and_preserves_adjacent_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "review"
            manifest = MODULE.prepare_worker_review(MODULE.DEFAULT_REGISTRY, output)
            records = json.loads((output / "review-records.json").read_text())
            self.assertFalse(manifest["trainingReady"])
            self.assertEqual(13, len(records))
            self.assertTrue(all(all(v is None for v in row["labels"].values()) for row in records))
            self.assertTrue(all(row["split"] == "train" for row in records))
            first, second = (json.loads(row["state"]) for row in records[:2])
            self.assertEqual(first["TARGET"], second["previous"])
            self.assertEqual(second["TARGET"], first["next"])
            self.assertNotIn("rationale", first)
            self.assertEqual(MODULE.sha256(output / "review-records.json"), manifest["recordsSha256"])
            worksheet = (output / "review-worksheet.md").read_text()
            self.assertEqual(13, worksheet.count("### Passage "))
            self.assertEqual(4, worksheet.count("- Final decision:\n"))
            for label in ("Explicit blocker found", "Sponsorship stated", "No blocker found", "Could not verify"):
                self.assertIn(label, worksheet)
            for row in records:
                self.assertIn(json.loads(row["state"])["TARGET"], worksheet)
            self.assertEqual(MODULE.sha256(output / "review-worksheet.md"), manifest["worksheetSha256"])
            with self.assertRaises(FileExistsError):
                MODULE.prepare_worker_review(MODULE.DEFAULT_REGISTRY, output)

    def test_reviewed_seeds_export_but_are_not_training_ready(self):
        with tempfile.TemporaryDirectory() as directory:
            manifest = MODULE.prepare(output_dir=Path(directory))
            rows = [json.loads(line) for line in (Path(directory) / "prototype-train.jsonl").read_text().splitlines()]
            self.assertEqual(4, len(rows))
            self.assertEqual(32, manifest["decisions"])
            self.assertFalse(manifest["trainingReady"])
            self.assertEqual(set(), set((Path(directory) / "prototype-test.jsonl").read_text().splitlines()))
            self.assertTrue(manifest["incompatibleWithCurrentWorker"])
            state = json.loads(rows[0]["state"])
            self.assertNotIn("scope", state)
            self.assertNotIn("completeness", state)
            self.assertNotIn("source_url", state)
            gold = json.loads(rows[0]["gold"])
            self.assertEqual("human-hard-label-one-hot", gold["main_decision"]["target_source"])
            self.assertEqual(1.0, sum(gold["main_decision"]["probabilities"].values()))

    def test_exposed_development_cannot_become_test(self):
        registry = json.loads(MODULE.DEFAULT_REGISTRY.read_text())
        registry["seeds"][0]["split"] = "test"
        registry["seeds"][0]["provenance"] = "fresh"
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "registry.json"
            path.write_text(json.dumps(registry))
            with self.assertRaisesRegex(ValueError, "development source"):
                MODULE.prepare(path, Path(directory) / "out")

    def test_group_cannot_cross_splits(self):
        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            registry = json.loads(MODULE.DEFAULT_REGISTRY.read_text())
            source = json.loads((ROOT / registry["source"]["path"]).read_text())
            source["split"] = "fresh"
            source_path = directory / "source.json"
            source_path.write_text(json.dumps(source))
            registry["source"] = {"path": str(source_path), "sha256": MODULE.sha256(source_path)}
            registry["seeds"][1]["provenance"] = "fresh"
            registry["seeds"][1]["split"] = "test"
            registry["seeds"][1]["group"] = registry["seeds"][0]["group"]
            path = Path(directory) / "registry.json"
            path.write_text(json.dumps(registry))
            with self.assertRaisesRegex(ValueError, "group leakage"):
                MODULE.prepare(path, Path(directory) / "out")

    def test_output_requires_explicit_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "out"
            MODULE.prepare(output_dir=output)
            with self.assertRaisesRegex(FileExistsError, "--overwrite"):
                MODULE.prepare(output_dir=output)

    def test_employer_and_evidence_cannot_cross_splits(self):
        for leak_kind in ("employer", "evidence"):
            with self.subTest(leak_kind=leak_kind), tempfile.TemporaryDirectory() as directory:
                directory = Path(directory)
                registry = json.loads(MODULE.DEFAULT_REGISTRY.read_text())
                source = json.loads((ROOT / registry["source"]["path"]).read_text())
                source["split"] = "fresh"
                registry["seeds"][1]["provenance"] = "fresh"
                registry["seeds"][1]["split"] = "test"
                if leak_kind == "employer":
                    source["cases"][1]["employer"] = source["cases"][0]["employer"]
                else:
                    source["cases"][1]["evidence"] = source["cases"][0]["evidence"]
                source_path = directory / "source.json"
                source_path.write_text(json.dumps(source))
                registry["source"] = {"path": str(source_path), "sha256": MODULE.sha256(source_path)}
                registry["seeds"][1]["sourceCaseSha256"] = MODULE.sha256(source["cases"][1])
                registry_path = directory / "registry.json"
                registry_path.write_text(json.dumps(registry))
                with self.assertRaisesRegex(ValueError, f"{leak_kind}.*leakage"):
                    MODULE.prepare(registry_path, directory / "out")


if __name__ == "__main__":
    unittest.main()
