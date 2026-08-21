#!/usr/bin/env python3
"""Freeze V9_AUDIT_CANDIDATE_DESIGN_LOCK from Design Lock Sepolia PASS. Does NOT inherit R2_FINAL."""
from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_ttg_v9_design_lock_sepolia"
AUDIT = ROOT / "evidence" / "GO_ttg_v9_audit"
PASS = EV / "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP.json"
OUT = AUDIT / "V9_AUDIT_CANDIDATE_DESIGN_LOCK.json"
MANIFEST = AUDIT / "V9_AUDIT_CANDIDATE_DESIGN_LOCK.manifest.json"


def sha256(p: Path) -> str:
    return "sha256:" + hashlib.sha256(p.read_bytes()).hexdigest()


def main() -> None:
    if not PASS.is_file():
        raise SystemExit(f"missing {PASS}")
    stop = json.loads(PASS.read_text(encoding="utf-8"))
    if stop.get("stamp") != "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP":
        raise SystemExit("invalid Sepolia STOP stamp")
    if stop.get("inherits_r2_final_audit_pass") is not False:
        raise SystemExit("must explicitly not inherit R2_FINAL")

    candidate = {
        "candidate_id": "V9_AUDIT_CANDIDATE_DESIGN_LOCK",
        "frozen_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "status": "FROZEN_FOR_EXTERNAL_AUDIT",
        "phase": "2_sepolia_design_lock",
        "baseline": "TT-TTG-V9-OWNER-DESIGN-LOCK + V9_DESIGN_LOCK_LOCAL_PASS",
        "sepolia_pass": "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP",
        "sepolia_pass_sha256": sha256(PASS),
        "inherits_r2_final_audit_pass": False,
        "supersedes_for_fee_root_stake_topology": "V9_AUDIT_CANDIDATE_R2_FINAL",
        "r2_final_status": "SUPERSEDED_AS_ACTIVE_AUDIT_BASELINE_FOR_DESIGN_LOCK_TOPOLOGY",
        "mainnet_broadcast": "FORBIDDEN",
        "tt_production_go": "UNCHANGED_NO_AUTO_FLIP",
        "stop_after_freeze": True,
        "addresses": stop.get("addresses", {}),
        "checks": stop.get("checks", {}),
        "next_human_gate": "3x independent AI security audits on THIS candidate only — then Owner Mainnet auth (separate)",
    }
    AUDIT.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(candidate, indent=2) + "\n", encoding="utf-8")
    manifest = {
        "candidate_id": candidate["candidate_id"],
        "artifact": str(OUT.relative_to(ROOT)).replace("\\", "/"),
        "sha256": sha256(OUT),
        "frozen_at": candidate["frozen_at"],
        "inherits_r2_final_audit_pass": False,
        "stop": True,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("FROZEN", OUT)
    print("MANIFEST", MANIFEST)
    print("STOP · Mainnet FORBIDDEN · TT_PRODUCTION_GO unchanged · R2_FINAL not inherited")


if __name__ == "__main__":
    main()
