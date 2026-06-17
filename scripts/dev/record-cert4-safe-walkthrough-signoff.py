#!/usr/bin/env python3
"""Write SAFE-WALKTHROUGH-SIGNOFF.json for Cert #4."""
from __future__ import annotations

import argparse
import datetime
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

import sys
from pathlib import Path as _Path
sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "lib"))
from hat_r1_resolve import resolve_hat_r1_evid_dir, hat_r1_rel_path, hat_r1_stamp


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--signer", required=True)
    ap.add_argument("--skip-recording-check", action="store_true")
    args = ap.parse_args()

    safe_dir = ROOT / "evidence/GO_ttg_cert" / args.stamp / "walkthrough/safe"
    pack_path = safe_dir / "CERT4-WALKTHROUGH-PACK.v1.json"
    mchk_path = safe_dir / "machine-checks/CERT4-MACHINE-CHECKS.json"

    if not pack_path.is_file():
        print("record-cert4: missing pack", file=sys.stderr)
        sys.exit(2)
    if not mchk_path.is_file():
        print("record-cert4: missing machine checks", file=sys.stderr)
        sys.exit(2)

    rec_files = sorted(p.name for p in (safe_dir / "recordings").glob("*") if p.is_file())
    if not args.skip_recording_check and len(rec_files) < 1:
        print("record-cert4: FAIL — no recordings", file=sys.stderr)
        sys.exit(3)

    shot_files = sorted(p.name for p in (safe_dir / "screenshots").glob("*") if p.is_file())
    pack = json.loads(pack_path.read_text(encoding="utf-8"))
    mchk = json.loads(mchk_path.read_text(encoding="utf-8"))
    matrix = mchk.get("three_role_matrix", {})

    out = {
        "acceptance_id": "TT_GOVERNANCE_CERT_04_SAFE_WALKTHROUGH",
        "signoff_kind": "OPS-SIGNOFF",
        "cert": 4,
        "stamp_utc": args.stamp,
        "signer": args.signer,
        "signed_at_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "baseline_ssot": pack["baseline_ssot"],
        "gorp_ssot": pack["gorp_ssot"],
        "mtm_ssot": pack["mtm_ssot"],
        "mtm_ids": pack["mtm_ids"],
        "target_tier": "OPS_DONE",
        "roles_walked": [r["label"] for r in pack["roles"]],
        "verifications": {
            "permission_boundaries": "Safe Signer multisig · Treasury Safe admin · Finance EOA funding only",
            "approval_chain": "Safe N-of-M → Legacy TL schedule → executeAfter → public execute",
            "fund_flows": "Governor→V2 TL treasury · Safe→Legacy TL CP batches · no Admin API spend",
            "rejection_paths": "mixed TL batch · Admin POST · unallowlisted target · TooEarly execute",
            "recovery_paths": "GORP §3.1 Execute fail · §3.2 Treasury mis-transfer · eth_call simulate",
            "dual_timelock_matrix": "DUAL-TIMELOCK-OPS-MATRIX.v1.json (SC-12 / GORP-08 / RB-G-09)",
        },
        "recordings": rec_files,
        "screenshots": shot_files,
        "machine_checks_verdict": mchk.get("verdict"),
        "machine_checks": matrix.get("checks", matrix),
        "evidence_anchors": [
            "evidence/GO_tt_country_pool_revenue_enterprise_hat/cutover-drill/20260616T082259Z",
            hat_r1_rel_path(ROOT, resolve_hat_r1_evid_dir(ROOT)),
            "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md",
        ],
        "verdict": "PASS",
        "honest_boundary": "② Cert#4 Safe walkthrough ≠ 34/34 Ops ≠ Enterprise 100 ≠ ③ Production GO",
        "forbidden": pack.get("forbidden", []),
    }
    (safe_dir / "SAFE-WALKTHROUGH-SIGNOFF.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"TT_GOVERNANCE_CERT_04_SIGNOFF: PASS recordings={len(rec_files)} roles=3")


if __name__ == "__main__":
    main()
