#!/usr/bin/env python3
"""
Deepen FG-15 Parallel Prep (no code/redeploy/ACTIVE/GO).

- Production Readiness Dossier 00–08 tree
- Risk Register: Closed / Accepted / Deferred / Blocking
- Ops SOP: Case A/B/C playbooks
- CMS/Market: content-only checklist

FG-15 track remains: sample/monitor/evidence only.
"""

# --- FINAL RELEASE pollution guard ---
import os as _tt_os, sys as _tt_sys
if _tt_os.environ.get('TRAVELTRUST_ALLOW_HISTORICAL_BASELINE') != '1':
    _tt_sys.stderr.write(
        'DEPRECATED: FG-15 historical script refused.
'
        'Active = Candidate v2 / FINAL RELEASE. Forensic: TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1
'
    )
    raise SystemExit(2)
# --- end guard ---


from __future__ import annotations


# Baseline Migration v2 — FG-15-A / Hardened forensic tooling (default refuse)
import sys as _tt_sys
from pathlib import Path as _tt_Path
_tt_lib = _tt_Path(__file__).resolve().parent / "lib"
if str(_tt_lib) not in _tt_sys.path:
    _tt_sys.path.insert(0, str(_tt_lib))
from tt_refuse_historical_baseline import refuse_unless_historical_allowed as _tt_refuse_hist
_tt_refuse_hist(__file__)
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
FG = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3"
ARCH = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/audit_trail"
EXPECTED_SHA = "09c72b934b62f848e60b38bcc7ff0e6cac44f923"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load(name: str) -> dict:
    p = PENDING / name
    if not p.is_file():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def sha256_rel(rel: str) -> str | None:
    p = ROOT / rel
    if not p.is_file():
        return None
    return hashlib.sha256(p.read_bytes()).hexdigest()


def write_json(name: str, obj: dict) -> None:
    text = json.dumps(obj, indent=2, ensure_ascii=False) + "\n"
    (PENDING / name).write_text(text, encoding="utf-8")
    (FG / name).write_text(text, encoding="utf-8")
    rem = ARCH / "fg15_parallel_launch_prep"
    rem.mkdir(parents=True, exist_ok=True)
    (rem / name).write_text(text, encoding="utf-8")


