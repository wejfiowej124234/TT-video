#!/usr/bin/env python3
# B-291: eth_feeHistory reference + optional per-tx max fee / gas price ceiling; over-threshold → NO_GO + exit 1.
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

from region_vault_claim_broadcast_nonce_preflight import (
    ACK_MAINNET_ENV,
    BROADCAST_REQUEST_ANCHOR,
    _assert_mainnet_ack_if_needed,
    _be_int,
    _hex_to_bytes,
    _rlp_decode,
    _steps_match_canonical_order,
    parse_signed_raw_tx,
)
from region_vault_claim_broadcast_rpc_host_allowlist_b305 import allowlist_evidence_or_none

GAS_FEE_CAP_PREFLIGHT_REPORT_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-GAS-FEE-CAP-PREFLIGHT-REPORT-V1"
GAS_FEE_CAP_PREFLIGHT_RULE_VERSION = "region_vault_claim_broadcast_gas_fee_cap_preflight_v1"
B291_IMPLEMENTATION_TT = "TT-B291-GAS-PREFLIGHT-AND-FEE-CAP-001"
B291_MOTHER_TABLE = "B-291"
CEILING_ENV = "TRAVELTRUST_B291_MAX_FEE_PER_GAS_CEILING_WEI"
RATIO_ENV = "TRAVELTRUST_B291_FEE_CAP_OVER_FEE_HISTORY_RATIO"


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


def extract_signed_tx_fee_caps(tx_bytes: bytes) -> dict[str, Any]:
    """Return tx_type and the wei field used for max-fee-per-gas style gating."""
    p = parse_signed_raw_tx(tx_bytes)
    lead = tx_bytes[0]
    if p.tx_type == "legacy":
        decoded, end = _rlp_decode(tx_bytes, 0)
        if end != len(tx_bytes) or not isinstance(decoded, list) or len(decoded) < 3:
            raise ValueError("legacy tx: unexpected RLP shape")
        gp = _be_int(decoded[1])
        gl = _be_int(decoded[2])
        return {"tx_type": "legacy", "gas_price_wei": gp, "gas_limit": gl, "gate_max_fee_per_gas_wei": gp}
    if lead not in (1, 2, 3):
        raise ValueError(f"unsupported typed tx lead byte {lead!r}")
    body = tx_bytes[1:]
    decoded, end = _rlp_decode(body, 0)
    if end != len(body) or not isinstance(decoded, list) or len(decoded) < 5:
        raise ValueError("typed tx: unexpected RLP shape")
    mp = _be_int(decoded[2])
    mf = _be_int(decoded[3])
    gl = _be_int(decoded[4])
    return {
        "tx_type": p.tx_type,
        "max_priority_fee_per_gas_wei": mp,
        "max_fee_per_gas_wei": mf,
        "gas_limit": gl,
        "gate_max_fee_per_gas_wei": mf,
    }


def _parse_hex_int(hx: Any) -> int:
    if not isinstance(hx, str):
        raise ValueError("expected hex string")
    s = hx.strip().lower()
    if not s.startswith("0x"):
        s = "0x" + s
    return int(s, 16)


def latest_fee_history_reference_max_fee_wei(fh: Any) -> tuple[int | None, str | None]:
    """Use newest block in feeHistory: baseFeePerGas[-1] + reward[-1][0] (first percentile slot)."""
    if not isinstance(fh, dict):
        return None, "feeHistory result not an object"
    bfs = fh.get("baseFeePerGas")
    rw = fh.get("reward")
    if not isinstance(bfs, list) or not bfs:
        return None, "feeHistory.baseFeePerGas missing or empty"
    try:
        bf = _parse_hex_int(bfs[-1])
    except (TypeError, ValueError) as e:
        return None, f"feeHistory baseFeePerGas parse failed: {e}"
    pr = 0
    if isinstance(rw, list) and rw and isinstance(rw[-1], list) and rw[-1]:
        try:
            pr = _parse_hex_int(rw[-1][0])
        except (TypeError, ValueError):
            pr = 0
    return bf + pr, None


