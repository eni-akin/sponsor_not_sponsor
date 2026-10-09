#!/usr/bin/env python3
"""Finalize saved predictions after Laya's metadata-only tokenizer compatibility rewrite.

No model is loaded and no test inference is repeated.
"""
import argparse
import json
from pathlib import Path
import shutil

import calibrate_laya_domain as calibration
import train_laya_smoke as smoke
from train_laya_domain import atomic_json
from validate_laya_operational import validate_operational


def compatibility_config(original):
    result = dict(original)
    if result.get("tokenizer_class") != "TokenizersBackend":
        raise ValueError("unexpected original tokenizer metadata")
    result["tokenizer_class"] = "PreTrainedTokenizerFast"
    result.pop("backend", None)
    result.pop("is_local", None)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--dataset-dir", type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    if (output / "report.json").exists() or (output / "metadata-recovery.json").exists():
        raise ValueError("refusing to overwrite finalized recovery")
    registration = json.loads((output / "registration.json").read_text())
    source = Path(registration["selectedCheckpoint"])
    metadata = json.loads((source / "checkpoint.json").read_text())
    relative = "tokenizer/tokenizer_config.json"
    original_path = source.parent / "step-000088" / relative
    changed_path = source / relative
    original = json.loads(original_path.read_text())
    changed = json.loads(changed_path.read_text())
    if (smoke.digest(original_path) != metadata["hashes"][relative]
            or compatibility_config(original) != changed):
        raise ValueError("rewrite is not the known metadata-only compatibility fix")
    differences = [name for name, expected in metadata["hashes"].items()
                   if smoke.digest(source / name) != expected]
    if differences != [relative]:
        raise ValueError("artifacts other than tokenizer metadata changed")
    if smoke.digest(Path(calibration.__file__)) != registration["sourceSha256"]:
        raise ValueError("registered calibration algorithm changed")
    derivative = output / "calibrated-checkpoint"
    tokenizer_link = derivative / "tokenizer"
    if not tokenizer_link.is_symlink() or tokenizer_link.resolve() != source / "tokenizer":
        raise ValueError("unexpected derivative tokenizer target")
    # Preserve the loader's compatible metadata privately; never share mutable tokenizer files.
    shutil.copytree(source / "tokenizer", derivative / "private-tokenizer")
    tokenizer_link.unlink()
    tokenizer_link.symlink_to(derivative / "private-tokenizer", target_is_directory=True)
    recovery = {"status": "metadata-recovery-pending", "noRepeatedInference": True,
                "path": relative, "originalSha256": smoke.digest(original_path),
                "normalizedSha256": smoke.digest(changed_path), "originalConfig": original,
                "normalizedConfig": changed, "recoverySourceSha256": smoke.digest(__file__)}
    atomic_json(output / "metadata-recovery.json", recovery)
    shutil.copyfile(original_path, changed_path)
    splits = validate_operational(args.dataset_dir, require_frozen=True)
    run = json.loads((source.parent.parent / "run.json").read_text())
    calibration.verify_run_inputs(args.dataset_dir, smoke.questions(), registration["baseHashes"], run["identity"])
    from laya.agent import _load_tokenizer
    cfg = json.loads((source / "rl_agent_config.json").read_text())
    before = _load_tokenizer(str(source / "tokenizer"), cfg)
    after = _load_tokenizer(str(derivative / "private-tokenizer"), cfg)
    rows = calibration.rows_for_inference(sum(splits.values(), []))
    if smoke.encode_items(before, smoke.questions(), rows) != smoke.encode_items(after, smoke.questions(), rows):
        raise ValueError("tokenizer rewrite changed encoded questions/evidence")
    if (any(smoke.digest(source / name) != expected for name, expected in metadata["hashes"].items())
            or any(smoke.digest(smoke.BASE / name) != expected for name, expected in registration["baseHashes"].items())
            or any(smoke.digest(smoke.ROOT / name) != expected for name, expected in registration["sourceHashes"].items())
            or smoke.digest(derivative / "rl_agent_config.json") != registration["calibratedConfigSha256"]):
        raise ValueError("registered artifacts changed beyond restored compatibility metadata")
    fitted = json.loads((output / "calibration.json").read_text())
    metrics = json.loads((output / "calibration-metrics.json").read_text())
    report = {"status": "completed", "promotionReady": False, "identity": json.loads((output / "identity.json").read_text()),
              "calibration": fitted, "calibrationMetrics": metrics, "threshold": 0.8, "thresholdFitted": False,
              "results": {}, "weightsUnchanged": True, "baseModelSha256": registration["baseHashes"]["model.safetensors"],
              "limitations": ["12 held-out passages; not proof of generalization",
                  "Passage-only, float32 per-question inference; not whole-vacancy or browser evaluation",
                  "No production promotion; unchanged threshold; temperature optimum at runtime upper bound"],
              "tokenizerMetadataRecovery": "metadata-recovery.json"}
    for name, temperature in (("frozen-base", 1.0), ("tuned-final", 1.0),
                              ("tuned-final-calibrated", fitted["temperature"])):
        predictions = json.loads((output / (name + "-test-predictions.json")).read_text())
        if len(predictions) != len(splits["test"]) * 5:
            raise ValueError("incomplete saved test predictions")
        report["results"][name], _ = calibration.summarize(predictions, temperature)
    recovery.update(status="completed", originalCheckpointRestored=True,
                    all143PassagesEncodeIdentically=True, originalCheckpointHashesVerified=True)
    atomic_json(output / "metadata-recovery.json", recovery)
    atomic_json(output / "report.json", report)
    print(json.dumps({"status": "completed", "noRepeatedInference": True, "temperature": fitted["temperature"]}))


if __name__ == "__main__":
    main()
