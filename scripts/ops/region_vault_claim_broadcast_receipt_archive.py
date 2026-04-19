#!/usr/bin/env python3
# B-263: aggregate eth_getTransactionReceipt rows from B-262 execution_report → single receipt evidence JSON.
# B-283 (EXTEND): classified backoff for receipt-related JSON-RPC (429 / 5xx / timeouts); see ReceiptRpcBackoffConfig.
# B-289 (EXTEND): reorg / receipt invalidation disclosure + optional env-driven safe|finalized head tag for finality.
# B-293 (EXTEND): TRAVELTRUST_FINALITY_MODE default RPC anchor when CLI omits --finality-head-tag (min-confirmations>0).
from __future__ import annotations

import argparse
import errno
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
from collections import Counter
from dataclasses import dataclass
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from threading import Thread
from typing import Any

from region_vault_claim_broadcast_finality_mode import (
    FINALITY_MODE_ENV,
    build_b293_resolution_dict,
    normalized_rpc_head_tag_from_finality_mode,
)
from region_vault_claim_broadcast_mainnet_dual_control import enforce_mainnet_dual_control
from region_vault_claim_broadcast_break_glass_roles_b303 import require_b303_metadata_if_b287_active
from region_vault_claim_broadcast_manual_override_b287 import b287_block_for_allow_non_go
from region_vault_claim_broadcast_rpc_host_allowlist_b305 import allowlist_evidence_or_none

ARCHIVE_RULE_VERSION = "region_vault_claim_broadcast_receipt_archive_v1"
ARCHIVE_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-RECEIPT-ARCHIVE-V1"
IMPLEMENTATION_TT = "TT-B263-14-REGIONVAULT-CLAIM-BROADCAST-RECEIPT-ARCHIVE-001"
MOTHER_TABLE = "B-263"
QUORUM_IMPLEMENTATION_TT = "TT-B366-MULTI-RPC-RECEIPT-QUORUM-V1-001"
B283_IMPLEMENTATION_TT = "TT-B283-B263-RECEIPT-FETCH-BACKOFF-001"
B283_MOTHER_TABLE = "B-283"
B289_IMPLEMENTATION_TT = "TT-B289-REORG-RECEIPT-INVALIDATION-NOTE-001"
B289_MOTHER_TABLE = "B-289"
B289_FINALITY_HEAD_ENV = "TRAVELTRUST_B289_FINALITY_HEAD_BLOCK_TAG"

SOURCE_EXECUTION_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-EXECUTION-REPORT-V1"
SOURCE_EXECUTION_RULE_VERSION = "region_vault_claim_broadcast_execute_v1"


def _b289_reorg_receipt_invalidation_note(
    *,
    finality_on: bool,
    finality_head_block_tag: str,
    min_confirmations: int,
    env_head_override_applied: bool,
) -> dict[str, Any]:
    return {
        "mother_table": B289_MOTHER_TABLE,
        "implementation_tt": B289_IMPLEMENTATION_TT,
        "finality_enabled": finality_on,
        "finality_head_block_tag_effective": finality_head_block_tag if finality_on else None,
        "min_confirmations": min_confirmations if finality_on else 0,
        "env_head_override_applied": env_head_override_applied,
        "env_name": B289_FINALITY_HEAD_ENV,
        "disclosure": (
            "Chain reorgs can invalidate receipt-vs-head inclusion assumptions after the RPC response was captured. "
            "B-263 re-fetches eth_getTransactionReceipt and compares eth_getBlockByNumber(receipt_block) to "
            "receipt.blockHash; a mismatch surfaces as reorg_block_hash_mismatch on the row (see archive_rows). "
            "For production-grade evidence where confirmations are measured against a reorg-resistant anchor, "
            "prefer head tags `safe` or `finalized` via --finality-head-tag, or set "
            f"{B289_FINALITY_HEAD_ENV} and pass --finality-head-tag-from-env when --min-confirmations > 0."
        ),
    }


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


def _parse_chain_id_hex(chain_id_hex: str) -> int:
    h = chain_id_hex.strip().lower().removeprefix("0x")
    return int(h, 16)


@dataclass(frozen=True)
class ReceiptRpcBackoffConfig:
    """B-283: conservative transport-layer backoff for JSON-RPC (429 / 5xx / timeouts)."""

    enabled: bool = True
    max_retries: int = 8
    base_delay_s: float = 0.25
    max_delay_s: float = 8.0
    factor: float = 2.0


def _rpc_transport_retryable(exc: BaseException) -> bool:
    if isinstance(exc, TimeoutError):
        return True
    if isinstance(exc, urllib.error.HTTPError):
        code = exc.code
        return code == 429 or (500 <= code < 600)
    if isinstance(exc, urllib.error.URLError):
        r = exc.reason
        if isinstance(r, TimeoutError):
            return True
        if isinstance(r, OSError):
            if r.errno in (
                errno.ETIMEDOUT,
                errno.ECONNRESET,
                errno.EPIPE,
                errno.ECONNABORTED,
                errno.EHOSTUNREACH,
                errno.ENETUNREACH,
            ):
                return True
        msg = str(r).lower()
        if "timed out" in msg or "timeout" in msg:
            return True
    if isinstance(exc, OSError):
        if exc.errno in (errno.ETIMEDOUT, errno.ECONNRESET, errno.EPIPE):
            return True
    return False


def _json_rpc_once(url: str, method: str, params: list[Any], req_id: int, timeout_s: float = 120.0) -> dict[str, Any]:
    payload = json.dumps(
        {"jsonrpc": "2.0", "method": method, "params": params, "id": req_id},
        separators=(",", ":"),
    ).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _json_rpc(
    url: str,
    method: str,
    params: list[Any],
    req_id: int,
    timeout_s: float = 120.0,
    *,
    backoff: ReceiptRpcBackoffConfig | None = None,
) -> dict[str, Any]:
    if backoff is None or not backoff.enabled or backoff.max_retries < 1:
        return _json_rpc_once(url, method, params, req_id, timeout_s)
    last: BaseException | None = None
    for attempt in range(backoff.max_retries + 1):
        try:
            return _json_rpc_once(url, method, params, req_id, timeout_s)
        except BaseException as e:
            last = e
            if attempt >= backoff.max_retries or not _rpc_transport_retryable(e):
                raise
            cap = min(backoff.max_delay_s, backoff.base_delay_s * (backoff.factor**attempt))
            time.sleep(cap)
    assert last is not None
    raise last


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


def _fetch_chain_id_hex(rpc_url: str, *, backoff: ReceiptRpcBackoffConfig | None = None) -> str:
    resp = _json_rpc(rpc_url, "eth_chainId", [], 1, backoff=backoff)
    r = _rpc_require_result(resp, ctx="eth_chainId")
    if not isinstance(r, str):
        raise ValueError("eth_chainId result must be hex string")
    return r


def _hex_to_int(h: str | None) -> int | None:
    if not h or not isinstance(h, str):
        return None
    s = h.strip().lower().removeprefix("0x")
    if not s:
        return None
    try:
        return int(s, 16)
    except ValueError:
        return None


