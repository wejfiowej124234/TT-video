import type { CityTransportType, GuideLevel, TransportType } from "./types";
import { DEFAULT_COUNTRY, getPricingForCountry } from "@/lib/countries";

export type { CityTransportType, GuideLevel, TransportType };

/** 按国家返回带单价的向导等级选项（用于展示与表单单选） */
export function getGuideLevelsWithPricing(country: string): { value: GuideLevel; labelKey: string; suggestedPerDay: number }[] {
  const pricing = getPricingForCountry(country || DEFAULT_COUNTRY);
  return GUIDE_LEVELS.map((l) => ({ ...l, suggestedPerDay: pricing.guideLevelsSuggestedPerDay[l.value] }));
}

export const TOTAL_DAYS_OPTIONS = [1, 2, 3, 5, 7, 10, 14] as const;

export const TRANSPORT_OPTIONS: { value: TransportType; labelKey: string }[] = [
  { value: "flight", labelKey: "market_transportFlight" },
  { value: "rail", labelKey: "market_transportRail" },
];

export const CITY_TRANSPORT_OPTIONS: { value: CityTransportType; labelKey: string }[] = [
  { value: "sedan", labelKey: "market_transportSedan" },
  { value: "suv", labelKey: "market_transportSuv" },
  { value: "van", labelKey: "market_transportVan" },
];

/** 城市交通类型对应的图片与描述 key（描述走 i18n：market_transportSedanDesc 等） */
export const CITY_TRANSPORT_DETAILS: Record<CityTransportType, { image: string; descriptionKey: string }> = {
  sedan: {
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80",
    descriptionKey: "market_transportSedanDesc",
  },
  suv: {
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80",
    descriptionKey: "market_transportSuvDesc",
  },
  van: {
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80",
    descriptionKey: "market_transportVanDesc",
  },
};

/** 向导等级选项（仅展示用）；单价按国家在 lib/countries 配置 */
export const GUIDE_LEVELS: { value: GuideLevel; labelKey: string }[] = [
  { value: "primary", labelKey: "market_guidePrimary" },
  { value: "intermediate", labelKey: "market_guideIntermediate" },
  { value: "advanced", labelKey: "market_guideAdvanced" },
  { value: "expert", labelKey: "market_guideExpert" },
];

export const MAX_COVER_FILE_SIZE = 2 * 1024 * 1024;
export const MAX_AMOUNT = 999999;
export const SEDAN_CAPACITY = 4;
export const TITLE_MAX_LENGTH = 50;
export const DESCRIPTION_MAX_LENGTH = 500;
