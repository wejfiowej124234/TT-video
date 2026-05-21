/** 与 `TravelTrustEvent`、`GET /api/v1/traveltrust/page-brief` `cta_contract.analytics_events` 同源 */
export const TRAVELTRUST_V6_ANALYTICS_EVENTS = [
  "traveltrust_plan_trip_click",
  "traveltrust_role_enter_click",
  "traveltrust_role_tab_click",
  "traveltrust_role_video_play",
  "traveltrust_scroll_to_roles",
  "traveltrust_secondary_cta_click",
  "traveltrust_globe_pin_click",
] as const;

export type TravelTrustV6AnalyticsEventName = (typeof TRAVELTRUST_V6_ANALYTICS_EVENTS)[number];
