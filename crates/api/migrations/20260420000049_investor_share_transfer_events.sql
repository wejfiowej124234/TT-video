-- Country Pool / TTG 份额代币 ERC20 Transfer 投影（B-085、14、82/83 叙事）
-- internal/indexer-tick 在 INVESTOR_SHARE_TOKEN_ADDRESSES 非空且 DATABASE_URL 时写入；幂等键 (chain_id, block_number, log_index)

CREATE TABLE IF NOT EXISTS investor_share_transfer_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id BIGINT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INT NOT NULL,
    block_hash TEXT NOT NULL DEFAULT '',
    tx_hash TEXT NOT NULL,
    token_address TEXT NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    value_u256_hex TEXT NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT investor_share_transfer_events_chain_block_log UNIQUE (chain_id, block_number, log_index)
);

CREATE INDEX IF NOT EXISTS idx_investor_share_transfer_events_chain_token_block
    ON investor_share_transfer_events (chain_id, token_address, block_number DESC);

CREATE INDEX IF NOT EXISTS idx_investor_share_transfer_events_inserted
    ON investor_share_transfer_events (inserted_at DESC);

-- 可选合规白名单：表非空时 GET …/investor-share-reconcile 校验「有余额的持有人 ⊆ 白名单」
CREATE TABLE IF NOT EXISTS investor_share_compliance_wallets (
    wallet_address TEXT PRIMARY KEY
);
