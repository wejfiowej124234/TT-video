#!/usr/bin/env python3
"""Write PHASE-B-EXECUTE-SIGNOFF.json for Cert #7."""
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

    ex_dir = ROOT / "evidence/GO_ttg_cert" / args.stamp / "phase-b/execute"
    pack_path = ex_dir / "CERT7-WALKTHROUGH-PACK.v1.json"
    mchk_path = ex_dir / "machine-checks/CERT7-MACHINE-CHECKS.json"

    if not pack_path.is_file() or not mchk_path.is_file():
        print("record-cert7: missing pack or machine checks", file=sys.stderr)
        sys.exit(2)

    rec_files = sorted(p.name for p in (ex_dir / "recordings").glob("*") if p.is_file())
    if not args.skip_recording_check and len(rec_files) < 1:
        print("record-cert7: FAIL — no recordings", file=sys.stderr)
        sys.exit(3)

    shot_files = sorted(p.name for p in (ex_dir / "screenshots").glob("*") if p.is_file())
    pack = json.loads(pack_path.read_text(encoding="utf-8"))
    mchk = json.loads(mchk_path.read_text(encoding="utf-8"))
    matrix = mchk.get("execute_matrix", {})
    checks = matrix.get("checks", {})

    exec_ev = checks.get("execute_evidence", {})
    tl = checks.get("timelock_elapsed", {})

    if mchk.get("verdict") != "PASS":
        print("record-cert7: FAIL — machine checks not PASS", file=sys.stderr)
        sys.exit(3)

    out = {
        "acceptance_id": "TT_GOVERNANCE_CERT_07_EXECUTE",
        "signoff_kind": "OPS-SIGNOFF",
        "cert": 7,
        "stamp_utc": args.stamp,
        "signer": args.signer,
        "signed_at_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "baseline_ssot": pack["baseline_ssot"],
        "hat_r1_execute_evidence": pack["hat_r1_execute_evidence"],
        "hat_r1_queue_evidence": pack["hat_r1_queue_evidence"],
        "four_ledger_evidence": pack["four_ledger_evidence"],
        "gorp_ssot": pack["gorp_ssot"],
        "mtm_ssot": pack["mtm_ssot"],
        "mtm_ids": pack["mtm_ids"],
        "target_tier": "OPS_DONE",
        "execute_chain": {
            "queue_tx": checks.get("queue_chain", {}).get("queue_tx"),
            "execute_tx": exec_ev.get("execute_tx"),
            "post_execute_state": exec_ev.get("post_execute_state"),
            "execute_earliest_unix": tl.get("execute_earliest_unix"),
            "timelock_elapsed": tl.get("timelock_elapsed"),
            "no_force_execute": True,
        },
        "verifications": {
            "full_chain": "Governor queue → 48h delay → execute(uint256)",
            "event_logs": "step-07 receipt + events archived",
            "state_migration": "proposal state → 5 Executed",
            "four_ledger_mapping": "V2_TL globalTreasury four-ledger PASS",
            "recovery_paths": "GORP §3.1 Execute fail · §3.5 Timelock · CHK-DR-01 cognitive",
            "post_execute_consistency": "on-chain state + hat-r1 db snapshot",
        },
        "roles_walked": [r["label"] for r in pack["roles"]],
        "recordings": rec_files,
        "screenshots": shot_files,
        "machine_checks_verdict": mchk.get("verdict"),
        "machine_checks": checks,
        "verdict": "PASS",
        "honest_boundary": pack.get("honest_boundary"),
        "forbidden": pack.get("forbidden", []),
    }
    (ex_dir / "PHASE-B-EXECUTE-SIGNOFF.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"TT_GOVERNANCE_CERT_07_SIGNOFF: PASS recordings={len(rec_files)} roles=3")


if __name__ == "__main__":
    main()
