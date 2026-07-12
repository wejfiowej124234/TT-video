#!/usr/bin/env python3
"""Validate asset-denomination-treasury-separation.v1.yaml + cross-registry drift guards."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("REGISTRY-STRUCT: PyYAML required", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
SEP = ROOT / "registry" / "asset-denomination-treasury-separation.v1.yaml"
VEST = ROOT / "registry" / "ttg-vesting-registry.v1.yaml"
MAINNET = ROOT / "registry" / "mainnet-address-registry.v2.yaml"
GENESIS = ROOT / "docs/spec/governance-token/GENESIS-GOVERNANCE-PHASE.md"
PM_SOL = ROOT / "contracts/src/TtgPrimaryMarketV1.sol"


def fail(msg: str) -> None:
    print(f"REGISTRY-STRUCT: {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    for path in (SEP, VEST, MAINNET, GENESIS, PM_SOL):
        if not path.is_file():
            fail(f"missing {path.relative_to(ROOT)}")

    sep = yaml.safe_load(SEP.read_text(encoding="utf-8")) or {}
    vest = yaml.safe_load(VEST.read_text(encoding="utf-8")) or {}
    mainnet = yaml.safe_load(MAINNET.read_text(encoding="utf-8")) or {}

    if sep.get("schema") != "traveltrust.asset_denomination_treasury_separation.v1":
        fail("schema mismatch")
    if sep.get("status") != "ACTIVE":
        fail("status must be ACTIVE")

    ttg_bucket = sep.get("ttg_dao_treasury_bucket") or {}
    usdc_treasury = sep.get("usdc_global_treasury") or {}
    if ttg_bucket.get("asset") != "TTG":
        fail("ttg_dao_treasury_bucket.asset must be TTG")
    if usdc_treasury.get("asset") != "USDC":
        fail("usdc_global_treasury.asset must be USDC")
    if int(ttg_bucket.get("amount_tokens") or 0) != 2_000_000:
        fail("ttg_dao_treasury_bucket.amount_tokens must be 2000000")
    if usdc_treasury.get("on_chain_contract") != "GovernanceTreasuryP4Cap":
        fail("usdc_global_treasury.on_chain_contract must be GovernanceTreasuryP4Cap")

    stages = (usdc_treasury.get("spend_policy") or {}).get("stages") or {}
    for key in ("P1", "P2", "P3", "P4"):
        if key not in stages:
            fail(f"usdc_global_treasury spend_policy.stages.{key} required")
    if stages.get("P4", {}).get("goV_rule") != "GOV-01":
        fail("P4 must reference GOV-01")

    rails = sep.get("fund_rails") or {}
    for rid in ("R1_ttg", "R2_country_pool_usdc", "R3_escrow_usdc", "R4_fee_usdc"):
        if rid not in rails:
            fail(f"fund_rails.{rid} required")
    escrow = rails.get("R3_escrow_usdc") or {}
    if "usdc_global_treasury" not in (escrow.get("isolated_from") or []):
        fail("R3_escrow must isolate from usdc_global_treasury")

    pm = sep.get("primary_market") or {}
    if pm.get("usdc_sink") != "usdc_global_treasury":
        fail("primary_market.usdc_sink must be usdc_global_treasury")
    if pm.get("usdc_field") != "usdcTreasury":
        fail("primary_market.usdc_field must be usdcTreasury")

    td = (vest.get("allocation_bucket_paths") or {}).get("treasury_dao") or {}
    td_policy = {k: v for k, v in td.items() if k not in ("forbidden", "refs", "usdc_cash_policy_ref")}
    td_text = yaml.dump(td_policy)
    drift = sep.get("drift_checks") or {}
    for token in drift.get("vesting_registry_treasury_dao_must_not_reference") or []:
        if token in td_text:
            fail(f"treasury_dao drift: forbidden token {token!r}")
    if td.get("asset") != "TTG":
        fail("vesting treasury_dao.asset must be TTG")
    if "usdc_spend" not in (td.get("forbidden") or []):
        fail("vesting treasury_dao.forbidden must include usdc_spend")

    pm_reg = vest.get("primary_market") or {}
    if pm_reg.get("usdc_sink_contract") != "GovernanceTreasuryP4Cap":
        fail("primary_market.usdc_sink_contract must be GovernanceTreasuryP4Cap")

    treasury_slot = (mainnet.get("contracts") or {}).get("treasury") or {}
    if treasury_slot.get("contract") != "GovernanceTreasuryP4Cap":
        fail("mainnet treasury slot must be GovernanceTreasuryP4Cap (USDC)")

    genesis = GENESIS.read_text(encoding="utf-8")
    if "treasury_dao_with_p4_reserve" in genesis:
        fail("genesis conflation marker present")
    if "P4 Reserve" in genesis and "treasury_dao" in genesis.split("P4 Reserve")[0][-200:]:
        fail("genesis may still conflate treasury_dao with P4 Reserve")

    pm_sol = PM_SOL.read_text(encoding="utf-8")
    if "usdcTreasury" not in pm_sol or "transferFrom(msg.sender, usdcTreasury" not in pm_sol:
        fail("TtgPrimaryMarketV1 must transfer USDC to usdcTreasury")

    print(
        "OK: asset-denomination-treasury-separation v1 "
        "ttg_dao=2M-TTG-only usdc_global=GovernanceTreasuryP4Cap "
        "rails=R1-R4-isolated pm_usdc_sink=P4Cap"
    )


if __name__ == "__main__":
    main()
