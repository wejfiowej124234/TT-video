-- FeeRouter PlatformFeeRouted 索引投影（14 §1.1 FeeRouter、110、07 §五 5.2A）
-- 由 internal/indexer-tick 在去重后首次见事件时写入；幂等键 (chain_id, block_number, log_index)

CREATE TABLE IF NOT EXISTS fee_router_routed_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id BIGINT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INT NOT NULL,
    block_hash TEXT NOT NULL DEFAULT '',
    tx_hash TEXT NOT NULL,
    router_address TEXT NOT NULL,
    token_address TEXT NOT NULL,
    amount_u256_hex TEXT NOT NULL,
    to_country_u256_hex TEXT NOT NULL,
    to_stakers_u256_hex TEXT NOT NULL,
    to_reserve_u256_hex TEXT NOT NULL,
    to_ops_u256_hex TEXT NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fee_router_routed_events_chain_block_log UNIQUE (chain_id, block_number, log_index)
);

CREATE INDEX IF NOT EXISTS idx_fee_router_routed_events_chain_block
    ON fee_router_routed_events (chain_id, block_number DESC);

CREATE INDEX IF NOT EXISTS idx_fee_router_routed_events_inserted
    ON fee_router_routed_events (inserted_at DESC);
