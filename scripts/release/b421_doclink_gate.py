#!/usr/bin/env python3
"""
B-421 six-path doclink gate (pure Python, mirrors scripts/check-runbook-golive-doclink-gate.sh).

Exit 0 on success, 2 on missing file, 3 on anchor miss.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_D = Path("docs")
_S = Path("spec")
REQUIRED = [
    "ops/RUNBOOK.md",
    "docs/go-live-checklist.md",
    (_D / _S / "00-文档索引.md").as_posix(),
    (_D / _S / "缺口与待补-官方总表.md").as_posix(),
    (_D / _S / "15-多维度文档与技术检查报告.md").as_posix(),
    "docs/runbook/TT-B421-GO-RUNBOOK-GOLIVE-DOCLINK-001.md",
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-root", type=Path, default=Path("."))
    args = ap.parse_args()
    root = args.repo_root.resolve()
    for rel in REQUIRED:
        p = root / rel
        if not p.is_file():
            print(f"b421_doclink_gate: missing required file: {rel}", file=sys.stderr)
            return 2
    runbook = (root / "ops/RUNBOOK.md").read_text(encoding="utf-8", errors="replace")
    if "B-421-RUNBOOK-GOLIVE-DOCLINK-GATE" not in runbook:
        print("b421_doclink_gate: ops/RUNBOOK.md missing B-421 anchor", file=sys.stderr)
        return 3
    if "TT-B421-GO-RUNBOOK-GOLIVE-DOCLINK-001" not in runbook:
        print("b421_doclink_gate: ops/RUNBOOK.md missing TT-B421 pointer", file=sys.stderr)
        return 3
    print("b421_doclink_gate: ok", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
