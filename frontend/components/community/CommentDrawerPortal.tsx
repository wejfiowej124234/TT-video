"use client";

import { CommentDrawer } from "@/components/community/CommentDrawer";
import { CommunityDrawerPortal } from "@/components/community/communityDrawerPortal";
import type { CommunityCommentSort } from "@/lib/apiClient/community";
import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";

/** 深链 / 遗留路径保留；Feed 主路径评论已并入 PostDetailDrawer */
export function CommentDrawerPortal(
  props: {
    post: CommunityPost;
    comments: CommunityComment[];
    commentCount?: number;
    onClose: () => void;
    onSend: (content: string, parentId?: string) => void | Promise<void>;
    t: (key: string) => string;
    isLoggedIn?: boolean;
    authPending?: boolean;
    meUserId?: string | null;
    onReportComment?: (c: CommunityComment) => void;
    commentSendError?: boolean;
    commentSendErrorMessage?: string | null;
    commentFieldMessages?: Record<string, string> | null;
    onRetryComment?: () => void;
    commentsLoadError?: string | null;
    onRetryCommentsLoad?: () => void;
    commentSort?: CommunityCommentSort;
    onCommentSortChange?: (sort: CommunityCommentSort) => void;
  },
) {
  return (
    <CommunityDrawerPortal>
      <CommentDrawer {...props} />
    </CommunityDrawerPortal>
  );
}
