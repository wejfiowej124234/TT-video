-- B-088 Completion：Staking `Staked` / `Withdrawn` / `Slashed` 可重放投影（与 `investor_share_transfer_events` 并列）
CREATE TABLE IF NOT EXISTS investor_stake_state_events (
    chain_id BIGINT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INTEGER NOT NULL,
    block_hash TEXT NOT NULL DEFAULT '',
    tx_hash TEXT NOT NULL,
    staking_contract_address TEXT NOT NULL,
    user_address TEXT NOT NULL,
    event_kind TEXT NOT NULL,
    amount_u256_hex TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chain_id, block_number, log_index)
);

CREATE INDEX IF NOT EXISTS idx_investor_stake_state_events_chain_staking_block
    ON investor_stake_state_events (chain_id, LOWER(staking_contract_address), block_number, log_index);
