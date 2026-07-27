import {
  type MarketListingPublishResult,
  postMarketAcquisitionListing,
  postMarketAcquisitionListingDraft,
  postMarketProviderListing,
  postMarketProviderListingDraft,
} from "@/lib/apiClient/marketSubsite";

const LS_MERCHANT = "traveltrust_market_merchant_studio_draft_v1";
const LS_ACQUISITION = "traveltrust_market_acquisition_studio_draft_v1";

/** 与 `MerchantShowcaseStudioModal` 表单字段对齐（仅序列化用到的键）。 */
export type MerchantStudioDraftPersistSource = {
  title: string;
  subtitle: string;
  category: string;
  city: string;
  countryIso: string;
  coverFileName: string | null;
  videoFileName: string | null;
  videoUrl: string;
  highlightsText: string;
  description: string;
  priceUsdc: string;
  deliveryArchetype: string;
  agreeEscrowCopy: boolean;
};

/** 与 `AcquisitionCarryStudioModal` 表单字段对齐（仅序列化用到的键）。 */
export type AcquisitionStudioDraftPersistSource = {
  title: string;
  summary: string;
  supplyOrigin: string;
  receiptHandoff: string;
  category: string;
  destinationCountryIso: string;
  bountyMinUsdc: string;
  bountyMaxUsdc: string;
  deadlineNote: string;
  coverFileName: string | null;
  videoFileName: string | null;
  videoUrl: string;
  highlightsText: string;
  description: string;
  inspectionStandard: string;
  authenticity: string;
  condition: string;
  rejections: string;
  handoff: string;
  agreeEscrowCopy: boolean;
};

function toMerchantPersist(form: MerchantStudioDraftPersistSource): Record<string, unknown> {
  return {
    kind: "merchant_showcase_studio_v1",
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    category: form.category,
    city: form.city.trim(),
    countryIso: form.countryIso.trim().toUpperCase(),
    hasCoverFile: Boolean(form.coverFileName),
    coverFileName: form.coverFileName,
    hasVideoFile: Boolean(form.videoFileName),
    videoFileName: form.videoFileName,
    videoUrl: form.videoUrl.trim(),
    highlightsText: form.highlightsText,
    description: form.description,
    priceUsdc: form.priceUsdc.trim(),
    deliveryArchetype: form.deliveryArchetype,
    agreeEscrowCopy: form.agreeEscrowCopy,
  };
}

function toAcquisitionPersist(form: AcquisitionStudioDraftPersistSource): Record<string, unknown> {
  return {
    kind: "acquisition_carry_studio_v1",
    title: form.title.trim(),
    summary: form.summary.trim(),
    supplyOrigin: form.supplyOrigin.trim(),
    receiptHandoff: form.receiptHandoff.trim(),
    category: form.category,
    destinationCountryIso: form.destinationCountryIso.trim().toUpperCase(),
    bountyMinUsdc: form.bountyMinUsdc.trim(),
    bountyMaxUsdc: form.bountyMaxUsdc.trim(),
    deadlineNote: form.deadlineNote.trim(),
    hasCoverFile: Boolean(form.coverFileName),
    coverFileName: form.coverFileName,
    hasVideoFile: Boolean(form.videoFileName),
    videoFileName: form.videoFileName,
    videoUrl: form.videoUrl.trim(),
    highlightsText: form.highlightsText,
    description: form.description,
    inspectionStandard: form.inspectionStandard,
    authenticity: form.authenticity,
    condition: form.condition,
    rejections: form.rejections,
    handoff: form.handoff,
    agreeEscrowCopy: form.agreeEscrowCopy,
  };
}

/** 与 blob URL 无关的稳定指纹，用于未保存关闭确认。 */
export function merchantStudioDraftFingerprint(form: MerchantStudioDraftPersistSource): string {
  return JSON.stringify(toMerchantPersist(form));
}

export function acquisitionStudioDraftFingerprint(form: AcquisitionStudioDraftPersistSource): string {
  return JSON.stringify(toAcquisitionPersist(form));
}

function writeLocalBackup(key: string, draft_id: string, saved_at: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        draft_id,
        saved_at,
        payload,
        savedLocallyAt: new Date().toISOString(),
      }),
    );
  } catch {
    // quota / private mode
  }
}

export type MarketStudioLocalBackup = {
  draft_id: string;
  saved_at: string;
  payload: Record<string, unknown>;
};

