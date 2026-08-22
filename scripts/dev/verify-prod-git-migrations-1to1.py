#!/usr/bin/env python3
"""Verify crates/api/migrations matches Official Production _sqlx_migrations 1:1.

Uses existing OFFICIAL_PROD_SCHEMA_CAPTURE_LATEST.json (no Production reconnect).
Checksum = SHA384(content)[:8] big-endian signed i64 (sqlx 0.8).
"""
from __future__ import annotations

import argparse
import ast
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def sqlx_checksum(content: bytes) -> int:
    return int.from_bytes(hashlib.sha384(content).digest()[:8], "big", signed=True)


def decode_checksum(raw: Any) -> int:
    if isinstance(raw, int):
        return raw
    if isinstance(raw, (bytes, bytearray)):
        return int.from_bytes(raw[:8], "big", signed=True)
    return int.from_bytes(ast.literal_eval(str(raw).strip())[:8], "big", signed=True)


def ver_from_name(name: str) -> int | None:
    m = re.match(r"^(\d+)_", name)
    return int(m.group(1)) if m else None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--capture",
        default="evidence/GO_official_product_reality_capture/OFFICIAL_PROD_SCHEMA_CAPTURE_LATEST.json",
    )
    ap.add_argument("--migrations-dir", default="crates/api/migrations")
    ap.add_argument(
        "--out",
        default="evidence/GO_official_product_reality_capture/PROD_GIT_MIGRATION_VERIFY_LATEST.json",
    )
    args = ap.parse_args()

    cap = json.loads(Path(args.capture).read_text(encoding="utf-8"))
    prod_rows = cap["production"]["migration_state"]["_sqlx_migrations"]["rows"]
    prod_by_v = {int(r["version"]): r for r in prod_rows}

    mig_dir = Path(args.migrations_dir)
    git_by_v: dict[int, Path] = {}
    for p in sorted(mig_dir.glob("*.sql")):
        v = ver_from_name(p.name)
        if v is not None:
            git_by_v[v] = p

    only_prod = sorted(set(prod_by_v) - set(git_by_v))
    only_git = sorted(set(git_by_v) - set(prod_by_v))
    checksum_fail: list[dict[str, Any]] = []
    checksum_pass = 0
    order_ok = True
    prod_versions = [int(r["version"]) for r in prod_rows]
    git_versions = sorted(git_by_v)

    for v in sorted(set(prod_by_v) & set(git_by_v)):
        content = git_by_v[v].read_bytes()
        calc = sqlx_checksum(content)
        target = decode_checksum(prod_by_v[v]["checksum"])
        if calc == target:
            checksum_pass += 1
        else:
            checksum_fail.append(
                {
                    "version": v,
                    "file": git_by_v[v].name,
                    "git_checksum": calc,
                    "prod_checksum": target,
                }
            )

    # execution order: git file sort order should match prod applied order for shared set
    shared = [v for v in prod_versions if v in git_by_v]
    if shared != git_versions:
        order_ok = False

    version_set_match = not only_prod and not only_git
    checksum_all_match = not checksum_fail and checksum_pass == len(prod_by_v)
    verdict = "MATCH_1TO1" if version_set_match and checksum_all_match and order_ok else "DRIFT"

    out = {
        "schema": "traveltrust.prod_git_migration_verify.v1",
        "recorded_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "capture_artifact": args.capture,
        "migrations_dir": str(mig_dir).replace("\\", "/"),
        "prod_migration_count": len(prod_by_v),
        "git_sql_file_count": len(git_by_v),
        "version_set_match": version_set_match,
        "checksum_all_match": checksum_all_match,
        "execution_order_match": order_ok,
        "checksum_pass_count": checksum_pass,
        "checksum_fail_count": len(checksum_fail),
        "checksum_fail_sample": checksum_fail[:20],
        "only_in_prod_not_git": only_prod,
        "only_in_git_not_prod": only_git,
        "verdict": verdict,
        "recovery_source": "Official Production API container /app/crates/api/migrations (read-only fly ssh cat)",
        "recovered_versions": [20260816180000, 20260816190000, 20260816200000],
    }

    text = json.dumps(out, indent=2, ensure_ascii=False) + "\n"
    out_path = Path(args.out)
    out_path.write_text(text, encoding="utf-8")
    stamped = out_path.with_name(
        f"PROD_GIT_MIGRATION_VERIFY_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
    )
    stamped.write_text(text, encoding="utf-8")
    print(json.dumps({"verdict": verdict, "out": str(out_path)}, indent=2))
    return 0 if verdict == "MATCH_1TO1" else 2


if __name__ == "__main__":
    raise SystemExit(main())
