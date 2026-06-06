"use client";

import { useState, useCallback, useEffect, useMemo, type SetStateAction } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "@/components/LocaleProvider";
import { getFeed } from "@/lib/apiClient/community";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { mapApiPostToCommunityPost, type ApiPostInput } from "./communityFeedMappers";
import {
  resolveCommunityFeedAppendPosts,
  resolveCommunityFeedDisplayPosts,
  type CommunityFeedShowcaseMode,
} from "@/lib/communityFeedShowcaseMerge";
import { dedupeCommunityFeedPostsById } from "./mergeCommunityFeedLocalAndApiPosts";
import type { CommunityFeedGeoQuery } from "./communityFeedGeoQuery";
import type { CommunityFeedInitialSnapshot } from "@/lib/community/communityFeedInitialData";
import type { CommunityPost } from "@/lib/communityMockData";
import { scheduleCommunityIdleWork } from "@/lib/communityConversationsQuery";
import { communityFeedInfiniteQueryOptions } from "@/lib/communityFeedInfiniteQuery";
import { communityFeedGeoKey } from "@/lib/communityFeedQueryKeys";

/** 与 GET /api/v1/community/feed 的 `mode` 一致 */
export type CommunityFeedApiMode = "follow" | "hot" | "latest";

function flattenFeedPages(
  pages: Awaited<ReturnType<typeof getFeed>>[] | undefined,
  mode: CommunityFeedApiMode,
): CommunityPost[] {
  if (!pages?.length) return [];
  let acc: CommunityPost[] = [];
  for (let i = 0; i < pages.length; i++) {
    const data = pages[i];
    if (data?.status !== "ok" || !Array.isArray(data.posts)) continue;
    const mapped = (data.posts as ApiPostInput[]).map(mapApiPostToCommunityPost);
    if (i === 0) {
      acc = resolveCommunityFeedDisplayPosts(mapped, mode as CommunityFeedShowcaseMode);
    } else {
      acc = dedupeCommunityFeedPostsById([
        ...acc,
        ...resolveCommunityFeedAppendPosts(mapped),
      ]);
    }
  }
  return acc;
}

