#!/usr/bin/env python3
"""CDR-19 Dirty Audit — classify working tree; no commit/pin/deploy."""
from __future__ import annotations

import json
import subprocess
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]


def git(*a: str) -> str:
    return subprocess.check_output(["git", *a], cwd=ROOT, text=True, stderr=subprocess.DEVNULL).strip()


def classify(path: str) -> str:
    p = path.replace("\\", "/")
    if p.startswith("evidence/") or "/evidence/" in p:
        return "Evidence"
    if p.endswith(".jsonl") or "audit.jsonl" in p:
        return "Evidence"
    temp_markers = (
        ".env.local",
        ".env.preprod.local",
        ".DS_Store",
        "node_modules/",
        "target/",
        "cache/",
        "out/",
        "broadcast/",
        ".tmp",
        "/tmp/",
        "Thumbs.db",
    )
    if any(x in p for x in temp_markers):
        return "Temp"
    if p.endswith(".local.example") or p.endswith(".local"):
        return "Temp"
    if "LEGACY_SUPERSEDED" in p or p.endswith(".bak") or p.endswith("~"):
        return "Reject_Delete"
    release_prefixes = (
        "contracts/",
        "crates/",
        "frontend/",
        "scripts/",
        "registry/",
        "config/",
        "docs/",
        "AGENTS.md",
        ".gitignore",
        "data/catalog/",
        ".cursor/rules/",
    )
    if p.startswith(release_prefixes) or p in ("AGENTS.md", ".gitignore"):
        return "Release"
    if p.startswith("data/"):
        if "catalog" in p or p.endswith((".yaml", ".yml")):
            return "Release"
        return "Evidence"
    return "Release"


