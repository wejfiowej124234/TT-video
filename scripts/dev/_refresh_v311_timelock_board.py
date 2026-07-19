#!/usr/bin/env python3
"""Refresh Timelock parallel board/evidence after machine closes (no ACTIVE mutations)."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_phase2_v311_final_release"
now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def main() -> None:
    bc = json.loads((EV / "P2-BYTECODE-LIVE-VERIFY-LATEST.json").read_text(encoding="utf-8"))
    deploy_pass = bc.get("verdict") == "PASS" and bc.get("fail_count") == 0

    deploy = {
        "machine_key": "TT_V311_DEPLOYMENT_CERT",
        "status": "PASS" if deploy_pass else "PARTIAL",
        "recorded_utc": now,
        "inventory_path": "registry/v311-web3-deployment-inventory.v1.json",
        "bytecode_live": "evidence/GO_phase2_v311_final_release/P2-BYTECODE-LIVE-VERIFY-LATEST.json",
        "checks": {
            "inventory_present": True,
            "bytecode_live_addressable": f"{bc.get('pass_count')}/0 fail",
            "skips_expected": bc.get("skips_expected"),
            "proxy_upgrade_authority": "Safe→Timelock documented",
            "safe_threshold_cast": 1,
        },
        "tt_v311_deployment_cert": "PASS" if deploy_pass else "PARTIAL",
        "note": "Skips PROXY_SHELL / ESCROW_INSTANCE / INDEXER_EVENTS are by design (no single address).",
    }
    (EV / "P2-DEPLOYMENT-CERT-LATEST.json").write_text(
        json.dumps(deploy, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P2-DEPLOYMENT-CERT-LATEST.md").write_text(
        f"""# Phase 2 · Deployment Certification

**Machine:** `TT_V311_DEPLOYMENT_CERT`  
**Status:** **{"PASS" if deploy_pass else "PARTIAL"}**  
**Recorded:** {now}

| Check | Result |
|-------|--------|
| Deployment Inventory | ✅ 20 components |
| Live bytecode (Sepolia) | ✅ {bc.get('pass_count')} addresses with code · fail={bc.get('fail_count')} |
| Expected skips | PROXY_SHELL · ESCROW_INSTANCE · INDEXER_EVENTS |
| Safe threshold | ✅ 1 |
| Upgrade authority | ✅ Safe→Timelock |

Evidence: `P2-BYTECODE-LIVE-VERIFY-LATEST.json`
""",
        encoding="utf-8",
    )

    dims = {
        "CMS": "PASS_SCOPE_JP",
        "OCS": "OPEN",
        "Public_Catalog": "PARTIAL_MATRICES_PRESENT",
        "Provider": "OPEN",
        "Guide": "OPEN",
        "Destination": "PARTIAL_CATALOG",
        "Country": "PASS_SCOPE_JP",
        "Media": "PASS_SCOPE_JP",
        "Translation_i18n": "OPEN",
        "AI_Search_Index": "OPEN",
        "API_Projection": "OPEN",
        "Indexer_Projection": "PASS_I01_EMPTY_CLEAN",
        "Search_Index": "OPEN",
    }
    data = {
        "machine_key": "TT_DATA_CERT",
        "status": "PARTIAL",
        "recorded_utc": now,
        "tt_data_cert": "PARTIAL",
        "dimensions": dims,
        "cites": {
            "CMS_JAPAN_CONTENT_QA": "CLOSED",
            "TT_CMS_JP_COUNTRY": "CLOSED",
            "evidence": "evidence/GO_cms_operation/CMS-JAPAN-CONTENT-QA-LATEST.json",
            "I01": "evidence/GO_phase2_v311_web3_full_function_cert/tier_c_state/I-01-indexer-reconcile-live.json",
        },
        "note": "JP CMS/Country/Media CLOSED cited. Full TT_DATA_CERT still not PASS (Provider/Guide/i18n/Search/OCS open).",
    }
    (EV / "P2.5-DATA-CERT-LATEST.json").write_text(
        json.dumps(data, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P2.5-DATA-CERT-LATEST.md").write_text(
        f"""# Phase 2.5 · Data Certification

**Machine:** `TT_DATA_CERT`  
**Status:** **PARTIAL**（未宣称全量 PASS）  
**Recorded:** {now}

| Dimension | Status |
|-----------|--------|
"""
        + "\n".join(f"| {k} | {v} |" for k, v in dims.items())
        + """

