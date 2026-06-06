/**
 * **自由市场星标**（**B-MKT-003/004/013** · **F-020**；**`crates/api/src/routes/me.rs`** **`get_me_market_bookmarks`** / **`post_me_market_bookmarks`** / **`delete_me_market_bookmarks_*`**）。
 *
 * **须登录**：**401** 根级 **`error: unauthorized`**（**`parseResponse`** 映射为抛 **`login_required`**，与 **`core`** 一致）。
 * **无 `chain_off.db_pool`**：**503** **`service_unavailable`**（**非** **`chain_off_unavailable`** / **`database_required`** 文案；与 **`post_me_market_bookmarks`** 分支一致）。
 * **DELETE**：**`deleteMarketTravelBookmark`** 在 **HTTP 404** 时抛 **`bookmark_not_found`**（先于 **`parseResponse`**）；有池时删除为 **best-effort**，**200** **`status:ok`** 亦可能出现。
 */

import { apiUrl, routes } from "../../api";
import { apiFetch, getAuthHeaders, requestId, parseResponse, throwUnlessApiOk, logApiJsonStatusNotOk } from "../core";
import { TRAVELTRUST_MARKET_TRAVEL_BOOKMARKS_CONTRACT_INVALID, type MarketTravelBookmarksPayload } from "./types";

const fetch = apiFetch;

const headers = (): Record<string, string> => ({
  "x-request-id": requestId(),
  "Content-Type": "application/json",
  ...getAuthHeaders(),
});

function assertOptionalStringIdArray(d: Record<string, unknown>, key: "order_ids" | "guide_ids"): void {
  if (!(key in d)) return;
  const v = d[key];
  if (v === undefined) return;
  if (v === null || !Array.isArray(v) || v.some((x) => typeof x !== "string")) {
    throw new Error(TRAVELTRUST_MARKET_TRAVEL_BOOKMARKS_CONTRACT_INVALID);
  }
}

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
