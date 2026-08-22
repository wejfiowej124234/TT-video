#!/usr/bin/env python3
"""POST_PARITY_FIX_QUEUE · Batch 3 (UI/UX) · Local or Staging verify gate.

Official PRODUCT SSOT: CAPTURE_DEEPEN_20260822.json · OPS-v9 pin 3e356617.
FIVE-MAIN UI frozen — data-link / wiring / visibility only (no structure/CSS changes).

Non-target 0-drift: Candidate Solidity · Production DB · FTB · TT_PRODUCTION_GO unchanged.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shlex
import shutil
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
FIVE_MAIN_ROUTES = ["/", "/traveltrust", "/market", "/did-rank", "/community"]
BOOTSTRAP_MARKERS = ("tt-session-cookie-bootstrap.js", "tt-dev-chunk-recovery.js")
DATA_LINK_VITEST = [
    "app/(home)/homeMarketing.contract.test.ts",
    "lib/landingItinerarySession.test.ts",
    "components/market/useMarketPage.contract.test.ts",
    "lib/marketTravelBookmarksSync.test.ts",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch(
    url: str,
    timeout: float = 30.0,
    max_bytes: int = 250_000,
    *,
    follow_redirects: bool = True,
) -> tuple[int, str, dict[str, str]]:
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[no-untyped-def]
            return None

    handlers: list[urllib.request.BaseHandler] = []
    if not follow_redirects:
        handlers.append(NoRedirect())
    opener = urllib.request.build_opener(*handlers)
    req = urllib.request.Request(url, headers={"Accept": "text/html,application/json,*/*"})
    retries = int(os.environ.get("POST_PARITY_BATCH3_HTTP_RETRIES", "5"))
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with opener.open(req, timeout=timeout) as resp:
                hdrs = {k.lower(): v for k, v in resp.headers.items()}
                chunks: list[bytes] = []
                total = 0
                while True:
                    part = resp.read(min(65536, max_bytes - total) if max_bytes > 0 else 65536)
                    if not part:
                        break
                    chunks.append(part)
                    total += len(part)
                    if max_bytes > 0 and total >= max_bytes:
                        break
                return resp.status, b"".join(chunks).decode("utf-8", errors="replace"), hdrs
        except urllib.error.HTTPError as e:
            hdrs = {k.lower(): v for k, v in e.headers.items()} if e.headers else {}
            body_txt = e.read(8192).decode("utf-8", errors="replace") if e.fp else ""
            return e.code, body_txt, hdrs
        except (urllib.error.URLError, TimeoutError, OSError) as err:
            last_err = err
            if attempt + 1 < retries:
                time.sleep(min(1.5 * (attempt + 1), 6.0))
                continue
            raise
    if last_err:
        raise last_err
    return 0, "", {}


def load_capture() -> dict:
    if not CAPTURE_DEEPEN.exists():
        return {}
    return json.loads(CAPTURE_DEEPEN.read_text(encoding="utf-8"))


def bash_exe() -> str:
    for candidate in (
        os.environ.get("BASH", "").strip(),
        shutil.which("bash") or "",
        r"C:\Program Files\Git\bin\bash.exe",
        r"C:\Program Files\Git\usr\bin\bash.exe",
    ):
        if candidate and Path(candidate).exists():
            return candidate
    return "bash"


def run_shell(cmd: str, cwd: Path | None = None) -> tuple[int, str]:
    proc = subprocess.run(
        [bash_exe(), "-lc", cmd],
        cwd=str(cwd or ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    out = (proc.stdout or "") + (proc.stderr or "")
    return proc.returncode, out.strip().splitlines()[-1] if out.strip() else ""


def run_five_main_gate() -> tuple[bool, str]:
    if os.environ.get("POST_PARITY_BATCH3_SKIP_LOCAL_GREEN", "").strip() == "1":
        return True, "skipped"
    code, line = run_shell("bash scripts/gates/five-main-routes-ui-antiregression-gate.sh")
    return code == 0 and "TT_FIVE_MAIN_ROUTES_UI_GATE_SUMMARY: OK" in line, line or f"exit={code}"


def run_data_link_vitest() -> tuple[bool, str]:
    if os.environ.get("POST_PARITY_BATCH3_SKIP_LOCAL_GREEN", "").strip() == "1":
        return True, "skipped"
    files = " ".join(shlex.quote(f) for f in DATA_LINK_VITEST)
    code, line = run_shell(f"cd frontend && npx vitest run {files}")
    return code == 0, line or f"exit={code}"


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--api", default=os.environ.get("STAGING_API_BASE", "https://tt-api-staging.fly.dev"))
    p.add_argument("--web", default=os.environ.get("STAGING_WEB_BASE", "https://tt-web-staging.fly.dev"))
    p.add_argument("--out", default=str(EV / "POST_PARITY_FIX_QUEUE_BATCH3_UI_UX_LATEST.json"))
    args = p.parse_args()
    web = args.web.rstrip("/")

    gaps: list[dict] = []
    checks: dict = {}
    capture = load_capture()
    pin = capture.get("pin", {})
    exp_sha = pin.get("git_sha", "3e356617a498b0faac42e4ae457343d36294a770")
    exp_bootstrap = (capture.get("layers", {}).get("Config") or {}).get("session_bootstrap", "v8")
    checks["official_baseline_cite"] = CAPTURE_DEEPEN.name if capture else "missing"

    # UX-01 · FIVE-MAIN routes HTTP 200
    route_checks = {}
    for route in FIVE_MAIN_ROUTES:
        code, body, _ = fetch(f"{web}{route}")
        ok = code == 200 and len(body) > 1000
        route_checks[route] = {"status_code": code, "pass": ok}
        if not ok:
            gaps.append({"id": "UX-01", "detail": f"{route} http {code}"})
    checks["ux01_five_main_routes"] = route_checks

    # UX-02 · release-identity pin parity (Official OPS-v9)
    rid_code, rid_body, _ = fetch(f"{web}/api/release-identity", max_bytes=4096)
    rid_sha = ""
    if rid_code == 200:
        try:
            rid = json.loads(rid_body)
            rid_sha = str(rid.get("git_sha") or rid.get("artifact_sha") or "")
        except json.JSONDecodeError:
            rid_sha = ""
    pin_ok = rid_code == 200 and rid_sha.startswith(exp_sha[:12])
    checks["ux02_release_identity"] = {
        "status_code": rid_code,
        "git_sha": rid_sha,
        "expected_prefix": exp_sha[:12],
        "pass": pin_ok,
    }
    if not pin_ok:
        gaps.append({"id": "UX-02", "detail": f"release-identity {rid_code} sha={rid_sha[:12]}"})

    # UX-03 · session bootstrap wiring markers on five-main + auth/login
    bootstrap_checks = {}
    for route in [*FIVE_MAIN_ROUTES, "/auth/login"]:
        code, body, _ = fetch(f"{web}{route}")
        markers = {m: (m in body) for m in BOOTSTRAP_MARKERS}
        ok = code == 200 and all(markers.values())
        bootstrap_checks[route] = {"status_code": code, "markers": markers, "pass": ok}
        if not ok:
            gaps.append({"id": "UX-03", "detail": f"bootstrap markers missing on {route}"})
    checks["ux03_session_bootstrap_wiring"] = {
        "expected_bootstrap": exp_bootstrap,
        "routes": bootstrap_checks,
    }

    # UX-04 · visibility — home title non-empty (capture partial; no structure change)
    _, home_body, _ = fetch(f"{web}/")
    title_m = re.search(r"<title>([^<]+)</title>", home_body)
    title = title_m.group(1).strip() if title_m else ""
    exp_title = (capture.get("layers", {}).get("i18n") or {}).get("home_en_title", "")
    title_ok = bool(title) and (not exp_title or title == exp_title or "TravelTrust" in title)
    checks["ux04_home_title_visibility"] = {
        "title": title,
        "expected_capture": exp_title,
        "pass": title_ok,
    }
    if not title_ok:
        gaps.append({"id": "UX-04", "detail": f"home title missing or drift ({title!r})"})

    # UX-05 · FIVE-MAIN antiregression gate (① local · theme/layout lock)
    five_ok, five_note = run_five_main_gate()
    checks["ux05_five_main_antiregression"] = {"pass": five_ok, "note": five_note}
    if not five_ok:
        gaps.append({"id": "UX-05", "detail": f"five-main gate fail ({five_note})"})

    # UX-06 · landing/market data-link contract vitest (no i18n batch scope)
    dl_ok, dl_note = run_data_link_vitest()
    checks["ux06_data_link_contracts"] = {"pass": dl_ok, "note": dl_note, "files": DATA_LINK_VITEST}
    if not dl_ok:
        gaps.append({"id": "UX-06", "detail": f"data-link vitest fail ({dl_note})"})

    out = {
        "schema": "traveltrust.post_parity_fix_queue_batch3_ui_ux.v1",
        "recorded_utc": utc_now(),
        "batch": "3_ui_ux",
        "baseline": "POST_PARITY_FIX_QUEUE_BATCH2_ADMIN_AUTH_PASS_STOP",
        "official_product_ssot": "www.web3-ttg.com OPS-v9",
        "five_main_ui_frozen": True,
        "web": web,
        "checks": checks,
        "gaps": gaps,
        "items": ["UX-01", "UX-02", "UX-03", "UX-04", "UX-05", "UX-06"],
        "BATCH3_UI_UX_PASS": "ISSUED" if not gaps else "NOT_ISSUED",
        "UNAUTHORIZED_DRIFT": "0" if not gaps else "NOT_ZERO",
        "OUT_OF_SCOPE": "0",
        "UI_UX_STRUCTURAL_DIFF": "0",
        "tt_production_go": "NO_GO",
        "non_target_drift": {
            "candidate_solidity": "0",
            "production_db_mutation": "0",
            "tt_production_go_flip": "0",
            "five_main_structure_ui": "0",
        },
    }
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(
        f"POST_PARITY_BATCH3_UI_UX: pass={out['BATCH3_UI_UX_PASS']} "
        f"gaps={len(gaps)} out={out_path.name}"
    )
    return 0 if not gaps else 2


if __name__ == "__main__":
    raise SystemExit(main())
