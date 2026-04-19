#!/usr/bin/env python3
# B-284: partial-run operator recovery — OUT_DIR filename standard, B-282 resume eligibility, command templates (no network).
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from region_vault_claim_broadcast_rpc_key_rotation_runbook_b304 import build_rpc_key_rotation_runbook_block
from region_vault_claim_broadcast_runbook_version_pin import (
    annotate_command_templates,
    build_runbook_version_pin,
)

RUNBOOK_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-PARTIAL-RUN-OPERATOR-RUNBOOK-V1"
RUNBOOK_RULE_VERSION = "region_vault_claim_broadcast_partial_run_operator_runbook_v1"
IMPLEMENTATION_TT = "TT-B284-PARTIAL-RUN-OPERATOR-RUNBOOK-001"
MOTHER_TABLE = "B-284"

EXECUTION_REPORT_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-EXECUTION-REPORT-V1"
EXECUTION_REPORT_RULE_VERSION = "region_vault_claim_broadcast_execute_v1"

# Canonical filenames under a single operator OUT_DIR (B-256→B-266 chain).
OUT_DIR_STANDARD_FILENAMES: dict[str, str] = {
    "broadcast_request_stub_json": "broadcast_request_stub.json",
    "execution_report_json": "execution_report.json",
    "nonce_preflight_report_json": "nonce_preflight_report.json",
    "signing_order_static_json": "signing_order_static.json",
    "receipt_archive_json": "receipt_archive.json",
    "onchain_reconcile_json": "onchain_reconcile.json",
    "operator_run_evidence_json": "operator_run_evidence.json",
    "operator_run_structured_jsonl": "operator_run_structured.jsonl",
}


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _resume_eligibility_dict(*, stub_sha256_hex: str, prior: dict[str, Any] | None) -> dict[str, Any]:
    out: dict[str, Any] = {"resume_with_b282_eligible": False, "blockers": []}
    if prior is None:
        out["blockers"].append("prior_execution_report_missing")
        return out
    if prior.get("anchor") != EXECUTION_REPORT_ANCHOR:
        out["blockers"].append(
            f"prior.anchor must be {EXECUTION_REPORT_ANCHOR!r} (got {prior.get('anchor')!r})"
        )
    if str(prior.get("rule_version") or "") != EXECUTION_REPORT_RULE_VERSION:
        out["blockers"].append(
            f"prior.rule_version must be {EXECUTION_REPORT_RULE_VERSION!r} "
            f"(got {prior.get('rule_version')!r})"
        )
    want = str(prior.get("source_broadcast_request_stub_sha256_hex") or "").lower()
    got = stub_sha256_hex.lower()
    if not want or want != got:
        out["blockers"].append(
            "prior.source_broadcast_request_stub_sha256_hex != current stub bytes "
            "(after stub re-sign / byte change: do not use B-282 resume; run full B-262 execute)"
        )
    out["resume_with_b282_eligible"] = not out["blockers"]
    return out


