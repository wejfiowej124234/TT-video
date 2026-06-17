#!/usr/bin/env python3
"""Enter Cert #8 Treasury Spend walkthrough."""
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
        print("enter-cert8: missing GO_ttg_cert session", file=sys.stderr)
        sys.exit(2)

    stamp = cert_stamp_path.read_text(encoding="utf-8").strip()
    evid = ROOT / "evidence/GO_ttg_cert" / stamp
    cert7 = evid / "phase-b/execute/PHASE-B-EXECUTE-SIGNOFF.json"
    hat_exec = resolve_hat_r1_evid_dir(ROOT) / "step-07-execute/tx-execute.json"

    if not hat_exec.is_file():
        print("enter-cert8: Cert #7 execute tx evidence required (step-07-execute)", file=sys.stderr)
        sys.exit(2)

    ts_dir = evid / "phase-b/treasury-spend"
    (ts_dir / "recordings").mkdir(parents=True, exist_ok=True)
    (ts_dir / "screenshots").mkdir(parents=True, exist_ok=True)

    entry_path = evid / "CERT-8-TREASURY-SPEND-ENTRY.v1.json"
    entry_path.write_text(
        json.dumps(
            {
                "program": "TTG_CERT_EXECUTION",
                "phase": "②",
                "active_cert": 8,
                "cert7_signoff_optional": cert7.is_file(),
                "hat_r1_execute": str(hat_exec.relative_to(ROOT)).replace("\\", "/"),
                "cert8": {
                    "cert": 8,
                    "name": "Treasury Spend",
                    "target_tier": "OPS_DONE",
                    "mtm_ids": ["CHK-CORE-08", "CHK-CORE-14", "CHK-FN-02", "CHK-SC-04"],
                    "requires": [
                        "Cert #7 execute on-chain",
                        "HAT_R1_LIVE_WALLET_OK=1",
                        "HAT_R1_PHASE_B_PAUSED=0",
                        "Treasury propose→vote→queue (+ execute after 2nd Timelock)",
                    ],
                    "chain_script": "scripts/dev/run-cert8-hat-r1-treasury-evidence.sh",
                    "evidence_subdir": "phase-b/treasury-spend",
                    "signoff_file": "PHASE-B-TREASURY-SPEND-SIGNOFF.json",
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
    manifest["cert_queue"] = "6/12 · active=8 (after #7 finalize)"
    manifest["next_step"] = "Cert #8 Treasury Spend → PHASE-B-TREASURY-SPEND-SIGNOFF.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"TTG_CERT8: ENTERED cert=8 session={stamp}")


if __name__ == "__main__":
    main()
