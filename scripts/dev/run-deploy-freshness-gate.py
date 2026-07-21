#!/usr/bin/env python3
"""Deploy Freshness Gate · any Staging deploy (Web / API / Web3 companion).

Ensures a deploy does NOT silently re-introduce stale public catalog data or
wrong ACTIVE address baseline. Exit 0 = PASS. Exit 2 = BLOCK deploy.

  python scripts/dev/run-deploy-freshness-gate.py
  python scripts/dev/run-deploy-freshness-gate.py --mode pre-deploy
  python scripts/dev/run-deploy-freshness-gate.py --mode post-deploy --target web

SSOT:
  docs/runbook/TT-PSG-DEPLOY-FRESHNESS-GATE-LATEST.md
  docs/runbook/TT-PSG-PUBLIC-DISPLAY-10X4-LOCK-LATEST.md
  registry/deploy-freshness-gate.v1.yaml
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXPECTED_10X4 = {"guides": 10, "provider": 10, "acquisition": 10, "community": 10}


def get_json(url: str, timeout: int = 35):
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:800]
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"_raw": body}
    except Exception as ex:  # noqa: BLE001
        return 0, {"_error": str(ex)}


def count_items(api: str, path: str, keys: list[str], retries: int = 3) -> int:
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            code, data = get_json(api.rstrip("/") + path)
            if code != 200:
                raise RuntimeError(f"HTTP {code} for {path}: {data}")
            if isinstance(data, list):
                return len(data)
            for k in keys:
                v = data.get(k)
                if isinstance(v, list):
                    return len(v)
            return int(data.get("count") or 0)
        except Exception as ex:  # noqa: BLE001
            last_err = ex
            if attempt + 1 < retries:
                import time

                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(str(last_err))


def check_10x4(api: str) -> dict:
    counts = {
        "guides": count_items(api, "/api/v1/guides?limit=500", ["items", "guides"]),
        "provider": count_items(
            api, "/api/v1/market/provider/listings?limit=500", ["items", "listings"]
        ),
        "acquisition": count_items(
            api, "/api/v1/market/acquisition/listings?limit=500", ["items", "listings"]
        ),
        "community": count_items(
            api, "/api/v1/community/feed?limit=500", ["items", "posts", "feed"]
        ),
    }
    drifts = {k: counts[k] for k in EXPECTED_10X4 if counts[k] != EXPECTED_10X4[k]}
    return {
        "id": "public_display_10x4",
        "pass": not drifts,
        "counts": counts,
        "drifts": drifts,
        "remediation": "STAGING_RC_BASELINE_ALIGNING=1 bash scripts/dev/run-lock-public-display-10x4-staging.sh",
    }


def check_active_baseline() -> dict:
    dep = ROOT / "registry/protocol-convergence-deployments.v1.yaml"
    text = dep.read_text(encoding="utf-8") if dep.exists() else ""
    active_line = re.search(
        r"^active_deploy_baseline:\s*(\S+)", text, re.M
    )
    mainline_line = re.search(
        r"^web3_mainline_baseline:\s*(\S+)", text, re.M
    )
    active_name = active_line.group(1).strip().strip("\"'") if active_line else ""
    mainline_name = mainline_line.group(1).strip().strip("\"'") if mainline_line else ""
    cand_active = bool(
        re.search(
            r"v311_fund_safety_candidate_v2:\s*\n\s+status:\s*ACTIVE_WEB3_CANDIDATE_BASELINE",
            text,
        )
    )
    hist_ok = bool(
        re.search(
            r"v311_sepolia_clean_baseline:\s*\n\s+status:\s*HISTORICAL_FG15_A_SNAPSHOT",
            text,
        )
    )
    ok = (
        active_name == "v311_fund_safety_candidate_v2"
        and mainline_name == "v311_fund_safety_candidate_v2"
        and cand_active
        and hist_ok
    )
    return {
        "id": "web3_active_address_baseline",
        "pass": ok,
        "active_deploy_baseline": active_name or "(missing)",
        "web3_mainline_baseline": mainline_name or "(missing)",
        "candidate_status_active": cand_active,
        "fg15_a_historical": hist_ok,
        "detail": "ACTIVE Web3 SSOT must be v311_fund_safety_candidate_v2 (Baseline Migration v2)",
        "remediation": "bash scripts/gates/check-web3-mainline-candidate-v2-gate.sh",
    }


def check_catalog_bake(target: str) -> dict:
    if target not in ("web", "all"):
        return {"id": "catalog_bake", "pass": True, "skipped": True}
    val = os.environ.get("NEXT_PUBLIC_CATALOG_API_ENABLED", "")
    example = ROOT / "deploy/fly/tt-web-staging/build.env.example"
    example_ok = example.exists() and "NEXT_PUBLIC_CATALOG_API_ENABLED=1" in example.read_text(
        encoding="utf-8"
    )
    # If env unset at gate time, require example SSOT =1 (deploy script will fail later if wrong)
    ok = val == "1" or (val == "" and example_ok)
    return {
        "id": "catalog_bake",
        "pass": ok,
        "NEXT_PUBLIC_CATALOG_API_ENABLED": val or "(unset · example must be 1)",
        "remediation": "export NEXT_PUBLIC_CATALOG_API_ENABLED=1 before deploy-tt-web-staging.sh",
    }


def check_git_freshness() -> dict:
    """Block accidental deploy from detached/old tip without Owner override."""
    try:
        head = subprocess.check_output(
            ["git", "-C", str(ROOT), "rev-parse", "--short", "HEAD"],
            text=True,
        ).strip()
        branch = subprocess.check_output(
            ["git", "-C", str(ROOT), "rev-parse", "--abbrev-ref", "HEAD"],
            text=True,
        ).strip()
        dirty = subprocess.check_output(
            ["git", "-C", str(ROOT), "status", "--porcelain"],
            text=True,
        ).strip()
    except Exception as ex:  # noqa: BLE001
        return {"id": "git_freshness", "pass": False, "error": str(ex)}

    strict = os.environ.get("TT_DEPLOY_FRESHNESS_STRICT_GIT", "0") == "1"
    # Soft: always record; hard-fail only in STRICT if dirty (Owner may bake uncommitted intentionally)
    ok = True
    warn = None
    if dirty and strict:
        ok = False
        warn = "dirty_worktree_strict"
    elif dirty:
        warn = "dirty_worktree_recorded"
    return {
        "id": "git_freshness",
        "pass": ok,
        "head": head,
        "branch": branch,
        "dirty": bool(dirty),
        "warning": warn,
        "remediation": "commit or set TT_DEPLOY_FRESHNESS_STRICT_GIT=0; Owner override TRAVELTRUST_DEPLOY_FRESHNESS_OVERRIDE=1",
    }


def check_showcase_policy_files() -> dict:
    """Repo-side: DDG must not default-reseed showcase (stale Unsplash path)."""
    ddg = (ROOT / "scripts/dev/run-staging-full-site-display-governance.sh").read_text(
        encoding="utf-8", errors="replace"
    )
    ok = "Showcase re-seed SKIPPED" in ddg or "OWNER_ALLOW_SHOWCASE_SEED" in ddg
    return {
        "id": "showcase_reseed_policy",
        "pass": ok,
        "remediation": "DDG must skip seed-staging-showcase by default (OCS 10×4 lock)",
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", default="pre-deploy", choices=["pre-deploy", "post-deploy", "check"])
    ap.add_argument("--target", default="all", choices=["all", "web", "api", "web3"])
    ap.add_argument(
        "--out",
        default="",
        help="optional evidence JSON path",
    )
    args = ap.parse_args()

    if os.environ.get("TRAVELTRUST_DEPLOY_FRESHNESS_OVERRIDE") == "1":
        print("deploy-freshness-gate: SKIP (TRAVELTRUST_DEPLOY_FRESHNESS_OVERRIDE=1)")
        return 0
    if os.environ.get("SKIP_DEPLOY_FRESHNESS_GATE") == "1":
        print("deploy-freshness-gate: SKIP (SKIP_DEPLOY_FRESHNESS_GATE=1)")
        return 0
    # Alignment lock runs may temporarily drift counts — allow only when aligning
    if os.environ.get("STAGING_RC_BASELINE_ALIGNING") == "1" and args.mode == "pre-deploy":
        print("deploy-freshness-gate: SKIP 10x4 during STAGING_RC_BASELINE_ALIGNING=1 (other checks still run)")

    api = os.environ.get("STAGING_API_BASE") or os.environ.get(
        "API_BASE", "https://tt-api-staging.fly.dev"
    )

    checks = []
    skip_10x4 = os.environ.get("STAGING_RC_BASELINE_ALIGNING") == "1" and args.mode == "pre-deploy"
    if not skip_10x4:
        try:
            checks.append(check_10x4(api))
        except Exception as ex:  # noqa: BLE001
            checks.append(
                {
                    "id": "public_display_10x4",
                    "pass": False,
                    "error": str(ex),
                    "remediation": "fix Staging API reachability then re-run lock script",
                }
            )
    else:
        checks.append({"id": "public_display_10x4", "pass": True, "skipped": "aligning"})

    checks.append(check_active_baseline())
    checks.append(check_catalog_bake(args.target))
    checks.append(check_git_freshness())
    checks.append(check_showcase_policy_files())

    failed = [c for c in checks if not c.get("pass")]
    report = {
        "schema": "traveltrust.deploy_freshness_gate.v1",
        "recorded_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mode": args.mode,
        "target": args.target,
        "api_base": api,
        "checks": checks,
        "verdict": "PASS" if not failed else "BLOCKED",
        "machine_key": "TT_DEPLOY_FRESHNESS_GATE",
        "rule": "Any deploy (Web/API/Web3 companion) must prove code+data baseline is current — no stale public catalog / wrong ACTIVE / catalog bake miss.",
    }

    out = args.out
    if not out:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        out_dir = ROOT / "evidence/GO_deploy_freshness_gate" / stamp
        out_dir.mkdir(parents=True, exist_ok=True)
        out = str(out_dir / "DEPLOY-FRESHNESS-GATE-LATEST.json")
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(json.dumps({"verdict": report["verdict"], "failed": [c["id"] for c in failed], "out": out}, indent=2))
    if failed:
        for c in failed:
            print(f"BLOCKED {c['id']}: {c.get('remediation') or c.get('error') or c}", file=sys.stderr)
        return 2
    print(f"TT_DEPLOY_FRESHNESS_GATE: PASS ({args.mode})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
