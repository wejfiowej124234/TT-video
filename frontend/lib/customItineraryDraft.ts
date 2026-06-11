import type {
  CustomItineraryForm,
  CreatorType,
  DayPlan,
  GuideDayPlan,
  GuideLevel,
  CityTransportType,
  TransportType,
} from "@/components/market/CustomItineraryModal/types";
import { defaultDayPlan, defaultGuideDayPlan, defaultForm } from "@/components/market/CustomItineraryModal/types";
import { getItineraryCustomDraft, postItineraryCustomDraft } from "@/lib/apiClient/itineraries";
import type { ItineraryCustomDraftGetResult } from "@/lib/apiClient/itineraries";

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

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asCreatorType(v: unknown): CreatorType {
  return v === "guide" ? "guide" : "tourist";
}

function asGuideLevel(v: unknown): GuideLevel {
  if (v === "intermediate" || v === "advanced" || v === "expert") return v;
  return "primary";
}

function asTransportType(v: unknown): TransportType | undefined {
  if (v === "vehicle" || v === "rail" || v === "flight") return v;
  return undefined;
}

function asCityTransportType(v: unknown): CityTransportType | undefined {
  if (v === "sedan" || v === "suv" || v === "van") return v;
  return undefined;
}

function parseStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x : ""));
}

function parseDayPlan(raw: unknown): DayPlan {
  if (!raw || typeof raw !== "object") return defaultDayPlan();
  const o = raw as Record<string, unknown>;
  return {
    city: asString(o.city),
    attractions: parseStringArray(o.attractions),
    food: parseStringArray(o.food),
    hotel: asString(o.hotel),
    cityTransport: asCityTransportType(o.cityTransport),
    transport: asTransportType(o.transport),
  };
}

function parseGuideDayPlan(raw: unknown): GuideDayPlan {
  if (!raw || typeof raw !== "object") return defaultGuideDayPlan();
  const o = raw as Record<string, unknown>;
  return {
    city: asString(o.city),
    attractions: asString(o.attractions),
    food: asString(o.food),
    hotel: asString(o.hotel),
    transport: asTransportType(o.transport),
    cityTransport: asCityTransportType(o.cityTransport),
    vehicleImage: "",
    vehicleDescription: asString(o.vehicleDescription),
    hotelImage: "",
    hotelDescription: asString(o.hotelDescription),
    image: "",
    attractionImage: "",
    foodImage: "",
  };
}

function normalizeDayPlans(raw: unknown, totalDays: number): DayPlan[] {
  const src = Array.isArray(raw) ? raw : [];
  return Array.from({ length: totalDays }, (_, i) => parseDayPlan(src[i]));
}

function normalizeGuideDayPlans(raw: unknown, totalDays: number): GuideDayPlan[] {
  const src = Array.isArray(raw) ? raw : [];
  return Array.from({ length: totalDays }, (_, i) => parseGuideDayPlan(src[i]));
}

/** 将服务端 **`custom_itinerary_studio_v1`** payload 还原为 **`CustomItineraryForm`**（图片 data URL 不可恢复，留空）。 */
export function studioDraftPayloadToForm(payload: Record<string, unknown>): CustomItineraryForm | null {
  if (payload.kind !== "custom_itinerary_studio_v1") return null;
  const totalDays = Math.max(1, Math.min(30, asNumber(payload.totalDays, 5)));
  const base = defaultForm(totalDays);
  return {
    ...base,
    creatorType: asCreatorType(payload.creatorType),
    totalDays,
    country: asString(payload.country),
    destinationManual: asString(payload.destinationManual),
    title: asString(payload.title),
    amount: asString(payload.amount),
    description: asString(payload.description),
    image: "",
    headcount: Math.max(1, asNumber(payload.headcount, base.headcount)),
    needGuide: asGuideLevel(payload.needGuide),
    guideFee: asString(payload.guideFee),
    transportFee: asString(payload.transportFee),
    guideAttractionFee: asString(payload.guideAttractionFee),
    guideFoodFee: asString(payload.guideFoodFee),
    guideInterCityFee: asString(payload.guideInterCityFee),
    dayPlans: normalizeDayPlans(payload.dayPlans, totalDays),
    guideDayPlans: normalizeGuideDayPlans(payload.guideDayPlans, totalDays),
  };
}

/** **`GET /itineraries/custom/drafts/:id`** 深链 hydrate；成功时写入 localStorage 备份。 */
export async function hydrateCustomItineraryStudioDraftFromServer(
  draftId: string,
): Promise<ItineraryCustomDraftGetResult> {
  const row = await getItineraryCustomDraft(draftId);
  writeLocalBackup(row.draft_id, row.saved_at, row.payload);
  return row;
}
