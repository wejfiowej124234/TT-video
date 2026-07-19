#!/usr/bin/env python3
"""Stamp traveltrust.psg_coverage_run.v1 for Coverage Consistency Control."""
from __future__ import annotations

import argparse
import json
import subprocess
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_EV = (
    ROOT
    / "evidence"
    / "GO_pre_eta_production_prep"
    / "coverage-gap-non-web3-20260719"
)


def git_sha() -> str:
    return (
        subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True)
        .strip()
    )


def fetch_meta(api_base: str) -> dict:
    url = api_base.rstrip("/") + "/meta"
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            return json.loads(r.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
        return {}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--environment", choices=("local", "staging"), required=True)
    ap.add_argument("--git-sha", default=None, help="defaults to HEAD")
    ap.add_argument("--api-base", default="http://127.0.0.1:8080")
    ap.add_argument("--web-base", default=None, help="optional FE base for /meta web_sha")
    ap.add_argument("--evidence-path", default=str(DEFAULT_EV.relative_to(ROOT)))
    ap.add_argument(
        "--consistency-verdict",
        choices=("LOCAL_ONLY", "ALIGNED_PASS", "FAIL"),
        default=None,
    )
    ap.add_argument("--cell-refs", default="", help="comma-separated cell keys")
    ap.add_argument("--register-issue-ids", default="", help="comma-separated Register IDs")
    ap.add_argument(
        "--staging-meta-git-sha",
        default=None,
        help="required for ALIGNED_PASS (must equal git_sha)",
    )
    ap.add_argument(
        "--migration_state",
        "--migration-state",
        dest="migration_state",
        default=None,
        help="matched|unknown|drift (default: inferred)",
    )
    ap.add_argument(
        "--out",
        default=str(DEFAULT_EV / "COVERAGE-RUN-LATEST.json"),
    )
    args = ap.parse_args()

    sha = args.git_sha or git_sha()
    meta = fetch_meta(args.api_base)
    build = meta.get("build") if isinstance(meta.get("build"), dict) else {}
    api_sha = (
        build.get("git_sha")
        or meta.get("git_sha")
        or meta.get("commit")
        or ""
    )
    api_version = (
        api_sha
        or meta.get("version")
        or meta.get("api_version")
        or "unknown"
    )
    web_sha = ""
    if args.web_base:
        wmeta = fetch_meta(args.web_base)
        wbuild = wmeta.get("build") if isinstance(wmeta.get("build"), dict) else {}
        web_sha = (
            wbuild.get("git_sha")
            or wmeta.get("git_sha")
            or wmeta.get("commit")
            or ""
        )
    fe_version = "unknown"
    pkg = ROOT / "frontend" / "package.json"
    if pkg.is_file():
        try:
            fe_version = json.loads(pkg.read_text(encoding="utf-8")).get("version") or "unknown"
        except json.JSONDecodeError:
            pass

    verdict = args.consistency_verdict
    if verdict is None:
        verdict = "LOCAL_ONLY" if args.environment == "local" else "FAIL"

    staging_meta = args.staging_meta_git_sha or (api_sha if args.environment == "staging" else None)
    if args.environment == "staging" and verdict == "ALIGNED_PASS":
        if not staging_meta or staging_meta != sha:
            raise SystemExit(
                "ALIGNED_PASS on staging requires staging meta git_sha equal to --git-sha "
                f"(got staging_meta={staging_meta!r} git_sha={sha!r})"
            )
        if api_sha and api_sha != sha:
            raise SystemExit(f"ALIGNED_PASS requires api_sha==git_sha (api_sha={api_sha})")
        if web_sha and web_sha != sha:
            raise SystemExit(f"ALIGNED_PASS requires web_sha==git_sha when provided (web_sha={web_sha})")

    migration_state = args.migration_state
    if migration_state is None:
        if args.environment == "staging" and api_sha and api_sha == sha:
            migration_state = "matched"
        elif args.environment == "local":
            migration_state = "local_unverified"
        else:
            migration_state = "unknown"

    cell_refs = [x.strip() for x in args.cell_refs.split(",") if x.strip()]
    reg_ids = [x.strip() for x in args.register_issue_ids.split(",") if x.strip()]

    out = {
        "schema": "traveltrust.psg_coverage_run.v1",
        "machine_key": "TT_PSG_COVERAGE_RUN",
        "coverage_run": {
            "schema": "traveltrust.psg_coverage_run.v1",
            "git_sha": sha,
            "environment": args.environment,
            "api_sha": api_sha or None,
            "web_sha": web_sha or None,
            "api_version": str(api_version),
            "frontend_version": str(fe_version),
            "migration_state": migration_state,
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "evidence_path": args.evidence_path.replace("\\", "/"),
            "cell_refs": cell_refs,
            "register_issue_ids": reg_ids,
            "staging_meta_git_sha": staging_meta,
            "consistency_verdict": verdict,
            "api_base": args.api_base,
            "web_base": args.web_base,
            "notes": [
                "LOCAL_ONLY must not count as Coverage PASS",
                "ALIGNED_PASS requires Consistency Control five-point loop",
                "Do not expand RBAC tests to chase 96/96 while N/A denom stands",
            ],
        },
        "release_gate_stamp": {
            "psg": "CONDITIONAL_GO",
            "fix_required": 8,
        },
    }
    out_path = Path(args.out)
    if not out_path.is_absolute():
        out_path = ROOT / out_path
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"wrote": str(out_path.relative_to(ROOT)), "coverage_run": out["coverage_run"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
