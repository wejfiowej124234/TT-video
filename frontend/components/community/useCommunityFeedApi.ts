"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { getFeed } from "@/lib/apiClient/community";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { mapApiPostToCommunityPost, type ApiPostInput } from "./communityFeedMappers";

const FEED_API_PAGE_SIZE = 20;

/** 与 GET /api/v1/community/feed 的 `mode` 一致 */
export type CommunityFeedApiMode = "follow" | "hot" | "latest";

/** 52 §7.5 P2：Feed API 与列表状态拆出，减轻 useCommunityFeed 主 hook 体量 */
export function useCommunityFeedApi(mode: CommunityFeedApiMode, tag: string | null) {
  const { t } = useTranslation();
  const [apiPosts, setApiPosts] = useState<ReturnType<typeof mapApiPostToCommunityPost>[]>([]);
  const [feedNextCursor, setFeedNextCursor] = useState<string | null>(null);
  const [feedFromApi, setFeedFromApi] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFeedLoading(true);
    getFeed({ limit: FEED_API_PAGE_SIZE, mode, ...(tag ? { tag } : {}) })
      .then((data) => {
        if (cancelled) return;
        setFeedFromApi(true);
        if (data?.status === "ok" && Array.isArray(data.posts)) {
          setApiPosts((data.posts as ApiPostInput[]).map(mapApiPostToCommunityPost));
          setFeedError(null);
          setFeedNextCursor((data as { next_cursor?: string }).next_cursor ?? null);
        } else {
          if (typeof window !== "undefined" && data != null) {
            console.error("useCommunityFeedApi getFeed not ok:", data);
          }
          setApiPosts([]);
          setFeedNextCursor(null);
          setFeedError(t("community_error_feed"));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("useCommunityFeedApi getFeed:", err);
          }
          setFeedFromApi(true);
          setApiPosts([]);
          setFeedNextCursor(null);
          setFeedError(mapApiReadError(err, t, "community_error_feed"));
        }
      })
      .finally(() => {
        if (!cancelled) setFeedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, tag, t]);

  const refetchFeed = useCallback(() => {
    setFeedError(null);
    setFeedLoading(true);
    getFeed({ limit: FEED_API_PAGE_SIZE, mode, ...(tag ? { tag } : {}) })
      .then((data) => {
        if (data?.status === "ok" && Array.isArray(data.posts)) {
          setApiPosts((data.posts as ApiPostInput[]).map(mapApiPostToCommunityPost));
          setFeedFromApi(true);
          setFeedError(null);
          setFeedNextCursor((data as { next_cursor?: string }).next_cursor ?? null);
        } else {
          if (typeof window !== "undefined" && data != null) {
            console.error("useCommunityFeedApi refetchFeed not ok:", data);
          }
          setApiPosts([]);
          setFeedFromApi(true);
          setFeedNextCursor(null);
          setFeedError(t("community_error_feed"));
        }
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("useCommunityFeedApi refetchFeed getFeed:", err);
        }
        setFeedError(mapApiReadError(err, t, "community_error_feed"));
      })
      .finally(() => setFeedLoading(false));
  }, [mode, tag, t]);

  const loadMore = useCallback(
    (cursor: string | null) => {
      if (!cursor) return Promise.resolve();
      return getFeed({ cursor, limit: FEED_API_PAGE_SIZE, mode, ...(tag ? { tag } : {}) })
        .then((data) => {
          if (data?.status === "ok" && Array.isArray(data.posts)) {
            const chunk = (data.posts as ApiPostInput[]).map(mapApiPostToCommunityPost);
            setApiPosts((prev) => {
              const seen = new Set(prev.map((p) => p.id));
              const merged = [...prev];
              for (const p of chunk) {
                if (!seen.has(p.id)) {
                  seen.add(p.id);
                  merged.push(p);
                }
              }
              return merged;
            });
            setFeedNextCursor((data as { next_cursor?: string }).next_cursor ?? null);
            return;
          }
          if (typeof window !== "undefined") {
            console.error("useCommunityFeedApi loadMore not ok:", data);
          }
          throw new Error("feed_load_more_not_ok");
        })
        .catch((err) => {
          if (typeof window !== "undefined") {
            console.error("useCommunityFeedApi loadMore getFeed:", err);
          }
          throw err;
        });
    },
    [mode, tag]
  );

  return {
    apiPosts,
    setApiPosts,
    feedNextCursor,
    setFeedNextCursor,
    feedFromApi,
    setFeedFromApi,
    feedLoading,
    setFeedLoading,
    feedError,
    setFeedError,
    refetchFeed,
    loadMore,
  };
}
