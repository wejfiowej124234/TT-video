#!/usr/bin/env python3
"""Write PHASE-B-TREASURY-SPEND-SIGNOFF.json for Cert #8."""
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

    ts_dir = ROOT / "evidence/GO_ttg_cert" / args.stamp / "phase-b/treasury-spend"
    pack_path = ts_dir / "CERT8-WALKTHROUGH-PACK.v1.json"
    mchk_path = ts_dir / "machine-checks/CERT8-MACHINE-CHECKS.json"
    if not pack_path.is_file() or not mchk_path.is_file():
        print("record-cert8: missing pack or machine checks", file=sys.stderr)
        sys.exit(2)

    rec_files = sorted(p.name for p in (ts_dir / "recordings").glob("*") if p.is_file())
    if not args.skip_recording_check and len(rec_files) < 1:
        print("record-cert8: FAIL — no recordings", file=sys.stderr)
        sys.exit(3)

    pack = json.loads(pack_path.read_text(encoding="utf-8"))
    mchk = json.loads(mchk_path.read_text(encoding="utf-8"))
    matrix = mchk.get("treasury_matrix", {})
    checks = matrix.get("checks", {})
    if mchk.get("verdict") != "PASS":
        print("record-cert8: FAIL — machine checks not PASS", file=sys.stderr)
        sys.exit(3)

    out = {
        "acceptance_id": "TT_GOVERNANCE_CERT_08_TREASURY_SPEND",
        "signoff_kind": "OPS-SIGNOFF",
        "cert": 8,
        "stamp_utc": args.stamp,
        "signer": args.signer,
        "signed_at_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "baseline_ssot": pack["baseline_ssot"],
        "mtm_ids": pack["mtm_ids"],
        "target_tier": "OPS_DONE",
        "treasury_chain": {
            "proposal_id": checks.get("treasury_proposal", {}).get("proposal_id"),
            "execute_tx": checks.get("treasury_execute", {}).get("execute_tx"),
            "post_execute_state": checks.get("treasury_execute", {}).get("post_execute_state"),
        },
        "recordings": rec_files,
        "machine_checks_verdict": mchk.get("verdict"),
        "verdict": "PASS",
        "honest_boundary": pack.get("honest_boundary"),
    }
    (ts_dir / "PHASE-B-TREASURY-SPEND-SIGNOFF.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print("TT_GOVERNANCE_CERT_08_SIGNOFF: PASS")


if __name__ == "__main__":
    main()
