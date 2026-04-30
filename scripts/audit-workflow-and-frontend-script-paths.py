#!/usr/bin/env python3
"""95 §10.2-1: verify scripts/ paths referenced by CI workflows and frontend/package.json exist."""
from __future__ import annotations

import glob
import json
import os
import re
import sys


def main() -> int:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    wfdir = os.path.join(root, ".github", "workflows")
    paths: set[str] = set()

    def add(p: str) -> None:
        p = p.replace("\\", "/").strip().rstrip(").,;\"'")
        if p.startswith("./"):
            p = p[2:]
        if re.match(r"^scripts/[A-Za-z0-9_./-]+\.(sh|ps1|py|mjs)$", p):
            paths.add(p)

    for wf in glob.glob(os.path.join(wfdir, "*.yml")):
        with open(wf, encoding="utf-8", errors="replace") as f:
            txt = f.read()
        for m in re.finditer(
            r'^\s*-\s*["\']?(scripts/[^\s"\'#|]+\.(?:sh|ps1|py|mjs))["\']?\s*$',
            txt,
            re.M,
        ):
            add(m.group(1))
        for m in re.finditer(
            r"\b(?:bash|sh)\s+(?:\./)?(scripts/[A-Za-z0-9_./-]+\.(?:sh|ps1|py|mjs))\b",
            txt,
        ):
            add(m.group(1))
        for m in re.finditer(
            r'^\s*run:\s*\./(scripts/[A-Za-z0-9_./-]+\.(?:sh|ps1|py|mjs))\b',
            txt,
            re.M,
        ):
            add(m.group(1))
        for m in re.finditer(r"\bpython3?\s+(scripts/[A-Za-z0-9_./-]+\.py)\b", txt):
            add(m.group(1))
        for m in re.finditer(r"\bnode\s+(?:\./)?(scripts/[A-Za-z0-9_./-]+\.mjs)\b", txt):
            add(m.group(1))
        for m in re.finditer(
            r'check_anchor\s+"[^"]+"\s+"[^"]+"\s+"(scripts/[A-Za-z0-9_./-]+\.(?:sh|ps1|py))"',
            txt,
        ):
            add(m.group(1))
        for m in re.finditer(r"\bbash\s+-n\s+(scripts/[A-Za-z0-9_./-]+\.sh)\b", txt):
            add(m.group(1))
        for m in re.finditer(r"\bpython\s+(scripts/[A-Za-z0-9_./-]+\.py)\b", txt):
            add(m.group(1))

    missing: list[str] = []
    for p in sorted(paths):
        full = os.path.join(root, *p.split("/"))
        if not os.path.isfile(full):
            missing.append(p)

    pkg = os.path.join(root, "frontend", "package.json")
    with open(pkg, encoding="utf-8") as f:
        pj = json.load(f)
    fe_paths: set[str] = set()
    for _k, v in pj.get("scripts", {}).items():
        if not isinstance(v, str):
            continue
        for m in re.finditer(r"(?:\./)?scripts/[A-Za-z0-9_./-]+\.mjs", v):
            q = m.group(0).replace("\\", "/").strip()
            if q.startswith("./"):
                q = q[2:]
            fe_paths.add(q)
    fe_missing: list[str] = []
    for p in sorted(fe_paths):
        full = os.path.join(root, "frontend", p)
        if not os.path.isfile(full):
            fe_missing.append(p)

    print("WORKFLOW_SCRIPT_REFS", len(paths))
    print("FRONTEND_PKG_SCRIPT_REFS", len(fe_paths))
    if missing:
        print("MISSING_WORKFLOW", *missing, sep="\n  ")
    if fe_missing:
        print("MISSING_FRONTEND", *fe_missing, sep="\n  ")
    if missing or fe_missing:
        print("RESULT", "FAIL")
        return 1
    print("ALL_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
