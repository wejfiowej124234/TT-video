"use client";

import { useEffect, useMemo } from "react";
import { FEED_PAGE_SIZE } from "@/components/community/communityFeedConstants";
import type { UseCommunityFeedTopicReportCommentChainOptions } from "@/components/community/communityFeedTopicAndTailHookModel";
import { useCommunityFeedTopicDestinationUrl } from "@/components/community/useCommunityFeedTopicDestinationUrl";
import { useCommunityFeedPostDeepLink } from "@/components/community/useCommunityFeedPostDeepLink";
import { useCommunityFeedReportAndCommentDrawer } from "@/components/community/useCommunityFeedReportAndCommentDrawer";
import { useCommunityFeedPublishQueryAndRegister } from "@/components/community/useCommunityFeedPublishOpenAndClosers";
import { useCommunityFeedEscapeKeyHandlers } from "@/components/community/useCommunityFeedEscapeKeyHandlers";
import { useCommunityFeedCommentsDerived } from "@/components/community/useCommunityFeedCommentsDerived";
import { useCommunityFeedCommentAndPublish } from "@/components/community/useCommunityFeedCommentAndPublish";

/** Topic/目的地 URL、`?post=` 深链、举报/评论、Feed 页 client 分页重置、`?publish=`、Escape、评论派生与发送（从 `useCommunityFeed` 拆出，行为同源）。 */
export function useCommunityFeedTopicReportCommentChain(options: UseCommunityFeedTopicReportCommentChainOptions) {
  const {
    t,
    dash,
    searchParams,
    pathname,
    router,
    sortBy,
    setTagFilterState,
    setDestinationFilterFromUrl,
    searchQuery,
    setSearchQuery,
    clearFiltersFromHook,
    setToastHint,
    setToastBodyOverride,
    setToast,
    scheduleToastClear,
    allPosts,
    searchFilteredPosts,
    postDeepLinkLastId,
    setDetailPost,
    setPostDeepLinkBusy,
    setPostDeepLinkAlert,
    setPostDeepLinkLastId,
    isLoggedIn,
    setShowLoginModal,
    setFocusReturn,
    setDetailFocusComments,
    setCommentPost,
    setReportSuccessId,
    feedPage,
    setFeedPage,
    filterApi,
    feedTagFromUrl,
    feedNextCursor,
    authLoading,
    registerOpenPublish,
    setPublishOpen,
    setPublishSendFailed,
    setPublishErrorMessage,
    setPublishFieldMessages,
    showLoginModal,
    commentPost,
    detailPost,
    localCommentsByPostId,
    apiCommentsByPostId,
    setCommentsRetryTick,
    setCommentSendFailed,
    setCommentSendErrorMessage,
    setCommentFieldMessages,
    communityUser,
    feedApiRefetch,
    setLocalCommentsByPostId,
    setApiPosts,
    setLocalPosts,
  } = options;

  const { setTagFilter, applySearchAsTopicTag, clearFilters } = useCommunityFeedTopicDestinationUrl({
    searchParams,
    pathname,
    router,
    sortBy,
    setTagFilterState,
    setDestinationFilterFromUrl,
    searchQuery,
    setSearchQuery,
    clearFiltersFromHook,
    t,
    setToastHint,
    setToastBodyOverride,
    setToast,
    scheduleToastClear,
  });

  const { dismissPostDeepLinkIssue, retryPostDeepLinkFetch } = useCommunityFeedPostDeepLink({
    searchParams,
    allPosts,
    searchFilteredPosts,
    postDeepLinkLastId,
    t,
    setDetailPost,
    setPostDeepLinkBusy,
    setPostDeepLinkAlert,
    setPostDeepLinkLastId,
  });

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
    openCommentDrawer,
    openPostDetail,
  } = useCommunityFeedReportAndCommentDrawer({
    isLoggedIn,
    t,
    setShowLoginModal,
    setFocusReturn,
    setDetailPost,
    setDetailFocusComments: options.setDetailFocusComments,
    setCommentPost,
    setToastBodyOverride,
    setToastHint,
    setReportSuccessId,
    setToast,
    scheduleToastClear,
  });

  const postsToShow = useMemo(
    () => searchFilteredPosts.slice(0, feedPage * FEED_PAGE_SIZE),
    [searchFilteredPosts, feedPage],
  );
  const hasMoreFromApi = feedNextCursor != null;
  const hasMoreFromClient = feedPage * FEED_PAGE_SIZE < searchFilteredPosts.length;
  const hasMore = hasMoreFromApi || hasMoreFromClient;

  useEffect(() => {
    setFeedPage(1);
  }, [
    feedTagFromUrl,
    filterApi.destinationFilter,
    filterApi.feedTab,
    filterApi.regionFilter,
    filterApi.searchQuery,
    filterApi.sortBy,
    filterApi.tagFilter,
    filterApi.typeFilter,
    setFeedPage,
  ]);

  useCommunityFeedPublishQueryAndRegister({
    searchParams,
    authLoading,
    isLoggedIn,
    registerOpenPublish,
    setFocusReturn,
    setShowLoginModal,
    setPublishOpen,
    setPublishSendFailed,
    setPublishErrorMessage,
  });

  useCommunityFeedEscapeKeyHandlers({
    showLoginModal,
    setShowLoginModal,
  });

  const { retryCommentsLoad, commentsForPost, commentsForDetail } = useCommunityFeedCommentsDerived({
    commentPost,
    detailPost,
    localCommentsByPostId,
    apiCommentsByPostId,
    setCommentsRetryTick,
    setCommentSendFailed,
    setCommentSendErrorMessage,
    setCommentFieldMessages,
  });

  const {
    handleCommentSend,
    handlePublishSubmit,
    clearCommentSendError,
    clearPublishSendError,
  } = useCommunityFeedCommentAndPublish({
    t,
    dash,
    communityUser,
    feedApiRefetch,
    setLocalCommentsByPostId,
    setApiPosts,
    setLocalPosts,
    setDetailPost,
    setCommentPost,
    setCommentsRetryTick,
    setCommentSendFailed,
    setCommentSendErrorMessage,
    setCommentFieldMessages,
    setPublishSendFailed,
    setPublishErrorMessage,
    setPublishFieldMessages,
    setToast,
    setToastBodyOverride,
    setToastHint,
    scheduleToastClear,
  });

  return {
    setTagFilter,
    applySearchAsTopicTag,
    clearFilters,
    dismissPostDeepLinkIssue,
    retryPostDeepLinkFetch,
    reportContext,
    handleReport,
    handleReportComment,
    closeReportDrawer,
    handleReportSubmit,
    reportSendFailed,
    reportErrorMessage,
    reportFieldMessages,
    clearReportSendError,
    openCommentDrawer,
    openPostDetail,
    postsToShow,
    hasMore,
    retryCommentsLoad,
    commentsForPost,
    commentsForDetail,
    handleCommentSend,
    handlePublishSubmit,
    clearCommentSendError,
    clearPublishSendError,
  };
}
