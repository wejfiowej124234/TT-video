"use client";

import { PostDetailDrawerPortal } from "@/components/community/PostDetailDrawerPortal";
import { CommunityReportDrawerPortal } from "@/components/community/CommunityReportDrawerPortal";
import { CommunityReportSubmittedBanner } from "@/components/community/CommunityReportSubmittedBanner";
import { communityDrawerCommentCountHonestWithApiCache } from "@/components/community/communityFeedMappers";
import { detailVideoFeedDrawerProps } from "@/components/community/postDetailVideoFeedNav";
import { CommunityMeUncollectConfirmDialog } from "@/components/community/CommunityMeUncollectConfirmDialog";
import type { CommunityMeCollectsPageViewModel } from "./useCommunityMeCollectsPage";

/** 与 `page.tsx` 同源 · portal 详情/举报（P1-03 · ①） */
export function CommunityMeCollectsPortals({
  vm,
  confirmSurface = "page",
}: {
  vm: CommunityMeCollectsPageViewModel;
  confirmSurface?: "page" | "hub";
}) {
  const {
    t,
    isLoggedIn,
    authPending,
    meUser,
    detailPost,
    detailFocusComments = false,
    setDetailFocusComments,
    reportContext,
    closeReportDrawer,
    handleReportSubmit,
    reportSendFailed,
    reportErrorMessage,
    reportFieldMessages,
    clearReportSendError,
    handleReportComment,
    commentsForDetail,
    closeWithFocusReturn,
    setDetailPost,
    handleCommentSend,
    commentSendFailed,
    commentSendErrorMessage,
    commentFieldMessages,
    clearCommentSendError,
    commentsLoadError,
    setCommentsRetryTick,
    commentSort,
    setCommentSort,
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
    likedIds,
    collectedIds,
    handleLike,
    handleCollect,
    handleReport,
    interactionToast,
    reportSuccessFollowUp,
    reportNoticeBanner,
    collectedPostsForGrid,
    uncollectConfirmPostId,
    uncollectConfirmBusy,
    cancelUncollect,
    confirmUncollect,
  } = vm;

  const closeDetail = () =>
    closeWithFocusReturn(() => {
      setDetailFocusComments?.(false);
      setDetailPost(null);
    });

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
            vm.apiCommentsByPostId,
            commentsLoadError,
          )}
          focusCommentsOnMount={detailFocusComments}
          onClose={closeDetail}
          onCommentSend={handleCommentSend}
          t={t}
          isLoggedIn={isLoggedIn}
          authPending={authPending}
          liked={likedIds.has(detailPost.id)}
          collected={collectedIds.has(detailPost.id)}
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
          {...detailVideoFeedDrawerProps(collectedPostsForGrid, detailPost, setDetailPost)}
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

      <CommunityMeUncollectConfirmDialog
        open={uncollectConfirmPostId != null}
        busy={uncollectConfirmBusy}
        t={t}
        surface={confirmSurface}
        onCancel={cancelUncollect}
        onConfirm={confirmUncollect}
      />
    </>
  );
}
