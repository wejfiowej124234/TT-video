"""B-484：governance & protocol consistency report 与 gate 比对。"""
from __future__ import annotations

from typing import Any

SCHEMA_GATE = "traveltrust_b484_governance_protocol_consistency_gate.v1"
SCHEMA_REP = "traveltrust_b484_governance_protocol_consistency_acceptance.v1"


def slo_violations(report: dict[str, Any], gate: dict[str, Any]) -> list[str]:
    reasons: list[str] = []
    if report.get("schema") != SCHEMA_REP:
        return ["REPORT_SCHEMA_MISMATCH"]
    if gate.get("schema") != SCHEMA_GATE:
        return ["GATE_SCHEMA_MISMATCH"]

    limits = gate.get("limits") or {}
    hard = gate.get("hard_requirements") or {}
    checks = report.get("checks") or {}

    oc = checks.get("on_chain_vs_off_chain") or {}
    if int(oc.get("drift_observations_count", 0)) > int(limits.get("max_drift_observations", 0)):
        reasons.append("GOVERNANCE_DRIFT_EXCEEDED")
    if hard.get("require_no_execution_drift") and int(oc.get("drift_observations_count", 0)) > 0:
        reasons.append("EXECUTION_DRIFT_FORBIDDEN")
    if hard.get("require_governance_inputs_hash_match") and not oc.get("governance_inputs_hash_match"):
        reasons.append("GOVERNANCE_INPUT_HASH_MISMATCH")

    gv = checks.get("governance_verifiability") or {}
    if int(gv.get("unverified_active_proposals", 0)) > int(limits.get("max_unverified_proposals", 0)):
        reasons.append("UNVERIFIED_PROPOSALS_EXCEEDED")
    if hard.get("require_governance_resolution_verifiable") and not gv.get("resolution_proof_bundle_valid"):
        reasons.append("GOVERNANCE_RESOLUTION_NOT_VERIFIABLE")

    pv = checks.get("parameter_version_traceability") or {}
    if int(pv.get("version_mismatch_count", 0)) > int(limits.get("max_parameter_version_mismatch", 0)):
        reasons.append("PARAMETER_VERSION_MISMATCH_EXCEEDED")
    if hard.get("require_parameter_version_traceable"):
        cv = str(pv.get("active_config_version_chain", "")).strip()
        dv = str(pv.get("active_config_version_db", "")).strip()
        if cv and dv and cv != dv:
            reasons.append("CHAIN_DB_PARAMETER_VERSION_DRIFT")

    ex = checks.get("execution_consistency") or {}
    if int(ex.get("distribution_pipeline_violations", 0)) > int(limits.get("max_distribution_violations", 0)):
        reasons.append("DISTRIBUTION_VIOLATIONS_EXCEEDED")
    if hard.get("require_api_db_projection_match") and not ex.get("api_db_governance_projection_match"):
        reasons.append("API_DB_GOVERNANCE_PROJECTION_MISMATCH")

    return reasons


def apply_verdict(report: dict[str, Any], gate: dict[str, Any]) -> dict[str, Any]:
    reasons = slo_violations(report, gate)
    out = dict(report)
    out["verdict"] = "PASS" if not reasons else "FAIL"
    out["fail_reasons"] = reasons
    return out
