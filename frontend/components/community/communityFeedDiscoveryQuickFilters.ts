import type { CommunityPostType } from "@/lib/communityMockData";
import type { CommunityFeedProximityFilter } from "./communityFeedProximity";
import type { FeedTab, SortBy } from "./communityFeedConstants";
import type { FeedStreamTab } from "./communityFeedStreamTab";

/** 「好玩」快捷 chip · 服务端话题 tag（与 Enter 搜索同源） */
export const COMMUNITY_DISCOVERY_FUN_TOPIC_TAG = "fun";

export function isCommunityDiscoveryFunTopicActive(tagFilter: string | null): boolean {
  return tagFilter?.trim().toLowerCase() === COMMUNITY_DISCOVERY_FUN_TOPIC_TAG;
}

export type CommunityFeedDiscoveryFilterReset = {
  setFeedTab: (v: FeedTab) => void;
  setSortBy: (v: SortBy) => void;
  setDestinationFilter: (v: string) => void;
  setTypeFilter: (v: CommunityPostType | "all") => void;
  setRegionFilter: (v: import("./communityFeedConstants").RegionKey) => void;
  setTagFilter: (v: string | null) => void;
  setProximityFilter: (v: CommunityFeedProximityFilter) => void;
  setSearchQuery?: (v: string) => void;
};

function clearDiscoverySearch(reset: CommunityFeedDiscoveryFilterReset): void {
  reset.setSearchQuery?.("");
}

/** 附近 / 1km chip · 统一重置并切推荐流 */
export function applyCommunityDiscoveryProximityFilter(
  reset: CommunityFeedDiscoveryFilterReset,
  proximity: Extract<CommunityFeedProximityFilter, "nearby" | "nearby_1km">,
): void {
  clearDiscoverySearch(reset);
  reset.setFeedTab("recommend");
  reset.setSortBy("latest");
  reset.setDestinationFilter("all");
  reset.setTypeFilter("all");
  reset.setRegionFilter("all");
  reset.setTagFilter(null);
  reset.setProximityFilter(proximity);
}

/** 「好吃」chip */
export function applyCommunityDiscoveryFoodFilter(reset: CommunityFeedDiscoveryFilterReset): void {
  clearDiscoverySearch(reset);
  reset.setFeedTab("recommend");
  reset.setSortBy("latest");
  reset.setDestinationFilter("all");
  reset.setTypeFilter("food");
  reset.setRegionFilter("all");
  reset.setTagFilter(null);
  reset.setProximityFilter("none");
}

/** 「好玩」chip · 话题 tag 而非 travel 类型 */
export function applyCommunityDiscoveryFunFilter(reset: CommunityFeedDiscoveryFilterReset): void {
  clearDiscoverySearch(reset);
  reset.setFeedTab("recommend");
  reset.setSortBy("latest");
  reset.setDestinationFilter("all");
  reset.setTypeFilter("all");
  reset.setRegionFilter("all");
  reset.setTagFilter(COMMUNITY_DISCOVERY_FUN_TOPIC_TAG);
  reset.setProximityFilter("none");
}

/** 顶部分类 Tab · 离开附近模式时清 proximity（OPT-F01） */
export function applyCommunityDiscoveryStreamTab(
  reset: CommunityFeedDiscoveryFilterReset,
  tab: FeedStreamTab,
): void {
  switch (tab) {
    case "following":
      reset.setFeedTab("following");
      reset.setProximityFilter("none");
      break;
    case "recommend":
      reset.setFeedTab("recommend");
      reset.setSortBy("latest");
      reset.setDestinationFilter("all");
      reset.setProximityFilter("none");
      break;
    case "hot":
      reset.setFeedTab("recommend");
      reset.setSortBy("hot");
      reset.setProximityFilter("none");
      break;
    case "destination":
      reset.setFeedTab("recommend");
      reset.setSortBy("latest");
      reset.setProximityFilter("none");
      break;
  }
}

/** 移动「更多」区是否应自动展开（不含主行四 chip：附近/1km/好吃/好玩） */
export function communityDiscoverySecondaryFiltersActive(input: {
  regionFilter: string;
  destinationFilter: string;
  typeFilter: CommunityPostType | "all";
  tagFilter: string | null;
  sortBy: SortBy;
}): boolean {
  if (input.regionFilter !== "all") return true;
  if (input.destinationFilter !== "all") return true;
  if (input.sortBy === "hot") return true;
  if (input.typeFilter !== "all" && input.typeFilter !== "food") return true;
  if (input.tagFilter != null && !isCommunityDiscoveryFunTopicActive(input.tagFilter)) return true;
  return false;
}
