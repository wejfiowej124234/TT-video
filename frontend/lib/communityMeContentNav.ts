import { communityMeTabBarLinkFocus } from "@/lib/communityA11yFocus";
import { buildPathnameSearchHref } from "@/lib/marketLoginReturnPath";
import { ME_SETTINGS_PROFILE_PATH } from "@/lib/me/meSettingsL5";
import { TT_COMMUNITY_ME_PANEL_L5 } from "@/lib/marketingUi";

/**
 * `/community/me?tab=` 与弹层面板对齐（书签深链）。
 * `tab=community_posts` 为 **IA 友好别名**（对客「社区帖子」），与历史 `tab=posts` 同面板；写入 URL 仍以 `posts` 为主路径时可混存书签。
 */
export type CommunityMeUrlTab = "likes" | "collects" | "posts" | "orders";

/** 已登录用户：Hub `?tab=` 深链归一化至独立页 / 全站订单（与资料卡分段 href 一致）。 */
const COMMUNITY_ME_TAB_DEDICATED_PATH: Record<CommunityMeUrlTab, string> = {
  posts: "/community/me/posts",
  collects: "/community/me/collects",
  likes: "/community/me/likes",
  orders: "/orders",
};

type TabSearch = { get: (name: string) => string | null; toString(): string };

/**
 * 将 Hub `?tab=` 映射为已登录用户的规范路径；`likes` 在功能关闭时返回 `null`（由 Hub 侧剔除 tab）。
 */
export function communityMeDedicatedPathForTab(
  tab: CommunityMeUrlTab,
  likesListEnabled: boolean,
): string | null {
  if (tab === "likes" && !likesListEnabled) return null;
  return COMMUNITY_ME_TAB_DEDICATED_PATH[tab] ?? null;
}

/** 合并 query：剔除 `tab`，保留其它投放 / 筛选参数。 */
export function communityMeDedicatedHrefFromHubQuery(
  dedicatedPath: string,
  searchParams: TabSearch | null | undefined,
): string {
  const sp = new URLSearchParams(searchParams?.toString() ?? "");
  sp.delete("tab");
  const qs = sp.toString();
  return qs ? `${dedicatedPath}?${qs}` : dedicatedPath;
}

export function parseCommunityMeTabQuery(
  pathname: string,
  searchParams: TabSearch | null | undefined,
): CommunityMeUrlTab | null {
  if (pathname !== "/community/me" || !searchParams) return null;
  const raw = (searchParams.get("tab") ?? "").trim().toLowerCase();
  if (raw === "community_posts") return "posts";
  if (raw === "likes" || raw === "collects" || raw === "posts" || raw === "orders") {
    return raw;
  }
  return null;
}

/**
 * 个人中心「赞过 | 收藏 | 我的订单 | 社区帖子」分段样式：多链接导航（非 ARIA tablist），当前路由段高亮。
 * 文案 SSOT：`community_me_tab_*`（`posts` 为 URL/query 历史片段名，对客见 `community_me_tab_community_posts`）。
 * 与 WAI-ARIA「navigation + link + aria-current=page」一致；Material / iOS 式等宽分段外观。
 */
export function communityMeContentSegmentClass(active: boolean): string {
  const base = `relative flex min-h-[44px] items-center justify-center px-2 py-2 text-kicker sm:text-meta motion-sub motion-reduce:transition-none ${communityMeTabBarLinkFocus}`;
  return active
    ? `${base} ${TT_COMMUNITY_ME_PANEL_L5.segmentLinkActive}`
    : `${base} ${TT_COMMUNITY_ME_PANEL_L5.segmentLinkInactive}`;
}

/** 社区帖子：`?tab=posts`、IA 别名，或独立页 `/community/me/posts`。 */
export function communityMePostsPathActive(pathname: string, searchParams?: TabSearch | null): boolean {
  if (pathname === "/community/me/posts" || pathname.startsWith("/community/me/posts/")) return true;
  return parseCommunityMeTabQuery(pathname, searchParams ?? null) === "posts";
}

/** 收藏：独立页 `/community/me/collects` 或 `?tab=collects`。 */
export function communityMeCollectsPathActive(pathname: string, searchParams?: TabSearch | null): boolean {
  if (pathname === "/community/me/collects" || pathname.startsWith("/community/me/collects/")) return true;
  return parseCommunityMeTabQuery(pathname, searchParams ?? null) === "collects";
}

