/**
 * Traveler Conversion Excellence Sprint · 首次游客转化 SSOT（① · 功能冻结）
 * 只允许首次访问游客视角：3 秒内知道在哪 · 做什么 · 完成后会怎样
 * 禁止：DID / EscrowFactory / FeeRouter / 技术状态 / 内部阶段
 */
export const TRAVELER_CONVERSION_SPRINT_ID = "traveler-conversion-excellence-sprint-20260608" as const;

export type TravelerConversionPageId =
  | "home"
  | "preview"
  | "order_detail"
  | "market"
  | "guide_detail"
  | "pay";

export type TravelerConversionPageSpec = {
  id: TravelerConversionPageId;
  route: string;
  /** 3 秒 · 我在哪（页目标） */
  goalKey: string;
  /** 唯一主 CTA */
  primaryCtaKey: string;
  /** 明确下一步 */
  nextStepKey: string;
  /** 完成后会怎样（可选信任/结果句） */
  outcomeKey: string;
  /** 本页所有受审计 copy */
  localeKeys: readonly string[];
};

/** 六页转化主链 · 每页一目标 · 一主 CTA · 一下一步 */
export const TRAVELER_CONVERSION_PAGES: readonly TravelerConversionPageSpec[] = [
  {
    id: "home",
    route: "/",
    goalKey: "landing_hero_title",
    primaryCtaKey: "landing_btn_generate",
    nextStepKey: "landing_hero_action_note",
    outcomeKey: "landing_hero_itinerary_disclaimer",
    localeKeys: [
      "landing_hero_title",
      "landing_hero_subtitle",
      "landing_hero_action_note",
      "landing_btn_generate",
      "landing_hero_itinerary_disclaimer",
      "home_consumer_funds_protected",
    ],
  },
  {
    id: "preview",
    route: "/#landing-results",
    goalKey: "landing_results_heading",
    primaryCtaKey: "landing_view_order_detail",
    nextStepKey: "landing_results_next_step",
    outcomeKey: "traveler_quote_currency",
    localeKeys: [
      "landing_results_heading",
      "landing_results_next_step",
      "landing_view_order_detail",
      "landing_results_unlock_note",
    ],
  },
  {
    id: "order_detail",
    route: "/escrow/:id",
    goalKey: "escrow_draftMeta_pickGuide",
    primaryCtaKey: "escrow_saveItinerary",
    nextStepKey: "escrow_draftNextStep_save",
    outcomeKey: "escrow_draftGuideTrust_line",
    localeKeys: [
      "escrow_draftMeta_pickGuide",
      "escrow_draftMeta_waitingGuide",
      "escrow_draftNextStep_save",
      "escrow_draftNextStep_pickGuide",
      "escrow_draftNextStep_confirm",
      "escrow_saveItinerary",
      "escrow_draftGuideTrust_line",
      "escrow_factoryCreateTitle_experience",
      "escrow_factoryCreateDesc_experience",
      "escrow_draftProtocolFold_title",
    ],
  },
  {
    id: "market",
    route: "/market",
    goalKey: "market_hero_subtitle",
    primaryCtaKey: "guide_card_book",
    nextStepKey: "market_bindGuide_bannerSub",
    outcomeKey: "market_hero_pill_escrow",
    localeKeys: [
      "market_hero_subtitle",
      "market_hero_pill_escrow",
      "market_bindGuide_banner",
      "market_bindGuide_bannerSub",
      "market_bindGuide_back_escrow",
      "guide_card_book",
    ],
  },
  {
    id: "guide_detail",
    route: "/guides/:id",
    goalKey: "guide_detail_bio",
    primaryCtaKey: "guide_card_book",
    nextStepKey: "guide_detail_conversion_next",
    outcomeKey: "guide_detail_consumer_trust_body",
    localeKeys: [
      "guide_card_book",
      "guide_detail_conversion_next",
      "guide_detail_hero_signals_aria",
      "guide_detail_specialty",
      "guide_detail_didVerified",
      "guide_card_didVerified",
      "guide_detail_consumer_trust_body",
      "guide_detail_bioEmpty",
      "guide_availability_intro",
      "guide_availability_expand",
      "guide_availability_this_month_kicker",
    ],
  },
  {
    id: "pay",
    route: "/pay",
    goalKey: "pay_pageTitle",
    primaryCtaKey: "pay_ctaEscrowPrimary",
    nextStepKey: "pay_escrowPhase_calloutTitle",
    outcomeKey: "pay_disclaimer",
    localeKeys: [
      "pay_pageTitle",
      "pay_pageSubtitle",
      "pay_ctaEscrowPrimary",
      "pay_ctaEscrow",
      "pay_escrowPhase_calloutTitle",
      "pay_escrowPhase_bodyNoEscrow",
      "pay_disclaimer",
      "pay_hubNotDepositPhaseNotice",
      "pay_stepsWhileLoading_3",
    ],
  },
] as const;

