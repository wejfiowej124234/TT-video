-- PSG P0⑤ / P0② · canonical_key lifecycle + historical data_origin (no DELETE for superseded rows)
-- Guest filter: production + published only; historical/test/demo excluded from public catalog.

ALTER TABLE market_listings
    ADD COLUMN IF NOT EXISTS canonical_key TEXT;

ALTER TABLE market_listings DROP CONSTRAINT IF EXISTS market_listings_data_origin_check;

ALTER TABLE market_listings
    ADD CONSTRAINT market_listings_data_origin_check
    CHECK (data_origin IN ('production', 'test', 'demo', 'historical'));

UPDATE market_listings
SET canonical_key = COALESCE(
    NULLIF(trim(payload->>'canonical_key'), ''),
    NULLIF(trim(payload->>'ocs_chain_id'), ''),
    'legacy:' || id::text
)
WHERE canonical_key IS NULL OR trim(canonical_key) = '';

UPDATE market_listings
SET payload = jsonb_set(
    COALESCE(payload, '{}'::jsonb),
    '{canonical_key}',
    to_jsonb(canonical_key),
    true
)
WHERE canonical_key IS NOT NULL
  AND (payload->>'canonical_key' IS NULL OR trim(payload->>'canonical_key') = '');

CREATE UNIQUE INDEX IF NOT EXISTS market_listings_variant_canonical_key_uidx
    ON market_listings (variant, canonical_key)
    WHERE canonical_key IS NOT NULL
      AND data_origin <> 'historical';

CREATE INDEX IF NOT EXISTS market_listings_canonical_key_lookup_idx
    ON market_listings (variant, canonical_key, data_origin, status);

COMMENT ON COLUMN market_listings.canonical_key IS
    'Stable business key for OCS UPSERT; superseded rows use data_origin=historical (no DELETE).';
