-- B-088 Completion：锁仓 **`Locked` / `Unlocked`** 独立投影（**TT-COMP-B088-LOCK-VAULT-PROJECTION-001**）；与 **`investor_stake_state_events`** 并列，可叠加入 **`investor_share_transfer_events`** **pro_rata**
CREATE TABLE IF NOT EXISTS investor_lock_state_events (
    chain_id BIGINT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INTEGER NOT NULL,
    block_hash TEXT NOT NULL DEFAULT '',
    tx_hash TEXT NOT NULL,
    lock_contract_address TEXT NOT NULL,
    user_address TEXT NOT NULL,
    event_kind TEXT NOT NULL,
    amount_u256_hex TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chain_id, block_number, log_index)
);

CREATE INDEX IF NOT EXISTS idx_investor_lock_state_events_chain_lock_block
    ON investor_lock_state_events (chain_id, LOWER(lock_contract_address), block_number, log_index);
