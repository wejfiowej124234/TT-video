-- 自由市场「星标」账户级持久化（94 / P29）；与前端 `/market` 卡片 id 同源（order_id / guide_id）
CREATE TABLE IF NOT EXISTS market_travel_bookmarks (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('order', 'guide')),
    target_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_market_travel_bookmarks_user ON market_travel_bookmarks (user_id);
