# Repository structure

- `src/`: scanner, deterministic interpreter, vacancy headlines, frame coordination, overview recovery, and extension UI.
- `extension/`: manifest, popup, help/privacy pages, styles, and icons.
- `design/`: logo exploration history and the approved [SNS identity kit](design/logo-kit/GUIDE.md); active extension artwork lives in `extension/icons/`.
- `tests/`: TypeScript regression tests and authored browser fixtures.
- `scripts/`: build, package, browser, and deterministic evaluation tools.
- `evaluation/`: authored scenarios, exposed development reviews, source captures, and historical deterministic reports.
- `evaluation/live-2026-10-16/`: dated 30-posting installed-extension audit, case/selection logs, sanitized reviewer evidence, structured results, and a saved-record verifier; start with its [report](evaluation/live-2026-10-16/report.md).
- `docs/agents/`: domain, issue-tracker, and triage conventions.
- `server/`: deferred company-research backend; inactive in the extension.
- `release/`: packaging instructions, listing draft, screenshots, and generated archives.

Start with [README.md](README.md), [DECISION_LOGIC.md](DECISION_LOGIC.md), and [HANDOFF.md](HANDOFF.md). [PLAN.md](PLAN.md) records publication scope and remaining validation. Generated `dist/`, `test-results/`, local environments, and caches are ignored by Git.
