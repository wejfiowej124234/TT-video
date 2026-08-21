"use client";

import dynamic from "next/dynamic";
import { CommunityFeedMainPostDetailPortal } from "./CommunityFeedMainPostDetailPortal";
import { CommunityFeedMainPublishDrawerPortal } from "./CommunityFeedMainPublishDrawerPortal";
import { CommunityFeedMainReportDrawerPortal } from "./CommunityFeedMainReportDrawerPortal";
import { CommunityFeedMainToastPortal } from "./CommunityFeedMainToastPortal";
import type { CommunityFeedMainPortalsProps } from "./communityFeedMainPortalsTypes";

export type { CommunityFeedMainPortalsProps } from "./communityFeedMainPortalsTypes";

const PublishDrawerLazy = dynamic(
  () => import("@/components/community/PublishDrawer").then((mod) => ({ default: mod.PublishDrawer })),
  { ssr: false, loading: () => null },
);

export default function CommunityFeedMainPortals(props: CommunityFeedMainPortalsProps) {
  return (
    <>
      <CommunityFeedMainToastPortal
        t={props.t}
        toast={props.toast}
        toastBodyOverride={props.toastBodyOverride}
        toastHint={props.toastHint}
        reportSuccessId={props.reportSuccessId}
      />
      <CommunityFeedMainReportDrawerPortal
        t={props.t}
        reportContext={props.reportContext}
        closeReportDrawer={props.closeReportDrawer}
        handleReportSubmit={props.handleReportSubmit}
        reportSendFailed={props.reportSendFailed}
        reportErrorMessage={props.reportErrorMessage}
        reportFieldMessages={props.reportFieldMessages}
        clearReportSendError={props.clearReportSendError}
      />
      <CommunityFeedMainPostDetailPortal
        t={props.t}
        detailPost={props.detailPost}
        commentsForDetail={props.commentsForDetail}
        apiCommentsByPostId={props.apiCommentsByPostId}
        closeDetailDrawer={props.closeDetailDrawer}
        detailFocusComments={props.detailFocusComments}
        handleCommentSend={props.handleCommentSend}
        isLoggedIn={props.isLoggedIn}
        authLoading={props.authLoading}
        meUserId={props.meUserId}
        handleReportComment={props.handleReportComment}
        handleDeleteComment={props.handleDeleteComment}
        deleteConfirmCommentOpen={props.deleteConfirmCommentOpen}
        deleteConfirmBusy={props.deleteConfirmBusy}
        deleteCommentError={props.deleteCommentError}
        cancelDeleteComment={props.cancelDeleteComment}
        confirmDeleteComment={props.confirmDeleteComment}
        handleReport={props.handleReport}
        likedPostIds={props.likedPostIds}
        collectedPostIds={props.collectedPostIds}
        handleLike={props.handleLike}
        handleCollect={props.handleCollect}
        commentSendFailed={props.commentSendFailed}
        commentSendErrorMessage={props.commentSendErrorMessage}
        commentFieldMessages={props.commentFieldMessages}
        clearCommentSendError={props.clearCommentSendError}
        commentsLoadError={props.commentsLoadError}
        retryCommentsLoad={props.retryCommentsLoad}
        commentSort={props.commentSort}
        setCommentSort={props.setCommentSort}
        commentsHasMore={props.commentsHasMore}
        loadMoreComments={props.loadMoreComments}
        commentsLoadMoreBusy={props.commentsLoadMoreBusy}
        detailPostAuthorFollow={props.detailPostAuthorFollow}
        hrefTopicPathForTag={props.hrefTopicPathForTag}
        detailVideoFeedPostIds={props.detailVideoFeedPostIds}
        onDetailVideoFeedSelect={props.onDetailVideoFeedSelect}
        onDetailVideoFeedLoadMore={props.onDetailVideoFeedLoadMore}
        detailVideoFeedLoadingMore={props.detailVideoFeedLoadingMore}
      />
      <CommunityFeedMainPublishDrawerPortal
        PublishDrawer={PublishDrawerLazy}
        t={props.t}
        publishOpen={props.publishOpen}
        closePublishDrawer={props.closePublishDrawer}
        handlePublishSubmit={props.handlePublishSubmit}
        publishSendFailed={props.publishSendFailed}
        publishErrorMessage={props.publishErrorMessage}
        publishFieldMessages={props.publishFieldMessages}
        clearPublishSendError={props.clearPublishSendError}
      />
    </>
  );
}
