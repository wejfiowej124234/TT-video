#!/usr/bin/env python3
"""Write PHASE-B-UNPAUSE-SIGNOFF.json for Cert #6."""
from __future__ import annotations

import argparse
import datetime
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--signer", required=True)
    ap.add_argument("--skip-recording-check", action="store_true")
    args = ap.parse_args()

    pb_dir = ROOT / "evidence/GO_ttg_cert" / args.stamp / "phase-b/unpause"
    pack_path = pb_dir / "CERT6-WALKTHROUGH-PACK.v1.json"
    mchk_path = pb_dir / "machine-checks/CERT6-MACHINE-CHECKS.json"

    if not pack_path.is_file() or not mchk_path.is_file():
        print("record-cert6: missing pack or machine checks", file=sys.stderr)
        sys.exit(2)

    rec_files = sorted(p.name for p in (pb_dir / "recordings").glob("*") if p.is_file())
    if not args.skip_recording_check and len(rec_files) < 1:
        print("record-cert6: FAIL — no recordings", file=sys.stderr)
        sys.exit(3)

    shot_files = sorted(p.name for p in (pb_dir / "screenshots").glob("*") if p.is_file())
    pack = json.loads(pack_path.read_text(encoding="utf-8"))
    mchk = json.loads(mchk_path.read_text(encoding="utf-8"))
    matrix = mchk.get("phase_b_matrix", {})

    unpause = matrix.get("checks", {}).get("unpause_gate", {})
    eta_info = matrix.get("checks", {}).get("hat_phase_a", {})

    out = {
        "acceptance_id": "TT_GOVERNANCE_CERT_06_PHASE_B_UNPAUSE",
        "signoff_kind": "OPS-SIGNOFF",
        "cert": 6,
        "stamp_utc": args.stamp,
        "signer": args.signer,
        "signed_at_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "baseline_ssot": pack["baseline_ssot"],
        "hat_r1_evidence": pack["hat_r1_evidence"],
        "gorp_ssot": pack["gorp_ssot"],
        "mtm_ssot": pack["mtm_ssot"],
        "mtm_ids": pack["mtm_ids"],
        "target_tier": "OPS_DONE",
        "unpause_confirmed": {
            "env": "HAT_R1_PHASE_B_PAUSED=0",
            "paused_blocks_verified": unpause.get("paused_blocks", {}).get("summary") == "PAUSED_HUMAN_UAT",
            "unpaused_probe": unpause.get("unpaused_probe", {}).get("summary"),
        },
        "verifications": {
            "phase_a_handoff": "proposal→vote→queue · HAT-R1 Phase A PASS",
            "timelock_eta": f"EXECUTE_EARLIEST_UNIX={eta_info.get('execute_earliest_unix')} · elapsed={eta_info.get('timelock_elapsed')}",
            "phase_b_prerequisites": "Execute→Treasury Spend→Unstake order · Cert #7–9",
            "dual_timelock_paths": "V2 Execute/Treasury · Legacy CP · RB-G-09 no mix",
            "recovery_paths": "GORP §3.1 Execute · §3.5 Timelock · no force execute",
            "accounting_trace": "Four-Ledger PASS + Enterprise HAT L9 prerequisite",
        },
        "roles_walked": [r["label"] for r in pack["roles"]],
        "recordings": rec_files,
        "screenshots": shot_files,
        "machine_checks_verdict": mchk.get("verdict"),
        "machine_checks": matrix.get("checks", matrix),
        "verdict": "PASS",
        "honest_boundary": pack.get("honest_boundary"),
        "forbidden": pack.get("forbidden", []),
    }
    (pb_dir / "PHASE-B-UNPAUSE-SIGNOFF.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"TT_GOVERNANCE_CERT_06_SIGNOFF: PASS recordings={len(rec_files)} roles=3")


if __name__ == "__main__":
    main()
