"""B-481：report.v1.json 与 b481 gate 阈值比对（finalize 与 check-b481-report-gate 共用）。"""
from __future__ import annotations

from typing import Any

EPS = 1e-9

SCHEMA_GATE = "traveltrust_b481_multi_region_dr_slo_gate.v1"
SCHEMA_REP = "traveltrust_b481_multi_region_dr_acceptance.v1"


def _fail_reason_for_segment(segment_id: str) -> str:
    m = {
        "normal_single_region": "NORMAL_SINGLE_REGION_SLO_EXCEEDED",
        "fault_whole_node": "FAULT_WHOLE_NODE_SLO_EXCEEDED",
        "fault_whole_az": "FAULT_WHOLE_AZ_SLO_EXCEEDED",
        "fault_whole_region": "FAULT_WHOLE_REGION_SLO_EXCEEDED",
        "failover_traffic_switch": "FAILOVER_TRAFFIC_SWITCH_SLO_EXCEEDED",
        "recovery_steady": "RECOVERY_STEADY_SLO_EXCEEDED",
    }
    return m.get(segment_id, "SEGMENT_SLO_EXCEEDED")


def slo_violations(report: dict[str, Any], gate: dict[str, Any]) -> list[str]:
    reasons: list[str] = []
    if report.get("schema") != SCHEMA_REP:
        return ["REPORT_SCHEMA_MISMATCH"]
    if gate.get("schema") != SCHEMA_GATE:
        return ["GATE_SCHEMA_MISMATCH"]

    th_all = gate.get("slo_thresholds") or {}
    agg_limits = th_all.get("aggregate_limits") or {}

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
        if not seg_fail and "replication_lag_sec_max" in th:
            got = seg.get("replication_lag_sec_max_observed")
            if got is not None and float(got) > float(th["replication_lag_sec_max"]) + EPS:
                seg_fail = True
        if not seg_fail and "p95_latency_ms_max" in th:
            got = seg.get("p95_latency_ms")
            if got is not None and float(got) > float(th["p95_latency_ms_max"]) + EPS:
                seg_fail = True
        if seg_fail:
            reasons.append(_fail_reason_for_segment(sid))

    agg = report.get("aggregate") or {}
    if agg_limits.get("max_failover_time_sec") is not None:
        ft = agg.get("failover_time_sec")
        if ft is None:
            reasons.append("FAILOVER_TIME_UNKNOWN")
        elif float(ft) > float(agg_limits["max_failover_time_sec"]) + EPS:
            reasons.append("FAILOVER_TIME_EXCEEDED")

    if agg_limits.get("max_replication_lag_sec_observed") is not None:
        lag = agg.get("max_replication_lag_sec_observed")
        if lag is None:
            reasons.append("REPLICATION_LAG_UNKNOWN")
        elif float(lag) > float(agg_limits["max_replication_lag_sec_observed"]) + EPS:
            reasons.append("REPLICATION_LAG_EXCEEDED")

    if agg_limits.get("max_rpo_sec_observed") is not None:
        rpo = agg.get("rpo_sec_observed")
        if rpo is None:
            reasons.append("RPO_UNKNOWN")
        elif float(rpo) > float(agg_limits["max_rpo_sec_observed"]) + EPS:
            reasons.append("RPO_EXCEEDED")

    return reasons


def apply_verdict(report: dict[str, Any], gate: dict[str, Any]) -> dict[str, Any]:
    reasons = slo_violations(report, gate)
    out = dict(report)
    out["verdict"] = "PASS" if not reasons else "FAIL"
    out["fail_reasons"] = reasons
    return out
