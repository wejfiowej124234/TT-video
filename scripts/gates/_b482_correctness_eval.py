"""B-482：financial correctness report 与 gate 比对。"""
from __future__ import annotations

from typing import Any

EPS = 1e-9

SCHEMA_GATE = "traveltrust_b482_financial_correctness_gate.v1"
SCHEMA_REP = "traveltrust_b482_financial_correctness_acceptance.v1"


def _wei_to_int(s: str) -> int:
    t = str(s).strip().replace("_", "")
    if not t:
        return 0
    try:
        return int(t, 10)
    except ValueError:
        return 0


def slo_violations(report: dict[str, Any], gate: dict[str, Any]) -> list[str]:
    reasons: list[str] = []
    if report.get("schema") != SCHEMA_REP:
        return ["REPORT_SCHEMA_MISMATCH"]
    if gate.get("schema") != SCHEMA_GATE:
        return ["GATE_SCHEMA_MISMATCH"]

    limits = gate.get("limits") or {}
    hard = gate.get("hard_requirements") or {}
    checks = report.get("checks") or {}

    lr = checks.get("ledger_reconciliation") or {}
    ur = int(lr.get("unreconciled_rows", 0))
    if ur > int(limits.get("max_unreconciled_rows", 0)):
        reasons.append("LEDGER_UNRECONCILED_EXCEEDED")
    mm = int(lr.get("chain_vs_db_mismatch_count", 0))
    if mm > int(limits.get("max_chain_vs_db_mismatch_count", 0)):
        reasons.append("CHAIN_DB_MISMATCH_EXCEEDED")

    fd = str(lr.get("fund_discrepancy_wei", "0"))
    if hard.get("fund_discrepancy_wei_must_equal") is not None:
        exp = str(hard["fund_discrepancy_wei_must_equal"])
        if _wei_to_int(fd) != _wei_to_int(exp):
            reasons.append("FUND_DISCREPANCY_NONZERO")
    elif _wei_to_int(fd) > _wei_to_int(str(limits.get("max_fund_discrepancy_wei", "0"))):
        reasons.append("FUND_DISCREPANCY_EXCEEDED")

    idem = checks.get("idempotency") or {}
    iv = int(idem.get("violations_count", 0))
    if iv > int(limits.get("max_idempotency_violations", 0)):
        reasons.append("IDEMPOTENCY_VIOLATIONS_EXCEEDED")

    dup = checks.get("duplicate_or_lost_tx") or {}
    dup_n = int(dup.get("duplicate_execution_count", 0))
    lost_n = int(dup.get("lost_transaction_count", 0))
    if hard.get("duplicate_financial_execution_must_be_zero") and dup_n > 0:
        reasons.append("DUPLICATE_FINANCIAL_EXECUTION_FORBIDDEN")
    elif dup_n > int(limits.get("max_duplicate_executions", 0)):
        reasons.append("DUPLICATE_EXECUTION_EXCEEDED")
    if hard.get("lost_transaction_must_be_zero") and lost_n > 0:
        reasons.append("LOST_TRANSACTION_FORBIDDEN")
    elif lost_n > int(limits.get("max_lost_transactions", 0)):
        reasons.append("LOST_TRANSACTION_EXCEEDED")

    fork = checks.get("state_fork") or {}
    fk = int(fork.get("observed_fork_count", 0))
    if hard.get("state_fork_must_be_zero") and fk > 0:
        reasons.append("STATE_FORK_FORBIDDEN")
    elif fk > int(limits.get("max_state_fork_observations", 0)):
        reasons.append("STATE_FORK_EXCEEDED")

    ec = checks.get("eventual_consistency_proof") or {}
    lag = ec.get("max_replication_lag_sec")
    catch = ec.get("event_log_catchup_within_sec")
    if lag is not None and float(lag) > float(limits.get("max_replication_lag_sec", 1e18)) + EPS:
        reasons.append("REPLICATION_LAG_EXCEEDED")
    if catch is not None and float(catch) > float(limits.get("max_event_log_catchup_sec", 1e18)) + EPS:
        reasons.append("EVENT_LOG_CATCHUP_EXCEEDED")

    return reasons


def apply_verdict(report: dict[str, Any], gate: dict[str, Any]) -> dict[str, Any]:
    reasons = slo_violations(report, gate)
    out = dict(report)
    out["verdict"] = "PASS" if not reasons else "FAIL"
    out["fail_reasons"] = reasons
    return out
