#!/usr/bin/env python3
"""
B-482：将 financial correctness report.v1.json 与 gate 比对。
用法：python3 scripts/gates/check-b482-report-gate.py <report.v1.json>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

_GATES = Path(__file__).resolve().parent
if str(_GATES) not in sys.path:
    sys.path.insert(0, str(_GATES))
from _b482_correctness_eval import SCHEMA_GATE, slo_violations  # noqa: E402


def _emit_fail(reason: str) -> None:
    print(f"FAIL_REASON: {reason}", file=sys.stderr)


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    if len(sys.argv) < 2:
        print(f"usage: {sys.argv[0]} <report.v1.json>", file=sys.stderr)
        return 2
    rep_path = Path(sys.argv[1])
    gate_path = root / "config" / "b482_financial_correctness_gate.v1.json"
    if not gate_path.is_file():
        _emit_fail("GATE_FILE_MISSING")
        return 1
    if not rep_path.is_file():
        _emit_fail("REPORT_FILE_MISSING")
        return 1
    gate = json.loads(gate_path.read_text(encoding="utf-8"))
    if gate.get("schema") != SCHEMA_GATE:
        _emit_fail("GATE_SCHEMA_MISMATCH")
        return 1
    report = json.loads(rep_path.read_text(encoding="utf-8"))

    if report.get("verdict") != "PASS":
        _emit_fail("REPORT_VERDICT_FAIL")
        return 1

    reasons = slo_violations(report, gate)
    if reasons:
        for r in reasons:
            _emit_fail(r)
        return 1

    print("check-b482-report-gate: OK (B-482 financial correctness gate)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
