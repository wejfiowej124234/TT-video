-- PCP Phase 0 · Governed Public View for community feed (FeedBuilder read path)
-- Moderation (visibility_status, penalties) remains in query layer.
-- Governance: display_status + community_feed surface + schedule window.

CREATE OR REPLACE VIEW governed_community_posts_v1 AS
SELECT *
FROM community_posts p
WHERE p.display_status = 'published'
  AND (
    cardinality(COALESCE(p.display_surfaces, '{}')) = 0
    OR 'community_feed' = ANY(COALESCE(p.display_surfaces, '{}'))
  )
  AND (p.display_start_at IS NULL OR p.display_start_at <= now())
  AND (p.display_end_at IS NULL OR p.display_end_at > now());

COMMENT ON VIEW governed_community_posts_v1 IS
  'PCP Governed Public View · community_feed · Database→Governance→FeedBuilder→API';
