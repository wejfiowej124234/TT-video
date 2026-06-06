import type { CommunityCommentSort } from "@/lib/apiClient/community";
import type {
  CommunityPost,
  CommunityComment,
  CommunityPostUserVisibility,
} from "@/lib/communityMockData";
import type { CommunityFeedCardAuthorFollow } from "@/components/community/CommunityFeedCard";

/** `PostDetailDrawer` 对外契约（31 附录：帖子详情抽屉） */
export type PostDetailDrawerProps = {
  post: CommunityPost;
  comments: CommunityComment[];
  commentCount?: number;
  onClose: () => void;
  onCommentSend: (content: string, parentId?: string) => void | Promise<void>;
  t: (key: string) => string;
  isLoggedIn?: boolean;
  authPending?: boolean;
  liked?: boolean;
  collected?: boolean;
  onLike?: () => void;
  onCollect?: () => void;
  onReport?: (post: CommunityPost) => void;
  commentSendError?: boolean;
  commentSendErrorMessage?: string | null;
  commentFieldMessages?: Record<string, string> | null;
  onRetryComment?: () => void;
  commentsLoadError?: string | null;
  onRetryCommentsLoad?: () => void;
  commentSort?: CommunityCommentSort;
  onCommentSortChange?: (s: CommunityCommentSort) => void;
  authorFollow?: CommunityFeedCardAuthorFollow;
  onAfterTopicTagClick?: () => void;
  topicTagHref?: (tag: string) => string;
  onDeletePost?: () => void | Promise<void>;
  deletePostBusy?: boolean;
  onPostVisibilityChange?: (next: CommunityPostUserVisibility) => void | Promise<void>;
  postVisibilityBusy?: boolean;
  meUserId?: string | null;
  onReportComment?: (comment: CommunityComment) => void;
  commentsHasMore?: boolean;
  onLoadMoreComments?: () => void | Promise<void>;
  commentsLoadMoreBusy?: boolean;
  /** Feed 评论入口：打开后滚至评论区 */
  focusCommentsOnMount?: boolean;
  /** 视频帖：Feed 内可切换的视频 id 序（与图文共用详情壳） */
  videoFeedPostIds?: readonly string[];
  onVideoFeedSelect?: (postId: string) => void;
  onVideoFeedLoadMore?: () => void;
  videoFeedLoadingMore?: boolean;
};
