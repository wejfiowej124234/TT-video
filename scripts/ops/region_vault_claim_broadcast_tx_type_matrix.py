#!/usr/bin/env python3
# B-292: legacy vs EIP-1559 (typed) raw tx × representative chainIds — Anvil-style 31337 vs mainnet-style 1 (self-test only).
from __future__ import annotations

import argparse
import sys
from typing import Any

from region_vault_claim_broadcast_gas_fee_cap_preflight import extract_signed_tx_fee_caps
from region_vault_claim_broadcast_nonce_preflight import _rlp_encode, parse_signed_raw_tx

B292_IMPLEMENTATION_TT = "TT-B292-TX-TYPE-MATRIX-ANVIL-VS-PUBLIC-001"
B292_MOTHER_TABLE = "B-292"


def _type2_raw_bytes(*, chain_id: int, nonce: int = 0) -> bytes:
    inner: list[Any] = [
        chain_id,
        nonce,
        1,
        1,
        21000,
        bytes(20),
        0,
        b"",
        [],
        0,
        1,
        1,
    ]
    return b"\x02" + _rlp_encode(inner)


def _legacy_raw_bytes(*, chain_id: int, nonce: int = 0) -> bytes:
    """EIP-155 legacy: v = 35 + 2*chainId + recovery (recovery=0)."""
    v = 35 + 2 * int(chain_id) + 0
    inner: list[Any] = [nonce, 1, 21000, bytes(20), 0, b"", v, 1, 1]
    return _rlp_encode(inner)


def run_tx_type_matrix_checks() -> dict[str, Any]:
    """Run legacy|EIP-1559 × chainId {1,31337} parse + fee-cap extract checks; returns summary dict."""
    rows: list[dict[str, Any]] = []
    matrix: list[tuple[str, int, bytes]] = [
        ("eip1559", 31337, _type2_raw_bytes(chain_id=31337)),
        ("eip1559", 1, _type2_raw_bytes(chain_id=1)),
        ("legacy", 31337, _legacy_raw_bytes(chain_id=31337)),
        ("legacy", 1, _legacy_raw_bytes(chain_id=1)),
    ]
    for label, want_cid, raw in matrix:
        p = parse_signed_raw_tx(raw)
        if label == "eip1559":
            if p.tx_type != "eip1559":
                raise AssertionError(f"B-292 matrix {label}/{want_cid}: expected eip1559, got {p.tx_type!r}")
        else:
            if p.tx_type != "legacy":
                raise AssertionError(f"B-292 matrix {label}/{want_cid}: expected legacy, got {p.tx_type!r}")
        if p.chain_id != want_cid:
            raise AssertionError(
                f"B-292 matrix {label}/{want_cid}: parsed chain_id={p.chain_id} (want {want_cid}); "
                "check EIP-155 v / typed-tx chainId field wiring"
            )
        caps = extract_signed_tx_fee_caps(raw)
        gw = int(caps.get("gate_max_fee_per_gas_wei") or 0)
        if gw < 1:
            raise AssertionError(f"B-292 matrix {label}/{want_cid}: unexpected gate_max_fee_per_gas_wei={gw}")
        rows.append(
            {
                "matrix_label": f"{label}×chainId={want_cid}",
                "parsed_tx_type": p.tx_type,
                "parsed_chain_id": p.chain_id,
                "parsed_nonce": p.nonce,
                "gate_max_fee_per_gas_wei": gw,
            }
        )
    return {
        "mother_table": B292_MOTHER_TABLE,
        "implementation_tt": B292_IMPLEMENTATION_TT,
        "matrix_rows": rows,
        "notes": (
            "B-292: rows are legacy|EIP-1559 typed raw × chainId 31337 (Anvil default) vs 1 (Ethereum mainnet-style); "
            "parse_signed_raw_tx + extract_signed_tx_fee_caps must agree on each cell."
        ),
    }


def _cmd_self_test(_: argparse.Namespace) -> int:
    out = run_tx_type_matrix_checks()
    assert len(out["matrix_rows"]) == 4, out
    print("region_vault_claim_broadcast_tx_type_matrix self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-292: broadcast raw tx type × chainId matrix checks (legacy / EIP-1559 × 1 / 31337)."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)
    st = sub.add_parser("self-test", help="assert parse + fee-field extraction for 2×2 matrix (no network)")
    st.set_defaults(func=_cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
