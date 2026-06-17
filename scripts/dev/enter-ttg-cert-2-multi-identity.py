#!/usr/bin/env python3
"""Enter Cert #2 Multi Identity Walkthrough (post stats triple-sync freeze)."""
from __future__ import annotations

import datetime
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    cert_stamp_path = ROOT / "evidence/GO_ttg_cert/latest-stamp.txt"
    freeze_stamp_path = ROOT / "evidence/GO_ttg_stats_triple_sync_freeze/latest-stamp.txt"

    if not cert_stamp_path.exists():
        print("enter-cert2: missing GO_ttg_cert session — run init-ttg-cert-execution-session.sh", file=sys.stderr)
        sys.exit(2)

    if not freeze_stamp_path.exists():
        print("enter-cert2: run assert-ttg-stats-triple-sync.sh --write-freeze first", file=sys.stderr)
        sys.exit(2)

    stamp = cert_stamp_path.read_text(encoding="utf-8").strip()
    freeze_stamp = freeze_stamp_path.read_text(encoding="utf-8").strip()
    evid = ROOT / "evidence/GO_ttg_cert" / stamp
    mi_dir = evid / "walkthrough/multi-identity"
    (mi_dir / "recordings").mkdir(parents=True, exist_ok=True)
    (mi_dir / "screenshots").mkdir(parents=True, exist_ok=True)

    cert2 = {
        "cert": 2,
        "name": "Multi Identity Walkthrough",
        "target_tier": "HUMAN_DONE",
        "mtm_ids": [
            "CHK-CORE-02",
            "CHK-CORE-23",
            "CHK-FE-15",
            "CHK-FE-12",
            "CHK-ID-01",
            "CHK-ID-02",
            "CHK-ID-03",
            "CHK-ID-04",
            "CHK-ID-05",
            "CHK-ID-06",
            "CHK-ID-07",
        ],
        "uat_refs": ["B1", "B2", "B3", "B4"],
        "routes": [
            "/me/identities",
            "/me/identities/guide/settings",
            "/me/identities/merchant/settings",
            "/me/identities/region-steward/settings",
            "/me/identities/acquisition/settings",
            "/governance?view=region",
        ],
        "evidence_subdir": "walkthrough/multi-identity",
        "signoff_file": "MULTI-IDENTITY-WALKTHROUGH-SIGNOFF.json",
        "signoff_command": (
            f'bash scripts/dev/complete-ttg-cert-step.sh --cert 2 --stamp {stamp} --signer "Sebastian Ward"'
        ),
    }

    entry = {
        "program": "TTG_CERT_EXECUTION",
        "phase": "②",
        "stats_triple_sync_freeze": f"evidence/GO_ttg_stats_triple_sync_freeze/{freeze_stamp}",
        "cert_session": f"evidence/GO_ttg_cert/{stamp}",
        "active_cert": 2,
        "frozen_workstreams": [
            "TT_REPOSITORY_ALIGNMENT_CLEANUP_PROGRAM",
            "TT_FULL_SYSTEM_ALIGNMENT_STABILITY_PROGRAM",
            "MTM/Final Closure stats doc edits",
        ],
        "allowed_workstreams": [
            "Cert #2 Multi Identity Human walkthrough",
            "Cert #3-#12 Human/Ops/DR signoff track",
            "Phase B when unpaused",
        ],
        "cert2": cert2,
        "prepared_at_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    entry_path = evid / "CERT-2-MULTI-IDENTITY-ENTRY.v1.json"
    entry_path.write_text(json.dumps(entry, indent=2, ensure_ascii=False), encoding="utf-8")
    print("TTG_CERT2_ENTRY: OK", entry_path)

    manifest_path = evid / "SESSION-MANIFEST.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    else:
        manifest = {"session_id": "GO_ttg_cert", "stamp_utc": stamp}

    manifest["cert_queue"] = "1/12 · active=2"
    manifest["stats_triple_sync_freeze"] = f"evidence/GO_ttg_stats_triple_sync_freeze/{freeze_stamp}"
    manifest["next_step"] = (
        "Cert #2 Multi Identity — walkthrough/multi-identity recordings + "
        "MULTI-IDENTITY-WALKTHROUGH-SIGNOFF.json"
    )
    manifest["frozen"] = ["repo-align", "full-system-align", "stats-doc-edits"]
    manifest["signoff_command"] = cert2["signoff_command"]
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"TTG_CERT2: ENTERED cert=2 session={stamp}")
    print(f"Prep: {mi_dir}/")
    print(f"Entry: {entry_path}")


if __name__ == "__main__":
    main()
