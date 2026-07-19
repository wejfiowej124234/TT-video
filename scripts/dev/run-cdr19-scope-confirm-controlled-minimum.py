#!/usr/bin/env python3
"""CDR-19 CONTROLLED_MINIMUM_RELEASE scope builder + Scope Confirm stamp."""
from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"

FCG_KEYWORDS = (
    "fcg",
    "v311",
    "SettlementRouter",
    "ServiceFee",
    "Distributable",
    "FounderBootstrap",
    "ProjectRevenue",
    "AccessFee",
    "completion-matrix",
    "completion_matrix",
    "cdr-19",
    "CDR-19",
    "DeployFcg",
    "fg-web3",
    "fg_web3",
    "protocol-v2",
    "clean-deploy",
    "psg-production-completion",
    "ISettlementRouter",
)


def git(*a: str) -> str:
    return subprocess.check_output(["git", *a], cwd=ROOT, text=True, stderr=subprocess.DEVNULL).strip()


def is_fcg_related(p: str) -> bool:
    pl = p.lower()
    return any(k.lower() in pl for k in FCG_KEYWORDS)


def is_clean_deploy_essential(p: str) -> bool:
    """Dependencies required for fcg_full_capability_v2_sepolia Clean Deploy + bindings."""
    p = p.replace("\\", "/")
    # contract source / ABI / deploy scripts
    if p.startswith("contracts/src/") and p.endswith(".sol"):
        return True
    if p.startswith("contracts/abi/") and p.endswith(".json"):
        return True
    if p.startswith("contracts/script/") and (
        "Fcg" in p or "V311" in p or "fcg" in p.lower() or "Settlement" in p
    ):
        return True
    if p.startswith("contracts/test/") and (
        "V311" in p or "Settlement" in p or "Fcg" in p or "ServiceFee" in p
    ):
        return True
    # registry SSOT for deploy / matrix / wait / protocol
    if p.startswith("registry/") and any(
        x in p
        for x in (
            "fcg",
            "v311",
            "protocol-v2",
            "protocol_convergence",
            "web3-active",
            "psg-production-completion",
            "psg-protocol",
            "psg-fcg",
            "clean-deploy",
            "completion-matrix",
            "completion_definition",
            "fg-web3",
            "financial",
        )
    ):
        return True
    # deploy / CDR-19 / FG verify tooling
    if p.startswith("scripts/") and any(
        x in p.lower()
        for x in (
            "fcg",
            "v311",
            "cdr19",
            "cdr-19",
            "fg-web3",
            "fg_web3",
            "clean-deploy",
            "settlement",
            "protocol-v2",
            "completion-matrix",
        )
    ):
        return True
    # API / core bindings for V311 / FCG
    if p.startswith("crates/") and is_fcg_related(p):
        return True
    if p.startswith("crates/core/src/lib.rs"):
        return True  # module exports
    # frontend bindings for settlement / v311 / web3 money path if present
    if p.startswith("frontend/") and is_fcg_related(p):
        return True
    # config used by sepolia jurisdiction pools if touched
    if p.startswith("config/") and ("jurisdiction" in p or "sepolia" in p or "v311" in p.lower()):
        return True
    # AGENTS / checklist runbooks that gate the release identity (narrow)
    if p in ("AGENTS.md", ".gitignore"):
        return True
    if p.startswith("docs/runbook/") and any(
        x in p
        for x in (
            "FCG",
            "PROTOCOL-V2",
            "COMPLETION-MATRIX",
            "CDR-19",
            "G-RC-WAIT",
            "FG-WEB3",
            "FINANCIAL-GRADE",
            "CLEAN-DEPLOY",
            "PSG-PRODUCTION-COMPLETION",
        )
    ):
        return True
    if p.startswith("docs/spec/governance-token/") and (
        "V3.1.1" in p or "V311" in p or "ECONOMIC-CONSTITUTION-V3.1" in p
    ):
        return True
    return False


def is_evidence_tooling(p: str) -> bool:
    """Scripts that produce/bind evidence — may enter Release; evidence blobs stay Evidence."""
    p = p.replace("\\", "/")
    return p.startswith("scripts/") and any(
        x in p.lower() for x in ("evidence", "cdr19", "fg-web3", "fg_web3", "manifest", "bind")
    )


