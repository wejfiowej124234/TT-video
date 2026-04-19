#!/usr/bin/env python3
# B-257: read-only broadcast_request_stub validation (order, operator gate, tx-hash slots, optional manifest cross-check).
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

from region_vault_claim_broadcast_nonce_preflight import (
    BROADCAST_REQUEST_ANCHOR,
    _steps_match_canonical_order,
    parse_signed_raw_tx,
)

BROADCAST_REQUEST_RULE_VERSION = "region_vault_claim_broadcast_request_stub_v1"


def _canonical_manifest_sha256(manifest: dict[str, Any]) -> str:
    body = json.dumps(manifest, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(body).hexdigest()

REHEARSAL_RULE_VERSION = "region_vault_claim_broadcast_dryrun_rehearsal_v1"
REHEARSAL_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-DRYRUN-REHEARSAL-REPORT-V1"
IMPLEMENTATION_TT = "TT-B257-14-REGIONVAULT-CLAIM-BROADCAST-DRYRUN-REHEARSAL-001"
MOTHER_TABLE = "B-257"


def _hex_to_bytes(h: str) -> bytes:
    s = h.strip().lower().removeprefix("0x")
    if len(s) % 2 == 1:
        raise ValueError("hex length must be even")
    return bytes.fromhex(s)


def run_rehearsal(
    br: dict[str, Any],
    *,
    source_manifest: dict[str, Any] | None,
    require_operator_confirmation: bool,
    require_go_verdict: bool,
    emit_steps: bool,
) -> dict[str, Any]:
    if br.get("anchor") != BROADCAST_REQUEST_ANCHOR:
        raise ValueError(f"stub.anchor must be {BROADCAST_REQUEST_ANCHOR!r}")
    if str(br.get("rule_version") or "") != BROADCAST_REQUEST_RULE_VERSION:
        raise ValueError(f"stub.rule_version must be {BROADCAST_REQUEST_RULE_VERSION!r}")

    if require_go_verdict and str(br.get("input_reconcile_verdict_preview") or "") != "GO":
        raise ValueError(
            "input_reconcile_verdict_preview must be GO for execute (use --allow-non-go-execute to override)"
        )

    if require_operator_confirmation:
        oc = br.get("operator_confirmation")
        if not isinstance(oc, dict):
            raise ValueError("operator_confirmation must be object")
        if oc.get("confirmed_by_operator") is not True:
            raise ValueError("operator_confirmation.confirmed_by_operator must be true before broadcast")
        for key in ("operator_id_placeholder", "confirmation_note", "confirmed_at_utc"):
            if not str(oc.get(key) or "").strip():
                raise ValueError(f"operator_confirmation.{key} must be non-empty")

    global_seq = br.get("global_broadcast_sequence")
    if not isinstance(global_seq, list) or not global_seq:
        raise ValueError("global_broadcast_sequence must be a non-empty array")

    ok_order, msg = _steps_match_canonical_order(global_seq)
    if not ok_order:
        raise ValueError(msg)

    if source_manifest is not None:
        want = str(br.get("source_manifest_sha256_hex") or "").lower()
        got = _canonical_manifest_sha256(source_manifest).lower()
        if not want or want != got:
            raise ValueError("source_manifest canonical SHA256 does not match stub.source_manifest_sha256_hex")

    manifest_batches = source_manifest.get("batches") if isinstance(source_manifest, dict) else None
    by_bid: dict[str, list[dict[str, Any]]] = {}
    if isinstance(manifest_batches, list):
        for b in manifest_batches:
            if isinstance(b, dict):
                bid = str(b.get("batch_plan_id") or "")
                txs = b.get("proposed_transactions")
                rows = [t for t in txs if isinstance(t, dict)] if isinstance(txs, list) else []
                by_bid[bid] = rows

    steps_out: list[dict[str, Any]] = []
    for gi, entry in enumerate(global_seq):
        if not isinstance(entry, dict):
            raise ValueError(f"global_broadcast_sequence[{gi}] must be object")
        raw_hex = str(entry.get("signed_transaction_hex") or "").strip()
        if not raw_hex:
            raise ValueError(f"step {gi}: empty signed_transaction_hex")
        try:
            parse_signed_raw_tx(_hex_to_bytes(raw_hex))
        except (ValueError, TypeError) as e:
            raise ValueError(f"step {gi}: signed_transaction_hex parse failed: {e}") from e

        slot = str(entry.get("tx_hash_backfill_slot_id") or "").strip()
        if not slot:
            raise ValueError(f"step {gi}: missing tx_hash_backfill_slot_id")
        ph = entry.get("broadcast_tx_hash_placeholder")
        if ph != "":
            raise ValueError(
                f"step {gi}: broadcast_tx_hash_placeholder must be empty string before broadcast (got {ph!r})"
            )

        prereq = entry.get("prerequisites")
        if prereq is not None:
            if not isinstance(prereq, list) or not prereq:
                raise ValueError(f"step {gi}: prerequisites must be a non-empty array when present")

        if source_manifest is not None:
            bid = str(entry.get("batch_plan_id") or "")
            try:
                o = int(entry.get("ordinal"))
            except (TypeError, ValueError) as e:
                raise ValueError(f"step {gi}: ordinal must be int") from e
            txs = by_bid.get(bid)
            if not txs:
                raise ValueError(f"step {gi}: batch_plan_id {bid!r} not found in source_manifest.batches")
            if not any(int(t.get("ordinal", -1)) == o for t in txs):
                raise ValueError(f"step {gi}: ordinal {o} not found under batch {bid!r} in manifest")

        row = {"global_index": gi, "rehearsal_step_ok": True}
        if emit_steps:
            steps_out.append(row)

    out: dict[str, Any] = {
        "anchor": REHEARSAL_ANCHOR,
        "rule_version": REHEARSAL_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "rehearsal_ok": True,
        "rehearsal_verdict": "GO",
        "rehearsal_steps": steps_out if emit_steps else [],
        "notes": "B-257: read-only; no RPC. Used by B-262 execute before eth_sendRawTransaction.",
    }
    return out


def _cmd_rehearsal_dryrun(args: argparse.Namespace) -> int:
    raw = Path(args.broadcast_request_stub).read_bytes()
    br = json.loads(raw.decode("utf-8"))
    manifest: dict[str, Any] | None = None
    if args.source_manifest:
        manifest = json.loads(Path(args.source_manifest).read_text(encoding="utf-8"))

    b301_meta: dict[str, Any] | None = None
    vmode = str(getattr(args, "verify_stub_signature", "none") or "none").strip().lower()
    if vmode != "none":
        from region_vault_claim_broadcast_stub_integrity_signing import verify_stub_integrity

        try:
            sigp = (
                Path(args.stub_signature_path).resolve()
                if getattr(args, "stub_signature_path", None)
                else None
            )
            b301_meta = verify_stub_integrity(
                stub_path=Path(args.broadcast_request_stub).resolve(),
                mode=vmode,
                signature_path=sigp,
            )
        except ValueError as e:
            print(f"rehearsal-dryrun: FAIL: B-301 stub signature: {e}", file=sys.stderr)
            return 1
        if str(b301_meta.get("verify_verdict") or "") != "GO":
            print(f"rehearsal-dryrun: FAIL: B-301 stub signature verify_verdict not GO: {b301_meta}", file=sys.stderr)
            return 1

    try:
        rep = run_rehearsal(
            br,
            source_manifest=manifest,
            require_operator_confirmation=not args.skip_operator_confirmation,
            require_go_verdict=True,
            emit_steps=True,
        )
    except ValueError as e:
        print(f"rehearsal-dryrun: FAIL: {e}", file=sys.stderr)
        return 1
    if b301_meta is not None:
        rep["b301_stub_integrity_verification"] = b301_meta
    outp = Path(args.output)
    outp.write_text(json.dumps(rep, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {args.output}", file=sys.stderr)
    print("region_vault_claim_broadcast_dryrun_rehearsal: OK", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    from region_vault_claim_broadcast_nonce_preflight import _rlp_encode

    def type2_raw(nonce: int) -> str:
        inner = [
            31337,
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
        body = b"\x02" + _rlp_encode(inner)
        return "0x" + body.hex()

    br: dict[str, Any] = {
        "anchor": BROADCAST_REQUEST_ANCHOR,
        "rule_version": BROADCAST_REQUEST_RULE_VERSION,
        "input_reconcile_verdict_preview": "GO",
        "source_manifest_sha256_hex": "deadbeef",
        "global_broadcast_sequence": [
            {
                "ordinal": 0,
                "batch_plan_id": "JUR:US|EPOCH:7",
                "chain_id": 31337,
                "signing_order": 0,
                "signed_transaction_hex": type2_raw(0),
                "tx_hash_backfill_slot_id": "proposed_transactions[0].broadcast_tx_hash",
                "broadcast_tx_hash_placeholder": "",
                "prerequisites": ["stub"],
            }
        ],
        "operator_confirmation": {
            "confirmed_by_operator": True,
            "operator_id_placeholder": "op",
            "confirmation_note": "note",
            "confirmed_at_utc": "2026-04-14T12:00:00Z",
        },
    }
    manifest = {
        "anchor": "14-REGIONVAULT-CLAIM-EXECUTION-DRYRUN-CLI-MANIFEST-V1",
        "batches": [
            {
                "batch_plan_id": "JUR:US|EPOCH:7",
                "proposed_transactions": [{"ordinal": 0}],
            }
        ],
    }
    br["source_manifest_sha256_hex"] = _canonical_manifest_sha256(manifest)

    run_rehearsal(
        br,
        source_manifest=manifest,
        require_operator_confirmation=True,
        require_go_verdict=True,
        emit_steps=False,
    )
    print("region_vault_claim_broadcast_dryrun_rehearsal self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="B-257: read-only rehearsal / validation for B-256 broadcast_request_stub.")
    sub = ap.add_subparsers(dest="cmd", required=True)

    rd = sub.add_parser("rehearsal-dryrun", help="validate stub (no RPC)")
    rd.add_argument("broadcast_request_stub", help="B-256 broadcast_request_stub JSON path")
    rd.add_argument("-o", "--output", required=True, help="rehearsal report JSON path")
    rd.add_argument("--source-manifest", help="optional manifest for SHA + ordinal cross-check")
    rd.add_argument(
        "--skip-operator-confirmation",
        action="store_true",
        help="do not require operator_confirmation human fields",
    )
    rd.add_argument(
        "--verify-stub-signature",
        choices=("none", "minisign", "gpg", "auto"),
        default="none",
        help="B-301 verify detached signature before rehearsal JSON is written",
    )
    rd.add_argument(
        "--stub-signature-path",
        metavar="PATH",
        help="B-301 path to .minisig or .asc (default: beside stub)",
    )
    rd.set_defaults(func=_cmd_rehearsal_dryrun)

    st = sub.add_parser("self-test", help="embedded structural checks")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
