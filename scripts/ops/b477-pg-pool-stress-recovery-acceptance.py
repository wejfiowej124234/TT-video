#!/usr/bin/env python3
"""
B-477: PostgreSQL 连接池压力与恢复验收（受控并发 + /metrics 与 /meta.database.pool 同源核对）。

输出机读报告 evidence/b477_pg_pool_stress_recovery/run_<UTC>/report.v1.json；
可选 B477_RUN_SEAL=1 末尾串联 b473-seal-b460-tt-u03.sh。

环境变量（均可被 CLI 覆盖，前缀 B477_）：
  B477_API_BASE          默认 http://127.0.0.1:8080
  B477_WORKERS           并发 worker 数，默认 24
  B477_DURATION_SEC      压测持续时间，默认 20
  B477_AUTH_BEARER       可选；若设置则压测含 GET /api/v1/me（真实占池）
  B477_STRESS_MODE       meta_metrics | me | mixed（默认 mixed：有 token 则 me+meta+metrics，无则 meta+metrics）
  B477_MAX_ACQUIRE_TIMEOUT_DELTA  压测前后 acquire_timeout_total 允许增量，默认 0
  B477_MAX_SLOW_ACQUIRE_DELTA       压测前后 slow_acquire_total 允许增量，默认 999999（几乎不判）
  B477_PEAK_UTILIZATION_MAX         压测结束瞬间 utilization 上限，默认 0.98
  B477_RECOVERY_TARGET_UTIL         恢复判定：utilization_ratio <= 该值，默认 0.45
  B477_RECOVERY_TIMEOUT_SEC         恢复等待上限，默认 90
  B477_RECOVERY_POLL_MS             轮询间隔，默认 500
  B477_MAX_HTTP_ERROR_RATIO         压测阶段请求失败比例上限，默认 0.02
  B477_RUN_SEAL            1 则在报告写盘后执行 b473-seal（须全栈环境）
  B478_BASELINE_FILE       可选；默认加载 config/b478_pg_pool_release_gate_thresholds.v1.json 作为阈值默认（B-478）
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA = "traveltrust_b477_pg_pool_stress_recovery.v1"

# Prometheus text: metric name -> last value on line
_PG_LINE = re.compile(r"^traveltrust_pg_pool_([a-z0-9_]+)\s+([0-9.eE+-]+)\s*$")


def _root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _env_int(name: str, default: int) -> int:
    v = os.environ.get(name)
    if v is None or v.strip() == "":
        return default
    return int(v.strip())


def _env_float(name: str, default: float) -> float:
    v = os.environ.get(name)
    if v is None or v.strip() == "":
        return default
    return float(v.strip())


def _env_str(name: str, default: str) -> str:
    v = os.environ.get(name)
    if v is None:
        return default
    return v


def _bool_env(name: str) -> bool:
    return os.environ.get(name, "").strip() in ("1", "true", "yes", "on")


def _load_b478_thresholds() -> tuple[dict[str, Any], Path | None]:
    """B-478 机读基线；路径由 B478_BASELINE_FILE 或默认 config/b478_pg_pool_release_gate_thresholds.v1.json。"""
    p = Path(
        os.environ.get(
            "B478_BASELINE_FILE",
            str(_root() / "config" / "b478_pg_pool_release_gate_thresholds.v1.json"),
        )
    )
    if not p.is_file():
        return {}, None
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}, p
    if data.get("schema") != "traveltrust_b478_pg_pool_release_gate_thresholds.v1":
        return {}, p
    th = data.get("thresholds")
    if not isinstance(th, dict):
        return {}, p
    return th, p


def _int_thr(env_name: str, b478: dict[str, Any], key: str, hard: int) -> int:
    v = os.environ.get(env_name)
    if v is not None and v.strip() != "":
        return int(v.strip())
    if key in b478:
        return int(b478[key])
    return hard


def _float_thr(env_name: str, b478: dict[str, Any], key: str, hard: float) -> float:
    v = os.environ.get(env_name)
    if v is not None and v.strip() != "":
        return float(v.strip())
    if key in b478:
        return float(b478[key])
    return hard


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


def fetch_meta_pool(base: str) -> dict[str, Any] | None:
    code, body = http_get(f"{base.rstrip('/')}/meta")
    if code != 200:
        raise RuntimeError(f"GET /meta -> {code}")
    data = json.loads(body.decode("utf-8", errors="replace"))
    db = data.get("database")
    if not isinstance(db, dict):
        return None
    pool = db.get("pool")
    if pool is None or pool is False:
        return None
    if isinstance(pool, dict):
        return pool
    return None


@dataclass
class Snap:
    t_unix: float
    metrics: dict[str, float] = field(default_factory=dict)
    meta_pool: dict[str, Any] | None = None


def take_snap(base: str) -> Snap:
    m = fetch_metrics(base)
    mp = fetch_meta_pool(base)
    return Snap(t_unix=time.time(), metrics=m, meta_pool=mp)


def _one_req(base: str, path: str, headers: dict[str, str] | None, counters: dict[str, int], lock: threading.Lock) -> None:
    try:
        code, _ = http_get(f"{base.rstrip('/')}{path}", headers=headers, timeout=25.0)
        with lock:
            if code != 200:
                counters["err"] += 1
            else:
                counters["ok"] += 1
    except Exception:
        with lock:
            counters["err"] += 1


def worker_loop(
    _wid: int,
    base: str,
    stop_at: float,
    mode: str,
    bearer: str | None,
    counters: dict[str, int],
    lock: threading.Lock,
) -> None:
    headers_me = {"Authorization": f"Bearer {bearer}"} if bearer else None

    while time.time() < stop_at:
        if mode == "me":
            if not bearer:
                time.sleep(0.05)
                continue
            _one_req(base, "/api/v1/me", headers_me, counters, lock)
        elif mode == "meta_metrics":
            _one_req(base, "/meta", None, counters, lock)
            _one_req(base, "/metrics", None, counters, lock)
        else:  # mixed
            if bearer:
                _one_req(base, "/api/v1/me", headers_me, counters, lock)
            _one_req(base, "/meta", None, counters, lock)
            _one_req(base, "/metrics", None, counters, lock)


def run_stress(
    base: str,
    workers: int,
    duration_sec: float,
    mode: str,
    bearer: str | None,
) -> tuple[dict[str, int], float]:
    counters = {"ok": 0, "err": 0}
    lock = threading.Lock()
    stop_at = time.time() + duration_sec
    with ThreadPoolExecutor(max_workers=max(1, workers)) as ex:
        futs = [ex.submit(worker_loop, i, base, stop_at, mode, bearer, counters, lock) for i in range(workers)]
        for f in futs:
            f.result()
    return dict(counters), duration_sec


def recovery_wait(
    base: str,
    target_util: float,
    timeout_sec: float,
    poll_ms: int,
    baseline_util: float,
) -> tuple[float | None, Snap | None]:
    """Returns (recovery_time_sec, first_snap_when_recovered) or (None, last_snap) if timeout."""
    deadline = time.time() + timeout_sec
    t0 = time.time()
    last: Snap | None = None
    # Idle baseline → require util <= target_util; warm baseline → allow slightly above baseline.
    thr = max(target_util, min(baseline_util + 0.08, 0.95))
    while time.time() < deadline:
        snap = take_snap(base)
        last = snap
        u = snap.metrics.get("utilization_ratio")
        if u is not None and u <= thr:
            return time.time() - t0, snap
        time.sleep(poll_ms / 1000.0)
    return None, last


def suggest_fixes(
    fail_acquire: bool,
    fail_slow: bool,
    fail_peak: bool,
    fail_recovery: bool,
    fail_http: bool,
    meta_pool_missing: bool,
    seal_failed: bool | None,
) -> list[str]:
    xs: list[str] = []
    if meta_pool_missing:
        xs.append("确认 API 已配置 DATABASE_URL 且 chain_off 挂载 db_pool，使 GET /meta.database.pool 非 null。")
    if fail_acquire:
        xs.append("acquire_timeout_total 增长：提高 DATABASE_POOL_MAX_CONNECTIONS、查连接泄漏、或降低上游并发；检查慢 SQL 与 DATABASE_STATEMENT_TIMEOUT_MS。")
    if fail_slow:
        xs.append("slow_acquire_total 增长：池等待过长——结合 PG 负载与 slow_acquire_warn_ms，排查长事务与索引。")
    if fail_peak:
        xs.append("峰值 utilization 过高：扩容池或削峰（限流/队列），避免长时间占满 in_use。")
    if fail_recovery:
        xs.append("恢复超时：压测后池未回落至目标利用率——检查是否有后台任务持连接或 PG 侧锁等待。")
    if fail_http:
        xs.append("HTTP 错误率过高：先确认 API 健康与超时配置，再重复压测。")
    if seal_failed:
        xs.append("b473-seal 失败：见 evidence/b473_seal_b460_tt_u03/seal-run.log 与 Playwright 输出。")
    if not xs:
        xs.append("无额外修复建议；保留报告供回归对比。")
    return xs


def main() -> int:
    b478_th, b478_path = _load_b478_thresholds()
    ap = argparse.ArgumentParser(description="B-477 PG pool stress + recovery acceptance")
    ap.add_argument("--api-base", default=_env_str("B477_API_BASE", "http://127.0.0.1:8080"))
    ap.add_argument("--workers", type=int, default=_env_int("B477_WORKERS", 24))
    ap.add_argument("--duration-sec", type=float, default=_env_float("B477_DURATION_SEC", 20.0))
    ap.add_argument(
        "--stress-mode",
        choices=("meta_metrics", "me", "mixed"),
        default=_env_str("B477_STRESS_MODE", "mixed"),
    )
    ap.add_argument("--auth-bearer", default=os.environ.get("B477_AUTH_BEARER") or None)
    ap.add_argument(
        "--max-acquire-timeout-delta",
        type=int,
        default=_int_thr("B477_MAX_ACQUIRE_TIMEOUT_DELTA", b478_th, "max_acquire_timeout_delta", 0),
    )
    ap.add_argument(
        "--max-slow-acquire-delta",
        type=int,
        default=_int_thr("B477_MAX_SLOW_ACQUIRE_DELTA", b478_th, "max_slow_acquire_delta", 999_999),
    )
    ap.add_argument(
        "--peak-utilization-max",
        type=float,
        default=_float_thr("B477_PEAK_UTILIZATION_MAX", b478_th, "peak_utilization_max", 0.98),
    )
    ap.add_argument(
        "--recovery-target-util",
        type=float,
        default=_float_thr("B477_RECOVERY_TARGET_UTIL", b478_th, "recovery_target_util", 0.45),
    )
    ap.add_argument(
        "--recovery-timeout-sec",
        type=float,
        default=_float_thr("B477_RECOVERY_TIMEOUT_SEC", b478_th, "recovery_timeout_sec", 90.0),
    )
    ap.add_argument(
        "--recovery-poll-ms",
        type=int,
        default=_int_thr("B477_RECOVERY_POLL_MS", b478_th, "recovery_poll_ms", 500),
    )
    ap.add_argument(
        "--max-http-error-ratio",
        type=float,
        default=_float_thr("B477_MAX_HTTP_ERROR_RATIO", b478_th, "max_http_error_ratio", 0.02),
    )
    ap.add_argument("--evidence-dir", default=None, help="默认 evidence/b477_pg_pool_stress_recovery/run_<UTC>")
    ap.add_argument("--run-seal", action="store_true", help="等价 B477_RUN_SEAL=1")
    args = ap.parse_args()

    if args.stress_mode == "me" and not args.auth_bearer:
        print("B477: --stress-mode me requires B477_AUTH_BEARER (or --auth-bearer)", file=sys.stderr)
        return 2

    run_seal = args.run_seal or _bool_env("B477_RUN_SEAL")
    base = args.api_base.rstrip("/")

    utc_now = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    ev_root = _root() / "evidence" / "b477_pg_pool_stress_recovery"
    run_dir = Path(args.evidence_dir) if args.evidence_dir else ev_root / f"run_{utc_now}"
    run_dir.mkdir(parents=True, exist_ok=True)

    threshold_hits: list[str] = []

    try:
        pre = take_snap(base)
    except Exception as e:
        report = {
            "schema": SCHEMA,
            "verdict": "FAIL",
            "error": f"baseline snapshot failed: {e}",
            "fix_suggestions": suggest_fixes(False, False, False, False, False, True, None),
        }
        (run_dir / "report.v1.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(report, ensure_ascii=False), file=sys.stderr)
        return 1

    meta_missing = pre.meta_pool is None
    base_util = float(pre.metrics.get("utilization_ratio", 0.0))
    base_ato = int(pre.metrics.get("acquire_timeout_total", 0.0))
    base_slow = int(pre.metrics.get("slow_acquire_total", 0.0))

    t_load0 = time.time()
    ctr, dur = run_stress(
        base,
        workers=args.workers,
        duration_sec=args.duration_sec,
        mode=args.stress_mode,
        bearer=args.auth_bearer,
    )
    t_load1 = time.time()

    post = take_snap(base)

    d_ato = int(post.metrics.get("acquire_timeout_total", 0.0)) - base_ato
    d_slow = int(post.metrics.get("slow_acquire_total", 0.0)) - base_slow
    peak_u = float(post.metrics.get("utilization_ratio", 0.0))

    total_req = ctr["ok"] + ctr["err"]
    err_ratio = (ctr["err"] / total_req) if total_req > 0 else 0.0

    fail_acquire = d_ato > args.max_acquire_timeout_delta
    fail_slow = d_slow > args.max_slow_acquire_delta
    fail_peak = peak_u > args.peak_utilization_max
    fail_http = err_ratio > args.max_http_error_ratio

    if fail_acquire:
        threshold_hits.append(f"acquire_timeout_delta:{d_ato}>{args.max_acquire_timeout_delta}")
    if fail_slow:
        threshold_hits.append(f"slow_acquire_delta:{d_slow}>{args.max_slow_acquire_delta}")
    if fail_peak:
        threshold_hits.append(f"peak_utilization:{peak_u:.4f}>{args.peak_utilization_max}")
    if fail_http:
        threshold_hits.append(f"http_error_ratio:{err_ratio:.4f}>{args.max_http_error_ratio}")

    rec_t, rec_snap = recovery_wait(
        base,
        target_util=args.recovery_target_util,
        timeout_sec=args.recovery_timeout_sec,
        poll_ms=args.recovery_poll_ms,
        baseline_util=base_util,
    )
    fail_recovery = rec_t is None
    if fail_recovery:
        threshold_hits.append(f"recovery_timeout_sec:{args.recovery_timeout_sec}")

    rec_thr = max(args.recovery_target_util, min(base_util + 0.08, 0.95))
    notes: list[str] = []
    if not args.auth_bearer and args.stress_mode != "me":
        notes.append(
            "未设置 B477_AUTH_BEARER：压测以 /meta + /metrics 为主，对 sqlx 池占用较弱；完整验收请提供有效 Bearer 并采用 mixed。"
        )

    seal_block: dict[str, Any] = {"run": "skipped", "exit_code": None, "log_hint": "evidence/b473_seal_b460_tt_u03/seal-run.log"}
    if run_seal:
        seal_log = run_dir / "b473_seal_capture.txt"
        try:
            p = subprocess.run(
                ["bash", str(_root() / "scripts" / "ops" / "b473-seal-b460-tt-u03.sh")],
                cwd=str(_root()),
                capture_output=True,
                text=True,
                timeout=3600,
            )
            seal_log.write_text(p.stdout + "\n" + p.stderr, encoding="utf-8", errors="replace")
            seal_block["run"] = "failed" if p.returncode != 0 else "passed"
            seal_block["exit_code"] = p.returncode
        except Exception as e:
            seal_block["run"] = "failed"
            seal_block["error"] = str(e)
            seal_log.write_text(str(e), encoding="utf-8", errors="replace")

    seal_failed = None
    if run_seal:
        seal_failed = seal_block.get("run") != "passed"

    verdict = "PASS"
    if fail_acquire or fail_slow or fail_peak or fail_http or fail_recovery or meta_missing:
        verdict = "FAIL"
    if seal_failed:
        verdict = "FAIL"

    fixes = suggest_fixes(
        fail_acquire,
        fail_slow,
        fail_peak,
        fail_recovery,
        fail_http,
        meta_missing,
        seal_failed if run_seal else None,
    )

    report: dict[str, Any] = {
        "schema": SCHEMA,
        "verdict": verdict,
        "api_base": base,
        "run_dir": (
            str(run_dir.relative_to(_root()))
            if str(run_dir).startswith(str(_root()))
            else str(run_dir)
        ),
        "params": {
            "workers": args.workers,
            "duration_sec": args.duration_sec,
            "stress_mode": args.stress_mode,
            "auth_bearer_set": bool(args.auth_bearer),
            "max_acquire_timeout_delta": args.max_acquire_timeout_delta,
            "max_slow_acquire_delta": args.max_slow_acquire_delta,
            "peak_utilization_max": args.peak_utilization_max,
            "recovery_target_util": args.recovery_target_util,
            "recovery_timeout_sec": args.recovery_timeout_sec,
            "recovery_poll_ms": args.recovery_poll_ms,
            "max_http_error_ratio": args.max_http_error_ratio,
            "run_seal": run_seal,
            "b478_baseline_file": str(b478_path) if b478_path is not None else None,
        },
        "phases": {
            "baseline": {
                "metrics": pre.metrics,
                "meta_pool": pre.meta_pool,
            },
            "load": {
                "started_unix": t_load0,
                "ended_unix": t_load1,
                "duration_wall_sec": round(t_load1 - t_load0, 3),
                "requests_ok": ctr["ok"],
                "requests_err": ctr["err"],
                "http_error_ratio": round(err_ratio, 6),
            },
            "post_load": {
                "metrics": post.metrics,
                "meta_pool": post.meta_pool,
                "deltas": {
                    "acquire_timeout_total": d_ato,
                    "slow_acquire_total": d_slow,
                    "peak_utilization_ratio": peak_u,
                },
            },
            "recovery": {
                "recovery_time_sec": rec_t,
                "recovery_time_ms": None if rec_t is None else round(rec_t * 1000.0, 3),
                "target_util": args.recovery_target_util,
                "utilization_threshold_used": rec_thr,
                "last_sample_metrics": rec_snap.metrics if rec_snap else None,
            },
        },
        "threshold_hits": threshold_hits,
        "fix_suggestions": fixes,
        "b473_seal": seal_block,
        "parity": {
            "meta_pool_utilization": (pre.meta_pool or {}).get("utilization") if pre.meta_pool else None,
            "metrics_utilization_ratio": pre.metrics.get("utilization_ratio"),
            "note": "B-476：meta.database.pool 与 traveltrust_pg_pool_utilization_ratio 同源；压测后应接近",
        },
        "notes": notes,
    }

    if rec_snap and pre.meta_pool and rec_snap.meta_pool:
        report["parity"]["post_recovery_meta_util"] = rec_snap.meta_pool.get("utilization")

    (run_dir / "report.v1.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    pf = run_dir / "pass_fail.md"
    pf.write_text(
        f"""# B-477 PG pool stress / recovery — {verdict}

- **Verdict**: {verdict}
- **Threshold hits**: {", ".join(threshold_hits) if threshold_hits else "(none)"}
- **Recovery**: {report["phases"]["recovery"]["recovery_time_ms"]} ms (null = timeout)
- **Report**: `report.v1.json`
- **Seal**: {seal_block["run"]}

## Minimal fixes

""" + "\n".join(f"- {x}" for x in fixes)
        + "\n",
        encoding="utf-8",
    )

    print(json.dumps({"verdict": verdict, "run_dir": str(run_dir), "threshold_hits": threshold_hits}, ensure_ascii=False))
    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
