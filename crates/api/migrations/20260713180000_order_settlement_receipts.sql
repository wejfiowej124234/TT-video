-- TT-TRANSACTION-LIFECYCLE-SSOT §② Settlement Summary + immutable Receipt
-- Seal on Escrow Released; fee-route legs may fill once from null → value (never rewrite sealed USDC/gas).

CREATE TABLE IF NOT EXISTS order_settlement_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    chain_id BIGINT NOT NULL,
    -- USDC atomic (6 decimals) as decimal strings
    escrow_amount_atomic TEXT NOT NULL,
    platform_fee_atomic TEXT NOT NULL,
    guide_received_atomic TEXT NOT NULL,
    region_reward_atomic TEXT,
    region_reward_absent_reason TEXT,
    global_treasury_atomic TEXT,
    global_treasury_absent_reason TEXT,
    -- Network fee (native wei)
    gas_used TEXT,
    effective_gas_price_wei TEXT,
    actual_network_fee_wei TEXT,
    actual_network_fee_absent_reason TEXT,
    native_token_symbol TEXT,
    network_name TEXT,
    explorer_base TEXT,
    release_tx_hash TEXT NOT NULL,
    release_block_number BIGINT NOT NULL,
    release_log_index INT NOT NULL,
    fee_route_tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending_fee_route',
    sealed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fee_route_filled_at TIMESTAMPTZ,
    CONSTRAINT order_settlement_receipts_order_uq UNIQUE (order_id),
    CONSTRAINT order_settlement_receipts_status_chk CHECK (
        status IN ('pending_fee_route', 'final', 'partial')
    ),
    CONSTRAINT order_settlement_receipts_release_log_uq UNIQUE (chain_id, release_block_number, release_log_index)
);

CREATE INDEX IF NOT EXISTS idx_order_settlement_receipts_chain_tx
    ON order_settlement_receipts (chain_id, release_tx_hash);

CREATE TABLE IF NOT EXISTS order_settlement_receipt_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    actor TEXT NOT NULL DEFAULT 'indexer',
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_settlement_receipt_audit_order
    ON order_settlement_receipt_audit (order_id, created_at DESC);

COMMENT ON TABLE order_settlement_receipts IS
  'TT-TRANSACTION-LIFECYCLE-SSOT §② immutable Settlement/Receipt; USDC from Released; Network Fee from tx receipt; fee legs fill-once.';
