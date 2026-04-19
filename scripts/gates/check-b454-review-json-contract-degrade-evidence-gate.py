#!/usr/bin/env python3
"""B-454: evidence replay runbook + replay script + 04/14 anchors + sample fixture."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ANCHOR = "B454-REVIEW-JSON-CONTRACT-DEGRADE-EVIDENCE-GATE-V1"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace")


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    four = root / "docs" / "spec" / "04-后端与API.md"
    fourteen = root / "docs" / "spec" / "14-合约-API-ABI-前后端对齐.md"
    runbook = root / "docs" / "runbook" / "TT-B454-REVIEW-JSON-CONTRACT-DEGRADE-EVIDENCE-REPLAY-001.md"
    ev_readme = root / "evidence" / "b454_review_json_contract_degrade" / "README.md"
    fixture = root / "evidence" / "b454_review_json_contract_degrade" / "fixtures" / "sample_events.ndjson"
    replay = root / "scripts" / "gates" / "replay-b454-review-json-contract-degrade-evidence.py"
    for p in (four, fourteen, runbook, ev_readme, fixture, replay):
        if not p.is_file():
            print(f"check-b454: missing {p.relative_to(root)}", file=sys.stderr)
            return 1
    t4 = _read(four)
    t14 = _read(fourteen)
    trb = _read(runbook)

    need_04 = (
        "B-454",
        "b454_",
        "replay-b454-review-json-contract-degrade-evidence.py",
        "review_json_contract_degrade",
        "check-b454-review-json-contract-degrade-evidence-gate.py",
        "TT-B454",
    )
    for s in need_04:
        if s not in t4:
            print(f"check-b454: 04 missing anchor {s!r}", file=sys.stderr)
            return 1

    if "B-454" not in t14 or "replay-b454" not in t14:
        print("check-b454: 14 missing B-454 or replay-b454", file=sys.stderr)
        return 1

    for s in ("§2", "replay_summary.json", "review_json_contract_degrade", "NDJSON"):
        if s not in trb:
            print(f"check-b454: runbook missing {s!r}", file=sys.stderr)
            return 1

    r = subprocess.run(
        [sys.executable, str(replay), str(fixture)],
        cwd=str(root),
        capture_output=True,
        text=True,
        check=False,
    )
    if r.returncode != 0:
        print(f"check-b454: replay failed: {r.stderr or r.stdout}", file=sys.stderr)
        return 1
    if "unknown_future_schema" not in r.stdout or "missing_meta" not in r.stdout:
        print("check-b454: replay stdout missing expected degrade keys", file=sys.stderr)
        return 1

    print(f"check-b454: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
