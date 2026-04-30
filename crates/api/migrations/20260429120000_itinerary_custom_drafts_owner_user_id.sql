-- 49 A：自定义行程草稿归属用户（与自由市场 `market_listing_drafts.owner_user_id` 对齐）；历史无归属行删除（可重建）
ALTER TABLE itinerary_custom_drafts ADD COLUMN IF NOT EXISTS owner_user_id UUID;

DELETE FROM itinerary_custom_drafts WHERE owner_user_id IS NULL;

ALTER TABLE itinerary_custom_drafts ALTER COLUMN owner_user_id SET NOT NULL;

ALTER TABLE itinerary_custom_drafts
    ADD CONSTRAINT itinerary_custom_drafts_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS itinerary_custom_drafts_owner_user_id_idx ON itinerary_custom_drafts (owner_user_id);
