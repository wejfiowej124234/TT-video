#!/usr/bin/env python3
# B-370: compare tx_hash sets between read-model snapshot JSON and indexer forwarded snapshot JSON (CI).
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

IMPLEMENTATION_TT = "TT-B370-B265-READ-MODEL-INDEXER-DRIFT-GATE-001"


def load_hashes(path: Path) -> set[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    raw = data.get("tx_hashes")
    if not isinstance(raw, list):
        raise ValueError("tx_hashes must be array")
    return {str(x).strip().lower() for x in raw if str(x).strip()}


def run_drift(read_model_json: Path, indexer_json: Path) -> tuple[bool, str]:
    a = load_hashes(read_model_json)
    b = load_hashes(indexer_json)
    if a != b:
        only_a = sorted(a - b)
        only_b = sorted(b - a)
        return False, f"drift: only_read_model={only_a[:5]} only_indexer={only_b[:5]}"
    return True, ""


def _cmd_check(args: argparse.Namespace) -> int:
    try:
        ok, msg = run_drift(Path(args.read_model), Path(args.indexer))
    except (OSError, ValueError, json.JSONDecodeError) as e:
        print(f"drift: FAIL: {e}", file=sys.stderr)
        return 1
    if not ok:
        print(f"drift: FAIL: {msg}", file=sys.stderr)
        return 1
    print(f"drift: OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    fx = Path(__file__).resolve().parent / "fixtures" / "batch3"
    ok, _ = run_drift(fx / "read_model_tx_hashes.json", fx / "indexer_forwarded_tx_hashes.json")
    assert ok
    ok2, _ = run_drift(fx / "read_model_tx_hashes.json", fx / "indexer_forwarded_tx_hashes_drift.json")
    assert not ok2
    print("verify_b265_indexer_forwarded_drift_ci self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="B-370 B-265 vs indexer tx_hash drift")
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check", help="compare two JSON files")
    c.add_argument("--read-model", required=True)
    c.add_argument("--indexer", required=True)
    c.set_defaults(func=_cmd_check)
    st = sub.add_parser("self-test")
    st.set_defaults(func=_cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
