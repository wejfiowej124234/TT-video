#!/usr/bin/env python3
# B-262: JSON-RPC eth_sendRawTransaction broadcast from B-256 broadcast_request_stub; report to disk.
# B-286 (EXTEND): optional stub raw-bytes SHA256 replay guard (env + ack and/or --expect-stub-sha256).
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from threading import Thread
from typing import Any

from region_vault_claim_broadcast_dryrun_rehearsal import BROADCAST_REQUEST_RULE_VERSION, run_rehearsal
from region_vault_claim_broadcast_chain_tip_lag_watch import validate_chain_tip_lag_report_ok
from region_vault_claim_broadcast_gas_fee_cap_preflight import validate_gas_fee_cap_report_ok
from region_vault_claim_broadcast_break_glass_roles_b303 import require_b303_metadata_if_b287_active
from region_vault_claim_broadcast_manual_override_b287 import b287_block_for_allow_non_go
from region_vault_claim_broadcast_rpc_host_allowlist_b305 import allowlist_evidence_or_none
from region_vault_claim_broadcast_eth_send_raw_rate_limit import build_eth_send_raw_rate_limit
from region_vault_claim_broadcast_mainnet_dual_control import enforce_mainnet_dual_control
from region_vault_claim_broadcast_nonce_preflight import (
    BROADCAST_REQUEST_ANCHOR,
    NONCE_PREFLIGHT_REPORT_ANCHOR,
    NONCE_PREFLIGHT_REPORT_RULE_VERSION,
)

EXECUTION_RULE_VERSION = "region_vault_claim_broadcast_execute_v1"
EXECUTION_REPORT_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-EXECUTION-REPORT-V1"
IMPLEMENTATION_TT = "TT-B262-14-REGIONVAULT-CLAIM-BROADCAST-EXECUTION-001"
MOTHER_TABLE = "B-262"

B286_IMPLEMENTATION_TT = "TT-B286-REPLAY-GUARD-STUB-CONTENT-HASH-001"
B286_MOTHER_TABLE = "B-286"
STUB_CONTENT_SHA256_ENV = "TRAVELTRUST_BROADCAST_STUB_CONTENT_SHA256_HEX"
STUB_REPLAY_GUARD_ACK_ENV = "TRAVELTRUST_BROADCAST_STUB_REPLAY_GUARD_ACK"


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


def _json_rpc(url: str, method: str, params: list[Any], req_id: int, timeout_s: float = 120.0) -> dict[str, Any]:
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


def _fetch_chain_id_hex(rpc_url: str) -> str:
    resp = _json_rpc(rpc_url, "eth_chainId", [], 1)
    r = _rpc_require_result(resp, ctx="eth_chainId")
    if not isinstance(r, str):
        raise ValueError("eth_chainId result must be hex string")
    return r


def _receipt_status_is_success(status: Any) -> bool:
    return status in ("0x1", "0x01", 1, "1")


def _fetch_receipt_dict_or_null(rpc_url: str, tx_hash: str, req_id: int) -> dict[str, Any] | None:
    resp = _json_rpc(rpc_url, "eth_getTransactionReceipt", [tx_hash], req_id)
    if "error" in resp and resp["error"] is not None:
        err = resp["error"]
        msg = str(err.get("message") or err) if isinstance(err, dict) else str(err)
        raise ValueError(f"eth_getTransactionReceipt resume: {msg}")
    r = resp.get("result")
    if r is None:
        return None
    if isinstance(r, dict):
        return r
    raise ValueError("eth_getTransactionReceipt resume: unexpected result type")


def _wait_receipt(
    rpc_url: str,
    tx_hash: str,
    *,
    timeout_s: float,
    poll_s: float,
) -> dict[str, Any] | None:
    deadline = time.monotonic() + timeout_s
    rid = 900_000
    while time.monotonic() < deadline:
        resp = _json_rpc(rpc_url, "eth_getTransactionReceipt", [tx_hash], rid)
        rid += 1
        rec = _rpc_require_result(resp, ctx="eth_getTransactionReceipt")
        if rec is not None:
            if isinstance(rec, dict):
                return rec
            raise ValueError("eth_getTransactionReceipt: unexpected result type")
        time.sleep(poll_s)
    return None


def _validate_resume_prior_execution_report(rep: dict[str, Any], raw_stub_bytes: bytes) -> None:
    if rep.get("anchor") != EXECUTION_REPORT_ANCHOR:
        raise ValueError(
            f"prior execution_report anchor must be {EXECUTION_REPORT_ANCHOR!r} (got {rep.get('anchor')!r})"
        )
    if str(rep.get("rule_version") or "") != EXECUTION_RULE_VERSION:
        raise ValueError(
            f"prior execution_report rule_version must be {EXECUTION_RULE_VERSION!r} "
            f"(got {rep.get('rule_version')!r})"
        )
    want = str(rep.get("source_broadcast_request_stub_sha256_hex") or "").lower()
    got = hashlib.sha256(raw_stub_bytes).hexdigest().lower()
    if not want or want != got:
        raise ValueError(
            "prior execution_report source_broadcast_request_stub_sha256_hex does not match "
            "current broadcast_request_stub file bytes (B-282 idempotent resume)"
        )


def _prior_step_matches_current_stub_step(prior: dict[str, Any], entry: dict[str, Any], gi: int) -> bool:
    if prior.get("global_index") != gi:
        return False
    if str(prior.get("batch_plan_id") or "") != str(entry.get("batch_plan_id") or ""):
        return False
    if prior.get("ordinal") != entry.get("ordinal"):
        return False
    pso = prior.get("signing_order")
    eso = entry.get("signing_order")
    if pso is not None and eso is not None and pso != eso:
        return False
    return True


def _prior_step_documented_mined_success(prior: dict[str, Any]) -> tuple[bool, str | None]:
    if str(prior.get("eth_sendRawTransaction") or "") != "submitted":
        return False, None
    tx = prior.get("tx_hash")
    if not isinstance(tx, str) or not tx.startswith("0x"):
        return False, None
    st = prior.get("receipt_status_hex")
    if not _receipt_status_is_success(st):
        return False, None
    return True, tx


