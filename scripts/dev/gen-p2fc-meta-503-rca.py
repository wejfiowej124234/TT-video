#!/usr/bin/env python3
"""P2FC · staging /meta 408 · web /meta 503 根因分析（只读探针 · 不 redeploy）

因果链：
  API GET /meta 聚合（DB+indexer+chain）> TimeoutLayer(30s) → HTTP 408
  Web app/meta/route.ts 代理 API /meta → 收到 408/超时 → HTTP 503 meta_unavailable

  GET /meta/build 轻量 → 200（执行链 fallback 可用）

  python scripts/dev/gen-p2fc-meta-503-rca.py

末行：TT_META_503_RCA: DONE
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
API = os.environ.get("STAGING_API_BASE", "https://tt-api-staging.fly.dev").rstrip("/")
WEB = os.environ.get("STAGING_WEB_BASE", "https://tt-web-staging.fly.dev").rstrip("/")


def probe(url: str, timeout: int = 120) -> dict:
    t0 = time.perf_counter()
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "tt-meta-rca/1"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read(4096).decode("utf-8", errors="replace")
            elapsed = round(time.perf_counter() - t0, 3)
            snippet = body[:200].replace("\n", " ")
            return {"url": url, "code": resp.getcode(), "elapsed_sec": elapsed, "body_snippet": snippet, "via": "urllib"}
    except urllib.error.HTTPError as e:
        elapsed = round(time.perf_counter() - t0, 3)
        raw = e.read(256).decode("utf-8", errors="replace")
        return {"url": url, "code": e.code, "elapsed_sec": elapsed, "body_snippet": raw[:200], "via": "urllib"}
    except Exception as e:
        elapsed = round(time.perf_counter() - t0, 3)
        curl = _probe_curl(url, timeout)
        if curl.get("code"):
            curl["urllib_error"] = str(e)
            return curl
        return {"url": url, "code": 0, "elapsed_sec": elapsed, "error": str(e), "via": "failed"}


def _probe_curl(url: str, timeout: int) -> dict:
    import subprocess

    t0 = time.perf_counter()
    try:
        proc = subprocess.run(
            ["curl", "--noproxy", "*", "-sS", "-o", "-", "-w", "\n%{http_code}", "--max-time", str(timeout), url],
            capture_output=True,
            text=True,
            timeout=timeout + 15,
        )
        out = (proc.stdout or "").rsplit("\n", 1)
        if len(out) == 2 and out[1].strip().isdigit():
            elapsed = round(time.perf_counter() - t0, 3)
            return {
                "url": url,
                "code": int(out[1].strip()),
                "elapsed_sec": elapsed,
                "body_snippet": out[0][:200],
                "via": "curl",
            }
    except (subprocess.SubprocessError, OSError, ValueError):
        pass
    return {"url": url, "code": 0, "via": "curl_failed"}


def main() -> int:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_dir = ROOT / "evidence/GO_phase2_deploy_backlog/meta-rca" / stamp
    out_dir.mkdir(parents=True, exist_ok=True)

    probes = {
        "api_health": probe(f"{API}/health", 20),
        "api_meta": probe(f"{API}/meta", 120),
        "api_meta_build": probe(f"{API}/meta/build", 45),
        "web_meta": probe(f"{WEB}/meta", 90),
    }

    api_meta = probes["api_meta"]
    web_meta = probes["web_meta"]
    api_code = api_meta.get("code")
    web_code = web_meta.get("code")
    api_elapsed = api_meta.get("elapsed_sec", 0)

    root_cause = []
    if api_code == 408 or (api_elapsed >= 28 and api_code != 200):
        root_cause.append("API_TIMEOUT_LAYER: GET /meta exceeds REQUEST_TIMEOUT_SECS (staging default 30)")
    if web_code == 503:
        root_cause.append("WEB_PROXY_DEGRADED: app/meta/route.ts maps upstream non-200 to 503 meta_unavailable")
    if probes["api_meta_build"].get("code") == 200:
        root_cause.append("EXEC_CHAIN_OK: /meta/build lightweight path unaffected")

    remediation = [
        {
            "layer": "L0_API",
            "action": "Set REQUEST_TIMEOUT_SECS=120 on tt-api-staging (fly.toml [env] or secret)",
            "artifact": "evidence/GO_phase2_deploy_backlog/meta-availability-hotfix.patch",
        },
        {
            "layer": "L0_WEB",
            "action": "Align app/meta/route.ts fetch timeout ≥ API timeout + 10s (META_ROUTE_FETCH_TIMEOUT_MS default 130000)",
            "artifact": "frontend/app/meta/route.ts",
        },
        {
            "layer": "L0_WEB",
            "action": "Keep 408/502/503/504 retry (3x) before returning 503",
            "artifact": "frontend/app/meta/route.ts",
        },
        {
            "layer": "acceptance",
            "action": "Post-soak: p2fc-verify-staging-meta-availability.sh --strict before Graduation",
            "artifact": "scripts/ops/p2fc-verify-staging-meta-availability.sh",
        },
    ]

    payload = {
        "schema": "traveltrust.p2fc_meta_503_rca.v1",
        "recorded_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "staging_api": API,
        "staging_web": WEB,
        "probes": probes,
        "root_cause_chain": root_cause,
        "remediation_waves": remediation,
        "honest_boundary": "② soak freeze: 408/503 non-blocking for exec chain; acceptance deferred until post-soak deploy",
    }

    (out_dir / "rca.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    latest = ROOT / "evidence/GO_phase2_deploy_backlog/meta-rca/latest.json"
    latest.parent.mkdir(parents=True, exist_ok=True)
    latest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md = [
        "# /meta 503 Root Cause Analysis",
        "",
        f"**Recorded:** {payload['recorded_at_utc']}",
        "",
        "## Probes",
        "",
        f"| Endpoint | HTTP | elapsed(s) |",
        f"|----------|------|------------|",
    ]
    for k, p in probes.items():
        md.append(f"| {k} | {p.get('code')} | {p.get('elapsed_sec')} |")
    md.extend(["", "## Root cause", ""] + [f"- {r}" for r in root_cause])
    md.extend(["", "## Remediation (post-soak wave-0)", ""] + [f"- **{r['layer']}**: {r['action']}" for r in remediation])
    (out_dir / "RCA.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    print(f"TT_META_503_RCA: DONE api_meta={api_code} web_meta={web_code} out={out_dir.as_posix()}")
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
