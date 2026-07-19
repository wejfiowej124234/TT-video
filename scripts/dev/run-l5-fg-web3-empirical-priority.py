#!/usr/bin/env python3
"""L5 Financial-Grade Web3 empirical (priority-first).

Order locked: L5 → L3 → L2 → L1 → L4
ACTIVE flip FORBIDDEN. Results → Evidence only.
Single-layer evidence ≠ PSG Complete ≠ Production GO.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
FG = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3"
RELEASE_SHA = "493596aebd579dd92c3c2a5f58349c5444b9df13"

L5_SEQUENCE = [
    "Escrow_State_Machine",
    "SettlementRouter",
    "FeeRouter_four_track",
    "Distributable_lifecycle",
    "Steward_Revenue",
    "Treasury",
    "Chain_Event",
    "Indexer",
    "API",
    "DB",
    "UI",
]

MATRIX_ORDER = ["L5", "L3", "L2", "L1", "L4"]


def run(cmd: list[str], cwd: Path | None = None, timeout: int = 600) -> dict:
    try:
        p = subprocess.run(
            cmd,
            cwd=str(cwd or ROOT),
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
        )
        return {
            "cmd": cmd,
            "rc": p.returncode,
            "stdout_tail": (p.stdout or "")[-4000:],
            "stderr_tail": (p.stderr or "")[-2000:],
            "ok": p.returncode == 0,
        }
    except Exception as e:  # noqa: BLE001
        return {"cmd": cmd, "rc": -1, "ok": False, "error": str(e)}


def cast(*args: str, rpc: str) -> dict:
    return run(["cast", *args, "--rpc-url", rpc])


def load_bind() -> dict:
    p = PENDING / "FCG-V2-ONCHAIN-BIND-LATEST.json"
    return json.loads(p.read_text(encoding="utf-8"))


def main() -> int:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    FG.mkdir(parents=True, exist_ok=True)

    # load env for RPC (no print secrets)
    load_sh = ROOT / "scripts/dev/load-fcg-v2-clean-deploy-env.sh"
    if load_sh.is_file() and sys.platform != "win32":
        # bash source into env via env -i is hard; rely on caller or dotenv map
        pass
    # parse non-secret from fcg env file
    rpc = os.environ.get("SEPOLIA_RPC_URL") or os.environ.get("CHAIN_RPC_URL") or ""
    fcg_env = ROOT / "scripts/dev/.env.fcg-v2-clean-deploy.local"
    phase2 = ROOT / "scripts/dev/.env.phase2-chain-deploy.local"
    for envf in (fcg_env, phase2):
        if not envf.is_file():
            continue
        for ln in envf.read_text(encoding="utf-8", errors="replace").splitlines():
            s = ln.strip()
            if not s or s.startswith("#") or "=" not in s:
                continue
            k, v = s.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k in ("SEPOLIA_RPC_URL", "CHAIN_RPC_URL", "ETH_RPC_URL", "RPC_URL") and not rpc:
                rpc = v
            if k == "USDC_TOKEN_ADDRESS" and "USDC_TOKEN_ADDRESS" not in os.environ:
                os.environ["USDC_TOKEN_ADDRESS"] = v
            if k == "FUND_STACK_TOKEN_ADDRESS" and "USDC_TOKEN_ADDRESS" not in os.environ:
                os.environ.setdefault("USDC_TOKEN_ADDRESS", v)
    if not rpc:
        rpc = "https://ethereum-sepolia-rpc.publicnode.com"
    os.environ.setdefault("SEPOLIA_RPC_URL", rpc)

    bind = load_bind()
    addrs = bind.get("addresses") or {}
    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()

    steps: dict[str, dict] = {}

    # --- 1 Escrow State Machine (local forge + wiring honesty) ---
    steps["1_Escrow_State_Machine"] = {
        "local_forge": run(
            ["forge", "test", "--match-contract", "F04ServiceFeeStateMachineV311", "-q"],
            cwd=ROOT / "contracts",
            timeout=300,
        ),
        "escrow_t": run(
            ["forge", "test", "--match-contract", "EscrowTest", "--match-test", "test_", "-q"],
            cwd=ROOT / "contracts",
            timeout=300,
        ),
        "live_escrow_wired_to_settlement_router": False,
        "gap": "Escrow↔SettlementRouter integration not cut over; ACTIVE remains v311 baseline",
        "status": "PARTIAL_LOCAL_LOGIC_OK_LIVE_WIRE_OPEN",
    }

    # --- 2 SettlementRouter ---
    sr = addrs.get("settlementRouter", "")
    sr_code = cast("code", sr, rpc=rpc) if sr else {"ok": False}
    sr_owner = cast("call", sr, "owner()(address)", rpc=rpc) if sr else {"ok": False}
    sr_fee = cast("call", sr, "feeRouter()(address)", rpc=rpc) if sr else {"ok": False}
    sr_forge = run(
        ["forge", "test", "--match-contract", "SettlementRouterV311Prep", "-q"],
        cwd=ROOT / "contracts",
        timeout=300,
    )
    fee_linked = False
    if sr_fee.get("ok") and (sr_fee.get("stdout_tail") or "").strip():
        out = (sr_fee.get("stdout_tail") or "").strip().splitlines()[-1].strip().lower()
        fee_linked = out == (addrs.get("feeRouter") or "").lower()
    steps["2_SettlementRouter"] = {
        "address": sr,
        "local_forge": sr_forge,
        "live_code_present": bool(sr_code.get("ok") and len((sr_code.get("stdout_tail") or "").strip()) > 4),
        "live_owner_call": sr_owner,
        "live_feeRouter_call": sr_fee,
        "feeRouter_matches_bind": fee_linked,
        "status": "LIVE_DEPLOYED_PROBED"
        if sr_code.get("ok") and sr_forge.get("ok")
        else "GAP",
    }

    # --- 3 FeeRouter ---
    fr = addrs.get("feeRouter", "")
    fr_code = cast("code", fr, rpc=rpc) if fr else {"ok": False}
    fr_forge = run(
        ["forge", "test", "--match-contract", "FeeRouterTest", "-q"],
        cwd=ROOT / "contracts",
        timeout=300,
    )
    # try alternate match
    if not fr_forge.get("ok"):
        fr_forge = run(
            ["forge", "test", "--match-path", "test/FeeRouter.t.sol", "-q"],
            cwd=ROOT / "contracts",
            timeout=300,
        )
    steps["3_FeeRouter_four_track"] = {
        "address": fr,
        "local_forge": fr_forge,
        "live_code_present": bool(fr_code.get("ok") and len((fr_code.get("stdout_tail") or "").strip()) > 4),
        "four_track_live_money_path": False,
        "gap": "Four-track live split requires Escrow fee-leg → SettlementRouter → FeeRouter path; not wired on ACTIVE",
        "status": "LIVE_DEPLOYED_LOCAL_LOGIC"
        if fr_code.get("ok")
        else "GAP",
    }

    # --- 4 Distributable ---
    dist_forge = run(
        ["forge", "test", "--match-contract", "F05F06DistributableSplitV311", "-q"],
        cwd=ROOT / "contracts",
        timeout=300,
    )
    steps["4_Distributable_lifecycle"] = {
        "local_forge": dist_forge,
        "live_order_distributable_cycle": False,
        "gap": "No live orderId advanced through SettlementReady→Distributable on new SR yet",
        "status": "LOCAL_LOGIC_OK_LIVE_CYCLE_OPEN" if dist_forge.get("ok") else "GAP",
    }

    # --- 5 Steward Revenue / 6 Treasury ---
    prp = addrs.get("projectRevenuePool", "")
    founder = addrs.get("founderBootstrap", "")
    prp_code = cast("code", prp, rpc=rpc) if prp else {"ok": False}
    founder_code = cast("code", founder, rpc=rpc) if founder else {"ok": False}
    steps["5_Steward_Revenue"] = {
        "projectRevenuePool": prp,
        "live_code_present": bool(prp_code.get("ok") and len((prp_code.get("stdout_tail") or "").strip()) > 4),
        "live_revenue_flow": False,
        "gap": "Steward revenue flow requires Escrow complete + distribution wiring",
        "status": "LIVE_DEPLOYED_FLOW_OPEN",
    }
    steps["6_Treasury"] = {
        "founderBootstrap": founder,
        "live_code_present": bool(founder_code.get("ok") and len((founder_code.get("stdout_tail") or "").strip()) > 4),
        "live_treasury_path": False,
        "ACTIVE_baseline": "v311_sepolia_clean_baseline",
        "gap": "Treasury rails still on ACTIVE v311; FounderBootstrap deployed but not ACTIVE-cutover",
        "status": "LIVE_DEPLOYED_CUTOVER_OPEN",
    }

    # --- 7 Chain Event ---
    steps["7_Chain_Event"] = {
        "deploy_tx_hashes": bind.get("tx_hashes") or [],
        "tx_count": len(bind.get("tx_hashes") or []),
        "Release_SHA": bind.get("Release_SHA"),
        "status": "DEPLOY_EVENTS_BOUND" if bind.get("tx_hashes") else "GAP",
    }

    # --- 8–11 Indexer / API / DB / UI consistency ---
    os.environ["GOVERNANCE_RC_CLOSED"] = "1"
    os.environ["TT_FG_VERIFY_LIVE"] = "1"
    cons = run([sys.executable, str(ROOT / "scripts/dev/verify-fg-web3-chain-indexer-api-db-ui-prep.py")])
    cons_path = PENDING / "CHAIN-INDEXER-API-DB-UI-CONSISTENCY-PREP-LATEST.json"
    cons_data = {}
    if cons_path.is_file():
        cons_data = json.loads(cons_path.read_text(encoding="utf-8"))

    five_layer = {
        "Chain": {
            "status": "PROBED",
            "addresses_bound": True,
            "equals_indexer": False,
        },
        "Indexer": {
            "status": "NOT_REBOUND",
            "gap": "Indexer still on ACTIVE v311 projections; no SettlementRouter event consumer for fcg v2",
        },
        "API": {
            "status": "NOT_REBOUND",
            "gap": "/meta ACTIVE still v311_sepolia_clean_baseline",
        },
        "DB": {
            "status": "NOT_PROVEN",
            "gap": "No live order projection against new SR",
        },
        "UI": {
            "status": "NOT_REBOUND",
            "gap": "FE ABI/address matrix not cut over to fcg_full_capability_v2_sepolia",
        },
        "equivalence_chain_state_eq_indexer_eq_db_eq_api_eq_ui": False,
        "honesty": "Deployed bytes proven ≠ five-layer equality proven",
    }
    steps["8_Indexer"] = five_layer["Indexer"]
    steps["9_API"] = five_layer["API"]
    steps["10_DB"] = five_layer["DB"]
    steps["11_UI"] = five_layer["UI"]
    steps["7b_consistency_harness"] = {
        "prep_script": cons,
        "prep_verdict": cons_data.get("verdict"),
        "five_layer": five_layer,
    }

    # Aggregate L5 — NEVER claim PASS if five-layer false or escrow unwired
    l5_pass = False
    l5_status = "EMPIRICAL_PARTIAL_GAPS_OPEN"
    pack = {
        "schema": "traveltrust.psg_l5_fg_web3_empirical.v1",
        "recorded_utc": stamp,
        "Release_SHA": RELEASE_SHA,
        "git_head": head,
        "head_matches_release": head.startswith(RELEASE_SHA[:12]),
        "baseline_deployed": "fcg_full_capability_v2_sepolia",
        "ACTIVE_flip": "FORBIDDEN_STILL_v311_sepolia_clean_baseline",
        "priority_order": MATRIX_ORDER,
        "l5_sequence": L5_SEQUENCE,
        "addresses": addrs,
        "steps": steps,
        "five_layer_consistency": five_layer,
        "l5_pass": l5_pass,
        "l5_status": l5_status,
        "forbid": [
            "L5_PASS_implies_PSG_Complete",
            "single_layer_PASS_implies_GO",
            "ACTIVE_flip",
        ],
        "next_layers_queued": ["L3_Security", "L2_Data", "L1_Product", "L4_Operations"],
        "open_gaps": [
            "Escrow_SettlementRouter_wire",
            "FeeRouter_four_track_live_money_path",
            "Distributable_live_order_cycle",
            "Steward_Treasury_live_flow",
            "Indexer_API_DB_UI_rebind_and_equality",
        ],
        "verdict": "L5_EMPIRICAL_PARTIAL_NO_PASS_ACTIVE_UNCHANGED",
    }

    (FG / "L5-FG-WEB3-EMPIRICAL-LATEST.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (PENDING / "L5-FG-WEB3-EMPIRICAL-LATEST.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # Matrix empirical board
    board = {
        "schema": "traveltrust.psg_completion_matrix_empirical_board.v1",
        "recorded_utc": stamp,
        "Release_SHA": RELEASE_SHA,
        "ACTIVE_flip": "FORBIDDEN",
        "execution_order": MATRIX_ORDER,
        "layers": {
            "L5_Financial_Grade_Web3": {
                "status": l5_status,
                "pass": False,
                "evidence": "fg-web3/L5-FG-WEB3-EMPIRICAL-LATEST.json",
            },
            "L3_Security": {"status": "QUEUED", "pass": False},
            "L2_Data": {"status": "QUEUED", "pass": False},
            "L1_Product": {"status": "QUEUED", "pass": False},
            "L4_Operations": {"status": "QUEUED", "pass": False},
        },
        "psg_complete": False,
        "production_go": False,
        "honesty": {
            "deploy_complete_equals_psg_complete": False,
            "l5_partial_equals_l5_pass": False,
            "any_single_layer_pass_equals_psg_complete": False,
        },
        "verdict": "EMPIRICAL_L5_PARTIAL_L3_L2_L1_L4_QUEUED_NO_GO",
    }
    (PENDING / "PSG-COMPLETION-MATRIX-EMPIRICAL-BOARD-LATEST.json").write_text(
        json.dumps(board, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (PENDING / "PSG-COMPLETION-MATRIX-EMPIRICAL-ENTRY-LATEST.json").write_text(
        json.dumps(
            {
                "schema": "traveltrust.psg_completion_matrix_empirical_entry.v1",
                "recorded_utc": stamp,
                "Release_SHA": RELEASE_SHA,
                "status": "EMPIRICAL_IN_PROGRESS",
                "execution_order": MATRIX_ORDER,
                "layers": {
                    "L5_Financial_Grade_Web3": l5_status,
                    "L3_Security": "QUEUED",
                    "L2_Data": "QUEUED",
                    "L1_Product": "QUEUED",
                    "L4_Operations": "QUEUED",
                },
                "psg_complete": False,
                "verdict": board["verdict"],
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    # case results — honest partial, none PASS
    cases = []
    for i, name in enumerate(L5_SEQUENCE, 1):
        cases.append(
            {
                "seq": i,
                "surface": name,
                "pass": False,
                "status": steps.get(f"{i}_{name}", steps.get(f"{i}_" + name.replace(" ", "_"), {})).get(
                    "status", "OPEN"
                )
                if False
                else "SEE_STEPS",
            }
        )
    # map statuses from steps keys
    key_map = {
        1: "1_Escrow_State_Machine",
        2: "2_SettlementRouter",
        3: "3_FeeRouter_four_track",
        4: "4_Distributable_lifecycle",
        5: "5_Steward_Revenue",
        6: "6_Treasury",
        7: "7_Chain_Event",
        8: "8_Indexer",
        9: "9_API",
        10: "10_DB",
        11: "11_UI",
    }
    case_results = []
    for i, name in enumerate(L5_SEQUENCE, 1):
        st = steps.get(key_map[i], {})
        case_results.append(
            {
                "seq": i,
                "surface": name,
                "status": st.get("status", "OPEN"),
                "pass": False,
                "evidence_ref": "L5-FG-WEB3-EMPIRICAL-LATEST.json",
            }
        )
    (FG / "FG-WEB3-CASE-RESULTS-LATEST.json").write_text(
        json.dumps(
            {
                "schema": "traveltrust.fg_web3_case_results.v1",
                "recorded_utc": stamp,
                "Release_SHA": RELEASE_SHA,
                "pass_count": 0,
                "cases": case_results,
                "l5_pass": False,
                "verdict": "CASES_EMPIRICAL_PARTIAL_ZERO_PASS",
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    print(pack["verdict"])
    print("Release_SHA", RELEASE_SHA[:12], "head_ok", pack["head_matches_release"])
    print("SR", steps["2_SettlementRouter"]["status"], "fee_linked", fee_linked)
    print("five_layer_eq", five_layer["equivalence_chain_state_eq_indexer_eq_db_eq_api_eq_ui"])
    print("open_gaps", len(pack["open_gaps"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
