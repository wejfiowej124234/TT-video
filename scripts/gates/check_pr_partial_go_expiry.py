#!/usr/bin/env python3
"""
On pull_request / push: any changed **/report.json that declares release_gate=PARTIAL_GO
must include partial_go_expires_utc (ISO-8601, UTC Z) strictly in the future.

Prevents unbounded PARTIAL_GO from merging without an explicit sunset.

Usage (repo root, in CI with full git history):
  python3 scripts/gates/check_pr_partial_go_expiry.py
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
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
        after = os.environ.get("GITHUB_SHA", "") or os.environ.get("GITHUB_REF", "")
        if not before or before.startswith("0000000"):
            print("check_pr_partial_go_expiry: push without usable before SHA; skip", file=sys.stderr)
            return []
        names = _git("-C", str(repo), "diff", "--name-only", before, after).splitlines()
        return [n.strip() for n in names if n.strip()]
    # Local / unknown
    print("check_pr_partial_go_expiry: GITHUB_EVENT_NAME not pr/push; skip", file=sys.stderr)
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


def _parse_expiry(s: str) -> datetime:
    exp_s = str(s).replace("Z", "+00:00")
    dt = datetime.fromisoformat(exp_s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


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

    now = datetime.now(timezone.utc)
    failures = 0
    for rel in changed:
        if not rel.endswith("report.json"):
            continue
        path = repo / rel
        if not path.is_file():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"ERROR: invalid JSON {rel}: {e}", file=sys.stderr)
            failures += 1
            continue
        if data.get("release_gate") != "PARTIAL_GO":
            continue
        exp_raw = data.get("partial_go_expires_utc")
        if not exp_raw:
            print(
                f"ERROR: {rel} has release_gate=PARTIAL_GO but missing partial_go_expires_utc "
                "(ISO-8601 Z required for merge)",
                file=sys.stderr,
            )
            failures += 1
            continue
        try:
            exp = _parse_expiry(str(exp_raw))
        except ValueError:
            print(f"ERROR: {rel} partial_go_expires_utc invalid: {exp_raw!r}", file=sys.stderr)
            failures += 1
            continue
        if exp <= now:
            print(
                f"ERROR: {rel} partial_go_expires_utc is not in the future: {exp_raw!r}",
                file=sys.stderr,
            )
            failures += 1
    if failures:
        return 1
    print("check_pr_partial_go_expiry: OK", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
