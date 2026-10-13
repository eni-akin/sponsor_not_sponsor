"""Pure benchmark tests; never loads models."""
import math
import unittest
from scripts.benchmark_v2_runtime import classify_result, stats


class BenchmarkTests(unittest.TestCase):
    def test_nearest_rank(self):
        self.assertIsNone(stats([]))
        self.assertEqual(stats(list(range(1, 31)))["p95_sec"], 29)

    def test_errors_and_mismatched_ids_are_not_fast_success(self):
        request = {"version": "laya-policy-v2", "blocks": [{"id": "a"}]}
        self.assertEqual(classify_result({"error": "failed"}, request), "worker-error")
        self.assertEqual(classify_result({"version": "laya-policy-v2", "blocks": []}, request), "malformed")

    def test_partial_and_skipped(self):
        request = {"version": "laya-policy-v2", "blocks": [{"id": "a"}]}
        result = {"version": "laya-policy-v2", "blocks": [{"id": "a", "interpretation": {"status": "skipped"}}], "processing": {"status": "partial"}}
        self.assertEqual(classify_result(result, request), "partial")
        result["processing"]["status"] = "complete"
        self.assertEqual(classify_result(result, request), "not-all-forward")

    def test_nan_probability(self):
        request = {"version": "laya-policy-v1", "blocks": [{"id": "a"}]}
        answers = {"scope": {"choice": "role", "probability": .9}, "sponsorship": {"choice": "unclear", "probability": .9}, "timing": {"choice": "unspecified", "probability": .9}, "cpt": {"choice": "unclear", "probability": .9}, "opt": {"choice": "unclear", "probability": .9}}
        result = {"version": "laya-policy-v1", "blocks": [{"id": "a", "answers": answers}]}
        self.assertEqual(classify_result(result, request), "complete")
        answers["scope"]["probability"] = math.nan
        self.assertEqual(classify_result(result, request), "malformed")
