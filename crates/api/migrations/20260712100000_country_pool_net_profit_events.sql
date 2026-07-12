-- GAP-IDX-NP-004 · Country Pool Net Profit (D-4555-B) indexer projection

CREATE TABLE IF NOT EXISTS country_pool_net_profit_events (
    chain_id            BIGINT NOT NULL,
    block_number        BIGINT NOT NULL,
    log_index           INT NOT NULL,
    block_hash          BYTEA NOT NULL,
    tx_hash             BYTEA NOT NULL,
    log_address         TEXT NOT NULL,
    event_type          TEXT NOT NULL,
    jurisdiction_id     TEXT NOT NULL,
    epoch_id            TEXT,
    payload             JSONB NOT NULL DEFAULT '{}'::jsonb,
    accounting_ok       BOOLEAN,
    accounting_note     TEXT,
    inserted_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chain_id, block_number, log_index)
);

CREATE INDEX IF NOT EXISTS idx_cpnp_events_chain_jurisdiction_epoch
    ON country_pool_net_profit_events (chain_id, jurisdiction_id, epoch_id, block_number, log_index);

CREATE INDEX IF NOT EXISTS idx_cpnp_events_chain_type
    ON country_pool_net_profit_events (chain_id, event_type, block_number DESC);

CREATE TABLE IF NOT EXISTS country_pool_net_profit_epochs (
    chain_id                BIGINT NOT NULL,
    jurisdiction_id         TEXT NOT NULL,
    epoch_id                TEXT NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'UNKNOWN',
    epoch_start             BIGINT,
    epoch_end               BIGINT,
    gross_revenue           TEXT,
    allowable_expense       TEXT,
    net_profit              TEXT,
    net_profit_prime        TEXT,
    funded                  BOOLEAN NOT NULL DEFAULT false,
    steward_amount          TEXT,
    unallocated_amount      TEXT,
    global_amount           TEXT,
    steward_path_eligible   BOOLEAN,
    qualified_steward       TEXT,
    bps_steward_path        INT NOT NULL DEFAULT 4500,
    bps_global_treasury     INT NOT NULL DEFAULT 5500,
    active_steward          TEXT,
    last_block_number       BIGINT,
    last_log_index          INT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chain_id, jurisdiction_id, epoch_id)
);

CREATE INDEX IF NOT EXISTS idx_cpnp_epochs_chain_jurisdiction
    ON country_pool_net_profit_epochs (chain_id, jurisdiction_id, updated_at DESC);
