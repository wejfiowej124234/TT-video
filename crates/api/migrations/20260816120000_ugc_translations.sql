-- UGC user-content translation cache (① mock → ② staging real key → ③ official gate)
-- NOT catalog_translation_entries / Admin CMS bilingual (postAdminContentTranslation).

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS translation_target_locale TEXT NULL;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_translation_target_locale_check;

ALTER TABLE users
    ADD CONSTRAINT users_translation_target_locale_check
    CHECK (
        translation_target_locale IS NULL
        OR translation_target_locale IN ('zh', 'en')
    );

CREATE TABLE IF NOT EXISTS ugc_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_class TEXT NOT NULL,
    content_id UUID NOT NULL,
    field TEXT NOT NULL,
    source_hash TEXT NOT NULL,
    source_locale TEXT NOT NULL DEFAULT 'und',
    target_locale TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    provider TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ugc_translations_content_class_check CHECK (char_length(content_class) BETWEEN 1 AND 64),
    CONSTRAINT ugc_translations_field_check CHECK (char_length(field) BETWEEN 1 AND 64),
    CONSTRAINT ugc_translations_source_hash_check CHECK (char_length(source_hash) = 64),
    CONSTRAINT ugc_translations_source_locale_check CHECK (char_length(source_locale) BETWEEN 2 AND 16),
    CONSTRAINT ugc_translations_target_locale_check CHECK (target_locale IN ('zh', 'en')),
    CONSTRAINT ugc_translations_unique UNIQUE (content_class, content_id, field, source_hash, target_locale)
);

CREATE INDEX IF NOT EXISTS idx_ugc_translations_lookup
    ON ugc_translations (content_class, content_id, field, target_locale);