function readLocalBackup(key: string): MarketStudioLocalBackup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MarketStudioLocalBackup>;
    if (!parsed || typeof parsed.payload !== "object" || parsed.payload == null) return null;
    return {
      draft_id: typeof parsed.draft_id === "string" ? parsed.draft_id : "",
      saved_at: typeof parsed.saved_at === "string" ? parsed.saved_at : "",
      payload: parsed.payload as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

export function readMerchantStudioLocalBackup(): MarketStudioLocalBackup | null {
  return readLocalBackup(LS_MERCHANT);
}

export function readAcquisitionStudioLocalBackup(): MarketStudioLocalBackup | null {
  return readLocalBackup(LS_ACQUISITION);
}

export function clearMerchantStudioLocalBackup(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LS_MERCHANT);
  } catch {
    /* ignore */
  }
}

export function clearAcquisitionStudioLocalBackup(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LS_ACQUISITION);
  } catch {
    /* ignore */
  }
}

function strField(payload: Record<string, unknown>, key: string, fallback = ""): string {
  const v = payload[key];
  return typeof v === "string" ? v : fallback;
}

function boolField(payload: Record<string, unknown>, key: string): boolean {
  return payload[key] === true;
}

/** Hydrate form text fields from localStorage backup (no blob media restore). */
export function merchantDraftFromLocalPayload(
  payload: Record<string, unknown>,
): MerchantStudioDraftPersistSource {
  const cat = strField(payload, "category", "dining");
  const category = ["hotel", "dining", "attraction", "experience"].includes(cat) ? cat : "dining";
  return {
    title: strField(payload, "title"),
    subtitle: strField(payload, "subtitle"),
    category,
    city: strField(payload, "city"),
    countryIso: strField(payload, "countryIso"),
    coverFileName: typeof payload.coverFileName === "string" ? payload.coverFileName : null,
    videoFileName: typeof payload.videoFileName === "string" ? payload.videoFileName : null,
    videoUrl: strField(payload, "videoUrl"),
    highlightsText: strField(payload, "highlightsText"),
    description: strField(payload, "description"),
    priceUsdc: strField(payload, "priceUsdc"),
    deliveryArchetype: strField(payload, "deliveryArchetype", "escrow_order") || "escrow_order",
    agreeEscrowCopy: boolField(payload, "agreeEscrowCopy"),
  };
}

export function acquisitionDraftFromLocalPayload(
  payload: Record<string, unknown>,
): AcquisitionStudioDraftPersistSource {
  return {
    title: strField(payload, "title"),
    summary: strField(payload, "summary"),
    supplyOrigin: strField(payload, "supplyOrigin"),
    receiptHandoff: strField(payload, "receiptHandoff"),
    category: strField(payload, "category", "luxury") || "luxury",
    destinationCountryIso: strField(payload, "destinationCountryIso"),
    bountyMinUsdc: strField(payload, "bountyMinUsdc"),
    bountyMaxUsdc: strField(payload, "bountyMaxUsdc"),
    deadlineNote: strField(payload, "deadlineNote"),
    coverFileName: typeof payload.coverFileName === "string" ? payload.coverFileName : null,
    videoFileName: typeof payload.videoFileName === "string" ? payload.videoFileName : null,
    videoUrl: strField(payload, "videoUrl"),
    highlightsText: strField(payload, "highlightsText"),
    description: strField(payload, "description"),
    inspectionStandard: strField(payload, "inspectionStandard"),
    authenticity: strField(payload, "authenticity"),
    condition: strField(payload, "condition"),
    rejections: strField(payload, "rejections"),
    handoff: strField(payload, "handoff"),
    agreeEscrowCopy: boolField(payload, "agreeEscrowCopy"),
  };
}

export async function persistMerchantShowcaseStudioDraft(form: MerchantStudioDraftPersistSource) {
  const payload = toMerchantPersist(form);
  const { draft_id, saved_at } = await postMarketProviderListingDraft(payload);
  writeLocalBackup(LS_MERCHANT, draft_id, saved_at, payload);
  return { draft_id, saved_at };
}

export async function persistAcquisitionCarryStudioDraft(form: AcquisitionStudioDraftPersistSource) {
  const payload = toAcquisitionPersist(form);
  const { draft_id, saved_at } = await postMarketAcquisitionListingDraft(payload);
  writeLocalBackup(LS_ACQUISITION, draft_id, saved_at, payload);
  return { draft_id, saved_at };
}

/** 已登录：将当前表单发布至 **`market_listings`**（与草稿 payload 同源） */
export async function publishMerchantShowcaseStudioCatalog(
  form: MerchantStudioDraftPersistSource,
): Promise<MarketListingPublishResult> {
  const payload = toMerchantPersist(form);
  return postMarketProviderListing(payload);
}

export async function publishAcquisitionCarryStudioCatalog(
  form: AcquisitionStudioDraftPersistSource,
): Promise<MarketListingPublishResult> {
  const payload = toAcquisitionPersist(form);
  return postMarketAcquisitionListing(payload, { agreeEscrowCopy: form.agreeEscrowCopy });
}
