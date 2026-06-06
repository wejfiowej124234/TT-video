/**
 * 将 **49 A 创作台**（**`custom_itinerary_studio_v1`** / **`CustomItineraryForm`**）映射到 **P15 `/itinerary/new`** **`ItineraryForm`**（与 **`POST /api/v1/itineraries`** 字段同源）。
 */

import type { CustomItineraryForm } from "@/components/market/CustomItineraryModal/types";
import { CITIES_BY_COUNTRY } from "@/lib/geoOptions";
import { isAllowedProductZhCountryName } from "@/lib/productCountries";
import { defaultForm, type ItineraryForm } from "@/components/itinerary/itineraryNewPage/itineraryNewTypes";

export function mapCustomItineraryFormToItineraryNewForm(cf: CustomItineraryForm): ItineraryForm {
  const base = defaultForm;
  let destination = cf.country.trim();
  if (!isAllowedProductZhCountryName(destination)) destination = "";

  let city = (cf.dayPlans[0]?.city ?? "").trim();
  if (destination && city) {
    const allowed = CITIES_BY_COUNTRY[destination] ?? [];
    if (!allowed.some((c) => c.value === city)) city = "";
  } else if (!destination) {
    city = "";
  }

  const days = Math.max(1, Math.min(30, Number.isFinite(cf.totalDays) ? cf.totalDays : base.days));
  const notesParts = [cf.title.trim(), cf.description.trim()].filter(Boolean);
  const notes = notesParts.join("\n\n").slice(0, 4000);
  const amount = cf.amount.trim();

  return {
    ...base,
    destination,
    city,
    travel_date: "",
    days,
    notes,
    budget_max: amount,
    budget_min: "",
    hotel_type: "",
    food_preference: "",
    transport: "",
  };
}
