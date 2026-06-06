import { apiUrl, routes } from "../../api";
import {
  requestId,
  parseResponse,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
  writeRequestHeaders,
  getAuthHeaders,
} from "../core";
import {
  TRAVELTRUST_MARKET_SUBSITE_LISTINGS_CONTRACT_INVALID,
  type MarketListingDraftGetResult,
  type MarketListingDraftPostResult,
  type MarketListingPublishResult,
  type MarketSubsiteListingsResult,
} from "./types";

function parseMarketSubsiteListingsItems(data: Record<string, unknown>): unknown[] {
  if (!("items" in data) || !Array.isArray(data.items)) {
    throw new Error(TRAVELTRUST_MARKET_SUBSITE_LISTINGS_CONTRACT_INVALID);
  }
  return data.items;
}

function listingsPlaceholderFlags(data: { status?: string; meta?: Record<string, unknown> }): boolean {
  if (data.status === "ok" && data.meta?.source === "postgres_catalog") return false;
  if (data.status === "degraded") return true;
  const src = data.meta?.source;
  return typeof src === "string" && src.toLowerCase().includes("placeholder");
}

export async function getMarketProviderListings(
  filterQuery?: string,
): Promise<MarketSubsiteListingsResult> {
  const qs = filterQuery?.trim();
  const path = qs ? `${routes.marketProviderListings}?${qs}` : routes.marketProviderListings;
  const res = await fetch(apiUrl(path), {
    headers: { "x-request-id": requestId() },
  });
  const data = (await parseResponse(res)) as {
    status?: string;
    items?: unknown[];
    meta?: Record<string, unknown>;
    reason?: string;
  };
  logApiJsonStatusNotOk("getMarketProviderListings", data);
  throwUnlessApiOk(data);
  const d = data as Record<string, unknown>;
  return {
    items: parseMarketSubsiteListingsItems(d),
    meta: d.meta as Record<string, unknown> | undefined,
    isPlaceholderCatalog: listingsPlaceholderFlags(data),
  };
}

export async function getMarketAcquisitionListings(
  filterQuery?: string,
): Promise<MarketSubsiteListingsResult> {
  const qs = filterQuery?.trim();
  const path = qs ? `${routes.marketAcquisitionListings}?${qs}` : routes.marketAcquisitionListings;
  const res = await fetch(apiUrl(path), {
    headers: { "x-request-id": requestId() },
  });
  const data = (await parseResponse(res)) as {
    status?: string;
    items?: unknown[];
    meta?: Record<string, unknown>;
    reason?: string;
  };
  logApiJsonStatusNotOk("getMarketAcquisitionListings", data);
  throwUnlessApiOk(data);
  const d = data as Record<string, unknown>;
  return {
    items: parseMarketSubsiteListingsItems(d),
    meta: d.meta as Record<string, unknown> | undefined,
    isPlaceholderCatalog: listingsPlaceholderFlags(data),
  };
}

/** 详情：**404** `listing_not_found` 时返回 **null**；**503** 由 **`parseResponse`** 抛出。 */
export async function getMarketProviderListing(id: string): Promise<unknown | null> {
  const res = await fetch(apiUrl(routes.marketProviderListingById(id)), {
    headers: { "x-request-id": requestId() },
  });
  if (res.status === 404) return null;
  const data = (await parseResponse(res)) as { status?: string; error?: string };
  logApiJsonStatusNotOk("getMarketProviderListing", data);
  throwUnlessApiOk(data);
  return data;
}

export async function getMarketAcquisitionListing(id: string): Promise<unknown | null> {
  const res = await fetch(apiUrl(routes.marketAcquisitionListingById(id)), {
    headers: { "x-request-id": requestId() },
  });
  if (res.status === 404) return null;
  const data = (await parseResponse(res)) as { status?: string; error?: string };
  logApiJsonStatusNotOk("getMarketAcquisitionListing", data);
  throwUnlessApiOk(data);
  return data;
}

