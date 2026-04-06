#!/usr/bin/env python3
"""
对照 docs/spec/13-1-UI产品级SSOT与页面规范.md §二「表 1」页面地图 + 「个人中心与 TT 社区·我」互通子表
与 frontend/app（Next.js App Router）。

- 全角括号内的「/a 或 /b」为择一存在即可。
- 路径 token 须为「非单词字符后的 /」开头，避免 TTG/Target 等误匹配。
- 与 check-04-frontend-routes-vs-app.py 互补。

用法：仓库根 python3 scripts/check-13-1-table1-routes-vs-app.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/spec/13-1-UI产品级SSOT与页面规范.md"
APP = ROOT / "frontend" / "app"

PAGE_NAME_TO_ROUTES: dict[str, list[str]] = {
    "landing": ["/"],
    "discover": ["/discover"],
    "orderflow": ["/orders/new"],
    "escrowdetail": ["/escrow/:id"],
    "dispute": ["/disputes"],
}

GOVERNANCE_ROUTES = ["/governance", "/governance/proposals", "/governance/params"]

# 文档状态词，勿当路径段
SKIP_SEGMENTS = frozenset({"target", "partial", "implemented"})


def extract_table1_section(text: str) -> str:
    start = text.find("### 表 1：页面地图")
    if start < 0:
        print("check-13-1-table1-routes-vs-app: cannot find 13-1 table 1 header", file=sys.stderr)
        sys.exit(2)
    end = text.find("### 表 2：", start)
    if end < 0:
        print("check-13-1-table1-routes-vs-app: cannot find table 2 after table 1", file=sys.stderr)
        sys.exit(2)
    return text[start:end]


def path_segments_ok(path: str) -> bool:
    if not path.startswith("/"):
        return False
    # 表 1 正文中会引用 REST 路径（如 GET `/api/v1/discover/orders`）；非 App Router 页面
    if path.startswith("/api"):
        return False
    rest = path[1:]
    if not rest:
        return True
    for seg in rest.split("/"):
        if not seg:
            return False
        if seg in (":id", "[id]"):
            continue
        ls = seg.lower()
        if ls in SKIP_SEGMENTS:
            return False
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9_\-]*$", seg):
            return False
    return True


def extract_paths_from_text(chunk: str) -> list[str]:
    """Slash-paths only when '/' is not preceded by ASCII letter or digit."""
    pat = re.compile(r"(?<![A-Za-z0-9])(/[a-z][a-z0-9_\-]*(?:/[a-zA-Z0-9_\-\[\]:]+)*)")
    out: list[str] = []
    for m in pat.finditer(chunk):
        p = m.group(1).rstrip("，,、.）)")
        if path_segments_ok(p):
            out.append(p)
    seen: set[str] = set()
    return [x for x in out if not (x in seen or seen.add(x))]


def route_paths_for_filesystem(route: str) -> list[Path]:
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
        print(f"check-13-1-table1-routes-vs-app: unhandled wildcard route {route!r}", file=sys.stderr)
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


def collect_from_fw_parens(section: str) -> tuple[list[str], list[list[str]]]:
    required: list[str] = []
    or_groups: list[list[str]] = []
    for m in re.finditer(r"（([^）]+)）", section):
        inner = m.group(1).strip()
        if "/" not in inner:
            continue
        alts = re.split(r"\s*或\s*", inner)
        alt_paths: list[list[str]] = []
        for alt in alts:
            ps = extract_paths_from_text(alt)
            if ps:
                alt_paths.append(ps)
        if len(alt_paths) <= 1:
            for ps in alt_paths:
                required.extend(ps)
        else:
            flat = [p for ps in alt_paths for p in ps]
            if flat:
                or_groups.append(flat)
    return required, or_groups


def normalize_page_cell(cell: str) -> str:
    s = cell.strip()
    s = re.sub(r"\*\*", "", s)
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)
    return s.strip().lower()


def collect_ia_table_named_routes(main: str) -> list[str]:
    routes: list[str] = []
    in_table = False
    for line in main.splitlines():
        if "| 分组 | 页面 |" in line:
            in_table = True
            continue
        if not in_table or not line.startswith("|"):
            continue
        if re.match(r"^\|\s*[-:]+\s*\|", line):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 4:
            continue
        page_cell = parts[2]
        norm = normalize_page_cell(page_cell)
        if not norm or norm == "页面":
            continue
        if "governance" in norm and "proposals" in norm:
            routes.extend(GOVERNANCE_ROUTES)
            continue
        if "admin" in norm and "runbook" in norm:
            routes.append("/admin")
            continue
        for token, rs in PAGE_NAME_TO_ROUTES.items():
            if token in norm.replace(" ", ""):
                routes.extend(rs)
                break
    return routes


def collect_interconnect_bare_paths(section: str) -> list[str]:
    """仅「单元格几乎仅为路径」如 | ... | /community/me |（不含全角括号分支，分支已由 collect_from_fw_parens 处理）。"""
    mark = "**个人中心与 TT 社区「我」互通**"
    if mark not in section:
        return []
    _, sub = section.split(mark, 1)
    req: list[str] = []
    for line in sub.splitlines():
        if not line.startswith("|") or "| 入口 |" in line or "| 去向 |" in line:
            continue
        if re.match(r"^\|\s*[-:]+\s*\|", line):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 4:
            continue
        for col in (parts[2], parts[3]):
            c = re.sub(r"\*\*", "", col).strip()
            if re.fullmatch(r"/[a-z][a-z0-9_/:\-\[\]]*", c) and path_segments_ok(c):
                req.append(c)
    return req


def main() -> int:
    if not DOC.is_file():
        print(f"check-13-1-table1-routes-vs-app: missing {DOC}", file=sys.stderr)
        return 2
    if not APP.is_dir():
        print(f"check-13-1-table1-routes-vs-app: missing {APP}", file=sys.stderr)
        return 2

    text = DOC.read_text(encoding="utf-8")
    section = extract_table1_section(text)
    split_mark = "**个人中心与 TT 社区「我」互通**"
    main = section.split(split_mark, 1)[0] if split_mark in section else section

    required: list[str] = []
    or_groups: list[list[str]] = []

    r1, g1 = collect_from_fw_parens(section)
    required.extend(r1)
    or_groups.extend(g1)

    required.extend(collect_ia_table_named_routes(main))
    required.extend(collect_interconnect_bare_paths(section))

    seen_r: set[str] = set()
    req_dedup = [p for p in required if p not in seen_r and not seen_r.add(p)]

    errors: list[str] = []

    for route in req_dedup:
        for p in route_paths_for_filesystem(route):
            msg = check_path(p, route)
            if msg:
                errors.append(msg)

    for group in or_groups:
        ok_any = False
        group_errors: list[str] = []
        for route in group:
            sub_ok = True
            for p in route_paths_for_filesystem(route):
                msg = check_path(p, route)
                if msg:
                    group_errors.append(msg)
                    sub_ok = False
            if sub_ok:
                ok_any = True
                break
        if not ok_any and group:
            errors.append(
                "OR group: none of "
                + ", ".join(repr(x) for x in group)
                + " — "
                + "; ".join(group_errors[:8])
            )

    if errors:
        print("check-13-1-table1-routes-vs-app FAIL:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    print("check-13-1-table1-routes-vs-app OK: 13-1 sec 2 table 1 routes match frontend/app.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
