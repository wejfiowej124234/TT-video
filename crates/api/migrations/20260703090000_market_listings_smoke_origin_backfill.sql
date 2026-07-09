-- Backfill smoke / multi-demo / probe market_listings to non-production data_origin
-- SSOT: chain_off::is_dev_catalog_email + payload_text_is_smoke_market_listing

UPDATE market_listings ml
SET data_origin = 'test'
FROM users u
WHERE ml.owner_user_id = u.id
  AND lower(trim(u.email)) = 'multi-demo@test.com'
  AND ml.data_origin = 'production';

UPDATE market_listings
SET data_origin = 'demo'
WHERE data_origin = 'production'
  AND (
    lower(coalesce(payload->>'title', '')) LIKE '%multi-demo%'
    OR lower(coalesce(payload->>'title', '')) LIKE 'probe%'
    OR lower(coalesce(payload->>'title', '')) LIKE '% smoke%'
    OR lower(coalesce(payload->>'description', '')) LIKE '%l3 closure%'
    OR lower(coalesce(payload->>'summary', '')) LIKE '%l3 closure%'
  );
