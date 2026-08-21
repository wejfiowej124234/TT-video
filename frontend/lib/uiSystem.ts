/**
 * TravelTrust · 全站 UI 单入口（① 本地 · V2）
 *
 * **目标**：风格与组件 class **只从本文件 / `marketingUi` 出口**取用；禁止新增遗留 console 按钮 class、散写 `travel-*` 色板。
 * **分区**：情绪层 / 控制台 / 深色撮合 / 运维 —— **氛围可不同，token 与壳规则同一套**（对齐 spec 13-1、86、issues-phase1 §V2）。
 *
 * V1 只读：`frontend/archive/ui-v1/`
 */

import {
  TT_MARKETING_DARK_ROUTE_PAGE_SHELL,
  TT_MARKETING_HEADER_BAR_COMMUNITY_PREMIUM,
  TT_MARKETING_HEADER_BAR_DARK_ROUTE_PREMIUM,
  TT_MARKETING_HEADER_BAR_MARKET_DARK_PREMIUM,
  TT_MARKETING_HEADER_BAR_DARK,
  TT_MARKETING_HEADER_BAR_HOME,
  TT_MARKETING_HEADER_BAR_LIGHT,
  TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC,
  TT_MARKETING_NAV_MOBILE_RAIL_COMMUNITY_PREMIUM,
  TT_MARKETING_NAV_MOBILE_RAIL_DARK_ROUTE_PREMIUM,
  TT_MARKETING_NAV_MOBILE_RAIL_MARKET_DARK_PREMIUM,
  TT_MARKETING_REGISTER_PILL_COMMUNITY,
  TT_MARKETING_HEADER_BRAND_DARK,
  TT_MARKETING_HEADER_BRAND_HOME,
  TT_MARKETING_HEADER_BRAND_LIGHT,
  TT_MARKETING_HEADER_LOGIN_DARK,
  TT_MARKETING_HEADER_LOGIN_HOME,
  TT_MARKETING_HEADER_LOGIN_LIGHT,
  TT_MARKETING_NAV_LINK_ACTIVE_LIGHT,
  TT_MARKETING_NAV_LINK_ACTIVE_UNIFIED,
  TT_MARKETING_NAV_LINK_INACTIVE_LIGHT,
  TT_MARKETING_NAV_LINK_INACTIVE_UNIFIED,
  TT_MARKETING_NAV_MOBILE_RAIL_DARK,
  TT_MARKETING_NAV_MOBILE_RAIL_HOME,
  TT_MARKETING_NAV_MOBILE_RAIL_LIGHT,
  TT_MARKETING_NAV_MOBILE_RAIL_INNER,
  TT_MARKETING_PRODUCT_PAGE_SHELL,
  TT_MARKETING_REGISTER_PILL_LIGHT,
  TT_MARKETING_REGISTER_PILL_WARM,
} from "@/lib/marketingUi";

export * from "@/lib/marketingUi";

/** 页面氛围分区（非第二套设计系统，仅决定背景/顶栏/按钮变体） */
export type UiZone = "experience" | "console" | "marketDark" | "admin";

/** `/orders` 列表 · Phase① 深色 L5 页身（`#0c0a09`）· L0 顶栏须同源首页，勿落 Console 浅条 */
export function isOrdersListDarkL5HeaderPath(pathname: string | null | undefined): boolean {
  return (pathname ?? "") === "/orders";
}

/** `/orders/new` · Phase① 深色 L5 创建页（顶栏同源首页 cinematic） */
export function isOrdersNewDarkL5HeaderPath(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  return p === "/orders/new" || p.startsWith("/orders/new/");
}

/** `/orders` 列表或 `/orders/new` · 深色 L5 顶栏族 */
export function isOrdersDarkL5HeaderPath(pathname: string | null | undefined): boolean {
  return isOrdersListDarkL5HeaderPath(pathname) || isOrdersNewDarkL5HeaderPath(pathname);
}

/** `/governance*` · Phase① 深色 L5 治理链（顶栏 + 四链 + utility 同源 `/orders` cinematic） */
export function isGovernanceDarkL5HeaderPath(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  return p === "/governance" || p.startsWith("/governance/");
}

/** `/orders*` · `/escrow*` · `/pay*` · `/itinerary*` · `/governance*` — 订单/治理主链 + 顶栏 cinematic 同族 */
export function isOrderChainDarkL5HeaderPath(pathname: string | null | undefined): boolean {
  return (
    isOrdersDarkL5HeaderPath(pathname) ||
    isProductConsoleL5UtilityPath(pathname) ||
    isGovernanceDarkL5HeaderPath(pathname)
  );
}

