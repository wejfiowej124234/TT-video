-- S4a · Vacancy Ledger V1 indexer projection (read-only SSOT for Dashboard S4b).

CREATE TABLE IF NOT EXISTS vacancy_ledger_projections (
    chain_id                        BIGINT NOT NULL,
    jurisdiction_id                 TEXT NOT NULL,
    state                           TEXT NOT NULL,
    principal_u256                    TEXT NOT NULL,
    swept_u256                      TEXT NOT NULL,
    reserve_u256                    TEXT NOT NULL,
    disbursed_u256                  TEXT NOT NULL,
    sweep_enabled                   BOOLEAN NOT NULL DEFAULT true,
    steward_activation_epoch_id     TEXT,
    last_block_number               BIGINT,
    last_log_index                  INT,
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chain_id, jurisdiction_id)
);

CREATE INDEX IF NOT EXISTS idx_vacancy_ledger_projections_updated
    ON vacancy_ledger_projections (chain_id, updated_at DESC);
