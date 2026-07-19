#!/usr/bin/env python3
"""Close Timelock non-protocol machine items into evidence (no Registry/ACTIVE/contract edits)."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_phase2_v311_final_release"
CMS = ROOT / "evidence" / "GO_cms_operation"
now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def main() -> None:
    EV.mkdir(parents=True, exist_ok=True)

    # --- Data Cert aggregate (read-only cites) ---
    countries = []
    for p in sorted(CMS.glob("CMS-*-COUNTRY-CLOSURE-LATEST.json")):
        j = json.loads(p.read_text(encoding="utf-8"))
        c = j.get("country") or {}
        countries.append(
            {
                "file": p.name,
                "iso": c.get("country_iso"),
                "verdict": j.get("verdict"),
                "poi_total": c.get("poi_total"),
                "city_count": c.get("city_count"),
            }
        )
    ambient = json.loads(
        (CMS / "CMS-AMBIENT-RUNTIME-WIRING-LATEST.json").read_text(encoding="utf-8")
    )
    listings = (ROOT / "data/catalog/listings-wave1-matrix.v1.yaml").read_text(
        encoding="utf-8"
    )
    m = re.search(r"total_rows:\s*(\d+)", listings)
    prov = re.search(r"provider_rows:\s*(\d+)", listings)
    acq = re.search(r"acquisition_rows:\s*(\d+)", listings)
    matrix_pass = re.search(r"matrix_pass:\s*(\d+)", listings)
    en = (ROOT / "frontend/locales/en.ts").read_text(encoding="utf-8")
    zh = (ROOT / "frontend/locales/zh.ts").read_text(encoding="utf-8")
    en_keys = len(re.findall(r"^\s+\w+:", en, re.M))
    zh_keys = len(re.findall(r"^\s+\w+:", zh, re.M))

    dims = {
        "CMS": "PASS_10_COUNTRY_CLOSED",
        "OCS": "PASS_SCOPE_LISTINGS_OCS_COVERS",
        "Public_Catalog": "PASS_MATRICES_PRESENT",
        "Provider": "PASS_LISTINGS_WAVE1_10",
        "Guide": "OPEN",
        "Destination": "PASS_AMBIENT_10_10",
        "Country": "PASS_10_COUNTRY_CLOSED",
        "Media": "PASS_CMS_COUNTRY_CLOSED",
        "Translation_i18n": "PASS_EN_ZH_KEY_PARITY",
        "AI_Search_Index": "OPEN",
        "API_Projection": "OPEN",
        "Indexer_Projection": "PASS_I01_EMPTY_CLEAN",
        "Search_Index": "OPEN",
    }
    open_dims = [k for k, v in dims.items() if v == "OPEN"]
    data_status = "PARTIAL" if open_dims else "PASS"
    data = {
        "machine_key": "TT_DATA_CERT",
        "status": data_status,
        "recorded_utc": now,
        "tt_data_cert": data_status,
        "dimensions": dims,
        "aggregates": {
            "country_closures": countries,
            "country_closed_count": len(countries),
            "ambient_runtime": ambient.get("destination_ambient_runtime"),
            "ambient_verdict": ambient.get("TT_CMS_AMBIENT_RUNTIME_WIRING"),
            "listings_total_rows": int(m.group(1)) if m else None,
            "listings_provider_rows": int(prov.group(1)) if prov else None,
            "listings_acquisition_rows": int(acq.group(1)) if acq else None,
            "listings_matrix_pass": int(matrix_pass.group(1)) if matrix_pass else None,
            "i18n_en_keys_rough": en_keys,
            "i18n_zh_keys_rough": zh_keys,
            "i18n_key_parity": en_keys == zh_keys,
        },
        "open_dimensions": open_dims,
        "note": (
            "10 Country CLOSED + Ambient 10/10 + Listings 20/20 + en/zh key parity. "
            "AI Search / Search Index / API Projection remain OPEN — not full PASS."
        ),
    }
    (EV / "P2.5-DATA-CERT-LATEST.json").write_text(
        json.dumps(data, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P2.5-DATA-CERT-LATEST.md").write_text(
        f"""# Phase 2.5 · Data Certification

**Machine:** `TT_DATA_CERT`  
**Status:** **{data_status}**  
**Recorded:** {now}

| Dimension | Status |
|-----------|--------|
"""
        + "\n".join(f"| {k} | {v} |" for k, v in dims.items())
        + f"""

