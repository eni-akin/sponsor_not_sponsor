#!/usr/bin/env python3
"""Verify recovery sidecar capture bytes and evidence fragments; no corpus writes."""
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "evaluation/laya-training"


class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hidden = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style"}:
            self.hidden += 1

    def handle_endtag(self, tag):
        if tag in {"script", "style"}:
            self.hidden -= 1

    def handle_data(self, text):
        if not self.hidden:
            self.parts.append(text)


def text(path):
    parser = VisibleText()
    parser.feed(path.read_text())
    return " ".join(" ".join(parser.parts).split())


def check():
    data = json.loads((BASE / "provenance-recovery-candidates-2026-10-08.json").read_text())
    source = json.loads((BASE / "normalized-submissions-2026-10-08.json").read_text())["datasets"]["training"]["recordsData"]
    for row in data["recordsData"]:
        if row["capturePath"] is None:
            continue
        path = BASE / row["capturePath"]
        assert hashlib.sha256(path.read_bytes()).hexdigest() == row["sourceCaptureSha256"], row["id"]
        actual = text(path)
        evidence = source[int(row["id"]) - 1]["text"]
        fragments = evidence.split("...")
        cursor = 0
        for fragment in fragments:
            normalized = " ".join(html.unescape(fragment).split())
            at = actual.find(normalized, cursor)
            assert at >= 0, f"{row['id']}: supplied evidence fragment absent"
            cursor = at + len(normalized)
        assert not row["trainingReady"] and not row["originalCaptureRecovered"]
    return data


if __name__ == "__main__":
    result = check()
    print("Verified", sum(row["capturePath"] is not None for row in result["recordsData"]), "raw recovery captures; completeness remains pending")
