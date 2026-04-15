#!/usr/bin/env python3
# Production GO gate: B-264 onchain_reconcile + B-263 receipt_archive + operator attestations (B-265 / B-230～B-242).
# No RPC / no HTTP — file-local checks + human attestation flags for evidence/indexer surfaces.
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

GATE_ANCHOR = "14-REGIONVAULT-CLAIM-PRODUCTION-GO-GATE-V1"
GATE_RULE_VERSION = "region_vault_claim_production_go_gate_v1"
IMPLEMENTATION_TT = "TT-B266-14-REGIONVAULT-CLAIM-PRODUCTION-GO-GATE-001"
MOTHER_TABLE = "B-266"

ONCHAIN_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-ONCHAIN-RECONCILE-V1"
ONCHAIN_RULE_VERSION = "region_vault_claim_broadcast_onchain_reconcile_v1"

ARCHIVE_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-RECEIPT-ARCHIVE-V1"
ARCHIVE_RULE_VERSION = "region_vault_claim_broadcast_receipt_archive_v1"

REVALIDATE_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-RECEIPT-REVALIDATE-V1"
REVALIDATE_RULE_VERSION = "region_vault_claim_broadcast_receipt_revalidate_v1"


def _sha256_canonical_json(obj: dict[str, Any]) -> str:
    body = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(body).hexdigest()


def _file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _load_json(path: Path) -> tuple[dict[str, Any], bytes]:
    raw = path.read_bytes()
    return json.loads(raw.decode("utf-8")), raw


