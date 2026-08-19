/**
 * 首页 `/traveltrust` 导流 · 波 0 对齐真源（① · L5）
 * 叙事页 CTA / 五角色 / 页脚 / 信任三角 → 落地页路径与壳层 tier。
 * ① UI 视觉收口： `frontend/evidence/GO_local_marketing_front_closure/README.md`
 * ②③ API/真链： `GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md`
 */

import { TRAVELTRUST_ROLES, type TravelTrustRoleId } from "@/app/traveltrust/traveltrustIdentityModel";
import { TRAVELTRUST_LIQUIDITY_CONTRACT_DEV_FALLBACK } from "@/lib/traveltrustLiquidityContract";
import { TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK } from "@/lib/traveltrustPageBrief";
import { TRAVELTRUST_V6_IN_PAGE_PLAN_HREF } from "@/lib/traveltrustPlanTripHref";
import { TRAVELTRUST_NETWORK_ANNOUNCEMENTS } from "@/lib/traveltrustNetworkAnnouncements";

/** 波 0 机读锚（契约 / 落地页 `data-tt-homepage-funnel-l5`） */
export const TRAVELTRUST_HOMEPAGE_FUNNEL_L5_ID = "TT-HOMEPAGE-FUNNEL-L5-WAVE0-2026-05" as const;

/** ① 当前：主 CTA → 定制旅行 `/`（HU-018 · 顶栏同源） */
export const TRAVELTRUST_PLAN_TRIP_HREF_V6 = TRAVELTRUST_V6_IN_PAGE_PLAN_HREF;

/** 波 1 预定：可选外链向导市场（非 Hero 默认） */
export const TRAVELTRUST_WAVE1_PLAN_TRIP_TARGET = "/guides" as const;

export type HomepageFunnelLandingTier = "product_console" | "experience_dark";

export type HomepageFunnelLanding = {
  path: string;
  tier: HomepageFunnelLandingTier;
  roleId?: TravelTrustRoleId;
  source: string;
};

/** 五角色剧场「进入」与首页一致 */
export const TRAVELTRUST_ROLE_ENTER_ROUTES: Record<TravelTrustRoleId, string> = Object.fromEntries(
  TRAVELTRUST_ROLES.map((r) => [r.id, r.href]),
) as Record<TravelTrustRoleId, string>;

/** 信任 / 资金叙事三角（首页 #trust · #settlement · FAQ · #liquidity） */
export const TRAVELTRUST_TRUST_FUNNEL_ROUTES = {
  help: "/help",
  trust: "/trust",
  governance: "/governance",
  governanceParams: "/governance/params",
  helpDisclosure: "/help#disclosure",
  pay: TRAVELTRUST_LIQUIDITY_CONTRACT_DEV_FALLBACK.escrow_pay_path,
  governanceHub: TRAVELTRUST_LIQUIDITY_CONTRACT_DEV_FALLBACK.governance_hub_path,
  feeRoutes: "/governance/fee-routes",
  disputes: "/disputes",
  traveltrustFeeRouter: "/traveltrust#fee-router",
  protocolPaper: "/protocol",
} as const;

/** page-brief ① 默认 CTA */
export const TRAVELTRUST_PAGE_BRIEF_CTA_DEFAULTS = {
  primary: TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK.cta_contract.primary_target,
  secondary: TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK.cta_contract.secondary_target,
} as const;

/** 页脚导流路径库存（slim footer 不再渲染 sitemap；路径仍须存在） */
export const TRAVELTRUST_FOOTER_PRODUCT_ROUTES = [
  "/traveltrust",
  "/",
  "/market",
  "/orders",
  "/pay",
  "/guides",
  "/market/provider",
  "/market/acquisition",
  "/community",
] as const;

export const TRAVELTRUST_FOOTER_TRUST_ROUTES = [
  "/help",
  "/trust",
  "/governance",
  "/governance/fee-routes",
  "/privacy",
  "/terms",
  "/protocol",
  "/brand",
  "/assurance",
  "/contact",
] as const;

/** Pulse 归档页 + 公告内「查看详情」链（① 静态） */
export const TRAVELTRUST_PULSE_HREFS = [
  "/traveltrust/announcements",
  ...TRAVELTRUST_NETWORK_ANNOUNCEMENTS.filter((a) => a.href).map((a) => a.href as string),
] as const;

/** 首页导流落地页 · L5 壳层 tier（TT-PH1-194 产品浅壳 vs 市场/向导深壳） */
export const HOMEPAGE_FUNNEL_LANDINGS: readonly HomepageFunnelLanding[] = [
  { path: TRAVELTRUST_WAVE1_PLAN_TRIP_TARGET, tier: "experience_dark", roleId: "traveler", source: "wave1_plan_trip" },
  { path: "/guide", tier: "experience_dark", roleId: "guide", source: "theater_enter" },
  { path: "/market/provider", tier: "experience_dark", roleId: "merchant", source: "theater_enter" },
  { path: "/market/acquisition", tier: "experience_dark", roleId: "acquisition", source: "theater_enter" },
  { path: "/governance", tier: "product_console", roleId: "region_steward", source: "theater_enter" },
  { path: TRAVELTRUST_TRUST_FUNNEL_ROUTES.help, tier: "product_console", source: "trust_facts" },
  { path: TRAVELTRUST_TRUST_FUNNEL_ROUTES.pay, tier: "product_console", source: "settlement_liquidity" },
  { path: TRAVELTRUST_TRUST_FUNNEL_ROUTES.trust, tier: "experience_dark", source: "trust_facts" },
  { path: TRAVELTRUST_TRUST_FUNNEL_ROUTES.disputes, tier: "product_console", source: "faq" },
  { path: "/orders", tier: "product_console", source: "footer" },
] as const;

/** 产品浅壳页 L5 `data-*`（orders / pay / help / governance hub 等） */
export function traveltrustProductL5ShellDataAttrs(pageSlug: string): Record<string, string> {
  return {
    "data-tt-ui-generation": "v2",
    "data-tt-marketing-product-shell": "1",
    "data-tt-homepage-funnel-l5": TRAVELTRUST_HOMEPAGE_FUNNEL_L5_ID,
    [`data-tt-${pageSlug}-page`]: "1",
  };
}

/** 体验深壳页 L5 `data-*`（guides / market 子站 / trust） */
export function traveltrustExperienceL5ShellDataAttrs(pageSlug: string): Record<string, string> {
  return {
    "data-tt-ui-generation": "v2",
    "data-tt-homepage-funnel-l5": TRAVELTRUST_HOMEPAGE_FUNNEL_L5_ID,
    [`data-tt-${pageSlug}-page`]: "1",
  };
}
