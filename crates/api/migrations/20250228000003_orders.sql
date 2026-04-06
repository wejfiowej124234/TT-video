-- 业务表：orders（04-附录-DDL草案 §9.4）；与 chain_off::OrderRow 对齐
-- 订单创建/状态变更双写，启动 hydrate

CREATE TABLE IF NOT EXISTS orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tourist_id          UUID NOT NULL REFERENCES users(id),
    guide_id            UUID NOT NULL REFERENCES guides(id),
    amount              TEXT NOT NULL,
    currency            TEXT NOT NULL DEFAULT 'USD',
    status              TEXT NOT NULL,
    escrow_address      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at         TIMESTAMPTZ,
    escrowed_at         TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    dispute_deadline_at TIMESTAMPTZ,
    auto_complete_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_tourist ON orders (tourist_id);
CREATE INDEX IF NOT EXISTS idx_orders_guide ON orders (guide_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
