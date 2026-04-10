#!/usr/bin/env python3
"""
SSOT Guard CI v2 — response snapshot contract tests (B-097 + B-110).

Validates committed JSON fixtures under scripts/ssot-guard-fixtures/v2/ against the same
invariants the static guards protect (trio semantics, envelope exclusion, Σ isolation).

Run: python3 scripts/ssot-guard-response-contract.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from ssot_guard_v2_constants import (
    B110_AGGREGATE_FORBIDDEN_ROOT_KEYS,
    ESCROW_SSOT_FAMILIES,
    ESCROW_SSOT_TWELVE_ROOT_KEYS,
)

ROOT = Path(__file__).resolve().parents[2]
FIXTURES = ROOT / "scripts" / "gates" / "ssot-guard-fixtures" / "v2"


def fail(msg: str) -> None:
    print(f"ERROR [ssot-guard-response-contract]: {msg}", file=sys.stderr)
    sys.exit(1)


def load(name: str) -> dict:
    p = FIXTURES / name
    if not p.is_file():
        fail(f"missing fixture {p.relative_to(ROOT)}")
    return json.loads(p.read_text(encoding="utf-8"))


def assert_escrow_family_trio(obj: dict, val_k: str, ds_k: str, flag_k: str) -> None:
    has_v = val_k in obj
    has_ds = ds_k in obj
    has_f = flag_k in obj
    if has_v or has_ds or has_f:
        if not (has_v and has_ds and has_f):
            fail(f"escrow SSOT family partial: {val_k!r} / {ds_k!r} / {flag_k!r} must appear together")
        if obj[ds_k] != "chain_read":
            fail(f"{ds_k} must be 'chain_read' when family present (got {obj[ds_k]!r})")
        if obj[flag_k] is not True:
            fail(f"{flag_k} must be true when family present (got {obj[flag_k]!r})")


def check_escrow_order_detail_positive() -> None:
    obj = load("escrow_order_detail_chain_ssot_positive.snapshot.json")
    for val_k, ds_k, flag_k in ESCROW_SSOT_FAMILIES:
        assert_escrow_family_trio(obj, val_k, ds_k, flag_k)


def check_escrow_orders_list_envelope_clean() -> None:
    obj = load("escrow_orders_list_envelope_clean.snapshot.json")
    for k in ESCROW_SSOT_TWELVE_ROOT_KEYS:
        if k in obj:
            fail(f"list/aggregate envelope must not contain root key {k!r}")


def check_governance_pool_chain_positive() -> None:
    obj = load("governance_pool_chain_ssot_positive.snapshot.json")
    if obj.get("data_source") != "chain_read":
        fail("governance pool chain fixture: data_source must be chain_read")
    if obj.get("is_chain_ssot") is not True:
        fail("governance pool chain fixture: is_chain_ssot must be true")
    if "pool_balance" not in obj:
        fail("governance pool chain fixture: pool_balance required")
    for pool_prefix in ("country_pool", "treasury_pool", "treasury_erc20_pool"):
        val_k = pool_prefix
        if val_k in obj:
            ds_k = f"{pool_prefix}_data_source"
            fl_k = f"{pool_prefix}_is_chain_ssot"
            if obj.get(ds_k) != "chain_read":
                fail(f"{ds_k} must be chain_read when {val_k} present")
            if obj.get(fl_k) is not True:
                fail(f"{fl_k} must be true when {val_k} present")


def check_fee_pool_aggregates_clean() -> None:
    obj = load("governance_fee_pool_aggregates_clean.snapshot.json")
    for k in B110_AGGREGATE_FORBIDDEN_ROOT_KEYS:
        if k in obj:
            fail(f"fee-pool-aggregates root must not contain {k!r} (Σ / B-110 isolation)")


def main() -> None:
    check_escrow_order_detail_positive()
    check_escrow_orders_list_envelope_clean()
    check_governance_pool_chain_positive()
    check_fee_pool_aggregates_clean()
    print("OK: ssot-guard-response-contract passed (4 fixtures)")


if __name__ == "__main__":
    main()