def build_runbook_document(
    *,
    out_dir: Path | None,
    broadcast_request_stub_path: Path | None,
    prior_execution_report_path: Path | None,
    nonce_preflight_report_path: Path | None,
    signing_order_static_path: Path | None,
) -> dict[str, Any]:
    inputs_scan: dict[str, Any] = {"out_dir": str(out_dir) if out_dir else None}
    stub_sha: str | None = None
    prior: dict[str, Any] | None = None

    if broadcast_request_stub_path is not None and broadcast_request_stub_path.is_file():
        raw = broadcast_request_stub_path.read_bytes()
        stub_sha = _sha256_bytes(raw)
        inputs_scan["broadcast_request_stub"] = {
            "path": str(broadcast_request_stub_path.resolve()),
            "sha256_hex": stub_sha,
            "size_bytes": len(raw),
        }
    if prior_execution_report_path is not None and prior_execution_report_path.is_file():
        prior = json.loads(prior_execution_report_path.read_text(encoding="utf-8"))
        if not isinstance(prior, dict):
            raise ValueError("prior execution_report must be a JSON object")
        inputs_scan["prior_execution_report"] = {
            "path": str(prior_execution_report_path.resolve()),
            "anchor": prior.get("anchor"),
            "execution_verdict": prior.get("execution_verdict"),
        }
    if nonce_preflight_report_path is not None and nonce_preflight_report_path.is_file():
        raw_pf = nonce_preflight_report_path.read_bytes()
        inputs_scan["nonce_preflight_report"] = {
            "path": str(nonce_preflight_report_path.resolve()),
            "sha256_hex": _sha256_bytes(raw_pf),
        }
    if signing_order_static_path is not None and signing_order_static_path.is_file():
        raw_s = signing_order_static_path.read_bytes()
        inputs_scan["signing_order_static"] = {
            "path": str(signing_order_static_path.resolve()),
            "sha256_hex": _sha256_bytes(raw_s),
        }

    resume_eligibility: dict[str, Any] | None = None
    if stub_sha is not None:
        resume_eligibility = _resume_eligibility_dict(stub_sha256_hex=stub_sha, prior=prior)

    layout = [
        {
            "key": k,
            "filename": v,
            "purpose": _layout_purpose(k),
        }
        for k, v in OUT_DIR_STANDARD_FILENAMES.items()
    ]

    od = "$OUT_DIR" if out_dir is None else str(out_dir.resolve())
    st = "$STUB" if broadcast_request_stub_path is None else str(broadcast_request_stub_path.resolve())
    pr = "$PRIOR_EXECUTION_REPORT" if prior_execution_report_path is None else str(prior_execution_report_path.resolve())
    exe = "python scripts/ops/region_vault_claim_broadcast_execute.py"
    pfx = "python scripts/ops/region_vault_claim_broadcast_nonce_preflight.py"
    rs = "python scripts/ops/region_vault_claim_broadcast_pipeline_resume.py"

    body: dict[str, Any] = {
        "anchor": RUNBOOK_ANCHOR,
        "rule_version": RUNBOOK_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "generated_at_utc": _utc_now(),
        "out_dir_standard_filenames": dict(OUT_DIR_STANDARD_FILENAMES),
        "out_dir_recommended_layout": layout,
        "partial_failure_recovery": {
            "stub_unchanged_path": (
                "If raw signed txs in the B-256 stub are unchanged, keep one copy under OUT_DIR and use "
                "B-282 resume with the partial B-262 execution_report (SHA must match)."
            ),
            "stub_re_signed_path": (
                "If the stub bytes change (re-sign / new raw tx), B-282 resume is blocked: "
                "run a fresh B-262 execute only after B-276 nonce preflight and operator reconciliation "
                "with chain state (replacement tx / nonce gaps per operator procedure)."
            ),
        },
        "recovery_phases": [
            {
                "phase": 1,
                "title": "Stabilize artifacts under OUT_DIR",
                "detail": (
                    f"Copy inputs into {od}/ using the standard filenames in out_dir_standard_filenames "
                    "so the next commands have stable paths."
                ),
            },
            {
                "phase": 2,
                "title": "Nonce ladder + RPC alignment (B-276)",
                "detail": "Re-run preflight after any mempool drift or stub edit.",
            },
            {
                "phase": 3,
                "title": "Resume (B-282) or full execute (B-262)",
                "detail": "Use resume only when resume_eligibility.resume_with_b282_eligible is true.",
            },
        ],
        "command_templates": [
            f"{pfx} preflight {st} -o {od}/nonce_preflight_report.json --rpc-url \"$CHAIN_RPC_URL\"",
            f"{exe} execute {st} -o {od}/execution_report.json --require-preflight-ok "
            f"--preflight-report {od}/nonce_preflight_report.json --rpc-url \"$CHAIN_RPC_URL\"",
            f"{rs} resume-execute {st} -o {od}/execution_report_resumed.json "
            f"--prior-execution-report {pr} -- --rpc-url \"$CHAIN_RPC_URL\"",
            f"{exe} execute {st} -o {od}/execution_report.json --signing-order-static-table "
            f"{od}/signing_order_static.json --rpc-url \"$CHAIN_RPC_URL\"",
        ],
        "inputs_scan": inputs_scan,
    }
    repo_for_pin = Path(__file__).resolve().parent.parent.parent
    pin = build_runbook_version_pin(repo_root=repo_for_pin)
    body["b299_runbook_version_pin"] = pin
    body["command_templates_version_annotated"] = annotate_command_templates(
        list(body["command_templates"]),
        pin,
    )
    body["b304_rpc_key_rotation_runbook"] = build_rpc_key_rotation_runbook_block(
        tool_label="region_vault_claim_broadcast_partial_run_operator_runbook"
    )
    if resume_eligibility is not None:
        body["resume_eligibility"] = resume_eligibility
    canon = {k: v for k, v in body.items() if k != "runbook_canonical_sha256_hex"}
    body["runbook_canonical_sha256_hex"] = hashlib.sha256(
        json.dumps(canon, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    ).hexdigest()
    return body


def _layout_purpose(key: str) -> str:
    return {
        "broadcast_request_stub_json": "B-256 request stub (signed raw txs)",
        "execution_report_json": "B-262 execution_report (partial or final)",
        "nonce_preflight_report_json": "B-276 nonce / order preflight report",
        "signing_order_static_json": "B-277 optional static signing-order table",
        "receipt_archive_json": "B-263 receipt archive",
        "onchain_reconcile_json": "B-264 on-chain reconcile",
        "operator_run_evidence_json": "Optional operator bundle index / attestation wrapper",
        "operator_run_structured_jsonl": "B-296 append-only NDJSON (who/when/git + event payloads)",
    }.get(key, key)


def _resolve_paths_from_out_dir(out_dir: Path) -> dict[str, Path | None]:
    d = out_dir.resolve()
    return {
        "broadcast_request_stub": d / OUT_DIR_STANDARD_FILENAMES["broadcast_request_stub_json"],
        "prior_execution_report": d / OUT_DIR_STANDARD_FILENAMES["execution_report_json"],
        "nonce_preflight_report": d / OUT_DIR_STANDARD_FILENAMES["nonce_preflight_report_json"],
        "signing_order_static": d / OUT_DIR_STANDARD_FILENAMES["signing_order_static_json"],
    }


def _cmd_emit(args: argparse.Namespace) -> int:
    out_dir = Path(args.out_dir).resolve() if args.out_dir else None
    stub = Path(args.broadcast_request_stub).resolve() if args.broadcast_request_stub else None
    prior = Path(args.prior_execution_report).resolve() if args.prior_execution_report else None
    pre = Path(args.nonce_preflight_report).resolve() if args.nonce_preflight_report else None
    b277 = Path(args.signing_order_static_table).resolve() if args.signing_order_static_table else None
    if out_dir is not None:
        guessed = _resolve_paths_from_out_dir(out_dir)
        if stub is None and guessed["broadcast_request_stub"].is_file():
            stub = guessed["broadcast_request_stub"]
        if prior is None and guessed["prior_execution_report"].is_file():
            prior = guessed["prior_execution_report"]
        if pre is None and guessed["nonce_preflight_report"].is_file():
            pre = guessed["nonce_preflight_report"]
        if b277 is None and guessed["signing_order_static"].is_file():
            b277 = guessed["signing_order_static"]

    doc = build_runbook_document(
        out_dir=out_dir,
        broadcast_request_stub_path=stub,
        prior_execution_report_path=prior,
        nonce_preflight_report_path=pre,
        signing_order_static_path=b277,
    )
    text = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        Path(args.output).write_text(text, encoding="utf-8")
        print(f"wrote {args.output}", file=sys.stderr)
    else:
        sys.stdout.write(text)
    return 0


def _cmd_validate_out_dir(args: argparse.Namespace) -> int:
    d = Path(args.out_dir).resolve()
    if not d.is_dir():
        print(f"validate-out-dir: FAIL: not a directory: {d}", file=sys.stderr)
        return 1
    rows: list[dict[str, Any]] = []
    missing_tier1 = False
    for key, fname in OUT_DIR_STANDARD_FILENAMES.items():
        p = d / fname
        exists = p.is_file()
        rows.append({"key": key, "filename": fname, "exists": exists, "path": str(p)})
        if key in ("broadcast_request_stub_json", "execution_report_json") and not exists:
            missing_tier1 = True
    rep = {
        "anchor": RUNBOOK_ANCHOR,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "generated_at_utc": _utc_now(),
        "out_dir": str(d),
        "entries": rows,
        "tier1_complete": not missing_tier1,
        "notes": "tier1 = stub + execution_report (recommended before B-282 resume or B-262 re-run planning).",
    }
    print(json.dumps(rep, indent=2, ensure_ascii=False), file=sys.stderr if args.quiet_stdout else sys.stdout)
    if args.strict and missing_tier1:
        print("validate-out-dir: FAIL: strict mode and tier1 files missing", file=sys.stderr)
        return 1
    return 0


def _cmd_check_resume(args: argparse.Namespace) -> int:
    stub_path = Path(args.broadcast_request_stub).resolve()
    prior_path = Path(args.prior_execution_report).resolve()
    raw = stub_path.read_bytes()
    prior = json.loads(prior_path.read_text(encoding="utf-8"))
    if not isinstance(prior, dict):
        print("check-resume-eligibility: FAIL: prior JSON must be object", file=sys.stderr)
        return 1
    stub_sha = _sha256_bytes(raw)
    elig = _resume_eligibility_dict(stub_sha256_hex=stub_sha, prior=prior)
    out = {
        "anchor": RUNBOOK_ANCHOR,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "generated_at_utc": _utc_now(),
        "broadcast_request_stub": str(stub_path),
        "prior_execution_report": str(prior_path),
        "stub_sha256_hex": stub_sha,
        **elig,
    }
    text = json.dumps(out, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        Path(args.output).write_text(text, encoding="utf-8")
        print(f"wrote {args.output}", file=sys.stderr)
    else:
        sys.stdout.write(text)
    if not elig["resume_with_b282_eligible"]:
        return 1
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    import importlib.util
    import tempfile

    spec = importlib.util.spec_from_file_location(
        "b262_exec", Path(__file__).resolve().parent / "region_vault_claim_broadcast_execute.py"
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    br, raw_stub = mod._embedded_self_test_minimal_broadcast_stub()  # type: ignore[attr-defined]
    stub_sha = _sha256_bytes(raw_stub)

    prior_ok: dict[str, Any] = {
        "anchor": EXECUTION_REPORT_ANCHOR,
        "rule_version": EXECUTION_REPORT_RULE_VERSION,
        "source_broadcast_request_stub_sha256_hex": stub_sha,
        "execution_steps": [],
    }
    e1 = _resume_eligibility_dict(stub_sha256_hex=stub_sha, prior=prior_ok)
    assert e1["resume_with_b282_eligible"] is True, e1

    prior_bad = dict(prior_ok)
    prior_bad["source_broadcast_request_stub_sha256_hex"] = "0" * 64
    e2 = _resume_eligibility_dict(stub_sha256_hex=stub_sha, prior=prior_bad)
    assert e2["resume_with_b282_eligible"] is False

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        doc = build_runbook_document(
            out_dir=root,
            broadcast_request_stub_path=None,
            prior_execution_report_path=None,
            nonce_preflight_report_path=None,
            signing_order_static_path=None,
        )
        assert doc["anchor"] == RUNBOOK_ANCHOR
        assert doc["implementation_tt"] == IMPLEMENTATION_TT
        b304 = doc.get("b304_rpc_key_rotation_runbook")
        assert isinstance(b304, dict)
        assert b304.get("implementation_tt") == "TT-B304-RPC-KEY-ROTATION-RUNBOOK-001"
        assert isinstance(doc.get("b299_runbook_version_pin"), dict)
        assert doc["b299_runbook_version_pin"].get("implementation_tt") == "TT-B299-RUNBOOK-VERSION-PIN-001"
        ann = doc.get("command_templates_version_annotated")
        assert isinstance(ann, list) and len(ann) == len(doc.get("command_templates") or [])
        assert "resume_eligibility" not in doc

        (root / OUT_DIR_STANDARD_FILENAMES["broadcast_request_stub_json"]).write_bytes(raw_stub)
        doc2 = build_runbook_document(
            out_dir=root,
            broadcast_request_stub_path=root / OUT_DIR_STANDARD_FILENAMES["broadcast_request_stub_json"],
            prior_execution_report_path=None,
            nonce_preflight_report_path=None,
            signing_order_static_path=None,
        )
        assert doc2.get("resume_eligibility") is not None
        assert doc2["resume_eligibility"]["resume_with_b282_eligible"] is False

        (root / OUT_DIR_STANDARD_FILENAMES["execution_report_json"]).write_text(
            json.dumps(prior_ok, ensure_ascii=False), encoding="utf-8"
        )
        stub_p = root / OUT_DIR_STANDARD_FILENAMES["broadcast_request_stub_json"]
        prior_p = root / OUT_DIR_STANDARD_FILENAMES["execution_report_json"]
        doc3 = build_runbook_document(
            out_dir=root,
            broadcast_request_stub_path=stub_p,
            prior_execution_report_path=prior_p,
            nonce_preflight_report_path=None,
            signing_order_static_path=None,
        )
        assert doc3["resume_eligibility"]["resume_with_b282_eligible"] is True

    print(f"region_vault_claim_broadcast_partial_run_operator_runbook self-test OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description=(
            f"{MOTHER_TABLE}: operator OUT_DIR layout + B-282 resume eligibility + command templates "
            f"({IMPLEMENTATION_TT})."
        )
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    em = sub.add_parser(
        "emit",
        help="write machine-readable partial-run recovery runbook JSON",
    )
    em.add_argument("--out-dir", help="operator session directory (optional; fills default sibling filenames when present)")
    em.add_argument("--broadcast-request-stub", help="B-256 stub path (optional; default under --out-dir if file exists)")
    em.add_argument("--prior-execution-report", help="partial B-262 execution_report path (optional)")
    em.add_argument("--nonce-preflight-report", help="B-276 report path (optional)")
    em.add_argument(
        "--signing-order-static-table",
        help="B-277 signing_order_static JSON path (optional)",
    )
    em.add_argument("-o", "--output", help="write JSON to path (default: stdout)")
    em.set_defaults(func=_cmd_emit)

    vo = sub.add_parser(
        "validate-out-dir",
        help="check OUT_DIR for standard broadcast-chain filenames",
    )
    vo.add_argument("out_dir", help="directory to scan")
    vo.add_argument(
        "--strict",
        action="store_true",
        help="exit 1 if broadcast_request_stub.json or execution_report.json is missing",
    )
    vo.add_argument(
        "--quiet-stdout",
        action="store_true",
        help="print JSON report to stderr instead of stdout",
    )
    vo.set_defaults(func=_cmd_validate_out_dir)

    cr = sub.add_parser(
        "check-resume-eligibility",
        help="B-282 gate: prior execution_report must match current stub SHA256",
    )
    cr.add_argument("broadcast_request_stub", help="current B-256 stub JSON path")
    cr.add_argument("prior_execution_report", help="prior B-262 execution_report JSON path")
    cr.add_argument("-o", "--output", help="optional write JSON to path")
    cr.set_defaults(func=_cmd_check_resume)

    st = sub.add_parser("self-test", help="offline assertions")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    try:
        return int(args.func(args))
    except (ValueError, OSError, UnicodeDecodeError, json.JSONDecodeError) as e:
        print(f"partial-run-operator-runbook: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
