-- Public Operations · display_start_at / display_end_at (SSOT-PUB-OPS O5)

ALTER TABLE guides
    ADD COLUMN IF NOT EXISTS display_start_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS display_end_at TIMESTAMPTZ;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS display_start_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS display_end_at TIMESTAMPTZ;

ALTER TABLE market_listings
    ADD COLUMN IF NOT EXISTS display_start_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS display_end_at TIMESTAMPTZ;

ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS display_start_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS display_end_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_guides_display_schedule
    ON guides (display_start_at, display_end_at)
    WHERE display_status = 'published';

CREATE INDEX IF NOT EXISTS idx_orders_display_schedule
    ON orders (display_start_at, display_end_at)
    WHERE display_status = 'published';