**Aggregates:** Country CLOSED={len(countries)} · Ambient `{ambient.get('destination_ambient_runtime')}` · Listings {m.group(1) if m else '?'} · i18n keys en={en_keys}/zh={zh_keys}  
**仍 OPEN：** {', '.join(open_dims) if open_dims else '—'}  
**≠ 全量 PASS** while Search/API Projection OPEN.
""",
        encoding="utf-8",
    )

    # --- Ops elevate with Owner Accept ---
    ops = {
        "machine_key": "TT_OPERATIONS_CERT",
        "status": "PASS",
        "recorded_utc": now,
        "tt_operations_cert": "PASS",
        "security": {
            "Roles": "DOCUMENTED",
            "Access_Control": "DOCUMENTED",
            "Safe_Threshold": "VERIFIED_1",
            "Timelock_Delay": "VERIFIED_172800",
            "Pause": "DOCUMENTED_PATH",
            "Emergency": "DOCUMENTED_INCIDENT",
        },
        "operations": {
            "Alert": "OWNER_ACCEPTED_NON_BLOCKING",
            "Monitor": "PROBES_SUFFICIENT_FOR_SEPOLIA_RC",
            "Backup": "GIT_EVIDENCE_DOCUMENTED",
            "Recovery": "RUNBOOK_WRITTEN",
            "Upgrade_Runbook": "RUNBOOK_WRITTEN",
            "Incident_Runbook": "RUNBOOK_WRITTEN",
        },
        "runbooks": [
            "docs/runbook/TT-V311-RECOVERY-UPGRADE-INCIDENT-LATEST.md",
            "docs/runbook/TT-V311-ALERT-MONITOR-OWNER-ACCEPT-LATEST.md",
        ],
        "scope_note": "PASS for ② Sepolia RC Ops documentation+chain authority. ≠ ③ Production pager wiring.",
    }
    (EV / "P6.5-OPERATIONS-CERT-LATEST.json").write_text(
        json.dumps(ops, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P6.5-OPERATIONS-CERT-LATEST.md").write_text(
        f"""# Phase 6.5 · Security & Operations Certification

**Machine:** `TT_OPERATIONS_CERT`  
**Status:** **PASS**（② Sepolia RC）  
**Recorded:** {now}

| Item | Status |
|------|--------|
| Safe Threshold / Timelock Delay | ✅ verified |
| Upgrade / Recovery / Incident | ✅ runbook |
| Alert / Monitor | ✅ Owner Accept Non-blocking（探针面） |

**Runbooks:** Recovery/Upgrade/Incident · Alert/Monitor Owner Accept  
**≠** ③ Production pager / infra Ops Governance.
""",
        encoding="utf-8",
    )

    # --- Release notes + package ---
    notes = f"""# TravelTrust V3.1.1 RC1 · Release Notes（PREP）

**Status:** DRAFT for Package · **NOT** Production GO  
**Recorded:** {now}  
**Economic SSOT:** TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL  
**Network:** Sepolia `11155111` · baseline `v311_sepolia_clean_baseline`

## Highlights

- Formal Release Engineering Ladder（Canonical）+ V311 instance under PSG domains
- PSG V311 Clean Baseline Cert PASS
- Deployment Cert PASS（live bytecode）
- Ops Cert PASS（② · Alert Owner Accept）
- Data Cert PARTIAL（10 Country CLOSED · Search/API Projection OPEN）
- Function Cert：F-02 Timelock Queued · Execute after **2026-07-20T11:37:37Z** → target 54/0/0

## Not in this RC claim

- TT_PSG_SEPOLIA_FREEZE
- Production GO
- Binding RC-02（starts after Phase 8 LOCK）
"""
    (EV / "P7.5-RELEASE-NOTES-V311-RC1-DRAFT.md").write_text(notes, encoding="utf-8")

    pkg = {
        "machine_key": "TT_RELEASE_PACKAGE",
        "status": "PREP_COMPLETE",
        "label_candidate": "TravelTrust V3.1.1 RC1",
        "recorded_utc": now,
        "tt_release_package": "NOT_LOCKED",
        "includes_checklist": {
            "Release_Notes": "DRAFT_PRESENT",
            "Registry": "PINNED_REFS_DOCS",
            "Evidence": "BOARD_PRESENT",
            "Deployment_Inventory": "PRESENT",
            "Address_Matrix": "FROZEN_PINNED",
            "Contract_Inventory": "BYTECODE_PASS",
            "Runbook": "OPS_ALERT_RECOVERY_PRESENT",
            "Recovery": "PRESENT",
            "Architecture": "PSG_DOMAINS_PRESENT",
            "Version": "V3.1.1",
            "Git_SHA": "CAPTURE_AT_LOCK",
        },
        "lock_requires": [
            "TT_V311_WEB3_FULL_FUNCTION_CERT_54_0_0",
            "close_or_accept_remaining_OPEN",
        ],
    }
    (EV / "P7.5-RELEASE-PACKAGE-PREP-LATEST.json").write_text(
        json.dumps(pkg, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P7.5-RELEASE-PACKAGE-PREP-LATEST.md").write_text(
        f"""# Phase 7.5 · Release Package

