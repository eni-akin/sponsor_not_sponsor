"""Unit tests for Laya V2 worker control flow, routing, and processing accounting."""
import io
import json
import os
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

from server.laya_worker import FakeAgent, main


class V2WorkerTests(unittest.TestCase):
    def setUp(self):
        os.environ["LAYA_FAKE_WORKER"] = "1"
        self.questions = {
            "relevance": {
                "instruction": "Does TARGET concern immigration sponsorship or eligibility?",
                "options": ["relevant", "irrelevant"],
            },
            "scope": {
                "instruction": "What is the policy scope?",
                "options": ["role", "question", "company", "other-role", "historical", "none"],
            },
            "sponsorship": {
                "instruction": "Is visa sponsorship available?",
                "options": ["available", "unavailable", "conditional", "unclear"],
            },
            "timing": {
                "instruction": "When is sponsorship applicable?",
                "options": ["now", "future", "now-and-future", "unspecified"],
            },
            "cpt": {
                "instruction": "Is CPT accepted?",
                "options": ["explicitly-accepted", "explicitly-excluded", "unclear"],
            },
            "opt": {
                "instruction": "Is OPT accepted?",
                "options": ["explicitly-accepted", "explicitly-excluded", "unclear"],
            },
        }

    def _execute_worker_request(self, req):
        input_lines = [json.dumps(req)]
        stdin = io.StringIO("\n".join(input_lines) + "\n")
        stdout = io.StringIO()

        with patch("sys.stdin", stdin):
            with redirect_stdout(stdout):
                main()

        out_lines = [line.strip() for line in stdout.getvalue().splitlines() if line.strip()]
        self.assertEqual(len(out_lines), 1)
        return json.loads(out_lines[0])

    def test_empty_request_returns_complete_empty_result(self):
        req = {
            "version": "laya-policy-v2",
            "title": "Software Intern",
            "employer": "Acme",
            "country": "US",
            "contextGroups": [],
            "blocks": [],
            "questions": self.questions,
            "parameters": {"routing": "all-forward"},
        }
        res = self._execute_worker_request(req)
        self.assertEqual(res["version"], "laya-policy-v2")
        self.assertEqual(res["processing"]["status"], "complete")
        self.assertEqual(res["processing"]["inputCount"], 0)
        self.assertEqual(res["processing"]["context"]["complete"], 0)
        self.assertEqual(res["processing"]["context"]["missing"], 0)
        self.assertEqual(len(res["blocks"]), 0)

    def test_missing_context_yields_partial_processing_and_unsupported_status(self):
        # Position gap: b0 at pos 0, b2 at pos 2 (pos 1 missing)
        req = {
            "version": "laya-policy-v2",
            "title": "Software Intern",
            "employer": "Acme",
            "country": "US",
            "contextGroups": [
                {"id": "g1", "firstPosition": 0, "lastPosition": 2, "start": "boundary", "end": "boundary"}
            ],
            "blocks": [
                {"id": "b0", "contextGroup": "g1", "position": 0, "text": "Visa sponsorship is not available."},
                {"id": "b2", "contextGroup": "g1", "position": 2, "text": "Must be authorized to work."},
            ],
            "questions": self.questions,
            "parameters": {"routing": "all-forward"},
        }
        res = self._execute_worker_request(req)
        self.assertEqual(res["processing"]["status"], "partial")
        self.assertEqual(res["processing"]["inputCount"], 2)
        # Both b0 and b2 are missing neighbor 1
        self.assertEqual(res["processing"]["context"]["missing"], 2)
        self.assertEqual(res["processing"]["screening"]["unsupported"], 2)
        for b in res["blocks"]:
            self.assertEqual(b["screening"]["status"], "unsupported")
            self.assertEqual(b["screening"]["reason"], "missing-context")
            self.assertEqual(b["route"], "uncertain")
            self.assertEqual(b["interpretation"]["status"], "unsupported")
            self.assertEqual(b["interpretation"]["reason"], "screening-unsupported")

    def test_all_forward_routing_executes_screening_and_interpretation(self):
        req = {
            "version": "laya-policy-v2",
            "title": "Software Intern",
            "employer": "Acme",
            "country": "US",
            "contextGroups": [
                {"id": "g1", "firstPosition": 0, "lastPosition": 0, "start": "boundary", "end": "boundary"}
            ],
            "blocks": [
                {"id": "b0", "contextGroup": "g1", "position": 0, "text": "Visa sponsorship is available for this position."},
            ],
            "questions": self.questions,
            "parameters": {"routing": "all-forward"},
        }
        res = self._execute_worker_request(req)
        self.assertEqual(res["processing"]["status"], "complete")
        self.assertEqual(res["processing"]["inputCount"], 1)
        self.assertEqual(res["processing"]["context"]["complete"], 1)
        self.assertEqual(res["processing"]["screening"]["success"], 1)
        self.assertEqual(res["processing"]["interpretation"]["interpreted"], 1)

        b0 = res["blocks"][0]
        self.assertEqual(b0["id"], "b0")
        self.assertEqual(b0["screening"]["status"], "success")
        self.assertEqual(b0["screening"]["choice"], "relevant")
        self.assertGreaterEqual(b0["screening"]["probability"], 0.8)
        self.assertEqual(b0["route"], "uncertain")  # all-forward routes to uncertain
        self.assertEqual(b0["interpretation"]["status"], "interpreted")
        answers = b0["interpretation"]["answers"]
        self.assertEqual(answers["scope"]["choice"], "role")
        self.assertEqual(answers["sponsorship"]["choice"], "available")

    def test_calibrated_routing_skips_confident_irrelevance(self):
        req = {
            "version": "laya-policy-v2",
            "title": "Software Intern",
            "employer": "Acme",
            "country": "US",
            "contextGroups": [
                {"id": "g1", "firstPosition": 0, "lastPosition": 0, "start": "boundary", "end": "boundary"}
            ],
            "blocks": [
                {"id": "b0", "contextGroup": "g1", "position": 0, "text": "Free coffee and competitive health benefits."},
            ],
            "questions": self.questions,
            "parameters": {
                "routing": "calibrated",
                "skip_threshold": 0.8,
            },
        }
        res = self._execute_worker_request(req)
        self.assertEqual(res["processing"]["status"], "complete")
        self.assertEqual(res["processing"]["inputCount"], 1)
        self.assertEqual(res["processing"]["screening"]["success"], 1)
        self.assertEqual(res["processing"]["interpretation"]["skipped"], 1)

        b0 = res["blocks"][0]
        self.assertEqual(b0["screening"]["choice"], "irrelevant")
        self.assertEqual(b0["route"], "skip")
        self.assertEqual(b0["interpretation"]["status"], "skipped")
        self.assertEqual(b0["interpretation"]["reason"], "screened-irrelevant")

    def test_configuration_digests_present(self):
        req = {
            "version": "laya-policy-v2",
            "title": "Software Intern",
            "employer": "Acme",
            "country": "US",
            "contextGroups": [],
            "blocks": [],
            "questions": self.questions,
            "parameters": {"routing": "all-forward"},
        }
        res = self._execute_worker_request(req)
        config = res["configuration"]
        self.assertEqual(len(config["questionsSha256"]), 64)
        self.assertEqual(len(config["contextSha256"]), 64)
        self.assertEqual(len(config["parametersSha256"]), 64)


if __name__ == "__main__":
    unittest.main()
