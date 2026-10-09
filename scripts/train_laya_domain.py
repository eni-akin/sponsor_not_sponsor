#!/usr/bin/env python3
"""Offline full-model RLCD fine-tuning on locked, passage-level training records."""
import argparse
import importlib.metadata
import json
import math
import os
from pathlib import Path
import random
import signal
import sys
import time

sys.path.insert(0, str(Path(__file__).resolve().parent))
import train_laya_smoke as smoke

ROOT = smoke.ROOT
FIELDS = ("scope", "sponsorship", "timing", "cpt", "opt")


def atomic_json(path, value):
    path = Path(path)
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w") as stream:
        json.dump(value, stream, indent=2, allow_nan=False)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(path)


def rows_for_training(records):
    rows = []
    for record in records:
        if record["split"] != "train":
            raise ValueError("only training records may enter the optimizer")
        context = record["inputContext"]
        if context.get("neighbors") != []:
            raise ValueError("this passage-only recipe requires declared empty neighbors")
        rows.append({"id": record["id"], "state": json.dumps({
            "job_title": context["jobTitle"], "employer": context["employer"],
            "previous": "", "TARGET": record["text"], "next": "",
        }, ensure_ascii=False), "labels": {field: record[field] for field in FIELDS}})
    if not rows:
        raise ValueError("empty training split")
    return rows


def capture_rng(device):
    import torch
    state = {"python": random.getstate(), "torch": torch.get_rng_state()}
    if device == "mps":
        state["accelerator"] = torch.mps.get_rng_state()
    elif device == "cuda":
        state["accelerator"] = torch.cuda.get_rng_state_all()
    return state


def restore_rng(state, device):
    import torch
    random.setstate(state["python"])
    torch.set_rng_state(state["torch"])
    if device == "mps":
        torch.mps.set_rng_state(state["accelerator"])
    elif device == "cuda":
        torch.cuda.set_rng_state_all(state["accelerator"])


def initial_progress(count):
    order = list(range(count))
    random.shuffle(order)
    return {"epoch": 0, "cursor": 0, "order": order, "updates": 0, "history": []}


def exploration(update, total):
    return 0.4 - 0.3 * update / max(1, total - 1)


def rlcd_loss(model, item, device, sigma):
    import torch
    from laya.common import proper_reward
    ids, attention, positions, mask, target, qtype = smoke.batch(item, device)
    logits, activation = model(ids, attention, positions, mask, qtype)
    logits = logits.float()
    noise = torch.randn((4,) + logits.shape, device=device) * sigma
    noise = (noise - noise.mean(-1, keepdim=True)) * mask
    noisy = logits.detach().unsqueeze(0) + noise
    with torch.no_grad():
        reward = proper_reward(noisy.softmax(-1), target.unsqueeze(0), qtype, mask,
                               w_sph=0.75, w_rps=1.0)
        advantage = reward - reward.mean(0, keepdim=True)
        advantage = advantage / (advantage.std() + 1e-6)
    logp = -((noisy - logits.unsqueeze(0)).square() * mask).sum(-1) / (2 * sigma ** 2)
    ce = -(target * logits.log_softmax(-1)).sum(-1).mean()
    loss = -(advantage * logp).mean() + ce + 0.0 * activation.sum()
    if not torch.isfinite(loss):
        raise ValueError("nonfinite training loss")
    return loss, ce


