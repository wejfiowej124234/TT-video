#!/usr/bin/env python3
"""
Money-Path RC detailed tech design pack (pre-implementation).

Governance RC remains FROZEN_WAITING_EXECUTE — monitor only.
Does NOT mutate protocol / ACTIVE / Runtime / Registry / Package.
Does NOT implement TRE-02 / REG-01 / REG-04.
"""
from __future__ import annotations

import json
import os
import subprocess
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
    try:
        r = subprocess.run(
            ["cast", *args, "--rpc-url", RPC],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=40,
            cwd=str(ROOT),
        )
        lines = (r.stdout or r.stderr or "").strip().splitlines()
        return lines[0] if lines else ""
    except Exception as e:  # pragma: no cover
        return f"ERR:{e}"


def main() -> int:
    EV.mkdir(parents=True, exist_ok=True)
    FRE.mkdir(parents=True, exist_ok=True)
    now = _utc()

    prop_raw = _cast("call", GOV, "state(uint256)(uint8)", "1")
    try:
        prop_state = int(prop_raw.split()[0])
    except Exception:
        prop_state = None
    eta = datetime(2026, 7, 20, 11, 37, 37, tzinfo=timezone.utc)
    remain = max(0, int((eta - datetime.now(timezone.utc)).total_seconds()))

    mon = {
        "machine_key": "TT_V311_F02_EXECUTE_MONITOR",
        "mode": "FROZEN_WAITING_EXECUTE",
        "release_decision": "CONTINUE_CURRENT_RC",
        "recorded_utc": now,
        "execute_after_utc": ETA,
        "seconds_remaining": remain,
        "hours_remaining": round(remain / 3600, 3),
        "proposal_id": "1",
        "proposal_state": prop_state,
        "proposal_state_name": {5: "Queued", 7: "Executed"}.get(prop_state, "unknown"),
        "executable_now": remain <= 0 and prop_state == 5,
        "money_path_prep": "DETAILED_DESIGN_COMPLETE_IMPLEMENTATION_BLOCKED",
        "forbid_mutate": ["protocol", "ACTIVE", "Runtime", "Registry", "Package"],
        "forbid_implement_money_path_until": "GOVERNANCE_RC_CLOSED",
    }
    (FRE / "F02-EXECUTE-MONITOR-LATEST.json").write_text(
        json.dumps(mon, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    pack = {
        "schema": "traveltrust.v311_money_path_rc_detailed_design.v1",
        "machine_key": "TT_V311_MONEY_PATH_RC_DETAILED_DESIGN",
        "status": "DESIGN_COMPLETE_IMPLEMENTATION_BLOCKED",
        "recorded_utc": now,
        "ssot": [
            "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md",
            "registry/v311-production-exit-criteria.v1.yaml",
        ],
        "exit_gates": ["M-RC-00", "M-RC-01", "M-RC-02", "M-RC-03", "M-RC-04"],
        "start_gate": "GOVERNANCE_RC_CLOSED",
        "implementation_status": "NOT_STARTED",
        "governance_rc": {
            "mode": "FROZEN_WAITING_EXECUTE",
            "mutate": "FORBIDDEN",
        },
        "recommended_option": "OPT-A",
        "as_is": {
            "fee_router": "0x81A8009210c5215100564c6E4123F672c4459306",
            "fee_router_role": "COMPOSITE_fund_stack_not_ACTIVE_governance_authority",
            "live_bps": {
                "BPS_COUNTRY": 4500,
                "BPS_GLOBAL_OPS": 825,
                "BPS_GLOBAL_RESERVE": 1100,
                "BPS_GLOBAL_STAKERS": 3575,
                "sum": 10000,
            },
            "constitution_require": {
                "steward_bps": 4500,
                "project_revenue_pool_bps": 5500,
                "single_prp_rail": True,
            },
            "escrow_gap": (
                "Escrow.release advances SERVICE_FEE_DISTRIBUTABLE then "
                "SERVICE_FEE_DISTRIBUTED in the same transaction without "
                "chargeback/refund window — REG-04 must separate gates"
            ),
            "rails": {
                "order_escrow": "EXISTS (factory instances)",
                "p4cap": "LIVE ACTIVE freeze",
                "project_revenue_pool": "LOGICAL null",
                "founder_bootstrap": "LOGICAL null",
            },
        },
        "TRE-02": {
            "gate": "M-RC-01",
            "constitution": "Ch.12.4 / Ch.14 / Final §13-14",
            "problem": "FeeRouter LEGACY multi-bucket is not Constitution 45/55 PRP",
            "option_A": {
                "name": "DistributableSplitter + ProjectRevenuePool (RECOMMENDED)",
                "components": [
                    "ProjectRevenuePool (USDC receiver + Timelock-governed spend)",
                    "DistributableSplitter (or EscrowV311FeeAdapter): "
                    "only after DISTRIBUTABLE; 4500 steward path / 5500 PRP "
                    "(or 10000 PRP if no ACTIVE steward)",
                    "Steward path = Country/RegionVault or steward claim sink "
                    "keyed by Order.destination_country",
                    "Deprecate FeeRouter as Constitution distributable SSOT "
                    "(may remain LEGACY COMPOSITE for non-Constitution paths)",
                ],
                "owner_of_splitter": "Timelock (Safe→Timelock)",
                "touches": [
                    "new_contracts_or_adapter",
                    "Escrow platformFeeRecipient wiring",
                    "Runtime BE",
                    "Indexer projections",
                ],
            },
            "option_B": {
                "name": "Reconfigure FeeRouter via setRoutingConfig",
                "summary": (
                    "Collapse non-country 55% into one ProjectRevenuePool address; "
                    "set globalOps=PRP, globalReserve=PRP, globalStakers=PRP OR "
                    "set bps to 5500/0/0 with single sink — must prove semantic "
                    "== Constitution; LEGACY event shape may remain"
                ),
                "risk": "Naming/ABI still LEGACY; harder audit story",
                "touches": ["FeeRouter_config_via_Timelock", "Runtime"],
            },
            "implementation_steps_when_started": [
                "Owner locks OPT-A (default) or OPT-B in writing (MP-D0)",
                "Deploy ProjectRevenuePool (or designate existing vault as PRP)",
                "Implement splitter/adapter + unit/forge tests",
                "Wire EscrowFactory default platformFeeRecipient → splitter",
                "BE: destination_country + steward ACTIVE lookup for 45/55 vs 100%",
                "Sepolia deploy under new Money-Path Timelock proposal cycle",
                "On-chain money-flow: Escrow release → splitter → steward+PRP",
                "Mark FeeRouter non-SSOT for Constitution distributable",
            ],
            "acceptance": [
                "Live proof 4500/5500 or 10000 PRP",
                "LEGACY multi-bucket not Constitution SSOT",
                "M-RC-01 CLOSED",
            ],
        },
        "REG-01": {
            "gate": "M-RC-02",
            "constitution": "Ch.14",
            "problem": "PRP and Founder Bootstrap live addresses OPEN",
            "rails_target": [
                {
                    "id": "order_escrow",
                    "status_target": "KEEP",
                    "note": "EscrowFactory instances — principal/refund/dispute",
                },
                {
                    "id": "governance_treasury_p4cap",
                    "status_target": "KEEP_ACTIVE",
                    "address": "0x6A10df057c637A295b48D91A8101d22542425905",
                    "note": "Public Sale sink — do not retarget",
                },
                {
                    "id": "project_revenue_pool",
                    "status_target": "DEPLOY_OR_DESIGNATE",
                    "address": "OWNER_INPUT_AT_START",
                    "receives": "55% or 100% Distributable",
                },
                {
                    "id": "founder_bootstrap_wallet",
                    "status_target": "OWNER_DESIGNATE",
                    "address": "OWNER_INPUT_AT_START",
                    "receives": "Platform Access Fee 300000 USDC",
                },
            ],
            "implementation_steps_when_started": [
                "Owner designates Founder Bootstrap wallet (EOA or Safe)",
                "Deploy/designate PRP; Timelock as admin for spends",
                "Prove four addresses distinct and role-isolated",
                "Registry cutover ONLY inside Money-Path RC (not Governance freeze)",
                "Access Fee orchestration points to Founder (REG-03 may follow same RC if scoped)",
            ],
            "acceptance": [
                "Four non-null non-overlapping rails",
                "Isolation proof in evidence",
                "M-RC-02 CLOSED",
            ],
        },
        "REG-04": {
            "gate": "M-RC-03",
            "constitution": "Ch.9 / Final §11",
            "bundle_with": "TRE-02",
            "problem": (
                "State machine exists in Escrow/core but end-to-end Runtime honesty OPEN; "
                "release() collapses DISTRIBUTABLE→DISTRIBUTED same tx"
            ),
            "target_behavior": {
                "states": [
                    "SERVICE_FEE_PENDING",
                    "SERVICE_FEE_LOCKED",
                    "SERVICE_FEE_DISTRIBUTABLE",
                    "SERVICE_FEE_DISTRIBUTED",
                ],
                "rules": [
                    "Refunds/chargebacks adjust before DISTRIBUTABLE",
                    "Splitter.distribute only when state == DISTRIBUTABLE",
                    "DISTRIBUTED only after successful 45/55 or 100% PRP transfer",
                    "Forbid Revenue-as-distributable naming",
                ],
            },
            "implementation_steps_when_started": [
                "Change Escrow completion path: stop at DISTRIBUTABLE on release "
                "(or explicit finalizeDistributable after dispute window) — "
                "Money-Path contract change under new RC",
                "Splitter pulls/pays only if DISTRIBUTABLE",
                "BE/Runtime consumes state machine; country fee params",
                "Indexer: payout views only DISTRIBUTABLE/DISTRIBUTED",
                "Close registry honesty after live proof",
            ],
            "acceptance": [
                "No payout before DISTRIBUTABLE",
                "Runtime honesty CLOSED",
                "M-RC-03 CLOSED",
            ],
        },
        "verification_matrix": {
            "V-UNIT": [
                "forge: ServiceFeeStates transitions illegal paths revert",
                "forge: splitter 4500/5500 and 10000 PRP cases",
                "cargo: service_fee_state_v311 + destination_country_v311",
            ],
            "V-INTEGRATION": [
                "Escrow release → DISTRIBUTABLE (not auto DISTRIBUTED)",
                "Splitter distribute → steward + PRP balances",
                "Refund before DISTRIBUTABLE adjusts fee",
            ],
            "V-SEPOLIA": [
                "Deploy Money-Path components",
                "Fund Escrow USDC → release → observe rails",
                "Tx receipts in Money-Path evidence pack",
                "chain_id=11155111 only",
            ],
            "V-REGRESSION": [
                "Function cert money-path slice",
                "Product cert money-path surface",
                "UI cert no false Constitution claims",
                "Drift Audit still 0 on non-money layers",
            ],
            "V-REAUDIT": [
                "M-RC-04 Money-Path Re-Audit PASS",
                "Constitution Production Alignment Audit PASS",
                "TRE-02/REG-01/REG-04 CLOSED",
                "P0/P1/Drift/Conflict = 0 for money-path",
            ],
        },
        "rollback_plan": {
            "principles": [
                "Money-Path changes use new Timelock proposals — do not rewrite Governance Proposal #1",
                "ACTIVE address matrix cutover is atomic and reversible via Timelock to prior recipient",
                "Keep FeeRouter bytecode available as LEGACY fallback until M-RC-04 PASS + soak",
            ],
            "triggers": [
                "On-chain money-flow FAIL",
                "Re-Audit FAIL with Blocking",
                "Unexpected fund misroute",
            ],
            "steps": [
                "Pause splitter.distribute / FeeRouter.distributePaused if applicable",
                "Timelock schedule restore platformFeeRecipient to last known-good",
                "Revert Runtime first-wins to pre-Money-Path pins",
                "Registry: mark Money-Path cutover ROLLED_BACK; keep evidence",
                "Do not claim Constitution PASS while rolled back",
                "Re-open Money-Path RC items as OPEN; Governance RC remains CLOSED",
            ],
            "data": [
                "No rewrite of historical Escrow ledgers",
                "Misrouted funds: Owner/Timelock recovery runbook only",
            ],
        },
        "day0_runbook_after_governance_closed": [
            "Confirm G-RC-05 Governance RC CLOSED evidence",
            "Owner opens Money-Path RC (M-RC-00) + lock OPT-A",
            "Owner inputs Founder + PRP addresses",
            "Implement TRE-02 → REG-01 → REG-04 per this pack",
            "Sepolia deploy + money-flow verify",
            "Function/Product/UI regression",
            "Money-Path Re-Audit PASS (M-RC-04)",
            "Constitution Production Alignment Audit PASS",
            "Then X-FREEZE / X-GO per Exit Criteria",
        ],
    }

    (EV / "MONEY-PATH-RC-DETAILED-DESIGN-LATEST.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    md = f"""# Money-Path RC · Detailed Technical Design Pack

**Machine:** `TT_V311_MONEY_PATH_RC_DETAILED_DESIGN`  
**Status:** `DESIGN_COMPLETE_IMPLEMENTATION_BLOCKED`  
**Recorded:** `{now}`  
**SSOT:** Constitution V3.1.1 Final · `TT_V311_PRODUCTION_EXIT_CRITERIA_V1`  
**Start:** only after **Governance RC CLOSED**  
**Now:** Governance = `FROZEN_WAITING_EXECUTE` · **no** protocol/ACTIVE/Runtime/Registry/Package changes · **no** implementation

---

## 0 · Governance monitor (this stamp)

| Field | Value |
|-------|-------|
| Proposal #1 | `{mon['proposal_state_name']}` ({prop_state}) |
| Execute ETA | `{ETA}` |
| Remaining | ~{mon['hours_remaining']} h |
| Executable now | `{mon['executable_now']}` |

---

## 1 · AS-IS vs Constitution

| Item | AS-IS | Constitution |
|------|-------|--------------|
| FeeRouter BPS | 4500 / 825 / 1100 / 3575 | 4500 steward / **5500 single PRP** |
| PRP address | null | required Ch.14 |
| Founder Bootstrap | null | required Ch.14 / Ch.4 |
| Escrow fee states | PENDING→LOCKED→DISTRIBUTABLE→DISTRIBUTED **same release tx** | DISTRIBUTABLE before payout; refunds before DISTRIBUTABLE |

**Recommended design option:** **OPT-A** (DistributableSplitter + ProjectRevenuePool).  
OPT-B (FeeRouter `setRoutingConfig` collapse) = alternate, weaker audit story.

---

## 2 · TRE-02 · Technical design (M-RC-01)

### OPT-A (default)

```text
Escrow (platform fee)
  → only when SERVICE_FEE_DISTRIBUTABLE
  → DistributableSplitter
       ├─ 45% → Steward path (destination_country / RegionVault)
       └─ 55% → ProjectRevenuePool
  (no ACTIVE steward → 100% → ProjectRevenuePool)

FeeRouter LEGACY → not Constitution distributable SSOT
```

**Owner of splitter / PRP spends:** Safe → Timelock.  
**When started:** deploy PRP + splitter/adapter · wire EscrowFactory recipient · BE steward lookup · Sepolia money-flow · evidence.

### Acceptance
Live 45/55 or 100% PRP · LEGACY not SSOT · M-RC-01 CLOSED.

---

## 3 · REG-01 · Four rails (M-RC-02)

| Rail | Action |
|------|--------|
| Order Escrow | KEEP |
| P4Cap `0x6A10…5905` | KEEP (Public Sale) — do not retarget |
| Project Revenue Pool | **DEPLOY/DESIGNATE** at Money-Path start |
| Founder Bootstrap | **OWNER DESIGNATE** at Money-Path start |

Prove non-null, non-overlapping, no commingling → M-RC-02 CLOSED.

---

## 4 · REG-04 · Distributable Runtime (M-RC-03 · bundle TRE-02)

1. Escrow completion stops at **DISTRIBUTABLE** (or explicit finalize after dispute window) — not auto DISTRIBUTED in same tx.  
2. Splitter pays only if DISTRIBUTABLE → then DISTRIBUTED.  
3. BE/Runtime + Indexer consume states; close honesty after live proof.  
4. Naming: **Distributable Platform Service Fee** only.

---

## 5 · Verification matrix

| ID | Scope |
|----|-------|
| **V-UNIT** | forge state machine + splitter; cargo destination_country / fee state |
| **V-INTEGRATION** | release→DISTRIBUTABLE; distribute→balances; refund-before-DISTRIBUTABLE |
| **V-SEPOLIA** | deploy · Escrow USDC path · tx receipts · chain 11155111 |
| **V-REGRESSION** | Function/Product/UI money-path slice · Drift non-money still 0 |
| **V-REAUDIT** | M-RC-04 PASS · Constitution Audit PASS · TRE-02/REG-01/REG-04 CLOSED |

---

## 6 · Rollback plan

| Trigger | Action |
|---------|--------|
| Money-flow FAIL / Re-Audit Blocking / misroute | Pause distribute |
| | Timelock restore `platformFeeRecipient` to last known-good |
| | Runtime first-wins revert to pre-Money-Path |
| | Mark cutover `ROLLED_BACK` · keep evidence · no Constitution PASS claim |
| | Re-open Money-Path items; **Governance RC stays CLOSED** |

Do **not** rewrite Governance Proposal #1. New Timelock cycle for Money-Path only.

---

## 7 · Day-0 after Governance CLOSED

1. Confirm G-RC-05 CLOSED  
2. M-RC-00 START + lock **OPT-A**  
3. Owner inputs Founder + PRP  
4. Implement TRE-02 → REG-01 → REG-04  
5. Sepolia deploy + money-flow  
6. Function/Product/UI regression  
7. M-RC-04 Re-Audit PASS  
8. Constitution Production Alignment **PASS**  
9. X-FREEZE → X-GO per Exit Criteria  

---

## 8 · Artifacts

- JSON: `MONEY-PATH-RC-DETAILED-DESIGN-LATEST.json`  
- Charter: `MONEY-PATH-RC-CHARTER-LATEST.json`  
- Proof chain: `CONSISTENCY-PROOF-CHAIN-LATEST.md`  
- Monitor: `../GO_phase2_v311_final_release/F02-EXECUTE-MONITOR-LATEST.json`  
"""
    (EV / "MONEY-PATH-RC-DETAILED-DESIGN-LATEST.md").write_text(md, encoding="utf-8")

    # Update design pointer + charter
    for name in ("MONEY-PATH-RC-DESIGN-LATEST.json", "MONEY-PATH-RC-CHARTER-LATEST.json"):
        p = EV / name
        if not p.exists():
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        d["detailed_design"] = (
            "evidence/GO_v311_constitution_production_alignment_audit/"
            "MONEY-PATH-RC-DETAILED-DESIGN-LATEST.json"
        )
        d["status"] = (
            "REGISTERED_NOT_STARTED"
            if "CHARTER" in name
            else "DESIGN_COMPLETE_IMPLEMENTATION_BLOCKED"
        )
        d["implementation_status"] = "BLOCKED_UNTIL_GOVERNANCE_RC_CLOSED"
        d["recommended_option"] = "OPT-A"
        d["recorded_utc"] = now
        p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # dual board stamp
    for p in (
        EV / "DUAL-RC-TRACK-BOARD-LATEST.json",
        FRE / "DUAL-RC-TRACK-BOARD-LATEST.json",
    ):
        if not p.exists():
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        d["recorded_utc"] = now
        d["mode"] = "FROZEN_WAITING_EXECUTE"
        d["money_path_detailed_design"] = "COMPLETE"
        d["money_path_implement_now"] = "BLOCKED_UNTIL_GOVERNANCE_RC_CLOSED"
        d["governance_rc_mutate_now"] = "FORBIDDEN"
        p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "governance": {
                    "mode": "FROZEN_WAITING_EXECUTE",
                    "proposal_state": prop_state,
                    "remain_h": mon["hours_remaining"],
                },
                "money_path_design": "COMPLETE",
                "implementation": "BLOCKED_UNTIL_GOVERNANCE_RC_CLOSED",
                "recommended": "OPT-A",
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
