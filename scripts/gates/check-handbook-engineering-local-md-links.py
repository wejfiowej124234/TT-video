#!/usr/bin/env python3
"""
Optional I5: resolve relative filesystem targets in docs/handbook/engineering/*.md
and fail if the target path does not exist (handbook / corpus / spec / ops / scripts).

Skips: http(s)://, mailto:, tel:, javascript:, empty, pure #fragment, mailto.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote

REPO_ROOT = Path(__file__).resolve().parents[2]
ENGINEERING = REPO_ROOT / "docs" / "handbook" / "engineering"

# [text](href) and ![alt](href)
MD_LINK = re.compile(r"(?:!?\[[^\]]*\])\(([^)]+)\)")


def emit(rule: str, path: Path, msg: str) -> None:
    print(f"RULE={rule} path={path.as_posix()} msg={msg}", file=sys.stderr)


def should_skip_href(raw: str) -> bool:
    h = raw.strip()
    if not h or h.startswith("#"):
        return True
    if h.startswith("http://") or h.startswith("https://"):
        return True
    if h.startswith("mailto:") or h.startswith("tel:") or h.startswith("javascript:"):
        return True
    return False


def normalize_href(raw: str) -> str:
    h = raw.strip()
    if h.startswith("<") and h.endswith(">"):
        h = h[1:-1].strip()
    path_part, _, _frag = h.partition("#")
    return unquote(path_part.strip())


def resolve_target(source: Path, path_part: str) -> Path | None:
    if not path_part:
        return None
    # Reject obvious absolute URLs / Windows drive paths (not repo-relative)
    if re.match(r"^[a-zA-Z]:[\\/]", path_part):
        return None
    if path_part.startswith("//"):
        return None
    try:
        cand = (source.parent / path_part).resolve()
    except OSError:
        return None
    try:
        cand.relative_to(REPO_ROOT.resolve())
    except ValueError:
        return None
    return cand


def main() -> int:
    if not ENGINEERING.is_dir():
        emit("HBOOK-ENG-LOCAL-LINK-ROOT", ENGINEERING, "engineering directory missing")
        return 1

    failures = 0
    seen: set[tuple[str, str]] = set()

    for path in sorted(ENGINEERING.glob("*.md")):
        if path.name.startswith("_"):
            continue
        raw = path.read_text(encoding="utf-8")
        for m in MD_LINK.finditer(raw):
            raw_href = m.group(1)
            if should_skip_href(raw_href):
                continue
            path_part = normalize_href(raw_href)
            key = (path.as_posix(), raw_href.strip())
            if key in seen:
                continue
            seen.add(key)

            target = resolve_target(path, path_part)
            if target is None:
                if not path_part:
                    continue
                emit(
                    "HBOOK-ENG-LOCAL-LINK",
                    path,
                    f"could not resolve or escapes repo: {raw_href!r}",
                )
                failures += 1
                continue
            if not target.is_file():
                emit(
                    "HBOOK-ENG-LOCAL-LINK",
                    path,
                    f"missing file for link {raw_href!r} -> {target.relative_to(REPO_ROOT)}",
                )
                failures += 1

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