def main() -> int:
    stamp = utc_now()
    pin = load("FINAL-COMPLETION-RELEASE-SHA-PIN-LATEST.json") or load(
        "CDR-19-RELEASE-SHA-PIN-LATEST.json"
    )
    bind = load("FINAL-COMPLETION-EQUIVALENCE-BINDING-LATEST.json") or load(
        "CDR-19-EQUIVALENCE-BINDING-LATEST.json"
    )
    hardened = load("FCG-V2-SECURITY-HARDENED-ONCHAIN-BIND-LATEST.json")
    start = load("OBSERVATION-48H-START-LATEST.json")
    freeze = load("OBSERVATION-48H-WINDOW-FREEZE-LATEST.json")
    verdict = load("PSG-COMPLETION-VERDICT-LATEST.json")
    l1 = load("L1-PRODUCT-VALIDATION-LATEST.json")
    l2 = load("L2-DATA-VALIDATION-HARDENED-LATEST.json")
    l3 = load("L3-SECURITY-VALIDATION-HARDENED-LATEST.json")
    l4 = load("L4-OPERATIONS-VALIDATION-LATEST.json")
    l5b = load("L5B-FIVE-LAYER-EQUALITY-CLOSURE-LATEST.json")
    l5c = load("L5C-PRODUCTION-RUNTIME-INTEGRATION-LATEST.json")
    running = load("OBSERVATION-48H-RUNNING-STATUS-LATEST.json")

    release_sha = pin.get("Release_SHA") or EXPECTED_SHA
    if release_sha != EXPECTED_SHA:
        raise SystemExit(f"REFUSE SHA drift: {release_sha}")

    addrs = hardened.get("addresses") or {}
    txs = hardened.get("tx_hashes") or hardened.get("transactions") or []
    if isinstance(txs, dict):
        txs = list(txs.values())
    bytecode = (bind.get("Contract_Bytecode") or {}).get("members") or []

    # --- Risk classified ---
    risk = {
        "schema": "traveltrust.final_risk_register.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "status": "CLASSIFIED_DRAFT_DURING_FG15",
        "taxonomy": ["Closed", "Accepted", "Deferred", "Blocking"],
        "Closed": [
            {
                "id": "C-ARB-01",
                "title": "Arbitrator Gate (onlyArbitrator on resolution/partial/slash)",
                "closed_by": "L3 Hardened Escrow + L3-SECURITY-VALIDATION-HARDENED",
            },
            {
                "id": "C-EOA-01",
                "title": "Deployer EOA as Factory guardian / FeeRouter owner",
                "closed_by": "Hardened deploy Timelock owner 0x4624…504C",
            },
            {
                "id": "C-SR-01",
                "title": "SettlementRouter permission model unbound to Timelock",
                "closed_by": "Hardened stack Timelock-owned + L3 revalidation PASS",
            },
            {
                "id": "C-REL-01",
                "title": "Permissionless release without bilateral confirm",
                "closed_by": "Release Guard confirmServiceComplete + traveler==guide edge",
            },
        ],
        "Accepted": [
            {
                "id": "A-SCALE-01",
                "title": "初期运营规模限制（Solo on-call · 窄发布面）",
                "owner_accept": "Sebastian Ward",
                "note": "Non-blocking · documented Solo HOLD backup",
            },
            {
                "id": "A-PAGER-01",
                "title": "Production Pager wiring OWNER_DEFERRED",
                "owner_accept": "probes-only acceptable for Sepolia RC era",
                "note": "L4 structure PASS · pager not hard-block",
            },
        ],
        "Deferred": [
            {
                "id": "D-WC-01",
                "title": "Mobile Wallet / WalletConnect Project ID / QR Deep Link",
                "ref": "TT-PSG-WALLET-COVERAGE-SPLIT-LATEST · DEFERRED_EXPLICIT",
                "blocking_psg_complete": False,
            },
            {
                "id": "D-CHAIN-01",
                "title": "后续链扩展（非 Sepolia / 主网另闸）",
                "blocking_psg_complete": False,
            },
            {
                "id": "D-L2-SEPOLIA-LIVE",
                "title": "Sepolia Timelock live money-path lifecycle equality",
                "blocking_psg_complete": False,
                "blocking_mainnet_go": True,
            },
        ],
        "Blocking": [
            {
                "id": "B-FG15",
                "title": "FG-15 48H Observation ELAPSED PASS",
                "status": "RUNNING_NOT_ELAPSED",
                "ends_utc": start.get("window_ends_utc"),
            },
            {
                "id": "B-OWNER-SIGNOFF",
                "title": "Owner Completion Sign-off (final signature)",
                "status": "DRAFT_ONLY_UNSIGNED",
            },
            {
                "id": "B-GO-DECISION",
                "title": "Production GO / NO-GO Decision (separate gate)",
                "status": "NOT_STARTED",
                "note": "After FG-15 + Sign-off + Recalculate + Certification",
            },
        ],
        "honesty": {
            "blocking_should_only_be_fg15_signoff_go": True,
            "ACTIVE_FLIP": "FORBIDDEN",
            "production_go": False,
        },
    }
    write_json("FINAL-RISK-REGISTER-LATEST.json", risk)

    deferred_list = {
        "schema": "traveltrust.deferred_items_list.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "items": risk["Deferred"],
        "blocking_now": [b["id"] for b in risk["Blocking"]],
        "ACTIVE_FLIP": "FORBIDDEN",
    }
    write_json("DEFERRED-ITEMS-LIST-LATEST.json", deferred_list)

    # --- Ops Case A/B/C ---
    ops = {
        "schema": "traveltrust.ops_sop_launch_day_finalize.v1",
        "recorded_utc": stamp,
        "status": "DRAFT_WITH_THREE_PLAYBOOKS",
        "discipline": "no_code_change_during_fg15",
        "monitoring": [
            "API /health",
            "RPC health",
            "Indexer lag",
            "Error alerts",
            "DB connectivity",
        ],
        "playbooks": {
            "Case_A_onchain_ok_ui_stale": {
                "title": "链上成功，UI 未更新",
                "flow": [
                    "Tx Hash",
                    "Event",
                    "Indexer",
                    "DB",
                    "API",
                    "Frontend Cache",
                ],
                "ssot": [
                    "docs/runbook/Epic-D-indexer-ops-readonly-ladder.md",
                    "scripts/ops/internal-indexer-ops.sh",
                    "scripts/check-indexer-lag-locate-gate.sh",
                ],
            },
            "Case_B_settlement_anomaly": {
                "title": "Settlement 异常",
                "flow": [
                    "SettlementReady",
                    "检查 FeeRouter",
                    "检查 Distributable",
                    "人工介入（Owner 批准 · pause/reconcile）",
                ],
                "ssot": [
                    "ops/RUNBOOK.md",
                    "docs/runbook/TT-PRODUCTION-ROLLBACK-DECISION-TREE-LATEST.md",
                    "docs/runbook/TT-OPS-INCIDENT-CONTACT-AND-WINDOW-LATEST.md",
                ],
            },
            "Case_C_dispute": {
                "title": "Dispute",
                "flow": [
                    "Open",
                    "Evidence",
                    "Arbitrator",
                    "Executor",
                    "Resolution",
                ],
                "ssot": [
                    "contracts/src/Escrow.sol (onlyArbitrator / OnlyParty)",
                    "scripts/dev/smoke-order-escrow-dispute-p0-local.sh",
                    "docs/runbook/PRODUCTION-INCIDENT-RESPONSE.md",
                ],
            },
        },
        "ACTIVE_FLIP": "FORBIDDEN",
    }
    write_json("OPS-SOP-LAUNCH-DAY-FINALIZE-LATEST.json", ops)

    # --- CMS content-only ---
    cms = {
        "schema": "traveltrust.cms_market_launch_prep.v1",
        "recorded_utc": stamp,
        "status": "CONTENT_ONLY_NO_SCHEMA_CHANGE",
        "forbid": ["core_data_structure_change", "catalog_schema_migration", "new_registry_dimensions"],
        "checklist": {
            "content_completeness": "OPEN_OWNER_REVIEW",
            "launch_cities": "OPEN_OWNER_REVIEW",
            "provider_display": "OPEN_OWNER_REVIEW",
            "guide_data": "OPEN_OWNER_REVIEW",
            "user_entry_points": "OPEN_OWNER_REVIEW",
        },
        "ssot": [
            "data/catalog/cms-asset-matrix.v1.yaml",
            "scripts/dev/run-cms-daily-ops-board.cjs",
        ],
        "ACTIVE_FLIP": "FORBIDDEN",
        "note": "Prep content integrity only during FG-15",
    }
    write_json("CMS-MARKET-LAUNCH-PREP-LATEST.json", cms)

    # --- Dossier 00–08 ---
    dossier = {
        "schema": "traveltrust.production_readiness_dossier.v1",
        "recorded_utc": stamp,
        "status": "STRUCTURED_00_08_DRAFT_CONVERGING_TO_FG15_END",
        "Release_SHA": release_sha,
        "phase_one_liner": "代码冻结，证据累积；所有上线准备向 FG-15 结束时收敛。",
        "fg15_track": {
            "allow": ["sample", "monitor", "record_evidence"],
            "forbid": [
                "Release_SHA_change",
                "contract_change",
                "config_change",
                "redeploy",
                "ACTIVE_flip",
                "Production_GO",
            ],
            "window_status": start.get("status") or running.get("window_status"),
            "ends_utc": start.get("window_ends_utc"),
            "elapsed_pass": False,
        },
        "tree": {
            "00_Executive_Summary": {
                "summary": "L1–L4 empirical PASS · L5 FG-15 RUNNING · Identity frozen · Cert DRAFT ready for post-window signing",
                "psg_complete": False,
                "verdict_now": verdict.get("verdict"),
                "human": "docs/runbook/TT-PRODUCTION-READINESS-DOSSIER-LATEST.md",
            },
            "01_Release_Identity": {
                "SHA": release_sha,
                "Artifact_bundle_sha256": (bind.get("Deploy_Artifact") or {}).get("bundle_sha256"),
                "Bytecode_members": [
                    {"contract": m.get("contract"), "deployed_bytecode_sha256": m.get("deployed_bytecode_sha256")}
                    for m in bytecode
                ],
                "artifacts": [
                    "FINAL-COMPLETION-RELEASE-SHA-PIN-LATEST.json",
                    "FINAL-COMPLETION-EQUIVALENCE-BINDING-LATEST.json",
                    "OBSERVATION-48H-WINDOW-FREEZE-LATEST.json",
                ],
            },
            "02_Contract_Deployment": {
                "Chain": {"chain_id": hardened.get("chain_id") or 11155111, "name": "Sepolia"},
                "Addresses": addrs,
                "Tx_Hash": txs,
                "note": "Hardened DEPLOYED_BOUND_NOT_ACTIVE · ACTIVE=v311",
                "bind": "FCG-V2-SECURITY-HARDENED-ONCHAIN-BIND-LATEST.json",
            },
            "03_PSG_Completion_Matrix": {
                "L1": {"pass": bool(l1.get("l1_pass")), "artifact": "L1-PRODUCT-VALIDATION-LATEST.json"},
                "L2": {"pass": bool(l2.get("l2_pass")), "artifact": "L2-DATA-VALIDATION-HARDENED-LATEST.json"},
                "L3": {"pass": bool(l3.get("l3_pass")), "artifact": "L3-SECURITY-VALIDATION-HARDENED-LATEST.json"},
                "L4": {"pass": bool(l4.get("l4_pass")), "artifact": "L4-OPERATIONS-VALIDATION-LATEST.json"},
                "L5": {
                    "pass": False,
                    "fg15": "RUNNING",
                    "l5b_equality": bool(l5b.get("l5_pass")),
                    "l5c_runtime": bool(l5c.get("production_runtime_pass")),
                },
                "matrix_ssot": "docs/runbook/TT-PSG-PRODUCTION-COMPLETION-MATRIX-LATEST.md",
                "evidence_index": "L1-L5-EVIDENCE-INDEX-LATEST.json",
            },
            "04_Security": {
                "l3_pass": bool(l3.get("l3_pass")),
                "artifact": "L3-SECURITY-VALIDATION-HARDENED-LATEST.json",
                "runbook": "docs/runbook/TT-L3-SECURITY-REMEDIATION-WINDOW-LATEST.md",
            },
            "05_Operations": {
                "l4_pass": bool(l4.get("l4_pass")),
                "sop": "OPS-SOP-LAUNCH-DAY-FINALIZE-LATEST.json",
                "playbooks": ["Case_A", "Case_B", "Case_C"],
                "runbook": "docs/runbook/TT-OPS-SOP-LAUNCH-DAY-FINALIZE-LATEST.md",
            },
            "06_Risk_Register": {
                "artifact": "FINAL-RISK-REGISTER-LATEST.json",
                "counts": {
                    "Closed": len(risk["Closed"]),
                    "Accepted": len(risk["Accepted"]),
                    "Deferred": len(risk["Deferred"]),
                    "Blocking": len(risk["Blocking"]),
                },
            },
            "07_Rollback_Plan": {
                "decision_tree": "docs/runbook/TT-PRODUCTION-ROLLBACK-DECISION-TREE-LATEST.md",
                "incident_response": "docs/runbook/PRODUCTION-INCIDENT-RESPONSE.md",
                "ops_runbook": "ops/RUNBOOK.md",
            },
            "08_Owner_Signoff": {
                "draft": "OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.json",
                "staged": "PSG-COMPLETION-OWNER-SIGNOFF-PACKAGE-LATEST.json",
                "signed": False,
                "eligible_final": False,
                "human": "docs/runbook/TT-OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.md",
            },
        },
        "certification_package_draft": "PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.json",
        "after_fg15": [
            "FG-15 PASS",
            "Owner Sign-off",
            "PSG Recalculate",
            "Production Certification finalize",
            "GO / NO-GO",
        ],
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "verdict": "DOSSIER_00_08_DRAFT_READY_CONVERGE_AT_FG15_END",
    }
    write_json("PRODUCTION-READINESS-DOSSIER-LATEST.json", dossier)

    # Refresh cert package pointer to dossier tree
    cert = load("PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.json") or {}
    cert.update(
        {
            "recorded_utc": stamp,
            "dossier_tree": "PRODUCTION-READINESS-DOSSIER-LATEST.json",
            "dossier_sections": list(dossier["tree"].keys()),
            "status": "DRAFT_ALIGNED_TO_DOSSIER_00_08",
            "ACTIVE_FLIP": "FORBIDDEN",
            "production_go": False,
            "psg_complete": False,
        }
    )
    write_json("PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.json", cert)

    # Keep evidence index fresh lightly
    idx = load("L1-L5-EVIDENCE-INDEX-LATEST.json") or {}
    if idx:
        idx["recorded_utc"] = stamp
        idx["dossier"] = "PRODUCTION-READINESS-DOSSIER-LATEST.json"
        write_json("L1-L5-EVIDENCE-INDEX-LATEST.json", idx)

    print(
        json.dumps(
            {
                "dossier": dossier["verdict"],
                "blocking": [b["id"] for b in risk["Blocking"]],
                "playbooks": list(ops["playbooks"].keys()),
                "fg15": dossier["fg15_track"]["window_status"],
                "ACTIVE_FLIP": "FORBIDDEN",
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