/** `/escrow` · `/pay` · `/itinerary` · 深色页身 + 顶栏 utility 须 authL5 玻璃下拉（非 Console 白菜单） */
export function isProductConsoleL5UtilityPath(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  return (
    p === "/escrow" ||
    p.startsWith("/escrow/") ||
    p === "/pay" ||
    p.startsWith("/pay/") ||
    p === "/itinerary" ||
    p.startsWith("/itinerary/")
  );
}

const MARKET_DARK_PREFIXES = ["/market", "/community", "/did-rank"] as const;
const ADMIN_PREFIX = "/admin";

/** `/community/*` · L0 顶栏与页身 premium 黑对齐（封口 · 仅 community 路由） */
export function isCommunityPremiumHeaderPath(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  return p === "/community" || p.startsWith("/community/");
}

const AUTH_L5_DARK_HEADER_PREFIXES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/me/identities",
  "/me/settings",
  "/me/password",
  "/me/security",
  "/me/onboarding",
  "/me/publish",
  /** 向导/商家工作台 + 入驻链 + 身份质押 · L0 四链 + authL5 utility 同源五主/Hub */
  "/guide",
  "/staking",
  "/provider",
  "/steward/register",
  "/trust",
] as const;

/** `/auth/*` · workspace operator · Hub/settings：L0 premium 深顶栏（勿落 Console 白条） */
export function isAuthL5DarkHeaderPath(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  return AUTH_L5_DARK_HEADER_PREFIXES.some((pre) => p === pre || p.startsWith(`${pre}/`));
}

/** @deprecated 使用 `isAuthL5DarkHeaderPath` */
export function isAuthLoginL5HeaderPath(pathname: string | null | undefined): boolean {
  return isAuthL5DarkHeaderPath(pathname);
}

/** 顶栏语言/钱包 utility 变体（auth L5 用暖金胶囊，与玻璃卡同温） */
export type HeaderUtilityVariant = "light" | "dark" | "community" | "authL5";

/** 暖金 utility + 玻璃下拉：Auth 路由、五主深顶栏、`/` 首页、Admin L0（① · 登录态顶栏同温） */
export function isHeaderUtilityL5Path(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  if (isAdminHeaderPath(p)) return true;
  if (isAuthL5DarkHeaderPath(p)) return true;
  if (isCommunityPremiumHeaderPath(p)) return true;
  if (isMarketDarkPremiumHeaderPath(p)) return true;
  if (p === "/" || p === "/plan" || p.startsWith("/traveltrust")) return true;
  if (isOrderChainDarkL5HeaderPath(p)) return true;
  const kind = headerSurfaceKindForPathname(p);
  return kind === "home" || kind === "dark";
}

export function headerUtilityVariantForPathname(pathname: string | null | undefined): HeaderUtilityVariant {
  if (isHeaderUtilityL5Path(pathname)) return "authL5";
  return "light";
}

/** `/market*` · `/did-rank` · `/guides*` · L0 premium 顶栏（V2 · 与 TT 社区目视同族；不含 `/community`） */
export function isMarketDarkPremiumHeaderPath(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  return (
    p === "/market" ||
    p.startsWith("/market/") ||
    p === "/did-rank" ||
    p.startsWith("/did-rank/") ||
    p === "/guides" ||
    p.startsWith("/guides/")
  );
}

/**
 * 由 pathname 解析 UI 分区（用于壳层、Storybook、审计脚本）。
 * `/orders`、`/pay`、`/escrow`、`/governance` 等 → `console`（页身分区；L0 顶栏见 `isGovernanceDarkL5HeaderPath`）。
 */
export function resolveUiZone(pathname: string | null | undefined): UiZone {
  const p = pathname ?? "";
  if (p.startsWith(ADMIN_PREFIX)) return "admin";
  if (MARKET_DARK_PREFIXES.some((pre) => p === pre || p.startsWith(`${pre}/`))) return "marketDark";
  if (p === "/" || p === "/plan" || p.startsWith("/traveltrust")) return "experience";
  return "console";
}

/** `/admin` 命名空间：L0 顶栏进入 Admin 模式（隐藏五主营销四链，保留账号/语言/返回站点）。 */
export function isAdminHeaderPath(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  return p === ADMIN_PREFIX || p.startsWith(`${ADMIN_PREFIX}/`);
}

