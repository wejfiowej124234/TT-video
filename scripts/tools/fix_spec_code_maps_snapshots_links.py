#!/usr/bin/env python3
"""
One-shot helper: after git mv of spec/* into spec/code-maps/ and spec/snapshots/,
rewrite markdown links across the repo and fix ../ upward links inside relocated files.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SPEC = REPO / "docs" / "spec"
CODE_MAPS = SPEC / "code-maps"
SNAPSHOTS = SPEC / "snapshots"

CODE_MAPS_FILES: tuple[str, ...] = (
    "05-补充-前端实现细节与代码映射-20260306.md",
    "13-补充-协议级UI宪法代码对齐与冲突清单-20260306.md",
    "21-补充-UI3D融合规范代码映射与差距-20260306.md",
    "22-补充-Design-Tokens完整实装映射-20260306.md",
    "28-补充-玻璃态与Web3融合组件规范-20260306.md",
    "29-补充-自由市场撮合控制台代码实现映射-20260306.md",
    "57-UI-UX与全域代码映射-企业级检查清单-20260306.md",
    "15-附录〇与缺口官方总表-P0行映射-B309.md",
    "62-UI-UX前端100%代码映射总表-20260306.md",
    "62-补充-01-Market路由逐文件代码映射-20260306.md",
    "62-补充-02-Community路由逐文件代码映射-20260306.md",
    "62-补充-03-Escrow路由逐文件代码映射-20260306.md",
    "62-补充-04-Auth与Me路由逐文件代码映射-20260306.md",
    "62-补充-05-剩余路由域逐文件代码映射-20260306.md",
)

SNAPSHOTS_FILES: tuple[str, ...] = (
    "58-企业级检查-完成证明-20260306.md",
    "58-企业级检查·完成证明·20260306.md",
    "60-前端UI-UX企业级深度检查与补充方案-20260306.md",
    "61-前端实现代码扫描与文档对齐-20260306.md",
    "00-企业级文档整理进度-20260306.md",
    "67-架构与阶段文档对齐纪要-20260326.md",
    "28-P28与截图对照-Web3融入与缺口清单.md",
    "28-截图风格对照与UI深度检查.md",
    "28-企业级UI设计审计报告.md",
    "28-自定义行程弹窗企业级审计报告.md",
    "00-文档整理清单-分类与重排.md",
    "24-docs企业级整理结论.md",
    "26-docs企业级文档审计报告.md",
)

# md link target: optional anchor, .md required
LINK_RE = re.compile(r"\]\(([^)]+)\)")


def spec_root_md_basenames() -> set[str]:
    return {p.name for p in SPEC.glob("*.md")}


def rewrite_pass_global(text: str, path: Path) -> str:
    """Point old spec-root basenames to code-maps/ or snapshots/ (skip already prefixed)."""
    rel = path.as_posix()
    in_reloc = "/code-maps/" in rel or "/snapshots/" in rel
    out = text

    def sub_spec_uri(folder: str, basenames: tuple[str, ...]) -> None:
        nonlocal out
        for base in basenames:
            needle = f"spec/{base}"
            if needle in out:
                out = out.replace(needle, f"spec/{folder}/{base}")
            needle2 = f"./spec/{base}"
            if needle2 in out:
                out = out.replace(needle2, f"./spec/{folder}/{base}")
            needle3 = f"../spec/{base}"
            if needle3 in out:
                out = out.replace(needle3, f"../spec/{folder}/{base}")

    sub_spec_uri("code-maps", CODE_MAPS_FILES)
    sub_spec_uri("snapshots", SNAPSHOTS_FILES)

    # Inside relocated markdown, only `spec/...` URI fixes apply; ](...) handled later.
    if in_reloc and path.suffix.lower() == ".md":
        return out

    # Markdown inline targets: ](basename.md) or ](basename.md#anchor)
    if path.suffix.lower() != ".md":
        return out

    def repl_link(m: re.Match[str]) -> str:
        inner = m.group(1).strip()
        if inner.startswith("http://") or inner.startswith("https://"):
            return m.group(0)
        if inner.startswith("../") or inner.startswith("./") or inner.startswith("/"):
            return m.group(0)
        if "/" in inner.split("#", 1)[0]:
            return m.group(0)
        base = inner.split("#", 1)[0]
        anchor = inner[len(base) :] if "#" in inner else ""
        if base in CODE_MAPS_FILES:
            return f"](code-maps/{base}{anchor})"
        if base in SNAPSHOTS_FILES:
            return f"](snapshots/{base}{anchor})"
        return m.group(0)

    out = LINK_RE.sub(repl_link, out)
    return out


def rewrite_inside_relocated(text: str, folder: str) -> str:
    """In code-maps/*.md or snapshots/*.md, bare links to spec/*.md need ../ prefix."""
    roots = spec_root_md_basenames()
    own_basenames = set(CODE_MAPS_FILES if folder == "code-maps" else SNAPSHOTS_FILES)
    # other relocated folder
    other = SNAPSHOTS_FILES if folder == "code-maps" else CODE_MAPS_FILES
    other_set = set(other)

    def repl_link(m: re.Match[str]) -> str:
        inner = m.group(1).strip()
        if inner.startswith("http://") or inner.startswith("https://"):
            return m.group(0)
        if inner.startswith("../../") or inner.startswith("../../../"):
            return m.group(0)
        path_part = inner.split("#", 1)[0]
        anchor = inner[len(path_part) :] if "#" in inner else ""
        if "/" in path_part:
            # already has path segment
            if path_part.startswith("../") or path_part.startswith("./"):
                return m.group(0)
            # e.g. code-maps/foo — treat as already qualified from spec root
            if path_part.startswith("code-maps/") or path_part.startswith("snapshots/"):
                return m.group(0)
        base = path_part
        if base in own_basenames:
            return m.group(0)
        if base in other_set:
            sub = "../snapshots" if folder == "code-maps" else "../code-maps"
            return f"]({sub}/{base}{anchor})"
        if base in roots:
            return f"](../{base}{anchor})"
        return m.group(0)

    return LINK_RE.sub(repl_link, text)


def main() -> int:
    exts = {".md", ".yml", ".yaml"}
    touched = 0
    for root in (REPO / "docs", REPO / ".github", REPO / "scripts"):
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if path.suffix.lower() not in {e.lower() for e in exts}:
                continue
            if "node_modules" in path.parts:
                continue
            raw = path.read_text(encoding="utf-8")
            new = rewrite_pass_global(raw, path)
            rel = path.relative_to(REPO).as_posix()
            if rel.startswith("docs/spec/code-maps/") and path.suffix.lower() == ".md":
                new = rewrite_inside_relocated(new, "code-maps")
            elif rel.startswith("docs/spec/snapshots/") and path.suffix.lower() == ".md":
                new = rewrite_inside_relocated(new, "snapshots")
            if new != raw:
                path.write_text(new, encoding="utf-8", newline="\n")
                touched += 1
    print(f"OK: updated {touched} files", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
