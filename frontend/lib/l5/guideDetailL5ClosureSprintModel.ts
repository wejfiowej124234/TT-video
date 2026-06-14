/**
 * Guide Detail L5 Closure Sprint · 向导详情消费者体验收口 SSOT（① · 功能冻结）
 * 通过标准：首次游客 3 秒内理解 — 是否适合 · 为何可信 · 如何预约
 */
export const GUIDE_DETAIL_L5_CLOSURE_SPRINT_ID = "guide-detail-l5-closure-sprint-20260608" as const;

/** 页面探针 · 达到 Consumer Grade 后冻结 */
export const GUIDE_DETAIL_L5_CLOSURE_PROBE = "consumer-grade" as const;

export const GUIDE_DETAIL_L5_UI_FROZEN = true as const;

export const GUIDE_DETAIL_L5_FROZEN_MARKER = "guide-detail-l5-closure-20260608" as const;

/** 本 Sprint 审计的消费者可见 copy */
export const GUIDE_DETAIL_L5_LOCALE_KEYS: readonly string[] = [
  "guide_detail_conversion_next",
  "guide_card_book",
  "guide_detail_bioEmpty",
  "guide_detail_consumer_trust_title",
  "guide_detail_consumer_trust_body",
  "guide_availability_title",
  "guide_availability_intro",
  "guide_availability_none",
  "guide_availability_legend_free",
  "guide_availability_legend_busy",
  "guide_availability_legend_past",
  "guide_availability_dayPast",
  "guide_availability_daySelected",
  "guide_availability_picker_intro",
  "guide_availability_picker_kicker",
  "guide_availability_legend_selected",
  "guide_availability_selected_range",
  "guide_availability_pick_end_hint",
  "guide_availability_busy_after_accept",
  "guide_detail_conversion_pick_dates",
  "guide_detail_book_requires_dates",
  "guide_availability_expand",
  "guide_availability_collapse",
  "guide_availability_this_month_kicker",
  "guide_detail_hero_signals_aria",
  "guide_card_rating",
  "guide_card_completed",
  "guide_card_response",
  "guide_card_lang",
  "guide_detail_specialty",
  "market_guide_hourly_on_request",
  "guide_detail_didVerified",
] as const;

/** 向导详情消费者 copy 禁止托管/API/运营/协议术语 */
export const GUIDE_DETAIL_L5_BANNED_COPY =
  /托管|运营审核|运营|API\s*同源|\bAPI\b|服务端|争议|UUID|order_id|Runbook|链上|GET\s+\/|cold start|Campaign|developers?/i;

export type GuideDetailL5ClosureFinding = {
  id: string;
  severity: "P0" | "P1" | "P2";
  title: string;
  status: "closed" | "open" | "deferred";
};

export const GUIDE_DETAIL_L5_CLOSURE_FINDINGS: readonly GuideDetailL5ClosureFinding[] = [
  { id: "GD-L5-P0-01", severity: "P0", title: "guide_availability_intro ops/API/托管 jargon", status: "closed" },
  { id: "GD-L5-P0-02", severity: "P0", title: "section labels uppercase drawerSectionAccent drift", status: "closed" },
  { id: "GD-L5-P1-01", severity: "P1", title: "hero missing rating/completed/lang/specialty decision signals", status: "closed" },
  { id: "GD-L5-P1-02", severity: "P1", title: "bio empty state no conversion next step", status: "closed" },
  { id: "GD-L5-P1-03", severity: "P1", title: "three-month calendar dominates without fold", status: "closed" },
  { id: "GD-L5-P1-04", severity: "P1", title: "occupied ranges list exposes lock/order ops labels", status: "closed" },
  { id: "GD-L5-P1-05", severity: "P1", title: "consumer_trust_body mentions 运营审核", status: "closed" },
  {
    id: "GD-L5-P1-06",
    severity: "P1",
    title: "specialty hint shows registration copy when tags already present",
    status: "closed",
  },
  {
    id: "GD-L5-P1-07",
    severity: "P1",
    title: "calendar past dates styled as bookable free slots",
    status: "closed",
  },
  {
    id: "GD-L5-P1-08",
    severity: "P1",
    title: "tourist cannot select trip dates before book CTA",
    status: "closed",
  },
] as const;

export const GUIDE_DETAIL_L5_OPEN_P0 = GUIDE_DETAIL_L5_CLOSURE_FINDINGS.filter(
  (f) => f.severity === "P0" && f.status === "open",
);
export const GUIDE_DETAIL_L5_OPEN_P1 = GUIDE_DETAIL_L5_CLOSURE_FINDINGS.filter(
  (f) => f.severity === "P1" && f.status === "open",
);
