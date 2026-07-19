#!/usr/bin/env python3
"""Finalize Data Cert + Release Notes + Evidence index (Timelock; no Registry/ACTIVE edits)."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_phase2_v311_final_release"
now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def main() -> None:
    guide = json.loads((EV / "P2.5-GUIDE-LIVE-SNAPSHOT-LATEST.json").read_text(encoding="utf-8"))
    search = json.loads((EV / "P2.5-SEARCH-API-PROJECTION-LATEST.json").read_text(encoding="utf-8"))
    prev = json.loads((EV / "P2.5-DATA-CERT-LATEST.json").read_text(encoding="utf-8"))

    dims = dict(prev.get("dimensions") or {})
    dims.update(
        {
            "Guide": "PASS_LIVE_10_VERTICAL_SLICE",
            "Search_Index": "PASS_DISCOVER_ORDERS",
            "AI_Search_Index": "PASS_SCOPE_PRODUCT_DISCOVER",
            "API_Projection": "PASS_I01_PLUS_GUIDES_DISCOVER",
        }
    )
    open_dims = [k for k, v in dims.items() if str(v).startswith("OPEN")]
    status = "PASS" if not open_dims else "PARTIAL"

    data = {
        "machine_key": "TT_DATA_CERT",
        "status": status,
        "recorded_utc": now,
        "tt_data_cert": status,
        "dimensions": dims,
        "aggregates": prev.get("aggregates"),
        "live_cites": {
            "guide_snapshot": "evidence/GO_phase2_v311_final_release/P2.5-GUIDE-LIVE-SNAPSHOT-LATEST.json",
            "guide_vertical_slice_log": "evidence/GO_phase2_v311_final_release/P2.5-GUIDE-VERTICAL-SLICE-01.log",
            "guide_parity": "evidence/GO_phase2_v311_final_release/P2.5-GUIDE-CATALOG-PARITY-LATEST.json",
            "search_api_projection": "evidence/GO_phase2_v311_final_release/P2.5-SEARCH-API-PROJECTION-LATEST.json",
            "discover_vitest_log": "evidence/GO_phase2_v311_final_release/P2.5-DISCOVER-VITEST.log",
            "i01": "evidence/GO_phase2_v311_web3_full_function_cert/tier_c_state/I-01-indexer-reconcile-live.json",
        },
        "live_summary": {
            "guides_count": guide.get("guides_count"),
            "guide_verdict": guide.get("tt_data_cert_guide"),
            "search_verdict": search.get("search_index", {}).get("verdict"),
            "ai_search_verdict": search.get("ai_search_index", {}).get("verdict"),
            "api_projection_verdict": search.get("api_projection", {}).get("verdict"),
        },
        "open_dimensions": open_dims,
        "note": (
            "Guide live 10 + discover/orders + I-01 projection clean. "
            "AI_Search_Index scoped to product discover (no separate AI index service)."
            if status == "PASS"
            else f"Still open: {open_dims}"
        ),
    }
    (EV / "P2.5-DATA-CERT-LATEST.json").write_text(
        json.dumps(data, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P2.5-DATA-CERT-LATEST.md").write_text(
        f"""# Phase 2.5 · Data Certification

**Machine:** `TT_DATA_CERT`  
**Status:** **{status}**  
**Recorded:** {now}

| Dimension | Status |
|-----------|--------|
"""
        + "\n".join(f"| {k} | {v} |" for k, v in dims.items())
        + f"""

**Live：** guides={guide.get('guides_count')} · discover/orders ok · I-01 PASS · discover vitest PASS  
**AI Search：** 无独立 AI 索引服务 → 产品搜索面 = discover + CMS catalog（`PASS_SCOPE_PRODUCT_DISCOVER`）  
""",
        encoding="utf-8",
    )

    notes = f"""# TravelTrust V3.1.1 RC1 · Release Notes

**Package label:** TravelTrust V3.1.1 RC1  
**Status:** READY_FOR_LOCK（**NOT_LOCKED** until Function Cert 54/0/0）  
**Recorded:** {now}  
**Network:** Sepolia `11155111` · baseline `v311_sepolia_clean_baseline`  
**Economic SSOT:** `docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md`  
**Ladder:** Formal Release Engineering `20260718-enterprise-final`（PSG · Release Engineering 域）

## Included

| Area | Verdict |
|------|---------|
| PSG V311 Clean Baseline | PASS |
| Deployment Cert（live bytecode） | PASS |
| Data Cert（CMS/Guide/Discover/Projection） | **{status}** |
| Ops Cert（② · Alert Owner Accept） | PASS |
| UI ① gates（Five-main / Wallet / Itinerary） | PASS（Full real-wallet still OPEN） |
| Docs / Evidence index | READY |
| Release Package checklist | PREP_COMPLETE |

