#!/usr/bin/env python3
"""Cert #4 Safe / Treasury / Finance three-role boundary checks (existing evidence only)."""
from __future__ import annotations

import argparse
import json
import re
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

V2_TL = "0x904a6c4c6aab698afbf08ec6151d317c393520cc"
LEGACY_TL = "0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f"
SAFE_ADMIN = "0x7c018293396325077bb4D039930dcEe11B7Fb1Cf"
DE_LEDGER = "0x2704566A6657DcbEEBB71e43cEca381f16E1a8Aa"

EVIDENCE_ANCHORS = {
    "govfreeze_v2_baseline": "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md",
    "cutover_drill": "evidence/GO_tt_country_pool_revenue_enterprise_hat/cutover-drill/20260616T082259Z",
    "four_ledger": "evidence/GO_tt_country_pool_revenue_enterprise_hat/20260616T084248Z",
    "hat_r1_phase_a": hat_r1_rel_path(ROOT, resolve_hat_r1_evid_dir(ROOT)),
    "gorp_runbook": "docs/runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md",
}


def read_text(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def check_baseline_addresses() -> dict:
    text = read_text(EVIDENCE_ANCHORS["govfreeze_v2_baseline"])
    needed = {
        "v2_timelock": V2_TL.lower(),
        "de_ledger": DE_LEDGER.lower(),
    }
    hits = {k: v in text.lower() for k, v in needed.items()}
    return {"ok": all(hits.values()), "hits": hits}


def check_evidence_dirs() -> dict:
    rows = []
    ok = True
    for name, rel in EVIDENCE_ANCHORS.items():
        if name in ("govfreeze_v2_baseline", "gorp_runbook"):
            continue
        p = ROOT / rel
        exists = p.is_dir()
        rows.append({"anchor": name, "path": rel, "exists": exists})
        ok = ok and exists
    cutover = ROOT / EVIDENCE_ANCHORS["cutover_drill"]
    exec_logs = list(cutover.glob("exec-*.log")) if cutover.is_dir() else []
    return {"ok": ok and len(exec_logs) >= 1, "dirs": rows, "cutover_exec_logs": len(exec_logs)}


def check_gorp_safe_timelock_treasury() -> dict:
    gorp = read_text(EVIDENCE_ANCHORS["gorp_runbook"])
    steps = [f"S-{i:02d}" for i in range(1, 7)]
    step_hits = {s: s in gorp for s in steps}
    sections = {
        "dual_timelock_2_2": "### 2.2 Timelock" in gorp,
        "treasury_2_4": "### 2.4 Treasury" in gorp,
        "finance_op_2_6": "### 2.6 Finance Operator" in gorp,
        "treasury_op_2_7": "### 2.7 Treasury Operator" in gorp,
        "execute_fail_3_1": "### 3.1 Execute 失败" in gorp,
        "treasury_mis_3_2": "### 3.2 Treasury 误转" in gorp,
        "gorp_06": "GORP-06" in gorp,
        "gorp_08": "GORP-08" in gorp,
        "rb_g_09": "RB-G-09" in gorp,
        "forbid_admin_api": "禁止：** Admin API" in gorp or "Admin POST" in gorp,
        "chain_id_sepolia": "11155111" in gorp,
    }
    ok = all(step_hits.values()) and all(sections.values())
    return {"ok": ok, "s_steps": step_hits, "sections": sections}


def build_dual_timelock_matrix() -> dict:
    return {
        "schema": "traveltrust.dual-timelock-ops-matrix.v1",
        "ssot": EVIDENCE_ANCHORS["gorp_runbook"] + " §2.2 · RB-G-09",
        "chain_id": 11155111,
        "rows": [
            {
                "path": "governance",
                "use": "P4 spend · params · Buyback proposals",
                "timelock": V2_TL,
                "timelock_label": "V2_TL",
                "schedule_by": "Governor queue",
                "execute_by": "public after delay",
                "roles": ["Treasury Operator", "Governor voters"],
            },
            {
                "path": "operations",
                "use": "NetProfit epoch · pause · cutover batches",
                "timelock": LEGACY_TL,
                "timelock_label": "Legacy_TL",
                "schedule_by": f"Safe admin ({SAFE_ADMIN})",
                "execute_by": "public after executeAfter",
                "roles": ["Treasury Operator", "Safe Signers", "Finance Operator review"],
            },
        ],
        "forbidden": [
            "mixed Legacy+V2 batch in one Safe tx",
            "Admin API treasury spend",
            "Finance Operator holding Timelock admin key",
            "Steward wallet scheduling",
        ],
        "recovery": {
            "too_early": "GORP §3.1 step 2 — wait EXECUTE_EARLIEST_UNIX",
            "call_failed": "GORP §3.1 step 3 — eth_call simulate, new schedule",
            "treasury_mis_transfer": "GORP §3.2 — stop batches, SEV-1, no Admin API recall",
        },
    }


def check_role_boundaries() -> dict:
    gorp = read_text(EVIDENCE_ANCHORS["gorp_runbook"])
    rows = [
        {
            "role": "Safe Signer",
            "allow": "N-of-M signature collection (S-04)",
            "deny": "solo schedule without quorum · Admin API",
            "ok": "N-of-M" in gorp and "Signers" in gorp,
        },
        {
            "role": "Treasury Operator",
            "allow": "Safe calldata draft · Legacy TL schedule/execute coord (S-01～S-06)",
            "deny": "mixed TL batch · unallowlisted target",
            "ok": "Treasury Operator" in gorp and "禁止" in gorp and "混 batch" in gorp,
        },
        {
            "role": "Finance Operator",
            "allow": "fundingSource.approve · accrual · four-ledger reconcile",
            "deny": "Timelock key · Admin POST spend · bypass Governor spend",
            "ok": "fundingSource" in gorp and "无** Timelock key" in gorp and "禁止：** Admin POST" in gorp,
        },
    ]
    return {"ok": all(r["ok"] for r in rows), "roles": rows}


def run_assert_baseline_if_configured() -> dict:
    env_file = ROOT / "scripts/dev/.env.phase2-chain-deploy.local"
    script = ROOT / "scripts/dev/assert-gov-freeze-v2-active-baseline-only.sh"
    if not env_file.is_file():
        return {"ok": True, "skipped": True, "reason": "no .env.phase2-chain-deploy.local"}
    p = subprocess.run(
        [bash_exe(), str(script)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return {
        "ok": p.returncode == 0,
        "skipped": False,
        "exit_code": p.returncode,
        "stdout_tail": "\n".join(p.stdout.splitlines()[-3:]),
        "stderr_tail": "\n".join(p.stderr.splitlines()[-3:]),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--matrix-out", default="")
    args = ap.parse_args()

    checks = {
        "baseline_addresses": check_baseline_addresses(),
        "evidence_anchors": check_evidence_dirs(),
        "gorp_safe_timelock_treasury": check_gorp_safe_timelock_treasury(),
        "three_role_boundaries": check_role_boundaries(),
        "assert_govfreeze_baseline_only": run_assert_baseline_if_configured(),
    }
    matrix = build_dual_timelock_matrix()
    out = Path(args.out)
    if not out.is_absolute():
        out = ROOT / out
    matrix_out = Path(args.matrix_out) if args.matrix_out else out.parent / "DUAL-TIMELOCK-OPS-MATRIX.v1.json"
    if not matrix_out.is_absolute():
        matrix_out = ROOT / matrix_out
    matrix_out.parent.mkdir(parents=True, exist_ok=True)
    matrix_out.write_text(json.dumps(matrix, indent=2, ensure_ascii=False), encoding="utf-8")

    required = [
        "baseline_addresses",
        "evidence_anchors",
        "gorp_safe_timelock_treasury",
        "three_role_boundaries",
    ]
    hard_fail = any(not checks[k]["ok"] for k in required)
    soft = checks["assert_govfreeze_baseline_only"]
    if not soft.get("skipped") and not soft.get("ok"):
        hard_fail = True
    verdict = "FAIL" if hard_fail else "PASS"

    payload = {
        "schema": "traveltrust.cert4-safe-three-role-matrix.v1",
        "verdict": verdict,
        "phase": "②",
        "baseline": "GovFreeze V2 Clean Baseline",
        "roles": ["Safe Signer", "Treasury Operator", "Finance Operator"],
        "checks": checks,
        "dual_timelock_matrix": str(matrix_out.relative_to(ROOT)).replace("\\", "/"),
        "mtm_ids": ["CHK-CORE-17", "CHK-OPS-03", "CHK-ID-10", "CHK-SC-12"],
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"TT_CERT4_SAFE_MATRIX: {verdict} out={out}")
    if verdict != "PASS":
        sys.exit(1)


if __name__ == "__main__":
    main()
