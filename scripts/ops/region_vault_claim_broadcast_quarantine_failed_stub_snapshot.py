#!/usr/bin/env python3
# B-285: copy failed / suspect B-256 stub (+ optional B-262/B-276 artifacts) into a quarantine bundle and record in operator_run_evidence.json.
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from region_vault_claim_broadcast_operator_run_structured import (
    IMPLEMENTATION_TT as B296_IMPLEMENTATION_TT,
    append_structured_event_jsonl,
    build_b296_operator_run_context_block,
)

QUARANTINE_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-QUARANTINE-SNAPSHOT-V1"
QUARANTINE_RULE_VERSION = "region_vault_claim_broadcast_quarantine_snapshot_v1"
IMPLEMENTATION_TT = "TT-B285-QUARANTINE-FAILED-STUB-SNAPSHOT-001"
MOTHER_TABLE = "B-285"

OPERATOR_RUN_EVIDENCE_FILENAME = "operator_run_evidence.json"
QUARANTINE_ROOT_DIRNAME = "quarantine_snapshots"


def _utc_slug() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _sha256_canonical_json(obj: dict[str, Any]) -> str:
    body = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(body).hexdigest()


def _copy_if_present(src: Path | None, dest: Path) -> tuple[str, str] | None:
    if src is None or not src.is_file():
        return None
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    raw = dest.read_bytes()
    return dest.name, _sha256_bytes(raw)


