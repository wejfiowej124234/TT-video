/**
 * Batch-11 W06 · Content / Growth ops L5 SSOT
 * HU-373 verify hrefs · HU-384 Hub section map · ≠ Production GO
 */
import type { AdminShellNavLinkDef } from "@/lib/admin/adminShellNavLinkTypes";
import { ADMIN_SHELL_CONTENT_NAV_LINKS } from "@/lib/admin/adminShellContentNavLinks";

export const CONTENT_OPS_L5_PROBE = "content-ops-l5-batch11-w06-v1" as const;

/** HU-373 · 公告已发布 → 公众公告廊 */
export function contentAnnouncementVerifyHref(row: {
  publish_status?: string | null;
}): string | null {
  if (row.publish_status !== "published") return null;
  return "/traveltrust/announcements";
}

/** HU-373 · 路线图已发布 → 公众 TravelTrust 页 */
export function contentRoadmapVerifyHref(row: {
  publish_status?: string | null;
}): string | null {
  if (row.publish_status !== "published") return null;
  return "/traveltrust";
}

/** HU-373 · 首页氛围 → 首页（Staging 诚实入口） */
export function contentLandingAmbientVerifyHref(row: {
  publish_status?: string | null;
  is_active?: boolean | null;
}): string | null {
  if (row.publish_status === "published" || row.is_active === true) return "/";
  return null;
}

/** HU-373 · 增长邀请码启用 → 注册预填 */
export function growthReferralVerifyHref(row: {
  code?: string | null;
  is_active?: boolean | null;
}): string | null {
  if (!row.is_active) return null;
  const code = (row.code ?? "").trim();
  if (!code) return "/auth/register";
  return `/auth/register?ref=${encodeURIComponent(code)}`;
}

export type ContentHubSectionId = "daily" | "catalog" | "tool";

export type ContentHubSectionDef = {
  id: ContentHubSectionId;
  titleKey: string;
  badgeKey?: string;
  dataAttr: string;
  hrefs: readonly string[];
};

/**
 * HU-384 · Content Hub 三分区（侧栏仍扁平；仅 Hub 分区）
 * 日运 / 目录 / 观测 TOOL
 */
export const CONTENT_HUB_SECTIONS: readonly ContentHubSectionDef[] = [
  {
    id: "daily",
    titleKey: "admin_content_hub_section_daily",
    dataAttr: "data-tt-admin-content-hub-section-daily",
    // R022 · publish-queue 仅留 Hub 专用队列卡 CTA，不入日运分区平行入口
    hrefs: [
      "/admin/content/announcements",
      "/admin/content/roadmap",
      "/admin/content/landing-ambient",
      "/admin/content/media-assets",
      "/admin/content/seo",
      "/admin/content/translation",
    ],
  },
  {
    id: "catalog",
    titleKey: "admin_content_hub_section_catalog",
    dataAttr: "data-tt-admin-content-hub-section-catalog",
    hrefs: [
      "/admin/content/countries",
      "/admin/content/cities",
      "/admin/content/pois?type=attraction",
      "/admin/content/pricing",
      "/admin/content/hotel-tiers",
      "/admin/content/transport-region-rules",
      "/admin/content/intercity-routes",
      "/admin/content/poi-images",
    ],
  },
  {
    id: "tool",
    titleKey: "admin_content_hub_section_tool",
    badgeKey: "admin_content_hub_section_tool_badge",
    dataAttr: "data-tt-admin-content-hub-section-tool",
    hrefs: [
      "/admin/content/revisions",
      "/admin/content/import-operations",
      "/admin/content/catalog-dashboard",
      "/admin/content/geo-validation",
      "/admin/content/country-market",
    ],
  },
] as const;

export function contentHubSectionLinks(
  section: ContentHubSectionDef,
  allLinks: readonly AdminShellNavLinkDef[] = ADMIN_SHELL_CONTENT_NAV_LINKS,
): AdminShellNavLinkDef[] {
  const order = new Map(section.hrefs.map((h, i) => [h, i]));
  return allLinks
    .filter((l) => order.has(l.href))
    .sort((a, b) => (order.get(a.href) ?? 0) - (order.get(b.href) ?? 0));
}
