#!/usr/bin/env python3
"""WAIT_WINDOW prep pack: FG-Web3 audit matrix, 15 coverage cases, evidence schema,
Chain↔Indexer↔API↔DB↔UI verify harness (dry), Clean Deploy checklist align.

HARD FORBID: broadcast · ACTIVE flip · invent FG PASS · Money-Path live settle.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
STAMP = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

FG = [
    ("FG-01", "Money-Path", "E", ["TRE-02", "M-RC-01"], "onchain_fee_split_eq_ledger"),
    ("FG-02", "Escrow_State_Machine", "D", ["REG-04", "FCG-ESCROW-01"], "escrow_happy_and_exception_states"),
    ("FG-03", "SettlementRouter", "E", ["FCG-PAY-01"], "settlement_ready_no_skip"),
    ("FG-04", "FeeRouter", "E", ["TRE-02"], "fee_router_constitution_route"),
    ("FG-05", "Distributable", "E", ["REG-04"], "pending_locked_settlement_ready_distributable_distributed"),
    ("FG-06", "Steward_Revenue", "F", ["FCG-STEWARD-01"], "steward_45_55_or_100_prp"),
    ("FG-07", "Treasury", "C/E/I", ["GOV"], "treasury_address_and_balance_verifiable"),
    ("FG-08", "TTG_Governance", "C/G", ["G-RC-02"], "proposal_vote_queue"),
    ("FG-09", "Timelock_Execute", "G", ["G-RC-01"], "timelock_execute_receipt_sepolia"),
    ("FG-10", "Wallet_Security", "B/K", ["FCG-WALLET-01"], "extension_wc_mobile_qr_wrong_network"),
    ("FG-11", "RBAC", "K", ["FCG-RBAC-01"], "role_matrix_full_gate_bar"),
    ("FG-12", "Indexer", "K/L", ["DEP-V2-06"], "events_projected_match_chain"),
    ("FG-13", "Chain_DB_API_UI_Consistency", "E/I", ["FG-13"], "chain_eq_db_eq_api_eq_ui"),
    ("FG-14", "Audit_Evidence", "L", ["X-GO"], "gate_citeable_evidence_pack"),
    ("FG-15", "Observation_48H", "K", ["48H"], "contracts_payments_events_indexer_api_errors"),
]


def dump_yaml(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")


def dump_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_audit_matrix() -> dict:
    rows = []
    for fid, name, domain, findings, acceptance in FG:
        rows.append(
            {
                "id": fid,
                "surface": name,
                "full_capability_domain": domain,
                "findings_or_tracks": findings,
                "acceptance_key": acceptance,
                "coverage_case_id": f"FGCASE-{fid}",
                "status": "NOT_READY",
                "denom_in": "IN",
                "wait_window": True,
                "broadcast_forbidden": True,
                "evidence_schema_ref": f"evidence.fg_web3.case.{fid}",
                "verify_script": "scripts/dev/verify-fg-web3-chain-indexer-api-db-ui-prep.py",
            }
        )
    data = {
        "schema": "traveltrust.psg_fg_web3_audit_matrix.v1",
        "machine_key": "TT_PSG_FG_WEB3_AUDIT_MATRIX",
        "status": "STAGED_WAIT_G_RC_CLOSED",
        "recorded_utc": STAMP,
        "human_ssot": "docs/runbook/TT-PSG-FG-WEB3-AUDIT-MATRIX-LATEST.md",
        "constitution": "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md#psg-production-completion",
        "completion": "registry/psg-production-completion-definition.v1.yaml",
        "full_capability_gate": "registry/psg-production-full-capability-gate.v1.yaml",
        "discipline": {
            "no_broadcast": True,
            "no_active_flip": True,
            "no_invented_pass": True,
            "wait_window": True,
        },
        "rollup": {"pass": 0, "denom": 15, "decision": "NEED_FIX"},
        "rows": rows,
    }
    dump_yaml(ROOT / "registry/psg-fg-web3-audit-matrix.v1.yaml", data)
    return data


def write_coverage_cases() -> dict:
    cases = []
    for fid, name, domain, findings, acceptance in FG:
        cases.append(
            {
                "id": f"FGCASE-{fid}",
                "fg_id": fid,
                "surface": name,
                "full_capability_domain": domain,
                "pass_requires": [
                    acceptance,
                    "citeable_evidence_under_GO_phase2_fcg_full_capability_v2_sepolia",
                    "threshold_Financial_Grade_Web3_cell_PASS",
                ],
                "fail_if": [
                    "docs_only_claim",
                    "web2_coverage_substituted",
                    "legacy_v311_baseline_used_as_commercial_ssot",
                ],
                "prep_now": [
                    "case_registered_in_denom",
                    "evidence_slot_reserved",
                    "verify_harness_linked",
                ],
                "execute_after": "GOVERNANCE_RC_CLOSED_AND_CLEAN_DEPLOY",
                "status": "CASE_STAGED_NOT_EXECUTED",
                "pass": False,
            }
        )
    data = {
        "schema": "traveltrust.psg_fg_web3_coverage_cases.v1",
        "machine_key": "TT_PSG_FG_WEB3_COVERAGE_CASES",
        "status": "STAGED_WAIT_G_RC_CLOSED",
        "recorded_utc": STAMP,
        "human_ssot": "docs/runbook/TT-PSG-FG-WEB3-COVERAGE-CASES-LATEST.md",
        "measurement_binding": "registry/psg-coverage-measurement-final.v1.yaml#metrics.Financial_Grade_Web3",
        "threshold_binding": "registry/psg-coverage-acceptance-threshold-matrix.v1.yaml#thresholds_first_production_slice.Financial_Grade_Web3",
        "cases": cases,
        "rollup": {"staged": 15, "executed_pass": 0, "decision": "NEED_FIX"},
    }
    dump_yaml(ROOT / "registry/psg-fg-web3-coverage-cases.v1.yaml", data)
    return data


def write_evidence_schema() -> dict:
    data = {
        "schema": "traveltrust.psg_fg_web3_evidence_schema.v1",
        "machine_key": "TT_PSG_FG_WEB3_EVIDENCE_SCHEMA",
        "version": "1.0.0",
        "recorded_utc": STAMP,
        "human_ssot": "docs/runbook/TT-PSG-FG-WEB3-EVIDENCE-SCHEMA-LATEST.md",
        "root": "evidence/GO_phase2_fcg_full_capability_v2_sepolia/",
        "pending_root": "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/",
        "live_root_after_g_rc": "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3/",
        "discipline": {
            "pending_only_until_g_rc_closed": True,
            "broadcast_artifacts_forbidden_now": True,
        },
        "required_artifacts_after_g_rc": [
            "CLEAN-DEPLOY-BROADCAST-LATEST.json",
            "ADDRESS-MATRIX-V2-LATEST.json",
            "ACTIVE-CUTOVER-STAMP-LATEST.json",
            "FG-WEB3-CASE-RESULTS-LATEST.json",
            "CHAIN-INDEXER-API-DB-UI-CONSISTENCY-LATEST.json",
            "OBSERVATION-48H-START-LATEST.json",
        ],
        "case_result_object": {
            "fg_id": "FG-NN",
            "status": "PASS|FAIL|NOT_RUN|BLOCKED",
            "tx_hashes": [],
            "meta_snapshot": {},
            "db_row_ids": [],
            "api_paths": [],
            "ui_routes": [],
            "notes": "",
            "recorded_utc": "ISO8601",
        },
        "consistency_object_fg13": {
            "chain": {"addresses": {}, "events": []},
            "indexer": {"last_block": None, "projected_events": []},
            "api": {"/meta.chain.contracts": {}, "order_or_escrow": {}},
            "db": {"tables": []},
            "ui": {"routes": []},
            "equality_checks": [
                "address_matrix_eq_meta",
                "event_count_chain_eq_indexer",
                "amount_chain_eq_db_eq_api_eq_ui",
            ],
            "verdict": "PASS|FAIL|PREP_ONLY",
        },
        "acceptance_threshold_align": {
            "Financial_Grade_Web3": "pass/15 == 100",
            "rollup_blocks_psg_complete_until_15_15": True,
        },
    }
    dump_yaml(ROOT / "registry/psg-fg-web3-evidence-schema.v1.yaml", data)
    return data


def probe_meta(base: str | None) -> dict:
    if not base:
        return {"probed": False, "reason": "TT_FG_VERIFY_API_BASE unset — prep dry"}
    url = base.rstrip("/") + "/meta"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            body = json.loads(resp.read().decode("utf-8", errors="replace"))
        chain = (body.get("chain") or {}) if isinstance(body, dict) else {}
        contracts = chain.get("contracts") or body.get("contracts") or {}
        return {
            "probed": True,
            "url": url,
            "http_ok": True,
            "has_chain": bool(chain),
            "contract_keys": sorted(list(contracts.keys()))[:40] if isinstance(contracts, dict) else [],
            "note": "READ_ONLY probe — not FG PASS",
        }
    except Exception as e:  # noqa: BLE001
        return {"probed": True, "url": url, "http_ok": False, "error": str(e), "note": "prep dry continue"}


def write_verify_result() -> dict:
    api_base = os.environ.get("TT_FG_VERIFY_API_BASE") or os.environ.get("API_BASE_URL")
    meta = probe_meta(api_base)
    # Static prep checks (local files)
    required = [
        "contracts/src/SettlementRouter.sol",
        "contracts/src/ISettlementRouter.sol",
        "contracts/script/DeployFcgFullCapabilityV2Sepolia.s.sol",
        "registry/psg-production-completion-definition.v1.yaml",
        "registry/psg-production-full-capability-gate.v1.yaml",
        "registry/psg-coverage-measurement-final.v1.yaml",
        "registry/psg-fg-web3-audit-matrix.v1.yaml",
        "registry/psg-fg-web3-coverage-cases.v1.yaml",
        "registry/psg-fg-web3-evidence-schema.v1.yaml",
        "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/CLEAN-DEPLOY-PENDING-PACK-LATEST.json",
    ]
    file_checks = []
    for rel in required:
        ok = (ROOT / rel).exists()
        file_checks.append({"path": rel, "ok": ok})
    files_ok = all(x["ok"] for x in file_checks)

    # Threshold alignment snapshot
    th = yaml.safe_load(
        (ROOT / "registry/psg-coverage-acceptance-threshold-matrix.v1.yaml").read_text(encoding="utf-8")
    )
    fg_th = (th.get("thresholds_first_production_slice") or {}).get("Financial_Grade_Web3") or {}
    mf = yaml.safe_load((ROOT / "registry/psg-coverage-measurement-final.v1.yaml").read_text(encoding="utf-8"))
    fg_mf = (mf.get("metrics") or {}).get("Financial_Grade_Web3") or {}

    layers = {
        "chain": {
            "mode": "PREP",
            "note": "No live address matrix until Clean Deploy after G-RC CLOSED",
            "deploy_script": "contracts/script/DeployFcgFullCapabilityV2Sepolia.s.sol",
            "broadcast_authorized": False,
        },
        "indexer": {
            "mode": "PREP",
            "note": "Rebind plan DEP-V2-06; execute at cutover only",
            "plan": "registry/psg-protocol-v2-testnet-deployment-plan.v1.yaml",
        },
        "api": {
            "mode": "PREP_OR_PROBE",
            "meta_probe": meta,
        },
        "db": {
            "mode": "PREP",
            "note": "Projection tables exist in core/api; live equality after indexer rebind",
        },
        "ui": {
            "mode": "PREP",
            "note": "FE ABI/env rebind after ACTIVE flip — forbidden now",
            "active_flip_authorized": False,
        },
    }

    equality_prep = [
        {
            "check": "address_matrix_eq_meta",
            "status": "BLOCKED_AWAIT_CLEAN_DEPLOY",
        },
        {
            "check": "event_count_chain_eq_indexer",
            "status": "BLOCKED_AWAIT_CLEAN_DEPLOY",
        },
        {
            "check": "amount_chain_eq_db_eq_api_eq_ui",
            "status": "BLOCKED_AWAIT_CLEAN_DEPLOY",
        },
        {
            "check": "fg_threshold_aligned_to_15_denom",
            "status": "PASS" if int(fg_th.get("denom") or 0) == 15 and int(fg_mf.get("denom") or 0) == 15 else "FAIL",
        },
        {
            "check": "prep_files_present",
            "status": "PASS" if files_ok else "FAIL",
        },
    ]

    verdict = (
        "PREP_READY_AWAIT_G_RC_CLOSED"
        if files_ok and int(fg_th.get("denom") or 0) == 15
        else "PREP_INCOMPLETE"
    )

    result = {
        "schema": "traveltrust.fg_web3_chain_indexer_api_db_ui_consistency_prep.v1",
        "recorded_utc": STAMP,
        "mode": "WAIT_WINDOW_DRY",
        "broadcast_authorized": False,
        "active_flip_authorized": False,
        "governance_rc_closed": False,
        "layers": layers,
        "file_checks": file_checks,
        "equality_prep": equality_prep,
        "threshold_snapshot": {
            "denom": fg_th.get("denom"),
            "pass": fg_th.get("pass", fg_mf.get("pass")),
            "meets": fg_th.get("meets"),
            "measurement_pass": fg_mf.get("pass"),
            "measurement_denom": fg_mf.get("denom"),
        },
        "fg13_live_verdict": "PREP_ONLY",
        "verdict": verdict,
        "next_after_g_rc": [
            "Clean Deploy fcg_full_capability_v2_sepolia",
            "Bind broadcast + address matrix under evidence root",
            "Re-run this script with TT_FG_VERIFY_LIVE=1 + API_BASE + RPC",
            "Fill FGCASE-FG-01..15 results",
            "Recalculate Measurement FG 0/15 → n/15",
        ],
    }
    out = (
        ROOT
        / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
        / "CHAIN-INDEXER-API-DB-UI-CONSISTENCY-PREP-LATEST.json"
    )
    dump_json(out, result)
    dump_json(
        ROOT
        / "evidence/GO_pre_eta_production_prep/coverage-fg-web3-20260719"
        / "CHAIN-INDEXER-API-DB-UI-CONSISTENCY-PREP-LATEST.json",
        result,
    )
    return result


def align_checklist_and_threshold(verify: dict) -> None:
    cl_path = ROOT / "registry/psg-protocol-v2-clean-deploy-ready-checklist.v1.yaml"
    cl = yaml.safe_load(cl_path.read_text(encoding="utf-8"))
    cl["recorded_utc"] = STAMP
    cl["status"] = "READY_CHECKLIST_FG_PREP_LANDED_WAIT_G_RC_CLOSED"
    cl["fg_web3_prep"] = {
        "audit_matrix": "registry/psg-fg-web3-audit-matrix.v1.yaml",
        "coverage_cases": "registry/psg-fg-web3-coverage-cases.v1.yaml",
        "evidence_schema": "registry/psg-fg-web3-evidence-schema.v1.yaml",
        "consistency_prep": (
            "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/"
            "CHAIN-INDEXER-API-DB-UI-CONSISTENCY-PREP-LATEST.json"
        ),
        "verify_script": "scripts/dev/verify-fg-web3-chain-indexer-api-db-ui-prep.py",
        "verdict": verify.get("verdict"),
    }
    checklist = cl.setdefault("checklist", [])
    # upsert CDR-15..18
    extras = [
        {
            "id": "CDR-15",
            "item": "FG_Web3_audit_matrix_staged",
            "ready": True,
            "note": "psg-fg-web3-audit-matrix · 15 surfaces IN denom",
        },
        {
            "id": "CDR-16",
            "item": "FG_Web3_15_coverage_cases_staged",
            "ready": True,
            "note": "FGCASE-FG-01..15 CASE_STAGED_NOT_EXECUTED",
        },
        {
            "id": "CDR-17",
            "item": "Chain_Indexer_API_DB_UI_verify_harness_prep",
            "ready": True,
            "note": "verify-fg-web3-chain-indexer-api-db-ui-prep.py · PREP_ONLY",
        },
        {
            "id": "CDR-18",
            "item": "FG_evidence_schema_and_threshold_aligned",
            "ready": True,
            "note": "evidence schema + Financial_Grade_Web3 denom=15 aligned",
        },
    ]
    by_id = {x.get("id"): x for x in checklist if isinstance(x, dict)}
    for ex in extras:
        if ex["id"] in by_id:
            by_id[ex["id"]].update(ex)
        else:
            checklist.append(ex)
    cl["checklist"] = checklist
    cl["broadcast_forbidden_now"] = True
    cl["active_flip_forbidden_now"] = True
    dump_yaml(cl_path, cl)

    # Gap closure status bump
    gc_path = ROOT / "registry/psg-production-full-capability-gate-gap-closure.v1.yaml"
    if gc_path.exists():
        gc = yaml.safe_load(gc_path.read_text(encoding="utf-8"))
        gc["recorded_utc"] = STAMP
        gc["status"] = "ACTIVE_PHASE1_PAY01_WAIT_WINDOW_FG_PREP_LANDED"
        oa = gc.setdefault("owner_authorization", {})
        oa["scope_this_window"] = (
            "WAIT_WINDOW: FG audit matrix + 15 coverage cases + consistency harness + "
            "evidence schema staged; no Money-Path broadcast; no ACTIVE flip"
        )
        oa["fg_web3_prep"] = cl["fg_web3_prep"]
        dump_yaml(gc_path, gc)

    # Completion definition pointer
    comp_path = ROOT / "registry/psg-production-completion-definition.v1.yaml"
    comp = yaml.safe_load(comp_path.read_text(encoding="utf-8"))
    comp["recorded_utc"] = STAMP
    comp["fg_web3_prep"] = cl["fg_web3_prep"]
    dump_yaml(comp_path, comp)


def write_humans() -> None:
    (ROOT / "docs/runbook/TT-PSG-FG-WEB3-AUDIT-MATRIX-LATEST.md").write_text(
        f"""# TT · PSG FG-Web3 Audit Matrix

