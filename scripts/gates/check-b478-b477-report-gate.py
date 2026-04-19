#!/usr/bin/env python3
"""
B-478：将 B-477 report.v1.json 与 config/b478_pg_pool_release_gate_thresholds.v1.json 比对（发布前硬验收）。
用法：python3 scripts/gates/check-b478-b477-report-gate.py <report.v1.json>
退出码 0 = 报告满足基线；非 0 = 不满足。stderr：FAIL_REASON 行 + 可选 WARN。
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

SCHEMA_BASE = "traveltrust_b478_pg_pool_release_gate_thresholds.v1"
SCHEMA_REP = "traveltrust_b477_pg_pool_stress_recovery.v1"


def _emit_fail(reason: str) -> None:
    print(f"FAIL_REASON: {reason}", file=sys.stderr)


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    if len(sys.argv) < 2:
        print(f"usage: {sys.argv[0]} <report.v1.json>", file=sys.stderr)
        return 2
    rep_path = Path(sys.argv[1])
    base_path = root / "config" / "b478_pg_pool_release_gate_thresholds.v1.json"
    if not base_path.is_file():
        _emit_fail("BASELINE_FILE_MISSING")
        print(f"check-b478-b477-report-gate: missing baseline {base_path}", file=sys.stderr)
        return 1
    if not rep_path.is_file():
        _emit_fail("REPORT_FILE_MISSING")
        print(f"check-b478-b477-report-gate: missing report {rep_path}", file=sys.stderr)
        return 1
    baseline = json.loads(base_path.read_text(encoding="utf-8"))
    if baseline.get("schema") != SCHEMA_BASE:
        _emit_fail("BASELINE_SCHEMA_MISMATCH")
        print("check-b478-b477-report-gate: baseline schema mismatch", file=sys.stderr)
        return 1
    th = baseline["thresholds"]
    report = json.loads(rep_path.read_text(encoding="utf-8"))
    if report.get("schema") != SCHEMA_REP:
        _emit_fail("REPORT_SCHEMA_MISMATCH")
        print("check-b478-b477-report-gate: report schema mismatch", file=sys.stderr)
        return 1
    if report.get("verdict") != "PASS":
        _emit_fail("REPORT_VERDICT_FAIL")
        print("check-b478-b477-report-gate: FAIL verdict", file=sys.stderr)
        return 1
    phases = report.get("phases") or {}
    post = phases.get("post_load") or {}
    deltas = post.get("deltas") or {}
    d_ato = int(deltas.get("acquire_timeout_total", -1))
    d_slow = int(deltas.get("slow_acquire_total", -1))
    peak = float(deltas.get("peak_utilization_ratio", -1.0))
    if d_slow > int(th["max_slow_acquire_delta"]):
        _emit_fail("SLOW_ACQUIRE_EXCEEDED")
        print(
            f"check-b478-b477-report-gate: slow_acquire_delta {d_slow} > {th['max_slow_acquire_delta']}",
            file=sys.stderr,
        )
        return 1
    if d_ato > int(th["max_acquire_timeout_delta"]):
        _emit_fail("ACQUIRE_TIMEOUT_EXCEEDED")
        print(
            f"check-b478-b477-report-gate: acquire_timeout_delta {d_ato} > {th['max_acquire_timeout_delta']}",
            file=sys.stderr,
        )
        return 1
    if peak > float(th["peak_utilization_max"]) + 1e-9:
        _emit_fail("PEAK_UTILIZATION_EXCEEDED")
        print(f"check-b478-b477-report-gate: peak_utilization {peak} > {th['peak_utilization_max']}", file=sys.stderr)
        return 1
    rec = phases.get("recovery") or {}
    rms = rec.get("recovery_time_ms")
    if baseline.get("recovery_gate", {}).get("require_recovery_within_timeout") and rms is None:
        _emit_fail("RECOVERY_TIMEOUT")
        print("check-b478-b477-report-gate: recovery_time_ms null (recovery timeout)", file=sys.stderr)
        return 1
    load = phases.get("load") or {}
    err_ratio = float(load.get("http_error_ratio", 0.0))
    if err_ratio > float(th["max_http_error_ratio"]) + 1e-9:
        _emit_fail("HTTP_ERROR_RATIO_EXCEEDED")
        print(
            f"check-b478-b477-report-gate: http_error_ratio {err_ratio} > {th['max_http_error_ratio']}",
            file=sys.stderr,
        )
        return 1
    rp = report.get("params") or {}
    for key in (
        "max_acquire_timeout_delta",
        "max_slow_acquire_delta",
        "peak_utilization_max",
        "recovery_target_util",
        "recovery_timeout_sec",
        "recovery_poll_ms",
        "max_http_error_ratio",
    ):
        if key in th and key in rp:
            bv, rv = th[key], rp[key]
            if isinstance(bv, int):
                if int(rv) != int(bv):
                    _emit_fail("PARAM_MISMATCH")
                    print(f"check-b478-b477-report-gate: params.{key} {rv} != baseline {bv}", file=sys.stderr)
                    return 1
            else:
                if abs(float(rv) - float(bv)) > 1e-9:
                    _emit_fail("PARAM_MISMATCH")
                    print(f"check-b478-b477-report-gate: params.{key} {rv} != baseline {bv}", file=sys.stderr)
                    return 1

    warn_u = float(th.get("warn_utilization_above", 0.95))
    if peak >= warn_u and peak <= float(th["peak_utilization_max"]) + 1e-9:
        print(
            f"WARN: NEAR_POOL_SATURATION peak_utilization_ratio={peak:.4f} (warn>={warn_u}, below fail threshold)",
            file=sys.stderr,
        )

    print("check-b478-b477-report-gate: OK (report matches B-478 baseline)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
