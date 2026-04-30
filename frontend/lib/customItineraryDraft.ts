import type { CustomItineraryForm } from "@/components/market/CustomItineraryModal/types";
import { postItineraryCustomDraft } from "@/lib/apiClient/itineraries";

const LS_KEY = "traveltrust_custom_itinerary_studio_draft_v1";

function imageMeta(s: string): { hasValue: boolean; isDataUrl: boolean } {
  const v = typeof s === "string" ? s : "";
  return { hasValue: Boolean(v.trim()), isDataUrl: v.startsWith("data:") };
}

/** 可 JSON 化的草稿体：剥离 data URL 等大字段，仅保留布尔标记。 */
export function customItineraryDraftPayload(form: CustomItineraryForm): Record<string, unknown> {
  return {
    kind: "custom_itinerary_studio_v1",
    creatorType: form.creatorType,
    totalDays: form.totalDays,
    country: form.country,
    destinationManual: form.destinationManual.trim(),
    title: form.title.trim(),
    amount: form.amount.trim(),
    description: form.description,
    coverImage: imageMeta(form.image),
    headcount: form.headcount,
    needGuide: form.needGuide,
    guideFee: form.guideFee.trim(),
    transportFee: form.transportFee.trim(),
    guideAttractionFee: form.guideAttractionFee.trim(),
    guideFoodFee: form.guideFoodFee.trim(),
    guideInterCityFee: form.guideInterCityFee.trim(),
    dayPlans: form.dayPlans.map((d) => ({
      city: d.city,
      attractions: d.attractions,
      food: d.food,
      hotel: d.hotel,
      cityTransport: d.cityTransport,
      transport: d.transport,
    })),
    guideDayPlans: form.guideDayPlans.map((g) => ({
      city: g.city,
      attractions: g.attractions,
      food: g.food,
      hotel: g.hotel,
      transport: g.transport,
      cityTransport: g.cityTransport,
      attractionImage: imageMeta(g.attractionImage),
      foodImage: imageMeta(g.foodImage),
      vehicleImage: imageMeta(g.vehicleImage),
      vehicleDescription: g.vehicleDescription,
      hotelImage: imageMeta(g.hotelImage),
      hotelDescription: g.hotelDescription,
      dayImage: imageMeta(g.image),
    })),
  };
}

export function customItineraryDraftFingerprint(form: CustomItineraryForm): string {
  return JSON.stringify(customItineraryDraftPayload(form));
}

function writeLocalBackup(draft_id: string, saved_at: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ draft_id, saved_at, payload, savedLocallyAt: new Date().toISOString() }),
    );
  } catch {
    // quota / private mode
  }
}

export async function persistCustomItineraryStudioDraft(form: CustomItineraryForm) {
  const payload = customItineraryDraftPayload(form);
  const { draft_id, saved_at } = await postItineraryCustomDraft(payload);
  writeLocalBackup(draft_id, saved_at, payload);
  return { draft_id, saved_at };
}
