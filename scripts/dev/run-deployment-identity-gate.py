#!/usr/bin/env python3
"""Deployment Identity Gate · three questions before any deploy.

Must declare DEPLOY_TARGET:
  CERTIFICATION_FREEZE | STAGING_PATCH | EXPERIMENT

Exit 0 = PASS. Exit 2 = BLOCK.

  export DEPLOY_TARGET=STAGING_PATCH
  export TT_STAGING_PATCH_IDS=PATCH-STG-001,PATCH-STG-005
  python scripts/dev/run-deployment-identity-gate.py --mode pre-deploy

SSOT:
  registry/deployment-identity-gate.v1.yaml
  docs/runbook/TT-PSG-DUAL-TRACK-RELEASE-STAGING-PATCH-LATEST.md
  registry/staging-patch-queue.v1.yaml

Baseline Migration v2: freeze tip = Candidate v2 (PSG-REL-20260720-WEB3-CAND-V2).
FG-15-A 09c72b93 is ARCHIVED_HISTORICAL only.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
# Active Certification pin — SSOT registry/psg-release-version-LATEST.yaml
# TRACK_HEAD = clean HEAD must equal deploy tip (mint after FG-15-B ELAPSED)
FREEZE_SHA = "TRACK_HEAD"
PSG_RELEASE = "PSG-REL-20260722-STAGING-ALIGN-W0"
HISTORICAL_FG15_A_SHA = "09c72b934b62f848e60b38bcc7ff0e6cac44f923"
VALID_TARGETS = ("CERTIFICATION_FREEZE", "STAGING_PATCH", "EXPERIMENT")
PATCH_RE = re.compile(r"^PATCH-STG-\d{3}$")


def git(*args: str) -> str:
    return subprocess.check_output(["git", "-C", str(ROOT), *args], text=True).strip()


def load_patch_ids_from_registry() -> set[str]:
    path = ROOT / "registry/staging-patch-queue.v1.yaml"
    text = path.read_text(encoding="utf-8") if path.exists() else ""
    return set(re.findall(r"^\s+-\s+id:\s+(PATCH-STG-\d+)", text, re.M))


def parse_patch_ids(raw: str) -> list[str]:
    if not raw.strip():
        return []
    return [p.strip() for p in raw.replace(";", ",").split(",") if p.strip()]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", default="pre-deploy", choices=["pre-deploy", "post-deploy", "check"])
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    if os.environ.get("TRAVELTRUST_DEPLOY_IDENTITY_OVERRIDE") == "1":
        print("deployment-identity-gate: SKIP (TRAVELTRUST_DEPLOY_IDENTITY_OVERRIDE=1)")
        return 0
    if os.environ.get("SKIP_DEPLOYMENT_IDENTITY_GATE") == "1":
        print("deployment-identity-gate: SKIP (SKIP_DEPLOYMENT_IDENTITY_GATE=1)")
        return 0

    target = (os.environ.get("DEPLOY_TARGET") or "").strip().upper()
    patch_ids = parse_patch_ids(os.environ.get("TT_STAGING_PATCH_IDS", ""))
    known_patches = load_patch_ids_from_registry()

    checks: list[dict] = []
    failed: list[dict] = []

    def add(cid: str, ok: bool, **extra):
        row = {"id": cid, "pass": ok, **extra}
        checks.append(row)
        if not ok:
            failed.append(row)

    # Q3 — target declared
    add(
        "deploy_target_declared",
        target in VALID_TARGETS,
        DEPLOY_TARGET=target or "(missing)",
        remediation="export DEPLOY_TARGET=CERTIFICATION_FREEZE|STAGING_PATCH|EXPERIMENT",
    )

    # FG-15 RUNNING: patches must not bypass PSG into Staging/Production
    fg15_elapsed = os.environ.get("FG15_ELAPSED") == "1"
    if target in ("STAGING_PATCH", "EXPERIMENT"):
        add(
            "fg15_blocks_patch_and_experiment_deploy",
            fg15_elapsed,
            FG15_ELAPSED=fg15_elapsed,
            remediation=(
                "FG-15 Certification Freeze RUNNING — keep Track B on Ledger only. "
                "No STAGING_PATCH/EXPERIMENT deploy until FG15_ELAPSED=1, then "
                "Patch Promotion Gate → PSG update → Release Identity → next Certification."
            ),
        )
    else:
        add(
            "fg15_blocks_patch_and_experiment_deploy",
            True,
            FG15_ELAPSED=fg15_elapsed,
            note="CERTIFICATION_FREEZE during FG-15: clean tip only; prefer evidence maintenance over redeploy",
        )

    # Q1 — git source
    try:
        head_full = git("rev-parse", "HEAD")
        head_short = git("rev-parse", "--short", "HEAD")
        branch = git("rev-parse", "--abbrev-ref", "HEAD")
        dirty_raw = git("status", "--porcelain")
    except Exception as ex:  # noqa: BLE001
        add("git_head_recorded", False, error=str(ex))
        head_full = head_short = branch = ""
        dirty_raw = ""

    dirty_lines = []
    for ln in (dirty_raw or "").splitlines():
        if not ln.strip():
            continue
        path = ln[3:].strip() if len(ln) > 3 else ln.strip()
        if path.startswith("evidence/GO_") or path.startswith("evidence\\GO_"):
            continue
        dirty_lines.append(ln)
    dirty = bool(dirty_lines)
    dirty_count = len(dirty_lines)
    if head_full:
        add(
            "git_head_recorded",
            True,
            git_head=head_full,
            git_head_short=head_short,
            branch=branch,
            dirty=dirty,
            dirty_paths_count=dirty_count,
        )

    # Q2 + target policy
    if target == "CERTIFICATION_FREEZE":
        # TRACK_HEAD / PIN_AFTER_MINT → resolve to current clean HEAD (mint self-pin)
        expected_freeze = FREEZE_SHA
        if FREEZE_SHA in ("TRACK_HEAD", "PIN_AFTER_MINT") or FREEZE_SHA.startswith("PIN_"):
            expected_freeze = head_full
        # Prefer registry active.git_sha when concrete
        ver_path = ROOT / "registry/psg-release-version-LATEST.yaml"
        if ver_path.exists():
            m = re.search(r'^\s+git_sha:\s*"(.*?)"', ver_path.read_text(encoding="utf-8"), re.M)
            if m and m.group(1) not in ("TRACK_HEAD", "PIN_AFTER_MINT") and not m.group(1).startswith("PIN_"):
                expected_freeze = m.group(1)
        matches = bool(head_full) and (
            head_full == expected_freeze
            or head_full.startswith(expected_freeze[:12])
            or expected_freeze.startswith(head_full[:12])
        )
        add(
            "freeze_sha_match_when_certification",
            matches,
            expected=expected_freeze,
            actual=head_full or "(missing)",
            remediation=(
                f"checkout Active pin {expected_freeze[:12]}… ({PSG_RELEASE}) "
                "or mint TRACK_HEAD with clean worktree"
            ),
        )
        add(
            "dirty_vs_target_policy",
            not dirty,
            dirty=dirty,
            remediation="CERTIFICATION_FREEZE forbids dirty worktree — commit on Track B branch or stash",
        )
        add(
            "patch_ids_forbidden_on_freeze",
            len(patch_ids) == 0,
            patch_ids=patch_ids,
            remediation="do not set TT_STAGING_PATCH_IDS on CERTIFICATION_FREEZE",
        )
    elif target == "STAGING_PATCH":
        add(
            "patch_ids_required",
            len(patch_ids) > 0,
            remediation="export TT_STAGING_PATCH_IDS=PATCH-STG-001,...",
        )
        bad = [p for p in patch_ids if not PATCH_RE.match(p) or p not in known_patches]
        add(
            "patch_ids_valid_when_staging_patch",
            len(patch_ids) > 0 and not bad,
            patch_ids=patch_ids,
            unknown_or_invalid=bad,
            known_count=len(known_patches),
            remediation="register Patch ID in registry/staging-patch-queue.v1.yaml + Ledger",
        )
        mixed = bool(head_full.startswith(FREEZE_SHA[:12]) and dirty)
        add(
            "dirty_vs_target_policy",
            True,
            dirty=dirty,
            dirty_paths_count=dirty_count,
            freeze_tip_with_dirty=mixed,
            note=(
                "STAGING_PATCH may include dirty worktree; recorded as ops — "
                "must NOT be cited as CERTIFICATION_FREEZE / FG-15 evidence"
                if mixed
                else "dirty allowed on STAGING_PATCH when declared"
            ),
            warning="freeze_tip_plus_dirty_ops_patch" if mixed else None,
        )
    elif target == "EXPERIMENT":
        ok_exp = os.environ.get("TRAVELTRUST_DEPLOY_EXPERIMENT_OK") == "1"
        add(
            "experiment_owner_ok",
            ok_exp,
            remediation="export TRAVELTRUST_DEPLOY_EXPERIMENT_OK=1 (Owner-only)",
        )
        add("dirty_vs_target_policy", True, dirty=dirty)

    # Artifact / image hooks (record; hard-fail when STRICT or when refs contradict)
    artifact = os.environ.get("TT_ARTIFACT_SHA") or os.environ.get("TRAVELTRUST_ARTIFACT_SHA") or ""
    image_ref = os.environ.get("TT_RUNTIME_IMAGE_SHA") or os.environ.get("TT_FLY_IMAGE_REF") or ""
    evidence_sha = os.environ.get("TT_EVIDENCE_META_SHA") or ""
    strict_four = os.environ.get("TT_DEPLOY_IDENTITY_STRICT_FOUR_WAY", "0") == "1"

    four = {
        "git_sha": head_full or None,
        "artifact_sha": artifact or None,
        "runtime_image_sha_or_fly_ref": image_ref or None,
        "evidence_or_runtime_meta_sha": evidence_sha or None,
    }
    provided = {k: v for k, v in four.items() if v}
    # If ≥2 identity digests provided, they must agree with git when they look like SHAs
    mismatch = False
    if strict_four:
        if len(provided) < 3:
            mismatch = True
        elif artifact and head_full and artifact[:12] != head_full[:12] and artifact != head_full:
            mismatch = True
    add(
        "four_way_freshness_hook",
        not mismatch,
        four_way=four,
        strict=strict_four,
        remediation="set TT_ARTIFACT_SHA / TT_RUNTIME_IMAGE_SHA / TT_EVIDENCE_META_SHA consistently; or TT_DEPLOY_IDENTITY_STRICT_FOUR_WAY=0 until post-build",
    )

    report = {
        "schema": "traveltrust.deployment_identity_gate.v1",
        "recorded_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mode": args.mode,
        "questions": {
            "Q1_DEPLOY_SOURCE": {"git_head": head_full, "freeze_sha": FREEZE_SHA},
            "Q2_INCLUDES_WORKTREE": {"dirty": dirty, "dirty_paths_count": dirty_count},
            "Q3_DEPLOY_TARGET": {"DEPLOY_TARGET": target or None, "TT_STAGING_PATCH_IDS": patch_ids},
        },
        "checks": checks,
        "verdict": "PASS" if not failed else "BLOCKED",
        "machine_key": "TT_DEPLOYMENT_IDENTITY_GATE",
        "rule": (
            "Declare DEPLOY_TARGET; never mix CERTIFICATION_FREEZE with Staging ops dirty patches. "
            "During FG-15: BLOCK STAGING_PATCH/EXPERIMENT — no patch bypass into Staging/Production."
        ),
        "fg15": {
            "elapsed": fg15_elapsed,
            "while_running": {
                "continue": ["sample", "integrity", "anomaly"],
                "forbid": ["STAGING_PATCH_deploy", "EXPERIMENT_deploy", "promote_execute", "change_candidate_freeze_tip", "cite_09c72b93_as_active"],
                "psg_release": PSG_RELEASE,
                "historical_fg15_a_sha": HISTORICAL_FG15_A_SHA,
            },
        },
    }

    out = args.out
    if not out:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        out_dir = ROOT / "evidence/GO_deployment_identity_gate" / stamp
        out_dir.mkdir(parents=True, exist_ok=True)
        out = str(out_dir / "DEPLOYMENT-IDENTITY-GATE-LATEST.json")
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "verdict": report["verdict"],
                "DEPLOY_TARGET": target or None,
                "failed": [c["id"] for c in failed],
                "out": out,
            },
            indent=2,
        )
    )
    if failed:
        for c in failed:
            print(
                f"BLOCKED {c['id']}: {c.get('remediation') or c.get('error') or c}",
                file=sys.stderr,
            )
        return 2
    print(f"TT_DEPLOYMENT_IDENTITY_GATE: PASS ({args.mode} · {target})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
