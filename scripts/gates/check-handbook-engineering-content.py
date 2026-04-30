#!/usr/bin/env python3
"""
Handbook engineering → docs/spec link existence (HBOOK-ENG hygiene, lightweight).

- For each docs/handbook/engineering/*.md: find markdown links that resolve under docs/spec/
  (relative patterns ../../spec/... from engineering/).
- Ensure target files exist.
- For domain docs matching ^\\d{2}-.*\\.md$ with NN >= 10: require at least one of
  `cargo test`, `run-check-04-routes`, or `bash scripts/` in the file body (engineering verification cue).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENG = ROOT / "docs" / "handbook" / "engineering"

# ](../../spec/foo.md) or ](..\../spec/...) — normalize to docs/spec/foo.md
LINK_RE = re.compile(r"\]\((\.\./)+spec/([^)]+)\)")

VERIFY_CUE = re.compile(
    r"(cargo\s+test|run-check-04-routes|bash\s+scripts/)",
    re.IGNORECASE,
)


def _resolve_spec_target(spec_rel: str) -> Path:
    # spec_rel may contain anchors #... strip for existence
    base = spec_rel.split("#", 1)[0].strip()
    return (ROOT / "docs" / "spec" / base).resolve()


def main() -> int:
    if not ENG.is_dir():
        print("check-handbook-engineering-content: no docs/handbook/engineering; skip")
        return 0

    bad: list[str] = []
    for md in sorted(ENG.glob("*.md")):
        try:
            text = md.read_text(encoding="utf-8")
        except OSError as e:
            bad.append(f"{md.relative_to(ROOT)}: read error: {e}")
            continue
        name = md.name
        mnum = re.match(r"^(\d{2})-", name)
        if mnum and int(mnum.group(1)) >= 10:
            if not VERIFY_CUE.search(text):
                bad.append(
                    f"{md.relative_to(ROOT)}: engineering doc NN>=10 must mention "
                    "`cargo test`, `run-check-04-routes`, or `bash scripts/` (verification cue)"
                )
        for m in LINK_RE.finditer(text):
            rel = "spec/" + m.group(2)
            target = _resolve_spec_target(m.group(2))
            try:
                target.relative_to(ROOT / "docs" / "spec")
            except ValueError:
                bad.append(f"{md.relative_to(ROOT)}: link escapes docs/spec: {rel!r}")
                continue
            if not target.is_file():
                bad.append(f"{md.relative_to(ROOT)}: broken spec link → {target.relative_to(ROOT)}")
    if bad:
        print("check-handbook-engineering-content: FAIL", file=sys.stderr)
        for b in bad:
            print(b, file=sys.stderr)
        return 1
    n = len(list(ENG.glob("*.md")))
    print(f"check-handbook-engineering-content: OK ({n} engineering/*.md)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
