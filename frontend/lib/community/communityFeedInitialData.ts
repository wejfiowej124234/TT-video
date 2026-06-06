import type { CommunityPost } from "@/lib/communityMockData";
import type { CommunityFeedApiMode } from "@/components/community/useCommunityFeedApi";

/** `/community` 主 Feed 首屏 SSR 快照（默认 mode=latest · 无 tag/geo · ① 本地） */
export type CommunityFeedInitialSnapshot = {
  mode: CommunityFeedApiMode;
  tag: string | null;
  posts: CommunityPost[];
  nextCursor: string | null;
};
