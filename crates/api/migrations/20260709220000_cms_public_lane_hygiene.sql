-- Lane hygiene · block test/demo slugs on public surface · governance → governance lane only

UPDATE cms_public_announcements
SET publish_status = 'archived', version = version + 1, updated_at = now()
WHERE publish_status = 'published'
  AND (
    slug LIKE 'cms-ops-%'
    OR slug LIKE 'cms-uat-%'
    OR slug = 'product-governance-teaser'
  );

INSERT INTO cms_public_announcements (
    slug, lane, kind, content_tier, publish_status, pinned, sort_order,
    title_zh, title_en, summary_zh, summary_en,
    effective_at, release_at, cta_kind, cta_href, network_scope, message_key, published_at
) VALUES
(
    'governance-proposals',
    'governance',
    'community',
    'upcoming',
    'published',
    false,
    100,
    '治理提案 — 浏览与投票',
    'Governance proposals — browse and vote',
    'Sepolia ② 治理提案与投票在所连接网络启用后开放 — 非主网 GO。',
    'Sepolia ② proposals and voting when enabled on the connected network — not mainnet GO.',
    NULL,
    '2026-07-15',
    'vote_now',
    '/governance/proposals',
    'testnet',
    'traveltrust_governance_ann_proposals',
    now()
),
(
    'governance-params',
    'governance',
    'trust',
    'live',
    'published',
    false,
    80,
    '协议参数 — 公开登记',
    'Protocol parameters — public registry',
    '只读参数与 Sepolia 运行时对齐；主网上线仍为独立门闸。',
    'Read-only params aligned with Sepolia runtime; mainnet launch remains a separate gate.',
    '2026-07-15',
    NULL,
    'learn_more',
    '/governance/params',
    'testnet',
    'traveltrust_governance_ann_params',
    now()
)
ON CONFLICT (slug) DO UPDATE SET
    lane = EXCLUDED.lane,
    kind = EXCLUDED.kind,
    content_tier = EXCLUDED.content_tier,
    publish_status = 'published',
    pinned = EXCLUDED.pinned,
    sort_order = EXCLUDED.sort_order,
    title_zh = EXCLUDED.title_zh,
    title_en = EXCLUDED.title_en,
    summary_zh = EXCLUDED.summary_zh,
    summary_en = EXCLUDED.summary_en,
    effective_at = EXCLUDED.effective_at,
    release_at = EXCLUDED.release_at,
    cta_kind = EXCLUDED.cta_kind,
    cta_href = EXCLUDED.cta_href,
    network_scope = EXCLUDED.network_scope,
    message_key = EXCLUDED.message_key,
    published_at = COALESCE(cms_public_announcements.published_at, now()),
    version = cms_public_announcements.version + 1,
    updated_at = now();

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
  AND lane NOT IN ('roadmap', 'ttg_round')
  AND slug NOT LIKE 'cms-ops-%'
  AND slug NOT LIKE 'cms-uat-%';
