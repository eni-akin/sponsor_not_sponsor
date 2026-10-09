#!/usr/bin/env python3
"""Calibration-only temperature fitting and one locked passage-test comparison."""
import argparse
import gc
import json
import math
import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
import train_laya_smoke as smoke
from train_laya_domain import atomic_json
from validate_laya_operational import validate_operational

FIELDS = ("scope", "sponsorship", "timing", "cpt", "opt")
ALGORITHM = {"method": "shared-choice-temperature-grid-NLL", "minimum": 0.5,
             "maximum": 5.0, "step": 0.01, "decisionWeighting": "equal",
             "tieBreak": "closest-to-1-then-smaller", "threshold": 0.8,
             "thresholdSelection": "none; unchanged product constant"}


def verify_run_inputs(dataset_dir, questions, base_hashes, run_identity):
    actual = {path.name: smoke.digest(path) for path in sorted(dataset_dir.iterdir()) if path.is_file()}
    if (actual != run_identity["datasetHashes"] or questions != run_identity["questions"]
            or base_hashes != run_identity["baseHashes"]):
        raise ValueError("evaluation dataset/questions/base differ from completed training run")
    if any(smoke.digest(smoke.ROOT / path) != expected
           for path, expected in run_identity["sourceHashes"].items()):
        raise ValueError("completed training run source/contract changed")


def nll(logits, label, temperature):
    values = [value / temperature for value in logits]
    maximum = max(values)
    return maximum + math.log(sum(math.exp(value - maximum) for value in values)) - values[label]


def fit_temperature(predictions):
    if not predictions or any(row.get("split") != "calibration" for row in predictions):
        raise ValueError("temperature fitting accepts calibration predictions only")
    if any(not all(math.isfinite(value) for value in row["logits"]) for row in predictions):
        raise ValueError("nonfinite calibration logits")
    candidates = []
    for integer in range(50, 501):
        temperature = integer / 100
        loss = sum(nll(row["logits"], row["label"], temperature) for row in predictions) / len(predictions)
        candidates.append((loss, abs(temperature - 1), temperature))
    minimum = min(value[0] for value in candidates)
    selected = min((value for value in candidates if value[0] <= minimum + 1e-12), key=lambda value: value[1:])
    return {"temperature": selected[2], "calibrationNLL": selected[0],
            "uncalibratedNLL": sum(nll(row["logits"], row["label"], 1) for row in predictions) / len(predictions),
            "boundaryOptimum": selected[2] in (0.5, 5.0), "decisions": len(predictions), "algorithm": ALGORITHM}


def rows_for_inference(records):
    return [{"id": row["id"], "state": json.dumps({"job_title": row["inputContext"]["jobTitle"],
             "employer": row["inputContext"]["employer"], "previous": "", "TARGET": row["text"], "next": ""},
             ensure_ascii=False), "labels": {field: row[field] for field in FIELDS}} for row in records]


def predict(model, tokenizer, questions, records, split, device):
    import torch
    items = smoke.encode_items(tokenizer, questions, rows_for_inference(records))
    model.eval()
    result = []
    with torch.no_grad():
        for item in items:
            ids, attention, positions, mask, target, qtype = smoke.batch(item, device)
            logits, _ = model(ids, attention, positions, mask, qtype)
            if not torch.isfinite(logits).all():
                raise ValueError("nonfinite inference logits")
            result.append({"id": item["id"], "field": item["question"], "split": split,
                           "options": list(questions[item["question"]]["criteria"]),
                           "label": item["label"], "logits": logits[0].float().cpu().tolist()})
    print(f"Inferred {len(result)} {split} decisions", flush=True)
    return result


