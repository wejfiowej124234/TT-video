#!/usr/bin/env python3
# B-290: dual-RPC eth_blockNumber lag observation; optional max-lag gate (NO_GO + exit 1).
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from threading import Thread
from typing import Any

from region_vault_claim_broadcast_rpc_host_allowlist_b305 import allowlist_evidence_or_none

CHAIN_TIP_LAG_WATCH_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-CHAIN-TIP-LAG-WATCH-V1"
CHAIN_TIP_LAG_WATCH_RULE_VERSION = "region_vault_claim_broadcast_chain_tip_lag_watch_v1"
B290_IMPLEMENTATION_TT = "TT-B290-RPC-CHAIN-TIP-LAG-WATCH-001"
B290_MOTHER_TABLE = "B-290"
COMPARE_RPC_ENV = "TRAVELTRUST_B290_COMPARE_CHAIN_RPC_URL"
MAX_LAG_ENV = "TRAVELTRUST_B290_MAX_LAG_BLOCKS"


def _sha256_canonical_json(obj: dict[str, Any]) -> str:
    body = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(body).hexdigest()


def _redact_rpc_url(url: str) -> str:
    try:
        p = urllib.parse.urlsplit(url.strip())
        host = p.hostname or ""
        port = f":{p.port}" if p.port else ""
        scheme = p.scheme or "http"
        return f"{scheme}://{host}{port}/…"
    except Exception:
        return "<redacted>"


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
        if isinstance(err, dict):
            msg = str(err.get("message") or err)
        else:
            msg = str(err)
        raise ValueError(f"{ctx}: {msg}")
    if "result" not in resp:
        raise ValueError(f"{ctx}: missing result")
    return resp["result"]


def _parse_hex_int(hx: Any) -> int:
    if not isinstance(hx, str):
        raise ValueError("expected hex string")
    s = hx.strip().lower()
    if not s.startswith("0x"):
        s = "0x" + s
    return int(s, 16)


def run_chain_tip_lag_watch(
    primary_rpc_url: str,
    compare_rpc_url: str,
    *,
    timeout_s: float = 60.0,
    max_lag_blocks: int | None = None,
    strict_chain_id: bool = True,
) -> dict[str, Any]:
    """Fetch eth_chainId + eth_blockNumber on two endpoints; optional lag gate."""
    primary_rpc_url = primary_rpc_url.strip()
    compare_rpc_url = compare_rpc_url.strip()
    b305_block = allowlist_evidence_or_none(
        [primary_rpc_url, compare_rpc_url],
        tool_label="region_vault_claim_broadcast_chain_tip_lag_watch",
    )
    errs: list[str] = []
    rid = 1
    p_cid: str | None = None
    c_cid: str | None = None
    p_bn: int | None = None
    c_bn: int | None = None

    try:
        r1 = _json_rpc(primary_rpc_url, "eth_chainId", [], rid, timeout_s=timeout_s)
        rid += 1
        hx = _rpc_require_result(r1, ctx="primary eth_chainId")
        if isinstance(hx, str):
            p_cid = hx.strip().lower()
            if not p_cid.startswith("0x"):
                p_cid = "0x" + p_cid.removeprefix("0x")
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
        errs.append(f"primary eth_chainId: {e}")

    try:
        r2 = _json_rpc(compare_rpc_url, "eth_chainId", [], rid, timeout_s=timeout_s)
        rid += 1
        hx = _rpc_require_result(r2, ctx="compare eth_chainId")
        if isinstance(hx, str):
            c_cid = hx.strip().lower()
            if not c_cid.startswith("0x"):
                c_cid = "0x" + c_cid.removeprefix("0x")
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
        errs.append(f"compare eth_chainId: {e}")

    if strict_chain_id and p_cid and c_cid and p_cid != c_cid:
        errs.append(f"chain_id mismatch primary={p_cid!r} compare={c_cid!r}")

    try:
        b1 = _json_rpc(primary_rpc_url, "eth_blockNumber", [], rid, timeout_s=timeout_s)
        rid += 1
        res = _rpc_require_result(b1, ctx="primary eth_blockNumber")
        p_bn = _parse_hex_int(res)
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
        errs.append(f"primary eth_blockNumber: {e}")

    try:
        b2 = _json_rpc(compare_rpc_url, "eth_blockNumber", [], rid, timeout_s=timeout_s)
        rid += 1
        res = _rpc_require_result(b2, ctx="compare eth_blockNumber")
        c_bn = _parse_hex_int(res)
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
        errs.append(f"compare eth_blockNumber: {e}")

    lag_abs: int | None = None
    primary_minus_compare: int | None = None
    lag_gate_ok: bool | None = None
    if p_bn is not None and c_bn is not None:
        lag_abs = abs(p_bn - c_bn)
        primary_minus_compare = p_bn - c_bn
        if max_lag_blocks is None:
            lag_gate_ok = True
        else:
            lag_gate_ok = lag_abs <= max_lag_blocks

    ok = not errs and lag_gate_ok is True
    verdict = "GO" if ok else "NO_GO"
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    body: dict[str, Any] = {
        "anchor": CHAIN_TIP_LAG_WATCH_ANCHOR,
        "rule_version": CHAIN_TIP_LAG_WATCH_RULE_VERSION,
        "mother_table": B290_MOTHER_TABLE,
        "implementation_tt": B290_IMPLEMENTATION_TT,
        "generated_at_utc": generated,
        "chain_tip_lag_watch_verdict": verdict,
        "chain_tip_lag_watch_errors": list(errs),
        "primary_rpc_url_redacted": _redact_rpc_url(primary_rpc_url),
        "compare_rpc_url_redacted": _redact_rpc_url(compare_rpc_url),
        "strict_chain_id": strict_chain_id,
        "primary_chain_id_hex": p_cid,
        "compare_chain_id_hex": c_cid,
        "primary_block_number": p_bn,
        "compare_block_number": c_bn,
        "lag_blocks_abs": lag_abs,
        "primary_minus_compare_blocks": primary_minus_compare,
        "max_lag_blocks_threshold": max_lag_blocks,
        "lag_gate_evaluated": max_lag_blocks is not None,
        "lag_gate_ok": lag_gate_ok,
        "notes": (
            "B-290: compare JSON-RPC chain tips (eth_blockNumber) between primary and secondary URLs; "
            "optional --max-lag-blocks / TRAVELTRUST_B290_MAX_LAG_BLOCKS turns lag into NO_GO when exceeded."
        ),
    }
    if b305_block is not None:
        body["b305_rpc_host_allowlist"] = b305_block
    canon = {k: v for k, v in body.items() if k != "chain_tip_lag_watch_canonical_sha256_hex"}
    body["chain_tip_lag_watch_canonical_sha256_hex"] = _sha256_canonical_json(canon)
    return body


