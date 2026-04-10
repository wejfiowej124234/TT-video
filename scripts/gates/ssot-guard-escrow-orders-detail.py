#!/usr/bin/env python3
"""
CI SSOT guard — order detail escrow root keys (B-097 family).

Static checks:
  • m.insert("escrow_*"…).to_string() only in crates/api/src/routes/orders/mod.rs
    (aggregate / other routes must not emit these root keys).
  • merge_escrow_chain_state_ssot_into_order_detail_if_ok and
    merge_escrow_locked_amount_ssot_into_order_detail_if_ok: no order.* reads
    (no DB / order row backfill).
  • *_data_source → json!("chain_read"); *_is_chain_ssot → json!(true) for all four families.
  • assert_orders_envelope_has_no_escrow_chain_state_ssot_root_keys covers 12 root keys (002).

Horizontal extension: list or other endpoints need chain-read → **new TT** + sibling guard or
explicit allowlist here — **do not** widen B-097 without spec sign-off.

Run: python3 scripts/ssot-guard-escrow-orders-detail.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
API_SRC = ROOT / "crates" / "api" / "src"
ORDERS_MOD = API_SRC / "routes" / "orders" / "mod.rs"

INSERT_KEY_RE = re.compile(
    r'"((escrow_(?:chain_state|release_state|dispute_state|locked_amount)'
    r'(?:_(?:data_source|is_chain_ssot))?))"\.to_string\(\)'
)

TWELVE_ROOT_KEYS = (
    "escrow_chain_state",
    "escrow_chain_state_data_source",
    "escrow_chain_state_is_chain_ssot",
    "escrow_release_state",
    "escrow_release_state_data_source",
    "escrow_release_state_is_chain_ssot",
    "escrow_dispute_state",
    "escrow_dispute_state_data_source",
    "escrow_dispute_state_is_chain_ssot",
    "escrow_locked_amount",
    "escrow_locked_amount_data_source",
    "escrow_locked_amount_is_chain_ssot",
)


def fail(msg: str) -> None:
    print(f"ERROR [ssot-guard-escrow-orders-detail]: {msg}", file=sys.stderr)
    sys.exit(1)


def slice_async_fn(text: str, fn_name: str) -> str:
    """Slice one top-level async fn by brace matching (avoids pulling in later async fns)."""
    key = f"async fn {fn_name}"
    start = text.find(key)
    if start < 0:
        fail(f"missing {key} in routes/orders/mod.rs")
    brace_open = text.find("{", start)
    if brace_open < 0:
        fail(f"missing '{{' after {key}")
    depth = 0
    i = brace_open
    while i < len(text):
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
        i += 1
    fail(f"unclosed braces for {key}")


def must_pair(block: str, ds_key: str, flag_key: str) -> None:
    if not re.search(
        rf'"{re.escape(ds_key)}"\.to_string\(\)\s*,\s*json!\(\s*"chain_read"\s*\)',
        block,
        re.DOTALL,
    ):
        fail(f"{ds_key} must pair with json!(\"chain_read\")")
    if not re.search(
        rf'"{re.escape(flag_key)}"\.to_string\(\)\s*,\s*json!\(\s*true\s*\)',
        block,
        re.DOTALL,
    ):
        fail(f"{flag_key} must pair with json!(true)")


def main() -> None:
    if not ORDERS_MOD.is_file():
        fail(f"missing {ORDERS_MOD}")

    allowed = ORDERS_MOD.resolve()
    for path in sorted(API_SRC.rglob("*.rs")):
        txt = path.read_text(encoding="utf-8")
        for m in INSERT_KEY_RE.finditer(txt):
            if path.resolve() != allowed:
                rel = path.relative_to(ROOT)
                fail(
                    f"escrow SSOT insert key {m.group(1)!r} forbidden outside "
                    f"routes/orders/mod.rs (seen in {rel})"
                )

    orders_text = ORDERS_MOD.read_text(encoding="utf-8")

    chain_fn = slice_async_fn(
        orders_text, "merge_escrow_chain_state_ssot_into_order_detail_if_ok"
    )
    locked_fn = slice_async_fn(
        orders_text, "merge_escrow_locked_amount_ssot_into_order_detail_if_ok"
    )

    for label, block in (
        ("merge_escrow_chain_state_ssot_into_order_detail_if_ok", chain_fn),
        ("merge_escrow_locked_amount_ssot_into_order_detail_if_ok", locked_fn),
    ):
        if re.search(r"\border\.", block):
            fail(f"{label} must not use order.* (no row/DB backfill for escrow SSOT)")

    must_pair(chain_fn, "escrow_chain_state_data_source", "escrow_chain_state_is_chain_ssot")
    must_pair(chain_fn, "escrow_release_state_data_source", "escrow_release_state_is_chain_ssot")
    must_pair(chain_fn, "escrow_dispute_state_data_source", "escrow_dispute_state_is_chain_ssot")
    must_pair(
        locked_fn, "escrow_locked_amount_data_source", "escrow_locked_amount_is_chain_ssot"
    )

    a0 = orders_text.find("fn assert_orders_envelope_has_no_escrow_chain_state_ssot_root_keys")
    if a0 < 0:
        fail("missing assert_orders_envelope_has_no_escrow_chain_state_ssot_root_keys")
    a1 = orders_text.find("\n    #[tokio::test]", a0)
    if a1 < 0:
        fail("could not bound assert_orders_envelope function body")
    assert_body = orders_text[a0:a1]
    for k in TWELVE_ROOT_KEYS:
        if f'v.get("{k}")' not in assert_body:
            fail(f"aggregate exclude must include v.get({k!r}) (12-key gate / Runbook B)")

    print("OK: ssot-guard-escrow-orders-detail passed")


if __name__ == "__main__":
    main()
