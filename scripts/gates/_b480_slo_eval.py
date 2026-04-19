"""B-480：report.v1.json 与 b480 gate 阈值比对（finalize 与 check-b480-report-gate 共用）。"""
from __future__ import annotations

from typing import Any

EPS = 1e-9

SCHEMA_GATE = "traveltrust_b480_prod_fault_slo_gate.v1"
SCHEMA_REP = "traveltrust_b480_prod_fault_injection_acceptance.v1"


def _fail_reason_for_segment(segment_id: str) -> str:
    m = {
        "normal": "NORMAL_SLO_EXCEEDED",
        "fault_db_latency": "FAULT_DB_LATENCY_SLO_EXCEEDED",
        "fault_connection_refused": "FAULT_CONNECTION_REFUSED_SLO_EXCEEDED",
        "fault_network_jitter": "FAULT_NETWORK_JITTER_SLO_EXCEEDED",
        "recovery": "RECOVERY_SEGMENT_SLO_EXCEEDED",
    }
    return m.get(segment_id, "SEGMENT_SLO_EXCEEDED")


def slo_violations(report: dict[str, Any], gate: dict[str, Any]) -> list[str]:
    """仅 SLO 数值；不含 verdict / schema。"""
    reasons: list[str] = []
    if report.get("schema") != SCHEMA_REP:
        return ["REPORT_SCHEMA_MISMATCH"]
    if gate.get("schema") != SCHEMA_GATE:
        return ["GATE_SCHEMA_MISMATCH"]

    th_all = gate.get("slo_thresholds") or {}

    for seg in report.get("segments") or []:
        sid = seg.get("segment_id")
        if not isinstance(sid, str) or sid not in th_all:
            continue
        th = th_all[sid]
        if not isinstance(th, dict):
            continue
        seg_fail = False
        for key in ("http_error_ratio", "ratio_429", "ratio_5xx"):
            if key not in th:
                continue
            got = seg.get(key)
            if got is None:
                continue
            if float(got) > float(th[key]) + EPS:
                seg_fail = True
                break
        if not seg_fail and "max_pool_acquire_timeout_delta" in th:
            got = seg.get("pool_acquire_timeout_delta")
            if got is not None and float(got) > float(th["max_pool_acquire_timeout_delta"]) + EPS:
                seg_fail = True
        if seg_fail:
            reasons.append(_fail_reason_for_segment(sid))

    agg = report.get("aggregate") or {}
    raf = th_all.get("recovery_after_fault") or {}
    rsec = agg.get("recovery_time_sec")
    if raf.get("max_recovery_time_sec") is not None:
        if rsec is None:
            reasons.append("RECOVERY_TIME_UNKNOWN")
        elif float(rsec) > float(raf["max_recovery_time_sec"]) + EPS:
            reasons.append("RECOVERY_TIME_EXCEEDED")

    return reasons


def apply_verdict(report: dict[str, Any], gate: dict[str, Any]) -> dict[str, Any]:
    """据阈值写入 verdict / fail_reasons（finalize 用）。"""
    reasons = slo_violations(report, gate)
    out = dict(report)
    out["verdict"] = "PASS" if not reasons else "FAIL"
    out["fail_reasons"] = reasons
    return out
