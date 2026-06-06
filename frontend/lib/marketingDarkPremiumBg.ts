/**
 * marketDark 高级暗色底 · ① V2 默认 premium（与 TT 社区 / 首页 L0 对齐）
 * - `/market`、`/did-rank`：默认 `premium`；回退暖褐：`NEXT_PUBLIC_TRAVELTRUST_MARKET_DARK_PREMIUM_BG=0`
 * - `/community`：固定 premium（封口 · 勿改 `resolveCommunityBackdropSurface`）
 */

import {
  TT_MARKETING_DARK_ROUTE_SURFACE,
  type TTMarketingDarkRouteSurfaceId,
} from "@/lib/marketingUi";

export function isMarketDarkPremiumBgPreviewEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_TRAVELTRUST_MARKET_DARK_PREMIUM_BG;
  return raw === "1" || raw === "true";
}

export function resolveMarketBackdropSurface(): TTMarketingDarkRouteSurfaceId {
  const raw = process.env.NEXT_PUBLIC_TRAVELTRUST_MARKET_DARK_PREMIUM_BG;
  if (raw === "0" || raw === "false") return "warm";
  return "premium";
}

/** `/did-rank` · 与 `/market` 同默认 premium 底 */
export function resolveDidRankBackdropSurface(): TTMarketingDarkRouteSurfaceId {
  return resolveMarketBackdropSurface();
}

export function resolveDidRankDarkRouteSceneTier(
  surface: TTMarketingDarkRouteSurfaceId,
): "market" | "marketPremium" | "didRank" {
  return surface === "premium" ? "marketPremium" : "didRank";
}

export function resolveMarketDarkRouteSceneTier(
  surface: TTMarketingDarkRouteSurfaceId,
): "market" | "marketPremium" {
  return surface === "premium" ? "marketPremium" : "market";
}

/** TT 社区 · ① 试色固定高级黑（#0a0a0a） */
export function resolveCommunityBackdropSurface(): TTMarketingDarkRouteSurfaceId {
  return "premium";
}

export function resolveCommunityDarkRouteSceneTier(
  surface: TTMarketingDarkRouteSurfaceId,
): "community" | "communityPremium" {
  return surface === "premium" ? "communityPremium" : "community";
}

export function darkRoutePageShellClass(surface: TTMarketingDarkRouteSurfaceId): string {
  return TT_MARKETING_DARK_ROUTE_SURFACE[surface].pageShell;
}

/** @deprecated 使用 darkRoutePageShellClass */
export function marketDarkRoutePageShellClass(surface: TTMarketingDarkRouteSurfaceId): string {
  return darkRoutePageShellClass(surface);
}
