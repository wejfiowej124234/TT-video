#!/usr/bin/env python3
"""Record Testnet Sign-off checklist item status."""
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
VALID = {"PASS", "FAIL", "BLOCKED", "PENDING", "PARTIAL"}


def latest_testnet_session() -> Path:
    sessions = MUAT / "sessions"
    for p in sorted(sessions.iterdir(), key=lambda x: x.name, reverse=True):
        if not p.is_dir() or p.name == "latest":
            continue
        s = p / "SUMMARY.json"
        if s.is_file():
            data = json.loads(s.read_text(encoding="utf-8"))
            if data.get("track") == "testnet-signoff":
                return p
    raise SystemExit("record-testnet-signoff-item: no testnet-signoff session")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", required=True)
    ap.add_argument("--status", required=True, choices=sorted(VALID))
    ap.add_argument("--note", default="")
    ap.add_argument("--session-dir", default="")
    args = ap.parse_args()

    sess = Path(args.session_dir) if args.session_dir else latest_testnet_session()
    summary_path = sess / "SUMMARY.json"
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    items = summary.get("checklist_items", [])
    found = False
    for it in items:
        if it.get("id") == args.id:
            it["status"] = args.status
            if args.note:
                it["note"] = args.note
            it["verified_utc"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            found = True
            break
    if not found:
        raise SystemExit(f"unknown id {args.id}")

    counts = {"pass": 0, "fail": 0, "blocked": 0, "partial": 0, "total": len(items)}
    for it in items:
        st = it.get("status", "PENDING")
        if st == "PASS":
            counts["pass"] += 1
        elif st == "FAIL":
            counts["fail"] += 1
        elif st == "BLOCKED":
            counts["blocked"] += 1
        elif st == "PARTIAL":
            counts["partial"] += 1
    summary["testnet_signoff"] = counts
    summary["last_updated_utc"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    summary_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    cl = sess / "TESTNET-CHECKLIST.md"
    if cl.is_file():
        text = cl.read_text(encoding="utf-8")
        mark = (
            "☑" if args.status == "PASS"
            else ("◐" if args.status == "PARTIAL"
            else ("✗" if args.status == "FAIL"
            else ("⊘" if args.status == "BLOCKED" else "□")))
        )
        pattern = rf"(\| {re.escape(args.id)} \|[^\n]*\| )[^\|]+( \| {mark} \|)"
        # update status column and checkbox
        text2, n = re.subn(
            rf"(\| {re.escape(args.id)} \|[^\n]*\| `[^`]+` \| )[^\|]+( \| )[□☑✗⊘]( \|)",
            rf"\1{args.status}\2{mark}\3",
            text,
            count=1,
        )
        if n:
            cl.write_text(text2, encoding="utf-8")

    subprocess.run(
        [sys.executable, str(ROOT / "scripts/dev/generate-manual-uat-dashboard.py")],
        cwd=ROOT,
        check=True,
    )
    print(f"record-testnet-signoff-item: {args.id}={args.status} · {counts['pass']}/{counts['total']} PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
