# -*- coding: utf-8 -*-
"""Split composite overview row 157 into two TT rows; bump seq >=158 by 1; bump main-index refs."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PATH = ROOT / "AI任务卡索引.md"

ROW_157 = (
    "| 157 | TT-B156-B115-4-REGION-SHARE-SNAPSHOT-LINE-CHAIN-DB-RECONCILE-001 | revenue / **B-157 子项 A** · 对拍观测 | 已封口 | "
    "**B-157** **子项** **A** **：** **链** **`RegionShareSnapshotLine`** **+** **DB** **`region_share_snapshot_lines`** **对拍观测** **（** **非** **Σ/FeeRouter** **新** **SSOT** **）** **；** **与** **子项** **B** **同** **一览** **158** **互证** **；** **互证** [**母表 B-157**](./任务母表.md) · [**正文**](#tt-b156-b115-4-region-share-snapshot-line-chain-db-reconcile-001) · "
    "[**tick** **子项**](#tt-b157-indexer-tick-response-counters-standardize-001) · **细则** [`from-stash` · 157](./AI任务卡索引.from-stash.md) |"
)
ROW_158 = (
    "| 158 | TT-B157-INDEXER-TICK-RESPONSE-COUNTERS-STANDARDIZE-001 | indexer / **B-157 子项 B** · `indexer_tick` 四计数 | 已封口 | "
    "**B-157** **子项** **B** **：** **`indexer_tick`**** **`200`** **根级** **`new_events`****/**`parsed_events`****/**`failed_events`****/**`skipped_events`** **+** **机读锚** **`157-INDEXER-TICK-COUNTERS-V1`** **（** **非** **B-174** **分桶** **、** **非** **compound** **）** **；** **与** **子项** **A** **同** **一览** **157** **互证** **；** **互证** [**母表 B-157**](./任务母表.md) · [**正文**](#tt-b157-indexer-tick-response-counters-standardize-001) · "
    "[**Region** **子项**](#tt-b156-b115-4-region-share-snapshot-line-chain-db-reconcile-001) · **细则** [`from-stash` · 157](./AI任务卡索引.from-stash.md) |"
)

OLD_157 = (
    "| 157 | TT-B156-B115-4-REGION-SHARE-SNAPSHOT-LINE-CHAIN-DB-RECONCILE-001 · TT-B157-INDEXER-TICK-RESPONSE-COUNTERS-STANDARDIZE-001 | revenue / 对拍观测；indexer / internal 收口 | 已封口 | **B-157 v1（一壳两子项）**：**子项 B** **`indexer_tick` `200`** 四计数 **`new_events`/`parsed_events`/`failed_events`/`skipped_events`** + 机读锚 **`157-INDEXER-TICK-COUNTERS-V1`**（**非** **B-174** 分桶、**非** compound）；**子项 A**/**admin/reconcile 壳** 以 **`from-stash`** 为准；互证 [**母表 B-157**](./任务母表.md) · [**Region 正文**](#tt-b156-b115-4-region-share-snapshot-line-chain-db-reconcile-001) · [**tick 正文**](#tt-b157-indexer-tick-response-counters-standardize-001)；细则 [`from-stash` · 157](./AI任务卡索引.from-stash.md) |"
)


def renumber_table_leading_seq(line: str) -> str | None:
    m = re.match(r"^(\|\s*)(\d+)(\s*\|)", line)
    if not m:
        return None
    seq = int(m.group(2))
    if seq < 158:
        return line
    return line[: m.start(2)] + str(seq + 1) + line[m.end(2) :]


def main() -> None:
    text = PATH.read_text(encoding="utf-8")
    if OLD_157 not in text:
        raise SystemExit("OLD_157 row not found (already split?)")

    lines = text.splitlines(keepends=True)
    out: list[str] = []
    in_overview = False
    seen_heading = False
    for i, line in enumerate(lines):
        if line.startswith("## ") and "任务卡一览" in line:
            in_overview = True
            seen_heading = True
            out.append(line)
            continue
        if in_overview and line.startswith("## "):
            in_overview = False
            out.append(line)
            continue
        if in_overview and line.strip().startswith("|") and OLD_157 in line:
            out.append(ROW_157 + "\n")
            out.append(ROW_158 + "\n")
            continue
        if in_overview and line.strip().startswith("|"):
            nl = renumber_table_leading_seq(line)
            out.append(nl if nl is not None else line)
            continue
        out.append(line)

    text = "".join(out)

    # Bump explicit main-index pointers (descending to avoid double-hit)
    for n in range(312, 157, -1):
        text = text.replace(f"**主索引** **一览** **{n}**", f"**主索引** **一览** **{n + 1}**")
    for n in range(312, 157, -1):
        text = text.replace(f"**本索引一览** **{n}**", f"**本索引一览** **{n + 1}**")

    text = text.replace("**主索引** **一览** **279～308**", "**主索引** **一览** **280～309**")
    text = text.replace("**279～308**", "**280～309**")

    # Meta paragraphs (merged-row counts)
    text = text.replace("**一览 192～312**", "**一览 192～313**")
    text = text.replace("下列 **121** 张", "下列 **122** 张")
    text = text.replace("**一览 192～312（本文件已并入）**：对应 **121** 张", "**一览 192～313（本文件已并入）**：对应 **122** 张")
    text = text.replace("**279～308** **→** **本文件** **一览** **279～308**", "**279～308** **→** **本文件** **一览** **280～309**")

    PATH.write_text(text, encoding="utf-8")
    print("ok")


if __name__ == "__main__":
    main()
