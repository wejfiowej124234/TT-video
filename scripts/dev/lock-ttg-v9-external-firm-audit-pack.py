#!/usr/bin/env python3
"""Lock V9 R2_FINAL external-firm audit pack (read-only vs candidate; no re-freeze)."""

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


def sha256_bytes(b: bytes) -> str:
    return "sha256:" + hashlib.sha256(b).hexdigest()


def file_entry(rel: str) -> dict:
    p = ROOT / rel
    if not p.exists():
        return {"path": rel, "missing": True, "required": True}
    b = p.read_bytes()
    return {
        "path": Path(rel).as_posix(),
        "bytes": len(b),
        "sha256": sha256_bytes(b),
        "required": True,
        "missing": False,
    }


def main() -> None:
    assert MAN.exists(), "R2_FINAL manifest missing"
    man_bytes = MAN.read_bytes()
    man_sha = sha256_bytes(man_bytes)
    m = json.loads(man_bytes.decode("utf-8"))
    assert m["candidate_id"] == "V9_AUDIT_CANDIDATE_R2_FINAL"

    pack_files = [
        "evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_R2_FINAL_MANIFEST.json",
        "evidence/GO_ttg_v9_audit/V9_SEPOLIA_REGRESSION2_PASS.json",
        "evidence/GO_ttg_v9_audit/V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS.json",
        "evidence/GO_ttg_v9_audit/V9_MAINNET_READY_STOP.json",
        "evidence/GO_ttg_v9_audit/V9_SEPOLIA_REGRESSION_PASS.json",
        "docs/runbook/TT-TTG-V9-SECURITY-AUDIT-LADDER-LATEST.md",
        "docs/runbook/TT-TTG-V9-INTERNAL-AUDIT-WAVE-FINDINGS-LATEST.md",
        "docs/runbook/TT-TTG-V9-RED-TEAM-AUDIT2-FINDINGS-LATEST.md",
        "docs/runbook/TT-TTG-V9-MAINNET-RELEASE-AUDIT3-FINDINGS-LATEST.md",
        "docs/runbook/TT-TTG-V9-OFFICIAL-FULL-TOPOLOGY-AUDIT-LATEST.md",
        "docs/runbook/TT-TTG-V9-OWNER-MAINNET-GATE-LATEST.md",
        "docs/runbook/TT-TTG-V9-MONETARY-INVARIANT-LATEST.md",
        "docs/runbook/TT-TTG-V9-REMINT-FINAL-NORM-G1-G7-LATEST.md",
    ]
    entries = [file_entry(r) for r in pack_files]
    missing = [e for e in entries if e.get("missing")]
    assert not missing, missing

    drift = []
    for s in m.get("sources") or []:
        p = ROOT / s["path"]
        if not p.exists():
            drift.append({"path": s["path"], "error": "missing"})
            continue
        h = sha256_bytes(p.read_bytes())
        if h != s.get("sha256"):
            drift.append({"path": s["path"], "manifest": s.get("sha256"), "disk": h})

    for a in m.get("artifacts") or []:
        if a.get("missing"):
            continue
        rel = a.get("artifact")
        if not rel:
            continue
        p = ROOT / "contracts" / "out-ttg-v9" / rel
        if not p.exists():
            drift.append({"artifact": rel, "error": "missing_out"})
            continue
        data = json.loads(p.read_text(encoding="utf-8"))
        bc = (data.get("bytecode") or {}).get("object") or ""
        raw = bc[2:] if bc.startswith("0x") else bc
        if not raw:
            continue
        h = sha256_bytes(bytes.fromhex(raw))
        if a.get("bytecode_sha256") and h != a["bytecode_sha256"]:
            drift.append(
                {"artifact": rel, "manifest_bc": a.get("bytecode_sha256"), "disk_bc": h}
            )

    assert not drift, drift

    lock_payload = {
        "candidate_manifest_sha256": man_sha,
        "package_files": [
            {"path": e["path"], "sha256": e["sha256"], "bytes": e["bytes"]} for e in entries
        ],
        "exact_match": True,
    }
    content_lock = sha256_bytes(json.dumps(lock_payload, sort_keys=True).encode("utf-8"))

    pack = {
        "package_id": "V9_EXTERNAL_FIRM_AUDIT_PACK_R2_FINAL",
        "status": "LOCKED_FOR_EXTERNAL_FIRM",
        "locked_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "candidate_id": "V9_AUDIT_CANDIDATE_R2_FINAL",
        "candidate_manifest": "evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_R2_FINAL_MANIFEST.json",
        "candidate_manifest_sha256": man_sha,
        "candidate_frozen_at_utc": m.get("frozen_at_utc"),
        "candidate_status": m.get("status"),
        "package_content_lock_sha256": content_lock,
        "integrity": {"source_and_bytecode_drift_vs_manifest": [], "exact_match": True},
        "scope": {
            "NEW_deep": [
                "TravelTrustGovernanceTokenV9",
                "TravelTrustGovernorV9",
                "TtgPublicSaleVault",
                "TtgBatchPrimaryMarket",
                "TtgV9UUPSUpgradeable",
                "TtgV9ERC1967Proxy",
                "TtgV9DeployTopology",
                "TtgV9AtomicDeployer",
                "TtgV9AtomicDeployerMainnet",
            ],
            "KEEP_reality_integration_privilege": [
                "GovernanceTimelock",
                "P4Cap_USDC_Treasury",
                "EscrowFactoryV2Wired",
                "SettlementRouter",
                "FeeRouter",
                "Safe_Guardian",
            ],
            "call_chains": [
                "User_USDC_to_BatchPM_to_P4Cap",
                "PublicSaleVault_to_BatchPM_to_User_TTG",
                "TTG_to_GovernorV9_to_Vote_to_Timelock_to_Burn",
                "Timelock_to_UUPS_Proxy_to_Implementation",
                "Escrow_to_Settlement_to_FeeRouter_MoneyPath",
            ],
            "v8_legacy_isolation": True,
            "usdc_source_code": "OUT_OF_SCOPE",
            "v8_full_source_reaudit": "OUT_OF_SCOPE_isolation_only",
        },
        "ai_ladder_closed": {
            "open_critical": 0,
            "open_high": 0,
            "regression2": "V9_SEPOLIA_REGRESSION2_PASS",
            "topology_pass": "V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS",
            "mainnet_ready_stop": "V9_MAINNET_READY_STOP",
        },
        "hard_rules": [
            "Do not modify R2_FINAL sources or re-freeze while firm engagement is open",
            "Firm report must cite candidate_manifest_sha256 and package_content_lock_sha256",
            "Any core security-semantic fix after firm kickoff requires NEW candidate + diff audit + regression; prior firm report void for Mainnet claim",
            "External firm PASS does not authorize Mainnet broadcast or TT_PRODUCTION_GO",
            "Owner Mainnet Cutover final review only AFTER firm PASS (when firm elected)",
            "Mainnet broadcast / Production GO only with independent Owner written auth",
        ],
        "sequence": [
            "1_Send_this_locked_pack_to_external_firm",
            "2_Firm_PASS_citing_manifest_SHA",
            "3_Owner_Mainnet_Cutover_final_review",
            "4_Owner_independent_written_auth_only_then_Mainnet",
        ],
        "after_firm_pass_only": {
            "next": "Owner Mainnet Cutover final review",
            "runbook": "docs/runbook/TT-TTG-V9-OWNER-MAINNET-GATE-LATEST.md",
            "mainnet_broadcast": "FORBIDDEN_UNTIL_OWNER_WRITTEN_AUTH",
            "tt_production_go": "FORBIDDEN_AUTO_FLIP",
        },
        "package_files": entries,
        "manifest_source_count": len(m.get("sources") or []),
        "manifest_artifact_count": len(
            [a for a in (m.get("artifacts") or []) if not a.get("missing")]
        ),
        "compiler": m.get("compiler"),
    }

    out = EV / "V9_EXTERNAL_FIRM_AUDIT_PACK_R2_FINAL.json"
    out.write_text(json.dumps(pack, indent=2) + "\n", encoding="utf-8")
    print("wrote", out.as_posix())
    print("manifest_sha", man_sha)
    print("content_lock", content_lock)


if __name__ == "__main__":
    main()
