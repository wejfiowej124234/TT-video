#!/usr/bin/env python3
"""
B-479：将多实例 report.v1.json 与 config/b478_pg_pool_release_gate_thresholds.v1.json 比对（发布前硬验收）。

用法：python3 scripts/gates/check-b479-report-gate.py <report.v1.json>
环境：B479_REQUIRE_TWO_INSTANCES=1 时要求 params.instances 长度 ≥ 2（预发 / 生产门禁）。
stderr：FAIL_REASON 行 + 可选 WARN（近饱和灰区）。
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

SCHEMA_BASE = "traveltrust_b478_pg_pool_release_gate_thresholds.v1"
SCHEMA_REP = "traveltrust_b479_pg_pool_multi_instance_stress.v1"


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
        print(f"check-b479-report-gate: missing baseline {base_path}", file=sys.stderr)
        return 1
    if not rep_path.is_file():
        _emit_fail("REPORT_FILE_MISSING")
        print(f"check-b479-report-gate: missing report {rep_path}", file=sys.stderr)
        return 1
    baseline = json.loads(base_path.read_text(encoding="utf-8"))
    if baseline.get("schema") != SCHEMA_BASE:
        _emit_fail("BASELINE_SCHEMA_MISMATCH")
        print("check-b479-report-gate: baseline schema mismatch", file=sys.stderr)
        return 1
    th = baseline["thresholds"]
    report = json.loads(rep_path.read_text(encoding="utf-8"))
    if report.get("schema") != SCHEMA_REP:
        _emit_fail("REPORT_SCHEMA_MISMATCH")
        print("check-b479-report-gate: report schema mismatch", file=sys.stderr)
        return 1
    if report.get("verdict") != "PASS":
        _emit_fail("REPORT_VERDICT_FAIL")
        print("check-b479-report-gate: FAIL verdict", file=sys.stderr)
        return 1

    params = report.get("params") or {}
    inst = params.get("instances") or []
    if os.environ.get("B479_REQUIRE_TWO_INSTANCES", "").strip() in ("1", "true", "yes"):
        if len(inst) < 2:
            _emit_fail("INSUFFICIENT_API_INSTANCES")
            print(
                f"check-b479-report-gate: need >=2 instances (got {len(inst)}); unset B479_REQUIRE_TWO_INSTANCES for dev",
                file=sys.stderr,
            )
            return 1

    agg = report.get("aggregate") or {}
    max_peak = float(agg.get("max_peak_utilization_ratio", -1.0))
    max_ato = int(agg.get("max_acquire_timeout_delta", -1))
    rec_sec = agg.get("recovery_time_sec")
    err_ratio = float(agg.get("http_error_ratio", -1.0))

    if max_ato > int(th["max_acquire_timeout_delta"]):
        _emit_fail("ACQUIRE_TIMEOUT_EXCEEDED")
        print(
            f"check-b479-report-gate: max_acquire_timeout_delta {max_ato} > {th['max_acquire_timeout_delta']}",
            file=sys.stderr,
        )
        return 1
    if max_peak > float(th["peak_utilization_max"]) + 1e-9:
        _emit_fail("PEAK_UTILIZATION_EXCEEDED")
        print(
            f"check-b479-report-gate: max_peak_utilization_ratio {max_peak} > {th['peak_utilization_max']}",
            file=sys.stderr,
        )
        return 1
    if baseline.get("recovery_gate", {}).get("require_recovery_within_timeout") and rec_sec is None:
        _emit_fail("RECOVERY_TIMEOUT")
        print("check-b479-report-gate: recovery_time_sec null (recovery timeout)", file=sys.stderr)
        return 1
    if err_ratio > float(th["max_http_error_ratio"]) + 1e-9:
        _emit_fail("HTTP_ERROR_RATIO_EXCEEDED")
        print(
            f"check-b479-report-gate: http_error_ratio {err_ratio} > {th['max_http_error_ratio']}",
            file=sys.stderr,
        )
        return 1

    reasons = report.get("fail_reasons") or []
    if reasons:
        _emit_fail("REPORT_FAIL_REASONS_NONEMPTY")
        print(f"check-b479-report-gate: fail_reasons non-empty while verdict PASS: {reasons}", file=sys.stderr)
        return 1

    warn_u = float(th.get("warn_utilization_above", 0.95))
    if max_peak >= warn_u and max_peak <= float(th["peak_utilization_max"]) + 1e-9:
        print(
            f"WARN: NEAR_POOL_SATURATION max_peak_utilization_ratio={max_peak:.4f} (warn>={warn_u}, below fail threshold)",
            file=sys.stderr,
        )

    print("check-b479-report-gate: OK (report matches B-478 thresholds for multi-instance aggregate)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
