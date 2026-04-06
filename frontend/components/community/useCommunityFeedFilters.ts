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

export type { FeedTab, SortBy, RegionKey };

export interface UseCommunityFeedFiltersProps {
  allPosts: CommunityPost[];
  /** 51-F1：真实 API getMeFollowing 返回的 id 列表 */
  followingIds?: string[];
  /** 可选：由父组件控制的 feedTab，用于打破与 useCommunityFeedApi 的循环依赖 */
  feedTab?: FeedTab;
  setFeedTab?: (tab: FeedTab) => void;
  /** 推荐流且主列表来自 Feed API 时已按 mode 排序，避免客户端再按 hot/latest 重排 */
  preserveApiFeedOrder?: boolean;
  sortBy?: SortBy;
  setSortBy?: (s: SortBy) => void;
}

/** 社区 Feed 筛选态与列表派生：Tab/类型/地区/目的地/标签/排序/搜索（从 useCommunityFeed 拆出） */
export function useCommunityFeedFilters({
  allPosts,
  followingIds = [],
  feedTab: controlledFeedTab,
  setFeedTab: controlledSetFeedTab,
  preserveApiFeedOrder = false,
  sortBy: controlledSortBy,
  setSortBy: controlledSetSortBy,
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
  const [searchQuery, setSearchQuery] = useState("");

  const hotDestinations = useMemo(() => {
    const count: Record<string, number> = {};
    allPosts.forEach((p) => {
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
  }, [allPosts, regionFilter]);

  const filteredPosts = useMemo(() => {
    let list = [...allPosts];
    if (feedTab === "following") list = list.filter((p) => followingIdSet.has(p.author.id));
    if (typeFilter !== "all") list = list.filter((p) => p.type === typeFilter);
    if (regionFilter !== "all") {
      const allowed = new Set(DESTINATION_BY_REGION[regionFilter] ?? []);
      list = list.filter((p) => p.destination && allowed.has(p.destination));
    }
    if (destinationFilter !== "all") list = list.filter((p) => p.destination === destinationFilter);
    if (tagFilter) list = list.filter((p) => (p.tags ?? []).some((tag) => tag === tagFilter));
    const skipSort = preserveApiFeedOrder && feedTab === "recommend";
    if (!skipSort) {
      if (sortBy === "hot") list.sort((a, b) => b.likes + b.comments - (a.likes + a.comments));
      else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [
    allPosts,
    feedTab,
    typeFilter,
    sortBy,
    destinationFilter,
    regionFilter,
    tagFilter,
    followingIdSet,
    preserveApiFeedOrder,
  ]);

  const searchFilteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredPosts;
    return filteredPosts.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        (p.title ?? "").toLowerCase().includes(q) ||
        p.author.nickname.toLowerCase().includes(q) ||
        (p.destination ?? "").toLowerCase().includes(q) ||
        (p.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
    );
  }, [filteredPosts, searchQuery]);

  const clearFilters = useCallback(() => {
    setDestinationFilter("all");
    setTypeFilter("all");
    setRegionFilter("all");
    setTagFilter(null);
    setSearchQuery("");
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
    hotDestinations,
    filteredPosts,
    searchFilteredPosts,
    clearFilters,
  };
}
