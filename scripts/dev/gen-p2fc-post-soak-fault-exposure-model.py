#!/usr/bin/env python3
"""P2FC · post-soak 故障暴露与断点建模（只读 · 非侵入 · Soak 不变）

TN-P1-010 执行链 · Wave1/Wave2 deploy · /meta 传播 · indexer/db/itineraries 一致性
COMPLETED.json 后 one-shot MR12 隐性失败模式预定位。

  python scripts/dev/gen-p2fc-post-soak-fault-exposure-model.py
  python scripts/dev/gen-p2fc-post-soak-fault-exposure-model.py --soak-dir evidence/P2FC_SOAK_72H_STAGING

末行：TT_P2FC_FAULT_EXPOSURE_MODEL: PASS|WARN|FAIL
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SOAK_DIR = ROOT / "evidence/P2FC_SOAK_72H_STAGING"
ACTIVE = ROOT / "evidence/GO_phase2_deploy_backlog/ACTIVE.json"
MR12_LOCK = ROOT / "evidence/GO_phase2_deploy_backlog/MR12-EXECUTION-LOCK.json"

MR12_STEPS = [
    {"step": 1, "phase": "tn_p1_010", "label": "TN-P1-010 independent"},
    {"step": 2, "phase": "rollback_snapshot", "label": "fly rollback snapshot"},
    {"step": 3, "phase": "apply_patches", "label": "MR-01 hotfix + backlog (MR-02 scope note)"},
    {"step": 4, "phase": "wave1_api_deploy", "label": "Wave1 API (MR-02 subset)"},
    {"step": 5, "phase": "wave2_web_deploy", "label": "Wave2 Web"},
    {"step": 6, "phase": "meta_availability", "label": "meta --strict"},
    {"step": 7, "phase": "g02_deep_gate", "label": "Deep Gate G02"},
    {"step": 8, "phase": "graduation", "label": "Graduation closure"},
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def parse_diff_stat(stamp: str) -> list[dict[str, Any]]:
    path = ROOT / "evidence/GO_phase2_deploy_backlog" / stamp / "diff-stat.txt"
    rows: list[dict[str, Any]] = []
    if not path.is_file():
        return rows
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        m = re.match(r"^(.+?)\s+\|\s+(\d+)\s+", line.strip())
        if m:
            rows.append({"path": m.group(1).strip().replace(" ", ""), "delta": int(m.group(2))})
    return rows


def read_l5_artifacts(soak_dir: Path) -> dict[str, Any]:
    base = soak_dir / "l5-stability-audit"
    out: dict[str, Any] = {}
    for name in (
        "latest.json",
        "fc-execution-path-rehearsal.json",
        "fc-failure-competition-optimization.json",
        "fc-failure-propagation-graph.json",
        "graduation-failure-mode-forecast.json",
        "future-certain-failure-register.json",
        "long-term-drift-scan.json",
    ):
        p = base / name
        if p.is_file():
            out[name.replace(".json", "")] = load_json(p)
    meta_obs = soak_dir / "meta-observability/latest.json"
    if meta_obs.is_file():
        out["meta_observability"] = load_json(meta_obs)
    return out


def model_tn_p1_010_chain(rows: list[dict[str, Any]], l5: dict[str, Any]) -> dict[str, Any]:
    db_hits = [r for r in rows if re.search(r"db/mod\.rs|internal/indexer|indexer", r["path"])]
    itin_hits = [r for r in rows if "itineraries" in r["path"]]
    drift = l5.get("long-term-drift-scan") or {}
    idx = drift.get("indexer_parse", {})

    breakpoints = [
        {
            "id": "BP-TN-01",
            "phase": "tn_p1_010",
            "step": 1,
            "failure_mode": "internal/indexer reconcile read failure",
            "likelihood": "high" if idx.get("decline_verdict") == "declining" else "medium",
            "exposure": "staging internal POST without /meta body parse",
            "data_dependency": "indexer state vs chain @ freeze SHA",
            "hidden": idx.get("decline_verdict") == "declining",
        },
        {
            "id": "BP-TN-02",
            "phase": "tn_p1_010",
            "step": 1,
            "failure_mode": "db/mod.rs drift surfaces at reconcile",
            "likelihood": "high" if db_hits and itin_hits else "medium",
            "exposure": f"db/mod {len(db_hits)} files + itineraries compound in backlog",
            "data_dependency": "PG projection vs indexer compound read",
            "hidden": bool(db_hits and itin_hits),
        },
        {
            "id": "BP-TN-03",
            "phase": "g07_indexer",
            "step": 8,
            "failure_mode": "TN-P1-010 evidence not @ freeze SHA post-soak",
            "likelihood": "medium",
            "exposure": "graduation gate rejects historical-only reports",
            "data_dependency": "evidence/GO_phase2_testnet_perfect_validation/tn-p1-010-*",
            "hidden": True,
        },
    ]
    return {
        "chain": "internal/indexer spine · meta_coupling=none",
        "scripts_ready": (
            (ROOT / "scripts/ops/p2fc-run-tn-p1-010-independent.sh").is_file()
            and (ROOT / "scripts/dev/record-tn-p1-010-indexer-reconcile-staging-evidence.sh").is_file()
        ),
        "backlog_db_files": len(db_hits),
        "backlog_itineraries_files": len(itin_hits),
        "indexer_parse_drift": idx,
        "breakpoints": breakpoints,
        "first_fail_likely": "BP-TN-02" if db_hits and itin_hits else "BP-TN-01",
    }


def model_wave_deploy_path(rows: list[dict[str, Any]], lock: dict[str, Any] | None) -> dict[str, Any]:
    api_rows = [r for r in rows if r["path"].startswith("crates/api/")]
    web_rows = [r for r in rows if r["path"].startswith("frontend/")]
    itin = next((r for r in rows if "itineraries.rs" in r["path"]), None)

    wave1_bps = [
        {
            "id": "BP-W1-01",
            "wave": 1,
            "phase": "apply_patches",
            "failure_mode": "hotfix/backlog hunk conflict (middleware/mod.rs)",
            "likelihood": "medium",
            "mr12_note": "MR-01 hotfix-first — order mismatch in p2fc_apply_backlog_patches risks reject",
            "hidden": True,
        },
        {
            "id": "BP-W1-02",
            "wave": 1,
            "phase": "wave1_api_deploy",
            "failure_mode": "compile OOM / health≠200",
            "likelihood": "high" if itin and itin["delta"] >= 50 else "medium",
            "blast": {"api_files": len(api_rows), "itineraries_delta": itin["delta"] if itin else 0},
            "mr12_note": "MR-02 defer itineraries.rs from first wave1 deploy",
            "hidden": bool(itin),
        },
        {
            "id": "BP-W1-03",
            "wave": 1,
            "phase": "wave1_api_deploy",
            "failure_mode": "market/escrow/guide consumer regression post API deploy",
            "likelihood": "high" if itin else "low",
            "consumer_paths": ["/market", "/escrow", "/guide"],
            "hidden": True,
        },
    ]
    wave2_bps = [
        {
            "id": "BP-W2-01",
            "wave": 2,
            "phase": "wave2_web_deploy",
            "failure_mode": "web deploy fail / SHA mismatch vs API HEAD",
            "likelihood": "medium",
            "blast": {"web_files": len(web_rows)},
        },
        {
            "id": "BP-W2-02",
            "wave": 2,
            "phase": "wave2_web_deploy",
            "failure_mode": "app/meta/route.ts timeout not live (130s)",
            "likelihood": "high",
            "propagation_to": "step-6 meta_availability web /meta 503",
            "hidden": True,
        },
    ]
    seq = lock.get("execution_sequence_locked") if lock else MR12_STEPS
    return {
        "mr12_sequence_ref": seq,
        "wave1": {"breakpoints": wave1_bps, "high_risk": [b["id"] for b in wave1_bps if b["likelihood"] == "high"]},
        "wave2": {"breakpoints": wave2_bps, "high_risk": [b["id"] for b in wave2_bps if b["likelihood"] == "high"]},
        "deploy_order_locked": "wave1_api → wave2_web → meta strict (MR12)",
    }


def model_meta_propagation(l5: dict[str, Any], meta_obs: dict[str, Any] | None) -> dict[str, Any]:
    latest = l5.get("latest") or {}
    meta_layer = latest.get("meta_observability_layered") or {}
    prop = meta_layer.get("failure_propagation") or {}
    probes = meta_obs or {}

    graph = {
        "nodes": [
            {"id": "L1_API_META", "role": "GET tt-api-staging/meta", "soak_state": "408/timeout"},
            {"id": "L2_WEB_META", "role": "GET tt-web-staging/meta rewrite", "soak_state": "503"},
            {"id": "L3_META_BUILD", "role": "GET /meta/build fallback", "soak_state": "200 exec chain OK"},
            {"id": "L4_STRICT_GATE", "role": "step-6 --strict", "post_soak_state": "FAIL until MR-01 live"},
            {"id": "L5_G02", "role": "Deep Gate", "depends_on": ["L4_STRICT_GATE"]},
            {"id": "L6_GRADUATION", "role": "G06-G08", "depends_on": ["L5_G02", "TN-P1-010"]},
        ],
        "edges": [
            {"from": "L1_API_META", "to": "L2_WEB_META", "relation": "408→503 propagation", "soak_ratio": prop.get("l1_api_to_l2_web_503_ratio")},
            {"from": "L3_META_BUILD", "to": "EXEC_CHAIN", "relation": "soak probe SSOT", "observability_only": True},
            {"from": "L4_STRICT_GATE", "to": "L5_G02", "relation": "acceptance chain starts", "blocked_until": "REQUEST_TIMEOUT_SECS=120 deployed"},
            {"from": "L5_G02", "to": "L6_GRADUATION", "relation": "G03-G08 AND"},
        ],
    }

    breakpoints = [
        {
            "id": "BP-META-01",
            "phase": "meta_availability",
            "step": 6,
            "failure_mode": "FC-01 timeout mismatch — live 30s vs hotfix 120s",
            "likelihood": "critical",
            "current_probe": {
                "api_meta": probes.get("probes", probes).get("api_meta") if isinstance(probes.get("probes"), dict) else probes.get("api_meta"),
                "web_meta": probes.get("probes", probes).get("web_meta") if isinstance(probes.get("probes"), dict) else probes.get("web_meta"),
            },
            "not_failing_now": "observability_only — meta_build fallback",
            "hidden": True,
        },
        {
            "id": "BP-META-02",
            "phase": "wave2_web_deploy",
            "step": 5,
            "failure_mode": "web /meta proxy timeout < API cold start",
            "likelihood": "high",
            "requires": "META_ROUTE_FETCH_TIMEOUT_MS=130000 + wave2 deploy",
        },
    ]
    return {
        "soak_propagation": prop,
        "dominant_chain": prop.get("dominant_chain", "408>503>exec_ok>accept_deferred"),
        "graph": graph,
        "breakpoints": breakpoints,
        "post_completed_first_fail": "BP-META-01",
    }


def model_data_consistency(rows: list[dict[str, Any]], l5: dict[str, Any]) -> dict[str, Any]:
    db = [r for r in rows if "db/mod.rs" in r["path"]]
    idx = [r for r in rows if re.search(r"indexer|reconcile|internal/indexer", r["path"])]
    itin = [r for r in rows if "itineraries" in r["path"]]
    market = [r for r in rows if re.search(r"market|escrow|guide", r["path"])]

    compound_risk = bool(db) and bool(itin)
    breakpoints = [
        {
            "id": "BP-DATA-01",
            "domains": ["indexer", "db/mod.rs"],
            "failure_mode": "reconcile read vs PG schema drift after wave1",
            "likelihood": "high" if compound_risk else "medium",
            "files": {"db": [r["path"] for r in db[:5]], "indexer": [r["path"] for r in idx[:5]]},
        },
        {
            "id": "BP-DATA-02",
            "domains": ["itineraries.rs", "market/escrow/guide"],
            "failure_mode": "hub API change breaks consumer routes",
            "likelihood": "high" if itin and market else "medium",
            "itineraries_delta": sum(r["delta"] for r in itin),
            "consumer_file_count": len(market),
        },
        {
            "id": "BP-DATA-03",
            "domains": ["G07", "TN-P1-010"],
            "failure_mode": "indexer compound pass false after deploy",
            "likelihood": "medium",
            "gate": "graduation G07_indexer AND",
        },
    ]
    fc_reg = l5.get("future-certain-failure-register") or {}
    return {
        "compound_db_itineraries": compound_risk,
        "file_counts": {"db": len(db), "indexer": len(idx), "itineraries": len(itin), "consumers": len(market)},
        "fc_register_aligned": [r.get("id") for r in fc_reg.get("register", [])],
        "breakpoints": breakpoints,
        "consistency_verdict": "WARN" if compound_risk else "PASS",
    }


def build_hidden_failure_ranking(
    tn: dict[str, Any],
    wave: dict[str, Any],
    meta: dict[str, Any],
    data: dict[str, Any],
) -> list[dict[str, Any]]:
    all_bps: list[dict[str, Any]] = []
    for section, key in ((tn, "breakpoints"), (wave.get("wave1", {}), "breakpoints"), (wave.get("wave2", {}), "breakpoints"), (meta, "breakpoints"), (data, "breakpoints")):
        for bp in section.get(key, []):
            all_bps.append(bp)

    rank_map = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    scored: list[tuple[int, dict[str, Any]]] = []
    for bp in all_bps:
        score = rank_map.get(str(bp.get("likelihood", "medium")), 2)
        if bp.get("hidden"):
            score += 1
        scored.append((score, bp))

    scored.sort(key=lambda x: (-x[0], x[1].get("id", "")))
    ranked: list[dict[str, Any]] = []
    for i, (score, bp) in enumerate(scored[:12], 1):
        ranked.append(
            {
                "rank": i,
                "id": bp.get("id"),
                "phase": bp.get("phase"),
                "step": bp.get("step"),
                "failure_mode": bp.get("failure_mode"),
                "likelihood": bp.get("likelihood"),
                "hidden": bp.get("hidden", False),
                "score": score,
            }
        )
    return ranked


KEY_BREAKPOINTS = ("BP-META-01", "BP-TN-02", "BP-W1-02", "BP-W1-03", "BP-META-02", "BP-DATA-01")

LIKELIHOOD_FAIL_P = {"critical": 0.92, "high": 0.55, "medium": 0.22, "low": 0.08}


def build_failure_surface_mapping(
    tn: dict[str, Any],
    wave: dict[str, Any],
    meta: dict[str, Any],
    data: dict[str, Any],
    ranked: list[dict[str, Any]],
) -> dict[str, Any]:
    """Failure surface · layer × BP × MR12 step（只读）。"""
    bp_index: dict[str, dict[str, Any]] = {}
    for section in (
        tn.get("breakpoints", []),
        wave.get("wave1", {}).get("breakpoints", []),
        wave.get("wave2", {}).get("breakpoints", []),
        meta.get("breakpoints", []),
        data.get("breakpoints", []),
    ):
        for bp in section:
            if bp.get("id"):
                bp_index[bp["id"]] = bp

    surfaces: list[dict[str, Any]] = []
    layer_map = {
        "BP-TN-02": ("execution", "data/indexer", 1, "tn_p1_010"),
        "BP-W1-02": ("deploy", "api-runtime", 4, "wave1_api_deploy"),
        "BP-W1-03": ("deploy", "consumer-routes", 4, "wave1_api_deploy"),
        "BP-META-01": ("acceptance", "meta-chain", 6, "meta_availability"),
        "BP-META-02": ("deploy", "web-meta-proxy", 5, "wave2_web_deploy"),
        "BP-DATA-01": ("data", "indexer-db", 1, "tn_p1_010"),
    }
    for bp_id in KEY_BREAKPOINTS:
        bp = bp_index.get(bp_id, {})
        layer, surface, step, phase = layer_map.get(bp_id, ("unknown", "unknown", 0, "unknown"))
        rank_row = next((r for r in ranked if r.get("id") == bp_id), None)
        surfaces.append(
            {
                "breakpoint_id": bp_id,
                "layer": layer,
                "surface": surface,
                "mr12_step": step,
                "mr12_phase": phase,
                "likelihood": bp.get("likelihood") or (rank_row or {}).get("likelihood", "unknown"),
                "failure_mode": bp.get("failure_mode", ""),
                "exposed_during_soak": bp_id == "BP-META-01" and "observability_only" in str(bp.get("not_failing_now", "")),
                "exposed_post_completed": True,
                "mr12_mitigation": {
                    "BP-TN-02": "step-1 internal spine before wave1",
                    "BP-W1-02": "MR-02 defer itineraries.rs",
                    "BP-META-01": "MR-01 hotfix-first + wave1/2 before --strict",
                }.get(bp_id),
            }
        )

    return {
        "schema": "traveltrust.p2fc_failure_surface_mapping.v1",
        "surfaces": surfaces,
        "critical_surface_count": sum(1 for s in surfaces if s["likelihood"] == "critical"),
        "acceptance_surface_blocked": [s["breakpoint_id"] for s in surfaces if s["layer"] == "acceptance"],
    }


def build_competition_failure_paths(
    l5: dict[str, Any],
    data: dict[str, Any],
    meta: dict[str, Any],
) -> dict[str, Any]:
    """竞争失败路径 · arena × BP · 对齐 L5 fc-failure-competition（只读）。"""
    fc_comp = l5.get("fc-failure-competition-optimization") or {}
    ingested = fc_comp.get("failure_competition_model", {})

    compound = data.get("compound_db_itineraries", False)
    p_tn_fail = 0.35 if compound else 0.18
    p_w1_fail = 0.52 if compound else 0.38
    p_meta_fail = LIKELIHOOD_FAIL_P["critical"]

    arenas: list[dict[str, Any]] = [
        {
            "arena_id": "ARENA-T+8",
            "offset_min": 8,
            "phase": "tn_p1_010",
            "competitors": [
                {"bp_id": "BP-TN-02", "fail_p": p_tn_fail, "win_score": round(p_tn_fail * 0.95, 3), "mechanism": "db/mod+itineraries compound reconcile"},
                {"bp_id": "BP-DATA-01", "fail_p": p_tn_fail * 0.85, "win_score": round(p_tn_fail * 0.80, 3), "mechanism": "indexer PG drift"},
            ],
            "predicted_winner": "BP-TN-02" if compound else "none",
            "combined_fail_p": round(1 - (1 - p_tn_fail) * (1 - p_tn_fail * 0.85), 3) if compound else p_tn_fail,
        },
        {
            "arena_id": "ARENA-T+28",
            "offset_min": 28,
            "phase": "wave1_api_deploy",
            "competitors": [
                {"bp_id": "BP-W1-02", "fail_p": p_w1_fail, "win_score": 0.55, "mechanism": "itineraries hub Δ195 compile/OOM"},
                {"bp_id": "BP-W1-03", "fail_p": p_w1_fail * 0.75, "win_score": 0.41, "mechanism": "market/escrow consumer regression"},
            ],
            "predicted_winner": "BP-W1-02",
            "combined_fail_p": round(1 - (1 - p_w1_fail) * (1 - p_w1_fail * 0.75), 3),
            "mr12_note": "MR-02 defer shifts winner to BP-W1-03 or none if hub excluded",
        },
        {
            "arena_id": "ARENA-T+45",
            "offset_min": 45,
            "phase": "meta_availability",
            "competitors": [
                {"bp_id": "BP-META-01", "fail_p": p_meta_fail, "win_score": 0.85, "mechanism": "FC-01 30s live vs 120s hotfix"},
                {"bp_id": "BP-META-02", "fail_p": 0.48, "win_score": 0.35, "mechanism": "web proxy 503 if wave2 incomplete"},
            ],
            "predicted_winner": "BP-META-01",
            "combined_fail_p": round(1 - (1 - p_meta_fail) * (1 - 0.48), 3),
        },
    ]

    global_ranking = sorted(
        [
            {"bp_id": "BP-META-01", "score": 0.85, "first_fail_at_min": 45, "blocks": "G02+Graduation"},
            {"bp_id": "BP-W1-02", "score": 0.55, "first_fail_at_min": 28, "blocks": "meta+acceptance cascade"},
            {"bp_id": "BP-TN-02", "score": 0.35 if compound else 0.18, "first_fail_at_min": 8, "blocks": "wave1 if step-1 fail"},
        ],
        key=lambda x: (-x["score"], x["first_fail_at_min"]),
    )

    return {
        "schema": "traveltrust.p2fc_competition_failure_paths.v1",
        "strategy_locked": "STRAT-A_PLUS_MR12",
        "arenas": arenas,
        "global_ranking": global_ranking,
        "first_execution_fail_winner": global_ranking[1] if len(global_ranking) > 1 else global_ranking[0],
        "first_acceptance_fail_winner": "BP-META-01",
        "ingested_l5_competition": {
            "present": bool(ingested),
            "first_competition_winner": ingested.get("first_competition_winner"),
        },
        "wave1_vs_meta_competition": "wave1 (T+28) fails first on deploy · meta (T+45) blocks graduation regardless",
    }


def build_propagation_chains(meta: dict[str, Any], data: dict[str, Any]) -> dict[str, Any]:
    """BP 传播链 · 上游→断点→下游 blocked gates。"""
    prop_graph = meta.get("graph") or {}
    chains: list[dict[str, Any]] = [
        {
            "root_bp": "BP-TN-02",
            "chain": [
                {"node": "COMPLETED.json", "event": "trigger"},
                {"node": "db/mod.rs backlog", "event": "latent drift"},
                {"node": "internal/indexer reconcile", "event": "read failure risk"},
                {"node": "BP-TN-02", "event": "step-1 FAIL"},
                {"node": "wave1_api_deploy", "event": "blocked or proceeds with stale state"},
                {"node": "G07_indexer", "event": "graduation FAIL"},
            ],
            "downstream_gates": ["G07_indexer", "graduation"],
        },
        {
            "root_bp": "BP-W1-02",
            "chain": [
                {"node": "apply_patches", "event": "full backlog incl itineraries.rs"},
                {"node": "wave1_api_deploy", "event": "fly deploy compile/OOM"},
                {"node": "BP-W1-02", "event": "step-4 FAIL"},
                {"node": "wave2_web_deploy", "event": "blocked"},
                {"node": "BP-META-01", "event": "never reached with hotfix live"},
                {"node": "graduation", "event": "blocked cascade"},
            ],
            "downstream_gates": ["meta_availability", "g02_deep_gate", "graduation"],
            "mr12_mitigation": "MR-02 defer hub from wave1",
        },
        {
            "root_bp": "BP-META-01",
            "chain": [
                {"node": "L1_API_META", "event": "408 soak (30s timeout)"},
                {"node": "L2_WEB_META", "event": "503 propagation"},
                {"node": "L3_META_BUILD", "event": "exec chain OK (soak only)"},
                {"node": "wave1/2 deploy", "event": "must land MR-01 before strict"},
                {"node": "BP-META-01", "event": "step-6 --strict FAIL if 30s still live"},
                {"node": "L5_G02", "event": "blocked"},
                {"node": "G06-G08", "event": "blocked cascade"},
            ],
            "downstream_gates": ["g02_deep_gate", "graduation", "G06-G08"],
            "soak_edges": prop_graph.get("edges", [])[:4],
        },
    ]
    if data.get("compound_db_itineraries"):
        chains[0]["correlation"] = {"BP-W1-02": 0.62, "BP-META-01": 0.15}
    return {
        "schema": "traveltrust.p2fc_failure_propagation_chains.v1",
        "chains": chains,
        "meta_dominant_soak_chain": meta.get("dominant_chain"),
    }


def build_t_plus_timeline_v2(
    competition: dict[str, Any],
    propagation: dict[str, Any],
    lock: dict[str, Any] | None,
) -> dict[str, Any]:
    """T+ 执行时间线预测 · MR12 8-step · 竞争赢家标注。"""
    phase_success = {
        "tn_p1_010": 0.65 if any(c.get("root_bp") == "BP-TN-02" for c in propagation.get("chains", [])) else 0.82,
        "rollback_snapshot": 0.96,
        "apply_patches": 0.78,
        "wave1_api_deploy": 0.48,
        "wave2_web_deploy": 0.78,
        "meta_availability": 0.42,
        "g02_deep_gate": 0.72,
        "graduation": 0.90,
    }
    # MR12 uplift model (read-only · aligns with L5 MR evaluation)
    if lock and "MR-01" in (lock.get("mr_changes") or []):
        phase_success["meta_availability"] = round(phase_success["meta_availability"] + 0.28, 3)
        phase_success["wave2_web_deploy"] = round(phase_success["wave2_web_deploy"] + 0.05, 3)
    if lock and "MR-02" in (lock.get("mr_changes") or []):
        phase_success["wave1_api_deploy"] = round(phase_success["wave1_api_deploy"] + 0.32, 3)
        phase_success["tn_p1_010"] = round(phase_success["tn_p1_010"] + 0.07, 3)

    offsets = {1: 8, 2: 10, 3: 12, 4: 28, 5: 42, 6: 45, 7: 55, 8: 65}
    arena_by_phase = {a["phase"]: a for a in competition.get("arenas", [])}

    timeline: list[dict[str, Any]] = []
    cumulative_p = 1.0
    for step in MR12_STEPS:
        phase = step["phase"]
        p = phase_success.get(phase, 0.8)
        cumulative_p = round(cumulative_p * p, 4)
        arena = arena_by_phase.get(phase, {})
        timeline.append(
            {
                "step": step["step"],
                "phase": phase,
                "label": step["label"],
                "offset_min": offsets.get(step["step"], step["step"] * 8),
                "phase_success_p": p,
                "cumulative_success_p": cumulative_p,
                "competition_winner": arena.get("predicted_winner"),
                "arena_fail_p": arena.get("combined_fail_p"),
                "key_breakpoints": [c["bp_id"] for c in arena.get("competitors", []) if c.get("bp_id") in KEY_BREAKPOINTS],
            }
        )

    e2e = cumulative_p
    return {
        "schema": "traveltrust.p2fc_t_plus_execution_timeline.v2",
        "trigger": "COMPLETED.json",
        "strategy": "STRAT-A_PLUS_MR12",
        "timeline": timeline,
        "end_to_end_success_p": e2e,
        "end_to_end_success_pct": round(e2e * 100, 1),
        "predicted_first_fail": competition.get("first_execution_fail_winner"),
        "predicted_graduation_blocker": competition.get("first_acceptance_fail_winner"),
        "time_to_first_fail_min": competition.get("global_ranking", [{}])[1].get("first_fail_at_min") if len(competition.get("global_ranking", [])) > 1 else 28,
        "time_to_graduation_block_min": 45,
    }


def build_one_shot_timeline(ranked: list[dict[str, Any]]) -> dict[str, Any]:
    """T+min from COMPLETED · competition winner."""
    step_offsets = {s["phase"]: 8 + (s["step"] - 1) * 4 for s in MR12_STEPS}
    step_offsets["meta_availability"] = 45
    step_offsets["g02_deep_gate"] = 55
    step_offsets["graduation"] = 65

    timeline: list[dict[str, Any]] = []
    for s in MR12_STEPS:
        risks = [r for r in ranked if r.get("phase") == s["phase"]]
        timeline.append(
            {
                "step": s["step"],
                "phase": s["phase"],
                "label": s["label"],
                "offset_min": step_offsets.get(s["phase"], s["step"] * 8),
                "risk_ids": [r["id"] for r in risks[:3]],
                "max_likelihood": max((r.get("likelihood", "low") for r in risks), default="low", key=lambda x: {"critical": 4, "high": 3, "medium": 2, "low": 1}.get(x, 0)),
            }
        )

    winner = ranked[0] if ranked else None
    return {
        "trigger": "COMPLETED.json",
        "entrypoint": "scripts/ops/p2fc-post-soak-one-shot-execute.sh",
        "strategy": "STRAT-A_PLUS_MR12",
        "timeline": timeline,
        "first_competition_winner": winner,
        "cascade_blockers": ["g02_deep_gate", "graduation", "G06-G08"],
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--soak-dir", default=str(SOAK_DIR))
    ap.add_argument("--out-dir", default="")
    args = ap.parse_args()

    soak_dir = Path(args.soak_dir)
    out_dir = Path(args.out_dir) if args.out_dir else soak_dir / "fault-exposure-model" / utc_stamp()
    out_dir.mkdir(parents=True, exist_ok=True)

    active = load_json(ACTIVE) or {}
    stamp = str(active.get("stamp") or "")
    rows = parse_diff_stat(stamp)
    lock = load_json(MR12_LOCK)
    l5 = read_l5_artifacts(soak_dir)
    blocker = load_json(soak_dir / "post-soak-preblock-l5-audit/blocker-watch.latest.json")

    tn = model_tn_p1_010_chain(rows, l5)
    wave = model_wave_deploy_path(rows, lock)
    meta = model_meta_propagation(l5, l5.get("meta_observability"))
    data = model_data_consistency(rows, l5)
    ranked = build_hidden_failure_ranking(tn, wave, meta, data)
    surface = build_failure_surface_mapping(tn, wave, meta, data, ranked)
    competition = build_competition_failure_paths(l5, data, meta)
    propagation = build_propagation_chains(meta, data)
    t_plus = build_t_plus_timeline_v2(competition, propagation, lock)
    timeline = build_one_shot_timeline(ranked)

    high_hidden = [r for r in ranked if r.get("hidden") and r.get("likelihood") in ("critical", "high")]
    verdict = "FAIL" if any(r.get("likelihood") == "critical" for r in ranked[:3]) else ("WARN" if high_hidden else "PASS")

    payload: dict[str, Any] = {
        "schema": "traveltrust.p2fc_post_soak_fault_exposure_model.v2",
        "generated_at_utc": utc_now(),
        "phase": "②",
        "read_only": True,
        "no_deploy": True,
        "no_restart": True,
        "no_strategy_change": True,
        "soak_completed": (soak_dir / "COMPLETED.json").is_file(),
        "mr12_lock_status": lock.get("lock_status") if lock else None,
        "blocker_watch_verdict": blocker.get("verdict") if blocker else None,
        "tn_p1_010_execution_chain": tn,
        "wave1_wave2_deploy_path": wave,
        "meta_propagation_dependencies": meta,
        "indexer_db_itineraries_consistency": data,
        "hidden_failure_ranking": ranked,
        "failure_surface_mapping": surface,
        "competition_failure_paths": competition,
        "failure_propagation_chains": propagation,
        "t_plus_execution_timeline": t_plus,
        "one_shot_timeline_model": timeline,
        "high_risk_paths": [
            "step-1 TN-P1-010 + db/itineraries compound (BP-TN-02)",
            "step-4 Wave1 API itineraries hub unless MR-02 defer (BP-W1-02)",
            "step-6 meta strict FC-01 timeout mismatch (BP-META-01)",
            "step-8 G06-G08 blocked by prior cascade (B3)",
        ],
        "verdict": verdict,
        "honest_boundary": "model only · no deploy until COMPLETED · observability_only soak masks meta acceptance failures",
    }

    (out_dir / "fault-exposure-model.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (out_dir / "failure-surface-mapping.json").write_text(json.dumps(surface, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (out_dir / "competition-failure-paths.json").write_text(json.dumps(competition, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (out_dir / "failure-propagation-chains.json").write_text(json.dumps(propagation, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (out_dir / "t-plus-execution-timeline.json").write_text(json.dumps(t_plus, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    latest = soak_dir / "fault-exposure-model/latest.json"
    latest.parent.mkdir(parents=True, exist_ok=True)
    latest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md = [
        "# Post-soak Fault Exposure Model",
        "",
        f"- **verdict:** {verdict} · soak_completed={payload['soak_completed']}",
        f"- **MR12 lock:** {payload['mr12_lock_status']}",
        "",
        "## Hidden failure ranking (top 5)",
        "",
    ]
    for r in ranked[:5]:
        md.append(f"{r['rank']}. **{r['id']}** @ {r['phase']} — {r['failure_mode']} [{r['likelihood']}]")
    md.extend(["", "## High-risk post-soak paths", ""])
    for p in payload["high_risk_paths"]:
        md.append(f"- {p}")
    md.extend(["", "## Competition failure paths", ""])
    for a in competition.get("arenas", []):
        md.append(f"- **{a['arena_id']}** T+{a['offset_min']}min `{a['phase']}` winner={a.get('predicted_winner')}")
    md.extend(["", "## T+ execution timeline (MR12)", ""])
    for t in t_plus.get("timeline", []):
        md.append(
            f"- T+{t['offset_min']}min step-{t['step']} `{t['phase']}` "
            f"p={t['phase_success_p']} cum={t['cumulative_success_p']} winner={t.get('competition_winner')}"
        )
    md.append(f"\n- **end_to_end_success_pct:** {t_plus.get('end_to_end_success_pct')}%")
    (out_dir / "FAULT-EXPOSURE-MODEL.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    print(
        f"TT_P2FC_FAULT_EXPOSURE_MODEL: {verdict} "
        f"exec_winner={competition.get('first_execution_fail_winner', {}).get('bp_id', 'n/a')} "
        f"accept_winner={competition.get('first_acceptance_fail_winner')} "
        f"e2e_pct={t_plus.get('end_to_end_success_pct')} "
        f"out={out_dir.as_posix()}"
    )
    return 0 if verdict != "FAIL" else 2


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
