#!/usr/bin/env python3
"""
Admin 深审计 · 表面盘点：Next `app/admin/**/page.tsx` 路由 vs `crates/api/src/routes/admin/mod.rs` 中
`/api/v1/admin/...` 路由字符串（机读 grep，非语义等价证明）。

用法（仓库根）：
  python scripts/dev/inventory_admin_deep_audit.py
  python scripts/dev/inventory_admin_deep_audit.py --write evidence/93-batch-admin-deep-audit/inventory-surface.generated.md
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def collect_admin_page_routes(frontend_app_admin: Path) -> list[str]:
    routes: list[str] = []
    for p in sorted(frontend_app_admin.rglob("page.tsx")):
        rel = p.relative_to(frontend_app_admin).as_posix()
        if rel == "page.tsx":
            routes.append("/admin")
            continue
        parts = rel.removesuffix("/page.tsx").split("/")
        routes.append("/admin/" + "/".join(parts))
    return sorted(set(routes))


def collect_admin_api_routes(admin_mod: Path) -> list[str]:
    text = admin_mod.read_text(encoding="utf-8", errors="replace")
    found = re.findall(r'"/api/v1/admin[^"]+"', text)
    out: list[str] = []
    for s in found:
        u = s.strip('"')
        if u not in out:
            out.append(u)
    return out


def heuristic_api_for_ui_path(ui_path: str, api_routes: list[str]) -> list[str]:
    """粗映射：静态 /admin/foo → 前缀 /api/v1/admin/foo；动态段截到前一节。"""
    if ui_path == "/admin":
        return [
            x
            for x in api_routes
            if x.rstrip("/") == "/api/v1/admin" or x.startswith("/api/v1/admin/")
        ]
    stem = ui_path  # /admin/foo/bar/[id]/x
    while "[" in stem:
        stem = stem.rsplit("/", 1)[0]
    prefix = "/api/v1" + stem
    return [x for x in api_routes if x == prefix or x.startswith(prefix + "/")]


def render_markdown(ui_routes: list[str], api_routes: list[str]) -> str:
    lines: list[str] = []
    lines.append("# Admin 深审计 · 机读表面盘点（生成）")
    lines.append("")
    lines.append("**口径**：`已实现 / 缺失 / 仅壳 / 未验证` 中，本文件仅自动填 **「前端路由存在」** 与 **「后端是否存在可 grep 到的相关 `/api/v1/admin/*` 前缀」**；")
    lines.append("**写路径 / RBAC / 空态 / UI↔API 字段** 须以 Playwright 深批 + 手工登记 `inventory.md` 正文。")
    lines.append("")
    lines.append(f"- 前端 `page.tsx` 数：**{len(ui_routes)}**")
    lines.append(f"- 后端 admin 路由串（去重）：**{len(api_routes)}**")
    lines.append("")
    lines.append("## 前端 Admin 路由 → 后端前缀命中（启发式）")
    lines.append("")
    lines.append("| UI 路由 | 命中 API（子串列举，最多 8 条） | 机读结论 |")
    lines.append("|---------|-----------------------------------|----------|")
    for u in ui_routes:
        hits = heuristic_api_for_ui_path(u, api_routes)[:8]
        hit_cell = "<br>".join(hits) if hits else "—"
        if not hits:
            conclusion = "**缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target）"
        elif "[id]" in u or "placeholder" in u.lower():
            conclusion = "**未验证**（动态段；须对拍详情 GET/写路径）"
        else:
            conclusion = "**未验证**（有 API 前缀；须 Playwright / 登录角色）"
        lines.append(f"| `{u}` | {hit_cell} | {conclusion} |")
    lines.append("")
    lines.append("## 后端 `/api/v1/admin/*` 全量（grep，含重复装配排除前原始去重）")
    lines.append("")
    for a in api_routes:
        lines.append(f"- `{a}`")
    lines.append("")
    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--write",
        metavar="PATH",
        help="写入 Markdown 文件（UTF-8）；省略则打印 stdout",
    )
    args = ap.parse_args()
    root = repo_root()
    ui = collect_admin_page_routes(root / "frontend" / "app" / "admin")
    api = collect_admin_api_routes(root / "crates" / "api" / "src" / "routes" / "admin" / "mod.rs")
    md = render_markdown(ui, api)
    if args.write:
        out = Path(args.write)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(md, encoding="utf-8")
        print(f"wrote {out}", file=sys.stderr)
    else:
        sys.stdout.write(md)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
