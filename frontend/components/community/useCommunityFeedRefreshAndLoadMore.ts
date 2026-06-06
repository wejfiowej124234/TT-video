"use client";

import { useRef, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { LocaleInterpolationVars } from "@/lib/i18n";

type CommunityFeedTFunc = (key: string, vars?: LocaleInterpolationVars) => string;

/** 下拉/按钮刷新 Feed 与触底加载更多（游标 API 或客户端翻页；从 `useCommunityFeed` 拆出，行为同源）。 */
export function useCommunityFeedRefreshAndLoadMore(options: {
  hasMore: boolean;
  feedNextCursor: string | null;
  feedApiRefetch: () => void;
  feedApiLoadMore: (cursor: string) => Promise<unknown>;
  setFeedError: Dispatch<SetStateAction<string | null>>;
  setFeedPage: Dispatch<SetStateAction<number>>;
  setFeedLoadingMore: Dispatch<SetStateAction<boolean>>;
  setToastHint: Dispatch<SetStateAction<string | null>>;
  setToastBodyOverride: Dispatch<SetStateAction<string | null>>;
  setToast: Dispatch<SetStateAction<string | null>>;
  scheduleToastClear: (ms: number) => void;
  t: CommunityFeedTFunc;
}) {
  const {
    hasMore,
    feedNextCursor,
    feedApiRefetch,
    feedApiLoadMore,
    setFeedError,
    setFeedPage,
    setFeedLoadingMore,
    setToastHint,
    setToastBodyOverride,
    setToast,
    scheduleToastClear,
    t,
  } = options;

  /** §3.2：触底与按钮共用 loadMore，防止游标请求重叠 */
  const loadMoreInFlightRef = useRef(false);

  const refreshFeed = useCallback(() => {
    setFeedError(null);
    setFeedPage(1);
    feedApiRefetch();
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [feedApiRefetch, setFeedError, setFeedPage]);

  /** 51-31-10：加载更多——API 游标分页或客户端分页；51-31-B2 带 mode 保持当前 tab */
  const handleLoadMore = useCallback(() => {
    if (loadMoreInFlightRef.current) return;
    if (!hasMore) return;
    if (feedNextCursor && typeof navigator !== "undefined" && !navigator.onLine) {
      setToastHint(null);
      setToastBodyOverride(null);
      setToast("community_interaction_offline");
      scheduleToastClear(2600);
      return;
    }
    loadMoreInFlightRef.current = true;
    if (feedNextCursor) {
      setFeedLoadingMore(true);
      feedApiLoadMore(feedNextCursor)
        .catch((err) => {
          setToastHint(null);
          setToastBodyOverride(mapApiReadError(err, t, "community_feed_load_more_failed"));
          setToast("community_feed_load_more_failed");
          scheduleToastClear(2200);
        })
        .finally(() => {
          setFeedLoadingMore(false);
          loadMoreInFlightRef.current = false;
        });
    } else {
      setFeedLoadingMore(true);
      setFeedPage((p) => p + 1);
      window.setTimeout(() => {
        setFeedLoadingMore(false);
        loadMoreInFlightRef.current = false;
      }, 350);
    }
  }, [
    feedApiLoadMore,
    feedNextCursor,
    hasMore,
    scheduleToastClear,
    setFeedLoadingMore,
    setFeedPage,
    setToast,
    setToastBodyOverride,
    setToastHint,
    t,
  ]);

  return { refreshFeed, handleLoadMore };
}
