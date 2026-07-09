"""Shared HTTP + auth helpers for Phase② human acceptance probes."""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any


def api_base() -> str:
    return os.environ.get("HAT_API_BASE", os.environ.get("P2HA_API_BASE", "https://tt-api-staging.fly.dev")).rstrip("/")


def web_base() -> str:
    return os.environ.get("HAT_WEB_BASE", os.environ.get("P2HA_WEB_BASE", "https://tt-web-staging.fly.dev")).rstrip("/")


def password() -> str:
    return os.environ.get("HAT_PASSWORD", os.environ.get("P2HA_PASSWORD", "Test123!"))


def http(
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    body: dict | None = None,
    timeout: int = 45,
    retries: int = 3,
) -> tuple[int, str, dict[str, str]]:
    last_err = ""
    for attempt in range(retries):
        hdrs = {"User-Agent": "TravelTrust-HA/1.0", "Accept": "*/*"}
        if headers:
            hdrs.update(headers)
        data = None
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            hdrs["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.status, resp.read().decode("utf-8", errors="replace"), dict(resp.headers)
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode("utf-8", errors="replace"), dict(e.headers)
        except Exception as e:
            last_err = str(e)
            if attempt + 1 < retries:
                import time

                time.sleep(1.5 * (attempt + 1))
                continue
            return 0, last_err, {}
    return 0, last_err, {}


def seed_and_login(email: str, *, promote_admin: bool = False) -> dict[str, Any] | None:
    api = api_base()
    http("POST", f"{api}/auth/seed-test-accounts", body={})
    if promote_admin:
        http("POST", f"{api}/auth/seed-test-accounts", body={"promote_admin_email": email})
    code, raw, _ = http("POST", f"{api}/auth/login", body={"email": email, "password": password()})
    if code != 200:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def auth_headers(token: str, user_id: str | None = None) -> dict[str, str]:
    h = {"Authorization": f"Bearer {token}"}
    if user_id:
        h["X-User-Id"] = user_id
    return h


def fetch_meta_sha() -> str:
    code, raw, _ = http("GET", f"{api_base()}/meta")
    if code != 200:
        return ""
    try:
        return str(json.loads(raw).get("build", {}).get("git_sha", ""))
    except json.JSONDecodeError:
        return ""
