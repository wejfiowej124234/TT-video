"use client";

import dynamic from "next/dynamic";
import { CommunityDeletePostConfirmDialog } from "@/components/community/CommunityDeletePostConfirmDialog";
import { communityDrawerCommentCountHonestWithApiCache } from "@/components/community/communityFeedMappers";
import type { CommunityFeedMainPortalsProps } from "./communityFeedMainPortalsTypes";

const PostDetailDrawerPortal = dynamic(
  () =>
    import("@/components/community/PostDetailDrawerPortal").then((mod) => ({
      default: mod.PostDetailDrawerPortal,
    })),
  { ssr: false, loading: () => null },
);

type PostDetailSlice = Pick<
  CommunityFeedMainPortalsProps,
  | "t"
  | "detailPost"
  | "commentsForDetail"
  | "closeDetailDrawer"
  | "handleCommentSend"
  | "isLoggedIn"
  | "authLoading"
  | "meUserId"
  | "handleReportComment"
  | "handleDeleteComment"
  | "deleteConfirmCommentOpen"
  | "deleteConfirmBusy"
  | "deleteCommentError"
  | "cancelDeleteComment"
  | "confirmDeleteComment"
  | "handleReport"
  | "likedPostIds"
  | "collectedPostIds"
  | "handleLike"
  | "handleCollect"
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
  | "detailPostAuthorFollow"
  | "hrefTopicPathForTag"
  | "detailFocusComments"
  | "apiCommentsByPostId"
  | "detailVideoFeedPostIds"
  | "onDetailVideoFeedSelect"
  | "onDetailVideoFeedLoadMore"
  | "detailVideoFeedLoadingMore"
>;

export function CommunityFeedMainPostDetailPortal(props: PostDetailSlice) {
  const {
    t,
    detailPost,
    commentsForDetail,
    closeDetailDrawer,
    handleCommentSend,
    isLoggedIn,
    authLoading,
    meUserId,
    handleReportComment,
    handleDeleteComment,
    deleteConfirmCommentOpen,
    deleteConfirmBusy,
    deleteCommentError,
    cancelDeleteComment,
    confirmDeleteComment,
    handleReport,
    likedPostIds,
    collectedPostIds,
    handleLike,
    handleCollect,
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
    detailPostAuthorFollow,
    hrefTopicPathForTag,
    detailFocusComments,
    apiCommentsByPostId,
    detailVideoFeedPostIds,
    onDetailVideoFeedSelect,
    onDetailVideoFeedLoadMore,
    detailVideoFeedLoadingMore,
  } = props;
  return (
    <>
      {detailPost ? (
    <PostDetailDrawerPortal
      post={detailPost}
      comments={commentsForDetail}
      commentCount={communityDrawerCommentCountHonestWithApiCache(
        detailPost,
        commentsForDetail,
        apiCommentsByPostId,
        commentsLoadError,
      )}
      focusCommentsOnMount={detailFocusComments}
      onClose={closeDetailDrawer}
      onCommentSend={(content, parentId) => handleCommentSend(detailPost.id, content, parentId)}
      t={t}
      isLoggedIn={isLoggedIn}
      authPending={authLoading}
      meUserId={meUserId}
      onReportComment={(c) => handleReportComment(detailPost, c)}
      onDeleteComment={(c) => void handleDeleteComment(detailPost, c)}
      onReport={handleReport}
      liked={likedPostIds.has(detailPost.id)}
      collected={collectedPostIds.has(detailPost.id)}
      onLike={() =>
        void handleLike(detailPost.id, {
          serverLiked: typeof detailPost.likedByMe === "boolean" ? detailPost.likedByMe : undefined,
        })
      }
      onCollect={() =>
        void handleCollect(detailPost.id, {
          serverCollected:
            typeof detailPost.collectedByMe === "boolean" ? detailPost.collectedByMe : undefined,
        })
      }
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
      authorFollow={detailPostAuthorFollow}
      onAfterTopicTagClick={closeDetailDrawer}
      topicTagHref={hrefTopicPathForTag}
      videoFeedPostIds={detailVideoFeedPostIds}
      onVideoFeedSelect={onDetailVideoFeedSelect}
      onVideoFeedLoadMore={onDetailVideoFeedLoadMore}
      videoFeedLoadingMore={detailVideoFeedLoadingMore}
    />
      ) : null}
      <CommunityDeletePostConfirmDialog
        open={deleteConfirmCommentOpen}
        busy={deleteConfirmBusy}
        t={t}
        variant="comment"
        error={deleteCommentError}
        onCancel={cancelDeleteComment}
        onConfirm={() => void confirmDeleteComment()}
      />
    </>
  );
}
