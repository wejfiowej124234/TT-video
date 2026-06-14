-- 101 v1.1.0 · S1 · P1 CMS catalog_* 表族

CREATE TABLE IF NOT EXISTS catalog_countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iso3166 CHAR(2) NOT NULL UNIQUE,
    name_zh TEXT NOT NULL,
    name_en TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    open_status TEXT NOT NULL DEFAULT 'open',
    publish_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (publish_status IN ('draft', 'in_review', 'published', 'archived')),
    version INT NOT NULL DEFAULT 1,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES catalog_countries (id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name_zh TEXT NOT NULL,
    name_en TEXT NOT NULL,
    region_label TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    open_status TEXT NOT NULL DEFAULT 'open',
    publish_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (publish_status IN ('draft', 'in_review', 'published', 'archived')),
    version INT NOT NULL DEFAULT 1,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (country_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_catalog_cities_country_id ON catalog_cities (country_id);

CREATE TABLE IF NOT EXISTS catalog_pois (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES catalog_cities (id) ON DELETE CASCADE,
    poi_type TEXT NOT NULL CHECK (poi_type IN ('attraction', 'hotel', 'food')),
    slug TEXT NOT NULL,
    name_zh TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_zh TEXT,
    description_en TEXT,
    tier TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    sort_order INT NOT NULL DEFAULT 0,
    publish_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (publish_status IN ('draft', 'in_review', 'published', 'archived')),
    version INT NOT NULL DEFAULT 1,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    legacy_value TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (city_id, poi_type, slug)
);

CREATE INDEX IF NOT EXISTS idx_catalog_pois_city_type ON catalog_pois (city_id, poi_type);

CREATE TABLE IF NOT EXISTS catalog_intercity_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_city_id UUID NOT NULL REFERENCES catalog_cities (id) ON DELETE CASCADE,
    to_city_id UUID NOT NULL REFERENCES catalog_cities (id) ON DELETE CASCADE,
    mode TEXT NOT NULL,
    duration_min INT,
    price_ref_cents BIGINT,
    rules_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    publish_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (publish_status IN ('draft', 'in_review', 'published', 'archived')),
    version INT NOT NULL DEFAULT 1,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (from_city_id, to_city_id, mode)
);

CREATE TABLE IF NOT EXISTS catalog_poi_image_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES catalog_cities (id) ON DELETE SET NULL,
    batch_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'generating', 'review', 'published', 'archived')),
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_poi_image_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES catalog_poi_image_batches (id) ON DELETE CASCADE,
    poi_id UUID NOT NULL REFERENCES catalog_pois (id) ON DELETE CASCADE,
    candidate_url TEXT NOT NULL,
    source TEXT,
    rank INT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_poi_image_candidates_batch
    ON catalog_poi_image_candidates (batch_id);

CREATE TABLE IF NOT EXISTS catalog_poi_images_published (
    poi_id UUID PRIMARY KEY REFERENCES catalog_pois (id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    batch_id UUID REFERENCES catalog_poi_image_batches (id) ON DELETE SET NULL,
    published_by UUID REFERENCES users (id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_content_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    version INT NOT NULL,
    before_json JSONB,
    after_json JSONB,
    actor_id UUID REFERENCES users (id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_content_revisions_entity
    ON catalog_content_revisions (entity_type, entity_id, created_at DESC);
