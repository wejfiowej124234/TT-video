#!/usr/bin/env python3
"""Final Truth Baseline · OWNER Deep Closure Audit (non-Web3).

Composition-aware: Production FE truth judged by Release Composition Manifest
(live_composition_sha), NOT fuzzy tip equality.

Layers (Owner deep gates):
  1) Database Reality Alignment
  2) CMS/COS/Media Reality Alignment
  3) Performance Reality Benchmark (Staging vs Production)
  4) Security & Observability Audit

Does NOT mutate Web3 / Admin UI structure. Keeps TT_PRODUCTION_GO=NO_GO.
Does NOT open Human UAT / GO Review unless all four deep gates PASS
and FIX_REQUIRED==0 (caller updates SSOT).

Unlock for DB schema SQL:
  TT_OWNER_DEEP_DB_OK=1 + PRODUCTION_DATABASE_URL (+ optional STAGING_DATABASE_URL)
"""
from __future__ import annotations

import json
import math
import os
import re
import ssl
import statistics
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
MACHINE = "TT_FINAL_TRUTH_OWNER_DEEP_CLOSURE_AUDIT"
COMPOSITION_SHA = "539f0876f537ee00f980c731fce061e9fb911506"
PRODUCT_TIP = "1ff71858f603229fc1aed283a5fdc9fddf0ef360"
WEB3_TIP = "ea71c577ce6f99696df33f9394cf96746edc843b"
WEB3_PIN = "PSG-REL-20260720-WEB3-CAND-V2"

STAGING_WEB = os.environ.get("TT_STAGING_WEB", "https://tt-web-staging.fly.dev").rstrip("/")
STAGING_API = os.environ.get("TT_STAGING_API", "https://tt-api-staging.fly.dev").rstrip("/")
PROD_WEB = os.environ.get("TT_PROD_WEB", "https://tt-web-prod.fly.dev").rstrip("/")
PROD_APEX = os.environ.get("TT_PROD_APEX", "https://www.web3-ttg.com").rstrip("/")
PROD_API = os.environ.get("TT_PROD_API", "https://api.web3-ttg.com").rstrip("/")
CDN = os.environ.get("TT_CDN", "https://cdn.web3-ttg.com").rstrip("/")

UA = "tt-final-truth-owner-deep-closure/1.0"
CTX = ssl.create_default_context()

