import { mapApiPostToCommunityPost, type ApiPostInput } from "@/components/community/communityFeedMappers";
import { resolveCommunityFeedDisplayPosts } from "@/lib/communityFeedShowcaseMerge";
import { apiUrl, routes } from "@/lib/api";
import type { CommunityFeedInitialSnapshot } from "@/lib/community/communityFeedInitialData";

const FEED_API_PAGE_SIZE = 20;
const FETCH_TIMEOUT_MS = 2500;

async function fetchFeedJson(): Promise<{
  status?: string;
  posts?: ApiPostInput[];
  next_cursor?: string | null;
} | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const url = `${apiUrl(routes.community.feed)}?limit=${FEED_API_PAGE_SIZE}&mode=latest`;
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { "x-request-id": `community-feed-ssr-${Date.now()}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      status?: string;
      posts?: ApiPostInput[];
      next_cursor?: string | null;
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 主 Feed 默认 latest；失败时返回 null（客户端照常 fetch） */
export async function fetchCommunityFeedInitialSnapshot(): Promise<CommunityFeedInitialSnapshot | null> {
  const data = await fetchFeedJson();
  if (!data || data.status !== "ok" || !Array.isArray(data.posts)) return null;
  const mapped = data.posts.map(mapApiPostToCommunityPost);
  return {
    mode: "latest",
    tag: null,
    posts: resolveCommunityFeedDisplayPosts(mapped, "latest"),
    nextCursor: data.next_cursor ?? null,
  };
}