def validate_chain_tip_lag_report_ok(*, report_path: Path) -> None:
    raw = report_path.read_bytes()
    doc = json.loads(raw.decode("utf-8"))
    if doc.get("anchor") != CHAIN_TIP_LAG_WATCH_ANCHOR:
        raise ValueError(
            f"chain tip lag report anchor must be {CHAIN_TIP_LAG_WATCH_ANCHOR!r} (got {doc.get('anchor')!r})"
        )
    if str(doc.get("rule_version") or "") != CHAIN_TIP_LAG_WATCH_RULE_VERSION:
        raise ValueError(
            f"chain tip lag report rule_version must be {CHAIN_TIP_LAG_WATCH_RULE_VERSION!r} "
            f"(got {doc.get('rule_version')!r})"
        )
    if str(doc.get("chain_tip_lag_watch_verdict") or "") != "GO":
        raise ValueError(
            f"chain_tip_lag_watch_verdict must be GO (got {doc.get('chain_tip_lag_watch_verdict')!r}); "
            "re-run B-290 chain-tip-lag-watch with acceptable lag"
        )
    stored = doc.get("chain_tip_lag_watch_canonical_sha256_hex")
    if not isinstance(stored, str) or not stored.strip():
        raise ValueError("chain tip lag report missing chain_tip_lag_watch_canonical_sha256_hex")
    canon = {k: v for k, v in doc.items() if k != "chain_tip_lag_watch_canonical_sha256_hex"}
    got = _sha256_canonical_json(canon)
    if str(stored).strip().lower() != got.lower():
        raise ValueError("chain_tip_lag_watch_canonical_sha256_hex mismatch (report tampered or wrong serialization)")


def _max_lag_from_env_and_cli(cli_val: int | None) -> int | None:
    if cli_val is not None:
        return int(cli_val)
    env_raw = (os.environ.get(MAX_LAG_ENV) or "").strip()
    if not env_raw:
        return None
    v = int(env_raw)
    if v < 0:
        raise ValueError(f"{MAX_LAG_ENV} must be >= 0")
    return v


