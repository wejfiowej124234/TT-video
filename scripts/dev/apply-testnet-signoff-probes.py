#!/usr/bin/env python3
"""Apply probe JSONL to testnet signoff session + record PASS/FAIL items."""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--session-dir", required=True)
    ap.add_argument("--probes", required=True)
    args = ap.parse_args()
    rows = []
    for line in Path(args.probes).read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    for row in rows:
        cmd = [
            sys.executable,
            str(ROOT / "scripts/dev/record-testnet-signoff-item.py"),
            "--session-dir",
            args.session_dir,
            "--id",
            row["id"],
            "--status",
            row["status"],
        ]
        if row.get("note"):
            cmd.extend(["--note", row["note"][:200]])
        subprocess.run(cmd, cwd=ROOT, check=True)
    print(f"apply-testnet-signoff-probes: {len(rows)} items")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
