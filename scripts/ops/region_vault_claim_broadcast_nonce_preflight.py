#!/usr/bin/env python3
# B-276: preflight — parse raw txs in B-256 stub, verify signing_order sequence + nonce ladder;
# optional eth_getTransactionCount(from, "pending") vs first nonce. Does not invoke B-262 execute.
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from threading import Thread
from typing import Any

BROADCAST_REQUEST_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-REQUEST-STUB-V1"
NONCE_PREFLIGHT_REPORT_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-NONCE-PREFLIGHT-REPORT-V1"
NONCE_PREFLIGHT_REPORT_RULE_VERSION = "region_vault_claim_broadcast_nonce_preflight_report_v1"
IMPLEMENTATION_TT = "TT-B276-BROADCAST-NONCE-PREFLIGHT-RPC-001"
MOTHER_TABLE = "B-276"
MULTI_RPC_IMPLEMENTATION_TT = "TT-B380-MULTI-RPC-NONCE-CONSENSUS-PREFLIGHT-001"
ACK_MAINNET_ENV = "TRAVELTRUST_BROADCAST_EXECUTE_ACK_MAINNET"
FROM_ENV = "TRAVELTRUST_BROADCAST_SIGNER_ADDRESS"
EXTRA_RPC_ENV = "TRAVELTRUST_BROADCAST_EXTRA_RPC_URLS"


def _sha256_canonical_json(obj: dict[str, Any]) -> str:
    body = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(body).hexdigest()


def build_nonce_preflight_report(
    ok: bool,
    errs: list[str],
    *,
    source_broadcast_request_stub_sha256_hex: str,
    source_broadcast_request_anchor: Any,
    source_broadcast_request_rule_version: Any,
    rpc_preflight_performed: bool,
    chain_id_hex_observed: str | None,
    from_address_redacted: str | None,
    nonce_rpc_quorum_evidence: dict[str, Any] | None = None,
) -> dict[str, Any]:
    verdict = "GO" if ok else "NO_GO"
    body: dict[str, Any] = {
        "anchor": NONCE_PREFLIGHT_REPORT_ANCHOR,
        "rule_version": NONCE_PREFLIGHT_REPORT_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "nonce_preflight_verdict": verdict,
        "nonce_preflight_errors": list(errs),
        "source_broadcast_request_stub_sha256_hex": source_broadcast_request_stub_sha256_hex,
        "source_broadcast_request_anchor": source_broadcast_request_anchor,
        "source_broadcast_request_rule_version": source_broadcast_request_rule_version,
        "rpc_preflight_performed": rpc_preflight_performed,
        "chain_id_hex_observed": chain_id_hex_observed,
        "from_address_redacted": from_address_redacted,
        "notes": "B-276: machine-readable preflight OK marker for B-262 --require-preflight-ok; stub SHA must match execute input bytes.",
    }
    if nonce_rpc_quorum_evidence is not None:
        body["nonce_rpc_quorum_evidence"] = nonce_rpc_quorum_evidence
    canon = {k: v for k, v in body.items() if k != "preflight_report_canonical_sha256_hex"}
    body["preflight_report_canonical_sha256_hex"] = _sha256_canonical_json(canon)
    return body


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


def _parse_chain_id_hex(chain_id_hex: str) -> int:
    h = chain_id_hex.strip().lower().removeprefix("0x")
    return int(h, 16)


def _assert_mainnet_ack_if_needed(chain_id: int) -> None:
    if chain_id != 1:
        return
    if os.environ.get(ACK_MAINNET_ENV, "").strip() == "1":
        return
    raise ValueError(
        f"chain_id=1 (Ethereum mainnet): set {ACK_MAINNET_ENV}=1 after explicit operator ack, "
        "or use a dev RPC (Anvil / localhost)."
    )


