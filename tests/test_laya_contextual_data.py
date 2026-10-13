"""Automated tests for contextual two-stage dataset validation and preparation."""
import copy
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from prepare_laya_contextual import (
    canonical_model_state,
    export_contextual_training_rows,
    prepare_contextual,
    record_to_canonical_state,
)
from validate_laya_contextual import (
    DEFAULT_DIR,
    SPLITS,
    derive_context_for_block,
    digest,
    validate_contextual,
    validate_postings,
    validate_records,
)

V2_DIR = ROOT / "evaluation/laya-training/contextual-v2-2026-10-12"


class TestLayaContextualData(unittest.TestCase):
    def test_real_contextual_dataset_passes_validation(self):
        datasets = validate_contextual(DEFAULT_DIR, require_frozen=True)
        self.assertEqual({"train": 167, "development": 81, "calibration": 54, "fresh-test": 141}, {s: len(r) for s, r in datasets.items()})

        # Check coverage report
        rep = json.loads((DEFAULT_DIR / "coverage-report.json").read_text())
        buckets = rep["trainBuckets"]
        self.assertGreaterEqual(buckets["ordinaryNegatives"], 40)
        self.assertGreaterEqual(buckets["contextSensitive"], 20)
        self.assertGreaterEqual(buckets["conditionalSponsorship"], 10)
        self.assertGreaterEqual(buckets["historicalOtherRole"], 10)
        self.assertGreaterEqual(buckets["applicantQuestions"], 5)
        self.assertGreaterEqual(buckets["companyScope"], 4)

        # Check all consequential classes present in train
        train_rows = datasets["train"]
        sponsorship_labels = {r["gold"]["sponsorship"] for r in train_rows}
        self.assertTrue({"available", "unavailable", "conditional", "unclear"}.issubset(sponsorship_labels))

        cpt_labels = {r["gold"]["cpt"] for r in train_rows}
        self.assertTrue({"explicitly-accepted", "explicitly-excluded", "unclear"}.issubset(cpt_labels))

        opt_labels = {r["gold"]["opt"] for r in train_rows}
        self.assertTrue({"explicitly-accepted", "explicitly-excluded", "unclear"}.issubset(opt_labels))

        timing_labels = {r["gold"]["timing"] for r in train_rows}
        self.assertTrue({"unspecified", "now", "future", "now-and-future"}.issubset(timing_labels))

    def test_prepare_exporter_outputs_six_tasks_and_canonical_state(self):
        result = prepare_contextual(DEFAULT_DIR, require_frozen=True)
        self.assertEqual(["relevance", "scope", "sponsorship", "timing", "cpt", "opt"], result["tasks"])
        self.assertEqual(167, result["exportedCount"])
        self.assertEqual(0, result["absentContextCount"])

        first = result["items"][0]
        self.assertIn("state", first)
        self.assertIn("labels", first)
        self.assertEqual(6, len(first["labels"]))

        parsed_state = json.loads(first["state"])
        expected_keys = [
            "job_title", "employer", "country", "previous_status",
            "previous", "TARGET", "next", "next_status"
        ]
        self.assertEqual(expected_keys, list(parsed_state.keys()))

    def test_contextual_v2_candidate_applies_review_without_claiming_approval(self):
        datasets = validate_contextual(V2_DIR, require_frozen=False)
        self.assertEqual(
            {"train": 165, "development": 51, "calibration": 54, "fresh-test": 121},
            {split: len(rows) for split, rows in datasets.items()},
        )
        with self.assertRaisesRegex(ValueError, "not frozen and approved"):
            validate_contextual(V2_DIR, require_frozen=True)

        by_id = {row["id"]: row for rows in datasets.values() for row in rows}
        self.assertNotIn("ctx-tra-061", by_id)
        self.assertNotIn("ctx-tra-076", by_id)
        self.assertEqual("unclear", by_id["ctx-tra-059"]["gold"]["sponsorship"])
        self.assertEqual("company", by_id["ctx-cal-030"]["gold"]["scope"])
        self.assertEqual("relevant", by_id["ft-rec-0132"]["gold"]["relevance"])

        prepared = prepare_contextual(V2_DIR, require_frozen=False)
        self.assertEqual("contextual-v2-2026-10-12", prepared["corpusVersion"])
        self.assertEqual(165, prepared["exportedCount"])

        with self.assertRaisesRegex(ValueError, "not frozen and approved"):
            prepare_contextual()

    def test_contextual_v2_restores_wtw_and_pins_runtime_questions(self):
        postings = json.loads((V2_DIR / "postings.json").read_text())["postings"]
        wtw = next(posting for posting in postings if posting["id"] == "post-dev-001")
        request = json.loads((ROOT / "evaluation/laya-training/live-job-tests/wtw-202605435/request.json").read_text())
        self.assertEqual(
            [(block["id"], block["kind"], block["text"]) for block in request["blocks"]],
            [(block["id"], block["kind"], block["text"]) for block in wtw["blocks"]],
        )

        questions = json.loads((V2_DIR / "questions.json").read_text())
        self.assertEqual(["relevance", "scope", "sponsorship", "timing", "cpt", "opt"], questions["questionOrder"])
        self.assertEqual(set(questions["questionOrder"]), set(questions["questions"]))
        self.assertTrue(all("instructions" in question and "criteria" in question for question in questions["questions"].values()))

    def test_canonical_state_matches_exact_format(self):
        state_str = canonical_model_state(
            job_title="Software Intern",
            employer="Example Co",
            country="United States",
            previous_status="present",
            previous="Qualifications",
            target="Visa sponsorship may be considered.",
            next_text=None,
            next_status="boundary",
        )
        expected = '{"job_title":"Software Intern","employer":"Example Co","country":"United States","previous_status":"present","previous":"Qualifications","TARGET":"Visa sponsorship may be considered.","next":null,"next_status":"boundary"}'
        self.assertEqual(expected, state_str)

    def test_split_ownership_strictly_enforced_in_exporter(self):
        datasets = validate_contextual(DEFAULT_DIR, require_frozen=True)
        # Passing calibration records to training exporter must raise ValueError
        with self.assertRaisesRegex(ValueError, "Split ownership violation"):
            export_contextual_training_rows(datasets["calibration"])

        # Passing development records to training exporter must raise ValueError
        with self.assertRaisesRegex(ValueError, "Split ownership violation"):
            export_contextual_training_rows(datasets["development"])

        # Passing fresh-test records to training exporter must raise ValueError
        with self.assertRaisesRegex(ValueError, "Split ownership violation"):
            export_contextual_training_rows(datasets["fresh-test"])

    def test_absent_context_handled_and_excluded_from_export(self):
        datasets = validate_contextual(DEFAULT_DIR, require_frozen=True)
        synthetic_record = copy.deepcopy(datasets["train"][0])
        synthetic_record["context"]["previousStatus"] = "missing"
        synthetic_record["context"]["previous"] = None

        exported, absent = export_contextual_training_rows([synthetic_record])
        self.assertEqual(0, len(exported))
        self.assertEqual(1, len(absent))
        self.assertEqual(synthetic_record["id"], absent[0]["id"])
        self.assertEqual("missing-context", absent[0]["reason"])

    def test_non_role_invariants_rejected(self):
        datasets = validate_contextual(DEFAULT_DIR, require_frozen=True)
        postings = json.loads((DEFAULT_DIR / "postings.json").read_text())
        postings_by_id = validate_postings(postings)

        mutations = [
            ("scope != role with sponsorship available", lambda r: r["train"][0]["gold"].update({"scope": "question", "sponsorship": "available"})),
            ("scope != role with timing now", lambda r: r["train"][0]["gold"].update({"scope": "company", "timing": "now"})),
            ("scope != role with cpt accepted", lambda r: r["train"][0]["gold"].update({"scope": "historical", "cpt": "explicitly-accepted"})),
            ("scope != role with opt excluded", lambda r: r["train"][0]["gold"].update({"scope": "other-role", "opt": "explicitly-excluded"})),
            ("application-question with scope role", lambda r: r["train"][0].update({"target": dict(r["train"][0]["target"], kind="application-question")})),
            ("irrelevant with sponsorship available", lambda r: r["train"][0]["gold"].update({"relevance": "irrelevant", "sponsorship": "available"})),
        ]

        for desc, mut in mutations:
            with self.subTest(desc=desc):
                d = copy.deepcopy(datasets)
                mut(d)
                with self.assertRaises(ValueError):
                    validate_records(d, postings_by_id)

    def test_cross_split_leakage_rejected(self):
        datasets = validate_contextual(DEFAULT_DIR, require_frozen=True)
        postings = json.loads((DEFAULT_DIR / "postings.json").read_text())
        postings_by_id = validate_postings(postings)

        # 1. EmployerGroup leakage
        d = copy.deepcopy(datasets)
        postings_copy = copy.deepcopy(postings_by_id)
        leaked_group = d["train"][0]["employerGroup"]
        d["calibration"][0]["employerGroup"] = leaked_group
        postings_copy[d["calibration"][0]["postingId"]]["employerGroup"] = leaked_group
        with self.assertRaisesRegex(ValueError, "employer leakage"):
            validate_records(d, postings_copy)

        # 2. PolicyFamily leakage
        d = copy.deepcopy(datasets)
        postings_copy = copy.deepcopy(postings_by_id)
        leaked_family = d["train"][0]["policyFamily"]
        d["calibration"][0]["policyFamily"] = leaked_family
        postings_copy[d["calibration"][0]["postingId"]]["policyFamily"] = leaked_family
        with self.assertRaisesRegex(ValueError, "policy family leakage"):
            validate_records(d, postings_copy)

        # 3. Exact text leakage
        d = copy.deepcopy(datasets)
        dup_text = d["train"][0]["target"]["text"]
        d["calibration"][0]["target"]["text"] = dup_text
        d["calibration"][0]["evidenceSha256"] = hashlib.sha256(dup_text.encode()).hexdigest()
        cal_pid = d["calibration"][0]["postingId"]
        cal_bid = d["calibration"][0]["target"]["id"]
        postings_copy = copy.deepcopy(postings_by_id)
        next(b for b in postings_copy[cal_pid]["blocks"] if b["id"] == cal_bid)["text"] = dup_text
        with self.assertRaisesRegex(ValueError, "exact evidence leakage"):
            validate_records(d, postings_copy)

    def test_context_continuity_and_boundary_derivation_rejected_on_drift(self):
        datasets = validate_contextual(DEFAULT_DIR, require_frozen=True)
        postings = json.loads((DEFAULT_DIR / "postings.json").read_text())
        postings_by_id = validate_postings(postings)

        d = copy.deepcopy(datasets)
        # Invalidate derived context status
        d["train"][0]["context"]["previousStatus"] = "present"
        d["train"][0]["context"]["previous"] = copy.deepcopy(d["train"][0]["target"])
        with self.assertRaises(ValueError):
            validate_records(d, postings_by_id)

    def test_privacy_violation_rejected(self):
        datasets = validate_contextual(DEFAULT_DIR, require_frozen=True)
        postings = json.loads((DEFAULT_DIR / "postings.json").read_text())
        postings_by_id = validate_postings(postings)

        d = copy.deepcopy(datasets)
        postings_copy = copy.deepcopy(postings_by_id)
        bad_text = "Applicant SSN: 123-45-6789 and name is John Doe"
        d["train"][0]["target"]["text"] = bad_text
        d["train"][0]["evidenceSha256"] = hashlib.sha256(bad_text.encode()).hexdigest()
        postings_copy[d["train"][0]["postingId"]]["blocks"][0]["text"] = bad_text
        with self.assertRaisesRegex(ValueError, "privacy violation"):
            validate_records(d, postings_copy)

    def test_hash_drift_and_review_state_rejected(self):
        datasets = validate_contextual(DEFAULT_DIR, require_frozen=True)
        postings = json.loads((DEFAULT_DIR / "postings.json").read_text())
        postings_by_id = validate_postings(postings)

        # 1. Evidence hash drift
        d = copy.deepcopy(datasets)
        d["train"][0]["evidenceSha256"] = "a" * 64
        with self.assertRaisesRegex(ValueError, "evidence hash drift"):
            validate_records(d, postings_by_id)

        # 2. Incomplete review state
        d = copy.deepcopy(datasets)
        d["train"][0]["reviewState"] = "pending"
        with self.assertRaisesRegex(ValueError, "review not complete"):
            validate_records(d, postings_by_id)


if __name__ == "__main__":
    unittest.main()
