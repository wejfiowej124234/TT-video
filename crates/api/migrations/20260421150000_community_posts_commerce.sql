-- 社区帖子：「我的产品」等业务线的**权威展示分类**（可选）与已发布市场 listing 弱关联（ON DELETE SET NULL）。
-- 前端仍可在字段为空时使用启发式；生产推荐由发帖端写入。

ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS commerce_showcase_kind TEXT NULL
        CHECK (
            commerce_showcase_kind IS NULL
            OR commerce_showcase_kind IN (
                'itinerary_led',
                'lodging_led',
                'acquisition_led',
                'general_led'
            )
        );

ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS commerce_market_listing_id UUID NULL
        REFERENCES market_listings (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_community_posts_commerce_listing
    ON community_posts (commerce_market_listing_id)
    WHERE commerce_market_listing_id IS NOT NULL;

COMMENT ON COLUMN community_posts.commerce_showcase_kind IS
    'Authoritative My Products showcase line; null = clients may infer heuristically.';
COMMENT ON COLUMN community_posts.commerce_market_listing_id IS
    'Optional FK to published market_listings row owned by the same user at post time.';
