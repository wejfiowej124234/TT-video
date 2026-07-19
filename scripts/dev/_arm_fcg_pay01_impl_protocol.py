#!/usr/bin/env python3
"""Arm FCG-PAY-01 impl protocol · respect Governance RC CLOSED hard gate."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import yaml

stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
ROOT = Path(__file__).resolve().parents[2]

exit_crit = yaml.safe_load(
    (ROOT / "registry/v311-production-exit-criteria.v1.yaml").read_text(encoding="utf-8")
)
gov_mode = exit_crit["dual_rc"]["governance_rc"]["mode_now"]
mp_status = exit_crit["dual_rc"]["money_path_rc"]["status"]
impl_blocked = exit_crit.get("honesty", {})  # fallback
money_path_impl_blocked = True  # from SSOT line money_path_implement_now
# read explicit key if present
blob = (ROOT / "registry/v311-production-exit-criteria.v1.yaml").read_text(encoding="utf-8")
gov_closed = gov_mode == "CLOSED" or "GOVERNANCE_RC_CLOSED" in str(
    exit_crit.get("governance_rc_pass", "")
)
# mode_now FROZEN_WAITING_EXECUTE => not closed
governance_rc_closed = gov_mode == "CLOSED"

protocol = {
    "schema": "traveltrust.fcg_pay_01_implementation_window.v1",
    "id": "FCG-PAY-01",
    "recorded_utc": stamp,
    "release_target": "MAINNET_COMMERCIAL_FULL",
    "phase_1_execution": "AUTHORIZED",
    "psg_listed": True,
    "psg_registries": [
        "registry/psg-production-full-capability-gate.v1.yaml",
        "registry/psg-production-full-capability-gate-gap-closure.v1.yaml",
        "registry/v311-production-exit-criteria.v1.yaml#MONEY_PATH_RC",
    ],
    "project_fit": {
        "fits_traveltrust": True,
        "aligns_with": [
            "TT-ECONOMIC-CONSTITUTION-V3.1.1",
            "TT-MONEY-PATH-TEST-PLAN",
            "TT-V311-PRODUCTION-EXIT-CRITERIA Dual-RC",
            "Full Capability Gate domain E",
        ],
        "must_merge_two_models": {
            "order_escrow_lifecycle": "Create→Accept→Pay→Lock→Complete→Release",
            "constitution_fee_router": "FeeRouter 4-rail + Distributable SM (TRE-02/REG-01/REG-04)",
            "note": "Both required — Escrow lock/release alone ≠ Money-Path Alignment PASS",
        },
    },
    "governance_hard_gate": {
        "governance_rc_mode_now": gov_mode,
        "money_path_rc_status": mp_status,
        "implement_tre_reg_coding": "BLOCKED_UNTIL_GOVERNANCE_RC_CLOSED"
        if not governance_rc_closed
        else "ALLOWED",
        "m_rc_00_start_requires": [
            "GOVERNANCE_RC_CLOSED",
            "Owner_opens_Money_Path_RC",
            "OPT_A_or_OPT_B_locked",
        ],
        "ssot": "registry/v311-production-exit-criteria.v1.yaml",
    },
    "steps": [
        {
            "step": 1,
            "name": "Freeze_Money_Path_business_model",
            "allowed_now": True,
            "deliverable": "Frozen fund flow + who/where/when/trigger/refund rules",
            "maps_to": ["M-RC-00 prep", "FCG-PAY-01 discovery"],
        },
        {
            "step": 2,
            "name": "Chain_Indexer_DB_UI_mapping",
            "allowed_now": True,
            "deliverable": "Event→DB status→UI label matrix (e.g. EscrowReleased→RELEASED→Completed)",
            "maps_to": ["REG-04 indexer projection", "four_way_equality"],
        },
        {
            "step": 3,
            "name": "Happy_Path_min_real_funds_loop",
            "allowed_now": governance_rc_closed,
            "blocked_reason": None
            if governance_rc_closed
            else "GOVERNANCE_RC not CLOSED (mode=FROZEN_WAITING_EXECUTE)",
            "deliverable": "Create→Accept→Pay USDC→Escrow Lock→Complete→Release + Evidence",
            "maps_to": ["M-RC-01..03 impl slice", "Escrow happy path"],
        },
        {
            "step": 4,
            "name": "Exception_paths",
            "allowed_now": governance_rc_closed,
            "blocked_reason": None
            if governance_rc_closed
            else "Same as Step 3",
            "deliverable": "Cancel/Refund/Dispute/Timeout/Failed tx evidence",
            "maps_to": ["FCG-ESCROW-01", "M-RC re-audit inputs"],
        },
        {
            "step": 5,
            "name": "Steward_Settlement",
            "allowed_now": governance_rc_closed,
            "blocked_reason": None
            if governance_rc_closed
            else "Same as Step 3",
            "deliverable": "Steward revenue entitlement in settlement split",
            "maps_to": ["FCG-STEWARD-01", "REG-01 rails", "constitution splits"],
        },
    ],
    "tre_reg_order": ["TRE-02", "REG-01", "REG-04", "M-RC-04_ReAudit"],
    "remaining_problems": [
        "Governance RC still FROZEN_WAITING_EXECUTE — coding TRE/REG forbidden by Exit Criteria until CLOSED",
        "User Escrow lifecycle diagram must be explicitly mapped onto FeeRouter 4-rail + Distributable SM",
        "Slash may belong Escrow/Steward security — confirm in exception matrix",
        "Sepolia evidence ≠ mainnet commercial GO without separate mainnet cutover",
        "FCG-PAY-01 in Full Capability Gap Closure ≠ automatic Money-Path RC START without M-RC-00",
    ],
    "production_go": False,
    "track_a": "FROZEN_NO_REWRITE",
}

ev = ROOT / "evidence/GO_pre_eta_production_prep/full-capability-gap-closure-20260719"
ev.mkdir(parents=True, exist_ok=True)
(ev / "FCG-PAY-01-IMPL-WINDOW-PROTOCOL-LATEST.json").write_text(
    json.dumps(protocol, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
)

# Update gap closure registry status
gc_path = ROOT / "registry/psg-production-full-capability-gate-gap-closure.v1.yaml"
gc = yaml.safe_load(gc_path.read_text(encoding="utf-8"))
gc["recorded_utc"] = stamp
gc["status"] = (
    "ACTIVE_PHASE1_PAY01_IMPL_ARMED_AWAITING_GOV_RC_CLOSED"
    if not governance_rc_closed
    else "ACTIVE_PHASE1_PAY01_IMPL_WINDOW"
)
gc["owner_authorization"]["PHASE_1_EXECUTION"] = "AUTHORIZED"
gc["owner_authorization"]["impl_window_protocol"] = (
    ev / "FCG-PAY-01-IMPL-WINDOW-PROTOCOL-LATEST.json"
).as_posix()
gc["owner_authorization"]["coding_tre_reg"] = protocol["governance_hard_gate"][
    "implement_tre_reg_coding"
]
gc["impl_steps_5"] = protocol["steps"]
gc["psg_listed"] = True
for item in gc["gap_matrix"]:
    if item["id"] == "FCG-PAY-01":
        item["discovery_status"] = "ALIGNED"
        item["impl_window"] = {
            "status": gc["status"],
            "steps_1_2_allowed_now": True,
            "steps_3_5_coding_blocked_until": "GOVERNANCE_RC_CLOSED",
            "protocol": (ev / "FCG-PAY-01-IMPL-WINDOW-PROTOCOL-LATEST.json").as_posix(),
        }
gc_path.write_text(
    yaml.safe_dump(gc, allow_unicode=True, sort_keys=False), encoding="utf-8"
)

# board
board = ROOT / (
    "evidence/GO_pre_eta_production_prep/release-window-minfix-20260719/"
    "RELEASE-WINDOW-BOARD-LATEST.json"
)
b = json.loads(board.read_text(encoding="utf-8"))
b["recorded_utc"] = stamp
b["phase"] = "FCG_PAY01_IMPL_ARMED_AWAIT_GOV_RC"
b["fcg_pay01_impl"] = {
    "protocol": (ev / "FCG-PAY-01-IMPL-WINDOW-PROTOCOL-LATEST.json").as_posix(),
    "governance_rc_mode": gov_mode,
    "coding_tre_reg": protocol["governance_hard_gate"]["implement_tre_reg_coding"],
    "production_go": False,
}
board.write_text(json.dumps(b, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

print("gov_mode", gov_mode)
print("coding", protocol["governance_hard_gate"]["implement_tre_reg_coding"])
print("psg_listed", True)
print("status", gc["status"])