def _cmd_chain_tip_lag_watch(args: argparse.Namespace) -> int:
    primary = (args.rpc_url or os.environ.get("CHAIN_RPC_URL") or "").strip()
    compare = (args.compare_rpc_url or os.environ.get(COMPARE_RPC_ENV) or "").strip()
    if not primary:
        print("chain-tip-lag-watch: FAIL: need --rpc-url or CHAIN_RPC_URL", file=sys.stderr)
        return 1
    if not compare:
        print(
            f"chain-tip-lag-watch: FAIL: need --compare-rpc-url or {COMPARE_RPC_ENV}",
            file=sys.stderr,
        )
        return 1
    try:
        max_lag = _max_lag_from_env_and_cli(args.max_lag_blocks)
    except ValueError as e:
        print(f"chain-tip-lag-watch: FAIL: {e}", file=sys.stderr)
        return 1
    rep = run_chain_tip_lag_watch(
        primary,
        compare,
        timeout_s=float(args.rpc_timeout_s),
        max_lag_blocks=max_lag,
        strict_chain_id=not args.no_strict_chain_id,
    )
    out_path = getattr(args, "output", None)
    if out_path:
        Path(out_path).write_text(json.dumps(rep, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"wrote {out_path}", file=sys.stderr)
    else:
        print(json.dumps(rep, indent=2, ensure_ascii=False))
    if rep.get("chain_tip_lag_watch_verdict") != "GO":
        return 1
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    class _HandlerHi(BaseHTTPRequestHandler):
        bn = "0x64"

        def log_message(self, _fmt: str, *_args: Any) -> None:
            return

        def do_POST(self) -> None:
            ln = int(self.headers.get("Content-Length") or "0")
            body = self.rfile.read(ln)
            req = json.loads(body.decode("utf-8"))
            mid = req.get("id", 1)
            method = req.get("method")
            if method == "eth_chainId":
                out = {"jsonrpc": "2.0", "id": mid, "result": "0x7a69"}
            elif method == "eth_blockNumber":
                out = {"jsonrpc": "2.0", "id": mid, "result": self.bn}
            else:
                out = {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"unknown {method}"}}
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(out, separators=(",", ":")).encode("utf-8"))

    class _HandlerLo(_HandlerHi):
        bn = "0x62"  # lag 2 vs 0x64

    srv_a = HTTPServer(("127.0.0.1", 0), _HandlerHi)
    srv_b = HTTPServer(("127.0.0.1", 0), _HandlerLo)
    pa, pb = srv_a.server_address[1], srv_b.server_address[1]
    Thread(target=srv_a.serve_forever, daemon=True).start()
    Thread(target=srv_b.serve_forever, daemon=True).start()
    try:
        url_a = f"http://127.0.0.1:{pa}/"
        url_b = f"http://127.0.0.1:{pb}/"
        r0 = run_chain_tip_lag_watch(url_a, url_b, max_lag_blocks=None)
        assert r0["chain_tip_lag_watch_verdict"] == "GO"
        assert r0["lag_blocks_abs"] == 2
        assert r0["lag_gate_evaluated"] is False
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "lag.json"
            good = run_chain_tip_lag_watch(url_a, url_b, max_lag_blocks=5)
            p.write_text(json.dumps(good, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            validate_chain_tip_lag_report_ok(report_path=p)
            bad = run_chain_tip_lag_watch(url_a, url_b, max_lag_blocks=1)
            assert bad["chain_tip_lag_watch_verdict"] == "NO_GO"
    finally:
        srv_a.shutdown()
        srv_b.shutdown()

    print("region_vault_claim_broadcast_chain_tip_lag_watch self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-290: dual-RPC chain tip (eth_blockNumber) lag watch for broadcast ops evidence."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    w = sub.add_parser("chain-tip-lag-watch", help="compare eth_blockNumber on primary vs secondary JSON-RPC URL")
    w.add_argument("--rpc-url", help="primary JSON-RPC URL (or CHAIN_RPC_URL)")
    w.add_argument(
        "--compare-rpc-url",
        help=f"secondary JSON-RPC URL (or {COMPARE_RPC_ENV})",
    )
    w.add_argument(
        "-o",
        "--output",
        metavar="PATH",
        help="write machine-readable lag watch JSON (recommended for execute --require-chain-tip-lag-ok)",
    )
    w.add_argument(
        "--max-lag-blocks",
        type=int,
        default=None,
        metavar="N",
        help=f"optional gate: NO_GO when abs(primary-compare) > N; default from {MAX_LAG_ENV} if set, else witness-only",
    )
    w.add_argument(
        "--rpc-timeout-s",
        type=float,
        default=60.0,
        metavar="SEC",
        help="per-request timeout (default 60)",
    )
    w.add_argument(
        "--no-strict-chain-id",
        action="store_true",
        help="do not fail when eth_chainId differs between endpoints (not recommended)",
    )
    w.set_defaults(func=_cmd_chain_tip_lag_watch)

    st = sub.add_parser("self-test", help="mock JSON-RPC servers + report validation")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    try:
        return int(args.func(args))
    except ValueError as e:
        print(f"chain-tip-lag-watch: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
