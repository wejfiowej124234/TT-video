#!/usr/bin/env python3
"""P2FC · deploy backlog 依赖影响图（只读 · 不 deploy · Soak 不变）

从 ACTIVE.json + diff-stat 构建 Graduation 前隐性风险影响图：
  · 子系统簇 · 跨层依赖边 · gate fanout · wave blast radius
  · 900s 快照 diff（--prior-graph）· 风险扩散评分

  python scripts/dev/gen-p2fc-backlog-dependency-impact-graph.py
  python scripts/dev/gen-p2fc-backlog-dependency-impact-graph.py --out-dir evidence/.../runs/stamp

末行：TT_BACKLOG_DEPENDENCY_GRAPH: PASS|WARN
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
ACTIVE = ROOT / "evidence/GO_phase2_deploy_backlog/ACTIVE.json"
HOTFIX = ROOT / "evidence/GO_phase2_deploy_backlog/meta-availability-hotfix.patch"

SUBSYSTEM_RULES: list[tuple[str, str, re.Pattern[str]]] = [
    ("SYS_META_G02", "G02 /meta 验收链", re.compile(r"meta/route|health_meta|fly\.toml|REQUEST_TIMEOUT|middleware/mod\.rs")),
    ("SYS_API_DB", "API 数据面 / PG", re.compile(r"crates/api/src/db/|migrations/")),
    ("SYS_API_ROUTES", "API 路由域", re.compile(r"crates/api/src/routes/")),
    ("SYS_API_MW", "API 中间件", re.compile(r"crates/api/src/middleware/")),
    ("SYS_API_CORE", "API 核心 router", re.compile(r"crates/api/src/router\.rs")),
    ("SYS_INDEXER", "Indexer / reconcile 读面", re.compile(r"indexer|reconcile|internal/indexer")),
    ("SYS_ADMIN_UI", "Admin 运营面", re.compile(r"frontend/app/admin/|frontend/components/admin/")),
    ("SYS_CONSUMER_UI", "Consumer / 五主 adjacent", re.compile(r"frontend/app/(market|me|escrow|community|governance)/")),
    ("SYS_FRONTEND_LIB", "Frontend lib / hooks", re.compile(r"frontend/lib/")),
    ("SYS_REGISTRY", "Registry / deploy", re.compile(r"^(registry/|deploy/)")),
    ("SYS_E2E", "E2E / 烟测（非镜像关键路径）", re.compile(r"frontend/e2e/")),
]

GATE_IMPACT: list[tuple[str, str, re.Pattern[str]]] = [
    ("G02_META", "Graduation G02 · /meta 200", re.compile(r"meta/route|health_meta|fly\.toml|REQUEST_TIMEOUT|middleware/mod")),
    ("G01_WEB", "Deep Gate G01 · web /meta rewrite", re.compile(r"frontend/app/meta/|tt-web-staging")),
    ("TN_P1_010", "TN-P1-010 indexer reconcile", re.compile(r"indexer|reconcile|internal/indexer|db/mod")),
    ("SOAK_EXEC", "Soak 执行链 health+meta_build", re.compile(r"health_meta|meta/build|start-api")),
    ("ESCROW_CHAIN", "Escrow / 订单链", re.compile(r"escrow|itineraries\.rs|orders")),
    ("ADMIN_OPS", "Admin CMS/Growth/Official", re.compile(r"frontend/app/admin/")),
]

CROSS_EDGES: list[tuple[str, str, str]] = [
    ("SYS_META_G02", "G02_META", "L0 hotfix unblocks acceptance /meta"),
    ("SYS_API_DB", "TN_P1_010", "DB/indexer state affects reconcile read"),
    ("SYS_API_ROUTES", "ESCROW_CHAIN", "itineraries/orders routes"),
    ("SYS_API_MW", "G02_META", "TimeoutLayer on all routes incl /meta"),
    ("SYS_ADMIN_UI", "ADMIN_OPS", "post-soak UI deploy wave-2"),
    ("SYS_CONSUMER_UI", "G01_WEB", "consumer pages depend web deploy"),
    ("SYS_INDEXER", "TN_P1_010", "indexer drift vs chain"),
    ("SYS_API_CORE", "SOAK_EXEC", "router mounts health/meta paths"),
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
        fp = m.group(1).strip().replace(" ", "")
        rows.append({"path": fp, "delta": int(m.group(2))})
    return rows


def classify_subsystem(path: str) -> str:
    norm = path.replace("\\", "/")
    for sid, _, pat in SUBSYSTEM_RULES:
        if pat.search(norm):
            return sid
    if norm.startswith("frontend/"):
        return "SYS_FRONTEND_OTHER"
    if norm.startswith("crates/api/"):
        return "SYS_API_OTHER"
    return "SYS_OTHER"


def gate_impacts(path: str) -> list[str]:
    norm = path.replace("\\", "/")
    hits: list[str] = []
    for gid, _, pat in GATE_IMPACT:
        if pat.search(norm):
            hits.append(gid)
    return hits or ["LOW_SURFACE"]


def build_graph(rows: list[dict[str, Any]]) -> dict[str, Any]:
    by_subsystem: dict[str, list[dict[str, Any]]] = defaultdict(list)
    gate_files: dict[str, list[str]] = defaultdict(list)
    large_deltas: list[dict[str, Any]] = []

    for row in rows:
        path = row["path"]
        sid = classify_subsystem(path)
        gates = gate_impacts(path)
        enriched = {**row, "subsystem": sid, "gates": gates}
        by_subsystem[sid].append(enriched)
        for g in gates:
            gate_files[g].append(path)
        if row["delta"] >= 50:
            large_deltas.append(enriched)

    nodes = []
    for sid, title, _ in SUBSYSTEM_RULES:
        files = by_subsystem.get(sid, [])
        if not files:
            continue
        gates_hit = sorted({g for f in files for g in f["gates"] if g != "LOW_SURFACE"})
        nodes.append(
            {
                "id": sid,
                "title": title,
                "file_count": len(files),
                "total_delta": sum(f["delta"] for f in files),
                "gates_impacted": gates_hit,
                "top_files": sorted(files, key=lambda x: -x["delta"])[:5],
            }
        )
    for sid in ("SYS_FRONTEND_OTHER", "SYS_API_OTHER", "SYS_OTHER"):
        files = by_subsystem.get(sid, [])
        if files:
            nodes.append(
                {
                    "id": sid,
                    "title": sid,
                    "file_count": len(files),
                    "total_delta": sum(f["delta"] for f in files),
                    "gates_impacted": sorted({g for f in files for g in f["gates"]}),
                    "top_files": sorted(files, key=lambda x: -x["delta"])[:5],
                }
            )

    edges = [{"from": a, "to": b, "relation": rel} for a, b, rel in CROSS_EDGES]

    hidden_risks: list[dict[str, Any]] = []
    if gate_files.get("G02_META") and len(gate_files["G02_META"]) < 3:
        hidden_risks.append(
            {
                "id": "HR_META_SCATTER",
                "severity": "medium",
                "note": "G02 meta fix scattered across few files — verify hotfix patch covers all timeout/proxy paths",
            }
        )
    if by_subsystem.get("SYS_API_DB") and by_subsystem.get("SYS_INDEXER"):
        hidden_risks.append(
            {
                "id": "HR_INDEXER_DB_COMPOUND",
                "severity": "high",
                "note": "Concurrent API DB + indexer backlog changes — TN-P1-010 reconcile may surface drift post-deploy",
            }
        )
    if large_deltas:
        hidden_risks.append(
            {
                "id": "HR_LARGE_DIFF_BLOB",
                "severity": "medium",
                "note": f"{len(large_deltas)} files with delta≥50 — review blast radius before wave-1",
                "files": [f["path"] for f in large_deltas[:8]],
            }
        )
    itineraries = [r for r in rows if "itineraries" in r["path"]]
    if itineraries:
        hidden_risks.append(
            {
                "id": "HR_ITINERARIES_HUB",
                "severity": "high",
                "note": "itineraries.rs hub change — impacts market/escrow/guide consumer paths",
                "files": [r["path"] for r in itineraries],
            }
        )

    return {
        "nodes": nodes,
        "edges": edges,
        "gate_file_index": {k: v[:20] for k, v in sorted(gate_files.items())},
        "large_delta_files": large_deltas[:15],
        "hidden_stability_risks": hidden_risks,
        "summary": {
            "total_files": len(rows),
            "subsystem_count": len(nodes),
            "edge_count": len(edges),
            "high_severity_risks": sum(1 for r in hidden_risks if r["severity"] == "high"),
        },
    }


def compute_risk_diffusion(graph: dict[str, Any], prior: dict[str, Any] | None) -> dict[str, Any]:
    nodes = graph.get("nodes", [])
    gate_fanout = sum(len(n.get("gates_impacted", [])) for n in nodes)
    max_gates = max((len(n.get("gates_impacted", [])) for n in nodes), default=0)
    wave_blast = sum(n.get("file_count", 0) for n in nodes if n.get("id", "").startswith("SYS_API"))
    wave_blast += sum(n.get("file_count", 0) for n in nodes if "FRONTEND" in n.get("id", ""))

    prior_risk_ids = {r.get("id") for r in (prior or {}).get("hidden_stability_risks", [])}
    current_risk_ids = {r.get("id") for r in graph.get("hidden_stability_risks", [])}
    new_risks = sorted(current_risk_ids - prior_risk_ids)
    resolved_risks = sorted(prior_risk_ids - current_risk_ids)

    diffusion_score = round(gate_fanout / max(len(nodes), 1), 2)
    verdict = "stable"
    if new_risks:
        verdict = "expanding"
    if len(current_risk_ids) > len(prior_risk_ids) and prior:
        verdict = "expanding"

    return {
        "gate_fanout_score": gate_fanout,
        "max_gates_per_subsystem": max_gates,
        "wave_blast_radius": wave_blast,
        "diffusion_score": diffusion_score,
        "new_risks_vs_prior": new_risks,
        "resolved_risks_vs_prior": resolved_risks,
        "prior_snapshot_present": prior is not None,
        "verdict": verdict,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", default="")
    ap.add_argument("--out-dir", default="")
    ap.add_argument("--prior-graph", default="", help="prior backlog-dependency-graph.latest.json for diff")
    args = ap.parse_args()

    active = load_active()
    stamp = args.stamp or str(active.get("stamp") or utc_stamp())
    backlog_dir = ROOT / "evidence/GO_phase2_deploy_backlog" / stamp
    diff_stat = backlog_dir / "diff-stat.txt"
    rows = parse_diff_stat(diff_stat)

    out_dir = Path(args.out_dir) if args.out_dir else ROOT / "evidence/P2FC_SOAK_72H_STAGING/l5-stability-audit/runs" / utc_stamp()
    out_dir.mkdir(parents=True, exist_ok=True)

    prior: dict[str, Any] | None = None
    prior_path = Path(args.prior_graph) if args.prior_graph else None
    if prior_path and prior_path.is_file():
        try:
            prior = json.loads(prior_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            prior = None

    graph = build_graph(rows)
    graph["risk_diffusion"] = compute_risk_diffusion(graph, prior)
    verdict = "PASS"
    if graph["summary"]["high_severity_risks"] > 0:
        verdict = "WARN"
    if not rows:
        verdict = "WARN"

    payload: dict[str, Any] = {
        "schema": "traveltrust.p2fc_backlog_dependency_impact_graph.v2",
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "backlog_stamp": stamp,
        "hotfix_patch_bytes": HOTFIX.stat().st_size if HOTFIX.is_file() else 0,
        "verdict": verdict,
        **graph,
    }

    (out_dir / "backlog-dependency-graph.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    md = [
        "# Backlog Dependency Impact Graph",
        "",
        f"- **files:** {len(rows)} · **subsystems:** {graph['summary']['subsystem_count']}",
        f"- **high-severity hidden risks:** {graph['summary']['high_severity_risks']}",
        f"- **verdict:** **{verdict}**",
        "",
        "## Subsystem nodes",
        "",
    ]
    for n in graph["nodes"]:
        md.append(f"### {n['id']} · {n['title']} ({n['file_count']} files, Δ{n['total_delta']})")
        if n.get("gates_impacted"):
            md.append(f"- Gates: {', '.join(n['gates_impacted'])}")
        for f in n.get("top_files", [])[:3]:
            md.append(f"- `{f['path']}` Δ{f['delta']}")
        md.append("")
    md.extend(["## Risk diffusion", ""])
    rd = graph.get("risk_diffusion", {})
    md.append(f"- gate_fanout={rd.get('gate_fanout_score')} · wave_blast={rd.get('wave_blast_radius')} · diffusion_score={rd.get('diffusion_score')}")
    if rd.get("new_risks_vs_prior"):
        md.append(f"- new vs prior: {', '.join(rd['new_risks_vs_prior'])}")
    md.extend(["", "## Hidden stability risks", ""])
    for r in graph["hidden_stability_risks"]:
        md.append(f"- **[{r['severity']}]** {r['id']}: {r['note']}")
    (out_dir / "DEPENDENCY-IMPACT.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    latest = ROOT / "evidence/P2FC_SOAK_72H_STAGING/l5-stability-audit/backlog-dependency-graph.latest.json"
    latest.parent.mkdir(parents=True, exist_ok=True)
    latest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(
        f"TT_BACKLOG_DEPENDENCY_GRAPH: {verdict} files={len(rows)} "
        f"risks={graph['summary']['high_severity_risks']} "
        f"diffusion={graph.get('risk_diffusion', {}).get('diffusion_score')} "
        f"out={out_dir.as_posix()}"
    )
    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
