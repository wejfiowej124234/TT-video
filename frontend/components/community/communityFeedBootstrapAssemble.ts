import type {
  UseCommunityFeedTailInteractionsOptions,
  UseCommunityFeedTopicReportCommentChainOptions,
} from "@/components/community/communityFeedTopicAndTailHookModel";

export type CommunityFeedTopicChainArgsBundle = Omit<
  UseCommunityFeedTopicReportCommentChainOptions,
  "registerOpenPublish"
>;

export type CommunityFeedTailStaticBundle = Omit<UseCommunityFeedTailInteractionsOptions, "hasMore">;

/** 纯装配：`useCommunityFeed` 再注入 `registerOpenPublish`。 */
export function assembleCommunityFeedTopicChainArgs(parts: {
  i18n: Pick<CommunityFeedTopicChainArgsBundle, "t" | "dash">;
  nav: Pick<CommunityFeedTopicChainArgsBundle, "searchParams" | "pathname" | "router" | "sortBy">;
  searchAndFilters: Pick<
    CommunityFeedTopicChainArgsBundle,
    | "setTagFilterState"
    | "setDestinationFilterFromUrl"
    | "searchQuery"
    | "setSearchQuery"
    | "clearFiltersFromHook"
  >;
  toast: Pick<
    CommunityFeedTopicChainArgsBundle,
    "setToastHint" | "setToastBodyOverride" | "setToast" | "scheduleToastClear"
  >;
  lists: Pick<CommunityFeedTopicChainArgsBundle, "allPosts" | "searchFilteredPosts">;
  deepLink: Pick<
    CommunityFeedTopicChainArgsBundle,
    | "postDeepLinkLastId"
    | "setDetailPost"
    | "setDetailFocusComments"
    | "setPostDeepLinkBusy"
    | "setPostDeepLinkAlert"
    | "setPostDeepLinkLastId"
  >;
  gate: Pick<CommunityFeedTopicChainArgsBundle, "isLoggedIn" | "setShowLoginModal" | "setFocusReturn">;
  report: Pick<CommunityFeedTopicChainArgsBundle, "setCommentPost" | "setReportSuccessId">;
  feedPaging: Pick<
    CommunityFeedTopicChainArgsBundle,
    "feedPage" | "setFeedPage" | "filterApi" | "feedTagFromUrl" | "feedNextCursor" | "authLoading"
  >;
  publishForm: Pick<
    CommunityFeedTopicChainArgsBundle,
    "setPublishOpen" | "setPublishSendFailed" | "setPublishErrorMessage" | "setPublishFieldMessages"
  >;
  loginModal: Pick<CommunityFeedTopicChainArgsBundle, "showLoginModal">;
  commentPosts: Pick<
    CommunityFeedTopicChainArgsBundle,
    | "commentPost"
    | "detailPost"
    | "localCommentsByPostId"
    | "apiCommentsByPostId"
    | "setCommentsRetryTick"
    | "setCommentSendFailed"
    | "setCommentSendErrorMessage"
    | "setCommentFieldMessages"
  >;
  meAndFeed: Pick<
    CommunityFeedTopicChainArgsBundle,
    "communityUser" | "feedApiRefetch" | "setLocalCommentsByPostId" | "setApiPosts" | "setLocalPosts"
  >;
}): CommunityFeedTopicChainArgsBundle {
  return {
    ...parts.i18n,
    ...parts.nav,
    ...parts.searchAndFilters,
    ...parts.toast,
    ...parts.lists,
    ...parts.deepLink,
    ...parts.gate,
    ...parts.report,
    ...parts.feedPaging,
    ...parts.publishForm,
    ...parts.loginModal,
    ...parts.commentPosts,
    ...parts.meAndFeed,
  };
}

/** `hasMore` 由 `useCommunityFeedTopicReportCommentChain` 产出后在 `useCommunityFeed` 层合并。 */
export function assembleCommunityFeedTailStatic(parts: {
  post: Pick<CommunityFeedTailStaticBundle, "detailPost">;
  user: Pick<CommunityFeedTailStaticBundle, "communityUserId">;
  follow: Pick<
    CommunityFeedTailStaticBundle,
    "followingAuthorIdSet" | "followBusyAuthorId" | "handleAuthorFollowToggle"
  >;
  feed: Pick<
    CommunityFeedTailStaticBundle,
    | "feedNextCursor"
    | "feedApiRefetch"
    | "feedApiLoadMore"
    | "setFeedError"
    | "setFeedPage"
    | "setFeedLoadingMore"
  >;
  toast: Pick<
    CommunityFeedTailStaticBundle,
    "setToastHint" | "setToastBodyOverride" | "setToast" | "scheduleToastClear"
  >;
  shell: Pick<
    CommunityFeedTailStaticBundle,
    | "t"
    | "pullY"
    | "setPullY"
    | "feedLoading"
    | "authLoading"
    | "isLoggedIn"
    | "focusReturnTargetRef"
    | "setFocusReturn"
    | "setShowLoginModal"
  >;
  publish: Pick<
    CommunityFeedTailStaticBundle,
    "setPublishOpen" | "setPublishSendFailed" | "setPublishErrorMessage"
  >;
  drawers: Pick<CommunityFeedTailStaticBundle, "setCommentPost" | "setDetailPost">;
}): CommunityFeedTailStaticBundle {
  return {
    ...parts.post,
    ...parts.user,
    ...parts.follow,
    ...parts.feed,
    ...parts.toast,
    ...parts.shell,
    ...parts.publish,
    ...parts.drawers,
  };
}
