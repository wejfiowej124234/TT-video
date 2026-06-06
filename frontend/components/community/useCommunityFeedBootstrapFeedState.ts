"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";
import { useCommunityFeedFilters } from "@/components/community/useCommunityFeedFilters";
import { useCommunityFeedLikeCollectFollow } from "@/components/community/useCommunityFeedLikeCollectFollow";
import { useCommunityFeedApiDerivedSync } from "@/components/community/useCommunityFeedApiDerivedSync";
import { useCommunityFeedTabSortAndFeedApi } from "@/components/community/useCommunityFeedTabSortAndFeedApi";
import { useCommunityDrawerCommentsQuery } from "@/components/community/useCommunityDrawerCommentsQuery";
import { useCommunityFeedModals } from "@/components/community/useCommunityFeedModals";
import { useCommunityFeedMeFollowingCollects } from "@/components/community/useCommunityFeedMeFollowingCollects";
import { mergeCommunityFeedLocalAndApiPosts } from "@/components/community/mergeCommunityFeedLocalAndApiPosts";

type CommunityFeedModals = ReturnType<typeof useCommunityFeedModals>;
type CommunityFeedMeFollowingCollects = ReturnType<typeof useCommunityFeedMeFollowingCollects>;

type FeedRouter = { replace: (href: string, navOptions?: { scroll?: boolean }) => void };

