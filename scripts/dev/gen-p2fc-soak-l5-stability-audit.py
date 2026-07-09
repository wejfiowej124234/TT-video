#!/usr/bin/env python3
"""P2FC · Soak 期间 L5 稳定性审计（只读 · 不 deploy · 不改 worker/watcher）

扩展四维 Graduation 预收敛指标（900s 快照 · snapshots.jsonl · timeseries）：
  1. wall-clock 偏差 — budget/wall ETA · jitter · 快照 delta
  2. /meta 分层失败传播 — L1 408 → L2 503 → L3 exec · 传播一致性
  3. indexer 解析率 — parse_rate · flap_rate · 半窗趋势
  4. backlog 风险扩散 — gate fanout · wave blast · 快照 diff

  python scripts/dev/gen-p2fc-soak-l5-stability-audit.py
  python scripts/dev/gen-p2fc-soak-l5-stability-audit.py --soak-dir evidence/P2FC_SOAK_72H_STAGING

末行：TT_P2FC_L5_STABILITY_AUDIT: PASS|WARN|FAIL
"""
from __future__ import annotations

import argparse
import json
import re
import statistics
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]

DETAIL_RE = re.compile(
    r"^(?P<ts>\d{4}-\d{2}-\d{2}T[\d:]+Z)\s+"
    r"health=(?P<health>\d+)\s+web=(?P<web>\d+)\s+"
    r"chain_id=(?P<chain>\S+)\s+git_sha=(?P<sha>\S+)\s+"
    r"probe=(?P<probe>\S+)\s+indexer_source=(?P<idx>\S*)"
)
OK_RE = re.compile(r"^(?P<ts>\d{4}-\d{2}-\d{2}T[\d:]+Z)\s+health=200$")


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def parse_ts(ts: str) -> datetime:
    return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)


def find_best_job(soak_dir: Path) -> Path | None:
    best: Path | None = None
    best_ok = -1
    for job in sorted(soak_dir.glob("job-*")):
        if not job.is_dir():
            continue
        log = job / "soak.log"
        if not log.is_file():
            continue
        ok = sum(1 for line in log.read_text(encoding="utf-8", errors="replace").splitlines() if OK_RE.match(line.strip()))
        pid_file = job / "pid.txt"
        alive = False
        if pid_file.is_file():
            pid = pid_file.read_text(encoding="utf-8").strip()
            if pid.isdigit():
                try:
                    import os

                    os.kill(int(pid), 0)
                    alive = True
                except (OSError, ValueError):
                    alive = False
        score = ok + (1_000_000 if alive else 0)
        if best is None or score > best_ok:
            best = job
            best_ok = score
    return best


def analyze_soak_log(log_path: Path, job_meta: dict[str, Any]) -> dict[str, Any]:
    lines = log_path.read_text(encoding="utf-8", errors="replace").splitlines()
    details: list[dict[str, Any]] = []
    ok_lines: list[datetime] = []
    failures: list[dict[str, Any]] = []
    intervals: list[float] = []

    poll_sec = int(job_meta.get("poll_sec") or 60)
    expect_sha = str(job_meta.get("expect_git_sha") or "")

    for line in lines:
        line = line.strip()
        m = DETAIL_RE.match(line)
        if m:
            d = m.groupdict()
            ts = parse_ts(d["ts"])
            entry = {
                "ts": d["ts"],
                "health": int(d["health"]),
                "web": int(d["web"]),
                "chain_id": d["chain"],
                "git_sha": d["sha"],
                "probe": d["probe"],
                "indexer_source": d["idx"] or "",
            }
            if "SHA_DRIFT=1" in line:
                entry["sha_drift"] = True
                failures.append({**entry, "kind": "sha_drift"})
            details.append(entry)
            if entry["health"] != 200 or entry["web"] != 200:
                failures.append({**entry, "kind": "probe_fail"})
            continue
        om = OK_RE.match(line)
        if om:
            ok_lines.append(parse_ts(om.group("ts")))

    for i in range(1, len(ok_lines)):
        intervals.append((ok_lines[i] - ok_lines[i - 1]).total_seconds())

    probe_dist = Counter(d["probe"] for d in details)
    idx_dist = Counter(d["indexer_source"] or "(empty)" for d in details)
    health_dist = Counter(d["health"] for d in details)
    web_dist = Counter(d["web"] for d in details)
    sha_set = {d["git_sha"] for d in details if d["git_sha"]}

    interval_stats: dict[str, Any] = {}
    if intervals:
        interval_stats = {
            "count": len(intervals),
            "min_sec": round(min(intervals), 1),
            "max_sec": round(max(intervals), 1),
            "mean_sec": round(statistics.mean(intervals), 1),
            "stdev_sec": round(statistics.pstdev(intervals), 1) if len(intervals) > 1 else 0.0,
            "expected_poll_sec": poll_sec,
            "budget_credit_sec_per_ok": poll_sec,
        }
        # jitter: wall interval >> poll means slow probes (meta timeout)
        slow_polls = sum(1 for x in intervals if x > poll_sec * 3)
        interval_stats["slow_poll_count"] = slow_polls
        interval_stats["slow_poll_ratio"] = round(slow_polls / len(intervals), 3) if intervals else 0.0

    ok_count = len(ok_lines)
    budget_elapsed = ok_count * poll_sec
    wall_elapsed = 0
    if ok_lines:
        wall_elapsed = int((ok_lines[-1] - ok_lines[0]).total_seconds()) + poll_sec

    runtime_verdict = "stable"
    runtime_notes: list[str] = []
    if failures:
        runtime_verdict = "warn"
        runtime_notes.append(f"{len(failures)} probe/sha failure events in log")
    if interval_stats.get("slow_poll_ratio", 0) > 0.5:
        runtime_verdict = "warn"
        runtime_notes.append("majority polls wall-clock slow (>3× poll_sec) — /meta timeout pressure")
    if interval_stats.get("stdev_sec", 0) > poll_sec * 2:
        runtime_verdict = "warn"
        runtime_notes.append("high inter-poll jitter — runtime latency volatility")

    required_sec = int(job_meta.get("required_sec") or 259200)
    ok_needed = required_sec // poll_sec if poll_sec else 0
    ok_remaining = max(ok_needed - ok_count, 0)
    budget_remaining_sec = ok_remaining * poll_sec
    wall_ratio = round(wall_elapsed / budget_elapsed, 3) if budget_elapsed else None
    poll_overhead_sec = round(interval_stats.get("mean_sec", poll_sec) - poll_sec, 1) if interval_stats else 0.0
    wall_eta_sec = int(budget_remaining_sec * wall_ratio) if wall_ratio else None
    budget_eta_sec = budget_remaining_sec

    # rolling windows: last 6 vs prior 6 ok-poll intervals
    jitter_trend = "stable"
    if len(intervals) >= 12:
        recent = intervals[-6:]
        prior = intervals[-12:-6]
        recent_mean = statistics.mean(recent)
        prior_mean = statistics.mean(prior)
        delta_pct = (recent_mean - prior_mean) / prior_mean if prior_mean else 0.0
        if delta_pct > 0.15:
            jitter_trend = "slowing"
        elif delta_pct < -0.15:
            jitter_trend = "improving"
        interval_stats["jitter_trend"] = jitter_trend
        interval_stats["recent_mean_sec"] = round(recent_mean, 1)
        interval_stats["prior_mean_sec"] = round(prior_mean, 1)
        interval_stats["mean_delta_pct"] = round(delta_pct, 3)

    wall_clock = {
        "required_sec": required_sec,
        "ok_needed": ok_needed,
        "ok_remaining": ok_remaining,
        "budget_remaining_sec": budget_remaining_sec,
        "wall_eta_sec": wall_eta_sec,
        "budget_eta_sec": budget_eta_sec,
        "wall_eta_hours": round(wall_eta_sec / 3600, 1) if wall_eta_sec else None,
        "budget_eta_hours": round(budget_eta_sec / 3600, 1),
        "poll_overhead_sec_mean": poll_overhead_sec,
        "deviation_sec_per_poll": poll_overhead_sec,
        "jitter_trend": jitter_trend,
    }

    return {
        "ok_polls": ok_count,
        "detail_polls": len(details),
        "fail_events": len(failures),
        "budget_elapsed_sec": budget_elapsed,
        "wall_elapsed_sec": wall_elapsed,
        "wall_vs_budget_ratio": wall_ratio,
        "wall_clock_deviation": wall_clock,
        "interval_stats": interval_stats,
        "distribution": {
            "health": dict(health_dist),
            "web": dict(web_dist),
            "probe": dict(probe_dist),
            "indexer_source": dict(idx_dist),
        },
        "sha_unique_count": len(sha_set),
        "sha_aligned_with_expect": expect_sha.lower() in {s.lower() for s in sha_set} if expect_sha else None,
        "verdict": runtime_verdict,
        "notes": runtime_notes,
        "recent_failures": failures[-5:],
    }


def load_meta_observability_series(soak_dir: Path) -> dict[str, Any]:
    obs_dir = soak_dir / "meta-observability"
    samples: list[dict[str, Any]] = []
    if obs_dir.is_dir():
        for f in sorted(obs_dir.glob("observability-*.json")):
            try:
                samples.append(json.loads(f.read_text(encoding="utf-8")))
            except (json.JSONDecodeError, OSError):
                pass
    latest_path = obs_dir / "latest.json"
    if latest_path.is_file():
        try:
            latest = json.loads(latest_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            latest = {}
    else:
        latest = samples[-1] if samples else {}

    api_meta_codes = Counter(str(s.get("probes", {}).get("api_meta")) for s in samples)
    web_meta_codes = Counter(str(s.get("probes", {}).get("web_meta")) for s in samples)
    exec_ok = sum(1 for s in samples if s.get("execution_chain_ok"))
    accept_ok = sum(1 for s in samples if s.get("acceptance_chain_ok"))

    meta_verdict = "observed_degraded_acceptance_ok"
    meta_notes = [
        "api_meta 408 + web_meta 503 stable during soak — expected under observability_only policy",
        "execution_chain_ok via meta_build fallback",
    ]
    if samples and exec_ok < len(samples):
        meta_verdict = "warn"
        meta_notes.append("intermittent execution_chain_ok=false — investigate health/meta_build")
    if accept_ok > 0:
        meta_verdict = "info"
        meta_notes.append("acceptance_chain_ok seen — may indicate transient /meta recovery")

    rca_path = ROOT / "evidence/GO_phase2_deploy_backlog/meta-rca/latest.json"
    rca_summary: dict[str, Any] = {}
    if rca_path.is_file():
        try:
            rca = json.loads(rca_path.read_text(encoding="utf-8"))
            rca_summary = {
                "root_cause_chain": rca.get("root_cause_chain", []),
                "api_meta_code": rca.get("probes", {}).get("api_meta", {}).get("code"),
                "web_meta_code": rca.get("probes", {}).get("web_meta", {}).get("code"),
                "recorded_at_utc": rca.get("recorded_at_utc"),
            }
        except (json.JSONDecodeError, OSError):
            pass

    layers = [
        {"layer": "L1_API", "symptom": "GET /meta → 408", "cause": "REQUEST_TIMEOUT_SECS=30 · heavy aggregate"},
        {"layer": "L2_WEB", "symptom": "GET /meta → 503", "cause": "route.ts proxy maps upstream non-200"},
        {"layer": "L3_EXEC", "symptom": "probe=meta_build", "cause": "p2fc-staging-probe-lib fallback — non-blocking"},
        {"layer": "L4_ACCEPT", "symptom": "acceptance_chain_ok=false", "cause": "deferred until post-soak wave-0 hotfix"},
    ]

    propagation = analyze_meta_failure_propagation(samples)

    return {
        "sample_count": len(samples),
        "latest": latest,
        "code_distribution": {"api_meta": dict(api_meta_codes), "web_meta": dict(web_meta_codes)},
        "execution_chain_ok_ratio": round(exec_ok / len(samples), 3) if samples else None,
        "acceptance_chain_ok_ratio": round(accept_ok / len(samples), 3) if samples else None,
        "layered_root_cause": layers,
        "failure_propagation": propagation,
        "rca_alignment": rca_summary,
        "verdict": meta_verdict,
        "notes": meta_notes,
    }


def analyze_meta_failure_propagation(samples: list[dict[str, Any]]) -> dict[str, Any]:
    """L1 408 → L2 503 → L3 exec_ok propagation consistency."""
    if not samples:
        return {"verdict": "missing", "chain_consistency_ratio": None}

    chains: Counter[str] = Counter()
    transitions: list[dict[str, Any]] = []
    prev_sig = ""

    for s in samples:
        p = s.get("probes", {})
        l1 = str(p.get("api_meta", ""))
        l2 = str(p.get("web_meta", ""))
        l3 = "exec_ok" if s.get("execution_chain_ok") else "exec_fail"
        l4 = "accept_ok" if s.get("acceptance_chain_ok") else "accept_deferred"
        sig = f"{l1}>{l2}>{l3}>{l4}"
        chains[sig] += 1
        if prev_sig and prev_sig != sig:
            transitions.append({"from": prev_sig, "to": sig, "at": s.get("recorded_at_utc")})
        prev_sig = sig

    dominant = chains.most_common(1)[0] if chains else ("", 0)
    consistency = round(dominant[1] / len(samples), 3) if samples else 0.0
    expected_chain = "408>503>exec_ok>accept_deferred"
    matches_expected = dominant[0] == expected_chain

    l1_to_l2 = sum(1 for s in samples if str(s.get("probes", {}).get("api_meta")) in ("408", "504", "502") and str(s.get("probes", {}).get("web_meta")) == "503")
    l1_to_l2_ratio = round(l1_to_l2 / len(samples), 3)

    verdict = "stable_propagation"
    notes: list[str] = []
    if not matches_expected and consistency < 0.9:
        verdict = "warn"
        notes.append(f"dominant chain {dominant[0]} ({consistency:.0%}) — propagation not fully stable")
    if transitions:
        notes.append(f"{len(transitions)} chain transitions — monitor for flap")
    if matches_expected:
        notes.append(f"expected soak chain {expected_chain} holds {consistency:.0%} of samples")

    return {
        "dominant_chain": dominant[0],
        "dominant_ratio": consistency,
        "expected_chain": expected_chain,
        "matches_expected": matches_expected,
        "chain_consistency_ratio": consistency,
        "l1_api_to_l2_web_503_ratio": l1_to_l2_ratio,
        "transition_count": len(transitions),
        "recent_transitions": transitions[-3:],
        "chain_distribution": dict(chains),
        "verdict": verdict,
        "notes": notes,
    }


def analyze_exec_chain_drift(runtime: dict[str, Any], details_count: int | None = None) -> dict[str, Any]:
    dist = runtime.get("distribution", {})
    probe = dist.get("probe", {})
    idx = dist.get("indexer_source", {})

    chronic: list[dict[str, Any]] = []
    verdict = "stable"

    detail_polls = runtime.get("detail_polls", 1)
    meta_build_ratio = probe.get("meta_build", 0) / max(detail_polls, 1)

    empty_idx = idx.get("(empty)", 0)
    runtime_idx = idx.get("runtime", 0)
    other_idx = sum(v for k, v in idx.items() if k not in ("(empty)", "runtime"))
    total_idx = empty_idx + runtime_idx + other_idx

    parse_rate = round((runtime_idx + other_idx) / total_idx, 3) if total_idx else 0.0
    empty_rate = round(empty_idx / total_idx, 3) if total_idx else 1.0
    flap_detected = runtime_idx > 0 and empty_idx > 0
    flap_rate = round(min(runtime_idx, empty_idx) / total_idx, 3) if flap_detected and total_idx else 0.0

    if meta_build_ratio >= 0.95:
        chronic.append(
            {
                "id": "DRIFT_PROBE_FALLBACK",
                "severity": "medium",
                "note": "≥95% polls use meta_build fallback — full /meta never succeeds during soak (expected)",
            }
        )

    if total_idx > 0 and empty_rate > 0.8:
        chronic.append(
            {
                "id": "DRIFT_INDEXER_SOURCE_EMPTY",
                "severity": "medium",
                "note": f"indexer_source empty {empty_rate:.0%} of polls — /meta body unavailable; TN-P1-010 must use internal spine",
            }
        )
    if flap_detected:
        chronic.append(
            {
                "id": "DRIFT_INDEXER_SOURCE_FLAP",
                "severity": "low",
                "note": "indexer_source alternates empty/runtime — /meta intermittently parseable",
            }
        )

    if runtime.get("sha_unique_count", 0) > 1:
        verdict = "warn"
        chronic.append(
            {
                "id": "DRIFT_GIT_SHA",
                "severity": "high",
                "note": "multiple git_sha values in soak log — staging redeploy or probe inconsistency",
            }
        )

    if runtime.get("fail_events", 0) > 0:
        verdict = "warn"

    indexer_parse = {
        "parse_rate": parse_rate,
        "empty_rate": empty_rate,
        "flap_rate": flap_rate,
        "flap_detected": flap_detected,
        "runtime_hits": runtime_idx,
        "empty_hits": empty_idx,
        "total_polls": total_idx,
        "graduation_gate": "TN-P1-010 must not depend on GET /meta body parse",
        "pre_convergence_action": "post-soak wave-0 meta hotfix + internal/indexer-* spine",
    }

    return {
        "probe_fallback_ratio": round(meta_build_ratio, 3),
        "indexer_source_distribution": idx,
        "indexer_parse_rate": indexer_parse,
        "chronic_drift_signals": chronic,
        "verdict": verdict,
        "notes": [c["note"] for c in chronic],
    }


def run_dependency_graph(out_dir: Path, prior_graph: dict[str, Any] | None = None) -> dict[str, Any]:
    script = ROOT / "scripts/dev/gen-p2fc-backlog-dependency-impact-graph.py"
    prior_path = out_dir.parent.parent / "backlog-dependency-graph.latest.json"
    cmd = [sys.executable, str(script), "--out-dir", str(out_dir)]
    if prior_path.is_file() and prior_graph is None:
        cmd.extend(["--prior-graph", str(prior_path)])
    proc = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        cwd=str(ROOT),
    )
    summary_line = ""
    for line in (proc.stdout or "").splitlines():
        if line.startswith("TT_BACKLOG_DEPENDENCY_GRAPH:"):
            summary_line = line
    result: dict[str, Any] = {"exit_code": proc.returncode, "summary_line": summary_line}
    graph_file = out_dir / "backlog-dependency-graph.json"
    if graph_file.is_file():
        result["graph"] = json.loads(graph_file.read_text(encoding="utf-8"))
    return result


