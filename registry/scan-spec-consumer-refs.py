#!/usr/bin/env python3
"""
§7.5 消费侧 `docs/spec` 字面量扫描（只读报告）。

严格对齐 docs/spec-path-dependency-migration-inventory.md §7.5.1 扫描范围与排除规则、
§7.5.2 允许表路径分类。不修改业务代码、不删除 spec。

本文件路径在扫描 registry/ 时排除，避免工具自指污染命中列表。
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

# 仓库根（本文件位于 registry/）
ROOT = Path(__file__).resolve().parent.parent
SELF_REL = "registry/scan-spec-consumer-refs.py"

SKIP_DIR_NAMES = frozenset(
    {"node_modules", ".next", "dist", "target", ".git", "__pycache__"}
)
SCRIPT_EXTS = frozenset({".py", ".sh", ".ps1", ".bat", ".mjs"})

# §7.5.1：扫描根与 scripts glob
SCAN_SPECS: list[tuple[str, frozenset[str] | None]] = [
    ("scripts", SCRIPT_EXTS),
    (".github", None),
    ("crates", None),
    ("frontend", None),
    ("contracts", None),
    ("registry", None),
    ("docs/handbook", None),
    ("docs/runbook", None),
    ("docs", None),
]

# §7.5.2 允许表（路径规则；较窄 ID 优先于较宽 ID）
REL_ALLOW_INV_SELF = "docs/spec-path-dependency-migration-inventory.md"
REL_ALLOW_REG_SPD = frozenset(
    {
        "registry/spec-path-dependencies.v1.yaml",
        "registry/validate-spec-path-dependencies-registry.py",
    }
)
REL_ALLOW_REG_MANIFEST = frozenset(
    {
        "registry/ci-anchor-manifest.v1.yaml",
        "registry/pc-08-consistency-paths.v1.yaml",
        "registry/pc-wave-phase-markdown-root.v1.txt",
    }
)
REL_ALLOW_WF_REG_VAL = ".github/workflows/registry-spec-path-dependencies-validate.yml"
REL_ALLOW_WF_WAVE_PATHS = ".github/workflows/check-wave-phase-files.yml"
REL_ALLOW_DOTGITHUB = frozenset(
    {
        ".github/workflows/broadcast-batch-blockers.yml",
        ".github/workflows/governance-doc-linkage-gate.yml",
        ".github/PULL_REQUEST_TEMPLATE.md",
    }
)
# 盘点文件名 **docs/spec-path-…** 在全文检索中必含子串 **docs/spec**；本 README 须复述政策与 inventory 路径。
REL_ALLOW_REG_README = "registry/README.md"


def is_under_docs_spec(rel_posix: str) -> bool:
    return rel_posix == "docs/spec" or rel_posix.startswith("docs/spec/")


def should_skip_dir(dir_path: Path) -> bool:
    parts = set(dir_path.parts)
    if parts & SKIP_DIR_NAMES:
        return True
    try:
        rel = dir_path.relative_to(ROOT)
    except ValueError:
        return True
    return is_under_docs_spec(rel.as_posix())


def should_skip_file(fp: Path) -> bool:
    try:
        rel = fp.relative_to(ROOT).as_posix()
    except ValueError:
        return True
    if is_under_docs_spec(rel):
        return True
    if set(fp.parts) & SKIP_DIR_NAMES:
        return True
    if rel == SELF_REL:
        return True
    return False


def iter_scan_files(scan_root: str, ext_filter: frozenset[str] | None):
    base = ROOT / scan_root
    if not base.is_dir():
        return
    for dirpath, dirnames, filenames in os.walk(base, topdown=True):
        dp = Path(dirpath)
        dirnames[:] = [
            d
            for d in dirnames
            if not should_skip_dir(dp / d)
        ]
        for fn in filenames:
            fp = dp / fn
            if should_skip_file(fp):
                continue
            if ext_filter is not None:
                if fp.suffix.lower() not in ext_filter:
                    continue
            if fp.is_file():
                yield fp


def file_contains_docs_spec(fp: Path) -> bool:
    try:
        data = fp.read_bytes()
    except OSError:
        return False
    if b"\x00" in data[:8192]:
        return False
    text = data.decode("utf-8", errors="replace")
    return "docs/spec" in text or "docs\\spec" in text


def collect_hits() -> list[str]:
    found: set[str] = set()
    for root, extf in SCAN_SPECS:
        for fp in iter_scan_files(root, extf):
            if file_contains_docs_spec(fp):
                found.add(fp.relative_to(ROOT).as_posix())
    return sorted(found)


def classify_allow(rel_posix: str) -> str | None:
    if rel_posix == REL_ALLOW_INV_SELF:
        return "ALLOW-INV-SELF"
    if rel_posix in REL_ALLOW_REG_SPD:
        return "ALLOW-REG-SPD"
    if rel_posix in REL_ALLOW_REG_MANIFEST:
        return "ALLOW-REG-MANIFEST"
    if rel_posix == REL_ALLOW_WF_REG_VAL:
        return "ALLOW-WF-REG-VAL"
    if rel_posix == REL_ALLOW_WF_WAVE_PATHS:
        return "ALLOW-WF-WAVE-PATHS"
    if rel_posix in REL_ALLOW_DOTGITHUB:
        return "ALLOW-DOTGITHUB-AUDIT"
    if rel_posix == REL_ALLOW_REG_README:
        return "ALLOW-REG-README"
    # 盘点 §4：`docs/`（不含 `docs/spec/` 子树，扫描已跳过）互指 spec 为预期；`scripts/` / workflows 为闸门字面量。
    if rel_posix.startswith("docs/") and not is_under_docs_spec(rel_posix):
        return "ALLOW-DOCS-NON-SPEC"
    if rel_posix.startswith(".github/workflows/"):
        return "ALLOW-WF-SPEC-LITERAL"
    if rel_posix.startswith("scripts/"):
        return "ALLOW-SCRIPTS-SPEC-LITERAL"
    if rel_posix.startswith("registry/") and rel_posix != SELF_REL:
        return "ALLOW-REGISTRY-SPEC-LITERAL"
    if (
        rel_posix.startswith("crates/")
        or rel_posix.startswith("frontend/")
        or rel_posix.startswith("contracts/")
    ):
        return "ALLOW-RUNTIME-ANCHOR"
    return None


def build_report(hits: list[str]) -> dict:
    by_allow: dict[str, list[str]] = {}
    unlisted: list[str] = []
    for h in hits:
        aid = classify_allow(h)
        if aid is None:
            unlisted.append(h)
        else:
            by_allow.setdefault(aid, []).append(h)
    for k in by_allow:
        by_allow[k].sort()
    unlisted.sort()
    return {
        "total_hits": len(hits),
        "allowed_hits": len(hits) - len(unlisted),
        "unlisted_count": len(unlisted),
        "by_allow_id": by_allow,
        "unlisted": unlisted,
    }


def print_text_report(rep: dict) -> None:
    print("spec consumer refs scan (inventory §7.5.1 / §7.5.2)")
    print(f"repo root: {ROOT}")
    print()
    print(f"total hits:        {rep['total_hits']}")
    print(f"allowed (table):   {rep['allowed_hits']}")
    print(f"not on allowlist:  {rep['unlisted_count']}")
    print()
    print("--- by §7.5.2 allow ID ---")
    for aid in sorted(rep["by_allow_id"]):
        n = len(rep["by_allow_id"][aid])
        print(f"{aid}: {n}")
    print()
    print("--- not on allowlist (paths) ---")
    for p in rep["unlisted"]:
        print(p)


def _configure_stdio_utf8() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        except (AttributeError, OSError, ValueError):
            pass


def main() -> int:
    _configure_stdio_utf8()
    ap = argparse.ArgumentParser(
        description="§7.5 consumer-side docs/spec literal scan (report only)."
    )
    ap.add_argument(
        "--json",
        action="store_true",
        help="print one JSON object to stdout",
    )
    ap.add_argument(
        "--strict",
        action="store_true",
        help="exit 1 if any path is not on §7.5.2 allowlist",
    )
    args = ap.parse_args()

    hits = collect_hits()
    rep = build_report(hits)

    if args.json:
        print(json.dumps(rep, ensure_ascii=False, indent=2))
    else:
        print_text_report(rep)

    if args.strict and rep["unlisted_count"] > 0:
        return 1
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BrokenPipeError:
        try:
            sys.stdout.close()
        except Exception:
            pass
        raise SystemExit(0)
