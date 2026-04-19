#!/usr/bin/env python3
"""B-476：Runbook 互指 b473-seal 与池观测门禁命令（防漂移）。"""
from __future__ import annotations

import sys
from pathlib import Path

ANCHOR = "B476-SEAL-POOL-OBS-DOC-V1"
NEEDLE = (
    "b473-seal-b460-tt-u03",
    "check-b476-meta-database-pool-contract.py",
    "check-b476-metrics-pg-pool-lines.py",
)


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    rb = root / "docs" / "runbook" / "TT-B476-PG-POOL-RUNTIME-OBS-BACKOFF-001.md"
    if not rb.is_file():
        print(f"check-b476-seal-doc: missing {rb}", file=sys.stderr)
        return 1
    t = rb.read_text(encoding="utf-8", errors="replace")
    for n in NEEDLE:
        if n not in t:
            print(f"check-b476-seal-doc: Runbook missing {n!r}", file=sys.stderr)
            return 1
    print(f"check-b476-seal-doc: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
