-- P1 可执行迁移：与 04-附录-DDL草案、11 §一 项 9 一致。
-- 适用：PostgreSQL 或 CockroachDB。执行顺序：本文件从上到下。
-- 回滚：见 migrations/README.md；实现时可为每段提供 down 或前滚修复。

-- 最小 users 表（orders_projection 外键依赖；完整字段见 04 §二 2.1）
CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               TEXT NOT NULL,
    password_hash       TEXT,
    role                TEXT NOT NULL DEFAULT 'tourist',
    kyc_status          TEXT NOT NULL DEFAULT 'none',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1. event_log（append-only）
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

-- 2. checkpoints_sharded
CREATE TABLE IF NOT EXISTS checkpoints_sharded (
    consumer_id         TEXT NOT NULL,
    chain_id            BIGINT NOT NULL,
    block_number        BIGINT NOT NULL,
    log_index           INT NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (consumer_id, chain_id)
);

-- 3. orders_projection（依赖 users）
CREATE TABLE IF NOT EXISTS orders_projection (
    order_id            BYTEA PRIMARY KEY,
    chain_id            BIGINT NOT NULL,
    escrow_address      BYTEA,
    tourist_id          UUID REFERENCES users(id),
    guide_id            UUID REFERENCES users(id),
    status              TEXT NOT NULL,
    amount              NUMERIC(36,18),
    token               BYTEA,
    paid_at_block       BIGINT,
    paid_at_log_index   INT,
    completed_at_block  BIGINT,
    dispute_opened_at_block BIGINT,
    resolution_type     TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_projection_chain_status ON orders_projection (chain_id, status);

-- 4. reconciliation_reports
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

-- 5. correction_log
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

-- 6. executor_executions
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

-- 7. idempotency_keys
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key_hash            BYTEA PRIMARY KEY,
    key_scope           TEXT NOT NULL,
    response_snapshot   JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_scope ON idempotency_keys (key_scope);
