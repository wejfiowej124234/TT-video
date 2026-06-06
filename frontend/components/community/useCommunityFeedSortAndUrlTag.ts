"use client";

import { useMemo, useCallback } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { communityPostTagWithinServerUtf8Limit } from "@/lib/apiClient/community";
import type { FeedTab, SortBy } from "@/components/community/communityFeedConstants";
import type { CommunityFeedApiMode } from "@/components/community/useCommunityFeedApi";
import {
  communityTopicPathForTag as communityTopicPathForTagFromSort,
  parseCommunityFeedSortFromQuery,
  pathnameWithFeedSort,
} from "@/lib/communityFeedSortUrl";

type FeedRouter = { replace: (href: string, options?: { scroll?: boolean }) => void };

/** `sort=` URL、话题 path/tag 解析、`feedApi` 的 mode/tag（从 `useCommunityFeed` 拆出，行为同源）。 */
export function useCommunityFeedSortAndUrlTag(options: {
  feedTab: FeedTab;
  searchParams: ReadonlyURLSearchParams;
  pathname: string | null;
  router: FeedRouter;
}) {
  const { feedTab, searchParams, pathname, router } = options;

  /** B-077 / TT-COMMUNITY-TOPIC-SORT-URL-001：`sort=` 为单一真相源；与 `GET …/feed` `mode` 同源 */
  const sortBy: SortBy = useMemo(
    () => parseCommunityFeedSortFromQuery(searchParams.get("sort")),
    [searchParams],
  );

  const setSortBy = useCallback(
    (s: SortBy) => {
      if (typeof window === "undefined") return;
      const path = pathname ?? window.location.pathname;
      const next = pathnameWithFeedSort(path, window.location.search, s);
      router.replace(next, { scroll: false });
    },
    [router, pathname],
  );

  /** 与 `setTagFilter` 同源，话题页 `<Link href>` 保留 `sort=hot` */
  const hrefTopicPathForTag = useCallback(
    (tag: string) => communityTopicPathForTagFromSort(tag, sortBy),
    [sortBy],
  );

  const feedApiMode: CommunityFeedApiMode =
    feedTab === "following" ? "follow" : sortBy === "hot" ? "hot" : "latest";

  /** 与 URL 话题一致，供 Feed API 服务端筛选（先于 filter hook 的 tag 状态同步） */
  const feedTagFromUrl = useMemo(() => {
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
    const trimmed = raw?.trim() || null;
    if (!trimmed) return null;
    return communityPostTagWithinServerUtf8Limit(trimmed) ? trimmed : null;
  }, [pathname, searchParams]);

  return {
    sortBy,
    setSortBy,
    hrefTopicPathForTag,
    feedApiMode,
    feedTagFromUrl,
  };
}