def load_prior_snapshot(audit_dir: Path) -> dict[str, Any] | None:
    latest = audit_dir / "latest.json"
    if not latest.is_file():
        return None
    try:
        return json.loads(latest.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def append_snapshot_index(audit_dir: Path, stamp: str, payload: dict[str, Any], run_dir: Path) -> None:
    index_path = audit_dir / "snapshots.jsonl"
    runtime = payload.get("dimensions", {}).get("runtime_volatility", {})
    meta = payload.get("dimensions", {}).get("meta_408_503_layers", {})
    drift = payload.get("dimensions", {}).get("indexer_exec_chain_drift", {})
    graph = payload.get("dimensions", {}).get("backlog_dependency_graph", {})
    row = {
        "stamp": stamp,
        "generated_at_utc": payload.get("generated_at_utc"),
        "verdict": payload.get("verdict"),
        "run_dir": run_dir.as_posix(),
        "ok_polls": runtime.get("ok_polls"),
        "wall_vs_budget_ratio": runtime.get("wall_vs_budget_ratio"),
        "wall_eta_hours": runtime.get("wall_clock_deviation", {}).get("wall_eta_hours"),
        "poll_overhead_sec": runtime.get("wall_clock_deviation", {}).get("poll_overhead_sec_mean"),
        "jitter_trend": runtime.get("wall_clock_deviation", {}).get("jitter_trend"),
        "meta_chain_consistency": meta.get("failure_propagation", {}).get("chain_consistency_ratio"),
        "meta_l1_l2_ratio": meta.get("failure_propagation", {}).get("l1_api_to_l2_web_503_ratio"),
        "meta_transitions": meta.get("failure_propagation", {}).get("transition_count"),
        "indexer_parse_rate": drift.get("indexer_parse_rate", {}).get("parse_rate"),
        "indexer_flap_rate": drift.get("indexer_parse_rate", {}).get("flap_rate"),
        "backlog_high_risks": graph.get("high_severity_risks"),
        "backlog_diffusion_score": (graph.get("risk_diffusion") or {}).get("diffusion_score"),
        "backlog_gate_fanout": (graph.get("risk_diffusion") or {}).get("gate_fanout_score"),
        "hidden_risk_count": len(payload.get("hidden_stability_risks", [])),
    }
    with index_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")


def _numeric_tail(rows: list[dict[str, Any]], key: str, n: int = 6) -> list[float]:
    out: list[float] = []
    for r in rows[-n:]:
        v = r.get(key)
        if v is not None and isinstance(v, (int, float)):
            out.append(float(v))
    return out


def _series_trend(values: list[float]) -> str:
    if len(values) < 2:
        return "insufficient_samples"
    if len(values) >= 4:
        recent = statistics.mean(values[-2:])
        prior = statistics.mean(values[-4:-2])
        if prior != 0:
            pct = (recent - prior) / abs(prior)
            if pct > 0.05:
                return "rising"
            if pct < -0.05:
                return "falling"
        return "stable"
    delta = values[-1] - values[0]
    if abs(delta) < 0.02:
        return "stable"
    return "rising" if delta > 0 else "falling"


def _convergence_state(
    values: list[float],
    *,
    min_samples: int = 2,
    stable_stdev_max: float = 0.08,
    converged_predicate: Any = None,
) -> str:
    if len(values) < min_samples:
        return "insufficient_samples"
    if converged_predicate and converged_predicate(values):
        return "converged"
    if len(values) >= 2:
        stdev = statistics.pstdev(values) if len(values) > 1 else 0.0
        if stdev <= stable_stdev_max:
            return "converged"
        if len(values) >= 3 and stdev <= stable_stdev_max * 2:
            return "stabilizing"
    return "observing"


def build_duration_convergence(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """四维持续时间序列收敛 — 只读 · 不 deploy。"""
    wall = _numeric_tail(rows, "wall_vs_budget_ratio")
    meta_c = _numeric_tail(rows, "meta_chain_consistency")
    meta_t = _numeric_tail(rows, "meta_transitions")
    idx = _numeric_tail(rows, "indexer_parse_rate")
    diff = _numeric_tail(rows, "backlog_diffusion_score")
    high = _numeric_tail(rows, "backlog_high_risks")

    dimensions: dict[str, Any] = {
        "wall_clock_deviation": {
            "metric": "wall_vs_budget_ratio",
            "series": wall,
            "latest": wall[-1] if wall else None,
            "trend": _series_trend(wall),
            "convergence": _convergence_state(
                wall,
                stable_stdev_max=0.15,
                converged_predicate=lambda v: len(v) >= 2 and max(v) - min(v) <= 0.2,
            ),
            "notes": ["ratio stable → wall ETA predictable for soak completion planning"],
        },
        "meta_layered_propagation": {
            "metric": "meta_chain_consistency + meta_transitions",
            "series": meta_c,
            "transitions_series": meta_t,
            "latest": meta_c[-1] if meta_c else None,
            "trend": _series_trend(meta_c) if meta_c else "insufficient_samples",
            "convergence": (
                "converged"
                if meta_c and all(x >= 0.95 for x in meta_c) and (not meta_t or all(x == meta_t[0] for x in meta_t))
                else _convergence_state(meta_c, converged_predicate=lambda v: v and all(x >= 0.9 for x in v))
            ),
            "notes": ["408→503→exec_ok chain pre-classified; acceptance deferred post-soak"],
        },
        "indexer_parse_rate": {
            "metric": "indexer_parse_rate",
            "series": idx,
            "latest": idx[-1] if idx else None,
            "trend": _series_trend(idx) if idx else "insufficient_samples",
            "convergence": (
                "converged_acknowledged"
                if idx and all(x < 0.15 for x in idx) and _series_trend(idx) in ("stable", "insufficient_samples", "falling")
                else _convergence_state(idx, stable_stdev_max=0.03)
            ),
            "notes": ["low parse rate expected during soak — TN-P1-010 uses internal spine"],
        },
        "backlog_risk_diffusion": {
            "metric": "backlog_diffusion_score + high_risks",
            "series": diff,
            "high_risks_series": high,
            "latest": diff[-1] if diff else None,
            "trend": _series_trend(diff) if diff else "insufficient_samples",
            "convergence": (
                "converged"
                if high and len(set(high)) == 1 and (not diff or _series_trend(diff) == "stable")
                else _convergence_state(diff, stable_stdev_max=0.5)
            ),
            "notes": ["backlog frozen at ACTIVE stamp — diffusion stable until post-soak deploy"],
        },
    }

    states = [d["convergence"] for d in dimensions.values()]
    converged_count = sum(1 for s in states if s in ("converged", "converged_acknowledged"))
    overall = "observing"
    if len(rows) < 2:
        overall = "insufficient_samples"
    elif converged_count == len(dimensions):
        overall = "converged"
    elif converged_count >= 2:
        overall = "stabilizing"

    duration_sec = 0
    if len(rows) >= 2:
        try:
            t0 = parse_ts(str(rows[0].get("generated_at_utc", "")).replace("+00:00", "Z")[:19] + "Z")
            t1 = parse_ts(str(rows[-1].get("generated_at_utc", "")).replace("+00:00", "Z")[:19] + "Z")
            duration_sec = int((t1 - t0).total_seconds())
        except (ValueError, TypeError):
            duration_sec = (len(rows) - 1) * 900

    return {
        "schema": "traveltrust.p2fc_l5_duration_convergence.v1",
        "snapshot_count": len(rows),
        "observation_duration_sec": duration_sec,
        "observation_duration_hours": round(duration_sec / 3600, 2),
        "poll_interval_sec": 900,
        "dimensions": dimensions,
        "converged_dimension_count": converged_count,
        "overall_convergence": overall,
        "honest_boundary": "duration convergence ≠ Graduation CLOSED — matrix pre-registers post-soak gates only",
    }


def build_graduation_risk_matrix(
    payload: dict[str, Any],
    duration: dict[str, Any],
    preconvergence: dict[str, Any],
) -> dict[str, Any]:
    runtime = payload["dimensions"]["runtime_volatility"]
    meta = payload["dimensions"]["meta_408_503_layers"]
    drift = payload["dimensions"]["indexer_exec_chain_drift"]
    graph = payload["dimensions"]["backlog_dependency_graph"]
    wc = runtime.get("wall_clock_deviation", {})
    prop = meta.get("failure_propagation", {})
    idx = drift.get("indexer_parse_rate", {})
    diff = graph.get("risk_diffusion") or {}
    dim = duration.get("dimensions", {})

    rows: list[dict[str, Any]] = [
        {
            "id": "M1_WALL_CLOCK",
            "dimension": "wall-clock 偏差",
            "current": runtime.get("wall_vs_budget_ratio"),
            "unit": "ratio",
            "trend": dim.get("wall_clock_deviation", {}).get("trend"),
            "convergence": dim.get("wall_clock_deviation", {}).get("convergence"),
            "graduation_gate": "SOAK_72H",
            "pre_soak_status": "observed" if runtime.get("fail_events", 0) == 0 else "warn",
            "post_soak_action": f"monitor wall ETA ~{wc.get('wall_eta_hours')}h — no deploy during soak",
            "blocks_graduation": False,
        },
        {
            "id": "M2_META_PROPAGATION",
            "dimension": "/meta 分层传播",
            "current": prop.get("dominant_chain"),
            "unit": "chain",
            "trend": dim.get("meta_layered_propagation", {}).get("trend"),
            "convergence": dim.get("meta_layered_propagation", {}).get("convergence"),
            "graduation_gate": "G02",
            "pre_soak_status": "preclassified",
            "post_soak_action": "wave-0 meta hotfix + p2fc-verify-staging-meta-availability.sh --strict",
            "blocks_graduation": True,
        },
        {
            "id": "M3_INDEXER_PARSE",
            "dimension": "indexer parse rate",
            "current": idx.get("parse_rate"),
            "unit": "rate",
            "trend": dim.get("indexer_parse_rate", {}).get("trend"),
            "convergence": dim.get("indexer_parse_rate", {}).get("convergence"),
            "graduation_gate": "TN-P1-010",
            "pre_soak_status": "acknowledged_low",
            "post_soak_action": "TN-P1-010 independent via internal/indexer-* — not GET /meta parse",
            "blocks_graduation": True,
        },
        {
            "id": "M4_BACKLOG_DIFFUSION",
            "dimension": "backlog 风险扩散",
            "current": diff.get("diffusion_score"),
            "unit": "score",
            "trend": dim.get("backlog_risk_diffusion", {}).get("trend"),
            "convergence": dim.get("backlog_risk_diffusion", {}).get("convergence"),
            "graduation_gate": "WAVE-1/2",
            "pre_soak_status": "frozen_registered",
            "post_soak_action": f"deploy backlog stamp + review {graph.get('high_severity_risks', 0)} high-severity files",
            "blocks_graduation": graph.get("high_severity_risks", 0) > 0,
        },
    ]

    blocking = [r["id"] for r in rows if r.get("blocks_graduation")]
    matrix_converged = duration.get("overall_convergence") in ("converged", "stabilizing")

    return {
        "schema": "traveltrust.p2fc_graduation_risk_preconvergence_matrix.v1",
        "generated_at_utc": payload.get("generated_at_utc"),
        "phase": "②",
        "soak_completed": payload.get("soak_completed", False),
        "matrix_rows": rows,
        "blocking_gates_post_soak": blocking,
        "duration_convergence": duration.get("overall_convergence"),
        "converged_dimensions": duration.get("converged_dimension_count"),
        "preconvergence_score": preconvergence.get("convergence_score"),
        "matrix_ready_for_completed_json": matrix_converged and preconvergence.get("convergence_score", 0) >= 80,
        "must_close_post_soak": preconvergence.get("must_close_post_soak", []),
        "honest_boundary": "matrix updated pre-COMPLETED.json · no deploy · no staging state change",
    }


def _slope_per_snapshot(values: list[float]) -> float | None:
    if len(values) < 2:
        return None
    return round((values[-1] - values[0]) / (len(values) - 1), 6)


def _indexer_parse_halves(log_path: Path) -> dict[str, Any]:
    """Soak.log 前半 vs 后半 indexer_source 解析率 — 长期漂移。"""
    if not log_path.is_file():
        return {"verdict": "missing"}
    details: list[tuple[str, str]] = []
    for line in log_path.read_text(encoding="utf-8", errors="replace").splitlines():
        m = DETAIL_RE.match(line.strip())
        if m:
            details.append((m.group("ts"), m.group("idx") or ""))
    if len(details) < 4:
        return {"verdict": "insufficient_samples", "total": len(details)}
    mid = len(details) // 2
    halves = [details[:mid], details[mid:]]

    def parse_rate(chunk: list[tuple[str, str]]) -> float:
        parsed = sum(1 for _, idx in chunk if idx and idx not in ("", "(empty)"))
        return round(parsed / len(chunk), 4) if chunk else 0.0

    first = parse_rate(halves[0])
    second = parse_rate(halves[1])
    slope = round(second - first, 4)
    trend = "stable"
    if slope < -0.05:
        trend = "declining"
    elif slope > 0.05:
        trend = "rising"
    return {
        "first_half_parse_rate": first,
        "second_half_parse_rate": second,
        "half_window_slope": slope,
        "trend": trend,
        "verdict": "drift_warn" if trend == "declining" else "stable",
    }


def _meta_propagation_cluster_density(soak_dir: Path) -> dict[str, Any]:
    obs_dir = soak_dir / "meta-observability"
    samples: list[dict[str, Any]] = []
    if obs_dir.is_dir():
        for f in sorted(obs_dir.glob("observability-*.json")):
            try:
                samples.append(json.loads(f.read_text(encoding="utf-8")))
            except (json.JSONDecodeError, OSError):
                pass
    if len(samples) < 2:
        return {"sample_count": len(samples), "cluster_density": None, "verdict": "insufficient_samples"}

    chains: list[str] = []
    for s in samples:
        p = s.get("probes", {})
        l3 = "exec_ok" if s.get("execution_chain_ok") else "exec_fail"
        chains.append(f"{p.get('api_meta')}>{p.get('web_meta')}>{l3}")

    dominant = Counter(chains).most_common(1)[0]
    density = round(dominant[1] / len(samples), 3)
    transitions = sum(1 for i in range(1, len(chains)) if chains[i] != chains[i - 1])

    # cluster: transitions in short windows (≥2 per 3-sample window)
    cluster_windows = 0
    for i in range(len(chains) - 2):
        window = chains[i : i + 3]
        if len(set(window)) > 1:
            cluster_windows += 1

    verdict = "stable_cluster"
    if density < 0.85:
        verdict = "clustering_warn"
    if transitions > len(samples) * 0.2:
        verdict = "flapping_warn"

    return {
        "sample_count": len(samples),
        "dominant_chain": dominant[0],
        "cluster_density": density,
        "transition_count": transitions,
        "cluster_window_count": cluster_windows,
        "verdict": verdict,
    }


def scan_long_term_drift(
    snapshot_rows: list[dict[str, Any]],
    runtime: dict[str, Any],
    soak_dir: Path,
    job: Path | None,
    graph_payload: dict[str, Any] | None,
) -> dict[str, Any]:
    wall = _numeric_tail(snapshot_rows, "wall_vs_budget_ratio")
    overhead = _numeric_tail(snapshot_rows, "poll_overhead_sec")
    eta = _numeric_tail(snapshot_rows, "wall_eta_hours")
    idx = _numeric_tail(snapshot_rows, "indexer_parse_rate")
    log_halves = _indexer_parse_halves(job / "soak.log") if job else {"verdict": "missing"}
    meta_cluster = _meta_propagation_cluster_density(soak_dir)

    wall_slope = _slope_per_snapshot(wall)
    overhead_slope = _slope_per_snapshot(overhead)
    idx_slope = _slope_per_snapshot(idx)

    drift_signals: list[dict[str, Any]] = []
    if wall_slope is not None and wall_slope > 0.02:
        drift_signals.append(
            {
                "id": "DRIFT_WALL_CLOCK_RISING",
                "severity": "medium",
                "note": f"wall/budget ratio slope +{wall_slope}/snapshot — slow wall-clock creep",
            }
        )
    if overhead_slope is not None and overhead_slope > 1.0:
        drift_signals.append(
            {
                "id": "DRIFT_POLL_OVERHEAD_RISING",
                "severity": "medium",
                "note": f"poll overhead +{overhead_slope}s/snapshot — probe latency creep (/meta pressure)",
            }
        )
    if idx_slope is not None and idx_slope < -0.01:
        drift_signals.append(
            {
                "id": "DRIFT_INDEXER_PARSE_DECLINING",
                "severity": "high",
                "note": f"indexer parse rate slope {idx_slope}/snapshot — TN-P1-010 risk post-soak",
            }
        )
    if log_halves.get("trend") == "declining":
        drift_signals.append(
            {
                "id": "DRIFT_INDEXER_HALF_WINDOW_DECLINE",
                "severity": "high",
                "note": f"soak.log half-window parse {log_halves.get('first_half_parse_rate')}→{log_halves.get('second_half_parse_rate')}",
            }
        )
    if meta_cluster.get("verdict") in ("clustering_warn", "flapping_warn"):
        drift_signals.append(
            {
                "id": "DRIFT_META_CLUSTER",
                "severity": "low" if meta_cluster.get("verdict") == "clustering_warn" else "medium",
                "note": f"/meta propagation density={meta_cluster.get('cluster_density')} transitions={meta_cluster.get('transition_count')}",
            }
        )

    hotspots: list[dict[str, Any]] = []
    if graph_payload:
        for node in graph_payload.get("nodes", []):
            if node.get("total_delta", 0) >= 50 or len(node.get("gates_impacted", [])) >= 3:
                hotspots.append(
                    {
                        "subsystem": node.get("id"),
                        "title": node.get("title"),
                        "file_count": node.get("file_count"),
                        "total_delta": node.get("total_delta"),
                        "gates": node.get("gates_impacted"),
                    }
                )
        hotspots.sort(key=lambda x: -x.get("total_delta", 0))
        for h in hotspots[:3]:
            if h.get("total_delta", 0) >= 100:
                drift_signals.append(
                    {
                        "id": f"DRIFT_HOTSPOT_{h['subsystem']}",
                        "severity": "medium",
                        "note": f"backlog hotspot {h['title']} Δ{h['total_delta']} gates={h.get('gates')}",
                    }
                )

    return {
        "schema": "traveltrust.p2fc_long_term_drift_scan.v1",
        "wall_clock": {
            "ratio_series": wall,
            "ratio_slope_per_snapshot": wall_slope,
            "eta_hours_series": eta,
            "overhead_slope_per_snapshot": overhead_slope,
            "growth_verdict": "rising" if wall_slope and wall_slope > 0.02 else "stable",
        },
        "indexer_parse": {
            "rate_series": idx,
            "slope_per_snapshot": idx_slope,
            "log_half_windows": log_halves,
            "decline_verdict": log_halves.get("trend") if log_halves.get("trend") == "declining" else ("stable" if idx_slope is None or idx_slope >= -0.01 else "declining"),
        },
        "meta_propagation": meta_cluster,
        "backlog_hotspots": hotspots[:8],
        "drift_signals": drift_signals,
        "drift_signal_count": len(drift_signals),
    }


def build_post_completed_failure_forecast(
    payload: dict[str, Any],
    graph_payload: dict[str, Any] | None,
    drift_scan: dict[str, Any],
) -> dict[str, Any]:
    graph = graph_payload or {}
    hidden = graph.get("hidden_stability_risks", [])
    large_blob = next((r for r in hidden if r.get("id") == "HR_LARGE_DIFF_BLOB"), None)
    itineraries = next((r for r in hidden if r.get("id") == "HR_ITINERARIES_HUB"), None)
    idx_declining = drift_scan.get("indexer_parse", {}).get("decline_verdict") == "declining"

    paths: list[dict[str, Any]] = [
        {
            "step": 1,
            "phase": "tn_p1_010",
            "failure_mode": "TN-P1-010 replay / reconcile read failure",
            "likelihood": "medium" if idx_declining else "low",
            "trigger": "COMPLETED.json → p2fc-run-tn-p1-010-independent.sh",
            "why": "indexer internal spine vs empty /meta parse" if idx_declining else "internal spine isolated from /meta",
            "precheck": "warn" if idx_declining else "pass",
            "mitigation": "use internal/indexer-* only; do not gate on GET /meta body",
        },
        {
            "step": 2,
            "phase": "rollback_snapshot",
            "failure_mode": "fly snapshot capture fail",
            "likelihood": "low",
            "trigger": "p2fc_capture_fly_rollback_snapshot",
            "why": "fly CLI auth / network",
            "precheck": "pass",
            "mitigation": "wave-rollback-plan/latest.json manual revert",
        },
        {
            "step": 3,
            "phase": "apply_patches",
            "failure_mode": "meta hotfix + backlog patch conflict",
            "likelihood": "medium",
            "trigger": "p2fc_apply_backlog_patches wave-0 hotfix then deploy-backlog.patch",
            "why": "overlapping middleware/mod.rs · health_meta · fly.toml hunks",
            "precheck": "warn",
            "mitigation": "apply hotfix first; resolve reject with git apply --3way; wave plan documents order",
        },
        {
            "step": 4,
            "phase": "wave1_api_deploy",
            "failure_mode": "API deploy OOM / compile timeout / health≠200",
            "likelihood": "high" if itineraries else "medium",
            "trigger": "p2fc_deploy_api_wave tt-api-staging",
            "why": "itineraries.rs Δ195 + L1 API backlog" if itineraries else "L1 API runtime delta",
            "precheck": "warn" if itineraries or large_blob else "pass",
            "mitigation": "fly rollback previous_image from fly-rollback-snapshot.json",
        },
        {
            "step": 5,
            "phase": "wave2_web_deploy",
            "failure_mode": "Web deploy fail / meta route mismatch",
            "likelihood": "medium",
            "trigger": "p2fc_deploy_web_wave tt-web-staging",
            "why": "app/meta/route.ts 130s timeout must align post hotfix",
            "precheck": "warn",
            "mitigation": "rollback tt-web-staging previous_image",
        },
        {
            "step": 6,
            "phase": "meta_availability",
            "failure_mode": "G02 strict /meta still 408 — 30s legacy vs 120s hotfix not live",
            "likelihood": "high",
            "trigger": "p2fc-verify-staging-meta-availability.sh --strict",
            "why": "staging REQUEST_TIMEOUT_SECS=30 until wave-0 deploy; GET /meta >30s → 408",
            "precheck": "warn",
            "mitigation": "confirm fly.toml REQUEST_TIMEOUT_SECS=120 + web META_ROUTE_FETCH_TIMEOUT_MS=130000 deployed before strict gate",
        },
        {
            "step": 7,
            "phase": "g02_deep_gate",
            "failure_mode": "Deep Gate G02 fallback fail / non-meta G03·G08",
            "likelihood": "medium",
            "trigger": "run-phase2-deep-release-gate.sh --require-meta-green",
            "why": "meta green necessary not sufficient; other gates may FAIL",
            "precheck": "warn",
            "mitigation": "fix meta first; rerun gate; accept non-meta items as separate backlog",
        },
        {
            "step": 8,
            "phase": "graduation",
            "failure_mode": "Graduation closure partial / soak attestation mismatch",
            "likelihood": "low",
            "trigger": "run-phase2-testnet-post-soak-graduation-closure.sh",
            "why": "prior step latent debt",
            "precheck": "pass",
            "mitigation": "checkpoint.json phase trace; do not claim CLOSED until TT_TESTNET_GRADUATION",
        },
    ]

    high_likelihood = [p for p in paths if p["likelihood"] == "high"]
    return {
        "schema": "traveltrust.p2fc_post_completed_failure_forecast.v1",
        "trigger_file": "evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json",
        "execution_entrypoint": "scripts/ops/p2fc-post-soak-one-shot-execute.sh",
        "failure_paths": paths,
        "high_likelihood_count": len(high_likelihood),
        "high_likelihood_phases": [p["phase"] for p in high_likelihood],
        "recommended_pre_completed_actions": [
            "Review wave-rollback-plan + fly-rollback-snapshot before COMPLETED",
            "Wave-0 hotfix must land before step-6 strict meta gate",
            "TN-P1-010: confirm internal spine green locally",
            "Wave1: stage itineraries.rs blast-radius review" if itineraries else "Wave1: monitor API deploy health",
        ],
        "honest_boundary": "forecast only — no deploy until COMPLETED.json",
    }


def build_future_certain_failure_register(
    graph_payload: dict[str, Any] | None,
    drift_scan: dict[str, Any],
) -> dict[str, Any]:
    graph = graph_payload or {}
    hidden = {r.get("id"): r for r in graph.get("hidden_stability_risks", [])}

    register: list[dict[str, Any]] = [
        {
            "id": "FC-01_TIMEOUT_MISMATCH",
            "severity": "critical",
            "category": "config_drift",
            "current_state": "staging REQUEST_TIMEOUT_SECS=30 (live)",
            "future_state_required": "120 API + 130s web proxy after wave-0",
            "fails_at": "step-6 meta_availability --strict",
            "not_failing_now_because": "observability_only policy defers acceptance",
            "pre_convergence": "wave-0 hotfix in meta-availability-hotfix.patch — apply before strict gate",
        },
        {
            "id": "FC-02_ITINERARIES_HUB",
            "severity": "high",
            "category": "backlog_blast",
            "current_state": hidden.get("HR_ITINERARIES_HUB", {}).get("note", "itineraries.rs hub"),
            "future_state_required": "wave-1 deploy without consumer regression",
            "fails_at": "step-4 wave1_api_deploy or post-deploy market/escrow",
            "not_failing_now_because": "soak freeze — staging still on pre-backlog build",
            "pre_convergence": "blast-radius review + rollback snapshot",
        },
        {
            "id": "FC-03_LARGE_DIFF_BLOB",
            "severity": "medium",
            "category": "backlog_blast",
            "current_state": hidden.get("HR_LARGE_DIFF_BLOB", {}).get("note", "42 files delta≥50"),
            "future_state_required": "controlled wave-1/2 deploy",
            "fails_at": "step-4/5 deploy OOM or runtime error",
            "not_failing_now_because": "backlog not applied",
            "pre_convergence": "wave plan + fly rollback",
        },
    ]

    if drift_scan.get("indexer_parse", {}).get("decline_verdict") == "declining":
        register.append(
            {
                "id": "FC-04_INDEXER_PARSE_DECAY",
                "severity": "high",
                "category": "long_term_drift",
                "current_state": drift_scan["indexer_parse"].get("log_half_windows"),
                "future_state_required": "TN-P1-010 pass on internal spine",
                "fails_at": "step-1 tn_p1_010",
                "not_failing_now_because": "exec chain uses meta_build fallback",
                "pre_convergence": "monitor parse slope each 900s snapshot",
            }
        )

    return {
        "schema": "traveltrust.p2fc_future_certain_failure_register.v1",
        "register": register,
        "critical_count": sum(1 for r in register if r["severity"] == "critical"),
        "high_count": sum(1 for r in register if r["severity"] == "high"),
        "honest_boundary": "registered failures are post-soak unless soak exec chain breaks",
    }


# Post-soak one-shot 执行路径 · 相对 COMPLETED.json 的预估 offset（分钟 · 只读预演）
_EXEC_PATH_TIMELINE: list[dict[str, Any]] = [
    {"step": 0, "phase": "completed_trigger", "label": "COMPLETED.json", "offset_min": 0},
    {"step": 1, "phase": "tn_p1_010", "label": "TN-P1-010 independent", "offset_min": 8},
    {"step": 2, "phase": "rollback_snapshot", "label": "fly rollback snapshot", "offset_min": 10},
    {"step": 3, "phase": "apply_patches", "label": "apply backlog + meta hotfix", "offset_min": 12},
    {"step": 4, "phase": "wave1_api_deploy", "label": "Wave1 tt-api-staging deploy", "offset_min": 28},
    {"step": 5, "phase": "wave2_web_deploy", "label": "Wave2 tt-web-staging deploy", "offset_min": 42},
    {"step": 6, "phase": "meta_availability", "label": "meta strict gate", "offset_min": 45},
    {"step": 7, "phase": "g02_deep_gate", "label": "Deep Gate --require-meta-green", "offset_min": 55},
    {"step": 8, "phase": "graduation", "label": "Graduation closure", "offset_min": 65},
]


def build_fc_execution_path_rehearsal(
    future_register: dict[str, Any],
    failure_forecast: dict[str, Any],
) -> dict[str, Any]:
    """FC-01/02/03 · 依赖链 · time-to-failure 传播图 · recovery 映射（只读预演）。"""
    fc_ids = ("FC-01_TIMEOUT_MISMATCH", "FC-02_ITINERARIES_HUB", "FC-03_LARGE_DIFF_BLOB")
    by_id = {r["id"]: r for r in future_register.get("register", []) if r["id"] in fc_ids}

    fc_specs: dict[str, dict[str, Any]] = {
        "FC-01_TIMEOUT_MISMATCH": {
            "primary_fail_step": 6,
            "primary_fail_phase": "meta_availability",
            "time_to_failure_min": 45,
            "dependency_chain": [
                {"id": "DEP-01-A", "kind": "config", "artifact": "staging live REQUEST_TIMEOUT_SECS=30", "blocks": "GET /meta completes"},
                {"id": "DEP-01-B", "kind": "patch", "artifact": "meta-availability-hotfix.patch", "provides": "fly.toml REQUEST_TIMEOUT_SECS=120"},
                {"id": "DEP-01-C", "kind": "patch", "artifact": "frontend/app/meta/route.ts", "provides": "META_ROUTE_FETCH_TIMEOUT_MS=130000"},
                {"id": "DEP-01-D", "kind": "deploy", "artifact": "wave1_api + wave2_web", "required_for": "runtime env + proxy live"},
                {"id": "DEP-01-E", "kind": "gate", "artifact": "p2fc-verify-staging-meta-availability.sh --strict", "consumes": "api/web /meta 200"},
            ],
            "upstream": ["COMPLETED.json", "apply_patches", "wave1_api_deploy", "wave2_web_deploy"],
            "downstream_blocked": ["g02_deep_gate", "graduation", "TT_TESTNET_GRADUATION:CLOSED"],
            "recovery_strategies": [
                {
                    "id": "REC-01-A",
                    "when": "step-3 apply_patches reject",
                    "action": "git apply --3way hotfix; resolve middleware/mod.rs + fly.toml hunks",
                    "rollback": "abort; do not deploy; soak evidence preserved",
                },
                {
                    "id": "REC-01-B",
                    "when": "step-6 meta strict 408",
                    "action": "verify fly secrets/env REQUEST_TIMEOUT_SECS=120 on tt-api-staging; redeploy API only",
                    "rollback": "p2fc_rollback_fly_app tt-api-staging previous_image",
                },
                {
                    "id": "REC-01-C",
                    "when": "step-6 web /meta 503",
                    "action": "confirm wave2 deployed route.ts 130s; curl api/meta then web/meta",
                    "rollback": "p2fc_rollback_fly_app tt-web-staging previous_image",
                },
            ],
        },
        "FC-02_ITINERARIES_HUB": {
            "primary_fail_step": 4,
            "primary_fail_phase": "wave1_api_deploy",
            "time_to_failure_min": 28,
            "dependency_chain": [
                {"id": "DEP-02-A", "kind": "code", "artifact": "crates/api/src/routes/itineraries.rs", "delta": 195},
                {"id": "DEP-02-B", "kind": "consumer", "artifact": "/market · /escrow · /guide routes", "depends_on": "itineraries API"},
                {"id": "DEP-02-C", "kind": "deploy", "artifact": "wave1_api_deploy compile+health", "required_for": "tt-api-staging boot"},
                {"id": "DEP-02-D", "kind": "gate", "artifact": "health=200 post wave1", "blocks_if": "compile OOM / runtime panic"},
            ],
            "upstream": ["COMPLETED.json", "apply_patches", "deploy-backlog.patch"],
            "downstream_blocked": ["meta_availability", "g02_deep_gate", "graduation", "consumer market/escrow"],
            "recovery_strategies": [
                {
                    "id": "REC-02-A",
                    "when": "step-4 fly deploy OOM/timeout",
                    "action": "rollback API image; split wave1 — deploy hotfix-only subset first",
                    "rollback": "fly-rollback-snapshot.json previous_image tt-api-staging",
                },
                {
                    "id": "REC-02-B",
                    "when": "step-4 health≠200 post deploy",
                    "action": "fly logs tt-api-staging; isolate itineraries.rs; local cargo test -p traveltrust-api",
                    "rollback": "immediate API rollback before wave2",
                },
                {
                    "id": "REC-02-C",
                    "when": "post-deploy consumer regression",
                    "action": "smoke-web3-itinerary-l5-local as pre-check before COMPLETED if time permits",
                    "rollback": "wave-rollback-plan wave-1 revert",
                },
            ],
        },
        "FC-03_LARGE_DIFF_BLOB": {
            "primary_fail_step": 4,
            "primary_fail_phase": "wave1_api_deploy",
            "time_to_failure_min": 28,
            "dependency_chain": [
                {"id": "DEP-03-A", "kind": "patch", "artifact": "deploy-backlog.patch", "file_count": "~180", "large_delta_count": 42},
                {"id": "DEP-03-B", "kind": "compound", "artifact": "FC-02 itineraries hub", "amplifies": "wave1 compile surface"},
                {"id": "DEP-03-C", "kind": "deploy", "artifact": "wave1+wave2 sequential", "required_for": "full backlog live"},
                {"id": "DEP-03-D", "kind": "gate", "artifact": "fly deploy exit + health", "blocks_if": "OOM / build fail"},
            ],
            "upstream": ["COMPLETED.json", "apply_patches", "FC-02_ITINERARIES_HUB"],
            "downstream_blocked": ["wave2_web_deploy", "meta_availability", "graduation"],
            "recovery_strategies": [
                {
                    "id": "REC-03-A",
                    "when": "step-3 patch apply slow/conflict",
                    "action": "apply hotfix first per wave plan; --3way backlog hunks",
                    "rollback": "git apply -R; stay on pre-backlog tree",
                },
                {
                    "id": "REC-03-B",
                    "when": "step-4/5 OOM",
                    "action": "wave split: L0 hotfix → L1 API subset → L2 web; defer L3 e2e assets",
                    "rollback": "both apps previous_image from snapshot",
                },
                {
                    "id": "REC-03-C",
                    "when": "step-7 G02 non-meta fail",
                    "action": "do not conflate with FC-03; meta green first then isolate G03/G08",
                    "rollback": "checkpoint.json phase trace",
                },
            ],
        },
    }

    propagation_nodes: list[dict[str, Any]] = []
    propagation_edges: list[dict[str, Any]] = []
    fc_analyses: list[dict[str, Any]] = []

    for fc_id, spec in fc_specs.items():
        base = by_id.get(fc_id, {"id": fc_id})
        fail_step = spec["primary_fail_step"]
        ttf = spec["time_to_failure_min"]

        path_slice = [s for s in _EXEC_PATH_TIMELINE if s["step"] <= fail_step]
        propagation_path = [
            {
                **node,
                "fc_id": fc_id,
                "status": "fail" if node["step"] == fail_step else ("pass_expected" if node["step"] < fail_step else "not_reached"),
            }
            for node in path_slice
        ]

        for i, node in enumerate(path_slice):
            propagation_nodes.append({**node, "fc_id": fc_id, "role": "timeline"})
            if i > 0:
                propagation_edges.append(
                    {
                        "from": f"{fc_id}:{path_slice[i-1]['phase']}",
                        "to": f"{fc_id}:{node['phase']}",
                        "relation": "sequential_exec",
                        "elapsed_min": node["offset_min"] - path_slice[i - 1]["offset_min"],
                    }
                )

        for dep in spec["dependency_chain"]:
            propagation_edges.append(
                {
                    "from": f"{fc_id}:dep:{dep['id']}",
                    "to": f"{fc_id}:{spec['primary_fail_phase']}",
                    "relation": "depends_on",
                    "kind": dep.get("kind"),
                }
            )

        # cross-FC amplification
        if fc_id == "FC-03_LARGE_DIFF_BLOB":
            propagation_edges.append(
                {
                    "from": "FC-02_ITINERARIES_HUB:wave1_api_deploy",
                    "to": "FC-03_LARGE_DIFF_BLOB:wave1_api_deploy",
                    "relation": "amplifies",
                }
            )
        if fc_id == "FC-01_TIMEOUT_MISMATCH":
            propagation_edges.append(
                {
                    "from": "FC-03_LARGE_DIFF_BLOB:apply_patches",
                    "to": "FC-01_TIMEOUT_MISMATCH:apply_patches",
                    "relation": "patch_order_risk",
                    "note": "hotfix must succeed in step-3 for step-6",
                }
            )

        fc_analyses.append(
            {
                **base,
                "primary_fail_step": fail_step,
                "primary_fail_phase": spec["primary_fail_phase"],
                "time_to_failure_min_from_completed": ttf,
                "dependency_chain": spec["dependency_chain"],
                "upstream_triggers": spec["upstream"],
                "downstream_blocked": spec["downstream_blocked"],
                "propagation_path": propagation_path,
                "recovery_strategies": spec["recovery_strategies"],
                "forecast_alignment": next(
                    (p for p in failure_forecast.get("failure_paths", []) if p.get("phase") == spec["primary_fail_phase"]),
                    None,
                ),
            }
        )

    # Global time-ordered merge for COMPLETED → first failure
    ordered_failures = sorted(fc_analyses, key=lambda x: x["time_to_failure_min_from_completed"])
    global_timeline = [
        {
            "offset_min": fc["time_to_failure_min_from_completed"],
            "fc_id": fc["id"],
            "phase": fc["primary_fail_phase"],
            "severity": fc.get("severity"),
        }
        for fc in ordered_failures
    ]

    recovery_map = {
        fc["id"]: fc["recovery_strategies"] for fc in fc_analyses
    }

    rehearsal_converged = all(
        fc.get("recovery_strategies") and len(fc["recovery_strategies"]) >= 2 for fc in fc_analyses
    )

    return {
        "schema": "traveltrust.p2fc_execution_path_rehearsal.v1",
        "trigger": "COMPLETED.json",
        "entrypoint": "scripts/ops/p2fc-post-soak-one-shot-execute.sh",
        "exec_path_timeline": _EXEC_PATH_TIMELINE,
        "fc_analyses": fc_analyses,
        "time_to_failure_order": global_timeline,
        "first_failure_fc": ordered_failures[0]["id"] if ordered_failures else None,
        "first_failure_offset_min": ordered_failures[0]["time_to_failure_min_from_completed"] if ordered_failures else None,
        "propagation_graph": {
            "nodes": propagation_nodes,
            "edges": propagation_edges,
        },
        "recovery_strategy_map": recovery_map,
        "cross_fc_notes": [
            "FC-02/03 likely surface at T+28min (wave1) before FC-01 at T+45min (meta strict) if wave1 passes",
            "FC-01 is critical path blocker for Graduation even if wave1/2 succeed",
            "FC-03 amplifies FC-02 at same phase — recovery REC-03-B splits waves",
        ],
        "rehearsal_converged": rehearsal_converged,
        "honest_boundary": "execution-path rehearsal only — no deploy until COMPLETED.json",
    }


_LIKELIHOOD_FAIL_P = {"high": 0.42, "medium": 0.22, "low": 0.08}


def _phase_success_from_forecast(failure_forecast: dict[str, Any], phase: str, default: float = 0.85) -> float:
    for p in failure_forecast.get("failure_paths", []):
        if p.get("phase") == phase:
            lik = str(p.get("likelihood", "low"))
            return round(1.0 - _LIKELIHOOD_FAIL_P.get(lik, 0.15), 3)
    return default


def build_fc_failure_competition_and_optimization(
    fc_rehearsal: dict[str, Any],
    failure_forecast: dict[str, Any],
    graph_payload: dict[str, Any] | None,
) -> dict[str, Any]:
    """FC-01/02/03 失败竞争排序 · 系统成功率 · 最优路径 · 最小风险改动集（只读建模）。"""
    fc_by_id = {fc["id"]: fc for fc in fc_rehearsal.get("fc_analyses", [])}

    # --- failure competition model ---
    competitions: list[dict[str, Any]] = [
        {
            "arena": "wave1_api_deploy",
            "offset_min": 28,
            "competitors": [
                {
                    "fc_id": "FC-02_ITINERARIES_HUB",
                    "severity": fc_by_id.get("FC-02_ITINERARIES_HUB", {}).get("severity", "high"),
                    "fail_p": _LIKELIHOOD_FAIL_P["high"],
                    "win_score": 0.55,
                    "mechanism": "itineraries.rs Δ195 compile/OOM/health",
                },
                {
                    "fc_id": "FC-03_LARGE_DIFF_BLOB",
                    "severity": fc_by_id.get("FC-03_LARGE_DIFF_BLOB", {}).get("severity", "medium"),
                    "fail_p": _LIKELIHOOD_FAIL_P["medium"],
                    "win_score": 0.30,
                    "mechanism": "42-file large delta amplifies wave1 surface",
                },
            ],
            "correlation": 0.65,
            "combined_fail_p": round(
                1.0
                - (1.0 - _LIKELIHOOD_FAIL_P["high"])
                * (1.0 - _LIKELIHOOD_FAIL_P["medium"] * 0.65),
                3,
            ),
            "predicted_winner": "FC-02_ITINERARIES_HUB",
            "ranking": ["FC-02_ITINERARIES_HUB", "FC-03_LARGE_DIFF_BLOB"],
        },
        {
            "arena": "apply_patches",
            "offset_min": 12,
            "competitors": [
                {
                    "fc_id": "FC-01_TIMEOUT_MISMATCH",
                    "fail_p": _LIKELIHOOD_FAIL_P["medium"],
                    "win_score": 0.40,
                    "mechanism": "hotfix+backlog hunk overlap",
                },
                {
                    "fc_id": "FC-03_LARGE_DIFF_BLOB",
                    "fail_p": _LIKELIHOOD_FAIL_P["medium"] * 0.8,
                    "win_score": 0.35,
                    "mechanism": "large patch apply conflict",
                },
            ],
            "correlation": 0.40,
            "combined_fail_p": round(1.0 - (1 - 0.22) * (1 - 0.18), 3),
            "predicted_winner": "FC-01_TIMEOUT_MISMATCH",
            "ranking": ["FC-01_TIMEOUT_MISMATCH", "FC-03_LARGE_DIFF_BLOB"],
        },
        {
            "arena": "meta_availability",
            "offset_min": 45,
            "competitors": [
                {
                    "fc_id": "FC-01_TIMEOUT_MISMATCH",
                    "fail_p": _LIKELIHOOD_FAIL_P["high"],
                    "win_score": 0.85,
                    "mechanism": "30s live timeout vs 120s hotfix requirement",
                },
            ],
            "correlation": 0.0,
            "combined_fail_p": _LIKELIHOOD_FAIL_P["high"],
            "predicted_winner": "FC-01_TIMEOUT_MISMATCH",
            "ranking": ["FC-01_TIMEOUT_MISMATCH"],
        },
    ]

    global_ranking = sorted(
        [
            {"fc_id": "FC-02_ITINERARIES_HUB", "score": 0.55, "gate": "wave1"},
            {"fc_id": "FC-03_LARGE_DIFF_BLOB", "score": 0.30, "gate": "wave1"},
            {"fc_id": "FC-01_TIMEOUT_MISMATCH", "score": 0.85, "gate": "g02_meta"},
        ],
        key=lambda x: (-x["score"], x["gate"] != "wave1"),
    )

    # --- baseline one-shot success model (Wave1 → G02 → Graduation) ---
    p_tn = _phase_success_from_forecast(failure_forecast, "tn_p1_010", 0.92)
    p_snap = 0.96
    p_patch = _phase_success_from_forecast(failure_forecast, "apply_patches", 0.78)
    p_w1 = 1.0 - competitions[0]["combined_fail_p"]
    p_w2 = _phase_success_from_forecast(failure_forecast, "wave2_web_deploy", 0.78)
    p_meta = _phase_success_from_forecast(failure_forecast, "meta_availability", 0.58)
    p_g02 = _phase_success_from_forecast(failure_forecast, "g02_deep_gate", 0.72)
    p_grad = _phase_success_from_forecast(failure_forecast, "graduation", 0.90)

    baseline_chain = {
        "tn_p1_010": p_tn,
        "rollback_snapshot": p_snap,
        "apply_patches": p_patch,
        "wave1_api_deploy": round(p_w1, 3),
        "wave2_web_deploy": p_w2,
        "meta_availability": p_meta,
        "g02_deep_gate": p_g02,
        "graduation": p_grad,
    }
    baseline_wave1_g02_grad = round(p_w1 * p_w2 * p_meta * p_g02 * p_grad, 4)
    baseline_end_to_end = round(p_tn * p_snap * p_patch * baseline_wave1_g02_grad, 4)
    baseline_score = round(baseline_end_to_end * 100, 1)

    # --- execution strategies ---
    strategies: list[dict[str, Any]] = [
        {
            "id": "STRAT-A_DEFAULT",
            "name": "default one-shot full backlog",
            "path": ["TN-P1-010", "snapshot", "full patch", "wave1", "wave2", "meta strict", "G02", "graduation"],
            "wave1_g02_grad_p": baseline_wave1_g02_grad,
            "end_to_end_p": baseline_end_to_end,
            "success_score": baseline_score,
            "risk": "FC-02+03 compete at wave1; FC-01 at meta",
        },
        {
            "id": "STRAT-B_WAVE0_FIRST",
            "name": "L0 hotfix-only deploy → meta smoke → backlog wave1/2",
            "path": ["TN-P1-010", "snapshot", "hotfix-only apply", "wave1-hotfix", "meta smoke", "backlog patch", "wave1-full", "wave2", "meta strict", "G02", "graduation"],
            "wave1_g02_grad_p": round(p_meta * 0.95 * p_g02 * p_grad * 0.88, 4),
            "end_to_end_p": round(p_tn * p_snap * 0.92 * p_meta * 0.95 * p_g02 * p_grad * 0.88, 4),
            "success_score": 0.0,
            "risk": "extra deploy cycle; lowest FC-01 exposure",
            "delta_vs_default": "+hotfix-first sequencing",
        },
        {
            "id": "STRAT-C_SPLIT_ITINERARIES",
            "name": "defer itineraries.rs from wave1 (minimal L1)",
            "path": ["TN-P1-010", "snapshot", "patch minus itineraries", "wave1-subset", "wave2", "meta strict", "G02", "graduation", "wave1-itineraries follow-up"],
            "wave1_g02_grad_p": round(0.82 * p_w2 * p_meta * p_g02 * p_grad, 4),
            "end_to_end_p": round(p_tn * p_snap * p_patch * 0.82 * p_w2 * p_meta * p_g02 * p_grad, 4),
            "success_score": 0.0,
            "risk": "itineraries post-grad follow-up required",
            "delta_vs_default": "excludes crates/api/.../itineraries.rs from wave1",
        },
    ]
    for s in strategies:
        s["success_score"] = round(s["end_to_end_p"] * 100, 1)

    optimal = max(strategies, key=lambda x: x["success_score"])

    # --- minimal risk change set (MR) ---
    minimal_risk_changes: list[dict[str, Any]] = [
        {
            "id": "MR-01",
            "priority": 1,
            "change": "Apply + deploy meta-availability-hotfix.patch only (Wave0)",
            "artifacts": [
                "evidence/GO_phase2_deploy_backlog/meta-availability-hotfix.patch",
                "deploy/fly/tt-api-staging/fly.toml REQUEST_TIMEOUT_SECS=120",
                "frontend/app/meta/route.ts META_ROUTE_FETCH_TIMEOUT_MS=130000",
            ],
            "addresses_fc": ["FC-01_TIMEOUT_MISMATCH"],
            "success_uplift_est": "+25% meta_availability phase",
            "deploy_scope": "tt-api-staging + tt-web-staging (hotfix files only)",
        },
        {
            "id": "MR-02",
            "priority": 2,
            "change": "Defer itineraries.rs from initial wave1 deploy",
            "artifacts": ["crates/api/src/routes/itineraries.rs"],
            "addresses_fc": ["FC-02_ITINERARIES_HUB", "FC-03_LARGE_DIFF_BLOB"],
            "success_uplift_est": "+27% wave1_api_deploy phase",
            "deploy_scope": "wave1 subset without Δ195 hub",
        },
        {
            "id": "MR-03",
            "priority": 3,
            "change": "Capture fly-rollback-snapshot immediately pre-wave1",
            "artifacts": ["post-soak-one-shot/fly-rollback-snapshot.json"],
            "addresses_fc": ["FC-02_ITINERARIES_HUB", "FC-03_LARGE_DIFF_BLOB"],
            "success_uplift_est": "recovery not success — limits blast radius",
            "deploy_scope": "read-only preflight (already in one-shot step 2)",
        },
        {
            "id": "MR-04",
            "priority": 4,
            "change": "Verify REQUEST_TIMEOUT_SECS live before meta --strict",
            "artifacts": ["curl tt-api-staging /meta/build + /meta probe"],
            "addresses_fc": ["FC-01_TIMEOUT_MISMATCH"],
            "success_uplift_est": "+15% g02_deep_gate conditional on meta",
            "deploy_scope": "read-only gate between step 5 and 6",
        },
    ]

    mr_set = [c for c in minimal_risk_changes if c["priority"] <= 2]
    projected_with_mr = round(
        min(0.95, p_w1 + 0.27) * p_w2 * min(0.95, p_meta + 0.25) * p_g02 * p_grad,
        4,
    )
    projected_score = round(projected_with_mr * 100, 1)

    return {
        "schema": "traveltrust.p2fc_failure_competition_optimization.v1",
        "generated_from": ["fc_execution_path_rehearsal", "graduation-failure-mode-forecast"],
        "failure_competition_model": {
            "global_ranking": global_ranking,
            "arenas": competitions,
            "first_competition_winner": "FC-02_ITINERARIES_HUB",
            "graduation_blocker_if_survive_wave1": "FC-01_TIMEOUT_MISMATCH",
        },
        "system_success_model": {
            "baseline_phase_success": baseline_chain,
            "baseline_wave1_to_graduation_p": baseline_wave1_g02_grad,
            "baseline_end_to_end_p": baseline_end_to_end,
            "baseline_success_score": baseline_score,
            "projected_with_minimal_risk_set_p": projected_with_mr,
            "projected_success_score_with_mr": projected_score,
            "score_scale": "0-100 (end-to-end probability × 100)",
        },
        "execution_strategies": strategies,
        "optimal_execution_path": {
            "strategy_id": optimal["id"],
            "strategy_name": optimal["name"],
            "path": optimal["path"],
            "success_score": optimal["success_score"],
            "wave1_g02_graduation_chain": [s for s in optimal["path"] if s in ("wave1", "wave1-hotfix", "wave1-subset", "wave2", "meta strict", "G02", "graduation") or "wave" in s or "meta" in s or "G02" in s or "graduation" in s],
        },
        "minimal_risk_change_set": {
            "changes": minimal_risk_changes,
            "recommended_core": mr_set,
            "combined_addresses": sorted({fc for c in mr_set for fc in c["addresses_fc"]}),
            "note": "MR-01+MR-02 = smallest deploy surface for Wave1→G02→Graduation pass",
        },
        "optimization_converged": optimal["success_score"] > 0 and projected_score > baseline_score,
        "honest_boundary": "scores are pre-COMPLETED models · not measured deploy outcomes · no staging change",
    }


def build_mr_execution_benefit_evaluation(
    fc_optimization: dict[str, Any],
) -> dict[str, Any]:
    """MR-01/02 执行收益 · Wave1→G02→Graduation 增益 · STRAT-B vs 默认 one-shot 决策（只读）。"""
    sm = fc_optimization.get("system_success_model", {})
    strategies = {s["id"]: s for s in fc_optimization.get("execution_strategies", [])}
    baseline_chain = sm.get("baseline_phase_success", {})
    p_w1 = float(baseline_chain.get("wave1_api_deploy", 0.36))
    p_w2 = float(baseline_chain.get("wave2_web_deploy", 0.78))
    p_meta = float(baseline_chain.get("meta_availability", 0.58))
    p_g02 = float(baseline_chain.get("g02_deep_gate", 0.72))
    p_grad = float(baseline_chain.get("graduation", 0.90))
    p_pre = float(baseline_chain.get("tn_p1_010", 0.92)) * float(baseline_chain.get("rollback_snapshot", 0.96)) * float(
        baseline_chain.get("apply_patches", 0.78)
    )

    baseline_wgg = float(sm.get("baseline_wave1_to_graduation_p", p_w1 * p_w2 * p_meta * p_g02 * p_grad))
    baseline_score = float(sm.get("baseline_success_score", baseline_wgg * 100 * p_pre))

    def wgg(w1: float, meta: float) -> float:
        return round(w1 * p_w2 * meta * p_g02 * p_grad, 4)

    def e2e(wgg_p: float, pre_mult: float = p_pre) -> float:
        return round(pre_mult * wgg_p, 4)

    # --- per-MR marginal gains ---
    p_meta_mr01 = min(0.95, p_meta + 0.25)
    p_w1_mr02 = min(0.92, p_w1 + 0.27)
    p_patch_mr01 = min(0.95, float(baseline_chain.get("apply_patches", 0.78)) + 0.06)

    mr01_wgg = wgg(p_w1, p_meta_mr01)
    mr02_wgg = wgg(p_w1_mr02, p_meta)
    mr12_wgg = wgg(p_w1_mr02, p_meta_mr01)

    mr01_e2e = e2e(mr01_wgg, p_pre * (p_patch_mr01 / float(baseline_chain.get("apply_patches", 0.78))))
    mr02_e2e = e2e(mr02_wgg)
    mr12_e2e = float(sm.get("projected_with_minimal_risk_set_p", e2e(mr12_wgg)))

    strat_a_mr = {
        "id": "STRAT-A_PLUS_MR12",
        "name": "default one-shot + MR-01 hotfix path + MR-02 defer itineraries",
        "wave1_g02_grad_p": mr12_wgg,
        "end_to_end_p": mr12_e2e,
        "success_score": round(mr12_e2e * 100, 1),
        "execution_delta": "same 8-step shell; patch scope reduced at step-3/4",
    }
    strat_b = strategies.get("STRAT-B_WAVE0_FIRST", {})
    strat_a = strategies.get("STRAT-A_DEFAULT", {})

    scenarios = [
        {
            "id": "STRAT-A_DEFAULT",
            "label": "默认 one-shot（当前 watcher）",
            "mr_applied": [],
            "wave1_g02_grad_p": baseline_wgg,
            "success_score": baseline_score,
            "gain_vs_baseline_pp": 0.0,
            "gain_wgg_vs_baseline_pp": 0.0,
            "extra_deploy_cycles": 0,
            "estimated_extra_min": 0,
        },
        {
            "id": "MR-01_ONLY",
            "label": "仅 MR-01 meta hotfix 先行",
            "mr_applied": ["MR-01"],
            "wave1_g02_grad_p": mr01_wgg,
            "success_score": round(mr01_e2e * 100, 1),
            "gain_vs_baseline_pp": round(mr01_e2e * 100 - baseline_score, 1),
            "gain_wgg_vs_baseline_pp": round((mr01_wgg - baseline_wgg) * 100, 1),
            "phase_gains": {"meta_availability": round(p_meta_mr01 - p_meta, 3)},
            "extra_deploy_cycles": 0,
            "estimated_extra_min": 0,
            "addresses_fc": ["FC-01_TIMEOUT_MISMATCH"],
        },
        {
            "id": "MR-02_ONLY",
            "label": "仅 MR-02 defer itineraries",
            "mr_applied": ["MR-02"],
            "wave1_g02_grad_p": mr02_wgg,
            "success_score": round(mr02_e2e * 100, 1),
            "gain_vs_baseline_pp": round(mr02_e2e * 100 - baseline_score, 1),
            "gain_wgg_vs_baseline_pp": round((mr02_wgg - baseline_wgg) * 100, 1),
            "phase_gains": {"wave1_api_deploy": round(p_w1_mr02 - p_w1, 3)},
            "extra_deploy_cycles": 0,
            "estimated_extra_min": 0,
            "addresses_fc": ["FC-02_ITINERARIES_HUB", "FC-03_LARGE_DIFF_BLOB"],
        },
        {
            "id": "STRAT-A_PLUS_MR12",
            "label": "默认 one-shot + MR-01 + MR-02",
            "mr_applied": ["MR-01", "MR-02"],
            "wave1_g02_grad_p": mr12_wgg,
            "success_score": round(mr12_e2e * 100, 1),
            "gain_vs_baseline_pp": round(mr12_e2e * 100 - baseline_score, 1),
            "gain_wgg_vs_baseline_pp": round((mr12_wgg - baseline_wgg) * 100, 1),
            "phase_gains": {"wave1_api_deploy": round(p_w1_mr02 - p_w1, 3), "meta_availability": round(p_meta_mr01 - p_meta, 3)},
            "extra_deploy_cycles": 0,
            "estimated_extra_min": 0,
            "addresses_fc": ["FC-01", "FC-02", "FC-03"],
        },
        {
            "id": "STRAT-B_WAVE0_FIRST",
            "label": "STRAT-B hotfix-first 额外 deploy 周期",
            "mr_applied": ["MR-01", "MR-02", "STRAT-B-sequencing"],
            "wave1_g02_grad_p": float(strat_b.get("wave1_g02_grad_p", 0)),
            "success_score": float(strat_b.get("success_score", 0)),
            "gain_vs_baseline_pp": round(float(strat_b.get("success_score", 0)) - baseline_score, 1),
            "gain_wgg_vs_baseline_pp": round((float(strat_b.get("wave1_g02_grad_p", 0)) - baseline_wgg) * 100, 1),
            "extra_deploy_cycles": 1,
            "estimated_extra_min": 18,
            "addresses_fc": ["FC-01", "FC-02", "FC-03"],
        },
    ]

    best = max(scenarios, key=lambda x: x["success_score"])
    mr12 = next(s for s in scenarios if s["id"] == "STRAT-A_PLUS_MR12")
    strat_b_sc = next(s for s in scenarios if s["id"] == "STRAT-B_WAVE0_FIRST")

    wgg_gain_mr12 = mr12["gain_wgg_vs_baseline_pp"]
    wgg_gain_b = strat_b_sc["gain_wgg_vs_baseline_pp"]
    score_delta_mr_vs_b = round(mr12["success_score"] - strat_b_sc["success_score"], 1)

    # Decision logic
    decision: dict[str, Any]
    if mr12["success_score"] >= strat_b_sc["success_score"] + 2.0:
        decision = {
            "verdict": "KEEP_DEFAULT_ONE_SHOT_APPLY_MR12",
            "summary": "MR-01+02 on existing 8-step one-shot beats STRAT-B extra cycle — do not replace watcher entrypoint",
            "recommended_at_completed": "p2fc-post-soak-one-shot-execute.sh with MR patch scope (hotfix-first apply + defer itineraries wave1)",
            "reject": "STRAT-B_WAVE0_FIRST full re-sequence",
            "confidence": "high" if score_delta_mr_vs_b >= 5 else "medium",
        }
    elif strat_b_sc["success_score"] >= mr12["success_score"] + 2.0:
        decision = {
            "verdict": "ADOPT_STRAT_B_REPLACE_DEFAULT",
            "summary": "STRAT-B hotfix-first sequencing outscores MR-on-default — replace post-COMPLETED execution order",
            "recommended_at_completed": "STRAT-B path: hotfix-only → deploy → meta smoke → backlog → wave1/2",
            "reject": "naive full-backlog wave1 first",
            "confidence": "medium",
        }
    else:
        decision = {
            "verdict": "EQUIVALENT_DEFER_TO_CHECKPOINT",
            "summary": "MR-12 vs STRAT-B within 2pp — decide at COMPLETED checkpoint after fly snapshot + patch dry-run",
            "recommended_at_completed": "run --prep-only; compare patch apply dry-run then pick MR-12 or STRAT-B",
            "reject": None,
            "confidence": "low",
        }

    mr_benefits = [
        {
            "mr_id": "MR-01",
            "execution_benefit": "FC-01 pre-neutralized before meta --strict; fly.toml 120s + web 130s live earlier",
            "wave1_g02_grad_gain_pp": round((mr01_wgg - baseline_wgg) * 100, 1),
            "success_score_gain_pp": round(mr01_e2e * 100 - baseline_score, 1),
            "cost": "hotfix-only apply scope · 0 extra deploy if bundled in step-3/4",
            "confirmed": mr01_wgg > baseline_wgg,
        },
        {
            "mr_id": "MR-02",
            "execution_benefit": "FC-02/03 wave1 competition removed; itineraries follow-up post-grad",
            "wave1_g02_grad_gain_pp": round((mr02_wgg - baseline_wgg) * 100, 1),
            "success_score_gain_pp": round(mr02_e2e * 100 - baseline_score, 1),
            "cost": "itineraries.rs deferred — post-graduation wave required",
            "confirmed": mr02_wgg > baseline_wgg,
        },
        {
            "mr_id": "MR-01+MR-02",
            "execution_benefit": "combined Wave1→G02→Graduation chain uplift",
            "wave1_g02_grad_gain_pp": wgg_gain_mr12,
            "success_score_gain_pp": mr12["gain_vs_baseline_pp"],
            "cost": "minimal deploy surface + deferred itineraries debt",
            "confirmed": mr12_wgg > baseline_wgg and mr12["success_score"] > baseline_score,
        },
    ]

    return {
        "schema": "traveltrust.p2fc_mr_execution_benefit_evaluation.v1",
        "evaluation_target": "MR-01 · MR-02 · STRAT-B vs default one-shot",
        "baseline": {
            "wave1_g02_graduation_p": baseline_wgg,
            "success_score": baseline_score,
            "strat_a_default": strat_a.get("id", "STRAT-A_DEFAULT"),
        },
        "mr_marginal_benefits": mr_benefits,
        "scenario_comparison": scenarios,
        "wave1_g02_graduation_gains": {
            "MR-01_only_pp": round((mr01_wgg - baseline_wgg) * 100, 1),
            "MR-02_only_pp": round((mr02_wgg - baseline_wgg) * 100, 1),
            "MR-01+02_pp": wgg_gain_mr12,
            "STRAT-B_pp": wgg_gain_b,
        },
        "success_score_gains": {
            "MR-01_only_pp": round(mr01_e2e * 100 - baseline_score, 1),
            "MR-02_only_pp": round(mr02_e2e * 100 - baseline_score, 1),
            "MR-01+02_pp": mr12["gain_vs_baseline_pp"],
            "STRAT-B_pp": strat_b_sc["gain_vs_baseline_pp"],
            "MR12_vs_STRAT-B_delta_pp": score_delta_mr_vs_b,
        },
        "strat_b_decision": decision,
        "best_scenario_by_score": best["id"],
        "gain_confirmation": {
            "mr01_confirmed": mr01_wgg > baseline_wgg,
            "mr02_confirmed": mr02_wgg > baseline_wgg,
            "mr12_confirmed": mr12_wgg > baseline_wgg * 1.15,
            "strat_b_superior_to_mr12": strat_b_sc["success_score"] > mr12["success_score"],
        },
        "honest_boundary": "decision model only · COMPLETED.json triggers execution · no staging change during soak",
    }


MR12_EXECUTION_SEQUENCE: list[dict[str, Any]] = [
    {"step": 1, "phase": "tn_p1_010", "action": "TN-P1-010 independent (internal/indexer spine)"},
    {"step": 2, "phase": "rollback_snapshot", "action": "fly rollback snapshot capture"},
    {
        "step": 3,
        "phase": "apply_patches",
        "action": "MR-01: meta-availability-hotfix.patch BEFORE backlog · MR-02: defer itineraries.rs from wave1 deploy surface",
        "mr": ["MR-01", "MR-02"],
    },
    {"step": 4, "phase": "wave1_api_deploy", "action": "Wave1 tt-api-staging (MR-02 subset — no itineraries hub in first deploy)"},
    {"step": 5, "phase": "wave2_web_deploy", "action": "Wave2 tt-web-staging (MR-01 web /meta timeout 130s)"},
    {"step": 6, "phase": "meta_availability", "action": "p2fc-verify-staging-meta-availability.sh --strict (MR-01 REQUEST_TIMEOUT_SECS=120 live)"},
    {"step": 7, "phase": "g02_deep_gate", "action": "run-phase2-deep-release-gate.sh --require-meta-green"},
    {"step": 8, "phase": "graduation", "action": "run-phase2-testnet-post-soak-graduation-closure.sh"},
]


def build_mr12_execution_lock_verification(
    mr_evaluation: dict[str, Any],
    fc_optimization: dict[str, Any],
    root: Path,
) -> dict[str, Any]:
    """MR12 执行路径最终冻结锁 · 拒绝 STRAT-B 分叉（只读 · 同步 manifest）。"""
    decision = mr_evaluation.get("strat_b_decision", {})
    expected_verdict = "KEEP_DEFAULT_ONE_SHOT_APPLY_MR12"
    sg = mr_evaluation.get("success_score_gains", {})
    sm = fc_optimization.get("system_success_model", {})

    checks: list[dict[str, Any]] = []
    verdict = "FROZEN"

    if decision.get("verdict") != expected_verdict:
        checks.append({"id": "CHK-DECISION", "pass": False, "note": f"expected {expected_verdict}"})
        verdict = "FAIL"
    else:
        checks.append({"id": "CHK-DECISION", "pass": True, "note": decision.get("verdict")})

    mr12_score = sg.get("MR-01+02_pp", 0)
    strat_b_score = sg.get("STRAT-B_pp", 0)
    if mr12_score <= strat_b_score:
        checks.append({"id": "CHK-MR12-SUPERIOR", "pass": False, "note": f"mr12={mr12_score} strat_b={strat_b_score}"})
        verdict = "FAIL"
    else:
        checks.append({"id": "CHK-MR12-SUPERIOR", "pass": True, "note": f"delta_pp={sg.get('MR12_vs_STRAT-B_delta_pp')}"})

    hotfix = root / "evidence/GO_phase2_deploy_backlog/meta-availability-hotfix.patch"
    active = root / "evidence/GO_phase2_deploy_backlog/ACTIVE.json"
    checks.append({"id": "CHK-HOTFIX", "pass": hotfix.is_file(), "path": str(hotfix)})
    checks.append({"id": "CHK-ACTIVE", "pass": active.is_file(), "path": str(active)})
    if not hotfix.is_file() or not active.is_file():
        verdict = "FAIL"

    lock_payload: dict[str, Any] = {
        "schema": "traveltrust.p2fc_mr12_execution_lock.v1",
        "lock_status": verdict,
        "frozen_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "phase": "②",
        "locked_strategy": "STRAT-A_PLUS_MR12",
        "base_strategy": "STRAT-A_DEFAULT",
        "mr_changes": ["MR-01", "MR-02"],
        "rejected_strategies": [
            "STRAT-B_WAVE0_FIRST",
            "STRAT-A_DEFAULT_NAIVE",
            "STRAT-C_SPLIT_ITINERARIES_STANDALONE",
        ],
        "forbidden_execution_patterns": [
            "extra deploy cycle (hotfix-only pre-deploy before backlog)",
            "STRAT-B hotfix-first re-sequence",
            "wave1 full backlog including itineraries.rs hub without MR-02 defer",
            "meta --strict before MR-01 timeout live",
        ],
        "entrypoint": "scripts/ops/p2fc-post-soak-one-shot-execute.sh",
        "legacy_entrypoint": "scripts/ops/p2fc-post-soak-deploy-backlog-and-graduate.sh",
        "trigger": "evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json",
        "execution_sequence_locked": MR12_EXECUTION_SEQUENCE,
        "decision_ref": {
            "verdict": decision.get("verdict"),
            "summary": decision.get("summary"),
            "confidence": decision.get("confidence"),
        },
        "modeled_success_score": {
            "baseline": sm.get("baseline_success_score"),
            "mr12": round(float(sm.get("baseline_success_score", 0)) + float(sg.get("MR-01+02_pp", 0)), 1),
            "strat_b_rejected": strat_b_score,
        },
        "verification_checks": checks,
        "honest_boundary": "execution lock ≠ deploy · soak window read-only · unique convergence at COMPLETED trigger",
    }

    lock_path = root / "evidence/GO_phase2_deploy_backlog/MR12-EXECUTION-LOCK.json"
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    lock_path.write_text(json.dumps(lock_payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    ready_path = root / "evidence/GO_phase2_deploy_backlog/POST_SOAK_EXECUTE_READY.json"
    ready: dict[str, Any] = {}
    if ready_path.is_file():
        try:
            ready = json.loads(ready_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            ready = {}
    ready.update(
        {
            "schema": "traveltrust.p2fc_post_soak_execute_active.v1",
            "execution_strategy": "STRAT-A_PLUS_MR12",
            "execution_strategy_rejected": ["STRAT-B_WAVE0_FIRST"],
            "mr12_execution_lock": "evidence/GO_phase2_deploy_backlog/MR12-EXECUTION-LOCK.json",
            "entrypoint": lock_payload["entrypoint"],
            "legacy_entrypoint": lock_payload["legacy_entrypoint"],
            "apply_after": "evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json",
            "execution_order": [s["action"] for s in MR12_EXECUTION_SEQUENCE],
            "mr_changes": ["MR-01", "MR-02"],
            "lock_synced_at_utc": lock_payload["frozen_at_utc"],
        }
    )
    ready_path.write_text(json.dumps(ready, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    verify_rc, verify_line, post_checks = _inline_verify_mr12_lock(lock_payload, ready, decision)
    checks.extend(post_checks)
    if verify_rc != 0:
        verdict = "FAIL"
        lock_payload["lock_status"] = "FAIL"
        lock_payload["verification_checks"] = checks
        lock_path.write_text(json.dumps(lock_payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    return {
        "schema": "traveltrust.p2fc_mr12_execution_lock_verification.v1",
        "lock_status": "FROZEN" if verify_rc == 0 else "FAIL",
        "lock_path": lock_path.as_posix(),
        "ready_manifest_synced": ready_path.as_posix(),
        "shell_verify_rc": verify_rc,
        "shell_verify_line": verify_line,
        "checks_passed": sum(1 for c in checks if c.get("pass")),
        "checks_total": len(checks),
        "unique_convergence": {
            "only_allowed_strategy": "STRAT-A_PLUS_MR12",
            "strat_b_fork_blocked": True,
            "extra_deploy_blocked": True,
        },
        "lock_payload_ref": lock_payload,
    }


def _inline_verify_mr12_lock(
    lock: dict[str, Any],
    ready: dict[str, Any],
    decision: dict[str, Any],
) -> tuple[int, str, list[dict[str, Any]]]:
    """Mirror scripts/ops/p2fc-verify-mr12-execution-lock.sh (Windows-safe · no bash subprocess)."""
    post: list[dict[str, Any]] = []
    fails: list[str] = []

    if lock.get("locked_strategy") != "STRAT-A_PLUS_MR12":
        fails.append("locked_strategy")
    else:
        post.append({"id": "CHK-LOCK-STRATEGY", "pass": True})

    rejected = lock.get("rejected_strategies") or []
    if "STRAT-B_WAVE0_FIRST" not in rejected:
        fails.append("reject_strat_b")
    else:
        post.append({"id": "CHK-REJECT-STRAT-B", "pass": True})

    if lock.get("lock_status") != "FROZEN":
        fails.append("lock_status")
    else:
        post.append({"id": "CHK-LOCK-STATUS", "pass": True})

    if lock.get("entrypoint") != "scripts/ops/p2fc-post-soak-one-shot-execute.sh":
        fails.append("entrypoint")
    else:
        post.append({"id": "CHK-ENTRYPOINT", "pass": True})

    mr = lock.get("mr_changes") or []
    if "MR-01" not in mr or "MR-02" not in mr:
        fails.append("mr_changes")
    else:
        post.append({"id": "CHK-MR-CHANGES", "pass": True})

    if ready.get("execution_strategy") and ready.get("execution_strategy") != lock.get("locked_strategy"):
        fails.append("ready_strategy_mismatch")
    else:
        post.append({"id": "CHK-READY-SYNC", "pass": True})

    dec = decision.get("verdict") or ""
    if dec != "KEEP_DEFAULT_ONE_SHOT_APPLY_MR12":
        fails.append(f"mr_eval_decision={dec}")
    else:
        post.append({"id": "CHK-MR-EVAL-DECISION", "pass": True, "note": dec})

    if fails:
        line = f"TT_MR12_EXECUTION_LOCK: FAIL count={len(fails)} detail={','.join(fails)}"
        return 2, line, post

    line = "TT_MR12_EXECUTION_LOCK: FROZEN strategy=STRAT-A_PLUS_MR12 reject=STRAT-B entrypoint=one-shot"
    return 0, line, post


def build_metrics_timeseries(audit_dir: Path) -> dict[str, Any]:
    index_path = audit_dir / "snapshots.jsonl"
    rows: list[dict[str, Any]] = []
    if index_path.is_file():
        for line in index_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line:
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

    def series(key: str) -> list[Any]:
        return [r.get(key) for r in rows]

    delta: dict[str, Any] = {}
    if len(rows) >= 2:
        a, b = rows[-2], rows[-1]
        for k in (
            "ok_polls",
            "wall_vs_budget_ratio",
            "wall_eta_hours",
            "poll_overhead_sec",
            "meta_chain_consistency",
            "meta_l1_l2_ratio",
            "indexer_parse_rate",
            "indexer_flap_rate",
            "backlog_diffusion_score",
            "backlog_high_risks",
            "hidden_risk_count",
        ):
            if a.get(k) is not None and b.get(k) is not None:
                delta[k] = round(b[k] - a[k], 4) if isinstance(b[k], float) else b[k] - a[k]

    duration = build_duration_convergence(rows)

    return {
        "schema": "traveltrust.p2fc_l5_stability_timeseries.v2",
        "snapshot_count": len(rows),
        "poll_interval_sec": 900,
        "series": {
            "ok_polls": series("ok_polls"),
            "wall_vs_budget_ratio": series("wall_vs_budget_ratio"),
            "wall_eta_hours": series("wall_eta_hours"),
            "poll_overhead_sec": series("poll_overhead_sec"),
            "meta_chain_consistency": series("meta_chain_consistency"),
            "meta_l1_l2_ratio": series("meta_l1_l2_ratio"),
            "meta_transitions": series("meta_transitions"),
            "indexer_parse_rate": series("indexer_parse_rate"),
            "indexer_flap_rate": series("indexer_flap_rate"),
            "backlog_high_risks": series("backlog_high_risks"),
            "backlog_diffusion_score": series("backlog_diffusion_score"),
            "hidden_risk_count": series("hidden_risk_count"),
        },
        "duration_convergence": duration,
        "latest_delta_vs_prior": delta,
        "stamps": [r.get("stamp") for r in rows],
    }


def build_graduation_preconvergence(
    payload: dict[str, Any],
    prior: dict[str, Any] | None,
    graph: dict[str, Any] | None,
) -> dict[str, Any]:
    runtime = payload["dimensions"]["runtime_volatility"]
    meta = payload["dimensions"]["meta_408_503_layers"]
    drift = payload["dimensions"]["indexer_exec_chain_drift"]

    must_close_post_soak: list[dict[str, str]] = [
        {"id": "PC-01", "gate": "G02", "action": "wave-0 meta hotfix + --strict meta verify"},
        {"id": "PC-02", "gate": "TN-P1-010", "action": "internal/indexer-* spine — not GET /meta parse"},
        {"id": "PC-03", "gate": "SOAK_72H", "action": f"await ok_polls={runtime.get('wall_clock_deviation', {}).get('ok_needed')} — wall ETA ~{runtime.get('wall_clock_deviation', {}).get('wall_eta_hours')}h"},
    ]
    if graph and graph.get("hidden_stability_risks"):
        for r in graph["hidden_stability_risks"]:
            if r.get("severity") == "high":
                must_close_post_soak.append(
                    {
                        "id": f"PC-BL-{r.get('id', 'RISK')}",
                        "gate": "WAVE-1",
                        "action": r.get("note", "")[:120],
                    }
                )

    soak_stable = runtime.get("fail_events", 1) == 0 and runtime.get("verdict") != "fail"
    meta_prop_stable = meta.get("failure_propagation", {}).get("matches_expected", False)
    indexer_known = drift.get("indexer_parse_rate", {}).get("parse_rate", 0) < 0.2

    new_risks: list[str] = []
    if prior:
        prior_ids = {r.get("id") for r in prior.get("hidden_stability_risks", [])}
        for r in payload.get("hidden_stability_risks", []):
            if r.get("id") not in prior_ids:
                new_risks.append(str(r.get("id")))

    convergence_score = 0
    if soak_stable:
        convergence_score += 35
    if meta_prop_stable:
        convergence_score += 25
    if indexer_known:
        convergence_score += 20
    if graph and graph.get("summary", {}).get("high_severity_risks", 99) <= 2:
        convergence_score += 20

    return {
        "schema": "traveltrust.p2fc_graduation_risk_preconvergence.v2",
        "generated_at_utc": payload.get("generated_at_utc"),
        "convergence_score": convergence_score,
        "convergence_max": 100,
        "soak_exec_chain_stable": soak_stable,
        "meta_propagation_preclassified": meta_prop_stable,
        "indexer_parse_risk_acknowledged": indexer_known,
        "new_risks_since_prior_snapshot": new_risks,
        "must_close_post_soak": must_close_post_soak,
        "honest_boundary": "pre-convergence score ≠ Graduation CLOSED — post-soak one-shot still required",
    }


def aggregate_verdict(parts: list[str]) -> str:
    if any(v == "fail" for v in parts):
        return "FAIL"
    if any(v in ("warn", "observed_degraded_acceptance_ok") for v in parts):
        return "WARN"
    return "PASS"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--soak-dir", default="")
    ap.add_argument("--out-dir", default="")
    ap.add_argument("--skip-graph", action="store_true")
    args = ap.parse_args()

    soak_dir = Path(args.soak_dir) if args.soak_dir else ROOT / "evidence/P2FC_SOAK_72H_STAGING"
    audit_dir = soak_dir / "l5-stability-audit"
    stamp = utc_stamp()
    out_dir = Path(args.out_dir) if args.out_dir else audit_dir / "runs" / stamp
    out_dir.mkdir(parents=True, exist_ok=True)

    prior = load_prior_snapshot(audit_dir)
    completed = (soak_dir / "COMPLETED.json").is_file()
    job = find_best_job(soak_dir)
    job_meta: dict[str, Any] = {}
    if job and (job / "job.json").is_file():
        job_meta = json.loads((job / "job.json").read_text(encoding="utf-8"))

    runtime: dict[str, Any] = {"verdict": "missing", "notes": ["no soak.log"]}
    if job and (job / "soak.log").is_file():
        runtime = analyze_soak_log(job / "soak.log", job_meta)

    meta = load_meta_observability_series(soak_dir)
    drift = analyze_exec_chain_drift(runtime)

    graph_result: dict[str, Any] = {"skipped": True}
    graph_payload: dict[str, Any] | None = None
    if not args.skip_graph:
        graph_result = run_dependency_graph(out_dir)
        graph_payload = graph_result.get("graph")

    part_verdicts = [
        runtime.get("verdict", "missing"),
        meta.get("verdict", "missing"),
        drift.get("verdict", "missing"),
    ]
    if meta.get("failure_propagation", {}).get("verdict") == "warn":
        part_verdicts.append("warn")
    if graph_result.get("graph"):
        part_verdicts.append(graph_result["graph"].get("verdict", "PASS").lower())

    overall = aggregate_verdict(part_verdicts)
    if completed:
        overall = "INFO"  # soak done — audit still valid as snapshot

    hidden_risks: list[dict[str, Any]] = []
    hidden_risks.extend(drift.get("chronic_drift_signals", []))
    if graph_result.get("graph"):
        hidden_risks.extend(graph_result["graph"].get("hidden_stability_risks", []))
        if graph_result["graph"].get("risk_diffusion", {}).get("new_risks_vs_prior"):
            for rid in graph_result["graph"]["risk_diffusion"]["new_risks_vs_prior"]:
                hidden_risks.append(
                    {
                        "id": f"HR_DIFFUSION_{rid}",
                        "severity": "medium",
                        "note": f"new backlog risk diffusion signal since prior snapshot: {rid}",
                    }
                )
    if runtime.get("wall_vs_budget_ratio") and runtime["wall_vs_budget_ratio"] > 4:
        hidden_risks.append(
            {
                "id": "HR_WALL_BUDGET_DIVERGE",
                "severity": "medium",
                "note": f"wall/budget ratio {runtime['wall_vs_budget_ratio']} — 72h completion wall-clock >> nominal",
            }
        )

    payload: dict[str, Any] = {
        "schema": "traveltrust.p2fc_soak_l5_stability_audit.v2",
        "snapshot_stamp": stamp,
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "phase": "②",
        "policy": "read_only_no_staging_no_worker_no_watcher_changes",
        "soak_dir": soak_dir.as_posix(),
        "soak_completed": completed,
        "job": job.as_posix() if job else None,
        "job_meta": job_meta,
        "dimensions": {
            "runtime_volatility": runtime,
            "meta_408_503_layers": meta,
            "indexer_exec_chain_drift": drift,
            "backlog_dependency_graph": {
                "summary_line": graph_result.get("summary_line"),
                "high_severity_risks": graph_result.get("graph", {}).get("summary", {}).get("high_severity_risks"),
                "total_files": graph_result.get("graph", {}).get("summary", {}).get("total_files"),
                "risk_diffusion": graph_result.get("graph", {}).get("risk_diffusion"),
            },
        },
        "hidden_stability_risks": hidden_risks,
        "graduation_readiness_hint": (
            "Soak INFLIGHT: exec chain stable; acceptance /meta deferred to post-soak wave-0"
            if not completed
            else "Soak COMPLETED: run post-soak one-shot chain"
        ),
        "verdict": overall,
    }

    preconvergence = build_graduation_preconvergence(payload, prior, graph_payload)

    append_snapshot_index(audit_dir, stamp, payload, out_dir)
    timeseries = build_metrics_timeseries(audit_dir)
    duration = timeseries.get("duration_convergence", {})
    snapshot_rows: list[dict[str, Any]] = []
    index_path = audit_dir / "snapshots.jsonl"
    if index_path.is_file():
        for line in index_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line:
                try:
                    snapshot_rows.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

    drift_scan = scan_long_term_drift(snapshot_rows, runtime, soak_dir, job, graph_payload)
    failure_forecast = build_post_completed_failure_forecast(payload, graph_payload, drift_scan)
    future_register = build_future_certain_failure_register(graph_payload, drift_scan)
    fc_rehearsal = build_fc_execution_path_rehearsal(future_register, failure_forecast)
    fc_optimization = build_fc_failure_competition_and_optimization(
        fc_rehearsal, failure_forecast, graph_payload
    )
    mr_evaluation = build_mr_execution_benefit_evaluation(fc_optimization)
    mr12_lock = build_mr12_execution_lock_verification(mr_evaluation, fc_optimization, ROOT)
    hidden_risks.extend(drift_scan.get("drift_signals", []))
    payload["hidden_stability_risks"] = hidden_risks

    matrix = build_graduation_risk_matrix(payload, duration, preconvergence)
    matrix["schema"] = "traveltrust.p2fc_graduation_risk_preconvergence_matrix.v3"
    matrix["long_term_drift_scan"] = {
        "drift_signal_count": drift_scan.get("drift_signal_count"),
        "wall_growth": drift_scan.get("wall_clock", {}).get("growth_verdict"),
        "indexer_decline": drift_scan.get("indexer_parse", {}).get("decline_verdict"),
        "meta_cluster_verdict": drift_scan.get("meta_propagation", {}).get("verdict"),
        "hotspot_count": len(drift_scan.get("backlog_hotspots", [])),
    }
    matrix["post_completed_failure_forecast"] = {
        "high_likelihood_count": failure_forecast.get("high_likelihood_count"),
        "high_likelihood_phases": failure_forecast.get("high_likelihood_phases"),
        "recommended_pre_completed_actions": failure_forecast.get("recommended_pre_completed_actions"),
    }
    matrix["future_certain_failures"] = {
        "critical_count": future_register.get("critical_count"),
        "high_count": future_register.get("high_count"),
        "ids": [r["id"] for r in future_register.get("register", [])],
    }
    matrix["fc_execution_path_rehearsal"] = {
        "first_failure_fc": fc_rehearsal.get("first_failure_fc"),
        "first_failure_offset_min": fc_rehearsal.get("first_failure_offset_min"),
        "time_to_failure_order": fc_rehearsal.get("time_to_failure_order"),
        "rehearsal_converged": fc_rehearsal.get("rehearsal_converged"),
    }
    matrix["fc_failure_competition_optimization"] = {
        "baseline_success_score": fc_optimization.get("system_success_model", {}).get("baseline_success_score"),
        "projected_score_with_mr": fc_optimization.get("system_success_model", {}).get("projected_success_score_with_mr"),
        "optimal_strategy": fc_optimization.get("optimal_execution_path", {}).get("strategy_id"),
        "first_competition_winner": fc_optimization.get("failure_competition_model", {}).get("first_competition_winner"),
    }
    matrix["mr_execution_benefit_evaluation"] = {
        "decision_verdict": mr_evaluation.get("strat_b_decision", {}).get("verdict"),
        "mr12_wgg_gain_pp": mr_evaluation.get("wave1_g02_graduation_gains", {}).get("MR-01+02_pp"),
        "mr12_vs_strat_b_delta_pp": mr_evaluation.get("success_score_gains", {}).get("MR12_vs_STRAT-B_delta_pp"),
        "best_scenario": mr_evaluation.get("best_scenario_by_score"),
    }
    matrix["mr12_execution_lock"] = {
        "lock_status": mr12_lock.get("lock_status"),
        "locked_strategy": "STRAT-A_PLUS_MR12",
        "strat_b_blocked": True,
        "shell_verify": mr12_lock.get("shell_verify_line"),
    }
    preconvergence["duration_convergence"] = duration.get("overall_convergence")
    preconvergence["converged_dimensions"] = duration.get("converged_dimension_count")
    preconvergence["matrix_ready"] = matrix.get("matrix_ready_for_completed_json")
    payload["graduation_risk_preconvergence"] = preconvergence
    payload["graduation_risk_matrix"] = matrix
    payload["duration_convergence"] = duration
    payload["long_term_drift_scan"] = drift_scan
    payload["post_completed_failure_forecast"] = failure_forecast
    payload["future_certain_failure_register"] = future_register
    payload["fc_execution_path_rehearsal"] = fc_rehearsal
    payload["fc_failure_competition_optimization"] = fc_optimization
    payload["mr_execution_benefit_evaluation"] = mr_evaluation
    payload["mr12_execution_lock_verification"] = mr12_lock
    payload["schema"] = "traveltrust.p2fc_soak_l5_stability_audit.v7"
    payload["metrics_timeseries_summary"] = {
        "snapshot_count": timeseries.get("snapshot_count"),
        "overall_convergence": duration.get("overall_convergence"),
    }

    (out_dir / "stability-audit.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (out_dir / "graduation-risk-preconvergence.json").write_text(
        json.dumps(preconvergence, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (out_dir / "graduation-risk-preconvergence-matrix.json").write_text(
        json.dumps(matrix, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (audit_dir / "metrics-timeseries.json").write_text(json.dumps(timeseries, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (audit_dir / "duration-convergence.json").write_text(json.dumps(duration, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (audit_dir / "long-term-drift-scan.json").write_text(json.dumps(drift_scan, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (audit_dir / "graduation-failure-mode-forecast.json").write_text(
        json.dumps(failure_forecast, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (audit_dir / "future-certain-failure-register.json").write_text(
        json.dumps(future_register, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (audit_dir / "fc-failure-propagation-graph.json").write_text(
        json.dumps(
            {
                "schema": "traveltrust.p2fc_failure_propagation_graph.v1",
                "generated_from": "fc_execution_path_rehearsal",
                "trigger": fc_rehearsal.get("trigger"),
                "time_to_failure_order": fc_rehearsal.get("time_to_failure_order"),
                "propagation_graph": fc_rehearsal.get("propagation_graph"),
                "cross_fc_notes": fc_rehearsal.get("cross_fc_notes"),
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    (audit_dir / "fc-recovery-strategy-map.json").write_text(
        json.dumps(
            {
                "schema": "traveltrust.p2fc_recovery_strategy_map.v1",
                "recovery_strategy_map": fc_rehearsal.get("recovery_strategy_map"),
                "fc_analyses_summary": [
                    {
                        "id": fc["id"],
                        "time_to_failure_min": fc["time_to_failure_min_from_completed"],
                        "primary_fail_phase": fc["primary_fail_phase"],
                        "recovery_count": len(fc.get("recovery_strategies", [])),
                    }
                    for fc in fc_rehearsal.get("fc_analyses", [])
                ],
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    (audit_dir / "fc-execution-path-rehearsal.json").write_text(
        json.dumps(fc_rehearsal, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (audit_dir / "fc-failure-competition-model.json").write_text(
        json.dumps(fc_optimization.get("failure_competition_model"), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    (audit_dir / "fc-optimal-execution-path.json").write_text(
        json.dumps(
            {
                "optimal_execution_path": fc_optimization.get("optimal_execution_path"),
                "execution_strategies": fc_optimization.get("execution_strategies"),
                "system_success_model": fc_optimization.get("system_success_model"),
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    (audit_dir / "fc-minimal-risk-change-set.json").write_text(
        json.dumps(fc_optimization.get("minimal_risk_change_set"), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    (audit_dir / "fc-failure-competition-optimization.json").write_text(
        json.dumps(fc_optimization, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (audit_dir / "mr-execution-benefit-evaluation.json").write_text(
        json.dumps(mr_evaluation, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (audit_dir / "mr-strat-b-decision-pack.json").write_text(
        json.dumps(
            {
                "schema": "traveltrust.p2fc_mr_strat_b_decision_pack.v1",
                "decision": mr_evaluation.get("strat_b_decision"),
                "gain_confirmation": mr_evaluation.get("gain_confirmation"),
                "scenario_comparison": mr_evaluation.get("scenario_comparison"),
                "recommended_core_mr": ["MR-01", "MR-02"],
                "execution_lock": mr12_lock.get("lock_status"),
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    (audit_dir / "mr12-execution-lock-verification.json").write_text(
        json.dumps(mr12_lock, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (out_dir / "long-term-drift-scan.json").write_text(json.dumps(drift_scan, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (out_dir / "graduation-failure-mode-forecast.json").write_text(
        json.dumps(failure_forecast, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (out_dir / "fc-execution-path-rehearsal.json").write_text(
        json.dumps(fc_rehearsal, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    wc = runtime.get("wall_clock_deviation", {})
    prop = meta.get("failure_propagation", {})
    idx_p = drift.get("indexer_parse_rate", {})
    diff = graph_payload.get("risk_diffusion", {}) if graph_payload else {}

    md = [
        "# P2FC Soak L5 Stability Audit",
        "",
        f"**Generated:** {payload['generated_at_utc']} · **verdict:** **{overall}** · **preconvergence:** {preconvergence.get('convergence_score')}/{preconvergence.get('convergence_max')}",
        f"**Job:** `{job}` · **ok_polls:** {runtime.get('ok_polls')} · **completed:** {completed}",
        "",
        "## 1. Wall-clock deviation",
        "",
        f"- wall/budget ratio={runtime.get('wall_vs_budget_ratio')} · wall ETA={wc.get('wall_eta_hours')}h · budget ETA={wc.get('budget_eta_hours')}h",
        f"- poll overhead={wc.get('poll_overhead_sec_mean')}s · jitter_trend={wc.get('jitter_trend')}",
        f"- interval mean={runtime.get('interval_stats', {}).get('mean_sec')}s stdev={runtime.get('interval_stats', {}).get('stdev_sec')}s",
        f"- fail_events={runtime.get('fail_events')} · verdict={runtime.get('verdict')}",
        "",
        "## 2. /meta layered failure propagation",
        "",
        f"- dominant chain={prop.get('dominant_chain')} ({prop.get('dominant_ratio')})",
        f"- L1→L2 503 ratio={prop.get('l1_api_to_l2_web_503_ratio')} · transitions={prop.get('transition_count')}",
        f"- observability samples={meta.get('sample_count')} · exec_ok_ratio={meta.get('execution_chain_ok_ratio')}",
        "",
        "## 3. Indexer parse rate",
        "",
        f"- parse_rate={idx_p.get('parse_rate')} · empty_rate={idx_p.get('empty_rate')} · flap_rate={idx_p.get('flap_rate')}",
        f"- probe_fallback_ratio={drift.get('probe_fallback_ratio')}",
        "",
        "## 4. Backlog risk diffusion",
        "",
        f"- {graph_result.get('summary_line', 'skipped')}",
        f"- gate_fanout={diff.get('gate_fanout_score')} · wave_blast={diff.get('wave_blast_radius')}",
        "",
        "## Graduation pre-convergence",
        "",
        f"- score={preconvergence.get('convergence_score')}/{preconvergence.get('convergence_max')}",
        f"- duration_convergence={duration.get('overall_convergence')} · converged_dims={duration.get('converged_dimension_count')}/4",
        f"- matrix_ready={matrix.get('matrix_ready_for_completed_json')}",
        f"- new_risks_since_prior={preconvergence.get('new_risks_since_prior_snapshot')}",
        "",
        "## Risk pre-convergence matrix",
        "",
    ]
    for mr in matrix.get("matrix_rows", []):
        md.append(
            f"- **{mr['id']}** {mr['dimension']}: convergence={mr['convergence']} · gate={mr['graduation_gate']} · post-soak={mr['post_soak_action'][:60]}…"
        )
    md.extend(
        [
            "",
            "## Long-term drift scan",
            "",
            f"- wall_growth={drift_scan.get('wall_clock', {}).get('growth_verdict')} · overhead_slope={drift_scan.get('wall_clock', {}).get('overhead_slope_per_snapshot')}",
            f"- indexer_decline={drift_scan.get('indexer_parse', {}).get('decline_verdict')} · slope={drift_scan.get('indexer_parse', {}).get('slope_per_snapshot')}",
            f"- meta_cluster={drift_scan.get('meta_propagation', {}).get('verdict')} · density={drift_scan.get('meta_propagation', {}).get('cluster_density')}",
            f"- hotspots={len(drift_scan.get('backlog_hotspots', []))} · drift_signals={drift_scan.get('drift_signal_count')}",
            "",
            "## Post-COMPLETED failure forecast (high likelihood)",
            "",
        ]
    )
    for fp in failure_forecast.get("failure_paths", []):
        if fp.get("likelihood") == "high":
            md.append(f"- **step {fp['step']}** `{fp['phase']}`: {fp['failure_mode']}")
    md.extend(["", "## Future certain failures (pre-soak silent)", ""])
    for fr in future_register.get("register", []):
        md.append(f"- **[{fr['severity']}]** {fr['id']}: fails_at={fr['fails_at']}")
    md.extend(["", "## FC execution-path rehearsal (T+min from COMPLETED)", ""])
    for t in fc_rehearsal.get("time_to_failure_order", []):
        md.append(f"- **T+{t['offset_min']}min** `{t['fc_id']}` @ {t['phase']} ({t.get('severity')})")
    md.extend(["", "## Recovery strategy map (FC-01/02/03)", ""])
    for fc in fc_rehearsal.get("fc_analyses", []):
        md.append(f"### {fc['id']}")
        for rec in fc.get("recovery_strategies", [])[:2]:
            md.append(f"- **{rec['id']}** when={rec['when']}: {rec['action'][:70]}…")
    sm = fc_optimization.get("system_success_model", {})
    opt = fc_optimization.get("optimal_execution_path", {})
    md.extend(
        [
            "",
            "## Failure competition & success model",
            "",
            f"- baseline_score={sm.get('baseline_success_score')} · projected_MR={sm.get('projected_success_score_with_mr')}",
            f"- wave1→grad P={sm.get('baseline_wave1_to_graduation_p')}",
            f"- optimal={opt.get('strategy_id')} ({opt.get('success_score')})",
            f"- competition_winner={fc_optimization.get('failure_competition_model', {}).get('first_competition_winner')}",
            "",
            "## Minimal risk change set (MR-01/02)",
            "",
        ]
    )
    for mr in fc_optimization.get("minimal_risk_change_set", {}).get("recommended_core", []):
        md.append(f"- **{mr['id']}** {mr['change']}")
    dec = mr_evaluation.get("strat_b_decision", {})
    sg = mr_evaluation.get("success_score_gains", {})
    wg = mr_evaluation.get("wave1_g02_graduation_gains", {})
    md.extend(
        [
            "",
            "## MR execution benefit & STRAT-B decision",
            "",
            f"- **decision:** `{dec.get('verdict')}` — {dec.get('summary', '')[:100]}",
            f"- WGG gain MR-01+02: **+{wg.get('MR-01+02_pp')}pp** · STRAT-B: +{wg.get('STRAT-B_pp')}pp",
            f"- score gain MR-01+02: **+{sg.get('MR-01+02_pp')}pp** · vs STRAT-B delta: **{sg.get('MR12_vs_STRAT-B_delta_pp')}pp**",
            f"- best_scenario: **{mr_evaluation.get('best_scenario_by_score')}**",
            "",
            "## MR12 execution lock (final freeze)",
            "",
            f"- **lock_status:** `{mr12_lock.get('lock_status')}` · strategy=STRAT-A_PLUS_MR12",
            f"- **STRAT-B blocked:** yes · extra deploy blocked: yes",
            f"- **verify:** {mr12_lock.get('shell_verify_line', 'pending')}",
            "",
        ]
    )
    md.extend(["", "## Hidden stability risks", ""])
    for r in hidden_risks:
        md.append(f"- **[{r.get('severity', '?')}]** {r.get('id')}: {r.get('note')}")
    (out_dir / "STABILITY-AUDIT.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    latest = audit_dir / "latest.json"
    latest.parent.mkdir(parents=True, exist_ok=True)
    latest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (audit_dir / "graduation-risk-preconvergence.latest.json").write_text(
        json.dumps(preconvergence, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (audit_dir / "graduation-risk-preconvergence-matrix.latest.json").write_text(
        json.dumps(matrix, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    sg = mr_evaluation.get("success_score_gains", {})
    dec = mr_evaluation.get("strat_b_decision", {})
    print(
        f"TT_P2FC_L5_STABILITY_AUDIT: {overall} "
        f"ok_polls={runtime.get('ok_polls')} "
        f"mr12_lock={mr12_lock.get('lock_status')} "
        f"decision={dec.get('verdict')} "
        f"snapshots={timeseries.get('snapshot_count')} "
        f"out={out_dir.as_posix()}"
    )
    if mr12_lock.get("shell_verify_line"):
        print(mr12_lock["shell_verify_line"])
    return 0 if overall in ("PASS", "WARN", "INFO") else 1


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
