#!/usr/bin/env python3
"""B-474: .env.example documents DATABASE_POOL_* keys (drift guard vs startup/pool_config.rs)."""
from __future__ import annotations

import sys
from pathlib import Path

ANCHOR = "B474-PG-POOL-ENV-DOCUMENTED-V1"

REQUIRED = (
    "DATABASE_POOL_MAX_CONNECTIONS",
    "DATABASE_POOL_ACQUIRE_TIMEOUT_SECS",
    "DATABASE_POOL_IDLE_TIMEOUT_SECS",
    "DATABASE_POOL_MAX_LIFETIME_SECS",
)


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    ex = root / ".env.example"
    if not ex.is_file():
        print(f"check-b474: missing {ex}", file=sys.stderr)
        return 1
    text = ex.read_text(encoding="utf-8", errors="replace")
    for key in REQUIRED:
        if key not in text:
            print(f"check-b474: .env.example missing {key!r}", file=sys.stderr)
            return 1
    if "TT-B474" not in text and "B-474" not in text:
        print("check-b474: .env.example missing TT-B474 or B-474 cross-ref", file=sys.stderr)
        return 1
    print(f"check-b474: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
