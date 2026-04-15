#!/usr/bin/env python3
# B-264: reconcile B-262 execution_report vs B-263 receipt_archive (no RPC, no HTTP, no contract changes).
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

RECONCILE_RULE_VERSION = "region_vault_claim_broadcast_onchain_reconcile_v1"
RECONCILE_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-ONCHAIN-RECONCILE-V1"
IMPLEMENTATION_TT = "TT-B264-14-REGIONVAULT-CLAIM-BROADCAST-RESULT-RECONCILE-ONCHAIN-001"
MOTHER_TABLE = "B-264"

EXECUTION_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-EXECUTION-REPORT-V1"
EXECUTION_RULE_VERSION = "region_vault_claim_broadcast_execute_v1"

ARCHIVE_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-RECEIPT-ARCHIVE-V1"
ARCHIVE_RULE_VERSION = "region_vault_claim_broadcast_receipt_archive_v1"


def _sha256_canonical_json(obj: dict[str, Any]) -> str:
    body = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(body).hexdigest()


def _tx_hex_norm(v: Any) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    if not s:
        return None
    if not s.startswith("0x"):
        return None
    return "0x" + s[2:].lower()


def _normalize_status(v: Any) -> str | None:
    if v is None:
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, int):
        if v == 1:
            return "0x1"
        if v == 0:
            return "0x0"
        return hex(v)
    s = str(v).strip().lower()
    if s in ("0x1", "0x01", "1"):
        return "0x1"
    if s in ("0x0", "0x00", "0"):
        return "0x0"
    if s.startswith("0x"):
        return "0x" + s[2:]
    return s


def _receipt_tx_hash(rec: Any) -> str | None:
    if not isinstance(rec, dict):
        return None
    for k in ("transactionHash", "transaction_hash", "txHash", "tx_hash"):
        v = rec.get(k)
        t = _tx_hex_norm(v)
        if t:
            return t
    return None


