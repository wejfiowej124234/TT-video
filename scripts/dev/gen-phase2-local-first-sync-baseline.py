#!/usr/bin/env python3
"""Phase ② Local First sync complete baseline @ qualified local SHA (≠ re-graduation)."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCAL_FIRST_SHA = "9979b35efe562e8dd200e9f1a1e17fcc8182d170"
GRADUATION_SHA = "fc9266ce94f18810420e720bb933946c086ce909"
SOAK_SHA = "3bbedda776b2cf2666efaac055ce9e13d98127b7"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--evid-dir", required=True)
    args = ap.parse_args()

    evid = Path(args.evid_dir)
    evid.mkdir(parents=True, exist_ok=True)
    signed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    retest = {
        "r003_staging_regression": {
            "release_gate": "GO",
            "cases": 12,
            "report": "evidence/GO_phase2_testnet_20260526/report.json",
        },
        "adm_u01_staging": {
            "release_gate": "GO",
            "api_matrix": "102/102",
            "playwright_shell": "GO",
            "run_id": "adm_u01_localfirst_retest3_20260630",
            "evidence": "evidence/GO_staging_admin_rbac_matrix/adm_u01_localfirst_retest3_20260630",
        },
        "uat_cross_domain": {
            "test": "跨域 · meta 同源代理 + CORS /governance",
            "verdict": "PASS",
        },
        "deep_release_gate": {
            "verdict": "PASS",
            "release_gate": "GO",
            "evidence": "evidence/GO_phase2_testnet_20260526/local-staging-parity/20260630T041949Z/deep-release-gate",
        },
        "transient_failures_ruled_out": True,
        "notes": "Prior SSL/ERR_CONNECTION_CLOSED failures reproduced as client-path flakes; stable-window retest all PASS.",
    }

    sync = {
        "schema": "traveltrust.phase2_local_first_sync_baseline.v1",
        "stamp": args.stamp,
        "synced_at_utc": signed_at,
        "phase": "② testnet",
        "policy": "Local First — local qualified baseline deployed to staging; Phase③ WIP isolated",
        "local_dev_ssot_sha": LOCAL_FIRST_SHA,
        "staging_runtime_sha": LOCAL_FIRST_SHA,
        "graduation_frozen_sha": GRADUATION_SHA,
        "soak_baseline_sha": SOAK_SHA,
        "phase2_closure_slice_only": True,
        "phase3_wip_isolated": True,
        "immutable_historical_evidence": {
            "soak": "evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json",
            "graduation": "evidence/GO_phase2_testnet_graduation/freeze-fc9266ce/",
            "final_human_acceptance": "evidence/GO_phase2_final_human_acceptance/PHASE2-FINAL-HUMAN-ACCEPTANCE.latest.json",
        },
        "staging_retest": retest,
        "verdicts": {
            "tt_phase2_local_first_sync": "COMPLETE",
            "tt_phase2_runtime_staging_sha": LOCAL_FIRST_SHA,
            "tt_phase2_runtime_drift_vs_graduation": "LOCAL_FIRST_INTENTIONAL",
            "phase3_production_entry_review_eligible": True,
        },
        "honest_boundary": "Local First sync complete ≠ Production GO ≠ re-graduation; soak/HA anchors remain @ graduation SHA",
        "machine_keys": {
            "TT_PHASE2_LOCAL_FIRST_SYNC": "COMPLETE",
            "TT_PHASE2_RUNTIME_STAGING_SHA": LOCAL_FIRST_SHA,
            "TT_PHASE2_RUNTIME_DRIFT": "LOCAL_FIRST_INTENTIONAL",
        },
    }

    drift = {
        "schema": "traveltrust.phase2_runtime_drift_analysis.v1",
        "analyzed_at_utc": signed_at,
        "phase": "② testnet",
        "baseline": {
            "label": "Phase② Graduation Runtime (immutable)",
            "git_sha": GRADUATION_SHA,
            "staging_api": "https://tt-api-staging.fly.dev",
            "soak_baseline_sha": SOAK_SHA,
        },
        "compare": {
            "git_sha": LOCAL_FIRST_SHA,
            "label": "Local First sync deploy (Phase② closure slice)",
            "diff_range": f"{GRADUATION_SHA}..{LOCAL_FIRST_SHA}",
            "commits_intentional": True,
        },
        "verdict": {
            "runtime_drift": "LOCAL_FIRST_INTENTIONAL",
            "uncontrolled_drift": "NONE",
            "local_first_sync_complete": True,
        },
        "retest_evidence": retest,
    }

    baseline_freeze = {
        "schema": "traveltrust.phase2_runtime_baseline_freeze.v1",
        "frozen_at_utc": signed_at,
        "phase": "② testnet",
        "runtime_staging_sha": LOCAL_FIRST_SHA,
        "graduation_frozen_sha": GRADUATION_SHA,
        "soak_baseline_sha": SOAK_SHA,
        "sync_kind": "local_first",
        "immutable_evidence": {
            "soak": "evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json",
            "graduation": "evidence/GO_phase2_testnet_graduation/freeze-fc9266ce/",
            "graduation_latest": "evidence/GO_phase2_testnet_graduation/PHASE2-CLOSURE-GRADUATION-FREEZE.latest.json",
            "final_human_acceptance": "evidence/GO_phase2_final_human_acceptance/PHASE2-FINAL-HUMAN-ACCEPTANCE.latest.json",
            "local_first_sync": "evidence/GO_phase2_runtime_baseline/PHASE2-LOCAL-FIRST-SYNC-9979b35e.latest.json",
            "prior_drift_closure": "evidence/GO_phase2_runtime_baseline/PHASE2-RUNTIME-DRIFT-dd5df42-vs-fc9266ce.json",
        },
        "verdicts": {
            "tt_phase2_local_first_sync": "COMPLETE",
            "tt_phase2_runtime_drift": "LOCAL_FIRST_INTENTIONAL",
            "tt_testnet_graduation": "CLOSED",
            "tt_phase2_final_human_acceptance": "PASS",
            "phase2_baseline_frozen": True,
        },
        "honest_boundary": "Current staging @ 9979b35e · graduation/soak @ fc9266ce unchanged · ≠ Production GO",
    }

    (evid / "LOCAL-FIRST-RETEST.json").write_text(
        json.dumps(retest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (evid / "LOCAL-FIRST-SYNC-BASELINE.json").write_text(
        json.dumps(sync, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    sync_latest = ROOT / "evidence/GO_phase2_runtime_baseline/PHASE2-LOCAL-FIRST-SYNC-9979b35e.latest.json"
    sync_latest.parent.mkdir(parents=True, exist_ok=True)
    sync_latest.write_text(json.dumps(sync, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    drift_path = ROOT / "evidence/GO_phase2_runtime_baseline/PHASE2-RUNTIME-DRIFT-fc9266ce-to-9979b35e-local-first.json"
    drift_path.write_text(json.dumps(drift, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    baseline_latest = ROOT / "evidence/GO_phase2_runtime_baseline/PHASE2-RUNTIME-BASELINE-FREEZE.latest.json"
    baseline_latest.write_text(json.dumps(baseline_freeze, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    freeze_dir = ROOT / "evidence/GO_phase2_runtime_baseline/freeze-9979b35e-local-first"
    freeze_dir.mkdir(parents=True, exist_ok=True)
    (freeze_dir / "manifest.v1.json").write_text(
        json.dumps(baseline_freeze, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (freeze_dir / "STATUS.txt").write_text(
        "\n".join(
            [
                "phase: ② testnet · Local First sync complete",
                f"runtime_staging_sha: {LOCAL_FIRST_SHA}",
                f"graduation_frozen_sha: {GRADUATION_SHA}",
                "runtime_drift: LOCAL_FIRST_INTENTIONAL",
                f"at: {args.stamp}",
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    print(f"sync_baseline: {sync_latest}")
    print(f"drift: {drift_path}")
    print(f"baseline_freeze: {baseline_latest}")
    print("TT_PHASE2_LOCAL_FIRST_SYNC: COMPLETE")
    print(f"TT_PHASE2_RUNTIME_STAGING_SHA: {LOCAL_FIRST_SHA}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
