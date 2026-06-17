#!/usr/bin/env python3
"""Cert #5 Finance / Treasury / Auditor three-role checks (Four-Ledger evidence chain)."""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

import sys
from pathlib import Path as _Path
sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "lib"))
from hat_r1_resolve import resolve_hat_r1_evid_dir, hat_r1_rel_path, hat_r1_stamp
sys.path.insert(0, str(ROOT / "scripts/release"))
from win_bash import bash_exe  # noqa: E402

DE_LEDGER = "0x2704566A6657DcbEEBB71e43cEca381f16E1a8Aa"
V2_TL = "0x904a6c4c6aab698afbf08ec6151d317c393520cc"
FOUR_LEDGER_STAMP = "20260616T084248Z"
CUTOVER_STAMP = "20260616T082259Z"

EVIDENCE = {
    "baseline": "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md",
    "gorp": "docs/runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md",
    "four_ledger_dir": f"evidence/GO_tt_country_pool_revenue_enterprise_hat/{FOUR_LEDGER_STAMP}",
    "cutover_drill": f"evidence/GO_tt_country_pool_revenue_enterprise_hat/cutover-drill/{CUTOVER_STAMP}",
    "hat_r1": hat_r1_rel_path(ROOT, resolve_hat_r1_evid_dir(ROOT)),
}


