/** 国家/城市与 lib/geoOptions 单源一致，避免重复维护 */
export { COUNTRY_OPTIONS, CITIES_BY_COUNTRY } from "@/lib/geoOptions";

/** 日期 YYYY-MM-DD（本地日历日，勿用 toISOString 避免 UTC 偏移） */
export function dateToString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysFromRange(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (end < start) return 0;
  return Math.round((end - start) / 86400000) + 1;
}

/** 景点类型（可多选 · 54-S13 · 自然→人文→娱乐→打卡）；展示走 i18n landing_attraction_* */
export const ATTRACTION_TYPE_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "自然风光", labelKey: "landing_attraction_nature" },
  { value: "世界遗产", labelKey: "landing_attraction_worldHeritage" },
  { value: "主题乐园", labelKey: "landing_attraction_themePark" },
  { value: "网红景区", labelKey: "landing_attraction_netizen" },
];

/** 餐饮偏好（可多选 · OTA 风格轴 · 当地→老字号→人气→高档）；展示走 i18n landing_dining_* */
export const STANDARD_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "当地特色", labelKey: "landing_dining_localSpecialty" },
  { value: "老字号", labelKey: "landing_dining_heritage" },
  { value: "人气餐厅", labelKey: "landing_dining_popular" },
  { value: "高档餐饮", labelKey: "landing_dining_fineDining" },
];

/** 住宿档次（可多选 · 54-S14 · 标准→轻奢→高端）；展示走 i18n landing_hotel_* */
export const HOTEL_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "标准", labelKey: "landing_hotel_standard" },
  { value: "轻奢", labelKey: "landing_hotel_lightLuxury" },
  { value: "高端", labelKey: "landing_hotel_premium" },
];

/** @deprecated ① 预览解锁不展示标价；archive/ui-v1 只读快照仍引用。现行 UI 勿用。 */
export const UNLOCK_PRICE_USD = 1.99;
export const ITINERARY_CARD_COUNT = 1;

/** @deprecated 预览卡改用 landingAmbientImageUrl(country)；保留作无国家时的兜底 */
export const CARD_SCENIC_IMAGES = [
  "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80",
];
