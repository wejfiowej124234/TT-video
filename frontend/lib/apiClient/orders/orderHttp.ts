import { apiUrl, routes } from "../../api";
import {
  requestId,
  parseResponse,
  getAuthHeaders,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "../core";
import type { OrdersListResult } from "./types";

/**
 * **`GET /api/v1/orders`**：有 **chain_off** 时须会话；**无 chain_off** 时 **200** 空 **`items`**（见模块头）。**`state`** 非法 → **400** **`invalid_state`**；分页 **`limit`/`cursor`** 非法 → **400**（后端 **`parse_order_list_page`**）。
 */
export async function getOrders(params?: {
  limit?: number;
  cursor?: string;
  /** B-071：与后端 `OrderState` 字符串一致，如 completed / cancelled / disputed */
  state?: string;
  /** B-102：与 `CHAIN_ID` / `NEXT_PUBLIC_CHAIN_ID` 同源；省略则用默认链范围 */
  orders_chain_id?: number;
  /** 文本搜索：目的地/城市/国家/订单号/状态（服务端分页前过滤） */
  q?: string;
  hat?: "guide" | "traveler";
}): Promise<OrdersListResult> {
  const query = new URLSearchParams();
  if (params?.limit != null) query.set("limit", String(params.limit));
  if (params?.cursor) query.set("cursor", params.cursor);
  const st = params?.state?.trim();
  if (st) query.set("state", st.toLowerCase());
  const chainId = params?.orders_chain_id;
  if (chainId != null && chainId > 0) query.set("orders_chain_id", String(chainId));
  const search = params?.q?.trim();
  if (search) query.set("q", search);
  const hat = params?.hat?.trim();
  if (hat) query.set("hat", hat.toLowerCase());
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await fetch(apiUrl(routes.orders) + suffix, {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as {
    items?: unknown[];
    status?: string;
    page?: { limit: number; next_cursor: string | null; has_more: boolean };
  };
  logApiJsonStatusNotOk("getOrders", data);
  throwUnlessApiOk(data);
  const d = data as { items?: unknown[]; page?: OrdersListResult["page"] };
  const items = Array.isArray(d.items) ? d.items : Array.isArray(data) ? (data as unknown[]) : [];
  return d.page ? { items, page: d.page } : { items };
}

/**
 * **`POST /api/v1/orders`**：无 **chain_off** → **503** **`chain_off_unavailable`**；未登录 → **401**；体 **`CreateOrderBody`**（**`chain_off` `order_create_impl`**）。
 */
export async function postOrder(
  body: {
    guide_id: string;
    amount: string;
    currency?: string;
    escrow_address?: string | null;
    start_date?: string;
    end_date?: string;
  },
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orders), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify({ ...body, escrow_address: body.escrow_address ?? undefined }),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postOrder", data);
  throwUnlessApiOk(data);
  return data;
}

/**
 * **`GET /api/v1/orders/:id`**：有 **chain_off** → **401** / **`invalid_uuid`** / **`order_get_impl`** 业务码；**无 chain_off** → **200** 占位（模块头）。Escrow/投影合并见路由实现。
 */
export async function getOrder(id: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderById(id)), {
    cache: "no-store",
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getOrder", data);
  throwUnlessApiOk(data);
  return data;
}

/**
 * **`GET /api/v1/orders/:id/chain-sync-status`**（**110** §3.3）：**有 chain_off** → 须登录且参与方；**无 chain_off** → 仍 **200** 最小 **`chain_sync`** 体（**`get_order_chain_sync_status`** 第二分支），**非** 503。
 */
export async function getOrderChainSyncStatus(id: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderChainSyncStatus(id)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getOrderChainSyncStatus", data);
  throwUnlessApiOk(data);
  return data;
}

/**
 * **`PATCH /api/v1/orders/:id/itinerary`**（**53**；**`orders/mutations.rs`**）：**无 chain_off** → **503**；**401**；body 与 **52** 表一致（**04**）。
 */
export async function patchOrderItinerary(
  orderId: string,
  body: Record<string, unknown>,
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderPatchItinerary(orderId)), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchOrderItinerary", data);
  throwUnlessApiOk(data);
  return data;
}

/** **`POST …/accept`**：**无 chain_off** → **503**；**401**（**`order_accept`**）。 */
export async function orderAccept(orderId: string, idempotencyKey?: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderAccept(orderId)), {
    method: "POST",
    headers: writeRequestHeaders(idempotencyKey),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("orderAccept", data);
  throwUnlessApiOk(data);
  return data;
}

/** **`POST …/confirm-bilateral`**（**53-S6**）：**无 chain_off** → **503**；**401**（**04**）。 */
export async function orderConfirmBilateral(orderId: string, idempotencyKey?: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderConfirmBilateral(orderId)), {
    method: "POST",
    headers: writeRequestHeaders(idempotencyKey),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("orderConfirmBilateral", data);
  throwUnlessApiOk(data);
  return data;
}

/** **`POST …/confirm-rating`**（**53-S8**）：**无 chain_off** → **503**；**401**。 */
export async function orderConfirmRating(orderId: string, idempotencyKey?: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderConfirmRating(orderId)), {
    method: "POST",
    headers: writeRequestHeaders(idempotencyKey),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("orderConfirmRating", data);
  throwUnlessApiOk(data);
  return data;
}

/** **`POST …/cancel`**：**无 chain_off** → **503**；**401**。 */
export async function orderCancel(orderId: string, idempotencyKey?: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderCancel(orderId)), {
    method: "POST",
    headers: writeRequestHeaders(idempotencyKey),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("orderCancel", data);
  throwUnlessApiOk(data);
  return data;
}

/** **`POST …/mock-pay`**（P3 mock）：**无 chain_off** → **503**；**401**；仅测试/配置允许时可用。 */
export async function orderMockPay(orderId: string, idempotencyKey?: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderMockPay(orderId)), {
    method: "POST",
    headers: writeRequestHeaders(idempotencyKey),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("orderMockPay", data);
  throwUnlessApiOk(data);
  return data;
}

/** **`POST …/confirm-completion`**：**无 chain_off** → **503**；**401**。Legacy alias → confirm-service-completion。 */
export async function orderConfirmCompletion(orderId: string, idempotencyKey?: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderConfirmCompletion(orderId)), {
    method: "POST",
    headers: writeRequestHeaders(idempotencyKey),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("orderConfirmCompletion", data);
  throwUnlessApiOk(data);
  return data;
}

/** **`POST …/confirm-service-completion`**（Layer A）：**无 chain_off** → **503**；**401**；须 Escrowed。 */
export async function orderConfirmServiceCompletion(
  orderId: string,
  idempotencyKey?: string,
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderConfirmServiceCompletion(orderId)), {
    method: "POST",
    headers: writeRequestHeaders(idempotencyKey),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("orderConfirmServiceCompletion", data);
  throwUnlessApiOk(data);
  return data;
}

/**
 * **`POST …/confirm-final-plan`**：**无 chain_off** → **503**；**401**。须同时读 **HTTP status** 与 **body**（**409 version_conflict** 等），**不**经 **`parseResponse`**。
 */
export async function postOrderConfirmFinalPlan(
  orderId: string,
  body: { expected_version: number },
  idempotencyKey?: string
): Promise<{
  ok: boolean;
  status: number;
  data: { status?: string; error?: string; current_version?: number };
}> {
  const res = await fetch(apiUrl(routes.orderConfirmFinalPlan(orderId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    status?: string;
    error?: string;
    current_version?: number;
  };
  logApiJsonStatusNotOk("postOrderConfirmFinalPlan", data);
  return { ok: res.ok, status: res.status, data };
}

/**
 * **`POST …/set-escrow-address`**（**04**）：**无 chain_off** → **503**；**401**。
 */
export async function postOrderSetEscrowAddress(
  orderId: string,
  escrowAddress: string,
  idempotencyKey?: string
): Promise<{ status?: string; error?: string }> {
  const res = await fetch(apiUrl(routes.orderSetEscrowAddress(orderId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify({ escrow_address: escrowAddress }),
  });
  const data = (await parseResponse(res)) as { status?: string; error?: string };
  logApiJsonStatusNotOk("postOrderSetEscrowAddress", data);
  throwUnlessApiOk(data);
  return data;
}
