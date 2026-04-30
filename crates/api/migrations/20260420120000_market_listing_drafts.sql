-- 94 自由市场子站：创作台草稿 PG 持久化（与 `routes/market_subsite.rs` 对读）
CREATE TABLE IF NOT EXISTS market_listing_drafts (
    id UUID PRIMARY KEY,
    variant TEXT NOT NULL CHECK (variant IN ('provider', 'acquisition')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS market_listing_drafts_saved_at_idx ON market_listing_drafts (saved_at DESC);
CREATE INDEX IF NOT EXISTS market_listing_drafts_variant_idx ON market_listing_drafts (variant);
