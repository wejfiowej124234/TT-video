import type { FeedTab, SortBy } from "@/components/community/communityFeedConstants";

/** Feed 顶部分类 Tab（参照本地生活发现页 · 映射 feedTab/sortBy/destination；附近=proximity chip） */
export type FeedStreamTab = "following" | "recommend" | "destination" | "hot";

export const FEED_STREAM_TABS: readonly FeedStreamTab[] = [
  "following",
  "recommend",
  "destination",
  "hot",
] as const;

export function feedStreamTabFromState(
  feedTab: FeedTab,
  sortBy: SortBy,
  destinationFilter: string,
): FeedStreamTab {
  if (feedTab === "following") return "following";
  if (sortBy === "hot") return "hot";
  if (destinationFilter !== "all") return "destination";
  return "recommend";
}

export function isMasonryFeedStream(
  feedTab: FeedTab,
  _sortBy: SortBy,
  _destinationFilter: string,
): boolean {
  return feedTab === "recommend" || feedTab === "following";
}
