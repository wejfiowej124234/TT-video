-- Short, scannable role + governance copy for announcement list and detail.

INSERT INTO cms_public_announcements (
    slug, lane, kind, content_tier, publish_status, pinned, sort_order,
    title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
    effective_at, release_at, cta_kind, cta_href, network_scope, message_key, published_at
) VALUES
(
    'product-role-traveler',
    'product', 'product', 'live', 'published', true, 190,
    '旅行者：USDC 结算，专属向导',
    'Traveler: USDC settlement, a dedicated guide',
    '用 USDC 支付行程。资金进智能合约托管，双方确认后才释放。注册后可找专属向导。',
    'Pay trips in USDC. Funds lock in smart-contract escrow and release after both sides confirm. Register to find a dedicated guide.',
    $zh$你是旅行者：用 USDC 付行程，一位专属向导带完整旅程。

资金不进平台账户，锁定在托管合约里，双方确认后才释放。

下一步：注册账号，浏览行程并预约。$zh$,
    $en$You are a traveler: pay in USDC, and a dedicated guide connects the full trip.

Funds do not sit in a platform account. They lock in escrow and release after both sides confirm.

Next: register, browse trips, and book.$en$,
    '2026-08-16', NULL, 'learn_more', '/auth/register', 'none',
    'traveltrust_product_ann_role_traveler', now()
),
(
    'product-role-guide',
    'product', 'product', 'live', 'published', true, 180,
    '向导：专业认证，连接全球旅行者',
    'Guide: certified professionals, global travelers',
    '完成认证后，直接接待全球旅行者。服务更自主，平台成本更低，用 USDC 结算。',
    'After certification, take travelers directly. More autonomy, lower platform cost, USDC settlement.',
    $zh$你是向导：用专业资质建立可信身份，直接连接全球旅行者。

订单资金走同一套托管，不私下收款。

下一步：申请认证，通过后发布可预约的服务。$zh$,
    $en$You are a guide: build a trusted professional identity and connect with travelers directly.

Order funds use the same escrow path — not a private transfer.

Next: apply for certification, then publish bookable services.$en$,
    '2026-08-16', NULL, 'learn_more', '/guide/register', 'none',
    'traveltrust_product_ann_role_guide', now()
),
(
    'product-role-merchant',
    'product', 'product', 'live', 'published', true, 170,
    '商家：让本地服务直连全球旅行市场',
    'Merchant: connect local services to global travel',
    '酒店、餐厅、景区可用合法资质开店，直接接到旅行者与向导，USDC 结算。',
    'Hotels, restaurants, and attractions can open a trusted shop, reach travelers and guides, and settle in USDC.',
    $zh$你是商家：把本地服务直接接到全球旅行订单。

规则公开，付款进入托管，确认后结算。

下一步：申请入驻，通过后在市场发布商品或服务。$zh$,
    $en$You are a merchant: connect local services directly to global travel orders.

Rules are public. Payments lock in escrow and settle after confirmation.

Next: apply to onboard, then list goods or services.$en$,
    '2026-08-16', NULL, 'learn_more', '/provider/register', 'none',
    'traveltrust_product_ann_role_merchant', now()
),
(
    'product-role-acquisition',
    'product', 'product', 'live', 'published', true, 160,
    '旅行收购：需求先行，不是传统代购',
    'Travel acquisition: demand-first, not traditional daigou',
    '买方先发布需求，旅行者用真实行程响应并交付。不是传统代购，也不是证券。',
    'Buyers post demand first. Travelers on real trips respond and deliver. Not traditional daigou, and not a security.',
    $zh$旅行收购是需求先行：收购人写清要什么，旅行者在真实行程里响应、采购、交付。

不是传统代购，不是证券发行，不承诺收益。

下一步：从「我的 → 身份」进入收购子站，按该页门闸操作。$zh$,
    $en$Acquisition is demand-first: buyers publish what they need; travelers on real trips respond, buy, and deliver.

Not traditional daigou, not a securities offering, and no promised yield.

Next: open the acquisition sub-site from Me → Identities and follow the gates there.$en$,
    '2026-08-16', NULL, 'learn_more', '/market/acquisition', 'none',
    'traveltrust_product_ann_role_acquisition', now()
),
(
    'product-role-steward',
    'product', 'product', 'live', 'published', true, 150,
    '区域主理人：连接协议与本地旅行生态',
    'Region steward: connect protocol to the local travel economy',
    '服务一座城的旅行网络：参与建设、按公示规则参与收益分配，并通过提案参与治理。',
    'Serve a city’s travel network: help build it, take part in published regional economics, and join governance proposals.',
    $zh$区域主理人连接全球协议和本地旅行生态，不是网站后台管理员。

可以参与区域建设、按已公示规则参与收益分配，并用治理提案监督平台。资格以入驻审核为准。

下一步：申请成为区域主理人。$zh$,
    $en$A region steward connects the global protocol to the local travel economy. This is not a back-office admin role.

You can help build the region, take part in published economics, and oversee the platform through proposals. Eligibility follows review.

Next: apply to become a region steward.$en$,
    '2026-08-16', NULL, 'learn_more', '/steward/register', 'none',
    'traveltrust_product_ann_role_steward', now()
),
(
    'governance-how-it-works',
    'governance', 'trust', 'live', 'published', true, 140,
    '规则怎么定：提案、讨论、再执行',
    'How rules are set: propose, discuss, then execute',
    '重要规则不会私下改。先写成提案，公开讨论，再按时锁流程执行。',
    'Material rules are not changed in private. They become proposals, are discussed, then execute after the timelock.',
    $zh$改规则的路径：提案 → 公开讨论 → 按治理页表决 → 时锁等待 → 执行。

公告栏只发通知。要看全文和投票状态，打开治理提案页。$zh$,
    $en$Rule changes follow: propose → discuss in public → vote as shown on the governance page → wait on the timelock → execute.

This board posts notices. Open the proposals page for full text and voting status.$en$,
    '2026-08-16', NULL, 'vote_now', '/governance/proposals', 'all',
    'traveltrust_governance_ann_how', now()
),
(
    'governance-proposals',
    'governance', 'community', 'live', 'published', false, 90,
    '打开治理提案，阅读正在发生的议题',
    'Open governance proposals and read live items',
    '完整议题列表在治理页。投票开不开放，以该页为准。',
    'The full proposal list is on the governance page. Whether voting is open is shown there.',
    $zh$治理提案页才是议题真源：全文、讨论、状态都在那里。

这条公告只是入口，不是提案列表本身。$zh$,
    $en$The governance page is the source of truth for full text, discussion, and status.

This notice is an entry, not a cloned proposal feed.$en$,
    '2026-08-16', NULL, 'vote_now', '/governance/proposals', 'all',
    'traveltrust_governance_ann_proposals', now()
),
(
    'governance-params',
    'governance', 'trust', 'live', 'published', false, 80,
    '公开参数：费率、时锁，只读可查',
    'Public parameters: fees and timelock, read-only',
    '费率、时锁等配置可在参数页查阅。这里不能改链上设置。',
    'Fees, timelock, and other config are readable on the params page. Nothing here changes the chain.',
    $zh$参数页是只读对照：看费率、时锁和已公示配置。

不能从这里改链。合约已部署也不等于 Production GO。$zh$,
    $en$The params page is a read-only check for fees, the timelock, and published config.

It cannot change the chain. Deployed is not Production GO.$en$,
    '2026-08-16', NULL, 'learn_more', '/governance/params', 'all',
    'traveltrust_governance_ann_params', now()
)
ON CONFLICT (slug) DO UPDATE SET
    title_zh = EXCLUDED.title_zh,
    title_en = EXCLUDED.title_en,
    summary_zh = EXCLUDED.summary_zh,
    summary_en = EXCLUDED.summary_en,
    body_zh = EXCLUDED.body_zh,
    body_en = EXCLUDED.body_en,
    cta_kind = EXCLUDED.cta_kind,
    cta_href = EXCLUDED.cta_href,
    pinned = EXCLUDED.pinned,
    sort_order = EXCLUDED.sort_order,
    publish_status = 'published',
    version = cms_public_announcements.version + 1,
    updated_at = now();
