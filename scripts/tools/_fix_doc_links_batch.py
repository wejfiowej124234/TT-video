#!/usr/bin/env python3
"""One-off batch fixes for docs relative links (run from repo root)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs"


def replace_in_globs(patterns: list[tuple[str, str]], globs: list[str]) -> int:
    n = 0
    for g in globs:
        for path in DOCS.rglob(g):
            if not path.is_file():
                continue
            text = path.read_text(encoding="utf-8")
            orig = text
            for a, b in patterns:
                text = text.replace(a, b)
            if text != orig:
                path.write_text(text, encoding="utf-8", newline="\n")
                n += 1
    return n


def main() -> None:
    # 42: canonical filename uses 游客 not 旅行者
    c1 = replace_in_globs(
        [
            (
                "42-自定义行程弹窗-旅行者与向导UI设计与算法.md",
                "42-自定义行程弹窗-游客与向导UI设计与算法.md",
            )
        ],
        ["*.md"],
    )
    # AI index: 任务母表 path from docs/（../docs 会落到 docs/docs）
    c2 = 0
    for name in ("AI任务卡索引.md", "AI任务卡索引.from-stash.md"):
        p = DOCS / name
        if not p.is_file():
            continue
        t = p.read_text(encoding="utf-8")
        t2 = t.replace("../docs/任务母表.md", "./任务母表.md")
        if t2 != t:
            p.write_text(t2, encoding="utf-8", newline="\n")
            c2 += 1
    # 测试账号
    p = DOCS / "测试账号与本地联调.md"
    if p.is_file():
        t = p.read_text(encoding="utf-8")
        t2 = t.replace("(docs/spec/00-文档索引.md)", "(spec/00-文档索引.md)")
        if t2 != t:
            p.write_text(t2, encoding="utf-8", newline="\n")
            c3 = 1
        else:
            c3 = 0
    else:
        c3 = 0

    # spec/archive: 00-文档索引 lives in spec/
    arch = list((DOCS / "spec" / "archive").glob("*.md")) if (DOCS / "spec" / "archive").is_dir() else []
    c4 = 0
    for path in arch:
        text = path.read_text(encoding="utf-8")
        # (00-文档索引.md) -> (../00-文档索引.md) when not already ../
        text2 = re.sub(
            r"\((?!\.{1,2}/)00-文档索引\.md\)",
            r"(../00-文档索引.md)",
            text,
        )
        if text2 != text:
            path.write_text(text2, encoding="utf-8", newline="\n")
            c4 += 1

    print(
        f"replaced 42-traveler->游客 in {c1} files; "
        f"任务母表 links {c2}; 测试账号 {c3}; archive 00-index {c4} files"
    )


if __name__ == "__main__":
    main()
