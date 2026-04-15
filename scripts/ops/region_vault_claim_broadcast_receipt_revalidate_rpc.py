#!/usr/bin/env python3
# B-367/B-373: RPC revalidation — canonical block header vs receipt inclusion hash (reorg / lag detection).
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from threading import Thread
from typing import Any

ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-RECEIPT-REVALIDATE-V1"
RULE_VERSION = "region_vault_claim_broadcast_receipt_revalidate_v1"
IMPLEMENTATION_TT = "TT-B367-SAFE-HEAD-REGRESSION-REFETCH-001"
MOTHER_TABLE = "B-367"
B373_TT = "TT-B373-PARENT-HASH-MISMATCH-GO-REVOCATION-001"

ARCHIVE_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-RECEIPT-ARCHIVE-V1"


def _json_rpc(url: str, method: str, params: list[Any], req_id: int, timeout_s: float = 60.0) -> dict[str, Any]:
    payload = json.dumps(
        {"jsonrpc": "2.0", "method": method, "params": params, "id": req_id},
        separators=(",", ":"),
    ).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _rpc_require_result(resp: dict[str, Any], *, ctx: str) -> Any:
    if "error" in resp and resp["error"] is not None:
        err = resp["error"]
        msg = str(err.get("message") if isinstance(err, dict) else err)
        raise ValueError(f"{ctx}: {msg}")
    if "result" not in resp:
        raise ValueError(f"{ctx}: missing result")
    return resp["result"]


def _norm_hex(x: Any) -> str | None:
    if x is None:
        return None
    s = str(x).strip().lower()
    if not s:
        return None
    if not s.startswith("0x"):
        s = "0x" + s
    return s


def run_revalidate(
    receipt_archive: dict[str, Any],
    rpc_url: str,
    *,
    safe_head_tag: str,
) -> dict[str, Any]:
    if receipt_archive.get("anchor") != ARCHIVE_ANCHOR:
        raise ValueError(f"receipt_archive.anchor must be {ARCHIVE_ANCHOR!r}")
    rows_in = receipt_archive.get("archive_rows")
    if not isinstance(rows_in, list):
        raise ValueError("archive_rows must be array")

    rid = 1
    resp = _json_rpc(rpc_url, "eth_getBlockByNumber", [safe_head_tag, False], rid)
    rid += 1
    head = _rpc_require_result(resp, ctx=f"eth_getBlockByNumber({safe_head_tag!r})")
    if not isinstance(head, dict):
        raise ValueError("head block must be object")
    head_num = _norm_hex(head.get("number"))
    head_hash = _norm_hex(head.get("hash"))

    out_rows: list[dict[str, Any]] = []
    blocking: list[str] = []
    for i, row in enumerate(rows_in):
        if not isinstance(row, dict):
            continue
        gi = row.get("global_index")
        if row.get("row_result") != "ok":
            out_rows.append({"global_index": gi, "skipped": True, "reason": "row_not_ok"})
            continue
        norm = row.get("receipt_normalized")
        if not isinstance(norm, dict):
            blocking.append(f"row {gi}: missing receipt_normalized")
            continue
        txh = _norm_hex(norm.get("transactionHash") or norm.get("transaction_hash"))
        bh = _norm_hex(norm.get("blockHash") or norm.get("block_hash"))
        bn = _norm_hex(norm.get("blockNumber") or norm.get("block_number"))
        if not bn:
            blocking.append(f"row {gi}: missing blockNumber in receipt")
            out_rows.append({"global_index": gi, "inclusion_hash_match": False})
            continue
        try:
            resp_b = _json_rpc(rpc_url, "eth_getBlockByNumber", [bn, False], rid)
            rid += 1
            blk = _rpc_require_result(resp_b, ctx=f"eth_getBlockByNumber({bn})")
        except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
            blocking.append(f"row {gi}: RPC failed: {e}")
            out_rows.append({"global_index": gi, "inclusion_hash_match": False, "rpc_error": str(e)})
            continue
        if not isinstance(blk, dict):
            blocking.append(f"row {gi}: block not object")
            continue
        canon_hash = _norm_hex(blk.get("hash"))
        parent_hash = _norm_hex(blk.get("parentHash") or blk.get("parent_hash"))
        match = bool(bh and canon_hash and bh == canon_hash)
        if not match:
            blocking.append(
                f"row {gi} tx {txh}: inclusion block hash mismatch (reorg/lag): "
                f"receipt.blockHash={bh!r} vs chain eth_getBlockByNumber({bn}).hash={canon_hash!r}"
            )
        out_rows.append(
            {
                "global_index": gi,
                "tx_hash": txh,
                "receipt_block_hash_hex": bh,
                "canonical_block_hash_hex": canon_hash,
                "inclusion_hash_match": match,
                "canonical_parent_hash_hex": parent_hash,
                "b373_parent_surface_tt": B373_TT,
            }
        )

    verdict = "GO" if not blocking else "NO_GO"

    def _redact(u: str) -> str:
        try:
            p = urllib.parse.urlsplit(u.strip())
            host = p.hostname or ""
            port = f":{p.port}" if p.port else ""
            scheme = p.scheme or "http"
            return f"{scheme}://{host}{port}/…"
        except Exception:
            return "<redacted>"

    return {
        "anchor": ANCHOR,
        "rule_version": RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "rpc_url_redacted": _redact(rpc_url),
        "safe_head_tag_observed": safe_head_tag,
        "safe_head_block_number_hex": head_num,
        "safe_head_block_hash_hex": head_hash,
        "rows": out_rows,
        "blocking_reasons": blocking,
        "revalidation_verdict": verdict,
    }


