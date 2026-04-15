#!/usr/bin/env python3
# B-375: deterministic digest for RegionVault-scoped replay inputs (dry-run; no DB writes).
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

IMPLEMENTATION_TT = "TT-B375-INDEXER-REGION-VAULT-REPLAY-FROM-BLOCK-001"
ANCHOR = "14-REGIONVAULT-INDEXER-REPLAY-DRYRUN-V1"


def canonical_digest(events: list[dict[str, Any]]) -> str:
    body = json.dumps(events, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def _cmd_digest(args: argparse.Namespace) -> int:
    path = Path(args.events_json)
    events = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(events, list):
        print("replay-dryrun: events must be JSON array", file=sys.stderr)
        return 1
    for i, e in enumerate(events):
        if not isinstance(e, dict):
            print(f"replay-dryrun: events[{i}] must be object", file=sys.stderr)
            return 1
    d = canonical_digest(events)
    report = {
        "anchor": ANCHOR,
        "implementation_tt": IMPLEMENTATION_TT,
        "mother_table": "B-375",
        "events_sha256_canonical_hex": d,
        "event_count": len(events),
    }
    outp = Path(args.output)
    outp.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {args.output}", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    ev = [
        {"block": 1, "tx": "0xaa", "topic0": "0xbb"},
        {"block": 2, "tx": "0xcc", "topic0": "0xdd"},
    ]
    a = canonical_digest(ev)
    b = canonical_digest(ev)
    assert a == b
    ev2 = list(ev)
    ev2[0] = {**ev2[0], "block": 3}
    assert canonical_digest(ev2) != a
    print("region_vault_indexer_replay_dryrun self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="B-375 indexer replay dry-run digest")
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("digest", help="write replay digest report from events JSON array")
    d.add_argument("events_json", help="JSON array of event objects")
    d.add_argument("-o", "--output", required=True)
    d.set_defaults(func=_cmd_digest)
    st = sub.add_parser("self-test")
    st.set_defaults(func=_cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
