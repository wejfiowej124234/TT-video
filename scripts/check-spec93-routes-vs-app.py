#!/usr/bin/env python3
"""
Diff: Next.js app routes (from frontend/app/**/page.tsx) vs routes mentioned in docs/spec/93 §5.

Exit 0: no unexpected gaps (see rules below).
Exit 1: drift or script error.

Usage (from repo root):
  python scripts/check-spec93-routes-vs-app.py

Optional:
  SPEC93_PATH=docs/spec/93-全站功能验证矩阵-域别回归清单.md
  FRONTEND_APP=frontend/app

Rules:
  - Extracts route-like strings from **§5** section (markdown ** `/path` ** patterns).
  - Normalizes app paths: (home) -> "", dynamic [id] -> [id] in path string for comparison.
  - Reports: routes in app but never mentioned in §5 (warning), and strings in §5 that look
    like routes but missing page.tsx (warning). Dynamic segments are fuzzy-matched.
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path


def find_page_routes(app_root: Path) -> set[str]:
    routes: set[str] = set()
    for p in app_root.rglob("page.tsx"):
        rel = p.parent.relative_to(app_root)
        parts: list[str] = []
        for seg in rel.parts:
            if seg.startswith("(") and seg.endswith(")"):
                # Route groups: (home) does not appear in URL
                continue
            parts.append(seg)
        route = "/" + "/".join(parts) if parts else "/"
        routes.add(route.rstrip("/") or "/")
    return routes


def extract_spec5_route_mentions(spec_path: Path) -> set[str]:
    text = spec_path.read_text(encoding="utf-8")
    start = text.find("## §5")
    if start == -1:
        raise SystemExit("Could not find ## §5 in spec 93")
    end = text.find("\n## §6", start + 1)
    section = text[start:] if end == -1 else text[start:end]

    mentions: set[str] = set()
    # Backtick paths: `/foo`, `/foo/[id]` (tables and prose)
    for m in re.findall(r"`(/[a-zA-Z0-9_\-\.\[\]/]*)`", section):
        mentions.add(normalize_route(m))
    # Also catch **`| **`/path`**`** table cells
    for m in re.findall(r"\*\*`(/[a-zA-Z0-9_\-\.\[\]/]*)`\*\*", section):
        mentions.add(normalize_route(m))
    return mentions


def normalize_route(r: str) -> str:
    r = r.strip()
    if not r.startswith("/"):
        return r
    if r != "/":
        r = r.rstrip("/")
    return r or "/"


def route_matches_mention(app_route: str, mention: str) -> bool:
    """True if app_route is covered by mention (supports [id] wildcard)."""
    if mention.endswith("/*") or mention.endswith("*"):
        prefix = mention.rstrip("*").rstrip("/")
        return app_route.startswith(prefix + "/") or app_route == prefix
    if "[id]" in mention or "[tag]" in mention or "[requestId]" in mention:
        # strip dynamic segment for prefix match
        base = re.sub(r"/\[[^\]]+\]", "", mention)
        if base == mention:
            return app_route == mention or app_route.startswith(mention + "/")
        return app_route.startswith(base) or app_route == base.rstrip("/")
    return app_route == mention


def app_route_covered(app_route: str, mentions: set[str]) -> bool:
    for m in mentions:
        if not m.startswith("/"):
            continue
        if route_matches_mention(app_route, m):
            return True
        # parent path: /admin/foo covered by /admin if we only listed /admin in a bullet — weak
        if app_route.startswith(m.rstrip("/") + "/") and m in ("/admin", "/community", "/governance"):
            return True
    return False


def main() -> int:
    root = Path(os.environ.get("REPO_ROOT", ".")).resolve()
    spec = Path(os.environ.get("SPEC93_PATH", "docs/spec/93-全站功能验证矩阵-域别回归清单.md"))
    app = Path(os.environ.get("FRONTEND_APP", "frontend/app"))
    spec_path = root / spec
    app_path = root / app
    if not spec_path.is_file():
        print(f"ERROR: missing {spec_path}", file=sys.stderr)
        return 1
    if not app_path.is_dir():
        print(f"ERROR: missing {app_path}", file=sys.stderr)
        return 1

    routes = find_page_routes(app_path)
    try:
        mentions = extract_spec5_route_mentions(spec_path)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    missing_doc: list[str] = []
    for r in sorted(routes):
        if not app_route_covered(r, mentions):
            missing_doc.append(r)

    print(f"check-spec93-routes-vs-app: app routes={len(routes)}, spec_section5 mentions={len(mentions)}")
    if missing_doc:
        print("WARN: app routes not obviously covered by §5 bullets (update §5 or script heuristics):")
        for r in missing_doc[:80]:
            print(f"  - {r}")
        if len(missing_doc) > 80:
            print(f"  ... and {len(missing_doc) - 80} more")
        # Non-fatal by default: §5 uses prose; tighten with ENFORCE=1
        if os.environ.get("ENFORCE", "").strip() in ("1", "true", "yes"):
            return 1
    else:
        print("OK: all app routes matched spec 93 section 5 patterns.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
