#!/usr/bin/env python3
"""
Resolve optional gates/waivers/96-15.waiver.json for Production gate.

Writes GitHub Actions outputs when GITHUB_OUTPUT is set:
  skip_96_15 = true | false

Usage:
  python3 scripts/gates/resolve_96_15_waiver.py [path/to/waiver.json]
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path


def _write_output(name: str, value: str) -> None:
    p = os.environ.get("GITHUB_OUTPUT")
    if not p:
        return
    with open(p, "a", encoding="utf-8") as f:
        f.write(f"{name}={value}\n")


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    waiver_path = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "gates" / "waivers" / "96-15.waiver.json"
    if not waiver_path.is_file():
        print("resolve_96_15_waiver: no waiver file; skip_96_15=false", file=sys.stderr)
        _write_output("skip_96_15", "false")
        return 0
    try:
        data = json.loads(waiver_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"ERROR: invalid JSON waiver: {e}", file=sys.stderr)
        return 1
    if data.get("component") != "tier_96_15":
        print("ERROR: waiver.component must be 'tier_96_15'", file=sys.stderr)
        return 1
    for k in ("expires_utc", "ticket", "reason"):
        if k not in data or not str(data[k]).strip():
            print(f"ERROR: waiver missing or empty {k!r}", file=sys.stderr)
            return 1
    exp_s = str(data["expires_utc"]).replace("Z", "+00:00")
    try:
        exp = datetime.fromisoformat(exp_s)
    except ValueError:
        print("ERROR: expires_utc must be ISO-8601", file=sys.stderr)
        return 1
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    if exp <= now:
        print(f"ERROR: waiver expired at {data['expires_utc']}", file=sys.stderr)
        return 1
    print(
        f"resolve_96_15_waiver: active until {data['expires_utc']} ticket={data['ticket']!r}",
        file=sys.stderr,
    )
    _write_output("skip_96_15", "true")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
