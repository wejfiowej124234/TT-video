#!/usr/bin/env python3
"""P2FC · Graduation 最终审核材料包（只读汇编 · 等 COMPLETED.json）

  python scripts/dev/gen-p2fc-graduation-review-pack.py

末行：TT_GRADUATION_REVIEW_PACK: READY|PARTIAL
"""
from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SOAK_DIR = ROOT / "evidence/P2FC_SOAK_72H_STAGING"
COMPLETED = SOAK_DIR / "COMPLETED.json"


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def read_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def latest_glob(base: Path, name: str) -> Path | None:
    if not base.is_dir():
        return None
    dirs = sorted([p for p in base.iterdir() if p.is_dir()], reverse=True)
    for d in dirs:
        f = d / name
        if f.is_file():
            return f
    return None


def git_head() -> str:
    try:
        return subprocess.check_output(["git", "-C", str(ROOT), "rev-parse", "HEAD"], text=True).strip()
    except subprocess.CalledProcessError:
        return ""


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    stamp = utc_stamp()
    out_dir = ROOT / "evidence/GO_phase2_testnet_graduation/review-pack" / stamp
    out_dir.mkdir(parents=True, exist_ok=True)

    soak_completed = COMPLETED.is_file()
    completed = read_json(COMPLETED) if soak_completed else None

    refs = {
        "pre_accept": ROOT / "evidence/GO_phase2_deploy_backlog/pre-accept-convergence/latest.json",
        "layer_review": ROOT / "evidence/GO_phase2_deploy_backlog/layer-review/latest.json",
        "wave_plan": ROOT / "evidence/GO_phase2_deploy_backlog/wave-rollback-plan/latest.json",
        "meta_rca": ROOT / "evidence/GO_phase2_deploy_backlog/meta-rca/latest.json",
        "backlog_active": ROOT / "evidence/GO_phase2_deploy_backlog/ACTIVE.json",
        "meta_obs": SOAK_DIR / "meta-observability/latest.json",
    }

    checklist = [
        {"id": "G-06", "item": "P2FC soak COMPLETED.json", "ready": soak_completed, "phase": "post-soak"},
        {"id": "G-07a", "item": "TN-P1-010 evidence (tn-p1-010-indexer-reconcile-*)", "ready": bool(list((ROOT / "evidence/GO_phase2_testnet_perfect_validation").glob("tn-p1-010-*")) if (ROOT / "evidence/GO_phase2_testnet_perfect_validation").is_dir() else []), "phase": "post-soak step 1"},
        {"id": "G-02", "item": "staging /meta 200 (api+web)", "ready": False, "phase": "post-soak deploy"},
        {"id": "G-01", "item": "Deep release gate PASS --require-meta-green", "ready": False, "phase": "post-soak"},
        {"id": "G-08", "item": "graduation-matrix.v1.json CLOSED", "ready": False, "phase": "graduation closure"},
        {"id": "G-09", "item": "OWNER-SIGNOFF.md", "ready": False, "phase": "graduation closure"},
    ]

    pre = read_json(refs["pre_accept"])
    if pre and pre.get("verdict") == "PASS":
        for c in checklist:
            if c["id"] == "G-07a":
                c["note"] = "scripts ready; run after COMPLETED"

    payload: dict[str, Any] = {
        "schema": "traveltrust.p2fc_graduation_review_pack.v1",
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "phase": "② testnet",
        "honest_boundary": "② graduation CLOSED ≠ ③ Production GO",
        "soak": {
            "completed": soak_completed,
            "completed_json": str(COMPLETED).replace("\\", "/"),
            "job_dir": (completed or {}).get("job_dir"),
        },
        "local_HEAD": git_head(),
        "artifact_refs": {k: str(v).replace("\\", "/") for k, v in refs.items()},
        "artifacts_present": {k: v.is_file() for k, v in refs.items()},
        "graduation_checklist": checklist,
        "one_shot_entrypoint": "bash scripts/ops/p2fc-post-soak-one-shot-execute.sh --watch",
        "ready_for_execute": soak_completed and all(refs[k].is_file() for k in ("backlog_active", "wave_plan", "pre_accept")),
        "verdict": "READY" if soak_completed else "PARTIAL",
    }

    if not soak_completed:
        payload["verdict"] = "PARTIAL"
        payload["awaiting"] = str(COMPLETED).replace("\\", "/")

    (out_dir / "graduation-review-pack.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    latest = ROOT / "evidence/GO_phase2_testnet_graduation/review-pack/latest.json"
    latest.parent.mkdir(parents=True, exist_ok=True)
    latest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md = [
        "# Phase ② · Graduation 审核材料包",
        "",
        f"**Generated:** {payload['generated_at_utc']}",
        f"**Verdict:** **{payload['verdict']}**",
        f"**Soak COMPLETED:** {'是' if soak_completed else '否（等待 COMPLETED.json）'}",
        "",
        "## 一次性执行入口",
        "",
        "```bash",
        "bash scripts/ops/p2fc-post-soak-one-shot-execute.sh --watch",
        "```",
        "",
        "## G-01～G-09 清单",
        "",
        "| ID | 项 | Ready | 阶段 |",
        "|----|-----|-------|------|",
    ]
    for c in checklist:
        md.append(f"| {c['id']} | {c['item']} | {'✅' if c['ready'] else '❌'} | {c['phase']} |")
    md.extend(
        [
            "",
            "## 诚实边界",
            "",
            "② testnet graduation **≠** ③ Production GO · mainnet · sk_live 另闸。",
            "",
        ]
    )
    (out_dir / "GRADUATION-REVIEW-PACK.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    print(f"TT_GRADUATION_REVIEW_PACK: {payload['verdict']} soak_completed={soak_completed} out={out_dir.as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
