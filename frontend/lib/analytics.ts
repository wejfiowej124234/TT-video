/**
 * 简单埋点：自由市场列表曝光、卡片点击、预约点击等。
 * 生产环境可替换为真实 analytics 上报（如 gtag、mixpanel、自建）。
 */

import type { TravelTrustV6AnalyticsEventName } from "./traveltrustV6AnalyticsEvents";
import type { DataStateKind } from "./dataState";

export type CommunityMeDataStateRenderPayload = Record<string, string | number | boolean | undefined>;

export type MarketEvent =
  | "market_list_view"
  | "market_order_click"
  | "market_guide_click"
  | "market_book_guide_open"
  | "market_book_guide_click"
  | "market_book_guide_market_custom"
  | "market_subsite_listing_order_click"
  | "market_subsite_listing_order_created";

/** B-453：`meta.review_json_contract` 降级（非 `none`）— 计数侧见 `reviewJsonContractObservability`；B-454：导出/回放须与此五键一致（`replay-b454-*`）。 */
export type ReviewJsonContractDegradeObservabilityPayload = {
  degrade: "missing_meta" | "malformed_meta" | "unknown_future_schema";
  api_path: "get_reviews" | "post_review";
  schema_version_reported: number | null;
  schema_version_effective: number;
  client_max_supported: number;
};

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
  | "did_rank_empty_market_cta"
  | "did_rank_full_list_fold";

export type TravelTrustAnalyticsPayload = Record<string, string | number | boolean | undefined>;

/** TravelTrust 首页 / 网络页 CTA、地球、角色剧场等（与 `TRAVELTRUST_V6_ANALYTICS_EVENTS` 同源） */
export function trackTravelTrustEvent(
  event: TravelTrustV6AnalyticsEventName | (string & {}),
  payload?: TravelTrustAnalyticsPayload
): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, payload);
    return;
  }
  const beacon =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TRAVELTRUST_ANALYTICS_BEACON?.trim() : "";
  const url = beacon || "/api/traveltrust/analytics";
  try {
    const body = JSON.stringify({ event, payload, ts: Date.now() });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // analytics must not break UX
  }
}

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

/** B-453：与 `observeReviewJsonContractClient` 配对；生产环境可接 gtag / 日志聚合告警（事件名：`review_json_contract_degrade`） */
export function trackReviewJsonContractDegrade(payload: ReviewJsonContractDegradeObservabilityPayload): void {
  if (typeof window === "undefined") return;
  const event = "review_json_contract_degrade" as const;
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn("[analytics]", event, payload);
  }
  // 生产：与 trackMarketEvent 相同扩展位 — gtag('event', event, { ...payload })
}

/** `/community/me` 五态壳：surface + dataState 切换（开发态 console；生产可接 beacon） */
export function trackCommunityMeDataStateRender(
  surface: string,
  dataStateKind: DataStateKind,
  payload?: CommunityMeDataStateRenderPayload,
): void {
  if (typeof window === "undefined") return;
  const event = "community_me_data_state_render" as const;
  const body = { surface, data_state: dataStateKind, ...payload };
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, body);
    return;
  }
  const beacon =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TRAVELTRUST_ANALYTICS_BEACON?.trim() : "";
  const url = beacon || "/api/traveltrust/analytics";
  try {
    const json = JSON.stringify({ event, payload: body, ts: Date.now() });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(url, new Blob([json], { type: "application/json" }));
      return;
    }
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
      keepalive: true,
    });
  } catch {
    // analytics must not break UX
  }
}