def _cmd_revalidate(args: argparse.Namespace) -> int:
    raw = Path(args.receipt_archive).read_bytes()
    arch = json.loads(raw.decode("utf-8"))
    rpc = (args.rpc_url or "").strip()
    if not rpc:
        print("revalidate: need --rpc-url", file=sys.stderr)
        return 1
    try:
        out = run_revalidate(arch, rpc, safe_head_tag=str(args.safe_head_tag))
    except ValueError as e:
        print(f"revalidate: FAIL: {e}", file=sys.stderr)
        return 1
    Path(args.output).write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {args.output}", file=sys.stderr)
    if out.get("revalidation_verdict") != "GO":
        return 1
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    tx = "0x" + "ab" * 32
    block_hash = "0x" + "11" * 32
    parent_hash = "0x" + "22" * 32

    class _H(BaseHTTPRequestHandler):
        def log_message(self, *_a: Any) -> None:
            return

        def do_POST(self) -> None:
            ln = int(self.headers.get("Content-Length") or "0")
            body = self.rfile.read(ln)
            req = json.loads(body.decode("utf-8"))
            mid = req.get("id", 1)
            method = req.get("method")
            params = req.get("params") or []
            if method == "eth_getBlockByNumber":
                tag = params[0] if params else "latest"
                if tag == "finalized":
                    out = {
                        "jsonrpc": "2.0",
                        "id": mid,
                        "result": {"number": "0x64", "hash": "0x" + "ff" * 32},
                    }
                else:
                    out = {
                        "jsonrpc": "2.0",
                        "id": mid,
                        "result": {
                            "number": tag,
                            "hash": block_hash,
                            "parentHash": parent_hash,
                        },
                    }
            else:
                out = {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": method}}
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(out, separators=(",", ":")).encode("utf-8"))

    srv = HTTPServer(("127.0.0.1", 0), _H)
    port = srv.server_address[1]
    Thread(target=srv.serve_forever, daemon=True).start()
    try:
        arch = {
            "anchor": ARCHIVE_ANCHOR,
            "rule_version": "region_vault_claim_broadcast_receipt_archive_v1",
            "archive_rows": [
                {
                    "global_index": 0,
                    "row_result": "ok",
                    "receipt_normalized": {
                        "transactionHash": tx,
                        "blockNumber": "0x4a",
                        "blockHash": block_hash,
                    },
                }
            ],
        }
        rpc = f"http://127.0.0.1:{port}/"
        out = run_revalidate(arch, rpc, safe_head_tag="finalized")
        assert out["revalidation_verdict"] == "GO", out
        assert out["rows"][0].get("inclusion_hash_match") is True

        arch_bad = json.loads(json.dumps(arch))
        arch_bad["archive_rows"][0]["receipt_normalized"]["blockHash"] = "0x" + "ee" * 32
        out_bad = run_revalidate(arch_bad, rpc, safe_head_tag="finalized")
        assert out_bad["revalidation_verdict"] == "NO_GO", out_bad
    finally:
        srv.shutdown()

    print("region_vault_claim_broadcast_receipt_revalidate_rpc self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="B-367/B-373 receipt revalidation via JSON-RPC")
    sub = ap.add_subparsers(dest="cmd", required=True)

    rv = sub.add_parser("revalidate", help="cross-check inclusion block hashes vs chain")
    rv.add_argument("receipt_archive", help="B-263 receipt_archive.json path")
    rv.add_argument("-o", "--output", required=True, help="output revalidate_report.json")
    rv.add_argument("--rpc-url", required=True, help="JSON-RPC HTTP endpoint")
    rv.add_argument(
        "--safe-head-tag",
        default="finalized",
        choices=("latest", "safe", "finalized"),
        help="also record head snapshot at revalidation time",
    )
    rv.set_defaults(func=_cmd_revalidate)

    st = sub.add_parser("self-test", help="mock RPC tests")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