def _normalize_hex_scalar(v: Any) -> str | None:
    if v is None:
        return None
    if isinstance(v, int):
        return hex(v)
    s = str(v).strip()
    if not s:
        return None
    if s.startswith("0x") or s.startswith("0X"):
        return "0x" + s[2:].lower()
    return s


def _normalize_receipt_object(rec: dict[str, Any]) -> dict[str, Any]:
    """Canonical JSON-shaped receipt: sorted keys, hex scalars lowercased."""

    def norm_val(x: Any) -> Any:
        if isinstance(x, dict):
            return {k: norm_val(x[k]) for k in sorted(x.keys())}
        if isinstance(x, list):
            return [norm_val(i) for i in x]
        if isinstance(x, bool):
            return x
        if isinstance(x, int):
            return x
        if x is None:
            return None
        if isinstance(x, str) and x.startswith("0x"):
            return _normalize_hex_scalar(x) or x
        return x

    return norm_val(rec)  # type: ignore[return-value]


def _fetch_receipt(rpc_url: str, tx_hash: str, req_id: int, *, backoff: ReceiptRpcBackoffConfig | None = None) -> dict[str, Any] | None:
    resp = _json_rpc(rpc_url, "eth_getTransactionReceipt", [tx_hash], req_id, backoff=backoff)
    rec = _rpc_require_result(resp, ctx=f"eth_getTransactionReceipt {tx_hash}")
    if rec is None:
        return None
    if not isinstance(rec, dict):
        raise ValueError(f"eth_getTransactionReceipt {tx_hash}: expected object or null")
    return rec


