/**
 * 56-S4 Landing 结果区：按天摘要与首日配图（与 52 §3.1 一致）
 * 抽离便于单元测试与复用。
 */

/** 52 统一表兼容：daily_itinerary 项含 city、description、content_text、images */
export type DailyItemForSummary = {
  day_index?: number;
  city?: string;
  description?: string;
  content_text?: string;
  content_images?: string[];
  images?: string[] | { url: string }[];
};

/** 取首日描述（优先 description，否则 content_text） */
export function getFirstDayDescription(daily: DailyItemForSummary[] | undefined): string {
  const first = daily?.[0];
  if (!first) return "";
  return (first.description ?? first.content_text ?? "").slice(0, 120);
}

/** 取首日首图（优先 images[0]，否则 content_images[0]） */
export function getFirstDayImage(daily: DailyItemForSummary[] | undefined): string | null {
  const first = daily?.[0];
  if (!first) return null;
  const imgs = first.images ?? first.content_images;
  if (!imgs?.length) return null;
  const url = typeof imgs[0] === "string" ? imgs[0] : (imgs[0] as { url: string }).url;
  return url || null;
}

/** 含 `city` 的按日行程行（Landing / Escrow / 社区订单摘要共用） */
export type DayRowForOutline = { city?: string };

/** 单日片段：`locales` 中 `landing_results_day_segment`（`{{n}}`、`{{city}}`） */
export function formatDaySegment(
  dayIndex1Based: number,
  cityOrDash: string,
  t: (key: string) => string
): string {
  return t("landing_results_day_segment")
    .replace(/\{\{n\}\}/g, String(dayIndex1Based))
    .replace(/\{\{city\}\}/g, cityOrDash);
}

/** 多日摘要，中间隔为 `landing_results_day_joiner` */
export function getDailyItineraryOutline(
  daily: DayRowForOutline[] | undefined,
  dash: string,
  t: (key: string) => string,
  maxDays: number
): string {
  if (!daily?.length) return "";
  const joiner = t("landing_results_day_joiner");
  return daily
    .slice(0, maxDays)
    .map((d, i) => {
      const city = typeof d.city === "string" ? d.city.trim() : "";
      return formatDaySegment(i + 1, city || dash, t);
    })
    .join(joiner);
}

/** Landing 结果卡：最多 10 天；`dash` 与 `ui_em_dash` 一致 */
export function getDaySummary(
  daily: DailyItemForSummary[] | undefined,
  dash: string,
  t: (key: string) => string
): string {
  return getDailyItineraryOutline(daily, dash, t, 10);
}