def summarize(predictions, temperature):
    import numpy as np
    per_field, record_correct, by_record = {}, {}, {}
    total_nll, total_brier, confident = 0.0, 0.0, 0
    outputs = []
    for row in predictions:
        # Match the installed decoder's float32 softmax and four-decimal confidence.
        values = np.asarray(row["logits"], dtype=np.float32) / temperature
        probabilities = np.exp(values - values.max())
        probabilities /= probabilities.sum()
        selected = int(probabilities.argmax())
        confidence = round(float(probabilities[selected]), 4)
        correct = selected == row["label"]
        gold, choice, field = row["options"][row["label"]], row["options"][selected], row["field"]
        entry = per_field.setdefault(field, {"count": 0, "correct": 0, "confusion": {
                  label: {predicted: 0 for predicted in row["options"]} for label in row["options"]}})
        entry["count"] += 1
        entry["correct"] += int(correct)
        entry["confusion"][gold][choice] += 1
        record_correct.setdefault(row["id"], []).append(correct)
        total_nll += nll(row["logits"], row["label"], temperature)
        total_brier += sum((float(probability) - float(index == row["label"])) ** 2
                           for index, probability in enumerate(probabilities))
        confident += confidence >= 0.8
        output = dict(row, choice=choice, gold=gold, probabilities=probabilities.tolist(),
                      selectedProbabilityRounded=confidence, correct=correct)
        outputs.append(output)
        by_record.setdefault(row["id"], {})[field] = output
    for field, entry in per_field.items():
        entry["classes"] = {}
        for label, counts in entry["confusion"].items():
            support, true_positive = sum(counts.values()), counts[label]
            predicted = sum(values[label] for values in entry["confusion"].values())
            entry["classes"][label] = {"support": support, "predicted": predicted, "truePositive": true_positive,
                "precision": true_positive / predicted if predicted else None,
                "recall": true_positive / support if support else None}
    if any(len(correct) != 5 for correct in record_correct.values()):
        raise ValueError("missing five-field prediction")
    definitive = sum(row["scope"]["choice"] == "role" and row["scope"]["selectedProbabilityRounded"] >= 0.8
                     and row["sponsorship"]["choice"] != "unclear"
                     and row["sponsorship"]["selectedProbabilityRounded"] >= 0.8 for row in by_record.values())
    count = len(predictions)
    return {"perField": per_field, "records": len(record_correct), "decisions": count,
            "exactFiveFieldCorrect": sum(all(correct) for correct in record_correct.values()),
            "NLL": total_nll / count, "Brier": total_brier / count,
            "selectedProbabilityAtLeast08": {"count": confident, "total": count, "coverage": confident / count},
            "offlinePassageConfidence": {"scopeRoleAndKnownSponsorshipAtLeast08": definitive,
                "records": len(record_correct), "notProductionProjection": True}}, outputs


