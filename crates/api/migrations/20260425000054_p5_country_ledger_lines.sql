-- P5-1-B：**CountryPoolLedgerV0** `CountryLedgerCredited` 投影（与 **B-115/B-116** 投影表正交；幂等键 chain_id+block+log_index）

CREATE TABLE IF NOT EXISTS p5_country_ledger_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id BIGINT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INT NOT NULL,
    block_hash TEXT NOT NULL DEFAULT '',
    tx_hash TEXT NOT NULL,
    ledger_contract_address TEXT NOT NULL,
    jurisdiction_id CHAR(2) NOT NULL,
    token_address TEXT NOT NULL,
    direction SMALLINT NOT NULL,
    amount_u256_hex TEXT NOT NULL,
    ref_bytes32_hex TEXT NOT NULL,
    source_kind TEXT NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT p5_country_ledger_lines_chain_block_log UNIQUE (chain_id, block_number, log_index)
);

CREATE INDEX IF NOT EXISTS idx_p5_country_ledger_lines_chain_jurisdiction
    ON p5_country_ledger_lines (chain_id, jurisdiction_id, block_number DESC);
