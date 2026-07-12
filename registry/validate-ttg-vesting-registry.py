#!/usr/bin/env python3
"""Validate ttg-vesting-registry — Genesis V2 four-block allocation."""
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
GENESIS = ROOT / "docs/spec/governance-token/TTG-TOKENOMICS-GENESIS-V2.md"
POLICY = ROOT / "docs/spec/governance-token/COMMUNITY-INCENTIVE-POLICY-V1.md"
DOC = ROOT / "docs/runbook/TT-TTG-VESTING-PRODUCTION-GOVERNANCE.md"
CHECKLIST = ROOT / "docs/runbook/TT-TTG-VESTING-OWNER-INPUT-CHECKLIST.md"
MAINNET = ROOT / "registry/mainnet-address-registry.v2.yaml"

REQUIRED_BPS = {
    "team": 1500,
    "community_incentive": 500,
    "treasury_dao": 3000,
    "public_sale": 5000,
}
FORBIDDEN_KEYS = ("advisors", "country_pool_shelf", "ecosystem", "public_global")
PUBLIC_ROUNDS = (
    ("public_round_1_early", 800_000),
    ("public_round_2", 1_200_000),
    ("public_round_3", 3_000_000),
)


def fail(msg: str) -> None:
    print(f"REGISTRY-STRUCT: {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    for path in (REG, SSOT, GENESIS, POLICY, MAINNET):
        if not path.is_file():
            fail(f"missing {path.relative_to(ROOT)}")

    data = yaml.safe_load(REG.read_text(encoding="utf-8"))
    ssot = yaml.safe_load(SSOT.read_text(encoding="utf-8")) or {}
    bps_map = ssot.get("token_allocation_bps") or {}
    supply = data.get("supply_ssot") or {}
    reg_buckets = supply.get("buckets_bps") or {}
    total_supply = int(supply.get("total_supply") or 0)
    required_bps = int(supply.get("bucket_sum_bps_required") or 10000)

    if data.get("schema") != "traveltrust.ttg_vesting_registry.v1":
        fail("schema mismatch")
    if int(data.get("version") or 0) < 4:
        fail("version must be >= 4 (Genesis V2)")
    if not data.get("production_required"):
        fail("production_required must be true")

    if set(reg_buckets.keys()) != set(REQUIRED_BPS.keys()):
        fail(f"supply_ssot.buckets_bps keys must be {sorted(REQUIRED_BPS)}")
    bucket_sum = sum(int(v) for v in reg_buckets.values())
    if bucket_sum != required_bps:
        fail(f"buckets_bps must sum to {required_bps}, got {bucket_sum}")
    for key, bps in REQUIRED_BPS.items():
        if int(reg_buckets.get(key) or -1) != bps:
            fail(f"buckets_bps.{key} must be {bps}")
        if int(bps_map.get(key) or -1) != bps:
            fail(f"protocol-ssot token_allocation_bps.{key} must be {bps}")

    for forbidden in FORBIDDEN_KEYS:
        if forbidden in reg_buckets or forbidden in bps_map:
            fail(f"forbidden genesis key present: {forbidden}")

    tracks = data.get("vesting_tracks") or {}
    if "advisors" in tracks:
        fail("advisors vesting track forbidden in Genesis V2")
    team = tracks.get("team") or {}
    if int(team.get("amount_tokens") or 0) != 1_500_000:
        fail("team.amount_tokens must be 1500000")
    if team.get("amount_tokens_status") != "FROZEN":
        fail("team.amount_tokens_status must be FROZEN")
    if int(team.get("beneficiary_wallet_count") or 0) != 1:
        fail("team.beneficiary_wallet_count must be 1")
    for key in ("beneficiary", "cliff_seconds", "duration_seconds", "start_timestamp"):
        if team.get(key) != "OWNER_INPUT":
            fail(f"team.{key} must be OWNER_INPUT")
    if team.get("revocable") is not False or team.get("controller") != "timelock":
        fail("team revocable/controller invalid")

    cia = data.get("community_incentive_allocation") or {}
    if int(cia.get("amount_tokens") or 0) != 500_000:
        fail("community_incentive_allocation.amount_tokens must be 500000")
    if cia.get("dao_top_up_changes_genesis_bps") is not False:
        fail("dao_top_up_changes_genesis_bps must be false")
    if "COMMUNITY-INCENTIVE-POLICY" not in str(cia.get("policy_ref") or ""):
        fail("community_incentive policy_ref required")
    if cia.get("policy_status") != "ACTIVE":
        fail("community_incentive_allocation.policy_status must be ACTIVE")

    pm = data.get("primary_market") or {}
    if pm.get("remaining_unsold_policy_status") != "FROZEN":
        fail("remaining_unsold_policy_status must be FROZEN")
    if pm.get("remaining_unsold_policy") != "RESERVE_GOVERNANCE_GATED_DISPOSITION":
        fail("remaining_unsold_policy must be RESERVE_GOVERNANCE_GATED_DISPOSITION")
    if int(pm.get("amount_tokens") or 0) != 5_000_000:
        fail("primary_market.amount_tokens must be 5000000")
    if pm.get("ssot_bucket") != "public_sale":
        fail("primary_market.ssot_bucket must be public_sale")
    rounds = pm.get("rounds") or {}
    round_sum = 0
    for rid, amt in PUBLIC_ROUNDS:
        r = rounds.get(rid) or {}
        if int(r.get("amount_tokens") or 0) != amt:
            fail(f"primary_market.rounds.{rid} initial registry amount must be {amt}")
        round_sum += amt
    if round_sum != 5_000_000:
        fail("primary_market rounds must sum to 5000000")
    if int(pm.get("rounds_sum_tokens") or 0) != 5_000_000:
        fail("rounds_sum_tokens must be 5000000")

    paths = data.get("allocation_bucket_paths") or {}
    if "country_pool_shelf" in paths:
        fail("country_pool_shelf path forbidden in Genesis V2")
    td = paths.get("treasury_dao") or {}
    if int(td.get("amount_tokens") or 0) != 3_000_000:
        fail("treasury_dao.amount_tokens must be 3000000")
    if td.get("platform_operational_funds") is not False:
        fail("treasury_dao.platform_operational_funds must be false")
    if td.get("represents_voting_power") is not False:
        fail("treasury_dao.represents_voting_power must be false")
    if td.get("mint_replenish_forbidden") is not True:
        fail("treasury_dao.mint_replenish_forbidden must be true")
    if td.get("asset") != "TTG":
        fail("treasury_dao.asset must be TTG")
    if "usdc_spend" not in (td.get("forbidden") or []):
        fail("treasury_dao.forbidden must include usdc_spend")

    rsp = data.get("region_steward_policy") or {}
    if rsp.get("country_shelf_genesis_bucket") is not False:
        fail("region_steward_policy.country_shelf_genesis_bucket must be false")
    if rsp.get("source_tracking") is not False:
        fail("region_steward_policy.source_tracking must be false")
    if rsp.get("exit_burns_stake") is not False:
        fail("region_steward_policy.exit_burns_stake must be false")

    vgp = data.get("vesting_governance_policy") or {}
    if vgp.get("start_event_default") != "MAINNET_VESTING_DEPLOY_EXECUTE":
        fail("vesting_governance_policy.start_event_default invalid")
    if vgp.get("advisors_track") != "REMOVED_IN_GENESIS_V2":
        fail("advisors_track must be REMOVED_IN_GENESIS_V2")

    token_sum = 1_500_000 + 500_000 + 3_000_000 + 5_000_000
    if total_supply and token_sum != total_supply:
        fail(f"four-block amounts must sum to {total_supply}, got {token_sum}")

    # optional docs — warn-level soft: still require if present historically
    for soft in (DOC, CHECKLIST):
        if not soft.is_file():
            print(f"WARN: missing optional {soft.relative_to(ROOT)}", file=sys.stderr)

    print(
        "OK: ttg-vesting-registry v4 GenesisV2 "
        "team=1.5M community=0.5M dao=3M public_sale=5M "
        "rounds=800k+1.2M+3M no_shelf no_advisors"
    )


if __name__ == "__main__":
    main()
