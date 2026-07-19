#!/usr/bin/env python3
"""
Freeze Money-Path IMPLEMENTATION_READY baseline + final implementation pack.

No protocol/ACTIVE/Runtime/Registry/Package mutation.
No coding implementation.
Governance RC remains FROZEN_WAITING_EXECUTE.
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
BASELINE_ID = "MP-IMPL-BASELINE-20260718-OPT-A"


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

    ar = json.loads(
        (EV / "MONEY-PATH-ARCHITECTURE-REVIEW-LATEST.json").read_text(encoding="utf-8")
    )
    assert ar.get("verdict") == "IMPLEMENTATION_READY", "Architecture Review must be READY"

    prop_raw = _cast("call", GOV, "state(uint256)(uint8)", "1")
    try:
        prop_state = int(prop_raw.split()[0])
    except Exception:
        prop_state = None
    eta = datetime(2026, 7, 20, 11, 37, 37, tzinfo=timezone.utc)
    remain = max(0, int((eta - datetime.now(timezone.utc)).total_seconds()))

    execution_order = [
        "M-RC-00",
        "TRE-02",
        "REG-01",
        "REG-04",
        "V-UNIT",
        "V-SEPOLIA",
        "V-REAUDIT",
        "CONSTITUTION_PASS",
    ]

    wbs = [
        {
            "id": "WBS-00",
            "phase": "M-RC-00",
            "title": "Money-Path RC START",
            "tasks": [
                "Confirm Governance RC G-RC-05 CLOSED evidence",
                "Owner lock OPT-A in writing (already default)",
                "Owner input Founder Bootstrap wallet",
                "Owner confirm PRP deploy-new vs designate-existing",
                "Open Money-Path evidence stamp folder for this RC",
            ],
            "depends_on": ["GOVERNANCE_RC_CLOSED"],
            "finding": None,
        },
        {
            "id": "WBS-01",
            "phase": "TRE-02",
            "title": "Constitution distribution OPT-A",
            "tasks": [
                "Add ProjectRevenuePool.sol (+ forge tests)",
                "Add DistributableSplitter.sol or EscrowV311FeeAdapter.sol",
                "Forge cases: 4500/5500 with steward; 10000 PRP without steward",
                "Wire EscrowFactory default platformFeeRecipient → splitter",
                "Document FeeRouter as LEGACY non-Constitution SSOT",
            ],
            "depends_on": ["WBS-00"],
            "finding": "TRE-02",
            "gate": "M-RC-01",
        },
        {
            "id": "WBS-02",
            "phase": "REG-01",
            "title": "Four rails live",
            "tasks": [
                "Record Founder Bootstrap address in Money-Path evidence",
                "Deploy or designate PRP address; Timelock as spend admin",
                "Prove Escrow / P4Cap / PRP / Founder non-overlapping",
                "Prepare Registry cutover patch for Money-Path RC only (apply at start, not now)",
            ],
            "depends_on": ["WBS-00"],
            "finding": "REG-01",
            "gate": "M-RC-02",
            "parallel_ok_with": ["WBS-01"],
        },
        {
            "id": "WBS-03",
            "phase": "REG-04",
            "title": "Distributable state machine end-to-end",
            "tasks": [
                "Escrow.release: advance to DISTRIBUTABLE only (not DISTRIBUTED)",
                "Add finalizeDistribute / splitter callback → DISTRIBUTED after payout",
                "BE/Runtime consume states; destination_country steward lookup",
                "Indexer: retain payout views for DISTRIBUTABLE/DISTRIBUTED only",
                "Close honesty fields after live proof (Money-Path RC)",
            ],
            "depends_on": ["WBS-01"],
            "finding": "REG-04",
            "gate": "M-RC-03",
            "bundle_with": "TRE-02",
        },
        {
            "id": "WBS-04",
            "phase": "V-UNIT",
            "title": "Unit / forge / cargo green",
            "tasks": [
                "forge test ServiceFeeStates + Splitter + Escrow path",
                "cargo test service_fee_state_v311 + destination_country_v311 + indexer projections",
            ],
            "depends_on": ["WBS-01", "WBS-02", "WBS-03"],
        },
        {
            "id": "WBS-05",
            "phase": "V-SEPOLIA",
            "title": "Testnet deploy + money-flow",
            "tasks": [
                "Sepolia deploy PRP + splitter (chain_id=11155111)",
                "New Timelock proposal cycle (not Proposal #1)",
                "Escrow USDC fund → release → DISTRIBUTABLE → split → DISTRIBUTED",
                "Assert steward + PRP balances; capture tx receipts",
            ],
            "depends_on": ["WBS-04"],
        },
        {
            "id": "WBS-06",
            "phase": "V-REGRESSION",
            "title": "Function / Product / UI money-path regression",
            "tasks": [
                "Function cert money-path slice",
                "Product cert money-path surface",
                "UI: no false Constitution full-alignment claim",
                "Drift audit non-money layers still 0",
            ],
            "depends_on": ["WBS-05"],
        },
        {
            "id": "WBS-07",
            "phase": "V-REAUDIT",
            "title": "Money-Path Re-Audit + Constitution PASS",
            "tasks": [
                "M-RC-04 Money-Path Re-Audit PASS",
                "Constitution Production Alignment Audit FAIL→PASS",
                "TRE-02/REG-01/REG-04 CLOSED; P0/P1/Drift/Conflict=0 money-path",
            ],
            "depends_on": ["WBS-06"],
            "gate": "M-RC-04",
        },
    ]

    code_map = {
        "new_or_extend": [
            {
                "path": "contracts/src/ProjectRevenuePool.sol",
                "action": "CREATE",
                "wbs": ["WBS-01", "WBS-02"],
                "role": "PRP USDC rail; Timelock-governed",
            },
            {
                "path": "contracts/src/DistributableSplitter.sol",
                "action": "CREATE",
                "wbs": ["WBS-01", "WBS-03"],
                "role": "45/55 or 100% PRP after DISTRIBUTABLE",
                "alt_name": "EscrowV311FeeAdapter.sol",
            },
            {
                "path": "contracts/test/DistributableSplitterV311.t.sol",
                "action": "CREATE",
                "wbs": ["WBS-04"],
            },
            {
                "path": "contracts/test/ProjectRevenuePoolV311.t.sol",
                "action": "CREATE",
                "wbs": ["WBS-04"],
            },
            {
                "path": "contracts/script/DeployMoneyPathV311.s.sol",
                "action": "CREATE",
                "wbs": ["WBS-05"],
            },
        ],
        "modify_when_started": [
            {
                "path": "contracts/src/Escrow.sol",
                "action": "MODIFY",
                "wbs": ["WBS-03"],
                "change": "release(): stop at DISTRIBUTABLE; separate DISTRIBUTED after split",
            },
            {
                "path": "contracts/src/EscrowFactory.sol",
                "action": "MODIFY_OR_CONFIG",
                "wbs": ["WBS-01"],
                "change": "default platformFeeRecipient → splitter",
            },
            {
                "path": "contracts/src/ServiceFeeStatesV311.sol",
                "action": "KEEP_OR_MINOR",
                "wbs": ["WBS-03"],
                "change": "transitions already SSOT; ensure callers respect",
            },
            {
                "path": "contracts/src/V311EconomicConstants.sol",
                "action": "KEEP",
                "wbs": ["WBS-01"],
                "change": "4500/5500 already present — reuse",
            },
            {
                "path": "contracts/src/FeeRouter.sol",
                "action": "NO_CONSTITUTION_SSOT",
                "wbs": ["WBS-01"],
                "change": "Do not use as Constitution distributable SSOT; LEGACY fallback only",
            },
            {
                "path": "crates/core/src/service_fee_state_v311.rs",
                "action": "EXTEND_IF_NEEDED",
                "wbs": ["WBS-03", "WBS-04"],
            },
            {
                "path": "crates/core/src/destination_country_v311.rs",
                "action": "KEEP_USE",
                "wbs": ["WBS-01", "WBS-03"],
            },
            {
                "path": "crates/core/src/indexer_v311_projections.rs",
                "action": "EXTEND",
                "wbs": ["WBS-03"],
                "change": "payout views DISTRIBUTABLE/DISTRIBUTED only",
            },
            {
                "path": "registry/v311-treasury-rails.v1.yaml",
                "action": "UPDATE_AT_MONEY_PATH_START_ONLY",
                "wbs": ["WBS-02"],
                "change": "Set PRP + Founder live addresses; honesty CLOSED after proof",
            },
        ],
        "forbid_touch_during_governance_freeze": [
            "registry/v311-sepolia-address-matrix-freeze.v1.json",
            "registry/protocol-convergence-deployments.v1.yaml active baseline",
            "Governance Proposal #1 / F-02 execute path artifacts beyond monitor",
        ],
    }

    test_cases = [
        {
            "id": "TC-U-01",
            "phase": "V-UNIT",
            "title": "Illegal service fee transitions revert",
            "command": "forge test --match-contract F04ServiceFeeStateMachineV311 -vv",
            "pass": "illegal PENDING→DISTRIBUTED reverts; happy path OK",
        },
        {
            "id": "TC-U-02",
            "phase": "V-UNIT",
            "title": "Splitter 4500/5500 with steward",
            "command": "forge test --match-contract DistributableSplitterV311 -vv",
            "pass": "steward + PRP balances match bps",
        },
        {
            "id": "TC-U-03",
            "phase": "V-UNIT",
            "title": "Splitter 10000 PRP without steward",
            "command": "forge test --match-test test_no_steward_100pct_prp -vv",
            "pass": "100% to PRP",
        },
        {
            "id": "TC-U-04",
            "phase": "V-UNIT",
            "title": "Escrow release stops at DISTRIBUTABLE",
            "command": "forge test --match-test test_release_halts_distributable -vv",
            "pass": "state==DISTRIBUTABLE; not DISTRIBUTED until split",
        },
        {
            "id": "TC-U-05",
            "phase": "V-UNIT",
            "title": "Rust fee state + destination_country",
            "command": "cargo test -p traveltrust-core service_fee_state_v311 destination_country_v311",
            "pass": "exit 0",
        },
        {
            "id": "TC-I-01",
            "phase": "V-INTEGRATION",
            "title": "Refund before DISTRIBUTABLE adjusts fee",
            "pass": "no splitter payout until DISTRIBUTABLE",
        },
        {
            "id": "TC-S-01",
            "phase": "V-SEPOLIA",
            "title": "Deploy Money-Path on 11155111",
            "pass": "PRP+splitter addresses recorded; Timelock admin",
        },
        {
            "id": "TC-S-02",
            "phase": "V-SEPOLIA",
            "title": "Live Escrow USDC money-flow",
            "pass": "txs + balance deltas for steward path and PRP",
        },
        {
            "id": "TC-R-01",
            "phase": "V-REGRESSION",
            "title": "Function/Product/UI money-path slice",
            "pass": "no false Constitution PASS claim; cert slice green",
        },
        {
            "id": "TC-A-01",
            "phase": "V-REAUDIT",
            "title": "Money-Path Re-Audit M-RC-04",
            "command": "python scripts/dev/run-v311-constitution-production-alignment-audit.py  # money-path slice",
            "pass": "TRE-02/REG-01/REG-04 CLOSED; M-RC-04 PASS",
        },
        {
            "id": "TC-A-02",
            "phase": "CONSTITUTION_PASS",
            "title": "Constitution Production Alignment Audit",
            "pass": "verdict PASS; P0/P1/Drift/Conflict money-path = 0",
        },
    ]

    acceptance = {
        "M-RC-00": [
            "Governance CLOSED evidence cited",
            "OPT-A locked",
            "Founder + PRP decision recorded",
        ],
        "M-RC-01_TRE-02": [
            "Live or forge+sepolia proof 4500/5500 or 10000 PRP",
            "FeeRouter not Constitution distributable SSOT",
        ],
        "M-RC-02_REG-01": [
            "Four rail addresses non-null non-overlapping",
            "P4Cap unchanged as Public Sale sink",
        ],
        "M-RC-03_REG-04": [
            "No payout before DISTRIBUTABLE",
            "DISTRIBUTED only after successful split",
            "Runtime/indexer honesty CLOSED after live proof",
        ],
        "M-RC-04": ["Money-Path Re-Audit PASS"],
        "CONSTITUTION_PASS": [
            "Production Constitution Alignment Audit PASS",
            "No new Blocking",
        ],
        "scope_freeze": [
            "No new requirements",
            "No OPT-A/B redesign",
            "No REG-03/REG-05 in Day-0 unless Owner expands P0",
        ],
    }

    evidence_templates = {
        "root": "evidence/GO_money_path_rc/<STAMP>/",
        "files": [
            {
                "name": "00-M-RC-00-START.json",
                "fields": [
                    "governance_closed_cite",
                    "opt_a_lock",
                    "founder_wallet",
                    "prp_mode",
                    "prp_address_or_pending_deploy",
                ],
            },
            {
                "name": "01-TRE-02-IMPLEMENT.json",
                "fields": [
                    "splitter_address",
                    "prp_address",
                    "forge_pass",
                    "fee_router_ssot_status=LEGACY_NON_CONSTITUTION",
                ],
            },
            {
                "name": "02-REG-01-RAILS.json",
                "fields": [
                    "escrow_factory",
                    "p4cap",
                    "prp",
                    "founder",
                    "isolation_proof",
                ],
            },
            {
                "name": "03-REG-04-STATEMACHINE.json",
                "fields": [
                    "escrow_release_state",
                    "distribute_tx",
                    "final_state=DISTRIBUTED",
                    "runtime_honesty=CLOSED",
                ],
            },
            {
                "name": "04-V-UNIT.json",
                "fields": ["forge_exit", "cargo_exit", "log_tails"],
            },
            {
                "name": "05-V-SEPOLIA-MONEYFLOW.json",
                "fields": [
                    "chain_id=11155111",
                    "deploy_txs",
                    "escrow_flow_txs",
                    "balance_deltas",
                ],
            },
            {
                "name": "06-V-REGRESSION.json",
                "fields": ["function_slice", "product_slice", "ui_note"],
            },
            {
                "name": "07-M-RC-04-REAUDIT.json",
                "fields": ["verdict=PASS", "findings_closed"],
            },
            {
                "name": "08-CONSTITUTION-AUDIT-PASS.json",
                "fields": [
                    "tt_v311_constitution_production_alignment_audit=PASS",
                    "cite",
                ],
            },
            {
                "name": "ROLLBACK-IF-NEEDED.json",
                "fields": ["trigger", "pause", "restore_recipient", "runtime_revert"],
            },
        ],
    }

    pack = {
        "schema": "traveltrust.v311_money_path_implementation_pack.v1",
        "machine_key": "TT_V311_MONEY_PATH_IMPLEMENTATION_PACK",
        "baseline_id": BASELINE_ID,
        "status": "FROZEN_IMPLEMENTATION_PACK",
        "recorded_utc": now,
        "architecture_review": "IMPLEMENTATION_READY",
        "frozen_option": "OPT-A",
        "forbid_new_requirements": True,
        "forbid_redesign": True,
        "forbid_scope_change": True,
        "implementation_now": "BLOCKED_UNTIL_GOVERNANCE_RC_CLOSED",
        "ssot": [
            "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md",
            "registry/v311-production-exit-criteria.v1.yaml",
            "evidence/GO_v311_constitution_production_alignment_audit/MONEY-PATH-ARCHITECTURE-REVIEW-LATEST.json",
            "evidence/GO_v311_constitution_production_alignment_audit/MONEY-PATH-RC-DETAILED-DESIGN-LATEST.json",
        ],
        "execution_order": execution_order,
        "wbs": wbs,
        "code_map": code_map,
        "test_cases": test_cases,
        "acceptance": acceptance,
        "evidence_templates": evidence_templates,
        "governance_monitor": {
            "mode": "FROZEN_WAITING_EXECUTE",
            "proposal_state": prop_state,
            "execute_after_utc": ETA,
            "hours_remaining": round(remain / 3600, 3),
        },
        "tt_v311_money_path_implementation_pack": "FROZEN",
    }

    baseline = {
        "schema": "traveltrust.v311_money_path_implementation_baseline.v1",
        "machine_key": "TT_V311_MONEY_PATH_IMPLEMENTATION_BASELINE",
        "baseline_id": BASELINE_ID,
        "recorded_utc": now,
        "status": "FROZEN",
        "architecture_option": "OPT-A",
        "architecture_review_verdict": "IMPLEMENTATION_READY",
        "sole_p0": ["TRE-02", "REG-01", "REG-04"],
        "execution_order": execution_order,
        "pack": (
            "evidence/GO_v311_constitution_production_alignment_audit/"
            "MONEY-PATH-IMPLEMENTATION-PACK-LATEST.json"
        ),
        "immutable_until_owner_reopen": True,
        "no_new_requirements": True,
        "no_redesign": True,
        "no_scope_change": True,
        "start_when": "GOVERNANCE_RC_CLOSED",
    }

    (EV / "MONEY-PATH-IMPLEMENTATION-PACK-LATEST.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (EV / "MONEY-PATH-IMPLEMENTATION-BASELINE-LATEST.json").write_text(
        json.dumps(baseline, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # Markdown
    wbs_rows = "\n".join(
        f"| {w['id']} | {w['phase']} | {w['title']} | {', '.join(w.get('depends_on') or [])} | {w.get('finding') or '—'} |"
        for w in wbs
    )
    tc_rows = "\n".join(
        f"| {t['id']} | {t['phase']} | {t['title']} | {t['pass']} |" for t in test_cases
    )
    md = f"""# Money-Path RC · Frozen Implementation Pack

