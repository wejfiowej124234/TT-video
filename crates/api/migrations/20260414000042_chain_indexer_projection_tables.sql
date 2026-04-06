-- 链上索引器投影基表：与 docs/spec/04-附录-DDL草案.md §1～§6 对齐。
-- idempotency_keys 已见于 20250308000013，此处不重复。
-- 写入路径：internal/indexer-tick 等（见 04 §7.5、110）；接链后启用持久化与回放验证。

CREATE TABLE IF NOT EXISTS event_log (
    id                  BIGSERIAL PRIMARY KEY,
    chain_id            BIGINT NOT NULL,
    block_number        BIGINT NOT NULL,
    block_hash          BYTEA NOT NULL,
    tx_hash             BYTEA NOT NULL,
    log_index           INT NOT NULL,
    event_type          TEXT NOT NULL,
    payload             JSONB NOT NULL,
    finality_n_used     INT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (chain_id, block_number, log_index)
);

CREATE INDEX IF NOT EXISTS idx_event_log_chain_block ON event_log (chain_id, block_number);
CREATE INDEX IF NOT EXISTS idx_event_log_event_type ON event_log (chain_id, event_type);

CREATE TABLE IF NOT EXISTS checkpoints_sharded (
    consumer_id         TEXT NOT NULL,
    chain_id            BIGINT NOT NULL,
    block_number        BIGINT NOT NULL,
    log_index           INT NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (consumer_id, chain_id)
);

CREATE TABLE IF NOT EXISTS orders_projection (
    order_id            BYTEA PRIMARY KEY,
    chain_id            BIGINT NOT NULL,
    escrow_address      BYTEA,
    tourist_id          UUID REFERENCES users(id),
    guide_id            UUID REFERENCES guides(id),
    status              TEXT NOT NULL,
    amount              NUMERIC(36, 18),
    token               BYTEA,
    paid_at_block       BIGINT,
    paid_at_log_index   INT,
    completed_at_block  BIGINT,
    dispute_opened_at_block BIGINT,
    resolution_type     TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_projection_chain_status ON orders_projection (chain_id, status);

CREATE TABLE IF NOT EXISTS reconciliation_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type         TEXT NOT NULL,
    chain_id            BIGINT,
    period_start        TIMESTAMPTZ,
    period_end          TIMESTAMPTZ,
    summary             JSONB,
    details_path        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS correction_log (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BYTEA NOT NULL,
    chain_id            BIGINT NOT NULL,
    correction_type     TEXT NOT NULL,
    reason              TEXT,
    payload             JSONB,
    approved_by         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_correction_log_order ON correction_log (chain_id, order_id);

CREATE TABLE IF NOT EXISTS executor_executions (
    resolution_id       BYTEA PRIMARY KEY,
    order_id            BYTEA NOT NULL,
    chain_id            BIGINT NOT NULL,
    escrow_address      BYTEA NOT NULL,
    resolution_type     TEXT NOT NULL,
    tx_hash             BYTEA,
    status              TEXT NOT NULL,
    approved_by         TEXT,
    snapshot_hash       BYTEA,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
