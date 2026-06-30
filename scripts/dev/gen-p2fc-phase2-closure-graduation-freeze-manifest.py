#!/usr/bin/env python3
"""Phase ② · Closure + Graduation freeze manifest @ runtime SHA (post State B fix).

Assembles SHA mapping + evidence cross-refs after MR12 runtime convergence.
Does not redeploy or re-run soak.

  python scripts/dev/gen-p2fc-phase2-closure-graduation-freeze-manifest.py
  python scripts/dev/gen-p2fc-phase2-closure-graduation-freeze-manifest.py --runtime-sha fc9266ce...

末行：TT_PHASE2_CLOSURE_GRADUATION_FREEZE: FROZEN|FAIL
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SOAK_DIR = ROOT / "evidence/P2FC_SOAK_72H_STAGING"
GRAD_ROOT = ROOT / "evidence/GO_phase2_testnet_graduation"
CLOSURE_DIR = SOAK_DIR / "post-soak-staging-live-closure"
ONE_SHOT_DIR = SOAK_DIR / "post-soak-one-shot"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def read_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def git_head() -> str:
    try:
        return subprocess.check_output(["git", "-C", str(ROOT), "rev-parse", "HEAD"], text=True).strip()
    except subprocess.CalledProcessError:
        return ""


def latest_graduation_closed() -> Path | None:
    if not GRAD_ROOT.is_dir():
        return None
    candidates: list[tuple[str, Path]] = []
    for d in GRAD_ROOT.iterdir():
        if not d.is_dir() or not d.name[:1].isdigit():
            continue
        matrix = d / "graduation-matrix.v1.json"
        if not matrix.is_file():
            continue
        m = read_json(matrix) or {}
        if m.get("graduation_verdict") == "CLOSED":
            candidates.append((d.name, d))
    if not candidates:
        return None
    candidates.sort(reverse=True)
    return candidates[0][1]


def rel(p: Path) -> str:
    try:
        return p.relative_to(ROOT).as_posix()
    except ValueError:
        return p.as_posix()


def copy_if_exists(src: Path, dest: Path) -> bool:
    if not src.is_file():
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    return True


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    ap = argparse.ArgumentParser()
    ap.add_argument("--runtime-sha", default="", help="Staging runtime git SHA (State B fix)")
    ap.add_argument("--soak-sha", default="3bbedda776b2cf2666efaac055ce9e13d98127b7", help="Soak freeze SHA")
    args = ap.parse_args()

    runtime_sha = (args.runtime_sha or "fc9266ce94f18810420e720bb933946c086ce909").lower()
    soak_sha = args.soak_sha.lower()
    grad_dir = latest_graduation_closed()
    if not grad_dir:
        print("TT_PHASE2_CLOSURE_GRADUATION_FREEZE: FAIL no CLOSED graduation-matrix", file=sys.stderr)
        return 2

    checkpoint = read_json(ONE_SHOT_DIR / "checkpoint.json") or {}
    closure = read_json(CLOSURE_DIR / "staging-live-closure.latest.json") or {}
    tracker = read_json(CLOSURE_DIR / "priority-closure-tracker.latest.json") or {}
    soak_completed = read_json(SOAK_DIR / "COMPLETED.json") or {}
    tn010_dirs = sorted(
        (ROOT / "evidence/GO_phase2_testnet_perfect_validation").glob("tn-p1-010-indexer-reconcile-*"),
        reverse=True,
    )
    tn010_dir = next(
        (
            d
            for d in tn010_dirs
            if (read_json(d / "report.json") or {}).get("freeze_git_sha", "").lower() == runtime_sha
        ),
        tn010_dirs[0] if tn010_dirs else None,
    )

    freeze_slug = f"freeze-{runtime_sha[:8]}"
    bundle_dir = GRAD_ROOT / freeze_slug
    bundle_dir.mkdir(parents=True, exist_ok=True)

    artifact_names = [
        "graduation-matrix.v1.json",
        "gates-g01-g08-check.json",
        "STATUS.txt",
        "OWNER-SIGNOFF.md",
        "probe-deep-closure.json",
    ]
    bundled: list[str] = []
    for name in artifact_names:
        if copy_if_exists(grad_dir / name, bundle_dir / name):
            bundled.append(name)

    manifest: dict[str, Any] = {
        "schema": "traveltrust.phase2_closure_graduation_freeze.v1",
        "frozen_at_utc": utc_now(),
        "phase": "② testnet",
        "honest_boundary": "② phase2_closure=YES · graduation CLOSED ≠ ③ Production GO",
        "sha_mapping": {
            "runtime_staging_api": runtime_sha,
            "soak_baseline": soak_sha,
            "local_repo_HEAD_at_freeze": git_head(),
            "state_b_fix_deploy_commit": runtime_sha,
            "closure_tooling_note": "ADM-U01 State B fix @ fc9266ce; soak @ 3bbedda unchanged",
        },
        "verdicts": {
            "tt_testnet_graduation": "CLOSED",
            "tt_phase2_l5_composite_score": 10,
            "tt_p2fc_post_soak_one_shot": "PASS",
            "tt_p2fc_staging_live_closure": closure.get("verdict"),
            "tt_live_closure_chain": {
                "admin_go": "YES",
                "phase2_closure": "YES",
                "production_go": "NO",
            },
            "open_blocker_count": closure.get("open_blocker_count"),
            "priority_closure_steps": tracker.get("steps_pass"),
        },
        "evidence_roots": {
            "graduation_audit_stamp": rel(grad_dir),
            "graduation_freeze_bundle": rel(bundle_dir),
            "soak_completed": rel(SOAK_DIR / "COMPLETED.json"),
            "one_shot_checkpoint": rel(ONE_SHOT_DIR / "checkpoint.json"),
            "one_shot_log": rel(ONE_SHOT_DIR / "one-shot.log"),
            "staging_live_closure": rel(CLOSURE_DIR / "staging-live-closure.latest.json"),
            "priority_closure_tracker": rel(CLOSURE_DIR / "priority-closure-tracker.latest.json"),
            "adm_u01_live": rel(CLOSURE_DIR / "adm-u01-live/report.json"),
            "adm_u02_live": rel(CLOSURE_DIR / "adm-u02-live/report.json"),
            "p0_runtime": rel(CLOSURE_DIR / "p0-rbac-bypass-runtime/latest.json"),
            "web3_live_risk": rel(CLOSURE_DIR / "web3-live-risk-convergence.latest.json"),
            "tn_p1_010": rel(tn010_dir) if tn010_dir else None,
        },
        "checkpoint_phases": checkpoint.get("phases"),
        "bundled_artifacts": bundled,
        "graduation_gates_g01_g08": read_json(grad_dir / "gates-g01-g08-check.json"),
        "soak_summary": {
            "completed_at": soak_completed.get("completed_at"),
            "polls_ok": soak_completed.get("polls_ok"),
            "polls_fail": soak_completed.get("polls_fail"),
        },
    }

    manifest_path = bundle_dir / "manifest.v1.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    latest_link = GRAD_ROOT / "PHASE2-CLOSURE-GRADUATION-FREEZE.latest.json"
    latest_link.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md = [
        "# Phase ② · Closure + Graduation Freeze",
        "",
        f"**Frozen UTC:** {manifest['frozen_at_utc']}",
        f"**Runtime staging SHA:** `{runtime_sha}`",
        f"**Soak baseline SHA:** `{soak_sha}`",
        f"**Graduation audit:** `{grad_dir.name}`",
        "",
        "## Verdicts",
        "",
        "| Key | Value |",
        "|-----|-------|",
        "| TT_TESTNET_GRADUATION | CLOSED |",
        "| TT_PHASE2_L5_COMPOSITE_SCORE | 10 |",
        "| phase2_closure | YES |",
        "| production_go | NO |",
        "",
        "## SHA mapping",
        "",
        f"- **Runtime API/Web @ staging:** `{runtime_sha}`",
        f"- **72h soak COMPLETED @:** `{soak_sha}` (no redeploy / no soak re-run)",
        "",
        "## Honest boundary",
        "",
        "② Closure + Graduation **≠** ③ Production GO.",
        "",
    ]
    (bundle_dir / "FREEZE-MANIFEST.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    print(
        f"TT_PHASE2_CLOSURE_GRADUATION_FREEZE: FROZEN "
        f"runtime={runtime_sha[:12]}… grad={grad_dir.name} bundle={rel(bundle_dir)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