**Machine:** `TT_V311_MONEY_PATH_IMPLEMENTATION_PACK`  
**Baseline:** `{BASELINE_ID}` · **Status:** `FROZEN`  
**Recorded:** `{now}`  
**Architecture:** OPT-A · **Review:** IMPLEMENTATION_READY  

**SSOT:** Constitution V3.1.1 · `TT_V311_PRODUCTION_EXIT_CRITERIA_V1` · Architecture Review  

> **No** new requirements · **No** redesign · **No** scope change.  
> **No** protocol/ACTIVE/Runtime/Registry/Package edits in this pack.  
> Implement **only** after Governance RC **CLOSED**.

---

## 0 · Execution order (hard)

```text
M-RC-00 → TRE-02 → REG-01 → REG-04 → V-UNIT → V-SEPOLIA → V-REAUDIT → Constitution PASS
```

(REG-01 may start in parallel with TRE-02 after M-RC-00; REG-04 depends on TRE-02.)

---

## 1 · WBS

| ID | Phase | Title | Depends | Finding |
|----|-------|-------|---------|---------|
{wbs_rows}

---

## 2 · Code map (when started)

### Create
- `contracts/src/ProjectRevenuePool.sol`
- `contracts/src/DistributableSplitter.sol` (or `EscrowV311FeeAdapter.sol`)
- `contracts/test/DistributableSplitterV311.t.sol`
- `contracts/test/ProjectRevenuePoolV311.t.sol`
- `contracts/script/DeployMoneyPathV311.s.sol`