def optimizer_update(model, optimizer, items, progress, config, device):
    """One shared update boundary, exercised by the deterministic resume test."""
    import torch
    start = progress["cursor"]
    indices = progress["order"][start:start + config["accumulation"]]
    if not indices:
        raise ValueError("invalid empty optimizer batch")
    total = config["epochs"] * math.ceil(len(items) / config["accumulation"])
    sigma = exploration(progress["updates"], total)
    model.train()
    optimizer.zero_grad(set_to_none=True)
    losses, ces = [], []
    for index in indices:
        loss, ce = rlcd_loss(model, items[index], device, sigma)
        (loss / len(indices)).backward()
        losses.append(loss.item())
        ces.append(ce.item())
    norm = torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0, error_if_nonfinite=True)
    optimizer.step()
    optimizer.zero_grad(set_to_none=True)
    entry = {"update": progress["updates"] + 1, "epoch": progress["epoch"] + 1,
             "indices": indices, "sigma": sigma, "loss": sum(losses) / len(losses),
             "ce": sum(ces) / len(ces), "gradientNorm": float(norm)}
    progress["updates"] += 1
    progress["cursor"] += len(indices)
    progress["history"].append(entry)
    if progress["cursor"] == len(items):
        progress["epoch"] += 1
        progress["cursor"] = 0
        progress["order"] = [] if progress["epoch"] == config["epochs"] else list(range(len(items)))
        random.shuffle(progress["order"])
    return entry