def run_gas_fee_cap_preflight(
    br: dict[str, Any],
    raw_stub_bytes: bytes,
    rpc_url: str,
    *,
    max_fee_per_gas_ceiling_wei: int | None,
    fee_cap_over_fee_history_ratio: float | None,
    fee_history_block_count: int,
    fee_history_reward_percentile: int,
    timeout_s: float = 60.0,
) -> dict[str, Any]:
    errs: list[str] = []
    stub_sha = hashlib.sha256(raw_stub_bytes).hexdigest()
    rows_out: list[dict[str, Any]] = []
    chain_id_hex: str | None = None
    fee_history_raw: Any = None
    fee_history_error: str | None = None
    reference_max_fee_wei: int | None = None
    reference_note: str | None = None
    rpc_fee_history_ok = False

    if br.get("anchor") != BROADCAST_REQUEST_ANCHOR:
        errs.append(f"stub.anchor must be {BROADCAST_REQUEST_ANCHOR!r}")
    global_seq = br.get("global_broadcast_sequence")
    if not isinstance(global_seq, list) or not global_seq:
        errs.append("global_broadcast_sequence must be a non-empty array")
    if errs:
        return _finalize_report(
            stub_sha,
            br,
            rows_out,
            errs,
            chain_id_hex,
            fee_history_raw,
            fee_history_error,
            reference_max_fee_wei,
            reference_note,
            max_fee_per_gas_ceiling_wei,
            fee_cap_over_fee_history_ratio,
            fee_history_block_count,
            fee_history_reward_percentile,
            rpc_url,
            b305_rpc_host_allowlist=None,
        )

    ok_order, msg = _steps_match_canonical_order(global_seq)
    if not ok_order:
        errs.append(msg)
        return _finalize_report(
            stub_sha,
            br,
            rows_out,
            errs,
            chain_id_hex,
            fee_history_raw,
            fee_history_error,
            reference_max_fee_wei,
            reference_note,
            max_fee_per_gas_ceiling_wei,
            fee_cap_over_fee_history_ratio,
            fee_history_block_count,
            fee_history_reward_percentile,
            rpc_url,
            b305_rpc_host_allowlist=None,
        )

    rpc = rpc_url.strip()
    rid = 1
    b305_gas: dict[str, Any] | None = None
    rpc_calls_ok = True
    if rpc:
        try:
            b305_gas = allowlist_evidence_or_none([rpc], tool_label="region_vault_claim_broadcast_gas_fee_cap_preflight")
        except ValueError as e:
            errs.append(str(e))
            rpc_calls_ok = False
    if rpc and rpc_calls_ok:
        try:
            r0 = _json_rpc(rpc, "eth_chainId", [], rid, timeout_s=timeout_s)
            rid += 1
            hx = _rpc_require_result(r0, ctx="eth_chainId")
            if isinstance(hx, str):
                chain_id_hex = hx.strip().lower()
                if not chain_id_hex.startswith("0x"):
                    chain_id_hex = "0x" + chain_id_hex.removeprefix("0x")
                try:
                    cid = int(chain_id_hex, 16)
                    _assert_mainnet_ack_if_needed(cid)
                except ValueError as e:
                    errs.append(str(e))
        except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
            errs.append(f"eth_chainId: {e}")

        if not errs:
            try:
                blk = hex(int(fee_history_block_count))
                pct = int(fee_history_reward_percentile)
                if pct < 0 or pct > 100:
                    raise ValueError("reward percentile must be 0..100")
                fh = _json_rpc(
                    rpc,
                    "eth_feeHistory",
                    [blk, "latest", [pct]],
                    rid,
                    timeout_s=timeout_s,
                )
                rid += 1
                fee_history_raw = _rpc_require_result(fh, ctx="eth_feeHistory")
                ref, rnote = latest_fee_history_reference_max_fee_wei(fee_history_raw)
                reference_max_fee_wei = ref
                reference_note = rnote
                rpc_fee_history_ok = True
            except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
                fee_history_error = str(e)
                reference_note = "eth_feeHistory failed"

    ratio = fee_cap_over_fee_history_ratio
    if ratio is not None and rpc and ratio > 0:
        if not rpc_fee_history_ok:
            if fee_history_error:
                errs.append(f"fee cap ratio gate: eth_feeHistory unavailable ({fee_history_error})")
            else:
                errs.append(
                    "fee cap ratio gate: eth_feeHistory not evaluated (fix JSON-RPC errors above, e.g. eth_chainId)"
                )
        elif reference_max_fee_wei is None:
            errs.append("fee cap ratio gate: could not derive reference max fee from feeHistory")
        elif reference_max_fee_wei <= 0:
            reference_note = (reference_note or "") + "; ratio gate skipped (reference fee <= 0)"

    for gi, entry in enumerate(global_seq):
        if not isinstance(entry, dict):
            errs.append(f"global_broadcast_sequence[{gi}] must be object")
            continue
        raw_hex = str(entry.get("signed_transaction_hex") or "").strip()
        if not raw_hex:
            errs.append(f"step {gi}: empty signed_transaction_hex")
            continue
        try:
            caps = extract_signed_tx_fee_caps(_hex_to_bytes(raw_hex))
        except (ValueError, TypeError) as e:
            errs.append(f"step {gi}: fee extract failed: {e}")
            continue
        gate = int(caps["gate_max_fee_per_gas_wei"])
        row: dict[str, Any] = {"global_index": gi, "fee_caps": caps, "gate_max_fee_per_gas_wei": gate}
        if max_fee_per_gas_ceiling_wei is not None and gate > max_fee_per_gas_ceiling_wei:
            errs.append(
                f"step {gi}: gate_max_fee_per_gas_wei {gate} exceeds ceiling {max_fee_per_gas_ceiling_wei} (B-291)"
            )
            row["ceiling_gate_ok"] = False
        else:
            row["ceiling_gate_ok"] = True if max_fee_per_gas_ceiling_wei is not None else None

        if ratio is not None and ratio > 0 and reference_max_fee_wei is not None and reference_max_fee_wei > 0:
            allowed = float(reference_max_fee_wei) * float(ratio)
            if float(gate) > allowed + 1e-9:
                errs.append(
                    f"step {gi}: gate_max_fee_per_gas_wei {gate} exceeds feeHistory reference "
                    f"{reference_max_fee_wei} × ratio {ratio}"
                )
                row["fee_history_ratio_gate_ok"] = False
            else:
                row["fee_history_ratio_gate_ok"] = True
        else:
            row["fee_history_ratio_gate_ok"] = None

        rows_out.append(row)

    if ratio is not None and ratio > 0 and not rpc.strip():
        errs.append("fee cap ratio gate requires --rpc-url or CHAIN_RPC_URL (B-291)")

    return _finalize_report(
        stub_sha,
        br,
        rows_out,
        errs,
        chain_id_hex,
        fee_history_raw,
        fee_history_error,
        reference_max_fee_wei,
        reference_note,
        max_fee_per_gas_ceiling_wei,
        fee_cap_over_fee_history_ratio,
        fee_history_block_count,
        fee_history_reward_percentile,
        rpc_url,
        b305_rpc_host_allowlist=b305_gas,
    )


