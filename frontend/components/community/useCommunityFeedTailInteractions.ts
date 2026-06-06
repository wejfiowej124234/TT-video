"use client";

import { useMemo } from "react";
import type { UseCommunityFeedTailInteractionsOptions } from "@/components/community/communityFeedTopicAndTailHookModel";
import { buildAuthorFollowForPost } from "@/components/community/communityFeedFollowUtils";
import { useCommunityFeedRefreshAndLoadMore } from "@/components/community/useCommunityFeedRefreshAndLoadMore";
import { useCommunityFeedTouchPullRefresh } from "@/components/community/useCommunityFeedTouchPullRefresh";
import { useCommunityFeedPublishOpenAndDrawerClosers } from "@/components/community/useCommunityFeedPublishOpenAndClosers";

/** 详情作者关注条、刷新/加载更多、下拉刷新、发帖/抽屉关闭器（从 `useCommunityFeed` 拆出，行为同源）。 */
export function useCommunityFeedTailInteractions(options: UseCommunityFeedTailInteractionsOptions) {
  const {
    detailPost,
    communityUserId,
    followingAuthorIdSet,
    followBusyAuthorId,
    handleAuthorFollowToggle,
    hasMore,
    feedNextCursor,
    feedApiRefetch,
    feedApiLoadMore,
    setFeedError,
    setFeedPage,
    setFeedLoadingMore,
    setToastHint,
    setToastBodyOverride,
    setToast,
    scheduleToastClear,
    t,
    pullY,
    setPullY,
    feedLoading,
    authLoading,
    isLoggedIn,
    focusReturnTargetRef,
    setFocusReturn,
    setShowLoginModal,
    setPublishOpen,
    setPublishSendFailed,
    setPublishErrorMessage,
    setCommentPost,
    setDetailPost,
  } = options;

  const detailPostAuthorFollow = useMemo(
    () =>
      detailPost
        ? buildAuthorFollowForPost(detailPost, {
            meUserId: communityUserId ?? null,
            followingAuthorIds: followingAuthorIdSet,
            followBusyAuthorId,
            onAuthorFollowToggle: handleAuthorFollowToggle,
          })
        : undefined,
    [detailPost, communityUserId, followingAuthorIdSet, followBusyAuthorId, handleAuthorFollowToggle],
  );

  const { refreshFeed, handleLoadMore } = useCommunityFeedRefreshAndLoadMore({
    hasMore,
    feedNextCursor,
    feedApiRefetch,
    feedApiLoadMore,
    setFeedError,
    setFeedPage,
    setFeedLoadingMore,
    setToastHint,
    setToastBodyOverride,
    setToast,
    scheduleToastClear,
    t,
  });

  useCommunityFeedTouchPullRefresh(pullY, setPullY, feedLoading, refreshFeed);

  const { openPublish, closeCommentDrawer, closeDetailDrawer, closePublishDrawer } =
    useCommunityFeedPublishOpenAndDrawerClosers({
      authLoading,
      isLoggedIn,
      focusReturnTargetRef,
      setFocusReturn,
      setShowLoginModal,
      setPublishOpen,
      setPublishSendFailed,
      setPublishErrorMessage,
      setCommentPost,
      setDetailPost,
    });

  return {
    detailPostAuthorFollow,
    refreshFeed,
    handleLoadMore,
    openPublish,
    closeCommentDrawer,
    closeDetailDrawer,
    closePublishDrawer,
  };
}
