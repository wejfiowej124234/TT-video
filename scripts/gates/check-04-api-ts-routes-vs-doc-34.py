#!/usr/bin/env python3
"""
§7.3 / 04：校验 frontend/lib/api.ts 中 routes 导出的 HTTP 路径字面量
均能在 04 法定壳 Markdown（路径段见 registry/derived/check-04-api-ts-routes-doc-pointer.v1.json）「§3.4 API 总览」起至「## 四、」前的主表 / 反引号路径行中找到同构路径（方法无关，仅路径）。

- 预处理：去掉 routes 块内块注释；抹平 query 拼接片段；将模板 ${...} 与表中 :id 等同构归一。
- 不替代 check-04-routes-vs-code；不扫描 apiUrl 或其它文件。
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT.joinpath("docs", "spec", "04-后端与API.md")
API_TS = ROOT / "frontend/lib/api.ts"

ROW_RE = re.compile(
    r"^\|\s*(?:GET|POST|PUT|PATCH|DELETE)\s*\|\s*(\/[^\s|]+)\s*\|",
    re.MULTILINE,
)
# 04 内部分「内部 API」等行使用反引号包裹 METHOD path（非标准三列表格）
ROW_BT_RE = re.compile(r"`(GET|POST|PUT|PATCH|DELETE)\s+(/[^`\s|]+)`")


def strip_block_comments(s: str) -> str:
    out: list[str] = []
    i = 0
    n = len(s)
    while i < n:
        if s.startswith("/*", i):
            j = s.find("*/", i + 2)
            if j < 0:
                break
            i = j + 2
            continue
        out.append(s[i])
        i += 1
    return "".join(out)


def routes_object_block(text: str) -> str:
    key = "export const routes ="
    start = text.find(key)
    if start < 0:
        raise SystemExit("check-04-api-ts-routes-vs-doc-34: cannot find export const routes")
    end = text.find("} as const;", start)
    if end < 0:
        raise SystemExit("check-04-api-ts-routes-vs-doc-34: cannot find routes } as const;")
    return text[start : end + len("} as const;")]


def paths_from_04_contract_sections() -> set[str]:
    raw = DOC.read_text(encoding="utf-8")
    s = raw.find("### 3.4 API 总览")
    e = raw.find("## 四、", s)
    if s < 0 or e < 0:
        raise SystemExit("check-04-api-ts-routes-vs-doc-34: 04 §3.4 … ## 四、 bounds missing")
    section = raw[s:e]
    out = {m.group(1) for m in ROW_RE.finditer(section)}
    for m in ROW_BT_RE.finditer(section):
        out.add(m.group(2))
    return out


def norm_path(p: str) -> str:
    p = p.strip()
    p = p.split("?", 1)[0]
    p = p.rstrip("/") or "/"
    p = re.sub(r":[A-Za-z0-9_]+", "__P__", p)
    p = re.sub(r"__P__+", "__P__", p)
    return p


def preprocess_api_block(block: str) -> str:
    b = strip_block_comments(block)
    b = re.sub(r"\$\{q \? `\?\$\{q\}` : \"\"\}", "", b)
    b = re.sub(r"\?\$\{q\}(?=`)", "", b)
    b = re.sub(r"\$\{[^}]+\}", "__P__", b)
    return b


def extract_ts_paths(block: str) -> set[str]:
    raw_paths: set[str] = set()
    # double-quoted
    for m in re.finditer(r'"(/api/v1[^"]+)"', block):
        raw_paths.add(m.group(1))
    for m in re.finditer(r'"(/auth/[^"]+)"', block):
        raw_paths.add(m.group(1))
    for m in re.finditer(r'"(/meta[^"]*)"', block):
        raw_paths.add(m.group(1))
    for m in re.finditer(r'"(/health[^"]*)"', block):
        raw_paths.add(m.group(1))
    # backtick templates (after ${} → __P__)
    for m in re.finditer(r"`(/(?:api/v1|auth|meta|health)[^`]*)`", block):
        raw_paths.add(m.group(1))
    out: set[str] = set()
    for p in raw_paths:
        if "__P____P__" in p:
            p = re.sub(r"__P__+", "__P__", p)
        out.add(norm_path(p))
    return out


def main() -> int:
    doc_paths = {norm_path(p) for p in paths_from_04_contract_sections()}
    full = API_TS.read_text(encoding="utf-8")
    block = preprocess_api_block(routes_object_block(full))
    ts_paths = extract_ts_paths(block)

    missing = sorted(p for p in ts_paths if p not in doc_paths)
    if missing:
        print(
            "check-04-api-ts-routes-vs-doc-34 FAIL: normalized paths from frontend/lib/api.ts routes "
            "not found in 04 §3.4 table:",
            file=sys.stderr,
        )
        for p in missing:
            print(f"  - {p}", file=sys.stderr)
        return 1

    print(
        "check-04-api-ts-routes-vs-doc-34 OK: all routes block /api/v1|/auth|/meta|/health paths "
        f"match 04 §3.4 ({len(ts_paths)} checked)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
