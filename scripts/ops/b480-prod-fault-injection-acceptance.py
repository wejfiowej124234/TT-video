#!/usr/bin/env python3
"""
B-480：生产拓扑（LB + 多节点 + 限流）下端到端故障演练探针与报告。

故障注入（DB 延迟 / 拒连 / 网络抖动）由运维在真实侧执行（见 TT-B480）；本脚本仅对
B480_LB_BASE 做 HTTP 采样，将各阶段写入 segments.jsonl，--finalize 时合并为 report.v1.json。

环境变量（probe）：
  B480_LB_BASE        负载均衡或单入口根 URL（必填）
  B480_SEGMENT        normal | fault_db_latency | fault_connection_refused | fault_network_jitter | recovery
  B480_RUN_DIR        本次 run 目录（必填），写入 segments.jsonl
  B480_DURATION_SEC   默认 30
  B480_WORKERS        默认 16
  B480_PROBE_PATHS    默认 /meta,/metrics

finalize：
  python3 scripts/ops/b480-prod-fault-injection-acceptance.py --finalize
  需 B480_RUN_DIR；可选 B480_GATE_FILE 指向 config/b480_prod_fault_slo_gate.v1.json
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
    {"normal", "fault_db_latency", "fault_connection_refused", "fault_network_jitter", "recovery"},
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
    base = os.environ.get("B480_LB_BASE", "").strip().rstrip("/")
    seg = os.environ.get("B480_SEGMENT", "").strip()
    run_dir = os.environ.get("B480_RUN_DIR", "").strip()
    if not base or not seg or not run_dir:
        print("B480: need B480_LB_BASE, B480_SEGMENT, B480_RUN_DIR", file=sys.stderr)
        return 2
    if seg not in SEGMENTS:
        print(f"B480: B480_SEGMENT must be one of {sorted(SEGMENTS)}", file=sys.stderr)
        return 2
    duration = float(os.environ.get("B480_DURATION_SEC", "30"))
    workers = int(os.environ.get("B480_WORKERS", "16"))
    raw_paths = os.environ.get("B480_PROBE_PATHS", "/meta,/metrics")
    paths = [p.strip() for p in raw_paths.split(",") if p.strip()]

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
    }
    with jsonl.open("a", encoding="utf-8") as f:
        f.write(json.dumps(line, ensure_ascii=False) + "\n")

    print(json.dumps({"segment": seg, "http_error_ratio": stats["http_error_ratio"], "jsonl": str(jsonl)}, ensure_ascii=False))
    return 0


def _parse_iso(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def cmd_finalize() -> int:
    run_dir = Path(os.environ.get("B480_RUN_DIR", "").strip() or "")
    if not run_dir.is_dir():
        print("B480: --finalize needs B480_RUN_DIR to an existing directory", file=sys.stderr)
        return 2
    gate_path = Path(
        os.environ.get(
            "B480_GATE_FILE",
            str(_root() / "config" / "b480_prod_fault_slo_gate.v1.json"),
        )
    )
    gate = json.loads(gate_path.read_text(encoding="utf-8"))

    jsonl = run_dir / "segments.jsonl"
    if not jsonl.is_file():
        print(f"B480: missing {jsonl}", file=sys.stderr)
        return 1
    segments: list[dict[str, Any]] = []
    for line in jsonl.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        segments.append(json.loads(line))
    segments.sort(key=lambda s: s.get("started_at") or "")

    recovery_time_sec: float | None = None
    faults = [s for s in segments if str(s.get("segment_id", "")).startswith("fault_")]
    rec = next((s for s in segments if s.get("segment_id") == "recovery"), None)
    if faults and rec:
        last_fault = faults[-1]
        try:
            t_end = _parse_iso(str(last_fault["ended_at"]))
            t_rec = _parse_iso(str(rec["started_at"]))
            recovery_time_sec = max(0.0, (t_rec - t_end).total_seconds())
        except Exception:
            recovery_time_sec = None

    lb = os.environ.get("B480_LB_BASE", "").strip() or None
    try:
        gate_rel = gate_path.resolve().relative_to(_root().resolve())
        gate_disp = str(gate_rel).replace("\\", "/")
    except ValueError:
        gate_disp = str(gate_path)
    report: dict[str, Any] = {
        "schema": "traveltrust_b480_prod_fault_injection_acceptance.v1",
        "topology": {
            "lb_base": lb,
            "note": "多节点 / 限流 / 熔断在 LB 与 API 侧；故障注入见 TT-B480。",
        },
        "segments": segments,
        "aggregate": {
            "recovery_time_sec": recovery_time_sec,
            "fault_segments_observed": [s.get("segment_id") for s in faults],
        },
        "gate_file": gate_disp,
    }

    _gates = _root() / "scripts" / "gates"
    if str(_gates) not in sys.path:
        sys.path.insert(0, str(_gates))
    from _b480_slo_eval import apply_verdict  # noqa: E402

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
