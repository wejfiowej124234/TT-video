"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import { useInfiniteQuery, useQueries } from "@tanstack/react-query";
import { useTranslation } from "@/components/LocaleProvider";
import {
  DESTINATION_BY_REGION,
  REGION_KEYS,
  type RegionKey,
} from "@/components/community/communityFeedConstants";
import { mapApiPostToCommunityPost, type ApiPostInput } from "@/components/community/communityFeedMappers";
import { suggestedAuthorsFromPosts } from "@/components/community/communitySuggestedAuthors";
import { COMMUNITY_EXPLORE_MASONRY_DEFAULT_MAX } from "@/components/community/CommunityExplorePhotoMasonry";
import { communityFeedDegradedMessage } from "@/lib/communityFeedDegradedMessage";
import { parseCommunityFeedPageEnvelope } from "@/lib/communityFeedPageEnvelope";
import { getExploreDestinations, getFeed, getMeFollowing } from "@/lib/apiClient/community";
import { COMMUNITY_ME_FOLLOWING_QUERY_KEY } from "@/lib/communityMeListQueries";
import { getMeFull } from "@/lib/apiClient";
import { countCommunityMeSocialList } from "@/lib/communityMeSocialListsContract";
import { userFromGetMePayload } from "@/lib/meTrust";
import type { CommunityPost, CommunityPostAuthor } from "@/lib/communityMockData";
import {
  COMMUNITY_EXPLORE_FEED_QUERY_KEY,
  EXPLORE_FEED_STALE_MS,
  EXPLORE_FEED_PAGE_SIZE,
  EXPLORE_MASONRY_CAP_MAX,
  EXPLORE_MASONRY_MORE_PER_PAGE,
} from "./communityExplorePageConstants";
import { resolveCommunityFeedDisplayPosts } from "@/lib/communityFeedShowcaseMerge";
import { exploreRegionBlocksFromApiAggregate } from "@/lib/communityExploreDestinationsFromApi";
import { isCommunityContentProductionProfile } from "@/lib/communityContentProfile";

export type CommunityExploreRegionBlock = {
  regionKey: Exclude<RegionKey, "all">;
  destinations: readonly string[];
};

export type CommunityExploreDestCatalog = "static-v1" | "api-aggregate-v1";

export type CommunityExplorePageViewModel = {
  t: ReturnType<typeof useTranslation>["t"];
  exploreTopicsHeadingId: string;
  exploreMasonryHeadingId: string;
  exploreAuthorsHeadingId: string;
  exploreDestHeadingId: string;
  exploreLoadSentinelRef: RefObject<HTMLDivElement | null>;
  exploreFeedDegradedBanner: string | null;
  exploreFeedContractInvalid: boolean;
  showScanEntryHint: boolean;
  feedIsError: boolean;
  feedIsPending: boolean;
  feedRefetch: () => void;
  feedHasNextPage: boolean;
  feedIsFetchingNextPage: boolean;
  feedFetchNextPage: () => void;
  feedError: unknown;
  posts: CommunityPost[];
  masonryMaxThumbs: number;
  followingEnvelopeInvalid: boolean;
  followingRefetch: () => void;
  authorsLoading: boolean;
  exploreFeedError: boolean;
  suggestedAuthors: CommunityPostAuthor[];
  regionBlocks: CommunityExploreRegionBlock[];
  exploreDestCatalog: CommunityExploreDestCatalog;
};

