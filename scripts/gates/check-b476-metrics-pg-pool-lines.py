#!/usr/bin/env python3
"""B-476: /metrics 输出含 traveltrust_pg_pool_* 系列（与 db_pool_obs 同源）。"""
from __future__ import annotations

import sys
from pathlib import Path

ANCHOR = "B476-METRICS-PG-POOL-LINES-V1"
REQUIRED = (
    "traveltrust_pg_pool_acquire_timeout_total",
    "traveltrust_pg_pool_slow_acquire_total",
    "traveltrust_pg_pool_max_connections",
    "traveltrust_pg_pool_connections",
    "traveltrust_pg_pool_utilization_ratio",
    "append_prometheus_lines",
)


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    obs = root / "crates" / "api" / "src" / "db_pool_obs.rs"
    h = root / "crates" / "api" / "src" / "routes" / "health_meta" / "handlers.rs"
    for p in (obs, h):
        if not p.is_file():
            print(f"check-b476-metrics: missing {p}", file=sys.stderr)
            return 1
    ot = obs.read_text(encoding="utf-8", errors="replace")
    ht = h.read_text(encoding="utf-8", errors="replace")
    for s in REQUIRED:
        if s not in ot and s not in ht:
            print(f"check-b476-metrics: missing token {s!r}", file=sys.stderr)
            return 1
    print(f"check-b476-metrics: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