def run_broadcast_execute(
    br: dict[str, Any],
    raw_stub_bytes: bytes,
    rpc_url: str,
    *,
    source_manifest: dict[str, Any] | None,
    require_operator_confirmation: bool,
    require_go_verdict: bool,
    dry_run: bool,
    skip_wait_receipt: bool,
    receipt_timeout_s: float,
    receipt_poll_s: float,
    resume_from_prior_execution_report: dict[str, Any] | None = None,
    signing_order_static_table_validated: bool = False,
    b286_replay_guard: dict[str, Any] | None = None,
    b287_manual_override: dict[str, Any] | None = None,
    b301_stub_integrity_verification: dict[str, Any] | None = None,
    b302_eth_send_raw_min_interval_ms: float | None = None,
) -> dict[str, Any]:
    rehearsal = run_rehearsal(
        br,
        source_manifest=source_manifest,
        require_operator_confirmation=require_operator_confirmation,
        require_go_verdict=require_go_verdict,
        emit_steps=False,
    )
    if not rehearsal.get("rehearsal_ok"):
        raise ValueError("internal: rehearsal_ok false")

    b305_meta: dict[str, Any] | None = None
    if (rpc_url or "").strip():
        b305_meta = allowlist_evidence_or_none(
            [rpc_url.strip()],
            tool_label="region_vault_claim_broadcast_execute",
        )

    global_seq = br.get("global_broadcast_sequence")
    if not isinstance(global_seq, list) or not global_seq:
        raise ValueError("global_broadcast_sequence must be non-empty array")

    b302_lim, b302_cfg = build_eth_send_raw_rate_limit(cli_min_interval_ms=b302_eth_send_raw_min_interval_ms)

    prior_by_gi: dict[int, dict[str, Any]] = {}
    if resume_from_prior_execution_report is not None:
        _validate_resume_prior_execution_report(resume_from_prior_execution_report, raw_stub_bytes)
        steps_in = resume_from_prior_execution_report.get("execution_steps")
        if isinstance(steps_in, list):
            for s in steps_in:
                if isinstance(s, dict) and isinstance(s.get("global_index"), int):
                    prior_by_gi[int(s["global_index"])] = s

    chain_id_hex = ""
    b300_meta: dict[str, Any] | None = None
    if not dry_run:
        chain_id_hex = _fetch_chain_id_hex(rpc_url)
        cid = _parse_chain_id_hex(chain_id_hex)
        b300_meta = enforce_mainnet_dual_control(cid, rpc_url_redacted=_redact_rpc_url(rpc_url))

    steps_out: list[dict[str, Any]] = []
    verdict = "GO"
    stop_reason: str | None = None

    for gi, entry in enumerate(global_seq):
        if not isinstance(entry, dict):
            raise ValueError(f"global_broadcast_sequence[{gi}] must be object")
        raw_hex = str(entry.get("signed_transaction_hex") or "")
        row: dict[str, Any] = {
            "global_index": gi,
            "batch_plan_id": str(entry.get("batch_plan_id") or ""),
            "ordinal": entry.get("ordinal"),
            "signing_order": entry.get("signing_order"),
            "signed_transaction_hex_byte_len": len(raw_hex.encode("utf-8")),
        }
        prior = prior_by_gi.get(gi)
        if prior is not None:
            if not _prior_step_matches_current_stub_step(prior, entry, gi):
                prior = None
            else:
                pbl = prior.get("signed_transaction_hex_byte_len")
                if isinstance(pbl, int) and pbl != row["signed_transaction_hex_byte_len"]:
                    prior = None
        if prior is not None:
            ok_doc, ptx = _prior_step_documented_mined_success(prior)
            if ok_doc and ptx:
                if dry_run:
                    row["eth_sendRawTransaction"] = "skipped_idempotent_resume_dry_run"
                    row["tx_hash"] = ptx
                    row["receipt_status_hex"] = prior.get("receipt_status_hex")
                    row["idempotent_resume"] = "trusted_prior_execution_report"
                    steps_out.append(row)
                    continue
                rec_chk = _fetch_receipt_dict_or_null(rpc_url, ptx, gi + 700_000)
                if rec_chk is not None and _receipt_status_is_success(rec_chk.get("status")):
                    st = rec_chk.get("status")
                    row["eth_sendRawTransaction"] = "skipped_idempotent_prior_mined"
                    row["tx_hash"] = ptx
                    row["receipt_status_hex"] = st if isinstance(st, str) else str(st) if st is not None else None
                    row["idempotent_resume"] = "eth_getTransactionReceipt_verified"
                    steps_out.append(row)
                    continue

        if dry_run:
            row["eth_sendRawTransaction"] = "skipped_dry_run"
            row["tx_hash"] = None
            row["receipt_status_hex"] = None
            steps_out.append(row)
            continue

        try:
            b302_lim.wait_before_send()
            try:
                resp = _json_rpc(rpc_url, "eth_sendRawTransaction", [raw_hex], gi + 100)
                tx_hash = _rpc_require_result(resp, ctx=f"eth_sendRawTransaction step {gi}")
                if not isinstance(tx_hash, str) or not tx_hash.startswith("0x"):
                    raise ValueError("unexpected tx hash shape")
                row["tx_hash"] = tx_hash
                row["eth_sendRawTransaction"] = "submitted"
            finally:
                b302_lim.mark_after_send_attempt()

            if not skip_wait_receipt:
                rec = _wait_receipt(
                    rpc_url,
                    tx_hash,
                    timeout_s=receipt_timeout_s,
                    poll_s=receipt_poll_s,
                )
                if rec is None:
                    row["receipt_status_hex"] = None
                    row["receipt_wait"] = "timeout"
                    verdict = "NO_GO"
                    stop_reason = f"step {gi}: receipt timeout for {tx_hash}"
                    steps_out.append(row)
                    break
                st = rec.get("status")
                row["receipt_status_hex"] = st if isinstance(st, str) else str(st) if st is not None else None
                if not _receipt_status_is_success(row["receipt_status_hex"]):
                    if row["receipt_status_hex"] in ("0x0", "0x00", 0, "0"):
                        verdict = "NO_GO"
                        stop_reason = f"step {gi}: receipt status reverted ({row['receipt_status_hex']})"
                        steps_out.append(row)
                        break
            else:
                row["receipt_status_hex"] = None
                row["receipt_wait"] = "skipped"

        except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError, OSError) as e:
            row["eth_sendRawTransaction"] = "error"
            row["rpc_error"] = str(e)
            row["tx_hash"] = None
            row["receipt_status_hex"] = None
            verdict = "NO_GO"
            stop_reason = f"step {gi}: {e}"
            steps_out.append(row)
            break

        steps_out.append(row)

    b303_meta = require_b303_metadata_if_b287_active(
        b287_manual_override, tool_label="region_vault_claim_broadcast_execute"
    )
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    report: dict[str, Any] = {
        "anchor": EXECUTION_REPORT_ANCHOR,
        "rule_version": EXECUTION_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "generated_at_utc": generated,
        "source_broadcast_request_stub_sha256_hex": hashlib.sha256(raw_stub_bytes).hexdigest(),
        "source_broadcast_request_anchor": br.get("anchor"),
        "source_broadcast_request_rule_version": br.get("rule_version"),
        "rpc_url_redacted": _redact_rpc_url(rpc_url) if rpc_url else None,
        "chain_id_hex": chain_id_hex or None,
        "dry_run": dry_run,
        "skip_wait_receipt": skip_wait_receipt,
        "require_operator_confirmation": require_operator_confirmation,
        "rehearsal_anchor": rehearsal.get("anchor"),
        "rehearsal_rule_version": rehearsal.get("rule_version"),
        "execution_steps": steps_out,
        "execution_verdict": verdict,
        "execution_stop_reason": stop_reason,
        "resume_from_execution_report_attached": resume_from_prior_execution_report is not None,
        "notes": "B-262: real RPC submit; prefer B-257 rehearsal + B-258 gate before live. Indexer/DB claim path remains separate TT.",
    }
    if b286_replay_guard is not None:
        report["b286_replay_guard"] = b286_replay_guard
    if b287_manual_override is not None:
        report["b287_manual_override"] = b287_manual_override
    if b303_meta is not None:
        report["b303_break_glass_roles"] = b303_meta
    if b301_stub_integrity_verification is not None:
        report["b301_stub_integrity_verification"] = b301_stub_integrity_verification
    if b300_meta is not None:
        report["b300_mainnet_dual_control"] = b300_meta
    b302_rep = dict(b302_cfg)
    b302_rep.update(b302_lim.evidence_tail())
    report["b302_eth_send_raw_rate_limit"] = b302_rep
    if signing_order_static_table_validated:
        report["signing_order_static_table_validated"] = True
    if b305_meta is not None:
        report["b305_rpc_host_allowlist"] = b305_meta
    canon = {k: v for k, v in report.items() if k != "execution_report_canonical_sha256_hex"}
    report["execution_report_canonical_sha256_hex"] = _sha256_canonical_json(canon)
    return report


