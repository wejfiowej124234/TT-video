/**
 * v6 用户可见外链/深链策略（TT-PH1-111/112 · ①）
 * 融资叙事留在 governance/help；主视野禁止 fundraising 路径与绝对外链。
 */

/** 用户可见 href 禁止片段（大小写不敏感子串） */
export const TRAVELTRUST_FORBIDDEN_HREF_FRAGMENTS = [
  "/fundraising",
  "fundraising/",
  "whitepaper",
  "investor-deck",
  "token-sale",
  "/ico",
  "ico-",
] as const;

/** 允许的相对路径前缀 */
export const TRAVELTRUST_ALLOWED_HREF_PREFIXES = ["/", "#"] as const;

export function isTraveltrustV6AllowedHref(href: string | undefined | null): boolean {
  if (href == null || href.trim() === "") return true;
  const h = href.trim();
  const lower = h.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:")) {
    return false;
  }
  if (TRAVELTRUST_FORBIDDEN_HREF_FRAGMENTS.some((frag) => lower.includes(frag))) {
    return false;
  }
  return TRAVELTRUST_ALLOWED_HREF_PREFIXES.some((prefix) => h.startsWith(prefix));
}

/** 机读：登记在册的 pulse 公告 href 须过策略 */
export function assertTraveltrustAnnouncementHrefs(
  items: ReadonlyArray<{ id: string; href?: string }>,
): string[] {
  const violations: string[] = [];
  for (const item of items) {
    if (item.href && !isTraveltrustV6AllowedHref(item.href)) {
      violations.push(`${item.id}: ${item.href}`);
    }
  }
  return violations;
}
