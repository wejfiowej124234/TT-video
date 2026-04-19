#!/usr/bin/env python3
"""
Scan Markdown under docs/ for relative [](path) links and verify targets exist.

- Skips: http(s)://, mailto:, bare #fragments, empty paths after stripping #fragment
- Inline destinations may contain spaces (e.g. `docs/product-manager/25-… .md`); optional
  title suffix ` "…"` / ` '…'` is stripped; wrap path in `<…>` when needed for parsers
- Resolves paths relative to the containing .md file; rejects targets outside repo root
- Default excludes (override with --no-default-excludes): spec/27-archived, AI stash index
- Default: WARN + exit 0 if any broken (repo may still carry historical gaps).
  Set DOC_AUDIT_LINKS_ENFORCE=1 or pass --enforce to exit 1 on any broken link.

Usage (repo root):
  python3 scripts/gates/check-doc-markdown-relative-links.py
  DOC_AUDIT_LINKS_ENFORCE=1 python3 scripts/gates/check-doc-markdown-relative-links.py
"""
from __future__ import annotations

import argparse
import fnmatch
import os
import re
import sys
from pathlib import Path
from urllib.parse import unquote

LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


def _path_from_inline_link_target(raw: str) -> str:
    """
    Inline link destination (inside parentheses), before optional title.

    - `<path with spaces.md>` → inner path
    - `path with spaces.md` → full string (do not split on spaces; titles use ` "..."` / ` '...'`)
    - `url "title"` / `url 'title'` → strip title suffix only when a space precedes the quote
    """
    raw = raw.strip()
    if raw.startswith("<"):
        end = raw.find(">", 1)
        if end != -1:
            return unquote(raw[1:end].split("#", 1)[0])
        return unquote(raw[1:].split("#", 1)[0])
    if re.search(r"\s+[\"']", raw):
        raw = re.split(r"\s+[\"']", raw, maxsplit=1)[0].strip()
    return unquote(raw.split("#", 1)[0])


def _norm_rel(rel: str) -> str:
    return rel.replace("\\", "/")


def _default_skip(rel: Path) -> bool:
    if rel.name == "AI任务卡索引.from-stash.md":
        return True
    parts = rel.parts
    for i in range(len(parts) - 1):
        if parts[i] == "spec" and parts[i + 1] == "27-archived":
            return True
    return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--docs-root",
        default="docs",
        help="Directory under repo root to scan (default: docs)",
    )
    ap.add_argument(
        "--max-report",
        type=int,
        default=200,
        help="Max broken links to print (default 200)",
    )
    ap.add_argument(
        "--enforce",
        action="store_true",
        help="Exit 1 if any broken link (also when env DOC_AUDIT_LINKS_ENFORCE=1)",
    )
    ap.add_argument(
        "--no-default-excludes",
        action="store_true",
        help="Do not skip spec/27-archived or AI任务卡索引.from-stash.md",
    )
    ap.add_argument(
        "--exclude-glob",
        action="append",
        default=[],
        metavar="PATTERN",
        help="Extra glob(s) relative to docs-root (fnmatch, ** allowed); repeatable",
    )
    args = ap.parse_args()

    enforce = args.enforce or os.environ.get("DOC_AUDIT_LINKS_ENFORCE", "").strip() in (
        "1",
        "true",
        "yes",
    )

    root = Path(__file__).resolve().parents[2]
    docs_root = (root / args.docs_root).resolve()
    if not docs_root.is_dir():
        print(f"FAIL: docs root not found: {docs_root}", file=sys.stderr)
        return 2

    extra_globs = [_norm_rel(g) for g in (args.exclude_glob or [])]

    def skip_file(md_path: Path) -> bool:
        rel = md_path.relative_to(docs_root)
        rel_posix = _norm_rel(str(rel))
        if not args.no_default_excludes and _default_skip(rel):
            return True
        for g in extra_globs:
            if fnmatch.fnmatch(rel_posix, g):
                return True
        return False

    broken: list[tuple[Path, int, str, str]] = []

    for md_path in sorted(docs_root.rglob("*.md")):
        if skip_file(md_path):
            continue
        try:
            text = md_path.read_text(encoding="utf-8")
        except OSError as e:
            print(f"WARN: skip read {md_path}: {e}", file=sys.stderr)
            continue
        base = md_path.parent
        for lineno, line in enumerate(text.splitlines(), start=1):
            for m in LINK_RE.finditer(line):
                raw = m.group(1).strip()
                if not raw or raw.startswith(("#", "http://", "https://", "mailto:")):
                    continue
                path_part = _path_from_inline_link_target(raw)
                if not path_part:
                    continue
                target = path_part  # for error messages

                candidate = (base / path_part).resolve()
                try:
                    candidate.relative_to(root.resolve())
                except ValueError:
                    broken.append(
                        (
                            md_path.relative_to(root),
                            lineno,
                            target,
                            f"(escapes repo root) {candidate}",
                        )
                    )
                    continue

                if candidate.is_file() or candidate.is_dir():
                    continue
                broken.append((md_path.relative_to(root), lineno, target, str(candidate)))

    if not broken:
        print(f"OK: no broken relative markdown links under {args.docs_root}/ (after excludes)")
        return 0

    print(
        f"{'FAIL' if enforce else 'WARN'}: {len(broken)} broken markdown link(s) under {args.docs_root}/",
        file=sys.stderr,
    )
    for row in broken[: args.max_report]:
        p, ln, tgt, res = row
        print(f"  {p}:{ln}: ({tgt}) -> {res}", file=sys.stderr)
    if len(broken) > args.max_report:
        print(f"  ... and {len(broken) - args.max_report} more", file=sys.stderr)
    if not enforce:
        print(
            "INFO: exiting 0 (warn-only). Set DOC_AUDIT_LINKS_ENFORCE=1 or --enforce to fail.",
            file=sys.stderr,
        )
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
