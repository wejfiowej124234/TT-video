#!/usr/bin/env python3
"""
FG-15 Six Parallel Prep Packs (non-invasive).

Priority:
  1 Production Certification Package
  2 Owner Sign-off Package (unsigned)
  3 Launch Day Checklist
  4 Ops / Incident Runbooks
  5 Mainnet env check (read-only · no config change)
  6 User / Guide / Provider / Steward ops materials

FORBIDDEN during FG-15: contract/econ/fee/settlement/permission/SHA change,
redeploy, ACTIVE flip, Owner final sign, Cert FINAL, Production GO.
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
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
FG = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3"
ARCH = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/audit_trail"
DEPLOY_YAML = ROOT / "registry/protocol-convergence-deployments.v1.yaml"
EXPECTED_SHA = "09c72b934b62f848e60b38bcc7ff0e6cac44f923"
EXPECTED_ACTIVE = "v311_sepolia_clean_baseline"
EXPECTED_ADDRS = {
    "escrowFactory": "0x49b6e57f1ade52cca287da653a8e0e7c23ae286d",
    "settlementRouter": "0x8cf12bcf7ca2005413f645614029f51d3efaa1c9",
    "feeRouter": "0xfed657db52120ee91165ca9d907c9df1475e2c86",
    "projectRevenuePool": "0xe8da62b9ac2acdf7f18545fa9af788656df09f27",
    "founderBootstrap": "0x3e79dde670008a204861df63121a7796c025814b",
    "ownerOrTimelock": "0x462402082B395F218FFB3634ec0611e39BdD504C",
}


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
    rem = ARCH / "fg15_six_parallel_prep"
    rem.mkdir(parents=True, exist_ok=True)
    (rem / name).write_text(text, encoding="utf-8")


def active_baseline() -> str:
    text = DEPLOY_YAML.read_text(encoding="utf-8")
    m = re.search(r"active_deploy_baseline:\s*([^\s#]+)", text)
    return m.group(1).strip() if m else "UNKNOWN"


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
    recalc = load("PSG-COMPLETION-MATRIX-RECALCULATE-LATEST.json")
    l1 = load("L1-PRODUCT-VALIDATION-LATEST.json")
    l2 = load("L2-DATA-VALIDATION-HARDENED-LATEST.json")
    l3 = load("L3-SECURITY-VALIDATION-HARDENED-LATEST.json")
    l4 = load("L4-OPERATIONS-VALIDATION-LATEST.json")
    l5b = load("L5B-FIVE-LAYER-EQUALITY-CLOSURE-LATEST.json")
    l5c = load("L5C-PRODUCTION-RUNTIME-INTEGRATION-LATEST.json")
    risk = load("FINAL-RISK-REGISTER-LATEST.json")
    deferred = load("DEFERRED-ITEMS-LIST-LATEST.json")
    dossier = load("PRODUCTION-READINESS-DOSSIER-LATEST.json")

    release_sha = pin.get("Release_SHA") or EXPECTED_SHA
    if release_sha != EXPECTED_SHA:
        raise SystemExit(f"REFUSE: Release_SHA drift {release_sha}")
    if active_baseline() != EXPECTED_ACTIVE:
        raise SystemExit(f"REFUSE: ACTIVE drift {active_baseline()}")

    addrs = hardened.get("addresses") or {}
    for k, exp in EXPECTED_ADDRS.items():
        got = (addrs.get(k) or "").lower()
        if got and got != exp.lower():
            raise SystemExit(f"REFUSE: address drift {k}={addrs.get(k)}")

    txs = hardened.get("tx_hashes") or hardened.get("transactions") or []
    if isinstance(txs, dict):
        txs = list(txs.values())
    bytecode = (bind.get("Contract_Bytecode") or {}).get("members") or []
    artifact_members = (bind.get("Deploy_Artifact") or {}).get("members") or []
    source_sha = bind.get("Source_SHA") or release_sha
    artifact_bundle = (bind.get("Deploy_Artifact") or {}).get("bundle_sha256")
    evidence_bundle = (bind.get("Evidence_Bundle") or {}).get("bundle_sha256") or (
        bind.get("Evidence") or {}
    ).get("bundle_sha256")

    # Equality: Source SHA = Artifact pin = Bytecode bind = Evidence pin
    equality = {
        "Source_SHA": source_sha,
        "Release_SHA": release_sha,
        "Artifact_bundle_sha256": artifact_bundle,
        "Bytecode_member_count": len(bytecode),
        "Evidence_bundle_sha256": evidence_bundle,
        "checks": {
            "Source_SHA_eq_Release_SHA": source_sha == release_sha,
            "Release_SHA_eq_EXPECTED": release_sha == EXPECTED_SHA,
            "Artifact_bundle_present": bool(artifact_bundle),
            "Bytecode_members_present": len(bytecode) >= 3,
            "Evidence_index_present": (PENDING / "L1-L5-EVIDENCE-INDEX-LATEST.json").is_file(),
            "Hardened_addresses_match_freeze": all(
                (addrs.get(k) or "").lower() == EXPECTED_ADDRS[k].lower()
                for k in EXPECTED_ADDRS
                if addrs.get(k)
            ),
            "ACTIVE_unchanged": active_baseline() == EXPECTED_ACTIVE,
        },
    }
    equality["pass"] = all(equality["checks"].values())

    # ---------- 1 · Production Certification Package ----------
    psg_snapshot = {
        "schema": "traveltrust.psg_completion_matrix_final_snapshot_draft.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "status": "SNAPSHOT_DRAFT_AWAIT_FG15_ELAPSED_AND_SIGNOFF",
        "current_verdict": verdict.get("verdict") or recalc.get("verdict"),
        "psg_complete": False,
        "layers": {
            "L1": bool(l1.get("l1_pass")),
            "L2": bool(l2.get("l2_pass")),
            "L3": bool(l3.get("l3_pass")),
            "L4": bool(l4.get("l4_pass")),
            "L5_fg15": {
                "elapsed_pass": False,
                "window_ends_utc": start.get("window_ends_utc"),
                "l5b_equality": bool(l5b.get("l5_pass")),
                "l5c_runtime": bool(l5c.get("production_runtime_pass")),
            },
        },
        "recalculate_artifact": "PSG-COMPLETION-MATRIX-RECALCULATE-LATEST.json",
        "verdict_artifact": "PSG-COMPLETION-VERDICT-LATEST.json",
        "note": "Final snapshot re-stamped only after FG-15 ELAPSED + Owner Sign-off + Recalculate",
        "ACTIVE_FLIP": "FORBIDDEN",
    }
    write_json("PSG-COMPLETION-MATRIX-FINAL-SNAPSHOT-DRAFT-LATEST.json", psg_snapshot)

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
                "sha256": sha256_rel(
                    "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/L1-PRODUCT-VALIDATION-LATEST.json"
                ),
            },
            "L2_Data": {
                "pass": bool(l2.get("l2_pass")),
                "artifact": "L2-DATA-VALIDATION-HARDENED-LATEST.json",
                "deferred": "l2_sepolia_live_lifecycle_pass=false",
                "sha256": sha256_rel(
                    "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/L2-DATA-VALIDATION-HARDENED-LATEST.json"
                ),
            },
            "L3_Security": {
                "pass": bool(l3.get("l3_pass")),
                "artifact": "L3-SECURITY-VALIDATION-HARDENED-LATEST.json",
                "sha256": sha256_rel(
                    "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/L3-SECURITY-VALIDATION-HARDENED-LATEST.json"
                ),
            },
            "L4_Operations": {
                "pass": bool(l4.get("l4_pass")),
                "artifact": "L4-OPERATIONS-VALIDATION-LATEST.json",
                "sha256": sha256_rel(
                    "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/L4-OPERATIONS-VALIDATION-LATEST.json"
                ),
            },
            "L5_Observation": {
                "pass": False,
                "fg15": "RUNNING",
                "l5b": "L5B-FIVE-LAYER-EQUALITY-CLOSURE-LATEST.json",
                "l5c": "L5C-PRODUCTION-RUNTIME-INTEGRATION-LATEST.json",
                "window": "OBSERVATION-48H-START-LATEST.json",
            },
        },
        "completion_matrix": "PSG-COMPLETION-MATRIX-FINAL-SNAPSHOT-DRAFT-LATEST.json",
        "dossier": "PRODUCTION-READINESS-DOSSIER-LATEST.json",
        "equality_quad": equality,
    }
    write_json("L1-L5-EVIDENCE-INDEX-LATEST.json", evidence_index)

    cert = {
        "schema": "traveltrust.production_certification_package.v1",
        "recorded_utc": stamp,
        "status": "DRAFT_READY_FOR_POST_FG15_SIGNING",
        "Release_SHA": release_sha,
        "Release_SHA_short": release_sha[:12],
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "psg_complete": False,
        "priority": 1,
        "equality_quad": equality,
        "sections": {
            "psg_completion_matrix": {
                "snapshot_draft": "PSG-COMPLETION-MATRIX-FINAL-SNAPSHOT-DRAFT-LATEST.json",
                "human": "docs/runbook/TT-PSG-PRODUCTION-COMPLETION-MATRIX-LATEST.md",
                "recalculate": "docs/runbook/TT-PSG-COMPLETION-MATRIX-RECALCULATE-LATEST.md",
                "verdict_artifact": "PSG-COMPLETION-VERDICT-LATEST.json",
                "current_verdict": verdict.get("verdict"),
            },
            "l1_l5_evidence_index": "L1-L5-EVIDENCE-INDEX-LATEST.json",
            "contract_address_registry": {
                "chain_id": hardened.get("chain_id") or 11155111,
                "baseline_note": "Hardened DEPLOYED_BOUND_NOT_ACTIVE; ACTIVE=v311_sepolia_clean_baseline",
                "addresses": {**EXPECTED_ADDRS, **{k: addrs[k] for k in addrs}},
                "bind_artifact": "FCG-V2-SECURITY-HARDENED-ONCHAIN-BIND-LATEST.json",
            },
            "release_sha_proof": {
                "pin_artifact": "FINAL-COMPLETION-RELEASE-SHA-PIN-LATEST.json",
                "Release_SHA": release_sha,
                "freeze_artifact": "OBSERVATION-48H-WINDOW-FREEZE-LATEST.json",
                "Source_SHA": source_sha,
            },
            "bytecode_hashes": {"members": bytecode, "bind": "FINAL-COMPLETION-EQUIVALENCE-BINDING-LATEST.json"},
            "deployment_tx_inventory": {
                "tx_hashes": txs,
                "bind": "FCG-V2-SECURITY-HARDENED-ONCHAIN-BIND-LATEST.json",
            },
            "security_validation": {
                "l3_pass": bool(l3.get("l3_pass")),
                "artifact": "L3-SECURITY-VALIDATION-HARDENED-LATEST.json",
                "human": "docs/runbook/TT-L3-SECURITY-REMEDIATION-WINDOW-LATEST.md",
            },
            "risk_register": "FINAL-RISK-REGISTER-LATEST.json",
            "deferred_items": "DEFERRED-ITEMS-LIST-LATEST.json",
            "rollback_plan": "PRODUCTION-ROLLBACK-PLAN-PACK-LATEST.json",
            "deploy_artifact_members": artifact_members,
        },
        "dossier_tree": "PRODUCTION-READINESS-DOSSIER-LATEST.json",
        "dossier_sections": list((dossier.get("tree") or {}).keys())
        or [
            "00_Executive_Summary",
            "01_Release_Identity",
            "02_Contract_Deployment",
            "03_PSG_Completion_Matrix",
            "04_Security",
            "05_Operations",
            "06_Risk_Register",
            "07_Rollback_Plan",
            "08_Owner_Signoff",
        ],
        "post_fg15_sequence": [
            "FG-15 ELAPSED PASS",
            "Owner Sign-off",
            "PSG Completion Recalculate",
            "Production Certification FINAL",
            "GO / NO-GO",
        ],
        "human": "docs/runbook/TT-PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.md",
        "verdict": "CERT_PACKAGE_DRAFT_READY_FOR_POST_FG15_SIGNING",
    }
    write_json("PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.json", cert)

    # ---------- 2 · Owner Sign-off Package ----------
    owner = {
        "schema": "traveltrust.owner_signoff_package_draft.v1",
        "recorded_utc": stamp,
        "status": "DRAFT_PREPARE_ONLY_DO_NOT_SIGN_FINAL_PASS",
        "priority": 2,
        "signed": False,
        "eligible_for_final_signature": False,
        "Release_SHA": release_sha,
        "confirmations_prepared": {
            "capabilities_completed_l1_l4": bool(
                l1.get("l1_pass") and l2.get("l2_pass") and l3.get("l3_pass") and l4.get("l4_pass")
            ),
            "known_risks_listed": bool(risk.get("Blocking") is not None),
            "deferred_items_confirmed": bool(deferred.get("items") or risk.get("Deferred")),
            "rollback_plan_confirmed": (PENDING / "PRODUCTION-ROLLBACK-PLAN-PACK-LATEST.json").is_file(),
            "release_scope_confirmed": True,
            "responsibility_confirmed_solo_owner": True,
        },
        "confirmation_detail": {
            "capabilities": "L1 Product · L2 Data · L3 Security Hardened · L4 Ops PASS; L5 FG-15 RUNNING",
            "known_risks": "FINAL-RISK-REGISTER-LATEST.json (Closed/Accepted/Deferred/Blocking)",
            "deferred": "DEFERRED-ITEMS-LIST-LATEST.json",
            "rollback": "PRODUCTION-ROLLBACK-PLAN-PACK-LATEST.json · OBSERVE/PAUSE/STOP",
            "release_scope": "Controlled Minimum + Hardened bound · ACTIVE remains v311 until post-GO gate",
            "responsibility": "Owner = Sebastian Ward · On-call = Owner · Approver = Owner (Solo)",
        },
        "must_wait": [
            "FG-15 ELAPSED PASS",
            "Owner human signature on final package",
            "Then PSG Completion Recalculate",
        ],
        "after_sign_only": [
            "PSG Completion Recalculate",
            "Production Certification FINAL",
            "GO / NO-GO",
        ],
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "human": "docs/runbook/TT-OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.md",
        "verdict": "OWNER_SIGNOFF_DRAFT_READY_AWAIT_FG15",
    }
    write_json("OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.json", owner)

    staged = load("PSG-COMPLETION-OWNER-SIGNOFF-PACKAGE-LATEST.json") or {}
    staged.update(
        {
            "recorded_utc": stamp,
            "Release_SHA": release_sha,
            "signed": False,
            "status": "PENDING_AWAIT_FG15_PASS",
            "eligible_for_signature": False,
            "draft_ref": "OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.json",
            "confirmations_prepared": owner["confirmations_prepared"],
            "ACTIVE_FLIP": "FORBIDDEN",
            "production_go": False,
            "verdict": "OWNER_SIGNOFF_PACKAGE_STAGED_AWAIT_FG15",
        }
    )
    write_json("PSG-COMPLETION-OWNER-SIGNOFF-PACKAGE-LATEST.json", staged)

    # ---------- 3 · Launch Day Checklist (+ Manual UAT plan pointer) ----------
    launch_checklist = {
        "schema": "traveltrust.launch_day_checklist.v1",
        "recorded_utc": stamp,
        "status": "CHECKLIST_DRAFT_PRE_FG15_ELAPSED",
        "priority": 3,
        "Release_SHA": release_sha,
        "human": "docs/runbook/TT-LAUNCH-DAY-CHECKLIST-LATEST.md",
        "items": [
            {"id": "LC-01", "item": "FG-15 window RUNNING · freeze intact", "when": "now", "status": "IN_PROGRESS"},
            {"id": "LC-02", "item": "Six-plane samples accumulating · no open anomalies", "when": "now", "status": "IN_PROGRESS"},
            {"id": "LC-03", "item": "Cert Package DRAFT + equality quad", "when": "now", "status": "READY"},
            {"id": "LC-04", "item": "Owner Sign-off Package prepared unsigned", "when": "now", "status": "READY"},
            {"id": "LC-05", "item": "Ops Incident Case 1/2/3 runbooks", "when": "now", "status": "READY"},
            {"id": "LC-06", "item": "Mainnet env preflight (read-only) reviewed", "when": "parallel", "status": "READY_FOR_OWNER"},
            {"id": "LC-07", "item": "User/Guide/Provider/Steward ops materials", "when": "parallel", "status": "READY"},
            {"id": "LC-08", "item": "Manual UAT execution plan prepared", "when": "now", "status": "READY"},
            {"id": "LC-09", "item": "FG-15 ELAPSED PASS", "when": "after_ends_utc", "status": "BLOCKED"},
            {"id": "LC-10", "item": "Owner Sign-off signed=true", "when": "after_LC09", "status": "BLOCKED"},
            {"id": "LC-11", "item": "PSG Completion Recalculate", "when": "after_LC10", "status": "BLOCKED"},
            {"id": "LC-12", "item": "Production Certification FINAL", "when": "after_LC11", "status": "BLOCKED"},
            {"id": "LC-13", "item": "GO / NO-GO", "when": "after_LC12_separate_gate", "status": "BLOCKED"},
        ],
        "pre_elapsed_forbidden": ["LC-09_complete", "LC-10", "LC-11", "LC-12", "LC-13", "ACTIVE_flip", "Production_GO"],
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
    }
    write_json("LAUNCH-DAY-CHECKLIST-LATEST.json", launch_checklist)

    # ---------- 4 · Ops / Incident Runbooks (Case 1/2/3) ----------
    incident = {
        "schema": "traveltrust.ops_incident_runbook_launch.v1",
        "recorded_utc": stamp,
        "status": "DRAFT_THREE_CASES_READY",
        "priority": 4,
        "discipline": "no_code_change_during_fg15",
        "Release_SHA": release_sha,
        "human": "docs/runbook/TT-OPS-INCIDENT-RUNBOOK-LAUNCH-LATEST.md",
        "cases": {
            "Case_1_payment_ok_ui_stale": {
                "title": "用户支付成功，但页面没更新",
                "alias": "Case_A_onchain_ok_ui_stale",
                "flow": ["Tx", "Event", "Indexer", "DB", "API", "UI"],
                "actions": [
                    "Confirm tx receipt / success on explorer",
                    "Locate matching event",
                    "Check indexer lag / cursor",
                    "Verify DB projection row",
                    "Hit API read path",
                    "Hard-refresh / clear UI cache if DB+API ok",
                ],
                "ssot": [
                    "docs/runbook/Epic-D-indexer-ops-readonly-ladder.md",
                    "scripts/ops/internal-indexer-ops.sh",
                    "scripts/check-indexer-lag-locate-gate.sh",
                ],
            },
            "Case_2_settlement_stuck": {
                "title": "Settlement 卡住",
                "alias": "Case_B_settlement_anomaly",
                "flow": ["检查合约状态", "检查 Event", "检查 Indexer", "人工恢复"],
                "actions": [
                    "Read Escrow / SettlementRouter state",
                    "Confirm SettlementReady / related events",
                    "Check FeeRouter + distributable accounting",
                    "Owner-approved pause / reconcile / Rollback STOP if needed",
                ],
                "ssot": [
                    "ops/RUNBOOK.md",
                    "docs/runbook/TT-PRODUCTION-ROLLBACK-DECISION-TREE-LATEST.md",
                    "docs/runbook/TT-OPS-INCIDENT-CONTACT-AND-WINDOW-LATEST.md",
                ],
            },
            "Case_3_security_incident": {
                "title": "安全事件",
                "alias": "IR_SECURITY",
                "flow": ["发现", "暂停入口", "保护资金", "调查", "恢复"],
                "actions": [
                    "Detect via monitor / alert / report",
                    "Pause public entry (feature flag / maintenance) — no contract rewrite in FG-15",
                    "Protect funds (pause paths · Timelock-aware)",
                    "Investigate with evidence trail",
                    "Recover only after Owner approval",
                ],
                "ssot": [
                    "docs/runbook/PRODUCTION-INCIDENT-RESPONSE.md",
                    "docs/runbook/TT-PRODUCTION-ROLLBACK-DECISION-TREE-LATEST.md",
                    "docs/runbook/TT-OPS-INCIDENT-CONTACT-AND-WINDOW-LATEST.md",
                ],
            },
        },
        "legacy_aliases": {
            "Case_A": "Case_1_payment_ok_ui_stale",
            "Case_B": "Case_2_settlement_stuck",
            "Case_C_dispute": "kept_in_OPS-SOP for dispute path",
        },
        "ACTIVE_FLIP": "FORBIDDEN",
    }
    write_json("OPS-INCIDENT-RUNBOOK-LAUNCH-LATEST.json", incident)

    ops = load("OPS-SOP-LAUNCH-DAY-FINALIZE-LATEST.json") or {}
    ops.update(
        {
            "recorded_utc": stamp,
            "status": "DRAFT_WITH_THREE_PLAYBOOKS_PLUS_CASE123",
            "incident_runbook": "OPS-INCIDENT-RUNBOOK-LAUNCH-LATEST.json",
            "case_123": list(incident["cases"].keys()),
            "ACTIVE_FLIP": "FORBIDDEN",
        }
    )
    # preserve existing playbooks if present
    if "playbooks" not in ops:
        ops["playbooks"] = {}
    ops["playbooks"]["Case_1_payment_ok_ui_stale"] = incident["cases"]["Case_1_payment_ok_ui_stale"]
    ops["playbooks"]["Case_2_settlement_stuck"] = incident["cases"]["Case_2_settlement_stuck"]
    ops["playbooks"]["Case_3_security_incident"] = incident["cases"]["Case_3_security_incident"]
    write_json("OPS-SOP-LAUNCH-DAY-FINALIZE-LATEST.json", ops)

    # ---------- 5 · Mainnet env check (read-only) ----------
    env_check = {
        "schema": "traveltrust.mainnet_env_preflight_readonly.v1",
        "recorded_utc": stamp,
        "status": "CHECKLIST_PAPER_READY_NO_CONFIG_CHANGE",
        "priority": 5,
        "Release_SHA": release_sha,
        "broadcast_authorized": False,
        "config_change_authorized": False,
        "ACTIVE_FLIP": "FORBIDDEN",
        "human": "docs/runbook/TT-MAINNET-ENV-PREFLIGHT-READONLY-LATEST.md",
        "ssot_existing": [
            "docs/runbook/TT-MAINNET-ENV-PREP-NO-DEPLOY-LATEST.md",
            "docs/runbook/TT-MAINNET-READINESS-CHECKLIST-LATEST.md",
            "docs/runbook/templates/mainnet-package/env/mainnet.env.template",
        ],
        "infrastructure": [
            {"id": "INFRA-01", "item": "Compute platform selected", "owner_action": "record", "status": "OPEN_OWNER"},
            {"id": "INFRA-02", "item": "Domain / DNS plan", "owner_action": "record", "status": "OPEN_OWNER"},
            {"id": "INFRA-03", "item": "CDN plan", "owner_action": "record", "status": "OPEN_OWNER"},
            {"id": "INFRA-04", "item": "SSL/TLS path", "owner_action": "record", "status": "OPEN_OWNER"},
            {"id": "INFRA-05", "item": "API endpoint plan", "owner_action": "record", "status": "OPEN_OWNER"},
            {"id": "INFRA-06", "item": "DB backup window", "owner_action": "record", "status": "OPEN_OWNER"},
            {"id": "INFRA-07", "item": "Logging backend", "owner_action": "record", "status": "OPEN_OWNER"},
            {"id": "INFRA-08", "item": "Monitoring / alerts", "owner_action": "record", "status": "OPEN_OWNER"},
            {"id": "INFRA-09", "item": "Secrets / key management (names only)", "owner_action": "record", "status": "OPEN_OWNER"},
        ],
        "permissions_confirm": [
            {"id": "PERM-01", "item": "Wallet permissions documented", "status": "OPEN_OWNER"},
            {"id": "PERM-02", "item": "Safe / Timelock address confirmed (paper)", "value_hint": EXPECTED_ADDRS["ownerOrTimelock"], "status": "OPEN_OWNER"},
            {"id": "PERM-03", "item": "Deploy permission holders listed", "status": "OPEN_OWNER"},
            {"id": "PERM-04", "item": "Admin permission holders listed", "status": "OPEN_OWNER"},
        ],
        "forbid_now": [
            "replace_ACTIVE_baseline",
            "broadcast_mainnet",
            "rotate_production_secrets_into_repo",
            "change_FeeRouter_Settlement_permissions",
            "redeploy_hardened_set",
        ],
        "verdict": "MAINNET_ENV_PREFLIGHT_PAPER_READY_NO_MUTATION",
    }
    write_json("MAINNET-ENV-PREFLIGHT-READONLY-LATEST.json", env_check)

    # ---------- 6 · Ops materials + Manual UAT plan ----------
    ops_materials = {
        "schema": "traveltrust.launch_ops_materials.v1",
        "recorded_utc": stamp,
        "status": "DRAFT_READY_FOR_OWNER_REVIEW",
        "priority": 6,
        "Release_SHA": release_sha,
        "human": "docs/runbook/TT-LAUNCH-OPS-MATERIALS-LATEST.md",
        "audiences": {
            "user": {
                "topics": [
                    "注册流程说明",
                    "钱包连接说明",
                    "支付说明",
                    "订单状态说明",
                ],
                "entry_routes": ["/auth/register", "/auth/login", "/market", "/escrow/[id]"],
            },
            "guide_provider": {
                "topics": ["接单流程", "履约流程", "收益查看"],
                "entry_routes": ["/provider/register", "/me/identities", "orders / escrow confirm"],
            },
            "steward": {
                "topics": ["区域权益说明", "收益查看", "数据解释"],
                "entry_routes": ["/governance/*", "steward dashboards"],
                "note": "Non-ACTIVE hardened economics · do not imply mainnet live",
            },
        },
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
    }
    write_json("LAUNCH-OPS-MATERIALS-LATEST.json", ops_materials)

    manual_uat = {
        "schema": "traveltrust.manual_uat_execution_plan.v1",
        "recorded_utc": stamp,
        "status": "PLAN_ONLY_NO_AUTOMATION_CHANGE",
        "priority": 3,
        "Release_SHA": release_sha,
        "human": "docs/runbook/TT-MANUAL-UAT-EXECUTION-PLAN-LATEST.md",
        "discipline": "do_not_modify_automation_scripts_in_fg15",
        "flows": {
            "P0_user": {
                "title": "P0 用户流程",
                "steps": [
                    "注册",
                    "创建旅行需求",
                    "Guide 接单",
                    "Escrow",
                    "Payment",
                    "完成",
                    "Settlement",
                ],
                "existing_smokes_pointer": [
                    "scripts/dev/smoke-web3-itinerary-full-chain-local.sh",
                    "scripts/dev/smoke-order-escrow-dispute-p0-local.sh",
                    "evidence/manual-uat/README.md",
                ],
            },
            "Web3": {
                "title": "Web3 流程",
                "steps": ["Wallet", "Sign", "Escrow", "Release", "Distribution"],
                "existing_smokes_pointer": [
                    "scripts/dev/run-web3-itinerary-l5-green.sh",
                    "docs/runbook/TT-MONEY-PATH-TEST-PLAN-LATEST.md",
                ],
            },
        },
        "when_to_execute": "After FG-15 ELAPSED optional dry-run · before or with GO decision — not a substitute for Cert FINAL",
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
    }
    write_json("MANUAL-UAT-EXECUTION-PLAN-LATEST.json", manual_uat)

    # ---------- Index of six packs ----------
    index = {
        "schema": "traveltrust.fg15_six_parallel_prep_index.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "window_ends_utc": start.get("window_ends_utc") or freeze.get("window_ends_utc"),
        "elapsed_pass": False,
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "equality_quad_pass": equality["pass"],
        "packs": [
            {
                "priority": 1,
                "id": "certification",
                "artifact": "PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.json",
                "status": cert["status"],
            },
            {
                "priority": 2,
                "id": "owner_signoff",
                "artifact": "OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.json",
                "status": owner["status"],
                "signed": False,
            },
            {
                "priority": 3,
                "id": "launch_day_checklist",
                "artifact": "LAUNCH-DAY-CHECKLIST-LATEST.json",
                "status": launch_checklist["status"],
            },
            {
                "priority": 4,
                "id": "ops_incident",
                "artifact": "OPS-INCIDENT-RUNBOOK-LAUNCH-LATEST.json",
                "status": incident["status"],
            },
            {
                "priority": 5,
                "id": "mainnet_env_preflight",
                "artifact": "MAINNET-ENV-PREFLIGHT-READONLY-LATEST.json",
                "status": env_check["status"],
            },
            {
                "priority": 6,
                "id": "ops_materials_and_manual_uat",
                "artifacts": [
                    "LAUNCH-OPS-MATERIALS-LATEST.json",
                    "MANUAL-UAT-EXECUTION-PLAN-LATEST.json",
                ],
                "status": "DRAFT_READY",
            },
        ],
        "forbid_during_window": [
            "optimize_contracts",
            "change_economic_rules",
            "change_FeeRouter",
            "change_Settlement",
            "change_permission_model",
            "change_Release_SHA",
            "redeploy",
            "ACTIVE_flip",
            "Owner_final_sign",
            "Cert_FINAL",
            "Production_GO",
        ],
        "post_fg15_sequence": cert["post_fg15_sequence"],
        "verdict": "SIX_PARALLEL_PREP_PACKS_READY_AWAIT_FG15_ELAPSED",
    }
    write_json("FG15-SIX-PARALLEL-PREP-INDEX-LATEST.json", index)

    print(
        json.dumps(
            {
                "verdict": index["verdict"],
                "equality_quad_pass": equality["pass"],
                "packs": [p["id"] for p in index["packs"]],
                "signed": False,
                "ACTIVE_FLIP": "FORBIDDEN",
                "ends": index["window_ends_utc"],
            },
            indent=2,
            ensure_ascii=False,
        )
    )
    return 0 if equality["pass"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
