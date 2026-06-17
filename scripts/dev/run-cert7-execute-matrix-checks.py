#!/usr/bin/env python3
"""Cert #7 Execute matrix checks — Queue→Execute chain evidence (no FORCE_EXECUTE)."""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

sys.path.insert(0, str(ROOT / "scripts" / "dev" / "lib"))
from hat_r1_resolve import resolve_hat_r1_evid_dir, hat_r1_rel_path, hat_r1_stamp

try:
    HAT_DIR_PATH = resolve_hat_r1_evid_dir(ROOT)
    HAT_STAMP = hat_r1_stamp(HAT_DIR_PATH)
    HAT_DIR = hat_r1_rel_path(ROOT, HAT_DIR_PATH)
except FileNotFoundError:
    HAT_DIR_PATH = ROOT / "evidence/GO_hat_r1_sepolia/unknown"
    HAT_STAMP = "unknown"
    HAT_DIR = "evidence/GO_hat_r1_sepolia/unknown"

V2_TL = "0x904a6c4c6aab698afbf08ec6151d317c393520cc"
GOVERNOR = "0x847b00ddb6ffed71812abc358a407dad4b099fcb"
FOUR_LEDGER = "evidence/GO_tt_country_pool_revenue_enterprise_hat/20260616T084248Z"

CERT7_IDS = ["CHK-CORE-07", "CHK-FE-08", "CHK-SC-01", "CHK-SC-02", "CHK-DR-01"]

EVIDENCE = {
    "baseline": "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md",
    "gorp": "docs/runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md",
    "hat_r1": HAT_DIR,
    "four_ledger": FOUR_LEDGER,
}


