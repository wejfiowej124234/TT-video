"use client";

import { useMemo, useState } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { FeedTab } from "@/components/community/communityFeedConstants";
import { useCommunityFeedSortAndUrlTag } from "@/components/community/useCommunityFeedSortAndUrlTag";
import { useCommunityFeedApi } from "@/components/community/useCommunityFeedApi";
import { useCommunityFeedAnchorPoi } from "@/components/community/useCommunityFeedAnchorPoi";
import {
  communityFeedGeoQueryFromDiscovery,
  type CommunityFeedProximityFilter,
} from "@/components/community/communityFeedProximity";

type FeedRouter = { replace: (href: string, navOptions?: { scroll?: boolean }) => void };

/** Feed Tab 本地态、`sort=`/话题 URL 派生、`useCommunityFeedApi` 游标列表（从 `useCommunityFeed` 拆出，行为同源）。 */
export function useCommunityFeedTabSortAndFeedApi(options: {
  searchParams: ReadonlyURLSearchParams;
  pathname: string | null;
  router: FeedRouter;
}) {
  const { searchParams, pathname, router } = options;
  const [feedTab, setFeedTab] = useState<FeedTab>("recommend");
  const { sortBy, setSortBy, hrefTopicPathForTag, feedApiMode, feedTagFromUrl } = useCommunityFeedSortAndUrlTag({
    feedTab,
    searchParams,
    pathname,
    router,
  });

  const { anchorPoiId, setAnchorPoiId, gpsCoords, anchorRevision } = useCommunityFeedAnchorPoi();
  const [proximityFilter, setProximityFilter] = useState<CommunityFeedProximityFilter>("none");

  const feedGeoQuery = useMemo(
    () => communityFeedGeoQueryFromDiscovery(anchorPoiId, proximityFilter, gpsCoords),
    [anchorPoiId, proximityFilter, gpsCoords],
  );

  const feedApi = useCommunityFeedApi(feedApiMode, feedTagFromUrl, feedGeoQuery, anchorRevision);
  const {
    apiPosts,
    setApiPosts,
    feedNextCursor,
    setFeedNextCursor,
    feedLoading,
    setFeedLoading,
    feedError,
    setFeedError,
    feedFromApi,
    refetchFeed: feedApiRefetch,
    loadMore: feedApiLoadMore,
  } = feedApi;

  const serverProximityFilterApplied =
    feedFromApi && proximityFilter !== "none" && feedGeoQuery.max_distance_m != null;

  return {
    feedTab,
    setFeedTab,
    sortBy,
    setSortBy,
    hrefTopicPathForTag,
    feedTagFromUrl,
    anchorPoiId,
    setAnchorPoiId,
    gpsCoords,
    anchorRevision,
    proximityFilter,
    setProximityFilter,
    feedGeoQuery,
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
  };
}
