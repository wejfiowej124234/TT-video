import type { QueryClient } from "@tanstack/react-query";
import { getFeed } from "@/lib/apiClient/community";
import type { CommunityFeedApiMode } from "@/components/community/useCommunityFeedApi";
import type { CommunityFeedGeoQuery } from "@/components/community/communityFeedGeoQuery";
import { parseCommunityFeedPageEnvelope } from "@/lib/communityFeedPageEnvelope";
import {
  buildCommunityFeedParams,
  COMMUNITY_FEED_STALE_MS,
  communityFeedGeoKey,
  communityFeedQueryKey,
} from "@/lib/communityFeedQueryKeys";

/** 与 `useCommunityFeedApi` / Tab hover 预取共用的 infinite query 配置 */
export function communityFeedInfiniteQueryOptions(args: {
  mode: CommunityFeedApiMode;
  tag: string | null;
  geo?: CommunityFeedGeoQuery;
  geoRevision?: number;
  textQ?: string | null;
}) {
  const { mode, tag, geo, geoRevision = 0, textQ = null } = args;
  const geoKey = communityFeedGeoKey(geo);
  return {
    queryKey: communityFeedQueryKey(mode, tag, geoKey, geoRevision, textQ),
    staleTime: COMMUNITY_FEED_STALE_MS,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) =>
      getFeed(buildCommunityFeedParams(mode, tag, geo, pageParam, textQ)),
    getNextPageParam: (last: Awaited<ReturnType<typeof getFeed>>) => {
      const parsed = parseCommunityFeedPageEnvelope(last);
      if (parsed.kind !== "ok") return undefined;
      const c = parsed.nextCursor;
      return c != null && c.length > 0 ? c : undefined;
    },
  } as const;
}

export function warmCommunityMainFeed(
  queryClient: QueryClient,
  args?: { mode?: CommunityFeedApiMode; tag?: string | null; geo?: CommunityFeedGeoQuery },
): void {
  if (typeof window === "undefined") return;
  void queryClient.prefetchInfiniteQuery(
    communityFeedInfiniteQueryOptions({
      mode: args?.mode ?? "latest",
      tag: args?.tag ?? null,
      geo: args?.geo,
    }),
  );
}

/** ① · Feed 排序/关注 Tab hover：与当前 `useCommunityFeedApi` query key 同源 */
export function warmCommunityFeedMode(
  queryClient: QueryClient,
  mode: CommunityFeedApiMode,
  tag?: string | null,
): void {
  warmCommunityMainFeed(queryClient, { mode, tag: tag ?? null });
}

const warmedTopicFeedKeys = new Set<string>();

/** ① · `/community/topic/[tag]` 或帖子 # 标签 hover：按 tag + mode 预热 Feed infinite cache */
export function warmCommunityTopicTagFeed(
  queryClient: QueryClient,
  tag: string,
  mode: CommunityFeedApiMode = "latest",
): void {
  if (typeof window === "undefined") return;
  const trimmed = tag.trim();
  if (!trimmed) return;
  const dedupeKey = `${mode}:${trimmed}`;
  if (warmedTopicFeedKeys.has(dedupeKey)) return;
  warmedTopicFeedKeys.add(dedupeKey);
  warmCommunityMainFeed(queryClient, { mode, tag: trimmed });
}

export function parseCommunityTopicTagFromHref(href: string): string | null {
  const prefix = "/community/topic/";
  if (!href.startsWith(prefix)) return null;
  const raw = href.slice(prefix.length).split("?")[0]?.split("#")[0] ?? "";
  if (!raw) return null;
  try {
    return decodeURIComponent(raw).trim() || null;
  } catch {
    return raw.trim() || null;
  }
}
