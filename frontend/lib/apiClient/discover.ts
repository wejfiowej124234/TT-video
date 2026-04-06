/**
 * Discover / 自由市场：可浏览订单列表
 * 单条 item 与 `OrderCardItem`（lib/marketTypes）字段对齐：含 image、escrow_address、breakdown、**itinerary**（与 GET order 同源，52）等（04 §3.4）。
 */

import { apiUrl, routes } from "../api";
import { requestId, parseResponse, logApiJsonStatusNotOk, throwUnlessApiOk } from "./core";

export type DiscoverOrdersResult = {
  items: unknown[];
  page?: { limit: number; next_cursor: string | null; has_more: boolean };
};

export async function getDiscoverOrders(params?: {
  country?: string;
  city?: string;
  limit?: number;
  cursor?: string;
}): Promise<DiscoverOrdersResult> {
  const q = new URLSearchParams();
  if (params?.country) q.set("country", params.country);
  if (params?.city) q.set("city", params.city);
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
