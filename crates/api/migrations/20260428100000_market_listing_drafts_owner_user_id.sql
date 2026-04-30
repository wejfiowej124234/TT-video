-- 94：市场创作台草稿归属用户（租户隔离）；历史无归属行删除（可重建）
ALTER TABLE market_listing_drafts ADD COLUMN IF NOT EXISTS owner_user_id UUID;

DELETE FROM market_listing_drafts WHERE owner_user_id IS NULL;

ALTER TABLE market_listing_drafts ALTER COLUMN owner_user_id SET NOT NULL;

ALTER TABLE market_listing_drafts
    ADD CONSTRAINT market_listing_drafts_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS market_listing_drafts_owner_user_id_idx ON market_listing_drafts (owner_user_id);
