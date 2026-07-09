/** Official Ops + Growth Ops · L5 SSOT（① · 运营/早鸟走廊） */

export const OFFICIAL_OPS_L5_PROBE = "official-growth-ops-l5-v1" as const;

/** 冷启动 consumer surfaces · 下拉 SSOT（替代手填 CSV） */
export const OFFICIAL_COLD_START_SURFACE_OPTIONS = [
  { id: "home_hero", labelKey: "admin_official_cold_start_surface_home_hero" },
  { id: "market_feed", labelKey: "admin_official_cold_start_surface_market_feed" },
  { id: "community_feed", labelKey: "admin_official_cold_start_surface_community_feed" },
  { id: "landing_promo", labelKey: "admin_official_cold_start_surface_landing_promo" },
] as const;

export type OfficialColdStartSurfaceId = (typeof OFFICIAL_COLD_START_SURFACE_OPTIONS)[number]["id"];

/** 实体级 display_surfaces · SSOT-PUB-OPS §3.4（与 Cold Start 同名 + 子站扩展） */
export const PUBLIC_OPS_ENTITY_SURFACE_OPTIONS = [
  ...OFFICIAL_COLD_START_SURFACE_OPTIONS,
  { id: "did_rank", labelKey: "admin_public_operations_surface_did_rank" },
  { id: "market_provider", labelKey: "admin_public_operations_surface_market_provider" },
  { id: "market_acquisition", labelKey: "admin_public_operations_surface_market_acquisition" },
] as const;

export type PublicOpsEntitySurfaceId = (typeof PUBLIC_OPS_ENTITY_SURFACE_OPTIONS)[number]["id"];

export const OFFICIAL_OPS_HUB_LINKS = [
  {
    href: "/admin/official/accounts",
    labelKey: "admin_shell_nav_official_accounts",
    hintKey: "admin_official_hub_hint_accounts",
    dataAttr: "/admin/official/accounts",
  },
  {
    href: "/admin/official/guides",
    labelKey: "admin_shell_nav_official_guides",
    hintKey: "admin_official_hub_hint_guides",
    dataAttr: "/admin/official/guides",
  },
  {
    href: "/admin/official/itinerary-templates",
    labelKey: "admin_shell_nav_official_templates",
    hintKey: "admin_official_hub_hint_templates",
    dataAttr: "/admin/official/itinerary-templates",
  },
  {
    href: "/admin/official/public-operations",
    labelKey: "admin_shell_nav_official_public_operations",
    hintKey: "admin_official_hub_hint_public_operations",
    dataAttr: "/admin/official/public-operations",
  },
  {
    href: "/admin/official/cold-start",
    labelKey: "admin_shell_nav_official_cold_start",
    hintKey: "admin_official_hub_hint_cold_start",
    dataAttr: "/admin/official/cold-start",
  },
] as const;

export const GROWTH_OPS_HUB_HINT_KEYS: Record<string, string> = {
  "/admin/growth/referral-codes": "admin_growth_hub_hint_referral",
  "/admin/growth/early-bird": "admin_growth_hub_hint_early_bird",
  "/admin/growth/airdrop-campaigns": "admin_growth_hub_hint_airdrop",
  "/admin/growth/kol-center": "admin_growth_hub_hint_kol",
  "/admin/growth/reward-ledger": "admin_growth_hub_hint_ledger",
  "/admin/growth/anti-fraud": "admin_growth_hub_hint_fraud",
  "/admin/growth/analytics": "admin_growth_hub_hint_analytics",
};