PERF_PAGES = ["/", "/market", "/did-rank", "/guides", "/traveltrust", "/auth/login"]
PERF_APIS = [
    "/health",
    "/meta",
    "/api/v1/discover/orders?limit=5",
    "/api/v1/guides?limit=10",
    "/api/v1/did-rank/itineraries?city=%E5%8C%97%E4%BA%AC&limit=10",
    "/api/v1/did-rank/travelers?limit=10",
]
SEC_HEADERS_REQUIRED = [
    "strict-transport-security",
    "x-content-type-options",
    "x-frame-options",
    "referrer-policy",
    "permissions-policy",
]
SAMPLES = int(os.environ.get("TT_OWNER_PERF_SAMPLES", "5"))


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def fetch_once(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    body: bytes | None = None,
    timeout: float = 30.0,
) -> dict[str, Any]:
    h = {"User-Agent": UA, "Accept": "*/*"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as resp:
            raw = resp.read()
            hdrs = {k.lower(): v for k, v in resp.headers.items()}
            ms = (time.perf_counter() - t0) * 1000
            return {
                "ok": True,
                "status": resp.status,
                "ms": round(ms, 1),
                "headers": hdrs,
                "body": raw,
                "url": url,
            }
    except urllib.error.HTTPError as e:
        raw = e.read() if e.fp else b""
        hdrs = {k.lower(): v for k, v in (e.headers.items() if e.headers else [])}
        ms = (time.perf_counter() - t0) * 1000
        return {
            "ok": False,
            "status": e.code,
            "ms": round(ms, 1),
            "headers": hdrs,
            "body": raw,
            "url": url,
            "error": str(e),
        }
    except Exception as e:  # noqa: BLE001
        ms = (time.perf_counter() - t0) * 1000
        return {
            "ok": False,
            "status": None,
            "ms": round(ms, 1),
            "headers": {},
            "body": b"",
            "url": url,
            "error": str(e),
        }


def fetch(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    body: bytes | None = None,
    timeout: float = 30.0,
    retries: int = 3,
) -> dict[str, Any]:
    last: dict[str, Any] = {}
    for i in range(max(1, retries)):
        last = fetch_once(url, method=method, headers=headers, body=body, timeout=timeout)
        if last.get("status") is not None:
            return last
        time.sleep(0.4 * (i + 1))
    return last


def json_body(row: dict[str, Any]) -> Any:
    try:
        return json.loads(row.get("body") or b"")
    except Exception:  # noqa: BLE001
        return None


def pct(sorted_vals: list[float], p: float) -> float | None:
    if not sorted_vals:
        return None
    if len(sorted_vals) == 1:
        return sorted_vals[0]
    k = (len(sorted_vals) - 1) * p
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_vals[int(k)]
    return sorted_vals[f] * (c - k) + sorted_vals[c] * (k - f)


def summarize_ms(samples: list[float]) -> dict[str, Any]:
    if not samples:
        return {"n": 0}
    s = sorted(samples)
    return {
        "n": len(s),
        "min": round(s[0], 1),
        "median": round(statistics.median(s), 1),
        "p95": round(pct(s, 0.95) or s[-1], 1),
        "max": round(s[-1], 1),
        "mean": round(statistics.fmean(s), 1),
    }


def probe_identity() -> dict[str, Any]:
    out: dict[str, Any] = {}
    for name, base in [
        ("staging_web", STAGING_WEB),
        ("prod_web", PROD_WEB),
        ("prod_apex", PROD_APEX),
    ]:
        row = fetch(f"{base}/api/release-identity")
        data = json_body(row) or {}
        out[name] = {
            "status": row.get("status"),
            "git_sha": data.get("git_sha"),
            "build_time": data.get("build_time"),
            "cms_baseline": data.get("cms_baseline"),
            "database_baseline": data.get("database_baseline"),
            "psg_release_version": data.get("psg_release_version"),
            "ms": row.get("ms"),
        }
    out["composition_match"] = out.get("prod_web", {}).get("git_sha") == COMPOSITION_SHA
    out["apex_match"] = out.get("prod_apex", {}).get("git_sha") == COMPOSITION_SHA
    out["staging_product_tip"] = out.get("staging_web", {}).get("git_sha") == PRODUCT_TIP
    return out


def probe_meta_database() -> dict[str, Any]:
    stg = fetch(f"{STAGING_API}/meta")
    prod = fetch(f"{PROD_API}/meta")
    sj, pj = json_body(stg) or {}, json_body(prod) or {}

    def slice_db(d: dict[str, Any]) -> dict[str, Any]:
        return {
            "database_connected": d.get("database_connected"),
            "database": d.get("database"),
            "build": {
                k: (d.get("build") or {}).get(k)
                for k in (
                    "git_sha",
                    "deployment_profile",
                    "psg_release_version",
                    "contract_profile",
                    "attestation_status",
                    "deployed_at",
                    "build_time",
                    "image_digest",
                )
            },
            "strict_mode": d.get("strict_mode"),
            "ssot_version": d.get("ssot_version"),
            "ssot_match": (d.get("ssot") or {}).get("match"),
            "order_mock_pay_enabled": (d.get("orders") or {}).get("order_mock_pay_enabled"),
            "chargeback_policy": (d.get("chargeback_policy") or {}).get("value"),
            "rate_limits": {
                k: (d.get("rate_limits") or {}).get(k)
                for k in (
                    "window_seconds",
                    "api_requests_per_minute_per_client",
                    "api_limit_disabled",
                    "critical_writes_per_minute_per_client",
                    "critical_limit_disabled",
                )
            },
            "auth_top_keys": (d.get("auth") or {}).get("auth_top_keys"),
        }

    stg_s, prod_s = slice_db(sj), slice_db(pj)
    expected_env = [
        {
            "id": "API-DEPLOYMENT-PROFILE",
            "class": "ACCEPTED_ENV_DIFFERENCE",
            "summary": "API deployment_profile staging vs production (same git_sha)",
            "stg": stg_s["build"].get("deployment_profile"),
            "prod": prod_s["build"].get("deployment_profile"),
        },
        {
            "id": "ORDER-MOCK-PAY",
            "class": "ACCEPTED_ENV_DIFFERENCE",
            "summary": "order_mock_pay_enabled Staging=true Production=false (prod hardening)",
            "stg": stg_s.get("order_mock_pay_enabled"),
            "prod": prod_s.get("order_mock_pay_enabled"),
        },
        {
            "id": "STRICT-MODE-PROD",
            "class": "ACCEPTED_ENV_DIFFERENCE",
            "summary": "strict_mode / ssot tighter on Production than Staging",
            "stg": stg_s.get("strict_mode"),
            "prod": prod_s.get("strict_mode"),
        },
        {
            "id": "CHARGEBACK-POLICY",
            "class": "ACCEPTED_ENV_DIFFERENCE",
            "summary": "chargeback_policy Staging unset vs Production warn",
            "stg": stg_s.get("chargeback_policy"),
            "prod": prod_s.get("chargeback_policy"),
        },
    ]

    dsn_prod = bool(os.environ.get("PRODUCTION_DATABASE_URL") or "")
    dsn_stg = bool(os.environ.get("STAGING_DATABASE_URL") or "")
    unlock = os.environ.get("TT_OWNER_DEEP_DB_OK") == "1"
    schema_sql: dict[str, Any] = {
        "attempted": False,
        "reason": "no PRODUCTION_DATABASE_URL and/or TT_OWNER_DEEP_DB_OK!=1",
    }
    if unlock and dsn_prod:
        schema_sql = run_schema_alignment(
            os.environ["PRODUCTION_DATABASE_URL"],
            os.environ.get("STAGING_DATABASE_URL") or "",
        )

    connected_ok = bool(stg_s.get("database_connected")) and bool(prod_s.get("database_connected"))
    schema_pass = schema_sql.get("pass") is True
    status = "PASS" if (connected_ok and schema_pass) else ("PARTIAL" if connected_ok else "FAIL")
    gaps: list[dict[str, Any]] = []
    if not schema_pass:
        gaps.append(
            {
                "id": "DB-SCHEMA-MIGRATION-SQL",
                "class": "OWNER_REQUIRED",
                "summary": (
                    "Schema/Migration/Index/Constraint/Enum/Default SQL alignment not closed: "
                    "provide TT_OWNER_DEEP_DB_OK=1 + PRODUCTION_DATABASE_URL "
                    "(+ STAGING_DATABASE_URL for pairwise). Public /meta only proves connected=true."
                ),
                "detail": schema_sql,
            }
        )
    return {
        "status": status,
        "connected_ok": connected_ok,
        "schema_sql": schema_sql,
        "staging": stg_s,
        "production": prod_s,
        "expected_env_differences": expected_env,
        "gaps": gaps,
        "http": {"staging_meta": stg.get("status"), "prod_meta": prod.get("status")},
    }


def run_schema_alignment(prod_dsn: str, stg_dsn: str) -> dict[str, Any]:
    """Optional SQL deep compare when Owner unlock + DSNs present."""
    try:
        import psycopg  # type: ignore
    except Exception as e:  # noqa: BLE001
        return {"attempted": True, "pass": False, "error": f"psycopg unavailable: {e}"}

    def snap(dsn: str) -> dict[str, Any]:
        with psycopg.connect(dsn, connect_timeout=20) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_schema NOT IN ('pg_catalog','information_schema')
                    ORDER BY 1,2,3
                    """
                )
                cols = [tuple(r) for r in cur.fetchall()]
                cur.execute(
                    """
                    SELECT schemaname, tablename, indexname, indexdef
                    FROM pg_indexes
                    WHERE schemaname NOT IN ('pg_catalog','information_schema')
                    ORDER BY 1,2,3
                    """
                )
                indexes = [tuple(r) for r in cur.fetchall()]
                cur.execute(
                    """
                    SELECT conname, contype, conrelid::regclass::text
                    FROM pg_constraint
                    WHERE connamespace::regnamespace::text NOT IN ('pg_catalog','information_schema')
                    ORDER BY 1
                    """
                )
                constraints = [tuple(r) for r in cur.fetchall()]
                cur.execute(
                    """
                    SELECT t.typname, e.enumlabel
                    FROM pg_type t
                    JOIN pg_enum e ON t.oid = e.enumtypid
                    JOIN pg_namespace n ON n.oid = t.typnamespace
                    WHERE n.nspname NOT IN ('pg_catalog','information_schema')
                    ORDER BY 1, e.enumsortorder
                    """
                )
                enums = [tuple(r) for r in cur.fetchall()]
                mig: list[Any] = []
                for table in (
                    "schema_migrations",
                    "_sqlx_migrations",
                    "goose_db_version",
                    "__diesel_schema_migrations",
                ):
                    try:
                        cur.execute(f"SELECT * FROM {table} ORDER BY 1")
                        mig = [tuple(r) for r in cur.fetchall()]
                        break
                    except Exception:  # noqa: BLE001
                        conn.rollback()
                return {
                    "columns": cols,
                    "indexes": indexes,
                    "constraints": constraints,
                    "enums": enums,
                    "migrations": mig,
                    "host": urlparse(dsn).hostname,
                }

    prod = snap(prod_dsn)
    out: dict[str, Any] = {
        "attempted": True,
        "prod_host": prod.get("host"),
        "prod_counts": {k: len(prod[k]) for k in ("columns", "indexes", "constraints", "enums", "migrations")},
    }
    if stg_dsn:
        stg = snap(stg_dsn)
        out["stg_host"] = stg.get("host")
        out["stg_counts"] = {k: len(stg[k]) for k in ("columns", "indexes", "constraints", "enums", "migrations")}
        diffs = {
            "columns": sorted(set(map(str, prod["columns"])) ^ set(map(str, stg["columns"])))[:50],
            "indexes": sorted(set(map(str, prod["indexes"])) ^ set(map(str, stg["indexes"])))[:50],
            "constraints": sorted(set(map(str, prod["constraints"])) ^ set(map(str, stg["constraints"])))[:50],
            "enums": sorted(set(map(str, prod["enums"])) ^ set(map(str, stg["enums"])))[:50],
            "migrations": sorted(set(map(str, prod["migrations"])) ^ set(map(str, stg["migrations"])))[:50],
        }
        out["symmetric_diff_sample"] = diffs
        out["pass"] = all(len(v) == 0 for v in diffs.values())
        if not out["pass"]:
            out["error"] = "schema/index/constraint/enum/migration symmetric diff non-empty"
    else:
        out["pass"] = False
        out["error"] = "STAGING_DATABASE_URL missing — cannot pairwise-align; prod snapshot only"
        out["prod_snapshot_only"] = True
    return out


def probe_cms_media(identity_probe: dict[str, Any] | None = None) -> dict[str, Any]:
    gaps: list[dict[str, Any]] = []
    identity = {}
    # Prefer already-verified identity probe (avoids transient null flake)
    if identity_probe:
        identity = {
            "staging": {
                "cms_baseline": (identity_probe.get("staging_web") or {}).get("cms_baseline"),
                "status": (identity_probe.get("staging_web") or {}).get("status"),
            },
            "prod": {
                "cms_baseline": (identity_probe.get("prod_web") or {}).get("cms_baseline"),
                "status": (identity_probe.get("prod_web") or {}).get("status"),
            },
        }
    else:
        for name, base in [("staging", STAGING_WEB), ("prod", PROD_WEB)]:
            row = fetch(f"{base}/api/release-identity")
            data = json_body(row) or {}
            identity[name] = {
                "cms_baseline": data.get("cms_baseline"),
                "status": row.get("status"),
            }

    stg_cms = identity.get("staging", {}).get("cms_baseline")
    prod_cms = identity.get("prod", {}).get("cms_baseline")
    cms_same = bool(stg_cms) and stg_cms == prod_cms
    if not cms_same:
        gaps.append(
            {
                "id": "CMS-BASELINE-MISMATCH",
                "class": "FIX_REQUIRED",
                "summary": "cms_baseline Staging≠Production on release-identity",
                "detail": identity,
            }
        )

    # Public CMS/catalog-ish API surfaces (non-mutating)
    api_paths = [
        "/api/v1/guides?limit=5",
        "/api/v1/discover/orders?limit=5",
        "/api/v1/did-rank/itineraries?city=%E5%8C%97%E4%BA%AC&limit=5",
    ]
    api_rows = {}
    for path in api_paths:
        stg = fetch(f"{STAGING_API}{path}")
        prod = fetch(f"{PROD_API}{path}")
        sj, pj = json_body(stg), json_body(prod)

        def shape(j: Any) -> dict[str, Any]:
            if not isinstance(j, dict):
                return {"type": type(j).__name__}
            keys = sorted(j.keys())
            items = j.get("items") or j.get("data") or j.get("orders") or j.get("results")
            n = len(items) if isinstance(items, list) else None
            return {"keys": keys[:30], "item_count": n, "ok_json": True}

        api_rows[path] = {
            "staging": {"status": stg.get("status"), "shape": shape(sj), "ms": stg.get("ms")},
            "prod": {"status": prod.get("status"), "shape": shape(pj), "ms": prod.get("ms")},
        }
        if stg.get("status") != 200 or prod.get("status") != 200:
            gaps.append(
                {
                    "id": f"CMS-API-HTTP:{path}",
                    "class": "FIX_REQUIRED",
                    "summary": f"API HTTP not 200 on CMS-related public path {path}",
                    "detail": api_rows[path],
                }
            )

    # HTML marker: catalog / ambient / cms source hints on marketing pages
    page_markers = {}
    for route in ["/", "/market", "/guides"]:
        stg = fetch(f"{STAGING_WEB}{route}")
        prod = fetch(f"{PROD_WEB}{route}")
        markers = ("catalog_bake", "cms", "ambient", "cdn.web3-ttg", "/media/", "ocs")

        def mark(html: bytes) -> dict[str, Any]:
            text = (html or b"").decode("utf-8", errors="ignore").lower()
            return {m: (m.lower() in text) for m in markers} | {
                "bytes": len(html or b""),
                "status": None,
            }

        sm, pm = mark(stg.get("body") or b""), mark(prod.get("body") or b"")
        sm["status"], pm["status"] = stg.get("status"), prod.get("status")
        page_markers[route] = {"staging": sm, "prod": pm}
        if stg.get("status") != 200 or prod.get("status") != 200:
            gaps.append(
                {
                    "id": f"CMS-PAGE-HTTP:{route}",
                    "class": "FIX_REQUIRED",
                    "summary": f"Page HTTP not 200 for CMS surface {route}",
                }
            )

    cdn_urls = [f"{CDN}/", f"{CDN}/catalog/", f"{CDN}/media/", f"{CDN}/ocs/"]
    cdn = {}
    for u in cdn_urls:
        row = fetch(u, timeout=20)
        cdn[u] = {
            "status": row.get("status"),
            "ms": row.get("ms"),
            "error": row.get("error"),
            "ok": row.get("status") in (200, 301, 302, 403, 404),
        }
    # 403/404 on listing dirs can be expected; connection failures are not
    cdn_conn_fail = [u for u, v in cdn.items() if v.get("error") and v.get("status") is None]
    if cdn_conn_fail:
        gaps.append(
            {
                "id": "CDN-UNREACHABLE",
                "class": "FIX_REQUIRED",
                "summary": "CDN host unreachable for one or more paths",
                "detail": cdn_conn_fail,
            }
        )

    # Object-storage / publish chain credentials not in public surface → OWNER
    cos_unlock = os.environ.get("TT_OWNER_DEEP_CMS_OK") == "1"
    if not cos_unlock:
        gaps.append(
            {
                "id": "CMS-COS-PUBLISH-CHAIN",
                "class": "OWNER_REQUIRED",
                "summary": (
                    "CMS lifecycle · object storage ACL/metadata · CDN invalidation · "
                    "Review→Publish→Verify chain not Owner-unlocked this pass "
                    "(set TT_OWNER_DEEP_CMS_OK=1 + CMS/COS credentials to close)"
                ),
            }
        )

    fix = [g for g in gaps if g["class"] == "FIX_REQUIRED"]
    owner = [g for g in gaps if g["class"] == "OWNER_REQUIRED"]
    status = "PASS" if not fix and not owner else ("PARTIAL" if not fix else "FAIL")
    return {
        "status": status,
        "identity_cms": identity,
        "cms_baseline_aligned": cms_same,
        "api_rows": api_rows,
        "page_markers": page_markers,
        "cdn": cdn,
        "gaps": gaps,
    }


def probe_performance() -> dict[str, Any]:
    gaps: list[dict[str, Any]] = []
    pages: dict[str, Any] = {}
    for route in PERF_PAGES:
        stg_ms, prod_ms = [], []
        stg_status, prod_status = [], []
        for _ in range(SAMPLES):
            s = fetch(f"{STAGING_WEB}{route}")
            p = fetch(f"{PROD_WEB}{route}")
            stg_ms.append(float(s.get("ms") or 0))
            prod_ms.append(float(p.get("ms") or 0))
            stg_status.append(s.get("status"))
            prod_status.append(p.get("status"))
            time.sleep(0.05)
        pages[route] = {
            "staging": summarize_ms(stg_ms) | {"statuses": stg_status},
            "prod": summarize_ms(prod_ms) | {"statuses": prod_status},
            "delta_median_ms": round(
                (summarize_ms(prod_ms).get("median") or 0) - (summarize_ms(stg_ms).get("median") or 0),
                1,
            ),
        }
        if any(x != 200 for x in stg_status + prod_status):
            gaps.append(
                {
                    "id": f"PERF-PAGE-HTTP:{route}",
                    "class": "FIX_REQUIRED",
                    "summary": f"Non-200 during page benchmark {route}",
                }
            )

    apis: dict[str, Any] = {}
    for path in PERF_APIS:
        stg_ms, prod_ms = [], []
        for _ in range(SAMPLES):
            s = fetch(f"{STAGING_API}{path}")
            p = fetch(f"{PROD_API}{path}")
            stg_ms.append(float(s.get("ms") or 0))
            prod_ms.append(float(p.get("ms") or 0))
            time.sleep(0.05)
        apis[path] = {
            "staging": summarize_ms(stg_ms),
            "prod": summarize_ms(prod_ms),
            "delta_median_ms": round(
                (summarize_ms(prod_ms).get("median") or 0) - (summarize_ms(stg_ms).get("median") or 0),
                1,
            ),
        }

    # SSR / JS bundle signals from HTML
    bundle = {}
    for name, base in [("staging", STAGING_WEB), ("prod", PROD_WEB)]:
        row = fetch(f"{base}/")
        html = (row.get("body") or b"").decode("utf-8", errors="ignore")
        chunks = sorted(set(re.findall(r"/_next/static/chunks/[^\"']+\.js", html)))
        css = sorted(set(re.findall(r"/_next/static/css/[^\"']+\.css", html)))
        sizes = []
        for rel in chunks[:8]:
            r = fetch(f"{base}{rel}")
            sizes.append({"path": rel, "status": r.get("status"), "bytes": len(r.get("body") or b""), "ms": r.get("ms")})
        # image-ish
        imgs = re.findall(r'(?:src|href)="([^"]+\.(?:webp|jpg|jpeg|png|avif)[^"]*)"', html, flags=re.I)
        img_probe = None
        if imgs:
            u = imgs[0]
            if u.startswith("//"):
                u = "https:" + u
            elif u.startswith("/"):
                u = base + u
            ir = fetch(u, timeout=25)
            img_probe = {"url": u[:160], "status": ir.get("status"), "bytes": len(ir.get("body") or b""), "ms": ir.get("ms")}
        bundle[name] = {
            "html_bytes": len(row.get("body") or b""),
            "html_ms": row.get("ms"),
            "chunk_count_in_html": len(chunks),
            "css_count_in_html": len(css),
            "chunk_sample": sizes,
            "image_probe": img_probe,
            "x_nextjs_cache": (row.get("headers") or {}).get("x-nextjs-cache"),
        }

    # Budgets (informational thresholds; hard fail only on extreme regression)
    regressions = []
    for route, row in pages.items():
        stg_m = (row["staging"].get("median") or 0)
        prod_m = (row["prod"].get("median") or 0)
        if stg_m > 0 and prod_m > max(stg_m * 2.5, stg_m + 2500):
            regressions.append({"route": route, "stg_median": stg_m, "prod_median": prod_m})
    if regressions:
        gaps.append(
            {
                "id": "PERF-REGRESSION-PAGE",
                "class": "FIX_REQUIRED",
                "summary": "Production page median latency regresses >2.5x / +2.5s vs Staging",
                "detail": regressions,
            }
        )

    # Cache header observability sample
    cache = {}
    for name, base in [("staging", STAGING_WEB), ("prod", PROD_WEB)]:
        row = fetch(f"{base}/did-rank")
        cache[name] = {
            "cache-control": (row.get("headers") or {}).get("cache-control"),
            "x-nextjs-cache": (row.get("headers") or {}).get("x-nextjs-cache"),
            "ms": row.get("ms"),
            "status": row.get("status"),
        }

    fix = [g for g in gaps if g["class"] == "FIX_REQUIRED"]
    status = "PASS" if not fix else "FAIL"
    return {
        "status": status,
        "samples": SAMPLES,
        "pages": pages,
        "apis": apis,
        "bundle": bundle,
        "cache": cache,
        "gaps": gaps,
        "note": "DB query plan internals require DSN unlock; this pass covers page/API/SSR/JS/image/cache HTTP reality",
    }


def probe_security_observability() -> dict[str, Any]:
    gaps: list[dict[str, Any]] = []
    headers_audit = {}
    for name, url in [
        ("stg_api_health", f"{STAGING_API}/health"),
        ("prod_api_health", f"{PROD_API}/health"),
        ("stg_web", f"{STAGING_WEB}/"),
        ("prod_web", f"{PROD_WEB}/"),
        ("prod_apex", f"{PROD_APEX}/"),
    ]:
        row = fetch(url, retries=4)
        hdrs = row.get("headers") or {}
        missing = [h for h in SEC_HEADERS_REQUIRED if h not in hdrs]
        headers_audit[name] = {
            "status": row.get("status"),
            "present": {h: hdrs.get(h) for h in SEC_HEADERS_REQUIRED},
            "missing": missing,
            "server": hdrs.get("server"),
            "set_cookie": hdrs.get("set-cookie"),
            "error": row.get("error"),
        }
        if row.get("status") is None:
            gaps.append(
                {
                    "id": f"SEC-PROBE-UNREACHABLE:{name}",
                    "class": "OWNER_REQUIRED",
                    "summary": f"Security header probe unreachable after retries: {name}",
                    "detail": row.get("error"),
                }
            )
            continue
        # Public Apex + API must carry core headers. fly.dev prod host may omit HSTS
        # when Apex terminates TLS — still FIX if Apex itself misses HSTS.
        if name in ("stg_api_health", "prod_api_health", "prod_apex") and missing:
            gaps.append(
                {
                    "id": f"SEC-HEADERS-MISSING:{name}",
                    "class": "FIX_REQUIRED",
                    "summary": f"Required security headers missing on {name}: {missing}",
                }
            )
        if name == "prod_web" and missing:
            # record only; Apex is public edge of record
            headers_audit[name]["note"] = (
                "fly.dev may omit HSTS; Apex is authoritative public edge"
            )

    # CORS preflight sample
    cors = {}
    for name, base in [("staging", STAGING_API), ("prod", PROD_API)]:
        origin = STAGING_WEB if name == "staging" else PROD_APEX
        row = fetch(
            f"{base}/meta",
            method="OPTIONS",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        hdrs = row.get("headers") or {}
        cors[name] = {
            "status": row.get("status"),
            "allow_origin": hdrs.get("access-control-allow-origin"),
            "allow_credentials": hdrs.get("access-control-allow-credentials"),
            "allow_methods": hdrs.get("access-control-allow-methods"),
            "vary": hdrs.get("vary"),
        }

    # Admin unauthenticated deny
    admin = {}
    for name, base in [("staging", STAGING_WEB), ("prod", PROD_WEB)]:
        row = fetch(f"{base}/admin")
        admin[name] = {
            "status": row.get("status"),
            "ms": row.get("ms"),
            "location": (row.get("headers") or {}).get("location"),
            "body_has_login": b"login" in (row.get("body") or b"").lower()
            or b"auth" in (row.get("body") or b"").lower(),
        }
        # expect redirect/login gate, not open console JSON dump
        if row.get("status") == 200 and b"permissionDenied" in (row.get("body") or b"") and b"password" not in (
            row.get("body") or b""
        ).lower():
            # 200 HTML shell with client auth is acceptable; crash markers are not
            pass
        if row.get("status") in (500, 502, 503):
            gaps.append(
                {
                    "id": f"SEC-ADMIN-HTTP:{name}",
                    "class": "FIX_REQUIRED",
                    "summary": f"Admin entry returns {row.get('status')} on {name}",
                }
            )

    # Internal route without secret
    internal = {}
    for name, base in [("staging", STAGING_API), ("prod", PROD_API)]:
        row = fetch(f"{base}/internal/health", timeout=15)
        # also try common internal
        row2 = fetch(f"{base}/api/internal/ping", timeout=15)
        internal[name] = {
            "internal_health": {"status": row.get("status"), "ms": row.get("ms")},
            "api_internal_ping": {"status": row2.get("status"), "ms": row2.get("ms")},
        }
        for label, r in [("internal/health", row), ("api/internal/ping", row2)]:
            if r.get("status") == 200:
                gaps.append(
                    {
                        "id": f"SEC-INTERNAL-OPEN:{name}:{label}",
                        "class": "FIX_REQUIRED",
                        "summary": f"Internal path returned 200 without secret on {name} {label}",
                    }
                )

    # CSRF / cookie attributes on login page
    cookies = {}
    for name, base in [("staging", STAGING_WEB), ("prod", PROD_WEB)]:
        row = fetch(f"{base}/auth/login")
        sc = (row.get("headers") or {}).get("set-cookie") or ""
        cookies[name] = {
            "status": row.get("status"),
            "set_cookie_present": bool(sc),
            "httponly": "httponly" in sc.lower() if sc else None,
            "secure": "secure" in sc.lower() if sc else None,
            "samesite": ("samesite" in sc.lower()) if sc else None,
            "set_cookie_preview": (sc[:80] + "…") if sc and len(sc) > 80 else sc or None,
        }

    # Rate limit meta parity (already in DB section) — observability surface
    meta_stg = json_body(fetch(f"{STAGING_API}/meta")) or {}
    meta_prod = json_body(fetch(f"{PROD_API}/meta")) or {}
    obs = {
        "staging_rate_limits": meta_stg.get("rate_limits"),
        "prod_rate_limits": meta_prod.get("rate_limits"),
        "staging_authority": meta_stg.get("authority"),
        "prod_authority": meta_prod.get("authority"),
        "x_request_id_stg": (fetch(f"{STAGING_API}/health").get("headers") or {}).get("x-request-id"),
        "x_request_id_prod": (fetch(f"{PROD_API}/health").get("headers") or {}).get("x-request-id"),
    }
    if not obs["x_request_id_stg"] or not obs["x_request_id_prod"]:
        gaps.append(
            {
                "id": "OBS-REQUEST-ID-MISSING",
                "class": "FIX_REQUIRED",
                "summary": "x-request-id missing on API health (breaks audit trail)",
            }
        )

    # Secrets / alerts / metrics dashboards require Owner unlock
    if os.environ.get("TT_OWNER_DEEP_SEC_OK") != "1":
        gaps.append(
            {
                "id": "SEC-SECRET-ALERT-METRIC-DEEP",
                "class": "OWNER_REQUIRED",
                "summary": (
                    "Secret inventory · log PII redaction · metric/alert routes · "
                    "audit-log sink not Owner-unlocked (TT_OWNER_DEEP_SEC_OK=1 + access)"
                ),
            }
        )

    fix = [g for g in gaps if g["class"] == "FIX_REQUIRED"]
    owner = [g for g in gaps if g["class"] == "OWNER_REQUIRED"]
    status = "PASS" if not fix and not owner else ("PARTIAL" if not fix else "FAIL")
    return {
        "status": status,
        "headers_audit": headers_audit,
        "cors": cors,
        "admin": admin,
        "internal": internal,
        "cookies": cookies,
        "observability": {
            "request_ids_present": bool(obs["x_request_id_stg"] and obs["x_request_id_prod"]),
            "rate_limits_equal": obs["staging_rate_limits"] == obs["prod_rate_limits"],
            "authority_stg": obs["staging_authority"],
            "authority_prod": obs["prod_authority"],
        },
        "gaps": gaps,
    }


def main() -> int:
    at = utc_now()
    st = stamp()
    out_dir = ROOT / "evidence" / "GO_final_truth_vfinal_alignment" / f"owner-deep-{st}"
    runbook = ROOT / "docs" / "runbook"

    print(f"[owner-deep] start {at} composition={COMPOSITION_SHA}")
    identity = probe_identity()
    write_json(out_dir / "identity.json", identity)
    print("[owner-deep] identity", identity.get("composition_match"), identity.get("staging_product_tip"))

    db = probe_meta_database()
    write_json(out_dir / "database-reality.json", db)
    print("[owner-deep] database", db.get("status"), "gaps", len(db.get("gaps") or []))

    cms = probe_cms_media(identity)
    write_json(out_dir / "cms-cos-media.json", cms)
    print("[owner-deep] cms", cms.get("status"), "gaps", len(cms.get("gaps") or []))

    perf = probe_performance()
    write_json(out_dir / "performance-benchmark.json", perf)
    print("[owner-deep] perf", perf.get("status"), "gaps", len(perf.get("gaps") or []))

    sec = probe_security_observability()
    write_json(out_dir / "security-observability.json", sec)
    print("[owner-deep] security", sec.get("status"), "gaps", len(sec.get("gaps") or []))

    all_gaps: list[dict[str, Any]] = []
    for section, blob in [("database", db), ("cms", cms), ("performance", perf), ("security", sec)]:
        for g in blob.get("gaps") or []:
            all_gaps.append({**g, "section": section})

    # Accepted env from DB meta (never for UI/function/data/API/security defects)
    accepted = list(db.get("expected_env_differences") or [])
    accepted.append(
        {
            "id": "CHUNK-SET-ENV-INLINING",
            "class": "ACCEPTED_ENV_DIFFERENCE",
            "summary": "Build env host inlining / chunk hash rename (composition bake)",
        }
    )
    accepted.append(
        {
            "id": "ADMIN-UI-FREEZE-RETAIN",
            "class": "ACCEPTED_ENV_DIFFERENCE",
            "summary": "Admin Focus Reality retained; structure frozen; runtime guards only",
        }
    )

    fix_gaps = [g for g in all_gaps if g.get("class") == "FIX_REQUIRED"]
    owner_gaps = [g for g in all_gaps if g.get("class") == "OWNER_REQUIRED"]

    gates = {
        "database_reality": db.get("status"),
        "cms_cos_media": cms.get("status"),
        "performance_benchmark": perf.get("status"),
        "security_observability": sec.get("status"),
    }
    deep_all_pass = all(v == "PASS" for v in gates.values())
    non_web3_product_reality_closure = deep_all_pass and not fix_gaps and identity.get("composition_match")

    report = {
        "schema": "traveltrust.final_truth_owner_deep_closure_audit.v1",
        "machine_key": MACHINE,
        "at": at,
        "stamp": st,
        "live_composition_sha": COMPOSITION_SHA,
        "product_tip_oral": PRODUCT_TIP,
        "web3_truth": {
            "status": "LOCKED_FROZEN",
            "tip_sha": WEB3_TIP,
            "pin": WEB3_PIN,
            "touched": False,
        },
        "admin_ui_freeze": True,
        "admin_structure_changed": False,
        "tt_production_go": "NO_GO",
        "human_uat_open": False,
        "production_go_review_open": False,
        "identity": identity,
        "gates": gates,
        "non_web3_product_reality_closure": non_web3_product_reality_closure,
        "counts": {
            "FIX_REQUIRED": len(fix_gaps),
            "OWNER_REQUIRED": len(owner_gaps),
            "ACCEPTED_ENV_DIFFERENCE": len(accepted),
        },
        "gaps": all_gaps,
        "accepted_env_differences": accepted,
        "evidence_dir": str(out_dir.relative_to(ROOT)).replace("\\", "/"),
        "next_actions": (
            [
                "Owner unlock DB: TT_OWNER_DEEP_DB_OK=1 + PRODUCTION_DATABASE_URL (+ STAGING_DATABASE_URL)",
                "Owner unlock CMS/COS: TT_OWNER_DEEP_CMS_OK=1 + object-storage credentials",
                "Owner unlock Sec/Obs deep: TT_OWNER_DEEP_SEC_OK=1 + secret/alert/metric access",
                "Re-run this script; only then open Human UAT / Production GO Review",
            ]
            if not non_web3_product_reality_closure
            else [
                "Non-Web3 Product Reality Closure PASS — Owner may open Human UAT session",
                "Production GO Review remains separate; TT_PRODUCTION_GO stays NO_GO until Owner Sign-off",
            ]
        ),
    }
    write_json(out_dir / "OWNER-DEEP-CLOSURE-AUDIT.json", report)
    write_json(runbook / "TT-FINAL-TRUTH-OWNER-DEEP-CLOSURE-AUDIT-LATEST.json", report)

    md = f"""# TT Final Truth · OWNER Deep Closure Audit

**At:** `{at}`  
**Composition:** `{COMPOSITION_SHA}` · Product tip (oral): `{PRODUCT_TIP}`  
**Web3:** LOCKED_FROZEN `{WEB3_TIP}` / `{WEB3_PIN}` (untouched)  
**Admin UI/UX:** FROZEN (no structure/visual change this pass)

## Gates

| Gate | Status |
|------|--------|
| Database Reality | `{gates['database_reality']}` |
| CMS/COS/Media | `{gates['cms_cos_media']}` |
| Performance Benchmark | `{gates['performance_benchmark']}` |
| Security & Observability | `{gates['security_observability']}` |

## Counts

FIX_REQUIRED=**{len(fix_gaps)}** · OWNER_REQUIRED=**{len(owner_gaps)}** · ACCEPTED_ENV=**{len(accepted)}**

## Closure

- Non-Web3 Product Reality Closure: **{non_web3_product_reality_closure}**
- Human UAT open: **false**
- Production GO Review open: **false**
- `TT_PRODUCTION_GO`: **NO_GO**

## Gaps (OWNER / FIX)

"""
    for g in all_gaps:
        md += f"- `{g.get('id')}` · **{g.get('class')}** · {g.get('summary')}\n"
    md += f"\nEvidence: `{report['evidence_dir']}`\n"
    (runbook / "TT-FINAL-TRUTH-OWNER-DEEP-CLOSURE-AUDIT-LATEST.md").write_text(md, encoding="utf-8")
    write_json(out_dir / "README.json", {"human": "TT-FINAL-TRUTH-OWNER-DEEP-CLOSURE-AUDIT-LATEST.md", "report": "OWNER-DEEP-CLOSURE-AUDIT.json"})

    print(json.dumps({
        "at": at,
        "gates": gates,
        "counts": report["counts"],
        "non_web3_product_reality_closure": non_web3_product_reality_closure,
        "evidence": report["evidence_dir"],
    }, ensure_ascii=False))
    return 0 if not fix_gaps else 2


if __name__ == "__main__":
    raise SystemExit(main())