def _finalize_report(
    stub_sha: str,
    br: dict[str, Any],
    rows_out: list[dict[str, Any]],
    errs: list[str],
    chain_id_hex: str | None,
    fee_history_raw: Any,
    fee_history_error: str | None,
    reference_max_fee_wei: int | None,
    reference_note: str | None,
    ceiling: int | None,
    ratio: float | None,
    fh_blocks: int,
    fh_pct: int,
    rpc_url: str,
    b305_rpc_host_allowlist: dict[str, Any] | None,
) -> dict[str, Any]:
    ok = not errs
    verdict = "GO" if ok else "NO_GO"
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    body: dict[str, Any] = {
        "anchor": GAS_FEE_CAP_PREFLIGHT_REPORT_ANCHOR,
        "rule_version": GAS_FEE_CAP_PREFLIGHT_RULE_VERSION,
        "mother_table": B291_MOTHER_TABLE,
        "implementation_tt": B291_IMPLEMENTATION_TT,
        "generated_at_utc": generated,
        "gas_fee_cap_preflight_verdict": verdict,
        "gas_fee_cap_preflight_errors": list(errs),
        "source_broadcast_request_stub_sha256_hex": stub_sha,
        "source_broadcast_request_anchor": br.get("anchor"),
        "source_broadcast_request_rule_version": br.get("rule_version"),
        "rpc_url_redacted": _redact_rpc_url(rpc_url) if rpc_url.strip() else None,
        "chain_id_hex_observed": chain_id_hex,
        "fee_history_block_count": fh_blocks,
        "fee_history_reward_percentile": fh_pct,
        "fee_history_error": fee_history_error,
        "fee_history_reference_max_fee_wei": reference_max_fee_wei,
        "fee_history_reference_note": reference_note,
        "max_fee_per_gas_ceiling_wei": ceiling,
        "fee_cap_over_fee_history_ratio": ratio,
        "per_step_fee_rows": rows_out,
        "mainnet_ack_env": ACK_MAINNET_ENV,
        "notes": (
            "B-291: optional wei ceiling on gate_max_fee_per_gas_wei (EIP-1559/4844/2930 max_fee_per_gas; legacy gasPrice) "
            "and/or cap vs eth_feeHistory newest base+reward; over-threshold → NO_GO."
        ),
    }
    # Omit huge raw feeHistory from canonical hash (keep summary fields only)
    body["fee_history_result_summary"] = _fee_history_summary(fee_history_raw)
    if b305_rpc_host_allowlist is not None:
        body["b305_rpc_host_allowlist"] = b305_rpc_host_allowlist
    canon = {k: v for k, v in body.items() if k != "gas_fee_cap_preflight_canonical_sha256_hex"}
    body["gas_fee_cap_preflight_canonical_sha256_hex"] = _sha256_canonical_json(canon)
    return body