/** 赞过：独立页 `/community/me/likes` 或 `?tab=likes` 弹层。 */
export function communityMeLikesPathActive(pathname: string, searchParams?: TabSearch | null): boolean {
  if (pathname === "/community/me/likes" || pathname.startsWith("/community/me/likes/")) return true;
  return parseCommunityMeTabQuery(pathname, searchParams ?? null) === "likes";
}

/** 全站订单列表（`/orders`）；`/community/me?tab=orders` 弹层打开时亦高亮。 */
export function communityMeOrdersPathActive(pathname: string, searchParams?: TabSearch | null): boolean {
  if (pathname === "/orders" || pathname.startsWith("/orders/")) return true;
  return parseCommunityMeTabQuery(pathname, searchParams ?? null) === "orders";
}

const LEGACY_ME_HUB_PATH_TO_TAB: Record<string, CommunityMeUrlTab> = {
  "/community/me/posts": "posts",
  "/community/me/collects": "collects",
  "/community/me/likes": "likes",
};

function mergeLegacyMeSubpathToDedicated(
  searchParams: { toString(): string } | null | undefined,
  tab: CommunityMeUrlTab,
): string {
  const dedicated = communityMeDedicatedPathForTab(tab, true);
  if (dedicated != null) {
    return communityMeDedicatedHrefFromHubQuery(dedicated, searchParams);
  }
  return ME_SETTINGS_PROFILE_PATH;
}

/**
 * 社区个人中心登录回流路径：在 `/community/me` 上保留当前 query（`tab`、投放参数等）；
 * **`/community/me/reports`** 与 **`/community/me/reports/:id`** 保持规范路径 + query（与 160 举报子站一致）；
 * 在 **`/community/me/posts|collects|likes`** 独立页上保留 pathname + query；
 * 其它路径回退到 **`communityMeDedicatedPathForTab(fallback)`**（likes/posts/collects/orders → 独立页或 `/orders`）。
 */
export function communityMeLoginReturnUrl(
  pathname: string | null | undefined,
  searchParams: { toString(): string } | null | undefined,
  tabFallback: CommunityMeUrlTab,
): string {
  if (pathname === "/community/me") {
    const tab = parseCommunityMeTabQuery(pathname, searchParams);
    if (tab != null) {
      const dedicated = communityMeDedicatedPathForTab(tab, true);
      if (dedicated != null) {
        return communityMeDedicatedHrefFromHubQuery(dedicated, searchParams);
      }
    }
    const q = (searchParams?.toString() ?? "").trim();
    if (q.length > 0) {
      const sp = new URLSearchParams(q);
      sp.delete("tab");
      const rest = sp.toString();
      return rest.length > 0 ? `${ME_SETTINGS_PROFILE_PATH}?${rest}` : ME_SETTINGS_PROFILE_PATH;
    }
    return ME_SETTINGS_PROFILE_PATH;
  }
  if (pathname === "/community/me/reports") {
    const q = (searchParams?.toString() ?? "").trim();
    return q.length > 0 ? `/community/me/reports?${q}` : "/community/me/reports";
  }
  if (pathname === "/community/me/posts" || pathname === "/community/me/collects" || pathname === "/community/me/likes") {
    const q = (searchParams?.toString() ?? "").trim();
    return q.length > 0 ? `${pathname}?${q}` : pathname;
  }
  if (typeof pathname === "string" && pathname.startsWith("/community/me/reports/")) {
    const idPart = pathname.slice("/community/me/reports/".length).trim();
    if (idPart.length > 0) {
      const q = (searchParams?.toString() ?? "").trim();
      return buildPathnameSearchHref(pathname, q);
    }
  }
  if (pathname != null) {
    const legacyTab = LEGACY_ME_HUB_PATH_TO_TAB[pathname];
    if (legacyTab != null) {
      return mergeLegacyMeSubpathToDedicated(searchParams, legacyTab);
    }
  }
  const dedicatedFallback = communityMeDedicatedPathForTab(tabFallback, true);
  return dedicatedFallback ?? ME_SETTINGS_PROFILE_PATH;
}
