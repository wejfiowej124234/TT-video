-- OnboardingFeeReceiver `OnboardingFeePaid` 索引投影（96-18、14 §1.1.0c、110）
-- internal/indexer-tick 在 ONBOARDING_FEE_RECEIVER_ADDRESS 设且 DATABASE_URL 时写入；幂等键 (chain_id, block_number, log_index)

CREATE TABLE IF NOT EXISTS onboarding_fee_paid_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id BIGINT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INT NOT NULL,
    block_hash TEXT NOT NULL DEFAULT '',
    tx_hash TEXT NOT NULL,
    receiver_address TEXT NOT NULL,
    idempotency_key_hex TEXT NOT NULL,
    payer_address TEXT NOT NULL,
    role_target SMALLINT NOT NULL,
    token_address TEXT NOT NULL,
    amount_u256_hex TEXT NOT NULL,
    fee_schedule_version_hex TEXT NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT onboarding_fee_paid_events_chain_block_log UNIQUE (chain_id, block_number, log_index)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_fee_paid_events_chain_block
    ON onboarding_fee_paid_events (chain_id, block_number DESC);

CREATE INDEX IF NOT EXISTS idx_onboarding_fee_paid_events_idempotency
    ON onboarding_fee_paid_events (chain_id, idempotency_key_hex);

CREATE INDEX IF NOT EXISTS idx_onboarding_fee_paid_events_inserted
    ON onboarding_fee_paid_events (inserted_at DESC);