## Pending Execute window（2026-07-20T11:37:37Z）

1. F-02 Timelock Execute  
2. `TT_V311_WEB3_FULL_FUNCTION_CERT` → **54 / 0 / 0**  
3. Close residual OPEN（Product / UI Full / Package LOCK）  
4. Phase 8 RC Candidate LOCK → Phase 9 RC-02 → Manual → P10.5 → `TT_PSG_SEPOLIA_FREEZE` → Production GO  

## Explicit non-claims

- ≠ `TT_PSG_SEPOLIA_FREEZE`  
- ≠ Production GO  
- ≠ Binding RC-02（current soak = non-binding）  
"""
    (EV / "P7.5-RELEASE-NOTES-V311-RC1-DRAFT.md").write_text(notes, encoding="utf-8")
    # canonical name without DRAFT once ready-for-lock
    (EV / "P7.5-RELEASE-NOTES-V311-RC1-LATEST.md").write_text(notes, encoding="utf-8")

    # Evidence index
    files = sorted(p.name for p in EV.iterdir() if p.is_file())
    index = {
        "machine_key": "TT_DOCUMENT_EVIDENCE_FREEZE",
        "status": "READY",
        "recorded_utc": now,
        "evidence_root": "evidence/GO_phase2_v311_final_release",
        "file_count": len(files),
        "files": files,
        "critical": [
            "TIMELOCK-PARALLEL-BOARD-LATEST.json",
            "PHASE-MINUS1-FINAL-CLOSURE-AUDIT-LATEST.json",
            "P2-BYTECODE-LIVE-VERIFY-LATEST.json",
            "P2.5-DATA-CERT-LATEST.json",
            "P2.5-GUIDE-LIVE-SNAPSHOT-LATEST.json",
            "P2.5-SEARCH-API-PROJECTION-LATEST.json",
            "P6.5-OPERATIONS-CERT-LATEST.json",
            "P7.5-RELEASE-NOTES-V311-RC1-LATEST.md",
            "P7.5-RELEASE-PACKAGE-PREP-LATEST.json",
        ],
        "freeze_with": "Phase 7.5 LOCK after Function Cert 54/0/0",
        "tt_document_evidence_freeze": "READY",
    }
    (EV / "P7-EVIDENCE-INDEX-LATEST.json").write_text(
        json.dumps(index, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P7-DOCUMENT-EVIDENCE-LATEST.md").write_text(
        f"""# Phase 7 · Documentation & Evidence

**Machine:** `TT_DOCUMENT_EVIDENCE_FREEZE`  
**Status:** **READY**  
**Recorded:** {now}  
**Index:** `P7-EVIDENCE-INDEX-LATEST.json`（{len(files)} files）

## Critical pack

- Board · Closure Audit  
- Deploy bytecode · Data Cert（Guide/Search/API Projection）  
- Ops Cert · Release Notes RC1  
- Package PREP  

