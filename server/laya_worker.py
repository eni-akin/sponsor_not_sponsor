"""Persistent local inference worker. JSON lines on stdin/stdout; no job text logs.
Supports two-stage Laya v2 protocol and historical v1 protocol.
"""
import contextlib
import hashlib
import json
import os
import sys

MODEL = os.environ.get("LAYA_MODEL", "convaiinnovations/laya-multilingual")
REVISIONS = {
    "convaiinnovations/laya-multilingual": "e4e9ddf21a7b1903b7acffd8814ad4307bf63a67",
    "convaiinnovations/laya-typed-decisions": "1a793eb568e6718f15941d08f85432581df534e3",
}
REVISION = os.environ.get("LAYA_REVISION") or REVISIONS.get(MODEL)
MAX_LEN = 8192
HEAD_LEN = 512

CONTEXT_DEFINITION = {
    "version": 1,
    "keys": ["job_title", "employer", "country", "previous_status", "previous", "TARGET", "next", "next_status"],
    "statuses": ["present", "boundary", "missing"],
}

DEFAULT_PARAMETERS = {
    "routing": "all-forward",
    "minDecisionProbability": 0.8,
}


def derive_neighbor(request, block, delta):
    groups = {g["id"]: g for g in request.get("contextGroups", [])}
    group = groups.get(block.get("contextGroup"))
    if not group:
        return {"status": "missing", "position": None, "text": None}

    pos = block.get("position", 0)
    for b in request.get("blocks", []):
        if b.get("contextGroup") == block.get("contextGroup") and b.get("position") == pos + delta:
            return {"status": "present", "position": b.get("position"), "text": b.get("text")}

    outside = (pos == group["firstPosition"]) if delta < 0 else (pos == group["lastPosition"])
    status = (group["start"] if delta < 0 else group["end"]) if outside else "missing"
    return {"status": status, "position": None, "text": None}


def make_canonical_state(request, block, prev, next_neighbor):
    # Keys in exact pinned order: job_title, employer, country, previous_status, previous, TARGET, next, next_status
    return {
        "job_title": request.get("title", ""),
        "employer": request.get("employer"),
        "country": request.get("country"),
        "previous_status": prev["status"],
        "previous": prev["text"],
        "TARGET": block.get("text", ""),
        "next": next_neighbor["text"],
        "next_status": next_neighbor["status"],
    }


class FakeAgent:
    def __init__(self):
        class Tok:
            mask_token = "<mask>"
        self.tok = Tok()

    def system_one(self, state_str, questions, max_len=8192, head_max_len=512):
        state = json.loads(state_str)
        text = (state.get("TARGET") or "").lower()
        answers = {}
        for q_name in questions:
            if q_name == "relevance":
                is_rel = any(w in text for w in ("sponsor", "visa", "cpt", "opt", "citizenship", "authorization", "eligible", "restriction"))
                choice = "relevant" if is_rel else "irrelevant"
                answers["relevance"] = {"choice": choice, "probabilities": {choice: 0.95, ("irrelevant" if is_rel else "relevant"): 0.05}}
            elif q_name == "scope":
                choice = "question" if "?" in text else "role"
                answers["scope"] = {"choice": choice, "probabilities": {choice: 0.95}}
            elif q_name == "sponsorship":
                if "unavailable" in text or "not sponsor" in text or "no sponsorship" in text:
                    choice = "unavailable"
                elif "available" in text or "we sponsor" in text:
                    choice = "available"
                elif "conditional" in text or "case-by-case" in text or "except" in text:
                    choice = "conditional"
                else:
                    choice = "unclear"
                answers["sponsorship"] = {"choice": choice, "probabilities": {choice: 0.95}}
            elif q_name == "timing":
                if "future" in text:
                    choice = "future"
                elif "now and" in text or "current and future" in text:
                    choice = "now-and-future"
                elif "now" in text or "currently" in text:
                    choice = "now"
                else:
                    choice = "unspecified"
                answers["timing"] = {"choice": choice, "probabilities": {choice: 0.95}}
            elif q_name in ("cpt", "opt"):
                if f"no {q_name}" in text or f"{q_name} excluded" in text:
                    choice = "explicitly-excluded"
                elif f"{q_name} welcome" in text or f"{q_name} accepted" in text:
                    choice = "explicitly-accepted"
                else:
                    choice = "unclear"
                answers[q_name] = {"choice": choice, "probabilities": {choice: 0.95}}
        return {"answers": answers}


