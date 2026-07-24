/** HU-018 · 主 CTA / 游客规划入口 → 定制旅行页 `/`（顶栏「定制旅行」同源） */
export const TRAVELTRUST_V6_PLAN_TRIP_HREF = "/" as const;

/** @deprecated 旧页内锚点名；新代码用 `TRAVELTRUST_V6_PLAN_TRIP_HREF` */
export const TRAVELTRUST_V6_IN_PAGE_PLAN_HREF = TRAVELTRUST_V6_PLAN_TRIP_HREF;

const EXTERNAL_HOME = "/";

/** 将 page-brief `primary_target` 解析为适合 /traveltrust 的链接 */
export function resolveTraveltrustPlanTripHref(
  primaryTarget: string | undefined | null,
): string {
  const raw = (primaryTarget ?? "").trim();
  if (!raw || raw === EXTERNAL_HOME) return TRAVELTRUST_V6_PLAN_TRIP_HREF;
  if (raw === "#start") return TRAVELTRUST_V6_PLAN_TRIP_HREF;
  if (raw.startsWith("#")) return raw;
  if (raw.startsWith("/traveltrust")) return raw.includes("#") ? raw : raw;
  return raw;
}

export function isTraveltrustInPagePlanHref(href: string): boolean {
  const h = href.trim();
  return h === "#start" || h.startsWith("#start?");
}

/** 角色「进入」链：游客默认进定制旅行 `/`（HU-018） */
export function resolveTraveltrustRoleEnterHref(href: string | undefined | null): string {
  const raw = (href ?? "").trim();
  if (!raw || raw === EXTERNAL_HOME || raw === "#start") return TRAVELTRUST_V6_PLAN_TRIP_HREF;
  if (raw.startsWith("#")) return raw;
  return raw;
}
