#!/usr/bin/env python3
"""
FG-15 parallel launch prep (48H window).

Builds DRAFT Production Certification Package, Evidence Index, Risk Register,
Deferred List, Owner Sign-off draft, Ops/CMS prep indexes — without claiming
FG-15 PASS, PSG Complete, ACTIVE flip, or Production GO.

Code version remains frozen (Release_SHA=09c72b93…).
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
import shutil
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


def sha256_file(rel: str) -> str | None:
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
    freeze = load("OBSERVATION-48H-WINDOW-FREEZE-LATEST.json")
    start = load("OBSERVATION-48H-START-LATEST.json")
    verdict = load("PSG-COMPLETION-VERDICT-LATEST.json")
    l1 = load("L1-PRODUCT-VALIDATION-LATEST.json")
    l2 = load("L2-DATA-VALIDATION-HARDENED-LATEST.json")
    l3 = load("L3-SECURITY-VALIDATION-HARDENED-LATEST.json")
    l4 = load("L4-OPERATIONS-VALIDATION-LATEST.json")
    l5b = load("L5B-FIVE-LAYER-EQUALITY-CLOSURE-LATEST.json")
    l5c = load("L5C-PRODUCTION-RUNTIME-INTEGRATION-LATEST.json")
    emp = load("L5-FG-WEB3-EMPIRICAL-LATEST.json")

    release_sha = pin.get("Release_SHA") or EXPECTED_SHA
    if release_sha != EXPECTED_SHA:
        raise SystemExit(f"REFUSE: Release_SHA drift {release_sha}")

    addrs = hardened.get("addresses") or {}
    txs = hardened.get("tx_hashes") or hardened.get("transactions") or []
    if isinstance(txs, dict):
        txs = list(txs.values())
    bytecode = (bind.get("Contract_Bytecode") or {}).get("members") or []

    # --- Evidence Index ---
    evidence_index = {
        "schema": "traveltrust.l1_l5_evidence_index.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "status": "DRAFT_FOR_CERTIFICATION_PACKAGE",
        "ACTIVE_FLIP": "FORBIDDEN",
        "layers": {
            "L1_Product": {
                "pass": bool(l1.get("l1_pass")),
                "artifact": "L1-PRODUCT-VALIDATION-LATEST.json",
                "runbook": "docs/runbook/TT-L1-PRODUCT-VALIDATION-LATEST.md",
                "sha256": sha256_file(
                    "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/L1-PRODUCT-VALIDATION-LATEST.json"
                ),
            },
            "L2_Data": {
                "pass": bool(l2.get("l2_pass")),
                "artifact": "L2-DATA-VALIDATION-HARDENED-LATEST.json",
                "runbook": "docs/runbook/TT-L2-DATA-VALIDATION-HARDENED-LATEST.md",
                "deferred": "l2_sepolia_live_lifecycle_pass=false",
                "sha256": sha256_file(
                    "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/L2-DATA-VALIDATION-HARDENED-LATEST.json"
                ),
            },
            "L3_Security": {
                "pass": bool(l3.get("l3_pass")),
                "artifact": "L3-SECURITY-VALIDATION-HARDENED-LATEST.json",
                "runbook": "docs/runbook/TT-L3-SECURITY-REMEDIATION-WINDOW-LATEST.md",
                "sha256": sha256_file(
                    "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/L3-SECURITY-VALIDATION-HARDENED-LATEST.json"
                ),
            },
            "L4_Operations": {
                "pass": bool(l4.get("l4_pass")),
                "artifact": "L4-OPERATIONS-VALIDATION-LATEST.json",
                "runbook": "docs/runbook/TT-L4-OPERATIONS-VALIDATION-LATEST.md",
                "sha256": sha256_file(
                    "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/L4-OPERATIONS-VALIDATION-LATEST.json"
                ),
            },
            "L5_FG_Web3": {
                "pass": False,
                "note": "Equality/runtime slices closed; FG-15 Observation RUNNING — not ELAPSED",
                "artifacts": {
                    "l5b": "L5B-FIVE-LAYER-EQUALITY-CLOSURE-LATEST.json",
                    "l5c": "L5C-PRODUCTION-RUNTIME-INTEGRATION-LATEST.json",
                    "empirical": "L5-FG-WEB3-EMPIRICAL-LATEST.json",
                    "observation_freeze": "OBSERVATION-48H-WINDOW-FREEZE-LATEST.json",
                    "observation_running": "OBSERVATION-48H-RUNNING-STATUS-LATEST.json",
                },
                "l5b_pass": bool(l5b.get("l5_pass")),
                "l5c_production_runtime_pass": bool(l5c.get("production_runtime_pass")),
                "empirical_pass": bool(emp.get("l5_pass")),
            },
        },
        "completion_matrix": {
            "ssot": "docs/runbook/TT-PSG-PRODUCTION-COMPLETION-MATRIX-LATEST.md",
            "recalculate": "docs/runbook/TT-PSG-COMPLETION-MATRIX-RECALCULATE-LATEST.md",
            "verdict_now": verdict.get("verdict"),
            "psg_complete": False,
        },
    }
    write_json("L1-L5-EVIDENCE-INDEX-LATEST.json", evidence_index)

    # --- Deferred ---
    deferred = {
        "schema": "traveltrust.deferred_items_list.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "status": "OPEN_REGISTERED",
        "items": [
            {
                "id": "FG-15-ELAPSED",
                "summary": "48H Observation not elapsed",
                "ends_utc": start.get("window_ends_utc"),
                "blocking_psg_complete": True,
            },
            {
                "id": "L5-EMPIRICAL-PARTIAL",
                "summary": "L5 empirical artifact still PARTIAL vs FG-15 requirement",
                "blocking_psg_complete": True,
            },
            {
                "id": "L2-SEPOLIA-LIVE-LIFECYCLE",
                "summary": "Sepolia Timelock live money-path lifecycle OPEN",
                "blocking_psg_complete": False,
                "blocking_mainnet_go": True,
            },
            {
                "id": "ACTIVE-FLIP",
                "summary": "Hardened bound not ACTIVE; ACTIVE stays v311",
                "blocking_production_go": True,
            },
            {
                "id": "PAGER-OWNER-DEFERRED",
                "summary": "Production pager wiring OWNER_DEFERRED (non-blocking for L4 structure)",
                "blocking_psg_complete": False,
            },
            {
                "id": "OWNER-SIGNOFF-UNSIGNED",
                "summary": "Owner Completion Sign-off package staged only",
                "blocking_psg_complete": True,
            },
        ],
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
    }
    write_json("DEFERRED-ITEMS-LIST-LATEST.json", deferred)

    # --- Risk Register ---
    risk = {
        "schema": "traveltrust.final_risk_register.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "status": "DRAFT_DURING_FG15_WINDOW",
        "risks": [
            {
                "id": "R-OBS-01",
                "title": "FG-15 window discovers plane instability",
                "severity": "high",
                "likelihood": "medium",
                "mitigation": "Continue samples; anomaly ledger; refuse ELAPSED if fail samples",
                "owner": "Sebastian Ward",
            },
            {
                "id": "R-IDX-01",
                "title": "Payment ok / UI stale (projection lag)",
                "severity": "high",
                "likelihood": "medium",
                "mitigation": "SOP: Tx→Event→Indexer→Projection→UI; Epic D reconcile",
                "owner": "Sebastian Ward",
            },
            {
                "id": "R-RPC-01",
                "title": "RPC unstable during observation",
                "severity": "high",
                "likelihood": "medium",
                "mitigation": "ops/RUNBOOK RPC switch; readonly degrade",
                "owner": "Sebastian Ward",
            },
            {
                "id": "R-REL-01",
                "title": "Release / Settlement anomaly on Hardened path",
                "severity": "critical",
                "likelihood": "low",
                "mitigation": "Pause entry CTA/API; Owner approve; Rollback Decision Tree STOP",
                "owner": "Sebastian Ward",
            },
            {
                "id": "R-KEY-01",
                "title": "Key / Timelock operator loss (Solo)",
                "severity": "critical",
                "likelihood": "low",
                "mitigation": "HOLD backup; Timelock delay; documented recovery in IR",
                "owner": "Sebastian Ward",
            },
            {
                "id": "R-ACT-01",
                "title": "Premature ACTIVE flip / GO during window",
                "severity": "critical",
                "likelihood": "low",
                "mitigation": "Hard forbid in all runners; freeze policy",
                "owner": "Sebastian Ward",
            },
        ],
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
    }
    write_json("FINAL-RISK-REGISTER-LATEST.json", risk)

    # --- Owner Sign-off DRAFT (not final) ---
    owner_draft = {
        "schema": "traveltrust.owner_signoff_package_draft.v1",
        "recorded_utc": stamp,
        "status": "DRAFT_PREPARE_ONLY_DO_NOT_SIGN_FINAL_PASS",
        "signed": False,
        "eligible_for_final_signature": False,
        "Release_SHA": release_sha,
        "confirmations_prepared": {
            "capabilities_completed_l1_l4": True,
            "known_risks_listed": True,
            "deferred_items_listed": True,
            "release_scope_controlled_minimum_plus_hardened_bound": True,
            "incident_responsibility_solo_owner_oncall": True,
        },
        "must_wait": [
            "FG-15 ELAPSED PASS",
            "Recalculate after ELAPSED",
            "Owner human signature on final package",
        ],
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "verdict": "OWNER_SIGNOFF_DRAFT_READY_AWAIT_FG15",
    }
    write_json("OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.json", owner_draft)

    # --- Certification Package DRAFT ---
    cert = {
        "schema": "traveltrust.production_certification_package.v1",
        "recorded_utc": stamp,
        "status": "DRAFT_AWAIT_FG15_ELAPSED_AND_OWNER_SIGNOFF",
        "Release_SHA": release_sha,
        "Release_SHA_short": release_sha[:12],
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "psg_complete": False,
        "sections": {
            "psg_completion_matrix": {
                "human": "docs/runbook/TT-PSG-PRODUCTION-COMPLETION-MATRIX-LATEST.md",
                "recalculate": "docs/runbook/TT-PSG-COMPLETION-MATRIX-RECALCULATE-LATEST.md",
                "verdict_artifact": "PSG-COMPLETION-VERDICT-LATEST.json",
                "current_verdict": verdict.get("verdict"),
            },
            "l1_l5_evidence_index": "L1-L5-EVIDENCE-INDEX-LATEST.json",
            "contract_address_inventory": {
                "chain_id": hardened.get("chain_id") or 11155111,
                "baseline_note": "Hardened DEPLOYED_BOUND_NOT_ACTIVE; ACTIVE=v311_sepolia_clean_baseline",
                "addresses": addrs,
                "bind_artifact": "FCG-V2-SECURITY-HARDENED-ONCHAIN-BIND-LATEST.json",
            },
            "release_sha_proof": {
                "pin_artifact": "FINAL-COMPLETION-RELEASE-SHA-PIN-LATEST.json",
                "Release_SHA": release_sha,
                "freeze_artifact": "OBSERVATION-48H-WINDOW-FREEZE-LATEST.json",
            },
            "bytecode_hashes": {
                "members": [
                    {
                        "contract": m.get("contract"),
                        "bytecode_sha256": m.get("bytecode_sha256"),
                        "deployed_bytecode_sha256": m.get("deployed_bytecode_sha256"),
                    }
                    for m in bytecode
                ],
                "binding": "FINAL-COMPLETION-EQUIVALENCE-BINDING-LATEST.json",
            },
            "deployment_tx": {
                "tx_hashes": txs,
                "source": "FCG-V2-SECURITY-HARDENED-ONCHAIN-BIND-LATEST.json",
            },
            "security_audit_result": {
                "l3_pass": bool(l3.get("l3_pass")),
                "artifact": "L3-SECURITY-VALIDATION-HARDENED-LATEST.json",
                "runbook": "docs/runbook/TT-L3-SECURITY-REMEDIATION-WINDOW-LATEST.md",
            },
            "risk_register": "FINAL-RISK-REGISTER-LATEST.json",
            "deferred_items_list": "DEFERRED-ITEMS-LIST-LATEST.json",
            "rollback_plan": {
                "decision_tree": "docs/runbook/TT-PRODUCTION-ROLLBACK-DECISION-TREE-LATEST.md",
                "incident_response": "docs/runbook/PRODUCTION-INCIDENT-RESPONSE.md",
                "ops_runbook": "ops/RUNBOOK.md",
            },
            "observation_48h": {
                "status": start.get("status") or freeze.get("window_status"),
                "started_utc": start.get("window_started_utc"),
                "ends_utc": start.get("window_ends_utc"),
                "elapsed_pass": False,
            },
        },
        "post_fg15_sequence": [
            "FG-15 PASS",
            "Owner Sign-off",
            "PSG Recalculate",
            "Production Certification finalize",
            "GO / NO-GO (separate gate)",
        ],
        "verdict": "CERT_PACKAGE_DRAFT_READY_FOR_POST_FG15_SIGNING",
    }
    write_json("PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.json", cert)

    # --- Ops SOP index ---
    ops_sop = {
        "schema": "traveltrust.ops_sop_launch_day_finalize.v1",
        "recorded_utc": stamp,
        "status": "DRAFT_FINALIZE_DURING_FG15",
        "monitoring": [
            "API /health uptime",
            "RPC health / eth_blockNumber",
            "Indexer lag gate + reconcile probe",
            "Error / 5xx rate alerts (pager OWNER_DEFERRED)",
            "DB connectivity",
        ],
        "emergency": [
            "Contract pause / entry gate STOP",
            "Key / Timelock recovery (Solo HOLD)",
            "Data restore (B-475 PITR baseline)",
            "Rollback Decision Tree OBSERVE/PAUSE/STOP",
        ],
        "user_complaint_payment_ok_ui_stale": {
            "steps": ["查 Tx", "查 Event", "查 Indexer", "修复 Projection", "恢复 UI"],
            "ssot": [
                "docs/runbook/Epic-D-indexer-ops-readonly-ladder.md",
                "scripts/ops/internal-indexer-ops.sh",
            ],
        },
        "ssot_docs": [
            "ops/RUNBOOK.md",
            "docs/runbook/PRODUCTION-OPS-RUNBOOK.md",
            "docs/runbook/TT-OPS-INCIDENT-CONTACT-AND-WINDOW-LATEST.md",
            "docs/runbook/TT-L4-OPERATIONS-VALIDATION-LATEST.md",
        ],
        "ACTIVE_FLIP": "FORBIDDEN",
    }
    write_json("OPS-SOP-LAUNCH-DAY-FINALIZE-LATEST.json", ops_sop)

    # --- CMS / Market ---
    cms = {
        "schema": "traveltrust.cms_market_launch_prep.v1",
        "recorded_utc": stamp,
        "status": "PREP_CHECKLIST_DURING_FG15",
        "cms": [
            "Homepage ambient / hero catalog live check",
            "Country / region content QA status (JP Content QA track)",
            "Provider listing data readiness",
            "Guide market data readiness",
        ],
        "user_flows": [
            "Registration / Identity copy",
            "Wallet connect instructions",
            "Payment / Escrow explanation",
            "Risk disclosures",
        ],
        "support": [
            "Dispute entry path",
            "Refund process pointer",
            "Contact / on-call channel (Solo Owner)",
        ],
        "ssot": [
            "data/catalog/cms-asset-matrix.v1.yaml",
            "scripts/dev/run-cms-daily-ops-board.cjs",
            "docs/runbook/TT-OPS-INCIDENT-CONTACT-AND-WINDOW-LATEST.md",
        ],
        "ACTIVE_FLIP": "FORBIDDEN",
        "note": "Content/ops prep only — no production deploy from this pack",
    }
    write_json("CMS-MARKET-LAUNCH-PREP-LATEST.json", cms)

    # --- Dossier rollup ---
    dossier = {
        "schema": "traveltrust.production_readiness_dossier.v1",
        "recorded_utc": stamp,
        "status": "ASSEMBLING_DURING_FG15_WINDOW",
        "Release_SHA": release_sha,
        "reports": {
            "L1": "docs/runbook/TT-L1-PRODUCT-VALIDATION-LATEST.md",
            "L2": "docs/runbook/TT-L2-DATA-VALIDATION-HARDENED-LATEST.md",
            "L3": "docs/runbook/TT-L3-SECURITY-REMEDIATION-WINDOW-LATEST.md",
            "L4": "docs/runbook/TT-L4-OPERATIONS-VALIDATION-LATEST.md",
            "L5": "docs/runbook/TT-FG15-OBSERVATION-WINDOW-RUNNING-LATEST.md",
        },
        "packages": {
            "certification_draft": "PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.json",
            "evidence_index": "L1-L5-EVIDENCE-INDEX-LATEST.json",
            "owner_signoff_draft": "OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.json",
            "risk_register": "FINAL-RISK-REGISTER-LATEST.json",
            "deferred": "DEFERRED-ITEMS-LIST-LATEST.json",
            "ops_sop": "OPS-SOP-LAUNCH-DAY-FINALIZE-LATEST.json",
            "cms_market": "CMS-MARKET-LAUNCH-PREP-LATEST.json",
        },
        "observation": {
            "status": "RUNNING",
            "ends_utc": start.get("window_ends_utc"),
            "elapsed_pass": False,
        },
        "forbidden_now": [
            "ACTIVE_flip",
            "Production_GO",
            "FG15_ELAPSED_PASS_claim",
            "Owner_final_PASS_signature",
        ],
        "after_fg15": [
            "FG-15 PASS",
            "Owner Sign-off",
            "PSG Recalculate",
            "Production Certification",
            "GO / NO-GO",
        ],
        "verdict": "DOSSIER_DRAFT_READY_PARALLEL_TO_FG15",
    }
    write_json("PRODUCTION-READINESS-DOSSIER-LATEST.json", dossier)

    print(
        json.dumps(
            {
                "Release_SHA": release_sha[:12],
                "cert_status": cert["status"],
                "dossier": dossier["verdict"],
                "fg15": start.get("status"),
                "ACTIVE_FLIP": "FORBIDDEN",
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
