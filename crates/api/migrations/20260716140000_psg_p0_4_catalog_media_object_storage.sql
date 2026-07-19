-- PSG P0④ · catalog_media_assets Asset Registry object-storage columns
-- Persistent lineage: asset_id → storage_backend + object_key → CDN/Guest
-- Bake (bake_dr) is disaster-recovery only — must not be primary for published Guest.

ALTER TABLE catalog_media_assets
    ADD COLUMN IF NOT EXISTS object_key TEXT,
    ADD COLUMN IF NOT EXISTS storage_backend TEXT,
    ADD COLUMN IF NOT EXISTS content_type TEXT,
    ADD COLUMN IF NOT EXISTS byte_length BIGINT,
    ADD COLUMN IF NOT EXISTS checksum_sha256 TEXT,
    ADD COLUMN IF NOT EXISTS public_base_url TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'catalog_media_assets_storage_backend_chk'
    ) THEN
        ALTER TABLE catalog_media_assets
            ADD CONSTRAINT catalog_media_assets_storage_backend_chk
            CHECK (
                storage_backend IS NULL
                OR storage_backend IN ('tigris', 'r2', 'minio_local', 'bake_dr')
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_catalog_media_object_key
    ON catalog_media_assets (object_key)
    WHERE object_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_media_storage_backend
    ON catalog_media_assets (storage_backend)
    WHERE storage_backend IS NOT NULL;

COMMENT ON COLUMN catalog_media_assets.object_key IS
    'PSG P0④ stable object key in bucket (e.g. official-cold-start/v1/da-hero-jp-home-v1.runtime.webp)';
COMMENT ON COLUMN catalog_media_assets.storage_backend IS
    'tigris|r2|minio_local|bake_dr — bake_dr is DR seed only, not published primary';
COMMENT ON COLUMN catalog_media_assets.checksum_sha256 IS
    'Optional hex sha256 of object bytes for integrity gate';
