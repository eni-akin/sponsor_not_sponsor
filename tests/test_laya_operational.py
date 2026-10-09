import copy
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from build_laya_operational import build
from validate_laya_operational import DEFAULT_DIR, SPLITS, digest, validate_operational, validate_rows

COLLECTION = ROOT / "evaluation/laya-training/training-test-prep-2026-10-09/reviewed-collection.json"


def fixture_rows():
    return {split: [{
        "id": split, "employer": split, "jobTitle": "Public vacancy", "employerGroup": split,
        "policyFamily": split, "text": f"Unique {split} wording.",
        "scope": "role", "sponsorship": "unclear", "timing": "unspecified", "cpt": "unclear", "opt": "unclear",
        "split": split, "reviewer": "test", "reviewedAt": "2026-10-09", "reviewState": "assistant-reviewed",
        "inputContext": {"employer": split, "jobTitle": "Public vacancy", "neighbors": []},
        "evidenceSha256": hashlib.sha256(f"Unique {split} wording.".encode()).hexdigest(),
    }] for split in SPLITS}


def set_text(row, text):
    row["text"] = text
    row["evidenceSha256"] = hashlib.sha256(text.encode()).hexdigest()


class OperationalDataTest(unittest.TestCase):
    def test_real_candidates_are_separated_and_have_role_conditionals(self):
        data = validate_operational(require_frozen=False)
        self.assertEqual({"train": 87, "calibration": 44, "test": 12}, {s: len(r) for s, r in data.items()})
        self.assertEqual(4, sum(r["scope"] == "role" and r["sponsorship"] == "conditional" for r in data["train"]))
        self.assertEqual(1, sum(r["sourceRecord"] == "39" and r["timing"] == "now" for r in data["calibration"]))
        self.assertFalse(any(r["employerGroup"] == "think academy" for r in data["train"]))
        self.assertTrue(any(r["id"] == "submission-2026-10-09-calibration-030" for r in data["calibration"]))

    def test_manifest_requires_independent_pinned_approval(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "data"
            build(COLLECTION, path)
            with self.assertRaisesRegex(ValueError, "not frozen"):
                validate_operational(path)
            manifest = json.loads((path / "manifest.json").read_text())
            approval = {"independentReviewPassed": True, "reviewer": "unit-test-only", "reviewedAt": "2026-10-09",
                        "datasetHashes": {s: manifest["datasets"][s]["sha256"] for s in SPLITS},
                        "decisionContractSha256": manifest["decisionContract"]["sha256"], "questionsSha256": manifest["questions"]["sha256"]}
            (path / "independent-review.json").write_text(json.dumps(approval))
            manifest.update(status="frozen", trainingRunApproved=True,
                            review={"independentReviewPassed": True, "path": "independent-review.json", "sha256": digest(path / "independent-review.json")})
            (path / "manifest.json").write_text(json.dumps(manifest))
            validate_operational(path)
            with self.assertRaisesRegex(ValueError, "cannot refresh"):
                build(COLLECTION, path, refresh_candidate=True)
            approval["datasetHashes"]["test"] = "incorrect"
            (path / "independent-review.json").write_text(json.dumps(approval))
            with self.assertRaisesRegex(ValueError, "review hash drift"):
                validate_operational(path)

    def test_drift_and_source_hash_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "data"
            build(COLLECTION, path)
            manifest = json.loads((path / "manifest.json").read_text())
            manifest["sources"][0]["sha256"] = "incorrect"
            (path / "manifest.json").write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, "source hash drift"):
                validate_operational(path, require_frozen=False)
            manifest["sources"][0]["sha256"] = digest(ROOT / manifest["sources"][0]["path"])
            (path / "manifest.json").write_text(json.dumps(manifest))
            (path / "train.json").write_text("changed")
            with self.assertRaisesRegex(ValueError, "dataset hash drift"):
                validate_operational(path, require_frozen=False)

    def test_bad_labels_identity_review_context_and_ids_are_rejected(self):
        mutations = {
            "invalid sponsorship": lambda r: r["train"][0].update(sponsorship="accepted"),
            "incorrect split": lambda r: r["train"][0].update(split="test"),
            "review not complete": lambda r: r["train"][0].update(reviewState="pending"),
            "non-role policy": lambda r: r["train"][0].update(scope="question", sponsorship="available"),
            "input context changed": lambda r: r["train"][0]["inputContext"].update(employer="label leak"),
            "evidence hash drift": lambda r: r["train"][0].update(text="changed"),
            "duplicate id": lambda r: r["test"][0].update(id="train"),
        }
        for error, mutate in mutations.items():
            with self.subTest(error=error):
                rows = fixture_rows()
                mutate(rows)
                with self.assertRaisesRegex(ValueError, error):
                    validate_rows(rows)

    def test_employer_policy_family_and_exact_passage_leakage_rejected(self):
        for kind, field in (("employer", "employerGroup"), ("policy family", "policyFamily"), ("exact evidence", "text")):
            rows = fixture_rows()
            if field == "text":
                set_text(rows["calibration"][0], rows["train"][0][field])
            else:
                rows["calibration"][0][field] = rows["train"][0][field]
            with self.assertRaisesRegex(ValueError, f"{kind} leakage"):
                validate_rows(rows)

    def test_long_copied_span_rejected_but_short_industry_phrase_allowed(self):
        rows = fixture_rows()
        common = " ".join(f"token{i}" for i in range(32))
        set_text(rows["train"][0], f"Employer one says {common} with appendix one")
        set_text(rows["test"][0], f"Employer two says {common} with appendix two")
        with self.assertRaisesRegex(ValueError, "copied template leakage"):
            validate_rows(rows)
        set_text(rows["test"][0], "Visa sponsorship is not available for this role.")
        set_text(rows["train"][0], "Visa sponsorship is not available for this position.")
        validate_rows(rows)

    def test_duplicate_evaluation_passages_rejected_training_vacancies_retained(self):
        rows = fixture_rows()
        repeated = copy.deepcopy(rows["test"][0])
        repeated["id"] = "second-test-id"
        rows["test"].append(repeated)
        with self.assertRaisesRegex(ValueError, "duplicate test evidence"):
            validate_rows(rows)
        rows = fixture_rows()
        repeated = copy.deepcopy(rows["train"][0])
        repeated["id"] = "second-training-vacancy"
        rows["train"].append(repeated)
        validate_rows(rows)


if __name__ == "__main__":
    unittest.main()
