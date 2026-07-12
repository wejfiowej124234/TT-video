#!/usr/bin/env python3
"""Validate ttg-vesting-registry.v1.yaml — Step 7C."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("REGISTRY-STRUCT: PyYAML required", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
REG = ROOT / "registry" / "ttg-vesting-registry.v1.yaml"
DOC = ROOT / "docs" / "runbook" / "TT-TTG-VESTING-PRODUCTION-GOVERNANCE.md"
CHECKLIST = ROOT / "docs" / "runbook" / "TT-TTG-VESTING-OWNER-INPUT-CHECKLIST.md"
MAINNET = ROOT / "registry" / "mainnet-address-registry.v2.yaml"

REQUIRED_POOLS = ["team", "investor", "ecosystem", "treasury"]
TEAM_FIELDS = [
    "beneficiary",
    "amount_tokens",
    "cliff_seconds",
    "duration_seconds",
    "start_timestamp",
    "revocable",
    "controller",
    "custody",
]


def fail(msg: str) -> None:
    print(f"REGISTRY-STRUCT: {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    for path in (REG, DOC, CHECKLIST, MAINNET):
        if not path.is_file():
            fail(f"missing {path.relative_to(ROOT)}")

    data = yaml.safe_load(REG.read_text(encoding="utf-8"))
    if data.get("schema") != "traveltrust.ttg_vesting_registry.v1":
        fail("schema mismatch")
    if not data.get("production_required"):
        fail("production_required must be true")
    if data.get("registry_lifecycle_status") != "READY_TEMPLATE":
        fail("registry_lifecycle_status must be READY_TEMPLATE")

    pools = data.get("pools") or {}
    for pool in REQUIRED_POOLS:
        if pool not in pools:
            fail(f"missing pool: {pool}")

    team = pools["team"]
    for field in TEAM_FIELDS:
        if field not in team:
            fail(f"team pool missing field: {field}")
    if team.get("revocable") is not False:
        fail("team vesting must be revocable: false")
    if team.get("controller") != "timelock":
        fail("team controller must be timelock")

    for pool_name in ("team", "investor"):
        pool = pools[pool_name]
        for key in ("beneficiary", "cliff_seconds", "duration_seconds", "start_timestamp"):
            if pool.get(key) != "OWNER_INPUT":
                fail(f"{pool_name}.{key} must be OWNER_INPUT")

    lifecycle = data.get("lifecycle", {}).get("status_enum") or []
    for status in ("READY_TEMPLATE", "OWNER_FILLED", "VERIFIED", "ACTIVE", "DEPRECATED"):
        if status not in lifecycle:
            fail(f"lifecycle missing status: {status}")

    print(
        f"OK: ttg-vesting-registry pools={len(pools)} "
        f"production_required=true lifecycle=READY_TEMPLATE"
    )


if __name__ == "__main__":
    main()
