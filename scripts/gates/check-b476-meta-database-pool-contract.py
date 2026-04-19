#!/usr/bin/env python3
"""B-476: GET /meta database.pool 契约键与 handlers 实现同源（静态门禁）。"""
from __future__ import annotations

import sys
from pathlib import Path

ANCHOR = "B476-META-DATABASE-POOL-CONTRACT-V1"


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    keys = root / "crates" / "api" / "src" / "routes" / "health_meta" / "meta_contract_keys.rs"
    handlers = root / "crates" / "api" / "src" / "routes" / "health_meta" / "handlers.rs"
    for p in (keys, handlers):
        if not p.is_file():
            print(f"check-b476-meta: missing {p}", file=sys.stderr)
            return 1
    kt = keys.read_text(encoding="utf-8", errors="replace")
    ht = handlers.read_text(encoding="utf-8", errors="replace")
    if "DATABASE_POOL_META_TOP_KEYS" not in kt or "format_database_pool_meta_top_keys_contract_776" not in kt:
        print("check-b476-meta: meta_contract_keys.rs missing DATABASE_POOL_META_TOP_KEYS / 776", file=sys.stderr)
        return 1
    need = (
        "database_pool_top_keys",
        "database_pool_top_keys_contract_776",
        "pool_observability_snapshot",
        '"pool"',
    )
    for s in need:
        if s not in ht:
            print(f"check-b476-meta: handlers.rs missing {s!r}", file=sys.stderr)
            return 1
    if '"pool"' not in kt:
        print("check-b476-meta: meta_contract_keys.rs should include database.pool (pool key)", file=sys.stderr)
        return 1
    print(f"check-b476-meta: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
