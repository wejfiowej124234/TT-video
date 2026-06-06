import { MARKET_HERO_TRIP_DAY_PRESETS, type MarketHeroTripDayPreset } from "@/lib/marketTripDaysFilter";

export type LandingToMarketDeepLinkInput = {
  country: string;
  city?: string;
  days: number;
};

/** 将 Landing 日期范围天数钳制为 `/market` URL `?days=` 可识别值（1..30）。 */
export function normalizeLandingTripDaysForMarket(days: number): number | null {
  if (!Number.isFinite(days) || days < 1 || days > 30) return null;
  return Math.round(days);
}

/** @deprecated 仅用于旧 preset UI；深链请用 `normalizeLandingTripDaysForMarket`。 */
export function snapLandingDaysToMarketPreset(days: number): MarketHeroTripDayPreset | null {
  if (!Number.isFinite(days) || days < 1 || days > 30) return null;
  let best: MarketHeroTripDayPreset = MARKET_HERO_TRIP_DAY_PRESETS[0]!;
  let bestDist = Math.abs(days - best);
  for (const preset of MARKET_HERO_TRIP_DAY_PRESETS) {
    const dist = Math.abs(days - preset);
    if (dist < bestDist) {
      best = preset;
      bestDist = dist;
    }
  }
  return best;
}

/** `/` Hero → `/market` 筛选深链（与 `useMarketPage` URL 键同源：country · city · days）。 */
export function buildLandingToMarketHref(input: LandingToMarketDeepLinkInput): string {
  const params = new URLSearchParams();
  const country = input.country.trim();
  if (country) params.set("country", country);
  const city = input.city?.trim() ?? "";
  if (city) params.set("city", city);
  const preset = normalizeLandingTripDaysForMarket(input.days);
  if (preset != null) params.set("days", String(preset));
  const q = params.toString();
  return q ? `/market?${q}` : "/market";
}