def run_onchain_reconcile(
    execution_report: dict[str, Any],
    raw_execution_bytes: bytes,
    receipt_archive: dict[str, Any],
    raw_archive_bytes: bytes,
    *,
    require_execution_go: bool,
    require_archive_go: bool,
    strict_receipt_archive_sha256: bool,
) -> dict[str, Any]:
    if execution_report.get("anchor") != EXECUTION_ANCHOR:
        raise ValueError(f"execution_report.anchor must be {EXECUTION_ANCHOR!r}")
    if str(execution_report.get("rule_version") or "") != EXECUTION_RULE_VERSION:
        raise ValueError(f"execution_report.rule_version must be {EXECUTION_RULE_VERSION!r}")

    if receipt_archive.get("anchor") != ARCHIVE_ANCHOR:
        raise ValueError(f"receipt_archive.anchor must be {ARCHIVE_ANCHOR!r}")
    if str(receipt_archive.get("rule_version") or "") != ARCHIVE_RULE_VERSION:
        raise ValueError(f"receipt_archive.rule_version must be {ARCHIVE_RULE_VERSION!r}")

    er_sha = hashlib.sha256(raw_execution_bytes).hexdigest()
    link = str(receipt_archive.get("source_execution_report_canonical_sha256_hex") or "").lower()
    if not link:
        raise ValueError("receipt_archive.source_execution_report_canonical_sha256_hex missing")
    if link != er_sha.lower():
        raise ValueError(
            "receipt_archive.source_execution_report_canonical_sha256_hex does not match "
            "SHA-256 of execution_report file bytes (wrong pair or stale archive)"
        )

    declared_arch_canon = str(receipt_archive.get("receipt_archive_canonical_sha256_hex") or "")
    arch_body = {k: v for k, v in receipt_archive.items() if k != "receipt_archive_canonical_sha256_hex"}
    derived_arch_canon = _sha256_canonical_json(arch_body)
    arch_sha_match = bool(declared_arch_canon and derived_arch_canon.lower() == declared_arch_canon.lower())
    if strict_receipt_archive_sha256 and not arch_sha_match:
        raise ValueError(
            "receipt_archive_canonical_sha256_hex mismatch vs recomputed canonical JSON "
            "(drop --strict-receipt-archive-sha256 to only soft-check)"
        )

    blocking: list[str] = []

    if require_execution_go and str(execution_report.get("execution_verdict") or "") != "GO":
        blocking.append(
            f"execution_verdict is {execution_report.get('execution_verdict')!r} (require GO; "
            "use --allow-non-go-execution-report to override)"
        )

    if require_archive_go and str(receipt_archive.get("archive_verdict") or "") != "GO":
        blocking.append(
            f"archive_verdict is {receipt_archive.get('archive_verdict')!r} (require GO; "
            "use --allow-non-go-archive to override)"
        )

    if declared_arch_canon and not arch_sha_match:
        blocking.append(
            "receipt_archive_canonical_sha256_hex mismatch vs recomputed canonical SHA of receipt_archive "
            "(file may be hand-edited)"
        )

    er_cid = str(execution_report.get("chain_id_hex") or "").strip().lower()
    ar_cid = str(receipt_archive.get("chain_id_hex_observed") or "").strip().lower()
    if er_cid and ar_cid and er_cid != ar_cid:
        blocking.append(f"chain_id_hex mismatch: execution_report {er_cid!r} vs receipt_archive {ar_cid!r}")

    steps_in = execution_report.get("execution_steps")
    if not isinstance(steps_in, list):
        raise ValueError("execution_steps must be array")
    arows_in = receipt_archive.get("archive_rows")
    if not isinstance(arows_in, list):
        raise ValueError("archive_rows must be array")

    def _gi(x: dict[str, Any]) -> int:
        g = x.get("global_index")
        return int(g) if isinstance(g, int) else -1

    steps = sorted([s for s in steps_in if isinstance(s, dict)], key=_gi)
    arows = sorted([r for r in arows_in if isinstance(r, dict)], key=_gi)
    if len(steps) != len(steps_in) or len(arows) != len(arows_in):
        blocking.append("execution_steps or archive_rows contains non-object entries")

    reconcile_rows: list[dict[str, Any]] = []

    if len(steps) != len(arows):
        blocking.append(f"row count mismatch: execution_steps {len(steps)} vs archive_rows {len(arows)}")

    n = min(len(steps), len(arows))
    seen_gi: set[int] = set()
    tx_by_global: dict[int, str] = {}

    for i in range(n):
        st = steps[i]
        ar = arows[i]
        row_errs: list[str] = []
        gi = st.get("global_index")
        gi_a = ar.get("global_index")
        if not isinstance(gi, int):
            blocking.append(f"step {i}: execution_steps.global_index must be int (got {gi!r})")
            continue
        if gi in seen_gi:
            row_errs.append(f"duplicate global_index {gi} in execution_steps")
        else:
            seen_gi.add(gi)
        if gi != gi_a:
            row_errs.append(f"global_index mismatch at sorted position {i}: execution {gi!r} vs archive {gi_a!r}")
        if gi != i:
            row_errs.append(f"global_index sequence gap: at position {i} expected global_index {i}, got {gi}")

        batch_e = str(st.get("batch_plan_id") or "")
        batch_a = str(ar.get("batch_plan_id") or "")
        if batch_e != batch_a:
            row_errs.append(f"batch_plan_id mismatch {batch_e!r} vs {batch_a!r}")

        ord_e = st.get("ordinal")
        ord_a = ar.get("ordinal")
        if ord_e != ord_a:
            row_errs.append(f"ordinal mismatch {ord_e!r} vs {ord_a!r}")

        so_e = st.get("signing_order")
        so_a = ar.get("signing_order")
        if so_e is not None and so_a is not None and so_e != so_a:
            row_errs.append(f"signing_order mismatch {so_e!r} vs {so_a!r}")

        tx_e = _tx_hex_norm(st.get("tx_hash"))
        tx_a = _tx_hex_norm(ar.get("tx_hash"))
        tx_match = tx_e == tx_a
        if not tx_match:
            row_errs.append(f"tx_hash mismatch execution {tx_e!r} vs archive {tx_a!r}")

        st_rs = _normalize_status(st.get("receipt_status_hex"))
        ar_rs = _normalize_status(ar.get("status_hex"))
        status_match: bool | None = None
        if st_rs is not None and ar_rs is not None:
            status_match = st_rs == ar_rs
            if not status_match:
                row_errs.append(
                    f"receipt status mismatch execution {st.get('receipt_status_hex')!r} "
                    f"vs archive {ar.get('status_hex')!r}"
                )
        elif st_rs is not None and ar_rs is None and tx_e:
            row_errs.append("execution has receipt_status_hex but archive status_hex missing")

        row_result = str(ar.get("row_result") or "")
        if tx_e and row_result != "ok":
            row_errs.append(f"archive row_result is {row_result!r} (expected ok when tx present)")

        if tx_e and row_result == "ok":
            if ar.get("block_number_hex") is None:
                row_errs.append("archive block_number_hex missing for ok row")
            if ar_rs not in ("0x1",) and ar_rs is not None:
                row_errs.append(f"archive status_hex {ar.get('status_hex')!r} is not success")

        rec_norm = ar.get("receipt_normalized")
        rth = _receipt_tx_hash(rec_norm)
        if rth and tx_e and rth != tx_e:
            row_errs.append(f"receipt_normalized transactionHash {rth!r} vs step/archive tx {tx_e!r}")

        for msg in row_errs:
            blocking.append(f"global_index {gi}: {msg}")

        row_ok = not row_errs
        if row_ok and tx_e:
            tx_by_global[gi] = tx_e

        reconcile_rows.append(
            {
                "global_index": gi,
                "batch_plan_id": batch_e,
                "ordinal": ord_e,
                "tx_hash_execution": tx_e,
                "tx_hash_archive": tx_a,
                "tx_hash_match": tx_match,
                "execution_receipt_status_hex": st.get("receipt_status_hex"),
                "archive_status_hex": ar.get("status_hex"),
                "status_match": status_match,
                "archive_row_result": row_result,
                "archive_block_number_hex": ar.get("block_number_hex"),
                "row_ok": row_ok,
            }
        )

    # duplicate tx
    seen_hash: dict[str, int] = {}
    for gi, h in sorted(tx_by_global.items()):
        key = h.lower()
        if key in seen_hash and seen_hash[key] != gi:
            blocking.append(f"duplicate tx hash {h!r} at global_index {gi} and {seen_hash[key]}")
        seen_hash[key] = gi

    # per-batch ordinal monotonicity along global_index order (same rules as B-261)
    batch_ordinals: dict[str, list[tuple[int, Any]]] = {}
    for st in steps:
        bid = str(st.get("batch_plan_id") or "")
        gi = st.get("global_index")
        o = st.get("ordinal")
        batch_ordinals.setdefault(bid, []).append((gi if isinstance(gi, int) else -1, o))

    for bid, pairs in batch_ordinals.items():
        if not bid:
            continue
        pairs_sorted = sorted(pairs, key=lambda x: x[0])
        last_o: int | None = None
        seen_o: set[int] = set()
        for _gi, raw_o in pairs_sorted:
            try:
                o_int = int(raw_o) if raw_o is not None else None
            except (TypeError, ValueError):
                blocking.append(f"batch_plan_id {bid!r}: non-integer ordinal {raw_o!r}")
                continue
            if o_int is None:
                blocking.append(f"batch_plan_id {bid!r}: missing ordinal on one row")
                continue
            if o_int in seen_o:
                blocking.append(f"batch_plan_id {bid!r}: duplicate ordinal {o_int}")
            seen_o.add(o_int)
            if last_o is not None and o_int <= last_o:
                blocking.append(
                    f"batch_plan_id {bid!r}: ordinal not strictly increasing along global_index order "
                    f"(saw {last_o} then {o_int})"
                )
            last_o = o_int

    verdict = "GO" if not blocking else "NO_GO"
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    report: dict[str, Any] = {
        "anchor": RECONCILE_ANCHOR,
        "rule_version": RECONCILE_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "generated_at_utc": generated,
        "source_execution_report_canonical_sha256_hex": execution_report.get("execution_report_canonical_sha256_hex"),
        "source_execution_report_sha256_of_file_bytes_hex": er_sha,
        "source_receipt_archive_canonical_sha256_hex_declared": declared_arch_canon or None,
        "source_receipt_archive_canonical_sha256_hex_recomputed": derived_arch_canon,
        "receipt_archive_canonical_sha256_match": arch_sha_match,
        "source_receipt_archive_archive_verdict": receipt_archive.get("archive_verdict"),
        "source_execution_report_execution_verdict": execution_report.get("execution_verdict"),
        "reconcile_rows": reconcile_rows,
        "blocking_reasons": blocking,
        "reconcile_verdict": verdict,
        "notes": "B-264: read-only cross-check B-262 vs B-263; no RPC; no new HTTP; no contract changes.",
    }
    canon = {k: v for k, v in report.items() if k != "onchain_reconcile_canonical_sha256_hex"}
    report["onchain_reconcile_canonical_sha256_hex"] = _sha256_canonical_json(canon)
    return report


