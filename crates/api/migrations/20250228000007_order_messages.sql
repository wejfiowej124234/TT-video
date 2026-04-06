-- 业务表：order_messages（P16 订单聊天；04-附录-DDL §9.8）
-- 与 chain_off::MessageRow 对齐；供启动 hydrate 与 GET/POST /api/v1/orders/:id/messages 双写

CREATE TABLE IF NOT EXISTS order_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_id           UUID NOT NULL REFERENCES users(id),
    content             TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_messages_order ON order_messages (order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_created ON order_messages (order_id, created_at);
