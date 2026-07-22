#!/usr/bin/env python3
"""Patch Promotion Gate · Track B must not become a permanent fork.

Modes:
  check  — validate ledger fields + open-queue policy (safe during FG-15-B)
  plan   — same + write promotion plan evidence
  execute — BLOCK unless FG15_ELAPSED=1 and TRAVELTRUST_PATCH_PROMOTE_EXECUTE_OK=1

  python scripts/dev/run-patch-promotion-gate.py --mode check
  python scripts/dev/run-patch-promotion-gate.py --mode plan

SSOT:
  registry/patch-promotion-gate.v1.yaml
  docs/runbook/TT-PSG-PATCH-PROMOTION-GATE-LATEST.md

Baseline Migration v2: Track A tip = Candidate v2 (PSG-REL-20260720-WEB3-CAND-V2).
FG-15-A 09c72b93 is ARCHIVED_HISTORICAL only.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FREEZE_SHA = "97289a7185610ef0ad8822f0af04bfa533e42986"
PSG_RELEASE = "PSG-REL-20260720-WEB3-CAND-V2"
HISTORICAL_FG15_A_SHA = "09c72b934b62f848e60b38bcc7ff0e6cac44f923"
VALID_CLASSES = {
    "cms_display",
    "bug_fix",
    "api_behavior_change",
    "financial_logic",
    "contract_or_permissions",
    "ops_gate_docs",
}
VALID_PROMO_STATUS = {
    "OPEN",
    "PLAN_RECORDED",
    "PROMOTED",
    "SUPERSEDED",
    "BLOCKED_FG15",
}
MAX_OPEN = 12


def parse_patches(yaml_text: str) -> list[dict]:
    """
