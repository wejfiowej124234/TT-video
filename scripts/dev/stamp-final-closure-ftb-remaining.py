#!/usr/bin/env python3
"""Living FTB stamp-lag remaining fields. Keep freeze cite required_before_go=8.
Do not change KEEP Track1 SR pin. Do not mutate parent 20260812.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FTB = ROOT / "docs" / "runbook" / "TT-FINAL-TRUTH-BASELINE-LATEST.json"
KEEP_SR = "0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372"
SR_FT = "0xD1DAE665eDc16FCEc7b7530Ead3504A846457147"
NOW = "2026-08-18T06:00:00Z"


def main() -> None:
    ftb = json.loads(FTB.read_text(encoding="utf-8"))
    if ftb.get("tt_production_go") != "NO_GO":
        raise SystemExit("refuse: would flip TT_PRODUCTION_GO")
    go = ftb.get("production_go_reassessment") or {}
    if int(go.get("required_before_go") or -1) != 8:
        raise SystemExit("refuse: freeze cite required_before_go drifted")
    addrs = (ftb.get("web3") or {}).get("addresses") or {}
    if addrs.get("settlement_router") != KEEP_SR:
        raise SystemExit("refuse: KEEP SR pin drifted")

    lock = ftb.setdefault("owner_lock", {})
    lock["product_truth"] = "official_api_must_match_active_www_frozen_latest_product_baseline"
    lock["hard_gate"] = "REEVAL_STILL_REFUSED_NO_GO_REMAINING_GAP_E2E_THEN_AXIS_14"
    lock["P0_COMMERCIAL_MONEY_PATH_BLOCKER"] = False
    lock["dual_wait"] = "TRACK2_1USDC_CLOSED_REALITY_OWNER_A+WAITING_GOV04_TIMELOCK_ETA_DEFERRED_POST_GO"
    lock["frontend_product_baseline"] = "FROZEN_LATEST_PRODUCT_BASELINE"
    lock["tt_production_go"] = "NO_GO"

    web3 = ftb.setdefault("web3", {})
    web3["settlement_router_factory_trust_status"] = "WIRED_OFFICIAL_CREATE_HOP"
    web3["wired_still_points_to_track1_sr"] = False
    web3["settlement_router_live_meta_overlay"] = {
        "address": SR_FT,
        "role": "SR_FT_OFFICIAL_CREATE_HOP_LIVE_META",
        "not_official_factory_trust_create_hop": False,
        "keep_track1_sr_listed": KEEP_SR,
        "alignment_pin_settlement_router": KEEP_SR,
        "cite": "GET https://api.web3-ttg.com/meta + Owner A Track2 T1/T2",
        "confirm_design": True,
    }

    runtime = ftb.setdefault("product_runtime", {})
    runtime["official_www"] = "FROZEN_LATEST_PRODUCT_BASELINE"
    runtime["www_git_sha"] = "daa5ae87b8c1af548c6beff6dd3451e5d386acf2"
    runtime["www_build_time"] = "2026-08-16T15:15:49Z"
    runtime["forbid_www_bake"] = True
    runtime["forbid_checkout_old_fe"] = True

    t2 = (ftb.setdefault("dual_track", {})).setdefault("track2_fast_checkout_factory_trust", {})
    t2["status"] = "TRACK2_1USDC_CLOSED_REALITY_OWNER_A"
    t2["mainnet_deploy"] = "WIRED"
    t2["official_live"] = True
    t2["official_live_meaning"] = "create_hop_sr_ft_live_meta_dual_listed_keep_track1_sr"
    t2["keep_identity_not_swapped"] = True
    t2["next"] = []

    prep = ftb.setdefault("dual_track_parallel_prep", {})
    prep["track2_mainnet_cutover"] = "TRACK2_T1_T2_EXECUTE_PASS"

    dw = ftb.setdefault("dual_wait", {})
    track2 = dw.setdefault("track2", {})
    track2["status"] = "TRACK2_1USDC_CLOSED_REALITY_OWNER_A"
    track2["eta_elapsed"] = True
    track2["official_cutover_done"] = False
    track2["official_create_hop"] = SR_FT
    track2["official_create_hop_live_meta"] = True
    track2["keep_identity_not_swapped"] = True
    track2["keep_sr"] = KEEP_SR
    gov = dw.setdefault("gov04", {})
    gov["status"] = "WAITING_GOV04_TIMELOCK_ETA"
    gov["waits_for_track2_first"] = False
    gov["class"] = "DEFERRED_POST_GO_LEGACY_OLD_PM_PROXY"
    dw["P0_COMMERCIAL_MONEY_PATH_BLOCKER"] = False

    nxt = ftb.get("next") or []
    extra = [
        "TT_PRODUCTION_GO_FINAL_CLOSURE_BATCH_remaining_GAP_E2E_then_AXIS_14",
        "Do_not_reopen_TT_PRODUCTION_GO_REASSESSMENT_this_turn",
        "Do_not_flip_TT_PRODUCTION_GO",
        "Do_not_rewrite_STOP_required_before_go_8",
    ]
    for item in extra:
        if item not in nxt:
            nxt.append(item)
    ftb["next"] = nxt

    batch = ftb.setdefault("production_go_final_closure_batch", {})
    batch["status"] = "TT_PRODUCTION_GO_FINAL_CLOSURE_BATCH_OPEN"
    batch["cite_stop_required_before_go"] = 8
    batch["tt_production_go"] = "NO_GO"
    batch["frontend_product_baseline"] = "FROZEN_LATEST_PRODUCT_BASELINE"
    batch["remaining_before_axis14"] = ["GAP-E2E-JOURNEY", "AXIS-14"]

    lag = ftb.setdefault("stamp_lag_cluster", {})
    lag["status"] = "CLOSED_THIS_BATCH"
    lag["p0_commercial_money_path_blocker_living"] = False
    lag["keep_sr"] = KEEP_SR
    lag["do_not_recast_l7"] = True
    lag["do_not_change_keep_sr"] = True
    lag["closed_utc"] = NOW
    lag["cite"] = "docs/runbook/TT-GAP-1USDC-HANDOFF-OWNER-CLASSIFY-A-LATEST.json"

    # freeze cite fields must stay
    go["required_before_go"] = 8
    go["status"] = "TT_PRODUCTION_GO_REASSESSMENT_STOP"
    go["hard_gate"] = "REFUSED"
    go["tt_production_go"] = "NO_GO"
    go["owner_production_go_verdict"] = "NOT_THIS_TURN"
    go["read_only"] = True
    go["frozen_as_final_closure_unique_entry"] = True
    go["do_not_rewrite_counts_to_look_greener"] = True

    ftb["tt_production_go"] = "NO_GO"
    ftb["phase_now"] = "FTB_V8_CYCLE_ACTIVE_PRODUCTION_GO_REASSESSMENT_STOP_REQUIRED_BEFORE_GO_OPEN"
    ir = str(ftb.get("identity_rule") or "")
    ir = ir.replace(
        "Official www remains frozen OLD bake (Expected Difference)",
        "Official www = FROZEN_LATEST_PRODUCT_BASELINE daa5ae87 / 2026-08-16T15:15:49Z (forbid bake/checkout)",
    )
    ftb["identity_rule"] = ir

    FTB.write_text(json.dumps(ftb, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("stamped living FTB remaining stamp-lag (KEEP SR, freeze cite=8, NO_GO)")


if __name__ == "__main__":
    main()