def _b286_normalize_sha256_hex(label: str, s: str) -> str:
    h = s.strip().lower().removeprefix("0x")
    if len(h) != 64:
        raise ValueError(f"B-286 ({label}): SHA256 must be 64 hex chars (got {len(h)})")
    int(h, 16)
    return h


def _b286_evaluate_replay_guard(*, stub_raw_bytes: bytes, cli_expect_sha256: str | None) -> dict[str, Any] | None:
    """B-286: optional replay guard — env SHA requires TRAVELTRUST_BROADCAST_STUB_REPLAY_GUARD_ACK=1; CLI optional."""
    got = hashlib.sha256(stub_raw_bytes).hexdigest().lower()
    env_raw = os.environ.get(STUB_CONTENT_SHA256_ENV, "").strip()
    cli_raw = (cli_expect_sha256 or "").strip()

    modes: list[str] = []
    env_hex: str | None = None
    cli_hex: str | None = None

    if env_raw:
        if os.environ.get(STUB_REPLAY_GUARD_ACK_ENV, "").strip() != "1":
            raise ValueError(
                f"B-286: when {STUB_CONTENT_SHA256_ENV} is set, also set {STUB_REPLAY_GUARD_ACK_ENV}=1 "
                "before running execute (double human/env confirmation)"
            )
        env_hex = _b286_normalize_sha256_hex("env", env_raw)
        if env_hex != got:
            raise ValueError(
                f"B-286: stub bytes SHA256 {got} does not match {STUB_CONTENT_SHA256_ENV} (want {env_hex})"
            )
        modes.append("env_sha256_plus_ack")

    if cli_raw:
        cli_hex = _b286_normalize_sha256_hex("cli", cli_raw)
        if cli_hex != got:
            raise ValueError(
                f"B-286: stub bytes SHA256 {got} does not match --expect-stub-sha256 (want {cli_hex})"
            )
        modes.append("cli_expect_sha256")

    if env_hex is not None and cli_hex is not None and env_hex != cli_hex:
        raise ValueError(
            "B-286: --expect-stub-sha256 disagrees with "
            f"{STUB_CONTENT_SHA256_ENV} (resolve to a single expected hash before execute)"
        )

    if not modes:
        return None

    return {
        "mother_table": B286_MOTHER_TABLE,
        "implementation_tt": B286_IMPLEMENTATION_TT,
        "modes": modes,
        "stub_sha256_hex_observed": got,
        "expected_sha256_hex": env_hex or cli_hex or got,
        "replay_guard_ack_env": STUB_REPLAY_GUARD_ACK_ENV,
        "replay_guard_ack_seen": os.environ.get(STUB_REPLAY_GUARD_ACK_ENV, "").strip() if env_raw else None,
    }


