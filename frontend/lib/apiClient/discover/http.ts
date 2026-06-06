/**
 * **Discover / 自由市场列表源**（**`GET /api/v1/discover/orders`**；**`crates/api/src/routes/discover.rs`**；**48** §2.2、**04** §3.4；前端 **`/market`** 主列表）。
 *
 * **chain_off 分岔**：**无 `chain_off`** → **200** **`{ "status": "ok", "items": [] }`**（**非** **503**，与 **`get_discover_orders`** 一致）。**有 `chain_off`** → **`chain_off::discover_orders_list_impl`**；**`limit`/`cursor`** 非法 → **400**（**`parse_order_list_page`**，与 **`GET /orders`** 分页语义同源）。
 * **无需登录**（handler **不**抽会话）；单条 **item** 与 **`OrderCardItem`**（**`lib/marketTypes`**）对齐：**image**、**escrow_address**、**breakdown**、**itinerary**（与 **GET order** 同源，**52**）。
 */

import { apiUrl, routes } from "../../api";
import { requestId, parseResponse, logApiJsonStatusNotOk, throwUnlessApiOk } from "../core";
import type { DiscoverOrdersResult } from "./types";

export async function getDiscoverOrders(params?: {
  country?: string;
  city?: string;
  days?: number;
  limit?: number;
  cursor?: string;
}): Promise<DiscoverOrdersResult> {
  const q = new URLSearchParams();
  if (params?.country) q.set("country", params.country);
  if (params?.city) q.set("city", params.city);
  if (params?.days != null) q.set("days", String(params.days));
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.cursor) q.set("cursor", params.cursor);
  const url = apiUrl(routes.discoverOrders) + (q.toString() ? `?${q}` : "");
  const res = await fetch(url, {
    headers: { "x-request-id": requestId() },
  });
  const data = (await parseResponse(res)) as {
    status?: string;
    items?: unknown[];
    page?: { limit: number; next_cursor: string | null; has_more: boolean };
  };
  logApiJsonStatusNotOk("getDiscoverOrders", data);
  throwUnlessApiOk(data);
  const items = Array.isArray(data.items) ? data.items : [];
  return data?.page ? { items, page: data.page } : { items };
}