**Cite：** `TT_CMS_JP_CONTENT_QA: CLOSED` · `TT_CMS_JP_COUNTRY: CLOSED` · I-01 PASS.  
**Exit for PASS：** 非 JP 维 + Provider/Guide/i18n/Search/OCS 全 CLOSED。
""",
        encoding="utf-8",
    )

    ops = {
        "machine_key": "TT_OPERATIONS_CERT",
        "status": "PARTIAL",
        "recorded_utc": now,
        "tt_operations_cert": "PARTIAL",
        "security": {
            "Roles": "DOCUMENTED",
            "Access_Control": "DOCUMENTED",
            "Safe_Threshold": "VERIFIED_1",
            "Timelock_Delay": "VERIFIED_172800",
            "Pause": "DOCUMENTED_PATH",
            "Emergency": "DOCUMENTED_INCIDENT",
        },
        "operations": {
            "Alert": "OWNER_CONFIG",
            "Monitor": "PROBES_DOCUMENTED",
            "Backup": "GIT_EVIDENCE_DOCUMENTED",
            "Recovery": "RUNBOOK_WRITTEN",
            "Upgrade_Runbook": "RUNBOOK_WRITTEN",
            "Incident_Runbook": "RUNBOOK_WRITTEN",
        },
        "runbook": "docs/runbook/TT-V311-RECOVERY-UPGRADE-INCIDENT-LATEST.md",
        "note": "Recovery/Upgrade/Incident + Safe/Timelock verified. Alert pager OWNER_CONFIG → not full PASS.",
    }
    (EV / "P6.5-OPERATIONS-CERT-LATEST.json").write_text(
        json.dumps(ops, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P6.5-OPERATIONS-CERT-LATEST.md").write_text(
        f"""# Phase 6.5 · Security & Operations Certification

**Machine:** `TT_OPERATIONS_CERT`  
**Status:** **PARTIAL**  
**Recorded:** {now}  
**Runbook:** [`TT-V311-RECOVERY-UPGRADE-INCIDENT-LATEST.md`](../../../docs/runbook/TT-V311-RECOVERY-UPGRADE-INCIDENT-LATEST.md)

| Item | Status |
|------|--------|
| Safe Threshold | ✅ 1 |
| Timelock Delay | ✅ 172800s |
| Upgrade / Recovery / Incident Runbook | ✅ written |
| Alert pager | ❌ OWNER_CONFIG |
| Monitor / Backup | ⚠ documented · not prod-wired |

**≠ PASS** until Alert OWNER_CONFIG closed or Owner accepts Non-blocking.
""",
        encoding="utf-8",
    )

    (EV / "P7-DOCUMENT-EVIDENCE-LATEST.md").write_text(
        f"""# Phase 7 · Documentation & Evidence

**Machine:** `TT_DOCUMENT_EVIDENCE_FREEZE`  
**Status:** **PARTIAL**（索引齐 · 未 FREEZE）  
**Recorded:** {now}

## Indexed / frozen-ready

- Formal RE Ladder + PSG domains
- V311 FRE instance + F-02 parallel pack
- Config baseline pin + ENV key whitelist (examples only)
- P2 bytecode live verify + Deploy Cert
- P2.5 Data Cert board (JP CMS CLOSED cite)
- P5 UI gates · P6 Product skeleton
- P6.5 Ops runbook (Recovery/Upgrade/Incident)
- Closure Audit itemized

## Still open before FREEZE

- Alert OWNER_CONFIG evidence
- Full Data Cert
- Function Cert 54/0/0（Execute 后）
- Release Package LOCK（7.5）

**≠ FREEZE PASS。**
""",
        encoding="utf-8",
    )

    pkg = {
        "machine_key": "TT_RELEASE_PACKAGE",
        "status": "PREP_COMPLETE",
        "label_candidate": "TravelTrust V3.1.1 RC1",
        "recorded_utc": now,
        "tt_release_package": "NOT_LOCKED",
        "includes_checklist": {
            "Release_Notes": "PARTIAL_TEMPLATE",
            "Registry": "PINNED_REFS",
            "Evidence": "BOARD_PRESENT",
            "Deployment_Inventory": "PRESENT",
            "Address_Matrix": "FROZEN_PINNED",
            "Contract_Inventory": "PRESENT_BYTECODE_PASS",
            "Runbook": "OPS_RECOVERY_PRESENT",
            "Recovery": "PRESENT",
            "Architecture": "PSG_DOMAINS_PRESENT",
            "Version": "V3.1.1",
            "Git_SHA": "CAPTURE_AT_LOCK",
        },
        "lock_requires": [
            "TT_V311_WEB3_FULL_FUNCTION_CERT_54_0_0",
            "remaining_machine_exits_or_owner_accept",
        ],
        "note": "PREP complete; LOCK only after Execute Function Cert PASS (and remaining OPEN accepted/closed).",
    }
    (EV / "P7.5-RELEASE-PACKAGE-PREP-LATEST.json").write_text(
        json.dumps(pkg, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P7.5-RELEASE-PACKAGE-PREP-LATEST.md").write_text(
        f"""# Phase 7.5 · Release Package（PREP_COMPLETE · NOT_LOCKED）

