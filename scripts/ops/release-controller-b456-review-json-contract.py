#!/usr/bin/env python3
"""B-456: release controller — runs `eval-b455-*`, optional GitHub Actions outputs, optional hooks.

Default: forward `eval-b455` exit code (0/1/2) for shell gates.

`--ci`: always exit 0 after writing outputs (workflow can branch on `should_*`); stderr still logs verdict.
`--apply-hooks`: if config `hooks.<VERDICT>.shell_command` is non-null, run it (ops-only).
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any


def _root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _load_json(p: Path) -> dict[str, Any]:
    return json.loads(p.read_text(encoding="utf-8"))


def _write_github_output(path: Path, verdict: str, exit_code: int) -> None:
    promote = verdict == "GREEN"
    freeze = verdict == "YELLOW"
    rollback = verdict == "RED"
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(f"verdict={verdict}\n")
        f.write(f"eval_exit_code={exit_code}\n")
        f.write(f"should_promote={str(promote).lower()}\n")
        f.write(f"should_freeze={str(freeze).lower()}\n")
        f.write(f"should_rollback={str(rollback).lower()}\n")


def main() -> int:
    r = _root()
    ap = argparse.ArgumentParser(description="B-456 review_json_contract release controller")
    ap.add_argument(
        "summary",
        type=Path,
        help="Path to B-454 replay_summary.json",
    )
    ap.add_argument(
        "--thresholds",
        type=Path,
        default=r / "config" / "b455_review_json_contract_rollout_thresholds.json",
    )
    ap.add_argument(
        "--config",
        type=Path,
        default=r / "config" / "b456_review_json_contract_release_controller.json",
        help="B-456 controller config (hooks)",
    )
    ap.add_argument(
        "--ci",
        action="store_true",
        help="CI mode: always exit 0 after writing GITHUB_OUTPUT (env or --github-output)",
    )
    ap.add_argument(
        "--github-output",
        type=Path,
        default=None,
        help="Append GITHUB_OUTPUT key=value lines (or set env GITHUB_OUTPUT)",
    )
    ap.add_argument(
        "--apply-hooks",
        action="store_true",
        help="Execute non-null hooks.<verdict>.shell_command from config",
    )
    args = ap.parse_args()

    eval_py = r / "scripts" / "gates" / "eval-b455-review-json-contract-rollout-decision.py"
    if not eval_py.is_file():
        print(f"release-controller-b456: missing {eval_py}", file=sys.stderr)
        return 3

    proc = subprocess.run(
        [sys.executable, str(eval_py), str(args.summary), "--thresholds", str(args.thresholds)],
        cwd=str(r),
        capture_output=True,
        text=True,
        check=False,
    )
    exit_code = int(proc.returncode)
    try:
        decision = json.loads(proc.stdout)
    except json.JSONDecodeError:
        print(proc.stderr or proc.stdout, file=sys.stderr)
        return 3

    verdict = str(decision.get("verdict", ""))
    print(json.dumps(decision, ensure_ascii=False, indent=2, sort_keys=True))

    gh = args.github_output or (Path(os.environ["GITHUB_OUTPUT"]) if os.environ.get("GITHUB_OUTPUT") else None)
    if gh is not None:
        _write_github_output(gh, verdict, exit_code)

    if args.apply_hooks:
        try:
            cfg = _load_json(args.config)
        except (OSError, json.JSONDecodeError) as e:
            print(f"release-controller-b456: config: {e}", file=sys.stderr)
            return 3
        if cfg.get("controller_schema") != "b456_review_json_contract_release_controller_v1":
            print("release-controller-b456: config.controller_schema mismatch", file=sys.stderr)
            return 3
        hook = ((cfg.get("hooks") or {}).get(verdict) or {}).get("shell_command")
        if hook:
            subprocess.run(hook, shell=True, check=True, cwd=str(r))

    print(f"release-controller-b456: verdict={verdict} eval_exit={exit_code}", file=sys.stderr)

    if args.ci:
        return 0
    return exit_code if exit_code in (0, 1, 2) else 3


if __name__ == "__main__":
    raise SystemExit(main())