def _fee_history_summary(fh: Any) -> Any:
    if fh is None:
        return None
    if not isinstance(fh, dict):
        return {"shape": type(fh).__name__}
    bfs = fh.get("baseFeePerGas")
    rw = fh.get("reward")
    ob: dict[str, Any] = {}
    if isinstance(bfs, list) and bfs:
        ob["base_fee_tail_hex"] = str(bfs[-1])
        ob["base_fee_len"] = len(bfs)
    if isinstance(rw, list) and rw:
        ob["reward_tail_len"] = len(rw[-1]) if isinstance(rw[-1], list) else None
    return ob or {"keys": sorted(fh.keys())}


def validate_gas_fee_cap_report_ok(*, report_path: Path, stub_raw_bytes: bytes) -> None:
    raw = report_path.read_bytes()
    doc = json.loads(raw.decode("utf-8"))
    if doc.get("anchor") != GAS_FEE_CAP_PREFLIGHT_REPORT_ANCHOR:
        raise ValueError(
            f"gas fee cap report anchor must be {GAS_FEE_CAP_PREFLIGHT_REPORT_ANCHOR!r} (got {doc.get('anchor')!r})"
        )
    if str(doc.get("rule_version") or "") != GAS_FEE_CAP_PREFLIGHT_RULE_VERSION:
        raise ValueError(
            f"gas fee cap report rule_version must be {GAS_FEE_CAP_PREFLIGHT_RULE_VERSION!r} "
            f"(got {doc.get('rule_version')!r})"
        )
    if str(doc.get("gas_fee_cap_preflight_verdict") or "") != "GO":
        raise ValueError(
            f"gas_fee_cap_preflight_verdict must be GO (got {doc.get('gas_fee_cap_preflight_verdict')!r}); "
            "re-run B-291 gas-fee-cap-preflight"
        )
    want = str(doc.get("source_broadcast_request_stub_sha256_hex") or "").lower()
    got = hashlib.sha256(stub_raw_bytes).hexdigest().lower()
    if not want or want != got:
        raise ValueError(
            "gas fee cap report source_broadcast_request_stub_sha256_hex does not match "
            "current broadcast_request_stub file bytes"
        )
    stored = doc.get("gas_fee_cap_preflight_canonical_sha256_hex")
    if not isinstance(stored, str) or not stored.strip():
        raise ValueError("gas fee cap report missing gas_fee_cap_preflight_canonical_sha256_hex")
    canon = {k: v for k, v in doc.items() if k != "gas_fee_cap_preflight_canonical_sha256_hex"}
    computed = _sha256_canonical_json(canon)
    if str(stored).strip().lower() != computed.lower():
        raise ValueError(
            "gas_fee_cap_preflight_canonical_sha256_hex mismatch (report tampered or wrong serialization)"
        )