def main() -> None:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    head = git("rev-parse", "HEAD")
    branch = git("rev-parse", "--abbrev-ref", "HEAD")
    lines = [ln for ln in git("status", "--porcelain").splitlines() if ln.strip()]

    items = []
    by_bucket: dict[str, list[str]] = defaultdict(list)
    by_ext: Counter[str] = Counter()
    by_top: Counter[str] = Counter()

    for ln in lines:
        st = ln[:2]
        rest = ln[3:]
        if " -> " in rest:
            path = rest.split(" -> ", 1)[1].strip().strip('"')
        else:
            path = rest.strip().strip('"')
        bucket = classify(path)
        items.append({"status": st.strip(), "path": path, "proposed_bucket": bucket})
        by_bucket[bucket].append(path)
        by_ext[Path(path).suffix.lower() or "(none)"] += 1
        by_top[path.split("/", 1)[0] if "/" in path else path] += 1

    release_paths = by_bucket["Release"]
    fcg_keywords = (
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
    )
    fcg_related = [p for p in release_paths if any(k.lower() in p.lower() for k in fcg_keywords)]

    proposed_counts = {k: len(v) for k, v in sorted(by_bucket.items())}
    summary = {
        "schema": "traveltrust.cdr19_dirty_audit.v1",
        "id": "CDR-19",
        "phase": "Dirty_Audit",
        "recorded_utc": stamp,
        "g_rc_closed_owner_declaration": True,
        "g_rc_closed": True,
        "base_head": head,
        "branch": branch,
        "dirty_count": len(items),
        "proposed_counts": proposed_counts,
        "top_level_counts": dict(by_top.most_common()),
        "extension_counts": dict(by_ext.most_common(30)),
        "fcg_v2_related_release_candidates_count": len(fcg_related),
        "fcg_v2_related_sample": fcg_related[:80],
        "status": "DIRTY_AUDIT_COMPLETE_AWAIT_SCOPE_CONFIRM",
        "next": "Owner_confirm_Release_Scope_then_Commit",
        "forbid_until_scope_confirm": ["commit", "Release_SHA_pin", "clean_deploy"],
        "full_inventory_rel": "CDR-19-DIRTY-AUDIT-INVENTORY-LATEST.json",
        "honesty": "proposed_buckets_are_heuristic_not_Owner_confirmed",
        "verdict": "CDR19_DIRTY_AUDIT_DONE_SCOPE_CONFIRM_REQUIRED",
    }

    out_dir = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "CDR-19-DIRTY-AUDIT-LATEST.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (out_dir / "CDR-19-DIRTY-AUDIT-INVENTORY-LATEST.json").write_text(
        json.dumps(
            {
                "schema": "traveltrust.cdr19_dirty_audit_inventory.v1",
                "recorded_utc": stamp,
                "base_head": head,
                "items": items,
                "buckets": {k: sorted(v) for k, v in by_bucket.items()},
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    closure = {
        "schema": "traveltrust.g_rc_closed_owner_declaration.v1",
        "recorded_utc": stamp,
        "g_rc_closed": True,
        "source": "Owner_declaration_session",
        "note": (
            "Owner declared G-RC CLOSED = TRUE; CDR-19 Dirty Audit started; "
            "Clean Deploy still LOCKED until CDR-19 PASS"
        ),
        "cdr19_phase": "Dirty_Audit_COMPLETE_await_Scope_confirm",
        "clean_deploy": "LOCKED",
    }
    (out_dir / "G-RC-CLOSED-OWNER-DECLARATION-LATEST.json").write_text(
        json.dumps(closure, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    cdr19 = {
        "schema": "traveltrust.cdr19_release_identity_closure.v1",
        "id": "CDR-19",
        "recorded_utc": stamp,
        "status": "IN_PROGRESS_DIRTY_AUDIT_DONE_AWAIT_SCOPE_CONFIRM",
        "g_rc_closed": True,
        "phase": "Release_Scope_Classification",
        "completed_steps": ["Dirty_Audit"],
        "pending_steps": [
            "Release_Scope_Classification_Owner_confirm",
            "Commit",
            "Release_SHA_Pin",
            "Artifact_Bytecode_Evidence_Binding",
            "CDR19_PASS",
        ],
        "dirty_audit": summary,
        "equivalence_target": "Source_SHA = Deploy_Artifact = Contract_Bytecode = Evidence_Package",
        "clean_deploy": "LOCKED_until_CDR19_PASS",
        "verdict": "CDR19_IN_PROGRESS_SCOPE_CONFIRM_REQUIRED",
    }
    (out_dir / "CDR-19-RELEASE-IDENTITY-CLOSURE-LATEST.json").write_text(
        json.dumps(cdr19, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (out_dir / "WAIT-WINDOW-HOLD-LATEST.json").write_text(
        json.dumps(
            {
                "schema": "traveltrust.wait_window_stance.v1",
                "recorded_utc": stamp,
                "status": "G_RC_CLOSED_CDR19_IN_PROGRESS",
                "g_rc": "CLOSED",
                "cdr19": "IN_PROGRESS_AWAIT_SCOPE_CONFIRM",
                "clean_deploy": "LOCKED",
                "psg_completion": "NOT_STARTED",
                "verdict": "G_RC_CLOSED_CDR19_SCOPE_CONFIRM_REQUIRED",
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    wp = ROOT / "registry/psg-fcg-pay01-g-rc-wait-window-s1-arm.v1.yaml"
    wd = yaml.safe_load(wp.read_text(encoding="utf-8"))
    wd["recorded_utc"] = stamp
    wd["status"] = "G_RC_CLOSED_CDR19_IN_PROGRESS"
    wd["g_rc_status"] = "CLOSED"
    wd["g_rc_closed"] = True
    wd["g_rc_closed_source"] = "Owner_declaration_session"
    wd["cdr19_status"] = "IN_PROGRESS_AWAIT_SCOPE_CONFIRM"
    wd["clean_deploy"] = "LOCKED"
    wd["sole_wait_event"] = "Owner_confirm_Release_Scope_for_CDR19"
    wd["next_state_change_only"] = (
        "Release_Scope_confirm → Commit → SHA Pin → Binding → PASS → Clean Deploy"
    )
    cri = wd.setdefault("cdr19_release_identity", {})
    cri["status"] = "IN_PROGRESS"
    cri["phase"] = "Release_Scope_Classification"
    cri["dirty_audit_counts"] = proposed_counts
    cri["execution_forbidden_until_g_rc_closed"] = False
    cri["commit_pin_forbidden_until_g_rc_closed"] = False
    cri["clean_deploy_forbidden_until_cdr19_pass"] = True
    wp.write_text(yaml.safe_dump(wd, allow_unicode=True, sort_keys=False), encoding="utf-8")

    cp = ROOT / "registry/psg-protocol-v2-clean-deploy-ready-checklist.v1.yaml"
    cl = yaml.safe_load(cp.read_text(encoding="utf-8"))
    cl["recorded_utc"] = stamp
    cl["status"] = "G_RC_CLOSED_CDR19_IN_PROGRESS_CLEAN_DEPLOY_LOCKED"
    cl["g_rc_closed"] = True
    cl["clean_deploy"] = "LOCKED"
    ri = cl.setdefault("release_identity", {})
    ri["status"] = "IN_PROGRESS"
    ri["phase"] = "Release_Scope_Classification"
    ri["dirty_audit_counts"] = proposed_counts
    for x in cl.get("checklist") or []:
        if isinstance(x, dict) and x.get("id") == "CDR-19":
            x["ready"] = False
            x["blocker"] = "Owner_Release_Scope_confirm"
            x["phase"] = "Release_Scope_Classification"
    cp.write_text(yaml.safe_dump(cl, allow_unicode=True, sort_keys=False), encoding="utf-8")

    mp = ROOT / "registry/psg-production-completion-matrix.v1.yaml"
    md = yaml.safe_load(mp.read_text(encoding="utf-8"))
    md["recorded_utc"] = stamp
    md["dual_gates_before_financial_protocol_deploy"] = {
        "G_RC": {"concern": "Governance_Authorization", "status": "CLOSED"},
        "CDR_19": {
            "concern": "Release_Authenticity",
            "status": "IN_PROGRESS_AWAIT_SCOPE_CONFIRM",
        },
        "Clean_Deploy": "LOCKED",
        "both_required": True,
    }
    mp.write_text(yaml.safe_dump(md, allow_unicode=True, sort_keys=False), encoding="utf-8")

    print(json.dumps({"verdict": summary["verdict"], "dirty": len(items), "counts": proposed_counts, "fcg_related": len(fcg_related), "head": head[:12]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