def _validate_preflight_report_ok(*, preflight_report_path: Path, stub_raw_bytes: bytes) -> None:
    pr_raw = preflight_report_path.read_bytes()
    pr = json.loads(pr_raw.decode("utf-8"))
    if pr.get("anchor") != NONCE_PREFLIGHT_REPORT_ANCHOR:
        raise ValueError(
            f"preflight report anchor must be {NONCE_PREFLIGHT_REPORT_ANCHOR!r} (got {pr.get('anchor')!r})"
        )
    if str(pr.get("rule_version") or "") != NONCE_PREFLIGHT_REPORT_RULE_VERSION:
        raise ValueError(
            f"preflight report rule_version must be {NONCE_PREFLIGHT_REPORT_RULE_VERSION!r} "
            f"(got {pr.get('rule_version')!r})"
        )
    if str(pr.get("nonce_preflight_verdict") or "") != "GO":
        raise ValueError(
            f"nonce_preflight_verdict must be GO (got {pr.get('nonce_preflight_verdict')!r}); "
            "re-run B-276 preflight with matching stub"
        )
    want = str(pr.get("source_broadcast_request_stub_sha256_hex") or "").lower()
    got = hashlib.sha256(stub_raw_bytes).hexdigest().lower()
    if not want or want != got:
        raise ValueError(
            "preflight report source_broadcast_request_stub_sha256_hex does not match "
            "current broadcast_request_stub file bytes (stale report or wrong stub path)"
        )
    stored_hash = pr.get("preflight_report_canonical_sha256_hex")
    if not isinstance(stored_hash, str) or not stored_hash.strip():
        raise ValueError("preflight report missing or empty preflight_report_canonical_sha256_hex")
    canon = {k: v for k, v in pr.items() if k != "preflight_report_canonical_sha256_hex"}
    computed = _sha256_canonical_json(canon)
    if str(stored_hash).strip().lower() != computed.lower():
        raise ValueError(
            "preflight_report_canonical_sha256_hex mismatch (report tampered or wrong serialization)"
        )


def _cmd_execute(args: argparse.Namespace) -> int:
    raw = Path(args.broadcast_request_stub).read_bytes()
    br = json.loads(raw.decode("utf-8"))
    try:
        b286_meta = _b286_evaluate_replay_guard(
            stub_raw_bytes=raw,
            cli_expect_sha256=getattr(args, "expect_stub_sha256", None),
        )
        b287_meta = b287_block_for_allow_non_go(
            {"allow_non_go_execute": bool(args.allow_non_go_execute)},
            tool_label="region_vault_claim_broadcast_execute",
        )
    except ValueError as e:
        print(f"execute: FAIL: {e}", file=sys.stderr)
        return 1
    if args.require_preflight_ok:
        if not args.preflight_report:
            print(
                "execute: FAIL: --require-preflight-ok requires --preflight-report "
                "(B-276 nonce_preflight_report.json with GO + matching stub SHA)",
                file=sys.stderr,
            )
            return 1
        try:
            _validate_preflight_report_ok(preflight_report_path=Path(args.preflight_report), stub_raw_bytes=raw)
        except (ValueError, OSError, json.JSONDecodeError) as e:
            print(f"execute: FAIL: preflight report: {e}", file=sys.stderr)
            return 1
    if args.require_chain_tip_lag_ok:
        if not args.chain_tip_lag_report:
            print(
                "execute: FAIL: --require-chain-tip-lag-ok requires --chain-tip-lag-report "
                "(B-290 chain_tip_lag_watch JSON with GO + matching canonical SHA)",
                file=sys.stderr,
            )
            return 1
        try:
            validate_chain_tip_lag_report_ok(report_path=Path(args.chain_tip_lag_report))
        except (ValueError, OSError, json.JSONDecodeError) as e:
            print(f"execute: FAIL: chain tip lag report: {e}", file=sys.stderr)
            return 1
    if args.require_gas_fee_cap_ok:
        if not args.gas_fee_cap_report:
            print(
                "execute: FAIL: --require-gas-fee-cap-ok requires --gas-fee-cap-report "
                "(B-291 gas_fee_cap_preflight JSON with GO + stub SHA + canonical SHA)",
                file=sys.stderr,
            )
            return 1
        try:
            validate_gas_fee_cap_report_ok(report_path=Path(args.gas_fee_cap_report), stub_raw_bytes=raw)
        except (ValueError, OSError, json.JSONDecodeError) as e:
            print(f"execute: FAIL: gas fee cap report: {e}", file=sys.stderr)
            return 1
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
            print(f"execute: FAIL: B-301 stub signature: {e}", file=sys.stderr)
            return 1
        if str(b301_meta.get("verify_verdict") or "") != "GO":
            print(f"execute: FAIL: B-301 stub signature verify_verdict not GO: {b301_meta}", file=sys.stderr)
            return 1

    rpc_url = (args.rpc_url or os.environ.get("CHAIN_RPC_URL") or "").strip()
    if not args.dry_run and not rpc_url:
        print("execute: FAIL: need --rpc-url or CHAIN_RPC_URL (or use --dry-run)", file=sys.stderr)
        return 1

    resume_rep: dict[str, Any] | None = None
    if args.resume_from_execution_report:
        try:
            resume_rep = json.loads(Path(args.resume_from_execution_report).read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError) as e:
            print(f"execute: FAIL: --resume-from-execution-report: {e}", file=sys.stderr)
            return 1

    b277_validated = False
    if args.signing_order_static_table:
        from region_vault_claim_broadcast_signing_order_static import validate_signing_order_static_table_json

        try:
            tab_b277 = json.loads(Path(args.signing_order_static_table).read_text(encoding="utf-8"))
            validate_signing_order_static_table_json(tab_b277, raw)
        except (ValueError, OSError, UnicodeDecodeError, json.JSONDecodeError) as e:
            print(f"execute: FAIL: --signing-order-static-table (B-277): {e}", file=sys.stderr)
            return 1
        b277_validated = True

    try:
        report = run_broadcast_execute(
            br,
            raw,
            rpc_url,
            source_manifest=manifest,
            require_operator_confirmation=not args.skip_operator_confirmation,
            require_go_verdict=not args.allow_non_go_execute,
            dry_run=args.dry_run,
            skip_wait_receipt=args.skip_wait_receipt,
            receipt_timeout_s=float(args.receipt_timeout_s),
            receipt_poll_s=float(args.receipt_poll_s),
            resume_from_prior_execution_report=resume_rep,
            signing_order_static_table_validated=b277_validated,
            b286_replay_guard=b286_meta,
            b287_manual_override=b287_meta,
            b301_stub_integrity_verification=b301_meta,
            b302_eth_send_raw_min_interval_ms=args.eth_send_raw_min_interval_ms,
        )
    except ValueError as e:
        print(f"execute: FAIL: {e}", file=sys.stderr)
        return 1

    outp = Path(args.output)
    outp.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {args.output}", file=sys.stderr)
    if report.get("execution_verdict") != "GO":
        print(f"execute: execution_verdict={report.get('execution_verdict')!r} ({report.get('execution_stop_reason')})", file=sys.stderr)
        return 1
    print("region_vault_claim_broadcast_execute: OK", file=sys.stderr)
    return 0


