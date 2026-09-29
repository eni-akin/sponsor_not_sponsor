"""Persistent local inference worker. JSON lines on stdin/stdout; no job text logs."""
import contextlib
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


def main():
    # Keep model caches inside the project and make offline operation explicit.
    os.environ.setdefault("HF_HOME", os.path.abspath(".model-cache"))
    os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
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
        try:
            request = json.loads(line)
            blocks = request["request"]["blocks"]
            questions = request["questions"]
            results = []
            for index, block in enumerate(blocks):
                state = json.dumps({
                    "job_title": request["request"]["title"],
                    "employer": request["request"]["employer"],
                    "previous": blocks[index - 1]["text"] if index else "",
                    "TARGET": block["text"],
                    "next": blocks[index + 1]["text"] if index + 1 < len(blocks) else "",
                }, ensure_ascii=False)
                # Laya normally truncates state to fit. Reject instead: omitted policy text
                # must never yield a seemingly complete decision. Header + special tokens
                # fit in HEAD_LEN + 4 for the pinned runtime.
                tokens = encode_text(agent.tok, serialize_state(state).replace(agent.tok.mask_token, " "), add_special_tokens=False)["input_ids"]
                if len(tokens) + HEAD_LEN + 4 > MAX_LEN:
                    raise ValueError("context-too-long")
                with contextlib.redirect_stdout(sys.stderr):
                    output = agent.system_one(state, questions, max_len=MAX_LEN, head_max_len=HEAD_LEN)
                answers = {}
                for key in ("scope", "sponsorship", "timing", "cpt", "opt"):
                    answer = output["answers"][key]
                    # Use probability of the selected option, never entropy confidence.
                    probability = answer.get("answer_confidence")
                    if probability is None:
                        probability = answer["probabilities"][answer["choice"]]
                    answers[key] = {"choice": answer["choice"], "probability": probability}
                results.append({"id": block["id"], "answers": answers})
            print(json.dumps({"version": "laya-policy-v1", "engine": "laya", "model": MODEL + ("@" + REVISION if REVISION else ""), "blocks": results}), flush=True)
        except Exception as error:
            # Do not echo input, exception text, file paths, or job contents.
            print(json.dumps({"error": "context-too-long" if str(error) == "context-too-long" else "inference-failed"}), flush=True)


if __name__ == "__main__":
    main()
