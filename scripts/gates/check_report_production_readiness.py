#!/usr/bin/env python3
"""
Strict production-readiness check for a final truth report.json.

Rules:
  - is_final_truth must be true
  - release_gate must be GO
  - summary FAIL/BLOCKED/NOT_RUN must be 0
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/gates/check_report_production_readiness.py <report.json>", file=sys.stderr)
        return 2
    p = Path(sys.argv[1])
    if not p.is_file():
        print(f"ERROR: report not found: {p}", file=sys.stderr)
        return 2
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"ERROR: invalid JSON: {e}", file=sys.stderr)
        return 1

    errs: list[str] = []
    if data.get("is_final_truth") is not True:
        errs.append("is_final_truth must be true")
    if data.get("release_gate") != "GO":
        errs.append("release_gate must be GO")
    summary = data.get("summary")
    if not isinstance(summary, dict):
        errs.append("summary must be object")
    else:
        for k in ("FAIL", "BLOCKED", "NOT_RUN"):
            if summary.get(k) != 0:
                errs.append(f"summary.{k} must be 0, got {summary.get(k)!r}")

    if errs:
        for e in errs:
            print(f"ERROR: {e}", file=sys.stderr)
        return 1
    print(f"check_report_production_readiness: OK {p}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