def run_production_go_gate(
    onchain: dict[str, Any],
    raw_onchain: bytes,
    receipt: dict[str, Any],
    raw_receipt: bytes,
    *,
    attest_b265_uplift: bool,
    attest_evidence_chain: bool,
    require_onchain_go: bool,
    require_archive_go: bool,
    risk_acceptance_items: list[dict[str, Any]],
    operator_note: str | None,
    require_receipt_finality_pass: bool = False,
    revalidation_report: dict[str, Any] | None = None,
) -> dict[str, Any]:
    blocking: list[str] = []
    checks: list[dict[str, Any]] = []

    if onchain.get("anchor") != ONCHAIN_ANCHOR:
        raise ValueError(f"onchain_reconcile.anchor must be {ONCHAIN_ANCHOR!r}")
    if str(onchain.get("rule_version") or "") != ONCHAIN_RULE_VERSION:
        raise ValueError(f"onchain_reconcile.rule_version must be {ONCHAIN_RULE_VERSION!r}")

    if receipt.get("anchor") != ARCHIVE_ANCHOR:
        raise ValueError(f"receipt_archive.anchor must be {ARCHIVE_ANCHOR!r}")
    if str(receipt.get("rule_version") or "") != ARCHIVE_RULE_VERSION:
        raise ValueError(f"receipt_archive.rule_version must be {ARCHIVE_RULE_VERSION!r}")

    rv = str(onchain.get("reconcile_verdict") or "")
    checks.append(
        {
            "check_id": "b264_onchain_reconcile_verdict_go",
            "passed": rv == "GO",
            "detail": f"reconcile_verdict={rv!r}",
        }
    )
    if require_onchain_go and rv != "GO":
        blocking.append(f"B-264 reconcile_verdict is {rv!r} (require GO)")

    av = str(receipt.get("archive_verdict") or "")
    checks.append(
        {
            "check_id": "b263_receipt_archive_verdict_go",
            "passed": av == "GO",
            "detail": f"archive_verdict={av!r}",
        }
    )
    if require_archive_go and av != "GO":
        blocking.append(f"B-263 archive_verdict is {av!r} (require GO)")

    er_link_onchain = str(onchain.get("source_execution_report_sha256_of_file_bytes_hex") or "").lower()
    er_link_receipt = str(receipt.get("source_execution_report_canonical_sha256_hex") or "").lower()
    exec_link_ok = bool(er_link_onchain and er_link_receipt and er_link_onchain == er_link_receipt)
    checks.append(
        {
            "check_id": "execution_report_sha256_cross_link",
            "passed": exec_link_ok,
            "detail": "onchain.source_execution_report_sha256_of_file_bytes_hex vs "
            "receipt.source_execution_report_canonical_sha256_hex",
        }
    )
    if not exec_link_ok:
        blocking.append(
            "execution report SHA link mismatch: onchain.source_execution_report_sha256_of_file_bytes_hex "
            "must equal receipt.source_execution_report_canonical_sha256_hex (same B-262 file pair)"
        )

    arch_body = {k: v for k, v in receipt.items() if k != "receipt_archive_canonical_sha256_hex"}
    recv_recomputed = _sha256_canonical_json(arch_body)
    declared_recv = str(receipt.get("receipt_archive_canonical_sha256_hex") or "").lower()
    recv_internal_ok = bool(declared_recv and recv_recomputed.lower() == declared_recv)
    checks.append(
        {
            "check_id": "b263_receipt_archive_canonical_sha256_internal",
            "passed": recv_internal_ok,
            "detail": "recomputed canonical JSON vs receipt_archive_canonical_sha256_hex",
        }
    )
    if not recv_internal_ok:
        blocking.append(
            "receipt_archive_canonical_sha256_hex does not match recomputed canonical JSON "
            "(file edited or corrupted)"
        )

    oc_decl = str(onchain.get("source_receipt_archive_canonical_sha256_hex_declared") or "").lower()
    oc_recomp = str(onchain.get("source_receipt_archive_canonical_sha256_hex_recomputed") or "").lower()
    onchain_recv_ok = bool(
        oc_recomp and recv_recomputed.lower() == oc_recomp.lower() and (not oc_decl or oc_decl == oc_recomp.lower())
    )
    checks.append(
        {
            "check_id": "b264_onchain_snapshot_matches_provided_receipt_archive",
            "passed": onchain_recv_ok,
            "detail": "onchain source_receipt_archive_canonical_sha256_hex_recomputed vs recomputed receipt file",
        }
    )
    if not onchain_recv_ok:
        blocking.append(
            "provided receipt_archive.json is not the same logical artifact as B-264 "
            "source_receipt_archive_canonical_sha256_hex_recomputed (wrong/stale file)"
        )

    rows = onchain.get("reconcile_rows")
    all_row_ok = True
    if not isinstance(rows, list):
        blocking.append("onchain_reconcile.reconcile_rows must be array")
        all_row_ok = False
    else:
        for i, row in enumerate(rows):
            if not isinstance(row, dict):
                blocking.append(f"reconcile_rows[{i}] must be object")
                all_row_ok = False
                continue
            if not row.get("row_ok"):
                all_row_ok = False
                gi = row.get("global_index")
                blocking.append(f"reconcile_rows global_index {gi}: row_ok is false")

    checks.append(
        {
            "check_id": "b264_all_reconcile_rows_row_ok",
            "passed": all_row_ok,
            "detail": "every reconcile_rows[].row_ok true",
        }
    )

    fe = receipt.get("finality_evidence")
    fe_ok = (
        isinstance(fe, dict)
        and fe.get("enabled") is True
        and fe.get("all_rows_finality_ok") is True
    )
    checks.append(
        {
            "check_id": "b278_receipt_finality_evidence_optional",
            "passed": (not require_receipt_finality_pass) or fe_ok,
            "detail": "receipt_archive.finality_evidence (TT-B278) when --require-receipt-finality-pass",
        }
    )
    if require_receipt_finality_pass and not fe_ok:
        blocking.append(
            "B-278 finality gate: --require-receipt-finality-pass set but receipt_archive lacks "
            "finality_evidence.enabled + all_rows_finality_ok true (re-run B-263 with --min-confirmations > 0)"
        )

    if revalidation_report is not None:
        ra_ok = (
            revalidation_report.get("anchor") == REVALIDATE_ANCHOR
            and str(revalidation_report.get("rule_version") or "") == REVALIDATE_RULE_VERSION
        )
        checks.append(
            {
                "check_id": "b367_revalidation_report_schema",
                "passed": ra_ok,
                "detail": "optional B-367 receipt revalidate JSON anchor/rule_version",
            }
        )
        if not ra_ok:
            blocking.append(
                f"B-367 revalidation report must be anchor={REVALIDATE_ANCHOR!r} "
                f"and rule_version={REVALIDATE_RULE_VERSION!r}"
            )
        rv_rev = str(revalidation_report.get("revalidation_verdict") or "")
        rev_go = rv_rev == "GO"
        checks.append(
            {
                "check_id": "b367_revalidation_verdict_go",
                "passed": rev_go,
                "detail": f"revalidation_verdict={rv_rev!r}",
            }
        )
        if not rev_go:
            blocking.append(f"B-367 revalidation_verdict is {rv_rev!r} (require GO)")
        bad_inc: list[Any] = []
        for r in revalidation_report.get("rows") or []:
            if not isinstance(r, dict) or r.get("skipped"):
                continue
            if r.get("inclusion_hash_match") is False:
                bad_inc.append(r.get("global_index"))
        inc_all = not bad_inc
        checks.append(
            {
                "check_id": "b373_inclusion_block_hash_revalidation",
                "passed": inc_all,
                "detail": "every non-skipped row has inclusion_hash_match true",
            }
        )
        if not inc_all:
            blocking.append(
                f"B-373 inclusion block hash mismatch after revalidation (global_index): {bad_inc}"
            )

    checks.append(
        {
            "check_id": "operator_attests_b265_indexer_read_model_uplift",
            "passed": attest_b265_uplift,
            "detail": "requires --attest-b265-indexer-uplift (API/DB uplift + forwarded alignment verified out-of-band)",
        }
    )
    if not attest_b265_uplift:
        blocking.append(
            "missing operator attestation: --attest-b265-indexer-uplift "
            "(B-265 read-model + region_vault_forwarded_events alignment)"
        )

    checks.append(
        {
            "check_id": "operator_attests_b230_b242_evidence_chain_alignment",
            "passed": attest_evidence_chain,
            "detail": "requires --attest-b230-b242-evidence-chain (snapshots vs on-chain results)",
        }
    )
    if not attest_evidence_chain:
        blocking.append(
            "missing operator attestation: --attest-b230-b242-evidence-chain "
            "(B-230～B-242 evidence chain consistent with chain outcomes)"
        )

    verdict = "GO" if not blocking else "NO_GO"
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # B-379: audit surface from receipt_archive (no RPC in this gate; fields are producer-attested).
    fps: list[dict[str, Any]] = []
    rqv = receipt.get("rpc_quorum_evidence")
    if isinstance(rqv, dict) and rqv.get("enabled") is True:
        fps.append(
            {
                "source": "receipt_archive.rpc_quorum_evidence",
                "implementation_tt": rqv.get("implementation_tt"),
                "endpoint_count": rqv.get("endpoint_count"),
                "chain_id_disagreement": (rqv.get("chain_id_quorum") or {}).get("disagreement"),
            }
        )
    rur = receipt.get("rpc_urls_redacted")
    if isinstance(rur, list) and rur:
        fps.append({"source": "receipt_archive.rpc_urls_redacted", "rpc_urls_redacted": rur})
    elif isinstance(receipt.get("rpc_url_redacted"), str) and str(receipt.get("rpc_url_redacted") or "").strip():
        fps.append(
            {
                "source": "receipt_archive.rpc_url_redacted",
                "rpc_url_redacted": receipt.get("rpc_url_redacted"),
            }
        )

    risks = list(risk_acceptance_items)
    if verdict == "GO" and not risks:
        risks.append(
            {
                "item_id": "production_admission_default",
                "description": (
                    "Operator accepts residual operational risk for long-running production admission "
                    "after automated file checks and attestations above."
                ),
                "accepted": True,
            }
        )

    report: dict[str, Any] = {
        "anchor": GATE_ANCHOR,
        "rule_version": GATE_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "generated_at_utc": generated,
        "notes": (
            "B-266: file-local cross-check of B-264+B-263 plus required operator attestations for "
            "B-265 indexer/read-model uplift and B-230～B-242 evidence alignment. No RPC; no new HTTP."
        ),
        "inputs": {
            "onchain_reconcile_canonical_sha256_hex": onchain.get("onchain_reconcile_canonical_sha256_hex"),
        },
        "operator": {
            "attest_b265_indexer_uplift": attest_b265_uplift,
            "attest_b230_b242_evidence_chain": attest_evidence_chain,
            "operator_note": operator_note or None,
        },
        "source_surface": {
            "b264_reconcile_verdict": rv,
            "b263_archive_verdict": av,
            "source_execution_report_sha256_hex_linked": er_link_onchain or None,
            "receipt_archive_canonical_sha256_recomputed_from_file": recv_recomputed,
            "b264_source_receipt_archive_canonical_sha256_hex_recomputed": oc_recomp or None,
        },
        "execution_and_evidence_surface_checks": checks,
        "risk_acceptance_items": risks,
        "blocking_reasons": blocking,
        "production_verdict": verdict,
        "rpc_surface_fingerprints": {
            "implementation_tt": "TT-B379-GO-REPORT-RPC-FINGERPRINT-001",
            "mother_table": "B-379",
            "entries": fps,
        },
    }
    canon = {k: v for k, v in report.items() if k != "production_go_gate_canonical_sha256_hex"}
    report["production_go_gate_canonical_sha256_hex"] = _sha256_canonical_json(canon)
    return report


