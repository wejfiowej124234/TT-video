#!/usr/bin/env python3
"""Enter Cert #3 Admin Walkthrough (requires RBAC-GAP-LIST=0)."""
from __future__ import annotations

import datetime
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    cert_stamp_path = ROOT / "evidence/GO_ttg_cert/latest-stamp.txt"
    rbac_stamp_path = ROOT / "evidence/GO_admin_rbac_alignment/latest-stamp.txt"

    if not cert_stamp_path.exists():
        print("enter-cert3: missing GO_ttg_cert session", file=sys.stderr)
        sys.exit(2)
    if not rbac_stamp_path.exists():
        print("enter-cert3: missing GO_admin_rbac_alignment — run TT_ADMIN_RBAC_ALIGNMENT_PROGRAM", file=sys.stderr)
        sys.exit(2)

    rbac_stamp = rbac_stamp_path.read_text(encoding="utf-8").strip()
    gap_path = ROOT / "evidence/GO_admin_rbac_alignment" / rbac_stamp / "RBAC-GAP-LIST.v1.json"
    if not gap_path.is_file():
        print("enter-cert3: missing RBAC-GAP-LIST", file=sys.stderr)
        sys.exit(2)
    gap = json.loads(gap_path.read_text(encoding="utf-8"))
    if gap.get("handlers_gap") != 0:
        print(f"enter-cert3: RBAC-GAP-LIST handlers_gap={gap.get('handlers_gap')} (need 0)", file=sys.stderr)
        sys.exit(2)

    stamp = cert_stamp_path.read_text(encoding="utf-8").strip()
    evid = ROOT / "evidence/GO_ttg_cert" / stamp
    admin_dir = evid / "walkthrough/admin"
    (admin_dir / "recordings").mkdir(parents=True, exist_ok=True)
    (admin_dir / "screenshots").mkdir(parents=True, exist_ok=True)

    cert3 = {
        "cert": 3,
        "name": "Admin Walkthrough",
        "target_tier": "HUMAN_DONE",
        "mtm_ids": [
            "CHK-CORE-03",
            "CHK-CORE-24",
            "CHK-FE-14",
            "CHK-ADM-01",
            "CHK-ADM-02",
            "CHK-ADM-03",
            "CHK-ADM-04",
            "CHK-ADM-05",
            "CHK-ADM-06",
            "CHK-ADM-07",
        ],
        "uat_refs": ["C1", "C2"],
        "console_roles": ["SuperAdmin", "Finance", "Risk", "Ops", "Auditor"],
        "rbac_alignment": f"evidence/GO_admin_rbac_alignment/{rbac_stamp}",
        "evidence_subdir": "walkthrough/admin",
        "signoff_file": "ADMIN-WALKTHROUGH-SIGNOFF.json",
        "signoff_command": (
            f'bash scripts/dev/complete-ttg-cert-step.sh --cert 3 --stamp {stamp} --signer "Sebastian Ward"'
        ),
    }

    entry_path = evid / "CERT-3-ADMIN-WALKTHROUGH-ENTRY.v1.json"
    entry_path.write_text(
        json.dumps(
            {
                "program": "TTG_CERT_EXECUTION",
                "phase": "②",
                "active_cert": 3,
                "rbac_gap_list_zero": True,
                "rbac_alignment_stamp": rbac_stamp,
                "cert3": cert3,
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
    manifest["cert_queue"] = "2/12 · active=3"
    manifest["rbac_alignment"] = f"evidence/GO_admin_rbac_alignment/{rbac_stamp}"
    manifest["next_step"] = "Cert #3 Admin — walkthrough/admin → ADMIN-WALKTHROUGH-SIGNOFF.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"TTG_CERT3: ENTERED cert=3 session={stamp} rbac={rbac_stamp}")


if __name__ == "__main__":
    main()