### Modify (Money-Path RC only)
- `contracts/src/Escrow.sol` — halt at DISTRIBUTABLE
- `contracts/src/EscrowFactory.sol` — recipient → splitter
- `crates/core/src/indexer_v311_projections.rs` — payout filter
- `registry/v311-treasury-rails.v1.yaml` — **only at Money-Path start** (PRP/Founder)

### Keep / non-SSOT
- `V311EconomicConstants.sol` (4500/5500)
- `ServiceFeeStatesV311.sol`
- `FeeRouter.sol` — LEGACY, not Constitution SSOT
- `destination_country_v311.rs` — reuse

### Forbidden during Governance freeze
- ACTIVE address matrix · PCD ACTIVE · Proposal #1 rewrite

---

## 3 · Test cases

| ID | Phase | Title | Pass |
|----|-------|-------|------|
{tc_rows}

---

## 4 · Acceptance (by gate)

| Gate | Criteria |
|------|----------|
| M-RC-00 | Governance CLOSED · OPT-A lock · Founder/PRP Owner input |
| M-RC-01 | 45/55 or 100% PRP live proof · FeeRouter non-SSOT |
| M-RC-02 | Four rails live · P4Cap unchanged |
| M-RC-03 | No payout before DISTRIBUTABLE · honesty CLOSED |
| M-RC-04 | Money-Path Re-Audit PASS |
| Constitution | Production Alignment Audit **PASS** · no new Blocking |

