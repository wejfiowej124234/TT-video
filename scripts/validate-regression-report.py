#!/usr/bin/env python3
"""
Validate evidence/GO_YYYYMMDD/report.json against R-001 schema (minimal contract).

Exit codes:
  0 - JSON valid; release_gate is GO or PARTIAL_GO (when --require-go used: only GO)
  1 - invalid JSON, missing keys, or release_gate NO_GO (with --fail-on-no-go)
  2 - file missing

Usage:
  python scripts/validate-regression-report.py evidence/GO_20260418/report.json
  python scripts/validate-regression-report.py evidence/GO_20260418/report.json --fail-on-no-go
  python scripts/validate-regression-report.py evidence/GO_20260418/report.json --require-go

See docs/spec/R-001-全站回归报告模板与汇总JSON结构.md
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

VALID_STATUSES = frozenset({"PASS", "FAIL", "BLOCKED", "N_A", "NOT_RUN"})
VALID_GATES = frozenset({"GO", "PARTIAL_GO", "NO_GO"})

REQUIRED_TOP = (
    "schema_version",
    "run_id",
    "executor",
    "started_at",
    "finished_at",
    "environment",
    "release_gate",
    "release_gate_reason",
    "cases",
    "summary",
)

REQUIRED_ENV = ("name", "database", "chain_mode", "auth_mode")


def validate(path: Path) -> list[str]:
    errs: list[str] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return [f"invalid JSON: {e}"]

    for k in REQUIRED_TOP:
        if k not in data:
            errs.append(f"missing top-level key: {k}")

    if errs:
        return errs

    if data.get("schema_version") != "1":
        errs.append("schema_version must be '1'")

    env = data.get("environment")
    if not isinstance(env, dict):
        errs.append("environment must be object")
    else:
        for k in REQUIRED_ENV:
            if k not in env:
                errs.append(f"environment missing: {k}")

    rg = data.get("release_gate")
    if rg not in VALID_GATES:
        errs.append(f"release_gate must be one of {sorted(VALID_GATES)}, got {rg!r}")

    cases = data.get("cases")
    if not isinstance(cases, list):
        errs.append("cases must be array")
    else:
        for i, c in enumerate(cases):
            if not isinstance(c, dict):
                errs.append(f"cases[{i}] must be object")
                continue
            if "id" not in c or "status" not in c:
                errs.append(f"cases[{i}] missing id or status")
            elif c["status"] not in VALID_STATUSES:
                errs.append(f"cases[{i}].status invalid: {c.get('status')!r}")

    summ = data.get("summary")
    if not isinstance(summ, dict):
        errs.append("summary must be object")
    else:
        for k in ("PASS", "FAIL", "BLOCKED", "N_A", "NOT_RUN"):
            if k not in summ:
                errs.append(f"summary missing {k}")

    return errs


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("report_json", type=Path, help="Path to report.json")
    ap.add_argument(
        "--fail-on-no-go",
        action="store_true",
        help="Exit 1 when release_gate is NO_GO",
    )
    ap.add_argument(
        "--require-go",
        action="store_true",
        help="Exit 1 unless release_gate is exactly GO (staging/production hard gate)",
    )
    args = ap.parse_args()

    p: Path = args.report_json
    if not p.is_file():
        print(f"ERROR: not found: {p}", file=sys.stderr)
        return 2

    errs = validate(p)
    if errs:
        for e in errs:
            print(f"ERROR: {e}", file=sys.stderr)
        return 1

    data = json.loads(p.read_text(encoding="utf-8"))
    rg = data["release_gate"]

    if args.require_go and rg != "GO":
        print(f"ERROR: release_gate is {rg!r}, expected GO (--require-go)", file=sys.stderr)
        return 1

    if args.fail_on_no_go and rg == "NO_GO":
        print(f"ERROR: release_gate is NO_GO", file=sys.stderr)
        return 1

    print(f"OK: {p} release_gate={rg} cases={len(data.get('cases', []))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
