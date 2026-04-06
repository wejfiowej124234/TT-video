-- Phase 5：评价双写与并发安全 — 每订单每位评审人至多一条评价（与 chain_off 语义一致）
CREATE UNIQUE INDEX IF NOT EXISTS ux_reviews_order_id_reviewer_id ON reviews (order_id, reviewer_id);
