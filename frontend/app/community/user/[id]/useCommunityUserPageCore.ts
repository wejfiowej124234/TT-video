"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { useCommunityPostLikeCollect } from "@/components/community/useCommunityPostLikeCollect";
import { useCommunityPostReport } from "@/components/community/useCommunityPostReport";
import { isUuid } from "./communityUserPageModel";
import { useCommunityUserRemoteLists } from "./useCommunityUserRemoteLists";
import { useCommunityUserPostMutations } from "./useCommunityUserPostMutations";
import { useCommunityUserPageCommentDrawer } from "./useCommunityUserPageCommentDrawer";
import { communityOpenPostDetail } from "@/components/community/communityOpenPostDetail";
import type { CommunityPost } from "@/lib/communityMockData";
import { useCallback } from "react";
import { useCommunityMePageSessionPin } from "@/lib/communityMePageSessionPin";

export function useCommunityUserPageCore() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { t } = useTranslation();
  const { isLoggedIn, isLoading: authLoading, user: meUser } = useCommunityAuth();

  const isSelf = Boolean(isLoggedIn && meUser?.id && meUser.id === id);

  const lists = useCommunityUserRemoteLists({
    id,
    t,
    isSelf,
    isLoggedIn,
    authLoading,
    meId: meUser?.id,
  });

  const {
    userPosts,
    setUserPosts,
    loading,
    postsLoadError,
    setPostsRetryKey,
    postsVisFilter,
    setPostsVisFilter,
    conversationsLoadError,
    setConversationsRetryKey,
    followingLoadError,
    setFollowingRetryKey,
    followBusy,
    followingListFetch,
    isFollowing,
    handleFollowToggle,
    followToast,
    msgHref,
  } = lists;

  const { itemsForGrid: userPostsForFeed, pinToTop: pinUserPostToTop } = useCommunityMePageSessionPin(
    userPosts,
    (p) => p.id,
  );

  const drawer = useCommunityUserPageCommentDrawer({ t, meUser: meUser ?? null, setUserPosts });

  const userProfileReturnPath = id ? `/community/user/${id}` : "/community";
  const {
    reportContext,
    handleReport,
    handleReportComment,
    closeReportDrawer,
    handleReportSubmit,
    reportSendFailed,
    reportErrorMessage,
    reportFieldMessages,
    clearReportSendError,
    reportNoticeBanner,
    reportSuccessFollowUp,
  } = useCommunityPostReport(
    isLoggedIn,
    () => router.push(`/auth/login?returnUrl=${encodeURIComponent(userProfileReturnPath)}`),
    t
  );

  const {
    handleLike: handlePostLike,
    handleCollect: handlePostCollect,
    likedIds,
    collectedIds,
    interactionToast: profileLikeCollectToast,
  } = useCommunityPostLikeCollect(t, {
    postsForLikeSync: userPosts,
    detailPostForLikeSync: drawer.detailPost,
  });

  const {
    deleteBusyId,
    deleteError,
    visibilityBusyId,
    visibilityError,
    confirmDeletePost,
    deleteConfirmPostId,
    deleteConfirmBusy,
    cancelDeletePost,
    confirmDeletePostAction,
    handlePostVisibilityChange,
  } = useCommunityUserPostMutations({
    t,
    setUserPosts,
    setDetailPost: drawer.setDetailPost,
    setCommentPost: drawer.setCommentPost,
    setApiCommentsByPostId: drawer.setApiCommentsByPostId,
  });

  const authorLabel = id.slice(0, 8);
  const profileAuthor = userPosts[0]?.author;
  const displayName =
    profileAuthor?.nickname?.trim() ? profileAuthor.nickname : authorLabel;

  const detailDrawerAuthorFollow =
    !isSelf && isLoggedIn
      ? {
          followed: followingListFetch === "ready" && isFollowing,
          onToggle: () => {
            void handleFollowToggle();
          },
          disabled: followBusy || followingListFetch !== "ready",
          hidden: false,
        }
      : !isSelf
        ? {
            followed: false,
            onToggle: () => {
              router.push(`/auth/login?returnUrl=${encodeURIComponent(userProfileReturnPath)}`);
            },
            hidden: false,
          }
        : undefined;

  const hasValidProfileId = Boolean(id && isUuid(id));

  const onCommentOpen = useCallback(
    (post: CommunityPost, trigger?: HTMLElement | null) => {
      communityOpenPostDetail({
        post,
        trigger: trigger ?? undefined,
        focusComments: true,
        focusReturnTargetRef: drawer.focusReturnTargetRef,
        setDetailFocusComments: drawer.setDetailFocusComments,
        setCommentPost: drawer.setCommentPost,
        setDetailPost: drawer.setDetailPost,
      });
    },
    [drawer.focusReturnTargetRef, drawer.setCommentPost, drawer.setDetailPost, drawer.setDetailFocusComments],
  );

  const onDetailOpen = useCallback(
    (post: CommunityPost, trigger?: HTMLElement | null) => {
      communityOpenPostDetail({
        post,
        trigger: trigger ?? undefined,
        focusComments: false,
        focusReturnTargetRef: drawer.focusReturnTargetRef,
        setDetailFocusComments: drawer.setDetailFocusComments,
        setCommentPost: drawer.setCommentPost,
        setDetailPost: drawer.setDetailPost,
      });
    },
    [drawer.focusReturnTargetRef, drawer.setCommentPost, drawer.setDetailPost, drawer.setDetailFocusComments],
  );

  return {
    hasValidProfileId,
    id,
    router,
    t,
    meUser,
    isLoggedIn,
    authLoading,
    isSelf,
    userProfileReturnPath,
    userPosts,
    userPostsForFeed,
    pinUserPostToTop,
    loading,
    postsLoadError,
    setPostsRetryKey,
    postsVisFilter,
    setPostsVisFilter,
    deleteError,
    visibilityError,
    followingLoadError,
    setFollowingRetryKey,
    conversationsLoadError,
    setConversationsRetryKey,
    profileAuthor,
    displayName,
    followBusy,
    followingListFetch,
    isFollowing,
    handleFollowToggle,
    msgHref,
    handlePostLike,
    handlePostCollect,
    likedIds,
    collectedIds,
    apiCommentsByPostId: drawer.apiCommentsByPostId,
    focusReturnTargetRef: drawer.focusReturnTargetRef,
    setCommentPost: drawer.setCommentPost,
    setDetailPost: drawer.setDetailPost,
    handleReport,
    reportContext,
    closeReportDrawer,
    handleReportSubmit,
    reportSendFailed,
    reportErrorMessage,
    reportFieldMessages,
    clearReportSendError,
    reportNoticeBanner,
    reportSuccessFollowUp,
    commentPost: drawer.commentPost,
    commentsForPost: drawer.commentsForPost,
    detailPost: drawer.detailPost,
    detailFocusComments: drawer.detailFocusComments,
    setDetailFocusComments: drawer.setDetailFocusComments,
    commentsForDetail: drawer.commentsForDetail,
    handleCommentSend: drawer.handleCommentSend,
    closeWithFocusReturn: drawer.closeWithFocusReturn,
    commentSendFailed: drawer.commentSendFailed,
    commentSendErrorMessage: drawer.commentSendErrorMessage,
    commentFieldMessages: drawer.commentFieldMessages,
    clearCommentSendError: drawer.clearCommentSendError,
    commentsLoadError: drawer.commentsLoadError,
    setCommentsRetryTick: drawer.setCommentsRetryTick,
    commentSort: drawer.commentSort,
    setCommentSort: drawer.setCommentSort,
    commentsHasMore: drawer.commentsHasMore,
    loadMoreComments: drawer.loadMoreComments,
    commentsLoadMoreBusy: drawer.commentsLoadMoreBusy,
    detailDrawerAuthorFollow,
    handleReportComment,
    confirmDeletePost,
    deleteBusyId,
    deleteConfirmPostId,
    deleteConfirmBusy,
    cancelDeletePost,
    confirmDeletePostAction,
    handlePostVisibilityChange,
    visibilityBusyId,
    followToast,
    profileLikeCollectToast,
    onCommentOpen,
    onDetailOpen,
  };
}

export type CommunityUserPageCore = ReturnType<typeof useCommunityUserPageCore>;