/** 商家橱窗创作台草稿登记 → **`POST …/provider/listings/drafts`**（`market_listing_drafts`；须 API + PG） */
export async function getMarketProviderListingDraft(draftId: string): Promise<MarketListingDraftGetResult> {
  const res = await fetch(apiUrl(routes.marketProviderListingDraftById(draftId)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as MarketListingDraftGetResult & { status?: string };
  logApiJsonStatusNotOk("getMarketProviderListingDraft", data);
  throwUnlessApiOk(data);
  return data;
}

export async function getMarketAcquisitionListingDraft(draftId: string): Promise<MarketListingDraftGetResult> {
  const res = await fetch(apiUrl(routes.marketAcquisitionListingDraftById(draftId)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as MarketListingDraftGetResult & { status?: string };
  logApiJsonStatusNotOk("getMarketAcquisitionListingDraft", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postMarketProviderListingDraft(
  body: Record<string, unknown>
): Promise<MarketListingDraftPostResult> {
  const res = await fetch(apiUrl(routes.marketProviderListingDrafts), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify({ payload: body }),
  });
  const data = (await parseResponse(res)) as MarketListingDraftPostResult & { status?: string };
  logApiJsonStatusNotOk("postMarketProviderListingDraft", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postMarketAcquisitionListingDraft(
  body: Record<string, unknown>
): Promise<MarketListingDraftPostResult> {
  const res = await fetch(apiUrl(routes.marketAcquisitionListingDrafts), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify({ payload: body }),
  });
  const data = (await parseResponse(res)) as MarketListingDraftPostResult & { status?: string };
  logApiJsonStatusNotOk("postMarketAcquisitionListingDraft", data);
  throwUnlessApiOk(data);
  return data;
}

/**
 * 发布 **provider** 侧 listing 至 **`market_listings`**（须登录 + **`chain_off` + PG**）；HTTP 与 **`f021-f022-f023-request`** / **`crates/api/src/routes/market_subsite/`** 一致：**`{ "payload": <object> }`**。
 * **`payload`** 内若含与 **`POST …/community/posts`** 同源的 **`http(s):`** 内嵌 URL 字段，受 **`TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS`** / **`TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES`** 护栏（**400** **`media_url_*`**，与 **04**、**`validate_market_listing_payload_embedded_http_urls`** 同源）；可选前端预检见 **`communityPostMediaEmbeddedUrlPolicy`**。
 */
export async function postMarketProviderListing(body: Record<string, unknown>): Promise<MarketListingPublishResult> {
  const res = await fetch(apiUrl(routes.marketProviderListings), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify({ payload: body }),
  });
  const data = (await parseResponse(res)) as MarketListingPublishResult;
  logApiJsonStatusNotOk("postMarketProviderListing", data);
  throwUnlessApiOk(data);
  return data;
}

/** 同 **`postMarketProviderListing`**，**acquisition** 变体路径（**`POST …/market/acquisition/listings`**）。 */
export async function postMarketAcquisitionListing(
  body: Record<string, unknown>,
  opts?: { agreeEscrowCopy?: boolean },
): Promise<MarketListingPublishResult> {
  const agreeEscrowCopy = opts?.agreeEscrowCopy === true;
  const res = await fetch(apiUrl(routes.marketAcquisitionListings), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify({ payload: body, agree_escrow_copy: agreeEscrowCopy }),
  });
  const data = (await parseResponse(res)) as MarketListingPublishResult;
  logApiJsonStatusNotOk("postMarketAcquisitionListing", data);
  throwUnlessApiOk(data);
  return data;
}

/** **`POST …/provider/listings/:id/orders`** — 从 catalog listing 创建订单（94 §4）。 */
export async function postMarketProviderListingOrder(
  listingId: string,
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.marketProviderListingOrderById(listingId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify({}),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postMarketProviderListingOrder", data);
  throwUnlessApiOk(data);
  return data;
}

/** **`POST …/acquisition/listings/:id/orders`** — 收购 listing 接单创单（94 §6）。 */
export async function postMarketAcquisitionListingOrder(
  listingId: string,
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.marketAcquisitionListingOrderById(listingId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify({}),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postMarketAcquisitionListingOrder", data);
  throwUnlessApiOk(data);
  return data;
}
