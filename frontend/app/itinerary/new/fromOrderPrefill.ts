import type { UnifiedDayRow } from "@/lib/itineraryUnified";
import { CITIES_BY_COUNTRY, productCountryZhForCityName } from "@/lib/geoOptions";
import { isAllowedProductZhCountryName } from "@/lib/productCountries";
import type { ItineraryForm } from "@/components/itinerary/itineraryNewPage/itineraryNewTypes";

export type OrderHeadPrefill = {
  destination?: string;
  city?: string;
  travel_date?: string | null;
  days?: number;
};

/** 从 GET order 的 order 头与 itinerary 推导可预填字段（53 fromOrder；国家/城市与 geoOptions SSOT 一致） */
export function formFromOrderItinerary(
  daily: UnifiedDayRow[] | undefined,
  existing: ItineraryForm,
  orderHead?: OrderHeadPrefill,
): ItineraryForm {
  const first = daily?.[0];
  const hasDaily = Boolean(daily?.length);
  if (!hasDaily && !orderHead) return existing;

  const daysFromDaily = hasDaily ? Math.max(1, Math.min(30, daily!.length)) : undefined;

  let destination =
    (orderHead?.destination?.trim() && isAllowedProductZhCountryName(orderHead.destination)
      ? orderHead.destination.trim()
      : "") ||
    (existing.destination?.trim() && isAllowedProductZhCountryName(existing.destination)
      ? existing.destination.trim()
      : "");

  const cityCandidate =
    (orderHead?.city?.trim() || first?.city?.trim() || existing.city?.trim() || "").trim();

  if (!destination && cityCandidate) {
    destination = productCountryZhForCityName(cityCandidate) || "";
  }

  if (!destination && first) {
    const desc = String(first.description ?? first.content_text ?? "");
    const slice = desc.slice(0, 50).trim();
    if (isAllowedProductZhCountryName(slice)) destination = slice;
  }

  let city = cityCandidate;
  if (destination) {
    const allowed = CITIES_BY_COUNTRY[destination] ?? [];
    if (!allowed.some((c) => c.value === city)) city = "";
  } else {
    city = "";
  }

  const travel_date =
    (orderHead?.travel_date != null && String(orderHead.travel_date).trim()) ||
    (first?.date != null && String(first.date).trim()) ||
    existing.travel_date ||
    "";

  let days = existing.days;
  if (orderHead?.days != null && Number.isFinite(orderHead.days) && orderHead.days > 0) {
    days = Math.max(1, Math.min(30, Math.floor(Number(orderHead.days))));
  } else if (daysFromDaily != null) {
    days = daysFromDaily;
  }

  return {
    ...existing,
    destination,
    city,
    travel_date,
    days,
  };
}
