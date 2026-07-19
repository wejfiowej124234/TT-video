#!/usr/bin/env python3
"""Prepare fcg_full_capability_v2_sepolia Clean Deploy pending pack (no broadcast)."""
from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]


def _git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def main() -> int:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    head = _git("rev-parse", "HEAD")
    branch = _git("rev-parse", "--abbrev-ref", "HEAD")
    try:
        ahead_behind = _git(
            "rev-list", "--left-right", "--count",
            "traveltrust-v11/feature/g23-04-abi-event-freeze...HEAD",
        )
        behind_s, ahead_s = ahead_behind.split()
        ahead, behind = int(ahead_s), int(behind_s)
    except Exception:
        ahead, behind = -1, -1

    dirty = _git("status", "--porcelain")
    dirty_lines = [ln for ln in dirty.splitlines() if ln.strip()]

    sha_baseline = {
        "schema": "traveltrust.fcg_v2_git_sha_baseline.v1",
        "id": "FCG-V2-GIT-SHA-BASELINE",
        "recorded_utc": stamp,
        "branch": branch,
        "head_sha": head,
        "ahead_of_tracking": ahead,
        "behind_tracking": behind,
        "dirty_path_count": len(dirty_lines),
        "candidate_for_clean_deploy": head,
        "note": (
            "WAIT_WINDOW prep baseline. Sync/commit before broadcast. "
            "Do not treat as ACTIVE cutover SHA until G-RC CLOSED + Clean Deploy evidence."
        ),
        "broadcast_forbidden": True,
        "active_flip_forbidden": True,
    }

    ev_root = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia"
    pending_dir = ev_root / "pending"
    pending_dir.mkdir(parents=True, exist_ok=True)
    (ev_root / "README.md").write_text(
        "# fcg_full_capability_v2_sepolia · Evidence root\n\n"
        "**Status:** PENDING · WAIT_WINDOW / G-RC not CLOSED\n\n"
        "- Forbidden: broadcast Money-Path / Settlement / FeeRouter / Distributable until G-RC CLOSED\n"
        "- Forbidden: ACTIVE flip in this prep window\n"
        "- After G-RC CLOSED: run Clean Deploy with latest candidate SHA, then bind broadcast JSON here\n",
        encoding="utf-8",
    )

    (pending_dir / "GIT-SHA-BASELINE-LATEST.json").write_text(
        json.dumps(sha_baseline, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    pack = {
        "schema": "traveltrust.fcg_full_capability_v2_clean_deploy_pending_pack.v1",
        "id": "FCG-FULL-CAPABILITY-V2-CLEAN-DEPLOY-PENDING-PACK",
        "recorded_utc": stamp,
        "status": "PENDING_AWAIT_G_RC_CLOSED",
        "baseline_key": "fcg_full_capability_v2_sepolia",
        "chain_id": 11155111,
        "strategy": "CLEAN_SEPOLIA_REDEPLOY_NOT_UPGRADE",
        "preauth_only": True,
        "broadcast_authorized": False,
        "active_flip_authorized": False,
        "governance_rc_closed": False,
        "git_sha_baseline": sha_baseline,
        "contracts_prep": {
            "ISettlementRouter": "contracts/src/ISettlementRouter.sol",
            "SettlementRouter": "contracts/src/SettlementRouter.sol",
            "ServiceFeeStates_SETTLEMENT_READY": "contracts/src/ServiceFeeStatesV311.sol",
            "deploy_script": "contracts/script/DeployFcgFullCapabilityV2Sepolia.s.sol",
            "local_test": "contracts/test/SettlementRouterV311Prep.t.sol",
        },
        "broadcast_hard_gates": [
            "GOVERNANCE_RC_CLOSED=1",
            "TRAVELTRUST_FCG_V2_BROADCAST_OK=1",
            "FCG_V2_WANT_BROADCAST=1",
            "chainid=11155111",
        ],
        "forge_dry_hint": (
            "cd contracts && forge script script/DeployFcgFullCapabilityV2Sepolia.s.sol "
            "--rpc-url <sepolia_or_anvil> --private-key $PRIVATE_KEY  # NO --broadcast"
        ),
        "forge_broadcast_hint_after_g_rc": (
            "GOVERNANCE_RC_CLOSED=1 TRAVELTRUST_FCG_V2_BROADCAST_OK=1 FCG_V2_WANT_BROADCAST=1 "
            "forge script script/DeployFcgFullCapabilityV2Sepolia.s.sol --rpc-url $SEPOLIA_RPC "
            "--broadcast --verify"
        ),
        "evidence_pipeline": {
            "root": "evidence/GO_phase2_fcg_full_capability_v2_sepolia/",
            "pending": "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/",
            "after_broadcast_required": [
                "broadcast_json",
                "on_chain_verify_pack",
                "address_matrix_freeze_json",
                "cutover_stamp",
                "ACTIVE_flip_record_separate_script",
            ],
        },
        "post_g_rc_closed_immediate": [
            "Use this pending pack candidate SHA (or newer synced HEAD)",
            "Broadcast Clean Deploy (not upgrade old baseline)",
            "Mark v311_sepolia_clean_baseline LEGACY_READ_ONLY",
            "Flip active_deploy_baseline to fcg_full_capability_v2_sepolia",
            "Rebind Indexer + FE/API",
        ],
        "forbidden_now": [
            "Money-Path_Settlement_FeeRouter_Distributable_broadcast",
            "ACTIVE_baseline_flip",
            "Production_GO",
        ],
        "registry_checklist": "registry/psg-protocol-v2-clean-deploy-ready-checklist.v1.yaml",
        "verdict": (
            "PENDING_PACK_READY · PREP_CODE_LANDED · NO_BROADCAST · "
            "NO_ACTIVE_FLIP · AWAIT_G_RC_CLOSED"
        ),
    }
    (pending_dir / "CLEAN-DEPLOY-PENDING-PACK-LATEST.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    # also mirror under gap-closure evidence
    mirror = (
        ROOT
        / "evidence/GO_pre_eta_production_prep/full-capability-gap-closure-20260719"
        / "FCG-V2-CLEAN-DEPLOY-PENDING-PACK-LATEST.json"
    )
    mirror.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Update clean deploy checklist readiness
    cl_path = ROOT / "registry/psg-protocol-v2-clean-deploy-ready-checklist.v1.yaml"
    cl = yaml.safe_load(cl_path.read_text(encoding="utf-8"))
    cl["recorded_utc"] = stamp
    cl["pending_pack"] = (
        "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/CLEAN-DEPLOY-PENDING-PACK-LATEST.json"
    )
    cl["git_sha_baseline"] = (
        "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/GIT-SHA-BASELINE-LATEST.json"
    )
    for item in cl["checklist"]:
        if item["id"] == "CDR-03":
            item["ready"] = True
            item["blocker"] = None
            item["note"] = "ISettlementRouter + SettlementRouter landed (prep · not deployed)"
        if item["id"] == "CDR-06":
            item["ready"] = "partial"
            item["note"] = (
                "SERVICE_FEE_SETTLEMENT_READY enum + LEGACY_COMPAT LOCKED→DISTRIBUTABLE; "
                "Escrow rewire still post-G-RC"
            )
        if item["id"] == "CDR-07":
            item["ready"] = True
            item["blocker"] = None
            item["note"] = "DeployFcgFullCapabilityV2Sepolia.s.sol prep · broadcast gated"
        if item["id"] == "CDR-11":
            item["ready"] = "partial"
            item["blocker"] = "Broadcast_artifacts_TBD_after_G_RC_CLOSED"
            item["note"] = "Evidence root + pending pack created; broadcast artifacts still TBD"
        if item["id"] == "CDR-13":
            item["ready"] = "partial"
            item["note"] = f"SHA baseline recorded head={head[:12]} ahead={ahead} dirty={len(dirty_lines)}"
            item["blocker"] = "Commit/sync before broadcast still required" if dirty_lines or ahead else None
    # settlement missing list update
    miss = cl["alignment_surfaces"]["contracts"].get("missing_target") or []
    cl["alignment_surfaces"]["contracts"]["missing_target"] = [
        x for x in miss if "SettlementRouter" not in x
    ]
    cl["alignment_surfaces"]["contracts"]["present"] = sorted(
        set(cl["alignment_surfaces"]["contracts"].get("present") or [])
        | {
            "contracts/src/ISettlementRouter.sol",
            "contracts/src/SettlementRouter.sol",
            "contracts/script/DeployFcgFullCapabilityV2Sepolia.s.sol",
        }
    )
    cl["alignment_surfaces"]["contracts"]["status"] = (
        "SETTLEMENT_ROUTER_PREP_LANDED_AWAIT_G_RC_FOR_BROADCAST"
    )
    cl["status"] = "READY_CHECKLIST_UPDATED_PENDING_PACK_LANDED_WAIT_G_RC_CLOSED"
    cl["protocol_v2_implementation_forbidden_now"] = False
    cl["protocol_v2_escrow_wiring_forbidden_now"] = True
    cl["protocol_v2_prep_code_landed"] = True
    forbid = cl.get("forbidden_now") or []
    cl["forbidden_now"] = [
        x
        for x in forbid
        if x != "start_Protocol_v2_Implementation_coding_before_G_RC_CLOSED"
    ] + [
        "Escrow_SettlementRouter_wiring_broadcast_before_G_RC_CLOSED",
        "ACTIVE_flip_before_G_RC_CLOSED",
    ]
    # dedupe preserve order
    seen = set()
    cl["forbidden_now"] = [x for x in cl["forbidden_now"] if not (x in seen or seen.add(x))]
    post = cl.get("post_g_rc_closed_immediate") or []
    cl["post_g_rc_closed_immediate"] = [
        ("Escrow_wire_to_SettlementRouter_then_CLEAN_deploy" if "SettlementRouter_and_wiring" in x else x)
        for x in post
    ]
    honesty = cl.setdefault("honesty", {})
    honesty["checklist_equals_deploy_ready_pass"] = False
    honesty["checklist_authorizes_broadcast"] = False
    honesty["settlement_router_missing_is_expected_pre_impl"] = False
    honesty["settlement_router_prep_landed_no_broadcast"] = True
    honesty["pending_pack_ready"] = True
    cl_path.write_text(yaml.safe_dump(cl, allow_unicode=True, sort_keys=False), encoding="utf-8")

    # Gap closure
    gc_path = ROOT / "registry/psg-production-full-capability-gate-gap-closure.v1.yaml"
    gc = yaml.safe_load(gc_path.read_text(encoding="utf-8"))
    gc["recorded_utc"] = stamp
    gc["status"] = "ACTIVE_PHASE1_PAY01_WAIT_WINDOW_V2_PENDING_PACK_PREP_LANDED"
    gc["owner_authorization"]["scope_this_window"] = (
        "WAIT_WINDOW prep: SettlementRouter + V2 deploy script + pending pack landed; "
        "no Money-Path broadcast; no ACTIVE flip; await G-RC CLOSED"
    )
    gc["owner_authorization"]["fcg_v2_pending_pack"] = (
        "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/CLEAN-DEPLOY-PENDING-PACK-LATEST.json"
    )
    gc["owner_authorization"]["governance_rc_closed"] = False
    gc["discipline"]["forbid_money_path_related_broadcast_now"] = True
    gc["discipline"]["forbid_active_flip_now"] = True
    gc["discipline"]["preauth_only"] = True
    gc_path.write_text(yaml.safe_dump(gc, allow_unicode=True, sort_keys=False), encoding="utf-8")

    print(pack["verdict"])
    print("head", head)
    print("ahead", ahead, "dirty", len(dirty_lines))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
