import { fetchGuideAvailabilityForMany } from "@/lib/guideAvailabilityClient";
import { tripRangeOverlapsOccupied, type GuideOccupiedRangeYmd } from "@/lib/guideBookingDates";
import type { GuideCardItem } from "@/lib/marketTypes";

export function parseOccupiedRanges(raw: unknown): GuideOccupiedRangeYmd[] {
  if (!Array.isArray(raw)) return [];
  const out: GuideOccupiedRangeYmd[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const start_date = typeof o.start_date === "string" ? o.start_date : "";
    const end_date = typeof o.end_date === "string" ? o.end_date : "";
    if (start_date && end_date) out.push({ start_date, end_date });
  }
  return out;
}

/**
 * 绑定向导预筛（① · 与 PATCH guide 的 `guide_slot` + 档期重叠同源）。
 * 向导已有任意 Accepted/Escrowed 占位（`occupied_ranges` 非空）时不可再接新 Created 单，
 * 即使用户行程日期不重叠也会 409 `guide_has_active_order`。
 */
export async function filterGuidesAvailableForTrip(
  guides: readonly GuideCardItem[],
  trip: { start: string; end: string },
): Promise<GuideCardItem[]> {
  if (!guides.length) return [];
  const availability = await fetchGuideAvailabilityForMany(guides.map((g) => g.id));
  const results = guides.map((guide) => {
    const data = availability.get(String(guide.id).trim());
    if (!data) return guide;
    const occupied = parseOccupiedRanges(data.occupied_ranges);
    if (occupied.length === 0) return guide;
    if (tripRangeOverlapsOccupied(trip.start, trip.end, occupied)) return null;
    return null;
  });
  return results.filter((g): g is GuideCardItem => g != null);
}
