/**
 * Catalog hotel tier adapter — API → HOTEL_TIERS 同形（S2b Phase 3）
 */
import { HOTEL_TIERS, HOTEL_TIER_SUBMIT_LABELS } from "../cityDetails/hotels";
import { HOTEL_TIER_MULTIPLIER } from "../cityDetails/hotelTierPricing";
import type { CatalogApiHotelTierRow, ResolvedCatalogHotelTier } from "./types";

const TS_IMAGE_BY_TIER: Record<string, string> = Object.fromEntries(
  HOTEL_TIERS.map((t) => [t.value, t.image]),
);

export function mapApiHotelTiersToResolved(items: CatalogApiHotelTierRow[]): ResolvedCatalogHotelTier[] {
  return [...items]
    .sort((a, b) => a.sort_order - b.sort_order || a.tier_code.localeCompare(b.tier_code))
    .map((t) => ({
      value: t.tier_code,
      labelKey: t.label_key,
      descriptionKey: t.description_key,
      image: t.stock_image_url ?? TS_IMAGE_BY_TIER[t.tier_code] ?? "",
      submitLabelZh: t.submit_label_zh,
      multiplier: t.multiplier,
    }));
}

export function readHotelTiersFromTs(): ResolvedCatalogHotelTier[] {
  return HOTEL_TIERS.map((t) => ({
    value: t.value,
    labelKey: t.labelKey,
    descriptionKey: t.descriptionKey,
    image: t.image,
    submitLabelZh: HOTEL_TIER_SUBMIT_LABELS[t.value],
    multiplier: HOTEL_TIER_MULTIPLIER[t.value],
  }));
}
