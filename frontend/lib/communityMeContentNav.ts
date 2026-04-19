import { communityMeTabBarLinkFocus } from "@/lib/communityA11yFocus";

/**
 * 个人中心「笔记 | 收藏 | 赞过」分段样式：多链接导航（非 ARIA tablist），当前路由段高亮。
 * 与 WAI-ARIA「navigation + link + aria-current=page」一致；Material / iOS 式等宽分段外观。
 */
export function communityMeContentSegmentClass(active: boolean): string {
  const base = `relative flex min-h-[44px] items-center justify-center px-2 py-2 text-[0.7rem] sm:text-meta motion-sub ${communityMeTabBarLinkFocus}`;
  return active
    ? `${base} bg-slate-800/95 font-semibold text-cyan-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`
    : `${base} text-slate-400 hover:bg-slate-800/50 hover:text-slate-100`;
}

export function communityMePostsPathActive(pathname: string): boolean {
  return pathname === "/community/me/posts" || pathname.startsWith("/community/me/posts/");
}

export function communityMeCollectsPathActive(pathname: string): boolean {
  return pathname === "/community/me/collects" || pathname.startsWith("/community/me/collects/");
}
