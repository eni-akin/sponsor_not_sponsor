"""Pure calibration/report checks; never load pretrained weights or evaluate held-out gold."""
import importlib.util
from pathlib import Path
import unittest
import tempfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("calibration", ROOT / "scripts/calibrate_laya_domain.py")
calibration = importlib.util.module_from_spec(spec)
spec.loader.exec_module(calibration)
recovery_spec = importlib.util.spec_from_file_location("recovery", ROOT / "scripts/finalize_laya_posttraining.py")
recovery = importlib.util.module_from_spec(recovery_spec)
recovery_spec.loader.exec_module(recovery)


class CalibrationTests(unittest.TestCase):
    def test_recovery_allows_only_known_metadata_transformation(self):
        original = {"tokenizer_class": "TokenizersBackend", "backend": "tokenizers",
                    "is_local": True, "mask_token": "<mask>", "model_max_length": 8192}
        compatible = recovery.compatibility_config(original)
        self.assertEqual(compatible, {"tokenizer_class": "PreTrainedTokenizerFast",
                                    "mask_token": "<mask>", "model_max_length": 8192})
        self.assertIn("backend", original)
        with self.assertRaisesRegex(ValueError, "unexpected original"):
            recovery.compatibility_config(compatible)

    def test_refuses_different_frozen_inputs(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            (path / "train.json").write_text("authored-fixture")
            identity = {"datasetHashes": {"train.json": calibration.smoke.digest(path / "train.json")},
                        "questions": {}, "baseHashes": {}, "sourceHashes": {}}
            calibration.verify_run_inputs(path, {}, {}, identity)
            (path / "train.json").write_text("changed-fixture")
            with self.assertRaisesRegex(ValueError, "differ from completed training"):
                calibration.verify_run_inputs(path, {}, {}, identity)

    def test_temperature_uses_only_calibration(self):
        for split in ("test", "train"):
            with self.assertRaisesRegex(ValueError, "calibration predictions only"):
                calibration.fit_temperature([{"split": split, "logits": [2., 0.], "label": 0}])

    def test_shared_bounded_fit_reduces_nll(self):
        predictions = [{"split": "calibration", "logits": [5., 0.], "label": label}
                       for label in (0, 0, 0, 1)]
        fitted = calibration.fit_temperature(predictions)
        self.assertGreater(fitted["temperature"], 1)
        self.assertLessEqual(fitted["temperature"], 5)
        self.assertLess(fitted["calibrationNLL"], fitted["uncalibratedNLL"])
        self.assertEqual(fitted["algorithm"]["thresholdSelection"], "none; unchanged product constant")

    def test_equal_logits_tie_uses_identity_temperature(self):
        fitted = calibration.fit_temperature([{"split": "calibration", "logits": [0., 0., 0.], "label": 1}])
        self.assertEqual(fitted["temperature"], 1)

    def test_nonfinite_refused(self):
        with self.assertRaisesRegex(ValueError, "nonfinite"):
            calibration.fit_temperature([{"split": "calibration", "logits": [float("nan"), 0.], "label": 0}])

    def test_confusion_and_exact_agreement_are_counted(self):
        rows = [{"id": "authored-fixture", "field": field, "split": "test", "options": ["role", "unclear"],
                 "label": 0, "logits": [4., 0.]}
                for field in calibration.FIELDS]
        report, outputs = calibration.summarize(rows, 1)
        self.assertEqual(report["exactFiveFieldCorrect"], 1)
        self.assertEqual(report["decisions"], 5)
        self.assertEqual(report["perField"]["scope"]["classes"]["role"]["support"], 1)
        self.assertEqual(report["selectedProbabilityAtLeast08"]["count"], 5)
        self.assertTrue(report["offlinePassageConfidence"]["notProductionProjection"])
        self.assertEqual(outputs[0]["selectedProbabilityRounded"], 0.982)


if __name__ == "__main__":
    unittest.main()
