#!/usr/bin/env python3
"""Emit R-003 A-domain evidence JSON against a running API (Bearer session)."""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path


def http_json(method: str, url: str, headers: dict | None = None, body: bytes | None = None) -> tuple[int, object]:
    req = urllib.request.Request(url, data=body, method=method)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read().decode("utf-8", errors="replace")
            try:
                parsed: object = json.loads(raw) if raw.strip() else {}
            except json.JSONDecodeError:
                parsed = raw
            return r.status, parsed
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw.strip() else {}
        except json.JSONDecodeError:
            parsed = raw
        return e.code, parsed


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--api-base", default="http://127.0.0.1:8080")
    p.add_argument("--out", type=Path, required=True)
    p.add_argument("--email", default="tourist@test.com")
    p.add_argument("--password", default="Test123!")
    args = p.parse_args()
    base = args.api_base.rstrip("/")
    out = args.out
    out.mkdir(parents=True, exist_ok=True)

    # A-NEG-001
    neg_body = json.dumps({"email": args.email, "password": "WrongPassword999!"}).encode()
    c401, j401 = http_json(
        "POST",
        f"{base}/auth/login",
        {"Content-Type": "application/json"},
        neg_body,
    )
    (out / "A-NEG-001").mkdir(exist_ok=True)
    (out / "A-NEG-001" / "request-response.redacted.json").write_text(
        json.dumps(
            {
                "request": {
                    "method": "POST",
                    "url": f"{base}/auth/login",
                    "body": {"email": args.email, "password": "[REDACTED]"},
                },
                "response": {"http_status": c401, "body": j401},
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    # Login
    ok_body = json.dumps({"email": args.email, "password": args.password}).encode()
    c200, j200 = http_json(
        "POST",
        f"{base}/auth/login",
        {"Content-Type": "application/json"},
        ok_body,
    )
    if c200 != 200 or not isinstance(j200, dict):
        print("login failed", c200, j200, file=sys.stderr)
        return 2
    token = j200.get("token") or ""
    if not token:
        print("no token in login response", file=sys.stderr)
        return 2
    auth = {"Authorization": f"Bearer {token}"}

    # A-ME-001
    me1_c, me1_j = http_json("GET", f"{base}/api/v1/me", auth)
    (out / "A-ME-001").mkdir(exist_ok=True)
    (out / "A-ME-001" / "request-response.redacted.json").write_text(
        json.dumps(
            {
                "request": {
                    "method": "GET",
                    "url": f"{base}/api/v1/me",
                    "headers": {"Authorization": "Bearer tts_[REDACTED]"},
                },
                "response": {"http_status": me1_c, "body": me1_j},
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    # A-LOG-002 (second /me)
    me2_c, me2_j = http_json("GET", f"{base}/api/v1/me", auth)
    (out / "A-LOG-002").mkdir(exist_ok=True)
    (out / "A-LOG-002" / "request-response.redacted.json").write_text(
        json.dumps(
            {
                "request_chain": [
                    {
                        "method": "GET",
                        "url": f"{base}/api/v1/me",
                        "note": "first call omitted here; see A-ME-001",
                    },
                    {
                        "method": "GET",
                        "url": f"{base}/api/v1/me",
                        "headers": {"Authorization": "Bearer tts_[REDACTED]"},
                    },
                ],
                "response": {"second_me_http": me2_c, "second_me_body": me2_j},
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    # A-LOG-003
    lo_c, lo_j = http_json(
        "POST",
        f"{base}/auth/logout",
        {**auth, "Content-Type": "application/json"},
        b"{}",
    )
    me3_c, me3_j = http_json("GET", f"{base}/api/v1/me", auth)
    (out / "A-LOG-003").mkdir(exist_ok=True)
    (out / "A-LOG-003" / "request-response.redacted.json").write_text(
        json.dumps(
            {
                "request_chain": [
                    {
                        "method": "POST",
                        "url": f"{base}/auth/logout",
                        "headers": {"Authorization": "Bearer tts_[REDACTED]", "Content-Type": "application/json"},
                        "body": {},
                    },
                    {
                        "method": "GET",
                        "url": f"{base}/api/v1/me",
                        "headers": {"Authorization": "Bearer tts_[REDACTED]"},
                    },
                ],
                "response": {
                    "logout_http": lo_c,
                    "logout_body": lo_j,
                    "me_after_logout_http": me3_c,
                    "me_after_logout_body": me3_j,
                },
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    print("OK wrote A-NEG-001, A-ME-001, A-LOG-002, A-LOG-003 under", out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
