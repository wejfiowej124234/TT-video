#!/usr/bin/env python3
"""
B-479：多 API 实例（N 节点）并发下 PostgreSQL 连接池竞争压测与验收报告。

环境变量：
  B479_API_BASES          逗号分隔 API 根 URL（必填，至少 2 个用于多实例语义）
  B477_AUTH_BEARER        可选；mixed 模式占池
  B479_WORKERS_PER_INSTANCE  每实例并发 worker，默认 16
  B479_DURATION_SEC       默认 25
  B478_BASELINE_FILE      继承 B-478 阈值默认

输出：evidence/b479_pg_pool_multi_instance/run_<UTC>/report.v1.json
"""
from __future__ import annotations

import json
import os
import re
import sys
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA = "traveltrust_b479_pg_pool_multi_instance_stress.v1"
_PG_LINE = re.compile(r"^traveltrust_pg_pool_([a-z0-9_]+)\s+([0-9.eE+-]+)\s*$")


def _root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _load_b478() -> dict[str, Any]:
    p = Path(os.environ.get("B478_BASELINE_FILE", str(_root() / "config" / "b478_pg_pool_release_gate_thresholds.v1.json")))
    if not p.is_file():
        return {}
    data = json.loads(p.read_text(encoding="utf-8"))
    return data.get("thresholds") or {}


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


def http_get(url: str, headers: dict[str, str] | None = None, timeout: float = 30.0) -> tuple[int, bytes]:
    req = urllib.request.Request(url, method="GET")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.getcode(), resp.read()


def fetch_metrics(base: str) -> dict[str, float]:
    code, body = http_get(f"{base.rstrip('/')}/metrics")
    if code != 200:
        raise RuntimeError(f"GET /metrics -> {code}")
    return parse_prometheus_pg_pool(body.decode("utf-8", errors="replace"))


def snap(base: str) -> dict[str, Any]:
    m = fetch_metrics(base)
    return {"metrics": m, "t": time.time()}


def worker_loop(
    base: str,
    stop_at: float,
    mode: str,
    bearer: str | None,
    counters: dict[str, int],
    lock: threading.Lock,
) -> None:
    headers_me = {"Authorization": f"Bearer {bearer}"} if bearer else None

    def hit(code: int) -> None:
        with lock:
            if code == 200:
                counters["ok"] += 1
            else:
                counters["err"] += 1

    while time.time() < stop_at:
        try:
            if mode == "mixed" and bearer:
                code, _ = http_get(f"{base.rstrip('/')}/api/v1/me", headers=headers_me, timeout=25.0)
                hit(code)
            code, _ = http_get(f"{base.rstrip('/')}/meta", timeout=25.0)
            hit(code)
            code, _ = http_get(f"{base.rstrip('/')}/metrics", timeout=25.0)
            hit(code)
        except Exception:
            with lock:
                counters["err"] += 1


def run_stress_instance(base: str, workers: int, duration: float, mode: str, bearer: str | None) -> dict[str, int]:
    c: dict[str, int] = {"ok": 0, "err": 0}
    lock = threading.Lock()
    stop = time.time() + duration
    with ThreadPoolExecutor(max_workers=max(1, workers)) as ex:
        futs = [ex.submit(worker_loop, base, stop, mode, bearer, c, lock) for _ in range(workers)]
        for f in futs:
            f.result()
    return c


def recovery_multi(
    bases: list[str],
    th: dict[str, Any],
    baseline_utils: list[float],
    poll_ms: int,
) -> tuple[float | None, list[dict[str, Any]]]:
    target = float(th.get("recovery_target_util", 0.45))
    timeout_sec = float(th.get("recovery_timeout_sec", 90.0))
    deadline = time.time() + timeout_sec
    t0 = time.time()
    last_snaps: list[dict[str, Any]] = []
    while time.time() < deadline:
        snaps = []
        ok = True
        for i, b in enumerate(bases):
            s = snap(b)
            snaps.append({"api_base": b, **s})
            u = float(s["metrics"].get("utilization_ratio", 0.0))
            thr = max(target, min(baseline_utils[i] + 0.08, 0.95))
            if u > thr:
                ok = False
        last_snaps = snaps
        if ok:
            return time.time() - t0, last_snaps
        time.sleep(poll_ms / 1000.0)
    return None, last_snaps


