#!/usr/bin/env python3
"""Cert #6 Phase B unpause matrix checks (HAT-R1 · dual Timelock · GORP evidence chain)."""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

sys.path.insert(0, str(ROOT / "scripts" / "dev" / "lib"))
from hat_r1_resolve import resolve_hat_r1_evid_dir, hat_r1_rel_path, hat_r1_stamp

sys.path.insert(0, str(ROOT / "scripts/release"))
from win_bash import bash_exe  # noqa: E402

try:
    HAT_DIR_PATH = resolve_hat_r1_evid_dir(ROOT)
    HAT_STAMP = hat_r1_stamp(HAT_DIR_PATH)
    HAT_DIR = hat_r1_rel_path(ROOT, HAT_DIR_PATH)
except FileNotFoundError:
    HAT_DIR_PATH = ROOT / "evidence/GO_hat_r1_sepolia/unknown"
    HAT_STAMP = "unknown"
    HAT_DIR = "evidence/GO_hat_r1_sepolia/unknown"

V2_TL = "0x904a6c4c6aab698afbf08ec6151d317c393520cc"
LEGACY_TL = "0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f"
GOVERNOR = "0x847b00ddb6ffed71812abc358a407dad4b099fcb"

EVIDENCE = {
    "baseline": "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md",
    "gorp": "docs/runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md",
    "hat_r1": HAT_DIR,
    "four_ledger": "evidence/GO_tt_country_pool_revenue_enterprise_hat/20260616T084248Z",
    "enterprise_hat": "evidence/GO_tt_governance_enterprise_hat/l9-recheck/20260616T084529Z",
}


