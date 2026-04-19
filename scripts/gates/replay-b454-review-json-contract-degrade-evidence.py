#!/usr/bin/env python3
"""B-454: validate + aggregate exported `review_json_contract_degrade` payloads (NDJSON or JSON array).

Each record must match `ReviewJsonContractDegradeObservabilityPayload` (see `frontend/lib/analytics.ts`):
  degrade, api_path, schema_version_reported, schema_version_effective, client_max_supported

Also accepts a wrapper line: {"event":"review_json_contract_degrade","payload":{...}}
Optional metadata keys (ignored for validation): captured_at, environment, release_id, git_sha, client_build.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Mapping

REQUIRED = frozenset(
    {"degrade", "api_path", "schema_version_reported", "schema_version_effective", "client_max_supported"}
)
DEGRADES = frozenset({"missing_meta", "malformed_meta", "unknown_future_schema"})
API_PATHS = frozenset({"get_reviews", "post_review"})


def _unwrap(obj: Mapping[str, Any]) -> dict[str, Any]:
    if "payload" in obj and isinstance(obj["payload"], dict):
        inner = obj["payload"]
        ev = obj.get("event")
        if ev in (None, "review_json_contract_degrade"):
            return dict(inner)
    return dict(obj)


def _validate_payload(d: Mapping[str, Any], *, line_no: int | None) -> dict[str, Any]:
    missing = sorted(REQUIRED - set(d.keys()))
    if missing:
        loc = f"line {line_no}" if line_no is not None else "record"
        raise ValueError(f"{loc}: missing keys {missing}")
    if d["degrade"] not in DEGRADES:
        loc = f"line {line_no}" if line_no is not None else "record"
        raise ValueError(f"{loc}: invalid degrade {d['degrade']!r}")
    if d["api_path"] not in API_PATHS:
        loc = f"line {line_no}" if line_no is not None else "record"
        raise ValueError(f"{loc}: invalid api_path {d['api_path']!r}")
    sr = d["schema_version_reported"]
    if sr is not None and not isinstance(sr, int):
        loc = f"line {line_no}" if line_no is not None else "record"
        raise ValueError(f"{loc}: schema_version_reported must be int or null")
    for k in ("schema_version_effective", "client_max_supported"):
        if not isinstance(d[k], int):
            loc = f"line {line_no}" if line_no is not None else "record"
            raise ValueError(f"{loc}: {k} must be int")
    return dict(d)


def _load_records(path: Path) -> list[dict[str, Any]]:
    raw = path.read_text(encoding="utf-8", errors="replace").strip()
    if not raw:
        return []
    if raw.startswith("["):
        data = json.loads(raw)
        if not isinstance(data, list):
            raise ValueError("JSON file must be an array when starting with '['")
        out: list[dict[str, Any]] = []
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                raise ValueError(f"array index {i}: expected object")
            out.append(_validate_payload(_unwrap(item), line_no=None))
        return out
    out = []
    for i, line in enumerate(raw.splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        obj = json.loads(line)
        if not isinstance(obj, dict):
            raise ValueError(f"line {i}: expected JSON object")
        out.append(_validate_payload(_unwrap(obj), line_no=i))
    return out


def _summarize(records: list[dict[str, Any]]) -> dict[str, Any]:
    by_pair = Counter()
    by_degrade = Counter()
    by_path = Counter()
    for r in records:
        deg = str(r["degrade"])
        ap = str(r["api_path"])
        by_pair[(deg, ap)] += 1
        by_degrade[deg] += 1
        by_path[ap] += 1
    return {
        "evidence_schema": "b454_review_json_contract_degrade_replay_v1",
        "total_events": len(records),
        "count_by_degrade": dict(by_degrade),
        "count_by_api_path": dict(by_path),
        "count_by_degrade_and_api_path": {f"{a}|{b}": c for (a, b), c in sorted(by_pair.items())},
    }


def main() -> int:
    p = argparse.ArgumentParser(description="Replay / validate B-454 degrade event evidence.")
    p.add_argument(
        "path",
        type=Path,
        help="NDJSON (one object per line) or JSON array file",
    )
    p.add_argument(
        "--write-summary",
        type=Path,
        default=None,
        help="Write replay_summary.json next to evidence (audit bundle)",
    )
    args = p.parse_args()
    try:
        records = _load_records(args.path)
    except (OSError, ValueError, json.JSONDecodeError) as e:
        print(f"replay-b454: {e}", file=sys.stderr)
        return 1
    summary = _summarize(records)
    out = json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True)
    print(out)
    if args.write_summary:
        args.write_summary.parent.mkdir(parents=True, exist_ok=True)
        args.write_summary.write_text(out + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
