#!/usr/bin/env python3
"""V9_WAITING_ETA_REPOSITORY_AND_DOCUMENTATION_DEEP_CLEAN.

Dual truth (hard split):
  A. PRODUCT / WEBSITE / CMS / ADMIN / UX / BUSINESS → Official OPS-v9 living pin only.
  B. WEB3 / CONTRACT / TOKEN / GOVERNANCE / MONEY PATH → FTB + V9 Freeze + Candidate + chain evidence.
  C. Mainnet Reality → then update Official www Web3 (not before).

ETA / Sepolia Reality has highest preempt priority — abort non-essential work when EXECUTABLE.

Outputs (evidence/GO_v9_waiting_eta_deep_clean/):
  - C0_SAFETY_FREEZE_LATEST.json
  - REPOSITORY_INVENTORY_LATEST.json
  - REPOSITORY_HYGIENE_REPORT_LATEST.json
  - DOCUMENTATION_TRUTH_MATRIX_LATEST.json
  - RESIDUAL_REPORT_LATEST.json
  - V9_WAITING_ETA_DEEP_CLEAN_PASS_STOP_LATEST.json (on full PASS)
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "evidence/GO_v9_waiting_eta_deep_clean"
REGISTRY = ROOT / "registry/v9-waiting-eta-deep-clean.v1.yaml"
RUNBOOK = ROOT / "docs/runbook/TT-V9-WAITING-ETA-REPOSITORY-DOCUMENTATION-DEEP-CLEAN-LATEST.md"
DOC_TRUTH_GATE = ROOT / "scripts/dev/run-ttg-v9-doc-truth-convergence-gate.py"
PROBE_SH = ROOT / "scripts/dev/probe-ttg-v9-sepolia-timelock-reality-status.sh"

OFFICIAL_OPS_SHA = "3e356617a498b0faac42e4ae457343d36294a770"
AUDIT_1_CANDIDATE_SHA = "b19b85810c22677d243a82d06ebec8ebcb4d4b47"
READY_AT_UNIX = 1787408352

KEEP_WORKTREES = {
    str(ROOT.resolve()),
    str((ROOT.parent / "TravelTrust-official-ops-v9-release").resolve()),
}

KEEP_BRANCHES = {
    "main",
    "release/official-ops-v9-product-ssot",
    "release/official-ops-v9-workspace-baseline",
}

CANDIDATE_DIFF_EXCLUDE = {
    "contracts/src/ttg-v9/TtgV9PeripheryGovernanceSepoliaRehearsal.s.sol",
}

EVIDENCE_PROTECT_GLOBS = (
    "*PASS_STOP*",
    "*PASS.json",
    "*_PASS.json",
    "*AUTHORIZATION*",
    "*AUDIT*PASS*",
    "sepolia-reality.addresses.env",
    "SEPOLIA_TIMELOCK_REALITY_STATUS_LATEST.json",
    "SEPOLIA_REALITY*",
    "V9_AI_AUDIT*",
    "V9_OWNER_SEPOLIA*",
    "V9_PERIPHERY_GOVERNANCE*PASS*",
    "OFFICIAL_FIRST*PASS*",
)

BUILD_CLEAN_DIRS = [
    ROOT / "target",
    ROOT / "frontend" / ".next",
    ROOT / "frontend" / "coverage",
    ROOT / "frontend" / "playwright-report",
    ROOT / "frontend" / "test-results",
    ROOT / "coverage",
    ROOT / ".pytest_cache",
]

DOC_MATRIX_SEEDS: list[tuple[str, str, str]] = [
    # path_glob_or_file, plane, default_class
    ("docs/runbook/TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md", "PRODUCT", "ACTIVE"),
    ("docs/runbook/TT-OFFICIAL-FIRST-PRODUCT-CONVERGENCE-FROZEN-LATEST.md", "PRODUCT", "ACTIVE"),
    ("docs/runbook/TT-OFFICIAL-FIRST-FULL-CONVERGENCE-LATEST.md", "PRODUCT", "ACTIVE"),
    ("docs/runbook/TT-FINAL-TRUTH-BASELINE-LATEST.md", "WEB3", "ACTIVE"),
    ("docs/runbook/TT-TTG-V9-PERIPHERY-GOVERNANCE-UPGRADE-FREEZE-LATEST.md", "WEB3", "ACTIVE"),
    ("docs/runbook/TT-V9-WEB3-MAINLINE-SEPOLIA-REALITY-ACTIVE-LATEST.md", "WEB3", "ACTIVE"),
    ("docs/runbook/TT-TTG-V9-PERIPHERY-GOVERNANCE-SEPOLIA-REALITY-WAITING-ETA-LATEST.md", "WEB3", "V9_TARGET"),
    ("docs/runbook/TT-TTG-V9-PERIPHERY-SEPOLIA-ETA-OPS-CHECKLIST-LATEST.md", "WEB3", "ACTIVE"),
    ("docs/runbook/TT-TRAVELTRUST-DUAL-TRUTH-PLANES-LATEST.md", "CONSTITUTION", "ACTIVE"),
    ("docs/runbook/TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md", "WEB3", "ACTIVE"),
    ("docs/runbook/TT-TTG-V9-OWNER-MAINNET-CUTOVER-FINAL-REVIEW-DESIGN-LOCK-LATEST.md", "WEB3", "V9_TARGET"),
    ("docs/github-official/README.md", "PRODUCT", "ACTIVE"),
    ("docs/github-official/PUBLIC-README.md", "PRODUCT", "ACTIVE"),
    ("docs/github-official/en/TTG-V9.md", "WEB3", "V9_TARGET"),
    ("docs/github-official/zh/TTG-V9.md", "WEB3", "V9_TARGET"),
    ("docs/github-official/en/Mainnet-Deployments.md", "WEB3", "V9_TARGET"),
    ("docs/github-official/zh/Mainnet-Deployments.md", "WEB3", "V9_TARGET"),
    ("docs/spec/83-区域治理与收益分配-协议白皮书.md", "WEB3", "V9_TARGET"),
    ("registry/traveltrust-dual-truth-planes.v1.yaml", "CONSTITUTION", "ACTIVE"),
    ("registry/ttg-v9-periphery-governance-upgrade-freeze.v1.yaml", "WEB3", "ACTIVE"),
    ("registry/official-first-product-convergence-frozen.v1.yaml", "PRODUCT", "ACTIVE"),
    ("registry/ttg-v9-github-official-alignment.v1.yaml", "WEB3", "ACTIVE"),
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def run(cmd: list[str], *, check: bool = True) -> str:
    proc = subprocess.run(
        cmd,
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
    )
    out = (proc.stdout or "") + (proc.stderr or "")
    if check and proc.returncode != 0:
        raise subprocess.CalledProcessError(proc.returncode, cmd, output=out)
    return out.strip()


def run_probe() -> dict[str, Any]:
    out = run(["bash", str(PROBE_SH)], check=False)
    state = "UNKNOWN"
    ready_at = READY_AT_UNIX
    remain = None
    for line in out.splitlines():
        if line.startswith("PROBE_TIMELOCK:"):
            m_state = re.search(r"state=(\w+)", line)
            m_ready = re.search(r"ready_at=(\d+)", line)
            m_rem = re.search(r"remain=(\d+)s", line)
            if m_state:
                state = m_state.group(1)
            if m_ready:
                ready_at = int(m_ready.group(1))
            if m_rem:
                remain = int(m_rem.group(1))
    return {"state": state, "ready_at": ready_at, "remain_seconds": remain, "raw": out}


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def c0_safety_freeze() -> dict[str, Any]:
    head = run(["git", "rev-parse", "HEAD"])
    branch = run(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    worktrees = []
    for line in run(["git", "worktree", "list", "--porcelain"]).split("\n\n"):
        if not line.strip():
            continue
        wt: dict[str, str] = {}
        for ln in line.splitlines():
            if " " in ln:
                k, v = ln.split(" ", 1)
                wt[k] = v
        worktrees.append(wt)

    addresses_env = ROOT / "evidence/GO_ttg_v9_periphery_governance_upgrade/sepolia-reality.addresses.env"
    addresses: dict[str, str] = {}
    if addresses_env.is_file():
        for ln in addresses_env.read_text(encoding="utf-8", errors="replace").splitlines():
            ln = ln.strip()
            if ln and not ln.startswith("#") and "=" in ln:
                k, v = ln.split("=", 1)
                addresses[k.strip()] = v.strip()

    owner_auth = ROOT / "evidence/GO_ttg_v9_periphery_governance_upgrade/V9_OWNER_SEPOLIA_REALITY_AUTHORIZATION.json"
    audit1 = ROOT / "evidence/GO_ttg_v9_periphery_governance_upgrade/V9_AI_AUDIT1_PERIPHERY_GOVERNANCE_UPGRADE_PASS.json"
    timelock_status = ROOT / "evidence/GO_ttg_v9_periphery_governance_upgrade/SEPOLIA_TIMELOCK_REALITY_STATUS_LATEST.json"

    probe = run_probe()

    freeze = {
        "stamp": "V9_WAITING_ETA_C0_SAFETY_FREEZE",
        "recorded_utc": utc_now(),
        "git": {"head": head, "branch": branch},
        "official_ops_v9_sha": OFFICIAL_OPS_SHA,
        "audit_1_candidate_sha": AUDIT_1_CANDIDATE_SHA,
        "ready_at_unix": probe.get("ready_at", READY_AT_UNIX),
        "timelock_probe": probe,
        "worktrees": worktrees,
        "sepolia_addresses": addresses,
        "protected_evidence": {
            "owner_authorization": str(owner_auth.relative_to(ROOT)) if owner_auth.is_file() else None,
            "audit_1_pass": str(audit1.relative_to(ROOT)) if audit1.is_file() else None,
            "timelock_status": str(timelock_status.relative_to(ROOT)) if timelock_status.is_file() else None,
        },
        "forbidden": [
            "delete_active_v9_candidate",
            "delete_pass_stop_evidence",
            "modify_candidate_solidity",
            "production_deploy",
            "exact_match",
            "flip_tt_production_go",
        ],
    }
    write_json(EVIDENCE / "C0_SAFETY_FREEZE_LATEST.json", freeze)
    return freeze


def inventory_git() -> dict[str, Any]:
    local_branches = [b.strip().lstrip("* ").strip() for b in run(["git", "branch"]).splitlines()]
    merged = [b.strip() for b in run(["git", "branch", "--merged", "HEAD"]).splitlines()]
    merged = [b.lstrip("* ").strip() for b in merged if b.strip()]

    stale_local = [
        b for b in local_branches if b not in KEEP_BRANCHES and b in merged and b != "main"
    ]

    worktree_lines = run(["git", "worktree", "list"]).splitlines()
    worktrees = []
    stale_worktrees: list[str] = []
    for ln in worktree_lines:
        parts = ln.split()
        if not parts:
            continue
        path = parts[0]
        entry = {"path": path, "line": ln}
        worktrees.append(entry)
        norm = str(Path(path).resolve())
        if norm not in KEEP_WORKTREES and "+" not in ln:
            stale_worktrees.append(path)

    tags_sample = run(["git", "tag", "-l", "--sort=-creatordate"]).splitlines()[:30]

    return {
        "local_branches": local_branches,
        "merged_branches": merged,
        "stale_local_branches": stale_local,
        "worktrees": worktrees,
        "stale_worktrees": stale_worktrees,
        "recent_tags": tags_sample,
        "remote_heads_sample": run(["git", "branch", "-r"]).splitlines()[:40],
    }


def _evidence_protected(path: Path) -> bool:
    name = path.name
    for pat in EVIDENCE_PROTECT_GLOBS:
        if Path(name).match(pat):
            return True
    if "GO_ttg_v9" in str(path) and name.endswith("_LATEST.json"):
        return True
    if "GO_official_product" in str(path) and "PASS" in name:
        return True
    return False


def inventory_scratch() -> dict[str, Any]:
    tmp_files = sorted(ROOT.glob("evidence/.tmp-*"))
    scratch_named = sorted(ROOT.glob("evidence/**/*scratch*"))
    delete_safe = [str(p.relative_to(ROOT)).replace("\\", "/") for p in tmp_files]
    protected_hits = [
        str(p.relative_to(ROOT)).replace("\\", "/")
        for p in scratch_named
        if _evidence_protected(p)
    ]
    return {
        "evidence_dot_tmp_count": len(tmp_files),
        "delete_safe_dot_tmp": delete_safe,
        "scratch_named_protected": protected_hits,
    }


def inventory_build() -> dict[str, Any]:
    rows = []
    for d in BUILD_CLEAN_DIRS:
        if d.is_dir():
            try:
                size = sum(f.stat().st_size for f in d.rglob("*") if f.is_file())
            except OSError:
                size = -1
            rows.append({"path": str(d.relative_to(ROOT)), "exists": True, "bytes": size, "class": "DELETE_SAFE"})
        else:
            rows.append({"path": str(d.relative_to(ROOT)), "exists": False, "bytes": 0, "class": "DELETE_SAFE"})
    return {"build_cache_dirs": rows}


def candidate_solidity_diff() -> dict[str, Any]:
    exclude_args = [f":!{p}" for p in CANDIDATE_DIFF_EXCLUDE]
    diff_names = run(
        [
            "git",
            "diff",
            "--name-only",
            AUDIT_1_CANDIDATE_SHA,
            "HEAD",
            "--",
            "contracts/src/ttg-v9/",
            *exclude_args,
            "contracts/test/ttg-v9/",
        ],
        check=False,
    ).splitlines()
    diff_names = [n for n in diff_names if n.strip()]
    return {
        "audit_1_candidate_sha": AUDIT_1_CANDIDATE_SHA,
        "excluded_deploy_runner": sorted(CANDIDATE_DIFF_EXCLUDE),
        "diff_files": diff_names,
        "candidate_solidity_diff": len(diff_names),
    }


def apply_safe_deletes(scratch: dict[str, Any], apply_build: bool) -> list[str]:
    deleted: list[str] = []
    for rel in scratch.get("delete_safe_dot_tmp", []):
        p = ROOT / rel
        if p.is_file():
            p.unlink()
            deleted.append(rel)
    if apply_build:
        for row in inventory_build()["build_cache_dirs"]:
            if not row["exists"]:
                continue
            p = ROOT / row["path"]
            if p.is_dir():
                shutil.rmtree(p, ignore_errors=True)
                deleted.append(row["path"] + "/")
    return deleted


def run_doc_truth_gate() -> dict[str, Any]:
    if not DOC_TRUTH_GATE.is_file():
        return {"error": "missing_doc_truth_gate", "documentation_truth_conflicts": -1}
    proc = subprocess.run(
        [sys.executable, str(DOC_TRUTH_GATE)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    payload: dict[str, Any] = {"exit_code": proc.returncode, "stdout_tail": proc.stdout[-2000:]}
    pass_json = ROOT / "evidence/GO_ttg_v9_audit/V9_DOCUMENTATION_FULL_CONVERGENCE_PASS.json"
    if pass_json.is_file():
        try:
            payload["gate"] = json.loads(pass_json.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            payload["gate_read_error"] = True
    residue = sum(
        payload.get("gate", {}).get("residue", {}).get(k, 0)
        for k in (
            "OLD_V9_ACTIVE_DOCUMENT_REFERENCES",
            "fully_active_premature",
            "R2_FINAL_unmarked",
            "globalStakers_unmarked",
            "safe_v9_admin_unmarked",
            "sale_to_p4cap_unmarked",
        )
    )
    payload["documentation_truth_conflicts"] = residue
    return payload


def classify_doc(path: Path, plane: str, default: str) -> dict[str, Any]:
    rel = str(path.relative_to(ROOT)).replace("\\", "/")
    text = ""
    if path.is_file():
        try:
            text = path.read_text(encoding="utf-8", errors="replace")[:8000]
        except OSError:
            text = ""
    doc_class = default
    if re.search(r"\bSUPERSEDED\b", text[:2000], re.I):
        doc_class = "SUPERSEDED"
    elif re.search(r"\bHISTORICAL\b|\bLEGACY\b|DO_NOT_USE", text[:2000], re.I):
        doc_class = "HISTORICAL"
    elif re.search(r"V9_TARGET|TARGET\b|DEPLOYED_PENDING_CUTOVER|TIMELOCK_CUTOVER_PENDING", text[:2000], re.I):
        doc_class = "V9_TARGET"
    elif re.search(r"\bACTIVE\b|LIVING|FROZEN.*ACTIVE", text[:2000], re.I):
        doc_class = "ACTIVE"
    return {
        "path": rel,
        "plane": plane,
        "class": doc_class,
        "exists": path.is_file(),
    }


def build_documentation_truth_matrix() -> dict[str, Any]:
    rows = []
    seen: set[str] = set()
    for spec, plane, default in DOC_MATRIX_SEEDS:
        p = ROOT / spec
        if spec in seen:
            continue
        seen.add(spec)
        rows.append(classify_doc(p, plane, default))

    for p in sorted((ROOT / "docs/runbook").glob("TT-*-LATEST.md")):
        rel = str(p.relative_to(ROOT)).replace("\\", "/")
        if rel in seen:
            continue
        seen.add(rel)
        plane = "WEB3" if "TTG-V9" in p.name or "WEB3" in p.name or "FINAL-TRUTH" in p.name else "PRODUCT"
        if "DUAL-TRUTH" in p.name or "CONVERGENCE" in p.name:
            plane = "CONSTITUTION"
        rows.append(classify_doc(p, plane, "ACTIVE"))

    for p in sorted((ROOT / "registry").glob("*.yaml")):
        rel = str(p.relative_to(ROOT)).replace("\\", "/")
        if rel in seen:
            continue
        seen.add(rel)
        plane = "WEB3" if "ttg-v9" in p.name or "web3" in p.name else "PRODUCT"
        if "dual-truth" in p.name:
            plane = "CONSTITUTION"
        rows.append(classify_doc(p, plane, "ACTIVE"))

    active_latest_count = sum(1 for r in rows if r["class"] == "ACTIVE" and "LATEST" in r["path"])
    return {
        "stamp": "DOCUMENTATION_TRUTH_MATRIX",
        "recorded_utc": utc_now(),
        "dual_truth": {
            "product_ssot": f"Official OPS-v9 ({OFFICIAL_OPS_SHA[:12]}…)",
            "web3_ssot": f"FTB + V9 Freeze + Candidate {AUDIT_1_CANDIDATE_SHA[:12]}… + chain evidence",
            "official_web3_display": "LEGACY/PENDING_UPDATE until Mainnet Reality",
        },
        "entries": rows,
        "entry_count": len(rows),
        "active_latest_marked": active_latest_count,
    }


def active_pointer_conflicts() -> int:
    """Count registry YAML files claiming status: ACTIVE for same machine_key family."""
    conflicts = 0
    keys: dict[str, list[str]] = {}
    for p in (ROOT / "registry").glob("*.yaml"):
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if re.search(r"^status:\s*ACTIVE\b", text, re.M) and "LATEST" not in p.name:
            m = re.search(r"machine_key:\s*(\S+)", text)
            key = m.group(1) if m else p.stem
            keys.setdefault(key, []).append(str(p.relative_to(ROOT)))
    for _k, paths in keys.items():
        if len(paths) > 1:
            conflicts += len(paths) - 1
    return conflicts


def git_porcelain_clean() -> bool:
    return len(run(["git", "status", "--porcelain"]).splitlines()) == 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply-safe-clean", action="store_true", help="Delete evidence/.tmp-* and optional build caches")
    ap.add_argument("--apply-build-clean", action="store_true", help="With --apply-safe-clean, also remove target/.next/etc.")
    ap.add_argument("--skip-eta-preempt-check", action="store_true", help="Do not abort when timelock EXECUTABLE")
    args = ap.parse_args()

    EVIDENCE.mkdir(parents=True, exist_ok=True)

    freeze = c0_safety_freeze()
    probe_state = freeze["timelock_probe"]["state"]
    if probe_state == "EXECUTABLE" and not args.skip_eta_preempt_check:
        print("ETA_PREEMPT: timelock EXECUTABLE — abort deep clean; run SEPOLIA_REALITY resume", file=sys.stderr)
        return 2

    git_inv = inventory_git()
    scratch = inventory_scratch()
    build_inv = inventory_build()
    cand = candidate_solidity_diff()

    deleted: list[str] = []
    if args.apply_safe_clean:
        deleted = apply_safe_deletes(scratch, args.apply_build_clean)
        scratch = inventory_scratch()

    doc_gate = run_doc_truth_gate()
    matrix = build_documentation_truth_matrix()

    stale_branches = len(git_inv["stale_local_branches"])
    stale_worktrees = len(git_inv["stale_worktrees"])
    unreferenced_scratch = scratch["evidence_dot_tmp_count"]
    doc_conflicts = int(doc_gate.get("documentation_truth_conflicts", -1))
    pointer_conflicts = active_pointer_conflicts()
    cand_diff = cand["candidate_solidity_diff"]

    inventory = {
        "stamp": "REPOSITORY_INVENTORY",
        "recorded_utc": utc_now(),
        "git": git_inv,
        "scratch": scratch,
        "build": build_inv,
        "candidate_solidity": cand,
        "deleted_this_run": deleted,
    }
    write_json(EVIDENCE / "REPOSITORY_INVENTORY_LATEST.json", inventory)

    hygiene_pass = (
        stale_branches == 0
        and stale_worktrees == 0
        and unreferenced_scratch == 0
        and cand_diff == 0
    )

    hygiene_report = {
        "stamp": "REPOSITORY_HYGIENE_REPORT",
        "recorded_utc": utc_now(),
        "metrics": {
            "REPOSITORY_HYGIENE": "PASS" if hygiene_pass else "FAIL",
            "STALE_BRANCHES_WORKTREES": stale_branches + stale_worktrees,
            "UNREFERENCED_SCRATCH": unreferenced_scratch,
            "CANDIDATE_SOLIDITY_DIFF": cand_diff,
            "deleted_paths_count": len(deleted),
        },
        "stale_local_branches": git_inv["stale_local_branches"],
        "stale_worktrees": git_inv["stale_worktrees"],
        "timelock_probe_state": probe_state,
        "worktree_clean": stale_worktrees == 0,
    }
    write_json(EVIDENCE / "REPOSITORY_HYGIENE_REPORT_LATEST.json", hygiene_report)
    write_json(EVIDENCE / "DOCUMENTATION_TRUTH_MATRIX_LATEST.json", matrix)

    porcelain_clean = git_porcelain_clean()
    full_pass = (
        hygiene_pass
        and doc_conflicts == 0
        and pointer_conflicts == 0
        and porcelain_clean
    )

    residual = {
        "stamp": "RESIDUAL_REPORT",
        "recorded_utc": utc_now(),
        "residual": {
            "STALE_BRANCHES_WORKTREES": stale_branches + stale_worktrees,
            "UNREFERENCED_SCRATCH": unreferenced_scratch,
            "DOCUMENTATION_TRUTH_CONFLICTS": doc_conflicts,
            "ACTIVE_POINTER_CONFLICTS": pointer_conflicts,
            "CANDIDATE_SOLIDITY_DIFF": cand_diff,
            "GIT_PORCELAIN_LINES": len(run(["git", "status", "--porcelain"]).splitlines()),
        },
        "target_zeros": {
            "STALE_BRANCHES_WORKTREES": 0,
            "UNREFERENCED_SCRATCH": 0,
            "DOCUMENTATION_TRUTH_CONFLICTS": 0,
            "ACTIVE_POINTER_CONFLICTS": 0,
            "CANDIDATE_SOLIDITY_DIFF": 0,
            "GIT_PORCELAIN": 0,
        },
        "residual_zero": full_pass,
        "notes": [
            "PRODUCT plane follows Official OPS-v9; WEB3 plane follows FTB+V9 Candidate+evidence.",
            "Official www Web3 copy must not overwrite Candidate; mark LEGACY/PENDING_UPDATE only.",
            "Do not claim Mainnet LIVE from Sepolia Candidate state in whitepapers.",
        ],
    }
    write_json(EVIDENCE / "RESIDUAL_REPORT_LATEST.json", residual)

    pass_stop = {
        "stamp": "V9_WAITING_ETA_DEEP_CLEAN_PASS_STOP",
        "recorded_utc": utc_now(),
        "program": "V9_WAITING_ETA_REPOSITORY_AND_DOCUMENTATION_DEEP_CLEAN",
        "status": "PASS_STOP" if full_pass else "BLOCKED",
        "metrics": {
            "REPOSITORY_HYGIENE": hygiene_report["metrics"]["REPOSITORY_HYGIENE"],
            "STALE_BRANCHES_WORKTREES": stale_branches + stale_worktrees,
            "UNREFERENCED_SCRATCH": unreferenced_scratch,
            "DOCUMENTATION_TRUTH_CONFLICTS": doc_conflicts,
            "ACTIVE_POINTER_CONFLICTS": pointer_conflicts,
            "CANDIDATE_SOLIDITY_DIFF": cand_diff,
            "WORKTREE": "CLEAN" if stale_worktrees == 0 else "DIRTY",
            "GIT_PORCELAIN": "CLEAN" if porcelain_clean else "DIRTY",
        },
        "c0_freeze": str((EVIDENCE / "C0_SAFETY_FREEZE_LATEST.json").relative_to(ROOT)),
        "timelock_state": probe_state,
        "tt_production_go": "NO_GO",
        "forbidden_this_program": [
            "production_modify",
            "candidate_solidity_modify",
            "exact_match",
            "mainnet_broadcast",
            "flip_tt_production_go",
        ],
    }
    write_json(EVIDENCE / "V9_WAITING_ETA_DEEP_CLEAN_PASS_STOP_LATEST.json", pass_stop)

    # Machine registry + runbook stub refresh
    REGISTRY.write_text(
        f"""# V9 waiting-ETA deep clean — machine SSOT
