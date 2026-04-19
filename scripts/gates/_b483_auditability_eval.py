"""B-483：auditability & forensics report 与 gate 比对。"""
from __future__ import annotations

from typing import Any

SCHEMA_GATE = "traveltrust_b483_auditability_forensics_gate.v1"
SCHEMA_REP = "traveltrust_b483_auditability_forensics_acceptance.v1"


def slo_violations(report: dict[str, Any], gate: dict[str, Any]) -> list[str]:
    reasons: list[str] = []
    if report.get("schema") != SCHEMA_REP:
        return ["REPORT_SCHEMA_MISMATCH"]
    if gate.get("schema") != SCHEMA_GATE:
        return ["GATE_SCHEMA_MISMATCH"]

    limits = gate.get("limits") or {}
    hard = gate.get("hard_requirements") or {}
    checks = report.get("checks") or {}

    el = checks.get("append_only_event_log") or {}
    if hard.get("require_hash_chain_valid") and not el.get("hash_chain_valid"):
        reasons.append("HASH_CHAIN_INVALID")
    if hard.get("require_append_only_enforced") and not el.get("append_only_enforced"):
        reasons.append("APPEND_ONLY_NOT_ENFORCED")
    if int(el.get("tamper_detected_count", 0)) > int(limits.get("max_tamper_events", 0)):
        reasons.append("TAMPER_EVENTS_EXCEEDED")

    ss = checks.get("snapshot_signatures") or {}
    if int(ss.get("signature_verification_failures", 0)) > int(limits.get("max_signature_failures", 0)):
        reasons.append("SNAPSHOT_SIGNATURE_FAILURES_EXCEEDED")

    rp = checks.get("replay_verification") or {}
    if hard.get("require_reproducible_ledger_state") and not rp.get("reproducible_ledger_state"):
        reasons.append("LEDGER_STATE_NOT_REPRODUCIBLE")
    if int(rp.get("state_divergence_count", 0)) > int(limits.get("max_replay_divergence", 0)):
        reasons.append("REPLAY_DIVERGENCE_EXCEEDED")

    ap = checks.get("audit_proof") or {}
    if int(ap.get("proof_verification_failures", 0)) > int(limits.get("max_proof_verification_failures", 0)):
        reasons.append("AUDIT_PROOF_FAILURES_EXCEEDED")

    ci = checks.get("chain_integrity") or {}
    if hard.get("require_head_hash_matches_tip") and not ci.get("head_hash_matches_tip"):
        reasons.append("HEAD_HASH_MISMATCH")
    if hard.get("require_event_chain_complete") and not ci.get("event_chain_complete"):
        reasons.append("EVENT_CHAIN_INCOMPLETE")

    cov = float(ci.get("hash_chain_coverage_ratio", 1.0))
    min_cov = float(limits.get("min_hash_chain_coverage_ratio", 1.0))
    if cov + 1e-12 < min_cov:
        reasons.append("HASH_CHAIN_COVERAGE_INSUFFICIENT")

    return reasons


def apply_verdict(report: dict[str, Any], gate: dict[str, Any]) -> dict[str, Any]:
    reasons = slo_violations(report, gate)
    out = dict(report)
    out["verdict"] = "PASS" if not reasons else "FAIL"
    out["fail_reasons"] = reasons
    return out