def main() -> int:
    raw = os.environ.get("B479_API_BASES", "").strip()
    if not raw:
        print("B479: set B479_API_BASES=http://a:8080,http://b:8080", file=sys.stderr)
        return 2
    bases = [b.strip().rstrip("/") for b in raw.split(",") if b.strip()]
    if len(bases) < 1:
        print("B479: need at least one API base", file=sys.stderr)
        return 2
    th = _load_b478()
    if not th:
        print("B479: cannot load B-478 baseline", file=sys.stderr)
        return 1
    wpi = int(os.environ.get("B479_WORKERS_PER_INSTANCE", "16"))
    duration = float(os.environ.get("B479_DURATION_SEC", "25"))
    mode = os.environ.get("B479_STRESS_MODE", "mixed")
    bearer = os.environ.get("B477_AUTH_BEARER") or None
    poll_ms = int(th.get("recovery_poll_ms", 500))

    pre = [snap(b) for b in bases]
    base_ato = [int(x["metrics"].get("acquire_timeout_total", 0)) for x in pre]
    base_util = [float(x["metrics"].get("utilization_ratio", 0.0)) for x in pre]

    t0 = time.time()
    counters: list[dict[str, int]] = []
    with ThreadPoolExecutor(max_workers=len(bases)) as ex:
        futs = [ex.submit(run_stress_instance, b, wpi, duration, mode, bearer) for b in bases]
        counters = [f.result() for f in futs]
    t1 = time.time()

    post = [snap(b) for b in bases]
    peaks = [float(x["metrics"].get("utilization_ratio", 0.0)) for x in post]
    d_ato = [
        int(post[i]["metrics"].get("acquire_timeout_total", 0)) - base_ato[i] for i in range(len(bases))
    ]
    max_peak = max(peaks) if peaks else 0.0
    max_ato = max(d_ato) if d_ato else 0

    rec_t, rec_snaps = recovery_multi(bases, th, base_util, poll_ms)

    fail = False
    reasons: list[str] = []
    if max_peak > float(th["peak_utilization_max"]) + 1e-9:
        fail = True
        reasons.append("PEAK_UTILIZATION_EXCEEDED")
    if max_ato > int(th["max_acquire_timeout_delta"]):
        fail = True
        reasons.append("ACQUIRE_TIMEOUT_EXCEEDED")
    if rec_t is None:
        fail = True
        reasons.append("RECOVERY_TIMEOUT")
    total_ok = sum(c.get("ok", 0) for c in counters)
    total_er = sum(c.get("err", 0) for c in counters)
    err_ratio = (total_er / (total_ok + total_er)) if (total_ok + total_er) > 0 else 0.0
    if err_ratio > float(th["max_http_error_ratio"]) + 1e-9:
        fail = True
        reasons.append("HTTP_ERROR_RATIO_EXCEEDED")

    verdict = "FAIL" if fail else "PASS"
    utc = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    run_dir = _root() / "evidence" / "b479_pg_pool_multi_instance" / f"run_{utc}"
    run_dir.mkdir(parents=True, exist_ok=True)

    report: dict[str, Any] = {
        "schema": SCHEMA,
        "verdict": verdict,
        "b478_baseline_path": os.environ.get(
            "B478_BASELINE_FILE",
            "config/b478_pg_pool_release_gate_thresholds.v1.json",
        ),
        "params": {
            "instances": bases,
            "workers_per_instance": wpi,
            "duration_sec": duration,
            "stress_mode": mode,
            "auth_bearer_set": bool(bearer),
        },
        "aggregate": {
            "max_peak_utilization_ratio": max_peak,
            "max_acquire_timeout_delta": max_ato,
            "recovery_time_sec": rec_t,
            "recovery_time_ms": None if rec_t is None else round(rec_t * 1000.0, 3),
            "http_error_ratio": round(err_ratio, 6),
        },
        "instances_detail": [
            {
                "api_base": bases[i],
                "post_load_peak_utilization_ratio": peaks[i],
                "acquire_timeout_delta": d_ato[i],
                "stress_requests_ok": counters[i].get("ok", 0),
                "stress_requests_err": counters[i].get("err", 0),
            }
            for i in range(len(bases))
        ],
        "fail_reasons": reasons,
        "notes": [
            "单库 PG：须保证各实例 DATABASE_POOL_MAX_CONNECTIONS 之和不超过 PG max_connections（运维核对）。",
        ],
    }
    (run_dir / "report.v1.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"verdict": verdict, "run_dir": str(run_dir), "fail_reasons": reasons}, ensure_ascii=False))
    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
