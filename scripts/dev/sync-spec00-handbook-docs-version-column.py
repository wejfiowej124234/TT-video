#!/usr/bin/env python3
"""
Rewrite 00-文档索引 «§文档版本与最后更新» table rows (file under docs + spec tree; handbook README for boundary):

  | handbook/... | x.y.z | date |
  | docs/...     | x.y.z | date |

Version column is taken from the target file's frontmatter **Version:** (first 2000 chars).
Date column is left unchanged (still maintained by humans / release process).

Usage (repo root):

  python scripts/dev/sync-spec00-handbook-docs-version-column.py
  python scripts/dev/sync-spec00-handbook-docs-version-column.py --dry-run
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys

SPEC00 = pathlib.Path("docs") / "spec" / "00-文档索引.md"
VERSION_RE = re.compile(r"\*\*Version:\*\*\s*(\d+\.\d+\.\d+)")


def handbook_key_to_path(key: str) -> pathlib.Path | None:
    if not key.startswith("handbook/"):
        return None
    parts = key.split("/")
    if len(parts) < 2:
        return None
    last = parts[-1]
    if last.endswith(".md"):
        rel = "/".join(parts[1:])
        return pathlib.Path("docs/handbook") / rel
    return pathlib.Path("docs/handbook", *parts[1:-1], f"{last}.md")


def docs_key_to_path(key: str) -> pathlib.Path | None:
    if not key.startswith("docs/"):
        return None
    stem = key.split("（", 1)[0].strip()
    if not stem.startswith("docs/"):
        return None
    rel = stem[len("docs/") :]
    if not rel:
        return None
    return pathlib.Path("docs") / f"{rel}.md"


def read_version(p: pathlib.Path) -> str | None:
    if not p.is_file():
        return None
    head = p.read_text(encoding="utf-8")[:2500]
    m = VERSION_RE.search(head)
    return m.group(1) if m else None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="print changes only")
    args = ap.parse_args()
    if not SPEC00.is_file():
        print(f"missing {SPEC00}", file=sys.stderr)
        return 2
    text = SPEC00.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    changed = 0
    # | <key> | <semver> | <date> |
    row_re = re.compile(r"^\| (.+?) \| (\d+\.\d+\.\d+) \| ([^|]+) \|")
    for line in lines:
        raw = line.rstrip("\n\r")
        m = row_re.match(raw)
        if not m:
            out.append(line)
            continue
        key, ver, date_cell = m.group(1).strip(), m.group(2), m.group(3).strip()
        if not (key.startswith("handbook/") or key.startswith("docs/")):
            out.append(line)
            continue
        path = handbook_key_to_path(key) or docs_key_to_path(key)
        if path is None:
            out.append(line)
            continue
        disk = read_version(path)
        if disk is None or disk == ver:
            out.append(line)
            continue
        nl = "\n" if line.endswith("\n") else ""
        if line.endswith("\r\n"):
            nl = "\r\n"
        elif line.endswith("\r"):
            nl = "\r"
        new_line = f"| {key} | {disk} | {date_cell} |{nl}"
        if args.dry_run:
            print(f"{key}: spec00={ver} disk={disk} ({path.as_posix()})")
            out.append(line)
        else:
            changed += 1
            out.append(new_line)
    if args.dry_run:
        return 0
    if changed:
        SPEC00.write_text("".join(out), encoding="utf-8", newline="\n")
    print(f"updated {changed} version cell(s) in {SPEC00.as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
