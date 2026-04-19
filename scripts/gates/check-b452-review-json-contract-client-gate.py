#!/usr/bin/env python3
"""B-452: review JSON contract client parse + degrade anchors (04 / frontend / apiClient)."""
from __future__ import annotations

import sys
from pathlib import Path

ANCHOR = "B452-REVIEW-JSON-CONTRACT-CLIENT-GATE-V1"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace")


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    four = root / "docs" / "spec" / "04-后端与API.md"
    fourteen = root / "docs" / "spec" / "14-合约-API-ABI-前后端对齐.md"
    rjc = root / "frontend" / "lib" / "reviewJsonContract.ts"
    orders_ts = root / "frontend" / "lib" / "apiClient" / "orders.ts"
    for p in (four, fourteen, rjc, orders_ts):
        if not p.is_file():
            print(f"check-b452: missing {p.relative_to(root)}", file=sys.stderr)
            return 1
    t4 = _read(four)
    t14 = _read(fourteen)
    tr = _read(rjc)
    ts = _read(orders_ts)

    need_04 = (
        "B-452",
        "b452_",
        "parseReviewJsonContractMeta",
        "reviewJsonContractClient",
        "unknown_future_schema",
        "CLIENT_REVIEW_JSON_CONTRACT_SCHEMA_MAX_SUPPORTED",
    )
    for s in need_04:
        if s not in t4:
            print(f"check-b452: 04 missing anchor {s!r}", file=sys.stderr)
            return 1

    if "B-452" not in t14 or "reviewJsonContractClient" not in t14:
        print("check-b452: 14 missing B-452 or reviewJsonContractClient", file=sys.stderr)
        return 1

    for s in (
        "parseReviewJsonContractMeta",
        "ReviewJsonContractDegrade",
        "CLIENT_REVIEW_JSON_CONTRACT_SCHEMA_MAX_SUPPORTED",
    ):
        if s not in tr:
            print(f"check-b452: reviewJsonContract.ts missing {s!r}", file=sys.stderr)
            return 1

    for s in ("parseReviewJsonContractMeta", "reviewJsonContractClient", "OrderReviewPostResult"):
        if s not in ts:
            print(f"check-b452: orders.ts missing {s!r}", file=sys.stderr)
            return 1

    print(f"check-b452: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
