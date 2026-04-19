#!/usr/bin/env python3
# B-305: optional TRAVELTRUST_CHAIN_RPC_URL_ALLOWLIST — comma/newline-separated URL prefixes; each live RPC base URL must match one.
from __future__ import annotations

import argparse
import os
import sys
import urllib.parse
from typing import Any

B305_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-RPC-HOST-ALLOWLIST-V1"
B305_RULE_VERSION = "region_vault_claim_broadcast_rpc_host_allowlist_v1"
IMPLEMENTATION_TT = "TT-B305-ALLOWLIST-RPC-HOST-PREFIX-001"
MOTHER_TABLE = "B-305"
ALLOWLIST_ENV = "TRAVELTRUST_CHAIN_RPC_URL_ALLOWLIST"


def _redact_rpc_url(url: str) -> str:
    try:
        p = urllib.parse.urlsplit(url.strip())
        host = p.hostname or ""
        port = f":{p.port}" if p.port else ""
        scheme = p.scheme or "http"
        return f"{scheme}://{host}{port}/…"
    except Exception:
        return "<redacted>"


def _redact_prefix_preview(prefix: str) -> str:
    try:
        p = urllib.parse.urlsplit(prefix.strip())
        host = p.hostname or ""
        port = f":{p.port}" if p.port else ""
        scheme = p.scheme or ""
        if not host and prefix.strip():
            return "<prefix-shape-redacted>"
        return f"{scheme}://{host}{port}/…" if host else "<prefix-redacted>"
    except Exception:
        return "<prefix-redacted>"


def parse_allowlist_prefixes_from_env() -> list[str]:
    raw = (os.environ.get(ALLOWLIST_ENV) or "").strip()
    if not raw:
        return []
    parts: list[str] = []
    for line in raw.replace("\r\n", "\n").split("\n"):
        for seg in line.split(","):
            s = seg.strip()
            if s:
                parts.append(s)
    return parts


def allowlist_evidence_or_none(rpc_urls: list[str], *, tool_label: str) -> dict[str, Any] | None:
    """
    If ALLOWLIST_ENV unset/empty: return None (no gate).
    If set: require every non-empty URL in rpc_urls to startswith at least one prefix; else raise ValueError.
    When no URLs supplied, return None (nothing to validate against allowlist).
    """
    prefixes = parse_allowlist_prefixes_from_env()
    if not prefixes:
        return None
    nonempty = [u.strip() for u in rpc_urls if u and u.strip()]
    if not nonempty:
        return None
    matched_idx: list[int] = []
    for u in nonempty:
        hit: int | None = None
        for i, p in enumerate(prefixes):
            if u.startswith(p):
                hit = i
                break
        if hit is None:
            raise ValueError(
                f"B-305 ({tool_label}): JSON-RPC URL does not match any prefix in {ALLOWLIST_ENV} "
                f"(endpoint redacted: {_redact_rpc_url(u)!r})."
            )
        matched_idx.append(hit)
    return {
        "anchor": B305_ANCHOR,
        "rule_version": B305_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "tool_label": tool_label,
        "allowlist_env": ALLOWLIST_ENV,
        "allowlist_prefix_count": len(prefixes),
        "allowlist_prefixes_redacted": [_redact_prefix_preview(p) for p in prefixes],
        "validated_rpc_urls_redacted": [_redact_rpc_url(u) for u in nonempty],
        "matched_allowlist_prefix_index_by_url": matched_idx,
        "notes": (
            "B-305: operator sets comma- or newline-separated allowed URL prefixes (scheme://host[:port]/path…). "
            "Unset env disables this gate."
        ),
    }


def _cmd_self_test(_: argparse.Namespace) -> int:
    saved = os.environ.get(ALLOWLIST_ENV)
    try:
        assert allowlist_evidence_or_none(["http://127.0.0.1:1/"], tool_label="t") is None

        os.environ[ALLOWLIST_ENV] = "http://127.0.0.1"
        ev = allowlist_evidence_or_none(["http://127.0.0.1:9999/"], tool_label="unit-ok")
        assert ev is not None and ev.get("implementation_tt") == IMPLEMENTATION_TT

        try:
            allowlist_evidence_or_none(["https://evil.example/rpc"], tool_label="unit-bad")
        except ValueError:
            pass
        else:
            raise AssertionError("expected allowlist rejection")

        os.environ[ALLOWLIST_ENV] = "http://a,http://b"
        ev2 = allowlist_evidence_or_none(["http://b.local/x"], tool_label="unit-multi")
        assert ev2 is not None
        assert ev2["matched_allowlist_prefix_index_by_url"] == [1]

        os.environ[ALLOWLIST_ENV] = "https://x\nhttps://y"
        ev3 = allowlist_evidence_or_none(["https://y/z"], tool_label="unit-nl")
        assert ev3 is not None
    finally:
        if saved is None:
            os.environ.pop(ALLOWLIST_ENV, None)
        else:
            os.environ[ALLOWLIST_ENV] = saved

    print(f"region_vault_claim_broadcast_rpc_host_allowlist_b305 self-test OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=f"{MOTHER_TABLE}: RPC host prefix allowlist ({IMPLEMENTATION_TT}).")
    sub = ap.add_subparsers(dest="cmd", required=True)
    st = sub.add_parser("self-test", help="offline allowlist matrix")
    st.set_defaults(func=_cmd_self_test)
    args = ap.parse_args()
    try:
        return int(args.func(args))
    except ValueError as e:
        print(f"rpc_host_allowlist_b305: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
