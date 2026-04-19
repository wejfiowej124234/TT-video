#!/usr/bin/env python3
"""
B-480：将 report.v1.json 与 config/b480_prod_fault_slo_gate.v1.json 比对。
用法：python3 scripts/gates/check-b480-report-gate.py <report.v1.json>
stderr：FAIL_REASON 行；可选 WARN（恢复时间接近上限）。
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

_GATES = Path(__file__).resolve().parent
if str(_GATES) not in sys.path:
    sys.path.insert(0, str(_GATES))
from _b480_slo_eval import SCHEMA_GATE, slo_violations  # noqa: E402


def _emit_fail(reason: str) -> None:
    print(f"FAIL_REASON: {reason}", file=sys.stderr)


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    if len(sys.argv) < 2:
        print(f"usage: {sys.argv[0]} <report.v1.json>", file=sys.stderr)
        return 2
    rep_path = Path(sys.argv[1])
    gate_path = root / "config" / "b480_prod_fault_slo_gate.v1.json"
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
    if report.get("schema") != SCHEMA_REP:
        _emit_fail("REPORT_SCHEMA_MISMATCH")
        return 1

    if report.get("verdict") != "PASS":
        _emit_fail("REPORT_VERDICT_FAIL")
        print("check-b480-report-gate: verdict not PASS", file=sys.stderr)
        return 1

    reasons = slo_violations(report, gate)
    if reasons:
        for r in reasons:
            _emit_fail(r)
        return 1

    raf = (gate.get("slo_thresholds") or {}).get("recovery_after_fault") or {}
    max_r = raf.get("max_recovery_time_sec")
    agg = report.get("aggregate") or {}
    rsec = agg.get("recovery_time_sec")
    if max_r is not None and rsec is not None:
        warn_at = float(max_r) * 0.85
        if float(rsec) >= warn_at:
            print(
                f"WARN: RECOVERY_TIME_NEAR_LIMIT recovery_time_sec={rsec} (max={max_r})",
                file=sys.stderr,
            )

    print("check-b480-report-gate: OK (B-480 SLO gate)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
