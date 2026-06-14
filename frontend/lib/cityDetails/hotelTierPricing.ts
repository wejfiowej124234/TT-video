import type { CountryPricingConfig } from "@/lib/countries";
import type { HotelTierValue } from "./hotels";

/** 以经济型为基准的每晚每人倍数（舒适约 4 星、豪华约 5 星） */
export const HOTEL_TIER_MULTIPLIER: Record<HotelTierValue, number> = {
  tier_economy: 1,
  tier_comfort: 1.65,
  tier_luxury: 2.5,
};

export function isHotelTierValue(value: string): value is HotelTierValue {
  return value === "tier_economy" || value === "tier_comfort" || value === "tier_luxury";
}

/** 某档次酒店每晚每人预算（USDC 口径，基于国家经济型基价） */
export function hotelNightRatePerPerson(tier: string, pricing: CountryPricingConfig): number {
  const mult = isHotelTierValue(tier) ? HOTEL_TIER_MULTIPLIER[tier] : 1;
  return Math.round(pricing.hotelPerNightPerPerson * mult);
}