export function useCommunityExplorePage(): CommunityExplorePageViewModel {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const showScanEntryHint = searchParams.get("scan") === "1";
  const exploreTopicsHeadingId = useId();
  const exploreMasonryHeadingId = useId();
  const exploreAuthorsHeadingId = useId();
  const exploreDestHeadingId = useId();
  const exploreLoadSentinelRef = useRef<HTMLDivElement>(null);
  const [deferSocialQueries, setDeferSocialQueries] = useState(false);

  useEffect(() => {
    const run = () => setDeferSocialQueries(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = globalThis.setTimeout(run, 80);
    return () => globalThis.clearTimeout(timer);
  }, []);

  const feedInfinite = useInfiniteQuery({
    queryKey: COMMUNITY_EXPLORE_FEED_QUERY_KEY,
    staleTime: EXPLORE_FEED_STALE_MS,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      getFeed({
        limit: EXPLORE_FEED_PAGE_SIZE,
        /** 与 **`GET …/feed`** 默认 **`recommend`**（04 / `posts.rs`）显式对齐，避免依赖隐式默认 */
        mode: "recommend",
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (last) => {
      const parsed = parseCommunityFeedPageEnvelope(last);
      if (parsed.kind !== "ok") return undefined;
      const c = parsed.nextCursor;
      return c != null && c.length > 0 ? c : undefined;
    },
  });

  const [meQ, followingQ] = useQueries({
    queries: [
      {
        queryKey: ["community", "exploreMe", "meFull"],
        queryFn: () => getMeFull(),
        staleTime: EXPLORE_FEED_STALE_MS,
        enabled: deferSocialQueries,
      },
      {
        queryKey: COMMUNITY_ME_FOLLOWING_QUERY_KEY,
        queryFn: getMeFollowing,
        staleTime: EXPLORE_FEED_STALE_MS,
        enabled: deferSocialQueries,
      },
    ],
  });

  const exploreDestQ = useQueries({
    queries: [
      {
        queryKey: ["community", "exploreDestinations"],
        queryFn: getExploreDestinations,
        staleTime: EXPLORE_FEED_STALE_MS,
        enabled: deferSocialQueries,
      },
    ],
  })[0];

  const staticRegionBlocks = useMemo((): CommunityExploreRegionBlock[] => {
    return (REGION_KEYS.filter((k) => k !== "all") as Exclude<RegionKey, "all">[]).map((regionKey) => ({
      regionKey,
      destinations: DESTINATION_BY_REGION[regionKey] ?? [],
    }));
  }, []);

  const { regionBlocks, exploreDestCatalog } = useMemo((): {
    regionBlocks: CommunityExploreRegionBlock[];
    exploreDestCatalog: CommunityExploreDestCatalog;
  } => {
    const apiRows = exploreDestQ.data?.destinations;
    if (isCommunityContentProductionProfile()) {
      if (!apiRows?.length) {
        return { regionBlocks: [], exploreDestCatalog: "api-aggregate-v1" };
      }
      const blocks = exploreRegionBlocksFromApiAggregate(apiRows);
      return { regionBlocks: blocks, exploreDestCatalog: "api-aggregate-v1" };
    }
    if (!apiRows?.length || exploreDestQ.data?.catalog === "static-fallback-v1") {
      return { regionBlocks: staticRegionBlocks, exploreDestCatalog: "static-v1" };
    }
    const blocks = exploreRegionBlocksFromApiAggregate(apiRows);
    return {
      regionBlocks: blocks.length > 0 ? blocks : staticRegionBlocks,
      exploreDestCatalog: "api-aggregate-v1",
    };
  }, [staticRegionBlocks, exploreDestQ.data?.destinations, exploreDestQ.data?.catalog]);

  const posts = useMemo(() => {
    const pages = feedInfinite.data?.pages ?? [];
    const seen = new Set<string>();
    const raw: ApiPostInput[] = [];
    for (const page of pages) {
      const parsed = parseCommunityFeedPageEnvelope(page);
      if (parsed.kind === "invalid") continue;
      for (const row of parsed.posts as ApiPostInput[]) {
        const id = row?.id;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        raw.push(row);
      }
    }
    const mapped = raw.map(mapApiPostToCommunityPost);
    return resolveCommunityFeedDisplayPosts(mapped, "latest");
  }, [feedInfinite.data]);

  const feedPageCount = feedInfinite.data?.pages.length ?? 0;
  const masonryMaxThumbs = Math.min(
    COMMUNITY_EXPLORE_MASONRY_DEFAULT_MAX + Math.max(0, feedPageCount - 1) * EXPLORE_MASONRY_MORE_PER_PAGE,
    EXPLORE_MASONRY_CAP_MAX
  );

  const meId = userFromGetMePayload(meQ.data)?.id ?? null;

  const followingEnvelopeInvalid = useMemo(() => {
    if (!followingQ.isSuccess || followingQ.data == null) return false;
    return countCommunityMeSocialList(followingQ.data, "following").kind === "invalid";
  }, [followingQ.isSuccess, followingQ.data]);

  const followingIds = useMemo(() => {
    const d = followingQ.data;
    if (d == null) return new Set<string>();
    const p = countCommunityMeSocialList(d, "following");
    if (p.kind !== "ok") return new Set<string>();
    const raw = (d as { following: { id?: string }[] }).following;
    return new Set(raw.map((x) => x.id).filter((id): id is string => typeof id === "string" && id.length > 0));
  }, [followingQ.data]);

  const suggestedAuthors = useMemo(
    () => suggestedAuthorsFromPosts(posts, { meUserId: meId, followingAuthorIds: followingIds, max: 9 }),
    [posts, meId, followingIds]
  );

  const authorsLoading =
    feedInfinite.isPending || (deferSocialQueries && (meQ.isLoading || followingQ.isLoading));

  const {
    isError: exploreFeedError,
    hasNextPage: exploreHasNext,
    isFetchingNextPage: exploreFetchingNext,
    isPending: explorePending,
    data: exploreData,
    fetchNextPage: exploreFetchNext,
  } = feedInfinite;

  const exploreFeedDegradedBanner = useMemo(() => {
    const pages = exploreData?.pages ?? [];
    for (const page of pages) {
      const parsed = parseCommunityFeedPageEnvelope(page);
      if (parsed.kind === "degraded") {
        return communityFeedDegradedMessage(parsed.envelope, t);
      }
    }
    return null;
  }, [exploreData?.pages, t]);

  const exploreFeedContractInvalid = useMemo(() => {
    const pages = exploreData?.pages ?? [];
    return pages.some((page) => parseCommunityFeedPageEnvelope(page).kind === "invalid");
  }, [exploreData?.pages]);

  /** 31 §3.2：瀑布流区块近底自动拉取下一页（与手动「加载更多」并存） */
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    if (exploreFeedError || !exploreHasNext || exploreFetchingNext) return;
    if (explorePending && !exploreData) return;
    const node = exploreLoadSentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit) return;
        if (typeof navigator !== "undefined" && !navigator.onLine) return;
        void exploreFetchNext();
      },
      { root: null, rootMargin: "240px 0px 0px 0px", threshold: 0 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [exploreFeedError, exploreHasNext, exploreFetchingNext, explorePending, exploreData, exploreFetchNext]);

  return {
    t,
    exploreTopicsHeadingId,
    exploreMasonryHeadingId,
    exploreAuthorsHeadingId,
    exploreDestHeadingId,
    exploreLoadSentinelRef,
    exploreFeedDegradedBanner,
    exploreFeedContractInvalid,
    showScanEntryHint,
    feedIsError: feedInfinite.isError,
    feedIsPending: feedInfinite.isPending,
    feedRefetch: () => {
      void feedInfinite.refetch();
    },
    feedHasNextPage: feedInfinite.hasNextPage,
    feedIsFetchingNextPage: feedInfinite.isFetchingNextPage,
    feedFetchNextPage: () => {
      void feedInfinite.fetchNextPage();
    },
    feedError: feedInfinite.error,
    posts,
    masonryMaxThumbs,
    followingEnvelopeInvalid,
    followingRefetch: () => {
      void followingQ.refetch();
    },
    authorsLoading,
    exploreFeedError,
    suggestedAuthors,
    regionBlocks,
    exploreDestCatalog,
  };
}
