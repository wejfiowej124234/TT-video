#!/usr/bin/env python3
"""Stamp Registry/Indexer/API/DB/UI rebind + five-layer consistency (honest, no L5 PASS)."""
from __future__ import annotations

import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
FG = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3"
REG = ROOT / "registry"


def cast_code(addr: str, rpc: str) -> bool:
    if not addr:
        return False
    try:
        out = subprocess.check_output(
            ["cast", "code", addr, "--rpc-url", rpc], text=True, stderr=subprocess.DEVNULL
        ).strip()
        return len(out) > 4 and out != "0x"
    except Exception:
        return False


def main() -> None:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    pin = json.loads((PENDING / "CDR-19-L5A-RELEASE-SHA-PIN-LATEST.json").read_text(encoding="utf-8"))
    bind = json.loads((PENDING / "FCG-V2-WIRED-ONCHAIN-BIND-LATEST.json").read_text(encoding="utf-8"))
    release_sha = pin["Release_SHA"]
    addrs = bind.get("addresses") or {}
    rpc = os.environ.get("SEPOLIA_RPC_URL") or "https://ethereum-sepolia-rpc.publicnode.com"
    fcg_env = ROOT / "scripts/dev/.env.fcg-v2-clean-deploy.local"
    if fcg_env.is_file():
        for ln in fcg_env.read_text(encoding="utf-8", errors="replace").splitlines():
            if ln.startswith("SEPOLIA_RPC_URL="):
                rpc = ln.split("=", 1)[1].strip()

    code_ok = {k: cast_code(v, rpc) for k, v in addrs.items()}

    # Registry pin (NOT ACTIVE flip)
    matrix = {
        "schema": "traveltrust.fcg_v2_wired_address_matrix.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "baseline_key": "fcg_full_capability_v2_sepolia_wired_escrow_factory",
        "active_deploy_baseline": "v311_sepolia_clean_baseline",
        "ACTIVE_FLIP": "FORBIDDEN",
        "chain_id": 11155111,
        "addresses": addrs,
        "code_present": code_ok,
        "verdict": "REGISTRY_MATRIX_PINNED_ACTIVE_UNCHANGED",
    }
    (REG / "fcg-v2-wired-address-matrix.v1.json").write_text(
        json.dumps(matrix, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (PENDING / "FCG-V2-WIRED-ADDRESS-MATRIX-LATEST.json").write_text(
        json.dumps(matrix, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    five = {
        "Chain": {
            "status": "REBOUND_PROBED" if all(code_ok.values()) else "PARTIAL",
            "addresses": addrs,
            "code_present": code_ok,
            "equals_others": False,
        },
        "Indexer": {
            "status": "ENV_PINNED_NOT_CUTOVER",
            "settlement_router_events": [
                "FeeLegReceived",
                "SettlementReadyMarked",
                "DistributableMarked",
                "Distributed",
            ],
            "consumer": "SETTLEMENT_ROUTER_ADDRESS from FCG-V2-WIRED-REBIND.env.example",
            "cutover": False,
            "gap": "Indexer process not yet restarted on wired addresses; ACTIVE still v311",
        },
        "API": {
            "status": "ENV_PINNED_759_UNCHANGED",
            "escrow_factory_env": "ESCROW_FACTORY_ADDRESS",
            "fee_router_env": "FEE_ROUTER_ADDRESS",
            "settlement_router_env": "SETTLEMENT_ROUTER_ADDRESS (runtime; not added to 759 ten-key set this slice)",
            "createEscrowWired": "contracts EscrowFactory.createEscrowWired available",
            "cutover": False,
        },
        "DB": {
            "status": "NOT_PROVEN_LIVE_ORDER",
            "gap": "No wired escrow order cycle projected yet",
        },
        "UI": {
            "status": "NOT_REBOUND",
            "gap": "NEXT_PUBLIC_* still ACTIVE v311; no settlement router public env cutover",
        },
        "equivalence_chain_eq_indexer_eq_db_eq_api_eq_ui": False,
    }

    pack = {
        "schema": "traveltrust.l5_five_layer_rebind_consistency.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "ACTIVE_flip": "FORBIDDEN",
        "l5_pass": False,
        "l5_status": "EMPIRICAL_PARTIAL",
        "l3_security": "PREP_ONLY",
        "layers": five,
        "registry_matrix": "registry/fcg-v2-wired-address-matrix.v1.json",
        "rebind_env_example": "pending/FCG-V2-WIRED-REBIND.env.example",
        "verdict": "FIVE_LAYER_REBIND_PARTIAL_CHAIN_PROBED_EQUALITY_OPEN",
    }
    (FG / "L5-FIVE-LAYER-REBIND-CONSISTENCY-LATEST.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (PENDING / "CHAIN-INDEXER-API-DB-UI-CONSISTENCY-LATEST.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    board = {
        "schema": "traveltrust.psg_completion_matrix_empirical_board.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "ACTIVE_flip": "FORBIDDEN",
        "execution_order": ["L5", "L3", "L2", "L1", "L4"],
        "layers": {
            "L5_Financial_Grade_Web3": {
                "status": "EMPIRICAL_PARTIAL",
                "pass": False,
                "l5a_wire": "LOCAL_CLOSED",
                "wired_redeploy": "BOUND" if addrs.get("escrowFactory") else "PENDING",
                "five_layer": "PARTIAL_CHAIN_PROBED",
            },
            "L3_Security": {"status": "PREP_ONLY", "pass": False},
            "L2_Data": {"status": "QUEUED", "pass": False},
            "L1_Product": {"status": "QUEUED", "pass": False},
            "L4_Operations": {"status": "QUEUED", "pass": False},
        },
        "psg_complete": False,
        "verdict": "L5_EMPIRICAL_PARTIAL_WIRED_REDEPLOY_BOUND_FIVE_LAYER_PARTIAL_L3_PREP_ONLY",
    }
    (PENDING / "PSG-COMPLETION-MATRIX-EMPIRICAL-BOARD-LATEST.json").write_text(
        json.dumps(board, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(pack["verdict"])
    print("code_ok", code_ok)


if __name__ == "__main__":
    main()
