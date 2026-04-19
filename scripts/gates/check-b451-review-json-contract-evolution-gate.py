#!/usr/bin/env python3
"""B-451: review JSON contract evolution anchors in 04 / 14 / Rust SSOT (drift guard)."""
from __future__ import annotations

import sys
from pathlib import Path

ANCHOR = "B451-REVIEW-JSON-CONTRACT-EVOLUTION-GATE-V1"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace")


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    four = root / "docs" / "spec" / "04-后端与API.md"
    fourteen = root / "docs" / "spec" / "14-合约-API-ABI-前后端对齐.md"
    reviews_rs = root / "crates" / "api" / "src" / "chain_off" / "reviews.rs"
    orders_ts = root / "frontend" / "lib" / "apiClient" / "orders.ts"
    for p in (four, fourteen, reviews_rs, orders_ts):
        if not p.is_file():
            print(f"check-b451: missing {p.relative_to(root)}", file=sys.stderr)
            return 1
    t4 = _read(four)
    t14 = _read(fourteen)
    tr = _read(reviews_rs)
    ts = _read(orders_ts)

    need_04 = (
        "review_json_contract",
        "schema_version",
        "REVIEW-SUBMIT-JSON-CONTRACT-V1",
        "B-451",
        "b451_",
    )
    for s in need_04:
        if s not in t4:
            print(f"check-b451: 04 missing anchor {s!r}", file=sys.stderr)
            return 1

    if "B-451" not in t14 or "review_json_contract" not in t14:
        print("check-b451: 14 missing B-451 or review_json_contract", file=sys.stderr)
        return 1

    for s in ("REVIEW_JSON_CONTRACT_ANCHOR", "REVIEW-SUBMIT-JSON-CONTRACT-V1", "review_json_contract_meta"):
        if s not in tr:
            print(f"check-b451: reviews.rs missing {s!r}", file=sys.stderr)
            return 1

    if "OrderReviewJsonContractMeta" not in ts:
        print("check-b451: orders.ts missing OrderReviewJsonContractMeta", file=sys.stderr)
        return 1

    print(f"check-b451: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
