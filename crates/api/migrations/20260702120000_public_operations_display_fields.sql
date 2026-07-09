-- Public Operations · display_* fields (SSOT-PUB-OPS Phase 2 / F-OO-06 O1)

ALTER TABLE guides
    ADD COLUMN IF NOT EXISTS display_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (display_status IN ('draft', 'published', 'hidden', 'archived')),
    ADD COLUMN IF NOT EXISTS display_origin TEXT NOT NULL DEFAULT 'REAL'
        CHECK (display_origin IN ('REAL', 'OFFICIAL', 'SHOWCASE', 'TEST', 'SMOKE', 'SYSTEM')),
    ADD COLUMN IF NOT EXISTS display_source TEXT;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS display_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (display_status IN ('draft', 'published', 'hidden', 'archived')),
    ADD COLUMN IF NOT EXISTS display_origin TEXT NOT NULL DEFAULT 'REAL'
        CHECK (display_origin IN ('REAL', 'OFFICIAL', 'SHOWCASE', 'TEST', 'SMOKE', 'SYSTEM')),
    ADD COLUMN IF NOT EXISTS display_source TEXT;

ALTER TABLE market_listings
    ADD COLUMN IF NOT EXISTS display_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (display_status IN ('draft', 'published', 'hidden', 'archived')),
    ADD COLUMN IF NOT EXISTS display_origin TEXT NOT NULL DEFAULT 'REAL'
        CHECK (display_origin IN ('REAL', 'OFFICIAL', 'SHOWCASE', 'TEST', 'SMOKE', 'SYSTEM')),
    ADD COLUMN IF NOT EXISTS display_source TEXT;

ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS display_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (display_status IN ('draft', 'published', 'hidden', 'archived')),
    ADD COLUMN IF NOT EXISTS display_origin TEXT NOT NULL DEFAULT 'REAL'
        CHECK (display_origin IN ('REAL', 'OFFICIAL', 'SHOWCASE', 'TEST', 'SMOKE', 'SYSTEM')),
    ADD COLUMN IF NOT EXISTS display_source TEXT;

-- Backfill display_origin from legacy data_origin
UPDATE guides SET display_origin = CASE data_origin
    WHEN 'production' THEN 'REAL'
    WHEN 'test' THEN 'TEST'
    WHEN 'demo' THEN 'SHOWCASE'
    WHEN 'official_seed' THEN 'OFFICIAL'
    ELSE 'REAL' END
WHERE display_origin = 'REAL';

UPDATE orders SET display_origin = CASE data_origin
    WHEN 'production' THEN 'REAL'
    WHEN 'test' THEN 'TEST'
    WHEN 'demo' THEN 'SHOWCASE'
    WHEN 'official_seed' THEN 'OFFICIAL'
    ELSE 'REAL' END
WHERE display_origin = 'REAL';

UPDATE market_listings SET display_origin = CASE data_origin
    WHEN 'production' THEN 'REAL'
    WHEN 'test' THEN 'TEST'
    WHEN 'demo' THEN 'SHOWCASE'
    WHEN 'official_seed' THEN 'OFFICIAL'
    ELSE 'REAL' END
WHERE display_origin = 'REAL';

UPDATE community_posts SET display_origin = CASE data_origin
    WHEN 'production' THEN 'REAL'
    WHEN 'test' THEN 'TEST'
    WHEN 'demo' THEN 'SHOWCASE'
    WHEN 'official_seed' THEN 'OFFICIAL'
    ELSE 'REAL' END
WHERE display_origin = 'REAL';

-- Backfill display_status: production rows were publicly eligible under Phase 1 filter
UPDATE guides SET display_status = CASE WHEN data_origin = 'production' THEN 'published' ELSE 'draft' END;
UPDATE orders SET display_status = CASE WHEN data_origin = 'production' THEN 'published' ELSE 'draft' END;
UPDATE market_listings SET display_status = CASE WHEN data_origin = 'production' THEN 'published' ELSE 'draft' END;
UPDATE community_posts SET display_status = CASE WHEN data_origin = 'production' THEN 'published' ELSE 'draft' END;

CREATE INDEX IF NOT EXISTS idx_guides_display_status ON guides (display_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_display_status ON orders (display_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_listings_display_status ON market_listings (display_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_display_status ON community_posts (display_status, created_at DESC);
