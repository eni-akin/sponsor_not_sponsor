"""Offline checks for training input compatibility; no weight updates or downloads."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("smoke", ROOT / "scripts/train_laya_smoke.py")
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


class SmokeContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ.update(HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1")
        from laya.agent import _load_tokenizer
        cls.tok = _load_tokenizer(str(smoke.BASE / "tokenizer"),
                                 json.loads((smoke.BASE / "rl_agent_config.json").read_text()))
        cls.qs = smoke.questions()

    def test_all_worker_questions_and_no_reviewer_text(self):
        rows = smoke.fixtures()
        self.assertEqual(set(self.qs), {"scope", "sponsorship", "timing", "cpt", "opt"})
        for row in rows:
            self.assertEqual(set(json.loads(row["state"])), {"job_title", "employer", "previous", "TARGET", "next"})
        items = smoke.encode_items(self.tok, self.qs, rows)
        self.assertEqual(len(items), 10)
        self.assertTrue(all(sum(item["target"]) == 1 for item in items))

    def test_refuses_truncated_evidence(self):
        row = smoke.fixtures()[0]
        row["state"] = "policy " * 9000
        with self.assertRaisesRegex(ValueError, "context-too-long"):
            smoke.encode_items(self.tok, self.qs, [row])

    def test_refuses_unknown_label(self):
        row = smoke.fixtures()[0]
        row["labels"]["scope"] = "invented"
        with self.assertRaises(ValueError):
            smoke.encode_items(self.tok, self.qs, [row])

    @unittest.skipUnless(os.environ.get("LAYA_SMOKE_CHECKPOINT"), "set checkpoint path for worker integration check")
    def test_checkpoint_loads_in_existing_worker(self):
        row = smoke.fixtures()[0]
        state = json.loads(row["state"])
        request = {"questions": self.qs, "request": {"title": state["job_title"],
            "employer": state["employer"], "blocks": [{"id": "smoke-target", "text": state["TARGET"]}]}}
        result = subprocess.run([str(ROOT / ".decision-venv/bin/python"), "server/laya_worker.py"],
            cwd=ROOT, input=json.dumps(request) + "\n", text=True, capture_output=True, check=True, timeout=120,
            env={**os.environ, "LAYA_MODEL": os.environ["LAYA_SMOKE_CHECKPOINT"], "LAYA_REVISION": "",
                 "LAYA_DEVICE": "cpu"})
        answer = json.loads(result.stdout)
        self.assertEqual(answer["version"], "laya-policy-v1")
        self.assertEqual(answer["blocks"][0]["id"], "smoke-target")
        for key, value in answer["blocks"][0]["answers"].items():
            self.assertIn(value["choice"], self.qs[key]["criteria"])
            self.assertTrue(0 <= value["probability"] <= 1)


if __name__ == "__main__":
    unittest.main()
