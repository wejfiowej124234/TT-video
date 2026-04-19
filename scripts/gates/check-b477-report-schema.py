#!/usr/bin/env python3
"""B-477: 机读验收报告 report.v1.json 最小 schema（回归门禁）。"""
from __future__ import annotations

import json
import sys
from pathlib import Path


ANCHOR = "B477-REPORT-SCHEMA-V1"

REQUIRED_TOP = ("schema", "verdict", "phases", "threshold_hits", "fix_suggestions")
REQUIRED_PHASES = ("baseline", "load", "post_load", "recovery")


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    if len(sys.argv) < 2:
        print(f"usage: {sys.argv[0]} <report.v1.json>", file=sys.stderr)
        return 2
    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"check-b477-report-schema: missing {path}", file=sys.stderr)
        return 1
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except json.JSONDecodeError as e:
        print(f"check-b477-report-schema: invalid JSON: {e}", file=sys.stderr)
        return 1

    if data.get("schema") != "traveltrust_b477_pg_pool_stress_recovery.v1":
        print("check-b477-report-schema: schema mismatch", file=sys.stderr)
        return 1
    for k in REQUIRED_TOP:
        if k not in data:
            print(f"check-b477-report-schema: missing key {k!r}", file=sys.stderr)
            return 1
    if data.get("verdict") not in ("PASS", "FAIL"):
        print("check-b477-report-schema: verdict must be PASS or FAIL", file=sys.stderr)
        return 1
    phases = data.get("phases")
    if not isinstance(phases, dict):
        print("check-b477-report-schema: phases must be object", file=sys.stderr)
        return 1
    for k in REQUIRED_PHASES:
        if k not in phases:
            print(f"check-b477-report-schema: phases missing {k!r}", file=sys.stderr)
            return 1
    bl = phases["baseline"]
    if not isinstance(bl, dict) or "metrics" not in bl:
        print("check-b477-report-schema: baseline.metrics required", file=sys.stderr)
        return 1
    rec = phases["recovery"]
    if not isinstance(rec, dict) or "recovery_time_ms" not in rec:
        print("check-b477-report-schema: recovery.recovery_time_ms required", file=sys.stderr)
        return 1

    print(f"check-b477-report-schema: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
