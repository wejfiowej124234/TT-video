#!/usr/bin/env python3
"""P2FC · post-soak staging live closure 证据汇总（B1–B4 · Admin · P0 runtime · MR12 checkpoint）

只读聚合 · prep 不可视为 GO。

  python scripts/dev/gen-p2fc-post-soak-staging-live-closure-evidence.py
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SOAK_DIR = ROOT / "evidence/P2FC_SOAK_72H_STAGING"
CLOSURE_DIR = SOAK_DIR / "post-soak-staging-live-closure"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def phase_status(checkpoint: dict[str, Any] | None, name: str) -> str | None:
    if not checkpoint:
        return None
    phases = checkpoint.get("phases") or {}
    p = phases.get(name) or {}
    return p.get("status")


def build_blocker_convergence(
    checkpoint: dict[str, Any] | None,
    adm_u01_report: dict[str, Any] | None,
    adm_u02_report: dict[str, Any] | None,
    p0_runtime: dict[str, Any] | None,
    one_shot_pass: bool,
) -> list[dict[str, Any]]:
    tn = phase_status(checkpoint, "tn_p1_010")
    w1 = phase_status(checkpoint, "wave1_api_deploy")
    g02 = phase_status(checkpoint, "g02_deep_gate")
    grad = phase_status(checkpoint, "graduation")
    meta = phase_status(checkpoint, "meta_availability")

    blockers = [
        {
            "id": "B1_TN_P1_010",
            "status": "cleared" if tn == "PASS" else "open",
            "live_evidence": f"checkpoint.tn_p1_010={tn}",
            "note": "TN-P1-010 independent + indexer backfill",
        },
        {
            "id": "B2_W1_ITINERARIES_HUB",
            "status": "cleared" if w1 == "PASS" and one_shot_pass else "open",
            "live_evidence": f"checkpoint.wave1_api_deploy={w1}",
            "note": "Wave1 API deploy · itineraries hub delta may need follow-up MR",
        },
        {
            "id": "B3_G06_G08",
            "status": "cleared" if g02 == "PASS" and meta == "PASS" and grad == "PASS" else "open",
            "live_evidence": f"g02={g02} meta={meta} graduation={grad}",
            "note": "G02 deep gate + /meta strict + graduation closure",
        },
        {
            "id": "B4_DB_COMPOUND",
            "status": "cleared" if tn == "PASS" else "open",
            "live_evidence": f"checkpoint.tn_p1_010={tn} (compound with B1)",
            "note": "db/mod.rs + itineraries compound — cleared with TN-P1-010 pass",
        },
    ]
    return blockers


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--soak-dir", default=str(SOAK_DIR))
    ap.add_argument("--closure-dir", default="")
    args = ap.parse_args()

    soak_dir = Path(args.soak_dir)
    closure_dir = Path(args.closure_dir) if args.closure_dir else soak_dir / "post-soak-staging-live-closure"
    closure_dir.mkdir(parents=True, exist_ok=True)

    checkpoint = load_json(soak_dir / "post-soak-one-shot/checkpoint.json")
    one_shot_log = soak_dir / "post-soak-one-shot/one-shot.log"
    one_shot_pass = one_shot_log.is_file() and "TT_P2FC_POST_SOAK_ONE_SHOT: PASS" in one_shot_log.read_text(
        encoding="utf-8", errors="replace"
    )

    adm_u01 = load_json(closure_dir / "adm-u01-live/report.json")
    if not adm_u01:
        for p in sorted((ROOT / "evidence/GO_staging_admin_rbac_matrix").glob("*/report.json"), reverse=True):
            adm_u01 = load_json(p)
            if adm_u01 and adm_u01.get("environment", {}).get("deployment_kind") == "persistent_host":
                break

    adm_u02 = load_json(closure_dir / "adm-u02-live/report.json")
    if not adm_u02:
        for p in sorted((ROOT / "evidence/GO_staging_admin_adm_u02").glob("*/report.json"), reverse=True):
            adm_u02 = load_json(p)
            break

    p0_runtime = load_json(closure_dir / "p0-rbac-bypass-runtime/latest.json")
    prep = load_json(soak_dir / "web3-system-security-audit/adm-u01-staging-live-prep.latest.json")

    blockers = build_blocker_convergence(checkpoint, adm_u01, adm_u02, p0_runtime, one_shot_pass)
    open_count = sum(1 for b in blockers if b["status"] == "open")

    adm_u01_go = (adm_u01 or {}).get("release_gate") == "GO"
    adm_u02_go = (adm_u02 or {}).get("release_gate") == "GO"
    p0_ok = (p0_runtime or {}).get("status") == "CONFIRMED"
    prep_only = prep.get("status") == "READY" and not adm_u01_go

    soak_done = (soak_dir / "COMPLETED.json").is_file()
    admin_go_claim_allowed = soak_done and one_shot_pass and adm_u01_go and p0_ok
    admin_go_gate = load_json(closure_dir / "admin-go-claim-gate.latest.json")
    gate_allowed = (admin_go_gate or {}).get("allowed") is True

    overall = "PASS"
    if not admin_go_claim_allowed or not gate_allowed:
        overall = "PARTIAL" if adm_u01_go and one_shot_pass else "FAIL"
    elif open_count > 0:
        overall = "PARTIAL"

    payload: dict[str, Any] = {
        "schema": "traveltrust.p2fc_post_soak_staging_live_closure.v1",
        "generated_at_utc": utc_now(),
        "phase": "②",
        "soak_completed": (soak_dir / "COMPLETED.json").is_file(),
        "prep_is_not_go": True,
        "prep_status": (prep or {}).get("status"),
        "mr12_one_shot_pass": one_shot_pass,
        "adm_u01_live_go": adm_u01_go,
        "adm_u02_live_go": adm_u02_go,
        "p0_runtime_confirmed": p0_ok,
        "admin_go_ssot": "TT_ADMIN_STAGING_GO_CLAIM",
        "admin_go_claim_allowed": admin_go_claim_allowed and gate_allowed,
        "admin_go_claim_gate_allowed": gate_allowed,
        "admin_go_sequence": "Soak COMPLETED → MR12 PASS → ADM-U01 live GO → P0 runtime CONFIRMED → then Admin GO",
        "blockers": blockers,
        "open_blocker_count": open_count,
        "verdict": overall,
        "live_evidence_roots": {
            "one_shot_checkpoint": str(soak_dir / "post-soak-one-shot/checkpoint.json"),
            "adm_u01": str(closure_dir / "adm-u01-live"),
            "adm_u02": str(closure_dir / "adm-u02-live"),
            "p0_runtime": str(closure_dir / "p0-rbac-bypass-runtime/latest.json"),
        },
        "honest_boundary": "prep READY ≠ GO · only staging live report.json + runtime P0 + checkpoint PASS count",
    }

    out = closure_dir / "staging-live-closure.latest.json"
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (closure_dir / f"staging-live-closure-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    print(
        f"TT_P2FC_POST_SOAK_STAGING_LIVE_CLOSURE: {overall} "
        f"mr12={one_shot_pass} adm_u01_go={adm_u01_go} adm_u02_go={adm_u02_go} "
        f"p0_runtime={p0_ok} admin_go_claim={admin_go_claim_allowed} gate={gate_allowed} "
        f"open_blockers={open_count} prep_only={prep_only}"
    )
    return 0 if overall == "PASS" else 2


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
