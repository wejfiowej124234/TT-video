/**
 * 自由市场星标：账户级持久化（`market_travel_bookmarks`），与 `/market` 卡片 id 同源。
 */

import { apiUrl, routes } from "../api";
import { apiFetch, getAuthHeaders, requestId, parseResponse, throwUnlessApiOk, logApiJsonStatusNotOk } from "./core";

const fetch = apiFetch;

const headers = (): Record<string, string> => ({
  "x-request-id": requestId(),
  "Content-Type": "application/json",
  ...getAuthHeaders(),
});

/** `GET …/me/market-bookmarks`：`order_ids` / `guide_ids` 若出现则须为 string[]（勿将 null/对象静默当空）。 */
export const TRAVELTRUST_MARKET_TRAVEL_BOOKMARKS_CONTRACT_INVALID =
  "TRAVELTRUST_MARKET_TRAVEL_BOOKMARKS_CONTRACT_INVALID";

function assertOptionalStringIdArray(d: Record<string, unknown>, key: "order_ids" | "guide_ids"): void {
  if (!(key in d)) return;
  const v = d[key];
  if (v === undefined) return;
  if (v === null || !Array.isArray(v) || v.some((x) => typeof x !== "string")) {
    throw new Error(TRAVELTRUST_MARKET_TRAVEL_BOOKMARKS_CONTRACT_INVALID);
  }
}

export type MarketTravelBookmarksPayload = {
  status: string;
  order_ids?: string[];
  guide_ids?: string[];
  reason?: string;
};

export async function getMarketTravelBookmarks(): Promise<MarketTravelBookmarksPayload> {
  const res = await fetch(apiUrl(routes.meMarketBookmarks), { headers: headers() });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMarketTravelBookmarks", data);
  throwUnlessApiOk(data);
  const d = data as Record<string, unknown>;
  assertOptionalStringIdArray(d, "order_ids");
  assertOptionalStringIdArray(d, "guide_ids");
  return data as MarketTravelBookmarksPayload;
}

export async function postMarketTravelBookmark(targetType: "order" | "guide", targetId: string): Promise<void> {
  const res = await fetch(apiUrl(routes.meMarketBookmarks), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ target_type: targetType, target_id: targetId }),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postMarketTravelBookmark", data);
  throwUnlessApiOk(data);
}

export async function deleteMarketTravelBookmark(targetType: "order" | "guide", targetId: string): Promise<void> {
  const res = await fetch(apiUrl(routes.meMarketBookmarkByTarget(targetType, targetId)), {
    method: "DELETE",
    headers: headers(),
  });
  if (res.status === 404) {
    const err = new Error("bookmark_not_found");
    throw err;
  }
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("deleteMarketTravelBookmark", data);
  throwUnlessApiOk(data);
}
