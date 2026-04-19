#!/usr/bin/env python3
"""B-481：校验 config/b481_multi_region_dr_slo_gate.v1.json 存在、schema、content_sha256（可选）、B-478/B-480 指针文件存在。"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

_GATES = Path(__file__).resolve().parent
if str(_GATES) not in sys.path:
    sys.path.insert(0, str(_GATES))
from _b478_baseline_hash import b478_canonical_sha256  # noqa: E402

ANCHOR = "B481-MULTI-REGION-DR-SLO-GATE-V1"
SCHEMA = "traveltrust_b481_multi_region_dr_slo_gate.v1"


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    path = root / "config" / "b481_multi_region_dr_slo_gate.v1.json"
    if not path.is_file():
        print(f"check-b481-gate-config: missing {path}", file=sys.stderr)
        return 1
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema") != SCHEMA:
        print("check-b481-gate-config: schema mismatch", file=sys.stderr)
        return 1
    if not data.get("version") or not data.get("updated_at"):
        print("check-b481-gate-config: missing version or updated_at", file=sys.stderr)
        return 1
    h = data.get("content_sha256")
    if h:
        got = b478_canonical_sha256(data)
        if got != h:
            print("check-b481-gate-config: content_sha256 mismatch (run refresh-b481-gate-config-hash.py)", file=sys.stderr)
            return 1
    elif os.environ.get("B481_REQUIRE_CONTENT_SHA256", "").strip() in ("1", "true", "yes"):
        print("check-b481-gate-config: content_sha256 required", file=sys.stderr)
        return 1

    for key in ("inherits_pool_thresholds_from", "extends_single_region_fault_gate"):
        rel = data.get(key)
        if not rel:
            continue
        p = (root / str(rel).replace("\\", "/")).resolve()
        if not p.is_file():
            print(f"check-b481-gate-config: missing referenced file {key} -> {p}", file=sys.stderr)
            return 1

    print(f"check-b481-gate-config: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
