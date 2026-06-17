#!/usr/bin/env python3
"""Enter Cert #7 Execute walkthrough."""
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
        print("enter-cert7: missing GO_ttg_cert session", file=sys.stderr)
        sys.exit(2)

    stamp = cert_stamp_path.read_text(encoding="utf-8").strip()
    evid = ROOT / "evidence/GO_ttg_cert" / stamp
    cert6 = evid / "phase-b/unpause/PHASE-B-UNPAUSE-SIGNOFF.json"
    if not cert6.is_file():
        print("enter-cert7: Cert #6 signoff required", file=sys.stderr)
        sys.exit(2)

    hat = resolve_hat_r1_evid_dir(ROOT)
    if not (hat / "step-06-queue/timelock-eta.json").is_file():
        print("enter-cert7: HAT-R1 Phase A queue evidence required", file=sys.stderr)
        sys.exit(2)

    ex_dir = evid / "phase-b/execute"
    (ex_dir / "recordings").mkdir(parents=True, exist_ok=True)
    (ex_dir / "screenshots").mkdir(parents=True, exist_ok=True)

    entry_path = evid / "CERT-7-EXECUTE-ENTRY.v1.json"
    entry_path.write_text(
        json.dumps(
            {
                "program": "TTG_CERT_EXECUTION",
                "phase": "②",
                "active_cert": 7,
                "cert6_signoff": str(cert6.relative_to(ROOT)).replace("\\", "/"),
                "hat_r1_queue": str((hat / "step-06-queue").relative_to(ROOT)).replace("\\", "/"),
                "cert7": {
                    "cert": 7,
                    "name": "Execute",
                    "target_tier": "OPS_DONE",
                    "mtm_ids": [
                        "CHK-CORE-07",
                        "CHK-FE-08",
                        "CHK-SC-01",
                        "CHK-SC-02",
                        "CHK-DR-01",
                    ],
                    "requires": [
                        "Timelock elapsed",
                        "HAT_R1_LIVE_WALLET_OK=1",
                        "HAT_R1_PHASE_B_PAUSED=0",
                        "no HAT_R1_FORCE_EXECUTE",
                    ],
                    "execute_script": "scripts/dev/run-cert7-hat-r1-execute-evidence.sh",
                    "evidence_subdir": "phase-b/execute",
                    "signoff_file": "PHASE-B-EXECUTE-SIGNOFF.json",
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
    manifest["cert_queue"] = "6/12 · active=7"
    manifest["next_step"] = "Cert #7 Execute → PHASE-B-EXECUTE-SIGNOFF.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"TTG_CERT7: ENTERED cert=7 session={stamp}")


if __name__ == "__main__":
    main()
