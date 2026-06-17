#!/usr/bin/env python3
"""Enter Cert #4 Safe Walkthrough (requires Cert #3 + GovFreeze V2 baseline)."""
from __future__ import annotations

import datetime
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    cert_stamp_path = ROOT / "evidence/GO_ttg_cert/latest-stamp.txt"
    baseline = ROOT / "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md"

    if not cert_stamp_path.exists():
        print("enter-cert4: missing GO_ttg_cert session", file=sys.stderr)
        sys.exit(2)
    if not baseline.is_file():
        print("enter-cert4: missing GovFreeze V2 baseline", file=sys.stderr)
        sys.exit(2)

    stamp = cert_stamp_path.read_text(encoding="utf-8").strip()
    evid = ROOT / "evidence/GO_ttg_cert" / stamp
    cert3_signoff = evid / "walkthrough/admin/ADMIN-WALKTHROUGH-SIGNOFF.json"
    if not cert3_signoff.is_file():
        print("enter-cert4: Cert #3 ADMIN-WALKTHROUGH-SIGNOFF required", file=sys.stderr)
        sys.exit(2)

    safe_dir = evid / "walkthrough/safe"
    (safe_dir / "recordings").mkdir(parents=True, exist_ok=True)
    (safe_dir / "screenshots").mkdir(parents=True, exist_ok=True)

    cert4 = {
        "cert": 4,
        "name": "Safe Walkthrough",
        "target_tier": "OPS_DONE",
        "mtm_ids": ["CHK-CORE-17", "CHK-OPS-03", "CHK-ID-10", "CHK-SC-12"],
        "roles": ["Safe Signer", "Treasury Operator", "Finance Operator"],
        "gorp": "GORP-06 · RB-G-09 · §2.1～§3.2",
        "evidence_subdir": "walkthrough/safe",
        "signoff_file": "SAFE-WALKTHROUGH-SIGNOFF.json",
        "signoff_command": (
            f'bash scripts/dev/complete-ttg-cert-step.sh --cert 4 --stamp {stamp} --signer "Sebastian Ward"'
        ),
    }

    entry_path = evid / "CERT-4-SAFE-WALKTHROUGH-ENTRY.v1.json"
    entry_path.write_text(
        json.dumps(
            {
                "program": "TTG_CERT_EXECUTION",
                "phase": "②",
                "active_cert": 4,
                "baseline": str(baseline.relative_to(ROOT)).replace("\\", "/"),
                "cert3_signoff": str(cert3_signoff.relative_to(ROOT)).replace("\\", "/"),
                "cert4": cert4,
                "prepared_at_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    manifest_path = evid / "SESSION-MANIFEST.json"
    manifest = (
        json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest_path.exists()
        else {"session_id": "GO_ttg_cert", "stamp_utc": stamp}
    )
    manifest["cert_queue"] = "3/12 · active=4"
    manifest["next_step"] = "Cert #4 Safe — walkthrough/safe → SAFE-WALKTHROUGH-SIGNOFF.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"TTG_CERT4: ENTERED cert=4 session={stamp}")


if __name__ == "__main__":
    main()