def read_text(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def check_hat_phase_a() -> dict:
    hat_dir = ROOT / EVIDENCE["hat_r1"]
    eta_path = hat_dir / "EXECUTE_EARLIEST_UNIX.txt"
    report_path = hat_dir / f"hat-r1-report-{HAT_STAMP}.json"
    if not eta_path.is_file() or not report_path.is_file():
        return {"ok": False, "reason": "missing Phase A ETA or report"}
    eta = int(eta_path.read_text(encoding="utf-8").strip())
    report = json.loads(report_path.read_text(encoding="utf-8"))
    now = int(time.time())
    steps_ok = all(
        (hat_dir / step).is_dir()
        for step in (
            "step-04-proposal-create",
            "step-05-vote",
            "step-06-queue",
        )
    )
    ok = (
        report.get("verdict") == "PASS"
        and report.get("phase") == "a"
        and report.get("execute_earliest_unix") == str(eta)
        and steps_ok
    )
    return {
        "ok": ok,
        "verdict": report.get("verdict"),
        "execute_earliest_unix": eta,
        "timelock_elapsed": now >= eta,
        "remaining_seconds": max(0, eta - now),
        "queue_tx": report.get("steps", {}).get("step-06-queue"),
    }


def run_phase_b_probe(paused: str, dry_run: bool = True) -> dict:
    env = os.environ.copy()
    env["HAT_R1_PHASE_B_PAUSED"] = paused
    env["HAT_R1_EVID_DIR"] = str(ROOT / EVIDENCE["hat_r1"])
    cmd = [bash_exe(), str(ROOT / "scripts/dev/run-hat-r1-phase-b-when-ready.sh")]
    if dry_run:
        cmd.append("--dry-run")
    p = subprocess.run(
        cmd,
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
    )
    out = p.stdout + p.stderr
    summary = ""
    for line in out.splitlines():
        if "TT_HAT_R1_PHASE_B_SUMMARY:" in line:
            summary = line.split(":", 1)[-1].strip()
    return {
        "paused": paused,
        "exit_code": p.returncode,
        "summary": summary,
        "stdout_tail": "\n".join(out.splitlines()[-6:]),
    }


def check_unpause_gate() -> dict:
    blocked = run_phase_b_probe("1", dry_run=False)
    unpaused = run_phase_b_probe("0", dry_run=True)
    ok = (
        blocked["summary"] == "PAUSED_HUMAN_UAT"
        and unpaused["summary"] in ("WAIT_TIMelock", "DRY_RUN_READY", "PASS")
        and unpaused["exit_code"] == 0
    )
    return {
        "ok": ok,
        "paused_blocks": blocked,
        "unpaused_probe": unpaused,
        "expected_next_certs": ["#7 Execute", "#8 Treasury Spend", "#9 Unstake"],
    }


def check_prerequisites() -> dict:
    fl = ROOT / EVIDENCE["four_ledger"] / "four-ledger-reconcile.json"
    ent = ROOT / EVIDENCE["enterprise_hat"]
    fl_ok = fl.is_file() and json.loads(fl.read_text(encoding="utf-8")).get("verdict") == "PASS"
    ent_ok = ent.is_dir() and any(ent.glob("*.json"))
    baseline = read_text(EVIDENCE["baseline"])
    baseline_ok = "HAT_R1_PHASE_B_PAUSED=0" in baseline and V2_TL.lower() in baseline.lower()
    return {
        "ok": fl_ok and ent_ok and baseline_ok,
        "four_ledger_pass": fl_ok,
        "enterprise_hat_l9": ent_ok,
        "baseline_unpause_documented": baseline_ok,
    }


def check_gorp_phase_b() -> dict:
    gorp = read_text(EVIDENCE["gorp"])
    sections = {
        "gorp_07": "GORP-07" in gorp,
        "execute_fail_3_1": "### 3.1 Execute 失败" in gorp,
        "timelock_3_5": "### 3.5 Timelock 异常" in gorp,
        "dual_timelock_2_2": "### 2.2 Timelock" in gorp,
        "execute_earliest": "EXECUTE_EARLIEST_UNIX" in gorp,
        "phase_b_chain": "Execute→Spend→Unstake" in gorp or "Execute→Treasury" in gorp,
        "forbid_force_execute": "HAT_R1_FORCE_EXECUTE" in gorp,
    }
    return {"ok": all(sections.values()), "sections": sections}


def build_phase_b_unpause_flow_map() -> dict:
    eta = int((ROOT / EVIDENCE["hat_r1"] / "EXECUTE_EARLIEST_UNIX.txt").read_text(encoding="utf-8").strip())
    return {
        "schema": "traveltrust.phase-b-unpause-flow-map.v1",
        "phase": "②",
        "baseline": "GovFreeze V2 · HAT-R1 Phase A PASS",
        "chain_id": 11155111,
        "phase_a_handoff": {
            "steps": ["proposal-create", "vote", "queue"],
            "governor": GOVERNOR,
            "v2_timelock": V2_TL,
            "execute_earliest_unix": eta,
            "evidence": EVIDENCE["hat_r1"],
        },
        "unpause_gate": {
            "env": "HAT_R1_PHASE_B_PAUSED=0",
            "owner_actions": [
                "human UAT + Cert #1–#5 signoff",
                "four-ledger PASS + Enterprise HAT L9",
                "export HAT_R1_PHASE_B_PAUSED=0",
                "run-hat-r1-phase-b-when-ready.sh",
            ],
            "script": "scripts/dev/run-hat-r1-phase-b-when-ready.sh",
        },
        "phase_b_sequence": [
            {"cert": 7, "step": "Execute", "mtm": "CHK-CORE-07", "timelock": V2_TL},
            {"cert": 8, "step": "Treasury Spend", "mtm": "CHK-CORE-08", "requires": "Execute PASS"},
            {"cert": 9, "step": "Unstake", "mtm": "CHK-CORE-10", "requires": "Treasury Spend PASS"},
        ],
        "dual_timelock": {
            "governance_path": {"use": "P4 · params · Execute", "timelock": V2_TL},
            "operations_path": {"use": "NetProfit epoch · CP batches", "timelock": LEGACY_TL},
            "recovery_ssot": "GORP §3.1 · §3.5 · RB-G-09",
        },
        "eta_validation": {
            "source": f"{EVIDENCE['hat_r1']}/EXECUTE_EARLIEST_UNIX.txt",
            "too_early_action": "GORP §3.1 step 2 — wait · no force execute",
        },
        "recovery": {
            "too_early": "WAIT until EXECUTE_EARLIEST_UNIX",
            "call_failed": "GORP §3.1 — eth_call simulate · new schedule",
            "timelock_mixed": "GORP §3.5 — stop · RB-G-09",
            "enterprise_hat_blocked": "TT_GOVERNANCE_ENTERPRISE_HAT_OK=1 + L9 signoff",
        },
    }


def check_dual_timelock_recovery() -> dict:
    gorp = read_text(EVIDENCE["gorp"])
    ok = (
        V2_TL.lower() in gorp.lower()
        and LEGACY_TL.lower() in gorp.lower()
        and "RB-G-09" in gorp
        and "Legacy/V2 混用" in gorp
    )
    return {"ok": ok, "v2_timelock": V2_TL, "legacy_timelock": LEGACY_TL}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--flow-map-out", default="")
    args = ap.parse_args()

    checks = {
        "hat_phase_a": check_hat_phase_a(),
        "prerequisites": check_prerequisites(),
        "unpause_gate": check_unpause_gate(),
        "gorp_phase_b": check_gorp_phase_b(),
        "dual_timelock_recovery": check_dual_timelock_recovery(),
    }
    flow = build_phase_b_unpause_flow_map()

    out = Path(args.out)
    if not out.is_absolute():
        out = ROOT / out
    flow_out = Path(args.flow_map_out) if args.flow_map_out else out.parent / "PHASE-B-UNPAUSE-FLOW-MAP.v1.json"
    if not flow_out.is_absolute():
        flow_out = ROOT / flow_out
    flow_out.parent.mkdir(parents=True, exist_ok=True)
    flow_out.write_text(json.dumps(flow, indent=2, ensure_ascii=False), encoding="utf-8")

    required = list(checks.keys())
    verdict = "PASS" if all(checks[k]["ok"] for k in required) else "FAIL"

    payload = {
        "schema": "traveltrust.cert6-phase-b-unpause-matrix.v1",
        "verdict": verdict,
        "phase": "②",
        "baseline": "GovFreeze V2 · HAT-R1 Phase A",
        "roles": ["Owner", "Treasury Operator", "Governor voter path"],
        "checks": checks,
        "phase_b_unpause_flow_map": str(flow_out.relative_to(ROOT)).replace("\\", "/"),
        "mtm_ids": ["CHK-OPS-11", "CHK-BASE-05", "CHK-CORE-04", "CHK-CORE-05", "CHK-CORE-06"],
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"TT_CERT6_PHASE_B_MATRIX: {verdict} out={out}")
    if verdict != "PASS":
        sys.exit(1)


if __name__ == "__main__":
    main()