def read_text(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def check_cert6_prerequisite(stamp: str) -> dict:
    sig = ROOT / f"evidence/GO_ttg_cert/{stamp}/phase-b/unpause/PHASE-B-UNPAUSE-SIGNOFF.json"
    if not sig.is_file():
        return {"ok": False, "reason": "missing Cert #6 PHASE-B-UNPAUSE-SIGNOFF"}
    data = json.loads(sig.read_text(encoding="utf-8"))
    return {"ok": data.get("verdict") == "PASS", "path": str(sig.relative_to(ROOT)).replace("\\", "/")}


def check_timelock_elapsed() -> dict:
    eta_path = ROOT / HAT_DIR / "EXECUTE_EARLIEST_UNIX.txt"
    if not eta_path.is_file():
        return {"ok": False, "reason": "missing EXECUTE_EARLIEST_UNIX.txt"}
    eta = int(eta_path.read_text(encoding="utf-8").strip())
    now = int(time.time())
    return {
        "ok": now >= eta,
        "execute_earliest_unix": eta,
        "timelock_elapsed": now >= eta,
        "remaining_seconds": max(0, eta - now),
        "no_force_execute_env": os.environ.get("HAT_R1_FORCE_EXECUTE", "0") == "0",
    }


def check_queue_chain() -> dict:
    qdir = ROOT / HAT_DIR / "step-06-queue"
    eta_json = qdir / "timelock-eta.json"
    tx_queue = qdir / "tx-queue.json"
    if not eta_json.is_file() or not tx_queue.is_file():
        return {"ok": False, "reason": "missing step-06-queue evidence"}
    eta_data = json.loads(eta_json.read_text(encoding="utf-8"))
    tx_data = json.loads(tx_queue.read_text(encoding="utf-8"))
    receipt_glob = list(qdir.glob("receipt-*.json"))
    ok = (
        eta_data.get("queue_tx")
        and eta_data.get("execute_earliest_unix")
        and tx_data.get("tx_hash")
        and len(receipt_glob) >= 1
    )
    return {
        "ok": ok,
        "proposal_id": eta_data.get("proposal_id"),
        "queue_tx": eta_data.get("queue_tx"),
        "timelock_delay_seconds": eta_data.get("timelock_delay_seconds"),
        "receipt_archived": len(receipt_glob) >= 1,
    }


def check_execute_evidence() -> dict:
    edir = ROOT / HAT_DIR / "step-07-execute"
    tx_exec = edir / "tx-execute.json"
    state = edir / "post-execute-state.json"
    if not tx_exec.is_file():
        return {"ok": False, "reason": "missing step-07-execute — run run-cert7-hat-r1-execute-evidence.sh after Timelock"}
    tx_data = json.loads(tx_exec.read_text(encoding="utf-8"))
    hash_ok = bool(tx_data.get("tx_hash"))
    receipts = list(edir.glob("receipt-*.json"))
    events = list(edir.glob("events-*.json"))
    state_ok = False
    state_val = None
    if state.is_file():
        st = json.loads(state.read_text(encoding="utf-8"))
        state_val = st.get("state")
        state_ok = st.get("state") == "5" and st.get("no_force_execute") is True
    ok = hash_ok and len(receipts) >= 1 and state_ok
    return {
        "ok": ok,
        "execute_tx": tx_data.get("tx_hash"),
        "receipt_count": len(receipts),
        "events_count": len(events),
        "post_execute_state": state_val,
        "want_state": "5",
    }


def check_four_ledger_mapping() -> dict:
    fl_path = ROOT / FOUR_LEDGER / "four-ledger-reconcile.json"
    if not fl_path.is_file():
        return {"ok": False, "reason": "missing four-ledger-reconcile.json"}
    fl = json.loads(fl_path.read_text(encoding="utf-8"))
    ok = fl.get("verdict") == "PASS" and fl.get("global_treasury_timelock_match") is True
    return {
        "ok": ok,
        "verdict": fl.get("verdict"),
        "global_treasury_timelock_match": fl.get("global_treasury_timelock_match"),
        "v2_timelock": V2_TL,
    }


def check_gorp_execute_recovery() -> dict:
    gorp = read_text(EVIDENCE["gorp"])
    sections = {
        "execute_fail_3_1": "### 3.1 Execute 失败" in gorp,
        "too_early": "EXECUTE_EARLIEST_UNIX" in gorp,
        "forbid_force": "HAT_R1_FORCE_EXECUTE" in gorp,
        "timelock_3_5": "### 3.5 Timelock 异常" in gorp,
        "gorp_07": "GORP-07" in gorp,
        "governor_sc": GOVERNOR.lower() in gorp.lower() or "Governor" in gorp,
    }
    return {"ok": all(sections.values()), "sections": sections}


def check_live_wallet_gate() -> dict:
    ok = os.environ.get("HAT_R1_LIVE_WALLET_OK", "") == "1"
    paused_ok = os.environ.get("HAT_R1_PHASE_B_PAUSED", "1") == "0"
    return {
        "ok": ok and paused_ok,
        "HAT_R1_LIVE_WALLET_OK": os.environ.get("HAT_R1_LIVE_WALLET_OK", ""),
        "HAT_R1_PHASE_B_PAUSED": os.environ.get("HAT_R1_PHASE_B_PAUSED", "1"),
        "note": "Required at finalize; execute evidence proves wallet was used",
    }


def build_execute_flow_map() -> dict:
    eta = int((ROOT / HAT_DIR / "EXECUTE_EARLIEST_UNIX.txt").read_text(encoding="utf-8").strip())
    exec_dir = ROOT / HAT_DIR / "step-07-execute"
    exec_tx = None
    if (exec_dir / "tx-execute.json").is_file():
        exec_tx = json.loads((exec_dir / "tx-execute.json").read_text(encoding="utf-8")).get("tx_hash")
    return {
        "schema": "traveltrust.cert7-execute-flow-map.v1",
        "phase": "②",
        "chain": "Governor queue → V2 Timelock delay → execute(uint256)",
        "chain_id": 11155111,
        "governor": GOVERNOR,
        "v2_timelock": V2_TL,
        "execute_earliest_unix": eta,
        "queue_evidence": f"{HAT_DIR}/step-06-queue/",
        "execute_evidence": f"{HAT_DIR}/step-07-execute/",
        "execute_tx": exec_tx,
        "four_ledger_ssot": f"{FOUR_LEDGER}/four-ledger-reconcile.json",
        "recovery": "GORP §3.1 · §3.5 · no HAT_R1_FORCE_EXECUTE",
        "post_execute_consistency": "governor.state(proposalId)==5 Executed",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--flow-map-out", default="")
    ap.add_argument("--stamp", default="")
    args = ap.parse_args()

    stamp = args.stamp or (ROOT / "evidence/GO_ttg_cert/latest-stamp.txt").read_text(encoding="utf-8").strip()

    checks = {
        "cert6_prerequisite": check_cert6_prerequisite(stamp),
        "timelock_elapsed": check_timelock_elapsed(),
        "queue_chain": check_queue_chain(),
        "execute_evidence": check_execute_evidence(),
        "four_ledger_mapping": check_four_ledger_mapping(),
        "gorp_execute_recovery": check_gorp_execute_recovery(),
        "live_wallet_gate": check_live_wallet_gate(),
    }
    flow = build_execute_flow_map()

    out = Path(args.out)
    if not out.is_absolute():
        out = ROOT / out
    flow_out = Path(args.flow_map_out) if args.flow_map_out else out.parent / "EXECUTE-FLOW-MAP.v1.json"
    if not flow_out.is_absolute():
        flow_out = ROOT / flow_out
    flow_out.parent.mkdir(parents=True, exist_ok=True)
    flow_out.write_text(json.dumps(flow, indent=2, ensure_ascii=False), encoding="utf-8")

    hard = [
        "cert6_prerequisite",
        "timelock_elapsed",
        "queue_chain",
        "execute_evidence",
        "four_ledger_mapping",
        "gorp_execute_recovery",
    ]
    verdict = "PASS" if all(checks[k]["ok"] for k in hard) else "FAIL"

    payload = {
        "schema": "traveltrust.cert7-execute-matrix.v1",
        "verdict": verdict,
        "phase": "②",
        "baseline": "GovFreeze V2 · HAT-R1 Phase B Execute",
        "checks": checks,
        "execute_flow_map": str(flow_out.relative_to(ROOT)).replace("\\", "/"),
        "mtm_ids": CERT7_IDS,
        "blockers": [] if verdict == "PASS" else [k for k in hard if not checks[k]["ok"]],
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"TT_CERT7_EXECUTE_MATRIX: {verdict} out={out}")
    if checks["timelock_elapsed"].get("remaining_seconds"):
        print(f"TT_CERT7_EXECUTE_ETA: remaining={checks['timelock_elapsed']['remaining_seconds']}s")
    if verdict != "PASS":
        sys.exit(1)


if __name__ == "__main__":
    main()