def _load_or_init_operator_run_evidence(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {
            "tt_id": "TT-B285-QUARANTINE-SNAPSHOT-PLACEHOLDER-001",
            "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "anchors": {},
            "notes": "B-285: operator_run_evidence initialized by quarantine snapshot writer; enrich tt_id/operator fields as needed.",
        }
    raw = path.read_text(encoding="utf-8")
    obj = json.loads(raw)
    if not isinstance(obj, dict):
        raise ValueError(f"{path.name}: root must be JSON object")
    return obj


def write_quarantine_snapshot(
    *,
    out_dir: Path,
    broadcast_request_stub: Path,
    execution_report: Path | None,
    nonce_preflight_report: Path | None,
    failure_reason_operator: str,
    tt_id: str | None,
) -> dict[str, Any]:
    out_dir = out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    slug = _utc_slug()
    rel_bundle = f"{QUARANTINE_ROOT_DIRNAME}/{slug}"
    bundle_dir = out_dir / QUARANTINE_ROOT_DIRNAME / slug
    bundle_dir.mkdir(parents=True, exist_ok=True)

    stub_dest = bundle_dir / "broadcast_request_stub.json"
    shutil.copy2(broadcast_request_stub, stub_dest)
    stub_raw = stub_dest.read_bytes()
    stub_sha = _sha256_bytes(stub_raw)

    optional_shas: dict[str, str] = {}
    included: list[str] = ["broadcast_request_stub.json"]

    er = _copy_if_present(execution_report, bundle_dir / "execution_report.json")
    if er:
        included.append(er[0])
        optional_shas["execution_report_sha256_hex"] = er[1]

    pf = _copy_if_present(nonce_preflight_report, bundle_dir / "nonce_preflight_report.json")
    if pf:
        included.append(pf[0])
        optional_shas["nonce_preflight_report_sha256_hex"] = pf[1]

    manifest_body: dict[str, Any] = {
        "anchor": QUARANTINE_ANCHOR,
        "rule_version": QUARANTINE_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "broadcast_request_stub_sha256_hex": stub_sha,
        "included_files": included,
        "failure_reason_operator": failure_reason_operator.strip() or "(none)",
        "quarantine_bundle_relative_dir": rel_bundle,
        "source_paths_redacted_note": "Original absolute paths are not stored; operator maps filenames to local copies.",
    }
    if optional_shas:
        manifest_body["optional_artifact_sha256_hex"] = optional_shas

    canon = {k: v for k, v in manifest_body.items() if k != "quarantine_manifest_canonical_sha256_hex"}
    manifest_body["quarantine_manifest_canonical_sha256_hex"] = _sha256_canonical_json(canon)
    manifest_path = bundle_dir / "quarantine_manifest.json"
    manifest_path.write_text(json.dumps(manifest_body, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    ore_path = out_dir / OPERATOR_RUN_EVIDENCE_FILENAME
    ore = _load_or_init_operator_run_evidence(ore_path)
    if tt_id:
        ore["tt_id"] = tt_id
    snaps = ore.get("b285_quarantine_snapshots")
    if not isinstance(snaps, list):
        snaps = []
    entry: dict[str, Any] = {
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "created_at_utc": manifest_body["generated_at_utc"],
        "failure_reason_operator": manifest_body["failure_reason_operator"],
        "quarantine_bundle_relative_dir": rel_bundle,
        "broadcast_request_stub_sha256_hex": stub_sha,
        "quarantine_manifest_filename": "quarantine_manifest.json",
    }
    if optional_shas:
        entry["optional_artifact_sha256_hex"] = dict(optional_shas)
    snaps.append(entry)
    ore["b285_quarantine_snapshots"] = snaps
    if "anchors" not in ore or not isinstance(ore["anchors"], dict):
        ore["anchors"] = {}
    ore["anchors"]["b285_quarantine_snapshot"] = QUARANTINE_ANCHOR
    ore["generated_at_utc"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    ore["b296_operator_run_context"] = build_b296_operator_run_context_block(repo_search_start=out_dir)

    ore_path.write_text(json.dumps(ore, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    append_structured_event_jsonl(
        out_dir,
        event_type="b285_quarantine_snapshot",
        payload={
            "quarantine_bundle_relative_dir": rel_bundle,
            "broadcast_request_stub_sha256_hex": stub_sha,
            "failure_reason_operator": manifest_body["failure_reason_operator"],
            "implementation_tt": IMPLEMENTATION_TT,
        },
        repo_search_start=out_dir,
    )

    return {
        "operator_run_evidence_path": str(ore_path),
        "quarantine_bundle_dir": str(bundle_dir),
        "quarantine_manifest_path": str(manifest_path),
        "broadcast_request_stub_sha256_hex": stub_sha,
        "b285_entry": entry,
    }


def _cmd_write(args: argparse.Namespace) -> int:
    out_dir = Path(args.out_dir).resolve()
    stub = Path(args.broadcast_request_stub).resolve()
    er = Path(args.execution_report).resolve() if args.execution_report else None
    pf = Path(args.nonce_preflight_report).resolve() if args.nonce_preflight_report else None
    summary = write_quarantine_snapshot(
        out_dir=out_dir,
        broadcast_request_stub=stub,
        execution_report=er,
        nonce_preflight_report=pf,
        failure_reason_operator=str(args.failure_reason or ""),
        tt_id=str(args.tt_id).strip() if args.tt_id else None,
    )
    if args.print_summary:
        print(json.dumps(summary, indent=2, ensure_ascii=False), file=sys.stdout)
    print(f"wrote {summary['quarantine_manifest_path']}", file=sys.stderr)
    print(f"updated {summary['operator_run_evidence_path']}", file=sys.stderr)
    return 0


def _cmd_validate(args: argparse.Namespace) -> int:
    root = Path(args.out_dir).resolve()
    rel = args.bundle_subdir.strip().replace("\\", "/")
    if ".." in rel or rel.startswith("/"):
        print("validate-quarantine: FAIL: invalid bundle_subdir", file=sys.stderr)
        return 1
    bundle = root / rel
    manp = bundle / "quarantine_manifest.json"
    if not manp.is_file():
        print(f"validate-quarantine: FAIL: missing {manp}", file=sys.stderr)
        return 1
    man = json.loads(manp.read_text(encoding="utf-8"))
    if not isinstance(man, dict):
        print("validate-quarantine: FAIL: manifest must be object", file=sys.stderr)
        return 1
    if man.get("anchor") != QUARANTINE_ANCHOR:
        print("validate-quarantine: FAIL: manifest.anchor mismatch", file=sys.stderr)
        return 1
    want = str(man.get("broadcast_request_stub_sha256_hex") or "").lower()
    stubp = bundle / "broadcast_request_stub.json"
    if not stubp.is_file():
        print("validate-quarantine: FAIL: missing stub copy", file=sys.stderr)
        return 1
    got = _sha256_bytes(stubp.read_bytes()).lower()
    if want != got:
        print("validate-quarantine: FAIL: stub sha mismatch", file=sys.stderr)
        return 1
    opt = man.get("optional_artifact_sha256_hex")
    if isinstance(opt, dict):
        for key, expect in opt.items():
            fname = {
                "execution_report_sha256_hex": "execution_report.json",
                "nonce_preflight_report_sha256_hex": "nonce_preflight_report.json",
            }.get(key)
            if not fname:
                continue
            fp = bundle / fname
            if not fp.is_file():
                print(f"validate-quarantine: FAIL: missing {fname}", file=sys.stderr)
                return 1
            if _sha256_bytes(fp.read_bytes()).lower() != str(expect).lower():
                print(f"validate-quarantine: FAIL: sha mismatch for {fname}", file=sys.stderr)
                return 1
    stored = str(man.get("quarantine_manifest_canonical_sha256_hex") or "")
    body = {k: v for k, v in man.items() if k != "quarantine_manifest_canonical_sha256_hex"}
    calc = _sha256_canonical_json(body)
    if stored.lower() != calc.lower():
        print("validate-quarantine: FAIL: manifest canonical sha mismatch", file=sys.stderr)
        return 1
    print(f"validate-quarantine: OK {bundle} ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    import tempfile

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        stub = root / "in_stub.json"
        stub.write_text('{"anchor":"14-REGIONVAULT-CLAIM-BROADCAST-REQUEST-STUB-V1","x":1}', encoding="utf-8")
        er = root / "in_er.json"
        er.write_text('{"anchor":"14-REGIONVAULT-CLAIM-BROADCAST-EXECUTION-REPORT-V1"}', encoding="utf-8")
        summary = write_quarantine_snapshot(
            out_dir=root,
            broadcast_request_stub=stub,
            execution_report=er,
            nonce_preflight_report=None,
            failure_reason_operator="self-test",
            tt_id="TT-B285-SELFTEST-001",
        )
        assert (root / OPERATOR_RUN_EVIDENCE_FILENAME).is_file()
        ore = json.loads((root / OPERATOR_RUN_EVIDENCE_FILENAME).read_text(encoding="utf-8"))
        assert ore.get("tt_id") == "TT-B285-SELFTEST-001"
        snaps = ore.get("b285_quarantine_snapshots")
        assert isinstance(snaps, list) and len(snaps) == 1
        rel = snaps[0]["quarantine_bundle_relative_dir"]
        assert rel.startswith(f"{QUARANTINE_ROOT_DIRNAME}/")
        assert ore.get("b296_operator_run_context", {}).get("implementation_tt") == B296_IMPLEMENTATION_TT
        jl = root / "operator_run_structured.jsonl"
        assert jl.is_file()
        jl_lines = [ln for ln in jl.read_text(encoding="utf-8").splitlines() if ln.strip()]
        assert len(jl_lines) == 1

        # second write appends
        write_quarantine_snapshot(
            out_dir=root,
            broadcast_request_stub=stub,
            execution_report=None,
            nonce_preflight_report=None,
            failure_reason_operator="second",
            tt_id=None,
        )
        ore2 = json.loads((root / OPERATOR_RUN_EVIDENCE_FILENAME).read_text(encoding="utf-8"))
        assert len(ore2.get("b285_quarantine_snapshots") or []) == 2
        jl_lines2 = [ln for ln in jl.read_text(encoding="utf-8").splitlines() if ln.strip()]
        assert len(jl_lines2) == 2

        code = _cmd_validate(
            argparse.Namespace(out_dir=str(root), bundle_subdir=rel),
        )
        assert code == 0

    print(f"region_vault_claim_broadcast_quarantine_failed_stub_snapshot self-test OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description=f"{MOTHER_TABLE}: quarantine failed stub snapshot → bundle + operator_run_evidence ({IMPLEMENTATION_TT})."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    w = sub.add_parser(
        "write-quarantine",
        help="copy stub (+ optional reports) under OUT_DIR/quarantine_snapshots/<UTC>/ and append operator_run_evidence.json",
    )
    w.add_argument("--out-dir", required=True, help="operator evidence directory (e.g. same OUT_DIR as B-284)")
    w.add_argument("--broadcast-request-stub", required=True, help="B-256 stub JSON path to quarantine")
    w.add_argument("--execution-report", help="optional B-262 execution_report JSON to copy into bundle")
    w.add_argument("--nonce-preflight-report", help="optional B-276 nonce_preflight_report JSON to copy into bundle")
    w.add_argument(
        "--failure-reason",
        default="",
        help="free-text operator reason (stored in manifest + operator_run_evidence snapshot entry)",
    )
    w.add_argument(
        "--tt-id",
        help="optional override for operator_run_evidence.tt_id when initializing a new file",
    )
    w.add_argument(
        "--print-summary",
        action="store_true",
        help="print JSON summary to stdout",
    )
    w.set_defaults(func=_cmd_write)

    v = sub.add_parser(
        "validate-quarantine",
        help="verify quarantine_manifest.json canonical sha and on-disk file shas under OUT_DIR",
    )
    v.add_argument("--out-dir", required=True, metavar="OUT_DIR", help="operator evidence root")
    v.add_argument(
        "--bundle-subdir",
        required=True,
        metavar="REL_PATH",
        help=f"relative path under OUT_DIR, e.g. {QUARANTINE_ROOT_DIRNAME}/20260415T120000Z",
    )
    v.set_defaults(func=_cmd_validate)

    st = sub.add_parser("self-test", help="offline tempdir write + validate")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    try:
        return int(args.func(args))
    except (ValueError, OSError, UnicodeDecodeError, json.JSONDecodeError) as e:
        print(f"quarantine-failed-stub-snapshot: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
