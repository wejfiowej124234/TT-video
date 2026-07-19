#!/usr/bin/env python3
"""PSG V311 Production Gap Audit (non-mutating).

Tracks: Production Readiness · PSG Certification · non-Money-Path Function Cert ·
Ops · Release Package · Evidence Chain.

Discipline: Governance RC FROZEN_WAITING_EXECUTE —
does NOT mutate protocol / ACTIVE / Runtime / Registry / Package.
Does NOT implement Money-Path. Does NOT claim consistency PASS.
"""
from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence/GO_psg_v311_production_gap_audit"
FRE = ROOT / "evidence/GO_phase2_v311_final_release"
ALIGN = ROOT / "evidence/GO_v311_constitution_production_alignment_audit"
ETA = "2026-07-20T11:37:37Z"

FORBID = ["protocol", "ACTIVE", "Runtime", "Registry", "Package"]


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load(rel: str):
    p = ROOT / rel
    if not p.is_file():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return None


def _status(obj, *keys, default="UNKNOWN"):
    if not obj:
        return default
    for k in keys:
        if k in obj and obj[k] is not None:
            return obj[k]
    return default


def main() -> int:
    now = _utc()
    EV.mkdir(parents=True, exist_ok=True)

    board = _load("evidence/GO_phase2_v311_final_release/TIMELOCK-PARALLEL-BOARD-LATEST.json") or {}
    dual = _load("evidence/GO_v311_constitution_production_alignment_audit/DUAL-RC-TRACK-BOARD-LATEST.json") or {}
    hb = _load("evidence/GO_v311_constitution_production_alignment_audit/F02-EXECUTE-MONITOR-HEARTBEAT-LATEST.json") or {}
    fn = _load("evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.json") or {}
    p5 = _load("evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json") or {}
    p6 = _load("evidence/GO_phase2_v311_final_release/P6-PRODUCT-CERT-LATEST.json") or {}
    p65 = _load("evidence/GO_phase2_v311_final_release/P6.5-OPERATIONS-CERT-LATEST.json") or {}
    p75 = _load("evidence/GO_phase2_v311_final_release/P7.5-RELEASE-PACKAGE-PREFLIGHT-LATEST.json") or {}
    p05 = _load("evidence/GO_phase2_v311_final_release/P0.5-OWNER-CONFIG-ENV-CHECK-LATEST.json") or {}
    drift = _load("evidence/GO_phase2_v311_final_release/FULL-SYSTEM-DRIFT-AUDIT-LATEST.json") or {}
    closure = _load("evidence/GO_phase2_v311_final_release/PHASE-MINUS1-FINAL-CLOSURE-AUDIT-LATEST.json") or {}
    const = _load(
        "evidence/GO_v311_constitution_production_alignment_audit/"
        "CONSTITUTION-PRODUCTION-ALIGNMENT-AUDIT-LATEST.json"
    ) or {}
    baseline = _load("evidence/GO_psg_foundation/release_baseline/RELEASE-BASELINE-LATEST.json") or {}
    matrix = _load(
        "evidence/GO_web3_full_constitution_consistency_matrix/"
        "WEB3-FULL-CONSTITUTION-CONSISTENCY-LATEST.json"
    ) or {}
    exit_map = _load(
        "evidence/GO_v311_constitution_production_alignment_audit/"
        "PRODUCTION-EXIT-CRITERIA-V1-AUDIT-MAP-LATEST.json"
    ) or {}

    phases = board.get("phases") or {}
    fn_counts = fn.get("counts") or {}
    function_54 = (
        fn_counts.get("PASS") == 54
        and fn_counts.get("FAIL", 1) == 0
        and fn_counts.get("OWNER_REQUIRED", 1) == 0
    )

    tracks = {
        "T1_PRODUCTION_READINESS": {
            "verdict": "PARTIAL",
            "machine_keys": [
                "TT_PRODUCTION_READINESS_REVIEW",
                "TT_CONFIGURATION_BASELINE",
                "TT_CONFIGURATION_ZERO_DRIFT",
            ],
            "per": "FROZEN (five items signed · CMS matrix production_preparation)",
            "p05": _status(p05, "status"),
            "p105": phases.get("P10.5", "BLOCKED"),
            "gaps": [
                {
                    "id": "GAP-PR-01",
                    "sev": "P0",
                    "bucket": "WAIT_ETA_THEN_LADDER",
                    "text": "P10.5 TT_PRODUCTION_READINESS_REVIEW blocked until P8→P9→P10",
                    "close_when": "Post Function 54/0/0 → Product → UI → P8–P10",
                },
                {
                    "id": "GAP-PR-02",
                    "sev": "P1",
                    "bucket": "DO_NOW_OWNER_ENV",
                    "text": "FE Sepolia env + WalletConnect Project ID for UI Full",
                    "close_when": "Owner sets frontend Sepolia .env (no protocol mutate)",
                    "owner_actions": p05.get("owner_actions") or [],
                },
            ],
        },
        "T2_PSG_CERTIFICATION": {
            "verdict": "PARTIAL",
            "note": "Frozen baseline Tag PASS ≠ V311 Final Freeze/GO",
            "frozen_baseline": {
                "tag": baseline.get("tag") or "v1.1.0-psg-go.20260717",
                "tt_psg_production_cert": baseline.get("tt_psg_production_cert"),
                "tt_production_go": baseline.get("tt_production_go"),
                "status": baseline.get("status"),
                "immutable_archive": True,
            },
            "v311": {
                "TT_PSG_SEPOLIA_FREEZE": phases.get("TT_PSG_SEPOLIA_FREEZE", "NOT_CLAIMED"),
                "Production_GO": phases.get("Production_GO", "NOT_CLAIMED"),
                "P10.5": phases.get("P10.5", "BLOCKED"),
            },
            "gaps": [
                {
                    "id": "GAP-PSG-01",
                    "sev": "P0",
                    "bucket": "WAIT_ETA_THEN_LADDER",
                    "text": "V311 TT_PSG_SEPOLIA_FREEZE not entered",
                    "close_when": "Ladder through P10.5 PASS then Freeze candidacy",
                },
                {
                    "id": "GAP-PSG-02",
                    "sev": "P0",
                    "bucket": "WAIT_ETA_THEN_LADDER",
                    "text": "V311 Production GO not entered (Final GO ≠ Tag GO)",
                    "close_when": "Exit Criteria X-GO after Governance+Money-Path as required",
                },
                {
                    "id": "GAP-PSG-03",
                    "sev": "P2",
                    "bucket": "DO_NOW_HYGIENE",
                    "text": "Keep frozen archive IMMUTABLE; do not re-run PASS gates to refresh GO pack",
                    "close_when": "Discipline attested in this audit (ongoing)",
                },
            ],
        },
        "T3_NON_MONEY_PATH_FUNCTION_CERT": {
            "verdict": "OPEN",
            "function": {
                "machine_key": "TT_V311_WEB3_FULL_FUNCTION_CERT",
                "verdict": fn.get("verdict"),
                "counts": fn_counts,
                "is_54_0_0": function_54,
            },
            "product": {
                "machine_key": "TT_V311_WEB3_FULL_PRODUCT_CERT",
                "status": p6.get("status"),
                "aggregate": p6.get("aggregate"),
            },
            "ui": {
                "machine_key": "TT_V311_WEB3_UI_UX_FULL_CERT",
                "status": p5.get("status"),
                "gates": p5.get("gates"),
            },
            "gaps": [
                {
                    "id": "GAP-FN-01",
                    "sev": "P0",
                    "bucket": "WAIT_ETA",
                    "alias": ["GOV-02", "C-04", "CERT-01"],
                    "text": "F-02 Proposal #1 Queued — Execute after ETA",
                    "eta": ETA,
                },
                {
                    "id": "GAP-FN-02",
                    "sev": "P0",
                    "bucket": "WAIT_ETA_THEN_LADDER",
                    "alias": ["CERT-01", "C-04"],
                    "text": "Function Cert not 54/0/0 (50 PASS / 0 FAIL / 4 OWNER_REQUIRED)",
                },
                {
                    "id": "GAP-FN-03",
                    "sev": "P0",
                    "bucket": "WAIT_ETA_THEN_LADDER",
                    "alias": ["CERT-02", "C-05"],
                    "text": "Product Cert OPEN — waits Function + UI Full",
                },
                {
                    "id": "GAP-FN-04",
                    "sev": "P0",
                    "bucket": "DO_NOW_OWNER_ENV_THEN_POST_EXECUTE",
                    "alias": ["CERT-03", "C-07"],
                    "text": "UI Full playwright real-wallet/real-tx OPEN",
                },
            ],
            "money_path_deferred": ["TRE-02", "REG-01", "REG-04"],
            "forbid_mix_into_governance_rc": True,
        },
        "T4_OPS": {
            "verdict": "PASS_SCOPE_SEPOLIA_RC",
            "machine_key": "TT_OPERATIONS_CERT",
            "status": p65.get("status") or p65.get("tt_operations_cert"),
            "honest_boundary": "≠ ③ production pager / live PSP ops",
            "gaps": [
                {
                    "id": "GAP-OPS-01",
                    "sev": "P2",
                    "bucket": "DEFER_PHASE3",
                    "text": "③ production alerting/pager wiring — post Final GO prep",
                },
                {
                    "id": "GAP-OPS-02",
                    "sev": "P2",
                    "bucket": "DO_NOW_HYGIENE",
                    "text": "Keep recovery/incident/alert runbooks current (no protocol mutate)",
                    "close_when": "Re-attest Ops Cert cite remains PASS",
                },
            ],
        },
        "T5_RELEASE_PACKAGE": {
            "verdict": "PARTIAL",
            "machine_key": "TT_RELEASE_PACKAGE",
            "preflight": p75.get("status"),
            "tt_release_package": p75.get("tt_release_package"),
            "lock_executed": p75.get("lock_executed"),
            "p8": phases.get("P8", "BLOCKED"),
            "gaps": [
                {
                    "id": "GAP-PKG-01",
                    "sev": "P1",
                    "bucket": "WAIT_ETA_THEN_LADDER",
                    "alias": ["C-12"],
                    "text": "Package PREFLIGHT_PASS but NOT_LOCKED until Function 54/0/0",
                },
                {
                    "id": "GAP-PKG-02",
                    "sev": "P0",
                    "bucket": "WAIT_ETA_THEN_LADDER",
                    "alias": ["C-21"],
                    "text": "Phase 8 RC Candidate LOCK blocked",
                },
            ],
        },
        "T6_EVIDENCE_CHAIN": {
            "verdict": "PARTIAL",
            "dual_rc_mode": dual.get("mode") or "FROZEN_WAITING_EXECUTE",
            "f02_monitor": (hb.get("phase") or "UNKNOWN"),
            "drift": _status(
                drift,
                "tt_v311_full_system_drift_audit",
                "verdict",
                default="UNKNOWN",
            ),
            "constitution_audit": const.get("tt_v311_constitution_production_alignment_audit")
            or const.get("verdict"),
            "consistency_matrix": matrix.get("tt_web3_full_constitution_consistency"),
            "closure": {
                "status": closure.get("status"),
                "closed": closure.get("closed"),
                "remaining": closure.get("remaining"),
            },
            "exit_criteria": exit_map.get("machine_key") or "TT_V311_PRODUCTION_EXIT_CRITERIA_V1",
            "gaps": [
                {
                    "id": "GAP-EV-01",
                    "sev": "P0",
                    "bucket": "WAIT_ETA_THEN_LADDER",
                    "text": "Exit Criteria G-RC-01..04 open until Execute/Function/Product/UI",
                },
                {
                    "id": "GAP-EV-02",
                    "sev": "P0",
                    "bucket": "MONEY_PATH_DEFERRED",
                    "alias": ["TRE-02", "REG-01", "REG-04"],
                    "text": "Constitution money-path P0 deferred — implementation after Governance CLOSED",
                },
                {
                    "id": "GAP-EV-03",
                    "sev": "P1",
                    "bucket": "DO_NOW_HYGIENE",
                    "alias": ["DOC-01"],
                    "text": "Historical TT_WEB3_FULL_ALIGNMENT=PASS claims conflict with V311 production-grade FAIL — supersede in docs (do not mutate ACTIVE registry pins)",
                },
                {
                    "id": "GAP-EV-04",
                    "sev": "P2",
                    "bucket": "DO_NOW_HYGIENE",
                    "text": "Continue F-02 heartbeat monitoring until ETA",
                },
            ],
        },
    }

    # Flatten backlog
    backlog = []
    for tid, tr in tracks.items():
        for g in tr.get("gaps") or []:
            backlog.append({**g, "track": tid})

    bucket_order = [
        "DO_NOW_HYGIENE",
        "DO_NOW_OWNER_ENV",
        "DO_NOW_OWNER_ENV_THEN_POST_EXECUTE",
        "WAIT_ETA",
        "WAIT_ETA_THEN_LADDER",
        "MONEY_PATH_DEFERRED",
        "DEFER_PHASE3",
    ]
    backlog.sort(
        key=lambda x: (
            bucket_order.index(x["bucket"])
            if x["bucket"] in bucket_order
            else 99,
            {"P0": 0, "P1": 1, "P2": 2}.get(x.get("sev"), 9),
            x["id"],
        )
    )

    do_now = [b for b in backlog if str(b["bucket"]).startswith("DO_NOW")]
    wait = [b for b in backlog if "WAIT" in b["bucket"]]
    money = [b for b in backlog if b["bucket"] == "MONEY_PATH_DEFERRED"]
    defer3 = [b for b in backlog if b["bucket"] == "DEFER_PHASE3"]

    # Closure Phase -1 remaining (cite)
    closure_open = [
        it
        for it in (closure.get("items") or [])
        if it.get("status") != "CLOSED"
    ]

    audit = {
        "schema": "traveltrust.psg_v311_production_gap_audit.v1",
        "machine_key": "TT_PSG_V311_PRODUCTION_GAP_AUDIT",
        "recorded_utc": now,
        "governance_mode": "FROZEN_WAITING_EXECUTE",
        "forbid_mutate": FORBID,
        "money_path_implement_now": False,
        "consistency_pass_claim": "FORBIDDEN",
        "economic_ssot": "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md",
        "exit_criteria": "TT_V311_PRODUCTION_EXIT_CRITERIA_V1",
        "f02_eta_utc": ETA,
        "proposal_1": (hb.get("proposal_1") or dual.get("tracks", {})
                       .get("A_GOVERNANCE_RC", {})
                       .get("proposal_1")),
        "overall_verdict": "GAPS_OPEN_LADDER_HELD",
        "tt_psg_v311_production_gap_audit": "GAPS_OPEN_LADDER_HELD",
        "honest_boundary": {
            "frozen_psg_tag_go_equals_v311_final_go": False,
            "ops_cert_equals_phase3_ops": False,
            "preflight_equals_package_lock": False,
            "function_50_equals_54": False,
        },
        "tracks": tracks,
        "backlog": backlog,
        "backlog_counts": {
            "total": len(backlog),
            "do_now": len(do_now),
            "wait_eta_or_ladder": len(wait),
            "money_path_deferred": len(money),
            "defer_phase3": len(defer3),
        },
        "phase_minus1_remaining": closure_open,
        "post_execute_ladder_locked": [
            "F02_Execute_success",
            "Function_Cert_54_0_0",
            "Product_Cert_PASS",
            "UI_Full_Cert_PASS",
            "Governance_RC_CLOSED",
            "Money_Path_OPT_A_TRE02_REG01_REG04",
            "V_UNIT",
            "V_SEPOLIA",
            "V_REAUDIT",
            "Constitution_Audit_PASS",
            "Full_Consistency_Matrix_rerun",
        ],
        "cite": {
            "timelock_board": "evidence/GO_phase2_v311_final_release/TIMELOCK-PARALLEL-BOARD-LATEST.json",
            "dual_rc": "evidence/GO_v311_constitution_production_alignment_audit/DUAL-RC-TRACK-BOARD-LATEST.json",
            "function_cert": "evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.json",
            "package": "evidence/GO_phase2_v311_final_release/P7.5-RELEASE-PACKAGE-PREFLIGHT-LATEST.json",
            "ops": "evidence/GO_phase2_v311_final_release/P6.5-OPERATIONS-CERT-LATEST.json",
            "baseline": "evidence/GO_psg_foundation/release_baseline/RELEASE-BASELINE-LATEST.json",
        },
    }

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    (EV / f"PSG-V311-PRODUCTION-GAP-AUDIT-{stamp}.json").write_text(
        json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (EV / "PSG-V311-PRODUCTION-GAP-AUDIT-LATEST.json").write_text(
        json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    # mirror
    FRE.mkdir(parents=True, exist_ok=True)
    (FRE / "PSG-V311-PRODUCTION-GAP-AUDIT-LATEST.json").write_text(
        json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    ALIGN.mkdir(parents=True, exist_ok=True)
    (ALIGN / "PSG-V311-PRODUCTION-GAP-AUDIT-LATEST.json").write_text(
        json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    def _rows(items):
        lines = []
        for b in items:
            alias = ",".join(b.get("alias") or []) or "—"
            lines.append(
                f"| {b['id']} | {b.get('sev')} | {b['bucket']} | {b['text']} | {alias} |"
            )
        return "\n".join(lines) or "| — | — | — | — | — |"

    md = f"""# PSG · V311 Production Gap Audit（LATEST）

**Machine:** `TT_PSG_V311_PRODUCTION_GAP_AUDIT`  
**Recorded:** `{now}`  
**Governance:** `FROZEN_WAITING_EXECUTE` · ETA `{ETA}`  
**Forbid mutate:** protocol · ACTIVE · Runtime · Registry · Package  
**Money-Path implement now:** **NO** · Consistency PASS claim: **FORBIDDEN**

## Overall

| Key | Value |
|-----|-------|
| Verdict | **`GAPS_OPEN_LADDER_HELD`** |
| Frozen Tag GO | `{baseline.get("tag")}` · Cert `{baseline.get("tt_psg_production_cert")}` · GO `{baseline.get("tt_production_go")}` ≠ V311 Final GO |
| Function | `{fn.get("verdict")}` · counts `{fn_counts}` · 54/0/0=`{function_54}` |
| Product | `{p6.get("status")}` |
| UI Full | `{p5.get("status")}` |
| Ops | `{p65.get("status") or p65.get("tt_operations_cert")}`（② RC scope） |
| Package | `{p75.get("status")}` / `{p75.get("tt_release_package")}` |
| Drift | `{_status(drift, "tt_v311_full_system_drift_audit", "verdict")}` |
| Constitution audit | `{const.get("verdict")}` |
| Consistency matrix | `{matrix.get("tt_web3_full_constitution_consistency")}` |

## Six tracks

| Track | Verdict |
|-------|---------|
| T1 Production Readiness | PARTIAL（PER FROZEN · P10.5 BLOCKED） |
| T2 PSG Certification | PARTIAL（Tag PASS · V311 Freeze/GO NOT_CLAIMED） |
| T3 Non-Money-Path Function Cert | OPEN（等 Execute → 54/0/0） |
| T4 Ops | PASS_SCOPE_SEPOLIA_RC |
| T5 Release Package | PARTIAL（Preflight PASS · NOT_LOCKED） |
| T6 Evidence Chain | PARTIAL（Dual-RC armed · ladder held） |

## Remaining backlog ({len(backlog)})

### Do now ({len(do_now)})

| ID | Sev | Bucket | Text | Alias |
|----|-----|--------|------|-------|
{_rows(do_now)}

### Wait ETA / ladder ({len(wait)})

| ID | Sev | Bucket | Text | Alias |
|----|-----|--------|------|-------|
{_rows(wait)}

### Money-Path deferred ({len(money)})

| ID | Sev | Bucket | Text | Alias |
|----|-----|--------|------|-------|
{_rows(money)}

### Defer ③ ({len(defer3)})

| ID | Sev | Bucket | Text | Alias |
|----|-----|--------|------|-------|
{_rows(defer3)}

## Phase −1 remaining (cite)

| ID | Sev | Status | Text |
|----|-----|--------|------|
""" + "\n".join(
        f"| {it.get('id')} | {it.get('sev')} | {it.get('status')} | {it.get('text')} |"
        for it in closure_open
    ) + f"""

## Locked post-Execute order

```text
Execute → Function 54/0/0 → Product → UI Full → Governance CLOSED
  → Money-Path OPT-A (TRE-02→REG-01→REG-04)
  → V-UNIT → V-SEPOLIA → V-REAUDIT → Constitution Audit PASS
  → Full matrix rerun
```

任一阶未 PASS → 停止 · 禁止跳阶 · 禁止 `TT_WEB3_FULL_CONSTITUTION_CONSISTENCY=PASS`。

## Commands (non-mutating)

```bash
python scripts/dev/stamp-v311-f02-execute-monitor-heartbeat.py
python scripts/dev/run-v311-full-system-drift-audit.py
python scripts/dev/run-psg-v311-production-gap-audit.py
python scripts/dev/run-web3-full-constitution-consistency-matrix.py
```
"""
    (EV / "PSG-V311-PRODUCTION-GAP-AUDIT-LATEST.md").write_text(md, encoding="utf-8")
    (FRE / "PSG-V311-PRODUCTION-GAP-AUDIT-LATEST.md").write_text(md, encoding="utf-8")
    (ALIGN / "PSG-V311-PRODUCTION-GAP-AUDIT-LATEST.md").write_text(md, encoding="utf-8")

    # Human runbook
    rb = ROOT / "docs/runbook/TT-PSG-V311-PRODUCTION-GAP-AUDIT-LATEST.md"
    rb.write_text(
        md
        + "\n**Registry:** [`registry/psg-v311-production-gap-audit.v1.yaml`]"
        "(../../registry/psg-v311-production-gap-audit.v1.yaml)\n"
        "**Evidence:** `evidence/GO_psg_v311_production_gap_audit/`\n",
        encoding="utf-8",
    )

    # Registry SSOT (meta only — not ACTIVE address matrix)
    reg = {
        "schema": "traveltrust.psg_v311_production_gap_audit.v1",
        "machine_key": "TT_PSG_V311_PRODUCTION_GAP_AUDIT",
        "version": "1.0.0",
        "status": "ACTIVE_SSOT",
        "recorded_utc": now,
        "governance_mode_required": "FROZEN_WAITING_EXECUTE",
        "forbid_mutate": FORBID,
        "runner": "scripts/dev/run-psg-v311-production-gap-audit.py",
        "evidence": "evidence/GO_psg_v311_production_gap_audit/PSG-V311-PRODUCTION-GAP-AUDIT-LATEST.json",
        "runbook": "docs/runbook/TT-PSG-V311-PRODUCTION-GAP-AUDIT-LATEST.md",
        "tracks": list(tracks.keys()),
        "pass_machine_forbidden_until_ladder": "TT_WEB3_FULL_CONSTITUTION_CONSISTENCY",
    }
    try:
        import yaml  # type: ignore

        (ROOT / "registry/psg-v311-production-gap-audit.v1.yaml").write_text(
            yaml.safe_dump(reg, sort_keys=False, allow_unicode=True),
            encoding="utf-8",
        )
    except Exception:
        (ROOT / "registry/psg-v311-production-gap-audit.v1.yaml").write_text(
            json.dumps(reg, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    print(
        json.dumps(
            {
                "TT_PSG_V311_PRODUCTION_GAP_AUDIT": "GAPS_OPEN_LADDER_HELD",
                "backlog_total": len(backlog),
                "do_now": len(do_now),
                "wait": len(wait),
                "money_path": len(money),
                "function_54": function_54,
                "governance_mode": "FROZEN_WAITING_EXECUTE",
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
