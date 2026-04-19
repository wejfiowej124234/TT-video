#!/usr/bin/env python3
"""
B-481：跨区域容灾演练 — 对全局 LB / 区域入口做 HTTP 探针，支持运维填入复制滞后、RPO、延迟分位数。

区域级故障（整节点 / 整 AZ / 整 Region）在环境侧注入；可选 B481_EXTRA_METRICS_JSON 合并入每段。

环境变量（probe）：
  B481_LB_BASE          探针入口（常为 GSLB / 全局 LB 根 URL）
  B481_SEGMENT          normal_single_region | fault_whole_node | fault_whole_az | fault_whole_region |
                        failover_traffic_switch | recovery_steady
  B481_RUN_DIR
  B481_DURATION_SEC     默认 30
  B481_WORKERS          默认 16
  B481_PROBE_PATHS      默认 /meta,/metrics
  B481_EXTRA_METRICS_JSON  可选 JSON，合并入本段（如 replication_lag_sec_max_observed、p95_latency_ms、rpo_sec_observed）

finalize：python3 scripts/ops/b481-multi-region-dr-acceptance.py --finalize
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, wait
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_PG_LINE = re.compile(r"^traveltrust_pg_pool_([a-z0-9_]+)\s+([0-9.eE+-]+)\s*$")

SEGMENTS = frozenset(
    {
        "normal_single_region",
        "fault_whole_node",
        "fault_whole_az",
        "fault_whole_region",
        "failover_traffic_switch",
        "recovery_steady",
    },
)


def _root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def parse_prometheus_pg_pool(text: str) -> dict[str, float]:
    out: dict[str, float] = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = _PG_LINE.match(line)
        if m:
            out[m.group(1)] = float(m.group(2))
    return out


def http_get(url: str, timeout: float = 25.0) -> tuple[int, str]:
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            return resp.getcode(), body
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode("utf-8", errors="replace")
        except Exception:
            body = ""
        return e.code, body
    except Exception:
        return 0, ""


def worker_loop(
    base: str,
    paths: list[str],
    stop_at: float,
    counters: dict[str, int],
    lock: threading.Lock,
    util_samples: list[float],
    util_lock: threading.Lock,
) -> None:
    base = base.rstrip("/")
    while time.time() < stop_at:
        p = paths[int(time.time() * 1000) % len(paths)]
        url = f"{base}{p}"
        code, body = http_get(url)
        with lock:
            counters["total"] += 1
            if 200 <= code < 300:
                counters["ok_2xx"] += 1
            elif code == 429:
                counters["r429"] += 1
            elif 500 <= code < 600:
                counters["r5xx"] += 1
            else:
                counters["other_err"] += 1
        if p == "/metrics" and 200 <= code < 300:
            m = parse_prometheus_pg_pool(body)
            u = m.get("utilization_ratio")
            if u is not None:
                with util_lock:
                    util_samples.append(float(u))


def run_probe(
    base: str,
    paths: list[str],
    duration: float,
    workers: int,
) -> dict[str, Any]:
    c = {"total": 0, "ok_2xx": 0, "r429": 0, "r5xx": 0, "other_err": 0}
    lock = threading.Lock()
    util_samples: list[float] = []
    util_lock = threading.Lock()
    stop = time.time() + duration
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=max(1, workers)) as ex:
        futs = [
            ex.submit(worker_loop, base, paths, stop, c, lock, util_samples, util_lock)
            for _ in range(workers)
        ]
        wait(futs)
    t1 = time.time()
    total = max(1, c["total"])
    err = total - c["ok_2xx"]
    peak_u = max(util_samples) if util_samples else None
    return {
        "duration_sec": round(t1 - t0, 3),
        "requests": {
            "total": c["total"],
            "ok_2xx": c["ok_2xx"],
            "r429": c["r429"],
            "r5xx": c["r5xx"],
            "other_err": c["other_err"],
        },
        "http_error_ratio": round(err / total, 6),
        "ratio_429": round(c["r429"] / total, 6),
        "ratio_5xx": round(c["r5xx"] / total, 6),
        "peak_utilization_ratio": peak_u,
        "pool_acquire_timeout_delta": None,
    }


def cmd_probe() -> int:
    base = os.environ.get("B481_LB_BASE", "").strip().rstrip("/")
    seg = os.environ.get("B481_SEGMENT", "").strip()
    run_dir = os.environ.get("B481_RUN_DIR", "").strip()
    if not base or not seg or not run_dir:
        print("B481: need B481_LB_BASE, B481_SEGMENT, B481_RUN_DIR", file=sys.stderr)
        return 2
    if seg not in SEGMENTS:
        print(f"B481: B481_SEGMENT must be one of {sorted(SEGMENTS)}", file=sys.stderr)
        return 2
    duration = float(os.environ.get("B481_DURATION_SEC", "30"))
    workers = int(os.environ.get("B481_WORKERS", "16"))
    raw_paths = os.environ.get("B481_PROBE_PATHS", "/meta,/metrics")
    paths = [p.strip() for p in raw_paths.split(",") if p.strip()]

    extra: dict[str, Any] = {}
    raw_extra = os.environ.get("B481_EXTRA_METRICS_JSON", "").strip()
    if raw_extra:
        try:
            extra = json.loads(raw_extra)
            if not isinstance(extra, dict):
                print("B481: B481_EXTRA_METRICS_JSON must be a JSON object", file=sys.stderr)
                return 2
        except json.JSONDecodeError as e:
            print(f"B481: invalid B481_EXTRA_METRICS_JSON: {e}", file=sys.stderr)
            return 2

    Path(run_dir).mkdir(parents=True, exist_ok=True)
    jsonl = Path(run_dir) / "segments.jsonl"

    started = datetime.now(timezone.utc)
    stats = run_probe(base, paths, duration, workers)
    ended = datetime.now(timezone.utc)

    line = {
        "segment_id": seg,
        "started_at": started.isoformat(),
        "ended_at": ended.isoformat(),
        **stats,
        **extra,
    }
    with jsonl.open("a", encoding="utf-8") as f:
        f.write(json.dumps(line, ensure_ascii=False) + "\n")

    print(json.dumps({"segment": seg, "http_error_ratio": stats["http_error_ratio"], "jsonl": str(jsonl)}, ensure_ascii=False))
    return 0


def _parse_iso(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def _compute_failover_time_sec(segments: list[dict[str, Any]]) -> float | None:
    regional = (
        "fault_whole_node",
        "fault_whole_az",
        "fault_whole_region",
    )
    faults = [s for s in segments if s.get("segment_id") in regional]
    fo = next((s for s in segments if s.get("segment_id") == "failover_traffic_switch"), None)
    if not faults or not fo:
        return None
    last_fault = max(faults, key=lambda s: s.get("ended_at") or "")
    try:
        t_end = _parse_iso(str(last_fault["ended_at"]))
        t_start = _parse_iso(str(fo["started_at"]))
        return max(0.0, (t_start - t_end).total_seconds())
    except Exception:
        return None


def cmd_finalize() -> int:
    run_dir = Path(os.environ.get("B481_RUN_DIR", "").strip() or "")
    if not run_dir.is_dir():
        print("B481: --finalize needs B481_RUN_DIR to an existing directory", file=sys.stderr)
        return 2
    gate_path = Path(
        os.environ.get(
            "B481_GATE_FILE",
            str(_root() / "config" / "b481_multi_region_dr_slo_gate.v1.json"),
        )
    )
    gate = json.loads(gate_path.read_text(encoding="utf-8"))

    jsonl = run_dir / "segments.jsonl"
    if not jsonl.is_file():
        print(f"B481: missing {jsonl}", file=sys.stderr)
        return 1
    segments: list[dict[str, Any]] = []
    for line in jsonl.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        segments.append(json.loads(line))
    segments.sort(key=lambda s: s.get("started_at") or "")

    failover_time_sec = _compute_failover_time_sec(segments)

    lags: list[float] = []
    rpos: list[float] = []
    for s in segments:
        v = s.get("replication_lag_sec_max_observed")
        if v is not None:
            lags.append(float(v))
        r = s.get("rpo_sec_observed")
        if r is not None:
            rpos.append(float(r))
    max_lag = max(lags) if lags else None
    max_rpo = max(rpos) if rpos else None

    lb = os.environ.get("B481_LB_BASE", "").strip() or None
    try:
        gate_disp = str(gate_path.resolve().relative_to(_root().resolve())).replace("\\", "/")
    except ValueError:
        gate_disp = str(gate_path)

    report: dict[str, Any] = {
        "schema": "traveltrust_b481_multi_region_dr_acceptance.v1",
        "topology": {
            "lb_base": lb,
            "note": "Multi-Region / Multi-AZ：故障在侧方注入；复制与 RPO 由指标或 B481_EXTRA_METRICS_JSON 填入。",
        },
        "segments": segments,
        "aggregate": {
            "failover_time_sec": failover_time_sec,
            "max_replication_lag_sec_observed": max_lag,
            "rpo_sec_observed": max_rpo,
            "regional_fault_segments_observed": [
                s.get("segment_id")
                for s in segments
                if str(s.get("segment_id", "")).startswith("fault_whole_")
            ],
        },
        "gate_file": gate_disp,
    }

    _gates = _root() / "scripts" / "gates"
    if str(_gates) not in sys.path:
        sys.path.insert(0, str(_gates))
    from _b481_dr_slo_eval import apply_verdict  # noqa: E402

    report = apply_verdict(report, gate)
    out_path = run_dir / "report.v1.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"verdict": report["verdict"], "report": str(out_path), "fail_reasons": report.get("fail_reasons")}, ensure_ascii=False))
    return 0 if report["verdict"] == "PASS" else 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--finalize", action="store_true", help="Merge segments.jsonl + write report.v1.json")
    args = ap.parse_args()
    if args.finalize:
        return cmd_finalize()
    return cmd_probe()


if __name__ == "__main__":
    raise SystemExit(main())
