#!/usr/bin/env python3
"""PI3-003 baseline shape gate."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ANCHOR = "PI3-003-STRIPE-LIVE-PRODUCTION-WEBHOOK-V1"
SCHEMA = "traveltrust_pi3_003_stripe_live_production_webhook.v1"
ALLOWED = frozenset({"PLANNED", "PASS", "WAIVED"})


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    p = root / "evidence" / "pi3_003_stripe_live_production_webhook" / "baseline_record.v1.json"
    if not p.is_file():
        print(f"check-pi3-003: missing {p.relative_to(root)}", file=sys.stderr)
        return 1
    data = json.loads(p.read_text(encoding="utf-8"))
    if data.get("schema") != SCHEMA:
        print("check-pi3-003: schema mismatch", file=sys.stderr)
        return 1
    st = data.get("status")
    if st not in ALLOWED:
        print(f"check-pi3-003: invalid status {st!r}", file=sys.stderr)
        return 1
    if st == "PASS":
        for k in ("webhook_url", "prod_api_base", "last_live_webhook_smoke_utc"):
            if not data.get(k):
                print(f"check-pi3-003: status=PASS requires {k}", file=sys.stderr)
                return 1
    print(f"check-pi3-003: OK ({ANCHOR}) status={st}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
