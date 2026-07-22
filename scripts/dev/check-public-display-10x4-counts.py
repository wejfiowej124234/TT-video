#!/usr/bin/env python3
"""Public display count gate · OCS 10×4 (guides / provider / acquisition / community).

Exit 0 = all four == 10. Exit 2 = drift (chaos).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

EXPECTED = {
    "guides": 10,
    "provider": 10,
    "acquisition": 10,
    "community": 10,
}


def fetch_count(api: str, path: str, keys: list[str]) -> int:
    req = urllib.request.Request(api + path, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=40) as r:
        data = json.loads(r.read().decode())
    if isinstance(data, list):
        return len(data)
    for k in keys:
        v = data.get(k)
        if isinstance(v, list):
            return len(v)
    return int(data.get("count") or 0)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default=os.environ.get("API_BASE", "https://tt-api-staging.fly.dev"))
    ap.add_argument("--out", default="")
    args = ap.parse_args()
    api = args.api.rstrip("/")

    counts = {
        "guides": fetch_count(api, "/api/v1/guides?limit=500", ["items", "guides"]),
        "provider": fetch_count(api, "/api/v1/market/provider/listings?limit=500", ["items", "listings"]),
        "acquisition": fetch_count(
            api, "/api/v1/market/acquisition/listings?limit=500", ["items", "listings"]
        ),
        "community": fetch_count(api, "/api/v1/community/feed?limit=500", ["items", "posts", "feed"]),
    }
    drifts = {k: counts[k] for k in EXPECTED if counts[k] != EXPECTED[k]}
    report = {
        "schema": "traveltrust.public_display_10x4_counts.v1",
        "recorded_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "api_base": api,
        "expected": EXPECTED,
        "counts": counts,
        "drifts": drifts,
        "verdict": "LOCKED_10X4" if not drifts else "DRIFT_CHAOS",
        "ssot": "registry/staging-rc-ssot-alignment.v1.yaml#expected_staging_surface",
    }
    text = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    if args.out:
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out).write_text(text, encoding="utf-8")
    print(text, end="")
    return 0 if not drifts else 2


if __name__ == "__main__":
    sys.exit(main())
