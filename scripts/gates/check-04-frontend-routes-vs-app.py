#!/usr/bin/env python3
"""
对照 docs/spec/04-后端与API.md §3.4「前端页面路由」表与 frontend/app（Next.js App Router）。

- 失败：表中路径缺少对应 page.tsx，或 /* 通配目录缺失。
- 与 check-04-routes-vs-code.py 互补（后者仅校验 §3.4 API 主表 vs Axum .route）。

用法：仓库根 python3 scripts/check-04-frontend-routes-vs-app.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / "docs/spec/04-后端与API.md"
APP = ROOT / "frontend" / "app"


def extract_frontend_routes_section(text: str) -> str:
    start = text.find("**前端页面路由")
    if start < 0:
        print("check-04-frontend-routes-vs-app: cannot find 04 §3.4 frontend routes header", file=sys.stderr)
        sys.exit(2)
    end = text.find("\n| 方法 | 路径 |", start)
    if end < 0:
        print("check-04-frontend-routes-vs-app: cannot find API table start after frontend routes", file=sys.stderr)
        sys.exit(2)
    return text[start:end]


def parse_route_tokens(first_col: str) -> list[str]:
    cell = first_col.strip()
    cell = cell.split("（")[0].strip()
    chunks = cell.split("、")
    out: list[str] = []
    for ch in chunks:
        t = ch.strip().strip("`").replace("**", "").strip()
        if t.startswith("/"):
            out.append(t)
    return out


def route_paths_for_filesystem(route: str) -> list[Path]:
    """Return list of paths that must exist (file or dir)."""
    r = route.strip()
    if r.endswith("/*"):
        base = r[:-2].rstrip("/")
        if base == "/auth":
            return [
                APP / "auth" / "login" / "page.tsx",
                APP / "auth" / "register" / "page.tsx",
            ]
        if base == "/community":
            return [APP / "community"]
        if base == "/admin":
            return [APP / "admin"]
        print(f"check-04-frontend-routes-vs-app: unhandled wildcard route {route!r}", file=sys.stderr)
        return []

    if r == "/":
        return [APP / "(home)" / "page.tsx"]

    segments = [s.replace(":id", "[id]") for s in r.split("/") if s]
    return [APP.joinpath(*segments) / "page.tsx"]


def check_path(p: Path, route: str) -> str | None:
    if p.suffix == ".tsx":
        if p.is_file():
            return None
        return f"missing page.tsx for route {route!r}: expected {p.relative_to(ROOT)}"
    if p.is_dir():
        return None
    return f"missing directory for route {route!r}: expected {p.relative_to(ROOT)}/"


def main() -> int:
    if not DOC.is_file():
        print(f"check-04-frontend-routes-vs-app: missing {DOC}", file=sys.stderr)
        return 2
    if not APP.is_dir():
        print(f"check-04-frontend-routes-vs-app: missing {APP}", file=sys.stderr)
        return 2

    text = DOC.read_text(encoding="utf-8")
    section = extract_frontend_routes_section(text)
    errors: list[str] = []

    for line in section.splitlines():
        line = line.rstrip()
        if not line.startswith("|"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 3:
            continue
        first = parts[1]
        if not first or first == "路径" or set(first) <= {"-", ":"}:
            continue

        for route in parse_route_tokens(first):
            for p in route_paths_for_filesystem(route):
                msg = check_path(p, route)
                if msg:
                    errors.append(msg)

    if errors:
        print("check-04-frontend-routes-vs-app FAIL:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    print("check-04-frontend-routes-vs-app OK: 04 sec 3.4 frontend page routes match frontend/app.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
