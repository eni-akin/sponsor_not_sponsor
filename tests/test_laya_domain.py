"""Small real-Torch optimizer continuity checks; no pretrained weights loaded."""
import copy
import importlib.util
import json
import random
from pathlib import Path
import tempfile
import unittest

import torch
from safetensors.torch import load_file

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("domain", ROOT / "scripts/train_laya_domain.py")
domain = importlib.util.module_from_spec(spec)
spec.loader.exec_module(domain)


class SavedConfig:
    def save_pretrained(self, path):
        path = Path(path)
        path.mkdir()
        (path / "config.json").write_text('{}\n')


class TinyModel(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.encoder = torch.nn.Embedding(12, 4)
        self.encoder.config = SavedConfig()
        self.scorer = torch.nn.Linear(4, 1)
        self.dropout = torch.nn.Dropout(0.25)

    def forward(self, ids, attention, positions, mask, qtype):
        hidden = self.dropout(self.encoder(ids))
        markers = hidden.gather(1, positions[..., None].expand(-1, -1, 4))
        return self.scorer(markers).squeeze(-1), hidden[:, 0]


class TinyAgent:
    def __init__(self, model):
        self.model = model
        self.tok = SavedConfig()
        self.cfg = {"temperature": [1, 1, 1], "temperature_by_options": {"choice:3-5": 2}}


def make_optimizer(model):
    return torch.optim.AdamW([
        {"params": model.encoder.parameters(), "lr": 2.5e-5},
        {"params": model.scorer.parameters(), "lr": 1e-4},
    ], weight_decay=0.01, foreach=False)


def seed():
    random.seed(42)
    torch.manual_seed(42)
    torch.set_num_threads(1)


class DomainTrainingTests(unittest.TestCase):
    def setUp(self):
        self.items = [{"id": str(index), "question": "sponsorship", "ids": [index + 1, 2, 3],
                       "markers": [0, 1, 2], "target": [1., 0., 0.], "label": 0}
                      for index in range(4)]
        self.config = {"epochs": 2, "accumulation": 2}

    def test_exact_interrupted_resume_including_epoch_shuffle(self):
        seed()
        uninterrupted = TinyModel()
        before = {key: value.clone() for key, value in uninterrupted.state_dict().items()}
        optimizer = make_optimizer(uninterrupted)
        progress = domain.initial_progress(len(self.items))
        for _ in range(3):
            domain.optimizer_update(uninterrupted, optimizer, self.items, progress, self.config, "cpu")
        expected_state = copy.deepcopy(optimizer.state_dict())
        expected_progress = copy.deepcopy(progress)
        expected_rng = domain.capture_rng("cpu")
        expected_draws = (random.random(), torch.rand(3))

        seed()
        interrupted = TinyModel()
        interrupted_optimizer = make_optimizer(interrupted)
        interrupted_progress = domain.initial_progress(len(self.items))
        domain.optimizer_update(interrupted, interrupted_optimizer, self.items,
                                interrupted_progress, self.config, "cpu")
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary)
            identity = {"config": self.config, "fixture": "authored-tiny-only"}
            checkpoint = domain.save_checkpoint(output, TinyAgent(interrupted), interrupted_optimizer,
                                                interrupted_progress, identity, "cpu")
            verified = domain.verify_checkpoint(checkpoint, output, identity)
            # Deliberately consume random state while constructing/reloading the model.
            restored = TinyModel()
            restored.load_state_dict(load_file(str(verified / "model.safetensors")))
            restored_optimizer = make_optimizer(restored)
            state = torch.load(verified / "training-state.pt", weights_only=False)
            restored_optimizer.load_state_dict(state["optimizer"])
            restored_progress = state["progress"]
            domain.restore_rng(state["rng"], "cpu")
            for _ in range(2):
                domain.optimizer_update(restored, restored_optimizer, self.items,
                                        restored_progress, self.config, "cpu")
            self.assertEqual(restored_progress, expected_progress)
            for name, value in uninterrupted.state_dict().items():
                self.assertTrue(torch.equal(value, restored.state_dict()[name]), name)
            for key, expected in expected_state["state"].items():
                actual = restored_optimizer.state_dict()["state"][key]
                for name, value in expected.items():
                    self.assertTrue(torch.equal(value, actual[name]), name)
            actual_rng = domain.capture_rng("cpu")
            self.assertEqual(actual_rng["python"], expected_rng["python"])
            self.assertTrue(torch.equal(actual_rng["torch"], expected_rng["torch"]))
            self.assertEqual(random.random(), expected_draws[0])
            self.assertTrue(torch.equal(torch.rand(3), expected_draws[1]))
            cfg = json.loads((checkpoint / "rl_agent_config.json").read_text())
            self.assertEqual(cfg["temperature"], [1., 1., 1.])
            self.assertNotIn("temperature_by_options", cfg)
        self.assertFalse(torch.equal(before["encoder.weight"], uninterrupted.encoder.weight))
        self.assertFalse(torch.equal(before["scorer.weight"], uninterrupted.scorer.weight))

    def test_checkpoint_rejects_tampering_and_outside_resume(self):
        seed()
        model = TinyModel()
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary)
            identity = {"config": self.config}
            checkpoint = domain.save_checkpoint(output, TinyAgent(model), make_optimizer(model),
                        domain.initial_progress(len(self.items)), identity, "cpu")
            with self.assertRaisesRegex(ValueError, "identity"):
                domain.verify_checkpoint(checkpoint, output, {"config": {"epochs": 9}})
            with self.assertRaisesRegex(ValueError, "local checkpoint"):
                domain.verify_checkpoint(checkpoint, output / "another-run", identity)
            (checkpoint / "training-state.pt").write_bytes(b"corrupt")
            with self.assertRaisesRegex(ValueError, "hash mismatch"):
                domain.verify_checkpoint(checkpoint, output, identity)

    def test_calibration_cannot_be_optimizer_input(self):
        with self.assertRaisesRegex(ValueError, "only training"):
            domain.rows_for_training([{"split": "calibration"}])

    def test_target_labels_are_not_model_context(self):
        record = {"id": "example", "split": "train", "text": "CPT accepted",
                  "inputContext": {"jobTitle": "Engineering Intern", "employer": "Example Employer", "neighbors": []},
                  "scope": "role", "sponsorship": "unclear", "timing": "unspecified",
                  "cpt": "explicitly-accepted", "opt": "unclear"}
        row = domain.rows_for_training([record])[0]
        self.assertEqual(set(json.loads(row["state"])), {"job_title", "employer", "previous", "TARGET", "next"})
        self.assertEqual(json.loads(row["state"])["employer"], "Example Employer")
        self.assertEqual(json.loads(row["state"])["job_title"], "Engineering Intern")
        self.assertNotIn("explicitly-accepted", row["state"])


if __name__ == "__main__":
    unittest.main()