/**
 * 是否隐藏顶栏「Web3旅行 / 自由市场 / 排行榜 / TT社区」四链。
 * 默认全路由保留 L0 四链（含 `/traveltrust`）；**仅 `/admin*`** 进入 Admin 模式 suppress。
 */
export function shouldSuppressGlobalSiteNav(pathname: string | null | undefined): boolean {
  return isAdminHeaderPath(pathname);
}

/**
 * 顶栏分层（与 `Header.tsx` / 各路由 L1 子导航配套）：
 * - **L0** `Header`：全站品牌、四链（可 suppress）、钱包/登录；宽 `TT_MARKETING_HEADER_INNER_FRAME`
 * - **L1** 页内：`TravelTrustLandingChrome` · `MarketHubSubNav` · `CommunityRouteShell` Tab 等
 */
/** L0 顶栏视觉：home 半透明 / dark 深条 / light 浅 Console 条 */
export type HeaderSurfaceKind = "home" | "dark" | "light";

export function headerSurfaceKindForPathname(pathname: string | null | undefined): HeaderSurfaceKind {
  const p = pathname ?? "";
  if (isAdminHeaderPath(p)) return "dark";
  if (p === "/" || p === "/plan") return "home";
  if (isOrderChainDarkL5HeaderPath(p)) return "home";
  if (isAuthL5DarkHeaderPath(p)) return "dark";
  const zone = resolveUiZone(p);
  if (zone === "experience" || zone === "marketDark") return "dark";
  return "light";
}

export function headerBarClassForPathname(pathname: string | null | undefined): string {
  const p = pathname ?? "";
  if (isAdminHeaderPath(p)) {
    return TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC;
  }
  if (isOrderChainDarkL5HeaderPath(p)) {
    return TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC;
  }
  if (p === "/" || p.startsWith("/traveltrust")) {
    return TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC;
  }
  if (isAuthL5DarkHeaderPath(p)) {
    return TT_MARKETING_HEADER_BAR_DARK_ROUTE_PREMIUM;
  }
  if (isCommunityPremiumHeaderPath(p)) {
    return TT_MARKETING_HEADER_BAR_COMMUNITY_PREMIUM;
  }
  if (isMarketDarkPremiumHeaderPath(p)) {
    return TT_MARKETING_HEADER_BAR_MARKET_DARK_PREMIUM;
  }
  const kind = headerSurfaceKindForPathname(pathname);
  if (kind === "home") return TT_MARKETING_HEADER_BAR_HOME;
  if (kind === "dark") return TT_MARKETING_HEADER_BAR_DARK;
  return TT_MARKETING_HEADER_BAR_LIGHT;
}

export function headerMobileNavRailClassForPathname(pathname: string | null | undefined): string {
  if (isOrderChainDarkL5HeaderPath(pathname)) {
    return TT_MARKETING_NAV_MOBILE_RAIL_HOME;
  }
  if (isAuthL5DarkHeaderPath(pathname)) {
    return TT_MARKETING_NAV_MOBILE_RAIL_DARK_ROUTE_PREMIUM;
  }
  if (isCommunityPremiumHeaderPath(pathname)) {
    return TT_MARKETING_NAV_MOBILE_RAIL_COMMUNITY_PREMIUM;
  }
  if (isMarketDarkPremiumHeaderPath(pathname)) {
    return TT_MARKETING_NAV_MOBILE_RAIL_MARKET_DARK_PREMIUM;
  }
  const kind = headerSurfaceKindForPathname(pathname);
  if (kind === "home") return TT_MARKETING_NAV_MOBILE_RAIL_HOME;
  if (kind === "dark") return TT_MARKETING_NAV_MOBILE_RAIL_DARK;
  return TT_MARKETING_NAV_MOBILE_RAIL_LIGHT;
}

/** L0 四链：当前项是否激活（与 Header href 一一对应） */
export function headerNavItemIsActive(pathname: string | null | undefined, href: string): boolean {
  const p = pathname ?? "";
  /** 定制旅行 → AI 行程规划 `/plan`（地球仪首页 `/` 由品牌字标承担） */
  if (href === "/plan") return p === "/plan" || p.startsWith("/plan/");
  if (href === "/") return false;
  if (href === "/market") return p === "/market" || p.startsWith("/market/");
  if (href === "/did-rank") return p === "/did-rank" || p.startsWith("/did-rank/");
  if (href === "/community") return p === "/community" || p.startsWith("/community/");
  return false;
}

/** 品牌字标 TravelTrust：官网地球仪首页为当前目录 */
export function headerBrandWordmarkIsActive(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  return p === "/" || p.startsWith("/traveltrust");
}

