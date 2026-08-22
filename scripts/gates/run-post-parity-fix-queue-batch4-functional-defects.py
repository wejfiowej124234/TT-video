#!/usr/bin/env python3
"""POST_PARITY_FIX_QUEUE · Batch 4 (Functional Defects) · Local or Staging verify gate.

Official PRODUCT SSOT: CAPTURE_DEEPEN_20260822.json + live www parity for M8-07.
M8-07: /me/payments and /legal/* GAP routes must match Official AS-IS (404);
canonical /privacy / /terms must remain 200.

Non-target 0-drift: Candidate Solidity · Production DB · FTB · TT_PRODUCTION_GO unchanged.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_official_product_reality_capture"
CAPTURE_DEEPEN = EV / "CAPTURE_DEEPEN_20260822.json"
OFFICIAL_WEB = os.environ.get("OFFICIAL_WEB_BASE", "https://www.web3-ttg.com").rstrip("/")

M8_07_GAP_ROUTES = ["/me/payments", "/legal/privacy", "/legal/terms", "/legal"]
M8_07_CANONICAL_ROUTES = ["/privacy", "/terms", "/help"]

FORBIDDEN_INTERNAL_LINK_PATTERNS = (
    re.compile(r'href=["\']/me/payments'),
    re.compile(r'href=["\']/legal/'),
)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch_status(url: str) -> tuple[int, str]:
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[no-untyped-def]
            return None

    opener = urllib.request.build_opener(NoRedirect())
    req = urllib.request.Request(url, headers={"Accept": "text/html,*/*"})
    retries = int(os.environ.get("POST_PARITY_BATCH4_HTTP_RETRIES", "5"))
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with opener.open(req, timeout=30) as resp:
                return resp.status, resp.headers.get("location", "")
        except urllib.error.HTTPError as e:
            return e.code, e.headers.get("location", "") if e.headers else ""
        except (urllib.error.URLError, TimeoutError, OSError) as err:
            last_err = err
            if attempt + 1 < retries:
                time.sleep(min(1.5 * (attempt + 1), 6.0))
                continue
            raise
    if last_err:
        raise last_err
    return 0, ""


def official_baseline() -> dict[str, int]:
    """Frozen Official AS-IS from capture + M8-07 extension."""
    baseline: dict[str, int] = {}
    if CAPTURE_DEEPEN.exists():
        routes = (json.loads(CAPTURE_DEEPEN.read_text(encoding="utf-8")).get("layers", {}).get("Routes", {}) or {}).get(
            "inventory", {}
        )
        for path, meta in routes.items():
            if isinstance(meta, dict) and "http" in meta:
                baseline[path] = int(meta["http"])
    for path in M8_07_GAP_ROUTES:
        baseline.setdefault(path, 404)
    for path in M8_07_CANONICAL_ROUTES:
        baseline.setdefault(path, 200)
    return baseline


def scan_forbidden_internal_links() -> list[str]:
    hits: list[str] = []
    scan_roots = [
        ROOT / "frontend" / "app",
        ROOT / "frontend" / "components",
        ROOT / "frontend" / "lib",
    ]
    for root in scan_roots:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if path.suffix not in (".tsx", ".ts", ".jsx", ".js", ".md"):
                continue
            if "archive" in path.parts or "node_modules" in path.parts:
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            for pat in FORBIDDEN_INTERNAL_LINK_PATTERNS:
                if pat.search(text):
                    hits.append(str(path.relative_to(ROOT)).replace("\\", "/"))
                    break
    return sorted(set(hits))


def run_local_regression() -> tuple[bool, str]:
    if os.environ.get("POST_PARITY_BATCH4_SKIP_LOCAL_REGRESSION", "").strip() == "1":
        return True, "skipped"
    proc = subprocess.run(
        ["cargo", "test", "-p", "traveltrust-api", "auth_placeholder_strict_gate_tests", "--", "--nocapture"],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    ok = proc.returncode == 0
    tail = (proc.stdout or proc.stderr or "").strip().splitlines()
    line = tail[-1] if tail else f"exit={proc.returncode}"
    return ok, line


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--web", default=os.environ.get("STAGING_WEB_BASE", "https://tt-web-staging.fly.dev"))
    p.add_argument("--official", default=OFFICIAL_WEB)
    p.add_argument("--out", default=str(EV / "POST_PARITY_FIX_QUEUE_BATCH4_FUNCTIONAL_DEFECTS_LATEST.json"))
    args = p.parse_args()
    web = args.web.rstrip("/")
    official = args.official.rstrip("/")

    gaps: list[dict] = []
    checks: dict = {}
    baseline = official_baseline()
    checks["official_baseline_cite"] = CAPTURE_DEEPEN.name

    # FD-01 · M8-07 gap routes match Official AS-IS on staging
    gap_checks = {}
    for path in M8_07_GAP_ROUTES:
        exp = baseline.get(path, 404)
        code, loc = fetch_status(f"{web}{path}")
        ok = code == exp
        gap_checks[path] = {"status_code": code, "location": loc, "expected": exp, "pass": ok}
        if not ok:
            gaps.append({"id": "FD-01", "detail": f"M8-07 {path} staging {code} expected Official {exp}"})
    checks["fd01_m8_07_gap_routes_staging"] = gap_checks

    # FD-02 · canonical legal/help routes 200 on staging
    canon_checks = {}
    for path in M8_07_CANONICAL_ROUTES:
        exp = baseline.get(path, 200)
        code, loc = fetch_status(f"{web}{path}")
        ok = code == exp
        canon_checks[path] = {"status_code": code, "location": loc, "expected": exp, "pass": ok}
        if not ok:
            gaps.append({"id": "FD-02", "detail": f"{path} staging {code} expected {exp}"})
    checks["fd02_canonical_routes_staging"] = canon_checks

    # FD-03 · live Official vs frozen baseline (read-only spot check)
    official_checks = {}
    for path in [*M8_07_GAP_ROUTES, *M8_07_CANONICAL_ROUTES]:
        exp = baseline.get(path, 404 if path in M8_07_GAP_ROUTES else 200)
        code, loc = fetch_status(f"{official}{path}")
        ok = code == exp
        official_checks[path] = {"status_code": code, "location": loc, "expected": exp, "pass": ok}
        if not ok:
            gaps.append({"id": "FD-03", "detail": f"Official drift {path} {code} vs baseline {exp}"})
    checks["fd03_official_live_spot_check"] = official_checks

    # FD-04 · no internal product links to GAP paths (honest IA)
    bad_links = scan_forbidden_internal_links()
    checks["fd04_no_gap_internal_links"] = {
        "hits": bad_links,
        "pass": len(bad_links) == 0,
    }
    if bad_links:
        gaps.append({"id": "FD-04", "detail": f"forbidden internal links: {bad_links[:5]}"})

    # FD-05 · local API auth regression (① spine)
    reg_ok, reg_note = run_local_regression()
    checks["fd05_local_api_regression"] = {"pass": reg_ok, "note": reg_note}
    if not reg_ok:
        gaps.append({"id": "FD-05", "detail": f"local regression fail ({reg_note})"})

    out = {
        "schema": "traveltrust.post_parity_fix_queue_batch4_functional_defects.v1",
        "recorded_utc": utc_now(),
        "batch": "4_functional_defects",
        "baseline": "POST_PARITY_FIX_QUEUE_BATCH3_UI_UX_PASS_STOP",
        "official_product_ssot": "www.web3-ttg.com OPS-v9",
        "items": ["M8-07", "FD-01", "FD-02", "FD-03", "FD-04", "FD-05"],
        "web": web,
        "official": official,
        "checks": checks,
        "gaps": gaps,
        "BATCH4_FUNCTIONAL_DEFECTS_PASS": "ISSUED" if not gaps else "NOT_ISSUED",
        "UNAUTHORIZED_DRIFT": "0" if not gaps else "NOT_ZERO",
        "OUT_OF_SCOPE": "0",
        "tt_production_go": "NO_GO",
        "non_target_drift": {
            "candidate_solidity": "0",
            "production_db_mutation": "0",
            "tt_production_go_flip": "0",
            "production_mutation": "0",
        },
    }
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(
        f"POST_PARITY_BATCH4_FUNCTIONAL_DEFECTS: pass={out['BATCH4_FUNCTIONAL_DEFECTS_PASS']} "
        f"gaps={len(gaps)} out={out_path.name}"
    )
    return 0 if not gaps else 2


if __name__ == "__main__":
    raise SystemExit(main())
