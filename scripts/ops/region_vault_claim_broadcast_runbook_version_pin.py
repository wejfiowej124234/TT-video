#!/usr/bin/env python3
# B-299: pin git commit (and optional tag/describe) next to operator runbook command templates for reproducibility.
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

PIN_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-RUNBOOK-VERSION-PIN-V1"
PIN_RULE_VERSION = "region_vault_claim_broadcast_runbook_version_pin_v1"
IMPLEMENTATION_TT = "TT-B299-RUNBOOK-VERSION-PIN-001"
MOTHER_TABLE = "B-299"


def _repo_root_default() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _run_git(repo: Path, *args: str, timeout_s: float = 30.0) -> tuple[int, str]:
    try:
        cp = subprocess.run(
            ["git", "-C", str(repo), *args],
            check=False,
            capture_output=True,
            text=True,
            timeout=timeout_s,
        )
        return cp.returncode, (cp.stdout or "").strip()
    except (OSError, subprocess.SubprocessError) as e:
        return 99, str(e)


def build_runbook_version_pin(*, repo_root: Path | None = None) -> dict[str, Any]:
    root = (repo_root or _repo_root_default()).resolve()
    sha: str | None = None
    short: str | None = None
    dirty: bool | None = None
    describe: str | None = None
    tags_head: list[str] = []
    notes: list[str] = []

    if not (root / ".git").exists():
        notes.append("no_dotgit_at_repo_root")
    else:
        rc, out = _run_git(root, "rev-parse", "HEAD")
        if rc == 0 and len(out) >= 7:
            sha = out
            short = out[:7]
        else:
            notes.append(f"rev_parse_failed:{out[:200]}")

        rc_d, out_d = _run_git(root, "describe", "--tags", "--always", "--dirty")
        if rc_d == 0 and out_d:
            describe = out_d
        else:
            notes.append("describe_unavailable")

        rc_t, out_t = _run_git(root, "tag", "--points-at", "HEAD")
        if rc_t == 0 and out_t:
            tags_head = [ln.strip() for ln in out_t.splitlines() if ln.strip()]

        rc_s, out_s = _run_git(root, "status", "--porcelain")
        if rc_s == 0:
            dirty = bool(out_s.strip())
        else:
            dirty = None
            notes.append("status_unavailable")

    return {
        "anchor": PIN_ANCHOR,
        "rule_version": PIN_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "recorded_at_utc": _utc_now(),
        "git_repo_root": str(root),
        "git_commit_sha": sha,
        "git_commit_short": short,
        "git_describe": describe,
        "git_tags_points_at_head": tags_head,
        "git_worktree_dirty": dirty,
        "git_capture_notes": notes,
        "notes": (
            "B-299: paste-safe suffix on command_templates_version_annotated (shell `#` comment). "
            "Canonical runbook hash (B-284) includes this block; re-emit after repo moves."
        ),
    }


def annotate_command_with_version_pin(command: str, pin: dict[str, Any]) -> str:
    short = str(pin.get("git_commit_short") or "").strip() or "unknown"
    desc = str(pin.get("git_describe") or "").strip()
    tags = pin.get("git_tags_points_at_head")
    tag_note = ""
    if isinstance(tags, list) and tags:
        tag_note = f" tags={tags[0]!r}" if len(tags) == 1 else f" tags={tags!r}"
    extra = f" ({desc})" if desc else ""
    return f"{command}  # B-299 pin {short}{extra}{tag_note}"


def annotate_command_templates(commands: list[str], pin: dict[str, Any]) -> list[str]:
    return [annotate_command_with_version_pin(c, pin) for c in commands]


def _cmd_print_json(args: argparse.Namespace) -> int:
    root = Path(args.repo_root).resolve() if args.repo_root else None
    pin = build_runbook_version_pin(repo_root=root)
    print(json.dumps(pin, indent=2, ensure_ascii=False), file=sys.stdout)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    pin = build_runbook_version_pin(repo_root=_repo_root_default())
    assert pin.get("anchor") == PIN_ANCHOR
    assert pin.get("implementation_tt") == IMPLEMENTATION_TT
    cmds = ["python scripts/ops/x.py a", "bash scripts/y.sh"]
    ann = annotate_command_templates(cmds, pin)
    assert len(ann) == 2
    assert all("B-299 pin" in x for x in ann)
    assert ann[0].startswith(cmds[0])
    short = pin.get("git_commit_short") or "unknown"
    assert short in ann[0]

    print(f"region_vault_claim_broadcast_runbook_version_pin self-test OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description=f"{MOTHER_TABLE}: runbook git pin for command templates ({IMPLEMENTATION_TT})."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    pj = sub.add_parser("print-json", help="emit version-pin JSON to stdout")
    pj.add_argument("--repo-root", metavar="PATH", help="git repo root (default: TravelTrust repo root)")
    pj.set_defaults(func=_cmd_print_json)

    st = sub.add_parser("self-test", help="offline pin + annotate smoke")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
