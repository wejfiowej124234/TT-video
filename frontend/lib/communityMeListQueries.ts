import { getMeCollects, getMeLikes, getMyPosts } from "@/lib/apiClient/community";
import { mapApiPostToCommunityPost, type ApiPostInput } from "@/components/community/communityFeedMappers";
import { COMMUNITY_ME_DRAWER_LIST_ID_CAP } from "@/lib/communityMeDrawerListCaps";
import { parseMyPostsPageEnvelope, parseMeCollectsListEnvelope, parseMeLikesListEnvelope } from "@/lib/communityMeDrawerListContracts";
import { COMMUNITY_ME_POSTS_LIST_PAGE_SIZE } from "@/lib/communityMeListPageSize";
import type { CommunityMePostsVisFilterKey } from "@/lib/communityMePostsVisFilters";
import type { CommunityPost } from "@/lib/communityMockData";

/** 赞过 / 收藏 ID 列表（抽屉与独立页共用，避免重复 GET） */
export const COMMUNITY_ME_LIKES_IDS_QUERY_KEY = ["community", "me", "likes", "ids"] as const;
export const COMMUNITY_ME_COLLECTS_IDS_QUERY_KEY = ["community", "me", "collects", "ids"] as const;

/** 与 Explore / 好友 / 资料条共用的 following 列表 */
export const COMMUNITY_ME_FOLLOWING_QUERY_KEY = ["community", "meFollowing"] as const;

export const COMMUNITY_ME_POSTS_QUERY_KEY_PREFIX = ["community", "me", "posts"] as const;

export const COMMUNITY_ME_LIST_STALE_MS = 60_000;

export function communityMePostsQueryKey(visibility: CommunityMePostsVisFilterKey) {
  return [...COMMUNITY_ME_POSTS_QUERY_KEY_PREFIX, visibility] as const;
}

export type CommunityMePostsPageData = {
  posts: CommunityPost[];
  next_cursor: string;
};

export async function fetchCommunityMePostsPage(
  visibility: CommunityMePostsVisFilterKey,
  cursor?: string,
): Promise<CommunityMePostsPageData> {
  const data = await getMyPosts({
    limit: COMMUNITY_ME_POSTS_LIST_PAGE_SIZE,
    visibility,
    ...(cursor ? { cursor } : {}),
  });
  const parsed = parseMyPostsPageEnvelope(data);
  if (parsed.kind === "invalid") {
    throw new Error("community_me_posts_list_contract_invalid");
  }
  return {
    posts: parsed.value.posts.map((p) => mapApiPostToCommunityPost(p as ApiPostInput)),
    next_cursor: parsed.value.next_cursor,
  };
}

export type CommunityMeLikesIdsQueryData =
  | { kind: "ok"; ids: string[]; truncated: boolean }
  | { kind: "invalid" };

export type CommunityMeCollectsIdsQueryData =
  | { kind: "ok"; ids: string[]; truncated: boolean }
  | { kind: "invalid" };

export async function fetchCommunityMeLikesIds(): Promise<CommunityMeLikesIdsQueryData> {
  const data = await getMeLikes({ limit: COMMUNITY_ME_DRAWER_LIST_ID_CAP });
  const parsed = parseMeLikesListEnvelope(data);
  if (parsed.kind === "invalid") return { kind: "invalid" };
  const ids = parsed.value;
  return { kind: "ok", ids, truncated: ids.length >= COMMUNITY_ME_DRAWER_LIST_ID_CAP };
}

export async function fetchCommunityMeCollectsIds(): Promise<CommunityMeCollectsIdsQueryData> {
  const data = await getMeCollects({ limit: COMMUNITY_ME_DRAWER_LIST_ID_CAP });
  const parsed = parseMeCollectsListEnvelope(data);
  if (parsed.kind === "invalid") return { kind: "invalid" };
  const ids = parsed.value;
  return { kind: "ok", ids, truncated: ids.length >= COMMUNITY_ME_DRAWER_LIST_ID_CAP };
}
