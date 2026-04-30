#!/usr/bin/env python3
"""
On pull_request / push: changed **/report.json must have exactly one final truth report.

Rule:
  - Among changed report.json files, exactly one file must set top-level "is_final_truth": true.
  - Any other changed report.json must not set "is_final_truth": true.

This gives a deterministic "which report is final for this PR" signal.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path


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
            print("check_report_single_truth: push without usable before/after SHA; skip", file=sys.stderr)
            return []
        names = _git("-C", str(repo), "diff", "--name-only", before, after).splitlines()
        return [n.strip() for n in names if n.strip()]
    print("check_report_single_truth: GITHUB_EVENT_NAME not pr/push; skip", file=sys.stderr)
    return []

def _working_tree_changes(repo: Path) -> list[str]:
    names = _git("-C", str(repo), "diff", "--name-only").splitlines()
    staged = _git("-C", str(repo), "diff", "--name-only", "--cached").splitlines()
    untracked = _git("-C", str(repo), "ls-files", "--others", "--exclude-standard").splitlines()
    merged = [n.strip() for n in (names + staged + untracked) if n.strip()]
    seen: set[str] = set()
    out: list[str] = []
    for n in merged:
        if n not in seen:
            seen.add(n)
            out.append(n)
    return out


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

    report_paths = [p for p in changed if p.endswith("report.json")]
    if not report_paths:
        print("check_report_single_truth: no changed report.json; skip", file=sys.stderr)
        return 0

    final_truth_paths: list[str] = []
    errors = 0
    for rel in report_paths:
        path = repo / rel
        if not path.is_file():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"ERROR: invalid JSON {rel}: {e}", file=sys.stderr)
            errors += 1
            continue
        if data.get("is_final_truth") is True:
            final_truth_paths.append(rel)

    if errors:
        return 1
    if len(final_truth_paths) != 1:
        print(
            "ERROR: changed report.json must have exactly one is_final_truth=true; "
            f"found {len(final_truth_paths)} ({final_truth_paths})",
            file=sys.stderr,
        )
        return 1
    print(f"check_report_single_truth: OK final={final_truth_paths[0]}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
