#!/usr/bin/env python3
"""Classify git diff scope for Phase③ deploy governance (S5/S6 gate).

Exit 0 always; prints JSON to stdout. Machine keys on stderr when --emit-keys.

Categories (first match wins):
  staging_runtime  — affects staging Fly API/Web deploy artifacts
  local_dev_only   — local dev / probes / evidence scripts; no staging image change
  evidence_docs    — evidence, runbooks, handbook; no redeploy
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

STAGING_RUNTIME_PREFIXES = (
    "crates/",
    "frontend/",
    "deploy/",
    "contracts/",
    "registry/",
    "config/",
    "docker/",
    "Dockerfile",
    "docker-compose",
    ".github/workflows/",
)

LOCAL_DEV_ONLY_PREFIXES = (
    "scripts/dev/lib/local-",
    "scripts/dev/start-api-for-playwright.sh",
    "scripts/dev/smoke-",
    "scripts/dev/run-web3-",
    "scripts/dev/run-admin-",
    "scripts/dev/run-go-local-",
    "scripts/dev/ensure-local-",
    "scripts/dev/phase28-human-acceptance-probe.py",
    "scripts/dev/five-role-full-chain-audit.py",
    "scripts/dev/phase2-deep-release-gate.py",
    "scripts/dev/gen-ttg-governance-cert-gates-registry.py",
    "scripts/ops/lib/deploy-governance-",
    "scripts/dev/classify-deploy-change-scope.py",
)

EVIDENCE_DOCS_PREFIXES = (
    "evidence/",
    "docs/",
    "frontend/evidence/",
    ".cursor/",
    "AGENTS.md",
    "CONTRIBUTING.md",
    "README.md",
)


def _classify_path(path: str) -> str:
    if path.startswith("frontend/evidence/"):
        return "evidence_docs"
    for p in STAGING_RUNTIME_PREFIXES:
        if path == p.rstrip("/") or path.startswith(p):
            return "staging_runtime"
    for p in LOCAL_DEV_ONLY_PREFIXES:
        if path == p or path.startswith(p):
            return "local_dev_only"
    for p in EVIDENCE_DOCS_PREFIXES:
        if path == p or path.startswith(p):
            return "evidence_docs"
    if path.endswith(".md"):
        return "evidence_docs"
    if path.startswith("scripts/"):
        return "local_dev_only"
    return "unknown"


def git_diff_names(repo: Path, base: str, head: str) -> list[str]:
    out = subprocess.check_output(
        ["git", "-C", str(repo), "diff", "--name-only", f"{base}..{head}"],
        text=True,
    )
    return [ln.strip() for ln in out.splitlines() if ln.strip()]


def aggregate(files: list[str]) -> dict:
    by_cat: dict[str, list[str]] = {
        "staging_runtime": [],
        "local_dev_only": [],
        "evidence_docs": [],
        "unknown": [],
    }
    for f in files:
        by_cat[_classify_path(f)].append(f)
    if by_cat["staging_runtime"] or by_cat["unknown"]:
        scope = "STAGING_RUNTIME"
        s5_required = True
    elif not files:
        scope = "NO_CHANGES"
        s5_required = False
    else:
        scope = "EVIDENCE_DOCS_ONLY"
        s5_required = False
    return {
        "scope": scope,
        "s5_required": s5_required,
        "s6_required": s5_required,
        "file_count": len(files),
        "by_category": by_cat,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-root", default=".")
    ap.add_argument("--baseline-sha", required=True)
    ap.add_argument("--head-sha", default="HEAD")
    ap.add_argument("--emit-keys", action="store_true")
    args = ap.parse_args()
    repo = Path(args.repo_root).resolve()
    head = (
        subprocess.check_output(
            ["git", "-C", str(repo), "rev-parse", args.head_sha], text=True
        ).strip()
        if args.head_sha != "HEAD"
        else subprocess.check_output(
            ["git", "-C", str(repo), "rev-parse", "HEAD"], text=True
        ).strip()
    )
    base = subprocess.check_output(
        ["git", "-C", str(repo), "rev-parse", args.baseline_sha], text=True
    ).strip()
    files = git_diff_names(repo, base, head)
    result = {
        "schema": "traveltrust.deploy_change_scope.v1",
        "baseline_sha": base,
        "head_sha": head,
        **aggregate(files),
    }
    print(json.dumps(result, indent=2))
    if args.emit_keys:
        print(
            f"TT_DEPLOY_CHANGE_SCOPE: {result['scope']}",
            file=sys.stderr,
        )
        print(
            f"TT_DEPLOY_S5_REQUIRED: {'YES' if result['s5_required'] else 'NO'}",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
