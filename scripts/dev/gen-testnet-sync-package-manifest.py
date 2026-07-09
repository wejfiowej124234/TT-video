#!/usr/bin/env python3
"""TESTNET_SYNC_PACKAGE · 机读 manifest（本地 HEAD = 测试网同步基线）

  python scripts/dev/gen-testnet-sync-package-manifest.py
  python scripts/dev/gen-testnet-sync-package-manifest.py --evidence-dir evidence/TESTNET_SYNC_PACKAGE/<stamp>

末行：TT_TESTNET_SYNC_PACKAGE_MANIFEST: READY|DRIFT out=...
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PKG_DIR = ROOT / "evidence/TESTNET_SYNC_PACKAGE"
SITE10_LOG = ROOT / "frontend/evidence/GO_local_phase1/site10-p1-slices-recheck.latest.log"
GATE_EVID = ROOT / "evidence/COMPLEXITY_CONVERGENCE/GATE-P1-01/phase1.closed.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def git_head() -> str:
    return subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
    ).strip()


def load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def site10_ok() -> bool:
    if not SITE10_LOG.is_file():
        return False
    text = SITE10_LOG.read_text(encoding="utf-8", errors="replace")
    return "summary pass=25 fail=0" in text or (
        text.count("RECHECK_PASS:") >= 25 and text.count("RECHECK_FAIL:") == 0
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--evidence-dir", default="")
    ap.add_argument("--parity-json", default="")
    ap.add_argument("--deploy-mode", default="overlay")
    args = ap.parse_args()

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_dir = Path(args.evidence_dir) if args.evidence_dir else PKG_DIR / stamp
    out_dir.mkdir(parents=True, exist_ok=True)

    head = git_head()
    parity = load_json(Path(args.parity_json)) if args.parity_json else None
    zero_drift = bool(parity and parity.get("zero_drift"))

    payload: dict[str, Any] = {
        "schema": "traveltrust.testnet_sync_package.v1",
        "generated_at_utc": utc_now(),
        "baseline": {
            "gate_p1_01": "GATE-P1-01",
            "site10_25_25": site10_ok(),
            "phase1_closed": GATE_EVID.is_file(),
            "policy": "no_full_gate_rerun · no_testnet_rebuild · no_db_reset",
            "sync_baseline_git_sha": head,
        },
        "deploy": {
            "mode": args.deploy_mode,
            "policy": "overwrite_fly_deploy · forward_migrations_only · preserve_staging_data",
            "targets": {
                "api": "tt-api-staging.fly.dev",
                "web": "tt-web-staging.fly.dev",
            },
        },
        "alignment_axes": [
            "ssot_registry_and_meta",
            "contract_abi_registry",
            "db_migrations_forward",
            "feature_flags_fly_secrets",
            "route_manifest_04_3_4",
        ],
        "parity": parity or {"status": "pending"},
        "zero_drift": zero_drift,
        "manual_verify": {
            "booking_core": "traveler→guide→order→escrow→completion @ staging",
            "itinerary": "country→city→booking @ staging",
            "gate_env": "TESTNET_MANUAL_VERIFY_PASS=1",
        },
        "freeze_soak": {
            "freeze": "engage-testnet-staging-baseline-freeze.sh @ HEAD",
            "soak": "P2FC_SOAK_SUPERSEDE=1 p2fc-launch-staging-soak-72h.sh",
            "forbidden": ["run-site10-p1-slices-recheck-sequential.sh", "testnet_db_reset"],
        },
    }

    out = out_dir / "TESTNET_SYNC_PACKAGE.manifest.json"
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    latest = PKG_DIR / "TESTNET_SYNC_PACKAGE.manifest.latest.json"
    latest.write_text(out.read_text(encoding="utf-8"), encoding="utf-8")
    (PKG_DIR / "latest-stamp.txt").write_text(stamp + "\n", encoding="utf-8")

    verdict = "READY" if site10_ok() and GATE_EVID.is_file() else "DRIFT"
    if parity and not zero_drift:
        verdict = "DRIFT"
    print(f"TT_TESTNET_SYNC_PACKAGE_MANIFEST: {verdict} out={out.as_posix()} sha={head[:12]}")
    return 0 if verdict == "READY" else 1


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
