/**
 * DID 排行榜 · 纯函数工具（分页、period 解析），便于单测与复用
 */

export type Period = "week" | "month" | "all";

const PERIOD_VALUES: Period[] = ["week", "month", "all"];

/** 向导榜排序：默认接待金额主序；`reviews` / `weighted` = API `?sort=` 同值（见 04 附录 §2） */
export type GuideLeaderboardSort = "reception" | "reviews" | "weighted";

/** 与 `app/community/user/[id]/page.tsx` 一致：可链到社区作者主页的 user id（UUID） */
const COMMUNITY_USER_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isDidRankCommunityProfileId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && COMMUNITY_USER_UUID_RE.test(id);
}

/** 解析 URL ?period= 参数，非法则返回 defaultPeriod（trim + 大小写不敏感） */
export function parsePeriodParam(param: string | null, defaultPeriod: Period = "all"): Period {
  const p = param == null ? "" : String(param).trim().toLowerCase();
  if (p === "week" || p === "month" || p === "all") return p;
  return defaultPeriod;
}

/** 解析 `?guide_sort=`（与 API `sort=` 对齐；缺省/非法回退 **`weighted`** 综合加权，与排行榜页主口径一致） */
export function parseGuideSortParam(param: string | null): GuideLeaderboardSort {
  const p = param == null ? "" : String(param).trim().toLowerCase();
  if (p === "reviews") return "reviews";
  if (p === "reception") return "reception";
  return "weighted";
}

/** 书页式主榜：`?board=` 与页内脊签同步（`traveler` | `guide` | `provider`） */
export type DidRankBoardTab = "traveler" | "guide" | "provider";

export function parseDidRankBoardParam(param: string | null): DidRankBoardTab {
  const p = param == null ? "" : String(param).trim().toLowerCase();
  if (p === "guide") return "guide";
  if (p === "provider" || p === "merchant") return "provider";
  return "traveler";
}

/** 总页数（向上取整） */
export function getTotalPages(totalItems: number, pageSize: number): number {
  if (pageSize <= 0) return 0;
  return Math.ceil(totalItems / pageSize);
}

/** 当前页的子列表（0-based 页号则 page - 1） */
export function getPaginatedSlice<T>(list: T[], page: number, pageSize: number): T[] {
  if (pageSize <= 0 || page < 1) return [];
  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

/** 根据排名索引（0-based）计算应所在页（列表为 11～100 时，rankIndex 为在 listFrom11 中的索引） */
export function getPageForRankIndex(rankIndexInListFrom11: number, pageSize: number): number {
  if (pageSize <= 0 || rankIndexInListFrom11 < 0) return 1;
  return Math.floor(rankIndexInListFrom11 / pageSize) + 1;
}

export { PERIOD_VALUES };

/** 旅行者榜：带 period 与 `me=traveler-<uuid>` 的查询串，供 Link / 分享复制（63 P3、30 §8） */
export function buildDidRankTravelerHighlightSearch(period: Period, travelerId: string): string {
  const me = `traveler-${travelerId}`;
  return `?period=${period}&me=${encodeURIComponent(me)}`;
}

/** 向导榜：同上，`me=guide-<uuid>`；非默认排序时保留 `guide_sort` */
export function buildDidRankGuideHighlightSearch(
  period: Period,
  guideId: string,
  opts?: { guideSort?: GuideLeaderboardSort },
): string {
  const me = `guide-${guideId}`;
  const qs = new URLSearchParams();
  qs.set("period", period);
  qs.set("me", me);
  if (opts?.guideSort === "reviews") {
    qs.set("guide_sort", "reviews");
  } else if (opts?.guideSort === "reception") {
    qs.set("guide_sort", "reception");
  }
  return `?${qs.toString()}`;
}
