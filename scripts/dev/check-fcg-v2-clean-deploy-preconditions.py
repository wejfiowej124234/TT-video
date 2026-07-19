#!/usr/bin/env python3
"""WAIT_WINDOW: validate fcg_full_capability_v2_sepolia Clean Deploy preconditions.

Scope: Git SHA · ABI · Deploy Script · Registry · Evidence Pipeline · Environment Pin
Frozen: TT_PSG_PRODUCTION_COMPLETION_MATRIX — no new Coverage/Capability/Audit systems.
Does NOT broadcast · does NOT flip ACTIVE · does NOT claim FG/PSG PASS.
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
STAMP = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def git(*a: str) -> str:
    try:
        return subprocess.check_output(
            ["git", *a], cwd=ROOT, text=True, stderr=subprocess.DEVNULL
        ).strip()
    except Exception as e:  # noqa: BLE001
        return f"ERR:{e}"


def sha16(path: Path) -> str | None:
    if not path.is_file():
        return None
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def exists(rel: str) -> bool:
    return (ROOT / rel).is_file() or (ROOT / rel).is_dir()


def detect_active(text: str, parsed: dict) -> str:
    for key in (
        "active_deploy_baseline",
        "active_baseline",
    ):
        if key in parsed and parsed[key]:
            return str(parsed[key])
    m = re.search(r"active_deploy_baseline:\s*([^\s#]+)", text)
    if m:
        return m.group(1).strip().strip("\"'")
    if "v311_sepolia_clean_baseline" in text:
        return "v311_sepolia_clean_baseline"
    return "UNKNOWN"


def main() -> int:
    head = git("rev-parse", "HEAD")
    branch = git("rev-parse", "--abbrev-ref", "HEAD")
    dirty = [ln for ln in git("status", "--porcelain").splitlines() if ln.strip()]
    try:
        ab = git(
            "rev-list",
            "--left-right",
            "--count",
            "traveltrust-v11/feature/g23-04-abi-event-freeze...HEAD",
        )
        behind, ahead = (int(x) for x in ab.split())
    except Exception:
        ahead, behind = -1, -1

    abi_pairs = [
        ("contracts/abi/Escrow.json", "frontend/dapp/abis/Escrow.json"),
        ("contracts/abi/FeeRouter.json", "frontend/dapp/abis/FeeRouter.json"),
        ("contracts/abi/SettlementRouter.json", None),
        ("contracts/abi/ISettlementRouter.json", None),
    ]
    abi_checks = []
    for left, right in abi_pairs:
        lp = ROOT / left
        rp = ROOT / right if right else None
        item = {
            "left": left,
            "left_ok": lp.is_file(),
            "left_sha16": sha16(lp),
            "right": right,
            "right_ok": rp.is_file() if rp else None,
            "match": None,
            "note": None,
        }
        if right and lp.is_file() and rp and rp.is_file():
            item["match"] = sha16(lp) == sha16(rp)
        elif right is None:
            item["note"] = "v2_prep_abi_no_fe_pair_until_cutover"
            item["match"] = lp.is_file()
        else:
            item["match"] = False
        abi_checks.append(item)

    deploy_script = "contracts/script/DeployFcgFullCapabilityV2Sepolia.s.sol"
    registry_pins = [
        "registry/psg-production-completion-matrix.v1.yaml",
        "registry/psg-protocol-v2-clean-deploy-ready-checklist.v1.yaml",
        "registry/psg-fcg-pay01-g-rc-wait-window-s1-arm.v1.yaml",
        "registry/web3-active-execution-matrix.v1.yaml",
        "registry/psg-fg-web3-evidence-schema.v1.yaml",
    ]
    evidence_pipeline = [
        "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/CLEAN-DEPLOY-PENDING-PACK-LATEST.json",
        "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/GIT-SHA-BASELINE-LATEST.json",
        "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/FG-WEB3-CLEAN-DEPLOY-PREP-PACK-LATEST.json",
        "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/CHAIN-INDEXER-API-DB-UI-CONSISTENCY-PREP-LATEST.json",
        "scripts/dev/gen-fg-web3-clean-deploy-prep-pack.py",
        "scripts/dev/verify-fg-web3-chain-indexer-api-db-ui-prep.py",
        "scripts/dev/run-fcg-v2-evidence-pipeline-prep.sh",
    ]

    wem_path = ROOT / "registry/web3-active-execution-matrix.v1.yaml"
    wem_text = wem_path.read_text(encoding="utf-8") if wem_path.exists() else ""
    # File may contain legacy YAML quirks — pin detection is text-based only.
    active_from_wem = detect_active(wem_text, {})

    cl_path = ROOT / "registry/psg-protocol-v2-clean-deploy-ready-checklist.v1.yaml"
    cl = yaml.safe_load(cl_path.read_text(encoding="utf-8"))
    planned = cl.get("planned_active_after_g_rc_closed") or "fcg_full_capability_v2_sepolia"
    current = cl.get("current_active_baseline") or active_from_wem

    checks = {
        "git_sha": {
            "branch": branch,
            "head": head,
            "ahead": ahead,
            "behind": behind,
            "dirty_count": len(dirty),
            "ready": bool(head) and not str(head).startswith("ERR"),
            "broadcast_blocker": len(dirty) > 0 or ahead > 0,
            "note": "SHA present; commit/sync before broadcast if dirty/ahead",
        },
        "abi": {"items": abi_checks, "ready": all(bool(i.get("match")) for i in abi_checks)},
        "deploy_script": {"path": deploy_script, "ready": exists(deploy_script)},
        "registry": {
            "items": [{"path": r, "ok": exists(r)} for r in registry_pins],
            "ready": all(exists(r) for r in registry_pins),
            "completion_matrix_frozen": True,
        },
        "evidence_pipeline": {
            "items": [{"path": r, "ok": exists(r)} for r in evidence_pipeline],
            "ready": all(exists(r) for r in evidence_pipeline),
        },
        "environment_pin": {
            "current_active_baseline": current,
            "planned_v2": planned,
            "active_must_remain_until_after_clean_deploy": "v311_sepolia_clean_baseline",
            "active_flip_forbidden_now": True,
            "ready": (
                str(current) == "v311_sepolia_clean_baseline"
                and planned == "fcg_full_capability_v2_sepolia"
            ),
        },
    }
    prep_ready = all(checks[k]["ready"] for k in checks)
    verdict = (
        "CLEAN_DEPLOY_PRECONDITIONS_MAINTAINED_WAIT_G_RC"
        if prep_ready
        else "CLEAN_DEPLOY_PRECONDITIONS_GAP"
    )

    pack = {
        "schema": "traveltrust.fcg_v2_clean_deploy_preconditions_check.v1",
        "recorded_utc": STAMP,
        "completion_matrix": "TT_PSG_PRODUCTION_COMPLETION_MATRIX",
        "framework_frozen": True,
        "forbid_spawn": [
            "Coverage_Matrix_v3",
            "New_Capability_Matrix",
            "New_Audit_Dimension",
        ],
        "wait_window_scope": [
            "G_RC_Execute_Ready",
            "fcg_full_capability_v2_sepolia_Clean_Deploy_Ready",
        ],
        "checks": checks,
        "g_rc_closed": False,
        "broadcast_authorized": False,
        "active_flip_authorized": False,
        "post_g_rc_main_chain": [
            "fcg_full_capability_v2_sepolia_CLEAN_Deploy",
            "Escrow_SettlementRouter_Integration",
            "Live_Chain_Indexer_API_DB_UI_Consistency",
            "FGCASE_01_to_15_Financial_Web3_Validation",
            "Security_RBAC_Validation",
            "Observation_48H",
            "TT_PSG_PRODUCTION_COMPLETION_MATRIX_Recalculate",
        ],
        "finding_archive_only": [
            "L1_Product_Gap",
            "L2_Data_Gap",
            "L3_Security_Gap",
            "L4_Operations_Gap",
            "L5_FG_Web3_Gap",
        ],
        "prep_ready": prep_ready,
        "broadcast_ready": False,
        "verdict": verdict,
        "honesty": {
            "prep_ready_equals_fg_pass": False,
            "prep_ready_equals_psg_complete": False,
            "single_layer_pass_equals_psg_complete": False,
        },
    }

    cl["recorded_utc"] = STAMP
    cl["status"] = "CLEAN_DEPLOY_READY_PRECONDITIONS_CHECKED_WAIT_G_RC"
    cl["preconditions_check"] = {
        "artifact": (
            "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/"
            "CLEAN-DEPLOY-PRECONDITIONS-CHECK-LATEST.json"
        ),
        "verdict": verdict,
        "prep_ready": prep_ready,
        "broadcast_ready": False,
    }
    cl["framework_frozen"] = True
    cl["forbid_new_coverage_capability_audit_systems"] = True
    cl_path.write_text(yaml.safe_dump(cl, allow_unicode=True, sort_keys=False), encoding="utf-8")

    wpath = ROOT / "registry/psg-fcg-pay01-g-rc-wait-window-s1-arm.v1.yaml"
    wd = yaml.safe_load(wpath.read_text(encoding="utf-8"))
    wd["recorded_utc"] = STAMP
    wd["status"] = "WAIT_WINDOW_G_RC_EXEC_READY_AND_CLEAN_DEPLOY_READY_MAINTAIN"
    wd["clean_deploy_preconditions_verdict"] = verdict
    wd["clean_deploy_prep_ready"] = prep_ready
    wpath.write_text(yaml.safe_dump(wd, allow_unicode=True, sort_keys=False), encoding="utf-8")

    mp = ROOT / "registry/psg-production-completion-matrix.v1.yaml"
    md = yaml.safe_load(mp.read_text(encoding="utf-8"))
    md["recorded_utc"] = STAMP
    md["status"] = "ACTIVE_SSOT_FRAMEWORK_FROZEN_WAIT_WINDOW_NARROW"
    md["last_preconditions_check"] = verdict
    mp.write_text(yaml.safe_dump(md, allow_unicode=True, sort_keys=False), encoding="utf-8")

    for rel in [
        "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/CLEAN-DEPLOY-PRECONDITIONS-CHECK-LATEST.json",
        "evidence/GO_pre_eta_production_prep/coverage-fg-web3-20260719/CLEAN-DEPLOY-PRECONDITIONS-CHECK-LATEST.json",
    ]:
        out = ROOT / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(verdict)
    print("prep_ready", prep_ready)
    print("git", head[:12] if head and not head.startswith("ERR") else head, "ahead", ahead, "dirty", len(dirty))
    print(
        "abi",
        checks["abi"]["ready"],
        "deploy",
        checks["deploy_script"]["ready"],
        "registry",
        checks["registry"]["ready"],
        "evidence",
        checks["evidence_pipeline"]["ready"],
        "env_pin",
        checks["environment_pin"]["ready"],
        "active",
        current,
    )
    return 0 if prep_ready else 1


if __name__ == "__main__":
    raise SystemExit(main())
