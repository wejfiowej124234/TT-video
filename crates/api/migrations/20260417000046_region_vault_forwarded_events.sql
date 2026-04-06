-- RegionVault RegionVaultForwarded 索引投影（14 §1.1.1 RegionVault、110、07 §五 5.2A）
-- internal/indexer-tick 在 REGION_VAULT_ADDRESS 设且 DATABASE_URL 时写入；幂等键 (chain_id, block_number, log_index)

CREATE TABLE IF NOT EXISTS region_vault_forwarded_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id BIGINT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INT NOT NULL,
    block_hash TEXT NOT NULL DEFAULT '',
    tx_hash TEXT NOT NULL,
    vault_address TEXT NOT NULL,
    token_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount_u256_hex TEXT NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT region_vault_forwarded_events_chain_block_log UNIQUE (chain_id, block_number, log_index)
);

CREATE INDEX IF NOT EXISTS idx_region_vault_forwarded_events_chain_block
    ON region_vault_forwarded_events (chain_id, block_number DESC);

CREATE INDEX IF NOT EXISTS idx_region_vault_forwarded_events_inserted
    ON region_vault_forwarded_events (inserted_at DESC);
