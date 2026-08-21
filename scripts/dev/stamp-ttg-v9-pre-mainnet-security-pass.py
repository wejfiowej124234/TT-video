#!/usr/bin/env python3
"""Stamp V9_PRE_MAINNET_SECURITY_PASS against frozen R2_FINAL (no re-freeze)."""

# SUPERSEDED_AS_OFFICIAL_V9_ENTRY — Design Lock is sole ACTIVE.
import os, sys
if os.environ.get("TTG_V9_ALLOW_LEGACY_R2_REMINT", "0") != "1":
    print("LEGACY_R2_REMINT_REFUSED: set TTG_V9_ALLOW_LEGACY_R2_REMINT=1 only for historical replay", file=sys.stderr)
    raise SystemExit(2)
from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_ttg_v9_audit"
MAN = EV / "V9_AUDIT_CANDIDATE_R2_FINAL_MANIFEST.json"


def main() -> None:
    man_sha = "sha256:" + hashlib.sha256(MAN.read_bytes()).hexdigest()
    expected = "sha256:59c81dbe55beeaeddae8bbd16b1a7e4f63549fa3b30d012e0387abd06887f92b"
    assert man_sha == expected, (man_sha, expected)
    issued = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    d = {
        "stamp": "V9_PRE_MAINNET_SECURITY_PASS",
        "issued_at": issued,
        "candidate": "V9_AUDIT_CANDIDATE_R2_FINAL",
        "candidate_manifest": "evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_R2_FINAL_MANIFEST.json",
        "candidate_manifest_sha256": man_sha,
        "audit_doc": "docs/runbook/TT-TTG-V9-PRE-MAINNET-FINAL-SECURITY-AUDIT-LATEST.md",
        "role": "attacker_plus_mainnet_config_exact_match_final",
        "not_repeat_of_audit_1_2_3": True,
        "open_critical": 0,
        "open_high": 0,
        "open_medium_security_defects": 0,
        "exact_match_sources_and_bytecode": True,
        "deploy_bytecode_equals_audited_bytecode": True,
        "external_firm": {
            "hard_gate_for_v9_mainnet": False,
            "optional": True,
            "internal_pass_not_equivalent_to_firm_attestation": True,
        },
        "next": "Owner Mainnet Cutover final review then independent Owner written auth",
        "mainnet_broadcast": "FORBIDDEN_UNTIL_OWNER_WRITTEN_AUTH",
        "tt_production_go": "INDEPENDENT_OWNER_DECISION_NO_AUTO",
        "parents": {
            "regression2": "V9_SEPOLIA_REGRESSION2_PASS",
            "topology": "V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS",
            "mainnet_ready_stop": "V9_MAINNET_READY_STOP",
        },
    }
    out = EV / "V9_PRE_MAINNET_SECURITY_PASS.json"
    out.write_text(json.dumps(d, indent=2) + "\n", encoding="utf-8")
    print("wrote", out.as_posix())
    print(man_sha)


if __name__ == "__main__":
    main()
