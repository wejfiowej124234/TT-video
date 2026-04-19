#!/usr/bin/env python3
"""B-480：校验 config/b480_prod_fault_slo_gate.v1.json 存在、schema、content_sha256（可选）、B-478 指针文件存在。"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

_GATES = Path(__file__).resolve().parent
if str(_GATES) not in sys.path:
    sys.path.insert(0, str(_GATES))
from _b478_baseline_hash import b478_canonical_sha256  # noqa: E402

ANCHOR = "B480-PROD-FAULT-SLO-GATE-V1"
SCHEMA = "traveltrust_b480_prod_fault_slo_gate.v1"


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    path = root / "config" / "b480_prod_fault_slo_gate.v1.json"
    if not path.is_file():
        print(f"check-b480-gate-config: missing {path}", file=sys.stderr)
        return 1
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema") != SCHEMA:
        print("check-b480-gate-config: schema mismatch", file=sys.stderr)
        return 1
    if not data.get("version") or not data.get("updated_at"):
        print("check-b480-gate-config: missing version or updated_at", file=sys.stderr)
        return 1
    h = data.get("content_sha256")
    if h:
        got = b478_canonical_sha256(data)
        if got != h:
            print("check-b480-gate-config: content_sha256 mismatch (run refresh-b480-gate-config-hash.py)", file=sys.stderr)
            return 1
    elif os.environ.get("B480_REQUIRE_CONTENT_SHA256", "").strip() in ("1", "true", "yes"):
        print("check-b480-gate-config: content_sha256 required", file=sys.stderr)
        return 1
    b478_rel = data.get("inherits_pool_thresholds_from", "config/b478_pg_pool_release_gate_thresholds.v1.json")
    b478_path = (root / str(b478_rel).replace("\\", "/")).resolve()
    if not b478_path.is_file():
        print(f"check-b480-gate-config: B-478 baseline missing at {b478_path}", file=sys.stderr)
        return 1
    print(f"check-b480-gate-config: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
