#!/usr/bin/env python3
"""TT-B277: static global signing-order table JSON (B-256 stub; B-257-aligned total order).

**B-257 对齐**：``global_broadcast_sequence`` 的全序键为 ``(int(signing_order or 0), str(batch_plan_id))``；
数组下标顺序须等于该键升序排列（与 ``region_vault_claim_broadcast_dryrun_rehearsal.run_rehearsal`` /
``region_vault_claim_broadcast_nonce_preflight.run_nonce_preflight`` 所用 ``_steps_match_canonical_order`` 一致）。

**机读锚（契约）**
- **anchor** (string, required): ``14-REGIONVAULT-CLAIM-BROADCAST-SIGNING-ORDER-STATIC-TABLE-V1``
- **rule_version** (string, required): ``region_vault_claim_broadcast_signing_order_static_table_v1``

**根字段（emit 输出）**
- **mother_table**: ``B-277``
- **implementation_tt**: ``TT-B277-MULTISTEP-SIGNING-ORDER-CROSS-BATCH-001``
- **generated_at_utc**: RFC3339-ish UTC ``%Y-%m-%dT%H:%M:%SZ``
- **source_broadcast_request_stub_sha256_hex**: stub 文件**原始字节** SHA256 hex（与 B-262/B-276 对 stub 绑定口径一致）
- **source_broadcast_request_anchor** / **source_broadcast_request_rule_version**: 自 stub 透传
- **stub_conforms_to_canonical_total_order** (bool): 与 B-257 通过条件等价
- **canonicalization_errors** (string[]): 不合序时非空；合序时 ``[]``
- **order_rows** (object[]): 按规范全序稳定排序；每项含 **canonical_rank** (0-based)、**global_index**（stub 原数组下标）、
  **signing_order**、**batch_plan_id**、**ordinal**
- **signing_order_static_table_canonical_sha256_hex**: 对**去掉本字段后**的正文做 JSON canonical
  (``sort_keys=True``, ``separators=(',', ':')``, ``ensure_ascii=False``) 的 SHA256 hex
- **notes**: 人类可读说明

**验收命令**（``PYTHONPATH=scripts/ops``）::

    python scripts/ops/region_vault_claim_broadcast_signing_order_static.py self-test
    python scripts/ops/region_vault_claim_broadcast_signing_order_static.py emit STUB.json -o table.json
    python scripts/ops/region_vault_claim_broadcast_signing_order_static.py verify STUB.json table.json

**CLI**
- **emit**: 写表；stub 与规范序不一致时默认 stderr WARN 仍 exit 0；``--strict`` 则 exit 1
- **verify**: 校验 anchor/rule_version、stub SHA、canonical 自哈希、且 ``stub_conforms_to_canonical_total_order`` 为 true

**B-262 / B-282 接线**：``region_vault_claim_broadcast_execute.py`` 的 ``execute`` 支持 ``--signing-order-static-table PATH``（可选）；
传入时于发送前调用 ``validate_signing_order_static_table_json``；成功则 ``execution_report`` 含 ``signing_order_static_table_validated: true``。
``region_vault_claim_broadcast_pipeline_resume.py`` ``resume-execute`` 支持同名可选参数并转发给 ``execute``。
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from region_vault_claim_broadcast_nonce_preflight import (
    BROADCAST_REQUEST_ANCHOR,
    _steps_match_canonical_order,
)
from region_vault_claim_broadcast_dryrun_rehearsal import BROADCAST_REQUEST_RULE_VERSION

TABLE_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-SIGNING-ORDER-STATIC-TABLE-V1"
TABLE_RULE_VERSION = "region_vault_claim_broadcast_signing_order_static_table_v1"
IMPLEMENTATION_TT = "TT-B277-MULTISTEP-SIGNING-ORDER-CROSS-BATCH-001"
MOTHER_TABLE = "B-277"


def _sha256_canonical_json(obj: dict[str, Any]) -> str:
    body = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(body).hexdigest()


def _canonical_sequence_order_key(entry: dict[str, Any]) -> tuple[int, str]:
    try:
        so = int(entry.get("signing_order") or 0)
    except (TypeError, ValueError):
        so = 0
    return (so, str(entry.get("batch_plan_id") or ""))


def build_signing_order_static_table(stub: dict[str, Any], raw_stub_bytes: bytes) -> dict[str, Any]:
    if stub.get("anchor") != BROADCAST_REQUEST_ANCHOR:
        raise ValueError(f"stub.anchor must be {BROADCAST_REQUEST_ANCHOR!r} (got {stub.get('anchor')!r})")
    if str(stub.get("rule_version") or "") != BROADCAST_REQUEST_RULE_VERSION:
        raise ValueError(
            f"stub.rule_version must be {BROADCAST_REQUEST_RULE_VERSION!r} (got {stub.get('rule_version')!r})"
        )
    global_seq = stub.get("global_broadcast_sequence")
    if not isinstance(global_seq, list) or not global_seq:
        raise ValueError("global_broadcast_sequence must be a non-empty array")

    ok_order, msg = _steps_match_canonical_order(global_seq)
    errs: list[str] = [] if ok_order else [msg]

    canon_indices = sorted(range(len(global_seq)), key=lambda i: _canonical_sequence_order_key(global_seq[i]))
    order_rows: list[dict[str, Any]] = []
    for rank, gi in enumerate(canon_indices):
        e = global_seq[gi]
        if not isinstance(e, dict):
            continue
        order_rows.append(
            {
                "canonical_rank": rank,
                "global_index": gi,
                "signing_order": e.get("signing_order"),
                "batch_plan_id": str(e.get("batch_plan_id") or ""),
                "ordinal": e.get("ordinal"),
            }
        )

    stub_sha = hashlib.sha256(raw_stub_bytes).hexdigest()
    body: dict[str, Any] = {
        "anchor": TABLE_ANCHOR,
        "rule_version": TABLE_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_broadcast_request_stub_sha256_hex": stub_sha,
        "source_broadcast_request_anchor": stub.get("anchor"),
        "source_broadcast_request_rule_version": stub.get("rule_version"),
        "stub_conforms_to_canonical_total_order": bool(ok_order),
        "canonicalization_errors": list(errs),
        "order_rows": order_rows,
        "notes": "B-277: canonical total order (signing_order, batch_plan_id) must match B-257 / B-276; global_index is original stub position.",
    }
    canon = {k: v for k, v in body.items() if k != "signing_order_static_table_canonical_sha256_hex"}
    body["signing_order_static_table_canonical_sha256_hex"] = _sha256_canonical_json(canon)
    return body


def _validate_table_against_stub(table: dict[str, Any], raw_stub_bytes: bytes) -> None:
    if table.get("anchor") != TABLE_ANCHOR:
        raise ValueError(f"table.anchor must be {TABLE_ANCHOR!r} (got {table.get('anchor')!r})")
    if str(table.get("rule_version") or "") != TABLE_RULE_VERSION:
        raise ValueError(f"table.rule_version must be {TABLE_RULE_VERSION!r} (got {table.get('rule_version')!r})")
    want = str(table.get("source_broadcast_request_stub_sha256_hex") or "").lower()
    got = hashlib.sha256(raw_stub_bytes).hexdigest().lower()
    if not want or want != got:
        raise ValueError("table source_broadcast_request_stub_sha256_hex does not match current stub file bytes")
    stored = table.get("signing_order_static_table_canonical_sha256_hex")
    if isinstance(stored, str) and stored.strip():
        canon = {k: v for k, v in table.items() if k != "signing_order_static_table_canonical_sha256_hex"}
        computed = _sha256_canonical_json(canon)
        if str(stored).strip().lower() != computed.lower():
            raise ValueError("signing_order_static_table_canonical_sha256_hex mismatch (table tampered or reserialized)")
    if table.get("stub_conforms_to_canonical_total_order") is not True:
        raise ValueError(
            "stub_conforms_to_canonical_total_order is not true; fix stub order or regenerate after B-256 reorder"
        )


def validate_signing_order_static_table_json(tab: dict[str, Any], raw_stub_bytes: bytes) -> None:
    """B-262 / B-282 gate: same checks as ``verify`` subcommand (stub SHA, anchor/rule, conform, canonical hash)."""
    _validate_table_against_stub(tab, raw_stub_bytes)


def _cmd_emit(args: argparse.Namespace) -> int:
    raw = Path(args.broadcast_request_stub).read_bytes()
    stub = json.loads(raw.decode("utf-8"))
    try:
        rep = build_signing_order_static_table(stub, raw)
    except (ValueError, json.JSONDecodeError, OSError) as e:
        print(f"signing-order-static emit: FAIL: {e}", file=sys.stderr)
        return 1
    outp = Path(args.output)
    outp.write_text(json.dumps(rep, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {args.output}", file=sys.stderr)
    if not rep.get("stub_conforms_to_canonical_total_order"):
        print(
            "signing-order-static emit: WARN: stub order != canonical total order (see canonicalization_errors)",
            file=sys.stderr,
        )
        if args.strict:
            return 1
    return 0


def _cmd_verify(args: argparse.Namespace) -> int:
    raw = Path(args.broadcast_request_stub).read_bytes()
    tab = json.loads(Path(args.signing_order_static_table).read_text(encoding="utf-8"))
    try:
        _validate_table_against_stub(tab, raw)
    except (ValueError, OSError, json.JSONDecodeError) as e:
        print(f"signing-order-static verify: FAIL: {e}", file=sys.stderr)
        return 1
    print("region_vault_claim_broadcast_signing_order_static: verify OK", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    def stub_rows(seq: list[dict[str, Any]]) -> dict[str, Any]:
        return {
            "anchor": BROADCAST_REQUEST_ANCHOR,
            "rule_version": BROADCAST_REQUEST_RULE_VERSION,
            "global_broadcast_sequence": seq,
        }

    ok_seq = [
        {"signing_order": 0, "batch_plan_id": "JUR:A|EPOCH:1", "ordinal": 0},
        {"signing_order": 1, "batch_plan_id": "JUR:B|EPOCH:1", "ordinal": 0},
    ]
    raw_ok = json.dumps(stub_rows(ok_seq), ensure_ascii=False).encode("utf-8")
    t_ok = build_signing_order_static_table(json.loads(raw_ok.decode("utf-8")), raw_ok)
    assert t_ok["stub_conforms_to_canonical_total_order"] is True
    assert len(t_ok["order_rows"]) == 2
    assert t_ok["order_rows"][0]["global_index"] == 0

    bad_seq = list(reversed(ok_seq))
    raw_bad = json.dumps(stub_rows(bad_seq), ensure_ascii=False).encode("utf-8")
    t_bad = build_signing_order_static_table(json.loads(raw_bad.decode("utf-8")), raw_bad)
    assert t_bad["stub_conforms_to_canonical_total_order"] is False
    assert t_bad["canonicalization_errors"]

    _validate_table_against_stub(t_ok, raw_ok)
    try:
        _validate_table_against_stub(t_bad, raw_bad)
    except ValueError:
        pass
    else:
        raise AssertionError("expected verify failure on non-conforming stub")

    print(f"region_vault_claim_broadcast_signing_order_static self-test OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-277: static signing-order table for B-256 broadcast_request_stub (canonical total order).",
        epilog=(
            "Contract: anchor=14-REGIONVAULT-CLAIM-BROADCAST-SIGNING-ORDER-STATIC-TABLE-V1 | "
            "rule_version=region_vault_claim_broadcast_signing_order_static_table_v1 | "
            "full JSON field contract in module docstring."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    em = sub.add_parser("emit", help="read stub, write signing_order_static_table JSON (-o)")
    em.add_argument("broadcast_request_stub", help="B-256 broadcast_request_stub JSON path")
    em.add_argument("-o", "--output", required=True, help="output JSON path")
    em.add_argument(
        "--strict",
        action="store_true",
        help="exit 1 if stub_conforms_to_canonical_total_order is false (default: warn only)",
    )
    em.set_defaults(func=_cmd_emit)

    vf = sub.add_parser("verify", help="check table matches stub SHA and canonical hash; require conform true")
    vf.add_argument("broadcast_request_stub", help="B-256 stub path")
    vf.add_argument("signing_order_static_table", help="B-277 table JSON from emit")
    vf.set_defaults(func=_cmd_verify)

    st = sub.add_parser("self-test", help="embedded checks")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
