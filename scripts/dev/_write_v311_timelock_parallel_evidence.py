#!/usr/bin/env python3
"""F-02 Timelock parallel evidence writer — no ACTIVE matrix / contract mutations."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_phase2_v311_final_release"
REG = ROOT / "registry"
now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    EV.mkdir(parents=True, exist_ok=True)
    addr_path = REG / "v311-sepolia-address-matrix-freeze.v1.json"
    inv_path = REG / "v311-web3-deployment-inventory.v1.json"
    addr = json.loads(addr_path.read_text(encoding="utf-8"))
    inv = json.loads(inv_path.read_text(encoding="utf-8"))

    cfg = {
        "schema": "traveltrust.v311_configuration_baseline.v1",
        "machine_key": "TT_CONFIGURATION_BASELINE",
        "status": "PINNED",
        "recorded_utc": now,
        "phase_scope": "2",
        "chain_id": 11155111,
        "dataset_rule": "PURE_SEPOLIA_ONLY",
        "does_not_reopen": "TT_CONFIGURATION_ZERO_DRIFT",
        "pins": {
            "economic_ssot": "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md",
            "address_matrix": {
                "path": "registry/v311-sepolia-address-matrix-freeze.v1.json",
                "baseline": addr.get("baseline"),
                "status": addr.get("status"),
                "sha256": sha256(addr_path),
                "addresses": addr.get("addresses"),
            },
            "deployment_inventory": {
                "path": "registry/v311-web3-deployment-inventory.v1.json",
                "sha256": sha256(inv_path),
                "component_count": len(inv.get("components") or []),
            },
            "web3_execution_matrix": {
                "path": "registry/web3-active-execution-matrix.v1.yaml",
                "address_authority_baseline": "v311_sepolia_clean_baseline",
            },
            "cert_dataset": "registry/v311-cert-dataset-sepolia-only.v1.yaml",
            "canonical_re_ladder": "registry/traveltrust-release-engineering-ladder.v1.yaml",
        },
        "env_surface_checklist": {
            "RPC_Endpoint": "OWNER_PIN_REQUIRED",
            "Indexer_Endpoint": "OWNER_PIN_REQUIRED",
            "WalletConnect_Project_ID": "OWNER_PIN_REQUIRED",
            "Feature_Flags": "OWNER_PIN_REQUIRED",
            "ENV_whitelist": "OWNER_PIN_REQUIRED",
        },
        "verdict": "PARTIAL",
        "tt_configuration_baseline": "PARTIAL",
        "verdict_note": (
            "Address matrix + inventory + dataset pinned by hash. "
            "Runtime ENV secrets still OWNER_PIN_REQUIRED."
        ),
    }
    (REG / "v311-configuration-baseline.v1.json").write_text(
        json.dumps(cfg, indent=2) + "\n", encoding="utf-8"
    )
    yaml_lines = [
        "# schema: traveltrust.v311_configuration_baseline.v1",
        "# Pin only — does NOT mutate ACTIVE address matrix / Registry ACTIVE cutover",
        "machine_key: TT_CONFIGURATION_BASELINE",
        "status: PINNED",
        f'recorded_utc: "{now}"',
        "chain_id: 11155111",
        "tt_configuration_baseline: PARTIAL",
        "verdict: PARTIAL",
        "does_not_reopen: TT_CONFIGURATION_ZERO_DRIFT",
        "pins:",
        f"  address_matrix_sha256: {cfg['pins']['address_matrix']['sha256']}",
        f"  address_matrix_baseline: {cfg['pins']['address_matrix']['baseline']}",
        f"  deployment_inventory_sha256: {cfg['pins']['deployment_inventory']['sha256']}",
        f"  component_count: {cfg['pins']['deployment_inventory']['component_count']}",
        "env_surface_checklist:",
    ]
    for k, v in cfg["env_surface_checklist"].items():
        yaml_lines.append(f"  {k}: {v}")
    (REG / "v311-configuration-baseline.v1.yaml").write_text(
        "\n".join(yaml_lines) + "\n", encoding="utf-8"
    )
    (EV / "P0.5-CONFIGURATION-BASELINE-LATEST.md").write_text(
        f"""# Phase 0.5 · Configuration Baseline

**Machine:** `TT_CONFIGURATION_BASELINE`  
**Status:** **PARTIAL**（地址/Inventory/Dataset 已 pin · ENV 密钥面仍 OWNER_PIN）  
**Recorded:** {now}  
**Registry:** `registry/v311-configuration-baseline.v1.json`  
**Discipline:** 不改 ACTIVE 地址矩阵 · 不重开 `TT_CONFIGURATION_ZERO_DRIFT`

