#!/usr/bin/env python3
"""B-450: anchor strings for POST …/reviews weight* contract in 04 / 14 / frontend (drift guard)."""
from __future__ import annotations

import sys
from pathlib import Path

ANCHOR = "B450-REVIEW-POST-SSOT-DOC-ANCHORS-V1"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace")


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    four = root / "docs" / "spec" / "04-后端与API.md"
    fourteen = root / "docs" / "spec" / "14-合约-API-ABI-前后端对齐.md"
    orders_ts = root / "frontend" / "lib" / "apiClient" / "orders.ts"
    for p in (four, fourteen, orders_ts):
        if not p.is_file():
            print(f"check-b450: missing {p.relative_to(root)}", file=sys.stderr)
            return 1
    t4 = _read(four)
    t14 = _read(fourteen)
    ts = _read(orders_ts)

    need_04 = (
        "weight_breakdown_note",
        "persisted_review_inputs_not_replayed",
        "insert_review`→`Ok(false)`",
        "b449_",
    )
    for s in need_04:
        if s not in t4:
            print(f"check-b450: 04 missing anchor {s!r}", file=sys.stderr)
            return 1

    if "B-449/B-450" not in t14 or "weight_breakdown_note" not in t14:
        print("check-b450: 14 missing B-449/B-450 or weight_breakdown_note", file=sys.stderr)
        return 1

    if "OrderReviewSubmitReview" not in ts or "persisted_review_inputs_not_replayed" not in ts:
        print("check-b450: orders.ts missing OrderReviewSubmitReview / note enum", file=sys.stderr)
        return 1

    print(f"check-b450: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
