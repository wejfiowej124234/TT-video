import type { QueryClient } from "@tanstack/react-query";
import {
  getConversations,
  getConversationMessages,
  getFeed,
  getFriendsList,
  getMeFollowers,
  getMeFollowing,
} from "@/lib/apiClient/community";
import {
  parseCommunityTopicTagFromHref,
  warmCommunityMainFeed,
  warmCommunityTopicTagFeed,
} from "@/lib/communityFeedInfiniteQuery";
import {
  COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
  COMMUNITY_CONVERSATIONS_STALE_MS,
} from "@/lib/communityConversationsQuery";
import {
  COMMUNITY_EXPLORE_FEED_QUERY_KEY,
  EXPLORE_FEED_PAGE_SIZE,
  EXPLORE_FEED_STALE_MS,
} from "@/app/community/explore/communityExplorePageConstants";
import { parseCommunityFeedPageEnvelope } from "@/lib/communityFeedPageEnvelope";
import {
  COMMUNITY_FRIENDS_LIST_QUERY_KEY,
  COMMUNITY_FRIENDS_STALE_MS,
  COMMUNITY_ME_FOLLOWERS_QUERY_KEY,
} from "@/lib/communityFriendsQueryKeys";
import {
  COMMUNITY_ME_COLLECTS_IDS_QUERY_KEY,
  COMMUNITY_ME_FOLLOWING_QUERY_KEY,
  COMMUNITY_ME_LIKES_IDS_QUERY_KEY,
  COMMUNITY_ME_LIST_STALE_MS,
  communityMePostsQueryKey,
  fetchCommunityMeCollectsIds,
  fetchCommunityMeLikesIds,
  fetchCommunityMePostsPage,
} from "@/lib/communityMeListQueries";
import type { CommunityMePostsVisFilterKey } from "@/lib/communityMePostsVisFilters";

let postDetailWarmed = false;
let publishDrawerWarmed = false;
let reportDrawerWarmed = false;

/** ① · L1 Tab hover 预取子路由 JS（配合 Link prefetch）；可选预热 React Query cache */
export function warmCommunityTabRoute(
  router: { prefetch: (href: string) => void },
  href: string,
  queryClient?: QueryClient,
): void {
  try {
    router.prefetch(href);
  } catch {
    /* noop */
  }
  if (!queryClient) return;
  if (href === "/community" || href === "/community/feed") {
    warmCommunityMainFeed(queryClient, { mode: "latest" });
  }
  if (href.startsWith("/community/topic/")) {
    const tag = parseCommunityTopicTagFromHref(href);
    if (tag) warmCommunityTopicTagFeed(queryClient, tag);
  }
  if (href === "/community/explore") warmCommunityExploreFeed(queryClient);
  if (href === "/community/friends") warmCommunityFriendsSocial(queryClient);
  if (href === "/community/messages" || href.startsWith("/community/messages")) {
    void queryClient.prefetchQuery({
      queryKey: COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
      queryFn: getConversations,
      staleTime: COMMUNITY_CONVERSATIONS_STALE_MS,
    });
  }
}

