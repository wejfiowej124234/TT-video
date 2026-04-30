#!/usr/bin/env python3
"""
Merge release_orchestration.json into R-001 report.json as top-level key 'orchestration'.

Usage:
  python scripts/release/merge_orchestration_into_report.py evidence/GO_x/report.json \\
      evidence/GO_x/release_orchestration.json -o evidence/GO_x/report.merged.json
"""

from __future__ import annotations

import argparse
import copy
import json
import sys
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("report_json", type=Path)
    ap.add_argument("orchestration_json", type=Path)
    ap.add_argument("-o", "--output", type=Path, required=True)
    args = ap.parse_args()

    if not args.report_json.is_file():
        print(f"ERROR: missing {args.report_json}", file=sys.stderr)
        return 2
    if not args.orchestration_json.is_file():
        print(f"ERROR: missing {args.orchestration_json}", file=sys.stderr)
        return 2

    report = json.loads(args.report_json.read_text(encoding="utf-8"))
    orch = json.loads(args.orchestration_json.read_text(encoding="utf-8"))
    merged = copy.deepcopy(report)
    merged["orchestration"] = orch
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(merged, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
