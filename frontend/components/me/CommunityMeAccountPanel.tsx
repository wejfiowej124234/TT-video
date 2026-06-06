"use client";

import { CommunityMeAccountPanelInner } from "./CommunityMeAccountPanelInner";
import type { CommunityMeAccountPanelProps } from "./communityMePage/communityMeAccountPanelTypes";

export type { CommunityMeAccountPanelProps } from "./communityMePage/communityMeAccountPanelTypes";
/** 与 `CommunityMeUrlTab` / `?tab=` 同源；保留历史导出名供 `app/community/me/page.tsx`。 */
export type { CommunityMeUrlTab as CommunityMeNotesPanel } from "@/lib/communityMeContentNav";

/**
 * 登录后在 TT 社区「社区资料」页：顶栏资料卡 + 统计 + 可折叠账户详情 + 快捷抽屉。
 * 实现见 `communityMePage/*`；`enabled=false` 时不挂载（避免未登录触发 `useMePage` 重定向）。
 */
export default function CommunityMeAccountPanel({ enabled, hideQuickLinks, ...inner }: CommunityMeAccountPanelProps) {
  if (!enabled) return null;
  return <CommunityMeAccountPanelInner {...inner} hideQuickLinks={hideQuickLinks} />;
}
