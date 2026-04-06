/** 国家/城市与 lib/geoOptions 单源一致，避免重复维护 */
export { COUNTRY_OPTIONS, CITIES_BY_COUNTRY } from "@/lib/geoOptions";

/** 日期 YYYY-MM-DD，用于出发/结束日期；天数由日期范围计算 */
export function dateToString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysFromRange(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (end < start) return 0;
  return Math.round((end - start) / 86400000) + 1;
}

/** 景区类型（用于行程偏好，54-S13）；展示走 i18n landing_attraction_* */
export const ATTRACTION_TYPE_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "世界遗产", labelKey: "landing_attraction_worldHeritage" },
  { value: "自然风光", labelKey: "landing_attraction_nature" },
  { value: "主题乐园", labelKey: "landing_attraction_themePark" },
  { value: "网红景区", labelKey: "landing_attraction_netizen" },
];

/** 餐饮标准（可多选）；展示走 i18n landing_standard_* */
export const STANDARD_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "经济型", labelKey: "landing_standard_economy" },
  { value: "标准", labelKey: "landing_standard_standard" },
  { value: "精品", labelKey: "landing_standard_boutique" },
  { value: "高端", labelKey: "landing_standard_premium" },
];

/** 酒店标准（可多选，54-S14）；展示走 i18n landing_standard_* */
export const HOTEL_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "标准", labelKey: "landing_standard_standard" },
  { value: "轻奢", labelKey: "landing_standard_lightLuxury" },
  { value: "高端", labelKey: "landing_standard_premium" },
];

export const UNLOCK_PRICE_USD = 1.99;
export const ITINERARY_CARD_COUNT = 5;

/** 卡片景区图占位（竖版卡片用） */
export const CARD_SCENIC_IMAGES = [
  "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80",
];
