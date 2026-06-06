"use client";

import type { CommunityCommentSort } from "@/lib/apiClient/community";
import { CommunityCommentSortTabs } from "@/components/community/CommunityCommentSortTabs";

export interface CommentDrawerSortTabsProps {
  t: (key: string) => string;
  commentSort: CommunityCommentSort;
  onCommentSortChange: (s: CommunityCommentSort) => void;
}

/** @deprecated 请直接用 `CommunityCommentSortTabs`；保留别名供 CommentDrawer 滚动体引用 */
export function CommentDrawerSortTabs(props: CommentDrawerSortTabsProps) {
  return (
    <CommunityCommentSortTabs
      {...props}
      idleVariant="muted"
      withDivider
    />
  );
}
