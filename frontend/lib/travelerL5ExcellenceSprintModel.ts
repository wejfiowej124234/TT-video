/**
 * Traveler L5 Excellence Sprint · 消费者全链路 SSOT（① · 不增业务功能）
 * 三身份：首次访问 · 首次下单 · 首次付款 — 共用同一路径，文案按步骤递进。
 */

export const TRAVELER_L5_SPRINT_ID = "traveler-l5-excellence-sprint-20260608" as const;

export type TravelerL5PersonaId = "first_visit" | "first_order" | "first_pay";

export type TravelerL5JourneyStep = {
  id: string;
  route: string;
  /** data-tt-traveler-l5-journey 探针 */
  journeyProbe: string;
  /** 我能获得什么 */
  getKeys: readonly string[];
  /** 为什么相信你 */
  trustKeys: readonly string[];
  /** 下一步做什么 */
  nextKeys: readonly string[];
};

/** 首页 → AI 生成 → 预览 → 订单详情 → 选向导 → 付款 → 订单跟踪 */
export const TRAVELER_L5_JOURNEY_STEPS: readonly TravelerL5JourneyStep[] = [
  {
    id: "home",
    route: "/",
    journeyProbe: "home",
    getKeys: ["landing_hero_title", "landing_hero_subtitle", "home_consumer_value_title"],
    trustKeys: ["home_consumer_funds_protected", "landing_hero_itinerary_disclaimer"],
    nextKeys: ["landing_hero_action_note", "landing_btn_generate"],
  },
  {
    id: "preview",
    route: "/#landing-results",
    journeyProbe: "preview",
    getKeys: ["landing_results_heading", "landing_results_count_note"],
    trustKeys: ["home_consumer_funds_protected"],
    nextKeys: ["landing_results_unlock_note", "landing_results_next_step", "landing_view_order_detail"],
  },
  {
    id: "escrow_draft",
    route: "/escrow/:id",
    journeyProbe: "escrow-draft",
    getKeys: ["escrow_draftMeta_pickGuide", "escrow_draftItineraryTab_aria"],
    trustKeys: ["escrow_draftGuideTrust_line", "home_consumer_funds_protected"],
    nextKeys: ["escrow_draftNextStep_save", "escrow_draftPay_goPayHub"],
  },
  {
    id: "market_guide",
    route: "/market",
    journeyProbe: "market-guide",
    getKeys: ["market_hero_subtitle", "market_bindGuide_banner"],
    trustKeys: ["market_hero_pill_escrow", "pes2_escrow_inline"],
    nextKeys: ["market_bindGuide_bannerSub", "market_bindGuide_back_escrow"],
  },
  {
    id: "guide_detail",
    route: "/guides/:id",
    journeyProbe: "guide-detail",
    getKeys: ["guide_detail_hero_signals_aria", "guide_detail_specialty", "guide_card_lang"],
    trustKeys: ["guide_detail_didVerified", "guide_detail_consumer_trust_body"],
    nextKeys: ["guide_detail_conversion_next", "guide_card_book"],
  },
  {
    id: "pay",
    route: "/pay",
    journeyProbe: "pay",
    getKeys: ["pay_pageTitle", "pay_pageSubtitle"],
    trustKeys: ["pay_disclaimer"],
    nextKeys: ["pay_ctaEscrow", "escrow_draftPay_goPayHub"],
  },
  {
    id: "orders",
    route: "/orders",
    journeyProbe: "orders",
    getKeys: ["orders_myOrders", "orders_desc"],
    trustKeys: ["orders_list_drafts_scope_note"],
    nextKeys: ["orders_list_bookGuideCta", "orders_escrowDetail"],
  },
] as const;

/** 消费者链路禁止出现在用户可见 copy 中的术语（① 本地 sprint） */
export const TRAVELER_L5_BANNED_CONSUMER_COPY =
  /梦想之旅|协议支持|\bP0\b|\bL5\b|\bEscrow\b|\bWeb3\b|链上托管|testnet|\bmock\b|Phase ①|① 本地|① Local|P3_CHAIN_OFF|USDT\s*\/\s*USDC|\bUSDC\b|\bUSDT\b|Deposit|factory|PSP/i;

export const TRAVELER_L5_JOURNEY_LOCALE_KEYS: readonly string[] = TRAVELER_L5_JOURNEY_STEPS.flatMap(
  (s) => [...s.getKeys, ...s.trustKeys, ...s.nextKeys],
);