schema: traveltrust.v9_waiting_eta_deep_clean.v1
status: {"PASS_STOP" if full_pass else "IN_PROGRESS"}
recorded_utc: "{utc_now()}"
program: V9_WAITING_ETA_REPOSITORY_AND_DOCUMENTATION_DEEP_CLEAN
tt_production_go: NO_GO
audit_1_candidate_sha: "{AUDIT_1_CANDIDATE_SHA}"
official_ops_v9_sha: "{OFFICIAL_OPS_SHA}"
ready_at_unix: {freeze.get("ready_at_unix", READY_AT_UNIX)}
timelock_probe_state: {probe_state}
dual_truth_registry: registry/traveltrust-dual-truth-planes.v1.yaml
evidence_dir: evidence/GO_v9_waiting_eta_deep_clean
runbook: docs/runbook/TT-V9-WAITING-ETA-REPOSITORY-DOCUMENTATION-DEEP-CLEAN-LATEST.md
orchestrator: scripts/dev/run-v9-waiting-eta-repository-documentation-deep-clean.py
metrics:
  REPOSITORY_HYGIENE: {hygiene_report["metrics"]["REPOSITORY_HYGIENE"]}
  STALE_BRANCHES_WORKTREES: {stale_branches + stale_worktrees}
  UNREFERENCED_SCRATCH: {unreferenced_scratch}
  DOCUMENTATION_TRUTH_CONFLICTS: {doc_conflicts}
  ACTIVE_POINTER_CONFLICTS: {pointer_conflicts}
  CANDIDATE_SOLIDITY_DIFF: {cand_diff}
eta_preempt: scripts/dev/probe-ttg-v9-sepolia-timelock-reality-status.sh
""",
        encoding="utf-8",
    )

    print(json.dumps(pass_stop["metrics"], indent=2))
    print(f"PASS_STOP status={pass_stop['status']} out={EVIDENCE / 'V9_WAITING_ETA_DEEP_CLEAN_PASS_STOP_LATEST.json'}")
    return 0 if full_pass else 1


if __name__ == "__main__":
    raise SystemExit(main())
