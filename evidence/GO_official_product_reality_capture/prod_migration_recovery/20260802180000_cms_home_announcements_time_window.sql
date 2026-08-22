-- Homepage Announcement CMS · governed home surface with calendar window
-- SSOT consumer: GET /api/v1/public/announcements?for_home=1

CREATE OR REPLACE VIEW governed_home_announcements_v1 AS
SELECT
    id,
    slug,
    lane,
    kind,
    content_tier,
    pinned,
    sort_order,
    title_zh,
    title_en,
    summary_zh,
    summary_en,
    body_zh,
    body_en,
    effective_at,
    release_at,
    target_at,
    cta_kind,
    cta_href,
    network_scope,
    message_key,
    published_at,
    updated_at
FROM governed_public_announcements_v1
WHERE lane = 'product'
  AND (effective_at IS NULL OR effective_at <= CURRENT_DATE)
  AND (release_at IS NULL OR release_at <= CURRENT_DATE)
  AND (target_at IS NULL OR target_at >= CURRENT_DATE);
