"use client";

import type { FormEvent } from "react";
import type { CommunityCommentSort } from "@/lib/apiClient/community";
import { communityShellTabFocus } from "@/lib/communityA11yFocus";
import {
  COMMENT_SORT_TABS,
  communityCommentSortTabHintKey,
} from "@/components/community/commentDrawerModel";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";

export type CommunityCommentSortTabsProps = {
  t: (key: string) => string;
  commentSort: CommunityCommentSort;
  onCommentSortChange: (s: CommunityCommentSort) => void;
  /** CommentDrawer 滚动体用 muted idle；PostDetail 用 default */
  idleVariant?: "default" | "muted";
  className?: string;
  withDivider?: boolean;
};

/** 评论排序 Tab · 31 §2.2 · 标签 + title 提示消除「时间序/最新」语义重叠 */
export function CommunityCommentSortTabs({
  t,
  commentSort,
  onCommentSortChange,
  idleVariant = "default",
  className = "",
  withDivider = false,
}: CommunityCommentSortTabsProps) {
  const idleClass =
    idleVariant === "muted" ? TT_COMMUNITY_DRAWER_L5.sortTabIdleMuted : TT_COMMUNITY_DRAWER_L5.sortTabIdle;

  return (
    <div
      role="tablist"
      aria-label={t("community_comments_sort_aria")}
      className={`flex max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:pb-1 max-sm:snap-x max-sm:snap-mandatory gap-2 ${withDivider ? `pb-1 border-b ${TT_COMMUNITY_DRAWER_L5.divider}` : ""} ${className}`.trim()}
    >
      {COMMENT_SORT_TABS.map((s) => (
        <form
          key={s}
          className="contents"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            onCommentSortChange(s);
          }}
        >
          <button
            type="submit"
            role="tab"
            aria-selected={commentSort === s}
            title={t(communityCommentSortTabHintKey(s))}
            className={`${communityShellTabFocus} shrink-0 max-sm:snap-start ${
              commentSort === s ? TT_COMMUNITY_DRAWER_L5.sortTabActive : idleClass
            }`}
          >
            {t(`community_comments_sort_${s}`)}
          </button>
        </form>
      ))}
    </div>
  );
}
