-- Official announcements hub · campaign + five roles + governance explainers + protocol explainers
-- Archives stale product polish / Final Truth jargon / Sepolia phase stack.
-- Addresses stay in FE directory (registry/L7) — CMS must not become an address SSOT.

UPDATE cms_public_announcements
SET publish_status = 'archived', version = version + 1, updated_at = now()
WHERE publish_status = 'published'
  AND slug IN (
    'product-planned-launch',
    'product-escrow-usdc',
    'product-guide-merchant',
    'product-governance-teaser',
    'product-security-disclosure',
    'phase3-entry-mainnet-prep',
    'product-deploy-phase1',
    'product-deploy-phase2',
    'product-deploy-phase3',
    'final-truth-baseline-status',
    'final-truth-hard-gate-open'
  );

INSERT INTO cms_public_announcements (
    slug, lane, kind, content_tier, publish_status, pinned, sort_order,
    title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
    effective_at, release_at, cta_kind, cta_href, network_scope, message_key, published_at
) VALUES
(
    'campaign-referral',
    'product',
    'campaign',
    'live',
    'published',
    true,
    200,
    '邀请好友，一起拿成长积分',
    'Invite friends and earn growth points',
    '分享你的邀请码。好友注册并完成体验后，双方都能获得成长积分。积分用于站内成长，不是代币空投。',
    'Share your invite code. After a friend registers and completes an experience, both of you earn growth points. Points are for in-app progress — not a token airdrop.',
    $zh_campaign$怎么参加

1. 打开「我的 → 推荐中心」，复制你的邀请链接。
2. 把链接发给朋友。朋友用这个链接注册后，系统会自动记下推荐关系。
3. 朋友完成一次公开规则下的体验后，你们双方都会获得成长积分。

成长积分只用于站内进度，不能兑换成代币或现金。本活动不是空投。$zh_campaign$,
    $en_campaign$How it works

1. Open Me → Referrals and copy your invite link.
2. Share the link. When a friend registers through it, the referral is bound automatically.
3. After your friend completes an experience under published rules, both of you earn growth points.

Growth points are for in-app progress. They cannot be swapped for tokens or cash. This campaign is not an airdrop.$en_campaign$,
    '2026-08-16',
    NULL,
    'join_now',
    '/me/referrals',
    'none',
    'traveltrust_pulse_campaign_referral',
    now()
),
(
    'product-role-traveler',
    'product',
    'product',
    'live',
    'published',
    true,
    190,
    '旅行者：规划行程，找向导',
    'Traveler: plan trips and find guides',
    '注册后即可浏览行程与向导，按公开规则预约。行程订金进入智能合约托管，双方确认后才释放。',
    'After you register, browse trips and guides and book under published rules. Deposits lock in smart-contract escrow and release only after both sides confirm.',
    $zh_traveler$旅行者是本站的默认身份。

你可以浏览行程、联系向导、按页面上的规则预约。付钱时，订金进入智能合约托管，不经过平台账户。行程完成、双方确认后，资金才释放。

还没有账号？先注册，再用同一套账户继续。$zh_traveler$,
    $en_traveler$Traveler is the default role.

You can browse trips, contact guides, and book under the rules on the page. When you pay, the deposit locks in a smart-contract escrow — not a platform account. Funds release after the trip is done and both sides confirm.

If you do not have an account yet, register first. The same account is used across the site.$en_traveler$,
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
    '向导：带旅行者走你熟悉的路',
    'Guide: take travelers on routes you know',
    '申请认证后，可发布可预约的向导服务。订单、托管与争议规则与旅行者相同。',
    'Apply for certification, then publish bookable guide services. Orders, escrow, and disputes follow the same rules as travelers.',
    $zh_guide$如果你熟悉一座城市，可以申请成为向导。

提交申请并完成审核后，就能发布可预约的服务。旅行者下单后，资金走同一套托管，不私下收款。争议也在站内按公开规则处理。$zh_guide$,
    $en_guide$If you know a city well, you can apply to become a guide.

After review, publish bookable services. When a traveler books, funds use the same escrow path — not a private transfer. Disputes stay on-site under published rules.$en_guide$,
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
    '商家：把店铺接到旅行订单',
    'Merchant: connect a shop to travel orders',
    '申请入驻后，可在市场发布商品或服务。结算走同一套托管规则。',
    'Apply to onboard, then list goods or services on the market. Settlement uses the same escrow rules.',
    $zh_merchant$商家把商品或服务接到旅行订单里。

入驻审核通过后，可在市场发布 listing。买家付款进入托管，完成确认后结算。不要引导用户站外转账。$zh_merchant$,
    $en_merchant$Merchants connect goods or services to travel orders.

After onboarding review, publish listings on the market. Buyer payments lock in escrow and settle after confirmation. Do not ask users to pay off-platform.$en_merchant$,
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
    '旅行收购：发布与认购旅行资产',
    'Travel acquisition: list or subscribe to travel assets',
    '符合条件的用户可进入收购子站，按公开规则挂牌或认购。这不是证券发行。',
    'Eligible users can open the acquisition sub-site to list or subscribe under published rules. This is not a securities offering.',
    $zh_acq$旅行收购是独立子站，不是默认人人可做的角色。

从「我的 → 身份」进入收购子站，按该页公示的门闸挂牌或认购。这里不构成证券要约，也不承诺收益。$zh_acq$,
    $en_acq$Travel acquisition is a separate sub-site, not a default role for everyone.

Open it from Me → Identities and follow the gates published there. This is not a securities offering and does not promise yield.$en_acq$,
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
    '区域主理人：服务一座城的旅行网络',
    'Region steward: serve a city’s travel network',
    '申请成为区域主理人后，可参与该地区的运营与治理入口。资格与权限以入驻审核为准。',
    'Apply to become a region steward, then join that region’s operations and governance entry. Eligibility follows onboarding review.',
    $zh_steward$区域主理人服务一座城的旅行网络，不是网站后台管理员。

提交申请并完成审核后，才能进入该地区的运营与治理入口。改规则仍然要走治理提案，不能私下改合约。$zh_steward$,
    $en_steward$A region steward serves a city’s travel network. This is not a back-office admin role.

After review, you can enter that region’s operations and governance surface. Rule changes still go through governance proposals — nobody edits contracts in private.$en_steward$,
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
    '本站规则怎么定',
    'How rules are decided here',
    '重要规则变更会写成提案，公开讨论后按治理流程执行。公告栏只发通知，完整提案请到治理页。',
    'Material rule changes become proposals, are discussed in public, then follow the governance process. This board posts notices; full proposals live on the governance page.',
    $zh_govhow$公告栏用来发通知，不是提案列表。

要看议题全文、讨论和投票状态，请打开治理提案页。提案是否开放投票，以该页显示为准。通过后也不会马上改链，需要经过时锁等待。$zh_govhow$,
    $en_govhow$This board posts notices. It is not the proposal feed.

To read the full text, discussion, and voting status, open the governance proposals page. Whether voting is open is shown there. A pass does not change the chain immediately — it waits on the timelock.$en_govhow$,
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
    '查看治理提案',
    'Browse governance proposals',
    '打开治理提案页，阅读正在进行或已结束的议题。投票是否开放，以该页显示为准。',
    'Open the proposals page to read active or closed items. Whether voting is open is shown there.',
    $zh_govprop$治理提案的真源是治理页，不是这条公告。

点进去阅读全文。如果该页显示投票未开放，请以页面状态为准，不要把公告理解成已经可以链上投票。$zh_govprop$,
    $en_govprop$The source of truth for proposals is the governance page, not this notice.

Open it to read the full text. If that page shows voting is not open, trust the page — do not read this announcement as live on-chain voting.$en_govprop$,
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
    '公开参数',
    'Public parameters',
    '费率、时锁和关键配置可在参数页只读查阅。这里不修改任何链上设置。',
    'Fees, timelock, and key config are readable on the params page. Nothing here changes on-chain settings.',
    $zh_govparams$参数页是只读对照。

你可以查看费率、时锁和其他已公开配置。这条公告不能改链上设置。生产放行仍是独立门闸。$zh_govparams$,
    $en_govparams$The params page is a read-only check.

You can inspect fees, the timelock, and other published config. This notice cannot change on-chain settings. Production GO remains a separate gate.$en_govparams$,
    '2026-08-16',
    NULL,
    'learn_more',
    '/governance/params',
    'all',
    'traveltrust_governance_ann_params',
    now()
),
(
    'protocol-money-path',
    'protocol_status',
    'trust',
    'live',
    'published',
    true,
    70,
    '行程资金怎么走',
    'How trip funds move',
    '订金锁定在已部署的托管合约里，不经平台账户保管。双方确认后，结算合约按规则分配。这不是 Production GO。',
    'Deposits lock in a deployed escrow contract, not a platform account. After both sides confirm, the settlement contract distributes funds by published rules. This is not Production GO.',
    $zh_money$付钱时，订金进入托管工厂创建的合约。

行程完成后，双方确认，结算路由再按规则分配。费用分配合约负责平台和地区费用。

上方地址目录来自官方登记，运营后台不能手填地址。合约已部署不等于 Production GO，也请勿向这些地址转账试探。$zh_money$,
    $en_money$When you pay, the deposit enters a contract created by the escrow factory.

After the trip, both sides confirm, then the settlement router distributes funds by published rules. The fee router handles platform and region fees.

The address directory above comes from the official registry. Ops Admin cannot type addresses. Deployed is not Production GO — do not send funds to test these contracts.$en_money$,
    '2026-08-16',
    NULL,
    'learn_more',
    '/trust',
    'all',
    'traveltrust_protocol_ann_money_path',
    now()
),
(
    'protocol-governance-stack',
    'protocol_status',
    'trust',
    'live',
    'published',
    true,
    60,
    '治理合约是什么',
    'What the governance contracts are',
    '治理由时锁、投票合约和金库组成。下方地址来自官方登记。认购市场合约已部署，交易尚未开放。',
    'Governance uses a timelock, a voting contract, and a treasury. Addresses come from the official registry. The subscription market is deployed; trading is not open.',
    $zh_pstack$治理合约已经部署在以太坊主网。

提案通过后，要经过时锁等待才会执行。投票代币和金库地址可以在上方目录核对。

TTG 认购市场合约也已部署，但交易尚未开放。看到合约不等于可以买入或投票已经对公众开放。$zh_pstack$,
    $en_pstack$Governance contracts are deployed on Ethereum mainnet.

After a proposal passes, execution waits on the timelock. Check the vote-token and treasury addresses in the directory above.

The TTG primary-market contract is also deployed, but trading is not open. Seeing a contract is not the same as public buying or voting being live.$en_pstack$,
    '2026-08-16',
    NULL,
    'learn_more',
    '/governance/params',
    'all',
    'traveltrust_protocol_ann_governance_stack',
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
