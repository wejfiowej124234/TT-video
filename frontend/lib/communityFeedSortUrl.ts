import type { SortBy } from "@/components/community/communityFeedConstants";
import { communityPostTagExceedsServerUtf8Limit } from "@/lib/apiClient/community/constants";

/** B-077 / TT-COMMUNITY-TOPIC-SORT-URL-001：URL 仅认 `sort=hot`；缺省或其它值 → latest（与 `GET …/feed` `mode` 同源） */
export function parseCommunityFeedSortFromQuery(sortParam: string | null | undefined): SortBy {
  const raw = sortParam?.trim().toLowerCase();
  return raw === "hot" ? "hot" : "latest";
}

export function communityTopicPathForTag(tag: string, sort: SortBy): string {
  const enc = encodeURIComponent(tag.trim());
  return sort === "hot" ? `/community/topic/${enc}?sort=hot` : `/community/topic/${enc}`;
}

/** 话题页/主 Feed 导航时追加的 query（仅 `sort`） */
export function feedSortQuerySuffix(sort: SortBy): string {
  return sort === "hot" ? "?sort=hot" : "";
}

/**
 * 在 pathname + search 上仅写入 `sort`（保留其它 query）。`search` 须为 `window.location.search` 形态（`?a=1` 或 `""`）。
 */
export function pathnameWithFeedSort(pathname: string, search: string, sort: SortBy): string {
  const base = search.startsWith("?") ? search : search ? `?${search}` : "";
  const u = new URL(`http://internal${pathname}${base}`);
  if (sort === "latest") u.searchParams.delete("sort");
  else u.searchParams.set("sort", "hot");
  const qs = u.search;
  return `${u.pathname}${qs === "?" || qs === "" ? "" : qs}`;
}

/** 搜索框 Enter → 话题 tag：trim · 去前导 `#`（与发帖分词同源） */
export function normalizeCommunityTopicTagFromSearchInput(raw: string): string {
  let x = raw.trim();
  if (!x) return "";
  if (x.startsWith("#")) x = x.slice(1).trim();
  return x;
}

/** UI 提示：当前输入是否超过 Feed `tag` 查询 UTF-8 上限 */
export function communityTopicTagExceedsFeedQueryLimit(tag: string): boolean {
  if (!tag) return false;
  return communityPostTagExceedsServerUtf8Limit(tag);
}