def cpu_tree(value):
    import torch
    if isinstance(value, torch.Tensor):
        return value.detach().cpu()
    if isinstance(value, dict):
        return {key: cpu_tree(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return type(value)(cpu_tree(item) for item in value)
    return value


def verify_checkpoint(path, output, identity):
    path, output = Path(path).resolve(), Path(output).resolve()
    if path.parent != output / "checkpoints" or path.is_symlink():
        raise ValueError("resume accepts only a committed local checkpoint in this run")
    metadata = json.loads((path / "checkpoint.json").read_text())
    if metadata.get("status") != "committed" or metadata["identity"] != identity:
        raise ValueError("checkpoint identity/configuration drift")
    for name, expected in metadata["hashes"].items():
        artifact = (path / name).resolve()
        if not artifact.is_relative_to(path) or smoke.digest(artifact) != expected:
            raise ValueError("checkpoint artifact hash mismatch")
    if not {"model.safetensors", "training-state.pt", "rl_agent_config.json"}.issubset(metadata["hashes"]):
        raise ValueError("incomplete checkpoint")
    return path


def save_checkpoint(output, agent, optimizer, progress, identity, device):
    import torch
    from safetensors.torch import save_file
    parent = output / "checkpoints"
    parent.mkdir(exist_ok=True)
    name = f"step-{progress['updates']:06d}"
    checkpoint = parent / name
    temporary = parent / (name + ".partial")
    temporary.mkdir(exist_ok=False)
    state = {"optimizer": cpu_tree(optimizer.state_dict()), "progress": progress,
             "rng": capture_rng(device)}
    torch.save(state, temporary / "training-state.pt")
    del state
    save_file({key: value.detach().cpu().contiguous() for key, value in agent.model.state_dict().items()},
              str(temporary / "model.safetensors"))
    agent.model.encoder.config.save_pretrained(temporary / "encoder")
    agent.tok.save_pretrained(temporary / "tokenizer")
    cfg = dict(agent.cfg, temperature=[1.0, 1.0, 1.0], max_len=smoke.MAX_LEN,
               head_max_len=smoke.HEAD_LEN, fine_tuned=True,
               model_name="sns-domain-unpromoted", sns_training={"smoke_only": False,
               "calibrated": False, "updates": progress["updates"], "epochsCompleted": progress["epoch"],
               "contract": "laya-policy-v1", "identity": identity})
    for key in ("temperature_by_options", "lang_temperatures", "binning_map"):
        cfg.pop(key, None)
    smoke.write_json(temporary / "rl_agent_config.json", cfg)
    hashes = {str(path.relative_to(temporary)): smoke.digest(path)
              for path in sorted(temporary.rglob("*")) if path.is_file()}
    atomic_json(temporary / "checkpoint.json", {"status": "committed", "identity": identity,
                "updates": progress["updates"], "hashes": hashes})
    # Directory rename publishes only complete checkpoint artifacts on this filesystem.
    temporary.rename(checkpoint)
    atomic_json(output / "latest.json", {"checkpoint": str(checkpoint.relative_to(output)),
                "updates": progress["updates"], "checkpointMetadataSha256": smoke.digest(checkpoint / "checkpoint.json")})
    return checkpoint


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--device", choices=("cpu", "mps", "cuda"), default="mps")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--accumulation", type=int, default=10)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--checkpoint-every", type=int, default=0, help="0 saves at each epoch end")
    parser.add_argument("--resume", type=Path)
    parser.add_argument("--preflight", action="store_true")
    parser.add_argument("--stop-after-updates", type=int, help="engineering interruption, not early model selection")
    args = parser.parse_args()
    if args.epochs < 1 or args.accumulation < 1 or args.checkpoint_every < 0:
        parser.error("epochs/accumulation must be positive; checkpoint-every must be nonnegative")
    if args.stop_after_updates is not None and args.stop_after_updates < 1:
        parser.error("stop-after-updates must be positive")
    os.environ.update(HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1", HF_HUB_DISABLE_TELEMETRY="1", USE_TF="0")
    from validate_laya_operational import validate_operational
    # This gate runs before output creation, tokenizer/model initialization, or any update.
    splits = validate_operational(args.dataset_dir, require_frozen=True)
    rows = rows_for_training(splits["train"])
    import torch
    from laya.agent import _load_tokenizer
    if args.device == "mps" and not torch.backends.mps.is_available():
        raise RuntimeError("MPS unavailable; refusing silent CPU fallback")
    if args.device == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA unavailable")
    config = {"seed": args.seed, "epochs": args.epochs, "accumulation": args.accumulation,
              "encoderLearningRate": 2.5e-5, "headLearningRate": 1e-4, "weightDecay": 0.01,
              "exploration": [0.4, 0.1], "gradientClip": 1.0, "dtype": "float32",
              "device": args.device, "threads": 4, "objective": "full-model-RLCD-plus-cross-entropy"}
    dataset_dir, output = args.dataset_dir.resolve(), args.output.resolve()
    qs = smoke.questions()
    source_paths = [Path(__file__), ROOT / "scripts/train_laya_smoke.py",
                    ROOT / "scripts/validate_laya_operational.py", ROOT / "server/laya_worker.py",
                    ROOT / "server/decision-questions.ts", ROOT / "DECISION_LOGIC.md"]
    identity = {"config": config, "datasetHashes": {path.name: smoke.digest(path)
                for path in sorted(dataset_dir.iterdir()) if path.is_file()},
                "sourceHashes": {str(path.relative_to(ROOT)): smoke.digest(path) for path in source_paths},
                "baseHashes": {str(path.relative_to(smoke.BASE)): smoke.digest(path)
                for path in sorted(smoke.BASE.rglob("*")) if path.is_file()},
                "model": smoke.MODEL, "revision": smoke.REVISION,
                "questions": qs, "maxLen": smoke.MAX_LEN, "headMaxLen": smoke.HEAD_LEN,
                "versions": {name: importlib.metadata.version(name) for name in
                ("laya", "torch", "transformers", "safetensors", "tokenizers")}}
    checkpoint = verify_checkpoint(args.resume, output, identity) if args.resume else None
    if checkpoint:
        previous = json.loads((output / "run.json").read_text())
        if previous["identity"] != identity or previous["status"] == "completed":
            raise ValueError("run already completed or configuration drift")
    else:
        output.mkdir(parents=True, exist_ok=False)
    start = time.monotonic()
    report = {"status": "initializing", "identity": identity, "promotionReady": False,
              "calibration": "separate; never used for weight updates", "records": len(rows),
              "resumeFrom": str(checkpoint) if checkpoint else None}
    atomic_json(output / "run.json", report)
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    torch.set_num_threads(4)
    if args.device == "mps":
        torch.mps.manual_seed(args.seed)
    interrupted = {"requested": False}
    def request_stop(signum, frame):
        interrupted["requested"] = True
        print("Interruption requested; finishing optimizer boundary before checkpoint.", flush=True)
    old_handlers = {number: signal.signal(number, request_stop) for number in (signal.SIGINT, signal.SIGTERM)}
    try:
        base_cfg = json.loads((smoke.BASE / "rl_agent_config.json").read_text())
        tok = _load_tokenizer(str(smoke.BASE / "tokenizer"), base_cfg)
        items = smoke.encode_items(tok, qs, rows)
        report.update(decisions=len(items), maxSequenceTokens=max(len(item["ids"]) for item in items),
                      totalUpdates=config["epochs"] * math.ceil(len(items) / config["accumulation"]))
        print(json.dumps({key: report[key] for key in ("records", "decisions", "maxSequenceTokens", "totalUpdates")}), flush=True)
        if args.preflight:
            report["status"] = "preflight-passed"
            return
        import laya
        agent = laya.load(str(checkpoint or smoke.BASE), device=args.device)
        if str(agent.device) != args.device:
            raise RuntimeError("runtime device fallback")
        model = agent.model.float()
        model.encoder.gradient_checkpointing_enable(gradient_checkpointing_kwargs={"use_reentrant": False})
        model.head_checkpointing = True
        optimizer = torch.optim.AdamW([
            {"params": [p for n, p in model.named_parameters() if n.startswith("encoder.")], "lr": 2.5e-5},
            {"params": [p for n, p in model.named_parameters() if not n.startswith("encoder.")], "lr": 1e-4},
        ], weight_decay=0.01, foreach=False)
        if checkpoint:
            # Trusted local state only, after location and complete artifact hashes are checked.
            state = torch.load(checkpoint / "training-state.pt", map_location="cpu", weights_only=False)
            optimizer.load_state_dict(state["optimizer"])
            progress = state["progress"]
            restore_rng(state["rng"], args.device)  # Initialization/loading may consume RNG.
            del state
        else:
            progress = initial_progress(len(items))
        report["parameters"] = sum(p.numel() for p in model.parameters())
        report["status"] = "running"
        atomic_json(output / "run.json", report)
        last_checkpoint_update = progress["updates"] if checkpoint else -1
        while progress["epoch"] < config["epochs"]:
            old_epoch = progress["epoch"]
            update_start = time.monotonic()
            entry = optimizer_update(model, optimizer, items, progress, config, args.device)
            print(json.dumps(dict(entry, totalUpdates=report["totalUpdates"],
                                  elapsedSeconds=round(time.monotonic() - update_start, 3))), flush=True)
            stop = interrupted["requested"] or (args.stop_after_updates is not None and
                                                 progress["updates"] >= args.stop_after_updates)
            save = stop or progress["epoch"] != old_epoch or (args.checkpoint_every and
                                        progress["updates"] % args.checkpoint_every == 0)
            if save:
                checkpoint = save_checkpoint(output, agent, optimizer, progress, identity, args.device)
                last_checkpoint_update = progress["updates"]
                report.update(checkpoint=str(checkpoint.relative_to(output)), updates=progress["updates"],
                              epochsCompleted=progress["epoch"], history=progress["history"])
                atomic_json(output / "run.json", report)
                print(f"Committed checkpoint {checkpoint.name}", flush=True)
            if stop:
                break
        if last_checkpoint_update != progress["updates"]:
            checkpoint = save_checkpoint(output, agent, optimizer, progress, identity, args.device)
        base_unchanged = all(smoke.digest(smoke.BASE / path) == expected
                             for path, expected in identity["baseHashes"].items())
        if not base_unchanged:
            raise ValueError("base artifacts changed")
        report.update(status="completed" if progress["epoch"] == config["epochs"] else "interrupted",
                      updates=progress["updates"], epochsCompleted=progress["epoch"], history=progress["history"],
                      checkpoint=str(checkpoint.relative_to(output)), baseUnchanged=base_unchanged)
    except Exception as error:
        report.update(status="failed", error=f"{type(error).__name__}: {error}")
        raise
    finally:
        for number, handler in old_handlers.items():
            signal.signal(number, handler)
        report["elapsedSeconds"] = round(time.monotonic() - start, 3)
        atomic_json(output / "run.json", report)


if __name__ == "__main__":
    main()