def read_text(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def check_four_ledger_pass() -> dict:
    fl_path = ROOT / EVIDENCE["four_ledger_dir"] / "four-ledger-reconcile.json"
    if not fl_path.is_file():
        return {"ok": False, "reason": "missing four-ledger-reconcile.json"}
    fl = json.loads(fl_path.read_text(encoding="utf-8"))
    ok = (
        fl.get("verdict") == "PASS"
        and fl.get("split_observed") is True
        and fl.get("page_bps_ok") is True
        and fl.get("global_treasury_timelock_match") is True
    )
    return {
        "ok": ok,
        "verdict": fl.get("verdict"),
        "split_observed": fl.get("split_observed"),
        "page_bps_ok": fl.get("page_bps_ok"),
        "global_treasury_timelock_match": fl.get("global_treasury_timelock_match"),
        "path": str(fl_path.relative_to(ROOT)).replace("\\", "/"),
    }


def check_evidence_anchors() -> dict:
    rows = []
    ok = True
    for name, rel in EVIDENCE.items():
        if name in ("baseline", "gorp"):
            continue
        p = ROOT / rel
        exists = p.is_dir()
        rows.append({"anchor": name, "path": rel, "exists": exists})
        ok = ok and exists
    fl_dir = ROOT / EVIDENCE["four_ledger_dir"]
    hat_report = fl_dir / "cp-revenue-hat-report.json"
    split_step = fl_dir / "step-03-split-4555/chain-read.json"
    cutover_logs = list((ROOT / EVIDENCE["cutover_drill"]).glob("exec-drill-split.log")) if ok else []
    return {
        "ok": ok
        and hat_report.is_file()
        and split_step.is_file()
        and len(cutover_logs) >= 1,
        "dirs": rows,
        "cp_revenue_hat_report": hat_report.is_file(),
        "split_4555_chain_read": split_step.is_file(),
        "cutover_split_log": len(cutover_logs) >= 1,
    }


def check_fee_router_orthogonal() -> dict:
    fcc = ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-FULL-COVERAGE-CERTIFICATION-REPORT.md"
    ok = False
    if fcc.is_file():
        text = fcc.read_text(encoding="utf-8")
        ok = "FeeRouter" in text and "45/55" in text
    return {"ok": ok, "ssot": str(fcc.relative_to(ROOT)).replace("\\", "/")}


def check_gorp_finance_walkthrough() -> dict:
    gorp = read_text(EVIDENCE["gorp"])
    wf = {f"W-F{i}": f"W-F{i}" in gorp for i in range(1, 6)}
    fee = check_fee_router_orthogonal()
    sections = {
        "gorp_05": "GORP-05" in gorp,
        "country_pool_2_5": "### 2.5 Country Pool" in gorp,
        "treasury_2_4": "### 2.4 Treasury" in gorp,
        "finance_op_2_6": "### 2.6 Finance Operator" in gorp,
        "four_ledger_3_6": "### 3.6 Four-Ledger 异常" in gorp,
        "split_net_profit": "splitNetProfit" in gorp,
        "funding_source": "fundingSource" in gorp,
        "fee_router_orthogonal": fee["ok"],
        "distribution_accrual": "accrual" in gorp.lower(),
        "forbid_admin_spend": "Admin POST" in gorp or "禁止：** Admin POST" in gorp,
    }
    return {
        "ok": all(wf.values()) and all(sections.values()),
        "w_f": wf,
        "sections": sections,
        "fee_router_ssot": fee,
    }


def build_finance_ops_flow_map() -> dict:
    return {
        "schema": "traveltrust.finance-ops-flow-map.v1",
        "phase": "②",
        "baseline": "GovFreeze V2 · DE NetProfit Ledger",
        "chain_id": 11155111,
        "nodes": [
            {
                "id": "fee_router",
                "label": "FeeRouter (escrow 65/20/15)",
                "role_read": ["Finance Op", "Auditor"],
                "role_write": [],
                "orthogonal_to": "country_pool_4555",
                "api_read": "GET /governance/fee-pool-aggregates · fee-router admin read",
            },
            {
                "id": "country_pool",
                "label": "Country Pool DE Ledger",
                "contract": DE_LEDGER,
                "role_read": ["Finance Op", "Treasury Op", "Auditor"],
                "role_write_batch": ["Treasury Op via Legacy TL", "Finance Op fundingSource EOA"],
                "epoch_flow": "openEpoch → recordAccrual → closeEpoch → fundLedgerForSplit → splitNetProfit",
            },
            {
                "id": "split_4555",
                "label": "45/55 Net Profit Split",
                "split": "45% steward vault · 55% globalTreasury (V2 Timelock)",
                "evidence": f"{EVIDENCE['four_ledger_dir']}/step-03-split-4555/",
                "finance_op": "four-ledger reconcile after split",
                "treasury_op": "Legacy TL batch execute + receipt archive",
            },
            {
                "id": "distribution_ledger",
                "label": "Distribution / Investor Accruals",
                "role_read": ["Finance Op", "Auditor", "Investor"],
                "role_write": ["Finance Op internal register · not P4 cash"],
                "api_read": "GET /governance/distribution-accruals",
            },
            {
                "id": "treasury_accounting",
                "label": "Treasury Accounting (Global · P4 path)",
                "treasury": V2_TL,
                "role_read": ["Finance Op", "Auditor"],
                "role_write": "Governor queue → V2 Timelock execute (not Admin API)",
            },
            {
                "id": "four_ledger",
                "label": "Four-Ledger Reconcile",
                "artifact": f"{EVIDENCE['four_ledger_dir']}/four-ledger-reconcile.json",
                "roles": {
                    "Finance Op": "run reconcile · triage §3.6 · monthly sign",
                    "Treasury Op": "post-split receipt + handoff",
                    "Auditor": "read-only trace · no fundingSource · no batch schedule",
                },
            },
        ],
        "recovery": {
            "four_ledger_fail": "GORP §3.6 — env/API/indexer triage",
            "split_not_funded": "GORP §3.3 — Finance approve + fund batch",
            "settlement_paused": "GORP §3.3 — Owner approved unpause batch",
        },
    }


def check_role_boundaries() -> dict:
    gorp = read_text(EVIDENCE["gorp"])
    rows = [
        {
            "role": "Finance Operator",
            "allow": "fundingSource approve/pull · accrual · four-ledger · distribution register read",
            "deny": "Timelock key · Admin POST treasury · solo 45% to EOA",
            "ok": "fundingSource" in gorp and "four-ledger" in gorp and "W-F3" in gorp,
        },
        {
            "role": "Treasury Operator",
            "allow": "Safe/Legacy TL batch · split execute coord · calldata archive",
            "deny": "fundingSource custody · bypass Finance fund step",
            "ok": "Treasury Operator" in gorp and "splitNetProfit" in gorp,
        },
        {
            "role": "Auditor",
            "allow": "four-ledger read · distribution/accrual read · audit trail",
            "deny": "fundingSource write · TL schedule · split batch",
            "ok": "audit" in gorp.lower() or "对账" in gorp,
        },
    ]
    return {"ok": all(r["ok"] for r in rows), "roles": rows}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--flow-map-out", default="")
    args = ap.parse_args()

    checks = {
        "four_ledger_pass": check_four_ledger_pass(),
        "evidence_anchors": check_evidence_anchors(),
        "gorp_finance_walkthrough": check_gorp_finance_walkthrough(),
        "three_role_boundaries": check_role_boundaries(),
    }
    flow = build_finance_ops_flow_map()

    out = Path(args.out)
    if not out.is_absolute():
        out = ROOT / out
    flow_out = Path(args.flow_map_out) if args.flow_map_out else out.parent / "FINANCE-OPS-FLOW-MAP.v1.json"
    if not flow_out.is_absolute():
        flow_out = ROOT / flow_out
    flow_out.parent.mkdir(parents=True, exist_ok=True)
    flow_out.write_text(json.dumps(flow, indent=2, ensure_ascii=False), encoding="utf-8")

    required = ["four_ledger_pass", "evidence_anchors", "gorp_finance_walkthrough", "three_role_boundaries"]
    verdict = "PASS" if all(checks[k]["ok"] for k in required) else "FAIL"

    payload = {
        "schema": "traveltrust.cert5-finance-three-role-matrix.v1",
        "verdict": verdict,
        "phase": "②",
        "baseline": "GovFreeze V2 Clean Baseline",
        "roles": ["Finance Operator", "Treasury Operator", "Auditor"],
        "checks": checks,
        "finance_ops_flow_map": str(flow_out.relative_to(ROOT)).replace("\\", "/"),
        "mtm_ids": ["CHK-CORE-15", "CHK-OPS-02", "CHK-ID-09", "CHK-FN-11"],
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"TT_CERT5_FINANCE_MATRIX: {verdict} out={out}")
    if verdict != "PASS":
        sys.exit(1)


if __name__ == "__main__":
    main()