**Machine:** `TT_PSG_FG_WEB3_AUDIT_MATRIX`  
**Status:** **STAGED_WAIT_G_RC_CLOSED** · `{STAMP}`  
**机读：** [`registry/psg-fg-web3-audit-matrix.v1.yaml`](../../registry/psg-fg-web3-audit-matrix.v1.yaml)  
**Cases：** [Coverage Cases](./TT-PSG-FG-WEB3-COVERAGE-CASES-LATEST.md) · **Schema：** [Evidence Schema](./TT-PSG-FG-WEB3-EVIDENCE-SCHEMA-LATEST.md)

```text
WAIT_WINDOW · 审计矩阵已 staged · 0/15 PASS · 禁止广播 / ACTIVE
```

| ID | Surface | Full Cap Domain | Status |
|----|---------|-----------------|--------|
"""
        + "\n".join(f"| {a} | {b} | {c} | NOT_READY |" for a, b, c, _, _ in FG)
        + """

**Rollup：** 0/15 · NEED_FIX · ≠ PSG 完成
""",
        encoding="utf-8",
    )

    (ROOT / "docs/runbook/TT-PSG-FG-WEB3-COVERAGE-CASES-LATEST.md").write_text(
        f"""# TT · PSG FG-Web3 Coverage Cases（15）