def _quorum_threshold(n: int) -> int:
    """Strict majority: more than half of n endpoints (n>=1)."""
    if n < 1:
        return 1
    return (n // 2) + 1


def _vote_key_receipt_norm(norm: dict[str, Any]) -> str:
    bn = _normalize_hex_scalar(norm.get("blockNumber"))
    st = _normalize_hex_scalar(norm.get("status"))
    bh = _normalize_hex_scalar(norm.get("blockHash"))
    th = _normalize_hex_scalar(norm.get("transactionHash") or norm.get("transaction_hash"))
    return json.dumps(
        {"blockNumber": bn, "status": st, "blockHash": bh, "transactionHash": th},
        sort_keys=True,
        separators=(",", ":"),
    )


def _vote_key_block_header(blk: dict[str, Any]) -> str:
    num = _normalize_hex_scalar(blk.get("number"))
    bh = _normalize_hex_scalar(blk.get("hash"))
    return json.dumps({"number": num, "hash": bh}, sort_keys=True, separators=(",", ":"))


def _fetch_chain_id_hex_at(rpc_url: str, req_id: int, *, backoff: ReceiptRpcBackoffConfig | None = None) -> str:
    resp = _json_rpc(rpc_url, "eth_chainId", [], req_id, backoff=backoff)
    r = _rpc_require_result(resp, ctx="eth_chainId")
    if not isinstance(r, str):
        raise ValueError("eth_chainId result must be hex string")
    return r.strip().lower()


def _chain_id_quorum(
    rpc_urls: list[str],
    req_id: int,
    *,
    backoff: ReceiptRpcBackoffConfig | None = None,
) -> tuple[str, list[dict[str, Any]], int, bool]:
    """Returns (canonical_chain_id_hex_lower, observations, next_req_id, disagreement)."""
    observations: list[dict[str, Any]] = []
    keys: list[str] = []
    cur = req_id
    for idx, url in enumerate(rpc_urls):
        ob: dict[str, Any] = {"endpoint_index": idx, "rpc_url_redacted": _redact_rpc_url(url)}
        try:
            hx = _fetch_chain_id_hex_at(url, cur, backoff=backoff)
            cur += 1
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
    disagree = len([k for k in cnt if not k.startswith("__error__")]) > 1
    if winner is None:
        raise ValueError(f"eth_chainId quorum failed: counts={dict(cnt)} need>={need}")
    return winner, observations, cur, disagree


def _fetch_receipt_quorum(
    rpc_urls: list[str],
    tx_hash: str,
    req_id: int,
    *,
    backoff: ReceiptRpcBackoffConfig | None = None,
) -> tuple[dict[str, Any] | None, list[dict[str, Any]], int, bool, bool]:
    """Returns (normalized_receipt_or_none, observations, next_req_id, quorum_ok, disagreement)."""
    observations: list[dict[str, Any]] = []
    payloads: list[tuple[str, dict[str, Any] | None]] = []
    cur = req_id
    for idx, url in enumerate(rpc_urls):
        ob: dict[str, Any] = {"endpoint_index": idx, "rpc_url_redacted": _redact_rpc_url(url)}
        try:
            raw = _fetch_receipt(url, tx_hash, cur, backoff=backoff)
            cur += 1
            if raw is None:
                vk = "__receipt_null__"
                payloads.append((vk, None))
                ob.update({"outcome": "receipt_null", "vote_key": vk})
            else:
                norm = _normalize_receipt_object(raw)
                vk = _vote_key_receipt_norm(norm)
                payloads.append((vk, norm))
                ob.update(
                    {
                        "outcome": "ok",
                        "vote_key": vk,
                        "block_number_hex": _normalize_hex_scalar(norm.get("blockNumber")),
                        "status_hex": _normalize_hex_scalar(norm.get("status")),
                    }
                )
        except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
            vk = f"__error__:{type(e).__name__}"
            payloads.append((vk, None))
            ob.update({"outcome": "error", "error": str(e), "vote_key": vk})
        observations.append(ob)

    cnt = Counter(vk for vk, _ in payloads)
    need = _quorum_threshold(len(rpc_urls))
    disagree = len(cnt) > 1
    winner_norm: dict[str, Any] | None = None
    quorum_ok = False
    for vk, c in cnt.most_common():
        if c >= need:
            if vk.startswith("__error__"):
                break
            quorum_ok = True
            if vk == "__receipt_null__":
                winner_norm = None
            else:
                for k, pl in payloads:
                    if k == vk and pl is not None:
                        winner_norm = pl
                        break
            break
    return winner_norm, observations, cur, quorum_ok, disagree


def _get_block_quorum(
    rpc_urls: list[str],
    block_param: str | int,
    req_id: int,
    *,
    ctx: str,
    backoff: ReceiptRpcBackoffConfig | None = None,
) -> tuple[dict[str, Any], list[dict[str, Any]], int, bool]:
    """block_param hex string or tag. Returns (winning_block_dict, observations, next_id, disagreement)."""
    param: str | int = block_param
    if isinstance(block_param, int):
        param = hex(block_param)
    observations: list[dict[str, Any]] = []
    payloads: list[tuple[str, dict[str, Any] | None]] = []
    cur = req_id
    for idx, url in enumerate(rpc_urls):
        ob: dict[str, Any] = {"endpoint_index": idx, "rpc_url_redacted": _redact_rpc_url(url)}
        try:
            resp = _json_rpc(url, "eth_getBlockByNumber", [param, False], cur, backoff=backoff)
            cur += 1
            blk = _rpc_require_result(resp, ctx=f"{ctx} @{idx}")
            if not isinstance(blk, dict):
                raise ValueError("block must be object")
            vk = _vote_key_block_header(blk)
            payloads.append((vk, blk))
            ob.update(
                {
                    "outcome": "ok",
                    "vote_key": vk,
                    "number": _normalize_hex_scalar(blk.get("number")),
                    "hash": _normalize_hex_scalar(blk.get("hash")),
                }
            )
        except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
            vk = f"__error__:{type(e).__name__}"
            payloads.append((vk, None))
            ob.update({"outcome": "error", "error": str(e), "vote_key": vk})
        observations.append(ob)

    cnt = Counter(vk for vk, _ in payloads)
    need = _quorum_threshold(len(rpc_urls))
    disagree = len(cnt) > 1
    for vk, c in cnt.most_common():
        if c >= need and not vk.startswith("__error__"):
            for k, pl in payloads:
                if k == vk and pl is not None:
                    return pl, observations, cur, disagree
    raise ValueError(f"eth_getBlockByNumber quorum failed ({ctx}): counts={dict(cnt)} need>={need}")


def run_receipt_archive(
    execution_report: dict[str, Any],
    raw_report_bytes: bytes,
    rpc_url: str,
    *,
    require_execution_go: bool,
    strict_chain_id: bool,
    allow_partial_archive: bool,
    min_confirmations: int = 0,
    finality_head_block_tag: str = "latest",
    extra_rpc_urls: list[str] | None = None,
    receipt_fetch_backoff: ReceiptRpcBackoffConfig | None = None,
    b287_manual_override: dict[str, Any] | None = None,
    b289_env_head_override_applied: bool = False,
    b293_finality_mode_resolution: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if execution_report.get("anchor") != SOURCE_EXECUTION_ANCHOR:
        raise ValueError(f"execution_report.anchor must be {SOURCE_EXECUTION_ANCHOR!r}")
    rv = str(execution_report.get("rule_version") or "")
    if rv != SOURCE_EXECUTION_RULE_VERSION:
        raise ValueError(f"rule_version must be {SOURCE_EXECUTION_RULE_VERSION!r} (got {rv!r})")
    if execution_report.get("dry_run") is True:
        raise ValueError("execution_report.dry_run true: no on-chain receipts to archive")

    if require_execution_go:
        if str(execution_report.get("execution_verdict") or "") != "GO":
            raise ValueError("execution_verdict must be GO (use --allow-non-go-execution-report to override)")

    steps = execution_report.get("execution_steps")
    if not isinstance(steps, list):
        raise ValueError("execution_steps must be array")

    blocking: list[str] = []
    rows: list[dict[str, Any]] = []
    rid = 10_000
    bf = receipt_fetch_backoff if receipt_fetch_backoff is not None else ReceiptRpcBackoffConfig()
    rpc_urls = [rpc_url.strip()] + [u.strip() for u in (extra_rpc_urls or []) if u.strip()]
    rpc_urls = list(dict.fromkeys(rpc_urls))
    if not rpc_urls:
        raise ValueError("at least one JSON-RPC URL required")
    b305_meta = allowlist_evidence_or_none(rpc_urls, tool_label="region_vault_claim_broadcast_receipt_archive")
    quorum_multi = len(rpc_urls) > 1
    chain_quorum_obs: list[dict[str, Any]] = []
    chain_quorum_disagree = False
    head_quorum_obs: list[dict[str, Any]] = []
    head_quorum_disagree = False

    finality_on = min_confirmations > 0
    if finality_on and finality_head_block_tag not in ("latest", "safe", "finalized"):
        raise ValueError("finality_head_block_tag must be one of: latest, safe, finalized")

    try:
        if quorum_multi:
            ch_low, chain_quorum_obs, rid, chain_quorum_disagree = _chain_id_quorum(rpc_urls, rid, backoff=bf)
            chain_rpc = ch_low if str(ch_low).startswith("0x") else "0x" + str(ch_low).removeprefix("0x")
        else:
            chain_rpc = _fetch_chain_id_hex(rpc_urls[0], backoff=bf)
            rid += 1
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
        raise ValueError(f"B-263 eth_chainId failed: {e}") from e

    cid = _parse_chain_id_hex(chain_rpc)
    b300_meta = enforce_mainnet_dual_control(cid, rpc_url_redacted=_redact_rpc_url(rpc_url))

    reported_chain = execution_report.get("chain_id_hex")
    if strict_chain_id and isinstance(reported_chain, str) and reported_chain.strip():
        if reported_chain.strip().lower() != chain_rpc.strip().lower():
            raise ValueError(
                f"chain_id_hex mismatch: report {reported_chain!r} vs RPC {chain_rpc!r} "
                "(drop --strict-chain-id to only trust RPC)"
            )

    head_bn_hex_g: str | None = None
    head_bn_i_g: int | None = None
    head_hash_g: str | None = None
    if finality_on:
        try:
            if quorum_multi:
                hb, head_quorum_obs, rid, head_quorum_disagree = _get_block_quorum(
                    rpc_urls,
                    finality_head_block_tag,
                    rid,
                    ctx=f"eth_getBlockByNumber({finality_head_block_tag!r} head anchor)",
                    backoff=bf,
                )
                head_bn_hex_g = _normalize_hex_scalar(hb.get("number"))
                head_bn_i_g = _hex_to_int(head_bn_hex_g)
                head_hash_g = _normalize_hex_scalar(hb.get("hash"))
            else:
                resp_h0 = _json_rpc(
                    rpc_urls[0],
                    "eth_getBlockByNumber",
                    [finality_head_block_tag, False],
                    rid,
                    backoff=bf,
                )
                rid += 1
                hb = _rpc_require_result(resp_h0, ctx=f"eth_getBlockByNumber({finality_head_block_tag!r} head anchor)")
                if not isinstance(hb, dict):
                    raise ValueError("head block must be object")
                head_bn_hex_g = _normalize_hex_scalar(hb.get("number"))
                head_bn_i_g = _hex_to_int(head_bn_hex_g)
                head_hash_g = _normalize_hex_scalar(hb.get("hash"))
            if head_bn_i_g is None:
                raise ValueError("head block missing number")
            if not head_hash_g:
                raise ValueError("head block missing hash")
        except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
            raise ValueError(f"B-263 finality: head anchor RPC failed: {e}") from e

    for step in steps:
        if not isinstance(step, dict):
            raise ValueError("each execution_steps[] must be object")
        gi = step.get("global_index")
        txh = step.get("tx_hash")
        tx_str = str(txh).strip() if txh is not None else ""
        base = {
            "global_index": gi,
            "batch_plan_id": str(step.get("batch_plan_id") or ""),
            "ordinal": step.get("ordinal"),
            "signing_order": step.get("signing_order"),
            "source_eth_send_raw": str(step.get("eth_sendRawTransaction") or ""),
        }
        if not tx_str or not tx_str.startswith("0x"):
            rows.append(
                {
                    **base,
                    "tx_hash": None,
                    "row_result": "no_tx_hash",
                    "block_number_hex": None,
                    "gas_used_hex": None,
                    "status_hex": None,
                    "transaction_index_hex": None,
                    "receipt_normalized": None,
                }
            )
            blocking.append(f"global_index {gi}: missing tx_hash")
            continue

        rec_obs: list[dict[str, Any]] | None = None
        rec_disagree = False
        norm: dict[str, Any] | None = None
        if quorum_multi:
            norm, rec_obs, rid, q_ok, rec_disagree = _fetch_receipt_quorum(rpc_urls, tx_str, rid, backoff=bf)
            q_meta = {"observations": rec_obs, "quorum_ok": q_ok, "disagreement": rec_disagree}
            if not q_ok:
                rows.append(
                    {
                        **base,
                        "tx_hash": tx_str,
                        "row_result": "rpc_error",
                        "rpc_error": "eth_getTransactionReceipt quorum failed (no strict majority)",
                        "rpc_receipt_quorum": q_meta,
                        "block_number_hex": None,
                        "gas_used_hex": None,
                        "status_hex": None,
                        "transaction_index_hex": None,
                        "receipt_normalized": None,
                    }
                )
                blocking.append(
                    f"global_index {gi} tx {tx_str}: receipt quorum failed (endpoints disagree or errors)"
                )
                continue
            if norm is None:
                rows.append(
                    {
                        **base,
                        "tx_hash": tx_str,
                        "row_result": "receipt_null",
                        "rpc_receipt_quorum": q_meta,
                        "block_number_hex": None,
                        "gas_used_hex": None,
                        "status_hex": None,
                        "transaction_index_hex": None,
                        "receipt_normalized": None,
                    }
                )
                blocking.append(f"global_index {gi} tx {tx_str}: receipt not found (pending or unknown)")
                continue
        else:
            try:
                raw_rec = _fetch_receipt(rpc_urls[0], tx_str, rid, backoff=bf)
                rid += 1
            except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
                rows.append(
                    {
                        **base,
                        "tx_hash": tx_str,
                        "row_result": "rpc_error",
                        "rpc_error": str(e),
                        "block_number_hex": None,
                        "gas_used_hex": None,
                        "status_hex": None,
                        "transaction_index_hex": None,
                        "receipt_normalized": None,
                    }
                )
                blocking.append(f"global_index {gi} tx {tx_str}: {e}")
                continue

            if raw_rec is None:
                rows.append(
                    {
                        **base,
                        "tx_hash": tx_str,
                        "row_result": "receipt_null",
                        "block_number_hex": None,
                        "gas_used_hex": None,
                        "status_hex": None,
                        "transaction_index_hex": None,
                        "receipt_normalized": None,
                    }
                )
                blocking.append(f"global_index {gi} tx {tx_str}: receipt not found (pending or unknown)")
                continue

            norm = _normalize_receipt_object(raw_rec)

        assert norm is not None
        th = norm.get("transactionHash") or norm.get("transaction_hash")
        if isinstance(th, str) and th.lower() != tx_str.lower():
            blocking.append(f"global_index {gi}: receipt.transactionHash mismatch vs step.tx_hash")

        bn = _normalize_hex_scalar(norm.get("blockNumber"))
        gu = _normalize_hex_scalar(norm.get("gasUsed"))
        st = _normalize_hex_scalar(norm.get("status"))
        ti = _normalize_hex_scalar(norm.get("transactionIndex"))

        if st is None:
            row_result = "status_missing"
            blocking.append(f"global_index {gi} tx {tx_str}: receipt missing status")
        elif st in ("0x0", "0x00"):
            row_result = "reverted"
            blocking.append(f"global_index {gi} tx {tx_str}: status {st}")
        elif str(st).lower() in ("0x1", "0x01", "1"):
            row_result = "ok"
        else:
            row_result = "status_unexpected"
            blocking.append(f"global_index {gi} tx {tx_str}: unexpected status {st!r}")

        row_out: dict[str, Any] = {
            **base,
            "tx_hash": tx_str,
            "row_result": row_result,
            "block_number_hex": bn,
            "gas_used_hex": gu,
            "status_hex": st,
            "transaction_index_hex": ti,
            "receipt_normalized": norm,
        }
        if quorum_multi and rec_obs is not None:
            row_out["rpc_receipt_quorum"] = {
                "observations": rec_obs,
                "quorum_ok": True,
                "disagreement": rec_disagree,
            }

        if finality_on and row_result == "ok":
            rec_bn_i = _hex_to_int(bn)
            rbh = norm.get("blockHash") if isinstance(norm, dict) else None
            rbh_s = str(rbh).strip() if rbh is not None else ""
            finality_gate_ok = False
            confirmations: int | None = None
            head_bn_hex: str | None = head_bn_hex_g
            reorg_mismatch = False
            if rec_bn_i is None:
                blocking.append(f"global_index {gi} tx {tx_str}: finality gate needs receipt blockNumber")
            else:
                assert head_bn_i_g is not None
                try:
                    confirmations = head_bn_i_g - rec_bn_i + 1
                    if confirmations < min_confirmations:
                        blocking.append(
                            f"global_index {gi} tx {tx_str}: confirmations {confirmations} "
                            f"< required {min_confirmations} (head_tag={finality_head_block_tag!r})"
                        )

                    blk_hex = bn if isinstance(bn, str) else str(bn or "")
                    canon_obs: list[dict[str, Any]] | None = None
                    canon_dis = False
                    if quorum_multi:
                        canon_blk, canon_obs, rid, canon_dis = _get_block_quorum(
                            rpc_urls,
                            blk_hex,
                            rid,
                            ctx="eth_getBlockByNumber(receipt_block)",
                            backoff=bf,
                        )
                        row_out["rpc_canonical_block_quorum"] = {
                            "block_param": blk_hex,
                            "observations": canon_obs,
                            "disagreement": canon_dis,
                        }
                    else:
                        resp_canon = _json_rpc(rpc_urls[0], "eth_getBlockByNumber", [blk_hex, False], rid, backoff=bf)
                        rid += 1
                        canon_blk = _rpc_require_result(resp_canon, ctx="eth_getBlockByNumber(receipt_block)")
                    if isinstance(canon_blk, dict):
                        ch = canon_blk.get("hash")
                        if rbh_s and ch and str(ch).lower() != rbh_s.lower():
                            reorg_mismatch = True
                            blocking.append(
                                f"global_index {gi} tx {tx_str}: reorg risk — canonical block hash at "
                                f"{blk_hex!r} != receipt.blockHash (node head may have reorganized)"
                            )
                    if canon_dis:
                        blocking.append(
                            f"global_index {gi} tx {tx_str}: RPC endpoints disagreed on "
                            f"eth_getBlockByNumber({blk_hex!r}) header (fork or lag)"
                        )
                except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
                    blocking.append(f"global_index {gi} tx {tx_str}: finality RPC failed: {e}")

                finality_gate_ok = confirmations is not None and confirmations >= min_confirmations and not reorg_mismatch

            row_out["finality_min_confirmations_required"] = min_confirmations
            row_out["finality_head_block_tag"] = finality_head_block_tag
            row_out["finality_confirmations_observed"] = confirmations
            row_out["finality_head_block_number_hex"] = head_bn_hex
            row_out["reorg_block_hash_mismatch"] = reorg_mismatch
            row_out["finality_gate_ok"] = finality_gate_ok

        rows.append(row_out)

    verdict = "GO" if not blocking else "NO_GO"
    b303_meta = require_b303_metadata_if_b287_active(
        b287_manual_override, tool_label="region_vault_claim_broadcast_receipt_archive"
    )
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    report: dict[str, Any] = {
        "anchor": ARCHIVE_ANCHOR,
        "rule_version": ARCHIVE_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "generated_at_utc": generated,
        "source_execution_report_canonical_sha256_hex": hashlib.sha256(raw_report_bytes).hexdigest(),
        "source_execution_report_anchor": execution_report.get("anchor"),
        "source_execution_report_rule_version": execution_report.get("rule_version"),
        "source_execution_report_execution_verdict": execution_report.get("execution_verdict"),
        "rpc_url_redacted": _redact_rpc_url(rpc_url),
        "chain_id_hex_observed": chain_rpc,
        "strict_chain_id_enforced": strict_chain_id,
        "archive_rows": rows,
        "archive_blocking_reasons": blocking,
        "archive_verdict": verdict,
        "notes": "B-263: single-file receipt SSOT for downstream reconcile / indexer TT; re-fetch via RPC at archive time.",
        "b283_receipt_rpc_backoff": {
            "mother_table": B283_MOTHER_TABLE,
            "implementation_tt": B283_IMPLEMENTATION_TT,
            "enabled": bool(bf.enabled and bf.max_retries >= 1),
            "max_retries": bf.max_retries,
            "base_delay_s": bf.base_delay_s,
            "max_delay_s": bf.max_delay_s,
            "factor": bf.factor,
            "retryable": "HTTP 429, 5xx, TimeoutError, URLError/OSError timeouts and common transient connection errors",
        },
    }
    if b300_meta is not None:
        report["b300_mainnet_dual_control"] = b300_meta
    if b287_manual_override is not None:
        report["b287_manual_override"] = b287_manual_override
    if b303_meta is not None:
        report["b303_break_glass_roles"] = b303_meta
    if b305_meta is not None:
        report["b305_rpc_host_allowlist"] = b305_meta
    report["b289_reorg_receipt_invalidation_note"] = _b289_reorg_receipt_invalidation_note(
        finality_on=finality_on,
        finality_head_block_tag=finality_head_block_tag,
        min_confirmations=min_confirmations,
        env_head_override_applied=b289_env_head_override_applied,
    )
    if b293_finality_mode_resolution is not None:
        report["b293_finality_mode_resolution"] = b293_finality_mode_resolution

    if quorum_multi:
        report["rpc_endpoint_count"] = len(rpc_urls)
        report["rpc_urls_redacted"] = [_redact_rpc_url(u) for u in rpc_urls]
        qev: dict[str, Any] = {
            "implementation_tt": QUORUM_IMPLEMENTATION_TT,
            "enabled": True,
            "endpoint_count": len(rpc_urls),
            "quorum_rule": "strict_majority",
            "chain_id_quorum": {
                "observations": chain_quorum_obs,
                "disagreement": chain_quorum_disagree,
            },
            "notes": (
                "Strict majority across JSON-RPC endpoints for eth_chainId, eth_getTransactionReceipt, "
                "and finality-related eth_getBlockByNumber (head + receipt block). Primary URL is --rpc-url / first list entry."
            ),
        }
        if finality_on:
            qev["head_anchor_quorum"] = {
                "head_tag": finality_head_block_tag,
                "observations": head_quorum_obs,
                "disagreement": head_quorum_disagree,
            }
        report["rpc_quorum_evidence"] = qev

    if finality_on:
        ok_rows = [r for r in rows if r.get("row_result") == "ok"]
        all_ok = bool(ok_rows) and all(r.get("finality_gate_ok") is True for r in ok_rows)
        assert head_bn_i_g is not None and head_hash_g is not None and head_bn_hex_g is not None
        fe: dict[str, Any] = {
            "implementation_tt": "TT-B278-BROADCAST-EVIDENCE-FINALITY-REORG-GATE-001",
            "enabled": True,
            "min_confirmations": min_confirmations,
            "head_tag": finality_head_block_tag,
            "head_block_tag": finality_head_block_tag,
            "head_number": head_bn_i_g,
            "head_block_number_hex": head_bn_hex_g,
            "head_hash": head_hash_g,
            "all_rows_finality_ok": all_ok,
        }
        if quorum_multi:
            fe["rpc_endpoint_count"] = len(rpc_urls)
            fe["head_quorum_disagreement"] = head_quorum_disagree
        report["finality_evidence"] = fe

    canon = {k: v for k, v in report.items() if k != "receipt_archive_canonical_sha256_hex"}
    report["receipt_archive_canonical_sha256_hex"] = _sha256_canonical_json(canon)
    if allow_partial_archive and verdict == "NO_GO":
        # still emit file; caller uses exit 0 via flag
        pass
    return report


def _receipt_rpc_backoff_from_args(args: argparse.Namespace) -> ReceiptRpcBackoffConfig:
    mr = int(args.receipt_rpc_backoff_retries)
    if mr <= 0:
        return ReceiptRpcBackoffConfig(enabled=False, max_retries=0)
    return ReceiptRpcBackoffConfig(
        enabled=True,
        max_retries=mr,
        base_delay_s=float(args.receipt_rpc_backoff_base_s),
        max_delay_s=float(args.receipt_rpc_backoff_max_s),
        factor=float(args.receipt_rpc_backoff_factor),
    )


def _cmd_archive_receipts(args: argparse.Namespace) -> int:
    raw = Path(args.execution_report).read_bytes()
    er = json.loads(raw.decode("utf-8"))
    rpc_url = (args.rpc_url or os.environ.get("CHAIN_RPC_URL") or "").strip()
    if not rpc_url:
        print("archive-receipts: FAIL: need --rpc-url or CHAIN_RPC_URL", file=sys.stderr)
        return 1
    min_c = int(args.min_confirmations)
    head_cli_supplied = hasattr(args, "finality_head_tag")
    head_tag = str(getattr(args, "finality_head_tag", "latest"))
    b289_env_applied = False
    b293_meta: dict[str, Any] | None = None
    env_mode_raw = os.environ.get(FINALITY_MODE_ENV)
    if getattr(args, "finality_head_tag_from_env", False):
        if min_c <= 0:
            print(
                "archive-receipts: FAIL: --finality-head-tag-from-env requires --min-confirmations > 0 (B-289)",
                file=sys.stderr,
            )
            return 1
        et = os.environ.get(B289_FINALITY_HEAD_ENV, "").strip().lower()
        if et not in ("safe", "finalized"):
            print(
                "archive-receipts: FAIL: "
                f"{B289_FINALITY_HEAD_ENV} must be 'safe' or 'finalized' (got {et!r}) when using --finality-head-tag-from-env",
                file=sys.stderr,
            )
            return 1
        head_tag = et
        b289_env_applied = True
        norm_m, pe = normalized_rpc_head_tag_from_finality_mode(env_mode_raw)
        b293_meta = build_b293_resolution_dict(
            tool="archive_receipts",
            env_raw=env_mode_raw,
            normalized_tag=norm_m,
            mode_parsed_ok=pe is None,
            parse_error=pe,
            cli_head_tag_supplied=head_cli_supplied,
            b289_env_override_active=True,
            effective_head_tag=head_tag,
            applied_traveltrust_finality_mode_default=False,
        )
    elif min_c > 0 and not head_cli_supplied:
        norm_m, pe = normalized_rpc_head_tag_from_finality_mode(env_mode_raw)
        if pe:
            print(f"archive-receipts: FAIL: {pe}", file=sys.stderr)
            return 1
        applied_b293 = norm_m is not None
        if norm_m is not None:
            head_tag = norm_m
        b293_meta = build_b293_resolution_dict(
            tool="archive_receipts",
            env_raw=env_mode_raw,
            normalized_tag=norm_m,
            mode_parsed_ok=True,
            parse_error=None,
            cli_head_tag_supplied=head_cli_supplied,
            b289_env_override_active=False,
            effective_head_tag=head_tag,
            applied_traveltrust_finality_mode_default=applied_b293,
        )
    else:
        norm_m, pe = normalized_rpc_head_tag_from_finality_mode(env_mode_raw)
        b293_meta = build_b293_resolution_dict(
            tool="archive_receipts",
            env_raw=env_mode_raw,
            normalized_tag=norm_m,
            mode_parsed_ok=pe is None,
            parse_error=pe,
            cli_head_tag_supplied=head_cli_supplied,
            b289_env_override_active=False,
            effective_head_tag=head_tag,
            applied_traveltrust_finality_mode_default=False,
        )
    try:
        b287_meta = b287_block_for_allow_non_go(
            {"allow_non_go_execution_report": bool(args.allow_non_go_execution_report)},
            tool_label="region_vault_claim_broadcast_receipt_archive",
        )
        extras = list(args.extra_rpc_url) if args.extra_rpc_url else None
        out = run_receipt_archive(
            er,
            raw,
            rpc_url,
            require_execution_go=not args.allow_non_go_execution_report,
            strict_chain_id=args.strict_chain_id,
            allow_partial_archive=args.allow_partial_archive,
            min_confirmations=min_c,
            finality_head_block_tag=head_tag,
            extra_rpc_urls=extras,
            receipt_fetch_backoff=_receipt_rpc_backoff_from_args(args),
            b287_manual_override=b287_meta,
            b289_env_head_override_applied=b289_env_applied,
            b293_finality_mode_resolution=b293_meta,
        )
    except ValueError as e:
        print(f"archive-receipts: FAIL: {e}", file=sys.stderr)
        return 1
    outp = Path(args.output)
    outp.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {args.output}", file=sys.stderr)
    if out.get("archive_verdict") != "GO":
        print(f"archive-receipts: archive_verdict={out.get('archive_verdict')!r}", file=sys.stderr)
        return 0 if args.allow_partial_archive else 1
    print("region_vault_claim_broadcast_receipt_archive: OK", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    tx = "0x" + "ab" * 32
    fake_report = {
        "anchor": SOURCE_EXECUTION_ANCHOR,
        "rule_version": SOURCE_EXECUTION_RULE_VERSION,
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
    raw = json.dumps(fake_report, ensure_ascii=False).encode("utf-8")

    class _Handler(BaseHTTPRequestHandler):
        def log_message(self, _fmt: str, *_args: Any) -> None:
            return

        def do_POST(self) -> None:
            ln = int(self.headers.get("Content-Length") or "0")
            body = self.rfile.read(ln)
            req = json.loads(body.decode("utf-8"))
            mid = req.get("id", 1)
            method = req.get("method")
            params = req.get("params") or []
            if method == "eth_chainId":
                out = {"jsonrpc": "2.0", "id": mid, "result": "0x7a69"}
            elif method == "eth_getTransactionReceipt":
                th = str(params[0]) if params else ""
                out = {
                    "jsonrpc": "2.0",
                    "id": mid,
                    "result": {
                        "transactionHash": th,
                        "blockNumber": "0x4a",
                        "blockHash": "0x" + "11" * 32,
                        "gasUsed": "0x5208",
                        "status": "0x1",
                        "transactionIndex": "0x0",
                        "cumulativeGasUsed": "0x5208",
                        "logs": [],
                    },
                }
            elif method == "eth_getBlockByNumber":
                tag_or_num = params[0] if params else "latest"
                if tag_or_num in ("latest", "safe", "finalized"):
                    out = {
                        "jsonrpc": "2.0",
                        "id": mid,
                        "result": {
                            "number": "0x54",
                            "hash": "0x" + "22" * 32,
                        },
                    }
                else:
                    out = {
                        "jsonrpc": "2.0",
                        "id": mid,
                        "result": {
                            "number": tag_or_num,
                            "hash": "0x" + "11" * 32,
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
    srv2: HTTPServer | None = None
    try:
        rpc = f"http://127.0.0.1:{port}/"
        arch = run_receipt_archive(
            fake_report,
            raw,
            rpc,
            require_execution_go=True,
            strict_chain_id=True,
            allow_partial_archive=False,
        )
        assert arch["anchor"] == ARCHIVE_ANCHOR
        assert arch["archive_verdict"] == "GO"
        assert len(arch["archive_rows"]) == 1
        r0 = arch["archive_rows"][0]
        assert r0["row_result"] == "ok"
        assert r0["block_number_hex"] == "0x4a"
        assert r0["gas_used_hex"] == "0x5208"
        assert r0["status_hex"] == "0x1"
        assert r0["receipt_normalized"] is not None
        b283_d = arch.get("b283_receipt_rpc_backoff") or {}
        assert b283_d.get("enabled") is True
        assert b283_d.get("implementation_tt") == B283_IMPLEMENTATION_TT
        b289_0 = arch.get("b289_reorg_receipt_invalidation_note") or {}
        assert b289_0.get("implementation_tt") == B289_IMPLEMENTATION_TT
        assert b289_0.get("finality_enabled") is False
        assert b289_0.get("env_head_override_applied") is False

        arch_f = run_receipt_archive(
            fake_report,
            raw,
            rpc,
            require_execution_go=True,
            strict_chain_id=True,
            allow_partial_archive=False,
            min_confirmations=1,
            finality_head_block_tag="latest",
        )
        fe = arch_f.get("finality_evidence") or {}
        assert fe.get("enabled") is True
        assert fe.get("head_number") == 84
        assert fe.get("head_hash") == "0x" + "22" * 32
        assert fe.get("head_tag") == "latest"
        assert arch_f["archive_rows"][0].get("finality_gate_ok") is True
        assert arch_f["archive_verdict"] == "GO"
        b289_f = arch_f.get("b289_reorg_receipt_invalidation_note") or {}
        assert b289_f.get("finality_enabled") is True
        assert b289_f.get("finality_head_block_tag_effective") == "latest"
        assert b289_f.get("env_head_override_applied") is False

        arch_fin = run_receipt_archive(
            fake_report,
            raw,
            rpc,
            require_execution_go=True,
            strict_chain_id=True,
            allow_partial_archive=False,
            min_confirmations=1,
            finality_head_block_tag="finalized",
            b289_env_head_override_applied=True,
        )
        fe_fin = arch_fin.get("finality_evidence") or {}
        assert fe_fin.get("head_tag") == "finalized"
        b289_fin = arch_fin.get("b289_reorg_receipt_invalidation_note") or {}
        assert b289_fin.get("env_head_override_applied") is True
        assert b289_fin.get("finality_head_block_tag_effective") == "finalized"

        arch_fail = run_receipt_archive(
            fake_report,
            raw,
            rpc,
            require_execution_go=True,
            strict_chain_id=True,
            allow_partial_archive=False,
            min_confirmations=99,
            finality_head_block_tag="latest",
        )
        assert arch_fail["archive_verdict"] == "NO_GO"
        assert arch_fail["archive_rows"][0].get("finality_gate_ok") is False

        srv2 = HTTPServer(("127.0.0.1", 0), _Handler)
        port2 = srv2.server_address[1]
        Thread(target=srv2.serve_forever, daemon=True).start()
        rpc_b = f"http://127.0.0.1:{port2}/"
        arch_q = run_receipt_archive(
            fake_report,
            raw,
            rpc,
            require_execution_go=True,
            strict_chain_id=True,
            allow_partial_archive=False,
            min_confirmations=1,
            finality_head_block_tag="latest",
            extra_rpc_urls=[rpc_b],
        )
        qe = arch_q.get("rpc_quorum_evidence") or {}
        assert qe.get("implementation_tt") == QUORUM_IMPLEMENTATION_TT
        assert qe.get("endpoint_count") == 2
        assert arch_q["archive_verdict"] == "GO"
        rq = arch_q["archive_rows"][0].get("rpc_receipt_quorum") or {}
        assert rq.get("quorum_ok") is True
        assert arch_q["archive_rows"][0].get("rpc_canonical_block_quorum") is not None

        st_flaky: dict[str, int] = {"receipt_503": 0}

        class _Flaky503ReceiptHandler(BaseHTTPRequestHandler):
            def log_message(self, _fmt: str, *_args: Any) -> None:
                return

            def do_POST(self) -> None:
                ln = int(self.headers.get("Content-Length") or "0")
                body = self.rfile.read(ln)
                req = json.loads(body.decode("utf-8"))
                mid = req.get("id", 1)
                method = req.get("method")
                params = req.get("params") or []
                if method == "eth_chainId":
                    out = {"jsonrpc": "2.0", "id": mid, "result": "0x7a69"}
                elif method == "eth_getTransactionReceipt":
                    st_flaky["receipt_503"] += 1
                    if st_flaky["receipt_503"] <= 2:
                        self.send_response(503)
                        self.send_header("Content-Type", "text/plain")
                        self.end_headers()
                        self.wfile.write(b"temporary")
                        return
                    th = str(params[0]) if params else ""
                    out = {
                        "jsonrpc": "2.0",
                        "id": mid,
                        "result": {
                            "transactionHash": th,
                            "blockNumber": "0x4a",
                            "blockHash": "0x" + "11" * 32,
                            "gasUsed": "0x5208",
                            "status": "0x1",
                            "transactionIndex": "0x0",
                            "cumulativeGasUsed": "0x5208",
                            "logs": [],
                        },
                    }
                else:
                    out = {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"unknown {method}"}}
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(out, separators=(",", ":")).encode("utf-8"))

        srv_flaky = HTTPServer(("127.0.0.1", 0), _Flaky503ReceiptHandler)
        pfl = srv_flaky.server_address[1]
        Thread(target=srv_flaky.serve_forever, daemon=True).start()
        rpc_flaky = f"http://127.0.0.1:{pfl}/"
        try:
            fast_backoff = ReceiptRpcBackoffConfig(
                max_retries=6,
                base_delay_s=0.01,
                max_delay_s=0.05,
                factor=2.0,
            )
            arch_b283 = run_receipt_archive(
                fake_report,
                raw,
                rpc_flaky,
                require_execution_go=True,
                strict_chain_id=True,
                allow_partial_archive=False,
                receipt_fetch_backoff=fast_backoff,
            )
            assert arch_b283["archive_verdict"] == "GO", arch_b283
            assert st_flaky["receipt_503"] == 3
            be = arch_b283.get("b283_receipt_rpc_backoff") or {}
            assert be.get("implementation_tt") == B283_IMPLEMENTATION_TT
            assert be.get("enabled") is True

            st_flaky["receipt_503"] = 0
            arch_b283_off = run_receipt_archive(
                fake_report,
                raw,
                rpc_flaky,
                require_execution_go=True,
                strict_chain_id=True,
                allow_partial_archive=False,
                receipt_fetch_backoff=ReceiptRpcBackoffConfig(enabled=False, max_retries=0),
            )
            assert arch_b283_off["archive_verdict"] == "NO_GO", arch_b283_off
            assert st_flaky["receipt_503"] == 1
            be_off = arch_b283_off.get("b283_receipt_rpc_backoff") or {}
            assert be_off.get("enabled") is False
        finally:
            srv_flaky.shutdown()

        class _BadReceiptHandler(BaseHTTPRequestHandler):
            def log_message(self, _fmt: str, *_args: Any) -> None:
                return

            def do_POST(self) -> None:
                ln = int(self.headers.get("Content-Length") or "0")
                body = self.rfile.read(ln)
                req = json.loads(body.decode("utf-8"))
                mid = req.get("id", 1)
                method = req.get("method")
                params = req.get("params") or []
                if method == "eth_chainId":
                    out = {"jsonrpc": "2.0", "id": mid, "result": "0x7a69"}
                elif method == "eth_getTransactionReceipt":
                    th = str(params[0]) if params else ""
                    out = {
                        "jsonrpc": "2.0",
                        "id": mid,
                        "result": {
                            "transactionHash": th,
                            "blockNumber": "0x4a",
                            "blockHash": "0x" + "ee" * 32,
                            "gasUsed": "0x5208",
                            "status": "0x1",
                            "transactionIndex": "0x0",
                            "cumulativeGasUsed": "0x5208",
                            "logs": [],
                        },
                    }
                elif method == "eth_getBlockByNumber":
                    tag_or_num = params[0] if params else "latest"
                    if tag_or_num in ("latest", "safe", "finalized"):
                        out = {
                            "jsonrpc": "2.0",
                            "id": mid,
                            "result": {"number": "0x54", "hash": "0x" + "22" * 32},
                        }
                    else:
                        out = {
                            "jsonrpc": "2.0",
                            "id": mid,
                            "result": {"number": tag_or_num, "hash": "0x" + "11" * 32},
                        }
                else:
                    out = {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"unknown {method}"}}
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(out, separators=(",", ":")).encode("utf-8"))

        srv_bad = HTTPServer(("127.0.0.1", 0), _BadReceiptHandler)
        pbad = srv_bad.server_address[1]
        Thread(target=srv_bad.serve_forever, daemon=True).start()
        rpc_bad = f"http://127.0.0.1:{pbad}/"
        try:
            arch_dis = run_receipt_archive(
                fake_report,
                raw,
                rpc,
                require_execution_go=True,
                strict_chain_id=True,
                allow_partial_archive=False,
                min_confirmations=1,
                finality_head_block_tag="latest",
                extra_rpc_urls=[rpc_bad],
            )
            assert arch_dis["archive_verdict"] == "NO_GO", arch_dis
            r0d = arch_dis["archive_rows"][0]
            assert r0d.get("row_result") == "rpc_error"
            assert "quorum" in str(r0d.get("rpc_error") or "").lower()
        finally:
            srv_bad.shutdown()

        script_path = Path(__file__).resolve()
        repo_root = script_path.parents[2]
        with tempfile.TemporaryDirectory() as td_env:
            er_path = Path(td_env) / "er.json"
            er_path.write_bytes(raw)
            out_path = Path(td_env) / "arch.json"
            env_clean = {
                k: v
                for k, v in os.environ.items()
                if k not in (B289_FINALITY_HEAD_ENV, FINALITY_MODE_ENV)
            }
            proc_bad_env = subprocess.run(
                [
                    sys.executable,
                    str(script_path),
                    "archive-receipts",
                    str(er_path),
                    "-o",
                    str(out_path),
                    "--rpc-url",
                    rpc,
                    "--min-confirmations",
                    "1",
                    "--finality-head-tag-from-env",
                ],
                cwd=str(repo_root),
                env=env_clean,
                capture_output=True,
                text=True,
            )
            assert proc_bad_env.returncode != 0, proc_bad_env.stderr
            proc_min0 = subprocess.run(
                [
                    sys.executable,
                    str(script_path),
                    "archive-receipts",
                    str(er_path),
                    "-o",
                    str(out_path),
                    "--rpc-url",
                    rpc,
                    "--min-confirmations",
                    "0",
                    "--finality-head-tag-from-env",
                ],
                cwd=str(repo_root),
                env=env_clean,
                capture_output=True,
                text=True,
            )
            assert proc_min0.returncode != 0, proc_min0.stderr
            env_ok = dict(env_clean)
            env_ok[B289_FINALITY_HEAD_ENV] = "finalized"
            proc_ok = subprocess.run(
                [
                    sys.executable,
                    str(script_path),
                    "archive-receipts",
                    str(er_path),
                    "-o",
                    str(out_path),
                    "--rpc-url",
                    rpc,
                    "--min-confirmations",
                    "1",
                    "--finality-head-tag-from-env",
                ],
                cwd=str(repo_root),
                env=env_ok,
                capture_output=True,
                text=True,
            )
            assert proc_ok.returncode == 0, proc_ok.stderr
            out_j = json.loads(out_path.read_text(encoding="utf-8"))
            n_out = out_j.get("b289_reorg_receipt_invalidation_note") or {}
            assert n_out.get("env_head_override_applied") is True
            assert (out_j.get("finality_evidence") or {}).get("head_tag") == "finalized"

            env_b293 = dict(env_clean)
            env_b293[FINALITY_MODE_ENV] = "safe"
            out_b293_path = Path(td_env) / "arch_b293.json"
            proc_b293 = subprocess.run(
                [
                    sys.executable,
                    str(script_path),
                    "archive-receipts",
                    str(er_path),
                    "-o",
                    str(out_b293_path),
                    "--rpc-url",
                    rpc,
                    "--min-confirmations",
                    "1",
                ],
                cwd=str(repo_root),
                env=env_b293,
                capture_output=True,
                text=True,
            )
            assert proc_b293.returncode == 0, proc_b293.stderr
            out_b293 = json.loads(out_b293_path.read_text(encoding="utf-8"))
            assert (out_b293.get("finality_evidence") or {}).get("head_tag") == "safe"
            b293r = out_b293.get("b293_finality_mode_resolution") or {}
            assert b293r.get("applied_traveltrust_finality_mode_default") is True
            assert b293r.get("implementation_tt") == "TT-B293-FINALITY-MODE-ENV-001"

            env_bad293 = dict(env_clean)
            env_bad293[FINALITY_MODE_ENV] = "typo-mode"
            proc_bad293 = subprocess.run(
                [
                    sys.executable,
                    str(script_path),
                    "archive-receipts",
                    str(er_path),
                    "-o",
                    str(out_path),
                    "--rpc-url",
                    rpc,
                    "--min-confirmations",
                    "1",
                ],
                cwd=str(repo_root),
                env=env_bad293,
                capture_output=True,
                text=True,
            )
            assert proc_bad293.returncode != 0, proc_bad293.stderr
    finally:
        if srv2 is not None:
            srv2.shutdown()
        srv.shutdown()

    print("region_vault_claim_broadcast_receipt_archive self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-263: receipt archive from B-262 execution_report (eth_getTransactionReceipt)."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    ar = sub.add_parser("archive-receipts", help="fetch receipts for each tx_hash in execution_steps")
    ar.add_argument("execution_report", help="B-262 execution_report JSON path")
    ar.add_argument("-o", "--output", required=True, help="receipt archive JSON path")
    ar.add_argument("--rpc-url", help="JSON-RPC HTTP endpoint (or set CHAIN_RPC_URL)")
    ar.add_argument(
        "--extra-rpc-url",
        action="append",
        dest="extra_rpc_url",
        default=None,
        metavar="URL",
        help="optional B-366: additional JSON-RPC URL for receipt/finality quorum (repeatable); default is single primary",
    )
    ar.add_argument(
        "--allow-non-go-execution-report",
        action="store_true",
        help="allow execution_verdict != GO; B-287: requires OVERRIDE_REASON env (non-empty) recorded in archive JSON",
    )
    ar.add_argument(
        "--strict-chain-id",
        action="store_true",
        help="require execution_report.chain_id_hex matches RPC eth_chainId when both present",
    )
    ar.add_argument(
        "--allow-partial-archive",
        action="store_true",
        help="write output even when archive_verdict is NO_GO; exit 0",
    )
    ar.add_argument(
        "--min-confirmations",
        type=int,
        default=0,
        help="optional finality gate (TT-B278): require inclusive confirmations vs eth_getBlockByNumber(tag); 0=off",
    )
    ar.add_argument(
        "--finality-head-tag",
        choices=("latest", "safe", "finalized"),
        default=argparse.SUPPRESS,
        help=(
            "head block tag when --min-confirmations > 0; omit to use TRAVELTRUST_FINALITY_MODE (B-293) or latest when mode off"
        ),
    )
    ar.add_argument(
        "--finality-head-tag-from-env",
        action="store_true",
        help=(
            f"B-289: when --min-confirmations > 0, set head tag from {B289_FINALITY_HEAD_ENV} "
            "(must be safe or finalized); overrides --finality-head-tag"
        ),
    )
    ar.add_argument(
        "--receipt-rpc-backoff-retries",
        type=int,
        default=8,
        metavar="N",
        help="B-283: max retries after classified transport failure (429/5xx/timeouts); 0 disables backoff",
    )
    ar.add_argument(
        "--receipt-rpc-backoff-base-s",
        type=float,
        default=0.25,
        metavar="SEC",
        help="B-283: initial sleep cap before retry (seconds)",
    )
    ar.add_argument(
        "--receipt-rpc-backoff-max-s",
        type=float,
        default=8.0,
        metavar="SEC",
        help="B-283: max sleep cap between retries (seconds)",
    )
    ar.add_argument(
        "--receipt-rpc-backoff-factor",
        type=float,
        default=2.0,
        metavar="R",
        help="B-283: exponential factor for sleep cap between retries",
    )
    ar.set_defaults(func=_cmd_archive_receipts)

    st = sub.add_parser("self-test", help="mock JSON-RPC + minimal execution_report")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    try:
        return int(args.func(args))
    except ValueError as e:
        print(f"archive-receipts: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
