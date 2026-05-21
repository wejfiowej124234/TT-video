/** v6 主 CTA：默认留在品牌页内转化（TT-PH1-170 · ①） */
export const TRAVELTRUST_V6_IN_PAGE_PLAN_HREF = "#start";

const EXTERNAL_HOME = "/";

/** 将 page-brief `primary_target` 解析为适合 /traveltrust 的链接 */
export function resolveTraveltrustPlanTripHref(
  primaryTarget: string | undefined | null,
): string {
  const raw = (primaryTarget ?? "").trim();
  if (!raw || raw === EXTERNAL_HOME) return TRAVELTRUST_V6_IN_PAGE_PLAN_HREF;
  if (raw.startsWith("#")) return raw;
  if (raw.startsWith("/traveltrust")) return raw.includes("#") ? raw : raw;
  return raw;
}

export function isTraveltrustInPagePlanHref(href: string): boolean {
  const h = href.trim();
  return h === TRAVELTRUST_V6_IN_PAGE_PLAN_HREF || h === "#start";
}

/** 角色「进入」链：游客默认留在页内 #start（TT-PH1-170 · ①） */
export function resolveTraveltrustRoleEnterHref(href: string | undefined | null): string {
  const raw = (href ?? "").trim();
  if (!raw || raw === EXTERNAL_HOME) return TRAVELTRUST_V6_IN_PAGE_PLAN_HREF;
  if (raw.startsWith("#")) return raw;
  return raw;
}
