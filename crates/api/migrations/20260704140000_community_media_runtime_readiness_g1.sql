-- Community Media Runtime Readiness (G1 · PRM-MEDIA-B001)
-- Downgrade published posts with legacy/demo/stale media — no PCP schema changes.

-- Any still-published SHOWCASE/TEST/SMOKE → draft
UPDATE community_posts
SET display_status = 'draft',
    display_source = 'migration:community_media_runtime_readiness_g1'
WHERE display_status = 'published'
  AND display_origin IN ('SHOWCASE', 'TEST', 'SMOKE');

-- Legacy demo hosts (Unsplash / sample MP4 sites)
UPDATE community_posts p
SET display_status = 'draft',
    display_origin = CASE
      WHEN display_origin IN ('REAL', 'OFFICIAL', 'CAMPAIGN') THEN display_origin
      ELSE 'SHOWCASE'
    END,
    display_source = 'migration:community_media_runtime_readiness_g1_legacy_host'
WHERE display_status = 'published'
  AND (
    COALESCE(cover_url, '') ILIKE ANY (ARRAY[
      '%unsplash.com%', '%w3schools.com%', '%samplelib.com%', '%filesamples.com%'
    ])
    OR EXISTS (
      SELECT 1 FROM unnest(COALESCE(p.media_urls, '{}')) AS u(url)
      WHERE u.url ILIKE ANY (ARRAY[
        '%unsplash.com%', '%w3schools.com%', '%samplelib.com%', '%filesamples.com%'
      ])
    )
  );

-- Legacy local upload videos (pre multipart S3) — unpublish until re-upload via community_media_assets
UPDATE community_posts p
SET display_status = 'draft',
    display_source = 'migration:community_media_runtime_readiness_g1_legacy_upload_video'
WHERE display_status = 'published'
  AND (
    post_type = 'video'
    OR COALESCE(cardinality(media_urls), 0) > 0
  )
  AND primary_media_asset_id IS NULL
  AND EXISTS (
    SELECT 1 FROM unnest(COALESCE(p.media_urls, '{}')) AS u(url)
    WHERE u.url ILIKE '%/uploads/community-posts/%'
      AND u.url ~* '\.(mp4|webm|mov|m4v)(\?|$|#)'
  );

-- Stale test CDN playback without bound asset
UPDATE community_posts p
SET display_status = 'draft',
    display_source = 'migration:community_media_runtime_readiness_g1_stale_test_cdn'
WHERE display_status = 'published'
  AND primary_media_asset_id IS NULL
  AND (
    COALESCE(cover_url, '') ILIKE '%cdn.example.test%'
    OR EXISTS (
      SELECT 1 FROM unnest(COALESCE(p.media_urls, '{}')) AS u(url)
      WHERE u.url ILIKE '%cdn.example.test%'
    )
  );

COMMENT ON COLUMN community_posts.display_source IS
  'Public ops / migration provenance; community_media_runtime_readiness_g1_* = PRM-MEDIA-B001 remediation';
