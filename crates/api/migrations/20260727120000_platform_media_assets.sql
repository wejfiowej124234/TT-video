-- Production Grade Parallel Eng · B-MEDIA-001 engineering SSOT
-- Unified platform media assets (image/video) → Object Storage → CDN.
-- Does NOT flip CDN Acceptance; live R2+CDN cutover remains WAITING_OWNER_CF.
-- PCR: PCR-20260727-PARALLEL-ENG-MEDIA-ADMIN-IMPL

CREATE TABLE IF NOT EXISTS platform_media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    object_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    byte_size BIGINT NOT NULL CHECK (byte_size >= 0),
    status TEXT NOT NULL CHECK (status IN (
        'draft',
        'uploading',
        'processing',
        'ready',
        'published',
        'failed'
    )),
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN (
        'private',
        'owner',
        'authenticated',
        'public'
    )),
    domain TEXT NOT NULL CHECK (domain IN (
        'itinerary',
        'poi',
        'community',
        'merchant',
        'guide',
        'cms',
        'acquisition',
        'profile',
        'other'
    )),
    kind TEXT NOT NULL DEFAULT 'image' CHECK (kind IN ('image', 'video', 'other')),
    sha256_hex TEXT,
    width INTEGER,
    height INTEGER,
    duration_ms INTEGER,
    cover_object_key TEXT,
    playback_url TEXT,
    cdn_url TEXT,
    s3_multipart_upload_id TEXT,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT platform_media_assets_sha256_hex_len CHECK (
        sha256_hex IS NULL OR char_length(sha256_hex) = 64
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_media_assets_object_key
    ON platform_media_assets (object_key);

CREATE INDEX IF NOT EXISTS idx_platform_media_assets_owner_created
    ON platform_media_assets (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_media_assets_status
    ON platform_media_assets (status);

CREATE INDEX IF NOT EXISTS idx_platform_media_assets_domain_status
    ON platform_media_assets (domain, status);

COMMENT ON TABLE platform_media_assets IS
    'B-MEDIA-001 eng SSOT: unified Image/Video asset metadata; bytes live in object storage; CDN URL filled after Owner cutover';

-- Itinerary cover → asset id (kill data URL as persistence truth)
ALTER TABLE itineraries
    ADD COLUMN IF NOT EXISTS cover_media_asset_id UUID
        REFERENCES platform_media_assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_itineraries_cover_media_asset
    ON itineraries (cover_media_asset_id)
    WHERE cover_media_asset_id IS NOT NULL;

COMMENT ON COLUMN itineraries.cover_media_asset_id IS
    'trip_media_asset_id / cover: FK to platform_media_assets; prefer over data URL / inline Base64';
