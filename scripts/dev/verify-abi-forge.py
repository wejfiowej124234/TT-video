#!/usr/bin/env python3
"""
Verify committed contracts/abi/*.json matches `forge inspect <Contract> abi` (multiset of entries, order-independent).

Usage (repo root):
  bash scripts/run-verify-abi-forge.sh
  # or: python3 scripts/verify-abi-forge.py  /  python scripts/verify-abi-forge.py

Requires: forge on PATH; run from repository root. Exits 0 if OK, 1 on drift or error.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

CONTRACTS = (
    "Escrow",
    "EscrowFactory",
    "FeeRouter",
    "GovernanceTimelock",
    "GovernanceTreasury",
    "GovernanceVotesToken",
    "GuideIdentityStakingPool",
    "InvestorDistributionClaim",
    "ProviderIdentityStakingPool",
    "RegionVault",
    "Registry",
    "ReserveVault",
    "SlashRouter",
    "TravelTrustGovernor",
    "RegionStewardStakePool",
    "CountryPoolSubVaultsV0",
    "CountryPoolRedemptionEpochV0",
)

FORGE_INSPECT_NAME = {}


def fragments(xs: list) -> list[str]:
    return sorted(json.dumps(x, sort_keys=True) for x in xs)


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    contracts_dir = root / "contracts"
    abi_dir = contracts_dir / "abi"

    if not contracts_dir.is_dir():
        print("verify-abi-forge: missing contracts/", file=sys.stderr)
        return 1

    for name in CONTRACTS:
        path = abi_dir / f"{name}.json"
        if not path.is_file():
            print(f"verify-abi-forge: missing {path}", file=sys.stderr)
            return 1
        inspect_name = FORGE_INSPECT_NAME.get(name, name)
        artifact = contracts_dir / "out" / f"{inspect_name}.sol" / f"{inspect_name}.json"
        try:
            if artifact.is_file():
                a = json.loads(artifact.read_text(encoding="utf-8")).get("abi")
                if not isinstance(a, list):
                    print(f"verify-abi-forge: {artifact} missing abi array", file=sys.stderr)
                    return 1
            else:
                forge_out = subprocess.check_output(
                    ["forge", "inspect", inspect_name, "abi"],
                    cwd=contracts_dir,
                    text=True,
                )
                a = json.loads(forge_out)
        except FileNotFoundError:
            print(
                "verify-abi-forge: forge not found; install Foundry: https://book.getfoundry.sh",
                file=sys.stderr,
            )
            return 1
        except subprocess.CalledProcessError as e:
            print(f"verify-abi-forge: forge inspect {inspect_name} abi failed: {e}", file=sys.stderr)
            return 1

        try:
            b = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"verify-abi-forge: invalid JSON for {name}: {e}", file=sys.stderr)
            return 1

        if not isinstance(a, list) or not isinstance(b, list):
            print(f"verify-abi-forge: {name}: expected ABI array", file=sys.stderr)
            return 1

        if fragments(a) != fragments(b):
            print(
                f"verify-abi-forge: ABI drift: abi/{name}.json != forge inspect {inspect_name} abi",
                file=sys.stderr,
            )
            print(
                "  Fix: run ./scripts/sync-abi-from-forge.sh (or sync-abi-from-forge.ps1), then commit.",
                file=sys.stderr,
            )
            return 1
        print(f"verify-abi-forge: OK {name}.json")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