| Pin | Value |
|-----|-------|
| Address matrix sha256 | `{cfg['pins']['address_matrix']['sha256'][:16]}…` |
| Baseline | `{cfg['pins']['address_matrix']['baseline']}` |
| Inventory components | {cfg['pins']['deployment_inventory']['component_count']} |
| chain_id | 11155111 |

**Exit for PASS:** attach ENV whitelist + Feature Flags + RPC/Indexer/WC Project ID evidence under same pin.
""",
        encoding="utf-8",
    )

    comp_ids = [
        (c.get("id") or c.get("name") or str(c)) for c in (inv.get("components") or [])
    ]
    deploy_ev = {
        "machine_key": "TT_V311_DEPLOYMENT_CERT",
        "status": "PARTIAL",
        "recorded_utc": now,
        "inventory_path": "registry/v311-web3-deployment-inventory.v1.json",
        "inventory_sha256": sha256(inv_path),
        "component_count": len(comp_ids),
        "components": comp_ids,
        "chain_id": inv.get("chain_id"),
        "checks": {
            "inventory_present": True,
            "sole_candidate": inv.get("sole_candidate"),
            "bytecode_verify_all": "NOT_RUN_THIS_WINDOW",
            "proxy_eip1967_spotcheck": "DOCUMENTED_IN_F02_STATE",
        },
        "tt_v311_deployment_cert": "PARTIAL",
    }
    (EV / "P2-DEPLOYMENT-CERT-LATEST.json").write_text(
        json.dumps(deploy_ev, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P2-DEPLOYMENT-CERT-LATEST.md").write_text(
        f"""# Phase 2 · Deployment Certification

**Machine:** `TT_V311_DEPLOYMENT_CERT`  
**Status:** **PARTIAL**  
**Recorded:** {now}

| Check | Result |
|-------|--------|
| Deployment Inventory present | ✅ ({len(comp_ids)} components) |
| sole_candidate | {inv.get('sole_candidate')} |
| Bytecode verify all | ❌ NOT_RUN_THIS_WINDOW |
| Proxy / Upgrade authority note | ✅ in F-02 state (Safe→Timelock) |

**Not PASS** until bytecode/proxy gate closes.
""",
        encoding="utf-8",
    )

    data_dims = [
        "CMS",
        "OCS",
        "Public_Catalog",
        "Provider",
        "Guide",
        "Destination",
        "Country",
        "Media",
        "Translation_i18n",
        "AI_Search_Index",
        "API_Projection",
        "Indexer_Projection",
        "Search_Index",
    ]
    data_ev = {
        "machine_key": "TT_DATA_CERT",
        "status": "OPEN",
        "recorded_utc": now,
        "requirements": [
            "no_duplicates",
            "no_orphan_data",
            "no_legacy_active",
            "no_broken_references",
            "all_media_reachable",
            "public_surface_data_consistent",
        ],
        "dimensions": {d: "OPEN" for d in data_dims},
        "related_tracks": {
            "CMS_Content_QA_JP": "ACTIVE_SEPARATE_TRACK",
            "Indexer_I01": "PASS_EMPTY_CLEAN_SCOPE",
        },
        "tt_data_cert": "OPEN",
    }
    (EV / "P2.5-DATA-CERT-LATEST.json").write_text(
        json.dumps(data_ev, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P2.5-DATA-CERT-LATEST.md").write_text(
        f"""# Phase 2.5 · Data Certification

**Machine:** `TT_DATA_CERT`  
**Status:** **OPEN**（未宣称 PASS）  
**Recorded:** {now}

| Dimension | Status |
|-----------|--------|
"""
        + "\n".join(f"| {d} | OPEN |" for d in data_dims)
        + """

**旁证：** I-01 Indexer Live Reconcile PASS（empty clean Sepolia scope）· CMS Content QA 仍为独立 ACTIVE 轨。  
**Exit：** 六硬要求全绿 + 上表全 CLOSED。
""",
        encoding="utf-8",
    )

    ui_ev = {
        "machine_key": "TT_V311_WEB3_UI_UX_FULL_CERT",
        "status": "PARTIAL",
        "recorded_utc": now,
        "gates": {
            "five_main_routes_ui": "PASS",
            "web3_itinerary_l5_green": "PASS",
            "wallet_l5_smoke": "PASS",
            "wallet_l5_cinematic_warn": "NON_BLOCKING_MISSING_maybe-run-cinematic-script",
            "playwright_real_wallet_real_tx": "OPEN",
        },
        "tt_v311_web3_ui_ux_full_cert": "PARTIAL",
    }
    (EV / "P5-UI-UX-CERT-LATEST.json").write_text(
        json.dumps(ui_ev, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P5-UI-UX-CERT-LATEST.md").write_text(
        f"""# Phase 5 · Web3 UI/UX Full Certification

