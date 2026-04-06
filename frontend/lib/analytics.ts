/**
 * 简单埋点：自由市场列表曝光、卡片点击、预约点击等。
 * 生产环境可替换为真实 analytics 上报（如 gtag、mixpanel、自建）。
 */

export type MarketEvent =
  | "market_list_view"
  | "market_order_click"
  | "market_guide_click"
  | "market_book_guide_open"
  | "market_book_guide_click"
  | "market_book_guide_market_custom";

export type DidRankEvent =
  | "did_rank_view"
  | "did_rank_period_change"
  | "did_rank_guide_sort_change"
  | "did_rank_go_to_my_rank"
  | "did_rank_guide_click"
  | "did_rank_record_modal_open"
  | "did_rank_guide_modal_open"
  | "did_rank_traveler_highlight_open"
  | "did_rank_traveler_highlight_copy"
  | "did_rank_guide_highlight_open"
  | "did_rank_guide_highlight_copy"
  | "did_rank_community_profile_open"
  | "did_rank_empty_state"
  | "did_rank_empty_market_cta";

export function trackMarketEvent(
  event: MarketEvent,
  payload?: Record<string, string | number | boolean | undefined>
): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, payload);
  }
  // 生产环境可在此调用 gtag('event', event, payload) 或 fetch('/api/analytics', { body: JSON.stringify({ event, payload }) })
}

export function trackDidRankEvent(
  event: DidRankEvent,
  payload?: Record<string, string | number | boolean | undefined>
): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, payload);
  }
}