def main() -> None:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    inv_path = PENDING / "CDR-19-DIRTY-AUDIT-INVENTORY-LATEST.json"
    if not inv_path.exists():
        raise SystemExit("missing dirty audit inventory; run run-cdr19-dirty-audit.py first")
    inv = json.loads(inv_path.read_text(encoding="utf-8"))
    items = inv["items"]
    buckets = inv.get("buckets") or {}

    evidence = sorted(buckets.get("Evidence", []))
    temp = sorted(buckets.get("Temp", []))
    release_candidates = sorted(buckets.get("Release", []))
    reject = sorted(buckets.get("Reject_Delete", []))

    fcg_core = sorted(p for p in release_candidates if is_fcg_related(p))
    essential = sorted(
        p
        for p in release_candidates
        if is_clean_deploy_essential(p) or is_evidence_tooling(p)
    )
    controlled = sorted(set(fcg_core) | set(essential))
    deferred_review = sorted(set(release_candidates) - set(controlled))

    scope = {
        "schema": "traveltrust.cdr19_release_scope_confirm.v1",
        "id": "CDR-19",
        "recorded_utc": stamp,
        "RELEASE_SCOPE_MODE": "CONTROLLED_MINIMUM_RELEASE",
        "owner_direction": (
            "Do not accept 452 Release candidates. Narrow to FCG/V311 + Clean Deploy essentials; "
            "Evidence separate; Temp exclude; remainder deferred for item review."
        ),
        "g_rc_closed": True,
        "base_head_before_commit": git("rev-parse", "HEAD"),
        "counts": {
            "dirty_total": len(items),
            "heuristic_release_candidates": len(release_candidates),
            "fcg_v311_core": len(fcg_core),
            "clean_deploy_essentials_union": len(essential),
            "controlled_minimum_release": len(controlled),
            "deferred_item_review": len(deferred_review),
            "evidence_package_separate": len(evidence),
            "temp_exclude": len(temp),
            "reject": len(reject),
        },
        "include": {
            "bucket": "Release",
            "mode": "CONTROLLED_MINIMUM_RELEASE",
            "paths": controlled,
        },
        "evidence_package": {
            "bucket": "Evidence",
            "paths": evidence,
            "rule": "bind_as_Evidence_Package_only_not_in_code_Release_Commit",
        },
        "temp": {
            "bucket": "Temp",
            "paths": temp,
            "rule": "exclude_from_Release_cleanup_only",
        },
        "deferred_item_review": {
            "bucket": "NOT_AUTO_RELEASE",
            "paths": deferred_review,
            "rule": "item_by_item_Owner_review_required_not_in_this_Release",
        },
        "status": "SCOPE_CONFIRMED",
        "next": "Commit_controlled_minimum_only",
        "forbid": [
            "commit_all_452_release_candidates",
            "mix_evidence_into_code_release_commit",
            "include_temp",
            "auto_include_deferred",
            "clean_deploy_before_cdr19_pass",
        ],
        "verdict": "CDR19_SCOPE_CONFIRMED_CONTROLLED_MINIMUM_RELEASE",
    }

    PENDING.mkdir(parents=True, exist_ok=True)
    (PENDING / "CDR-19-SCOPE-CONFIRM-LATEST.json").write_text(
        json.dumps(scope, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    # path lists for git add
    (PENDING / "CDR-19-CONTROLLED-MINIMUM-RELEASE-PATHS.txt").write_text(
        "\n".join(controlled) + ("\n" if controlled else ""), encoding="utf-8"
    )
    (PENDING / "CDR-19-DEFERRED-REVIEW-PATHS.txt").write_text(
        "\n".join(deferred_review) + ("\n" if deferred_review else ""), encoding="utf-8"
    )
    (PENDING / "CDR-19-EVIDENCE-PACKAGE-PATHS.txt").write_text(
        "\n".join(evidence) + ("\n" if evidence else ""), encoding="utf-8"
    )
    (PENDING / "CDR-19-TEMP-EXCLUDE-PATHS.txt").write_text(
        "\n".join(temp) + ("\n" if temp else ""), encoding="utf-8"
    )

    cdr19_path = PENDING / "CDR-19-RELEASE-IDENTITY-CLOSURE-LATEST.json"
    cdr19 = json.loads(cdr19_path.read_text(encoding="utf-8")) if cdr19_path.exists() else {}
    cdr19.update(
        {
            "schema": "traveltrust.cdr19_release_identity_closure.v1",
            "id": "CDR-19",
            "recorded_utc": stamp,
            "status": "SCOPE_CONFIRMED_AWAIT_COMMIT",
            "RELEASE_SCOPE_MODE": "CONTROLLED_MINIMUM_RELEASE",
            "phase": "Commit",
            "completed_steps": ["Dirty_Audit", "Release_Scope_Classification", "Scope_Confirm"],
            "pending_steps": [
                "Commit",
                "Release_SHA_Pin",
                "Artifact_Bytecode_Evidence_Binding",
                "CDR19_PASS",
            ],
            "scope_confirm_rel": "CDR-19-SCOPE-CONFIRM-LATEST.json",
            "counts": scope["counts"],
            "clean_deploy": "LOCKED_until_CDR19_PASS",
            "verdict": "CDR19_SCOPE_CONFIRMED_CONTROLLED_MINIMUM_RELEASE",
        }
    )
    cdr19_path.write_text(json.dumps(cdr19, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # registries
    for rel, extra in [
        (
            "registry/psg-fcg-pay01-g-rc-wait-window-s1-arm.v1.yaml",
            {
                "status": "G_RC_CLOSED_CDR19_SCOPE_CONFIRMED",
                "cdr19_status": "SCOPE_CONFIRMED_CONTROLLED_MINIMUM_RELEASE",
                "sole_wait_event": "Commit_controlled_minimum_then_SHA_Pin_Binding",
            },
        ),
        (
            "registry/psg-protocol-v2-clean-deploy-ready-checklist.v1.yaml",
            {
                "status": "G_RC_CLOSED_CDR19_SCOPE_CONFIRMED_CLEAN_DEPLOY_LOCKED",
            },
        ),
    ]:
        p = ROOT / rel
        d = yaml.safe_load(p.read_text(encoding="utf-8"))
        d["recorded_utc"] = stamp
        d.update(extra)
        cri = d.setdefault("cdr19_release_identity", d.setdefault("release_identity", {}))
        cri["RELEASE_SCOPE_MODE"] = "CONTROLLED_MINIMUM_RELEASE"
        cri["status"] = "SCOPE_CONFIRMED"
        cri["controlled_minimum_count"] = len(controlled)
        cri["deferred_review_count"] = len(deferred_review)
        cri["evidence_separate_count"] = len(evidence)
        p.write_text(yaml.safe_dump(d, allow_unicode=True, sort_keys=False), encoding="utf-8")

    print(
        json.dumps(
            {
                "verdict": scope["verdict"],
                "controlled": len(controlled),
                "fcg_core": len(fcg_core),
                "deferred": len(deferred_review),
                "evidence": len(evidence),
                "temp": len(temp),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