Minimal YAML scrape for patches: list under patches:."""
    patches: list[dict] = []
    current: dict | None = None
    in_patches = False
    for line in yaml_text.splitlines():
        if re.match(r"^patches:\s*$", line):
            in_patches = True
            continue
        if in_patches and re.match(r"^[a-zA-Z_]", line) and not line.startswith(" "):
            if current:
                patches.append(current)
            current = None
            break
        if not in_patches:
            continue
        m_id = re.match(r"^\s+-\s+id:\s+(\S+)", line)
        if m_id:
            if current:
                patches.append(current)
            current = {"id": m_id.group(1).strip()}
            continue
        if current is None:
            continue
        m_kv = re.match(r"^\s{4}([a-z0-9_]+):\s*(.*)$", line)
        if m_kv:
            key, val = m_kv.group(1), m_kv.group(2).strip().strip("\"'")
            if val in ("true", "false"):
                current[key] = val == "true"
            else:
                current[key] = val
    if current:
        patches.append(current)
    return patches


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", default="check", choices=["check", "plan", "execute", "dry-run"])
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    if args.mode == "dry-run":
        # Delegate to dedicated Promotion dry-run (no mint / no deploy / no execute)
        import subprocess

        rc = subprocess.call(
            [sys.executable, str(ROOT / "scripts/dev/run-psg-promotion-dry-run.py")],
            cwd=str(ROOT),
        )
        return rc

    if os.environ.get("SKIP_PATCH_PROMOTION_GATE") == "1":
        print("patch-promotion-gate: SKIP (SKIP_PATCH_PROMOTION_GATE=1)")
        return 0

    queue_path = ROOT / "registry/staging-patch-queue.v1.yaml"
    text = queue_path.read_text(encoding="utf-8") if queue_path.exists() else ""
    patches = parse_patches(text)

    checks: list[dict] = []
    failed: list[dict] = []

    def add(cid: str, ok: bool, **extra):
        row = {"id": cid, "pass": ok, **extra}
        checks.append(row)
        if not ok:
            failed.append(row)

    add("queue_file_present", queue_path.exists(), path=str(queue_path))
    add("patches_non_empty", len(patches) > 0, count=len(patches))

    required = [
        "scope",
        "code_sha_or_worktree",
        "impacts_psg",
        "impacts_fg_or_web3",
        "verification_result",
        "merge_into_release",
        "promotion_class",
        "promotion_status",
    ]
    incomplete = []
    for p in patches:
        missing = [k for k in required if k not in p or p.get(k) in ("", None)]
        cls = p.get("promotion_class")
        st = p.get("promotion_status")
        if missing or (cls and cls not in VALID_CLASSES) or (st and st not in VALID_PROMO_STATUS):
            incomplete.append(
                {
                    "id": p.get("id"),
                    "missing": missing,
                    "promotion_class": cls,
                    "promotion_status": st,
                }
            )

    add(
        "promotion_fields_complete",
        len(incomplete) == 0,
        incomplete=incomplete,
        remediation="fill promotion_* fields in registry/staging-patch-queue.v1.yaml + Ledger",
    )

    open_like = [
        p
        for p in patches
        if p.get("promotion_status") in ("OPEN", "PLAN_RECORDED", "BLOCKED_FG15", None)
        or p.get("merge_into_release") in (False, "false", "No", "NO", "DEFERRED_TO_NEXT_RC")
    ]
    # Prefer explicit promotion_status when present
    open_explicit = [
        p
        for p in patches
        if p.get("promotion_status") in ("OPEN", "PLAN_RECORDED", "BLOCKED_FG15")
    ]
    open_count = len(open_explicit) if any(p.get("promotion_status") for p in patches) else len(open_like)
    add(
        "open_queue_within_cap",
        open_count <= MAX_OPEN,
        open_count=open_count,
        max_open=MAX_OPEN,
        remediation="promote or SUPERSEDE stale patches — Track B must not accumulate forever",
    )

    # Anti-claim: no patch may claim it replaced freeze certification
    bad_claim = [
        p["id"]
        for p in patches
        if str(p.get("replaces_certification_freeze", "")).lower() in ("true", "1", "yes")
    ]
    add(
        "no_patch_replaces_cert_freeze",
        len(bad_claim) == 0,
        bad=bad_claim,
        freeze_sha=FREEZE_SHA,
    )

    if args.mode == "execute":
        fg_elapsed = os.environ.get("FG15_ELAPSED") == "1"
        owner_ok = os.environ.get("TRAVELTRUST_PATCH_PROMOTE_EXECUTE_OK") == "1"
        add(
            "execute_allowed_only_post_fg15",
            fg_elapsed and owner_ok,
            FG15_ELAPSED=fg_elapsed,
            TRAVELTRUST_PATCH_PROMOTE_EXECUTE_OK=owner_ok,
            remediation=(
                "FG-15 window: do NOT execute promotion. "
                "After ELAPSED: FG15_ELAPSED=1 TRAVELTRUST_PATCH_PROMOTE_EXECUTE_OK=1"
            ),
        )
    else:
        add(
            "fg15_safe_mode",
            True,
            mode=args.mode,
            note="check/plan allowed during FG-15; execute blocked by default",
        )

    pipeline = [
        "STAGING_PATCH",
        "VERIFY_PASS",
        "UPDATE_PSG_LIVING",
        "UPDATE_RELEASE_CANDIDATE",
        "REGENERATE_RELEASE_IDENTITY",
        "ENTER_NEXT_CERTIFICATION",
    ]

    report = {
        "schema": "traveltrust.patch_promotion_gate.v1",
        "recorded_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mode": args.mode,
        "freeze_sha": FREEZE_SHA,
        "pipeline": pipeline,
        "patches_summary": [
            {
                "id": p.get("id"),
                "promotion_class": p.get("promotion_class"),
                "promotion_status": p.get("promotion_status"),
                "merge_into_release": p.get("merge_into_release"),
                "verification_result": p.get("verification_result"),
            }
            for p in patches
        ],
        "checks": checks,
        "verdict": "PASS" if not failed else "BLOCKED",
        "machine_key": "TT_PATCH_PROMOTION_GATE",
        "rule": "Track B is temporary; promote via PSG → RC → Release Identity → next Certification.",
        "fg15_action": {
            "continue": ["sample", "integrity", "anomaly"],
            "forbid": ["redeploy_as_cert", "merge_into_freeze_tip", "change_09c72b93", "execute_promotion"],
        },
    }

    out = args.out
    if not out:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        out_dir = ROOT / "evidence/GO_patch_promotion_gate" / stamp
        out_dir.mkdir(parents=True, exist_ok=True)
        name = (
            "PATCH-PROMOTION-PLAN-LATEST.json"
            if args.mode == "plan"
            else "PATCH-PROMOTION-GATE-LATEST.json"
        )
        out = str(out_dir / name)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "verdict": report["verdict"],
                "mode": args.mode,
                "failed": [c["id"] for c in failed],
                "open_count": open_count,
                "out": out,
            },
            indent=2,
        )
    )
    if failed:
        for c in failed:
            print(
                f"BLOCKED {c['id']}: {c.get('remediation') or c}",
                file=sys.stderr,
            )
        return 2
    print(f"TT_PATCH_PROMOTION_GATE: PASS ({args.mode})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