def _embedded_self_test_minimal_broadcast_stub() -> tuple[dict[str, Any], bytes]:
    """Single-step B-256-shaped stub; only depends on scripts/ops (nonce RLP helper). No B-256 pipeline."""
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
            "schema_note": "embedded self-test",
            "confirmed_by_operator": True,
            "operator_id_placeholder": "op-b262-selftest",
            "confirmation_note": "embedded self-test",
            "confirmed_at_utc": "2026-04-14T12:00:00Z",
        },
    }
    raw = json.dumps(br, ensure_ascii=False).encode("utf-8")
    return br, raw


def _cmd_self_test(_: argparse.Namespace) -> int:
    import tempfile
    from pathlib import Path as P

    br, raw_stub = _embedded_self_test_minimal_broadcast_stub()

    seen_raw: list[str] = []

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
            elif method == "eth_sendRawTransaction":
                raw_h = str(params[0]) if params else ""
                seen_raw.append(raw_h)
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

    with tempfile.TemporaryDirectory() as td:
        root = P(td)

        # --dry-run without HTTP
        dr = run_broadcast_execute(
            br,
            raw_stub,
            "",
            source_manifest=None,
            require_operator_confirmation=True,
            require_go_verdict=True,
            dry_run=True,
            skip_wait_receipt=True,
            receipt_timeout_s=30.0,
            receipt_poll_s=0.05,
        )
        assert dr["execution_verdict"] == "GO"
        assert dr["anchor"] == EXECUTION_REPORT_ANCHOR
        assert len(dr["execution_steps"]) == 1
        assert dr.get("signing_order_static_table_validated") is None

        from region_vault_claim_broadcast_signing_order_static import (
            build_signing_order_static_table,
            validate_signing_order_static_table_json,
        )

        tab_b277 = build_signing_order_static_table(br, raw_stub)
        validate_signing_order_static_table_json(tab_b277, raw_stub)
        dr277 = run_broadcast_execute(
            br,
            raw_stub,
            "",
            source_manifest=None,
            require_operator_confirmation=True,
            require_go_verdict=True,
            dry_run=True,
            skip_wait_receipt=True,
            receipt_timeout_s=30.0,
            receipt_poll_s=0.05,
            signing_order_static_table_validated=True,
        )
        assert dr277.get("signing_order_static_table_validated") is True

        stub_path = root / "broadcast_request_stub.json"
        tab_path = root / "signing_order_static.json"
        stub_path.write_bytes(raw_stub)
        tab_path.write_text(json.dumps(tab_b277, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

        good_sha = hashlib.sha256(raw_stub).hexdigest()
        _b286_saved: dict[str, str] = {}
        for _ek in (STUB_CONTENT_SHA256_ENV, STUB_REPLAY_GUARD_ACK_ENV):
            if _ek in os.environ:
                _b286_saved[_ek] = os.environ.pop(_ek)
        try:
            assert _b286_evaluate_replay_guard(stub_raw_bytes=raw_stub, cli_expect_sha256=None) is None
            m_cli = _b286_evaluate_replay_guard(stub_raw_bytes=raw_stub, cli_expect_sha256=good_sha)
            assert m_cli is not None and m_cli.get("implementation_tt") == B286_IMPLEMENTATION_TT
            assert "cli_expect_sha256" in (m_cli.get("modes") or [])
            try:
                _b286_evaluate_replay_guard(stub_raw_bytes=raw_stub, cli_expect_sha256="f" * 64)
            except ValueError:
                pass
            else:
                raise AssertionError("B-286: wrong --expect-stub-sha256 must raise ValueError")
        finally:
            for _k, _v in _b286_saved.items():
                os.environ[_k] = _v

        srv = HTTPServer(("127.0.0.1", 0), _Handler)
        port = srv.server_address[1]
        th = Thread(target=srv.serve_forever, daemon=True)
        th.start()
        try:
            rpc = f"http://127.0.0.1:{port}/"
            ex = run_broadcast_execute(
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
            assert ex["execution_verdict"] == "GO"
            assert ex["chain_id_hex"] == "0x7a69"
            assert len(ex["execution_steps"]) == 1
            assert ex["execution_steps"][0].get("tx_hash", "").startswith("0x")
            assert seen_raw, "mock server should have seen eth_sendRawTransaction"
            n_send_after_first = len(seen_raw)
            ex_b282 = run_broadcast_execute(
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
                resume_from_prior_execution_report=ex,
            )
            assert ex_b282["execution_verdict"] == "GO"
            assert len(seen_raw) == n_send_after_first, "B-282 resume must not submit eth_sendRawTransaction again"
            assert ex_b282["execution_steps"][0].get("eth_sendRawTransaction") == "skipped_idempotent_prior_mined"
            assert ex_b282.get("resume_from_execution_report_attached") is True
        finally:
            srv.shutdown()

        from region_vault_claim_broadcast_nonce_preflight import build_nonce_preflight_report, run_nonce_preflight

        ok_pf, errs_pf, meta_pf = run_nonce_preflight(
            br,
            raw_stub,
            from_addr=None,
            rpc_urls=[],
            do_rpc=False,
            strict_stub_chain_id=False,
        )
        assert ok_pf and not errs_pf, errs_pf
        rep_pf = build_nonce_preflight_report(
            True,
            [],
            source_broadcast_request_stub_sha256_hex=meta_pf["source_broadcast_request_stub_sha256_hex"],
            source_broadcast_request_anchor=meta_pf["source_broadcast_request_anchor"],
            source_broadcast_request_rule_version=meta_pf["source_broadcast_request_rule_version"],
            rpc_preflight_performed=bool(meta_pf.get("rpc_preflight_performed")),
            chain_id_hex_observed=meta_pf.get("chain_id_hex_observed"),
            from_address_redacted=meta_pf.get("from_address_redacted"),
            nonce_rpc_quorum_evidence=meta_pf.get("nonce_rpc_quorum_evidence"),
        )
        pr_path = root / "nonce_preflight_report.json"
        pr_path.write_text(json.dumps(rep_pf, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        _validate_preflight_report_ok(preflight_report_path=pr_path, stub_raw_bytes=raw_stub)

        repo_root = Path(__file__).resolve().parents[2]
        exec_out = root / "execution_with_preflight.json"
        env = os.environ.copy()
        env["PYTHONPATH"] = str(Path(__file__).resolve().parent)
        proc = subprocess.run(
            [
                sys.executable,
                str(Path(__file__).resolve()),
                "execute",
                str(stub_path),
                "-o",
                str(exec_out),
                "--dry-run",
                "--require-preflight-ok",
                "--preflight-report",
                str(pr_path),
                "--signing-order-static-table",
                str(tab_path),
                "--skip-operator-confirmation",
            ],
            cwd=str(repo_root),
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )
        if proc.returncode != 0:
            print(proc.stdout, file=sys.stderr)
            print(proc.stderr, file=sys.stderr)
            raise AssertionError(f"execute --require-preflight-ok subprocess exit {proc.returncode}")
        ex_pf = json.loads(exec_out.read_text(encoding="utf-8"))
        assert ex_pf.get("execution_verdict") == "GO"
        assert ex_pf.get("signing_order_static_table_validated") is True

        from region_vault_claim_broadcast_chain_tip_lag_watch import run_chain_tip_lag_watch

        class _LagA(BaseHTTPRequestHandler):
            bn = "0xc8"

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

        class _LagB(_LagA):
            bn = "0xc9"

        srv_la = HTTPServer(("127.0.0.1", 0), _LagA)
        srv_lb = HTTPServer(("127.0.0.1", 0), _LagB)
        pla, plb = srv_la.server_address[1], srv_lb.server_address[1]
        Thread(target=srv_la.serve_forever, daemon=True).start()
        Thread(target=srv_lb.serve_forever, daemon=True).start()
        try:
            url_la = f"http://127.0.0.1:{pla}/"
            url_lb = f"http://127.0.0.1:{plb}/"
            rep_lag = run_chain_tip_lag_watch(url_la, url_lb, max_lag_blocks=3)
            lag_path = root / "chain_tip_lag_watch.json"
            lag_path.write_text(json.dumps(rep_lag, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            validate_chain_tip_lag_report_ok(report_path=lag_path)
            exec_lag = root / "execution_with_chain_tip_lag.json"
            proc_lag = subprocess.run(
                [
                    sys.executable,
                    str(Path(__file__).resolve()),
                    "execute",
                    str(stub_path),
                    "-o",
                    str(exec_lag),
                    "--dry-run",
                    "--require-preflight-ok",
                    "--preflight-report",
                    str(pr_path),
                    "--require-chain-tip-lag-ok",
                    "--chain-tip-lag-report",
                    str(lag_path),
                    "--signing-order-static-table",
                    str(tab_path),
                    "--skip-operator-confirmation",
                ],
                cwd=str(repo_root),
                env=env,
                capture_output=True,
                text=True,
                check=False,
            )
            assert proc_lag.returncode == 0, proc_lag.stderr
            bad_lag = run_chain_tip_lag_watch(url_la, url_lb, max_lag_blocks=0)
            bad_lag_path = root / "chain_tip_lag_watch_no_go.json"
            bad_lag_path.write_text(json.dumps(bad_lag, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            try:
                validate_chain_tip_lag_report_ok(report_path=bad_lag_path)
            except ValueError:
                pass
            else:
                raise AssertionError("B-290: NO_GO lag report must fail validate_chain_tip_lag_report_ok")
            proc_lag_bad = subprocess.run(
                [
                    sys.executable,
                    str(Path(__file__).resolve()),
                    "execute",
                    str(stub_path),
                    "-o",
                    str(root / "execution_lag_bad.json"),
                    "--dry-run",
                    "--require-chain-tip-lag-ok",
                    "--chain-tip-lag-report",
                    str(bad_lag_path),
                    "--skip-operator-confirmation",
                ],
                cwd=str(repo_root),
                env=env,
                capture_output=True,
                text=True,
                check=False,
            )
            assert proc_lag_bad.returncode != 0, proc_lag_bad.stderr
        finally:
            srv_la.shutdown()
            srv_lb.shutdown()

        from region_vault_claim_broadcast_gas_fee_cap_preflight import run_gas_fee_cap_preflight

        gas_br = json.loads(stub_path.read_text(encoding="utf-8"))
        gas_rep = run_gas_fee_cap_preflight(
            gas_br,
            raw_stub,
            "",
            max_fee_per_gas_ceiling_wei=10_000,
            fee_cap_over_fee_history_ratio=None,
            fee_history_block_count=5,
            fee_history_reward_percentile=50,
        )
        gas_path = root / "gas_fee_cap_preflight.json"
        gas_path.write_text(json.dumps(gas_rep, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        validate_gas_fee_cap_report_ok(report_path=gas_path, stub_raw_bytes=raw_stub)
        exec_gas = root / "execution_with_gas_fee_cap.json"
        proc_gas = subprocess.run(
            [
                sys.executable,
                str(Path(__file__).resolve()),
                "execute",
                str(stub_path),
                "-o",
                str(exec_gas),
                "--dry-run",
                "--require-preflight-ok",
                "--preflight-report",
                str(pr_path),
                "--require-gas-fee-cap-ok",
                "--gas-fee-cap-report",
                str(gas_path),
                "--signing-order-static-table",
                str(tab_path),
                "--skip-operator-confirmation",
            ],
            cwd=str(repo_root),
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )
        assert proc_gas.returncode == 0, proc_gas.stderr
        gas_rep_bad = run_gas_fee_cap_preflight(
            gas_br,
            raw_stub,
            "",
            max_fee_per_gas_ceiling_wei=0,
            fee_cap_over_fee_history_ratio=None,
            fee_history_block_count=5,
            fee_history_reward_percentile=50,
        )
        gas_bad_path = root / "gas_fee_cap_preflight_no_go.json"
        gas_bad_path.write_text(json.dumps(gas_rep_bad, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        try:
            validate_gas_fee_cap_report_ok(report_path=gas_bad_path, stub_raw_bytes=raw_stub)
        except ValueError:
            pass
        else:
            raise AssertionError("B-291: NO_GO gas report must fail validate_gas_fee_cap_report_ok")
        proc_gas_bad = subprocess.run(
            [
                sys.executable,
                str(Path(__file__).resolve()),
                "execute",
                str(stub_path),
                "-o",
                str(root / "execution_gas_bad.json"),
                "--dry-run",
                "--require-gas-fee-cap-ok",
                "--gas-fee-cap-report",
                str(gas_bad_path),
                "--skip-operator-confirmation",
            ],
            cwd=str(repo_root),
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )
        assert proc_gas_bad.returncode != 0, proc_gas_bad.stderr

        ex_b286_path = root / "execution_b286_env.json"
        env286 = os.environ.copy()
        env286["PYTHONPATH"] = str(Path(__file__).resolve().parent)
        env286[STUB_CONTENT_SHA256_ENV] = good_sha
        env286[STUB_REPLAY_GUARD_ACK_ENV] = "1"
        exe_py = str(Path(__file__).resolve())
        p286 = subprocess.run(
            [
                sys.executable,
                exe_py,
                "execute",
                str(stub_path),
                "-o",
                str(ex_b286_path),
                "--dry-run",
                "--skip-operator-confirmation",
            ],
            cwd=str(repo_root),
            env=env286,
            capture_output=True,
            text=True,
            check=False,
        )
        assert p286.returncode == 0, p286.stderr
        doc286 = json.loads(ex_b286_path.read_text(encoding="utf-8"))
        g286 = doc286.get("b286_replay_guard") or {}
        assert g286.get("stub_sha256_hex_observed") == good_sha.lower()
        assert "env_sha256_plus_ack" in (g286.get("modes") or [])

        env286_bad = dict(env286)
        env286_bad[STUB_CONTENT_SHA256_ENV] = "0" * 64
        p_bad = subprocess.run(
            [
                sys.executable,
                exe_py,
                "execute",
                str(stub_path),
                "-o",
                str(root / "execution_b286_bad.json"),
                "--dry-run",
                "--skip-operator-confirmation",
            ],
            cwd=str(repo_root),
            env=env286_bad,
            capture_output=True,
            text=True,
            check=False,
        )
        assert p_bad.returncode != 0

        env286_na = dict(env286)
        del env286_na[STUB_REPLAY_GUARD_ACK_ENV]
        p_na = subprocess.run(
            [
                sys.executable,
                exe_py,
                "execute",
                str(stub_path),
                "-o",
                str(root / "execution_b286_no_ack.json"),
                "--dry-run",
                "--skip-operator-confirmation",
            ],
            cwd=str(repo_root),
            env=env286_na,
            capture_output=True,
            text=True,
            check=False,
        )
        assert p_na.returncode != 0

        ex_cli_path = root / "execution_b286_cli_only.json"
        p_cli = subprocess.run(
            [
                sys.executable,
                exe_py,
                "execute",
                str(stub_path),
                "-o",
                str(ex_cli_path),
                "--dry-run",
                "--skip-operator-confirmation",
                "--expect-stub-sha256",
                good_sha,
            ],
            cwd=str(repo_root),
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )
        assert p_cli.returncode == 0, p_cli.stderr
        doc_cli = json.loads(ex_cli_path.read_text(encoding="utf-8"))
        assert "cli_expect_sha256" in (doc_cli.get("b286_replay_guard") or {}).get("modes", [])

        br_ng = json.loads(json.dumps(br))
        br_ng["input_reconcile_verdict_preview"] = "NO_GO"
        stub_ng = root / "stub_preview_no_go.json"
        stub_ng.write_text(json.dumps(br_ng, ensure_ascii=False), encoding="utf-8")
        out_ng = root / "exec_allow_preview_no_go.json"
        env_ng_fail = dict(env)
        env_ng_fail.pop("OVERRIDE_REASON", None)
        p_ng_fail = subprocess.run(
            [
                sys.executable,
                exe_py,
                "execute",
                str(stub_ng),
                "-o",
                str(out_ng),
                "--dry-run",
                "--skip-operator-confirmation",
                "--allow-non-go-execute",
            ],
            cwd=str(repo_root),
            env=env_ng_fail,
            capture_output=True,
            text=True,
            check=False,
        )
        assert p_ng_fail.returncode != 0, p_ng_fail.stderr
        env_ng_ok = dict(env)
        env_ng_ok["OVERRIDE_REASON"] = "B-287 execute self-test: allow NO_GO preview with audited reason."
        env_ng_ok["TRAVELTRUST_B303_BREAK_GLASS_ACK"] = "1"
        env_ng_ok["TRAVELTRUST_B303_APPROVER_PRINCIPAL"] = "self-test-approver"
        env_ng_ok["TRAVELTRUST_B303_BREAK_GLASS_TICKET_ID"] = "B-303-EXEC-SELFTEST"
        p_ng_ok = subprocess.run(
            [
                sys.executable,
                exe_py,
                "execute",
                str(stub_ng),
                "-o",
                str(out_ng),
                "--dry-run",
                "--skip-operator-confirmation",
                "--allow-non-go-execute",
            ],
            cwd=str(repo_root),
            env=env_ng_ok,
            capture_output=True,
            text=True,
            check=False,
        )
        assert p_ng_ok.returncode == 0, p_ng_ok.stderr
        js_ng = json.loads(out_ng.read_text(encoding="utf-8"))
        assert js_ng.get("b287_manual_override", {}).get("implementation_tt") == "TT-B287-MANUAL-OVERRIDE-WITH-JUSTIFICATION-001"
        assert js_ng.get("b303_break_glass_roles", {}).get("implementation_tt") == "TT-B303-BREAK-GLASS-AND-ROLLBACK-ROLES-001"

    print("region_vault_claim_broadcast_execute self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-262: JSON-RPC broadcast from B-256 broadcast_request_stub (eth_sendRawTransaction)."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    ex = sub.add_parser("execute", help="validate stub (B-257 rules) then submit txs or dry-run")
    ex.add_argument("broadcast_request_stub", help="B-256 broadcast_request_stub JSON path")
    ex.add_argument("-o", "--output", required=True, help="execution report JSON path")
    ex.add_argument("--rpc-url", help="JSON-RPC HTTP endpoint (or set CHAIN_RPC_URL)")
    ex.add_argument(
        "--dry-run",
        action="store_true",
        help="run B-257 validation only; do not call RPC",
    )
    ex.add_argument(
        "--skip-operator-confirmation",
        action="store_true",
        help="do not require operator_confirmation human fields (CI / structural only)",
    )
    ex.add_argument(
        "--allow-non-go-execute",
        action="store_true",
        help=(
            "allow input_reconcile_verdict_preview != GO (non-standard); B-287: requires OVERRIDE_REASON "
            "env (non-empty) recorded in execution_report JSON"
        ),
    )
    ex.add_argument(
        "--source-manifest",
        help="optional manifest JSON; if set, SHA and ordinals must match stub (B-257 cross-check)",
    )
    ex.add_argument(
        "--skip-wait-receipt",
        action="store_true",
        help="after eth_sendRawTransaction, do not poll eth_getTransactionReceipt",
    )
    ex.add_argument(
        "--receipt-timeout-s",
        type=float,
        default=180.0,
        help="max seconds to wait per tx for receipt (default 180)",
    )
    ex.add_argument(
        "--receipt-poll-s",
        type=float,
        default=0.25,
        help="poll interval for eth_getTransactionReceipt (default 0.25)",
    )
    ex.add_argument(
        "--require-preflight-ok",
        action="store_true",
        help="require B-276 nonce_preflight_report.json (--preflight-report) with GO + stub SHA match (CI/mainnet)",
    )
    ex.add_argument(
        "--preflight-report",
        help="path to nonce_preflight_report.json from region_vault_claim_broadcast_nonce_preflight.py -o",
    )
    ex.add_argument(
        "--require-chain-tip-lag-ok",
        action="store_true",
        help="require B-290 chain_tip_lag_watch report (--chain-tip-lag-report) with GO + canonical SHA integrity",
    )
    ex.add_argument(
        "--chain-tip-lag-report",
        metavar="PATH",
        help="path to JSON from region_vault_claim_broadcast_chain_tip_lag_watch.py chain-tip-lag-watch -o",
    )
    ex.add_argument(
        "--require-gas-fee-cap-ok",
        action="store_true",
        help="require B-291 gas_fee_cap_preflight report (--gas-fee-cap-report) with GO + stub SHA + canonical SHA",
    )
    ex.add_argument(
        "--gas-fee-cap-report",
        metavar="PATH",
        help="path to JSON from region_vault_claim_broadcast_gas_fee_cap_preflight.py gas-fee-cap-preflight -o",
    )
    ex.add_argument(
        "--resume-from-execution-report",
        metavar="PATH",
        help="B-282: prior B-262 execution_report JSON; skip steps already mined (eth_getTransactionReceipt verify)",
    )
    ex.add_argument(
        "--signing-order-static-table",
        metavar="PATH",
        help="B-277: static order table JSON (emit); must match stub SHA and stub_conforms_to_canonical_total_order true",
    )
    ex.add_argument(
        "--expect-stub-sha256",
        metavar="HEX64",
        dest="expect_stub_sha256",
        help=(
            f"B-286: require stub file raw SHA256 (64 hex) before dry-run/live; optional env "
            f"{STUB_CONTENT_SHA256_ENV} + {STUB_REPLAY_GUARD_ACK_ENV}=1 adds second confirmation"
        ),
    )
    ex.add_argument(
        "--verify-stub-signature",
        choices=("none", "minisign", "gpg", "auto"),
        default="none",
        help="B-301 verify detached minisign (.minisig) or GPG (.asc) signature before B-257 rehearsal",
    )
    ex.add_argument(
        "--stub-signature-path",
        metavar="PATH",
        help="B-301 path to signature file (default: stub.json.minisig or stub.json.asc beside stub)",
    )
    ex.add_argument(
        "--eth-send-raw-min-interval-ms",
        type=float,
        default=None,
        metavar="MS",
        help=(
            "B-302 min gap between eth_sendRawTransaction RPC attempts in ms (CLI vs env "
            "TRAVELTRUST_B302_ETH_SEND_RAW_MIN_INTERVAL_MS / TRAVELTRUST_B302_ETH_SEND_RAW_MAX_QPS — "
            "effective value is max of configured sources); omit for env-only"
        ),
    )
    ex.set_defaults(func=_cmd_execute)

    st = sub.add_parser("self-test", help="embedded pipeline + mock JSON-RPC server")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    try:
        return int(args.func(args))
    except ValueError as e:
        print(f"execute: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