def main():
    os.environ.setdefault("HF_HOME", os.path.abspath(".model-cache"))
    os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

    use_fake = os.environ.get("LAYA_FAKE_WORKER") == "1" or "--fake" in sys.argv

    if use_fake:
        agent = FakeAgent()
        def encode_text(tok, text, add_special_tokens=False):
            return {"input_ids": [1] * (len(text) // 4)}
        def serialize_state(s):
            return s
    else:
        with contextlib.redirect_stdout(sys.stderr):
            import laya
            import torch
            torch.set_num_threads(int(os.environ.get("LAYA_THREADS", "4")))
            from laya.common import encode_text, serialize_state
            agent = laya.load(MODEL, device=os.environ.get("LAYA_DEVICE", "cpu"),
                              revision=REVISION)

    if "--load-only" in sys.argv:
        print(json.dumps({"ready": True, "model": MODEL, "revision": REVISION}), flush=True)
        return

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            payload = json.loads(line)
            req = payload.get("request", payload)
            questions = payload.get("questions") or {}
            config = payload.get("configuration") or {}
            parameters = payload.get("parameters") or DEFAULT_PARAMETERS

            version = req.get("version", "laya-policy-v2")

            if version == "laya-policy-v1":
                # Historical v1 support
                blocks = req.get("blocks", [])
                results = []
                for index, block in enumerate(blocks):
                    state = json.dumps({
                        "job_title": req.get("title", ""),
                        "employer": req.get("employer"),
                        "previous": blocks[index - 1]["text"] if index else "",
                        "TARGET": block["text"],
                        "next": blocks[index + 1]["text"] if index + 1 < len(blocks) else "",
                    }, ensure_ascii=False)
                    tokens = encode_text(agent.tok, serialize_state(state).replace(agent.tok.mask_token, " "), add_special_tokens=False)["input_ids"]
                    if len(tokens) + HEAD_LEN + 4 > MAX_LEN:
                        raise ValueError("context-too-long")
                    with contextlib.redirect_stdout(sys.stderr):
                        output = agent.system_one(state, questions, max_len=MAX_LEN, head_max_len=HEAD_LEN)
                    answers = {}
                    for key in ("scope", "sponsorship", "timing", "cpt", "opt"):
                        answer = output["answers"][key]
                        prob = answer.get("answer_confidence")
                        if prob is None:
                            prob = answer["probabilities"][answer["choice"]]
                        answers[key] = {"choice": answer["choice"], "probability": prob}
                    results.append({"id": block["id"], "answers": answers})
                print(json.dumps({"version": "laya-policy-v1", "engine": "laya", "model": MODEL + ("@" + REVISION if REVISION else ""), "blocks": results}), flush=True)
                continue

            # V2 Protocol
            questions_sha256 = hashlib.sha256(json.dumps(questions, ensure_ascii=False, separators=(',', ':')).encode('utf-8')).hexdigest()
            context_sha256 = hashlib.sha256(json.dumps(CONTEXT_DEFINITION, ensure_ascii=False, separators=(',', ':')).encode('utf-8')).hexdigest()
            parameters_sha256 = hashlib.sha256(json.dumps(parameters, ensure_ascii=False, separators=(',', ':')).encode('utf-8')).hexdigest()

            req_blocks = req.get("blocks", [])

            if len(req_blocks) == 0:
                empty_result = {
                    "version": "laya-policy-v2",
                    "engine": "laya",
                    "model": MODEL + ("@" + REVISION if REVISION else ""),
                    "configuration": {
                        "questionsSha256": config.get("questionsSha256") or questions_sha256,
                        "contextSha256": config.get("contextSha256") or context_sha256,
                        "parametersSha256": config.get("parametersSha256") or parameters_sha256,
                    },
                    "processing": {
                        "status": "complete",
                        "inputCount": 0,
                        "context": {"complete": 0, "missing": 0},
                        "screening": {"success": 0, "failed": 0, "unsupported": 0},
                        "interpretation": {"interpreted": 0, "skipped": 0, "failed": 0, "unsupported": 0},
                    },
                    "blocks": [],
                }
                print(json.dumps(empty_result, ensure_ascii=False), flush=True)
                continue

            block_results = []
            for b in req_blocks:
                b_id = b["id"]
                prev = derive_neighbor(req, b, -1)
                next_n = derive_neighbor(req, b, 1)

                is_missing = (prev["status"] == "missing" or next_n["status"] == "missing")
                if is_missing:
                    block_results.append({
                        "id": b_id,
                        "screening": {"status": "unsupported", "reason": "missing-context"},
                        "route": "uncertain",
                        "interpretation": {"status": "unsupported", "reason": "screening-unsupported"},
                    })
                    continue

                state = make_canonical_state(req, b, prev, next_n)
                state_str = json.dumps(state, ensure_ascii=False, separators=(',', ':'))

                # Token budget check
                try:
                    tokens = encode_text(agent.tok, serialize_state(state_str).replace(agent.tok.mask_token, " "), add_special_tokens=False)["input_ids"]
                    if len(tokens) + HEAD_LEN + 4 > MAX_LEN:
                        block_results.append({
                            "id": b_id,
                            "screening": {"status": "unsupported", "reason": "context-too-long"},
                            "route": "uncertain",
                            "interpretation": {"status": "unsupported", "reason": "screening-unsupported"},
                        })
                        continue
                except Exception:
                    block_results.append({
                        "id": b_id,
                        "screening": {"status": "unsupported", "reason": "context-too-long"},
                        "route": "uncertain",
                        "interpretation": {"status": "unsupported", "reason": "screening-unsupported"},
                    })
                    continue

                # Stage 1: Screening
                rel_q = questions.get("relevance")
                if not rel_q:
                    block_results.append({
                        "id": b_id,
                        "screening": {"status": "unsupported", "reason": "unsupported-input"},
                        "route": "uncertain",
                        "interpretation": {"status": "unsupported", "reason": "screening-unsupported"},
                    })
                    continue

                try:
                    with contextlib.redirect_stdout(sys.stderr):
                        screen_output = agent.system_one(state_str, {"relevance": rel_q}, max_len=MAX_LEN, head_max_len=HEAD_LEN)
                    screen_ans = screen_output["answers"]["relevance"]
                    screen_choice = screen_ans["choice"]
                    screen_prob = screen_ans.get("answer_confidence")
                    if screen_prob is None:
                        screen_prob = screen_ans["probabilities"][screen_choice]
                    screening = {
                        "status": "success",
                        "choice": screen_choice,
                        "probability": float(screen_prob),
                    }
                except Exception:
                    block_results.append({
                        "id": b_id,
                        "screening": {"status": "failed", "reason": "inference-failed"},
                        "route": "uncertain",
                        "interpretation": {"status": "failed", "reason": "screening-failed"},
                    })
                    continue

                # Compute Route
                routing_mode = parameters.get("routing", "all-forward")
                skip_threshold = parameters.get("skip_threshold")
                relevant_threshold = parameters.get("relevant_threshold")

                if routing_mode == "calibrated":
                    if screen_choice == "irrelevant" and skip_threshold is not None and screen_prob >= skip_threshold:
                        route = "skip"
                    elif screen_choice == "relevant" and relevant_threshold is not None and screen_prob >= relevant_threshold:
                        route = "relevant"
                    else:
                        route = "uncertain"
                else:
                    route = "uncertain"

                # Stage 2: Interpretation
                if route == "skip":
                    interpretation = {"status": "skipped", "reason": "screened-irrelevant"}
                else:
                    interp_questions = {k: questions[k] for k in ("scope", "sponsorship", "timing", "cpt", "opt") if k in questions}
                    if len(interp_questions) != 5:
                        interpretation = {"status": "unsupported", "reason": "unsupported-input"}
                    else:
                        try:
                            with contextlib.redirect_stdout(sys.stderr):
                                interp_output = agent.system_one(state_str, interp_questions, max_len=MAX_LEN, head_max_len=HEAD_LEN)
                            answers = {}
                            for key in ("scope", "sponsorship", "timing", "cpt", "opt"):
                                ans = interp_output["answers"][key]
                                prob = ans.get("answer_confidence")
                                if prob is None:
                                    prob = ans["probabilities"][ans["choice"]]
                                answers[key] = {"choice": ans["choice"], "probability": float(prob)}
                            interpretation = {"status": "interpreted", "answers": answers}
                        except Exception:
                            interpretation = {"status": "failed", "reason": "inference-failed"}

                block_results.append({
                    "id": b_id,
                    "screening": screening,
                    "route": route,
                    "interpretation": interpretation,
                })

            # Restore original ID order
            blocks_by_id = {br["id"]: br for br in block_results}
            ordered_blocks = [blocks_by_id[b["id"]] for b in req_blocks]

            # Recompute counts
            ctx_complete = 0
            ctx_missing = 0
            scr_success = 0
            scr_failed = 0
            scr_unsupported = 0
            int_interpreted = 0
            int_skipped = 0
            int_failed = 0
            int_unsupported = 0

            for i, b in enumerate(req_blocks):
                res = ordered_blocks[i]
                prev = derive_neighbor(req, b, -1)
                next_n = derive_neighbor(req, b, 1)
                if prev["status"] == "missing" or next_n["status"] == "missing":
                    ctx_missing += 1
                else:
                    ctx_complete += 1

                s_st = res["screening"]["status"]
                if s_st == "success":
                    scr_success += 1
                elif s_st == "failed":
                    scr_failed += 1
                elif s_st == "unsupported":
                    scr_unsupported += 1

                i_st = res["interpretation"]["status"]
                if i_st == "interpreted":
                    int_interpreted += 1
                elif i_st == "skipped":
                    int_skipped += 1
                elif i_st == "failed":
                    int_failed += 1
                elif i_st == "unsupported":
                    int_unsupported += 1

            is_partial = (ctx_missing > 0 or scr_failed > 0 or scr_unsupported > 0 or int_failed > 0 or int_unsupported > 0)
            proc_status = "partial" if is_partial else "complete"

            result = {
                "version": "laya-policy-v2",
                "engine": "laya",
                "model": MODEL + ("@" + REVISION if REVISION else ""),
                "configuration": {
                    "questionsSha256": config.get("questionsSha256") or questions_sha256,
                    "contextSha256": config.get("contextSha256") or context_sha256,
                    "parametersSha256": config.get("parametersSha256") or parameters_sha256,
                },
                "processing": {
                    "status": proc_status,
                    "inputCount": len(req_blocks),
                    "context": {"complete": ctx_complete, "missing": ctx_missing},
                    "screening": {"success": scr_success, "failed": scr_failed, "unsupported": scr_unsupported},
                    "interpretation": {
                        "interpreted": int_interpreted,
                        "skipped": int_skipped,
                        "failed": int_failed,
                        "unsupported": int_unsupported,
                    },
                },
                "blocks": ordered_blocks,
            }
            print(json.dumps(result, ensure_ascii=False), flush=True)

        except Exception as error:
            print(json.dumps({"error": "context-too-long" if str(error) == "context-too-long" else "inference-failed"}), flush=True)


if __name__ == "__main__":
    main()
