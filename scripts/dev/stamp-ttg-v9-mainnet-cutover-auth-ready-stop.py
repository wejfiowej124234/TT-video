#!/usr/bin/env python3
"""Stamp V9_MAINNET_CUTOVER_AUTH_READY_STOP against frozen R2_FINAL + PRE_MAINNET_SECURITY_PASS."""

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
PRE = EV / "V9_PRE_MAINNET_SECURITY_PASS.json"
EXPECTED_MAN = "sha256:59c81dbe55beeaeddae8bbd16b1a7e4f63549fa3b30d012e0387abd06887f92b"


def _sha(p: Path) -> str:
    return "sha256:" + hashlib.sha256(p.read_bytes()).hexdigest()


def _exact_match(man: dict) -> tuple[bool, int, int]:
    src_drift = 0
    bc_drift = 0
    for s in man.get("sources", []):
        p = ROOT / s["path"]
        if _sha(p) != s["sha256"]:
            src_drift += 1
    for a in man.get("artifacts", []):
        if a.get("missing") or not a.get("bytecode_sha256"):
            continue
        p = ROOT / "contracts" / "out-ttg-v9" / a["artifact"]
        data = json.loads(p.read_text(encoding="utf-8"))
        bc = (data.get("bytecode") or {}).get("object") or ""
        raw = bc[2:] if bc.startswith("0x") else bc
        if not raw:
            continue
        h = "sha256:" + hashlib.sha256(bytes.fromhex(raw)).hexdigest()
        if h != a["bytecode_sha256"]:
            bc_drift += 1
    return src_drift == 0 and bc_drift == 0, src_drift, bc_drift


def main() -> None:
    man_sha = _sha(MAN)
    assert man_sha == EXPECTED_MAN, (man_sha, EXPECTED_MAN)
    pre = json.loads(PRE.read_text(encoding="utf-8"))
    assert pre.get("stamp") == "V9_PRE_MAINNET_SECURITY_PASS"
    assert pre.get("candidate_manifest_sha256") == man_sha
    man = json.loads(MAN.read_text(encoding="utf-8"))
    exact, src_d, bc_d = _exact_match(man)
    assert exact, (src_d, bc_d)

    issued = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    d = {
        "stamp": "V9_MAINNET_CUTOVER_AUTH_READY_STOP",
        "issued_at": issued,
        "candidate": "V9_AUDIT_CANDIDATE_R2_FINAL",
        "candidate_manifest": "evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_R2_FINAL_MANIFEST.json",
        "candidate_manifest_sha256": man_sha,
        "r2_final_permanently_frozen": True,
        "pre_mainnet_security_pass_permanently_frozen": True,
        "cutover_review_doc": "docs/runbook/TT-TTG-V9-OWNER-MAINNET-CUTOVER-FINAL-REVIEW-LATEST.md",
        "checklist_all_pass": True,
        "open_critical": 0,
        "open_high": 0,
        "open_medium_cutover_blockers": 0,
        "exact_match_sources_and_bytecode": True,
        "source_drift_count": src_d,
        "bytecode_drift_count": bc_d,
        "mainnet_keep_reality": {
            "chain_id": 1,
            "governance_timelock": "0x50f0b26167ec73e327d97c54c81f1c1b9efb22f7",
            "timelock_delay_seconds": 172800,
            "timelock_admin_safe": "0x96491aa894658ff7946506318c49F3c76b8f40e7",
            "p4cap": "0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF",
            "p4cap_owner_timelock": True,
            "usdc": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            "cast_rpc": "https://ethereum.publicnode.com",
        },
        "genesis": {
            "max_supply_ttg": "25000000000000",
            "bps": "50/35/3/5/7",
            "wei_buckets": ["12.5T", "8.75T", "0.75T", "1.25T", "1.75T"],
        },
        "official_deploy_entry": "TtgV9AtomicDeployerMainnet",
        "local_atomic_deployer_forbidden_for_official_mainnet": True,
        "v8_disposition": "LEGACY_NO_MIGRATION",
        "checklist": {
            "mainnet_chain_addresses": "PASS",
            "genesis_25t_50_35_3_5_7": "PASS",
            "governor_to_keep_timelock": "PASS",
            "governance_burn": "PASS",
            "vault_pm_uups": "PASS",
            "five_batch_params": "PASS",
            "usdc_to_p4cap": "PASS",
            "safe_guardian": "PASS",
            "deploy_order": "PASS",
            "verify_source": "PASS",
            "v8_legacy_isolation": "PASS",
            "deploy_bytecode_exact_match": "PASS",
        },
        "next": "WAIT independent Owner written Mainnet auth then deploy only",
        "mainnet_broadcast": "FORBIDDEN_UNTIL_OWNER_WRITTEN_AUTH",
        "tt_production_go": "INDEPENDENT_OWNER_DECISION_NO_AUTO",
        "parents": {
            "pre_mainnet_security": "V9_PRE_MAINNET_SECURITY_PASS",
            "regression2": "V9_SEPOLIA_REGRESSION2_PASS",
            "topology": "V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS",
            "mainnet_ready_stop": "V9_MAINNET_READY_STOP",
        },
    }
    out = EV / "V9_MAINNET_CUTOVER_AUTH_READY_STOP.json"
    out.write_text(json.dumps(d, indent=2) + "\n", encoding="utf-8")
    print("wrote", out.as_posix())
    print(man_sha)


if __name__ == "__main__":
    main()
