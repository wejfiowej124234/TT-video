-- 94 自由市场：已发布 listing 目录（PG SSOT；与创作台草稿表分离）
CREATE TABLE IF NOT EXISTS market_listings (
    id UUID PRIMARY KEY,
    variant TEXT NOT NULL CHECK (variant IN ('provider', 'acquisition')),
    owner_user_id UUID NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS market_listings_variant_updated_idx
    ON market_listings (variant, updated_at DESC);
CREATE INDEX IF NOT EXISTS market_listings_owner_idx ON market_listings (owner_user_id);
