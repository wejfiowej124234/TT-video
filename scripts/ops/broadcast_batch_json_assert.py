#!/usr/bin/env python3
"""CI JSON field assertions for broadcast production blocker batches (no network)."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
import tempfile
from pathlib import Path


def _load_gate_module():
    spec = importlib.util.spec_from_file_location(
        "go_gate", Path(__file__).resolve().parent / "region_vault_claim_production_go_gate.py"
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _load_merkle_module():
    spec = importlib.util.spec_from_file_location(
        "merkle", Path(__file__).resolve().parent / "region_vault_claim_evidence_bundle_merkle.py"
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def assert_batch1() -> None:
    g = _load_gate_module()
    m = _load_merkle_module()
    tx = "0x" + "cd" * 32
    er_body: dict = {
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
    er_body["execution_report_canonical_sha256_hex"] = g._sha256_canonical_json(  # type: ignore[attr-defined]
        {k: v for k, v in er_body.items() if k != "execution_report_canonical_sha256_hex"}
    )
    raw_er = json.dumps(er_body, ensure_ascii=False).encode("utf-8")

    arch = {
        "anchor": g.ARCHIVE_ANCHOR,
        "rule_version": g.ARCHIVE_RULE_VERSION,
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
    arch["receipt_archive_canonical_sha256_hex"] = g._sha256_canonical_json(ab)  # type: ignore[attr-defined]
    raw_arch = json.dumps(arch, ensure_ascii=False).encode("utf-8")

    spec264 = importlib.util.spec_from_file_location(
        "b264", Path(__file__).resolve().parent / "region_vault_claim_broadcast_onchain_reconcile.py"
    )
    assert spec264 and spec264.loader
    mod264 = importlib.util.module_from_spec(spec264)
    spec264.loader.exec_module(mod264)
    onchain = mod264.run_onchain_reconcile(
        er_body,
        raw_er,
        arch,
        raw_arch,
        require_execution_go=True,
        require_archive_go=True,
        strict_receipt_archive_sha256=True,
    )
    raw_on = json.dumps(onchain, ensure_ascii=False).encode("utf-8")

    rep = g.run_production_go_gate(
        onchain,
        raw_on,
        arch,
        raw_arch,
        attest_b265_uplift=True,
        attest_evidence_chain=True,
        require_onchain_go=True,
        require_archive_go=True,
        risk_acceptance_items=[],
        operator_note="batch1-json-assert",
    )
    rsf = rep.get("rpc_surface_fingerprints") or {}
    assert rsf.get("implementation_tt") == "TT-B379-GO-REPORT-RPC-FINGERPRINT-001", rsf
    assert rsf.get("mother_table") == "B-379", rsf
    assert isinstance(rsf.get("entries"), list) and len(rsf["entries"]) >= 1, rsf

    # Merkle manifest shape
    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        (d / "execution_report.json").write_bytes(raw_er)
        (d / "receipt_archive.json").write_bytes(raw_arch)
        (d / "onchain_reconcile.json").write_bytes(raw_on)
        (d / "production_go_report.json").write_bytes(
            json.dumps(rep, ensure_ascii=False).encode("utf-8") + b"\n"
        )
        body, code = m.build_bundle(d, m.DEFAULT_FILES, allow_missing=False)
        assert code == 0, body
        assert body.get("merkle_root_sha256_hex"), body
        ok, msg = m.verify_bundle(d, body, m.DEFAULT_FILES)
        assert ok, msg


def assert_batch2() -> None:
    g = _load_gate_module()
    m = _load_merkle_module()
    rv_mod = importlib.util.spec_from_file_location(
        "reval", Path(__file__).resolve().parent / "region_vault_claim_broadcast_receipt_revalidate_rpc.py"
    )
    assert rv_mod and rv_mod.loader
    rv = importlib.util.module_from_spec(rv_mod)
    rv_mod.loader.exec_module(rv)

    tx = "0x" + "cd" * 32
    er_body: dict = {
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
    er_body["execution_report_canonical_sha256_hex"] = g._sha256_canonical_json(  # type: ignore[attr-defined]
        {k: v for k, v in er_body.items() if k != "execution_report_canonical_sha256_hex"}
    )
    raw_er = json.dumps(er_body, ensure_ascii=False).encode("utf-8")

    arch = {
        "anchor": g.ARCHIVE_ANCHOR,
        "rule_version": g.ARCHIVE_RULE_VERSION,
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
    arch["receipt_archive_canonical_sha256_hex"] = g._sha256_canonical_json(ab)  # type: ignore[attr-defined]
    raw_arch = json.dumps(arch, ensure_ascii=False).encode("utf-8")

    spec264 = importlib.util.spec_from_file_location(
        "b264", Path(__file__).resolve().parent / "region_vault_claim_broadcast_onchain_reconcile.py"
    )
    assert spec264 and spec264.loader
    mod264 = importlib.util.module_from_spec(spec264)
    spec264.loader.exec_module(mod264)
    onchain = mod264.run_onchain_reconcile(
        er_body,
        raw_er,
        arch,
        raw_arch,
        require_execution_go=True,
        require_archive_go=True,
        strict_receipt_archive_sha256=True,
    )
    raw_on = json.dumps(onchain, ensure_ascii=False).encode("utf-8")

    reval = {
        "anchor": rv.ANCHOR,
        "rule_version": rv.RULE_VERSION,
        "mother_table": rv.MOTHER_TABLE,
        "implementation_tt": rv.IMPLEMENTATION_TT,
        "revalidation_verdict": "GO",
        "rpc_url_redacted": "http://127.0.0.1:8545/…",
        "rows": [
            {
                "global_index": 0,
                "inclusion_hash_match": True,
                "b373_parent_surface_tt": rv.B373_TT,
            }
        ],
        "blocking_reasons": [],
    }
    assert reval["implementation_tt"] == "TT-B367-SAFE-HEAD-REGRESSION-REFETCH-001", reval
    assert reval["rows"][0].get("b373_parent_surface_tt") == "TT-B373-PARENT-HASH-MISMATCH-GO-REVOCATION-001"

    rep = g.run_production_go_gate(
        onchain,
        raw_on,
        arch,
        raw_arch,
        attest_b265_uplift=True,
        attest_evidence_chain=True,
        require_onchain_go=True,
        require_archive_go=True,
        risk_acceptance_items=[],
        operator_note="batch2-json-assert",
        revalidation_report=reval,
    )
    assert rep.get("production_verdict") == "GO", rep
    by_id = {c["check_id"]: c for c in rep.get("execution_and_evidence_surface_checks") or []}
    assert by_id.get("b367_revalidation_verdict_go", {}).get("passed") is True, by_id
    assert by_id.get("b373_inclusion_block_hash_revalidation", {}).get("passed") is True, by_id

    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        (d / "execution_report.json").write_bytes(raw_er)
        (d / "receipt_archive.json").write_bytes(raw_arch)
        (d / "onchain_reconcile.json").write_bytes(raw_on)
        (d / "production_go_report.json").write_bytes(
            json.dumps(rep, ensure_ascii=False).encode("utf-8") + b"\n"
        )
        body, code = m.build_bundle(d, m.DEFAULT_FILES, allow_missing=False)
        assert code == 0, body
        assert body.get("merkle_root_sha256_hex"), body


def assert_batch3() -> None:
    here = Path(__file__).resolve()
    repo = here.parent.parent.parent

    spec369 = importlib.util.spec_from_file_location(
        "b369", here.parent / "verify_tt_b322_evidence_bundle_ci.py"
    )
    assert spec369 and spec369.loader
    m369 = importlib.util.module_from_spec(spec369)
    spec369.loader.exec_module(m369)
    assert m369.IMPLEMENTATION_TT == "TT-B369-CI-BLOCKING-TT-B322-MULTI-TX-PARITY-001"
    ev_root = repo / "evidence" / "testnet_real_run_validation" / "run_tt_b322_anvil_multi_tx2_20260415"
    ok, msg = m369.verify_dir(ev_root)
    assert ok, msg
    pg = json.loads((ev_root / "production_go_report.json").read_text(encoding="utf-8"))
    assert str(pg.get("production_verdict") or "") == "GO"
    assert pg.get("anchor") == "14-REGIONVAULT-CLAIM-PRODUCTION-GO-GATE-V1"
    ore = json.loads((ev_root / "operator_run_evidence.json").read_text(encoding="utf-8"))
    assert ore.get("tt_id") == "TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001"
    th = ore.get("transaction_hashes_in_order")
    assert isinstance(th, list) and len(th) >= 2
    er = json.loads((ev_root / "execution_report.json").read_text(encoding="utf-8"))
    steps = er.get("execution_steps")
    assert isinstance(steps, list) and len(steps) >= 2

    spec370 = importlib.util.spec_from_file_location(
        "b370", here.parent / "verify_b265_indexer_forwarded_drift_ci.py"
    )
    assert spec370 and spec370.loader
    m370 = importlib.util.module_from_spec(spec370)
    spec370.loader.exec_module(m370)
    fx = here.parent / "fixtures" / "batch3"
    ok2, msg2 = m370.run_drift(fx / "read_model_tx_hashes.json", fx / "indexer_forwarded_tx_hashes.json")
    assert ok2, msg2
    ok_bad, _ = m370.run_drift(fx / "read_model_tx_hashes.json", fx / "indexer_forwarded_tx_hashes_drift.json")
    assert not ok_bad

    spec375 = importlib.util.spec_from_file_location(
        "b375", here.parent / "region_vault_indexer_replay_dryrun.py"
    )
    assert spec375 and spec375.loader
    m375 = importlib.util.module_from_spec(spec375)
    spec375.loader.exec_module(m375)
    ev_path = fx / "replay_events.json"
    events = json.loads(ev_path.read_text(encoding="utf-8"))
    assert isinstance(events, list) and events
    d_hex = m375.canonical_digest(events)
    with tempfile.TemporaryDirectory() as tdir:
        outp = Path(tdir) / "replay_digest.json"
        report = {
            "anchor": m375.ANCHOR,
            "implementation_tt": m375.IMPLEMENTATION_TT,
            "mother_table": "B-375",
            "events_sha256_canonical_hex": d_hex,
            "event_count": len(events),
        }
        outp.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        loaded = json.loads(outp.read_text(encoding="utf-8"))
        assert loaded.get("implementation_tt") == "TT-B375-INDEXER-REGION-VAULT-REPLAY-FROM-BLOCK-001"
        assert loaded.get("events_sha256_canonical_hex") == d_hex
        assert int(loaded.get("event_count") or 0) == len(events)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("batch", choices=("1", "2", "3"))
    args = ap.parse_args()
    if args.batch == "1":
        assert_batch1()
        print("broadcast_batch_json_assert: batch1 OK", file=sys.stderr)
        return 0
    if args.batch == "2":
        assert_batch2()
        print("broadcast_batch_json_assert: batch2 OK", file=sys.stderr)
        return 0
    assert_batch3()
    print("broadcast_batch_json_assert: batch3 OK", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
