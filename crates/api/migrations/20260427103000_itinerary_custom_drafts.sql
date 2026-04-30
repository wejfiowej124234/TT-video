-- 49 A：自定义行程创作台草稿 PG 持久化（与 `POST /api/v1/itineraries/custom/drafts` 对读）
CREATE TABLE IF NOT EXISTS itinerary_custom_drafts (
    id UUID PRIMARY KEY,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS itinerary_custom_drafts_saved_at_idx ON itinerary_custom_drafts (saved_at DESC);
