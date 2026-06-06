import type { CommunityPostUserVisibility } from "@/lib/communityMockData";
import type { CommunityMePostsVisFilterKey } from "@/lib/communityMePostsVisFilters";

/** 可见性变更后，当前筛选是否应将该帖移出列表 */
export function shouldEvictPostFromVisFilter(
  visFilter: CommunityMePostsVisFilterKey,
  next: CommunityPostUserVisibility,
): boolean {
  return visFilter !== "all" && visFilter !== next;
}
