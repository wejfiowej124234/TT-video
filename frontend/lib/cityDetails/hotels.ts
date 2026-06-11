import type { Option, HotelDetail } from "./types";

/** 通用酒店档次（全城市一致，便于预算估算与跨城对比） */
export const HOTEL_TIERS = [
  {
    value: "tier_economy",
    labelKey: "market_hotel_tier_economy",
    descriptionKey: "market_hotel_tier_economy_desc",
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
  },
  {
    value: "tier_comfort",
    labelKey: "market_hotel_tier_comfort",
    descriptionKey: "market_hotel_tier_comfort_desc",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
  },
  {
    value: "tier_luxury",
    labelKey: "market_hotel_tier_luxury",
    descriptionKey: "market_hotel_tier_luxury_desc",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  },
] as const;

export type HotelTierValue = (typeof HOTEL_TIERS)[number]["value"];

/** @deprecated 保留导出以兼容旧引用；各城市均为同一套档次 */
export const HOTELS_BY_CITY: Record<string, Option[]> = {};

/** 各城市酒店选项 = 通用档次（与城市无关） */
export function getHotels(_city: string): Option[] {
  return HOTEL_TIERS.map((t) => ({ value: t.value, label: t.labelKey }));
}

export function getHotelDetails(_city: string): HotelDetail[] {
  return HOTEL_TIERS.map((t) => ({
    value: t.value,
    label: t.labelKey,
    image: t.image,
    description: t.descriptionKey,
  }));
}

/** 提交/API 用稳定中文档名（不依赖 UI 语言） */
export const HOTEL_TIER_SUBMIT_LABELS: Record<HotelTierValue, string> = {
  tier_economy: "经济型酒店（约3星）",
  tier_comfort: "舒适型酒店（约4星）",
  tier_luxury: "豪华型酒店（约5星）",
};

export function resolveHotelSubmitLabel(value: string): string {
  return HOTEL_TIER_SUBMIT_LABELS[value as HotelTierValue] ?? value;
}

/** @deprecated */
export const HOTELS_DETAILS_BY_CITY: Record<string, HotelDetail[]> = {};
