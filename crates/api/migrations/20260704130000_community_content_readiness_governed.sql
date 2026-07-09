-- Community Content Readiness (G1) · exclude demo/showcase/test from governed public feed
-- Layers A (REAL UGC) + Official (OFFICIAL) only on community_feed governed view.

-- Backfill PG showcase seed authors → demo / SHOWCASE / draft (Ops may publish via Public Operations)
UPDATE community_posts p
SET data_origin = 'demo',
    display_origin = 'SHOWCASE',
    display_status = 'draft',
    display_source = 'migration:community_content_readiness'
FROM users u
WHERE p.user_id = u.id
  AND u.email LIKE 'community-showcase-%@example.com';

-- Backfill Unsplash fixture media (legacy seed density)
UPDATE community_posts
SET data_origin = 'demo',
    display_origin = 'SHOWCASE',
    display_status = 'draft',
    display_source = 'migration:community_content_readiness_unsplash'
WHERE data_origin = 'production'
  AND EXISTS (
    SELECT 1 FROM unnest(COALESCE(media_urls, '{}')) AS u(url)
    WHERE u.url ILIKE '%images.unsplash.com%'
  );

CREATE OR REPLACE VIEW governed_community_posts_v1 AS
SELECT *
FROM community_posts p
WHERE p.display_status = 'published'
  AND p.display_origin NOT IN ('SHOWCASE', 'TEST', 'SMOKE')
  AND (
    cardinality(COALESCE(p.display_surfaces, '{}')) = 0
    OR 'community_feed' = ANY(COALESCE(p.display_surfaces, '{}'))
  )
  AND (p.display_start_at IS NULL OR p.display_start_at <= now())
  AND (p.display_end_at IS NULL OR p.display_end_at > now());

COMMENT ON VIEW governed_community_posts_v1 IS
  'PCP Governed Public View · community_feed · REAL/OFFICIAL only · excludes SHOWCASE/TEST/SMOKE';
