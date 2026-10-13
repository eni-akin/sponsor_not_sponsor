#!/usr/bin/env python3
"""Offline inference-only benchmark, with private tokenizer and real contract checks.
Preserves prior benchmark evidence and never reads calibration/fresh-test gold.
"""
import argparse
from collections import Counter
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import re
import selectors
import shutil
import statistics
import subprocess
import sys
import tempfile
import threading
import time

ROOT = Path(__file__).resolve().parents[1]
REVISION = "e4e9ddf21a7b1903b7acffd8814ad4307bf63a67"
BASE = ROOT / ".model-cache/hub/models--convaiinnovations--laya-multilingual/snapshots" / REVISION
FIELDS = ("scope", "sponsorship", "timing", "cpt", "opt")
VOCAB = {"scope": {"role", "none", "question", "company", "historical", "other-role"},
         "sponsorship": {"available", "unavailable", "conditional", "unclear"},
         "timing": {"now", "future", "now-and-future", "unspecified"},
         "cpt": {"explicitly-accepted", "explicitly-excluded", "unclear"},
         "opt": {"explicitly-accepted", "explicitly-excluded", "unclear"}}


def digest(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def node_json(code, value=None):
    return json.loads(subprocess.check_output(
        ["node", "--import", "tsx", "--input-type=module", "-e", code], cwd=ROOT,
        input=None if value is None else json.dumps(value), text=True))


def stats(values):
    if not values:
        return None
    ordered = sorted(values)
    return {"samples": len(values), "p50_sec": ordered[math.ceil(len(values) * .5) - 1],
            "p95_sec": ordered[math.ceil(len(values) * .95) - 1], "max_sec": max(values)}


def classify_result(result, request):
    if not isinstance(result, dict) or result.get("error"):
        return "worker-error"
    blocks = result.get("blocks")
    if result.get("version") != request["version"] or not isinstance(blocks, list):
        return "malformed"
    if any(not isinstance(b, dict) for b in blocks) or [b.get("id") for b in blocks] != [b["id"] for b in request["blocks"]]:
        return "malformed"
    if request["version"].endswith("v2"):
        if result.get("processing", {}).get("status") != "complete":
            return "partial"
        if any(b.get("interpretation", {}).get("status") != "interpreted" for b in blocks):
            return "not-all-forward"
    else:
        for block in blocks:
            answers = block.get("answers", {})
            if set(answers) != set(FIELDS):
                return "malformed"
            for field, answer in answers.items():
                prob = answer.get("probability")
                if (answer.get("choice") not in VOCAB[field] or isinstance(prob, bool)
                        or not isinstance(prob, (int, float)) or not 0 <= prob <= 1):
                    return "malformed"
    return "complete"


class Worker:
    def __init__(self, env):
        self.proc = subprocess.Popen([sys.executable, "server/laya_worker.py"], cwd=ROOT, env=env,
                                     stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                     stderr=subprocess.DEVNULL, text=True, bufsize=1)
        self.selector = selectors.DefaultSelector()
        self.selector.register(self.proc.stdout, selectors.EVENT_READ)
        self.rss_samples = []
        self.stop = threading.Event()
        self.monitor = threading.Thread(target=self.sample, daemon=True)
        self.monitor.start()

    def rss(self):
        try:
            return int(subprocess.check_output(["ps", "-o", "rss=", "-p", str(self.proc.pid)], text=True).strip()) / 1024
        except (subprocess.CalledProcessError, ValueError):
            return None

    def sample(self):
        while not self.stop.is_set():
            value = self.rss()
            if value is not None:
                self.rss_samples.append(value)
            self.stop.wait(.1)

    def send(self, payload, timeout):
        start = time.perf_counter()
        try:
            self.proc.stdin.write(json.dumps(payload, ensure_ascii=False) + "\n")
            self.proc.stdin.flush()
            if not self.selector.select(timeout):
                self.proc.kill()
                return time.perf_counter() - start, None, "timeout"
            line = self.proc.stdout.readline()
            if not line:
                return time.perf_counter() - start, None, "worker-exit"
            return time.perf_counter() - start, json.loads(line), None
        except (BrokenPipeError, OSError):
            return time.perf_counter() - start, None, "worker-exit"
        except json.JSONDecodeError:
            return time.perf_counter() - start, None, "malformed"

    def close(self):
        self.stop.set()
        self.monitor.join(timeout=2)
        self.selector.close()
        if self.proc.poll() is None:
            self.proc.terminate()
        self.proc.wait(timeout=10)
        self.proc.stdin.close()
        self.proc.stdout.close()


def run_benchmark(args):
    script_sha256 = digest(Path(__file__))
    if args.iterations < 30 or args.cold_starts < 3:
        raise ValueError("Require >=30 warm jobs per path and >=3 observed cold starts")
    out = ROOT / args.output
    if out.exists():
        raise ValueError("Refusing to overwrite benchmark evidence; choose a new --output")
    config = node_json("import {decisionQuestions} from './server/decision-questions.ts';import {computeConfigurationDigests} from './src/decision.ts';console.log(JSON.stringify({questions:decisionQuestions,digests:computeConfigurationDigests(decisionQuestions)}));")
    source = ROOT / "evaluation/laya-training/contextual-v1-2026-10-10/postings.json"
    postings = sorted((p for p in json.loads(source.read_text())["postings"] if p["split"] == "development" and p["coverage"] == "complete"), key=lambda p: len(p["blocks"]))
    sizes = sorted({len(p['blocks']) for p in postings})
    selected_sizes = [sizes[0], sizes[len(sizes) // 2], sizes[-1]]
    cases = [next(p for p in postings if len(p['blocks']) == size) for size in selected_sizes]
    if len({len(p["blocks"]) for p in cases}) < 3:
        raise ValueError("Need three development posting sizes")
    # Exact exposed WTW capture, not the contextual generator's altered text/ID binding.
    wtw_path = ROOT / "evaluation/laya-training/live-job-tests/wtw-202605435/request.json"
    original_wtw = json.loads(wtw_path.read_text())
    cases = [dict(p, blocks=[dict(b, contextGroup='wtw-original:visible', position=i) for i, b in enumerate(original_wtw['blocks'])],
                  contextGroups=[{'id': 'wtw-original:visible', 'firstPosition': 0, 'lastPosition': len(original_wtw['blocks']) - 1, 'start': 'boundary', 'end': 'boundary'}])
             if p['employer'] == 'WTW' else p for p in cases]
    requests = [{"version": "laya-policy-v2", "title": p["jobTitle"], "employer": p["employer"], "country": p["country"], "contextGroups": p["contextGroups"], "blocks": p["blocks"]} for p in cases]
    node_json("import fs from 'node:fs';import {parseDecisionRequest} from './src/decision.ts';if(JSON.parse(fs.readFileSync(0,'utf8')).some(r=>!parseDecisionRequest(r)))throw Error('Invalid input');console.log('true');", requests)
    match = re.search(r"setTimeout\(\(\) => this.close\(\),\s*([\d_]+)\)", (ROOT / "server/decision-service.ts").read_text())
    if not match:
        raise ValueError("Cannot resolve actual production timeout")
    timeout = int(match[1].replace("_", "")) / 1000
    before = {str(p.relative_to(BASE)): digest(p) for p in BASE.rglob("*") if p.is_file()}
    observations, cold, memory, validations = [], [], [], []

    def measure(worker, request, path, phase):
        payload = {"request": request, "questions": config["questions"] if path == "v2" else {k: config["questions"][k] for k in FIELDS}, "configuration": config["digests"]}
        elapsed, result, error = worker.send(payload, timeout)
        row = {"path": path, "phase": phase, "seconds": elapsed, "blocks": len(request["blocks"]), "status": error or classify_result(result, request)}
        if result and path == "v2":
            row["processing"] = result.get("processing")
            validations.append((request, result, row))
        observations.append(row)
        return row

    with tempfile.TemporaryDirectory(prefix="sns-benchmark-") as temporary:
        private = Path(temporary) / "model"
        private.mkdir()
        shutil.copytree(BASE / "tokenizer", private / "tokenizer")
        shutil.copyfile(BASE / "rl_agent_config.json", private / "rl_agent_config.json")
        (private / "model.safetensors").symlink_to((BASE / "model.safetensors").resolve())
        (private / "encoder").symlink_to((BASE / "encoder").resolve(), target_is_directory=True)
        env = {**os.environ, "LAYA_MODEL": str(private), "LAYA_REVISION": REVISION, "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1", "LAYA_DEVICE": "cpu", "LAYA_THREADS": "4"}
        env.pop("LAYA_FAKE_WORKER", None)
        empty = {"version": "laya-policy-v2", "title": "Benchmark readiness", "employer": None, "country": None, "contextGroups": [], "blocks": []}
        for start in range(args.cold_starts):
            worker = Worker(env)
            pre = worker.rss()
            try:
                ready = measure(worker, empty, "v2", "cold-load-ready")
                post = worker.rss()
                first = measure(worker, requests[0], "v2", "cold-first-job")
                cold.append({"start": start, "load_ready": ready, "first_job": first})
            finally:
                worker.close()
            memory.append({"phase": "cold", "before_load_mb": pre, "after_load_mb": post, "sampled_peak_mb": max(worker.rss_samples, default=None), "samples": len(worker.rss_samples)})
            print(f"Cold {start + 1}/{args.cold_starts}: {ready['status']} {ready['seconds']:.2f}s", flush=True)
        worker = Worker(env)
        pre = worker.rss()
        try:
            measure(worker, empty, "v2", "warm-load-ready")
            post = worker.rss()
            for path in ("v1", "v2"):
                measure(worker, dict(requests[0], version="laya-policy-" + path), path, "warm-up")
            for index in range(args.iterations):
                for path in ("v1", "v2"):
                    measure(worker, dict(requests[index % 3], version="laya-policy-" + path), path, "warm")
                print(f"Warm paired jobs {index + 1}/{args.iterations}", flush=True)
        finally:
            worker.close()
        memory.append({"phase": "warm-all-forward", "before_load_mb": pre, "after_load_mb": post, "sampled_peak_mb": max(worker.rss_samples, default=None), "samples": len(worker.rss_samples)})
    valid = node_json("import fs from 'node:fs';import {parseDecisionResult} from './src/decision.ts';console.log(JSON.stringify(JSON.parse(fs.readFileSync(0,'utf8')).map(([q,r])=>!!parseDecisionResult(r,q))));", [[q, r] for q, r, _ in validations])
    for (_, _, row), okay in zip(validations, valid):
        if not okay:
            row["status"] = "malformed"
    after = {str(p.relative_to(BASE)): digest(p) for p in BASE.rglob("*") if p.is_file()}
    if before != after:
        raise RuntimeError("Source checkpoint integrity changed")
    warm = {path: stats([r["seconds"] for r in observations if r["path"] == path and r["phase"] == "warm"]) for path in ("v1", "v2")}
    failures = dict(Counter(r["status"] for r in observations if r["status"] != "complete"))
    peak = max(m["sampled_peak_mb"] or 0 for m in memory)
    gates = {"zero_operational_failures": not failures, "warm_ratio": warm["v2"]["p95_sec"] <= 2 * warm["v1"]["p95_sec"], "warm_timeout": warm["v2"]["p95_sec"] < timeout,
             "cold_budget": max(r["load_ready"]["seconds"] for r in cold) <= args.cold_budget, "memory_budget": 0 < peak <= args.memory_budget}
    report = {"schemaVersion": 2, "status": "passed" if all(gates.values()) else "failed", "trainingStarted": False, "qualityEvaluation": False,
              "hardware": {"platform": platform.platform(), "model": subprocess.check_output(["sysctl", "-n", "hw.model"], text=True).strip(), "physical_memory_bytes": int(subprocess.check_output(["sysctl", "-n", "hw.memsize"], text=True)), "device": "cpu", "threads": 4, "precision": "float32 (CPU default)", "python": sys.version, "torch_laya_versions": subprocess.check_output([sys.executable, "-c", "import torch,laya;print(torch.__version__,laya.__version__)"], text=True).strip(), "batch": "system_one sequential per target"},
              "source": {"gitHead": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(), "workerSha256": digest(ROOT / "server/laya_worker.py"), "benchmarkSha256": script_sha256, "benchmarkScriptUnchangedDuringRun": digest(Path(__file__)) == script_sha256, "serviceSha256": digest(ROOT / "server/decision-service.ts"), "model": "convaiinnovations/laya-multilingual@" + REVISION, "checkpointFiles": before, "sourceCheckpointUnchanged": before == after, "postingsSha256": digest(source), "wtwOriginalSha256": digest(wtw_path), "benchmarkRequestsSha256": hashlib.sha256(json.dumps(requests, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest(), "cases": [{"id": p["id"], "blocks": len(p["blocks"])} for p in cases], "configuration": config["digests"]},
              "limits": {"worker_response_sec": timeout, "warm_ratio": 2, "cold_load_sec": args.cold_budget, "sampled_peak_worker_mb": args.memory_budget, "registeredBeforeTraining": True}, "gates": gates, "cold": cold,
              "coldSummary": {phase: {"samples": len(cold), "median_sec": statistics.median(r[phase]['seconds'] for r in cold), "max_sec": max(r[phase]['seconds'] for r in cold)} for phase in ('load_ready', 'first_job')},
              "memory": memory, "warm": warm, "failureCounts": failures,
              "operationalCounts": {"timeouts": sum(r['status'] == 'timeout' for r in observations), "malformed": sum(r['status'] == 'malformed' for r in observations), "partial": sum(r.get('processing', {}).get('status') == 'partial' for r in observations), "unsupportedJobs": sum(r.get('processing', {}).get('interpretation', {}).get('unsupported', 0) > 0 for r in observations), "stageFailureJobs": sum(r.get('processing', {}).get('interpretation', {}).get('failed', 0) > 0 for r in observations), "workerExits": sum(r['status'] == 'worker-exit' for r in observations), "confirmedOom": None},
              "observations": observations,
              "notes": ["Direct worker IPC bypasses service caches; browser/service integration checked separately.", "V1 is the current compatibility branch, not an exact historical worker reconstruction.", "Cold load includes process/import/model startup plus empty request; first nonempty job timed separately.", "Worker RSS sampled every 100ms; transient peaks may be missed. A worker exit is not automatically an OOM.", "Cold 60s limit leaves >=50% response-time margin; 4GiB worker limit leaves browser/OS RAM. Limits fixed before training."]}
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")
    print(json.dumps({"output": str(out), "status": report["status"], "warm": warm, "peakMb": peak, "failures": failures}), flush=True)
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--iterations", type=int, default=30)
    parser.add_argument("--cold-starts", type=int, default=3)
    parser.add_argument("--cold-budget", type=float, default=60)
    parser.add_argument("--memory-budget", type=float, default=4096)
    parser.add_argument("--output", default="evaluation/laya-training/benchmark-results-reviewed-2026-10-10.json")
    sys.exit(run_benchmark(parser.parse_args()))
