#!/usr/bin/env python3
"""P2FC · deploy backlog 上线分层评审（只读 · 不 deploy · Soak 不变）

读取 evidence/GO_phase2_deploy_backlog/ACTIVE.json + deploy-backlog.patch，
按 L0～L4 分层、风险闸、post-soak 部署波次输出机读评审。

  python scripts/dev/gen-p2fc-deploy-backlog-layer-review.py
  python scripts/dev/gen-p2fc-deploy-backlog-layer-review.py --stamp 20260624T013808Z

末行：TT_DEPLOY_BACKLOG_LAYER_REVIEW: PASS|WARN
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
ACTIVE = ROOT / "evidence/GO_phase2_deploy_backlog/ACTIVE.json"
HOTFIX = ROOT / "evidence/GO_phase2_deploy_backlog/meta-availability-hotfix.patch"

LAYER_RULES: list[tuple[str, str, re.Pattern[str]]] = [
    ("L0_META_HOTFIX", "meta 可用性 · G02 验收前置", re.compile(r"(middleware/mod\.rs|router\.rs|health_meta/handlers|app/meta/route|tt-api-staging/fly\.toml|start-api-for-playwright)")),
    ("L1_API_RUNTIME", "API 运行时 / 路由 / DB", re.compile(r"^crates/api/")),
    ("L2_FRONTEND_RUNTIME", "Web 运行时 UI/数据链", re.compile(r"^frontend/(app|components|lib)/")),
    ("L3_FRONTEND_E2E", "E2E/烟测（不随镜像默认执行）", re.compile(r"^frontend/e2e/")),
    ("L4_REGISTRY_DEPLOY", "registry / deploy 配置", re.compile(r"^(registry/|deploy/)")),
]

RISK_KEYWORDS: list[tuple[str, str, re.Pattern[str]]] = [
    ("BLOCKING_GRADUATION", "阻断 Graduation G02 /meta", re.compile(r"meta/route|REQUEST_TIMEOUT|health_meta|fly\.toml")),
    ("HIGH_API_DATA", "API 数据面 / 迁移敏感", re.compile(r"db/mod|itineraries\.rs|migrations/")),
    ("MEDIUM_UI", "前端 UI/路由", re.compile(r"frontend/(app|components)/")),
    ("LOW_TEST_ONLY", "仅测试资产", re.compile(r"frontend/e2e/|\.test\.(ts|tsx)$")),
]


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def load_active() -> dict[str, Any]:
    if not ACTIVE.is_file():
        return {}
    return json.loads(ACTIVE.read_text(encoding="utf-8"))


def parse_diff_stat(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not path.is_file():
        return rows
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line or "|" not in line:
            continue
        m = re.match(r"^(.+?)\s+\|\s+(\d+)\s+([+-]+)?", line)
        if not m:
            continue
        fp = m.group(1).strip()
        if fp.endswith(".rs") or fp.startswith("frontend") or fp.startswith("crates") or fp.startswith("registry") or fp.startswith("deploy"):
            rows.append({"path": fp.replace(" ", ""), "delta": int(m.group(2))})
    return rows


def classify_path(path: str) -> tuple[str, str]:
    norm = path.replace("\\", "/")
    for layer_id, title, pat in LAYER_RULES:
        if pat.search(norm):
            return layer_id, title
    if norm.startswith("frontend/"):
        return "L2_FRONTEND_RUNTIME", "Web 运行时 UI/数据链"
    return "L9_OTHER", "其它"


def risk_tags(path: str) -> list[str]:
    norm = path.replace("\\", "/")
    tags: list[str] = []
    for tag, _, pat in RISK_KEYWORDS:
        if pat.search(norm):
            tags.append(tag)
    return tags or ["UNCLASSIFIED"]


def wave_plan(layers: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    return [
        {
            "wave": 0,
            "name": "meta-hotfix",
            "layer": "L0_META_HOTFIX",
            "action": "apply meta-availability-hotfix.patch + fly.toml REQUEST_TIMEOUT_SECS=120",
            "blocks": ["G02", "Graduation"],
            "file_count": len(layers.get("L0_META_HOTFIX", [])),
        },
        {
            "wave": 1,
            "name": "api-runtime",
            "layer": "L1_API_RUNTIME",
            "action": "deploy tt-api-staging（含 L1 变更）",
            "blocks": ["TN-P1-010 compound", "indexer reconcile read"],
            "file_count": len(layers.get("L1_API_RUNTIME", [])),
        },
        {
            "wave": 2,
            "name": "web-runtime",
            "layer": "L2_FRONTEND_RUNTIME",
            "action": "deploy tt-web-staging",
            "blocks": ["web /meta rewrite G01"],
            "file_count": len(layers.get("L2_FRONTEND_RUNTIME", [])),
        },
        {
            "wave": 3,
            "name": "backlog-remainder",
            "layer": "L3+",
            "action": "同批 deploy-backlog.patch 余量（e2e 不进镜像关键路径）",
            "blocks": [],
            "file_count": sum(len(v) for k, v in layers.items() if k.startswith("L3") or k == "L9_OTHER"),
        },
    ]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", default="")
    ap.add_argument("--out-dir", default="")
    args = ap.parse_args()

    active = load_active()
    stamp = args.stamp or str(active.get("stamp") or utc_stamp())
    backlog_dir = ROOT / "evidence/GO_phase2_deploy_backlog" / stamp
    diff_stat = backlog_dir / "diff-stat.txt"
    patch = backlog_dir / "deploy-backlog.patch"
    out_dir = Path(args.out_dir) if args.out_dir else ROOT / "evidence/GO_phase2_deploy_backlog" / "layer-review" / utc_stamp()
    out_dir.mkdir(parents=True, exist_ok=True)

    rows = parse_diff_stat(diff_stat)
    layers: dict[str, list[dict[str, Any]]] = defaultdict(list)
    risk_summary: dict[str, int] = defaultdict(int)

    for row in rows:
        path = row["path"]
        layer_id, layer_title = classify_path(path)
        tags = risk_tags(path)
        for t in tags:
            risk_summary[t] += 1
        layers[layer_id].append({**row, "layer_title": layer_title, "risk_tags": tags})

    hotfix_bytes = HOTFIX.stat().st_size if HOTFIX.is_file() else 0
    patch_bytes = patch.stat().st_size if patch.is_file() else 0

    verdict = "PASS"
    notes: list[str] = []
    if not rows:
        verdict = "WARN"
        notes.append("diff-stat empty — re-run archive-local-deploy-backlog.sh")
    if hotfix_bytes == 0:
        verdict = "WARN"
        notes.append("meta-availability-hotfix.patch missing")
    if active.get("policy", "").find("no_staging_redeploy") >= 0:
        notes.append("soak_inflight: review-only until COMPLETED.json")

    payload: dict[str, Any] = {
        "schema": "traveltrust.p2fc_deploy_backlog_layer_review.v1",
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "backlog_stamp": stamp,
        "active": active,
        "counts": {
            "files_in_diff_stat": len(rows),
            "patch_bytes": patch_bytes,
            "hotfix_patch_bytes": hotfix_bytes,
        },
        "layers": {k: {"title": v[0]["layer_title"] if v else "", "files": v} for k, v in sorted(layers.items())},
        "risk_summary": dict(risk_summary),
        "deploy_waves": wave_plan(layers),
        "post_soak_order": [
            "TN-P1-010 independent (internal spine)",
            "wave-0 meta hotfix",
            "wave-1 api deploy",
            "wave-2 web deploy",
            "p2fc-verify-staging-meta-availability.sh --strict",
            "run-phase2-testnet-post-soak-graduation-closure.sh",
        ],
        "verdict": verdict,
        "notes": notes,
    }

    (out_dir / "layer-review.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md = [
        "# Deploy Backlog · 上线分层评审",
        "",
        f"- **backlog stamp:** `{stamp}`",
        f"- **files:** {len(rows)} · **patch:** {patch_bytes} bytes · **hotfix:** {hotfix_bytes} bytes",
        f"- **verdict:** **{verdict}**",
        "",
        "## 部署波次（post-soak · 一次性）",
        "",
    ]
    for w in payload["deploy_waves"]:
        md.append(f"- **Wave {w['wave']}** `{w['name']}` — {w['action']} ({w['file_count']} files)")
    md.extend(["", "## 分层", ""])
    for lid, block in sorted(payload["layers"].items()):
        md.append(f"### {lid} · {block['title']} ({len(block['files'])})")
        for f in block["files"][:8]:
            md.append(f"- `{f['path']}` Δ{f['delta']}")
        if len(block["files"]) > 8:
            md.append(f"- … +{len(block['files']) - 8} more")
        md.append("")
    (out_dir / "LAYER-REVIEW.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    latest = ROOT / "evidence/GO_phase2_deploy_backlog/layer-review/latest.json"
    latest.parent.mkdir(parents=True, exist_ok=True)
    latest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"TT_DEPLOY_BACKLOG_LAYER_REVIEW: {verdict} files={len(rows)} out={out_dir.as_posix()}")
    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
