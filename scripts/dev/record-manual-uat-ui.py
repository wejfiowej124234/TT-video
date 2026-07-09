#!/usr/bin/env python3
"""Record Manual UAT UI checklist result for active session (C1–E2 · 27 items).

Usage:
  python scripts/dev/record-manual-uat-ui.py --id C1-1 --status PASS [--note "…"]
  python scripts/dev/record-manual-uat-ui.py --id C2-4 --status FAIL --note "白屏"

Updates sessions/latest/UI-CHECKLIST.md + SUMMARY.json and regenerates dashboard.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MUAT = ROOT / "evidence" / "manual-uat"
VALID = {"PASS", "FAIL", "BLOCKED"}


def latest_session() -> Path:
    latest = MUAT / "sessions" / "latest"
    if latest.is_symlink():
        return latest.resolve()
    stamps = sorted(
        (p for p in (MUAT / "sessions").iterdir() if p.is_dir() and p.name != "latest"),
        key=lambda p: p.name,
        reverse=True,
    )
    if not stamps:
        raise SystemExit("record-manual-uat-ui: no session directory")
    return stamps[0]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", required=True, help="Checklist ID e.g. C1-1")
    ap.add_argument("--status", required=True, choices=sorted(VALID))
    ap.add_argument("--note", default="")
    ap.add_argument("--session-dir", default="")
    args = ap.parse_args()

    sess = Path(args.session_dir) if args.session_dir else latest_session()
    summary_path = sess / "SUMMARY.json"
    checklist_path = sess / "UI-CHECKLIST.md"
    if not summary_path.is_file():
        raise SystemExit(f"record-manual-uat-ui: missing {summary_path}")

    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    items = summary.get("checklist_items", [])
    found = False
    for it in items:
        if it.get("id") == args.id:
            it["ui_status"] = args.status
            if args.note:
                it["note"] = args.note
            it["verified_utc"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            found = True
            break
    if not found:
        raise SystemExit(f"record-manual-uat-ui: unknown id {args.id}")

    counts = {"pass": 0, "fail": 0, "blocked": 0, "total": len(items) or 27}
    for it in items:
        st = it.get("ui_status", "PENDING")
        if st == "PASS":
            counts["pass"] += 1
        elif st == "FAIL":
            counts["fail"] += 1
        elif st == "BLOCKED":
            counts["blocked"] += 1
    summary["manual_test"] = counts
    summary["last_updated_utc"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    summary_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if checklist_path.is_file():
        text = checklist_path.read_text(encoding="utf-8")
        mark = "☑" if args.status == "PASS" else ("✗" if args.status == "FAIL" else "⊘")
        pattern = rf"(\| {re.escape(args.id)} \|[^\n]*\| )[□☑✗⊘]( \|)"
        new_text, n = re.subn(pattern, rf"\1{mark}\2", text, count=1)
        if n:
            checklist_path.write_text(new_text, encoding="utf-8")

    subprocess.run(
        [sys.executable, str(ROOT / "scripts/dev/generate-manual-uat-dashboard.py")],
        cwd=ROOT,
        check=True,
    )
    print(
        f"record-manual-uat-ui: {args.id}={args.status} · "
        f"{counts['pass']}/{counts['total']} PASS"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
