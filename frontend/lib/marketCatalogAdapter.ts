/**
 * 将 **`GET …/market/{segment}/listings`** 返回的 **`postgres_catalog`** 行映射为子站 UI 所需的
 * **`DemoMerchantListing` / `DemoAcquisitionListing`** 形状（与 `marketStudioDraft` payload 同源）。
 */

import type { ProductCountryIso } from "@/lib/productCountries";
import { isAllowedProductIso3166 } from "@/lib/productCountries";
import type {
  AcquisitionCategorySlug,
  DemoAcquisitionListing,
  DemoMerchantListing,
  MerchantCategorySlug,
} from "@/lib/marketSubsiteDemo";
import { MERCHANT_CATEGORY_SLUGS, ACQUISITION_CATEGORY_SLUGS } from "@/lib/marketSubsiteFilters";

function l10nSame(s: string): { zh: string; en: string } {
  const t = s.trim();
  return { zh: t, en: t };
}

function parseIsoCountry(raw: unknown): ProductCountryIso {
  const s = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (isAllowedProductIso3166(s)) return s as ProductCountryIso;
  return "CN";
}

function merchantCategoryFromPayload(raw: unknown): MerchantCategorySlug {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return MERCHANT_CATEGORY_SLUGS.includes(s as MerchantCategorySlug) ? (s as MerchantCategorySlug) : "experience";
}

function acquisitionCategoryFromPayload(raw: unknown): AcquisitionCategorySlug {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return ACQUISITION_CATEGORY_SLUGS.includes(s as AcquisitionCategorySlug)
    ? (s as AcquisitionCategorySlug)
    : "electronics";
}

function sortKeyFromUpdatedAt(updatedAt: string): number {
  const ms = Date.parse(updatedAt);
  return Number.isFinite(ms) ? ms : Date.now();
}

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80";

/** API 列表项：`{ id, payload, updated_at }` */
export type MarketCatalogListRow = {
  id: string;
  payload: Record<string, unknown>;
  updated_at: string;
};

export function catalogRowToDemoMerchantListing(row: MarketCatalogListRow): DemoMerchantListing {
  const p = row.payload;
  const titleStr = typeof p.title === "string" ? p.title : "";
  const subtitleStr = typeof p.subtitle === "string" ? p.subtitle : "";
  const cityStr = typeof p.city === "string" ? p.city : "";
  const categoryStr = typeof p.category === "string" ? p.category : "";
  const priceRaw = typeof p.priceUsdc === "string" ? parseFloat(p.priceUsdc) : Number(p.priceUsdc);
  const priceUsdc = Number.isFinite(priceRaw) ? priceRaw : 0;
  const videoUrl = typeof p.videoUrl === "string" ? p.videoUrl.trim() : "";
  const imageSrc =
    videoUrl.startsWith("http://") || videoUrl.startsWith("https://") ? videoUrl : PLACEHOLDER_IMG;

  return {
    id: row.id,
    countryIso: parseIsoCountry(p.countryIso),
    categorySlug: merchantCategoryFromPayload(p.category),
    sortKey: sortKeyFromUpdatedAt(row.updated_at),
    title: l10nSame(titleStr || "Listing"),
    subtitle: l10nSame(subtitleStr),
    city: l10nSame(cityStr),
    category: l10nSame(categoryStr || "—"),
    shopName: l10nSame(typeof p.shopName === "string" ? p.shopName : "TravelTrust"),
    imageSrc,
    priceUsdc,
    story: [l10nSame(typeof p.description === "string" ? p.description : "")],
    highlights: [l10nSame(typeof p.highlightsText === "string" ? p.highlightsText : "")],
  };
}

export function catalogRowToDemoAcquisitionListing(row: MarketCatalogListRow): DemoAcquisitionListing {
  const p = row.payload;
  const titleStr = typeof p.title === "string" ? p.title : "";
  const summaryStr = typeof p.summary === "string" ? p.summary : "";
  const routeStr = typeof p.supplyOrigin === "string" ? p.supplyOrigin : "";
  const minRaw =
    typeof p.bountyMinUsdc === "string" ? parseFloat(p.bountyMinUsdc) : Number(p.bountyMinUsdc);
  const maxRaw =
    typeof p.bountyMaxUsdc === "string" ? parseFloat(p.bountyMaxUsdc) : Number(p.bountyMaxUsdc);
  const bountyMinUsdc = Number.isFinite(minRaw) ? minRaw : 0;
  const bountyMaxUsdc = Number.isFinite(maxRaw) ? maxRaw : bountyMinUsdc;
  const videoUrl = typeof p.videoUrl === "string" ? p.videoUrl.trim() : "";
  const imageSrc =
    videoUrl.startsWith("http://") || videoUrl.startsWith("https://") ? videoUrl : PLACEHOLDER_IMG;

  return {
    id: row.id,
    destinationCountryIso: parseIsoCountry(p.destinationCountryIso),
    categorySlug: acquisitionCategoryFromPayload(p.category),
    sortKey: sortKeyFromUpdatedAt(row.updated_at),
    title: l10nSame(titleStr || "Listing"),
    summary: l10nSame(summaryStr),
    route: l10nSame(routeStr),
    bountyMinUsdc,
    bountyMaxUsdc,
    deadlineNote: l10nSame(typeof p.deadlineNote === "string" ? p.deadlineNote : ""),
    imageSrc,
    inspectionStandard: l10nSame(typeof p.inspectionStandard === "string" ? p.inspectionStandard : ""),
    authenticity: l10nSame(typeof p.authenticity === "string" ? p.authenticity : ""),
    condition: l10nSame(typeof p.condition === "string" ? p.condition : ""),
    rejections: l10nSame(typeof p.rejections === "string" ? p.rejections : ""),
    handoff: l10nSame(typeof p.handoff === "string" ? p.handoff : ""),
    story: [l10nSame(typeof p.description === "string" ? p.description : "")],
  };
}

export function parseMarketCatalogListRows(raw: unknown[]): MarketCatalogListRow[] {
  const out: MarketCatalogListRow[] = [];
  for (const x of raw) {
    if (x == null || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const updated_at = typeof o.updated_at === "string" ? o.updated_at : "";
    const payload = o.payload;
    if (!id || !updated_at || payload == null || typeof payload !== "object" || Array.isArray(payload)) continue;
    out.push({ id, payload: payload as Record<string, unknown>, updated_at });
  }
  return out;
}

/** 详情 API：`{ listing: { id, payload, updated_at } }` → Demo 卡 */
export function catalogDetailToDemoMerchantListing(listing: {
  id: string;
  payload: Record<string, unknown>;
  updated_at: string;
}): DemoMerchantListing {
  return catalogRowToDemoMerchantListing({
    id: listing.id,
    payload: listing.payload,
    updated_at: listing.updated_at,
  });
}

export function catalogDetailToDemoAcquisitionListing(listing: {
  id: string;
  payload: Record<string, unknown>;
  updated_at: string;
}): DemoAcquisitionListing {
  return catalogRowToDemoAcquisitionListing({
    id: listing.id,
    payload: listing.payload,
    updated_at: listing.updated_at,
  });
}
