#!/usr/bin/env python3
"""Official-First Runtime Reality compare (API/CMS/OCS/Auth/Admin/schema plane)."""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence/GO_official_product_reality_capture"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def git_head() -> str:
    return subprocess.check_output(["git", "-C", str(ROOT), "rev-parse", "HEAD"], text=True).strip()


def fetch_json(url: str, timeout: int = 30) -> tuple[int, Any]:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            try:
                return resp.status, json.loads(raw)
            except json.JSONDecodeError:
                return resp.status, {"raw": raw.strip()}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(body)
        except json.JSONDecodeError:
            return e.code, {"raw": body[:500]}
    except Exception as e:
        return 0, {"error": str(e)}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="https://tt-api-staging.fly.dev")
    ap.add_argument("--web", default="https://tt-web-staging.fly.dev")
    ap.add_argument("--out", default=str(EV / "OFFICIAL_RUNTIME_REALITY_COMPARE_LATEST.json"))
    args = ap.parse_args()

    api = args.api.rstrip("/")
    web = args.web.rstrip("/")
    head = git_head()
    checks: dict[str, Any] = {}
    gaps = 0

    hc, health = fetch_json(f"{api}/health")
    health_ok = hc == 200 and (
        health == {"raw": "ok"}
        or health == "ok"
        or (isinstance(health, dict) and health.get("status") in ("ok", "healthy"))
    )
    if not health_ok:
        for _ in range(12):
            time.sleep(5)
            hc, health = fetch_json(f"{api}/health")
            health_ok = hc == 200 and (
                health == {"raw": "ok"}
                or health == "ok"
                or (isinstance(health, dict) and health.get("status") in ("ok", "healthy"))
            )
            if health_ok:
                break
    checks["health"] = {"status_code": hc, "body": health, "pass": health_ok}
    if not health_ok:
        gaps += 1

    mc, meta = fetch_json(f"{api}/meta")
    api_sha = (meta.get("build", {}).get("git_sha") or meta.get("git_sha") or "") if isinstance(meta, dict) else ""
    migration_ok = True
    if isinstance(meta, dict):
        mig = meta.get("migrations") or meta.get("db") or {}
        if isinstance(mig, dict) and mig.get("applied_count") not in (None, 157):
            migration_ok = False
    checks["meta"] = {
        "status_code": mc,
        "git_sha": api_sha,
        "expected_git_head": head,
        "sha_matches_git_head": api_sha.startswith(head[:12]) or head.startswith(api_sha[:12]),
        "not_stale_1915ec4d": not api_sha.startswith("1915ec4d"),
        "migration_startup_ok": migration_ok,
        "pass": mc == 200 and migration_ok and not api_sha.startswith("1915ec4d"),
    }
    if not checks["meta"]["pass"]:
        gaps += 1

    rc, rid = fetch_json(f"{web}/api/release-identity")
    checks["release_identity"] = {
        "status_code": rc,
        "body": rid if isinstance(rid, dict) else {"raw": rid},
        "pass": rc == 200,
    }
    if rc != 200:
        gaps += 1

    # Auth surface (unauthenticated /me should not 5xx)
    ac, auth = fetch_json(f"{api}/api/v1/me")
    checks["auth_me_unauth"] = {
        "status_code": ac,
        "pass": ac in (401, 403, 404),
        "note": "expect 401/403/404 without session",
    }
    if ac not in (401, 403, 404):
        gaps += 1

    # Admin surface probe (public meta already validates admin_exports block)
    checks["admin_meta_surface"] = {
        "pass": isinstance(meta, dict) and "admin_exports" in meta,
        "note": "admin_exports in /meta",
    }
    if not checks["admin_meta_surface"]["pass"]:
        gaps += 1

    # Schema parity carry-forward
    schema_cmp = EV / "OFFICIAL_PRODUCT_REALITY_COMPARE_LATEST.json"
    schema_ok = False
    if schema_cmp.exists():
        sc = json.loads(schema_cmp.read_text(encoding="utf-8"))
        schema_ok = sc.get("RUNTIME_PARITY_GAPS") == "0" and sc.get("parity_pass_allowed")
    checks["schema_parity_carryforward"] = {"pass": schema_ok}

    # OCS/CMS — optional until seed applied
    cc, cms = fetch_json(f"{api}/api/v1/cms/public/announcements?limit=1")
    checks["cms_public_announcements"] = {
        "status_code": cc,
        "pass": cc in (200, 401, 404),
        "note": "200 after OCS seed; 401/404 acceptable pre-auth or empty",
    }
    if cc not in (200, 401, 404):
        gaps += 1

    runtime_gaps = gaps
    schema_gaps = 0 if schema_ok else 1
    total_gaps = runtime_gaps + schema_gaps

    out = {
        "schema": "traveltrust.official_runtime_reality_compare.v1",
        "recorded_utc": utc_now(),
        "track": "OFFICIAL_FIRST_CLEAN_REBUILD_CONVERGENCE",
        "targets": {"api": api, "web": web, "git_head": head},
        "checks": checks,
        "RUNTIME_API_GAPS": str(runtime_gaps),
        "SCHEMA_PARITY_CARRYFORWARD": "PASS" if schema_ok else "FAIL",
        "RUNTIME_PARITY_GAPS": str(total_gaps),
        "PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS": "ISSUED" if total_gaps == 0 else "NOT_ISSUED",
    }
    text = json.dumps(out, indent=2) + "\n"
    Path(args.out).write_text(text, encoding="utf-8")
    print(
        f"OFFICIAL_RUNTIME_REALITY_COMPARE: runtime_gaps={runtime_gaps} "
        f"total={total_gaps} pass={out['PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS']}"
    )
    print(json.dumps({"out": args.out, "gates": {
        "RUNTIME_PARITY_GAPS": out["RUNTIME_PARITY_GAPS"],
        "PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS": out["PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS"],
    }}, indent=2))
    return 0 if total_gaps == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
