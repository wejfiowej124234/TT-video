#!/usr/bin/env python3
# B-297: regression guard — RPC URLs with path/query secrets must not appear verbatim in redacted strings or B-262 execution_report JSON.
from __future__ import annotations

import argparse
import importlib
import json
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Thread
from typing import Any, Callable

IMPLEMENTATION_TT = "TT-B297-RPC-URL-REDACTION-REGRESSION-TEST-001"
MOTHER_TABLE = "B-297"

# Distinct probe token (must never appear verbatim in redacted outputs / emitted JSON).
SECRET_PROBE = "b297_rpc_path_probe_zq9mK2w"

_MODULES_WITH_TOP_LEVEL_REDACT: tuple[str, ...] = (
    "region_vault_claim_broadcast_execute",
    "region_vault_claim_broadcast_nonce_preflight",
    "region_vault_claim_broadcast_receipt_archive",
    "region_vault_claim_broadcast_gas_fee_cap_preflight",
    "region_vault_claim_broadcast_chain_tip_lag_watch",
)


def _load_redact(module_basename: str) -> Callable[[str], str]:
    # Use real package name so dataclasses / __module__ resolve (importlib.exec_module with a fake name breaks).
    mod = importlib.import_module(module_basename)
    fn = getattr(mod, "_redact_rpc_url", None)
    if not callable(fn):
        raise AttributeError(f"{module_basename}: missing _redact_rpc_url")
    return fn  # type: ignore[return-value]


def _redact_url_cases() -> list[str]:
    return [
        f"https://mainnet.infura.io/v3/{SECRET_PROBE}/more",
        f"http://127.0.0.1:8545/prefix/{SECRET_PROBE}/suffix?apiKey={SECRET_PROBE}",
        f"https://rpc.example.invalid/nested/{SECRET_PROBE}#frag{SECRET_PROBE}",
        f"http://user:pass@host.internal:18545/{SECRET_PROBE}/x",
    ]


def run_redact_unit_checks() -> None:
    for mod_name in _MODULES_WITH_TOP_LEVEL_REDACT:
        redact = _load_redact(mod_name)
        for raw in _redact_url_cases():
            out = redact(raw)
            if SECRET_PROBE in out:
                raise AssertionError(f"{mod_name}: redacted output leaks probe: {out!r} (input had secret in path/query)")
            if raw in out and SECRET_PROBE in raw:
                raise AssertionError(f"{mod_name}: full raw URL echoed in redacted output")


def run_execute_integration_probe() -> None:
    """Live path uses RPC URL with secret in path; execution_report JSON must not echo it."""
    from region_vault_claim_broadcast_execute import (
        _embedded_self_test_minimal_broadcast_stub,
        run_broadcast_execute,
    )

    br, raw_stub = _embedded_self_test_minimal_broadcast_stub()

    class _Handler(BaseHTTPRequestHandler):
        def log_message(self, _fmt: str, *_args: Any) -> None:
            return

        def do_POST(self) -> None:
            import hashlib

            ln = int(self.headers.get("Content-Length") or "0")
            body = self.rfile.read(ln)
            req = json.loads(body.decode("utf-8"))
            mid = req.get("id", 1)
            method = req.get("method")
            params = req.get("params") or []
            if method == "eth_chainId":
                out = {"jsonrpc": "2.0", "id": mid, "result": "0x7a69"}
            elif method == "eth_sendRawTransaction":
                raw_h = str(params[0]) if params else ""
                digest = hashlib.sha256(raw_h.encode("utf-8")).hexdigest()
                tx_hash = "0x" + digest[:64]
                out = {"jsonrpc": "2.0", "id": mid, "result": tx_hash}
            elif method == "eth_getTransactionReceipt":
                th = str(params[0]) if params else ""
                out = {
                    "jsonrpc": "2.0",
                    "id": mid,
                    "result": {
                        "transactionHash": th,
                        "status": "0x1",
                        "blockNumber": "0x1",
                    },
                }
            else:
                out = {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"unknown {method}"}}
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(out, separators=(",", ":")).encode("utf-8"))

    srv = HTTPServer(("127.0.0.1", 0), _Handler)
    port = srv.server_address[1]
    th = Thread(target=srv.serve_forever, daemon=True)
    th.start()
    try:
        rpc = f"http://127.0.0.1:{port}/v1/{SECRET_PROBE}/jsonrpc"
        rep = run_broadcast_execute(
            br,
            raw_stub,
            rpc,
            source_manifest=None,
            require_operator_confirmation=True,
            require_go_verdict=True,
            dry_run=False,
            skip_wait_receipt=False,
            receipt_timeout_s=5.0,
            receipt_poll_s=0.02,
        )
        blob = json.dumps(rep, ensure_ascii=False)
        if SECRET_PROBE in blob:
            raise AssertionError("execution_report JSON leaks SECRET_PROBE from RPC URL path")
        red = str(rep.get("rpc_url_redacted") or "")
        if SECRET_PROBE in red:
            raise AssertionError("rpc_url_redacted field leaks probe")
        if "127.0.0.1" not in red:
            raise AssertionError(f"rpc_url_redacted missing host: {red!r}")
    finally:
        srv.shutdown()


def _cmd_self_test(_: argparse.Namespace) -> int:
    run_redact_unit_checks()
    run_execute_integration_probe()
    print(f"region_vault_claim_broadcast_rpc_url_redaction_regression self-test OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description=f"{MOTHER_TABLE}: RPC URL redaction regression ({IMPLEMENTATION_TT})."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)
    st = sub.add_parser("self-test", help="unit redact + B-262 execution_report JSON leak probe")
    st.set_defaults(func=_cmd_self_test)
    args = ap.parse_args()
    try:
        return int(args.func(args))
    except (AssertionError, OSError, AttributeError, FileNotFoundError) as e:
        print(f"rpc_url_redaction_regression: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
