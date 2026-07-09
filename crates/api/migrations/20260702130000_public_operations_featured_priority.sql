-- Public Operations · featured + display_priority (SSOT-PUB-OPS O2/O3)

ALTER TABLE guides
    ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS display_priority INT NOT NULL DEFAULT 0;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS display_priority INT NOT NULL DEFAULT 0;

ALTER TABLE market_listings
    ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS display_priority INT NOT NULL DEFAULT 0;

ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS display_priority INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_guides_public_display_sort
    ON guides (featured DESC, display_priority DESC, updated_at DESC)
    WHERE display_status = 'published';

CREATE INDEX IF NOT EXISTS idx_orders_public_display_sort
    ON orders (featured DESC, display_priority DESC, updated_at DESC)
    WHERE display_status = 'published';

CREATE INDEX IF NOT EXISTS idx_market_listings_public_display_sort
    ON market_listings (featured DESC, display_priority DESC, updated_at DESC)
    WHERE display_status = 'published';

CREATE INDEX IF NOT EXISTS idx_community_posts_public_display_sort
    ON community_posts (featured DESC, display_priority DESC, created_at DESC)
    WHERE display_status = 'published';
