#!/usr/bin/env python3
"""Enter Cert #6 Phase B Unpause walkthrough."""
from __future__ import annotations

import datetime
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

sys.path.insert(0, str(ROOT / "scripts" / "dev" / "lib"))
from hat_r1_resolve import resolve_hat_r1_evid_dir, hat_r1_rel_path, hat_r1_stamp


def main() -> None:
    cert_stamp_path = ROOT / "evidence/GO_ttg_cert/latest-stamp.txt"
    if not cert_stamp_path.exists():
        print("enter-cert6: missing GO_ttg_cert session", file=sys.stderr)
        sys.exit(2)

    stamp = cert_stamp_path.read_text(encoding="utf-8").strip()
    evid = ROOT / "evidence/GO_ttg_cert" / stamp
    cert5 = evid / "walkthrough/finance/FINANCE-WALKTHROUGH-SIGNOFF.json"
    if not cert5.is_file():
        print("enter-cert6: Cert #5 signoff required", file=sys.stderr)
        sys.exit(2)

    hat = resolve_hat_r1_evid_dir(ROOT)
    if not (hat / "EXECUTE_EARLIEST_UNIX.txt").is_file():
        print("enter-cert6: missing HAT-R1 Phase A ETA", file=sys.stderr)
        sys.exit(2)
    report = hat / f"hat-r1-report-{hat_r1_stamp(hat)}.json"
    if not report.is_file() or json.loads(report.read_text(encoding="utf-8")).get("verdict") != "PASS":
        print("enter-cert6: HAT-R1 Phase A must be PASS", file=sys.stderr)
        sys.exit(2)

    pb_dir = evid / "phase-b/unpause"
    (pb_dir / "recordings").mkdir(parents=True, exist_ok=True)
    (pb_dir / "screenshots").mkdir(parents=True, exist_ok=True)

    entry_path = evid / "CERT-6-PHASE-B-UNPAUSE-ENTRY.v1.json"
    entry_path.write_text(
        json.dumps(
            {
                "program": "TTG_CERT_EXECUTION",
                "phase": "②",
                "active_cert": 6,
                "cert5_signoff": str(cert5.relative_to(ROOT)).replace("\\", "/"),
                "hat_r1_phase_a": str(hat.relative_to(ROOT)).replace("\\", "/"),
                "cert6": {
                    "cert": 6,
                    "name": "Phase B unpause",
                    "target_tier": "OPS_DONE",
                    "mtm_ids": [
                        "CHK-OPS-11",
                        "CHK-BASE-05",
                        "CHK-CORE-04",
                        "CHK-CORE-05",
                        "CHK-CORE-06",
                    ],
                    "unpause_env": "HAT_R1_PHASE_B_PAUSED=0",
                    "gorp": "GORP-07 · run-hat-r1-phase-b-when-ready.sh",
                    "evidence_subdir": "phase-b/unpause",
                    "signoff_file": "PHASE-B-UNPAUSE-SIGNOFF.json",
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
    manifest["cert_queue"] = "5/12 · active=6"
    manifest["next_step"] = "Cert #6 Phase B unpause → PHASE-B-UNPAUSE-SIGNOFF.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"TTG_CERT6: ENTERED cert=6 session={stamp}")


if __name__ == "__main__":
    main()
