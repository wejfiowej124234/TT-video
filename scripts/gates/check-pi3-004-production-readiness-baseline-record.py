#!/usr/bin/env python3
"""PI3-004 baseline shape gate."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ANCHOR = "PI3-004-PRODUCTION-READINESS-VERIFICATION-V1"
SCHEMA = "traveltrust_pi3_004_production_readiness_verification.v1"
ALLOWED = frozenset({"PLANNED", "PASS", "WAIVED"})


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    p = root / "evidence" / "pi3_004_production_readiness_verification" / "baseline_record.v1.json"
    if not p.is_file():
        print(f"check-pi3-004: missing {p.relative_to(root)}", file=sys.stderr)
        return 1
    data = json.loads(p.read_text(encoding="utf-8"))
    if data.get("schema") != SCHEMA:
        print("check-pi3-004: schema mismatch", file=sys.stderr)
        return 1
    st = data.get("status")
    if st not in ALLOWED:
        print(f"check-pi3-004: invalid status {st!r}", file=sys.stderr)
        return 1
    if st == "PASS":
        for k in ("report_json_path", "report_release_gate", "last_r003_production_run_utc"):
            if not data.get(k):
                print(f"check-pi3-004: status=PASS requires {k}", file=sys.stderr)
                return 1
        if data.get("report_release_gate") != "GO":
            print("check-pi3-004: status=PASS requires report_release_gate=GO", file=sys.stderr)
            return 1
    print(f"check-pi3-004: OK ({ANCHOR}) status={st}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
