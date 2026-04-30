/**
 * 自由市场子站（94）：列表/详情 HTTP 契约与 `crates/api/src/routes/market_subsite.rs` 对齐。
 * GET …/listings：有 chain_off + PG 池时 200 status ok + items（meta.source=postgres_catalog）；否则 503 chain_off_unavailable 或 database_required（parseResponse 抛错）。
 * GET …/listings/:id：有池且命中则 200；未命中 404；无 chain_off 或无池时 503（不再冒充 404）。
 * POST …/listings：须登录 + PG，写入 market_listings。
 * POST …/drafts：须登录（`writeRequestHeaders`）+ chain_off + `ensure_durable_writes_available` + PG 池，写入 **`market_listing_drafts.owner_user_id`**。
 * GET …/drafts/:id：须登录（`getAuthHeaders`）；仅当草稿 **`owner_user_id`** 与当前会话一致时 **200**（否则 **404** **`listing_draft_not_found`**）。
 */

import { apiUrl, routes } from "../api";
import {
  apiFetch,
  requestId,
  parseResponse,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
  writeRequestHeaders,
  getAuthHeaders,
} from "./core";

const fetch = apiFetch;

/** `GET …/provider|acquisition/listings`：`status:ok` 但缺少或非数组 `items` 时勿冒充空目录。 */
export const TRAVELTRUST_MARKET_SUBSITE_LISTINGS_CONTRACT_INVALID =
  "TRAVELTRUST_MARKET_SUBSITE_LISTINGS_CONTRACT_INVALID";

function parseMarketSubsiteListingsItems(data: Record<string, unknown>): unknown[] {
  if (!("items" in data) || !Array.isArray(data.items)) {
    throw new Error(TRAVELTRUST_MARKET_SUBSITE_LISTINGS_CONTRACT_INVALID);
  }
  return data.items;
}

/** `POST …/listings` 成功体（与 `market_subsite.rs` JSON 对齐） */
export type MarketListingPublishResult = {
  status?: string;
  listing_id?: string;
};

export type MarketSubsiteListingsResult = {
  items: unknown[];
  meta?: Record<string, unknown>;
  /** 保留字段：历史 **`status: degraded`** 目录已移除；成功体仅 **`ok` + postgres_catalog** */
  degradedReason?: string;
  /** `true` 仅当服务端仍返回 **`meta.source`** 含 **`placeholder`**（当前成功目录恒为 **`false`**） */
  isPlaceholderCatalog: boolean;
};

function listingsPlaceholderFlags(data: { status?: string; meta?: Record<string, unknown> }): boolean {
  if (data.status === "ok" && data.meta?.source === "postgres_catalog") return false;
  if (data.status === "degraded") return true;
  const src = data.meta?.source;
  return typeof src === "string" && src.toLowerCase().includes("placeholder");
}

export type MarketListingDraftPostResult = {
    draft_id: string;
    saved_at: string;
};

export type MarketListingDraftGetResult = {
    draft_id: string;
    saved_at: string;
    payload: Record<string, unknown>;
    meta: { variant: string; source: string };
};

export async function getMarketProviderListings(): Promise<MarketSubsiteListingsResult> {
  const res = await fetch(apiUrl(routes.marketProviderListings), {
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

export async function getMarketAcquisitionListings(): Promise<MarketSubsiteListingsResult> {
  const res = await fetch(apiUrl(routes.marketAcquisitionListings), {
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
    body: JSON.stringify(body),
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
    body: JSON.stringify(body),
  });
  const data = (await parseResponse(res)) as MarketListingDraftPostResult & { status?: string };
  logApiJsonStatusNotOk("postMarketAcquisitionListingDraft", data);
  throwUnlessApiOk(data);
  return data;
}

/** 发布至 **`market_listings`**（须登录 + **`chain_off` + PG**） */
export async function postMarketProviderListing(body: Record<string, unknown>): Promise<MarketListingPublishResult> {
  const res = await fetch(apiUrl(routes.marketProviderListings), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = (await parseResponse(res)) as MarketListingPublishResult;
  logApiJsonStatusNotOk("postMarketProviderListing", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postMarketAcquisitionListing(body: Record<string, unknown>): Promise<MarketListingPublishResult> {
  const res = await fetch(apiUrl(routes.marketAcquisitionListings), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = (await parseResponse(res)) as MarketListingPublishResult;
  logApiJsonStatusNotOk("postMarketAcquisitionListing", data);
  throwUnlessApiOk(data);
  return data;
}