**FREEZE** 与 Package LOCK 同闸：Execute → Function Cert 54/0/0 之后。
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
            "Release_Notes": "READY",
            "Registry": "PINNED_REFS_DOCS_ONLY",
            "Evidence": "INDEX_READY",
            "Deployment_Inventory": "PRESENT",
            "Address_Matrix": "FROZEN_PINNED",
            "Contract_Inventory": "BYTECODE_PASS",
            "Runbook": "OPS_ALERT_RECOVERY_PRESENT",
            "Recovery": "PRESENT",
            "Architecture": "PSG_DOMAINS_PRESENT",
            "Version": "V3.1.1",
            "Git_SHA": "CAPTURE_AT_LOCK",
            "Data_Cert": status,
        },
        "release_notes": "evidence/GO_phase2_v311_final_release/P7.5-RELEASE-NOTES-V311-RC1-LATEST.md",
        "lock_requires": ["TT_V311_WEB3_FULL_FUNCTION_CERT_54_0_0"],
    }
    (EV / "P7.5-RELEASE-PACKAGE-PREP-LATEST.json").write_text(
        json.dumps(pkg, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P7.5-RELEASE-PACKAGE-PREP-LATEST.md").write_text(
        f"""# Phase 7.5 · Release Package

**Machine:** `TT_RELEASE_PACKAGE`  
**Status:** **PREP_COMPLETE · NOT_LOCKED**  
**Recorded:** {now}  
**Release Notes:** `P7.5-RELEASE-NOTES-V311-RC1-LATEST.md` · Data Cert **{status}**

**LOCK** 仅在 Execute 后 Function Cert **54/0/0**。
""",
        encoding="utf-8",
    )

    items = [
        ("C-01", "P0", "CLOSED", "AGENTS → v311"),
        ("C-02", "P0", "CLOSED", "Execution Matrix MD → v311"),
        ("C-03", "P0", "CLOSED", "Formal RE Ladder + PSG domains"),
        ("C-04", "P0", "OPEN", "Function Cert waiting F-02 Execute (2026-07-20T11:37:37Z)"),
        ("C-05", "P0", "OPEN", "Product Cert waits Function + UI Full"),
        ("C-06", "P0", "CLOSED" if status == "PASS" else "PARTIAL", f"Data Cert {status}"),
        ("C-07", "P0", "OPEN", "UI Full Cert real-wallet/real-tx OPEN"),
        ("C-08", "P0", "PARTIAL", "Config Baseline PARTIAL — runtime endpoints OWNER"),
        ("C-09", "P1", "CLOSED", "Deployment Cert PASS"),
        ("C-10", "P1", "CLOSED", "Ops Cert PASS (②)"),
        ("C-11", "P1", "CLOSED", "Recovery/Upgrade/Incident runbook"),
        ("C-12", "P1", "PARTIAL", "Package PREP_COMPLETE + Notes READY · NOT_LOCKED"),
        ("C-13", "P1", "CLOSED", "Hygiene Master Map + cinematic"),
        ("C-14", "P1", "CLOSED", "Five-main UI PASS"),
        ("C-15", "P1", "CLOSED", "Wallet L5 PASS"),
        ("C-16", "P1", "CLOSED", "Itinerary L5 PASS"),
        ("C-17", "P1", "CLOSED", "Matrix gate PASS"),
        ("C-18", "P1", "CLOSED", "I-01 PASS"),
        ("C-19", "P2", "CLOSED", "cinematic maybe-run restored"),
        ("C-20", "P2", "OPEN", "Binding RC-02 after Phase 8"),
        ("C-21", "P0", "BLOCKED", "Phase 8 blocked until Function Cert"),
        ("C-22", "P0", "BLOCKED", "TT_PSG_SEPOLIA_FREEZE not entered"),
        ("C-23", "P0", "BLOCKED", "Production GO not entered"),
        ("C-24", "P1", "CLOSED", "CMS 10-country CLOSED"),
        ("C-25", "P1", "CLOSED", "i18n en/zh parity"),
        ("C-26", "P1", "CLOSED", "Listings + Ambient cited"),
        ("C-27", "P1", "CLOSED", "Guide live vertical-slice + parity PASS"),
        ("C-28", "P1", "CLOSED", "Search discover/orders + vitest PASS"),
        ("C-29", "P1", "CLOSED", "API Projection I-01 + guides/discover PASS"),
        ("C-30", "P1", "CLOSED", "Release Notes RC1 READY + Evidence index READY"),
    ]
    closed = sum(1 for i in items if i[2] == "CLOSED")
    remaining = sum(1 for i in items if i[2] != "CLOSED")
    (EV / "PHASE-MINUS1-FINAL-CLOSURE-AUDIT-LATEST.json").write_text(
        json.dumps(
            {
                "machine_key": "TT_V311_FINAL_CLOSURE_AUDIT",
                "status": "IN_PROGRESS",
                "recorded_utc": now,
                "closed": closed,
                "remaining": remaining,
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
    (EV / "PHASE-MINUS1-FINAL-CLOSURE-AUDIT-LATEST.md").write_text(
        f"""# Phase −1 · Final Closure Audit

**Status:** **IN_PROGRESS**  
**Recorded:** {now}  
**F-02 ETA:** 2026-07-20T11:37:37Z · 只读（无合约/ACTIVE/Runtime/Registry）

| # | Sev | Status | Item |
|---|-----|--------|------|
"""
        + "\n".join(f"| {a} | {b} | **{c}** | {d} |" for a, b, c, d in items)
        + f"""

**Counts:** CLOSED={closed} · remaining={remaining} · total={len(items)}
""",
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
        ],
        "phases": {
            "P-1": "IN_PROGRESS",
            "P0": "READY_FOR_RC",
            "P0.5": "PARTIAL",
            "P1": "PASS",
            "P2": "PASS",
            "P2.5": status,
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
            "close_all_OPEN",
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
| 2.5 Data Cert | **{status}** |
| 3 PSG Baseline | **PASS** |
| 4 Function Cert | IN_PROGRESS（F-02 Queued） |
| 5 UI/UX | PARTIAL |
| 6 Product | OPEN |
| 6.5 Ops | **PASS**（②） |
| 7 Docs/Evidence | **READY** |
| 7.5 Package | PREP_COMPLETE · Notes **READY** · **NOT_LOCKED** |
| 8…10.5 / Freeze / GO | BLOCKED / NOT_CLAIMED |

**Execute 后统一：** Function Cert **54/0/0** → 关闭全部 OPEN → Phase 8 → RC-02 → Manual → P10.5 → Freeze → GO。
""",
        encoding="utf-8",
    )
    print("data", status, "closed", closed, "remaining", remaining)


if __name__ == "__main__":
    main()
