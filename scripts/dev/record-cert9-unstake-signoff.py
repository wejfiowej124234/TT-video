#!/usr/bin/env python3
"""Write PHASE-B-UNSTAKE-SIGNOFF.json for Cert #9."""
from __future__ import annotations

import argparse
import datetime
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "dev" / "lib"))
from hat_r1_resolve import resolve_hat_r1_evid_dir, hat_r1_rel_path  # noqa: E402

CERT9_IDS = ["CHK-SC-06", "CHK-CORE-10", "CHK-FE-12"]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--signer", required=True)
    ap.add_argument("--skip-recording-check", action="store_true")
    args = ap.parse_args()

    ts_dir = ROOT / "evidence/GO_ttg_cert" / args.stamp / "phase-b/unstake"
    ts_dir.mkdir(parents=True, exist_ok=True)
    hat_dir = resolve_hat_r1_evid_dir(ROOT)
    exit_read = hat_dir / "step-10-unstake/exit-read.json"
    if not exit_read.is_file():
        print("record-cert9: missing HAT step-10-unstake/exit-read.json", file=sys.stderr)
        sys.exit(2)

    rec_files = sorted(p.name for p in (ts_dir / "recordings").glob("*") if p.is_file())
    if not args.skip_recording_check and len(rec_files) < 1:
        print("record-cert9: FAIL — no recordings (use --skip-recording-check for chain-only)", file=sys.stderr)
        sys.exit(3)

    exit_data = json.loads(exit_read.read_text(encoding="utf-8"))
    out = {
        "acceptance_id": "TT_GOVERNANCE_CERT_09_UNSTAKE",
        "signoff_kind": "OPS-SIGNOFF",
        "cert": 9,
        "stamp_utc": args.stamp,
        "signer": args.signer,
        "signed_at_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "baseline_ssot": "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md",
        "mtm_ids": CERT9_IDS,
        "target_tier": "OPS_DONE",
        "unstake_chain": {
            "request_release_tx": exit_data.get("request_release_tx"),
            "releasable_now": exit_data.get("releasable_now"),
            "jurisdiction": exit_data.get("jurisdiction"),
        },
        "hat_r1_evidence": hat_r1_rel_path(ROOT, hat_dir) + "/step-10-unstake/",
        "recordings": rec_files,
        "verdict": "PASS",
        "honest_boundary": "requestRelease recorded; claimReleased after vest delay per protocol-ssot",
    }
    (ts_dir / "PHASE-B-UNSTAKE-SIGNOFF.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print("TT_GOVERNANCE_CERT_09_SIGNOFF: PASS")


if __name__ == "__main__":
    main()
