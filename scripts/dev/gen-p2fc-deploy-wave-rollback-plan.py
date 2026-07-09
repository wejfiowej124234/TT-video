#!/usr/bin/env python3
"""P2FC · Wave0/Wave1 发布顺序核对 + 回滚预案（只读 · 不 deploy）

  python scripts/dev/gen-p2fc-deploy-wave-rollback-plan.py
  python scripts/dev/gen-p2fc-deploy-wave-rollback-plan.py --capture-fly

末行：TT_DEPLOY_WAVE_ROLLBACK_PLAN: PASS|WARN
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
ACTIVE = ROOT / "evidence/GO_phase2_deploy_backlog/ACTIVE.json"
FREEZE_SHA = "520abf396cce7baf3dcf39f71c1e77769e0086d8"

WAVES: list[dict[str, Any]] = [
    {
        "wave": 0,
        "id": "meta-hotfix",
        "apply": ["meta-availability-hotfix.patch"],
        "deploy": [],
        "gates": ["api/meta/build=200", "optional api/meta after timeout bump"],
        "rollback": "git apply -R meta-availability-hotfix.patch · no fly change until wave1",
        "blocks": ["G02", "Graduation /meta"],
    },
    {
        "wave": 1,
        "id": "api-runtime",
        "apply": ["deploy-backlog.patch (crates/api/*)"],
        "deploy": ["tt-api-staging via phase2-staging-fly-deploy-and-sync.sh"],
        "gates": ["/health=200", "/meta/build SHA=HEAD", "REQUEST_TIMEOUT_SECS=120 in runtime"],
        "rollback": "fly deploy --image <snapshot.apps.tt-api-staging.previous_image>",
        "blocks": ["TN-P1-010 compound read", "indexer internal"],
    },
    {
        "wave": 2,
        "id": "web-runtime",
        "apply": ["deploy-backlog.patch (frontend/app|components)"],
        "deploy": ["tt-web-staging via deploy-tt-web-staging.sh"],
        "gates": ["web/meta=200", "web/api SHA match HEAD"],
        "rollback": "fly deploy --image <snapshot.apps.tt-web-staging.previous_image>",
        "blocks": ["G01 web_meta_rewrite_200"],
    },
]

EXEC_ORDER = [
    {"step": 1, "track": "execution", "action": "TN-P1-010 independent (internal spine · pre-deploy staging OK)"},
    {"step": 2, "track": "deploy", "action": "capture fly rollback snapshot (read-only)"},
    {"step": 3, "track": "deploy", "action": "apply backlog + hotfix patches to working tree"},
    {"step": 4, "track": "deploy", "action": "Wave1 deploy tt-api-staging"},
    {"step": 5, "track": "deploy", "action": "Wave2 deploy tt-web-staging"},
    {"step": 6, "track": "acceptance", "action": "p2fc-verify-staging-meta-availability.sh --strict"},
    {"step": 7, "track": "acceptance", "action": "Deep Gate G02 --require-meta-green"},
    {"step": 8, "track": "acceptance", "action": "run-phase2-testnet-post-soak-graduation-closure.sh"},
]


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def git_head() -> str:
    try:
        return subprocess.check_output(["git", "-C", str(ROOT), "rev-parse", "HEAD"], text=True).strip()
    except subprocess.CalledProcessError:
        return ""


def capture_fly_snapshot(out_dir: Path) -> dict[str, Any]:
    snap: dict[str, Any] = {
        "schema": "traveltrust.p2fc_fly_rollback_snapshot.v1",
        "recorded_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "apps": {},
    }
    if not shutil_which("fly"):
        snap["error"] = "fly_cli_missing"
        return snap
    for app in ("tt-api-staging", "tt-web-staging"):
        try:
            raw = subprocess.check_output(["fly", "releases", "-a", app, "--json"], text=True, stderr=subprocess.DEVNULL)
            arr = json.loads(raw)
            cur = arr[0] if isinstance(arr, list) and arr else {}
            prev = arr[1] if isinstance(arr, list) and len(arr) > 1 else {}
            snap["apps"][app] = {
                "current_image": cur.get("ImageRef") or cur.get("image_ref") or "",
                "previous_image": prev.get("ImageRef") or prev.get("image_ref") or "",
                "version": cur.get("Version") or cur.get("version"),
            }
        except (subprocess.CalledProcessError, json.JSONDecodeError, OSError) as e:
            snap["apps"][app] = {"error": str(e)}
    (out_dir / "fly-rollback-snapshot.json").write_text(json.dumps(snap, indent=2) + "\n", encoding="utf-8")
    return snap


def shutil_which(cmd: str) -> str | None:
    from shutil import which

    return which(cmd)


def verify_wave_order() -> list[str]:
    issues: list[str] = []
    # Wave0 hotfix must precede acceptance gates
    w0 = next(w for w in WAVES if w["wave"] == 0)
    w1 = next(w for w in WAVES if w["wave"] == 1)
    if "meta" not in str(w0.get("blocks", [])):
        issues.append("wave0 should block G02/Graduation")
    if EXEC_ORDER[0]["action"].find("TN-P1-010") < 0:
        issues.append("TN-P1-010 should be step 1 (execution before deploy)")
    if EXEC_ORDER[3]["action"].find("api") < 0:
        issues.append("API deploy must precede web deploy")
    hotfix = ROOT / "evidence/GO_phase2_deploy_backlog/meta-availability-hotfix.patch"
    if not hotfix.is_file():
        issues.append("missing meta-availability-hotfix.patch")
    fly_toml = ROOT / "deploy/fly/tt-api-staging/fly.toml"
    if fly_toml.is_file() and "REQUEST_TIMEOUT_SECS" not in fly_toml.read_text(encoding="utf-8", errors="replace"):
        issues.append("fly.toml missing REQUEST_TIMEOUT_SECS=120")
    return issues


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", default="")
    ap.add_argument("--capture-fly", action="store_true")
    args = ap.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    stamp = utc_stamp()
    out_dir = Path(args.out_dir) if args.out_dir else ROOT / "evidence/GO_phase2_deploy_backlog/wave-rollback-plan" / stamp
    out_dir.mkdir(parents=True, exist_ok=True)

    active = json.loads(ACTIVE.read_text(encoding="utf-8")) if ACTIVE.is_file() else {}
    issues = verify_wave_order()
    fly_snap: dict[str, Any] = {}
    if args.capture_fly:
        fly_snap = capture_fly_snapshot(out_dir)

    head = git_head()
    payload: dict[str, Any] = {
        "schema": "traveltrust.p2fc_deploy_wave_rollback_plan.v1",
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "freeze_sha_at_soak": FREEZE_SHA,
        "local_HEAD": head,
        "backlog_active": active,
        "waves": WAVES,
        "execution_order": EXEC_ORDER,
        "rollback_playbook": {
            "api_failure_after_wave1": "fly deploy --image $(jq -r '.apps.\"tt-api-staging\".previous_image' fly-rollback-snapshot.json) -a tt-api-staging",
            "web_failure_after_wave2": "fly deploy --image $(jq -r '.apps.\"tt-web-staging\".previous_image' fly-rollback-snapshot.json) -a tt-web-staging",
            "patch_revert": "git apply -R evidence/GO_phase2_deploy_backlog/<stamp>/deploy-backlog.patch",
            "meta_hotfix_revert": "git apply -R evidence/GO_phase2_deploy_backlog/meta-availability-hotfix.patch",
            "reference_drill": "scripts/dev/run-phase3-fly-release-rollback-drill.sh --dry-run",
        },
        "fly_snapshot": fly_snap or None,
        "order_issues": issues,
        "verdict": "PASS" if not issues else "WARN",
    }

    (out_dir / "wave-rollback-plan.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    latest = ROOT / "evidence/GO_phase2_deploy_backlog/wave-rollback-plan/latest.json"
    latest.parent.mkdir(parents=True, exist_ok=True)
    latest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md = [
        "# Post-soak Deploy · Wave 顺序与回滚预案",
        "",
        f"**Verdict:** {payload['verdict']}",
        f"**HEAD:** `{head}` · **freeze:** `{FREEZE_SHA[:12]}…`",
        "",
        "## 执行顺序（一次性）",
        "",
    ]
    for s in EXEC_ORDER:
        md.append(f"{s['step']}. [{s['track']}] {s['action']}")
    md.extend(["", "## 回滚", ""])
    for k, v in payload["rollback_playbook"].items():
        md.append(f"- **{k}:** `{v}`")
    if issues:
        md.extend(["", "## Order issues", ""] + [f"- {i}" for i in issues])
    (out_dir / "WAVE-ROLLBACK-PLAN.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    print(f"TT_DEPLOY_WAVE_ROLLBACK_PLAN: {payload['verdict']} issues={len(issues)} out={out_dir.as_posix()}")
    return 0 if payload["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