def _cmd_production_go_gate(args: argparse.Namespace) -> int:
    on_path = Path(args.onchain_reconcile)
    rec_path = Path(args.receipt_archive)
    on, raw_on = _load_json(on_path)
    rec, raw_rec = _load_json(rec_path)

    risk_items: list[dict[str, Any]] = []
    if args.risk_acceptance_json:
        p = Path(args.risk_acceptance_json)
        data = json.loads(p.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            print("production-go-gate: risk_acceptance_json must be a JSON array", file=sys.stderr)
            return 1
        for i, it in enumerate(data):
            if not isinstance(it, dict):
                print(f"production-go-gate: risk item {i} must be object", file=sys.stderr)
                return 1
        risk_items = data

    try:
        rev: dict[str, Any] | None = None
        if args.receipt_revalidation_json:
            rev = json.loads(Path(args.receipt_revalidation_json).read_text(encoding="utf-8"))
            if not isinstance(rev, dict):
                print("production-go-gate: revalidation JSON must be object", file=sys.stderr)
                return 1
        out = run_production_go_gate(
            on,
            raw_on,
            rec,
            raw_rec,
            attest_b265_uplift=args.attest_b265_indexer_uplift,
            attest_evidence_chain=args.attest_b230_b242_evidence_chain,
            require_onchain_go=not args.allow_non_go_onchain,
            require_archive_go=not args.allow_non_go_archive,
            risk_acceptance_items=risk_items,
            operator_note=args.operator_note,
            require_receipt_finality_pass=args.require_receipt_finality_pass,
            revalidation_report=rev,
        )
    except ValueError as e:
        print(f"production-go-gate: FAIL: {e}", file=sys.stderr)
        return 1

    out["inputs"]["onchain_reconcile_path"] = str(on_path)
    out["inputs"]["receipt_archive_path"] = str(rec_path)
    out["inputs"]["onchain_reconcile_file_sha256_hex"] = _file_sha256(on_path)
    out["inputs"]["receipt_archive_file_sha256_hex"] = _file_sha256(rec_path)

    canon = {k: v for k, v in out.items() if k != "production_go_gate_canonical_sha256_hex"}
    out["production_go_gate_canonical_sha256_hex"] = _sha256_canonical_json(canon)

    outp = Path(args.output)
    outp.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {args.output}", file=sys.stderr)

    v = out.get("production_verdict")
    if v != "GO":
        print(f"production-go-gate: production_verdict={v!r}", file=sys.stderr)
        for r in out.get("blocking_reasons") or []:
            print(f"  block: {r}", file=sys.stderr)
        return 0 if args.allow_non_go_production else 1
    print("region_vault_claim_production_go_gate: OK", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    # Minimal B-262/B-263/B-264-shaped chain (aligned with region_vault_claim_broadcast_onchain_reconcile self-test)
    tx = "0x" + "cd" * 32
    er_body: dict[str, Any] = {
        "anchor": "14-REGIONVAULT-CLAIM-BROADCAST-EXECUTION-REPORT-V1",
        "rule_version": "region_vault_claim_broadcast_execute_v1",
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
    raw_er = json.dumps(er_body, ensure_ascii=False).encode("utf-8")

    arch: dict[str, Any] = {
        "anchor": ARCHIVE_ANCHOR,
        "rule_version": ARCHIVE_RULE_VERSION,
        "mother_table": "B-263",
        "source_execution_report_canonical_sha256_hex": hashlib.sha256(raw_er).hexdigest(),
        "chain_id_hex_observed": "0x7a69",
        "archive_verdict": "GO",
        "rpc_url_redacted": "http://127.0.0.1:8545/…",
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
    ab = {k: v for k, v in arch.items() if k != "receipt_archive_canonical_sha256_hex"}
    arch["receipt_archive_canonical_sha256_hex"] = _sha256_canonical_json(ab)
    raw_arch = json.dumps(arch, ensure_ascii=False).encode("utf-8")

    # Import reconcile runner to build a valid B-264 JSON in-process
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "rv_b264", Path(__file__).parent / "region_vault_claim_broadcast_onchain_reconcile.py"
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    onchain = mod.run_onchain_reconcile(
        er_body,
        raw_er,
        arch,
        raw_arch,
        require_execution_go=True,
        require_archive_go=True,
        strict_receipt_archive_sha256=True,
    )
    assert onchain["reconcile_verdict"] == "GO", onchain
    raw_on = json.dumps(onchain, ensure_ascii=False).encode("utf-8")

    bad = run_production_go_gate(
        onchain,
        raw_on,
        arch,
        raw_arch,
        attest_b265_uplift=False,
        attest_evidence_chain=False,
        require_onchain_go=True,
        require_archive_go=True,
        risk_acceptance_items=[],
        operator_note=None,
        revalidation_report=None,
    )
    assert bad["production_verdict"] == "NO_GO", bad

    good = run_production_go_gate(
        onchain,
        raw_on,
        arch,
        raw_arch,
        attest_b265_uplift=True,
        attest_evidence_chain=True,
        require_onchain_go=True,
        require_archive_go=True,
        risk_acceptance_items=[],
        operator_note="self-test",
        revalidation_report=None,
    )
    assert good["production_verdict"] == "GO", good
    assert good["anchor"] == GATE_ANCHOR
    rsf = good.get("rpc_surface_fingerprints") or {}
    assert rsf.get("implementation_tt") == "TT-B379-GO-REPORT-RPC-FINGERPRINT-001"
    assert isinstance(rsf.get("entries"), list) and len(rsf["entries"]) >= 1

    rev_go = {
        "anchor": REVALIDATE_ANCHOR,
        "rule_version": REVALIDATE_RULE_VERSION,
        "revalidation_verdict": "GO",
        "rows": [{"global_index": 0, "inclusion_hash_match": True}],
    }
    good_r = run_production_go_gate(
        onchain,
        raw_on,
        arch,
        raw_arch,
        attest_b265_uplift=True,
        attest_evidence_chain=True,
        require_onchain_go=True,
        require_archive_go=True,
        risk_acceptance_items=[],
        operator_note="self-test-reval",
        revalidation_report=rev_go,
    )
    assert good_r["production_verdict"] == "GO", good_r

    rev_bad = {
        "anchor": REVALIDATE_ANCHOR,
        "rule_version": REVALIDATE_RULE_VERSION,
        "revalidation_verdict": "GO",
        "rows": [{"global_index": 0, "inclusion_hash_match": False}],
    }
    bad_r = run_production_go_gate(
        onchain,
        raw_on,
        arch,
        raw_arch,
        attest_b265_uplift=True,
        attest_evidence_chain=True,
        require_onchain_go=True,
        require_archive_go=True,
        risk_acceptance_items=[],
        operator_note=None,
        revalidation_report=rev_bad,
    )
    assert bad_r["production_verdict"] == "NO_GO", bad_r

    print("region_vault_claim_production_go_gate self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-266 production GO gate: B-264 + B-263 files + operator attestations"
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    g = sub.add_parser("production-go-gate", help="Validate onchain_reconcile + receipt_archive + attestations")
    g.add_argument("onchain_reconcile", help="Path to B-264 onchain_reconcile.json")
    g.add_argument("receipt_archive", help="Path to B-263 receipt_archive.json")
    g.add_argument("-o", "--output", required=True, help="Output production_go_report.json")
    g.add_argument(
        "--attest-b265-indexer-uplift",
        action="store_true",
        help="Required for production_verdict GO: operator attests B-265 read-model + forwarded alignment",
    )
    g.add_argument(
        "--attest-b230-b242-evidence-chain",
        action="store_true",
        help="Required for production_verdict GO: operator attests B-230～B-242 evidence chain vs on-chain results",
    )
    g.add_argument(
        "--allow-non-go-onchain",
        action="store_true",
        help="Do not require B-264 reconcile_verdict GO",
    )
    g.add_argument(
        "--allow-non-go-archive",
        action="store_true",
        help="Do not require B-263 archive_verdict GO",
    )
    g.add_argument(
        "--allow-non-go-production",
        action="store_true",
        help="Exit 0 even when production_verdict is NO_GO (still writes report)",
    )
    g.add_argument(
        "--risk-acceptance-json",
        help="Optional JSON array of risk_acceptance_items {item_id, description, accepted, ...}",
    )
    g.add_argument("--operator-note", help="Free-text operator note stored in report.operator")
    g.add_argument(
        "--require-receipt-finality-pass",
        action="store_true",
        help="Require B-263 receipt_archive.finality_evidence (TT-B278) with all_rows_finality_ok",
    )
    g.add_argument(
        "--receipt-revalidation-json",
        help="Optional B-367/B-373: receipt revalidate report JSON (must be GO + inclusion matches)",
    )
    g.set_defaults(func=_cmd_production_go_gate)

    st = sub.add_parser("self-test", help="Embedded structural tests")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
