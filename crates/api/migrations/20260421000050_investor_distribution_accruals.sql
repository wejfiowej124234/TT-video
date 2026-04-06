-- 应计分红分录（B-086）：快照块 + 幂等键；现金流口径与公式见 API 常量
-- POST …/internal/investor-distribution-accrual 写入；GET …/governance/investor-distribution-accruals 只读

CREATE TABLE IF NOT EXISTS investor_distribution_accruals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT NOT NULL,
    chain_id BIGINT NOT NULL,
    token_address TEXT NOT NULL,
    snapshot_block_number BIGINT NOT NULL,
    cash_basis TEXT NOT NULL,
    formula TEXT NOT NULL,
    total_cash_u256_hex TEXT NOT NULL,
    total_supply_u256_hex TEXT NOT NULL,
    distributed_sum_u256_hex TEXT NOT NULL,
    remainder_u256_hex TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT investor_distribution_accruals_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_investor_dist_accr_chain_token_snap
    ON investor_distribution_accruals (chain_id, token_address, snapshot_block_number DESC);

CREATE TABLE IF NOT EXISTS investor_distribution_accrual_lines (
    distribution_id UUID NOT NULL REFERENCES investor_distribution_accruals (id) ON DELETE CASCADE,
    holder_address TEXT NOT NULL,
    balance_snapshot_u256_hex TEXT NOT NULL,
    accrual_u256_hex TEXT NOT NULL,
    PRIMARY KEY (distribution_id, holder_address)
);

CREATE INDEX IF NOT EXISTS idx_investor_dist_accr_lines_dist
    ON investor_distribution_accrual_lines (distribution_id);