def create_calibrated_checkpoint(source, destination, temperature):
    destination.mkdir()
    for name in ("model.safetensors", "encoder", "tokenizer"):
        (destination / name).symlink_to(source / name, target_is_directory=name != "model.safetensors")
    cfg = json.loads((source / "rl_agent_config.json").read_text())
    cfg["temperature"] = [temperature, 1.0, 1.0]
    for key in ("temperature_by_options", "lang_temperatures", "binning_map"):
        cfg.pop(key, None)
    cfg["sns_training"] = dict(cfg.get("sns_training", {}), calibrated=True,
                               calibrationMethod=ALGORITHM, temperature=temperature)
    cfg["model_name"] = "sns-domain-calibrated-unpromoted"
    atomic_json(destination / "rl_agent_config.json", cfg)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset-dir", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--device", choices=("mps", "cpu", "cuda"), default="mps")
    args = parser.parse_args()
    os.environ.update(HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1", HF_HUB_DISABLE_TELEMETRY="1", USE_TF="0")
    splits = validate_operational(args.dataset_dir, require_frozen=True)
    source, output = args.checkpoint.resolve(), args.output.resolve()
    metadata = json.loads((source / "checkpoint.json").read_text())
    if metadata.get("status") != "committed":
        raise ValueError("training checkpoint is not committed")
    for name, expected in metadata["hashes"].items():
        path = (source / name).resolve()
        if not path.is_relative_to(source) or smoke.digest(path) != expected:
            raise ValueError("training checkpoint artifact hash changed")
    run = json.loads((source.parent.parent / "run.json").read_text())
    if (run.get("status") != "completed" or (source.parent.parent / run["checkpoint"]).resolve() != source
            or metadata["identity"] != run["identity"] or metadata["updates"] != run["updates"]
            or run["updates"] != run["totalUpdates"]
            or run["epochsCompleted"] != run["identity"]["config"]["epochs"]):
        raise ValueError("only the preselected completed final checkpoint may be calibrated")
    questions = smoke.questions()
    manifest = json.loads((args.dataset_dir / "manifest.json").read_text())
    expected_questions = json.loads((smoke.ROOT / manifest["questions"]["path"]).read_text())
    if questions != expected_questions or any(question["type"] != "choice" for question in questions.values()):
        raise ValueError("questions changed or are not all choice type")
    base_cfg = json.loads((smoke.BASE / "rl_agent_config.json").read_text())
    if base_cfg.get("temperature") != [1, 1, 1] or base_cfg.get("temperature_by_options"):
        raise ValueError("base calibration is not identity; comparison requires explicitly handling its overrides")
    base_hashes = {str(path.relative_to(smoke.BASE)): smoke.digest(path)
                   for path in sorted(smoke.BASE.rglob("*")) if path.is_file()}
    verify_run_inputs(args.dataset_dir, questions, base_hashes, run["identity"])
    import torch
    import laya
    if args.device == "mps" and not torch.backends.mps.is_available():
        raise RuntimeError("MPS unavailable; refusing fallback")
    torch.set_num_threads(4)
    output.mkdir(parents=True, exist_ok=False)
    identity = {"datasetManifestSha256": smoke.digest(args.dataset_dir / "manifest.json"),
        "datasetHashes": {key: value["sha256"] for key, value in manifest["datasets"].items()},
        "checkpointMetadataSha256": smoke.digest(source / "checkpoint.json"),
        "modelSha256": smoke.digest(source / "model.safetensors"),
        "questionSha256": manifest["questions"]["sha256"], "contractSha256": manifest["decisionContract"]["sha256"],
        "sourceSha256": smoke.digest(__file__), "encodingSourceSha256": smoke.digest(Path(smoke.__file__)),
        "baseHashes": base_hashes, "device": args.device, "algorithm": ALGORITHM}
    identity["sourceHashes"] = {str(path.relative_to(smoke.ROOT)): smoke.digest(path) for path in (
        Path(__file__), smoke.ROOT / "scripts/train_laya_domain.py", Path(smoke.__file__),
        smoke.ROOT / "scripts/validate_laya_operational.py", smoke.ROOT / "server/laya_worker.py",
        smoke.ROOT / "server/decision-questions.ts")}
    atomic_json(output / "identity.json", identity)
    agent = laya.load(str(source), device=args.device)
    if str(agent.device) != args.device:
        raise RuntimeError("inference device fallback")
    calibration = predict(agent.model, agent.tok, questions, splits["calibration"], "calibration", args.device)
    fitted = fit_temperature(calibration)
    atomic_json(output / "calibration-predictions.json", calibration)
    atomic_json(output / "calibration.json", fitted)
    derivative = output / "calibrated-checkpoint"
    create_calibrated_checkpoint(source, derivative, fitted["temperature"])
    atomic_json(output / "derivative-provenance.json", {"originalCheckpoint": str(source),
        "modelSha256": identity["modelSha256"], "weightsCopiedOrModified": False,
        "linksRequireOriginalCheckpointPreserved": True})
    calibration_before, _ = summarize(calibration, 1.0)
    calibration_after, _ = summarize(calibration, fitted["temperature"])
    atomic_json(output / "calibration-metrics.json", {"uncalibrated": calibration_before, "calibrated": calibration_after})
    registration = dict(identity, temperature=fitted["temperature"], selectedCheckpoint=str(source),
        calibratedConfigSha256=smoke.digest(derivative / "rl_agent_config.json"),
        status="registered-before-test-inference", models=["frozen-base", "tuned-final", "tuned-final-calibrated"],
        evaluationKind="passage-only-five-field; not whole-vacancy or production decision evaluation")
    claims = smoke.ROOT / ".model-cache/evaluation-registrations"
    claims.mkdir(parents=True, exist_ok=True)
    claim = claims / ("test-" + identity["datasetHashes"]["test"] + "-model-" + identity["modelSha256"] + ".json")
    with claim.open("x") as stream:
        json.dump(dict(registration, output=str(output)), stream, indent=2)
        stream.flush()
        os.fsync(stream.fileno())
    atomic_json(output / "registration.json", registration)
    tuned = predict(agent.model, agent.tok, questions, splits["test"], "test", args.device)
    del agent
    gc.collect()
    if args.device == "mps":
        torch.mps.empty_cache()
    base_agent = laya.load(str(smoke.BASE), device=args.device)
    base = predict(base_agent.model, base_agent.tok, questions, splits["test"], "test", args.device)
    report = {"status": "completed", "promotionReady": False, "identity": identity,
              "calibration": fitted, "calibrationMetrics": {"uncalibrated": calibration_before, "calibrated": calibration_after},
              "threshold": 0.8, "thresholdFitted": False, "results": {},
              "limitations": [f"{len(splits['test'])} held-out passages; report counts, not proof of generalization",
                "Passage-only context; no whole-vacancy completeness, citation or browser evaluation",
                "No production promotion or threshold change"]}
    for name, predictions, temperature in (("frozen-base", base, 1.0), ("tuned-final", tuned, 1.0),
                                          ("tuned-final-calibrated", tuned, fitted["temperature"])):
        summary, decoded = summarize(predictions, temperature)
        report["results"][name] = summary
        atomic_json(output / (name + "-test-predictions.json"), decoded)
    if (any(smoke.digest(source / path) != expected for path, expected in metadata["hashes"].items())
            or any(smoke.digest(smoke.BASE / path) != expected for path, expected in base_hashes.items())
            or any(smoke.digest(smoke.ROOT / path) != expected for path, expected in identity["sourceHashes"].items())
            or smoke.digest(derivative / "rl_agent_config.json") != registration["calibratedConfigSha256"]):
        raise ValueError("inference inputs/source/config/weights changed")
    report["weightsUnchanged"] = True
    report["baseModelSha256"] = base_hashes["model.safetensors"]
    atomic_json(output / "report.json", report)
    print(json.dumps({"status": "completed", "temperature": fitted["temperature"], "promotionReady": False}), flush=True)


if __name__ == "__main__":
    main()