**Machine:** `TT_V311_WEB3_UI_UX_FULL_CERT`  
**Status:** **PARTIAL**  
**Recorded:** {now}

| Gate | Result |
|------|--------|
| Five-main UI antiregression | ✅ PASS (150 tests) |
| Web3 itinerary L5 green | ✅ PASS (146 tests) |
| Wallet L5 smoke | ✅ PASS（cinema warn non-blocking） |
| Playwright + 真钱包 + 真链 | ❌ OPEN |

**≠ Full Cert PASS。**
""",
        encoding="utf-8",
    )

    prod_ev = {
        "machine_key": "TT_V311_WEB3_FULL_PRODUCT_CERT",
        "status": "OPEN",
        "recorded_utc": now,
        "aggregate": {
            "deployment_cert": "PARTIAL",
            "function_cert": "FAIL_WAITING_F02_EXECUTE",
            "ui_ux_cert": "PARTIAL",
            "data_cert": "OPEN",
        },
        "tt_v311_web3_full_product_cert": "OPEN",
    }
    (EV / "P6-PRODUCT-CERT-LATEST.json").write_text(
        json.dumps(prod_ev, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P6-PRODUCT-CERT-LATEST.md").write_text(
        f"""# Phase 6 · Full Product Certification

**Machine:** `TT_V311_WEB3_FULL_PRODUCT_CERT`  
**Status:** **OPEN**  
**Recorded:** {now}

聚合：Deploy PARTIAL · Function FAIL（F-02 Timelock）· UI PARTIAL · Data OPEN → Product **不能** PASS。
""",
        encoding="utf-8",
    )

    ops_ev = {
        "machine_key": "TT_OPERATIONS_CERT",
        "status": "PARTIAL",
        "recorded_utc": now,
        "security": {
            "Roles": "DOCUMENTED_PARTIAL",
            "Access_Control": "DOCUMENTED_PARTIAL",
            "Safe_Threshold": "OWNER_VERIFY_REQUIRED",
            "Timelock_Delay": "VERIFIED_172800",
            "Pause": "OPEN",
            "Emergency": "OPEN",
        },
        "operations": {
            "Alert": "OPEN",
            "Monitor": "OPEN",
            "Backup": "OPEN",
            "Recovery": "OPEN",
            "Upgrade_Runbook": "PARTIAL_F02_AUTHORITY_NOTE",
            "Incident_Runbook": "OPEN",
        },
        "known": {
            "timelock": addr["addresses"]["timelock"],
            "governor": addr["addresses"]["governor"],
            "safe": addr["addresses"]["timelock_admin_safe"],
            "timelock_delay_s": 172800,
            "upgrade_path": "Safe→Timelock→execute / upgradeTo",
        },
        "tt_operations_cert": "PARTIAL",
    }
    (EV / "P6.5-OPERATIONS-CERT-LATEST.json").write_text(
        json.dumps(ops_ev, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P6.5-OPERATIONS-CERT-LATEST.md").write_text(
        f"""# Phase 6.5 · Security & Operations Certification

**Machine:** `TT_OPERATIONS_CERT`  
**Status:** **PARTIAL**  
**Recorded:** {now}

| Item | Status |
|------|--------|
| Timelock Delay 172800s | ✅ verified (F-02) |
| Safe→Timelock authority | ✅ documented |
| Safe Threshold | ❌ OWNER_VERIFY |
| Pause / Emergency | ❌ OPEN |
| Alert / Monitor / Backup / Recovery / Incident | ❌ OPEN |

**≠ PASS。** Docs alone insufficient.
""",
        encoding="utf-8",
    )

    (EV / "P7-DOCUMENT-EVIDENCE-LATEST.md").write_text(
        f"""# Phase 7 · Documentation & Evidence

**Machine:** `TT_DOCUMENT_EVIDENCE_FREEZE`  
**Status:** **IN_PROGRESS**  
**Recorded:** {now}

## Indexed this window

- Canonical RE Ladder + PSG domains hierarchy
- V311 FRE instance + F-02 parallel pack
- Configuration baseline pin
- Deployment / Data / UI / Product / Ops evidence LATEST files
- Phase −1 audit refresh

