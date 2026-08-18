#!/usr/bin/env python3
"""GAP-E2E-JOURNEY Official readonly probe.

Reuse Official C2 runtime. No frontend change, no www bake, no new order POST,
no Track2 escrow bind, no second 1 USDC.
Never prints secrets.
"""
from __future__ import annotations

import json
import os
import ssl
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "evidence" / "GO_final_closure_batch"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT = OUT_DIR / "GAP-E2E-JOURNEY-OFFICIAL-BOOK-UI-READONLY-LATEST.json"
CTX = ssl.create_default_context()
UA = {"User-Agent": "tt-gap-e2e-readonly/1", "Cache-Control": "no-cache"}
PIN_SHA = "daa5ae87b8c1af548c6beff6dd3451e5d386acf2"
PIN_BT = "2026-08-16T15:15:49Z"
WWW = "https://www.web3-ttg.com"
API = "https://api.web3-ttg.com"
TRACK2_ESCROW = "0x45B28A224792f50D9b9AA99FBfA388E6eAaD09C4".lower()
NOW = "2026-08-18T06:00:00Z"


def load_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, v = s.split("=", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v


for rel in (
    ".env",
    "scripts/dev/.env.production.local",
    "scripts/dev/.env.cert-owner-uat.local",
    "scripts/dev/.env.admin-public-matrix.local",
    ".env.prod-owner-business-probe.local",
):
    load_env_file(ROOT / rel)


def http(method: str, url: str, *, headers=None, body=None, timeout=40):
    h = dict(UA)
    if headers:
        h.update(headers)
    data = None
    if body is not None:
        data = body if isinstance(body, (bytes, bytearray)) else json.dumps(body).encode()
        h.setdefault("Content-Type", "application/json")
    req = Request(url, data=data, headers=h, method=method)
    try:
        with urlopen(req, timeout=timeout, context=CTX) as r:
            return r.status, dict(r.headers), r.read()
    except HTTPError as e:
        return e.code, dict(e.headers or {}), e.read()
    except URLError as e:
        return 0, {}, str(e).encode()


def decode(b: bytes) -> str:
    return b.decode("utf-8", "replace")


def jload(b: bytes):
    try:
        return json.loads(decode(b))
    except Exception:
        return None


def html_flags(html: str) -> dict:
    low = html.lower()
    return {
        "len": len(html),
        "has_login": "login" in low or "登录" in html,
        "has_market": "/market" in low or "市场" in html,
        "has_book": "book" in low or "预订" in html or "预约" in html,
        "has_itinerary": "itinerary" in low or "行程" in html,
        "has_escrow": "escrow" in low or "托管" in html,
        "has_guide": "guide" in low or "向导" in html,
        "cinematic": "data-tt-traveltrust-cinematic" in html,
    }


def items_from(js):
    if not isinstance(js, dict):
        return []
    for key in ("items", "orders", "guides"):
        v = js.get(key)
        if isinstance(v, list):
            return v
    data = js.get("data")
    if isinstance(data, dict):
        for key in ("items", "orders", "guides"):
            v = data.get(key)
            if isinstance(v, list):
                return v
        if isinstance(data.get("list"), list):
            return data["list"]
    if isinstance(js.get("list"), list):
        return js["list"]
    return []


def order_uuid(row: dict) -> str:
    for k in ("id", "order_id", "uuid", "orderId"):
        v = row.get(k)
        if v:
            return str(v)
    return ""


def escrow_addr(row: dict) -> str:
    for k in ("escrow_address", "escrowAddress", "address", "escrow"):
        v = row.get(k)
        if isinstance(v, str) and v.startswith("0x"):
            return v
    return ""


def main() -> int:
    report = {
        "schema": "traveltrust.gap_e2e_journey_official_readonly.v1",
        "issued_at_utc": NOW,
        "gap_id": "GAP-E2E-JOURNEY",
        "batch": "TT_PRODUCTION_GO_FINAL_CLOSURE_BATCH",
        "tt_production_go": "NO_GO",
        "frontend_product_baseline": "FROZEN_LATEST_PRODUCT_BASELINE",
        "do_not": [
            "frontend_change",
            "www_bake",
            "checkout_old_fe",
            "post_new_order",
            "bind_track2_escrow_0x45B28A",
            "second_1usdc",
            "paper_close_without_runtime",
        ],
        "www_pin_required": {"git_sha": PIN_SHA, "build_time": PIN_BT},
    }

    st, _, b = http("GET", f"{WWW}/api/release-identity")
    ident = jload(b) or {}
    pin_ok = ident.get("git_sha") == PIN_SHA and ident.get("build_time") == PIN_BT
    report["www_identity"] = {
        "http": st,
        "git_sha": ident.get("git_sha"),
        "build_time": ident.get("build_time"),
        "matches_frozen_pin": pin_ok,
    }

    pages = {}
    for path in ("/", "/market", "/auth/login", "/traveltrust"):
        pst, _, pb = http("GET", f"{WWW}{path}")
        html = decode(pb)
        pages[path] = {"http": pst, **html_flags(html)}
    report["public_pages"] = pages

    email = os.environ.get("C2_EMAIL") or ""
    password = os.environ.get("C2_PASS") or ""
    if not email or not password:
        report["verdict"] = "STOP_AND_REPORT"
        report["reason"] = "C2_EMAIL/C2_PASS missing; cannot probe Official traveler hop"
        OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print("GAP-E2E: STOP_AND_REPORT missing C2 creds")
        return 1

    st, hdr, b = http(
        "POST",
        f"{API}/auth/login",
        headers={
            "Idempotency-Key": str(uuid.uuid4()),
            "Origin": WWW,
        },
        body={"email": email, "password": password},
    )
    js = jload(b) or {}
    data = js.get("data") if isinstance(js.get("data"), dict) else {}
    token = js.get("token") or js.get("access_token") or data.get("token")
    user = js.get("user") if isinstance(js.get("user"), dict) else data
    role = js.get("role")
    if isinstance(user, dict):
        role = role or user.get("role")
    report["c2_login"] = {
        "http": st,
        "role": role,
        "has_token": bool(token),
        "set_cookie": "set-cookie" in {k.lower() for k in hdr.keys()},
        "error": (js.get("error") or js.get("code") or js.get("message")) if isinstance(js, dict) else None,
    }

    if st != 200 or not token:
        report["verdict"] = "STOP_AND_REPORT"
        report["reason"] = "Official C2 API login failed; do not reset accounts"
        OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print("GAP-E2E: STOP_AND_REPORT C2 login")
        return 1

    auth = {"Authorization": f"Bearer {token}"}
    hops = {}
    for name, url in (
        ("me", f"{API}/api/v1/me"),
        ("guides", f"{API}/api/v1/guides"),
        ("orders", f"{API}/api/v1/orders?limit=100"),
        ("www_me", f"{WWW}/api/v1/me"),
        ("www_guides", f"{WWW}/api/v1/guides"),
        ("www_orders", f"{WWW}/api/v1/orders?limit=100"),
        ("www_discover", f"{WWW}/api/v1/discover/orders"),
    ):
        pst, _, pb = http("GET", url, headers=auth)
        js = jload(pb)
        rows = items_from(js) if isinstance(js, dict) else []
        hops[name] = {
            "http": pst,
            "item_count": len(rows) if rows else (1 if isinstance(js, dict) and name == "me" else 0),
            "error": None if pst == 200 else (js.get("error") if isinstance(js, dict) else decode(pb)[:180]),
        }
        if name in ("orders", "www_orders") and rows:
            hops[name]["sample_keys"] = sorted(list(rows[0].keys()))[:20] if isinstance(rows[0], dict) else []
    report["authenticated_hops"] = hops

    st_o, _, b_o = http("GET", f"{API}/api/v1/orders?limit=100", headers=auth)
    orders_js = jload(b_o) or {}
    orders = [r for r in items_from(orders_js) if isinstance(r, dict)]
    official = []
    for row in orders:
        addr = escrow_addr(row).lower()
        uid = order_uuid(row)
        if not uid:
            continue
        if addr == TRACK2_ESCROW:
            continue
        official.append({"id": uid, "escrow_address": addr or None, "state": row.get("state") or row.get("status")})

    report["official_orders"] = {
        "http": st_o,
        "total": len(orders),
        "excluding_track2_escrow": len(official),
        "track2_bind_attempted": False,
    }

    escrow_ui = None
    picked = official[0] if official else None
    if picked:
        uid = picked["id"]
        page_st, _, page_b = http("GET", f"{WWW}/escrow/{uid}")
        api_st, _, api_b = http("GET", f"{API}/api/v1/orders/{uid}", headers=auth)
        api_js = jload(api_b)
        escrow_ui = {
            "order_uuid": uid,
            "www_escrow_page_http": page_st,
            "www_escrow_page": html_flags(decode(page_b)),
            "api_order_http": api_st,
            "api_error": None if api_st == 200 else (api_js.get("error") if isinstance(api_js, dict) else decode(api_b)[:180]),
            "not_track2_escrow": True,
        }
    report["escrow_ui"] = escrow_ui

    login_ok = report["c2_login"]["http"] == 200 and hops.get("me", {}).get("http") == 200
    market_ok = pages.get("/market", {}).get("http") == 200
    login_page_ok = pages.get("/auth/login", {}).get("http") == 200
    pin_frozen = pin_ok
    escrow_ok = bool(
        escrow_ui
        and escrow_ui.get("www_escrow_page_http") == 200
        and escrow_ui.get("api_order_http") == 200
    )
    guides_ok = hops.get("guides", {}).get("http") == 200 or hops.get("www_guides", {}).get("http") == 200

    report["checks"] = {
        "www_pin_frozen_latest": pin_frozen,
        "c2_login_me": login_ok,
        "public_market_200": market_ok,
        "public_login_page_200": login_page_ok,
        "guides_200": guides_ok,
        "official_escrow_ui_existing_order": escrow_ok,
        "frontend_untouched": True,
        "no_new_order_post": True,
        "no_track2_bind": True,
    }

    if pin_frozen and login_ok and market_ok and login_page_ok and guides_ok and escrow_ok:
        report["verdict"] = "CLOSED_REALITY_HOP"
        report["reason"] = (
            "Official C2 login + market/guides + existing Official order escrow UI on frozen www. "
            "Not a second 1 USDC. Not Track2 bind. Not global CLOSED_REALITY. Not Production GO."
        )
        code = 0
    else:
        missing = [k for k, v in report["checks"].items() if v is False]
        report["verdict"] = "STOP_AND_REPORT"
        report["reason"] = (
            "Official traveler book/UI hop incomplete on frozen FE without mutation: "
            + ",".join(missing)
            + ". FE change/www bake forbidden; Track2 bind forbidden; new order POST not this probe."
        )
        code = 1

    OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"GAP-E2E: {report['verdict']}")
    print(f"wrote {OUT.relative_to(ROOT)}")
    return code


if __name__ == "__main__":
    raise SystemExit(main())
