-- Extend smoke backfill: probe anywhere in title/description (after 20260703090000)
UPDATE market_listings
SET data_origin = 'demo'
WHERE data_origin = 'production'
  AND (
    lower(coalesce(payload->>'title', '')) LIKE '%probe%'
    OR lower(coalesce(payload->>'description', '')) LIKE '%probe%'
  );
