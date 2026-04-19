#!/usr/bin/env python3
"""B-478：机读校验 config/b478_pg_pool_release_gate_thresholds.v1.json 存在、schema 与数值范围合法。"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

_GATES = Path(__file__).resolve().parent
if str(_GATES) not in sys.path:
    sys.path.insert(0, str(_GATES))
from _b478_baseline_hash import b478_canonical_sha256  # noqa: E402

ANCHOR = "B478-THRESHOLDS-BASELINE-V1"
SCHEMA = "traveltrust_b478_pg_pool_release_gate_thresholds.v1"


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    path = root / "config" / "b478_pg_pool_release_gate_thresholds.v1.json"
    if not path.is_file():
        print(f"check-b478-thresholds-baseline: missing {path}", file=sys.stderr)
        return 1
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"check-b478-thresholds-baseline: invalid JSON: {e}", file=sys.stderr)
        return 1
    if data.get("schema") != SCHEMA:
        print("check-b478-thresholds-baseline: schema mismatch", file=sys.stderr)
        return 1
    if not data.get("version"):
        print("check-b478-thresholds-baseline: missing version", file=sys.stderr)
        return 1
    if not data.get("updated_at"):
        print("check-b478-thresholds-baseline: missing updated_at", file=sys.stderr)
        return 1
    expect_hash = data.get("content_sha256")
    if expect_hash:
        got = b478_canonical_sha256(data)
        if got != expect_hash:
            print(
                f"check-b478-thresholds-baseline: content_sha256 mismatch (got {got}, file {expect_hash}); "
                f"run python scripts/gates/refresh-b478-baseline-hash.py",
                file=sys.stderr,
            )
            return 1
    elif os.environ.get("B478_REQUIRE_CONTENT_SHA256", "").strip() in ("1", "true", "yes"):
        print("check-b478-thresholds-baseline: content_sha256 required (B478_REQUIRE_CONTENT_SHA256=1)", file=sys.stderr)
        return 1
    th = data.get("thresholds")
    if not isinstance(th, dict):
        print("check-b478-thresholds-baseline: missing thresholds object", file=sys.stderr)
        return 1
    req = (
        "max_acquire_timeout_delta",
        "max_slow_acquire_delta",
        "peak_utilization_max",
        "recovery_target_util",
        "recovery_timeout_sec",
        "recovery_poll_ms",
        "max_http_error_ratio",
    )
    for k in req:
        if k not in th:
            print(f"check-b478-thresholds-baseline: missing thresholds.{k}", file=sys.stderr)
            return 1
    if not (0.0 <= float(th["peak_utilization_max"]) <= 1.0):
        print("check-b478-thresholds-baseline: peak_utilization_max out of range", file=sys.stderr)
        return 1
    if not (0.0 <= float(th["recovery_target_util"]) <= 1.0):
        print("check-b478-thresholds-baseline: recovery_target_util out of range", file=sys.stderr)
        return 1
    if float(th["recovery_timeout_sec"]) <= 0:
        print("check-b478-thresholds-baseline: recovery_timeout_sec must be > 0", file=sys.stderr)
        return 1
    if int(th["recovery_poll_ms"]) < 50:
        print("check-b478-thresholds-baseline: recovery_poll_ms too small", file=sys.stderr)
        return 1
    if not (0.0 <= float(th["max_http_error_ratio"]) <= 1.0):
        print("check-b478-thresholds-baseline: max_http_error_ratio out of range", file=sys.stderr)
        return 1
    if "warn_utilization_above" in th:
        w = float(th["warn_utilization_above"])
        if not (0.0 <= w <= 1.0) or w > float(th["peak_utilization_max"]) + 1e-9:
            print("check-b478-thresholds-baseline: warn_utilization_above invalid or > peak_utilization_max", file=sys.stderr)
            return 1
    print(f"check-b478-thresholds-baseline: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
