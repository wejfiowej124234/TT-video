#!/usr/bin/env python3
"""
Fail-closed：13-1 §二 表 1（含互通子表）抽取的每条「正式」前台路径，须在 04 §3.4「前端页面路由」表中有覆盖。

- 覆盖规则：`/` 精确；`**/*` 前缀；**`:id` / `[id]`** 按段匹配；04 首列 **`、`** 拆分为多条 pattern。
- **或** 组（全角括号内 `/a 或 /b`）：至少一条被 04 覆盖即可。

与 **07 §二 2.4**（04 前端表与 13-1 表 1 同批一致）及 **04 篇首 SSOT** 互证；纯文档对照，不读 frontend/app。

用法：仓库根 python3 scripts/gates/check-13-1-routes-covered-by-04-frontend-table.py
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _load_script_module(attr_name: str, filename: str):
    path = ROOT / "scripts" / "gates" / filename
    if not path.is_file():
        print(f"check-13-1-routes-covered-by-04: missing {path}", file=sys.stderr)
        sys.exit(2)
    spec = importlib.util.spec_from_file_location(attr_name, path)
    if spec is None or spec.loader is None:
        print(f"check-13-1-routes-covered-by-04: cannot load {path}", file=sys.stderr)
        sys.exit(2)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def norm_url(p: str) -> str:
    p = p.strip()
    if not p.startswith("/"):
        p = "/" + p
    if len(p) > 1 and p.endswith("/"):
        p = p.rstrip("/")
    return p


def pattern_covers(pattern: str, path: str) -> bool:
    pat = pattern.strip()
    path_n = norm_url(path)
    if pat.endswith("/*"):
        base = norm_url(pat[:-2])
        if base == "/":
            return True
        return path_n == base or path_n.startswith(base + "/")
    if ":id" in pat or "[id]" in pat:
        pat_segs = [x for x in pat.strip("/").split("/") if x]
        path_segs = [x for x in path_n.strip("/").split("/") if x]
        if len(pat_segs) != len(path_segs):
            return False
        for a, b in zip(pat_segs, path_segs):
            if a in (":id", "[id]"):
                continue
            if a != b:
                return False
        return True
    return norm_url(pat) == path_n


def load_04_patterns(mod04) -> list[str]:
    doc = mod04.DOC
    text = doc.read_text(encoding="utf-8")
    section = mod04.extract_frontend_routes_section(text)
    out: list[str] = []
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
        out.extend(mod04.parse_route_tokens(first))
    seen: set[str] = set()
    return [x for x in out if not (x in seen or seen.add(x))]


def collect_13_1_requirements(mod13):
    doc = mod13.DOC
    text = doc.read_text(encoding="utf-8")
    section = mod13.extract_table1_section(text)
    split_mark = "**个人中心与 TT 社区「我」互通**"
    main = section.split(split_mark, 1)[0] if split_mark in section else section

    required: list[str] = []
    or_groups: list[list[str]] = []

    r1, g1 = mod13.collect_from_fw_parens(section)
    required.extend(r1)
    or_groups.extend(g1)
    required.extend(mod13.collect_ia_table_named_routes(main))
    required.extend(mod13.collect_interconnect_bare_paths(section))

    seen_r: set[str] = set()
    req_dedup = [p for p in required if p not in seen_r and not seen_r.add(p)]
    return req_dedup, or_groups


def path_covered(path: str, patterns: list[str]) -> bool:
    return any(pattern_covers(p, path) for p in patterns)


def main() -> int:
    mod04 = _load_script_module("chk04fe", "check-04-frontend-routes-vs-app.py")
    mod13 = _load_script_module("chk13t1", "check-13-1-table1-routes-vs-app.py")

    patterns = load_04_patterns(mod04)
    if not patterns:
        print("check-13-1-routes-covered-by-04: no patterns parsed from 04 frontend table", file=sys.stderr)
        return 2

    req, or_groups = collect_13_1_requirements(mod13)
    errors: list[str] = []

    for path in req:
        if not path_covered(path, patterns):
            errors.append(f"13-1 route {path!r} not covered by any 04 sec 3.4 frontend path pattern")

    for group in or_groups:
        if not any(path_covered(p, patterns) for p in group):
            errors.append(
                "OR group: none of "
                + ", ".join(repr(x) for x in group)
                + " covered by 04 sec 3.4 frontend path table"
            )

    if errors:
        print("check-13-1-routes-covered-by-04-frontend-table FAIL:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    print(
        "check-13-1-routes-covered-by-04-frontend-table OK: "
        "13-1 table 1 routes are covered by 04 sec 3.4 frontend path table."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
