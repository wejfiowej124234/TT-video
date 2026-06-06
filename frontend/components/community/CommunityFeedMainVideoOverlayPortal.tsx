"use client";

/** @deprecated Feed 主路径已改用 PostDetailDrawer；保留供 evidence/CommunityVideoOverlay 测试。 */
import CommunityVideoOverlay, { type CommunityVideoFeedItem } from "@/components/community/CommunityVideoOverlay";
import type { CommunityCommentSort } from "@/lib/apiClient/community";
import type { CommunityComment, CommunityPost } from "@/lib/communityMockData";
import type { CommunityFeedCardAuthorFollow } from "@/components/community/CommunityFeedCard";
import type { RefObject } from "react";

export interface CommunityFeedMainVideoOverlayPortalProps {
  t: (key: string) => string;
  closeVideoOverlay: () => void;
  videoBackButtonRef: RefObject<HTMLButtonElement | null>;
  communityVideoFeedItems: CommunityVideoFeedItem[];
  activeKey: string | null;
  onActivePostChange: (postId: string) => void;
  isLoggedIn?: boolean;
  authPending?: boolean;
  likedPostIds?: ReadonlySet<string>;
  collectedPostIds?: ReadonlySet<string>;
  onLike: (postId: string) => void;
  onCollect: (postId: string) => void;
  commentsByPostId: Record<string, CommunityComment[]>;
  commentsApiFetchedPostIds?: ReadonlySet<string>;
  feedHasMore?: boolean;
  feedLoadingMore?: boolean;
  onRequestFeedLoadMore?: () => void;
  onCommentSend: (postId: string, content: string, parentId?: string) => void | Promise<void>;
  commentSort?: CommunityCommentSort;
  onCommentSortChange?: (sort: CommunityCommentSort) => void;
  commentsLoadError?: string | null;
  onRetryCommentsLoad?: () => void;
  commentSendError?: boolean;
  commentSendErrorMessage?: string | null;
  onRetryComment?: () => void;
  postsById?: Record<string, CommunityPost>;
  onReport?: (post: CommunityPost) => void;
  authorFollowForPost?: (postId: string) => CommunityFeedCardAuthorFollow | undefined;
}

export function CommunityFeedMainVideoOverlayPortal({
  t,
  closeVideoOverlay,
  videoBackButtonRef,
  communityVideoFeedItems,
  activeKey,
  onActivePostChange,
  isLoggedIn,
  authPending,
  likedPostIds,
  collectedPostIds,
  onLike,
  onCollect,
  commentsByPostId,
  commentsApiFetchedPostIds,
  feedHasMore,
  feedLoadingMore,
  onRequestFeedLoadMore,
  onCommentSend,
  commentSort,
  onCommentSortChange,
  commentsLoadError,
  onRetryCommentsLoad,
  commentSendError,
  commentSendErrorMessage,
  onRetryComment,
  postsById,
  onReport,
  authorFollowForPost,
}: CommunityFeedMainVideoOverlayPortalProps) {
  return (
    <CommunityVideoOverlay
      open={!!activeKey}
      onClose={closeVideoOverlay}
      t={t}
      backButtonRef={videoBackButtonRef}
      items={communityVideoFeedItems}
      activeKey={activeKey}
      onActivePostChange={onActivePostChange}
      isLoggedIn={isLoggedIn}
      authPending={authPending}
      likedPostIds={likedPostIds}
      collectedPostIds={collectedPostIds}
      onLike={onLike}
      onCollect={onCollect}
      commentsByPostId={commentsByPostId}
      commentsApiFetchedPostIds={commentsApiFetchedPostIds}
      feedHasMore={feedHasMore}
      feedLoadingMore={feedLoadingMore}
      onRequestFeedLoadMore={onRequestFeedLoadMore}
      onCommentSend={onCommentSend}
      commentSort={commentSort}
      onCommentSortChange={onCommentSortChange}
      commentsLoadError={commentsLoadError}
      onRetryCommentsLoad={onRetryCommentsLoad}
      commentSendError={commentSendError}
      commentSendErrorMessage={commentSendErrorMessage}
      onRetryComment={onRetryComment}
      postsById={postsById}
      onReport={onReport}
      authorFollowForPost={authorFollowForPost}
    />
  );
}
