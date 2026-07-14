import type { CommunityPost } from "@/lib/communityMockData";

import { FEED_PAGE_SIZE } from "./communityFeedConstants";

/**
 * Public API batch fully in memory (no server cursor) → render all rows;
 * otherwise keep client paging for infinite scroll.
 */
export function resolveCommunityFeedPostsToShow(args: {
  searchFilteredPosts: CommunityPost[];
  feedPage: number;
  feedFromApi: boolean;
  feedNextCursor: string | null;
}): CommunityPost[] {
  const { searchFilteredPosts, feedPage, feedFromApi, feedNextCursor } = args;
  if (feedFromApi && feedNextCursor == null) {
    return searchFilteredPosts;
  }
  return searchFilteredPosts.slice(0, feedPage * FEED_PAGE_SIZE);
}

export function communityFeedHasMoreFromClientSlice(args: {
  searchFilteredPosts: CommunityPost[];
  feedPage: number;
  feedNextCursor: string | null;
}): boolean {
  const { searchFilteredPosts, feedPage, feedNextCursor } = args;
  if (feedNextCursor == null) return false;
  return feedPage * FEED_PAGE_SIZE < searchFilteredPosts.length;
}
