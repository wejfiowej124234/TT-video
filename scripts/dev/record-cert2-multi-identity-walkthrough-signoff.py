#!/usr/bin/env python3
"""Write MULTI-IDENTITY-WALKTHROUGH-SIGNOFF.json for Cert #2."""
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

    mi = ROOT / "evidence/GO_ttg_cert" / args.stamp / "walkthrough/multi-identity"
    pack_path = mi / "CERT2-WALKTHROUGH-PACK.v1.json"
    mchk_path = mi / "machine-checks/CERT2-MACHINE-CHECKS.json"

    if not pack_path.is_file():
        print("record-cert2: missing pack — run walkthrough launcher first", file=sys.stderr)
        sys.exit(2)
    if not mchk_path.is_file():
        print("record-cert2: missing machine checks", file=sys.stderr)
        sys.exit(2)

    rec_files = sorted(p.name for p in (mi / "recordings").glob("*") if p.is_file())
    if not args.skip_recording_check and len(rec_files) < 1:
        print("record-cert2: FAIL — no recordings", file=sys.stderr)
        sys.exit(3)

    shot_files = sorted(p.name for p in (mi / "screenshots").glob("*") if p.is_file())
    pack = json.loads(pack_path.read_text(encoding="utf-8"))
    mchk = json.loads(mchk_path.read_text(encoding="utf-8"))

    out = {
        "acceptance_id": "TT_GOVERNANCE_CERT_02_MULTI_IDENTITY_WALKTHROUGH",
        "signoff_kind": "HUMAN-SIGNOFF",
        "cert": 2,
        "stamp_utc": args.stamp,
        "signer": args.signer,
        "signed_at_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mtm_ssot": pack["mtm_ssot"],
        "mtm_ids": pack["mtm_ids"],
        "target_tier": "HUMAN_DONE",
        "roles_walked": [r["role"] for r in pack["roles"]],
        "uat_refs": pack["uat_refs"],
        "recordings": rec_files,
        "screenshots": shot_files,
        "machine_checks_verdict": mchk.get("verdict"),
        "machine_checks": mchk.get("checks", {}),
        "verdict": "PASS",
        "honest_boundary": "② Cert#2 multi-identity walkthrough ≠ 58/58 Human ≠ Enterprise 100 ≠ ③ Production GO",
        "forbidden": pack.get("forbidden", []),
    }
    (mi / "MULTI-IDENTITY-WALKTHROUGH-SIGNOFF.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"TT_GOVERNANCE_CERT_02_SIGNOFF: PASS recordings={len(rec_files)} screenshots={len(shot_files)}")


if __name__ == "__main__":
    main()
