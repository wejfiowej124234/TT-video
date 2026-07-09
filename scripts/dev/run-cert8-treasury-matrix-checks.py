#!/usr/bin/env python3
"""Cert #8 Treasury Spend matrix checks."""
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
HAT_DIR_PATH = resolve_hat_r1_evid_dir(ROOT)
HAT_STAMP = hat_r1_stamp(HAT_DIR_PATH)
HAT_DIR = hat_r1_rel_path(ROOT, HAT_DIR_PATH)
CERT8_IDS = ["CHK-CORE-08", "CHK-CORE-14", "CHK-FN-02", "CHK-SC-04"]


def check_cert7_execute() -> dict:
    tx = ROOT / HAT_DIR / "step-07-execute/tx-execute.json"
    if not tx.is_file():
        return {"ok": False, "reason": "missing Cert #7 step-07-execute"}
    data = json.loads(tx.read_text(encoding="utf-8"))
    return {"ok": bool(data.get("tx_hash")), "execute_tx": data.get("tx_hash")}


def check_treasury_proposal() -> dict:
    p = ROOT / HAT_DIR / "step-08-treasury-proposal/proposal.json"
    if not p.is_file():
        return {"ok": False, "reason": "missing step-08-treasury-proposal"}
    data = json.loads(p.read_text(encoding="utf-8"))
    return {"ok": bool(data.get("proposal_id")), "proposal_id": data.get("proposal_id")}


def check_treasury_queue() -> dict:
    q = ROOT / HAT_DIR / "step-09-treasury-queue/timelock-eta.json"
    if not q.is_file():
        return {"ok": False, "reason": "missing step-09-treasury-queue"}
    data = json.loads(q.read_text(encoding="utf-8"))
    return {
        "ok": bool(data.get("treasury_execute_earliest_unix")),
        "treasury_execute_earliest_unix": data.get("treasury_execute_earliest_unix"),
    }


def check_treasury_execute() -> dict:
    tx = ROOT / HAT_DIR / "step-10-treasury-execute/tx-execute.json"
    if not tx.is_file():
        eta_path = ROOT / HAT_DIR / "TREASURY_EXECUTE_EARLIEST_UNIX.txt"
        remaining = 0
        if eta_path.is_file():
            eta = int(eta_path.read_text(encoding="utf-8").strip())
            remaining = max(0, eta - int(time.time()))
        return {
            "ok": False,
            "reason": "treasury execute pending 2nd Timelock",
            "remaining_seconds": remaining,
        }
    data = json.loads(tx.read_text(encoding="utf-8"))
    state_path = ROOT / HAT_DIR / "step-10-treasury-execute/post-execute-state.json"
    state_val = None
    if state_path.is_file():
        state_val = json.loads(state_path.read_text(encoding="utf-8")).get("state")
    return {
        "ok": bool(data.get("tx_hash")) and state_val == "6",
        "execute_tx": data.get("tx_hash"),
        "post_execute_state": state_val,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--flow-map-out", default="")
    ap.add_argument("--stamp", default="")
    args = ap.parse_args()

    checks = {
        "cert7_execute": check_cert7_execute(),
        "treasury_proposal": check_treasury_proposal(),
        "treasury_queue": check_treasury_queue(),
        "treasury_execute": check_treasury_execute(),
        "live_wallet_gate": {
            "ok": os.environ.get("HAT_R1_LIVE_WALLET_OK", "") == "1"
            and os.environ.get("HAT_R1_PHASE_B_PAUSED", "1") == "0",
        },
    }
    hard = ["cert7_execute", "treasury_proposal", "treasury_queue", "treasury_execute"]
    verdict = "PASS" if all(checks[k]["ok"] for k in hard) else "FAIL"

    out = ROOT / args.out if not Path(args.out).is_absolute() else Path(args.out)
    flow_out = (
        ROOT / args.flow_map_out
        if args.flow_map_out and not Path(args.flow_map_out).is_absolute()
        else Path(args.flow_map_out or out.parent / "TREASURY-SPEND-FLOW-MAP.v1.json")
    )
    flow = {
        "schema": "traveltrust.cert8-treasury-flow-map.v1",
        "phase": "②",
        "chain": "Treasury spend propose → vote → queue → 48h → execute",
        "hat_evidence": HAT_DIR,
        "checks_summary": {k: v.get("ok") for k, v in checks.items()},
    }
    flow_out.parent.mkdir(parents=True, exist_ok=True)
    flow_out.write_text(json.dumps(flow, indent=2, ensure_ascii=False), encoding="utf-8")

    payload = {
        "schema": "traveltrust.cert8-treasury-matrix.v1",
        "verdict": verdict,
        "phase": "②",
        "checks": checks,
        "mtm_ids": CERT8_IDS,
        "blockers": [] if verdict == "PASS" else [k for k in hard if not checks[k]["ok"]],
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"TT_CERT8_TREASURY_MATRIX: {verdict}")
    if not checks["treasury_execute"]["ok"]:
        rem = checks["treasury_execute"].get("remaining_seconds")
        if rem is not None:
            print(f"TT_CERT8_TREASURY_ETA: remaining={rem}s")
    if verdict != "PASS":
        sys.exit(1)


if __name__ == "__main__":
    main()