/** ① · 发现页 Feed 首屏 hover 预载（与 `useCommunityExplorePage` 同 key） */
export function warmCommunityExploreFeed(queryClient: QueryClient): void {
  if (typeof window === "undefined") return;
  void queryClient.prefetchInfiniteQuery({
    queryKey: COMMUNITY_EXPLORE_FEED_QUERY_KEY,
    staleTime: EXPLORE_FEED_STALE_MS,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      getFeed({
        limit: EXPLORE_FEED_PAGE_SIZE,
        mode: "recommend",
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (last: Awaited<ReturnType<typeof getFeed>>) => {
      const parsed = parseCommunityFeedPageEnvelope(last);
      if (parsed.kind !== "ok") return undefined;
      const c = parsed.nextCursor;
      return c != null && c.length > 0 ? c : undefined;
    },
  });
}

/** ① · 好友页 hover 预载社交列表（与好友页 React Query cache 同源） */
export function warmCommunityFriendsSocial(queryClient: QueryClient): void {
  if (typeof window === "undefined") return;
  const stale = COMMUNITY_FRIENDS_STALE_MS;
  void queryClient.prefetchQuery({
    queryKey: COMMUNITY_ME_FOLLOWING_QUERY_KEY,
    queryFn: getMeFollowing,
    staleTime: stale,
  });
  void queryClient.prefetchQuery({
    queryKey: COMMUNITY_ME_FOLLOWERS_QUERY_KEY,
    queryFn: getMeFollowers,
    staleTime: stale,
  });
  void queryClient.prefetchQuery({
    queryKey: COMMUNITY_FRIENDS_LIST_QUERY_KEY,
    queryFn: getFriendsList,
    staleTime: stale,
  });
}

/** ① · 我的帖子 hover 预载首屏（抽屉与独立页共用 cache） */
export function warmCommunityMePosts(
  queryClient: QueryClient,
  visibility: CommunityMePostsVisFilterKey = "all",
): void {
  if (typeof window === "undefined") return;
  void queryClient.prefetchInfiniteQuery({
    queryKey: communityMePostsQueryKey(visibility),
    staleTime: COMMUNITY_ME_LIST_STALE_MS,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => fetchCommunityMePostsPage(visibility, pageParam),
    getNextPageParam: (last: Awaited<ReturnType<typeof fetchCommunityMePostsPage>>) => {
      const c = last.next_cursor?.trim();
      return c && c.length > 0 ? c : undefined;
    },
  });
}

/** ① · 首屏外 chunk：Feed 卡片 hover 或打开详情前预载 PostDetailDrawer */
export function warmCommunityPostDetailDrawer(): void {
  if (postDetailWarmed || typeof window === "undefined") return;
  postDetailWarmed = true;
  void import("@/components/community/PostDetailDrawerPortal");
}

/** ① · 发布 FAB hover 预载 PublishDrawer */
export function warmCommunityPublishDrawer(): void {
  if (publishDrawerWarmed || typeof window === "undefined") return;
  publishDrawerWarmed = true;
  void import("@/components/community/PublishDrawer");
}

/** ① · 举报入口 hover 预载 ReportDrawer（按需） */
export function warmCommunityReportDrawer(): void {
  if (reportDrawerWarmed || typeof window === "undefined") return;
  reportDrawerWarmed = true;
  void import("@/components/community/CommunityReportDrawerPortal");
}

const warmedConversationThreads = new Set<string>();

/** ① · 个人中心赞过/收藏列表 hover 预载 ID 列表（抽屉与独立页共用 React Query cache） */
export function warmCommunityMeLikesIds(queryClient: QueryClient): void {
  if (typeof window === "undefined") return;
  void queryClient.prefetchQuery({
    queryKey: COMMUNITY_ME_LIKES_IDS_QUERY_KEY,
    queryFn: fetchCommunityMeLikesIds,
    staleTime: COMMUNITY_ME_LIST_STALE_MS,
  });
}

export function warmCommunityMeCollectsIds(queryClient: QueryClient): void {
  if (typeof window === "undefined") return;
  void queryClient.prefetchQuery({
    queryKey: COMMUNITY_ME_COLLECTS_IDS_QUERY_KEY,
    queryFn: fetchCommunityMeCollectsIds,
    staleTime: COMMUNITY_ME_LIST_STALE_MS,
  });
}

/** ① · 会话列表行 hover 预载 thread API（进入详情前） */
export function warmCommunityConversationThread(conversationId: string): void {
  if (!conversationId || warmedConversationThreads.has(conversationId) || typeof window === "undefined") {
    return;
  }
  warmedConversationThreads.add(conversationId);
  void getConversationMessages(conversationId);
}
