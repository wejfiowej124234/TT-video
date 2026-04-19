"""B-485：user-verifiable transparency report 与 gate 比对。"""
from __future__ import annotations

from typing import Any

SCHEMA_GATE = "traveltrust_b485_user_verifiable_transparency_gate.v1"
SCHEMA_REP = "traveltrust_b485_user_verifiable_transparency_acceptance.v1"


def slo_violations(report: dict[str, Any], gate: dict[str, Any]) -> list[str]:
    reasons: list[str] = []
    if report.get("schema") != SCHEMA_REP:
        return ["REPORT_SCHEMA_MISMATCH"]
    if gate.get("schema") != SCHEMA_GATE:
        return ["GATE_SCHEMA_MISMATCH"]

    limits = gate.get("limits") or {}
    hard = gate.get("hard_requirements") or {}
    checks = report.get("checks") or {}

    art = checks.get("user_facing_artifacts") or {}
    if hard.get("require_downloadable_audit_snapshot") and not art.get("audit_snapshot_downloadable"):
        reasons.append("AUDIT_SNAPSHOT_NOT_USER_ACCESSIBLE")
    if hard.get("require_merkle_or_hash_proof_for_balances") and not art.get("merkle_or_hash_proof_for_user_balances"):
        reasons.append("BALANCE_PROOFS_NOT_EXPOSED")
    if hard.get("require_governance_execution_proof_pack") and not art.get("governance_execution_proof_pack_available"):
        reasons.append("GOVERNANCE_PROOF_PACK_MISSING")

    cov = checks.get("coverage") or {}
    if int(cov.get("unsupported_user_verification_gaps", 0)) > int(limits.get("max_unsupported_verification_gaps", 0)):
        reasons.append("USER_VERIFICATION_COVERAGE_INSUFFICIENT")

    vf = checks.get("verification_tooling") or {}
    if hard.get("require_documented_verifier_flow") and not vf.get("documented_independent_verifier_flow"):
        reasons.append("VERIFIER_FLOW_NOT_DOCUMENTED")
    if int(vf.get("proof_bundle_format_failures", 0)) > int(limits.get("max_proof_bundle_format_failures", 0)):
        reasons.append("PROOF_BUNDLE_FORMAT_FAILURES_EXCEEDED")

    lin = checks.get("internal_to_user_closure") or {}
    if hard.get("require_b482_b484_evidence_wired_to_user_surface") and not lin.get("b482_b484_evidence_linked_in_user_surface"):
        reasons.append("INTERNAL_EVIDENCE_NOT_WIRED_TO_USER_SURFACE")

    return reasons


def apply_verdict(report: dict[str, Any], gate: dict[str, Any]) -> dict[str, Any]:
    reasons = slo_violations(report, gate)
    out = dict(report)
    out["verdict"] = "PASS" if not reasons else "FAIL"
    out["fail_reasons"] = reasons
    return out
