#!/usr/bin/env python3
"""
从 docs/spec/93-全站功能验证矩阵-域别回归清单.md 抽取表格行：用例 ID + 自动化优先级列（若存在）。

输出 TSV（stdout）：case_id \\t automation \\t raw_line_fragment

用途：93 改版后与 git diff 或历史清单对比；供 docs/runbook/93-matrix-batch-tracker.md 维护。

用法（仓库根）：
  python scripts/dev/extract_93_case_inventory.py
  python scripts/dev/extract_93_case_inventory.py --md path/to/93.md
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# Table rows: | A-ENV-001 | ... | AUTO-P0 |
CASE_RE = re.compile(
    r"^\|\s*([A-Z]{1,4}-[A-Z0-9]+-\d{3})\s*\|"
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--md",
        type=Path,
        default=None,
        help="Path to 93 markdown (default: docs/spec/93-全站功能验证矩阵-域别回归清单.md)",
    )
    args = ap.parse_args()
    repo = Path(__file__).resolve().parents[2]
    md = args.md or (repo / "docs" / "spec" / "93-全站功能验证矩阵-域别回归清单.md")
    if not md.is_file():
        print(f"ERROR: not found: {md}", file=sys.stderr)
        return 2
    text = md.read_text(encoding="utf-8")
    print("case_id\tautomation\tsource_line")
    for line in text.splitlines():
        m = CASE_RE.match(line.strip())
        if not m:
            continue
        cid = m.group(1)
        raw = line.strip().split("|")
        if len(raw) < 3:
            continue
        cells = [c.strip() for c in raw[1:-1]]
        if not cells or cells[0] != cid:
            continue
        auto = ""
        last = cells[-1]
        if last in ("AUTO-P0", "MANUAL-P1", "MANUAL-BLOCKED"):
            auto = last
        frag = line.strip().replace("\t", " ")[:120]
        print(f"{cid}\t{auto}\t{frag}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
