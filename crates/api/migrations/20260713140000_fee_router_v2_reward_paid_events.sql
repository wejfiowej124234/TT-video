-- FeeRouterV2 / RegionRewardRegistry indexer projections (Interface Contract V1 · DD-2026-07-020)
-- ACTIVE path only — do not overload LEGACY fee_router_routed_events / region_vault_forwarded_events.

CREATE TABLE IF NOT EXISTS fee_router_v2_routed_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id BIGINT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INT NOT NULL,
    block_hash TEXT NOT NULL DEFAULT '',
    tx_hash TEXT NOT NULL,
    router_address TEXT NOT NULL,
    region_id_hex TEXT NOT NULL,
    token_address TEXT NOT NULL,
    amount_u256_hex TEXT NOT NULL,
    to_region_leg_u256_hex TEXT NOT NULL,
    to_stakers_u256_hex TEXT NOT NULL,
    to_reserve_u256_hex TEXT NOT NULL,
    to_ops_u256_hex TEXT NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fee_router_v2_routed_events_chain_block_log UNIQUE (chain_id, block_number, log_index)
);

CREATE INDEX IF NOT EXISTS idx_fee_router_v2_routed_events_chain_block
    ON fee_router_v2_routed_events (chain_id, block_number DESC);
CREATE INDEX IF NOT EXISTS idx_fee_router_v2_routed_events_region
    ON fee_router_v2_routed_events (region_id_hex);

CREATE TABLE IF NOT EXISTS reward_paid_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id BIGINT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INT NOT NULL,
    block_hash TEXT NOT NULL DEFAULT '',
    tx_hash TEXT NOT NULL,
    router_address TEXT NOT NULL,
    region_id_hex TEXT NOT NULL,
    token_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount_u256_hex TEXT NOT NULL,
    to_p4cap BOOLEAN NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT reward_paid_events_chain_block_log UNIQUE (chain_id, block_number, log_index)
);

CREATE INDEX IF NOT EXISTS idx_reward_paid_events_chain_block
    ON reward_paid_events (chain_id, block_number DESC);
CREATE INDEX IF NOT EXISTS idx_reward_paid_events_region
    ON reward_paid_events (region_id_hex);
CREATE INDEX IF NOT EXISTS idx_reward_paid_events_to
    ON reward_paid_events (to_address);

CREATE TABLE IF NOT EXISTS region_payout_registry_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id BIGINT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INT NOT NULL,
    block_hash TEXT NOT NULL DEFAULT '',
    tx_hash TEXT NOT NULL,
    registry_address TEXT NOT NULL,
    region_id_hex TEXT NOT NULL,
    previous_payout TEXT NOT NULL,
    new_payout TEXT NOT NULL,
    operator_address TEXT NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT region_payout_registry_events_chain_block_log UNIQUE (chain_id, block_number, log_index)
);

CREATE INDEX IF NOT EXISTS idx_region_payout_registry_events_chain_block
    ON region_payout_registry_events (chain_id, block_number DESC);
CREATE INDEX IF NOT EXISTS idx_region_payout_registry_events_region
    ON region_payout_registry_events (region_id_hex);
