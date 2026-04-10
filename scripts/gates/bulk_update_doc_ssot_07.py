#!/usr/bin/env python3
"""One-shot: point normative '00-文档体系与阅读串联' path refs to 07 SSOT. Safe to re-run."""
from __future__ import annotations

from pathlib import Path

SPEC = Path(__file__).resolve().parents[2] / "docs" / "spec"

REPLACEMENTS: list[tuple[str, str]] = [
    (
        "- 文档串联变更：必须同步 `00-文档体系与阅读串联` 与 `00-文档索引`。",
        "- 文档串联变更：必须同步 **[07-开发流程与顺序](07-开发流程与顺序.md)（§零～§五正文）**、[00-文档索引](00-文档索引.md)；[00-文档体系与阅读串联](00-文档体系与阅读串联.md) 为兼容壳（涉及 CI 关键词如 `82` 时须核对）。",
    ),
    (
        "- 业务线串联：`docs/spec/00-文档体系与阅读串联.md`",
        "- 业务线串联：**[07-开发流程与顺序.md](07-开发流程与顺序.md) §五**（[00-文档体系与阅读串联.md](00-文档体系与阅读串联.md) 兼容壳）",
    ),
    (
        "- 业务线串联入口：`docs/spec/00-文档体系与阅读串联.md`",
        "- 业务线串联入口：**[07-开发流程与顺序.md](07-开发流程与顺序.md) §五**（[00-文档体系与阅读串联.md](00-文档体系与阅读串联.md) 兼容壳）",
    ),
    (
        "- 文档串联：`docs/spec/00-文档体系与阅读串联.md`",
        "- 文档串联：**[07-开发流程与顺序.md](07-开发流程与顺序.md) §零、§五**（[00-文档体系与阅读串联.md](00-文档体系与阅读串联.md) 兼容壳）",
    ),
    (
        "- 文档串联与冲突优先级：`docs/spec/00-文档体系与阅读串联.md`",
        "- 文档串联与冲突优先级：**[07-开发流程与顺序.md](07-开发流程与顺序.md) §零**（[00-文档体系与阅读串联.md](00-文档体系与阅读串联.md) 兼容壳）",
    ),
    (
        "- 文档串联与业务线：`docs/spec/00-文档体系与阅读串联.md`",
        "- 文档串联与业务线：**[07-开发流程与顺序.md](07-开发流程与顺序.md) §零、§五**（[00-文档体系与阅读串联.md](00-文档体系与阅读串联.md) 兼容壳）",
    ),
    (
        "受 `docs/spec/00-文档体系与阅读串联.md` 约束。",
        "受 **[07-开发流程与顺序.md](07-开发流程与顺序.md) §零** 约束（[00-文档体系与阅读串联.md](00-文档体系与阅读串联.md) 兼容壳）。",
    ),
    (
        "- 权威层级与冲突规则：见 `docs/spec/00-文档体系与阅读串联.md`。",
        "- 权威层级与冲突规则：见 **[07-开发流程与顺序.md](07-开发流程与顺序.md) §零、§五**（[00-文档体系与阅读串联.md](00-文档体系与阅读串联.md) 兼容壳）。",
    ),
    (
        "- 发布门禁变更：必须同步 `140`、`15` 与 `00-文档体系与阅读串联`。",
        "- 发布门禁变更：必须同步 **[140-阶段开发云部署与交付架构](140-阶段开发云部署与交付架构.md)**、[15-多维度文档与技术检查报告](15-多维度文档与技术检查报告.md)、**[07](07-开发流程与顺序.md) §五 5.6A**（120→130→140→15）；[00-文档体系与阅读串联](00-文档体系与阅读串联.md) 兼容壳含 CI 关键词时核对。",
    ),
]


def main() -> None:
    updated = 0
    for path in sorted(SPEC.rglob("*.md")):
        if path.name == "00-文档体系与阅读串联.md":
            continue
        text = path.read_text(encoding="utf-8")
        new = text
        for old, rep in REPLACEMENTS:
            new = new.replace(old, rep)
        if new != text:
            path.write_text(new, encoding="utf-8")
            updated += 1
            print(path.relative_to(SPEC.parent.parent))
    print(f"OK: updated {updated} files")


if __name__ == "__main__":
    main()
