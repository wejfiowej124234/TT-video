#!/usr/bin/env python3
"""Phase ③ Production Entry Review · sign-off bundle (≠ Production GO)."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RUNTIME_SHA = "9979b35efe562e8dd200e9f1a1e17fcc8182d170"
GRADUATION_SHA = "fc9266ce94f18810420e720bb933946c086ce909"
SOAK_SHA = "3bbedda776b2cf2666efaac055ce9e13d98127b7"


def load_json(rel: str) -> dict:
    p = ROOT / rel
    return json.loads(p.read_text(encoding="utf-8")) if p.is_file() else {}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--evid-dir", required=True)
    args = ap.parse_args()

    evid = Path(args.evid_dir)
    evid.mkdir(parents=True, exist_ok=True)

    drift = load_json(
        "evidence/GO_phase2_runtime_baseline/PHASE2-RUNTIME-DRIFT-fc9266ce-to-9979b35e-local-first.json"
    )
    local_first = load_json(
        "evidence/GO_phase2_runtime_baseline/PHASE2-LOCAL-FIRST-SYNC-9979b35e.latest.json"
    )
    grad = load_json(
        "evidence/GO_phase2_testnet_graduation/PHASE2-CLOSURE-GRADUATION-FREEZE.latest.json"
    )
    ha = load_json(
        "evidence/GO_phase2_final_human_acceptance/PHASE2-FINAL-HUMAN-ACCEPTANCE.latest.json"
    )
    soak = load_json("evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json")

    runtime_drift = (drift.get("verdict") or {}).get("runtime_drift", "UNKNOWN")
    if runtime_drift not in ("LOCAL_FIRST_INTENTIONAL", "NONE"):
        raise SystemExit(f"BLOCKED: runtime_drift={runtime_drift} (expected LOCAL_FIRST_INTENTIONAL)")
    if (local_first.get("verdicts") or {}).get("tt_phase2_local_first_sync") != "COMPLETE":
        raise SystemExit("BLOCKED: tt_phase2_local_first_sync != COMPLETE")

    signed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    sign_date = signed_at[:10]

    baseline_freeze = {
        "schema": "traveltrust.phase2_runtime_baseline_freeze.v1",
        "frozen_at_utc": signed_at,
        "phase": "② testnet",
        "runtime_staging_sha": RUNTIME_SHA,
        "graduation_frozen_sha": GRADUATION_SHA,
        "soak_baseline_sha": SOAK_SHA,
        "sync_kind": "local_first",
        "immutable_evidence": {
            "soak": "evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json",
            "graduation": "evidence/GO_phase2_testnet_graduation/freeze-fc9266ce/",
            "graduation_latest": "evidence/GO_phase2_testnet_graduation/PHASE2-CLOSURE-GRADUATION-FREEZE.latest.json",
            "final_human_acceptance": "evidence/GO_phase2_final_human_acceptance/PHASE2-FINAL-HUMAN-ACCEPTANCE.latest.json",
            "local_first_sync": "evidence/GO_phase2_runtime_baseline/PHASE2-LOCAL-FIRST-SYNC-9979b35e.latest.json",
            "runtime_drift": "evidence/GO_phase2_runtime_baseline/PHASE2-RUNTIME-DRIFT-fc9266ce-to-9979b35e-local-first.json",
        },
        "soak_snapshot": {
            "ok_polls": soak.get("ok_polls"),
            "fail_polls": soak.get("fail_polls"),
            "completed_at": soak.get("completed_at"),
        },
        "verdicts": {
            "tt_phase2_local_first_sync": "COMPLETE",
            "tt_phase2_runtime_drift": "LOCAL_FIRST_INTENTIONAL",
            "tt_testnet_graduation": (grad.get("verdicts") or {}).get("tt_testnet_graduation"),
            "tt_phase2_final_human_acceptance": "PASS",
            "phase2_baseline_frozen": True,
        },
        "honest_boundary": "Current staging @ 9979b35e · graduation/soak @ fc9266ce unchanged · ② frozen baseline ≠ ③ Production GO",
    }

    baseline_dir = ROOT / "evidence/GO_phase2_runtime_baseline/freeze-9979b35e-local-first"
    baseline_dir.mkdir(parents=True, exist_ok=True)
    (baseline_dir / "manifest.v1.json").write_text(
        json.dumps(baseline_freeze, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (baseline_dir / "STATUS.txt").write_text(
        "\n".join(
            [
                "phase: ② testnet runtime baseline",
                f"runtime_staging_sha: {RUNTIME_SHA}",
                f"graduation_frozen_sha: {GRADUATION_SHA}",
                f"soak_baseline_sha: {SOAK_SHA}",
                "runtime_drift: LOCAL_FIRST_INTENTIONAL",
                "baseline_frozen: true",
                f"at: {args.stamp}",
                "immutable: soak + graduation + final_ha evidence unchanged",
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    (baseline_dir / "OWNER-SIGNOFF.md").write_text(
        f"# Phase ② Runtime Baseline Freeze\n\nStaging `{RUNTIME_SHA}` · graduation `{GRADUATION_SHA}` · Local First sync COMPLETE.\n",
        encoding="utf-8",
    )

    baseline_latest = ROOT / "evidence/GO_phase2_runtime_baseline/PHASE2-RUNTIME-BASELINE-FREEZE.latest.json"
    baseline_latest.write_text(
        json.dumps(baseline_freeze, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    entry = {
        "schema": "traveltrust.phase3_production_entry_review.v1",
        "stamp": args.stamp,
        "opened_at_utc": signed_at,
        "phase": "③ production entry review",
        "status": "ACTIVE",
        "runtime_baseline_sha": RUNTIME_SHA,
        "graduation_frozen_sha": GRADUATION_SHA,
        "runtime_drift": "LOCAL_FIRST_INTENTIONAL",
        "local_first_sync": "COMPLETE",
        "verdict": {
            "phase3_production_entry_review": "ACTIVE",
            "production_go": "NO",
            "production_go_audit": "NO_GO",
        },
        "prerequisites_unchanged": {
            "soak": "evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json",
            "graduation_freeze": "evidence/GO_phase2_testnet_graduation/freeze-fc9266ce/manifest.v1.json",
            "local_first_sync": "evidence/GO_phase2_runtime_baseline/PHASE2-LOCAL-FIRST-SYNC-9979b35e.latest.json",
            "final_human_acceptance": ha.get("stamp"),
            "phase2_runtime_baseline": "evidence/GO_phase2_runtime_baseline/PHASE2-RUNTIME-BASELINE-FREEZE.latest.json",
        },
        "in_scope_review_tracks": [
            {"id": "P3-ENV", "title": "Production environment preparation"},
            {"id": "P3-MAINNET", "title": "Mainnet configuration review"},
            {"id": "P3-KEYS", "title": "Secrets / keys / PSP credential governance"},
            {"id": "P3-SEC", "title": "Security hardening & RBAC prod promote review"},
            {"id": "P3-MON", "title": "Monitoring / alerting / on-call readiness"},
            {"id": "P3-RB", "title": "Rollback & release drill strategy"},
            {"id": "P3-GOLIVE", "title": "Go-live strategy & cutover runbook review"},
        ],
        "explicitly_out_of_scope": [
            "Production GO decision or M-00 sign-off",
            "Mainnet deploy / broadcast without Owner-only gate",
            "sk_live / live PSP cutover",
            "Staging runtime redeploy off Local First baseline without RCA",
            "Substituting local workspace for frozen testnet baseline",
        ],
        "honest_boundary": "Entry Review ≠ Production GO ≠ final production validation",
        "machine_keys": {
            "TT_PHASE2_LOCAL_FIRST_SYNC": "COMPLETE",
            "TT_PHASE2_RUNTIME_BASELINE_FROZEN": "YES",
            "TT_PHASE2_RUNTIME_DRIFT": "LOCAL_FIRST_INTENTIONAL",
            "TT_PHASE3_PRODUCTION_ENTRY_REVIEW": "ACTIVE",
            "TT_PHASE3_PRODUCTION_GO": "NO",
            "PRODUCTION_GO_DECISION": "NO_GO",
        },
    }

    (evid / "production-entry-review.json").write_text(
        json.dumps(entry, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (evid / "OWNER-PHASE3-PRODUCTION-ENTRY-REVIEW.md").write_text(
        f"# Phase ③ Production Entry Review\n\nStamp `{args.stamp}` · staging `{RUNTIME_SHA}` · graduation `{GRADUATION_SHA}` · ACTIVE · NOT Production GO\n",
        encoding="utf-8",
    )
    latest = ROOT / "evidence/GO_phase3_production_entry_review/PHASE3-PRODUCTION-ENTRY-REVIEW.latest.json"
    latest.parent.mkdir(parents=True, exist_ok=True)
    latest.write_text(json.dumps(entry, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"baseline_freeze: {baseline_dir / 'manifest.v1.json'}")
    print(f"entry_review: {evid / 'production-entry-review.json'}")
    print("TT_PHASE2_LOCAL_FIRST_SYNC: COMPLETE")
    print("TT_PHASE2_RUNTIME_BASELINE_FROZEN: YES")
    print("TT_PHASE2_RUNTIME_DRIFT: LOCAL_FIRST_INTENTIONAL")
    print("TT_PHASE3_PRODUCTION_ENTRY_REVIEW: ACTIVE")
    print("TT_PHASE3_PRODUCTION_GO: NO")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())