#!/usr/bin/env python3
"""
Sync docs/AI任务卡索引.from-stash.md overview table rows with docs/AI任务卡索引.md
where (seq, TT id, stage) match.

Rules:
- If main row is 登记（未封）: always copy main status + summary to from-stash (main SSOT).
- If main row is 已封口 family: copy from main only when from-stash already has
  ``### <same TT id>`` body heading; otherwise skip (e.g. bodies only on main index).

Does not change rows where id or stage differs (separate catalog tail in from-stash).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

HEADING_RE = re.compile(r"^###\s+(TT-[A-Z0-9-]+)\b")


def normalize_status_cell(status: str) -> str:
    s = status.strip().replace("**", "")
    return re.sub(r"\s+", " ", s).strip()


def is_registered_open(status: str) -> bool:
    return normalize_status_cell(status) == "登记（未封）"


def is_closed_family(status: str) -> bool:
    s = normalize_status_cell(status)
    return s == "已封口" or s.startswith("已封口")


def parse_overview(path: Path) -> tuple[list[str], list[int], dict[int, tuple[str, str, str, str, int]]]:
    """
    Returns (lines, line_indices_for_row_start, seq -> (id, stage, status, summary, line_index))
    summary may contain | from extra cells.
    """
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    plain = [ln.rstrip("\n") for ln in lines]

    start = None
    for i, line in enumerate(plain):
        if line.startswith("## ") and "任务卡一览" in line:
            start = i
            break
    if start is None:
        raise SystemExit(f"no 任务卡一览 in {path}")

    j = start + 1
    while j < len(plain) and plain[j].strip() == "":
        j += 1
    j += 1  # header
    if j < len(plain) and "---" in plain[j] and plain[j].lstrip().startswith("|"):
        j += 1

    row_line_idx: list[int] = []
    by_seq: dict[int, tuple[str, str, str, str, int]] = {}
    while j < len(plain):
        if plain[j].startswith("## "):
            break
        line = plain[j]
        if line.strip().startswith("|") and "| TT-" in line:
            parts = [p.strip() for p in line.split("|")]
            inner = parts[1:-1] if parts[-1] == "" else parts[1:]
            if len(inner) >= 5 and inner[1].startswith("TT-"):
                seq = int(inner[0])
                id_, stage, status, summary = inner[1], inner[2], inner[3], inner[4]
                if len(inner) > 5:
                    summary = "|".join(inner[4:])
                by_seq[seq] = (id_, stage, status, summary, j)
                row_line_idx.append(j)
        j += 1

    return lines, row_line_idx, by_seq


def collect_heading_ids(text: str) -> set[str]:
    return {m.group(1) for line in text.splitlines() if (m := HEADING_RE.match(line))}


def rebuild_row(seq: int, id_: str, stage: str, status: str, summary: str) -> str:
    return f"| {seq} | {id_} | {stage} | {status} | {summary} |"


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    main_p = root / "docs" / "AI任务卡索引.md"
    stash_p = root / "docs" / "AI任务卡索引.from-stash.md"

    main_lines, _, main_by_seq = parse_overview(main_p)
    stash_lines, _, stash_by_seq = parse_overview(stash_p)
    stash_text = stash_p.read_text(encoding="utf-8")
    stash_headings = collect_heading_ids(stash_text)

    updated = 0
    skipped = 0
    for seq, mrow in sorted(main_by_seq.items()):
        if seq not in stash_by_seq:
            continue
        mid, mstg, mstat, msum, _ = mrow
        sid, sstg, sstat, ssum, sidx = stash_by_seq[seq]
        if mid != sid or mstg != sstg:
            continue

        if is_registered_open(mstat):
            new_stat, new_sum = mstat, msum
        elif is_closed_family(mstat):
            if mid not in stash_headings:
                skipped += 1
                continue
            new_stat, new_sum = mstat, msum
        else:
            skipped += 1
            continue

        if new_stat == sstat and new_sum == ssum:
            continue

        old = stash_lines[sidx].rstrip("\r\n")
        new_line = rebuild_row(seq, sid, sstg, new_stat, new_sum)
        if new_line != old:
            stash_lines[sidx] = new_line + "\n"
            updated += 1

    if updated:
        stash_p.write_text("".join(stash_lines), encoding="utf-8")
    print(
        f"sync-from-stash-overview-with-main-index: updated {updated} rows, "
        f"skipped_main-closed_no_stash_body {skipped} (same seq+id+stage only)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
