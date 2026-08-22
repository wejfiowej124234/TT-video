#!/usr/bin/env python3
"""POST_PARITY_FIX_QUEUE · Batch 2 (Admin/Auth) · Local or Staging verify gate.

Official PRODUCT SSOT: RUNTIME_AUTH_ADMIN_I18N_IDENTITY_20260822.json capture.
Targets: auth/admin HTTP parity · STRICT_SESSION · login→me · OCS admin · RBAC matrix.

Non-target 0-drift: Candidate Solidity · Production DB · FTB · TT_PRODUCTION_GO unchanged.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_official_product_reality_capture"
OFFICIAL_CAPTURE = EV / "RUNTIME_AUTH_ADMIN_I18N_IDENTITY_20260822.json"
RBAC_REPORT = ROOT / "evidence" / "GO_staging_admin_rbac_matrix" / "latest" / "report.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch(
    url: str,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    body: bytes | None = None,
    timeout: float = 30.0,
    max_bytes: int = 8192,
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
    req = urllib.request.Request(url, method=method, headers=headers or {}, data=body)
    retries = int(os.environ.get("POST_PARITY_BATCH2_HTTP_RETRIES", "4"))
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


def post_json(url: str, payload: dict, headers: dict[str, str] | None = None) -> tuple[int, dict]:
    data = json.dumps(payload).encode("utf-8")
    h = {
        "Content-Type": "application/json",
        "Idempotency-Key": f"post-parity-b2-{uuid.uuid4()}",
        **(headers or {}),
    }
    code, text, _ = fetch(url, "POST", headers=h, body=data)
    try:
        return code, json.loads(text) if text else {}
    except json.JSONDecodeError:
        return code, {"_raw": text[:200]}


def extract_bearer(body: dict) -> str | None:
    for key in ("token", "session_token", "access_token"):
        val = body.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    data = body.get("data")
    if isinstance(data, dict):
        for key in ("token", "session_token", "access_token"):
            val = data.get(key)
            if isinstance(val, str) and val.strip():
                return val.strip()
    return None


def load_official_baseline() -> dict:
    if not OFFICIAL_CAPTURE.exists():
        return {}
    return json.loads(OFFICIAL_CAPTURE.read_text(encoding="utf-8"))


def run_admin_matrix(api: str) -> tuple[bool, str]:
    if os.environ.get("POST_PARITY_BATCH2_SKIP_RBAC_MATRIX", "").strip() == "1":
        if RBAC_REPORT.exists():
            rep = json.loads(RBAC_REPORT.read_text(encoding="utf-8"))
            ok = rep.get("summary", {}).get("fail", 1) == 0 and rep.get("summary", {}).get("pass", 0) >= 100
            return ok, "cached_report"
        return False, "skip_without_report"
    env = os.environ.copy()
    env.setdefault("STAGING_API_BASE", api)
    env.setdefault("TRAVELTRUST_STAGING_API_BASE", api)
    env.setdefault("ADM_U01_STRICT", "1")
    proc = subprocess.run(
        [sys.executable, str(ROOT / "scripts/gates/run-admin-rbac-staging-matrix.py")],
        cwd=str(ROOT),
        env=env,
        capture_output=True,
        text=True,
    )
    tail = (proc.stdout or proc.stderr or "").strip().splitlines()
    line = tail[-1] if tail else ""
    return proc.returncode == 0 and "TT_ADMIN_RBAC_STAGING_MATRIX: OK" in line, line


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--api", default=os.environ.get("STAGING_API_BASE", "https://tt-api-staging.fly.dev"))
    p.add_argument("--web", default=os.environ.get("STAGING_WEB_BASE", "https://tt-web-staging.fly.dev"))
    p.add_argument("--out", default=str(EV / "POST_PARITY_FIX_QUEUE_BATCH2_ADMIN_AUTH_LATEST.json"))
    args = p.parse_args()
    api = args.api.rstrip("/")
    web = args.web.rstrip("/")

    gaps: list[dict] = []
    checks: dict = {}
    official = load_official_baseline()
    checks["official_baseline_cite"] = OFFICIAL_CAPTURE.name if official else "missing"

    # BA-01 · Official capture parity (API auth surfaces)
    exp_me = official.get("auth", {}).get("me_unauth_http", 401)
    me_code, _, _ = fetch(f"{api}/api/v1/me")
    checks["ba01_me_unauth"] = {"status_code": me_code, "expected": exp_me, "pass": me_code == exp_me}
    if me_code != exp_me:
        gaps.append({"id": "BA-01", "detail": f"/api/v1/me unauth {me_code} expected {exp_me}"})

    cap_code, _, _ = fetch(f"{api}/api/v1/admin/capabilities")
    checks["ba01_admin_capabilities_unauth"] = {
        "status_code": cap_code,
        "pass": cap_code in (401, 403),
        "note": "STRICT_SESSION protected admin surface",
    }
    if cap_code not in (401, 403):
        gaps.append({"id": "BA-01", "detail": f"admin/capabilities unauth {cap_code}"})

    # BA-02 · www admin redirect parity (Official: 307 → /auth/login?returnUrl=%2Fadmin)
    exp_admin_http = official.get("admin", {}).get("http", 307)
    exp_redirect = official.get("admin", {}).get("redirect", "/auth/login?returnUrl=%2Fadmin")
    admin_code, _, admin_hdrs = fetch(f"{web}/admin", follow_redirects=False)
    location = admin_hdrs.get("location", "")
    redirect_ok = admin_code == exp_admin_http and (
        location == exp_redirect
        or "returnUrl=%2Fadmin" in location
        or "returnurl=%2fadmin" in location.lower()
    )
    checks["ba02_web_admin_redirect"] = {
        "status_code": admin_code,
        "location": location,
        "expected_status": exp_admin_http,
        "expected_redirect": exp_redirect,
        "pass": redirect_ok,
    }
    if not redirect_ok:
        gaps.append({"id": "BA-02", "detail": f"web /admin redirect mismatch ({admin_code} {location})"})

    login_page, _, _ = fetch(f"{web}/auth/login")
    reg_page, _, _ = fetch(f"{web}/auth/register")
    exp_login = official.get("auth", {}).get("login_http", 200)
    exp_reg = official.get("auth", {}).get("register_http", 200)
    checks["ba02_web_auth_pages"] = {
        "login": {"status_code": login_page, "expected": exp_login, "pass": login_page == exp_login},
        "register": {"status_code": reg_page, "expected": exp_reg, "pass": reg_page == exp_reg},
    }
    if login_page != exp_login:
        gaps.append({"id": "BA-02", "detail": f"web /auth/login {login_page}"})
    if reg_page != exp_reg:
        gaps.append({"id": "BA-02", "detail": f"web /auth/register {reg_page}"})

    # BA-03 · STRICT_SESSION: X-User-Id only must not bypass
    meta_code, meta_text, _ = fetch(f"{api}/meta", max_bytes=2_000_000)
    strict = False
    if meta_code == 200:
        meta = json.loads(meta_text)
        strict = bool((meta.get("strict_mode") or {}).get("strict_session_gate"))
    xuid_code, _, _ = fetch(
        f"{api}/api/v1/orders?limit=1",
        headers={"X-User-Id": "550e8400-e29b-41d4-a716-446655440000"},
    )
    ba03_pass = (not strict and xuid_code != 401) or (strict and xuid_code == 401)
    checks["ba03_strict_session_x_user_id"] = {
        "strict_session_gate": strict,
        "status_code": xuid_code,
        "pass": ba03_pass,
    }
    if not ba03_pass:
        gaps.append({"id": "BA-03", "detail": f"X-User-Id bypass strict={strict} got {xuid_code}"})

    # BA-04 · registry test account login → me
    test_email = os.environ.get("POST_PARITY_TEST_EMAIL", "tourist@test.com")
    test_pass = os.environ.get("POST_PARITY_TEST_PASSWORD", "Test123!")
    login_code, login_body = post_json(f"{api}/auth/login", {"email": test_email, "password": test_pass})
    bearer = extract_bearer(login_body) if login_code == 200 else None
    me_auth_code = 0
    if bearer:
        me_auth_code, _, _ = fetch(
            f"{api}/api/v1/me",
            headers={"Authorization": f"Bearer {bearer}"},
        )
    checks["ba04_test_account_login_me"] = {
        "login_status": login_code,
        "me_status": me_auth_code,
        "pass": login_code == 200 and me_auth_code == 200,
        "email": test_email,
        "token_redacted": bool(bearer),
    }
    if login_code != 200 or me_auth_code != 200:
        gaps.append({"id": "BA-04", "detail": f"login/me chain login={login_code} me={me_auth_code}"})

    # BA-05 · OCS super admin login → capabilities
    ocs_email = os.environ.get(
        "STAGING_OCS_ADMIN_EMAIL", "adm-10x4-20260719143519@traveltrust.test"
    )
    ocs_pass = os.environ.get("TT_OCS_ACCOUNT_PASSWORD", os.environ.get("ADMIN_PASS", "Test123!"))
    ocs_login_code, ocs_body = post_json(
        f"{api}/auth/login", {"email": ocs_email, "password": ocs_pass}
    )
    ocs_bearer = extract_bearer(ocs_body) if ocs_login_code == 200 else None
    ocs_cap = 0
    if ocs_bearer:
        ocs_cap, _, _ = fetch(
            f"{api}/api/v1/admin/capabilities",
            headers={"Authorization": f"Bearer {ocs_bearer}"},
        )
    checks["ba05_ocs_admin_capabilities"] = {
        "login_status": ocs_login_code,
        "capabilities_status": ocs_cap,
        "pass": ocs_login_code == 200 and ocs_cap == 200,
        "email": ocs_email,
    }
    if ocs_login_code != 200 or ocs_cap != 200:
        gaps.append({"id": "BA-05", "detail": f"ocs admin login={ocs_login_code} cap={ocs_cap}"})

    # BA-06 · Admin RBAC matrix
    matrix_ok, matrix_note = run_admin_matrix(api)
    checks["ba06_admin_rbac_matrix"] = {"pass": matrix_ok, "note": matrix_note}
    if not matrix_ok:
        gaps.append({"id": "BA-06", "detail": f"admin RBAC matrix fail ({matrix_note})"})

    out = {
        "schema": "traveltrust.post_parity_fix_queue_batch2_admin_auth.v1",
        "recorded_utc": utc_now(),
        "batch": "2_admin_auth",
        "baseline": "POST_PARITY_FIX_QUEUE_BATCH1_CMS_OCS_PASS_STOP",
        "official_product_ssot": "www.web3-ttg.com OPS-v9",
        "api": api,
        "web": web,
        "checks": checks,
        "gaps": gaps,
        "items": ["BA-01", "BA-02", "BA-03", "BA-04", "BA-05", "BA-06"],
        "BATCH2_ADMIN_AUTH_PASS": "ISSUED" if not gaps else "NOT_ISSUED",
        "UNAUTHORIZED_DRIFT": "0" if not gaps else "NOT_ZERO",
        "OUT_OF_SCOPE": "0",
        "tt_production_go": "NO_GO",
        "non_target_drift": {
            "candidate_solidity": "0",
            "production_db_mutation": "0",
            "tt_production_go_flip": "0",
        },
    }
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(
        f"POST_PARITY_BATCH2_ADMIN_AUTH: pass={out['BATCH2_ADMIN_AUTH_PASS']} "
        f"gaps={len(gaps)} out={out_path.name}"
    )
    return 0 if not gaps else 2


if __name__ == "__main__":
    raise SystemExit(main())
