#!/usr/bin/env python3
"""Apply browser walkthrough JSON to Manual UAT session (record PASS/FAIL per item)."""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--results",
        default=str(ROOT / "evidence/manual-uat/sessions/latest/browser-walkthrough-results.json"),
    )
    ap.add_argument("--session-dir", default="")
    args = ap.parse_args()
    results_path = Path(args.results)
    if not results_path.is_file():
        raise SystemExit(f"apply-manual-uat-browser-results: missing {results_path}")

    rows = json.loads(results_path.read_text(encoding="utf-8"))
    fails = 0
    for row in rows:
        cmd = [
            sys.executable,
            str(ROOT / "scripts/dev/record-manual-uat-ui.py"),
            "--id",
            row["id"],
            "--status",
            row["status"],
        ]
        if row.get("note"):
            cmd.extend(["--note", row["note"][:200]])
        if args.session_dir:
            cmd.extend(["--session-dir", args.session_dir])
        subprocess.run(cmd, cwd=ROOT, check=True)
        if row["status"] == "FAIL":
            fails += 1

    print(f"apply-manual-uat-browser-results: {len(rows)} items · {fails} FAIL")
    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(main())
