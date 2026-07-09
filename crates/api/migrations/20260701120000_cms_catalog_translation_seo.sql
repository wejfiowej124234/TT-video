-- C-S7/C-S8 · Catalog translation entries + SEO metadata (Admin CMS)

CREATE TABLE IF NOT EXISTS catalog_translation_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    locale TEXT NOT NULL,
    field_key TEXT NOT NULL,
    value TEXT NOT NULL,
    publish_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (publish_status IN ('draft', 'in_review', 'published', 'archived')),
    version INT NOT NULL DEFAULT 1,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT catalog_translation_entries_locale_check CHECK (char_length(locale) BETWEEN 2 AND 16),
    CONSTRAINT catalog_translation_entries_field_key_check CHECK (char_length(field_key) BETWEEN 1 AND 64),
    CONSTRAINT catalog_translation_entries_unique_active UNIQUE (entity_type, entity_id, locale, field_key)
);

CREATE INDEX IF NOT EXISTS idx_catalog_translation_entries_entity
    ON catalog_translation_entries (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_catalog_translation_entries_publish
    ON catalog_translation_entries (publish_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS catalog_seo_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    locale TEXT NOT NULL DEFAULT '*',
    title TEXT,
    description TEXT,
    keywords TEXT,
    canonical_url TEXT,
    og_image_url TEXT,
    publish_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (publish_status IN ('draft', 'in_review', 'published', 'archived')),
    version INT NOT NULL DEFAULT 1,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT catalog_seo_metadata_locale_check CHECK (char_length(locale) BETWEEN 1 AND 16),
    CONSTRAINT catalog_seo_metadata_unique_active UNIQUE (entity_type, entity_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_catalog_seo_metadata_entity
    ON catalog_seo_metadata (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_catalog_seo_metadata_publish
    ON catalog_seo_metadata (publish_status, updated_at DESC);
