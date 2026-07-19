#!/usr/bin/env python3
"""
Dual-RC discipline stamp:
  - Governance RC: monitor Proposal #1 only (FROZEN_WAITING_EXECUTE)
  - Money-Path RC: design + remediation checklist only (REGISTERED_NOT_STARTED)

Does NOT mutate protocol / ACTIVE / Runtime / Registry / Package.
Does NOT implement TRE-02 / REG-01 / REG-04.
"""
from __future__ import annotations

import json
import subprocess
import os
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence/GO_v311_constitution_production_alignment_audit"
FRE = ROOT / "evidence/GO_phase2_v311_final_release"
RPC = os.environ.get("CHAIN_RPC_URL", "https://ethereum-sepolia-rpc.publicnode.com")
GOV = "0x1ce4fbE80557bC2111A814f60A2334de41032116"
ETA = "2026-07-20T11:37:37Z"


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _cast(*args: str) -> str:
    r = subprocess.run(
        ["cast", *args, "--rpc-url", RPC],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=40,
        cwd=str(ROOT),
    )
    out = (r.stdout or r.stderr or "").strip().splitlines()
    return out[0] if out else ""


def main() -> int:
    EV.mkdir(parents=True, exist_ok=True)
    FRE.mkdir(parents=True, exist_ok=True)
    now = _utc()

    # --- Governance monitor only ---
    prop_raw = _cast("call", GOV, "state(uint256)(uint8)", "1")
    try:
        prop_state = int(prop_raw.split()[0])
    except Exception:
        prop_state = None
    eta_dt = datetime(2026, 7, 20, 11, 37, 37, tzinfo=timezone.utc)
    now_dt = datetime.now(timezone.utc)
    remain = max(0, int((eta_dt - now_dt).total_seconds()))

    mon = {
        "machine_key": "TT_V311_F02_EXECUTE_MONITOR",
        "mode": "FROZEN_WAITING_EXECUTE",
        "release_decision": "CONTINUE_CURRENT_RC",
        "dual_track_discipline": "HELD",
        "recorded_utc": now,
        "execute_after_utc": ETA,
        "seconds_remaining": remain,
        "hours_remaining": round(remain / 3600, 3),
        "proposal_id": "1",
        "proposal_state": prop_state,
        "proposal_state_name": {
            5: "Queued",
            7: "Executed",
        }.get(prop_state, "unknown"),
        "executable_now": remain <= 0 and prop_state == 5,
        "governance_rc_actions_allowed": ["monitor_proposal_1_only"],
        "governance_rc_actions_forbidden": [
            "mutate_protocol",
            "mutate_active",
            "mutate_runtime",
            "mutate_registry",
            "mutate_package",
            "implement_TRE-02",
            "implement_REG-01",
            "implement_REG-04",
            "start_money_path_rc",
        ],
        "money_path_rc": "REGISTERED_NOT_STARTED",
        "deferred_p0_to_money_path_rc": ["TRE-02", "REG-01", "REG-04"],
        "forbid_mix_money_path_into_governance_rc": True,
    }
    (FRE / "F02-EXECUTE-MONITOR-LATEST.json").write_text(
        json.dumps(mon, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # --- Money-Path design pack (no implementation) ---
    design = {
        "schema": "traveltrust.v311_money_path_rc_design.v1",
        "machine_key": "TT_V311_MONEY_PATH_RC_DESIGN",
        "status": "DESIGN_ONLY_NOT_STARTED",
        "implementation_status": "NOT_STARTED",
        "recorded_utc": now,
        "ssot": "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md",
        "start_gate": "GOVERNANCE_RC_CLOSED",
        "forbid_until_start": [
            "protocol_change",
            "ACTIVE_edit",
            "Runtime_cutover",
            "Registry_ACTIVE_edit",
            "Package_LOCK_edit",
            "broadcast_deploy",
            "timelock_schedule_for_money_path",
        ],
        "sole_p0": ["TRE-02", "REG-01", "REG-04"],
        "target_architecture": {
            "distributable_gate": (
                "Only SERVICE_FEE_DISTRIBUTABLE amounts enter Ch.12 split "
                "(PENDING→LOCKED→DISTRIBUTABLE→DISTRIBUTED)"
            ),
            "split_with_active_steward": {
                "steward_bps": 4500,
                "project_revenue_pool_bps": 5500,
            },
            "split_without_active_steward": {
                "project_revenue_pool_bps": 10000,
            },
            "attribution": "Order.destination_country only",
            "four_rails": [
                "Order Escrow",
                "GovernanceTreasuryP4Cap (already live ACTIVE)",
                "Project Revenue Pool (TO DEPLOY/WIRE)",
                "Founder Bootstrap Wallet (TO DESIGNATE/WIRE)",
            ],
            "retire_as_distributable_ssot": (
                "FeeRouter LEGACY multi-bucket "
                "(BPS_COUNTRY + GLOBAL_OPS/RESERVE/STAKERS) as Constitution split SSOT"
            ),
            "note_fee_router": (
                "COMPOSITE fund-stack today; Money-Path RC must either replace "
                "distribution semantic with PRP rail or Owner-document Expected "
                "Difference — default FIX to Constitution"
            ),
        },
        "work_packages": {
            "TRE-02": {
                "objective": "Live distribution matches Constitution 45/55 (or 100% PRP)",
                "design_options": [
                    {
                        "id": "OPT-A",
                        "name": "New DistributableSplitter + ProjectRevenuePool",
                        "summary": (
                            "Escrow/distributable path pays steward path 45% and "
                            "PRP 55%; FeeRouter LEGACY no longer Constitution SSOT"
                        ),
                        "touches": ["new_or_upgraded_contracts", "Runtime", "Indexer"],
                    },
                    {
                        "id": "OPT-B",
                        "name": "Reconfigure FeeRouter legs to single PRP sink",
                        "summary": (
                            "Collapse non-country 55% into one Project Revenue Pool "
                            "address; keep country 45% as steward path"
                        ),
                        "touches": ["FeeRouter_config_or_redeploy", "Runtime"],
                        "risk": "May still carry LEGACY naming — must prove semantic == Constitution",
                    },
                ],
                "recommended_default": "OPT-A",
                "acceptance": [
                    "On-chain or Runtime proof: distributable split 4500/5500",
                    "No LEGACY ops/reserve/stakers as Constitution distributable SSOT",
                    "Re-audit TRE-02 CLOSED",
                ],
                "implement_now": False,
            },
            "REG-01": {
                "objective": "Four rails live and isolated",
                "design_steps": [
                    "Owner designates Founder Bootstrap wallet (Access Fee sink)",
                    "Deploy or designate Project Revenue Pool USDC receiver",
                    "Prove Order Escrow != P4Cap != PRP != Founder",
                    "Pin addresses in Money-Path RC evidence + then Registry cutover (only when RC starts)",
                    "P4Cap already live under ACTIVE freeze — do not retarget Public Sale sink",
                ],
                "acceptance": [
                    "Four addresses non-null and non-overlapping roles",
                    "Access Fee path documented to Founder",
                    "Distributable 55%/100% path documented to PRP",
                    "Re-audit REG-01 CLOSED",
                ],
                "implement_now": False,
            },
            "REG-04": {
                "objective": "Distributable state machine end-to-end Runtime CLOSED",
                "bundle_with": "TRE-02",
                "design_steps": [
                    "Keep Escrow ServiceFeeStatesV311 as contract SSOT",
                    "BE/Runtime consumes PENDING→LOCKED→DISTRIBUTABLE→DISTRIBUTED",
                    "Indexer projections only payout from DISTRIBUTABLE/DISTRIBUTED",
                    "Close registry honesty distributable_state_machine after live proof",
                    "Forbid Revenue-as-distributable naming in Runtime/docs for this RC",
                ],
                "acceptance": [
                    "Runtime honesty CLOSED with evidence",
                    "No payout before DISTRIBUTABLE",
                    "Re-audit REG-04 CLOSED",
                ],
                "implement_now": False,
            },
        },
        "sequencing_when_started": [
            "Owner opens Money-Path RC (Governance RC must be CLOSED)",
            "Lock design option OPT-A or OPT-B in writing",
            "REG-01 address designation (Founder + PRP)",
            "TRE-02 implementation + REG-04 Runtime wiring (same change set preferred)",
            "Sepolia verify + Function/Product money-path cert slice",
            "Constitution money-path re-audit PASS",
            "Then Production GO money-path clearance (PSG gates remain)",
        ],
        "out_of_scope_until_governance_closed": [
            "Any Solidity change",
            "Any ACTIVE address matrix edit",
            "Any Runtime first-wins cutover",
            "Any Registry ACTIVE parameter cutover",
            "Any Package LOCK mutation",
        ],
    }

    checklist = {
        "schema": "traveltrust.v311_money_path_rc_remediation_checklist.v1",
        "machine_key": "TT_V311_MONEY_PATH_RC_REMEDIATION_CHECKLIST",
        "status": "CHECKLIST_ONLY_NOT_STARTED",
        "recorded_utc": now,
        "implementation_blocked_until": "GOVERNANCE_RC_CLOSED",
        "items": [
            {
                "id": "MP-D0",
                "phase": "DESIGN",
                "title": "Owner confirms OPT-A vs OPT-B for TRE-02",
                "done": False,
                "blocks_implementation": True,
            },
            {
                "id": "MP-D1",
                "phase": "DESIGN",
                "title": "Owner designates Founder Bootstrap wallet address",
                "done": False,
                "maps_to": "REG-01",
            },
            {
                "id": "MP-D2",
                "phase": "DESIGN",
                "title": "Specify Project Revenue Pool deploy vs existing vault reuse",
                "done": False,
                "maps_to": "REG-01",
            },
            {
                "id": "MP-D3",
                "phase": "DESIGN",
                "title": "Map Escrow→Distributable→split call graph (no code change yet)",
                "done": False,
                "maps_to": ["TRE-02", "REG-04"],
            },
            {
                "id": "MP-D4",
                "phase": "DESIGN",
                "title": "List LEGACY FeeRouter consumers to retire as Constitution SSOT",
                "done": False,
                "maps_to": "TRE-02",
            },
            {
                "id": "MP-G0",
                "phase": "GATE",
                "title": "Governance RC CLOSED (Function/Product/UI 54/0/0 path done)",
                "done": False,
                "required_before_implement": True,
            },
            {
                "id": "MP-I1",
                "phase": "IMPLEMENT",
                "title": "TRE-02 — Constitution distribution live",
                "done": False,
                "blocked": True,
                "blocked_reason": "NOT_STARTED until MP-G0",
            },
            {
                "id": "MP-I2",
                "phase": "IMPLEMENT",
                "title": "REG-01 — PRP + Founder live rails",
                "done": False,
                "blocked": True,
                "blocked_reason": "NOT_STARTED until MP-G0",
            },
            {
                "id": "MP-I3",
                "phase": "IMPLEMENT",
                "title": "REG-04 — Distributable Runtime CLOSED",
                "done": False,
                "blocked": True,
                "blocked_reason": "NOT_STARTED until MP-G0",
            },
            {
                "id": "MP-V1",
                "phase": "VERIFY",
                "title": "Constitution money-path re-audit PASS",
                "done": False,
                "blocked": True,
            },
            {
                "id": "MP-V2",
                "phase": "VERIFY",
                "title": "Clear Production GO money-path blockers (PSG Freeze/GO still separate)",
                "done": False,
                "blocked": True,
            },
        ],
    }

    # Refresh charter status stamp without changing sole_p0
    charter_path = EV / "MONEY-PATH-RC-CHARTER-LATEST.json"
    if charter_path.exists():
        charter = json.loads(charter_path.read_text(encoding="utf-8"))
    else:
        charter = {"machine_key": "TT_V311_MONEY_PATH_RC", "sole_p0_work_items": []}
    charter["status"] = "REGISTERED_NOT_STARTED"
    charter["recorded_utc"] = now
    charter["design_pack"] = (
        "evidence/GO_v311_constitution_production_alignment_audit/"
        "MONEY-PATH-RC-DESIGN-LATEST.json"
    )
    charter["remediation_checklist"] = (
        "evidence/GO_v311_constitution_production_alignment_audit/"
        "MONEY-PATH-RC-REMEDIATION-CHECKLIST-LATEST.json"
    )
    charter["implementation_status"] = "NOT_STARTED"
    charter["discipline"] = {
        "design_allowed_now": True,
        "implement_allowed_now": False,
        "mix_into_governance_rc": "FORBIDDEN",
    }
    charter_path.write_text(
        json.dumps(charter, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    (EV / "MONEY-PATH-RC-DESIGN-LATEST.json").write_text(
        json.dumps(design, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (EV / "MONEY-PATH-RC-REMEDIATION-CHECKLIST-LATEST.json").write_text(
        json.dumps(checklist, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    md = f"""# Money-Path RC · Design & Remediation Checklist

**Machine:** `TT_V311_MONEY_PATH_RC_DESIGN`  
**Status:** `DESIGN_ONLY_NOT_STARTED` · **Implementation:** `NOT_STARTED`  
**Recorded:** `{now}`  
**SSOT:** Economic Constitution V3.1.1 Final  
**Start gate:** Governance RC **CLOSED**

> Dual-RC isolation held. **No** protocol / ACTIVE / Runtime / Registry / Package changes in this pack.

---

## 0 · Discipline

| Rule | Value |
|------|-------|
| Governance RC | `FROZEN_WAITING_EXECUTE` · monitor Proposal #1 only |
| Money-Path RC | `REGISTERED_NOT_STARTED` · design/checklist only |
| Sole P0 | TRE-02 · REG-01 · REG-04 |
| Implement now | **FORBIDDEN** |
| Mix into Governance RC | **FORBIDDEN** |

---

## 1 · Target (Constitution)

- Distributable only after `PENDING → LOCKED → DISTRIBUTABLE → DISTRIBUTED`
- With ACTIVE steward: **45%** steward / **55%** Project Revenue Pool
- Without steward: **100%** Project Revenue Pool
- Attribution: `Order.destination_country`
- Four rails isolated: Escrow · P4Cap (live) · PRP (TBD) · Founder (TBD)
- Retire FeeRouter LEGACY multi-bucket as Constitution distributable SSOT

---

## 2 · Design options (TRE-02)

| Option | Summary | Default |
|--------|---------|---------|
| **OPT-A** | New DistributableSplitter + ProjectRevenuePool; FeeRouter not Constitution SSOT | **Recommended** |
| **OPT-B** | Reconfigure FeeRouter non-country 55% into single PRP sink | Alternate |

Owner picks OPT-A/B **before** implementation (checklist MP-D0).

---

## 3 · Remediation checklist

| ID | Phase | Item | Now |
|----|-------|------|-----|
| MP-D0 | DESIGN | Confirm OPT-A vs OPT-B | open |
| MP-D1 | DESIGN | Designate Founder Bootstrap wallet | open |
| MP-D2 | DESIGN | Specify PRP deploy vs reuse | open |
| MP-D3 | DESIGN | Map Escrow→Distributable→split call graph | open |
| MP-D4 | DESIGN | List LEGACY FeeRouter consumers to retire | open |
| MP-G0 | GATE | Governance RC CLOSED | **blocking** |
| MP-I1 | IMPLEMENT | TRE-02 | blocked |
| MP-I2 | IMPLEMENT | REG-01 | blocked |
| MP-I3 | IMPLEMENT | REG-04 | blocked |
| MP-V1 | VERIFY | Money-path re-audit PASS | blocked |
| MP-V2 | VERIFY | Production GO money-path clearance | blocked |

---

## 4 · Governance monitor (this stamp)

| Field | Value |
|-------|-------|
| Proposal #1 state | `{mon['proposal_state_name']}` ({prop_state}) |
| Execute ETA | `{ETA}` |
| Remaining | ~{mon['hours_remaining']} h |
| Executable now | `{mon['executable_now']}` |

---

## 5 · Artifacts

- Design: `MONEY-PATH-RC-DESIGN-LATEST.json`
- Checklist: `MONEY-PATH-RC-REMEDIATION-CHECKLIST-LATEST.json`
- Charter: `MONEY-PATH-RC-CHARTER-LATEST.json`
- Dual board: `DUAL-RC-TRACK-BOARD-LATEST.md`
- Monitor: `../GO_phase2_v311_final_release/F02-EXECUTE-MONITOR-LATEST.json`
"""
    (EV / "MONEY-PATH-RC-DESIGN-LATEST.md").write_text(md, encoding="utf-8")

    # dual board light refresh
    dual_path = EV / "DUAL-RC-TRACK-BOARD-LATEST.json"
    if dual_path.exists():
        dual = json.loads(dual_path.read_text(encoding="utf-8"))
    else:
        dual = {"machine_key": "TT_V311_DUAL_RC_TRACK_BOARD", "tracks": {}}
    dual["recorded_utc"] = now
    dual["release_blocking_decision"] = "CONTINUE_CURRENT_RC"
    dual["mode"] = "FROZEN_WAITING_EXECUTE"
    dual["discipline"] = "HELD"
    dual["money_path_design_only"] = True
    dual["money_path_implementation"] = "NOT_STARTED"
    dual.setdefault("tracks", {})
    dual["tracks"].setdefault("B_MONEY_PATH_RC", {})
    dual["tracks"]["B_MONEY_PATH_RC"]["status"] = "REGISTERED_NOT_STARTED"
    dual["tracks"]["B_MONEY_PATH_RC"]["design_pack"] = (
        "evidence/GO_v311_constitution_production_alignment_audit/"
        "MONEY-PATH-RC-DESIGN-LATEST.json"
    )
    dual["tracks"]["B_MONEY_PATH_RC"]["checklist"] = (
        "evidence/GO_v311_constitution_production_alignment_audit/"
        "MONEY-PATH-RC-REMEDIATION-CHECKLIST-LATEST.json"
    )
    for dest in (EV, FRE):
        (dest / "DUAL-RC-TRACK-BOARD-LATEST.json").write_text(
            json.dumps(dual, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )

    print(
        json.dumps(
            {
                "discipline": "HELD",
                "governance": {
                    "mode": "FROZEN_WAITING_EXECUTE",
                    "proposal_state": prop_state,
                    "remain_h": mon["hours_remaining"],
                },
                "money_path": {
                    "status": "REGISTERED_NOT_STARTED",
                    "design": "UPDATED",
                    "implementation": "NOT_STARTED",
                },
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
