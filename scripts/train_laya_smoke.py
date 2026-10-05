#!/usr/bin/env python3
"""One full-model RLCD update on authored fixtures; verifies setup, not accuracy.

Recipe: NandhaKishorM/laya@8a6e1328cce2460a0e5aa348ad465bb1b5821cd2,
notebooks/laya_finetune_typed_decisions_mps.py (Apache-2.0).
Uses the installed runtime, cached weights, and actual service questions offline.
"""
import argparse
import gc
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import random
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "server"))
from laya_worker import MAX_LEN, HEAD_LEN, REVISIONS

MODEL = "convaiinnovations/laya-multilingual"
REVISION = REVISIONS[MODEL]
BASE = ROOT / ".model-cache/hub/models--convaiinnovations--laya-multilingual/snapshots" / REVISION
UPSTREAM = "8a6e1328cce2460a0e5aa348ad465bb1b5821cd2"


def digest(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def write_json(path, value):
    Path(path).write_text(json.dumps(value, indent=2, allow_nan=False) + "\n")


def questions():
    return json.loads(subprocess.check_output([
        "node", "--import", "tsx", "--input-type=module", "-e",
        "import {decisionQuestions} from './server/decision-questions.ts'; console.log(JSON.stringify(decisionQuestions));",
    ], cwd=ROOT, text=True))


def fixtures():
    # Authored engineering fixtures, never reviewed job evidence or evaluation gold.
    examples = [
        ("We do not provide visa sponsorship for this internship now or in the future.",
         "role", "unavailable", "now-and-future"),
        ("Will you now or in the future require visa sponsorship?",
         "question", "unclear", "unspecified"),
    ]
    return [{"id": f"authored-smoke-{i}", "state": json.dumps({
        "job_title": "Software Engineering Intern", "employer": "Example Employer",
        "previous": "", "TARGET": text, "next": "",
    }, ensure_ascii=False), "labels": dict(scope=scope, sponsorship=sponsorship,
        timing=timing, cpt="unclear", opt="unclear")}
        for i, (text, scope, sponsorship, timing) in enumerate(examples)]


def encode_items(tok, qs, rows):
    from laya.common import build_sequence, encode_text, serialize_state
    items = []
    for row in rows:
        state_ids = encode_text(tok, serialize_state(row["state"]).replace(tok.mask_token, " "),
                                add_special_tokens=False)["input_ids"]
        if len(state_ids) + HEAD_LEN + 4 > MAX_LEN:
            raise ValueError("context-too-long; refusing truncated training evidence")
        for name, question in qs.items():
            options = list(question["criteria"])
            label = options.index(row["labels"][name])
            ids, markers, stats = build_sequence(tok, row["state"], {
                "t": question["type"], "ins": question["instructions"], "crit": question["criteria"],
            }, MAX_LEN, HEAD_LEN, return_stats=True)
            if len(markers) != len(options) or stats["options_distinct"] != len(options):
                raise ValueError("question options collapsed during encoding")
            items.append(dict(id=row["id"], question=name, ids=ids, markers=markers, label=label,
                              target=[float(i == label) for i in range(len(options))]))
    return items


def batch(item, device):
    import torch
    ids = torch.tensor([item["ids"]], device=device)
    pos = torch.tensor([item["markers"]], device=device)
    mask = torch.ones_like(pos, dtype=torch.bool)
    target = torch.tensor([item["target"]], device=device)
    return ids, torch.ones_like(ids), pos, mask, target, torch.zeros(1, dtype=torch.long, device=device)


def evaluate(model, items, device):
    import torch
    model.eval()
    result = []
    with torch.no_grad():
        for item in items:
            ids, att, pos, mask, target, qt = batch(item, device)
            logits, _ = model(ids, att, pos, mask, qt)
            loss = -(target * logits.log_softmax(-1)).sum()
            if not torch.isfinite(loss):
                raise ValueError("nonfinite evaluation loss")
            result.append(dict(id=item["id"], question=item["question"],
                ce=loss.item(), probabilities=logits.softmax(-1)[0].cpu().tolist()))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--device", choices=["mps", "cpu", "cuda"], default="mps")
    parser.add_argument("--preflight", action="store_true", help="validate initialization and tokens without training")
    args = parser.parse_args()
    os.environ.update(HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1", HF_HUB_DISABLE_TELEMETRY="1", USE_TF="0")
    import torch
    import laya
    from laya.common import proper_reward
    from safetensors.torch import save_file

    if args.device == "mps" and not torch.backends.mps.is_available():
        raise RuntimeError("MPS unavailable; check sandbox GPU access before choosing CPU")
    # New directory only: failed runs remain available for diagnosis.
    args.output.mkdir(parents=True, exist_ok=False)
    start = time.monotonic()
    random.seed(42)
    torch.manual_seed(42)
    if args.device == "mps":
        torch.mps.manual_seed(42)
    torch.set_num_threads(4)
    qs, rows = questions(), fixtures()
    base_hashes = {str(p.relative_to(BASE)): digest(p) for p in sorted(BASE.rglob("*")) if p.is_file()}
    report = dict(status="initializing", experiment="authored-smoke-only", promotionReady=False,
        calibration="not fitted; synthetic smoke has no calibration or test split",
        targetKind="authored-hard-label-one-hot", contract="laya-policy-v1",
        model=MODEL, revision=REVISION, upstreamRecipe=UPSTREAM, device=args.device,
        seed=42, maxLen=MAX_LEN, headMaxLen=HEAD_LEN, baseHashes=base_hashes,
        versions={name: importlib.metadata.version(name) for name in
                  ["laya", "torch", "transformers", "safetensors", "tokenizers"]},
        sourceHashes={str(p.relative_to(ROOT)): digest(p) for p in
                      [Path(__file__), ROOT / "server/laya_worker.py", ROOT / "server/decision-questions.ts"]})
    write_json(args.output / "report.json", report)
    write_json(args.output / "questions.json", qs)
    write_json(args.output / "fixtures.json", rows)
    try:
        agent = laya.load(str(BASE), device=args.device)
        if str(agent.device) != args.device:
            raise RuntimeError("runtime fell back to a different device")
        model, tok = agent.model.float(), agent.tok
        items = encode_items(tok, qs, rows)
        report.update(parameters=sum(p.numel() for p in model.parameters()), decisions=len(items),
                      maxSequenceTokens=max(len(item["ids"]) for item in items))
        print(json.dumps({k: report[k] for k in ["device", "parameters", "decisions", "maxSequenceTokens"]}), flush=True)
        if args.preflight:
            report["status"] = "preflight-passed"
            return
        before = evaluate(model, items, args.device)
        model.encoder.gradient_checkpointing_enable(gradient_checkpointing_kwargs={"use_reentrant": False})
        model.head_checkpointing = True
        model.train()
        encoder = [p for n, p in model.named_parameters() if n.startswith("encoder.")]
        head = [p for n, p in model.named_parameters() if not n.startswith("encoder.")]
        optimizer = torch.optim.AdamW([{"params": encoder, "lr": 2.5e-5},
                                      {"params": head, "lr": 1e-4}], weight_decay=0.01, foreach=False)
        watched = {name: p.detach().reshape(-1)[:1024].cpu().clone() for name, p in
                   [("encoder", next(p for p in encoder if p.requires_grad)), ("head", model.scorer[-1].weight)]}
        optimizer.zero_grad(set_to_none=True)
        losses = []
        for index, item in enumerate(items):
            ids, att, pos, mask, target, qt = batch(item, args.device)
            logits, activation = model(ids, att, pos, mask, qt)
            logits = logits.float()
            sigma = 0.4  # First update of upstream's 0.4 -> 0.1 exploration schedule.
            eps = torch.randn((4,) + logits.shape, device=args.device) * sigma
            eps = (eps - eps.mean(-1, keepdim=True)) * mask
            noisy = logits.detach().unsqueeze(0) + eps
            with torch.no_grad():
                reward = proper_reward(noisy.softmax(-1), target.unsqueeze(0), qt, mask, w_sph=0.75, w_rps=1.0)
                advantage = reward - reward.mean(0, keepdim=True)
                advantage = advantage / (advantage.std() + 1e-6)
            logp = -((noisy - logits.unsqueeze(0)).square() * mask).sum(-1) / (2 * sigma ** 2)
            ce = -(target * logits.log_softmax(-1)).sum(-1).mean()
            loss = -(advantage * logp).mean() + ce + 0.0 * activation.sum()
            if not torch.isfinite(loss):
                raise ValueError("nonfinite training loss")
            (loss / len(items)).backward()
            losses.append(loss.item())
            print(f"backward {index + 1}/{len(items)} loss={loss.item():.4f}", flush=True)
        norm = torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0, error_if_nonfinite=True)
        optimizer.step()
        optimizer.zero_grad(set_to_none=True)
        del optimizer
        changed = {name: not torch.equal(watched[name], p.detach().reshape(-1)[:1024].cpu()) for name, p in
                   [("encoder", encoder[0]), ("head", model.scorer[-1].weight)]}
        if not all(changed.values()):
            raise ValueError("optimizer did not update both encoder and decision head")
        after = evaluate(model, items, args.device)
        checkpoint = args.output / "checkpoint"
        checkpoint.mkdir()
        cfg = dict(agent.cfg, max_len=MAX_LEN, head_max_len=HEAD_LEN, temperature=[1.0] * 3,
                   fine_tuned=True, model_name="sns-authored-smoke-DO-NOT-DEPLOY",
                   sns_training={"smoke_only": True, "calibrated": False, "updates": 1, "contract": "laya-policy-v1"})
        for key in ["temperature_by_options", "lang_temperatures", "binning_map"]:
            cfg.pop(key, None)
        save_file({k: v.detach().cpu().contiguous() for k, v in model.state_dict().items()},
                  str(checkpoint / "model.safetensors"))
        model.encoder.config.save_pretrained(checkpoint / "encoder")
        tok.save_pretrained(checkpoint / "tokenizer")
        write_json(checkpoint / "rl_agent_config.json", cfg)
        del encoder, head, model, agent, logits, activation, loss, ce, logp, noisy
        gc.collect()
        if args.device == "mps":
            torch.mps.empty_cache()
        reloaded = laya.load(str(checkpoint), device=args.device)
        reload_result = evaluate(reloaded.model, items, args.device)
        delta = max(abs(a - b) for left, right in zip(after, reload_result)
                    for a, b in zip(left["probabilities"], right["probabilities"]))
        if delta > 1e-5:
            raise ValueError(f"reload prediction mismatch: {delta}")
        report.update(status="passed", updates=1, gradientsFinite=True, gradientNorm=float(norm),
            weightsChanged=changed, losses=losses, before=before, after=after, reloadMaxProbabilityDelta=delta,
            checkpointSha256=digest(checkpoint / "model.safetensors"))
        report["baseUnchanged"] = all(digest(BASE / path) == value for path, value in base_hashes.items())
        if not report["baseUnchanged"]:
            raise ValueError("base artifact changed")
        print("Smoke passed: update, checkpoint, reload, and base preservation verified.", flush=True)
    except Exception as error:
        report.update(status="failed", error=f"{type(error).__name__}: {error}")
        raise
    finally:
        report["elapsedSeconds"] = round(time.monotonic() - start, 3)
        write_json(args.output / "report.json", report)


if __name__ == "__main__":
    main()
