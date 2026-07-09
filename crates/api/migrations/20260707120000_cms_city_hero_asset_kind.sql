-- City Hero Wave 1 · WP0
-- Extend catalog_media_assets.asset_kind CHECK to allow city_hero.
-- Scope: DB only · no Admin/API/Runtime/Frontend · no asset ingest.

ALTER TABLE catalog_media_assets
    DROP CONSTRAINT IF EXISTS catalog_media_assets_asset_kind_check;

ALTER TABLE catalog_media_assets
    ADD CONSTRAINT catalog_media_assets_asset_kind_check
    CHECK (asset_kind IN (
        'poi_hero',
        'landing_ambient',
        'hotel_tier_stock',
        'transport_stock',
        'generic',
        'city_hero'
    ));