def _parse_optional_int_env(name: str) -> int | None:
    v = (os.environ.get(name) or "").strip()
    if not v:
        return None
    return int(v, 0)


def _parse_optional_float_env(name: str) -> float | None:
    v = (os.environ.get(name) or "").strip()
    if not v:
        return None
    return float(v)


def _cmd_gas_fee_cap_preflight(args: argparse.Namespace) -> int:
    raw = Path(args.broadcast_request_stub).read_bytes()
    br = json.loads(raw.decode("utf-8"))
    rpc_url = (args.rpc_url or os.environ.get("CHAIN_RPC_URL") or "").strip()
    ceiling = args.max_fee_per_gas_ceiling_wei
    if ceiling is None:
        ceiling = _parse_optional_int_env(CEILING_ENV)
    ratio = args.fee_cap_over_fee_history_ratio
    if ratio is None:
        ratio = _parse_optional_float_env(RATIO_ENV)
    if ratio is not None and ratio <= 0:
        print("gas-fee-cap-preflight: FAIL: fee cap ratio must be > 0", file=sys.stderr)
        return 1
    rep = run_gas_fee_cap_preflight(
        br,
        raw,
        rpc_url,
        max_fee_per_gas_ceiling_wei=ceiling,
        fee_cap_over_fee_history_ratio=ratio,
        fee_history_block_count=int(args.fee_history_blocks),
        fee_history_reward_percentile=int(args.fee_history_reward_percentile),
        timeout_s=float(args.rpc_timeout_s),
    )
    outp = Path(args.output)
    outp.write_text(json.dumps(rep, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {args.output}", file=sys.stderr)
    if rep.get("gas_fee_cap_preflight_verdict") != "GO":
        return 1
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    from region_vault_claim_broadcast_nonce_preflight import _rlp_encode

    def type2_raw(nonce: int, mp: int = 1, mf: int = 1) -> str:
        inner = [
            31337,
            nonce,
            mp,
            mf,
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

    stub_ok = {
        "anchor": BROADCAST_REQUEST_ANCHOR,
        "rule_version": "region_vault_claim_broadcast_request_stub_v1",
        "global_broadcast_sequence": [
            {
                "signing_order": 0,
                "batch_plan_id": "A",
                "ordinal": 0,
                "chain_id": 31337,
                "signed_transaction_hex": type2_raw(0),
            },
            {
                "signing_order": 1,
                "batch_plan_id": "A",
                "ordinal": 1,
                "chain_id": 31337,
                "signed_transaction_hex": type2_raw(1),
            },
        ],
    }
    raw_ok = json.dumps(stub_ok, ensure_ascii=False).encode("utf-8")
    r_off = run_gas_fee_cap_preflight(
        stub_ok,
        raw_ok,
        "",
        max_fee_per_gas_ceiling_wei=100,
        fee_cap_over_fee_history_ratio=None,
        fee_history_block_count=5,
        fee_history_reward_percentile=50,
    )
    assert r_off["gas_fee_cap_preflight_verdict"] == "GO", r_off

    r_ce_bad = run_gas_fee_cap_preflight(
        stub_ok,
        raw_ok,
        "",
        max_fee_per_gas_ceiling_wei=0,
        fee_cap_over_fee_history_ratio=None,
        fee_history_block_count=5,
        fee_history_reward_percentile=50,
    )
    assert r_ce_bad["gas_fee_cap_preflight_verdict"] == "NO_GO"

    class _FhHandler(BaseHTTPRequestHandler):
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
            elif method == "eth_feeHistory":
                out = {
                    "jsonrpc": "2.0",
                    "id": mid,
                    "result": {
                        "oldestBlock": "0x1",
                        "baseFeePerGas": ["0x3", "0x3", "0x5"],
                        "gasUsedRatio": [0.1, 0.1, 0.1],
                        "reward": [["0x2"], ["0x2"], ["0x4"]],
                    },
                }
            else:
                out = {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"unknown {method}"}}
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(out, separators=(",", ":")).encode("utf-8"))

    srv = HTTPServer(("127.0.0.1", 0), _FhHandler)
    port = srv.server_address[1]
    Thread(target=srv.serve_forever, daemon=True).start()
    try:
        rpc = f"http://127.0.0.1:{port}/"
        r_hi = run_gas_fee_cap_preflight(
            stub_ok,
            raw_ok,
            rpc,
            max_fee_per_gas_ceiling_wei=None,
            fee_cap_over_fee_history_ratio=10.0,
            fee_history_block_count=3,
            fee_history_reward_percentile=50,
        )
        assert r_hi["gas_fee_cap_preflight_verdict"] == "GO", r_hi
        assert r_hi.get("fee_history_reference_max_fee_wei") == 5 + 4

        stub_hi = json.loads(json.dumps(stub_ok))
        stub_hi["global_broadcast_sequence"][0]["signed_transaction_hex"] = type2_raw(0, 1, 200)
        raw_hi = json.dumps(stub_hi, ensure_ascii=False).encode("utf-8")
        r_ratio_fail = run_gas_fee_cap_preflight(
            stub_hi,
            raw_hi,
            rpc,
            max_fee_per_gas_ceiling_wei=None,
            fee_cap_over_fee_history_ratio=1.05,
            fee_history_block_count=3,
            fee_history_reward_percentile=50,
        )
        assert r_ratio_fail["gas_fee_cap_preflight_verdict"] == "NO_GO", r_ratio_fail

        good_rep = run_gas_fee_cap_preflight(
            stub_ok,
            raw_ok,
            rpc,
            max_fee_per_gas_ceiling_wei=500,
            fee_cap_over_fee_history_ratio=100.0,
            fee_history_block_count=3,
            fee_history_reward_percentile=50,
        )
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "g.json"
            p.write_text(json.dumps(good_rep, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            validate_gas_fee_cap_report_ok(report_path=p, stub_raw_bytes=raw_ok)
    finally:
        srv.shutdown()

    print("region_vault_claim_broadcast_gas_fee_cap_preflight self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-291: gas fee cap preflight using eth_feeHistory + optional per-tx ceiling (broadcast_request_stub)."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    pf = sub.add_parser("gas-fee-cap-preflight", help="check stub tx fee fields vs optional ceilings / feeHistory ratio")
    pf.add_argument("broadcast_request_stub", help="B-256 broadcast_request_stub JSON path")
    pf.add_argument("-o", "--output", required=True, help="gas fee cap preflight report JSON path")
    pf.add_argument("--rpc-url", help="JSON-RPC URL for eth_chainId + eth_feeHistory (or CHAIN_RPC_URL)")
    pf.add_argument(
        "--max-fee-per-gas-ceiling-wei",
        type=int,
        default=None,
        metavar="N",
        help=f"optional hard cap; each tx gate_max_fee_per_gas_wei must be <= N; env {CEILING_ENV}",
    )
    pf.add_argument(
        "--fee-cap-over-fee-history-ratio",
        type=float,
        default=None,
        metavar="R",
        help=(
            "optional ratio gate: require gate_max_fee_per_gas_wei <= R × (newest baseFee + reward percentile); "
            f"requires RPC; env {RATIO_ENV}"
        ),
    )
    pf.add_argument(
        "--fee-history-blocks",
        type=int,
        default=5,
        metavar="N",
        help="eth_feeHistory blockCount (default 5)",
    )
    pf.add_argument(
        "--fee-history-reward-percentile",
        type=int,
        default=50,
        metavar="P",
        help="single reward percentile passed to eth_feeHistory (default 50)",
    )
    pf.add_argument("--rpc-timeout-s", type=float, default=60.0, metavar="SEC", help="per JSON-RPC timeout")
    pf.set_defaults(func=_cmd_gas_fee_cap_preflight)

    st = sub.add_parser("self-test", help="offline + mock eth_feeHistory fee cap checks")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    try:
        return int(args.func(args))
    except ValueError as e:
        print(f"gas-fee-cap-preflight: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
