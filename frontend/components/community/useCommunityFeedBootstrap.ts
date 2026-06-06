"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { useCommunityPublish } from "@/components/community/CommunityPublishContext";
import { useCommunityFeedModals } from "@/components/community/useCommunityFeedModals";
import { useCommunityFeedMeFollowingCollects } from "@/components/community/useCommunityFeedMeFollowingCollects";
import { useCommunityFeedBootstrapFeedState } from "@/components/community/useCommunityFeedBootstrapFeedState";
import {
  assembleCommunityFeedTailStatic,
  assembleCommunityFeedTopicChainArgs,
} from "@/components/community/communityFeedBootstrapAssemble";

/**
 * Feed 编排：弹层 / 关注·收藏 / 评论拉取 / Tab·排序·列表 API / 赞藏关 / 筛选态。
 * 与 `useCommunityFeedTopicReportCommentChain` 的入参边界对齐，主 hook 仅串联 topic + tail。
 */
export function useCommunityFeedBootstrap() {
  const { t } = useTranslation();
  const dash = t("ui_em_dash");
  const { isLoggedIn, isLoading: authLoading, user: communityUser } = useCommunityAuth();
  const publishContext = useCommunityPublish();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const modals = useCommunityFeedModals();
  const {
    commentPost,
    setCommentPost,
    detailPost,
    setDetailPost,
    publishOpen,
    setPublishOpen,
    showLoginModal,
    setShowLoginModal,
    toast,
    setToast,
    toastBodyOverride,
    setToastBodyOverride,
    toastHint,
    setToastHint,
    commentSendFailed,
    setCommentSendFailed,
    commentSendErrorMessage,
    setCommentSendErrorMessage,
    commentFieldMessages,
    setCommentFieldMessages,
    commentsRetryTick,
    setCommentsRetryTick,
    commentSort,
    setCommentSort,
    publishSendFailed,
    setPublishSendFailed,
    publishErrorMessage,
    setPublishErrorMessage,
    publishFieldMessages,
    setPublishFieldMessages,
    postDeepLinkBusy,
    setPostDeepLinkBusy,
    postDeepLinkAlert,
    setPostDeepLinkAlert,
    postDeepLinkLastId,
    setPostDeepLinkLastId,
    reportSuccessId,
    setReportSuccessId,
    focusReturnTargetRef,
    loginBackButtonRef,
    scheduleToastClear,
    setFocusReturn,
  } = modals;

  const meFollowing = useCommunityFeedMeFollowingCollects(isLoggedIn, t);
  const { meCollectsLoadError, retryMeCollectsLoad, collectedPostIds } = meFollowing;

  const feed = useCommunityFeedBootstrapFeedState(modals, meFollowing, {
    isLoggedIn,
    communityUser,
    searchParams,
    pathname,
    router,
    t,
  });
  const {
    allPosts,
    searchFilteredPosts,
    clearFiltersFromHook,
    setTagFilterState,
    setDestinationFilterFromUrl,
    searchQuery,
    setSearchQuery,
    filterApi,
    feedPage,
    setFeedPage,
    feedTagFromUrl,
    feedNextCursor,
    followingAuthorIdSet,
    followBusyAuthorId,
    handleAuthorFollowToggle,
    handleLike,
    handleCollect,
    likedPostIds,
    localCommentsByPostId,
    apiCommentsByPostId,
    commentsLoadError,
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
    feedApiRefetch,
    feedApiLoadMore,
    setFeedError,
    pullY,
    setPullY,
    feedLoading,
    feedLoadingMore,
    setFeedLoadingMore,
    hrefTopicPathForTag,
  } = feed;

  const topicChainArgs = assembleCommunityFeedTopicChainArgs({
    i18n: { t, dash },
    nav: { searchParams, pathname, router, sortBy: feed.sortBy },
    searchAndFilters: {
      setTagFilterState,
      setDestinationFilterFromUrl,
      searchQuery,
      setSearchQuery,
      clearFiltersFromHook,
    },
    toast: { setToastHint, setToastBodyOverride, setToast, scheduleToastClear },
    lists: { allPosts, searchFilteredPosts },
    deepLink: {
      postDeepLinkLastId,
      setDetailPost,
      setPostDeepLinkBusy,
      setPostDeepLinkAlert,
      setPostDeepLinkLastId,
    },
    gate: { isLoggedIn, setShowLoginModal, setFocusReturn },
    report: { setCommentPost, setReportSuccessId },
    feedPaging: { feedPage, setFeedPage, filterApi, feedTagFromUrl, feedNextCursor, authLoading },
    publishForm: { setPublishOpen, setPublishSendFailed, setPublishErrorMessage, setPublishFieldMessages },
    loginModal: { showLoginModal },
    commentPosts: {
      commentPost,
      detailPost,
      localCommentsByPostId,
      apiCommentsByPostId,
      setCommentsRetryTick,
      setCommentSendFailed,
      setCommentSendErrorMessage,
      setCommentFieldMessages,
    },
    meAndFeed: {
      communityUser,
      feedApiRefetch,
      setLocalCommentsByPostId: feed.setLocalCommentsByPostId,
      setApiPosts: feed.setApiPosts,
      setLocalPosts: feed.setLocalPosts,
    },
  });

  const tailStatic = assembleCommunityFeedTailStatic({
    post: { detailPost },
    user: { communityUserId: communityUser?.id },
    follow: { followingAuthorIdSet, followBusyAuthorId, handleAuthorFollowToggle },
    feed: {
      feedNextCursor,
      feedApiRefetch,
      feedApiLoadMore,
      setFeedError,
      setFeedPage,
      setFeedLoadingMore,
    },
    toast: { setToastHint, setToastBodyOverride, setToast, scheduleToastClear },
    shell: {
      t,
      pullY,
      setPullY,
      feedLoading,
      authLoading,
      isLoggedIn,
      focusReturnTargetRef,
      setFocusReturn,
      setShowLoginModal,
    },
    publish: { setPublishOpen, setPublishSendFailed, setPublishErrorMessage },
    drawers: { setCommentPost, setDetailPost },
  });

  return {
    topicChainArgs,
    tailStatic,
    publishContext,
    filterApi,
    hrefTopicPathForTag,
    anchorPoiId: feed.anchorPoiId,
    setAnchorPoiId: feed.setAnchorPoiId,
    proximityFilter: feed.proximityFilter,
    setProximityFilter: feed.setProximityFilter,
    t,
    isLoggedIn,
    authLoading,
    communityUser,
    feedError: feed.feedError,
    feedLoading,
    pullY,
    meCollectsLoadError,
    retryMeCollectsLoad,
    handleLike,
    handleCollect,
    handleAuthorFollowToggle,
    followingAuthorIdSet,
    followBusyAuthorId,
    likedPostIds,
    collectedPostIds,
    localCommentsByPostId,
    apiCommentsByPostId,
    commentsLoadError,
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
    commentSort,
    setCommentSort,
    commentPost,
    detailPost,
    publishOpen,
    showLoginModal,
    setShowLoginModal,
    toast,
    toastBodyOverride,
    toastHint,
    focusReturnTargetRef,
    loginBackButtonRef,
    postDeepLinkBusy,
    postDeepLinkAlert,
    feedPage,
    setFeedPage,
    feedLoadingMore,
    setFeedLoadingMore,
    setFocusReturn,
    setDetailPost,
    setCommentPost,
    reportSuccessId,
    commentSendFailed,
    commentSendErrorMessage,
    commentFieldMessages,
    publishSendFailed,
    publishErrorMessage,
    publishFieldMessages,
  };
}