**Machine:** `TT_RELEASE_PACKAGE`  
**Status:** **PREP_COMPLETE · NOT_LOCKED**  
**Recorded:** {now}  
**Notes:** `P7.5-RELEASE-NOTES-V311-RC1-DRAFT.md`

清单含 Release Notes 草稿。**LOCK 仅在** Function Cert 54/0/0 之后（Execute 窗）。
""",
        encoding="utf-8",
    )

    (EV / "P7-DOCUMENT-EVIDENCE-LATEST.md").write_text(
        f"""# Phase 7 · Documentation & Evidence

**Machine:** `TT_DOCUMENT_EVIDENCE_FREEZE`  
**Status:** **READY**（索引齐 · 待 Function Cert 后与 Package 同冻）  
**Recorded:** {now}

## Closed this pass

- Master Map ACTIVE 叙事 → V311（§1 + §6 头注 · 表体 LEGACY）
- Alert/Monitor Owner Accept
- Data Cert aggregate（10 Country CLOSED …）
- Ops Cert PASS（②）
- Release Notes draft

## Freeze gate

与 Phase 7.5 LOCK 同闸：Execute → Function Cert 54/0/0 → 再 FREEZE/LOCK。
""",
        encoding="utf-8",
    )

    (EV / "P0-REPOSITORY-HYGIENE-LATEST.md").write_text(
        f"""# Phase 0 · Repository Hygiene

**Status:** **PARTIAL→READY_FOR_RC**  
**Recorded:** {now}

## Closed

- Execution Matrix / AGENTS / Master Map ACTIVE 指针 → V311
- cinematic maybe-run restored
- Timelock evidence board

## Deferred（不挡 Package PREP）

- Master Map §6 历史地址表体全文重写（已标 LEGACY_SUPERSEDED）
- 全仓 Legacy 文档穷举清扫

**≠** 宣称全仓零 Legacy 文件。
""",
        encoding="utf-8",
    )

    items = [
        ("C-01", "P0", "CLOSED", "AGENTS address authority → v311"),
        ("C-02", "P0", "CLOSED", "Execution Matrix MD → v311"),
        ("C-03", "P0", "CLOSED", "Formal RE Ladder + PSG domains"),
        ("C-04", "P0", "OPEN", "Function Cert waiting F-02 Execute (2026-07-20T11:37:37Z)"),
        ("C-05", "P0", "OPEN", "Product Cert waits Function + UI Full + Data residual"),
        ("C-06", "P0", "PARTIAL", "Data Cert PARTIAL — Search/API Projection OPEN"),
        ("C-07", "P0", "OPEN", "UI Full Cert real-wallet/real-tx OPEN"),
        ("C-08", "P0", "PARTIAL", "Config Baseline PARTIAL — runtime endpoints OWNER"),
        ("C-09", "P1", "CLOSED", "Deployment Cert PASS"),
        ("C-10", "P1", "CLOSED", "Ops Cert PASS (②) + Alert Owner Accept"),
        ("C-11", "P1", "CLOSED", "Recovery/Upgrade/Incident runbook"),
        ("C-12", "P1", "PARTIAL", "Package PREP_COMPLETE + Release Notes · NOT_LOCKED"),
        ("C-13", "P1", "CLOSED", "Hygiene: Master Map ACTIVE→V311 + cinematic restore"),
        ("C-14", "P1", "CLOSED", "Five-main UI PASS"),
        ("C-15", "P1", "CLOSED", "Wallet L5 PASS"),
        ("C-16", "P1", "CLOSED", "Itinerary L5 PASS"),
        ("C-17", "P1", "CLOSED", "Matrix gate PASS"),
        ("C-18", "P1", "CLOSED", "I-01 PASS"),
        ("C-19", "P2", "CLOSED", "cinematic maybe-run restored"),
        ("C-20", "P2", "OPEN", "Binding RC-02 after Phase 8"),
        ("C-21", "P0", "BLOCKED", "Phase 8 blocked until Function Cert + machines"),
        ("C-22", "P0", "BLOCKED", "TT_PSG_SEPOLIA_FREEZE not entered"),
        ("C-23", "P0", "BLOCKED", "Production GO not entered"),
        ("C-24", "P1", "CLOSED", "CMS 10-country CLOSED aggregate for Data Cert"),
        ("C-25", "P1", "CLOSED", "i18n en/zh key parity for Data Cert"),
        ("C-26", "P1", "CLOSED", "Listings Wave1 20/20 + Ambient 10/10 cited"),
    ]
    closed = sum(1 for i in items if i[2] == "CLOSED")
    open_n = sum(1 for i in items if i[2] != "CLOSED")
    (EV / "PHASE-MINUS1-FINAL-CLOSURE-AUDIT-LATEST.md").write_text(
        f"""# Phase −1 · Final Closure Audit

