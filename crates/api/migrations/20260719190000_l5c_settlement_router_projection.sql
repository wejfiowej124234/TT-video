-- L5-C Production Runtime · SettlementRouter + Escrow service-fee projection
-- Does not mutate ACTIVE address matrix. No contract redeploy.

CREATE TABLE IF NOT EXISTS settlement_router_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id BIGINT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INT NOT NULL,
    block_hash TEXT NOT NULL DEFAULT '',
    tx_hash TEXT NOT NULL,
    router_address TEXT NOT NULL,
    event_name TEXT NOT NULL,
    order_id_hex TEXT NOT NULL,
    escrow_address TEXT,
    token_address TEXT,
    amount_u256_hex TEXT,
    steward_share_u256_hex TEXT,
    pool_share_u256_hex TEXT,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT settlement_router_events_chain_block_log UNIQUE (chain_id, block_number, log_index)
);

CREATE INDEX IF NOT EXISTS idx_settlement_router_events_order
    ON settlement_router_events (chain_id, order_id_hex);

CREATE INDEX IF NOT EXISTS idx_settlement_router_events_chain_block
    ON settlement_router_events (chain_id, block_number DESC);

CREATE TABLE IF NOT EXISTS escrow_settlement_projection (
    chain_id BIGINT NOT NULL,
    order_id_hex TEXT NOT NULL,
    escrow_address TEXT,
    settlement_state SMALLINT NOT NULL DEFAULT 0,
    settlement_state_name TEXT NOT NULL DEFAULT 'None',
    service_fee_state SMALLINT,
    service_fee_state_name TEXT,
    fee_leg_amount_u256_hex TEXT,
    last_event_name TEXT,
    last_block_number BIGINT,
    last_log_index INT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (chain_id, order_id_hex)
);

CREATE INDEX IF NOT EXISTS idx_escrow_settlement_projection_escrow
    ON escrow_settlement_projection (chain_id, escrow_address);

COMMENT ON TABLE settlement_router_events IS
  'L5-C · SettlementRouter FeeLegReceived/SettlementReady/Distributable/Distributed event log';
COMMENT ON TABLE escrow_settlement_projection IS
  'L5-C · per chain orderId settlement SM + Escrow serviceFeeState projection';