export const TRAVELER_CONVERSION_LOCALE_KEYS: readonly string[] = [
  ...new Set(TRAVELER_CONVERSION_PAGES.flatMap((p) => p.localeKeys)),
];

/** 首次游客可见 copy 禁止协议/运营/开发术语 */
export const TRAVELER_CONVERSION_BANNED_COPY =
  /\bDID\b|EscrowFactory|FeeRouter|GET\s*\/meta|NEXT_PUBLIC_|bytes32|wallet_address|default_wallet|冷启动\s*Campaign|cold start campaign|surface\s*暂无|链上托管|链上存款|链上部署|Deposit|Approve|Runbook|开发者调试|高级 · 链上|UUID|bytes32|createEscrow|PlatformFeeRouted/i;

export type TravelerConversionFinding = {
  id: string;
  severity: "P0" | "P1" | "P2";
  page: TravelerConversionPageId;
  title: string;
  status: "closed" | "open" | "deferred";
};

export const TRAVELER_CONVERSION_FINDINGS: readonly TravelerConversionFinding[] = [
  { id: "TC-P0-01", severity: "P0", page: "market", title: "cold_start empty shows Campaign/surface ops copy", status: "closed" },
  { id: "TC-P0-02", severity: "P0", page: "guide_detail", title: "page.tsx still rendered legacy credentials/stake UI instead of GuideDetailPageMain", status: "closed" },
  { id: "TC-P1-01", severity: "P1", page: "order_detail", title: "FeeRouter/EscrowFactory visible on experience draft path", status: "closed" },
  { id: "TC-P1-02", severity: "P1", page: "guide_detail", title: "DID 可验证 jargon on consumer guide profile", status: "closed" },
  { id: "TC-P1-03", severity: "P1", page: "pay", title: "pay hub 链上存款/UUID/托管阶段 ops copy", status: "closed" },
  { id: "TC-P1-04", severity: "P1", page: "home", title: "hero action note 托管 jargon", status: "closed" },
  { id: "TC-P1-05", severity: "P1", page: "order_detail", title: "experience factory title 链上托管", status: "closed" },
  { id: "TC-P1-06", severity: "P1", page: "guide_detail", title: "Guide Detail L5 Closure: ops calendar copy + hero decision signals", status: "closed" },
  { id: "TC-P2-01", severity: "P2", page: "order_detail", title: "dev-tools protocol fold still visible when NEXT_PUBLIC_ESCROW_DEV_TOOLS=1", status: "deferred" },
] as const;

export const TRAVELER_CONVERSION_OPEN_P0 = TRAVELER_CONVERSION_FINDINGS.filter(
  (f) => f.severity === "P0" && f.status === "open",
);
export const TRAVELER_CONVERSION_OPEN_P1 = TRAVELER_CONVERSION_FINDINGS.filter(
  (f) => f.severity === "P1" && f.status === "open",
);
