import { communityMeTabBarLinkFocus } from "@/lib/communityA11yFocus";
import { buildPathnameSearchHref } from "@/lib/marketLoginReturnPath";

/**
 * `/community/me?tab=` 与弹层面板对齐（书签深链）。
 * `tab=community_posts` 为 **IA 友好别名**（对客「社区帖子」），与历史 `tab=posts` 同面板；写入 URL 仍以 `posts` 为主路径时可混存书签。
 */
export type CommunityMeUrlTab = "likes" | "collects" | "posts" | "orders";

type TabSearch = { get: (name: string) => string | null };

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
    ? `${base} bg-slate-800/95 font-semibold text-cyan-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`
    : `${base} text-slate-400 hover:bg-slate-800/55 hover:text-slate-200`;
}

/** 社区帖子：`?tab=posts` 或 IA 别名 `?tab=community_posts`；文案键 `community_me_tab_community_posts`。 */
export function communityMePostsPathActive(pathname: string, searchParams?: TabSearch | null): boolean {
  return parseCommunityMeTabQuery(pathname, searchParams ?? null) === "posts";
}

/** 收藏弹层；`?tab=collects` 时高亮。 */
export function communityMeCollectsPathActive(pathname: string, searchParams?: TabSearch | null): boolean {
  return parseCommunityMeTabQuery(pathname, searchParams ?? null) === "collects";
}

/** 赞过弹层；`?tab=likes` 时高亮。 */
export function communityMeLikesPathActive(pathname: string, searchParams?: TabSearch | null): boolean {
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

function mergeLegacyMeSubpathToHub(
  pathname: string,
  searchParams: { toString(): string } | null | undefined,
  tab: CommunityMeUrlTab,
): string {
  const sp = new URLSearchParams(searchParams?.toString() ?? "");
  const merged = new URLSearchParams();
  sp.forEach((value, key) => {
    if (key !== "tab") merged.set(key, value);
  });
  merged.set("tab", tab);
  return `/community/me?${merged.toString()}`;
}

/**
 * 社区个人中心登录回流路径：在 `/community/me` 上保留当前 query（`tab`、投放参数等）；
 * **`/community/me/reports`** 与 **`/community/me/reports/:id`** 保持规范路径 + query（与 160 举报子站一致）；
 * 在 **`/community/me/posts|collects|likes`**（已重定向的遗留路径）上合并为 `/community/me?tab=…` 并保留非 `tab` 参数；
 * 否则回退到 `/community/me?tab=<fallback>`。
 */
export function communityMeLoginReturnUrl(
  pathname: string | null | undefined,
  searchParams: { toString(): string } | null | undefined,
  tabFallback: CommunityMeUrlTab,
): string {
  const fb = `/community/me?tab=${tabFallback}`;
  if (pathname === "/community/me") {
    const q = (searchParams?.toString() ?? "").trim();
    return q.length > 0 ? `/community/me?${q}` : fb;
  }
  if (pathname === "/community/me/reports") {
    const q = (searchParams?.toString() ?? "").trim();
    return q.length > 0 ? `/community/me/reports?${q}` : "/community/me/reports";
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
      return mergeLegacyMeSubpathToHub(pathname, searchParams, legacyTab);
    }
  }
  return fb;
}
