import type { CommunityFeedMasonryLocationViewModel } from "@/components/community/communityFeedMasonryCardViewModel";

/** 瀑布定位 pill · 距离展示（OPT-F03 · 占位加 ~） */
export function communityFeedMasonryDistanceDisplay(
  location: Pick<CommunityFeedMasonryLocationViewModel, "distanceLabel" | "distanceIsPlaceholder">,
): string {
  return location.distanceIsPlaceholder ? `~${location.distanceLabel}` : location.distanceLabel;
}
