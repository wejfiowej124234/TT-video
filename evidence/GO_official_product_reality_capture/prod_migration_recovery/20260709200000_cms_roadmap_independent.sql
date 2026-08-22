-- CMS · Product roadmap (independent lane · not in announcements list / Pulse)

CREATE TABLE IF NOT EXISTS cms_roadmap_section (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    singleton_key TEXT NOT NULL UNIQUE DEFAULT 'active',
    anchor_id TEXT NOT NULL DEFAULT 'product-roadmap',
    period_label TEXT NOT NULL DEFAULT '2026',
    kicker_zh TEXT NOT NULL,
    kicker_en TEXT NOT NULL,
    title_zh TEXT NOT NULL,
    title_en TEXT NOT NULL,
    subtitle_zh TEXT NOT NULL DEFAULT '',
    subtitle_en TEXT NOT NULL DEFAULT '',
    disclaimer_zh TEXT NOT NULL DEFAULT '',
    disclaimer_en TEXT NOT NULL DEFAULT '',
    publish_status TEXT NOT NULL DEFAULT 'draft' CHECK (
        publish_status IN ('draft', 'in_review', 'published', 'archived')
    ),
    version INT NOT NULL DEFAULT 1,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cms_public_announcements
    ADD COLUMN IF NOT EXISTS ops_status TEXT CHECK (
        ops_status IS NULL OR ops_status IN ('planned', 'in_progress', 'completed')
    );

-- Announcements + Pulse must not surface roadmap rows
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
WHERE publish_status = 'published'
  AND lane NOT IN ('roadmap', 'ttg_round');

CREATE OR REPLACE VIEW governed_public_roadmap_milestones_v1 AS
SELECT
    id,
    slug,
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
    target_at,
    cta_kind,
    cta_href,
    network_scope,
    message_key,
    ops_status,
    published_at,
    updated_at
FROM cms_public_announcements
WHERE publish_status = 'published'
  AND lane = 'roadmap';

CREATE OR REPLACE VIEW governed_public_roadmap_section_v1 AS
SELECT
    anchor_id,
    period_label,
    kicker_zh,
    kicker_en,
    title_zh,
    title_en,
    subtitle_zh,
    subtitle_en,
    disclaimer_zh,
    disclaimer_en,
    published_at,
    updated_at
FROM cms_roadmap_section
WHERE publish_status = 'published'
  AND singleton_key = 'active';

INSERT INTO cms_roadmap_section (
    singleton_key,
    anchor_id,
    period_label,
    kicker_zh,
    kicker_en,
    title_zh,
    title_en,
    subtitle_zh,
    subtitle_en,
    disclaimer_zh,
    disclaimer_en,
    publish_status,
    published_at
) VALUES (
    'active',
    'product-roadmap',
    '2026',
    '产品路线图',
    'Product roadmap',
    '2026 交付里程碑',
    '2026 delivery milestones',
    '2026 年两项产品交付里程碑 — 手机 App 与中国地区向导首发；Web3 运行时与 TTG 认购见上方 Pulse / TTG 区块。',
    'Two 2026 product delivery milestones — mobile app and China-region guides first; Web3 runtime and TTG rounds live above in Pulse / TTG.',
    '「2026 里程碑」为当年交付目标；具体排期随工程与合规进展更新。「已完成」仅由运营核实证据后手动标记，不会因日历自动变更。',
    '2026 milestones are delivery targets for the year; schedules may shift with engineering and compliance. “Completed” is set manually after ops evidence — never by calendar alone.',
    'published',
    now()
) ON CONFLICT (singleton_key) DO NOTHING;

INSERT INTO cms_public_announcements (
    slug, lane, kind, content_tier, publish_status, sort_order,
    title_zh, title_en, summary_zh, summary_en,
    cta_kind, cta_href, ops_status, message_key, published_at
) VALUES
(
    'milestone-app-launch',
    'roadmap',
    'product',
    'roadmap',
    'published',
    10,
    '手机 App — 2026 产品交付',
    'Mobile app — 2026 product delivery',
    '2026 年交付 TravelTrust 手机 App：规划行程、联系向导、查看托管 — 与网页版相同规则与账户体系。',
    'TravelTrust mobile app in 2026: plan trips, contact guides, view escrow — same rules and account as web.',
    'learn_more',
    '/traveltrust',
    'planned',
    'traveltrust_roadmap_2026_app',
    now()
),
(
    'milestone-china-guides',
    'roadmap',
    'product',
    'roadmap',
    'published',
    20,
    '中国地区向导 — 2026 首发市场',
    'China region guides — 2026 first market',
    '2026 年优先开放中国地区认证向导入驻与预约；与网页版相同规则，具体城市批次随合规与运营排期公布。',
    '2026 priority: certified China-region guides onboarding and booking; same rules as web; city batches per compliance and ops schedule.',
    'learn_more',
    '/traveltrust/announcements#product-roadmap-milestone-china-guides',
    'planned',
    'traveltrust_roadmap_2026_china_guides',
    now()
) ON CONFLICT (slug) DO NOTHING;