/** 52 §7.5 P2：Feed API 与列表状态拆出；① React Query infinite cache + 本地 patch 保持 setApiPosts 行为 */
export function useCommunityFeedApi(
  mode: CommunityFeedApiMode,
  tag: string | null,
  geo?: CommunityFeedGeoQuery,
  geoRevision = 0,
  options?: {
    initialSnapshot?: CommunityFeedInitialSnapshot | null;
    /** 服务端 Feed `q`（ILIKE）；有值时勿再客户端全文滤已加载帖 */
    textQ?: string | null;
  },
) {
  const textQ = options?.textQ?.trim().slice(0, 64) || null;
  const effectiveTextQ = textQ && textQ.length > 0 ? textQ : null;
  const initialSnapshot = options?.initialSnapshot ?? null;
  const { t } = useTranslation();
  const snapshotMatches =
    initialSnapshot &&
    initialSnapshot.mode === mode &&
    initialSnapshot.tag === (tag ?? null) &&
    !effectiveTextQ &&
    !geo?.anchor_poi_id &&
    geo?.max_distance_m == null;

  const geoKey = communityFeedGeoKey(geo);
  const [feedQueryEnabled, setFeedQueryEnabled] = useState(() => !snapshotMatches);

  useEffect(() => {
    if (snapshotMatches) {
      setFeedQueryEnabled(false);
      return scheduleCommunityIdleWork(() => setFeedQueryEnabled(true), 800);
    }
    setFeedQueryEnabled(true);
  }, [snapshotMatches, mode, tag, geoKey, geoRevision]);
  const feedInfinite = useInfiniteQuery({
    ...communityFeedInfiniteQueryOptions({ mode, tag, geo, geoRevision, textQ: effectiveTextQ }),
    enabled: feedQueryEnabled,
  });

  const [snapshotPosts, setSnapshotPosts] = useState<CommunityPost[] | null>(() =>
    snapshotMatches ? initialSnapshot.posts : null,
  );
  const [snapshotCursor, setSnapshotCursor] = useState<string | null>(() =>
    snapshotMatches ? initialSnapshot.nextCursor : null,
  );
  const [postsOverride, setPostsOverride] = useState<CommunityPost[] | null>(null);
  const [feedLoadingOverride, setFeedLoadingOverride] = useState<boolean | null>(null);
  const [feedErrorOverride, setFeedErrorOverride] = useState<string | null>(null);
  const [cursorOverride, setCursorOverride] = useState<string | null>(null);

  const queryKey = communityFeedInfiniteQueryOptions({
    mode,
    tag,
    geo,
    geoRevision,
    textQ: effectiveTextQ,
  }).queryKey;

  useEffect(() => {
    setPostsOverride(null);
    setCursorOverride(null);
    setFeedErrorOverride(null);
    setFeedLoadingOverride(null);
    if (snapshotMatches) {
      setSnapshotPosts(initialSnapshot!.posts);
      setSnapshotCursor(initialSnapshot!.nextCursor);
    } else {
      setSnapshotPosts(null);
      setSnapshotCursor(null);
    }
  }, [queryKey.join("|"), snapshotMatches, initialSnapshot]);

  useEffect(() => {
    if (!feedInfinite.isSuccess || !feedInfinite.data?.pages?.[0]) return;
    const first = feedInfinite.data.pages[0];
    if (first?.status === "ok" && Array.isArray(first.posts)) {
      setFeedErrorOverride(null);
      return;
    }
    if (first != null) setFeedErrorOverride(t("community_error_feed"));
  }, [feedInfinite.data?.pages, feedInfinite.isSuccess, t]);

  useEffect(() => {
    if (feedInfinite.isSuccess) {
      setSnapshotPosts(null);
      setSnapshotCursor(null);
    }
  }, [feedInfinite.isSuccess, queryKey.join("|")]);

  const basePosts = useMemo(
    () => flattenFeedPages(feedInfinite.data?.pages, mode),
    [feedInfinite.data?.pages, mode],
  );

  const apiPosts = postsOverride ?? (basePosts.length > 0 ? basePosts : snapshotPosts ?? []);

  const lastPage = feedInfinite.data?.pages?.[feedInfinite.data.pages.length - 1];
  const parsedLast =
    lastPage != null && feedInfinite.isSuccess
      ? (lastPage as { next_cursor?: string }).next_cursor ?? null
      : null;
  const feedNextCursor =
    cursorOverride ?? parsedLast ?? snapshotCursor;

  const feedFromApi =
    feedInfinite.isFetched || Boolean(snapshotMatches && (snapshotPosts?.length ?? 0) > 0);

  const feedLoading =
    feedLoadingOverride ??
    (Boolean(snapshotPosts) && !feedInfinite.isFetching
      ? false
      : feedInfinite.isPending && apiPosts.length === 0);

  const feedError = useMemo(() => {
    if (feedErrorOverride != null) return feedErrorOverride;
    if (feedInfinite.isError && feedInfinite.error != null) {
      return mapApiReadError(feedInfinite.error, t, "community_error_feed");
    }
    const pages = feedInfinite.data?.pages;
    if (!pages?.length) return null;
    const first = pages[0];
    if (first != null && first.status !== "ok") return t("community_error_feed");
    return null;
  }, [feedErrorOverride, feedInfinite.data?.pages, feedInfinite.error, feedInfinite.isError, t]);

  const setApiPosts = useCallback(
    (action: SetStateAction<CommunityPost[]>) => {
      setPostsOverride((prev) => {
        const current = prev ?? (basePosts.length > 0 ? basePosts : snapshotPosts ?? []);
        return typeof action === "function" ? action(current) : action;
      });
    },
    [basePosts, snapshotPosts],
  );

  const setFeedNextCursor = useCallback((action: SetStateAction<string | null>) => {
    setCursorOverride((prev) => {
      const current =
        prev ??
        (feedInfinite.data?.pages?.length
          ? ((feedInfinite.data.pages[feedInfinite.data.pages.length - 1] as { next_cursor?: string })
              .next_cursor ?? null)
          : snapshotCursor);
      return typeof action === "function" ? action(current) : action;
    });
  }, [feedInfinite.data?.pages, snapshotCursor]);

  const setFeedLoading = useCallback((value: SetStateAction<boolean>) => {
    setFeedLoadingOverride(typeof value === "function" ? value(false) : value);
  }, []);

  const setFeedError = useCallback((action: SetStateAction<string | null>) => {
    setFeedErrorOverride((prev) =>
      typeof action === "function" ? action(prev) : action,
    );
  }, []);

  const refetchFeed = useCallback(
    (opts?: { background?: boolean }) => {
      setFeedErrorOverride(null);
      if (!opts?.background) setFeedLoadingOverride(true);
      return feedInfinite
        .refetch()
        .catch((err) => {
          if (typeof window !== "undefined") {
            console.error("useCommunityFeedApi refetchFeed:", err);
          }
          setFeedErrorOverride(mapApiReadError(err, t, "community_error_feed"));
        })
        .finally(() => {
          if (!opts?.background) setFeedLoadingOverride(null);
        });
    },
    [feedInfinite, t],
  );

  const loadMore = useCallback(
    (cursor: string | null) => {
      if (!cursor) return Promise.resolve();
      return feedInfinite.fetchNextPage().catch((err) => {
        if (typeof window !== "undefined") {
          console.error("useCommunityFeedApi loadMore:", err);
        }
      });
    },
    [feedInfinite],
  );

  return {
    apiPosts,
    setApiPosts,
    feedNextCursor,
    setFeedNextCursor,
    feedFromApi,
    feedLoading,
    setFeedLoading,
    feedError,
    setFeedError,
    refetchFeed,
    loadMore,
  };
}
