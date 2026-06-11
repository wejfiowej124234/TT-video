"use client";

import { useEffect, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  COMMUNITY_FEED_TAG_QUERY_MAX_LEN,
  communityPostTagExceedsServerUtf8Limit,
} from "@/lib/apiClient/community";
import {
  communityTopicPathForTag as communityTopicPathForTagFromSort,
  feedSortQuerySuffix,
  normalizeCommunityTopicTagFromSearchInput,
} from "@/lib/communityFeedSortUrl";
import type { SortBy } from "@/components/community/communityFeedConstants";
import type { LocaleInterpolationVars } from "@/lib/i18n";

type CommunityFeedTFunc = (key: string, vars?: LocaleInterpolationVars) => string;

type SearchParamsRead = { get: (name: string) => string | null };

/** `/community/topic/*`、`?tag=`、`?destination=` 与筛选状态同步；`setTagFilter` / 搜索转话题 / `clearFilters` URL 侧（从 `useCommunityFeed` 拆出，行为同源）。 */
export function useCommunityFeedTopicDestinationUrl(options: {
  searchParams: SearchParamsRead;
  pathname: string | null;
  router: { replace: (href: string, navOptions?: { scroll?: boolean }) => void };
  sortBy: SortBy;
  setTagFilterState: Dispatch<SetStateAction<string | null>>;
  setDestinationFilterFromUrl: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  clearFiltersFromHook: () => void;
  t: CommunityFeedTFunc;
  setToastHint: Dispatch<SetStateAction<string | null>>;
  setToastBodyOverride: Dispatch<SetStateAction<string | null>>;
  setToast: Dispatch<SetStateAction<string | null>>;
  scheduleToastClear: (ms: number) => void;
}) {
  const {
    searchParams,
    pathname,
    router,
    sortBy,
    setTagFilterState,
    setDestinationFilterFromUrl,
    searchQuery,
    setSearchQuery,
    clearFiltersFromHook,
    t,
    setToastHint,
    setToastBodyOverride,
    setToast,
    scheduleToastClear,
  } = options;

  /** 31 §2.1：`/community/topic/[tag]` 与 `?tag=` 与话题筛选同步（仅以 URL 为准） */
  useEffect(() => {
    let fromPath: string | null = null;
    const p = pathname ?? "";
    const m = p.match(/^\/community\/topic\/(.+)$/);
    if (m?.[1]) {
      try {
        fromPath = decodeURIComponent(m[1]);
      } catch {
        fromPath = m[1];
      }
    }
    const raw = fromPath ?? searchParams.get("tag");
    const next = raw?.trim() || null;
    setTagFilterState((prev) => (prev === next ? prev : next));
  }, [searchParams, pathname, setTagFilterState]);

  /** 31 §2.1 Explore：`/community?destination=` 与目的地筛选同步 */
  useEffect(() => {
    const raw = searchParams.get("destination")?.trim();
    if (!raw) return;
    let dec = raw;
    try {
      dec = decodeURIComponent(raw);
    } catch {
      /* keep raw */
    }
    setDestinationFilterFromUrl(dec);
  }, [searchParams, setDestinationFilterFromUrl]);

  /** 只改 URL；主 Feed 下话题走 `/community/topic/…` 便于分享；`?tag=` 仍兼容；**保留 `sort=`**（B-077） */
  const setTagFilter = useCallback(
    (v: string | null) => {
      const trimmed = v?.trim() || null;
      if (typeof window === "undefined") return;
      const path = pathname ?? "";
      const sortQs = feedSortQuerySuffix(sortBy);
      if (trimmed) {
        const topicPath = communityTopicPathForTagFromSort(trimmed, sortBy);
        if (path.startsWith("/community/topic/")) {
          router.replace(topicPath, { scroll: false });
          return;
        }
        if (path === "/community" || path === "/community/feed") {
          router.replace(topicPath, { scroll: false });
          return;
        }
        const u = new URL(window.location.href);
        u.searchParams.set("tag", trimmed);
        if (sortBy !== "hot") u.searchParams.delete("sort");
        else u.searchParams.set("sort", "hot");
        const qs = u.search ? u.search : "";
        router.replace(`${u.pathname}${qs}`, { scroll: false });
        return;
      }
      if (path.startsWith("/community/topic/")) {
        router.replace(`/community${sortQs}`, { scroll: false });
        return;
      }
      const u = new URL(window.location.href);
      u.searchParams.delete("tag");
      if (sortBy !== "hot") u.searchParams.delete("sort");
      else u.searchParams.set("sort", "hot");
      const qs = u.search ? u.search : "";
      router.replace(`${u.pathname}${qs}`, { scroll: false });
    },
    [router, pathname, sortBy],
  );

  /** 搜索框 Enter：将输入作为 **`GET …/feed` `tag`**（与 `/community/topic/…`、`?tag=` 同源；①②③ 同参） */
  const applySearchAsTopicTag = useCallback(() => {
    const tag = normalizeCommunityTopicTagFromSearchInput(searchQuery);
    if (!tag) return;
    if (communityPostTagExceedsServerUtf8Limit(tag)) {
      setToastHint(null);
      setToastBodyOverride(
        t("community_search_server_tag_skipped_too_long", { n: COMMUNITY_FEED_TAG_QUERY_MAX_LEN }),
      );
      setToast("community_notice");
      scheduleToastClear(4200);
      return;
    }
    setSearchQuery("");
    setTagFilter(tag);
  }, [searchQuery, setSearchQuery, setTagFilter, scheduleToastClear, t, setToastHint, setToastBodyOverride, setToast]);

  const clearFilters = useCallback(() => {
    if (typeof window !== "undefined") {
      const path = pathname ?? "";
      if (path.startsWith("/community/topic/")) {
        router.replace(`/community${feedSortQuerySuffix(sortBy)}`, { scroll: false });
      } else {
        const u = new URL(window.location.href);
        let changed = false;
        if (u.searchParams.has("tag")) {
          u.searchParams.delete("tag");
          changed = true;
        }
        if (u.searchParams.has("destination")) {
          u.searchParams.delete("destination");
          changed = true;
        }
        if (changed) {
          const qs = u.search ? u.search : "";
          router.replace(`${u.pathname}${qs}`, { scroll: false });
        }
      }
    }
    clearFiltersFromHook();
  }, [clearFiltersFromHook, router, pathname, sortBy]);

  return { setTagFilter, applySearchAsTopicTag, clearFilters };
}
