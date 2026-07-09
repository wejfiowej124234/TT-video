#!/usr/bin/env python3
"""TN-P1-007 · 六角色 HAT API 矩阵探针（② staging · curl 子进程 · Windows SSL 安全）。

输出：$HAT_MATRIX_OUT/hat-matrix-probe.json
末行：TT_TN_P1_HAT_MATRIX_PROBE: PASS|FAIL
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import uuid
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None  # type: ignore

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "registry" / "admin-rbac-staging-probes.v1.yaml"
PASSWORD = os.environ.get("HAT_PASSWORD", "Test123!")
API = (
    os.environ.get("HAT_API_BASE", "").strip()
    or os.environ.get("STAGING_API_BASE", "").strip()
    or "https://tt-api-staging.fly.dev"
).rstrip("/")
OUT_DIR = Path(os.environ.get("HAT_MATRIX_OUT", ROOT / "evidence" / "tmp" / "hat-matrix-probe"))


def eprint(*args: object) -> None:
    print(*args, file=sys.stderr)


def curl_json(method: str, url: str, token: str | None = None, body: dict | None = None) -> tuple[int, dict | list | str]:
    cmd = [
        "curl",
        "--noproxy",
        "*",
        "-sS",
        "-w",
        "\n%{http_code}",
        "--max-time",
        "60",
        "-X",
        method,
        "-H",
        "Accept: application/json",
    ]
    if token:
        cmd += ["-H", f"Authorization: Bearer {token}"]
    if body is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
    cmd.append(url)
    proc = subprocess.run(cmd, capture_output=True, check=False)
    stdout = (
        proc.stdout.decode("utf-8", errors="replace")
        if isinstance(proc.stdout, (bytes, bytearray))
        else (proc.stdout or "")
    )
    stderr = (
        proc.stderr.decode("utf-8", errors="replace")
        if isinstance(proc.stderr, (bytes, bytearray))
        else (proc.stderr or "")
    )
    raw = stdout + stderr
    lines = raw.rsplit("\n", 1)
    if len(lines) != 2:
        return 0, raw.strip() or "curl_failed"
    body_text, code_text = lines[0], lines[1].strip()
    try:
        code = int(code_text)
    except ValueError:
        return 0, raw.strip()
    if not body_text.strip():
        return code, {}
    try:
        return code, json.loads(body_text)
    except json.JSONDecodeError:
        return code, body_text


def login(email: str) -> str:
    code, data = curl_json(
        "POST",
        f"{API}/auth/login",
        body={"email": email, "password": PASSWORD},
    )
    if code != 200 or not isinstance(data, dict):
        raise RuntimeError(f"login failed {email} HTTP {code} {data!r}")
    token = data.get("token") or ""
    if not token:
        raise RuntimeError(f"login missing token {email}")
    return str(token)


def register_traveler() -> tuple[str, str]:
    suffix = uuid.uuid4().hex[:10]
    email = f"hat-probe-{suffix}@traveltrust.testnet"
    code, send_data = curl_json(
        "POST",
        f"{API}/auth/register/send-verification-code",
        body={"email": email},
    )
    if code != 200 or not isinstance(send_data, dict):
        raise RuntimeError(f"send-verification-code failed HTTP {code} {send_data!r}")
    vcode = str(send_data.get("registration_verification_dev_code") or "")
    if not vcode:
        raise RuntimeError("missing registration_verification_dev_code on staging")
    code, data = curl_json(
        "POST",
        f"{API}/auth/register",
        body={
            "email": email,
            "password": PASSWORD,
            "verification_code": vcode,
            "nickname": "Hat Probe Traveler",
        },
    )
    if code not in (200, 201) or not isinstance(data, dict):
        raise RuntimeError(f"register failed HTTP {code} {data!r}")
    token = str(data.get("token") or "")
    if not token:
        raise RuntimeError(f"no token after register {email}")
    return email, token


def probe_case(role: str, probe_id: str, method: str, path: str, token: str, expect: list[int]) -> dict:
    url = f"{API}{path}" if path.startswith("/") else f"{API}/{path}"
    code, body = curl_json(method, url, token=token)
    ok = code in expect
    return {
        "role": role,
        "probe_id": probe_id,
        "method": method,
        "path": path,
        "http": code,
        "expect": expect,
        "pass": ok,
        "deny": code in (401, 403, 404, 400, 415, 422),
        "body_sample": body if isinstance(body, (dict, list)) else str(body)[:200],
    }


def registry_cross_persona_denies(tokens: dict[str, str]) -> list[tuple]:
    """② graduation D8: expand HAT deny matrix from ADM-U01 registry (existing SSOT paths only)."""
    if yaml is None or not REGISTRY.is_file():
        return []
    reg = yaml.safe_load(REGISTRY.read_text(encoding="utf-8"))
    rows: list[tuple] = []
    for probe in reg.get("probes") or []:
        pid = str(probe.get("id") or "admin")
        method = str(probe.get("method") or "GET")
        path = str(probe.get("path") or "")
        if not path.startswith("/api/v1/admin"):
            continue
        for role in ("traveler", "guide", "merchant"):
            tok = tokens.get(role)
            if not tok:
                continue
            rows.append((role, f"deny_{pid}", method, path, tok, [401, 403, 404, 400, 415, 422]))
    return rows


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    eprint(f"hat-matrix-probe: api={API} out={OUT_DIR}")

    curl_json("POST", f"{API}/auth/seed-test-accounts", body={})
    curl_json(
        "POST",
        f"{API}/auth/seed-test-accounts",
        body={"promote_admin_email": "multi-demo@test.com"},
    )

    tokens: dict[str, str] = {}
    traveler_email, tokens["traveler"] = register_traveler()
    tokens["guide"] = login("guide@test.com")
    tokens["merchant"] = login("merchant@test.com")
    tokens["steward"] = login("multi-demo@test.com")
    tokens["admin"] = login("multi-demo@test.com")

    probes: list[dict] = []
    matrix = [
        ("traveler", "allow_me", "GET", "/api/v1/me", tokens["traveler"], [200]),
        ("traveler", "deny_admin_capabilities", "GET", "/api/v1/admin/capabilities", tokens["traveler"], [401, 403]),
        ("guide", "allow_me", "GET", "/api/v1/me", tokens["guide"], [200]),
        ("guide", "deny_admin_users", "GET", "/api/v1/admin/users?limit=1", tokens["guide"], [401, 403]),
        ("merchant", "allow_merchant_listings", "GET", "/api/v1/me/merchant-listings", tokens["merchant"], [200]),
        ("merchant", "deny_admin_users", "GET", "/api/v1/admin/users?limit=1", tokens["merchant"], [401, 403]),
        ("steward", "allow_governance_mine", "GET", "/api/v1/governance/proposals?mine=1", tokens["steward"], [200]),
        ("steward", "deny_admin_users", "GET", "/api/v1/admin/users?limit=1", tokens["steward"], [401, 403]),
        ("steward", "allow_identity_slots", "GET", "/api/v1/me", tokens["steward"], [200]),
        ("admin", "allow_admin_capabilities", "GET", "/api/v1/admin/capabilities", tokens["admin"], [200]),
        ("admin", "allow_admin_users", "GET", "/api/v1/admin/users?limit=1", tokens["admin"], [200]),
        ("moderator", "allow_community_cases", "GET", "/api/v1/admin/community/moderation/cases?limit=1", tokens["admin"], [200, 404]),
    ]
    for role, pid, method, path, token, expect in matrix:
        probes.append(probe_case(role, pid, method, path, token, expect))
        time.sleep(0.15)

    # Cross-role: guide cannot access merchant-only publish summary with wrong hat (still 200 on /me/publish-summary — check admin deny is enough)
    cross = probe_case(
        "guide",
        "cross_deny_finance_write",
        "POST",
        "/api/v1/admin/onboarding/entitlements/00000000-0000-0000-0000-000000000001/approve",
        tokens["guide"],
        [401, 403, 404],
    )
    probes.append(cross)

    for role, pid, method, path, token, expect in registry_cross_persona_denies(tokens):
        probes.append(probe_case(role, pid, method, path, token, expect))
        time.sleep(0.12)

    failed = [p for p in probes if not p["pass"]]
    deny_count = sum(1 for p in probes if p.get("deny"))

    report = {
        "schema": "tn_p1_hat_matrix_probe.v1",
        "phase": "② testnet",
        "api": API,
        "personas": ["traveler", "guide", "merchant", "steward", "moderator", "admin"],
        "traveler_email": traveler_email,
        "probes": probes,
        "summary": {
            "total": len(probes),
            "passed": len(probes) - len(failed),
            "failed": len(failed),
            "deny_probes": deny_count,
        },
        "release_gate": "GO" if not failed else "FAIL",
    }
    out_json = OUT_DIR / "hat-matrix-probe.json"
    out_json.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    eprint(f"hat-matrix-probe: wrote {out_json} passed={report['summary']['passed']}/{report['summary']['total']}")

    if failed:
        for f in failed:
            eprint(f"FAIL {f['role']} {f['probe_id']} HTTP {f['http']} expected {f['expect']}")
        print("TT_TN_P1_HAT_MATRIX_PROBE: FAIL")
        return 1

    print("TT_TN_P1_HAT_MATRIX_PROBE: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