## Not frozen yet

- Full Recovery Cert
- Release Package LOCK (Phase 7.5)
- Remaining Legacy narrative sweep

**≠ FREEZE PASS。**
""",
        encoding="utf-8",
    )

    pkg = {
        "machine_key": "TT_RELEASE_PACKAGE",
        "status": "PREP",
        "label_candidate": "TravelTrust V3.1.1 RC1",
        "recorded_utc": now,
        "tt_release_package": "NOT_LOCKED",
        "includes_checklist": {
            "Release_Notes": "OPEN",
            "Registry": "PARTIAL",
            "Evidence": "IN_PROGRESS",
            "Deployment_Inventory": "PRESENT",
            "Address_Matrix": "FROZEN_PINNED",
            "Contract_Inventory": "PRESENT",
            "Runbook": "PARTIAL",
            "Recovery": "OPEN",
            "Architecture": "PARTIAL",
            "Version": "V3.1.1",
            "Git_SHA": "CAPTURE_AT_LOCK",
        },
    }
    (EV / "P7.5-RELEASE-PACKAGE-PREP-LATEST.json").write_text(
        json.dumps(pkg, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P7.5-RELEASE-PACKAGE-PREP-LATEST.md").write_text(
        f"""# Phase 7.5 · Release Package Freeze（PREP only）

**Machine:** `TT_RELEASE_PACKAGE`  
**Status:** **PREP · NOT_LOCKED**  
**Candidate label:** TravelTrust V3.1.1 RC1  
**Recorded:** {now}

清单已建；**禁止**在 Function Cert / Product / Ops / Docs 未齐前 LOCK。
""",
        encoding="utf-8",
    )

    items = [
        ("C-01", "P0", "CLOSED", "AGENTS address authority → v311_sepolia_clean_baseline"),
        ("C-02", "P0", "CLOSED", "WEB3 ACTIVE Execution Matrix MD address pointer → v311"),
        ("C-03", "P0", "CLOSED", "Formal RE Ladder + PSG domain hierarchy SSOT written"),
        ("C-04", "P0", "OPEN", "Function Cert waiting F-02 Execute (ETA 2026-07-20T11:37:37Z)"),
        ("C-05", "P0", "OPEN", "Product Cert aggregate OPEN"),
        ("C-06", "P0", "OPEN", "Data Cert OPEN (all dimensions)"),
        ("C-07", "P0", "OPEN", "UI Full Cert real-wallet/real-tx OPEN"),
        ("C-08", "P0", "OPEN", "Configuration Baseline ENV pin OWNER_REQUIRED"),
        ("C-09", "P1", "PARTIAL", "Deployment Cert inventory present; bytecode verify pending"),
        ("C-10", "P1", "PARTIAL", "Operations Cert Timelock/Safe path documented; ops runbooks OPEN"),
        ("C-11", "P1", "OPEN", "Recovery Cert missing"),
        ("C-12", "P1", "OPEN", "Release Package NOT_LOCKED"),
        ("C-13", "P1", "OPEN", "Repository Hygiene machine not PASS"),
        ("C-14", "P1", "CLOSED", "Five-main UI gate PASS (150)"),
        ("C-15", "P1", "CLOSED", "Wallet L5 smoke PASS"),
        ("C-16", "P1", "CLOSED", "Itinerary L5 green PASS (146)"),
        ("C-17", "P1", "CLOSED", "Web3 Active Execution Matrix gate PASS"),
        ("C-18", "P1", "CLOSED", "I-01 Indexer Live Reconcile PASS"),
        ("C-19", "P2", "OPEN", "Missing maybe-run-cinematic-l5-verify-on-diff.sh"),
        ("C-20", "P2", "OPEN", "Binding RC-02 not started (current window NON_BINDING)"),
        ("C-21", "P0", "BLOCKED", "Phase 8 RC LOCK blocked until -1..7.5"),
        ("C-22", "P0", "BLOCKED", "TT_PSG_SEPOLIA_FREEZE not entered"),
        ("C-23", "P0", "BLOCKED", "Production GO not entered"),
    ]
    closed = sum(1 for i in items if i[2] == "CLOSED")
    open_n = sum(1 for i in items if i[2] in ("OPEN", "BLOCKED", "PARTIAL"))
    (EV / "PHASE-MINUS1-FINAL-CLOSURE-AUDIT-LATEST.md").write_text(
        f"""# Phase −1 · Final Closure Audit（刷新）

