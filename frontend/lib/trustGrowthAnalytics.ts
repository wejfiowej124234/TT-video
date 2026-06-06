/**
 * P-GROW1：信任增长埋点 — 与 `trackMarketEvent` 同出口（dev console / 生产可接 gtag）。
 * 漏斗：`trust_growth_moment_view` → `trust_growth_trust_hub_click` / `trust_growth_moment_dismiss`
 */

import { apiUrl, routes } from "./api";

/** P-SCALE1：默认经 `apiUrl` 命中 traveltrust-api；可设 `NEXT_PUBLIC_TRUST_GROWTH_SERVICE_URL` 覆盖整条服务的 origin（仍拼接 `/api/v1/trust-growth/…`）。 */
export function trustGrowthApiUrl(path: "ingest" | "config"): string {
  const o =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TRUST_GROWTH_SERVICE_URL?.trim() : "";
  if (o) {
    return `${o.replace(/\/$/, "")}/api/v1/trust-growth/${path}`;
  }
  return path === "ingest" ? apiUrl(routes.trustGrowthIngest) : apiUrl(routes.trustGrowthConfig);
}

export type TrustGrowthMoment =
  | "register"
  | "guide_apply"
  | "steward_apply"
  | "first_yield"
  | "first_order"
  | "governance_entry";

export type TrustGrowthEventName =
  | "trust_growth_moment_view"
  | "trust_growth_trust_hub_click"
  | "trust_growth_moment_dismiss"
  /** P-GROW2：折叠态 `<details>` 展开/收起（分析参与度与文案/时机组合） */
  | "trust_growth_details_toggle";

export function trackTrustGrowthEvent(
  event: TrustGrowthEventName,
  payload: { moment: TrustGrowthMoment } & Record<string, string | number | boolean | undefined>
): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, payload);
  }
  /** P-GROW3：服务端聚合 + 自动调权闭环（失败静默，不打断 UX） */
  if (
    typeof fetch !== "undefined" &&
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_TRUST_GROWTH_INGEST_DISABLED !== "1"
  ) {
    void fetch(trustGrowthApiUrl("ingest"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload }),
      keepalive: true,
    }).catch(() => {});
  }
}
