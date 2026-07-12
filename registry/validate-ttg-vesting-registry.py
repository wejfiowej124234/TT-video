#!/usr/bin/env python3
"""Validate ttg-vesting-registry.v1.yaml — Step 7C · allocation semantics v3."""
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
SSOT = ROOT / "docs/spec/governance-token/protocol-ssot.v1.yaml"
DOC = ROOT / "docs/runbook/TT-TTG-VESTING-PRODUCTION-GOVERNANCE.md"
CHECKLIST = ROOT / "docs/runbook/TT-TTG-VESTING-OWNER-INPUT-CHECKLIST.md"
MAINNET = ROOT / "registry/mainnet-address-registry.v2.yaml"

VESTING_TRACKS = ("team", "advisors")
FORBIDDEN_TRACKS = ("investor", "public_global", "ecosystem")
COMMERCIAL_OWNER_INPUT = ("beneficiary", "cliff_seconds", "duration_seconds", "start_timestamp")
TEAM_GOVERNANCE_FIELDS = ("revocable", "controller", "custody")
FROZEN_VESTING = {"team": 1_500_000, "advisors": 500_000}
PUBLIC_ROUNDS = (
    ("public_round_1_early", 500_000),
    ("public_round_2", 500_000),
    ("public_round_3", 1_000_000),
)
BUCKET_PATHS = ("country_pool_shelf", "treasury_dao")
BUCKET_FROZEN = {"country_pool_shelf": 2_500_000, "treasury_dao": 2_000_000}


def fail(msg: str) -> None:
    print(f"REGISTRY-STRUCT: {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    for path in (REG, SSOT, DOC, CHECKLIST, MAINNET):
        if not path.is_file():
            fail(f"missing {path.relative_to(ROOT)}")

    data = yaml.safe_load(REG.read_text(encoding="utf-8"))
    ssot = yaml.safe_load(SSOT.read_text(encoding="utf-8")) or {}
    bps_map = ssot.get("token_allocation_bps") or {}
    total_supply = int((data.get("supply_ssot") or {}).get("total_supply") or ssot.get("ttg", {}).get("total_supply") or 0)

    if data.get("schema") != "traveltrust.ttg_vesting_registry.v1":
        fail("schema mismatch")
    if int(data.get("version") or 0) < 3:
        fail("version must be >= 3 (allocation semantics v3)")
    if not data.get("production_required"):
        fail("production_required must be true")

    tracks = data.get("vesting_tracks") or {}
    planned = data.get("governance_planned_release") or {}
    pm = data.get("primary_market") or {}
    paths = data.get("allocation_bucket_paths") or {}

    for forbidden in FORBIDDEN_TRACKS:
        if forbidden in tracks:
            fail(f"forbidden in vesting_tracks: {forbidden}")

    if "investor" not in (data.get("forbidden_parallel_pools") or []):
        fail("forbidden_parallel_pools must include investor")

    for name in VESTING_TRACKS:
        if name not in tracks:
            fail(f"missing vesting track: {name}")
        track = tracks[name]
        if track.get("track_type") != "standard_vesting":
            fail(f"{name}.track_type must be standard_vesting")
        expected = FROZEN_VESTING[name]
        if int(track.get("amount_tokens") or 0) != expected:
            fail(f"{name}.amount_tokens must be {expected}")
        if track.get("amount_tokens_status") != "FROZEN":
            fail(f"{name}.amount_tokens_status must be FROZEN")
        for key in COMMERCIAL_OWNER_INPUT:
            if track.get(key) != "OWNER_INPUT":
                fail(f"{name}.{key} must be OWNER_INPUT")

    team = tracks["team"]
    for field in TEAM_GOVERNANCE_FIELDS:
        if field not in team:
            fail(f"team missing {field}")
    if team.get("revocable") is not False or team.get("controller") != "timelock":
        fail("team revocable/controller invalid")

    eco = planned.get("ecosystem") or {}
    if int(eco.get("amount_tokens") or 0) != 1_500_000:
        fail("ecosystem amount must be 1500000")
    if eco.get("track_type") != "governance_planned_release":
        fail("ecosystem must be governance_planned_release")
    if eco.get("beneficiary") != "OWNER_INPUT" or eco.get("schedule_template") != "OWNER_INPUT":
        fail("ecosystem commercial fields must be OWNER_INPUT")
    if not eco.get("authorization_chain"):
        fail("ecosystem.authorization_chain required")

    if int(pm.get("amount_tokens") or 0) != 2_000_000:
        fail("primary_market.amount_tokens must be 2000000")
    if pm.get("distribution_model") != "three_round_primary_market":
        fail("primary_market.distribution_model invalid")
    if "single_beneficiary_cliff_vesting" not in (pm.get("forbidden_models") or []):
        fail("primary_market must forbid single_beneficiary_cliff_vesting")

    rounds = pm.get("rounds") or {}
    round_sum = 0
    for rid, amt in PUBLIC_ROUNDS:
        r = rounds.get(rid) or {}
        if int(r.get("amount_tokens") or 0) != amt:
            fail(f"primary_market.rounds.{rid} must be {amt}")
        if r.get("optional_lockup_seconds") != "OWNER_INPUT":
            fail(f"{rid}.optional_lockup_seconds must be OWNER_INPUT")
        round_sum += amt
    if round_sum != 2_000_000:
        fail("primary_market rounds must sum to 2000000")

    for bname, famount in BUCKET_FROZEN.items():
        bp = paths.get(bname) or {}
        if int(bp.get("amount_tokens") or 0) != famount:
            fail(f"{bname}.amount_tokens must be {famount}")
        if not bp.get("custody"):
            fail(f"{bname}.custody required")
        if not bp.get("authorization"):
            fail(f"{bname}.authorization required")
        if not bp.get("release_paths"):
            fail(f"{bname}.release_paths required")
        bps = int(bp.get("allocation_bps") or -1)
        if bps != int(bps_map.get(bname) or -1):
            fail(f"{bname}.allocation_bps mismatch vs protocol-ssot")
        if total_supply and total_supply * bps // 10000 != famount:
            fail(f"{bname} amount/bps mismatch")

    sep = (data.get("gate_separation") or {}).get("sepolia_governor_v1_1") or {}
    if not sep.get("does_not_require"):
        fail("gate_separation.sepolia required")

    print(
        "OK: ttg-vesting-registry v3 "
        "vesting=team+advisors pm=500k+500k+1m ecosystem=governance_release "
        "bucket_paths=country+treasury lifecycle=READY_TEMPLATE"
    )


if __name__ == "__main__":
    main()