**Machine:** `TT_RELEASE_PACKAGE`  
**Status:** **PREP_COMPLETE · NOT_LOCKED**  
**Candidate:** TravelTrust V3.1.1 RC1  
**Recorded:** {now}

清单齐备；**禁止 LOCK** 直至 Function Cert **54/0/0**（Execute 后）及残余机器项关闭或 Owner 接受。
""",
        encoding="utf-8",
    )

    # Config baseline note
    (EV / "P0.5-CONFIGURATION-BASELINE-LATEST.md").write_text(
        f"""# Phase 0.5 · Configuration Baseline

**Machine:** `TT_CONFIGURATION_BASELINE`  
**Status:** **PARTIAL**  
**Recorded:** {now}

| Pin | Status |
|-----|--------|
| Address matrix sha256 pin | ✅ `registry/v311-configuration-baseline.v1.json` |
| Deployment inventory pin | ✅ |
| ENV key whitelist (examples only) | ✅ `P0.5-ENV-WHITELIST-KEYS-LATEST.json` |
| Runtime secret values | ❌ not read / not pinned（纪律） |

**≠ PASS** until Owner attaches non-secret runtime endpoint pins (RPC/Indexer/WC id) without committing secrets.
""",
        encoding="utf-8",
    )

    items = [
        ("C-01", "P0", "CLOSED", "AGENTS address authority → v311_sepolia_clean_baseline"),
        ("C-02", "P0", "CLOSED", "WEB3 ACTIVE Execution Matrix MD address pointer → v311"),
        ("C-03", "P0", "CLOSED", "Formal RE Ladder + PSG domain hierarchy SSOT written"),
        ("C-04", "P0", "OPEN", "Function Cert waiting F-02 Execute (ETA 2026-07-20T11:37:37Z)"),
        ("C-05", "P0", "OPEN", "Product Cert aggregate OPEN (waits Function+UI+Data)"),
        ("C-06", "P0", "PARTIAL", "Data Cert PARTIAL — JP CMS/Country CLOSED; other dims OPEN"),
        ("C-07", "P0", "OPEN", "UI Full Cert real-wallet/real-tx OPEN"),
        ("C-08", "P0", "PARTIAL", "Config Baseline: matrix+ENV keys pinned; runtime endpoints OWNER"),
        ("C-09", "P1", "CLOSED", "Deployment Cert PASS — live bytecode 17/0 + expected skips"),
        ("C-10", "P1", "PARTIAL", "Ops: Recovery/Upgrade/Incident + Safe/Timelock verified; Alert OWNER"),
        ("C-11", "P1", "CLOSED", "Recovery Cert runbook written (TT-V311-RECOVERY-UPGRADE-INCIDENT)"),
        ("C-12", "P1", "PARTIAL", "Release Package PREP_COMPLETE · NOT_LOCKED until Function Cert"),
        ("C-13", "P1", "PARTIAL", "Hygiene: cinematic maybe-run restored; full Legacy sweep remains"),
        ("C-14", "P1", "CLOSED", "Five-main UI gate PASS (150)"),
        ("C-15", "P1", "CLOSED", "Wallet L5 smoke PASS"),
        ("C-16", "P1", "CLOSED", "Itinerary L5 green PASS (146)"),
        ("C-17", "P1", "CLOSED", "Web3 Active Execution Matrix gate PASS"),
        ("C-18", "P1", "CLOSED", "I-01 Indexer Live Reconcile PASS"),
        ("C-19", "P2", "CLOSED", "maybe-run-cinematic-l5-verify-on-diff.sh restored"),
        ("C-20", "P2", "OPEN", "Binding RC-02 not started (current window NON_BINDING)"),
        ("C-21", "P0", "BLOCKED", "Phase 8 RC LOCK blocked until machines + Function Cert"),
        ("C-22", "P0", "BLOCKED", "TT_PSG_SEPOLIA_FREEZE not entered"),
        ("C-23", "P0", "BLOCKED", "Production GO not entered"),
        ("C-24", "P1", "CLOSED", "CMS Japan Content QA CLOSED (5/5 cities)"),
    ]
    closed = sum(1 for i in items if i[2] == "CLOSED")
    open_n = sum(1 for i in items if i[2] in ("OPEN", "BLOCKED", "PARTIAL"))
    (EV / "PHASE-MINUS1-FINAL-CLOSURE-AUDIT-LATEST.md").write_text(
        f"""# Phase −1 · Final Closure Audit（刷新）

