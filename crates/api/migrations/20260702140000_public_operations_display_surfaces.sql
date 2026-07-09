-- Public Operations · display_surfaces (SSOT-PUB-OPS O4)

ALTER TABLE guides
    ADD COLUMN IF NOT EXISTS display_surfaces TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS display_surfaces TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE market_listings
    ADD COLUMN IF NOT EXISTS display_surfaces TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS display_surfaces TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_guides_display_surfaces_gin
    ON guides USING GIN (display_surfaces)
    WHERE display_status = 'published';

CREATE INDEX IF NOT EXISTS idx_orders_display_surfaces_gin
    ON orders USING GIN (display_surfaces)
    WHERE display_status = 'published';

CREATE INDEX IF NOT EXISTS idx_market_listings_display_surfaces_gin
    ON market_listings USING GIN (display_surfaces)
    WHERE display_status = 'published';

CREATE INDEX IF NOT EXISTS idx_community_posts_display_surfaces_gin
    ON community_posts USING GIN (display_surfaces)
    WHERE display_status = 'published';
