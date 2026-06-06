import type { CommunityCommentSort } from "@/lib/apiClient/community";
import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";

export const COMMENT_SORT_TABS = ["chronological", "latest", "hot"] as const satisfies readonly CommunityCommentSort[];

export function communityCommentSortTabHintKey(sort: CommunityCommentSort): string {
  return `community_comments_sort_${sort}_hint`;
}

export interface CommentDrawerProps {
  post: CommunityPost;
  comments: CommunityComment[];
  commentCount?: number;
  onClose: () => void;
  onSend: (content: string, parentId?: string) => void | Promise<void>;
  t: (key: string) => string;
  isLoggedIn?: boolean;
  /** getMe 未完成时不展示「去登录」条，避免登录后仍占位 */
  authPending?: boolean;
  /** 160：不展示本人评论上的举报入口 */
  meUserId?: string | null;
  onReportComment?: (comment: CommunityComment) => void;
  /** P1：评论发送失败时由父组件传入并展示重试 */
  commentSendError?: boolean;
  /** API `message` 映射后的文案；优先于默认失败句 */
  commentSendErrorMessage?: string | null;
  commentFieldMessages?: Record<string, string> | null;
  onRetryComment?: () => void;
  /** 31 §3.2：评论列表拉取失败 */
  commentsLoadError?: string | null;
  onRetryCommentsLoad?: () => void;
  /** 31 §2.2：最热/最新/时间序 */
  commentSort?: CommunityCommentSort;
  onCommentSortChange?: (s: CommunityCommentSort) => void;
  commentsHasMore?: boolean;
  onLoadMoreComments?: () => void | Promise<void>;
  commentsLoadMoreBusy?: boolean;
}
