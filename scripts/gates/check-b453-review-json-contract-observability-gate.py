#!/usr/bin/env python3
"""B-453: review_json_contract runtime counters + degrade telemetry + release gate anchors (04 / 14 / frontend)."""
from __future__ import annotations

import sys
from pathlib import Path

ANCHOR = "B453-REVIEW-JSON-CONTRACT-OBSERVABILITY-GATE-V1"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace")


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    four = root / "docs" / "spec" / "04-后端与API.md"
    fourteen = root / "docs" / "spec" / "14-合约-API-ABI-前后端对齐.md"
    obs = root / "frontend" / "lib" / "reviewJsonContractObservability.ts"
    rjc = root / "frontend" / "lib" / "reviewJsonContract.ts"
    analytics = root / "frontend" / "lib" / "analytics.ts"
    orders_ts = root / "frontend" / "lib" / "apiClient" / "orders.ts"
    for p in (four, fourteen, obs, rjc, analytics, orders_ts):
        if not p.is_file():
            print(f"check-b453: missing {p.relative_to(root)}", file=sys.stderr)
            return 1
    t4 = _read(four)
    t14 = _read(fourteen)
    tobs = _read(obs)
    tr = _read(rjc)
    ta = _read(analytics)
    ts = _read(orders_ts)

    need_04 = (
        "B-453",
        "b453_",
        "observeReviewJsonContractClient",
        "getReviewJsonContractDegradeCounters",
        "trackReviewJsonContractDegrade",
        "unknown_future_schema",
        "malformed_meta",
        "missing_meta",
        "check-b453-review-json-contract-observability-gate.py",
    )
    for s in need_04:
        if s not in t4:
            print(f"check-b453: 04 missing anchor {s!r}", file=sys.stderr)
            return 1

    if "B-453" not in t14 or "observeReviewJsonContractClient" not in t14:
        print("check-b453: 14 missing B-453 or observeReviewJsonContractClient", file=sys.stderr)
        return 1

    for s in (
        "observeReviewJsonContractClient",
        "getReviewJsonContractDegradeCounters",
        "resetReviewJsonContractDegradeCounters",
        "missing_meta",
        "malformed_meta",
        "unknown_future_schema",
    ):
        if s not in tobs:
            print(f"check-b453: reviewJsonContractObservability.ts missing {s!r}", file=sys.stderr)
            return 1

    for s in ("trackReviewJsonContractDegrade", "ReviewJsonContractDegradeObservabilityPayload"):
        if s not in ta:
            print(f"check-b453: analytics.ts missing {s!r}", file=sys.stderr)
            return 1

    for s in ("observeReviewJsonContractClient", "getOrderReviews", "post_review"):
        if s not in ts:
            print(f"check-b453: orders.ts missing {s!r}", file=sys.stderr)
            return 1

    for s in ("parseReviewJsonContractMeta", "unknown_future_schema", "malformed_meta"):
        if s not in tr:
            print(f"check-b453: reviewJsonContract.ts missing {s!r}", file=sys.stderr)
            return 1

    print(f"check-b453: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
