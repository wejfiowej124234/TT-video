"""Shared constants for SSOT Guard CI v2 (static + response contract)."""

from __future__ import annotations

# B-097: twelve root keys that must not appear on list / aggregate envelopes (002).
ESCROW_SSOT_TWELVE_ROOT_KEYS: tuple[str, ...] = (
    "escrow_chain_state",
    "escrow_chain_state_data_source",
    "escrow_chain_state_is_chain_ssot",
    "escrow_release_state",
    "escrow_release_state_data_source",
    "escrow_release_state_is_chain_ssot",
    "escrow_dispute_state",
    "escrow_dispute_state_data_source",
    "escrow_dispute_state_is_chain_ssot",
    "escrow_locked_amount",
    "escrow_locked_amount_data_source",
    "escrow_locked_amount_is_chain_ssot",
)

# B-110: Σ (fee-pool-aggregates) must not expose these at JSON root.
B110_AGGREGATE_FORBIDDEN_ROOT_KEYS: tuple[str, ...] = (
    "country_pool",
    "country_pool_data_source",
    "country_pool_is_chain_ssot",
    "treasury_pool",
    "treasury_pool_data_source",
    "treasury_pool_is_chain_ssot",
    "treasury_erc20_pool",
    "treasury_erc20_pool_data_source",
    "treasury_erc20_pool_is_chain_ssot",
)

ESCROW_SSOT_FAMILIES: tuple[tuple[str, str, str], ...] = (
    ("escrow_chain_state", "escrow_chain_state_data_source", "escrow_chain_state_is_chain_ssot"),
    ("escrow_release_state", "escrow_release_state_data_source", "escrow_release_state_is_chain_ssot"),
    ("escrow_dispute_state", "escrow_dispute_state_data_source", "escrow_dispute_state_is_chain_ssot"),
    ("escrow_locked_amount", "escrow_locked_amount_data_source", "escrow_locked_amount_is_chain_ssot"),
)

REPORT_SCHEMA_VERSION = "2.0"
GATE_ID = "ssot-guard-ci-v2"
