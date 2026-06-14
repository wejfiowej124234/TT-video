-- 107 Catalog Schema v1.0 · S2-004 · CMS catalog pricing · tiers · media · M6 · revisions
-- Order: A1→A4 · B1→B4 · C1→C4 · D1 (107 §6.2)

-- =============================================================================
-- A1 · catalog_countries
-- =============================================================================

ALTER TABLE catalog_countries
    ADD COLUMN IF NOT EXISTS import_batch_id UUID;

ALTER TABLE catalog_countries
    DROP CONSTRAINT IF EXISTS catalog_countries_open_status_check;

ALTER TABLE catalog_countries
    ADD CONSTRAINT catalog_countries_open_status_check
    CHECK (open_status IN ('open', 'closed', 'preview'));

CREATE INDEX IF NOT EXISTS idx_catalog_countries_publish
    ON catalog_countries (publish_status, sort_order);

CREATE INDEX IF NOT EXISTS idx_catalog_countries_import_batch
    ON catalog_countries (import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- =============================================================================
-- A2 · catalog_cities
-- =============================================================================

ALTER TABLE catalog_cities
    ADD COLUMN IF NOT EXISTS import_batch_id UUID;

ALTER TABLE catalog_cities
    DROP CONSTRAINT IF EXISTS catalog_cities_open_status_check;

ALTER TABLE catalog_cities
    ADD CONSTRAINT catalog_cities_open_status_check
    CHECK (open_status IN ('open', 'closed', 'preview'));

ALTER TABLE catalog_cities
    DROP CONSTRAINT IF EXISTS catalog_cities_country_id_name_zh_key;

ALTER TABLE catalog_cities
    ADD CONSTRAINT catalog_cities_country_id_name_zh_key
    UNIQUE (country_id, name_zh);

CREATE INDEX IF NOT EXISTS idx_catalog_cities_country_publish
    ON catalog_cities (country_id, publish_status);

CREATE INDEX IF NOT EXISTS idx_catalog_cities_import_batch
    ON catalog_cities (import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- =============================================================================
-- A3 · catalog_pois
-- =============================================================================

ALTER TABLE catalog_pois
    ADD COLUMN IF NOT EXISTS import_batch_id UUID;

CREATE INDEX IF NOT EXISTS idx_catalog_pois_legacy
    ON catalog_pois (legacy_value)
    WHERE legacy_value IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_pois_import_batch
    ON catalog_pois (import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- =============================================================================
-- A4 · catalog_intercity_routes
-- =============================================================================

ALTER TABLE catalog_intercity_routes
    ADD COLUMN IF NOT EXISTS import_batch_id UUID;

ALTER TABLE catalog_intercity_routes
    DROP CONSTRAINT IF EXISTS catalog_intercity_routes_mode_check;

ALTER TABLE catalog_intercity_routes
    ADD CONSTRAINT catalog_intercity_routes_mode_check
    CHECK (mode IN ('flight', 'rail'));

ALTER TABLE catalog_intercity_routes
    DROP CONSTRAINT IF EXISTS catalog_intercity_routes_from_to_distinct_check;

ALTER TABLE catalog_intercity_routes
    ADD CONSTRAINT catalog_intercity_routes_from_to_distinct_check
    CHECK (from_city_id <> to_city_id);

CREATE INDEX IF NOT EXISTS idx_catalog_intercity_from_to
    ON catalog_intercity_routes (from_city_id, to_city_id);

CREATE INDEX IF NOT EXISTS idx_catalog_intercity_publish
    ON catalog_intercity_routes (publish_status);

CREATE INDEX IF NOT EXISTS idx_catalog_intercity_import_batch
    ON catalog_intercity_routes (import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- =============================================================================
-- B1 · catalog_media_assets (before hotel tiers · 107 §6.2)
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalog_media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_kind TEXT NOT NULL
        CHECK (asset_kind IN (
            'poi_hero', 'landing_ambient', 'hotel_tier_stock', 'transport_stock', 'generic'
        )),
    source_type TEXT NOT NULL
        CHECK (source_type IN ('unsplash', 'upload', 'external_url')),
    url TEXT NOT NULL UNIQUE,
    source_page_url TEXT,
    license JSONB NOT NULL DEFAULT '{}'::jsonb,
    alt_text_zh TEXT,
    alt_text_en TEXT,
    stock_pool_key TEXT,
    country_id UUID REFERENCES catalog_countries (id) ON DELETE SET NULL,
    city_id UUID REFERENCES catalog_cities (id) ON DELETE SET NULL,
    poi_id UUID REFERENCES catalog_pois (id) ON DELETE SET NULL,
    publish_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (publish_status IN ('draft', 'in_review', 'published', 'archived')),
    version INT NOT NULL DEFAULT 1,
    import_batch_id UUID,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_media_kind_publish
    ON catalog_media_assets (asset_kind, publish_status);

CREATE INDEX IF NOT EXISTS idx_catalog_media_country
    ON catalog_media_assets (country_id)
    WHERE country_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_media_poi
    ON catalog_media_assets (poi_id)
    WHERE poi_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_media_import_batch
    ON catalog_media_assets (import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- =============================================================================
-- B2 · catalog_hotel_tier_definitions
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalog_hotel_tier_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_code TEXT NOT NULL UNIQUE
        CHECK (tier_code IN ('tier_economy', 'tier_comfort', 'tier_luxury')),
    sort_order INT NOT NULL,
    multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    label_key TEXT NOT NULL,
    description_key TEXT NOT NULL,
    submit_label_zh TEXT NOT NULL,
    stock_image_asset_id UUID REFERENCES catalog_media_assets (id) ON DELETE SET NULL,
    publish_status TEXT NOT NULL DEFAULT 'published'
        CHECK (publish_status IN ('draft', 'in_review', 'published', 'archived')),
    version INT NOT NULL DEFAULT 1,
    import_batch_id UUID,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_hotel_tiers_publish
    ON catalog_hotel_tier_definitions (publish_status);

CREATE INDEX IF NOT EXISTS idx_catalog_hotel_tiers_sort
    ON catalog_hotel_tier_definitions (sort_order);

-- =============================================================================
-- B3 · catalog_pricing_templates
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalog_pricing_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL UNIQUE REFERENCES catalog_countries (id) ON DELETE CASCADE,
    currency_code CHAR(3) NOT NULL DEFAULT 'CNY',
    city_transport_price JSONB NOT NULL,
    intercity_price_per_person JSONB NOT NULL,
    per_attraction_cents BIGINT NOT NULL
        CHECK (per_attraction_cents >= 0),
    per_food_cents BIGINT NOT NULL
        CHECK (per_food_cents >= 0),
    hotel_base_per_night_cents BIGINT NOT NULL
        CHECK (hotel_base_per_night_cents >= 0),
    guide_levels_per_day JSONB NOT NULL,
    publish_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (publish_status IN ('draft', 'in_review', 'published', 'archived')),
    version INT NOT NULL DEFAULT 1,
    import_batch_id UUID,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_pricing_publish
    ON catalog_pricing_templates (publish_status);

CREATE INDEX IF NOT EXISTS idx_catalog_pricing_import_batch
    ON catalog_pricing_templates (import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- =============================================================================
-- B4 · catalog_transport_region_rules
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalog_transport_region_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL UNIQUE REFERENCES catalog_countries (id) ON DELETE CASCADE,
    default_modes TEXT[] NOT NULL,
    rail_ui_label_key TEXT,
    flight_ui_label_key TEXT,
    notes TEXT,
    publish_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (publish_status IN ('draft', 'in_review', 'published', 'archived')),
    version INT NOT NULL DEFAULT 1,
    import_batch_id UUID,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_transport_region_publish
    ON catalog_transport_region_rules (publish_status);

-- =============================================================================
-- C1 · catalog_poi_image_batches (M6)
-- =============================================================================

ALTER TABLE catalog_poi_image_batches
    ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES catalog_countries (id) ON DELETE SET NULL;

ALTER TABLE catalog_poi_image_batches
    ADD COLUMN IF NOT EXISTS poi_kind TEXT NOT NULL DEFAULT 'attraction';

ALTER TABLE catalog_poi_image_batches
    DROP CONSTRAINT IF EXISTS catalog_poi_image_batches_poi_kind_check;

ALTER TABLE catalog_poi_image_batches
    ADD CONSTRAINT catalog_poi_image_batches_poi_kind_check
    CHECK (poi_kind IN ('attraction', 'food'));

ALTER TABLE catalog_poi_image_batches
    ADD COLUMN IF NOT EXISTS selected_candidate_id UUID;

ALTER TABLE catalog_poi_image_batches
    ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE catalog_poi_image_batches
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

ALTER TABLE catalog_poi_image_batches
    ADD COLUMN IF NOT EXISTS import_batch_id UUID;

ALTER TABLE catalog_poi_image_batches
    ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_poi_image_batches_city_kind
    ON catalog_poi_image_batches (city_id, poi_kind);

CREATE INDEX IF NOT EXISTS idx_poi_image_batches_import_batch
    ON catalog_poi_image_batches (import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- =============================================================================
-- C2 · catalog_poi_image_candidates (M6)
-- =============================================================================

ALTER TABLE catalog_poi_image_candidates
    ADD COLUMN IF NOT EXISTS source_page_url TEXT;

ALTER TABLE catalog_poi_image_candidates
    ADD COLUMN IF NOT EXISTS scene_description TEXT;

ALTER TABLE catalog_poi_image_candidates
    ADD COLUMN IF NOT EXISTS license TEXT;

ALTER TABLE catalog_poi_image_candidates
    ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE catalog_poi_image_candidates
    DROP CONSTRAINT IF EXISTS catalog_poi_image_candidates_review_status_check;

ALTER TABLE catalog_poi_image_candidates
    ADD CONSTRAINT catalog_poi_image_candidates_review_status_check
    CHECK (review_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE catalog_poi_image_candidates
    ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE catalog_poi_image_candidates
    ADD COLUMN IF NOT EXISTS import_batch_id UUID;

ALTER TABLE catalog_poi_image_candidates
    DROP CONSTRAINT IF EXISTS catalog_poi_image_candidates_batch_poi_rank_key;

ALTER TABLE catalog_poi_image_candidates
    ADD CONSTRAINT catalog_poi_image_candidates_batch_poi_rank_key
    UNIQUE (batch_id, poi_id, rank);

CREATE INDEX IF NOT EXISTS idx_poi_image_candidates_poi
    ON catalog_poi_image_candidates (poi_id);

CREATE INDEX IF NOT EXISTS idx_poi_image_candidates_review
    ON catalog_poi_image_candidates (batch_id, review_status);

CREATE INDEX IF NOT EXISTS idx_poi_image_candidates_import_batch
    ON catalog_poi_image_candidates (import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- =============================================================================
-- C3 · catalog_poi_images_published (M6)
-- =============================================================================

ALTER TABLE catalog_poi_images_published
    ADD COLUMN IF NOT EXISTS scene_description TEXT;

ALTER TABLE catalog_poi_images_published
    ADD COLUMN IF NOT EXISTS source_page_url TEXT;

ALTER TABLE catalog_poi_images_published
    ADD COLUMN IF NOT EXISTS license TEXT;

ALTER TABLE catalog_poi_images_published
    ADD COLUMN IF NOT EXISTS approved_candidate_id UUID;

ALTER TABLE catalog_poi_images_published
    DROP CONSTRAINT IF EXISTS catalog_poi_images_published_approved_candidate_id_fkey;

ALTER TABLE catalog_poi_images_published
    ADD CONSTRAINT catalog_poi_images_published_approved_candidate_id_fkey
    FOREIGN KEY (approved_candidate_id) REFERENCES catalog_poi_image_candidates (id) ON DELETE SET NULL;

ALTER TABLE catalog_poi_images_published
    ADD COLUMN IF NOT EXISTS media_asset_id UUID REFERENCES catalog_media_assets (id) ON DELETE SET NULL;

ALTER TABLE catalog_poi_images_published
    ADD COLUMN IF NOT EXISTS import_batch_id UUID;

ALTER TABLE catalog_poi_images_published
    ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_poi_images_published_batch
    ON catalog_poi_images_published (batch_id);

CREATE INDEX IF NOT EXISTS idx_poi_images_published_import_batch
    ON catalog_poi_images_published (import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- =============================================================================
-- C4 · catalog_content_revisions
-- =============================================================================

ALTER TABLE catalog_content_revisions
    DROP CONSTRAINT IF EXISTS catalog_content_revisions_entity_type_check;

ALTER TABLE catalog_content_revisions
    ADD CONSTRAINT catalog_content_revisions_entity_type_check
    CHECK (entity_type IN (
        'catalog_countries',
        'catalog_cities',
        'catalog_pois',
        'catalog_intercity_routes',
        'catalog_pricing_templates',
        'catalog_hotel_tier_definitions',
        'catalog_transport_region_rules',
        'catalog_media_assets',
        'catalog_poi_image_batches',
        'catalog_poi_images_published'
    ));

ALTER TABLE catalog_content_revisions
    DROP CONSTRAINT IF EXISTS catalog_content_revisions_entity_version_key;

ALTER TABLE catalog_content_revisions
    ADD CONSTRAINT catalog_content_revisions_entity_version_key
    UNIQUE (entity_type, entity_id, version);

-- =============================================================================
-- D1 · deferred FK: batches.selected_candidate_id → candidates
-- =============================================================================

ALTER TABLE catalog_poi_image_batches
    DROP CONSTRAINT IF EXISTS catalog_poi_image_batches_selected_candidate_id_fkey;

ALTER TABLE catalog_poi_image_batches
    ADD CONSTRAINT catalog_poi_image_batches_selected_candidate_id_fkey
    FOREIGN KEY (selected_candidate_id) REFERENCES catalog_poi_image_candidates (id) ON DELETE SET NULL;
