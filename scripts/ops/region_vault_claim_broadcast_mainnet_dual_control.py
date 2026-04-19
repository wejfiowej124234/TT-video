#!/usr/bin/env python3
# B-300: Ethereum mainnet (chain_id=1) dual-control gates — second operator ack + work-order id metadata.
from __future__ import annotations

import argparse
import os
import sys
from typing import Any

ACK_MAINNET_ENV = "TRAVELTRUST_BROADCAST_EXECUTE_ACK_MAINNET"
B300_SECOND_ACK_ENV = "TRAVELTRUST_BROADCAST_EXECUTE_ACK_MAINNET_SECOND"
B300_WORK_ORDER_ENV = "TRAVELTRUST_BROADCAST_MAINNET_WORK_ORDER_ID"
B300_SECOND_OPERATOR_ENV = "TRAVELTRUST_BROADCAST_MAINNET_SECOND_OPERATOR_ID"

B300_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-MAINNET-DUAL-CONTROL-ACK-V1"
B300_RULE_VERSION = "region_vault_claim_broadcast_mainnet_dual_control_v1"
B300_IMPLEMENTATION_TT = "TT-B300-MAINNET-SECOND-OPERATOR-ACK-001"
B300_MOTHER_TABLE = "B-300"


def enforce_mainnet_dual_control(chain_id: int, *, rpc_url_redacted: str | None = None) -> dict[str, Any] | None:
    """
    When chain_id is Ethereum mainnet (1), require primary + second operator ack env and a work-order id.
    Returns an evidence dict for inclusion in execution_report / receipt_archive; returns None on non-mainnet.
    """
    if chain_id != 1:
        return None
    if os.environ.get(ACK_MAINNET_ENV, "").strip() != "1":
        raise ValueError(
            f"chain_id=1 (Ethereum mainnet): set {ACK_MAINNET_ENV}=1 after explicit primary operator ack, "
            "or use a dev RPC (Anvil / localhost)."
        )
    if os.environ.get(B300_SECOND_ACK_ENV, "").strip() != "1":
        raise ValueError(
            f"chain_id=1 (Ethereum mainnet): B-300 dual control — set {B300_SECOND_ACK_ENV}=1 after second-operator "
            f"ack (primary ack is {ACK_MAINNET_ENV}=1)."
        )
    work_order = os.environ.get(B300_WORK_ORDER_ENV, "").strip()
    if not work_order:
        raise ValueError(
            f"chain_id=1 (Ethereum mainnet): B-300 set non-empty {B300_WORK_ORDER_ENV} "
            "(approved work order / ticket id)."
        )
    second_op = os.environ.get(B300_SECOND_OPERATOR_ENV, "").strip() or None
    body: dict[str, Any] = {
        "anchor": B300_ANCHOR,
        "rule_version": B300_RULE_VERSION,
        "mother_table": B300_MOTHER_TABLE,
        "implementation_tt": B300_IMPLEMENTATION_TT,
        "mainnet_execute_ack_primary_env": ACK_MAINNET_ENV,
        "mainnet_execute_ack_primary_seen": True,
        "mainnet_execute_ack_second_env": B300_SECOND_ACK_ENV,
        "mainnet_execute_ack_second_seen": True,
        "mainnet_work_order_id": work_order,
        "second_operator_principal_env": B300_SECOND_OPERATOR_ENV,
        "second_operator_principal": second_op,
    }
    if rpc_url_redacted is not None:
        body["rpc_url_redacted"] = rpc_url_redacted
    return body


def _cmd_self_test(_: argparse.Namespace) -> int:
    keys = (
        ACK_MAINNET_ENV,
        B300_SECOND_ACK_ENV,
        B300_WORK_ORDER_ENV,
        B300_SECOND_OPERATOR_ENV,
    )
    saved = {k: os.environ[k] for k in keys if k in os.environ}
    try:
        for k in keys:
            os.environ.pop(k, None)

        assert enforce_mainnet_dual_control(31337, rpc_url_redacted=None) is None

        try:
            enforce_mainnet_dual_control(1, rpc_url_redacted="http://x/…")
        except ValueError:
            pass
        else:
            raise AssertionError("expected primary ack failure")

        os.environ[ACK_MAINNET_ENV] = "1"
        try:
            enforce_mainnet_dual_control(1, rpc_url_redacted=None)
        except ValueError as e:
            if B300_SECOND_ACK_ENV not in str(e):
                raise
        else:
            raise AssertionError("expected second ack failure")

        os.environ[B300_SECOND_ACK_ENV] = "1"
        try:
            enforce_mainnet_dual_control(1, rpc_url_redacted=None)
        except ValueError as e:
            if B300_WORK_ORDER_ENV not in str(e):
                raise
        else:
            raise AssertionError("expected work order failure")

        os.environ[B300_WORK_ORDER_ENV] = "WO-12345"
        os.environ[B300_SECOND_OPERATOR_ENV] = "op-b300-second"
        got = enforce_mainnet_dual_control(1, rpc_url_redacted="http://h/…")
        assert isinstance(got, dict)
        assert got.get("implementation_tt") == B300_IMPLEMENTATION_TT
        assert got.get("mainnet_work_order_id") == "WO-12345"
        assert got.get("second_operator_principal") == "op-b300-second"
    finally:
        for k in keys:
            os.environ.pop(k, None)
        for k, v in saved.items():
            os.environ[k] = v

    print(f"region_vault_claim_broadcast_mainnet_dual_control self-test OK ({B300_IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=f"{B300_MOTHER_TABLE}: mainnet dual-control gate ({B300_IMPLEMENTATION_TT}).")
    sub = ap.add_subparsers(dest="cmd", required=True)
    st = sub.add_parser("self-test", help="env-gate matrix for chain_id=1 vs dev chains")
    st.set_defaults(func=_cmd_self_test)
    args = ap.parse_args()
    try:
        return int(args.func(args))
    except ValueError as e:
        print(f"mainnet_dual_control: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