---

## 5 · Evidence templates

Root: `evidence/GO_money_path_rc/<STAMP>/`

| File | Purpose |
|------|---------|
| `00-M-RC-00-START.json` | Start gate |
| `01-TRE-02-IMPLEMENT.json` | Distribution |
| `02-REG-01-RAILS.json` | Four rails |
| `03-REG-04-STATEMACHINE.json` | State machine |
| `04-V-UNIT.json` | Unit results |
| `05-V-SEPOLIA-MONEYFLOW.json` | Live flow |
| `06-V-REGRESSION.json` | Cert regression |
| `07-M-RC-04-REAUDIT.json` | Re-Audit PASS |
| `08-CONSTITUTION-AUDIT-PASS.json` | Constitution PASS |
| `ROLLBACK-IF-NEEDED.json` | Rollback |

---

## 6 · Governance monitor

| Field | Value |
|-------|-------|
| Mode | FROZEN_WAITING_EXECUTE |
| Proposal #1 | {prop_state} |
| ETA | {ETA} |
| Remaining | ~{round(remain/3600, 3)} h |

---

## 7 · Artifacts

- Pack: `MONEY-PATH-IMPLEMENTATION-PACK-LATEST.json`
- Baseline: `MONEY-PATH-IMPLEMENTATION-BASELINE-LATEST.json`
- Review: `MONEY-PATH-ARCHITECTURE-REVIEW-LATEST.json`
"""
    (EV / "MONEY-PATH-IMPLEMENTATION-PACK-LATEST.md").write_text(md, encoding="utf-8")

    # Stamp related boards
    for name in (
        "MONEY-PATH-RC-CHARTER-LATEST.json",
        "MONEY-PATH-RC-DETAILED-DESIGN-LATEST.json",
    ):
        p = EV / name
        if not p.exists():
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        d["implementation_baseline_id"] = BASELINE_ID
        d["implementation_pack"] = (
            "evidence/GO_v311_constitution_production_alignment_audit/"
            "MONEY-PATH-IMPLEMENTATION-PACK-LATEST.json"
        )
        d["implementation_status"] = "PACK_FROZEN_BLOCKED_UNTIL_GOVERNANCE_RC_CLOSED"
        d["forbid_redesign"] = True
        d["forbid_scope_change"] = True
        d["recorded_utc"] = now
        if "CHARTER" in name:
            d["status"] = "REGISTERED_IMPLEMENTATION_PACK_FROZEN"
        p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    for p in (
        EV / "DUAL-RC-TRACK-BOARD-LATEST.json",
        FRE / "DUAL-RC-TRACK-BOARD-LATEST.json",
    ):
        if not p.exists():
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        d["recorded_utc"] = now
        d["mode"] = "FROZEN_WAITING_EXECUTE"
        d["money_path_status"] = "IMPLEMENTATION_PACK_FROZEN"
        d["money_path_baseline_id"] = BASELINE_ID
        d["money_path_implement_now"] = "BLOCKED_UNTIL_GOVERNANCE_RC_CLOSED"
        d["forbid_redesign"] = True
        d["forbid_scope_change"] = True
        p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    mon = {
        "machine_key": "TT_V311_F02_EXECUTE_MONITOR",
        "mode": "FROZEN_WAITING_EXECUTE",
        "recorded_utc": now,
        "execute_after_utc": ETA,
        "hours_remaining": round(remain / 3600, 3),
        "proposal_state": prop_state,
        "money_path_baseline_id": BASELINE_ID,
        "money_path_pack": "FROZEN",
        "forbid_mutate": ["protocol", "ACTIVE", "Runtime", "Registry", "Package"],
    }
    (FRE / "F02-EXECUTE-MONITOR-LATEST.json").write_text(
        json.dumps(mon, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # Evidence template stubs (empty structure only — not claiming runs)
    tmpl_dir = EV / "MONEY-PATH-EVIDENCE-TEMPLATES"
    tmpl_dir.mkdir(parents=True, exist_ok=True)
    for f in evidence_templates["files"]:
        stub = {
            "template": f["name"],
            "status": "TEMPLATE_ONLY_NOT_EXECUTED",
            "required_fields": f["fields"],
            "baseline_id": BASELINE_ID,
            "fill_when": "GOVERNANCE_RC_CLOSED_AND_MONEY_PATH_STARTED",
        }
        (tmpl_dir / f["name"].replace(".json", ".TEMPLATE.json")).write_text(
            json.dumps(stub, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )

    print(
        json.dumps(
            {
                "baseline_id": BASELINE_ID,
                "pack": "FROZEN",
                "execution_order": execution_order,
                "wbs_count": len(wbs),
                "test_cases": len(test_cases),
                "implement_now": "BLOCKED_UNTIL_GOVERNANCE_RC_CLOSED",
                "governance_mode": "FROZEN_WAITING_EXECUTE",
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
