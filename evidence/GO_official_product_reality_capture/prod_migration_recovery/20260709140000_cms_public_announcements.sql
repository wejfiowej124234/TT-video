-- CMS · Public announcements (S0 · ① local ops)

CREATE TABLE IF NOT EXISTS cms_public_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    lane TEXT NOT NULL CHECK (
        lane IN ('product', 'governance', 'protocol_status', 'ttg_round', 'roadmap')
    ),
    kind TEXT NOT NULL CHECK (
        kind IN ('product', 'trust', 'community', 'campaign')
    ),
    content_tier TEXT NOT NULL CHECK (
        content_tier IN ('live', 'upcoming', 'roadmap')
    ),
    publish_status TEXT NOT NULL DEFAULT 'draft' CHECK (
        publish_status IN ('draft', 'in_review', 'published', 'archived')
    ),
    pinned BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    title_zh TEXT NOT NULL,
    title_en TEXT NOT NULL,
    summary_zh TEXT NOT NULL DEFAULT '',
    summary_en TEXT NOT NULL DEFAULT '',
    body_zh TEXT,
    body_en TEXT,
    effective_at DATE,
    release_at DATE,
    target_at DATE,
    cta_kind TEXT,
    cta_href TEXT,
    network_scope TEXT NOT NULL DEFAULT 'none' CHECK (
        network_scope IN ('mainnet', 'testnet', 'all', 'none')
    ),
    message_key TEXT,
    version INT NOT NULL DEFAULT 1,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_public_announcements_publish_lane
    ON cms_public_announcements (publish_status, lane, sort_order DESC);

CREATE OR REPLACE VIEW governed_public_announcements_v1 AS
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
FROM cms_public_announcements
WHERE publish_status = 'published';
