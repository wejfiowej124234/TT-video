#!/usr/bin/env python3
"""
On pull_request / push:
if critical paths changed, require at least one changed report.json with is_final_truth=true.

This closes the gap where single-truth check only runs when report.json is modified.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

CRITICAL_PREFIXES = (
    ".github/workflows/",
    "crates/api/",
    "frontend/",
    "contracts/",
    "scripts/",
)


def _git(*args: str) -> str:
    out = subprocess.run(["git", *args], capture_output=True, text=True, encoding="utf-8", errors="replace", check=False)
    if out.returncode != 0:
        print(out.stderr or out.stdout, file=sys.stderr)
        raise SystemExit(out.returncode or 1)
    return out.stdout


def _changed_files(repo: Path) -> list[str]:
    event = os.environ.get("GITHUB_EVENT_NAME", "")
    if event == "pull_request":
        base = os.environ.get("GITHUB_BASE_REF", "main")
        _git("-C", str(repo), "fetch", "--depth=256", "origin", base)
        merge_base = _git("-C", str(repo), "merge-base", f"origin/{base}", "HEAD").strip()
        names = _git("-C", str(repo), "diff", "--name-only", merge_base, "HEAD").splitlines()
        return [n.strip() for n in names if n.strip()]
    if event == "push":
        before = os.environ.get("GITHUB_EVENT_BEFORE", "")
        after = os.environ.get("GITHUB_SHA", "")
        if not before or before.startswith("0000000") or not after:
            print("check_pr_final_truth_presence: push without usable before/after SHA; skip", file=sys.stderr)
            return []
        names = _git("-C", str(repo), "diff", "--name-only", before, after).splitlines()
        return [n.strip() for n in names if n.strip()]
    print("check_pr_final_truth_presence: GITHUB_EVENT_NAME not pr/push; skip", file=sys.stderr)
    return []

def _working_tree_changes(repo: Path) -> list[str]:
    names = _git("-C", str(repo), "diff", "--name-only").splitlines()
    staged = _git("-C", str(repo), "diff", "--name-only", "--cached").splitlines()
    untracked = _git("-C", str(repo), "ls-files", "--others", "--exclude-standard").splitlines()
    merged = [n.strip() for n in (names + staged + untracked) if n.strip()]
    # preserve order + dedupe
    seen: set[str] = set()
    out: list[str] = []
    for n in merged:
        if n not in seen:
            seen.add(n)
            out.append(n)
    return out


def _is_critical(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in CRITICAL_PREFIXES)


def main() -> int:
    repo = Path(__file__).resolve().parents[2]
    os.chdir(repo)
    try:
        changed = _changed_files(repo)
        if os.environ.get("LOCAL_GATE_INCLUDE_WORKTREE") == "1":
            wt = _working_tree_changes(repo)
            if wt:
                seen = set(changed)
                changed.extend([p for p in wt if p not in seen])
    except SystemExit as e:
        return int(e.code) if isinstance(e.code, int) else 1

    critical_changed = [p for p in changed if _is_critical(p)]
    if not critical_changed:
        print("check_pr_final_truth_presence: no critical path changes; skip", file=sys.stderr)
        return 0

    reports = [p for p in changed if p.endswith("report.json")]
    final_truth: list[str] = []
    for rel in reports:
        path = repo / rel
        if not path.is_file():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if data.get("is_final_truth") is True:
            final_truth.append(rel)
    if not final_truth:
        print(
            "ERROR: critical changes detected but no changed report.json marked is_final_truth=true",
            file=sys.stderr,
        )
        print(f"critical_changed_count={len(critical_changed)}", file=sys.stderr)
        return 1
    print(f"check_pr_final_truth_presence: OK final_truth={final_truth[0]}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
