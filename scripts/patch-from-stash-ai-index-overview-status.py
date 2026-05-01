#!/usr/bin/env python3
"""
Normalize docs/AI任务卡索引.from-stash.md overview status cells so
`scripts/check-ai-task-card-index-overview.py` passes (rules B/C/D).

- `只读` (audit row) -> `已封口（只读）` (must have ### body; already in file).
- Any **未封口**（**登记**…）family -> exact `登记（未封）`.
- **进度锚点（非阻塞）** -> `登记（未封）`.
- **未封口**（**入口**…）-> `登记（未封）`.
- Rows classified closed but missing `### TT-...` in this file -> `登记（未封）`
  + SSOT pointer to main index + ./AI任务卡索引.from-stash.md in summary if needed.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

HEADING_RE = re.compile(r"^###\s+(TT-[A-Z0-9-]+)\b")
STASH_MARKERS = (
    "AI任务卡索引.from-stash.md",
    "./AI任务卡索引.from-stash.md",
    "docs/AI任务卡索引.from-stash.md",
)


def normalize_status_cell(status: str) -> str:
    s = status.strip().replace("**", "")
    return re.sub(r"\s+", " ", s).strip()


def classify_status(status: str) -> str:
    s = normalize_status_cell(status)
    if s == "登记（未封）":
        return "registered_open"
    if s == "已封口" or s.startswith("已封口"):
        return "closed"
    return "other"


def collect_heading_ids(text: str) -> set[str]:
    return {m.group(1) for line in text.splitlines() if (m := HEADING_RE.match(line))}


def parse_table_row(line: str) -> tuple[str, str, str, str, str] | None:
    line = line.rstrip("\n")
    if not line.strip().startswith("|"):
        return None
    parts = [p.strip() for p in line.split("|")]
    inner = parts[1:-1] if parts[-1] == "" else parts[1:]
    if len(inner) < 5:
        return None
    seq_s, id_, stage, status, summary = inner[0], inner[1], inner[2], inner[3], inner[4]
    if not id_.startswith("TT-"):
        return None
    if len(inner) > 5:
        summary = "|".join(inner[4:])
    return seq_s, id_, stage, status, summary


def has_stash_marker(summary: str) -> bool:
    return any(m in summary for m in STASH_MARKERS)


def find_overview_slice(lines: list[str]) -> tuple[int, int] | None:
    start = None
    for i, line in enumerate(lines):
        if line.startswith("## ") and "任务卡一览" in line:
            start = i
            break
    if start is None:
        return None
    j = start + 1
    while j < len(lines) and lines[j].strip() == "":
        j += 1
    if j >= len(lines) or not lines[j].lstrip().startswith("|"):
        return None
    j += 1
    if j < len(lines) and "---" in lines[j] and lines[j].lstrip().startswith("|"):
        j += 1
    start_data = j
    end = j
    while end < len(lines):
        if lines[end].startswith("## "):
            break
        end += 1
    return start_data, end


def rebuild_row(seq_s: str, id_: str, stage: str, status: str, summary: str) -> str:
    return f"| {seq_s} | {id_} | {stage} | {status} | {summary} |"


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    path = root / "docs" / "AI任务卡索引.from-stash.md"
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    plain = [ln.rstrip("\n") for ln in lines]

    slc = find_overview_slice(plain)
    if slc is None:
        print("no overview slice", file=sys.stderr)
        return 1
    start_data, end = slc
    headings = collect_heading_ids(text)

    changed = 0
    for idx in range(start_data, end):
        line = plain[idx]
        if not line.strip().startswith("|"):
            continue
        parsed = parse_table_row(line)
        if parsed is None:
            continue
        seq_s, id_, stage, status, summary = parsed
        ns = normalize_status_cell(status)
        new_status = status
        new_summary = summary

        if ns == "只读":
            new_status = "已封口（只读）"
        elif "未封口" in ns and "登记" in ns:
            new_status = "登记（未封）"
        elif "进度锚点" in ns:
            new_status = "登记（未封）"
        elif "未封口" in ns and ("母卡" in ns or "入口" in ns):
            new_status = "登记（未封）"
        elif classify_status(status) == "closed" and id_ not in headings:
            new_status = "登记（未封）"
            if not has_stash_marker(new_summary):
                new_summary = (
                    new_summary.rstrip()
                    + " · 执行正文 SSOT 见 [AI任务卡索引.md](./AI任务卡索引.md) · 登记行 `./AI任务卡索引.from-stash.md`"
                )
        else:
            continue

        if new_status == "登记（未封）" and not has_stash_marker(new_summary):
            new_summary = (
                new_summary.rstrip()
                + " · 登记见 `./AI任务卡索引.from-stash.md`"
            )

        new_line = rebuild_row(seq_s, id_, stage, new_status, new_summary)
        old_stripped = lines[idx].rstrip("\r\n")
        if new_line != old_stripped:
            lines[idx] = new_line + "\n"
            changed += 1

    if changed:
        path.write_text("".join(lines), encoding="utf-8")
    print(f"patch-from-stash-ai-index-overview-status: updated {changed} overview rows")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
