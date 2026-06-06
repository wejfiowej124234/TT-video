import { getPostById } from "@/lib/apiClient/community";
import { mapApiPostToCommunityPost } from "@/components/community/useCommunityFeed";
import type { CommunityPost } from "@/lib/communityMockData";
import { allSettledInChunks, COMMUNITY_ME_POST_DETAIL_FETCH_CONCURRENCY } from "@/lib/allSettledInChunks";

export type CommunityMeCollectsHydrateBatchResult = {
  posts: CommunityPost[];
  failedOrMissing: number;
  firstReject: unknown;
};

/** 将一批 `post_id` hydrate 为 `CommunityPost[]`（顺序与 ids 一致，跳过缺失项） */
export async function hydrateCommunityMeCollectPostIds(
  ids: readonly string[],
): Promise<CommunityMeCollectsHydrateBatchResult> {
  if (ids.length === 0) {
    return { posts: [], failedOrMissing: 0, firstReject: null };
  }
  const results = await allSettledInChunks(ids, COMMUNITY_ME_POST_DETAIL_FETCH_CONCURRENCY, (postId) =>
    getPostById(postId),
  );
  const posts: CommunityPost[] = [];
  let failedOrMissing = 0;
  let firstReject: unknown = null;
  results.forEach((r) => {
    if (r.status === "rejected") {
      failedOrMissing += 1;
      if (firstReject == null) firstReject = r.reason;
      return;
    }
    const p = r.value.post;
    if (p) posts.push(mapApiPostToCommunityPost({ ...p, like_count: p.like_count }));
    else failedOrMissing += 1;
  });
  return { posts, failedOrMissing, firstReject };
}
