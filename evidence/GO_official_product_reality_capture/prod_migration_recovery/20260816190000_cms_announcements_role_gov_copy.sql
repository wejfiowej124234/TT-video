-- Official announcements hub · role + governance copy refresh (Owner video template).
-- Addresses stay in FE directory (registry/L7). Do not type addresses into CMS.

INSERT INTO cms_public_announcements (
    slug, lane, kind, content_tier, publish_status, pinned, sort_order,
    title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
    effective_at, release_at, cta_kind, cta_href, network_scope, message_key, published_at
) VALUES
(
    'product-role-traveler',
    'product',
    'product',
    'live',
    'published',
    true,
    190,
    '旅行者：USDC 结算，专属向导',
    'Traveler: USDC settlement, a dedicated guide',
    'TravelTrust 面向全球旅行者。以 USDC 统一结算，智能合约托管建立透明可信的旅行交易。一位专属向导，连接完整旅程。',
    'TravelTrust is a decentralized Web3 travel platform for global travelers. USDC settlement and smart-contract escrow make the trip payment path transparent. One dedicated guide connects the full journey.',
    $zh_traveler$TravelTrust，是面向全球旅行者的去中心化 Web3 旅行平台。

以 USDC 统一结算，降低跨境换汇与支付壁垒；通过智能合约托管与链上履约，建立透明可信的旅行交易。

一位专属向导，连接完整旅程。

TravelTrust —— 用 Web3 重构全球旅行的支付、信任与连接。

注册后即可浏览行程与向导，按页面公示规则预约。订金锁定在托管合约，双方确认后才释放。$zh_traveler$,
    $en_traveler$TravelTrust is a decentralized Web3 travel platform for global travelers.

USDC is the settlement unit, so cross-border FX and payment friction stay lower. Smart-contract escrow and on-chain fulfillment keep the trip payment path transparent.

One dedicated guide connects the full journey.

TravelTrust — rebuild global travel payments, trust, and connection with Web3.

After you register, browse trips and guides and book under published rules. Deposits lock in escrow and release only after both sides confirm.$en_traveler$,
    '2026-08-16',
    NULL,
    'learn_more',
    '/auth/register',
    'none',
    'traveltrust_product_ann_role_traveler',
    now()
),
(
    'product-role-guide',
    'product',
    'product',
    'live',
    'published',
    true,
    180,
    '向导：专业认证，连接全球旅行者',
    'Guide: certified professionals, global travelers',
    '面向全球专业向导。以资质建立可信职业身份，直接连接优质旅行者。更自主的服务、更低的平台成本、USDC 跨境结算。',
    'TravelTrust is open to professional guides worldwide. Build a trusted professional identity, reach travelers directly, keep more of the value, and settle in USDC.',
    $zh_guide$TravelTrust，是面向全球专业向导开放的 Web3 服务平台。

通过专业资质建立可信职业身份，展示能力与信誉，直接连接全球优质旅行者。

更自主的服务、更低的平台成本、USDC 快捷跨境结算。

TravelTrust —— 让专业连接全球需求，让价值回归服务者。

申请认证并完成审核后，可发布可预约的向导服务。订单资金走同一套托管，不私下收款。$zh_guide$,
    $en_guide$TravelTrust is a Web3 service platform open to professional guides worldwide.

Build a trusted professional identity with credentials, show your skill and reputation, and connect directly with travelers.

More autonomy, lower platform cost, and fast USDC cross-border settlement.

TravelTrust — connect expertise to global demand, and return value to the people who serve.

After certification review, publish bookable guide services. Order funds use the same escrow path — not a private transfer.$en_guide$,
    '2026-08-16',
    NULL,
    'learn_more',
    '/guide/register',
    'none',
    'traveltrust_product_ann_role_guide',
    now()
),
(
    'product-role-merchant',
    'product',
    'product',
    'live',
    'published',
    true,
    170,
    '商家：让本地服务直连全球旅行市场',
    'Merchant: connect local services to global travel',
    '酒店、餐厅、景区及本地服务商，可通过合法资质建立可信店铺，直接连接全球旅行者与专业向导。规则公开，USDC 跨境结算。',
    'Hotels, restaurants, attractions, and local operators can open a trusted shop with lawful credentials, reach travelers and guides directly, and settle in USDC under published rules.',
    $zh_merchant$TravelTrust，是面向全球旅行商家的开放式 Web3 服务平台。

酒店、餐厅、景区及本地服务商，可通过合法资质建立可信店铺，直接连接全球旅行者与专业向导。

降低平台成本，规则公开透明，USDC 高效跨境结算。

TravelTrust —— 让本地优质服务直接连接全球旅行市场。

入驻审核通过后，可在市场发布商品或服务。买家付款进入托管，完成确认后结算。$zh_merchant$,
    $en_merchant$TravelTrust is an open Web3 service platform for travel merchants worldwide.

Hotels, restaurants, attractions, and local operators can open a trusted shop with lawful credentials and connect directly with travelers and professional guides.

Lower platform cost, published rules, and efficient USDC cross-border settlement.

TravelTrust — connect local quality directly to the global travel market.

After onboarding review, list goods or services on the market. Buyer payments lock in escrow and settle after confirmation.$en_merchant$,
    '2026-08-16',
    NULL,
    'learn_more',
    '/provider/register',
    'none',
    'traveltrust_product_ann_role_merchant',
    now()
),
(
    'product-role-acquisition',
    'product',
    'product',
    'live',
    'published',
    true,
    160,
    '旅行收购：需求先行，不是传统代购',
    'Travel acquisition: demand-first, not traditional daigou',
    '由真实需求驱动。收购人发布商品需求与标准，跨境旅行者自主响应，并用真实行程完成采购与交付。规则透明，USDC 结算。',
    'Demand comes first. Buyers publish what they need; travelers on real trips respond and deliver. Transparent rules, USDC settlement — not traditional daigou.',
    $zh_acq$TravelTrust 旅行收购，是由真实需求驱动的跨境旅行交易模式。

收购人发布商品需求与标准，由跨境旅行者自主响应，并利用真实行程完成采购与交付。

需求先行、自由匹配、规则透明、USDC 快捷结算。

TravelTrust —— 让全球需求连接真实旅行，让每一次行程创造价值。

这不是传统代购，也不是证券发行、不承诺收益。从「我的 → 身份」进入收购子站，按该页公示门闸挂牌或认购。$zh_acq$,
    $en_acq$TravelTrust acquisition is a cross-border travel trade model driven by real demand.

Buyers publish product needs and standards. Travelers on real trips respond and complete purchase and delivery.

Demand first, open matching, published rules, USDC settlement.

TravelTrust — connect global demand to real travel, and let every trip create value.

This is not traditional daigou, not a securities offering, and does not promise yield. Open the acquisition sub-site from Me → Identities and follow the gates published there.$en_acq$,
    '2026-08-16',
    NULL,
    'learn_more',
    '/market/acquisition',
    'none',
    'traveltrust_product_ann_role_acquisition',
    now()
),
(
    'product-role-steward',
    'product',
    'product',
    'live',
    'published',
    true,
    150,
    '区域主理人：连接协议与本地旅行生态',
    'Region steward: connect protocol to the local travel economy',
    '连接全球协议与本地旅行生态。参与区域建设，按已公示协议规则参与区域收益分配，并通过治理提案参与监督与发展。',
    'Region stewards connect the global protocol to the local travel economy. Join regional building, share in published regional economics, and take part in governance proposals.',
    $zh_steward$TravelTrust 区域主理人，是连接全球协议与本地旅行生态的 Web3 治理角色。

参与区域生态建设，按照协议规则参与区域收益分配，并通过治理提案参与平台监督与发展。

链上透明、收益共享、参与治理、自由退出。

TravelTrust —— 让区域价值由生态参与者共同创造、分享与治理。

区域主理人不是网站后台管理员。资格以入驻审核为准。收益如何结算，以官网合约目录与参数页为准。$zh_steward$,
    $en_steward$A TravelTrust region steward is a Web3 governance role that connects the global protocol to the local travel economy.

Join regional ecosystem building, take part in regional economics under published protocol rules, and supervise the platform through governance proposals.

On-chain transparency, shared economics, governance voice, and a path to exit.

TravelTrust — let regional value be created, shared, and governed by the people in the ecosystem.

This is not a back-office admin role. Eligibility follows onboarding review. How value settles is shown in the official contract directory and params page.$en_steward$,
    '2026-08-16',
    NULL,
    'learn_more',
    '/steward/register',
    'none',
    'traveltrust_product_ann_role_steward',
    now()
),
(
    'governance-how-it-works',
    'governance',
    'trust',
    'live',
    'published',
    true,
    140,
    '规则怎么定：提案、讨论、再执行',
    'How rules are set: propose, discuss, then execute',
    '重要规则不会私下改写。先写成提案，公开讨论，再按治理流程执行。公告栏发通知；完整议题在治理提案页。',
    'Material rules are not rewritten in private. They become proposals, are discussed in public, then follow the governance process. This board posts notices; full items live on the proposals page.',
    $zh_govhow$TravelTrust 用公开治理来改规则，而不是后台一键生效。

一条完整路径是：提出议题 → 公开讨论 → 按治理页显示的方式表决 → 通过后进入时锁等待 → 再执行。

公告栏用来告诉你「发生了什么」。要读全文、看讨论和投票状态，请打开治理提案页。提案是否开放投票，以该页为准。通过后也不会马上改链。$zh_govhow$,
    $en_govhow$TravelTrust changes material rules in public governance — not with a silent admin switch.

The path is: propose → discuss in public → vote as shown on the governance page → wait on the timelock → then execute.

This board tells you what happened. To read the full text, discussion, and voting status, open the proposals page. Whether voting is open is shown there. A pass does not change the chain immediately.$en_govhow$,
    '2026-08-16',
    NULL,
    'vote_now',
    '/governance/proposals',
    'all',
    'traveltrust_governance_ann_how',
    now()
),
(
    'governance-proposals',
    'governance',
    'community',
    'live',
    'published',
    false,
    90,
    '打开治理提案，阅读正在发生的议题',
    'Open governance proposals and read live items',
    '治理提案的完整列表在治理页。阅读正在进行或已结束的议题。投票是否开放，以该页显示为准。',
    'The full proposal list lives on the governance page. Read active or closed items. Whether voting is open is shown there.',
    $zh_govprop$想参与平台监督与发展，从治理提案页开始。

那里才是议题全文、讨论和状态的真源。这条公告只是入口，不会复制一整份提案列表。

如果该页显示投票未开放，请以页面为准，不要把公告理解成已经可以链上投票。$zh_govprop$,
    $en_govprop$To take part in oversight and development, start on the governance proposals page.

That page is the source of truth for full text, discussion, and status. This notice is an entry — not a cloned proposal feed.

If that page shows voting is not open, trust the page. Do not read this announcement as live on-chain voting.$en_govprop$,
    '2026-08-16',
    NULL,
    'vote_now',
    '/governance/proposals',
    'all',
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
    '公开参数：费率、时锁，只读可查',
    'Public parameters: fees and timelock, read-only',
    '费率、时锁和关键配置可在参数页查阅。这里不能改任何链上设置。生产放行是另一道门闸。',
    'Fees, timelock, and key config are readable on the params page. Nothing here changes on-chain settings. Production GO remains a separate gate.',
    $zh_govparams$规则要可核对，参数就要公开。

打开参数页，可以只读查看费率、时锁和其他已公示配置。这条公告和参数页都不能改链上设置。

官网合约已部署，不等于 Production GO。$zh_govparams$,
    $en_govparams$Rules should be checkable, so parameters stay public.

Open the params page to inspect fees, the timelock, and other published config. Neither this notice nor that page can change on-chain settings.

Deployed on the official site is not Production GO.$en_govparams$,
    '2026-08-16',
    NULL,
    'learn_more',
    '/governance/params',
    'all',
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
