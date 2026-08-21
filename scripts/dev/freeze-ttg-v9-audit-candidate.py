#!/usr/bin/env python3
"""Freeze V9 audit candidate bytecode/config manifest (ttg_v9 profile).

Usage:
  python scripts/dev/freeze-ttg-v9-audit-candidate.py
  python scripts/dev/freeze-ttg-v9-audit-candidate.py --id V9_AUDIT_CANDIDATE_R1_FINAL
"""

# SUPERSEDED_AS_OFFICIAL_V9_ENTRY — Design Lock is sole ACTIVE.
import os, sys
if os.environ.get("TTG_V9_ALLOW_LEGACY_R2_REMINT", "0") != "1":
    print("LEGACY_R2_REMINT_REFUSED: set TTG_V9_ALLOW_LEGACY_R2_REMINT=1 only for historical replay", file=sys.stderr)
    raise SystemExit(2)
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import time
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
    "TtgV9AtomicDeployer.sol/TtgV9AtomicDeployer.json",
    "TtgV9AtomicDeployerMainnet.sol/TtgV9AtomicDeployerMainnet.json",
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


def load_stamp(rel: str):
    p = ROOT / rel
    if not p.exists():
        return None
    s = json.loads(p.read_text(encoding="utf-8"))
    return {
        "stamp": s.get("stamp"),
        "path": rel,
        "sha256": sha256_file(p),
        "addresses": s.get("addresses"),
        "notes": s.get("notes"),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", default="V9_AUDIT_CANDIDATE", help="candidate_id")
    ap.add_argument("--status", default="", help="manifest status override")
    args = ap.parse_args()
    candidate_id = args.id.strip()
    status = args.status.strip() or (
        "FROZEN_R1_FINAL_FOR_AUDIT3"
        if "R1_FINAL" in candidate_id
        else "FROZEN_FOR_INTERNAL_AUDIT_WAVE"
    )

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
                "bytecode_len": max(
                    0, (len(bytecode) - 2) // 2 if bytecode.startswith("0x") else len(bytecode) // 2
                ),
            }
        )

    sources = []
    for p in sorted(SRC.rglob("*.sol")):
        if "mocks" in p.parts:
            continue
        sources.append(
            {
                "path": p.relative_to(ROOT).as_posix(),
                "sha256": sha256_file(p),
                "bytes": p.stat().st_size,
            }
        )

    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    manifest = {
        "candidate_id": candidate_id,
        "status": status,
        "frozen_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "workspace_git_head_at_freeze_tooling": head,
        "note": (
            "Pins V9 Solidity under contracts/src/ttg-v9 + forge artifacts (FOUNDRY_PROFILE=ttg_v9). "
            "Unrelated dirty-tree files are NOT in this freeze. Audit #3 / Mainnet must target this manifest."
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
            "Audit1_SmartContract",
            "Regression1_Sepolia",
            "Audit2_RedTeam",
            "Freeze_R1_FINAL",
            "Audit3_MainnetRelease",
            "Regression2_Sepolia",
            "V9_MAINNET_READY_STOP",
        ],
        "gate_before_mainnet": {
            "critical": 0,
            "high": 0,
            "audit2_open_high": 0,
            "sepolia_regression": "PASS",
            "sepolia_regression2": "REQUIRED_BEFORE_READY_STOP",
            "owner_mainnet_auth": "REQUIRED",
            "auto_production_go": "FORBIDDEN",
        },
        "sepolia_remint_pass": load_stamp(
            "evidence/GO_ttg_v9_remint_sepolia/V9_REMINT_SEPOLIA_PASS_STOP.json"
        ),
        "sepolia_regression1_pass": load_stamp(
            "evidence/GO_ttg_v9_audit/V9_SEPOLIA_REGRESSION_PASS.json"
        ),
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
            "TtgV9AtomicDeployer",
            "TtgV9AtomicDeployerMainnet",
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
    if candidate_id != "V9_AUDIT_CANDIDATE":
        final_path = EVIDENCE / f"{candidate_id}_MANIFEST.json"
        final_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        print("wrote", final_path.as_posix())
    print(
        "sources",
        len(sources),
        "artifacts",
        len([a for a in artifacts if not a.get("missing")]),
    )


if __name__ == "__main__":
    main()
