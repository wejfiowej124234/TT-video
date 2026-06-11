"use client";

import { useMemo, useState, useCallback } from "react";
import type { CommunityPostType, CommunityPost } from "@/lib/communityMockData";
import {
  DESTINATION_BY_REGION,
  FEED_PAGE_SIZE,
  type FeedTab,
  type SortBy,
  type RegionKey,
} from "./communityFeedConstants";
import type { CommunityFeedAnchorPoiId } from "./communityFeedAnchorPoi";
import {
  communityFeedEnrichPostsForAnchor,
  communityFeedFilterByProximity,
  type CommunityFeedGeoCoords,
  type CommunityFeedProximityFilter,
} from "./communityFeedProximity";

export type { FeedTab, SortBy, RegionKey, CommunityFeedProximityFilter };

export interface UseCommunityFeedFiltersProps {
  allPosts: CommunityPost[];
  followingIds?: string[];
  feedTab?: FeedTab;
  setFeedTab?: (tab: FeedTab) => void;
  preserveApiFeedOrder?: boolean;
  sortBy?: SortBy;
  setSortBy?: (s: SortBy) => void;
  anchorPoiId?: CommunityFeedAnchorPoiId;
  gpsCoords?: CommunityFeedGeoCoords;
  proximityFilter?: CommunityFeedProximityFilter;
  setProximityFilter?: (v: CommunityFeedProximityFilter) => void;
  /** ① API 已带 `max_distance_m` 筛选时 · 跳过客户端二次过滤 */
  serverProximityFilterApplied?: boolean;
  /** `mode=follow` API 已筛作者时 · 勿再用空 `followingIds` 客户端滤空 */
  skipFollowingAuthorFilter?: boolean;
  /** `GET …/feed?q=` 已筛正文时 · 跳过客户端 searchQuery 二次过滤 */
  skipClientTextSearch?: boolean;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

/** 社区 Feed 筛选态与列表派生：Tab/类型/地区/目的地/标签/排序/搜索/附近 */
export function useCommunityFeedFilters({
  allPosts,
  followingIds = [],
  feedTab: controlledFeedTab,
  setFeedTab: controlledSetFeedTab,
  preserveApiFeedOrder = false,
  sortBy: controlledSortBy,
  setSortBy: controlledSetSortBy,
  anchorPoiId = "hotel_lavande",
  gpsCoords = null,
  proximityFilter: controlledProximity,
  setProximityFilter: controlledSetProximity,
  serverProximityFilterApplied = false,
  skipFollowingAuthorFilter = false,
  skipClientTextSearch = false,
  searchQuery: controlledSearchQuery,
  setSearchQuery: controlledSetSearchQuery,
}: UseCommunityFeedFiltersProps) {
  const followingIdSet = useMemo(() => new Set(followingIds), [followingIds]);
  const [internalFeedTab, setInternalFeedTab] = useState<FeedTab>("recommend");
  const feedTab = controlledFeedTab ?? internalFeedTab;
  const setFeedTab = controlledSetFeedTab ?? setInternalFeedTab;
  const [internalSortBy, setInternalSortBy] = useState<SortBy>("latest");
  const sortBy = controlledSortBy ?? internalSortBy;
  const setSortBy = controlledSetSortBy ?? setInternalSortBy;
  const [typeFilter, setTypeFilter] = useState<CommunityPostType | "all">("all");
  const [destinationFilter, setDestinationFilter] = useState<string | "all">("all");
  const [regionFilter, setRegionFilter] = useState<RegionKey>("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const searchQuery = controlledSearchQuery ?? internalSearchQuery;
  const setSearchQuery = controlledSetSearchQuery ?? setInternalSearchQuery;
  const [internalProximity, setInternalProximity] = useState<CommunityFeedProximityFilter>("none");
  const proximityFilter = controlledProximity ?? internalProximity;
  const setProximityFilter = controlledSetProximity ?? setInternalProximity;

  const enrichedPosts = useMemo(
    () => communityFeedEnrichPostsForAnchor(allPosts, anchorPoiId, gpsCoords, proximityFilter),
    [allPosts, anchorPoiId, gpsCoords, proximityFilter],
  );

  const hotDestinations = useMemo(() => {
    const count: Record<string, number> = {};
    enrichedPosts.forEach((p) => {
      if (!p.destination) return;
      if (regionFilter !== "all") {
        const list = DESTINATION_BY_REGION[regionFilter];
        if (!list?.includes(p.destination)) return;
      }
      count[p.destination] = (count[p.destination] ?? 0) + 1;
    });
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([d]) => d);
  }, [enrichedPosts, regionFilter]);

  const filteredPosts = useMemo(() => {
    let list = [...enrichedPosts];
    if (feedTab === "following" && !skipFollowingAuthorFilter) {
      list = list.filter((p) => followingIdSet.has(p.author.id));
    }
    if (typeFilter !== "all") {
      list =
        typeFilter === "video"
          ? list.filter((p) => p.is_video === true || p.type === "video")
          : list.filter((p) => p.type === typeFilter);
    }
    if (regionFilter !== "all") {
      const allowed = new Set(DESTINATION_BY_REGION[regionFilter] ?? []);
      list = list.filter((p) => p.destination && allowed.has(p.destination));
    }
    if (destinationFilter !== "all") list = list.filter((p) => p.destination === destinationFilter);
    if (tagFilter) list = list.filter((p) => (p.tags ?? []).some((tag) => tag === tagFilter));
    if (proximityFilter !== "none" && !serverProximityFilterApplied) {
      list = communityFeedFilterByProximity(list, proximityFilter, anchorPoiId, gpsCoords);
    }
    const skipSort =
      (preserveApiFeedOrder && feedTab === "recommend" && proximityFilter === "none") ||
      (preserveApiFeedOrder && serverProximityFilterApplied && proximityFilter !== "none");
    if (!skipSort && proximityFilter === "none") {
      if (sortBy === "hot") list.sort((a, b) => b.likes + b.comments - (a.likes + a.comments));
      else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [
    enrichedPosts,
    feedTab,
    typeFilter,
    sortBy,
    destinationFilter,
    regionFilter,
    tagFilter,
    proximityFilter,
    anchorPoiId,
    gpsCoords,
    followingIdSet,
    preserveApiFeedOrder,
    serverProximityFilterApplied,
    skipFollowingAuthorFilter,
  ]);

  const searchFilteredPosts = useMemo(() => {
    if (skipClientTextSearch) return filteredPosts;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredPosts;
    return filteredPosts.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        (p.title ?? "").toLowerCase().includes(q) ||
        p.author.nickname.toLowerCase().includes(q) ||
        (p.destination ?? "").toLowerCase().includes(q) ||
        (p.venueName ?? "").toLowerCase().includes(q) ||
        (p.tags ?? []).some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [filteredPosts, searchQuery, skipClientTextSearch]);

  const clearFilters = useCallback(() => {
    setDestinationFilter("all");
    setTypeFilter("all");
    setRegionFilter("all");
    setTagFilter(null);
    setSearchQuery("");
    setProximityFilter("none");
  }, []);

  return {
    feedTab,
    setFeedTab,
    sortBy,
    setSortBy,
    typeFilter,
    setTypeFilter,
    regionFilter,
    setRegionFilter,
    destinationFilter,
    setDestinationFilter,
    tagFilter,
    setTagFilter,
    searchQuery,
    setSearchQuery,
    proximityFilter,
    setProximityFilter,
    anchorPoiId,
    hotDestinations,
    filteredPosts,
    searchFilteredPosts,
    clearFilters,
  };
}

export type UseCommunityFeedFiltersReturn = ReturnType<typeof useCommunityFeedFilters>;