/** L0 四链 class：仅「浅 Console / 深顶栏」两套；激活态由 `active` 决定，不随当前页换色板 */
export function headerNavLinkClasses(pathname: string | null | undefined, active: boolean): string {
  const kind = headerSurfaceKindForPathname(pathname);
  if (kind === "light") {
    return active ? TT_MARKETING_NAV_LINK_ACTIVE_LIGHT : TT_MARKETING_NAV_LINK_INACTIVE_LIGHT;
  }
  return active ? TT_MARKETING_NAV_LINK_ACTIVE_UNIFIED : TT_MARKETING_NAV_LINK_INACTIVE_UNIFIED;
}

/** L0 品牌字标（不用四链 inactive 胶囊） */
export function headerBrandWordmarkClasses(pathname: string | null | undefined): string {
  const kind = headerSurfaceKindForPathname(pathname);
  const base =
    kind === "home"
      ? TT_MARKETING_HEADER_BRAND_HOME
      : kind === "light"
        ? TT_MARKETING_HEADER_BRAND_LIGHT
        : TT_MARKETING_HEADER_BRAND_DARK;
  return headerBrandWordmarkIsActive(pathname) ? `${base} !text-ref-sun` : base;
}

/** L0 登录文字链 */
export function headerLoginLinkClasses(pathname: string | null | undefined): string {
  if (isAuthL5DarkHeaderPath(pathname)) {
    const onLogin = pathname === "/auth/login";
    return onLogin
      ? `${TT_MARKETING_HEADER_LOGIN_HOME} font-semibold text-ref-sun`
      : TT_MARKETING_HEADER_LOGIN_HOME;
  }
  if (isCommunityPremiumHeaderPath(pathname) || isMarketDarkPremiumHeaderPath(pathname)) {
    return TT_MARKETING_HEADER_LOGIN_HOME;
  }
  if (isOrderChainDarkL5HeaderPath(pathname)) {
    return TT_MARKETING_HEADER_LOGIN_HOME;
  }
  const kind = headerSurfaceKindForPathname(pathname);
  if (kind === "home") return TT_MARKETING_HEADER_LOGIN_HOME;
  if (kind === "light") return TT_MARKETING_HEADER_LOGIN_LIGHT;
  return TT_MARKETING_HEADER_LOGIN_DARK;
}

/** L0 注册胶囊 */
export function headerRegisterPillClasses(pathname: string | null | undefined): string {
  if (isAuthL5DarkHeaderPath(pathname)) {
    const onRegister = pathname === "/auth/register";
    return onRegister
      ? `${TT_MARKETING_REGISTER_PILL_COMMUNITY} ring-2 ring-ref-sun/45`
      : TT_MARKETING_REGISTER_PILL_COMMUNITY;
  }
  if (isCommunityPremiumHeaderPath(pathname)) {
    return TT_MARKETING_REGISTER_PILL_COMMUNITY;
  }
  if (isMarketDarkPremiumHeaderPath(pathname)) {
    return TT_MARKETING_REGISTER_PILL_WARM;
  }
  if (isOrderChainDarkL5HeaderPath(pathname)) {
    return TT_MARKETING_REGISTER_PILL_WARM;
  }
  return headerSurfaceKindForPathname(pathname) === "light"
    ? TT_MARKETING_REGISTER_PILL_LIGHT
    : TT_MARKETING_REGISTER_PILL_WARM;
}

/** 品牌字标：官网根路径即为地球仪网络首页 */
export function resolveHeaderBrandHref(_pathname: string | null | undefined): string {
  return "/";
}

export function resolveHeaderBrandLabel(
  pathname: string | null | undefined,
  labels: { home: string; network: string },
): string {
  return pathname?.startsWith("/traveltrust") ? labels.network : "TravelTrust";
}

/** 根 layout `body` / 产品区内页默认壳 */
export function bodyShellClassForZone(zone: UiZone): string {
  switch (zone) {
    case "experience":
      return "min-h-screen antialiased";
    case "marketDark":
      return TT_MARKETING_DARK_ROUTE_PAGE_SHELL;
    case "admin":
      return TT_MARKETING_PRODUCT_PAGE_SHELL;
    case "console":
    default:
      return TT_MARKETING_PRODUCT_PAGE_SHELL;
  }
}

/** 顶栏表面（与 `Header.tsx` 一致） */
export function headerBarClassForZone(zone: UiZone, pathname: string): string {
  void zone;
  return headerBarClassForPathname(pathname);
}
