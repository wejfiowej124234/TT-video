#!/usr/bin/env python3
"""Freeze V9_AUDIT_CANDIDATE bytecode/config manifest (ttg_v9 profile)."""
from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTRACTS = ROOT / "contracts"
OUT = CONTRACTS / "out-ttg-v9"
SRC = CONTRACTS / "src" / "ttg-v9"
EVIDENCE = ROOT / "evidence" / "GO_ttg_v9_audit"

CORE = [
    "TravelTrustGovernanceTokenV9.sol/TravelTrustGovernanceTokenV9.json",
    "TtgPublicSaleVault.sol/TtgPublicSaleVault.json",
    "TtgBatchPrimaryMarket.sol/TtgBatchPrimaryMarket.json",
    "TravelTrustGovernorV9.sol/TravelTrustGovernorV9.json",
    "TtgV9ERC1967Proxy.sol/TtgV9ERC1967Proxy.json",
    "TtgV9UUPSUpgradeable.sol/TtgV9UUPSUpgradeable.json",
    "TtgV9DeployTopology.sol/TtgV9DeployTopology.json",
    "TtgV9Constants.sol/TtgV9Constants.json",
    "TtgV9GovernanceParams.sol/TtgV9GovernanceParams.json",
    "TtgV9DaoProposalThresholds.sol/TtgV9DaoProposalThresholds.json",
]


def sha256_bytes(b: bytes) -> str:
    return "sha256:" + hashlib.sha256(b).hexdigest()


def sha256_file(p: Path) -> str:
    return sha256_bytes(p.read_bytes())


def hex_obj_hash(hex_obj: str):
    if not hex_obj or hex_obj in ("0x", "0x0"):
        return None
    raw = hex_obj[2:] if hex_obj.startswith("0x") else hex_obj
    if not raw:
        return None
    return sha256_bytes(bytes.fromhex(raw))


def main() -> None:
    artifacts = []
    for rel in CORE:
        p = OUT / rel
        if not p.exists():
            artifacts.append({"path": rel, "missing": True})
            continue
        data = json.loads(p.read_text(encoding="utf-8"))
        bytecode = (data.get("bytecode") or {}).get("object") or ""
        deployed = (data.get("deployedBytecode") or {}).get("object") or ""
        artifacts.append(
            {
                "artifact": rel,
                "contract": Path(rel).stem,
                "bytecode_sha256": hex_obj_hash(bytecode),
                "deployedBytecode_sha256": hex_obj_hash(deployed),
                "bytecode_len": max(0, (len(bytecode) - 2) // 2) if bytecode.startswith("0x") else len(bytecode) // 2,
            }
        )

    sources = []
    for p in sorted(SRC.rglob("*.sol")):
        sources.append(
            {
                "path": p.relative_to(ROOT).as_posix(),
                "sha256": sha256_file(p),
                "bytes": p.stat().st_size,
            }
        )

    sepolia = ROOT / "evidence" / "GO_ttg_v9_remint_sepolia" / "V9_REMINT_SEPOLIA_PASS_STOP.json"
    sepolia_meta = None
    if sepolia.exists():
        s = json.loads(sepolia.read_text(encoding="utf-8"))
        sepolia_meta = {
            "stamp": s.get("stamp"),
            "path": "evidence/GO_ttg_v9_remint_sepolia/V9_REMINT_SEPOLIA_PASS_STOP.json",
            "sha256": sha256_file(sepolia),
            "addresses": s.get("addresses"),
            "tx_count": len(s.get("transactions") or []),
        }

    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    manifest = {
        "candidate_id": "V9_AUDIT_CANDIDATE",
        "status": "FROZEN_FOR_INTERNAL_AUDIT_WAVE",
        "frozen_at_utc_hint": "2026-08-21",
        "workspace_git_head_at_freeze_tooling": head,
        "note": (
            "Pins V9 Solidity under contracts/src/ttg-v9 + forge artifacts (FOUNDRY_PROFILE=ttg_v9). "
            "Unrelated dirty-tree files are NOT in this freeze. External audit must target this manifest."
        ),
        "compiler": {
            "solc": "0.8.36",
            "profile": "ttg_v9",
            "via_ir": True,
            "optimizer": True,
            "optimizer_runs": 200,
            "evm_version": "paris",
        },
        "ladder": [
            "1_Local_PASS",
            "2_Sepolia_PASS",
            "2_5_Security_Audit_Mainnet_Readiness",
            "Remediation",
            "Sepolia_Regression",
            "3_Mainnet_Owner_auth_only",
        ],
        "gate_before_mainnet": {
            "critical": 0,
            "high": 0,
            "medium": "remediated_or_owner_accepted",
            "sepolia_regression": "PASS",
            "owner_mainnet_auth": "REQUIRED",
        },
        "sepolia_pass": sepolia_meta,
        "sources": sources,
        "artifacts": artifacts,
        "core_contracts_in_scope": [
            "TravelTrustGovernanceTokenV9",
            "TtgPublicSaleVault",
            "TtgBatchPrimaryMarket",
            "TravelTrustGovernorV9",
            "TtgV9UUPSUpgradeable",
            "TtgV9ERC1967Proxy",
            "TtgV9DeployTopology",
        ],
        "out_of_scope_for_mainnet_bytecode": [
            "MockV9Timelock",
            "MockV9Erc20",
            "*V2Harness",
            "TtgV9SepoliaRehearsal",
            "TtgV9RemintSepoliaRehearsal",
        ],
    }

    EVIDENCE.mkdir(parents=True, exist_ok=True)
    path = EVIDENCE / "V9_AUDIT_CANDIDATE_MANIFEST.json"
    path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("wrote", path.as_posix())
    print("sources", len(sources), "artifacts", len([a for a in artifacts if not a.get("missing")]))


if __name__ == "__main__":
    main()