**Machine:** `TT_PSG_FG_WEB3_COVERAGE_CASES`  
**Status:** **STAGED_WAIT_G_RC_CLOSED** · `{STAMP}`  
**机读：** [`registry/psg-fg-web3-coverage-cases.v1.yaml`](../../registry/psg-fg-web3-coverage-cases.v1.yaml)  
**Threshold：** Financial_Grade_Web3 `pass/15 == 100`  
**Measurement：** FG 当前 **0/15**

| Case | FG | Surface | Status |
|------|-----|---------|--------|
"""
        + "\n".join(
            f"| FGCASE-{a} | {a} | {b} | CASE_STAGED_NOT_EXECUTED |" for a, b, *_ in FG
        )
        + """

**执行窗：** 仅 G-RC CLOSED + Clean Deploy 之后。  
**禁止：** 用 Web2 Journey/Data/UI PASS 冒充任一 FGCASE PASS。
""",
        encoding="utf-8",
    )

    (ROOT / "docs/runbook/TT-PSG-FG-WEB3-EVIDENCE-SCHEMA-LATEST.md").write_text(
        f"""# TT · PSG FG-Web3 Evidence Schema

**Machine:** `TT_PSG_FG_WEB3_EVIDENCE_SCHEMA`  
**Version:** 1.0.0 · `{STAMP}`  
**机读：** [`registry/psg-fg-web3-evidence-schema.v1.yaml`](../../registry/psg-fg-web3-evidence-schema.v1.yaml)

