#!/usr/bin/env python3
"""
对照 04 §3.4 主表路径与 crates/api 中 Axum `.route("...")` 或 `.route(ROUTE_CONST, …)` 挂载（后者须同文件 `const …: &str = "/…"`）。
- 失败：表中路径（排除已知「仅登记未实现」集合）在代码中不存在。
- 警告：/api/v1/ 下非 internal、非 admin 的已挂载路径未出现在 §3.4 表中（供回填 04/14）。

用法：仓库根 python3 scripts/check-04-routes-vs-code.py
环境变量 STRICT_WARNINGS=1 时警告也导致退出码 1。
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROUTES_DIR = ROOT / "crates/api/src/routes"
DOC = ROOT / "docs/spec/04-后端与API.md"

ROUTE_RE = re.compile(r'\.route\s*\(\s*"([^"]+)"', re.MULTILINE)
# Same-file string const, e.g. `pub(crate) const CHAIN_SYNC_ROUTE_PATH: &str = "/api/...";`
STR_PATH_CONST_RE = re.compile(
    r"(?:pub\s*(?:\([^)]*\)\s*)?)?const\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*&str\s*=\s*\"([^\"]+)\"\s*;",
    re.MULTILINE,
)
ROUTE_CONST_RE = re.compile(r"\.route\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,", re.MULTILINE)
ROW_RE = re.compile(
    r"^\|\s*(?:GET|POST|PUT|PATCH|DELETE)\s*\|\s*(\/[^\s|]+)\s*\|",
    re.MULTILINE,
)

# 04 §3.4 中「仅文档登记、代码待挂载」的路径豁免集合（当前为空；160 举报/审核六路由已落地）
DOC_ONLY_SCHEDULED = frozenset()


def paths_from_code() -> set[str]:
    out: set[str] = set()
    for p in sorted(ROUTES_DIR.rglob("*.rs")):
        text = p.read_text(encoding="utf-8")
        for m in ROUTE_RE.finditer(text):
            out.add(m.group(1))
        str_consts = {k: v for k, v in STR_PATH_CONST_RE.findall(text)}
        for m in ROUTE_CONST_RE.finditer(text):
            ident = m.group(1)
            if ident in str_consts:
                out.add(str_consts[ident])
    return out


def paths_from_04_table_34() -> set[str]:
    text = DOC.read_text(encoding="utf-8")
    start = text.find("### 3.4 API 总览")
    end = text.find("### 3.5 Admin API", start)
    if start < 0 or end < 0:
        print("check-04-routes-vs-code: cannot find 04 §3.4 … §3.5 bounds", file=sys.stderr)
        sys.exit(2)
    section = text[start:end]
    return {m.group(1) for m in ROW_RE.finditer(section)}


def norm(p: str) -> str:
    return p.rstrip("/") or "/"


def main() -> int:
    code = paths_from_code()
    doc = paths_from_04_table_34()
    code_norm = {norm(p): p for p in code}
    doc_norm = {norm(p) for p in doc}
    strict_warn = os.environ.get("STRICT_WARNINGS", "").strip() in ("1", "true", "yes")

    missing_in_code = sorted(
        (p for p in doc if norm(p) not in code_norm and p not in DOC_ONLY_SCHEDULED),
        key=lambda s: (len(s), s),
    )
    if missing_in_code:
        print(
            "check-04-routes-vs-code FAIL: 04 section 3.4 table paths not mounted in crates/api routes:",
            file=sys.stderr,
        )
        for p in missing_in_code:
            print(f"  - {p}", file=sys.stderr)
        return 1

    # Public /api/v1 (non-internal, non-admin) should appear in 3.4 table (by normalized path)
    undocumented = []
    for p in sorted(code):
        if not p.startswith("/api/v1/"):
            continue
        if p.startswith("/api/v1/internal/") or p.startswith("/api/v1/admin/"):
            continue
        n = norm(p)
        if n not in doc_norm and p not in DOC_ONLY_SCHEDULED:
            undocumented.append(p)

    if undocumented:
        print(
            "check-04-routes-vs-code WARN: mounted /api/v1 routes missing from 04 section 3.4 table "
            "(update 04 and 14 appendix):",
            file=sys.stderr,
        )
        for p in undocumented:
            print(f"  ? {p}", file=sys.stderr)
        if strict_warn:
            return 1

    print("check-04-routes-vs-code OK: 04 sec 3.4 table paths are mounted (except DOC_ONLY_SCHEDULED).")
    if not undocumented:
        print("  (no undocumented public /api/v1 routes vs sec 3.4 table)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