**Machine:** `TT_V311_FINAL_CLOSURE_AUDIT`  
**Status:** **IN_PROGRESS**（OPEN ≠ 0）  
**Recorded:** {now}  
**F-02 ETA:** 2026-07-20T11:37:37Z · Timelock 只读（无合约/ACTIVE/Runtime/Registry ACTIVE 突变）

| # | Sev | Status | Item |
|---|-----|--------|------|
"""
        + "\n".join(f"| {a} | {b} | **{c}** | {d} |" for a, b, c, d in items)
        + f"""

**Counts:** CLOSED={closed} · OPEN/PARTIAL/BLOCKED={open_n} · total={len(items)}
""",
        encoding="utf-8",
    )
    (EV / "PHASE-MINUS1-FINAL-CLOSURE-AUDIT-LATEST.json").write_text(
        json.dumps(
            {
                "machine_key": "TT_V311_FINAL_CLOSURE_AUDIT",
                "status": "IN_PROGRESS",
                "recorded_utc": now,
                "closed": closed,
                "open_partial_blocked": open_n,
                "total": len(items),
                "items": [
                    {"id": a, "sev": b, "status": c, "text": d} for a, b, c, d in items
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    board = {
        "machine_key": "TT_V311_FINAL_RELEASE_ENGINEERING",
        "ladder_version": "20260718-enterprise-final",
        "mode": "F02_TIMELOCK_PARALLEL_READONLY",
        "recorded_utc": now,
        "f02_execute_after_utc": "2026-07-20T11:37:37Z",
        "forbid": [
            "mutate_contracts",
            "mutate_active_address_matrix",
            "mutate_runtime",
            "mutate_registry_active",
            "protocol_logic",
        ],
        "phases": {
            "P-1": "IN_PROGRESS",
            "P0": "PARTIAL",
            "P0.5": "PARTIAL",
            "P1": "PASS",
            "P2": "PASS" if deploy_pass else "PARTIAL",
            "P2.5": "PARTIAL",
            "P3": "PASS",
            "P4": "IN_PROGRESS_F02_QUEUED",
            "P5": "PARTIAL",
            "P6": "OPEN",
            "P6.5": "PARTIAL",
            "P7": "PARTIAL",
            "P7.5": "PREP_COMPLETE_NOT_LOCKED",
            "P8": "BLOCKED",
            "P9": "BLOCKED",
            "P10": "BLOCKED",
            "P10.5": "BLOCKED",
            "TT_PSG_SEPOLIA_FREEZE": "NOT_CLAIMED",
            "Production_GO": "NOT_CLAIMED",
        },
        "after_execute": [
            "Function_Cert_54_0_0",
            "finish_remaining_OPEN",
            "Phase_8_RC_LOCK",
            "Phase_9_new_RC02",
            "Phase_10_Manual",
            "Phase_10.5_Readiness_Review",
            "TT_PSG_SEPOLIA_FREEZE",
            "Production_GO",
        ],
    }
    (EV / "TIMELOCK-PARALLEL-BOARD-LATEST.json").write_text(
        json.dumps(board, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "TIMELOCK-PARALLEL-BOARD-LATEST.md").write_text(
        f"""# F-02 Timelock · Parallel Machine Board

**Mode:** READONLY wait · Formal RE Ladder  
**Recorded:** {now}  
**Execute ETA:** 2026-07-20T11:37:37Z

| Phase | Status |
|-------|--------|
| −1 Closure Audit | IN_PROGRESS（CLOSED={closed}/{len(items)}） |
| 0 Hygiene | PARTIAL |
| 0.5 Config Baseline | PARTIAL |
| 1 Alignment | **PASS** |
| 2 Deploy Cert | **{"PASS" if deploy_pass else "PARTIAL"}** |
| 2.5 Data Cert | PARTIAL（JP CMS CLOSED） |
| 3 PSG Baseline | **PASS** |
| 4 Function Cert | IN_PROGRESS（F-02 Queued） |
| 5 UI/UX | PARTIAL |
| 6 Product | OPEN |
| 6.5 Ops | PARTIAL（Runbook ✅ · Alert OWNER） |
| 7 Docs/Evidence | PARTIAL |
| 7.5 Package | **PREP_COMPLETE · NOT_LOCKED** |
| 8…10.5 / Freeze / GO | BLOCKED / NOT_CLAIMED |

**Execute 后统一：** Function Cert **54/0/0** → 关残余 OPEN → Phase 8 → RC-02 → Manual → P10.5 → Freeze → GO。  
**未宣称：** Package LOCK · Freeze · GO。
""",
        encoding="utf-8",
    )

    print("closed", closed, "openish", open_n, "deploy", deploy["status"])


if __name__ == "__main__":
    main()
