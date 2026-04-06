-- 业务表：itineraries（P15/17 行程生成层；04-附录-DDL §7.5、§9.10）
-- 与 chain_off::ItineraryBundle 对齐；一单一行（order_id 唯一），days 存 JSONB；供启动 hydrate 与 POST /api/v1/itineraries 双写

CREATE TABLE IF NOT EXISTS itineraries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    draft_id            TEXT,
    version             INT NOT NULL DEFAULT 1,
    destination         TEXT NOT NULL DEFAULT '',
    city                TEXT NOT NULL DEFAULT '',
    days_json           JSONB NOT NULL DEFAULT '[]',
    amount_breakdown_json JSONB,
    snapshot_hash       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_itineraries_order ON itineraries (order_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_draft ON itineraries (draft_id) WHERE draft_id IS NOT NULL;
