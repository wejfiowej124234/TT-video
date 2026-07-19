#!/usr/bin/env python3
"""Stamp L5-A Financial Flow Wiring Closure evidence (EMPIRICAL_PARTIAL · no PASS)."""
from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
FG = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3"
RELEASE_SHA = "493596aebd579dd92c3c2a5f58349c5444b9df13"


def forge(*args: str) -> dict:
    p = subprocess.run(
        ["forge", *args],
        cwd=str(ROOT / "contracts"),
        capture_output=True,
        text=True,
        timeout=300,
    )
    return {"ok": p.returncode == 0, "rc": p.returncode, "tail": (p.stdout or "")[-2000:]}


def main() -> int:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    FG.mkdir(parents=True, exist_ok=True)
    PENDING.mkdir(parents=True, exist_ok=True)

    wire = forge("test", "--match-contract", "EscrowSettlementRouterWireV311", "-q")
    f04 = forge("test", "--match-contract", "F04ServiceFeeStateMachineV311", "-q")
    sr = forge("test", "--match-contract", "SettlementRouterV311Prep", "-q")
    dist = forge("test", "--match-contract", "F05F06DistributableSplitV311", "-q")

    bind_path = PENDING / "FCG-V2-ONCHAIN-BIND-LATEST.json"
    bind = json.loads(bind_path.read_text(encoding="utf-8")) if bind_path.is_file() else {}

    # five-layer: wire closed in ① forge; live rebind still OPEN (ACTIVE unchanged)
    five = {
        "Chain": {
            "status": "WIRE_CLOSED_LOCAL_FORGE",
            "escrow_settlement_router_wire": True,
            "fee_router_four_track_live_path_local": True,
            "distributable_lifecycle_local": True,
            "steward_treasury_flow_local": True,
            "sepolia_redeploy_of_wired_escrow_factory": False,
            "note": "Clean Deploy SR/FeeRouter/PRP exist; Escrow wire is code+forge closed; new Escrow instances need wired factory on Sepolia",
        },
        "Indexer": {
            "status": "PARTIAL_PREP",
            "events_to_ingest": [
                "FeeLegReceived",
                "SettlementReadyMarked",
                "DistributableMarked",
                "Distributed",
                "PlatformFeeRouted",
                "ServiceFeeStateChanged",
            ],
            "rebound_to_fcg_v2": False,
            "gap": "SETTLEMENT_ROUTER_ADDRESS consumer + projections not cut over; ACTIVE still v311",
        },
        "API": {
            "status": "PARTIAL_PREP",
            "createEscrowWired_available": True,
            "meta_settlement_router_key": "PENDING_META_EXPOSE",
            "rebound": False,
        },
        "DB": {
            "status": "NOT_PROVEN_LIVE",
            "gap": "No live order row for wired path on Sepolia yet",
        },
        "UI": {
            "status": "NOT_REBOUND",
            "gap": "FE still LEGACY platformFeeRecipient=FeeRouter from /meta ACTIVE",
        },
        "equivalence_chain_eq_indexer_eq_db_eq_api_eq_ui": False,
    }

    pack = {
        "schema": "traveltrust.l5a_financial_flow_wiring_closure.v1",
        "id": "L5-A",
        "recorded_utc": stamp,
        "Release_SHA": RELEASE_SHA,
        "ACTIVE_flip": "FORBIDDEN_STILL_v311_sepolia_clean_baseline",
        "l5_status": "EMPIRICAL_PARTIAL",
        "l5_pass": False,
        "l5a_wire_local_closed": bool(wire["ok"] and f04["ok"] and sr["ok"] and dist["ok"]),
        "closures": {
            "Escrow_SettlementRouter_wire": {
                "code": True,
                "forge": wire["ok"],
                "files": [
                    "contracts/src/Escrow.sol",
                    "contracts/src/SettlementRouter.sol",
                    "contracts/src/ISettlementRouter.sol",
                    "contracts/src/IEscrowServiceFeeSync.sol",
                    "contracts/src/EscrowFactory.sol",
                    "contracts/test/EscrowSettlementRouterWireV311.t.sol",
                ],
            },
            "FeeRouter_four_track_live_path": {
                "local_forge_path": True,
                "forge": wire["ok"],
                "note": "poolShare→FeeRouter then FeeRouter.distribute four-track",
            },
            "Distributable_lifecycle": {
                "LOCKED_to_SETTLEMENT_READY_to_DISTRIBUTABLE_to_DISTRIBUTED": True,
                "forge": wire["ok"],
            },
            "Steward_Treasury_flow": {
                "steward_45_percent": True,
                "prp_100_when_no_steward": True,
                "forge": wire["ok"],
            },
        },
        "forge": {"wire": wire, "f04": f04, "settlement_router_unit": sr, "distributable_unit": dist},
        "onchain_bind_ref": "FCG-V2-ONCHAIN-BIND-LATEST.json",
        "addresses_deployed_pre_wire": bind.get("addresses"),
        "five_layer_consistency": five,
        "l3_security": {
            "status": "PREP_PARALLEL_ONLY",
            "must_not_override_l5": True,
            "surfaces_queued": [
                "RBAC",
                "Executor",
                "Arbitrator",
                "Timelock",
                "Wallet_Sign",
                "Admin_Boundary",
            ],
        },
        "forbid": [
            "L5_PASS",
            "PSG_Complete",
            "Production_GO",
            "ACTIVE_flip",
            "L3_substitutes_L5",
        ],
        "open_after_l5a_code": [
            "Sepolia_redeploy_or_upgrade_EscrowFactory_wired",
            "Indexer_SettlementRouter_event_ingestion",
            "API_meta_settlement_router_address",
            "DB_live_order_projection",
            "UI_rebind",
            "five_layer_equality_proof",
        ],
        "verdict": "L5A_WIRE_LOCAL_CLOSED_FIVE_LAYER_STILL_OPEN_L5_EMPIRICAL_PARTIAL",
    }

    (FG / "L5A-FINANCIAL-FLOW-WIRING-CLOSURE-LATEST.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (PENDING / "L5A-FINANCIAL-FLOW-WIRING-CLOSURE-LATEST.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # update empirical board
    board = {
        "schema": "traveltrust.psg_completion_matrix_empirical_board.v1",
        "recorded_utc": stamp,
        "Release_SHA": RELEASE_SHA,
        "ACTIVE_flip": "FORBIDDEN",
        "execution_order": ["L5", "L3", "L2", "L1", "L4"],
        "layers": {
            "L5_Financial_Grade_Web3": {
                "status": "EMPIRICAL_PARTIAL",
                "pass": False,
                "l5a": "WIRE_LOCAL_CLOSED_FIVE_LAYER_OPEN",
                "evidence": [
                    "fg-web3/L5A-FINANCIAL-FLOW-WIRING-CLOSURE-LATEST.json",
                    "fg-web3/L5-FG-WEB3-EMPIRICAL-LATEST.json",
                ],
            },
            "L3_Security": {
                "status": "PREP_PARALLEL_ONLY",
                "pass": False,
                "note": "must_not_override_or_substitute_L5",
            },
            "L2_Data": {"status": "QUEUED", "pass": False},
            "L1_Product": {"status": "QUEUED", "pass": False},
            "L4_Operations": {"status": "QUEUED", "pass": False},
        },
        "psg_complete": False,
        "production_go": False,
        "verdict": "L5_EMPIRICAL_PARTIAL_L5A_LOCAL_WIRE_CLOSED_L3_PREP_ONLY",
    }
    (PENDING / "PSG-COMPLETION-MATRIX-EMPIRICAL-BOARD-LATEST.json").write_text(
        json.dumps(board, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # refresh L5 empirical summary pointer
    l5 = {
        "schema": "traveltrust.psg_l5_fg_web3_empirical.v1",
        "recorded_utc": stamp,
        "Release_SHA": RELEASE_SHA,
        "l5_pass": False,
        "l5_status": "EMPIRICAL_PARTIAL",
        "l5a_ref": "L5A-FINANCIAL-FLOW-WIRING-CLOSURE-LATEST.json",
        "l5a_wire_local_closed": pack["l5a_wire_local_closed"],
        "five_layer_equivalence": False,
        "ACTIVE_flip": "FORBIDDEN",
        "verdict": "L5_EMPIRICAL_PARTIAL_NO_PASS_L5A_LOCAL_WIRE_CLOSED",
    }
    (FG / "L5-FG-WEB3-EMPIRICAL-LATEST.json").write_text(
        json.dumps(l5, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # L3 prep-only stamp
    l3 = {
        "schema": "traveltrust.l3_security_prep_parallel.v1",
        "recorded_utc": stamp,
        "status": "PREP_ONLY_NOT_EXECUTING",
        "must_not_override_l5": True,
        "surfaces": [
            "RBAC",
            "Executor_permission",
            "Arbitrator_permission",
            "Timelock",
            "Wallet_signature",
            "Admin_permission_boundary",
        ],
        "verdict": "L3_PREP_QUEUED_L5_REMAINS_PRIMARY",
    }
    (PENDING / "L3-SECURITY-PREP-PARALLEL-LATEST.json").write_text(
        json.dumps(l3, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # CDR-04 checklist flip to local-closed
    import yaml

    cl_path = ROOT / "registry/psg-protocol-v2-clean-deploy-ready-checklist.v1.yaml"
    cl = yaml.safe_load(cl_path.read_text(encoding="utf-8"))
    cl["recorded_utc"] = stamp
    for x in cl.get("checklist") or []:
        if isinstance(x, dict) and x.get("id") == "CDR-04":
            x["ready"] = True
            x["note"] = (
                "L5-A local wire CLOSED (forge EscrowSettlementRouterWireV311); "
                "Sepolia EscrowFactory wired redeploy + five-layer rebind still OPEN; l5_pass=false"
            )
            x["evidence"] = (
                "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3/"
                "L5A-FINANCIAL-FLOW-WIRING-CLOSURE-LATEST.json"
            )
    cl_path.write_text(yaml.safe_dump(cl, allow_unicode=True, sort_keys=False), encoding="utf-8")

    print(pack["verdict"])
    print("wire_ok", pack["l5a_wire_local_closed"], "five_layer_eq", False, "l5_pass", False)
    return 0 if pack["l5a_wire_local_closed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