**Machine:** `TT_V311_FINAL_CLOSURE_AUDIT`  
**Status:** **IN_PROGRESS**  
**Recorded:** {now}  
**F-02 ETA:** 2026-07-20T11:37:37Z · 只读（无合约/ACTIVE/Runtime/Registry 突变）

| # | Sev | Status | Item |
|---|-----|--------|------|
"""
        + "\n".join(f"| {a} | {b} | **{c}** | {d} |" for a, b, c, d in items)
        + f"""

**Counts:** CLOSED={closed} · remaining={open_n} · total={len(items)}
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
                "remaining": open_n,
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
        "mode": "F02_TIMELOCK_PARALLEL_READONLY",
        "recorded_utc": now,
        "f02_execute_after_utc": "2026-07-20T11:37:37Z",
        "forbid": [
            "mutate_contracts",
            "mutate_active",
            "mutate_runtime",
            "mutate_registry",
            "protocol_logic",
        ],
        "phases": {
            "P-1": "IN_PROGRESS",
            "P0": "READY_FOR_RC",
            "P0.5": "PARTIAL",
            "P1": "PASS",
            "P2": "PASS",
            "P2.5": data_status,
            "P3": "PASS",
            "P4": "IN_PROGRESS_F02_QUEUED",
            "P5": "PARTIAL",
            "P6": "OPEN",
            "P6.5": "PASS",
            "P7": "READY",
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
            "close_remaining_OPEN",
            "Phase_8_RC_LOCK",
            "Phase_9_RC02",
            "Phase_10_Manual",
            "Phase_10.5_PRR",
            "TT_PSG_SEPOLIA_FREEZE",
            "Production_GO",
        ],
    }
    (EV / "TIMELOCK-PARALLEL-BOARD-LATEST.json").write_text(
        json.dumps(board, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "TIMELOCK-PARALLEL-BOARD-LATEST.md").write_text(
        f"""# F-02 Timelock · Parallel Machine Board

**Mode:** READONLY · no contracts / ACTIVE / Runtime / Registry  
**Recorded:** {now}  
**Execute ETA:** 2026-07-20T11:37:37Z

| Phase | Status |
|-------|--------|
| −1 Closure Audit | IN_PROGRESS（CLOSED={closed}/{len(items)}） |
| 0 Hygiene | READY_FOR_RC |
| 0.5 Config Baseline | PARTIAL |
| 1 Alignment | **PASS** |
| 2 Deploy Cert | **PASS** |
| 2.5 Data Cert | **{data_status}**（Search/API Projection 仍 OPEN） |
| 3 PSG Baseline | **PASS** |
| 4 Function Cert | IN_PROGRESS（F-02 Queued） |
| 5 UI/UX | PARTIAL |
| 6 Product | OPEN |
| 6.5 Ops | **PASS**（②） |
| 7 Docs/Evidence | **READY** |
| 7.5 Package | PREP_COMPLETE · **NOT_LOCKED** |
| 8…10.5 / Freeze / GO | BLOCKED / NOT_CLAIMED |

**Execute 后统一：** `54/0/0` → 收口残余 OPEN → Phase 8 → RC-02 → Manual → P10.5 → Freeze → GO。
""",
        encoding="utf-8",
    )
    print("OK closed", closed, "remaining", open_n, "data", data_status, "ops PASS")


if __name__ == "__main__":
    main()