export function useCommunityFeedBootstrapFeedState(
  modals: CommunityFeedModals,
  meFollowing: CommunityFeedMeFollowingCollects,
  opts: {
    isLoggedIn: boolean;
    communityUser: { id: string } | null | undefined;
    searchParams: ReadonlyURLSearchParams;
    pathname: string | null;
    router: FeedRouter;
    t: (key: string) => string;
  }
) {
  const { isLoggedIn, communityUser, searchParams, pathname, router, t } = opts;
  const { followingIds, setFollowingIds, collectedPostIds, setCollectedPostIds } = meFollowing;
  const { setDetailPost } = modals;

  const [localPosts, setLocalPosts] = useState<CommunityPost[]>([]);

  const postIdOpen = modals.commentPost?.id ?? modals.detailPost?.id;

  const {
    apiCommentsByPostId,
    setApiCommentsByPostId,
    commentsLoadError,
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
  } = useCommunityDrawerCommentsQuery({
    postIdOpen,
    commentSort: modals.commentSort,
    commentsRetryTick: modals.commentsRetryTick,
    t,
    logContext: "useCommunityFeed",
  });

  const {
    feedTab,
    setFeedTab,
    sortBy,
    setSortBy,
    hrefTopicPathForTag,
    feedTagFromUrl,
    anchorPoiId,
    setAnchorPoiId,
    gpsCoords,
    proximityFilter,
    setProximityFilter,
    serverProximityFilterApplied,
    apiPosts,
    setApiPosts,
    feedNextCursor,
    setFeedNextCursor,
    feedLoading,
    setFeedLoading,
    feedError,
    setFeedError,
    feedFromApi,
    feedApiRefetch,
    feedApiLoadMore,
  } = useCommunityFeedTabSortAndFeedApi({ searchParams, pathname, router });

  const onPostLikeResolved = useCallback(
    (postId: string, meta: { nowLiked: boolean; likesDelta: number }) => {
      setDetailPost((d) => {
        if (d?.id !== postId) return d;
        return {
          ...d,
          likedByMe: meta.nowLiked,
          likes: Math.max(0, d.likes + meta.likesDelta),
        };
      });
      setApiPosts((rows) =>
        rows.map((p) =>
          p.id === postId
            ? { ...p, likedByMe: meta.nowLiked, likes: Math.max(0, p.likes + meta.likesDelta) }
            : p,
        ),
      );
    },
    [setDetailPost, setApiPosts],
  );

  const onPostCollectResolved = useCallback(
    (postId: string, meta: { nowCollected: boolean; collectsDelta: number }) => {
      setDetailPost((d) => {
        if (d?.id !== postId) return d;
        return {
          ...d,
          collectedByMe: meta.nowCollected,
          collects: Math.max(0, d.collects + meta.collectsDelta),
        };
      });
      setApiPosts((rows) =>
        rows.map((p) =>
          p.id === postId
            ? {
                ...p,
                collectedByMe: meta.nowCollected,
                collects: Math.max(0, p.collects + meta.collectsDelta),
              }
            : p,
        ),
      );
    },
    [setDetailPost, setApiPosts],
  );

  const [localCommentsByPostId, setLocalCommentsByPostId] = useState<Record<string, CommunityComment[]>>({});
  const [feedPage, setFeedPage] = useState(1);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [pullY, setPullY] = useState(0);
  const followingAuthorIdSet = useMemo(() => new Set(followingIds), [followingIds]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  const { handleLike, handleCollect, handleAuthorFollowToggle, followBusyAuthorId } =
    useCommunityFeedLikeCollectFollow({
      isLoggedIn,
      communityUserId: communityUser?.id,
      followingAuthorIdSet,
      setFollowingIds,
      setShowLoginModal: modals.setShowLoginModal,
      setToast: modals.setToast,
      setToastBodyOverride: modals.setToastBodyOverride,
      setToastHint: modals.setToastHint,
      scheduleToastClear: modals.scheduleToastClear,
      likedPostIds,
      setLikedPostIds,
      collectedPostIds,
      setCollectedPostIds,
      t,
      onPostLikeResolved,
      onPostCollectResolved,
    });

  useCommunityFeedApiDerivedSync({
    isLoggedIn,
    feedFromApi,
    apiPosts,
    detailPost: modals.detailPost,
    communityUserId: communityUser?.id,
    setLikedPostIds,
    setCollectedPostIds,
    setFollowingIds,
  });

  const allPosts = useMemo(
    () => mergeCommunityFeedLocalAndApiPosts(localPosts, apiPosts),
    [localPosts, apiPosts],
  );
  const filterApi = useCommunityFeedFilters({
    allPosts,
    followingIds,
    feedTab,
    setFeedTab,
    sortBy,
    setSortBy,
    preserveApiFeedOrder: feedFromApi,
    skipFollowingAuthorFilter: feedFromApi && feedTab === "following",
    anchorPoiId,
    gpsCoords,
    proximityFilter,
    setProximityFilter,
    serverProximityFilterApplied,
  });
  const {
    searchFilteredPosts,
    clearFilters: clearFiltersFromHook,
    setTagFilter: setTagFilterState,
    setDestinationFilter: setDestinationFilterFromUrl,
    searchQuery,
    setSearchQuery,
  } = filterApi;

  return {
    localPosts,
    setLocalPosts,
    localCommentsByPostId,
    setLocalCommentsByPostId,
    feedPage,
    setFeedPage,
    feedLoadingMore,
    setFeedLoadingMore,
    pullY,
    setPullY,
    likedPostIds,
    followingAuthorIdSet,
    handleLike,
    handleCollect,
    handleAuthorFollowToggle,
    followBusyAuthorId,
    apiCommentsByPostId,
    setApiCommentsByPostId,
    commentsLoadError,
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
    feedTab,
    setFeedTab,
    sortBy,
    setSortBy,
    hrefTopicPathForTag,
    feedTagFromUrl,
    apiPosts,
    setApiPosts,
    feedNextCursor,
    setFeedNextCursor,
    feedLoading,
    setFeedLoading,
    feedError,
    setFeedError,
    feedFromApi,
    feedApiRefetch,
    feedApiLoadMore,
    anchorPoiId,
    setAnchorPoiId,
    proximityFilter,
    setProximityFilter,
    serverProximityFilterApplied,
    allPosts,
    filterApi,
    searchFilteredPosts,
    clearFiltersFromHook,
    setTagFilterState,
    setDestinationFilterFromUrl,
    searchQuery,
    setSearchQuery,
  };
}
