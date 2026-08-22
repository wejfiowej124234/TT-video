-- CMS public surface · production polish (announcements product lane + roadmap copy)
-- Archives local demo row · seeds user-facing product announcements aligned with static SSOT slugs

UPDATE cms_public_announcements
SET publish_status = 'archived', version = version + 1, updated_at = now()
WHERE slug = 'cms-ops-demo-launch' AND publish_status <> 'archived';

UPDATE cms_roadmap_section
SET
    title_zh = period_label || ' 交付里程碑',
    title_en = period_label || ' delivery milestones',
    subtitle_zh = period_label || ' 年两项产品交付里程碑 — 手机 App 与中国地区向导；Web3 运行时与 TTG 认购见上方专区。',
    subtitle_en = period_label || ' — two product milestones (mobile app and China-region guides); Web3 runtime and TTG rounds are in the sections above.',
    disclaimer_zh = '交付里程碑为当年目标；具体排期随工程与合规进展更新。「已完成」仅由运营核实证据后手动标记，不会因日历自动变更。',
    disclaimer_en = 'Delivery milestones are targets for the labeled period; schedules may shift with engineering and compliance. “Completed” is set manually after ops evidence — never by calendar alone.',
    version = version + 1,
    updated_at = now()
WHERE singleton_key = 'active';

UPDATE cms_public_announcements
SET
    title_zh = '手机 App — 产品交付',
    title_en = 'Mobile app — product delivery',
    summary_zh = '交付 TravelTrust 手机 App：规划行程、联系向导、查看托管 — 与网页版相同规则与账户体系。',
    summary_en = 'TravelTrust mobile app: plan trips, contact guides, view escrow — same rules and account as web.',
    version = version + 1,
    updated_at = now()
WHERE slug = 'milestone-app-launch' AND lane = 'roadmap';

UPDATE cms_public_announcements
SET
    title_zh = '中国地区向导 — 首发市场',
    title_en = 'China region guides — first market',
    summary_zh = '优先开放中国地区认证向导入驻与预约；与网页版相同规则，具体城市批次随合规与运营排期公布。',
    summary_en = 'Priority onboarding for certified China-region guides and bookings; same rules as web; city batches per compliance and ops schedule.',
    version = version + 1,
    updated_at = now()
WHERE slug = 'milestone-china-guides' AND lane = 'roadmap';

INSERT INTO cms_public_announcements (
    slug, lane, kind, content_tier, publish_status, pinned, sort_order,
    title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
    effective_at, release_at, cta_kind, cta_href, network_scope, message_key, published_at
) VALUES
(
    'product-planned-launch',
    'product',
    'product',
    'upcoming',
    'published',
    true,
    100,
    'TravelTrust 定制旅行',
    'TravelTrust custom travel',
    '计划于 2026 年 7 月 15 日公网开放定制行程与向导对接 — 以 Production GO 为准。TTG 公众认购见下方 TTG 专区。',
    'Custom itineraries and certified guides planned for public launch on July 15, 2026 — subject to Production GO. TTG public rounds are in the TTG section below.',
    '对接认证向导，规划定制行程；产品开放后支持 USDC 托管与链上结算。非主网资金承诺。',
    'Connect with certified guides and plan custom trips; USDC escrow and on-chain settlement after product GO. Not a mainnet funds commitment.',
    NULL,
    '2026-07-15',
    'learn_more',
    '/traveltrust',
    'none',
    'traveltrust_product_ann_planned_launch',
    now()
),
(
    'product-escrow-usdc',
    'product',
    'trust',
    'upcoming',
    'published',
    false,
    80,
    'USDC 托管 — 双方确认后释放',
    'USDC escrow — release after mutual confirmation',
    '行程订金进入智能合约托管，不经平台保管。产品上线门闸通过后可用。',
    'Trip deposits lock in smart-contract escrow — not platform custody. Available after product GO.',
    NULL,
    NULL,
    NULL,
    '2026-07-15',
    'learn_more',
    '/trust',
    'none',
    'traveltrust_product_ann_escrow',
    now()
),
(
    'product-guide-merchant',
    'product',
    'product',
    'upcoming',
    'published',
    false,
    60,
    '向导与商家 — 随上线开放入驻',
    'Guides and merchants — onboarding with launch',
    '认证向导与商家店铺遵循与旅行者相同的托管与信任规则。',
    'Certified guides and merchant shops follow the same escrow and trust rules as travelers.',
    NULL,
    NULL,
    NULL,
    '2026-07-15',
    'learn_more',
    '/provider/register',
    'none',
    'traveltrust_product_ann_guide_merchant',
    now()
),
(
    'product-governance-teaser',
    'product',
    'community',
    'upcoming',
    'published',
    false,
    40,
    '治理 — 提案与投票（启用后）',
    'Governance — proposals and voting (when enabled)',
    '社区提案与链上投票在所连接网络治理启用后开放。',
    'Community proposals and on-chain voting open when governance is enabled on the connected network.',
    NULL,
    NULL,
    NULL,
    '2026-07-15',
    'vote_now',
    '/governance/proposals',
    'none',
    'traveltrust_product_ann_governance',
    now()
),
(
    'product-security-disclosure',
    'product',
    'trust',
    'live',
    'published',
    false,
    20,
    '安全与风险披露 — 信任中心',
    'Security and risk disclosure — Trust Center',
    '白话规则、运行时核对与可下载留档 — 非投资建议。',
    'Plain-language rules, runtime checks, and downloadable records — not investment advice.',
    NULL,
    NULL,
    '2026-07-15',
    NULL,
    'learn_more',
    '/trust',
    'all',
    'traveltrust_product_ann_security',
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
    body_zh = EXCLUDED.body_zh,
    body_en = EXCLUDED.body_en,
    effective_at = EXCLUDED.effective_at,
    release_at = EXCLUDED.release_at,
    cta_kind = EXCLUDED.cta_kind,
    cta_href = EXCLUDED.cta_href,
    network_scope = EXCLUDED.network_scope,
    message_key = EXCLUDED.message_key,
    published_at = COALESCE(cms_public_announcements.published_at, now()),
    version = cms_public_announcements.version + 1,
    updated_at = now();
