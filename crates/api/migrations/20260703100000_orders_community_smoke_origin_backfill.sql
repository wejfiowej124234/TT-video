-- Backfill smoke orders + community_posts data_origin (staging DDG full-site)

UPDATE orders o
SET data_origin = 'test'
FROM users u
WHERE o.tourist_id = u.id
  AND lower(trim(u.email)) IN (
    'tourist@test.com',
    'guide@test.com',
    'multi-demo@test.com',
    'merchant@test.com',
    'provider-did-rank-demo@test.com',
    'steward-did-rank-demo@test.com'
  )
  AND o.data_origin = 'production';

UPDATE community_posts cp
SET data_origin = 'test'
FROM users u
WHERE cp.user_id = u.id
  AND lower(trim(u.email)) IN (
    'tourist@test.com',
    'guide@test.com',
    'multi-demo@test.com',
    'merchant@test.com',
    'provider-did-rank-demo@test.com',
    'steward-did-rank-demo@test.com'
  )
  AND cp.data_origin = 'production';

UPDATE community_posts
SET data_origin = 'test'
WHERE data_origin = 'production'
  AND (
    lower(coalesce(body, '')) LIKE 'e2e-%'
    OR lower(coalesce(body, '')) LIKE 'pi1-fe-%'
    OR lower(coalesce(body, '')) LIKE 'browser-minio-%'
    OR lower(coalesce(body, '')) LIKE '%multi-demo%'
    OR lower(coalesce(body, '')) LIKE '%l3 closure%'
    OR lower(coalesce(body, '')) LIKE '%probe%'
    OR lower(coalesce(body, '')) LIKE '%publish hub demo%'
  );