## Roots

| 阶段 | 路径 |
|------|------|
| WAIT_WINDOW pending | `evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/` |
| Post G-RC live | `evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3/` |

## 必填（G-RC CLOSED 后）

- `CLEAN-DEPLOY-BROADCAST-LATEST.json`
- `ADDRESS-MATRIX-V2-LATEST.json`
- `ACTIVE-CUTOVER-STAMP-LATEST.json`
- `FG-WEB3-CASE-RESULTS-LATEST.json`
- `CHAIN-INDEXER-API-DB-UI-CONSISTENCY-LATEST.json`
- `OBSERVATION-48H-START-LATEST.json`

## FG-13 Consistency 等式

`address_matrix_eq_meta` · `event_count_chain_eq_indexer` · `amount_chain_eq_db_eq_api_eq_ui`

本窗仅允许 **PREP_ONLY** 产物（见 pending consistency JSON）。
""",
        encoding="utf-8",
    )


def main() -> int:
    write_audit_matrix()
    write_coverage_cases()
    write_evidence_schema()
    write_humans()
    verify = write_verify_result()
    align_checklist_and_threshold(verify)

    pack = {
        "schema": "traveltrust.fg_web3_clean_deploy_prep_pack.v1",
        "recorded_utc": STAMP,
        "wait_window": True,
        "broadcast_authorized": False,
        "active_flip_authorized": False,
        "verify_verdict": verify["verdict"],
        "open_honest_gaps": [
            "G-RC not CLOSED (CDR-01)",
            "FG-Web3 0/15 PASS",
            "Escrow↔SettlementRouter wiring post-G-RC (CDR-04)",
            "Git dirty/ahead before broadcast (CDR-13)",
            "RBAC 60/96 NEED_FIX",
            "WalletConnect KEY_ABSENT / real-wallet TX OPEN",
            "48H Observation not started",
            "ACTIVE still v311_sepolia_clean_baseline (correct for WAIT_WINDOW)",
        ],
        "prep_landed": [
            "FG audit matrix",
            "FGCASE-01..15 staged",
            "Evidence schema",
            "Chain↔Indexer↔API↔DB↔UI prep harness",
            "CDR-15..18 ready",
            "Clean Deploy pending pack",
        ],
        "verdict": "WAIT_WINDOW_FG_PREP_LANDED_NO_BROADCAST_NO_ACTIVE_FLIP",
    }
    dump_json(
        ROOT
        / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
        / "FG-WEB3-CLEAN-DEPLOY-PREP-PACK-LATEST.json",
        pack,
    )
    dump_json(
        ROOT
        / "evidence/GO_pre_eta_production_prep/coverage-fg-web3-20260719"
        / "FG-WEB3-CLEAN-DEPLOY-PREP-PACK-LATEST.json",
        pack,
    )
    print(pack["verdict"])
    print("verify", verify["verdict"])
    return 0 if verify["verdict"].startswith("PREP_READY") else 1


if __name__ == "__main__":
    raise SystemExit(main())
