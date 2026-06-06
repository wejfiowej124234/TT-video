"use client";

/**
 * @deprecated 主 Feed 评论入口已统一 `PostDetailDrawer`（`communityOpenPostDetail`）。
 * 本 Portal 无运行时引用，保留供子页/contract 过渡；**勿**在新路径挂载。
 *
 * 若 `commentPost` 被误设，应改为 `setDetailPost` + `setCommentPost(null)`。
 */

import { CommentDrawerPortal } from "@/components/community/CommentDrawerPortal";
import { communityDrawerCommentCountHonestWithApiCache } from "@/components/community/communityFeedMappers";
import type { CommunityFeedMainPortalsProps } from "./communityFeedMainPortalsTypes";

type CommentSlice = Pick<
  CommunityFeedMainPortalsProps,
  | "t"
  | "commentPost"
  | "commentsForPost"
  | "closeCommentDrawer"
  | "handleCommentSend"
  | "isLoggedIn"
  | "authLoading"
  | "meUserId"
  | "handleReportComment"
  | "commentSendFailed"
  | "commentSendErrorMessage"
  | "commentFieldMessages"
  | "clearCommentSendError"
  | "commentsLoadError"
  | "retryCommentsLoad"
  | "commentSort"
  | "setCommentSort"
  | "commentsHasMore"
  | "loadMoreComments"
  | "commentsLoadMoreBusy"
  | "apiCommentsByPostId"
>;

export function CommunityFeedMainCommentDrawerPortal(props: CommentSlice) {
  const {
    t,
    commentPost,
    commentsForPost,
    closeCommentDrawer,
    handleCommentSend,
    isLoggedIn,
    authLoading,
    meUserId,
    handleReportComment,
    commentSendFailed,
    commentSendErrorMessage,
    commentFieldMessages,
    clearCommentSendError,
    commentsLoadError,
    retryCommentsLoad,
    commentSort,
    setCommentSort,
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
    apiCommentsByPostId,
  } = props;
  if (!commentPost) return null;
  return (
    <CommentDrawerPortal
      post={commentPost}
      comments={commentsForPost}
      commentCount={communityDrawerCommentCountHonestWithApiCache(
        commentPost,
        commentsForPost,
        apiCommentsByPostId,
        commentsLoadError,
      )}
      onClose={closeCommentDrawer}
      onSend={(content, parentId) => handleCommentSend(commentPost.id, content, parentId)}
      t={t}
      isLoggedIn={isLoggedIn}
      authPending={authLoading}
      meUserId={meUserId}
      onReportComment={(c) => handleReportComment(commentPost, c)}
      commentSendError={commentSendFailed}
      commentSendErrorMessage={commentSendErrorMessage}
      commentFieldMessages={commentFieldMessages}
      onRetryComment={clearCommentSendError}
      commentsLoadError={commentsLoadError}
      onRetryCommentsLoad={retryCommentsLoad}
      commentSort={commentSort}
      onCommentSortChange={setCommentSort}
      commentsHasMore={commentsHasMore}
      onLoadMoreComments={loadMoreComments}
      commentsLoadMoreBusy={commentsLoadMoreBusy}
    />
  );
}
