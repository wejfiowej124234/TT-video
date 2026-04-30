#!/usr/bin/env python3
"""
Handbook frontmatter / Version hygiene (Build CI parity, lightweight).

Scans:
  - docs/handbook/engineering/[0-9][0-9]-*.md
  - docs/handbook/product-manager/[0-9][0-9]-*.md (if present)
  - docs/handbook/learn/[0-9][0-9]-*.md (if present)
  - docs/handbook/corpus/REG-*.md
  - docs/handbook/corpus/SPEC-MIGRATION-STATUS.md (migration SSOT)
  - docs/handbook/README.md (if present)

Rule: within the first 160 lines, require a Version line matching:
  ^\\s*Version:\\s+\\S
  or a markdown-bold variant **Version:** ...
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HAND = ROOT / "docs" / "handbook"

VERSION_RE = re.compile(
    r"(?im)^\s*(\*\*)?version(\*\*)?\s*[:：]\s*\S+",
)


def _iter_targets() -> list[Path]:
    out: list[Path] = []
    if not HAND.is_dir():
        return out
    eng = HAND / "engineering"
    if eng.is_dir():
        out.extend(sorted(eng.glob("[0-9][0-9]-*.md")))
    for sub in ("product-manager", "learn"):
        d = HAND / sub
        if d.is_dir():
            out.extend(sorted(d.glob("[0-9][0-9]-*.md")))
    corp = HAND / "corpus"
    if corp.is_dir():
        out.extend(sorted(corp.glob("REG-*.md")))
        spec_m = corp / "SPEC-MIGRATION-STATUS.md"
        if spec_m.is_file():
            out.append(spec_m)
    readme = HAND / "README.md"
    if readme.is_file():
        out.append(readme)
    for z in sorted(HAND.glob("00-*.md")):
        out.append(z)
    # de-dup while preserving order
    seen: set[str] = set()
    uniq: list[Path] = []
    for p in out:
        k = str(p.resolve())
        if k not in seen:
            seen.add(k)
            uniq.append(p)
    return uniq


def main() -> int:
    bad: list[str] = []
    for path in _iter_targets():
        try:
            text = path.read_text(encoding="utf-8")
        except OSError as e:
            bad.append(f"{path.relative_to(ROOT)}: read error: {e}")
            continue
        head = "\n".join(text.splitlines()[:160])
        if not VERSION_RE.search(head):
            bad.append(
                f"{path.relative_to(ROOT)}: missing Version: line in first 160 lines "
                "(expected 'Version: …' or '**Version:** …')"
            )
    if bad:
        print("check-handbook-frontmatter: FAIL", file=sys.stderr)
        for b in bad:
            print(b, file=sys.stderr)
        return 1
    print(f"check-handbook-frontmatter: OK ({len(_iter_targets())} files)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