def _cmd_reconcile_onchain(args: argparse.Namespace) -> int:
    raw_er = Path(args.execution_report).read_bytes()
    raw_arch = Path(args.receipt_archive).read_bytes()
    er = json.loads(raw_er.decode("utf-8"))
    arch = json.loads(raw_arch.decode("utf-8"))
    try:
        out = run_onchain_reconcile(
            er,
            raw_er,
            arch,
            raw_arch,
            require_execution_go=not args.allow_non_go_execution_report,
            require_archive_go=not args.allow_non_go_archive,
            strict_receipt_archive_sha256=args.strict_receipt_archive_sha256,
        )
    except ValueError as e:
        print(f"reconcile-onchain: FAIL: {e}", file=sys.stderr)
        return 1

    outp = Path(args.output)
    outp.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {args.output}", file=sys.stderr)
    v = out.get("reconcile_verdict")
    if v != "GO":
        print(f"reconcile-onchain: reconcile_verdict={v!r}", file=sys.stderr)
        for r in out.get("blocking_reasons") or []:
            print(f"  block: {r}", file=sys.stderr)
        return 0 if args.allow_non_go_reconcile else 1
    print("region_vault_claim_broadcast_onchain_reconcile: OK", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    tx = "0x" + "cd" * 32
    er_body: dict[str, Any] = {
        "anchor": EXECUTION_ANCHOR,
        "rule_version": EXECUTION_RULE_VERSION,
        "dry_run": False,
        "execution_verdict": "GO",
        "chain_id_hex": "0x7a69",
        "execution_steps": [
            {
                "global_index": 0,
                "batch_plan_id": "JUR:US|EPOCH:7",
                "ordinal": 0,
                "signing_order": 0,
                "eth_sendRawTransaction": "submitted",
                "tx_hash": tx,
                "receipt_status_hex": "0x1",
            }
        ],
    }
    er_body["execution_report_canonical_sha256_hex"] = _sha256_canonical_json(
        {k: v for k, v in er_body.items() if k != "execution_report_canonical_sha256_hex"}
    )
    er = er_body
    raw_er = json.dumps(er, ensure_ascii=False).encode("utf-8")

    arch = {
        "anchor": ARCHIVE_ANCHOR,
        "rule_version": ARCHIVE_RULE_VERSION,
        "mother_table": "B-263",
        "source_execution_report_canonical_sha256_hex": hashlib.sha256(raw_er).hexdigest(),
        "chain_id_hex_observed": "0x7a69",
        "archive_verdict": "GO",
        "archive_rows": [
            {
                "global_index": 0,
                "batch_plan_id": "JUR:US|EPOCH:7",
                "ordinal": 0,
                "signing_order": 0,
                "source_eth_send_raw": "submitted",
                "tx_hash": tx,
                "row_result": "ok",
                "block_number_hex": "0x4a",
                "gas_used_hex": "0x5208",
                "status_hex": "0x1",
                "transaction_index_hex": "0x0",
                "receipt_normalized": {"transactionHash": tx, "status": "0x1", "blockNumber": "0x4a"},
            }
        ],
        "archive_blocking_reasons": [],
    }
    arch_body = {k: v for k, v in arch.items() if k != "receipt_archive_canonical_sha256_hex"}
    arch["receipt_archive_canonical_sha256_hex"] = _sha256_canonical_json(arch_body)
    raw_arch = json.dumps(arch, ensure_ascii=False).encode("utf-8")

    out = run_onchain_reconcile(
        er,
        raw_er,
        arch,
        raw_arch,
        require_execution_go=True,
        require_archive_go=True,
        strict_receipt_archive_sha256=True,
    )
    assert out["reconcile_verdict"] == "GO", out
    assert not out["blocking_reasons"], out

    # mismatch tx -> NO_GO
    arch_bad = json.loads(raw_arch.decode("utf-8"))
    arch_bad["archive_rows"][0]["tx_hash"] = "0x" + "ee" * 32
    ab = {k: v for k, v in arch_bad.items() if k != "receipt_archive_canonical_sha256_hex"}
    arch_bad["receipt_archive_canonical_sha256_hex"] = _sha256_canonical_json(ab)
    raw_bad = json.dumps(arch_bad, ensure_ascii=False).encode("utf-8")
    out_bad = run_onchain_reconcile(
        er,
        raw_er,
        arch_bad,
        raw_bad,
        require_execution_go=True,
        require_archive_go=True,
        strict_receipt_archive_sha256=True,
    )
    assert out_bad["reconcile_verdict"] == "NO_GO", out_bad

    print("region_vault_claim_broadcast_onchain_reconcile self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="B-264 on-chain reconcile: B-262 execution_report vs B-263 receipt_archive")
    sub = ap.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("reconcile-onchain", help="Cross-check execution report vs receipt archive JSON")
    r.add_argument("execution_report", help="Path to B-262 execution_report.json")
    r.add_argument("receipt_archive", help="Path to B-263 receipt_archive.json")
    r.add_argument("-o", "--output", required=True, help="Output onchain_reconcile.json")
    r.add_argument(
        "--allow-non-go-reconcile",
        action="store_true",
        help="Write output and exit 0 even when reconcile_verdict is NO_GO",
    )
    r.add_argument(
        "--allow-non-go-execution-report",
        action="store_true",
        help="Do not require execution_verdict GO",
    )
    r.add_argument(
        "--allow-non-go-archive",
        action="store_true",
        help="Do not require archive_verdict GO",
    )
    r.add_argument(
        "--strict-receipt-archive-sha256",
        action="store_true",
        help="Fail fast if receipt_archive_canonical_sha256_hex does not match recomputed canonical JSON",
    )
    r.set_defaults(func=_cmd_reconcile_onchain)

    st = sub.add_parser("self-test", help="Embedded structural tests (no RPC)")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
