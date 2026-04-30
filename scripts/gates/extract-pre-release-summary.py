#!/usr/bin/env python3
"""从 pre-release-automation 完整 stdout 生成短摘要（供入仓；完整 *.full.txt 宜 gitignore）。"""
from __future__ import annotations

import re
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: extract-pre-release-summary.py <full.log> <out.summary.txt>", file=sys.stderr)
        return 2
    full_path = Path(sys.argv[1])
    out_path = Path(sys.argv[2])
    if not full_path.is_file():
        print(f"missing: {full_path}", file=sys.stderr)
        return 2

    text = full_path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    n = len(lines)
    keep: set[int] = set()

    for i in range(min(40, n)):
        keep.add(i)

    pat_check_ok = re.compile(r"^check-[a-z0-9-]+:\s*OK\b")
    for i, line in enumerate(lines):
        if line.startswith("=== "):
            keep.add(i)
        if line.startswith("verify-abi-forge:"):
            keep.add(i)
        if pat_check_ok.match(line):
            keep.add(i)
        if line.startswith("OK:") and len(line) < 160:
            keep.add(i)
        if "55-S13 OK" in line and len(line) < 200:
            keep.add(i)
        if line.startswith("pre-release-automation:"):
            keep.add(i)

    for i in range(max(0, n - 15), n):
        keep.add(i)

    ordered = sorted(keep)
    out_lines = [
        "# pre-release-automation — machine summary (auto)",
        f"# source: {full_path.as_posix()}",
        f"# lines in full: {n}",
        "",
    ]
    prev = -2
    for i in ordered:
        if i == prev + 1:
            out_lines.append(lines[i])
        else:
            if prev >= 0:
                out_lines.append("")
            out_lines.append(f"# --- line {i + 1} ---")
            out_lines.append(lines[i])
        prev = i

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(out_lines) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