**Machine:** `TT_V311_FINAL_CLOSURE_AUDIT`  
**Status:** **IN_PROGRESS**（OPEN ≠ 0）  
**Recorded:** {now}  
**F-02 ETA:** 2026-07-20T11:37:37Z · Timelock 只读等待  
**Dataset:** pure Sepolia `11155111`

| # | Sev | Status | Item |
|---|-----|--------|------|
"""
        + "\n".join(f"| {a} | {b} | **{c}** | {d} |" for a, b, c, d in items)
        + f"""

**Counts:** CLOSED={closed} · OPEN/PARTIAL/BLOCKED={open_n} · total={len(items)}

**禁止窗内：** 改合约 · ACTIVE 地址矩阵 · Runtime · Registry ACTIVE 切轨 · 协议逻辑  
**并行包：** `docs/runbook/TT-V311-F02-TIMELOCK-WAIT-PARALLEL-LATEST.md`
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

    (EV / "P0-REPOSITORY-HYGIENE-LATEST.md").write_text(
        f"""# Phase 0 · Repository Hygiene

**Machine:** `TT_V311_REPOSITORY_CLEAN` / `TT_GIT_HYGIENE`  
**Status:** **IN_PROGRESS**  
**Recorded:** {now}

## Closed this window
- Execution Matrix human pointer V2 → V311（docs only）
- Evidence board under `evidence/GO_phase2_v311_final_release/`

## Still OPEN
- Full Legacy doc/script/ENV sweep
- Missing cinematic maybe-run gate script
- Dead/duplicate docs inventory not exhausted

**≠ PASS。**
""",
        encoding="utf-8",
    )

    (EV / "P1-FULL-ALIGNMENT-LATEST.md").write_text(
        f"""# Phase 1 · Full Alignment

**Machine:** `TT_V311_SOURCE_ALIGNMENT` / `TT_FULL_ALIGNMENT`  
**Status:** **PASS（cite prior）** · reaffirm {now}  
**Evidence cite:** `evidence/GO_phase2_v311_sepolia_clean_baseline/FULL-ALIGNMENT-VERDICT-LATEST.txt` → `TT_V311_FULL_ALIGNMENT: PASS`

**Pin:** address matrix baseline `v311_sepolia_clean_baseline` · chain_id 11155111  
**Note:** Runtime ENV secrets still tracked under P0.5 PARTIAL.
""",
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
            "P0": "IN_PROGRESS",
            "P0.5": "PARTIAL",
            "P1": "PASS",
            "P2": "PARTIAL",
            "P2.5": "OPEN",
            "P3": "PASS",
            "P4": "IN_PROGRESS_F02_QUEUED",
            "P5": "PARTIAL",
            "P6": "OPEN",
            "P6.5": "PARTIAL",
            "P7": "IN_PROGRESS",
            "P7.5": "PREP_NOT_LOCKED",
            "P8": "BLOCKED",
            "P9": "BLOCKED",
            "P10": "BLOCKED",
            "P10.5": "BLOCKED",
            "TT_PSG_SEPOLIA_FREEZE": "NOT_CLAIMED",
            "Production_GO": "NOT_CLAIMED",
        },
        "gates_run_this_window": {
            "five_main_ui": "PASS",
            "wallet_l5": "PASS",
            "itinerary_l5_green": "PASS",
            "web3_active_execution_matrix_gate": "PASS",
        },
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
| −1 Closure Audit | IN_PROGRESS |
| 0 Hygiene | IN_PROGRESS |
| 0.5 Config Baseline | PARTIAL |
| 1 Alignment | **PASS** |
| 2 Deploy Cert | PARTIAL |
| 2.5 Data Cert | OPEN |
| 3 PSG Baseline | **PASS** |
| 4 Function Cert | IN_PROGRESS（F-02 Queued） |
| 5 UI/UX | PARTIAL |
| 6 Product | OPEN |
| 6.5 Ops | PARTIAL |
| 7 Docs/Evidence | IN_PROGRESS |
| 7.5 Package | PREP · **NOT_LOCKED** |
| 8…10.5 / Freeze / GO | BLOCKED / NOT_CLAIMED |

**① gates this window:** Five-main · Wallet L5 · Itinerary L5 · Matrix gate — all PASS.  
**未宣称：** Function/Product/Data/Package LOCK / Freeze / GO.
""",
        encoding="utf-8",
    )

    print("OK", EV)
    print("closed", closed, "openish", open_n)
    print("files", sorted(p.name for p in EV.iterdir()))


if __name__ == "__main__":
    main()
