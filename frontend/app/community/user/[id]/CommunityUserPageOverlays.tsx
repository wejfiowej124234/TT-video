"use client";

import dynamic from "next/dynamic";
import { CommunityReportSubmittedBanner } from "@/components/community/CommunityReportSubmittedBanner";
import { communityDrawerCommentCountHonestWithApiCache } from "@/components/community/communityFeedMappers";
import { detailVideoFeedDrawerProps } from "@/components/community/postDetailVideoFeedNav";
import { CommunityDeletePostConfirmDialog } from "@/components/community/CommunityDeletePostConfirmDialog";
import type { CommunityUserPageCore } from "./useCommunityUserPageCore";

const PostDetailDrawerPortal = dynamic(
  () =>
    import("@/components/community/PostDetailDrawerPortal").then((mod) => ({
      default: mod.PostDetailDrawerPortal,
    })),
  { ssr: false, loading: () => null },
);

const CommunityReportDrawerPortal = dynamic(
  () =>
    import("@/components/community/CommunityReportDrawerPortal").then((mod) => ({
      default: mod.CommunityReportDrawerPortal,
    })),
  { ssr: false, loading: () => null },
);

/** 与 `page.tsx` 同源 · portal 详情/举报（P1-03 · ①） */
export function CommunityUserPageOverlays({ core }: { core: CommunityUserPageCore }) {
  const {
    t,
    isLoggedIn,
    authLoading,
    meUser,
    userPosts,
    detailPost,
    detailFocusComments = false,
    setDetailFocusComments,
    setDetailPost,
    closeWithFocusReturn,
    handleCommentSend,
    handleReportComment,
    commentSendFailed,
    commentSendErrorMessage,
    commentFieldMessages,
    clearCommentSendError,
    commentsLoadError,
    setCommentsRetryTick,
    commentSort,
    setCommentSort,
    commentsForDetail,
    apiCommentsByPostId,
    reportContext,
    closeReportDrawer,
    handleReportSubmit,
    reportSendFailed,
    reportErrorMessage,
    reportFieldMessages,
    clearReportSendError,
    handleReport,
    likedIds,
    collectedIds,
    handlePostLike,
    handlePostCollect,
    confirmDeletePost,
    deleteConfirmPostId,
    deleteConfirmBusy,
    cancelDeletePost,
    confirmDeletePostAction,
    deleteBusyId,
    handlePostVisibilityChange,
    visibilityBusyId,
    profileLikeCollectToast,
    followToast,
    reportSuccessFollowUp,
    reportNoticeBanner,
    detailDrawerAuthorFollow,
  } = core;

  const closeDetail = () =>
    closeWithFocusReturn(() => {
      setDetailFocusComments?.(false);
      setDetailPost(null);
    });

  const interactionToast = profileLikeCollectToast ?? followToast;

  return (
    <>
      {reportContext && (
        <CommunityReportDrawerPortal
          context={reportContext}
          onClose={closeReportDrawer}
          onSubmit={handleReportSubmit}
          t={t}
          reportSendFailed={reportSendFailed}
          reportErrorMessage={reportErrorMessage}
          reportFieldMessages={reportFieldMessages}
          onClearReportError={clearReportSendError}
        />
      )}
      {detailPost && (
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
          onClose={closeDetail}
          onCommentSend={handleCommentSend}
          t={t}
          isLoggedIn={isLoggedIn}
          authPending={authLoading}
          liked={likedIds.has(detailPost.id)}
          collected={collectedIds.has(detailPost.id)}
          onLike={() => void handlePostLike(detailPost.id)}
          onCollect={() => void handlePostCollect(detailPost.id)}
          onReport={handleReport}
          meUserId={meUser?.id ?? null}
          onReportComment={(c) => handleReportComment(detailPost, c)}
          commentSendError={commentSendFailed}
          commentSendErrorMessage={commentSendErrorMessage}
          commentFieldMessages={commentFieldMessages}
          onRetryComment={clearCommentSendError}
          commentsLoadError={commentsLoadError}
          onRetryCommentsLoad={() => setCommentsRetryTick((n) => n + 1)}
          commentSort={commentSort}
          onCommentSortChange={setCommentSort}
          onAfterTopicTagClick={closeDetail}
          onDeletePost={() => confirmDeletePost(detailPost.id)}
          deletePostBusy={deleteBusyId === detailPost.id}
          onPostVisibilityChange={(next) => {
            void handlePostVisibilityChange(detailPost.id, next);
          }}
          postVisibilityBusy={visibilityBusyId === detailPost.id}
          authorFollow={detailDrawerAuthorFollow}
          {...detailVideoFeedDrawerProps(userPosts, detailPost, setDetailPost)}
        />
      )}
      {interactionToast ? (
        <div
          className="fixed left-1/2 z-[120] bottom-24 md:bottom-8 -translate-x-1/2 max-w-[min(100vw-2rem,24rem)] rounded-[var(--radius-md)] border border-warning/50 bg-ink-900/95 backdrop-blur px-4 py-3 text-small text-warning/95 shadow-medium safe-area-pb"
          role="status"
          aria-live="polite"
        >
          {interactionToast}
        </div>
      ) : reportSuccessFollowUp ? (
        <div
          className="fixed left-1/2 z-[120] bottom-24 md:bottom-8 -translate-x-1/2 w-[min(100vw-1.5rem,22rem)] rounded-[var(--radius-md)] border border-ref-sun/32 bg-ink-900/95 backdrop-blur px-4 py-3 text-small text-ref-sun/90 shadow-scifi-toast safe-area-pb"
          role="status"
          aria-live="polite"
        >
          <CommunityReportSubmittedBanner t={t} reportId={reportSuccessFollowUp.reportId} />
        </div>
      ) : reportNoticeBanner ? (
        <div
          className="fixed left-1/2 z-[120] bottom-24 md:bottom-8 -translate-x-1/2 max-w-[min(100vw-2rem,24rem)] rounded-[var(--radius-md)] border border-warning/50 bg-ink-900/95 backdrop-blur px-4 py-3 text-small text-warning/95 shadow-medium safe-area-pb"
          role="status"
          aria-live="polite"
        >
          {reportNoticeBanner}
        </div>
      ) : null}
      <CommunityDeletePostConfirmDialog
        open={deleteConfirmPostId != null}
        busy={deleteConfirmBusy || deleteBusyId === deleteConfirmPostId}
        t={t}
        surface="page"
        onCancel={cancelDeletePost}
        onConfirm={confirmDeletePostAction}
      />
    </>
  );
}
