#!/usr/bin/env python3
"""Enter Cert #5 Finance Walkthrough."""
from __future__ import annotations

import datetime
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    cert_stamp_path = ROOT / "evidence/GO_ttg_cert/latest-stamp.txt"
    if not cert_stamp_path.exists():
        print("enter-cert5: missing GO_ttg_cert session", file=sys.stderr)
        sys.exit(2)

    stamp = cert_stamp_path.read_text(encoding="utf-8").strip()
    evid = ROOT / "evidence/GO_ttg_cert" / stamp
    cert4 = evid / "walkthrough/safe/SAFE-WALKTHROUGH-SIGNOFF.json"
    if not cert4.is_file():
        print("enter-cert5: Cert #4 signoff required", file=sys.stderr)
        sys.exit(2)

    fl = ROOT / "evidence/GO_tt_country_pool_revenue_enterprise_hat/20260616T084248Z/four-ledger-reconcile.json"
    if not fl.is_file():
        print("enter-cert5: missing four-ledger evidence", file=sys.stderr)
        sys.exit(2)
    if json.loads(fl.read_text(encoding="utf-8")).get("verdict") != "PASS":
        print("enter-cert5: four-ledger must be PASS", file=sys.stderr)
        sys.exit(2)

    fin_dir = evid / "walkthrough/finance"
    (fin_dir / "recordings").mkdir(parents=True, exist_ok=True)
    (fin_dir / "screenshots").mkdir(parents=True, exist_ok=True)

    entry_path = evid / "CERT-5-FINANCE-WALKTHROUGH-ENTRY.v1.json"
    entry_path.write_text(
        json.dumps(
            {
                "program": "TTG_CERT_EXECUTION",
                "phase": "②",
                "active_cert": 5,
                "cert4_signoff": str(cert4.relative_to(ROOT)).replace("\\", "/"),
                "four_ledger": str(fl.relative_to(ROOT)).replace("\\", "/"),
                "cert5": {
                    "cert": 5,
                    "name": "Finance Walkthrough",
                    "target_tier": "OPS_DONE",
                    "mtm_ids": ["CHK-CORE-15", "CHK-OPS-02", "CHK-ID-09", "CHK-FN-11"],
                    "roles": ["Finance Operator", "Treasury Operator", "Auditor"],
                    "gorp": "GORP-05 · W-F1～W-F5",
                    "evidence_subdir": "walkthrough/finance",
                    "signoff_file": "FINANCE-WALKTHROUGH-SIGNOFF.json",
                },
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
    manifest["cert_queue"] = "4/12 · active=5"
    manifest["next_step"] = "Cert #5 Finance → FINANCE-WALKTHROUGH-SIGNOFF.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"TTG_CERT5: ENTERED cert=5 session={stamp}")


if __name__ == "__main__":
    main()