def _normalize_hex_address(addr: str) -> str:
    s = addr.strip().lower()
    if not s.startswith("0x"):
        s = "0x" + s
    h = s[2:]
    if len(h) != 40:
        raise ValueError(f"from address must be 20-byte hex (got len {len(h)})")
    int(h, 16)  # validate hex
    return "0x" + h


def _redact_rpc_url(url: str) -> str:
    try:
        p = urllib.parse.urlsplit(url.strip())
        host = p.hostname or ""
        port = f":{p.port}" if p.port else ""
        scheme = p.scheme or "http"
        return f"{scheme}://{host}{port}/…"
    except Exception:
        return "<redacted>"


def _quorum_threshold(n: int) -> int:
    if n < 1:
        return 1
    return (n // 2) + 1


def _chain_id_quorum_preflight(
    rpc_urls: list[str],
    req_id: int,
) -> tuple[str, list[dict[str, Any]], int, bool]:
    observations: list[dict[str, Any]] = []
    keys: list[str] = []
    cur = req_id
    for idx, url in enumerate(rpc_urls):
        ob: dict[str, Any] = {"endpoint_index": idx, "rpc_url_redacted": _redact_rpc_url(url)}
        try:
            resp = _json_rpc(url, "eth_chainId", [], cur)
            cur += 1
            hx = _rpc_require_result(resp, ctx="eth_chainId")
            if not isinstance(hx, str):
                raise ValueError("eth_chainId result must be hex string")
            hx = hx.strip().lower()
            if not hx.startswith("0x"):
                hx = "0x" + hx.removeprefix("0x")
            keys.append(hx)
            ob["outcome"] = "ok"
            ob["chain_id_hex"] = hx
        except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
            keys.append(f"__error__:{e}")
            ob["outcome"] = "error"
            ob["error"] = str(e)
        observations.append(ob)

    cnt = Counter(keys)
    need = _quorum_threshold(len(rpc_urls))
    winner: str | None = None
    for k, c in cnt.most_common():
        if c >= need and not k.startswith("__error__"):
            winner = k
            break
    disagree = len([k for k in cnt if not str(k).startswith("__error__")]) > 1
    if winner is None:
        raise ValueError(f"eth_chainId quorum failed: counts={dict(cnt)} need>={need}")
    return winner, observations, cur, disagree


def _pending_nonce_quorum_preflight(
    rpc_urls: list[str],
    addr: str,
    req_id: int,
) -> tuple[int, list[dict[str, Any]], int, bool]:
    observations: list[dict[str, Any]] = []
    keys: list[str] = []
    cur = req_id
    for idx, url in enumerate(rpc_urls):
        ob: dict[str, Any] = {"endpoint_index": idx, "rpc_url_redacted": _redact_rpc_url(url)}
        try:
            resp = _json_rpc(url, "eth_getTransactionCount", [addr, "pending"], cur)
            cur += 1
            hx = _rpc_require_result(resp, ctx="eth_getTransactionCount")
            if not isinstance(hx, str):
                raise ValueError("eth_getTransactionCount result must be hex string")
            hx = hx.strip().lower()
            if not hx.startswith("0x"):
                hx = "0x" + hx.removeprefix("0x")
            keys.append(hx)
            ob["outcome"] = "ok"
            ob["pending_nonce_hex"] = hx
        except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
            keys.append(f"__error__:{e}")
            ob["outcome"] = "error"
            ob["error"] = str(e)
        observations.append(ob)

    cnt = Counter(keys)
    need = _quorum_threshold(len(rpc_urls))
    winner_hex: str | None = None
    for k, c in cnt.most_common():
        if c >= need and not str(k).startswith("__error__"):
            winner_hex = str(k)
            break
    disagree = len([k for k in cnt if not str(k).startswith("__error__")]) > 1
    if winner_hex is None:
        raise ValueError(f"eth_getTransactionCount quorum failed: counts={dict(cnt)} need>={need}")
    pending_nonce = _parse_chain_id_hex(winner_hex)
    return pending_nonce, observations, cur, disagree


# --- RLP (minimal encode/decode for signed tx inspection + self-test) ---


def _rlp_encode(item: Any) -> bytes:
    if isinstance(item, int):
        if item == 0:
            b = b""
        else:
            b = item.to_bytes(max(1, (item.bit_length() + 7) // 8), "big")
        return _rlp_encode(b)
    if isinstance(item, bytes):
        if len(item) == 1 and item[0] < 0x80:
            return item
        if len(item) < 56:
            return bytes([0x80 + len(item)]) + item
        bl = len(item).to_bytes(max(1, (len(item).bit_length() + 7) // 8), "big")
        return bytes([0xB7 + len(bl)]) + bl + item
    if isinstance(item, list):
        payload = b"".join(_rlp_encode(x) for x in item)
        if len(payload) < 56:
            return bytes([0xC0 + len(payload)]) + payload
        bl = len(payload).to_bytes(max(1, (len(payload).bit_length() + 7) // 8), "big")
        return bytes([0xF7 + len(bl)]) + bl + payload
    raise TypeError(f"unsupported RLP type {type(item)}")


def _rlp_decode(data: bytes, pos: int = 0) -> tuple[Any, int]:
    if pos >= len(data):
        raise ValueError("RLP: unexpected EOF")
    prefix = data[pos]
    if prefix < 0x80:
        return bytes([prefix]), pos + 1
    if prefix < 0xB8:
        length = prefix - 0x80
        if length == 0:
            return b"", pos + 1
        end = pos + 1 + length
        if end > len(data):
            raise ValueError("RLP: string truncated")
        return data[pos + 1 : end], end
    if prefix < 0xC0:
        ll = prefix - 0xB7
        if pos + 1 + ll > len(data):
            raise ValueError("RLP: long string header truncated")
        length = int.from_bytes(data[pos + 1 : pos + 1 + ll], "big")
        start = pos + 1 + ll
        end = start + length
        if end > len(data):
            raise ValueError("RLP: long string truncated")
        return data[start:end], end
    if prefix < 0xF8:
        list_len = prefix - 0xC0
        start = pos + 1
        end = start + list_len
        if end > len(data):
            raise ValueError("RLP: short list truncated")
        items: list[Any] = []
        cur = start
        while cur < end:
            item, cur = _rlp_decode(data, cur)
            items.append(item)
        if cur != end:
            raise ValueError("RLP: list length mismatch")
        return items, end
    ll = prefix - 0xF7
    if pos + 1 + ll > len(data):
        raise ValueError("RLP: long list header truncated")
    list_len = int.from_bytes(data[pos + 1 : pos + 1 + ll], "big")
    start = pos + 1 + ll
    end = start + list_len
    if end > len(data):
        raise ValueError("RLP: long list truncated")
    items = []
    cur = start
    while cur < end:
        item, cur = _rlp_decode(data, cur)
        items.append(item)
    if cur != end:
        raise ValueError("RLP: long list inner mismatch")
    return items, end


def _be_int(b: bytes) -> int:
    if not isinstance(b, bytes):
        raise ValueError("RLP field must be bytes")
    return int.from_bytes(b, "big") if b else 0


@dataclass(frozen=True)
class ParsedRawTx:
    tx_type: str  # "legacy" | "eip2930" | "eip1559" | "eip4844"
    nonce: int
    chain_id: int | None


def parse_signed_raw_tx(tx_bytes: bytes) -> ParsedRawTx:
    if not tx_bytes:
        raise ValueError("empty raw transaction")
    lead = tx_bytes[0]
    if lead in (1, 2, 3):
        body = tx_bytes[1:]
        decoded, end = _rlp_decode(body, 0)
        if end != len(body):
            raise ValueError("typed tx: trailing bytes after RLP")
        if not isinstance(decoded, list) or len(decoded) < 2:
            raise ValueError("typed tx: expected RLP list")
        chain_id = _be_int(decoded[0])
        nonce = _be_int(decoded[1])
        if lead == 1:
            return ParsedRawTx("eip2930", nonce, chain_id)
        if lead == 2:
            return ParsedRawTx("eip1559", nonce, chain_id)
        return ParsedRawTx("eip4844", nonce, chain_id)
    # legacy
    decoded, end = _rlp_decode(tx_bytes, 0)
    if end != len(tx_bytes):
        raise ValueError("legacy tx: trailing bytes")
    if not isinstance(decoded, list) or len(decoded) != 9:
        raise ValueError("legacy tx: expected 9-field RLP list")
    nonce = _be_int(decoded[0])
    v = _be_int(decoded[6])
    chain_id: int | None = None
    if v >= 35:
        # EIP-155: chainId = (v - 35) // 2
        chain_id = (v - 35) // 2
    return ParsedRawTx("legacy", nonce, chain_id)


def _hex_to_bytes(h: str) -> bytes:
    s = h.strip().lower().removeprefix("0x")
    if len(s) % 2 == 1:
        raise ValueError("hex length must be even")
    return bytes.fromhex(s)


def _canonical_sequence_order_key(entry: dict[str, Any]) -> tuple[int, str]:
    try:
        so = int(entry.get("signing_order") or 0)
    except (TypeError, ValueError):
        so = 0
    return (so, str(entry.get("batch_plan_id") or ""))


def _steps_match_canonical_order(global_seq: list[Any]) -> tuple[bool, str]:
    for gi, entry in enumerate(global_seq):
        if not isinstance(entry, dict):
            return False, f"global_broadcast_sequence[{gi}] must be object"
    canon = sorted(global_seq, key=_canonical_sequence_order_key)
    for i, (a, b) in enumerate(zip(global_seq, canon)):
        if a is not b:
            return False, (
                f"global_broadcast_sequence order != canonical (signing_order, batch_plan_id) sort at index {i}: "
                "regenerate B-256 stub or reorder entries to match execute.py enumeration."
            )
    return True, ""


def run_nonce_preflight(
    br: dict[str, Any],
    raw_stub_bytes: bytes,
    *,
    from_addr: str | None,
    rpc_urls: list[str],
    do_rpc: bool,
    strict_stub_chain_id: bool,
) -> tuple[bool, list[str], dict[str, Any]]:
    stub_sha = hashlib.sha256(raw_stub_bytes).hexdigest()
    meta: dict[str, Any] = {
        "source_broadcast_request_stub_sha256_hex": stub_sha,
        "source_broadcast_request_anchor": br.get("anchor"),
        "source_broadcast_request_rule_version": br.get("rule_version"),
        "rpc_preflight_performed": False,
        "chain_id_hex_observed": None,
        "from_address_redacted": None,
        "nonce_rpc_quorum_evidence": None,
    }
    errs: list[str] = []
    if br.get("anchor") != BROADCAST_REQUEST_ANCHOR:
        errs.append(f"stub.anchor must be {BROADCAST_REQUEST_ANCHOR!r}")
        return False, errs, meta

    global_seq = br.get("global_broadcast_sequence")
    if not isinstance(global_seq, list) or not global_seq:
        errs.append("global_broadcast_sequence must be a non-empty array")
        return False, errs, meta

    ok_order, msg = _steps_match_canonical_order(global_seq)
    if not ok_order:
        errs.append(msg)
        return False, errs, meta

    parsed_rows: list[ParsedRawTx] = []
    for gi, entry in enumerate(global_seq):
        if not isinstance(entry, dict):
            errs.append(f"global_broadcast_sequence[{gi}] must be object")
            continue
        raw_hex = str(entry.get("signed_transaction_hex") or "").strip()
        if not raw_hex:
            errs.append(f"step {gi}: empty signed_transaction_hex")
            continue
        try:
            txb = _hex_to_bytes(raw_hex)
            p = parse_signed_raw_tx(txb)
            parsed_rows.append(p)
        except (ValueError, TypeError) as e:
            errs.append(f"step {gi}: raw tx parse failed: {e}")
            continue

        if strict_stub_chain_id:
            sc = entry.get("chain_id")
            if isinstance(sc, int) and p.chain_id is not None and sc != p.chain_id:
                errs.append(
                    f"step {gi}: stub chain_id={sc} != parsed raw chain_id={p.chain_id} "
                    f"({p.tx_type})"
                )

    if len(parsed_rows) != len(global_seq):
        return False, errs, meta

    for i in range(1, len(parsed_rows)):
        prev_n = parsed_rows[i - 1].nonce
        cur_n = parsed_rows[i].nonce
        if cur_n != prev_n + 1:
            errs.append(
                f"nonce ladder break at step {i}: nonce {cur_n} (expected {prev_n + 1} after step {i - 1} nonce {prev_n})"
            )

    typed_cids = {p.chain_id for p in parsed_rows if p.chain_id is not None}
    if len(typed_cids) > 1:
        errs.append(f"inconsistent chain_id across typed txs: {sorted(typed_cids)}")

    if errs:
        return False, errs, meta

    first_nonce = parsed_rows[0].nonce
    urls = [u.strip() for u in rpc_urls if u and u.strip()]
    urls = list(dict.fromkeys(urls))
    if not do_rpc or not urls:
        return True, [], meta

    if not from_addr:
        errs.append(
            f"RPC preflight requires signer address: pass --from or set {FROM_ENV} "
            f"(eth_getTransactionCount alignment)."
        )
        return False, errs, meta

    addr = _normalize_hex_address(from_addr)
    meta["from_address_redacted"] = addr[:6] + "…" + addr[-4:]
    try:
        quorum_multi = len(urls) > 1
        rid = 1
        if quorum_multi:
            cid_hex, obs_c, rid, dis_c = _chain_id_quorum_preflight(urls, rid)
            cid = _parse_chain_id_hex(cid_hex)
            _assert_mainnet_ack_if_needed(cid)
            meta["chain_id_hex_observed"] = cid_hex
            meta["rpc_preflight_performed"] = True
            pending_nonce, obs_n, rid, dis_n = _pending_nonce_quorum_preflight(urls, addr, rid)
            meta["nonce_rpc_quorum_evidence"] = {
                "implementation_tt": MULTI_RPC_IMPLEMENTATION_TT,
                "mother_table": "B-380",
                "enabled": True,
                "endpoint_count": len(urls),
                "quorum_rule": "strict_majority",
                "chain_id_quorum": {"observations": obs_c, "disagreement": dis_c},
                "transaction_count_quorum": {
                    "observations": obs_n,
                    "disagreement": dis_n,
                    "pending_nonce_observed": pending_nonce,
                },
            }
        else:
            resp = _json_rpc(urls[0], "eth_chainId", [], rid)
            rid += 1
            cid_hex = _rpc_require_result(resp, ctx="eth_chainId")
            if not isinstance(cid_hex, str):
                raise ValueError("eth_chainId result must be hex string")
            cid = _parse_chain_id_hex(cid_hex)
            _assert_mainnet_ack_if_needed(cid)
            meta["chain_id_hex_observed"] = cid_hex
            meta["rpc_preflight_performed"] = True
            resp2 = _json_rpc(urls[0], "eth_getTransactionCount", [addr, "pending"], rid)
            cnt_hex = _rpc_require_result(resp2, ctx="eth_getTransactionCount")
            if not isinstance(cnt_hex, str):
                raise ValueError("eth_getTransactionCount result must be hex string")
            pending_nonce = _parse_chain_id_hex(cnt_hex)

        if typed_cids:
            only = next(iter(typed_cids))
            if only != cid:
                errs.append(f"RPC eth_chainId={cid} != parsed typed tx chain_id={only}")

        if pending_nonce != first_nonce:
            errs.append(
                f"eth_getTransactionCount({addr!r}, 'pending') quorum/single={pending_nonce} != first raw tx nonce={first_nonce} "
                "(resign remaining sequence from correct nonce, or fix signer / RPC account)"
            )
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, OSError) as e:
        errs.append(f"RPC preflight failed: {e}")

    return (len(errs) == 0), errs, meta


def _collect_rpc_urls(args: argparse.Namespace) -> list[str]:
    primary = (args.rpc_url or os.environ.get("CHAIN_RPC_URL") or "").strip()
    extras: list[str] = []
    if args.extra_rpc_url:
        extras.extend(str(x).strip() for x in args.extra_rpc_url if str(x).strip())
    env_ex = (os.environ.get(EXTRA_RPC_ENV) or "").strip()
    if env_ex:
        extras.extend(x.strip() for x in env_ex.split(",") if x.strip())
    out: list[str] = []
    if primary:
        out.append(primary)
    out.extend(extras)
    return list(dict.fromkeys(out))


def _cmd_preflight(args: argparse.Namespace) -> int:
    raw = Path(args.broadcast_request_stub).read_bytes()
    br = json.loads(raw.decode("utf-8"))
    rpc_urls = _collect_rpc_urls(args)
    from_addr = (args.from_addr or os.environ.get(FROM_ENV) or "").strip() or None
    do_rpc = not args.skip_rpc_check and bool(rpc_urls)

    ok, errs, meta = run_nonce_preflight(
        br,
        raw,
        from_addr=from_addr,
        rpc_urls=rpc_urls,
        do_rpc=do_rpc,
        strict_stub_chain_id=bool(args.strict_stub_chain_id),
    )
    if args.output:
        rep = build_nonce_preflight_report(
            ok,
            errs,
            source_broadcast_request_stub_sha256_hex=meta["source_broadcast_request_stub_sha256_hex"],
            source_broadcast_request_anchor=meta["source_broadcast_request_anchor"],
            source_broadcast_request_rule_version=meta["source_broadcast_request_rule_version"],
            rpc_preflight_performed=bool(meta.get("rpc_preflight_performed")),
            chain_id_hex_observed=meta.get("chain_id_hex_observed"),
            from_address_redacted=meta.get("from_address_redacted"),
            nonce_rpc_quorum_evidence=meta.get("nonce_rpc_quorum_evidence"),
        )
        Path(args.output).write_text(json.dumps(rep, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"wrote {args.output}", file=sys.stderr)
    if ok:
        print("region_vault_claim_broadcast_nonce_preflight: OK", file=sys.stderr)
        if do_rpc and from_addr:
            print("  RPC: eth_getTransactionCount aligned with first raw nonce", file=sys.stderr)
        elif not do_rpc:
            print("  offline: sequence order + nonce ladder only (--skip-rpc-check or no CHAIN_RPC_URL)", file=sys.stderr)
        return 0
    for e in errs:
        print(f"preflight: FAIL: {e}", file=sys.stderr)
    return 1


def _cmd_self_test(_: argparse.Namespace) -> int:
    # Minimal EIP-1559 txs: chain 31337 (Anvil default), nonces 0 and 1
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

    stub_ok = {
        "anchor": BROADCAST_REQUEST_ANCHOR,
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
    ok, errs, _meta = run_nonce_preflight(
        stub_ok,
        raw_ok,
        from_addr=None,
        rpc_urls=[],
        do_rpc=False,
        strict_stub_chain_id=True,
    )
    assert ok and not errs, errs

    ok2, errs2, _ = run_nonce_preflight(
        stub_ok,
        raw_ok,
        from_addr="0x" + "11" * 20,
        rpc_urls=["http://unused.invalid/"],
        do_rpc=False,
        strict_stub_chain_id=True,
    )
    assert ok2, errs2

    stub_bad_order = json.loads(json.dumps(stub_ok))
    stub_bad_order["global_broadcast_sequence"] = list(reversed(stub_bad_order["global_broadcast_sequence"]))
    raw_bad = json.dumps(stub_bad_order, ensure_ascii=False).encode("utf-8")
    ok3, errs3, _ = run_nonce_preflight(
        stub_bad_order,
        raw_bad,
        from_addr=None,
        rpc_urls=[],
        do_rpc=False,
        strict_stub_chain_id=False,
    )
    assert not ok3 and errs3, "expected order failure"

    stub_gap = json.loads(json.dumps(stub_ok))
    stub_gap["global_broadcast_sequence"][1]["signed_transaction_hex"] = type2_raw(2)
    raw_gap = json.dumps(stub_gap, ensure_ascii=False).encode("utf-8")
    ok4, errs4, _ = run_nonce_preflight(
        stub_gap,
        raw_gap,
        from_addr=None,
        rpc_urls=[],
        do_rpc=False,
        strict_stub_chain_id=False,
    )
    assert not ok4, errs4

    rep = build_nonce_preflight_report(
        True,
        [],
        source_broadcast_request_stub_sha256_hex=hashlib.sha256(raw_ok).hexdigest(),
        source_broadcast_request_anchor=stub_ok.get("anchor"),
        source_broadcast_request_rule_version=None,
        rpc_preflight_performed=False,
        chain_id_hex_observed=None,
        from_address_redacted=None,
    )
    assert rep["nonce_preflight_verdict"] == "GO"

    seen: dict[str, Any] = {}

    class _H(BaseHTTPRequestHandler):
        def log_message(self, *_args: Any) -> None:
            return

        def do_POST(self) -> None:
            ln = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(ln)
            req = json.loads(body.decode("utf-8"))
            mid = req.get("id")
            method = str(req.get("method") or "")
            if method == "eth_chainId":
                out = {"jsonrpc": "2.0", "id": mid, "result": "0x7a69"}
            elif method == "eth_getTransactionCount":
                seen["count_calls"] = seen.get("count_calls", 0) + 1
                out = {"jsonrpc": "2.0", "id": mid, "result": hex(seen.get("return_nonce", 0))}
            else:
                out = {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": method}}
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(out, separators=(",", ":")).encode("utf-8"))

    srv = HTTPServer(("127.0.0.1", 0), _H)
    port = srv.server_address[1]
    th = Thread(target=srv.serve_forever, daemon=True)
    th.start()
    try:
        rpc = f"http://127.0.0.1:{port}/"
        seen["return_nonce"] = 0
        ok5, e5, m5 = run_nonce_preflight(
            stub_ok,
            raw_ok,
            from_addr="0x" + "22" * 20,
            rpc_urls=[rpc],
            do_rpc=True,
            strict_stub_chain_id=True,
        )
        assert ok5 and not e5, e5
        assert seen.get("count_calls", 0) >= 1
        assert m5.get("nonce_rpc_quorum_evidence") is None

        seen["return_nonce"] = 1
        ok6, e6, _ = run_nonce_preflight(
            stub_ok,
            raw_ok,
            from_addr="0x" + "22" * 20,
            rpc_urls=[rpc],
            do_rpc=True,
            strict_stub_chain_id=False,
        )
        assert not ok6 and e6, "expected RPC nonce mismatch"
    finally:
        srv.shutdown()

    class _H2(BaseHTTPRequestHandler):
        def log_message(self, *_a: Any) -> None:
            return

        def do_POST(self) -> None:
            ln = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(ln)
            req = json.loads(body.decode("utf-8"))
            mid = req.get("id")
            method = str(req.get("method") or "")
            port = self.server.server_address[1]  # type: ignore[attr-defined]
            if method == "eth_chainId":
                out = {"jsonrpc": "2.0", "id": mid, "result": "0x7a69"}
            elif method == "eth_getTransactionCount":
                nonce_val = 1 if port == _H2.port_b else 0  # type: ignore[attr-defined]
                out = {"jsonrpc": "2.0", "id": mid, "result": hex(nonce_val)}
            else:
                out = {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": method}}
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(out, separators=(",", ":")).encode("utf-8"))

    srv_a = HTTPServer(("127.0.0.1", 0), _H)
    pa = srv_a.server_address[1]
    Thread(target=srv_a.serve_forever, daemon=True).start()
    srv_b = HTTPServer(("127.0.0.1", 0), _H2)
    pb = srv_b.server_address[1]
    _H2.port_b = pb  # type: ignore[attr-defined]
    Thread(target=srv_b.serve_forever, daemon=True).start()
    srv_c: HTTPServer | None = None
    try:
        ra = f"http://127.0.0.1:{pa}/"
        rb = f"http://127.0.0.1:{pb}/"
        seen.clear()
        seen["return_nonce"] = 0
        ok7, e7, _m7 = run_nonce_preflight(
            stub_ok,
            raw_ok,
            from_addr="0x" + "22" * 20,
            rpc_urls=[ra, rb],
            do_rpc=True,
            strict_stub_chain_id=True,
        )
        assert not ok7 and e7, "expected multi-RPC pending nonce disagreement"

        srv_c = HTTPServer(("127.0.0.1", 0), _H)
        pc = srv_c.server_address[1]
        Thread(target=srv_c.serve_forever, daemon=True).start()
        rc = f"http://127.0.0.1:{pc}/"
        seen.clear()
        seen["return_nonce"] = 0
        ok8, e8, m8 = run_nonce_preflight(
            stub_ok,
            raw_ok,
            from_addr="0x" + "22" * 20,
            rpc_urls=[ra, rc],
            do_rpc=True,
            strict_stub_chain_id=True,
        )
        assert ok8 and not e8, e8
        assert m8.get("nonce_rpc_quorum_evidence", {}).get("enabled") is True
    finally:
        srv_b.shutdown()
        srv_a.shutdown()
        if srv_c is not None:
            srv_c.shutdown()

    print("region_vault_claim_broadcast_nonce_preflight self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description=(
            f"{MOTHER_TABLE}: parse signed_transaction_hex nonces; verify B-256 global_broadcast_sequence order "
            f"and nonce ladder; optional eth_getTransactionCount (TT {IMPLEMENTATION_TT})."
        )
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    pf = sub.add_parser("preflight", help="validate stub raw txs (+ optional RPC nonce alignment)")
    pf.add_argument("broadcast_request_stub", help="B-256 broadcast_request_stub JSON path")
    pf.add_argument("--from", dest="from_addr", help=f"signer 0x address (or env {FROM_ENV}) for RPC check")
    pf.add_argument("--rpc-url", help="JSON-RPC HTTP endpoint (default: CHAIN_RPC_URL when set)")
    pf.add_argument(
        "--extra-rpc-url",
        action="append",
        dest="extra_rpc_url",
        default=None,
        metavar="URL",
        help=f"additional JSON-RPC URL for B-380 multi-endpoint quorum (repeatable); also {EXTRA_RPC_ENV} comma-separated",
    )
    pf.add_argument(
        "--skip-rpc-check",
        action="store_true",
        help="never call RPC; only order + parse + nonce ladder (use when CHAIN_RPC_URL is set but RPC undesired)",
    )
    pf.add_argument(
        "--strict-stub-chain-id",
        action="store_true",
        help="require each step's stub chain_id (when int) to match parsed typed-tx chain_id",
    )
    pf.add_argument(
        "-o",
        "--output",
        help="optional nonce_preflight_report.json (GO/NO_GO + stub SHA for B-262 --require-preflight-ok)",
    )
    pf.set_defaults(func=_cmd_preflight)

    st = sub.add_parser("self-test", help="RLP + order + mock JSON-RPC eth_getTransactionCount")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    try:
        return int(args.func(args))
    except ValueError as e:
        print(f"preflight: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
