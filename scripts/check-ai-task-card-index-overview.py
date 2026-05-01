#!/usr/bin/env python3
"""
Validate docs/AI任务卡索引.md overview table: rules A, E, B, C, D (F disabled).

Windows Git Bash: PATH may put the Microsoft Store ``python3`` stub first (often exits **49**
without running this file); use ``py -3`` or a real ``python``/``python3`` — same note as
``scripts/gates/check-invariants.sh`` (~L35) and ``scripts/dev/run-verify-abi-forge.sh`` (header).

- **A**: 序号唯一；默认还要求与行数 n 一致且覆盖 1..n（无缺号）。历史缺号时用 `--allow-seq-gaps`
  （仍要求 min(seq)==1 且无重复）。
- **E**: 一览 ID（TT-*）唯一。
- **B**: 状态列规范化后须为「已封口」族或「登记（未封）」；规范化会去掉单元格内 `**`。
- **C**: 已封口族须存在正文标题 `^###\\s+(TT-[A-Z0-9-]+)\\b`（ID 后可有中文等）。
- **D**: 「登记（未封）」摘要须含 `AI任务卡索引.from-stash.md` 或 `./…` 或 `docs/…` 三种之一。

一览表定位：`## …任务卡一览…` 后首张表，且表头行须同时含 `| 序号 |`、`| ID |`、`| 状态 |`。

Machine-readable stderr lines (msg is last field; may contain spaces):
  RULE=A-SEQ ... msg=...
  RULE=E-ID ... msg=...
  RULE=B-STATUS ... msg=...
  RULE=C-BODY ... msg=...
  RULE=D-STASH ... msg=...
  RULE=Z-META ... msg=...  (table location / header)
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import Counter
from pathlib import Path

HEADING_RE = re.compile(r"^###\s+(TT-[A-Z0-9-]+)\b")
STASH_MARKERS = (
    "AI任务卡索引.from-stash.md",
    "./AI任务卡索引.from-stash.md",
    "docs/AI任务卡索引.from-stash.md",
)


def emit(rule: str, *, seq: int | str | None = None, id_: str | None = None, msg: str) -> None:
    parts = [f"RULE={rule}"]
    if seq is not None:
        parts.append(f"seq={seq}")
    if id_ is not None:
        parts.append(f"id={id_}")
    parts.append(f"msg={msg}")
    print(" ".join(parts), file=sys.stderr)


def normalize_status_cell(status: str) -> str:
    """Strip markdown emphasis so **已封口**（…） classifies as 已封口族."""
    s = status.strip().replace("**", "")
    return re.sub(r"\s+", " ", s).strip()


def classify_status(status: str) -> str:
    s = normalize_status_cell(status)
    if s == "登记（未封）":
        return "registered_open"
    if s == "已封口" or s.startswith("已封口"):
        return "closed"
    return "other"


def parse_table_row(line: str) -> tuple[int, str, str, str, str] | None:
    line = line.rstrip("\n")
    if not line.strip().startswith("|"):
        return None
    parts = [p.strip() for p in line.split("|")]
    # leading/trailing empty from split
    if len(parts) < 6:
        return None
    inner = parts[1:-1] if parts[-1] == "" else parts[1:]
    if len(inner) < 5:
        return None
    seq_s, id_, stage, status, summary = inner[0], inner[1], inner[2], inner[3], inner[4]
    if not id_.startswith("TT-"):
        return None
    try:
        seq = int(seq_s)
    except ValueError:
        return None
    if seq_s != str(seq):
        # reject leading zeros / non-canonical decimal
        return None
    if len(inner) > 5:
        summary = "|".join(inner[4:])
    return seq, id_, stage, status, summary


def find_overview_rows(lines: list[str]) -> tuple[list[tuple[int, str, str, str, str]], list[str]]:
    """Returns (rows, errors) where errors are Z-META human strings."""
    errors: list[str] = []
    start = None
    for i, line in enumerate(lines):
        if line.startswith("## ") and "任务卡一览" in line:
            start = i
            break
    if start is None:
        return [], ["no ## heading containing 任务卡一览"]

    j = start + 1
    while j < len(lines) and lines[j].strip() == "":
        j += 1
    if j >= len(lines) or not lines[j].lstrip().startswith("|"):
        return [], ["no markdown table immediately after 任务卡一览 heading"]

    header = lines[j]
    if "| 序号 |" not in header or "| ID |" not in header or "| 状态 |" not in header:
        return [], ["table header missing required cells | 序号 | / | ID | / | 状态 |"]

    j += 1
    if j < len(lines) and "---" in lines[j] and lines[j].lstrip().startswith("|"):
        j += 1

    rows: list[tuple[int, str, str, str, str]] = []
    while j < len(lines):
        line = lines[j]
        if line.startswith("## "):
            break
        if line.strip() == "":
            j += 1
            continue
        parsed = parse_table_row(line)
        if parsed is not None:
            rows.append(parsed)
        j += 1

    if not rows:
        errors.append("overview table has no data rows (TT-*)")
    return rows, errors


def collect_heading_ids(text: str) -> set[str]:
    ids: set[str] = set()
    for line in text.splitlines():
        m = HEADING_RE.match(line)
        if m:
            ids.add(m.group(1))
    return ids


def has_from_stash_pointer(summary: str) -> bool:
    return any(m in summary for m in STASH_MARKERS)


def main() -> int:
    ap = argparse.ArgumentParser(description="Validate AI任务卡索引 overview table (A,E,B,C,D).")
    ap.add_argument(
        "path",
        nargs="?",
        default=None,
        help="Path to docs/AI任务卡索引.md (default: <repo>/docs/AI任务卡索引.md)",
    )
    ap.add_argument(
        "--allow-seq-gaps",
        action="store_true",
        help="Rule A: only uniqueness + min(seq)==1; allow missing integers up to max(seq) (e.g. historical 缺号).",
    )
    args = ap.parse_args()

    root = Path(__file__).resolve().parent.parent
    path = Path(args.path).resolve() if args.path else root / "docs" / "AI任务卡索引.md"
    if not path.is_file():
        emit("Z-META", msg=f"file not found: {path}")
        return 1

    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    heading_ids = collect_heading_ids(text)

    rows, meta_errs = find_overview_rows([ln.rstrip("\n") for ln in lines])
    rc = 0
    for me in meta_errs:
        emit("Z-META", msg=me)
        rc = 1

    if meta_errs and not rows:
        return rc

    seqs = [r[0] for r in rows]
    if len(seqs) != len(set(seqs)):
        seen: set[int] = set()
        dupes: set[int] = set()
        for s in seqs:
            if s in seen:
                dupes.add(s)
            seen.add(s)
        for s in sorted(dupes):
            ids = [r[1] for r in rows if r[0] == s]
            emit("A-SEQ", seq=s, msg=f"duplicate sequence number ids={ids!r}")
            rc = 1

    if seqs:
        n = len(rows)
        u = sorted(set(seqs))
        if args.allow_seq_gaps:
            if u[0] != 1:
                emit("A-SEQ", msg=f"sequence min must be 1, got min={u[0]!r}")
                rc = 1
        else:
            if u[0] != 1 or u[-1] != n or len(u) != n:
                missing = sorted(set(range(1, u[-1] + 1)) - set(seqs))
                extra = sorted(set(seqs) - set(range(1, n + 1)))
                emit(
                    "A-SEQ",
                    msg=(
                        f"sequence not 1..{n} contiguous: min={u[0]!r} max={u[-1]!r} "
                        f"unique_count={len(u)} row_count={n} missing={missing!r} extra_vs_1..n={extra!r}"
                    ),
                )
                rc = 1

    ids_list = [r[1] for r in rows]
    id_counts = Counter(ids_list)
    for id_, cnt in sorted(id_counts.items()):
        if cnt > 1:
            seqs_for = sorted(r[0] for r in rows if r[1] == id_)
            emit("E-ID", id_=id_, msg=f"duplicate TT id in overview seqs={seqs_for!r} count={cnt}")
            rc = 1

    for seq, id_, _stage, status, summary in rows:
        cat = classify_status(status)
        if cat == "other":
            emit("B-STATUS", seq=seq, id_=id_, msg=f"illegal status {status!r}")
            rc = 1
            continue
        if cat == "closed":
            if id_ not in heading_ids:
                emit(
                    "C-BODY",
                    seq=seq,
                    id_=id_,
                    msg="closed family row missing ### TT-... body heading (loose id match)",
                )
                rc = 1
        if cat == "registered_open":
            if not has_from_stash_pointer(summary):
                emit("D-STASH", seq=seq, id_=id_, msg="missing from-stash pointer")
                rc = 1

    return rc


if __name__ == "__main__":
    sys.exit(main())
