import type { RefObject } from "react";
import type { CommunityCommentSort } from "@/lib/apiClient/community";
import type { CommunityComment, CommunityPost } from "@/lib/communityMockData";
import type { CommunityFeedCardAuthorFollow } from "@/components/community/CommunityFeedCard";

export type CommunityVideoFeedItem = {
  key: string;
  videoUrl: string | null;
  posterUrl?: string | null;
  /** 与 API `primary_media_asset_id` / `CommunityPost.primaryMediaAssetId` 同源（调试与后续 HLS 预留） */
  primaryMediaAssetId?: string | null;
  caption?: string;
  author?: string;
  authorAvatarUrl?: string | null;
  authorId?: string | null;
  likes?: number;
  comments?: number;
  collects?: number;
};

export type CommunityVideoOverlaySocialProps = {
  isLoggedIn?: boolean;
  authPending?: boolean;
  likedPostIds?: ReadonlySet<string>;
  collectedPostIds?: ReadonlySet<string>;
  onLike?: (postId: string) => void;
  onCollect?: (postId: string) => void;
  commentsByPostId?: Record<string, CommunityComment[]>;
  /** 已从 API 拉取过评论的帖子 id（`GET …/comments` 完成后的键集合） */
  commentsApiFetchedPostIds?: ReadonlySet<string>;
  onCommentSend?: (postId: string, content: string, parentId?: string) => void | Promise<void>;
  commentSort?: CommunityCommentSort;
  onCommentSortChange?: (sort: CommunityCommentSort) => void;
  commentsLoadError?: string | null;
  onRetryCommentsLoad?: () => void;
  commentSendError?: boolean;
  commentSendErrorMessage?: string | null;
  onRetryComment?: () => void;
  meUserId?: string | null;
  postsById?: Record<string, CommunityPost>;
  onReport?: (post: CommunityPost) => void;
  authorFollowForPost?: (postId: string) => CommunityFeedCardAuthorFollow | undefined;
};

export interface CommunityVideoOverlayProps extends CommunityVideoOverlaySocialProps {
  open: boolean;
  onClose: () => void;
  t: (key: string) => string;
  backButtonRef?: RefObject<HTMLButtonElement | null>;
  /** 当前 Feed 内可竖滑切换的视频条目（与信息流顺序一致） */
  items: CommunityVideoFeedItem[];
  /** 打开时选中的条目 `key`（通常为帖子 id） */
  activeKey: string | null;
  /** 滑到末条时尝试加载 Feed 下一页（与 `hasMore` 联动） */
  feedHasMore?: boolean;
  feedLoadingMore?: boolean;
  onRequestFeedLoadMore?: () => void;
};
