/**
 * 订单 API：列表、详情、创建、接单/取消/确认完成、评价、争议入口
 */

import { apiUrl, routes } from "../api";
import {
  requestId,
  parseResponse,
  getAuthHeaders,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "./core";
import type { MarketOrderItinerary, OrderBreakdown } from "../marketTypes";
import {
  parseReviewJsonContractMeta,
  type ReviewJsonContractClientView,
} from "../reviewJsonContract";
import { observeReviewJsonContractClient } from "../reviewJsonContractObservability";

/** `GET /api/v1/orders`；不传 limit 时后端全量返回（兼容）；传 limit/cursor 时分页（55 / 04） */
export type OrdersListResult = {
  items: unknown[];
  page?: { limit: number; next_cursor: string | null; has_more: boolean };
};

/** GET /api/v1/orders 列表项（image / escrow_address 与 Discover、详情同源，见 04 §3.4；chain_off 下有行程时含 breakdown/itinerary 与 discover 同形） */
export type OrderListItem = {
  id: string;
  state?: string;
  status?: string;
  /** 53：与主状态配合展示文案；列表接口可选返回 */
  sub_status?: string;
  amount?: string;
  currency?: string;
  destination?: string;
  city?: string;
  country?: string;
  travel_date?: string | null;
  days?: number;
  image?: string | null;
  escrow_address?: string | null;
  /** 列表与 GET order 同源时由 API 返回（托管预填等） */
  tourist_id?: string;
  /** 87：与 `tourist_id` 同 UUID（chain_off 镜像） */
  traveler_id?: string;
  /** GET /orders 列表：游客昵称（chain_off 从 users 表填充；可缺省） */
  traveler_nickname?: string;
  guide_id?: string;
  created_at?: string;
  breakdown?: OrderBreakdown | null;
  itinerary?: MarketOrderItinerary | null;
  /** B-097：有 **`orders_projection`** 时由 API 给出；徽章以之为 SSOT */
  display_status?: string | null;
  /** B-097：链上投影终端；**`null`** 表示无投影行；**`read_status: degraded`** 表示读库失败 */
  projection_terminal?: Record<string, unknown> | null;
  /** 业务线（列表与 chain_off 同源；`communityMeOrdersDrawerModel` / 04 对读） */
  business_line?: string;
};

export async function getOrders(params?: {
  limit?: number;
  cursor?: string;
  /** B-071：与后端 `OrderState` 字符串一致，如 completed / cancelled / disputed */
  state?: string;
  /** W4 Workspace：trip · merchant_service · acquisition */
  business_line?: "trip" | "merchant_service" | "acquisition";
  /** Guide Order Corridor：`guide` · `traveler` */
  hat?: "guide" | "merchant" | "traveler";
}): Promise<OrdersListResult> {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.cursor) q.set("cursor", params.cursor);
  const st = params?.state?.trim();
  if (st) q.set("state", st.toLowerCase());
  const bl = params?.business_line?.trim();
  if (bl) q.set("business_line", bl);
  const hat = params?.hat?.trim();
  if (hat) q.set("hat", hat.toLowerCase());
  const suffix = q.toString() ? `?${q.toString()}` : "";
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

/** GET /api/v1/orders/:id/chain-sync-status（须登录、参与方；110 §3.3） */
export async function getOrderChainSyncStatus(id: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderChainSyncStatus(id)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getOrderChainSyncStatus", data);
  throwUnlessApiOk(data);
  return data;
}

/** 53 行程修改写回 — PATCH /api/v1/orders/:id/itinerary（04 已登记；仅参与方、未 Escrowed 前可改；body 与 52 统一表一致） */
/** PATCH /api/v1/orders/:id/guide — 为草稿订单选定向导 */
export async function patchOrderGuide(
  orderId: string,
  guideId: string,
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderPatchGuide(orderId)), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify({ guide_id: guideId.trim() }),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchOrderGuide", data);
  throwUnlessApiOk(data);
  return data;
}

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

/** 53-S6：双边确认 — 旅行者/向导各自确认行程与金额（04 POST confirm-bilateral） */
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

/** 53-S8：评分双方确认 — 确认评分与材料后触发释放（04 POST confirm-rating，后端登记后可用） */
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

/** GD-L5-P2：改期（Created/Accepted · 未 Escrowed；409 schedule_conflict 时 body.error=schedule_conflict） */
export async function patchOrderTripDates(
  orderId: string,
  body: { start_date: string; end_date: string },
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderPatchTripDates(orderId)), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchOrderTripDates", data);
  throwUnlessApiOk(data);
  return data;
}

/** P3 链下 mock：Accepted→Escrowed（仅当后端 P3_CHAIN_OFF=1 时可用） */
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

/** 53 POST confirm-final-plan：须同时读 HTTP status 与 body（409 version_conflict / 503 等），故不经过 parseResponse */
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

/** 链上部署 Escrow 后回写 `escrow_address`（与 mock set-escrow 同路径，04 POST set-escrow-address） */
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

/** `GET /orders/:id/reviews` 列表项（04 §3.4；含 `weight`） */
export type OrderReviewListItem = {
  id?: string;
  order_id?: string;
  reviewer_id: string;
  reviewee_id: string;
  score: number;
  weight?: number;
  comment?: string | null;
  created_at?: string;
};

/** **`meta.review_json_contract`**（B-451；与 `GET`/`POST …/reviews` 同源） */
export type OrderReviewJsonContractMeta = {
  schema_version: number;
  anchor: string;
};

/** 与响应 `meta` 同源（`review_weight_rule_*` + `review_json_contract`） */
export type OrderReviewsListMeta = {
  review_weight_rule_version?: string;
  review_weight_rule?: string;
  review_json_contract?: OrderReviewJsonContractMeta;
};

export type OrderReviewsListResult = {
  items: OrderReviewListItem[];
  meta?: OrderReviewsListMeta;
  /** B-452：与 `meta` 同源解析，供 UI/日志做版本化降级 */
  reviewJsonContractClient: ReviewJsonContractClientView;
};

/** `POST …/reviews` 成功体 `review.weight_breakdown`（与 `traveltrust_core::ReviewWeightBreakdown` 对齐） */
export type OrderReviewWeightBreakdown = {
  rule_version: string;
  order_amount: number;
  account_age_days: number;
  amount_factor: number;
  age_factor: number;
  weight: number;
  guide_historical_score_reserved: number;
};

/** `POST …/reviews` **200** **`review`** **（** **B-449/B-450** **：** **首次成功** **`weight_breakdown`** **object** **且** **无** **`weight_breakdown_note`** **；** **幂等** **`weight_breakdown`** **null** **且** **`weight_breakdown_note`** **=** **`persisted_review_inputs_not_replayed`** **）** */
export type OrderReviewSubmitReview = {
  id: string;
  order_id: string;
  tourist_id: string;
  traveler_id: string;
  score: number;
  weight: number;
  weight_breakdown: OrderReviewWeightBreakdown | null;
  weight_breakdown_note?: "persisted_review_inputs_not_replayed";
};

export type OrderReviewSubmitOk = {
  status: "ok";
  /** B-451：与 `GET …/reviews` `meta.review_json_contract` 同源 */
  meta?: {
    review_json_contract?: OrderReviewJsonContractMeta;
  };
  review: OrderReviewSubmitReview;
};

/** B-452：`postReview` 成功体 + 客户端合约视图 */
export type OrderReviewPostResult = OrderReviewSubmitOk & {
  reviewJsonContractClient: ReviewJsonContractClientView;
};

export async function getOrderReviews(orderId: string): Promise<OrderReviewsListResult> {
  const res = await fetch(apiUrl(routes.orderReviews(orderId)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as {
    status?: string;
    items?: unknown[];
    meta?: OrderReviewsListMeta;
  };
  logApiJsonStatusNotOk("getOrderReviews", data);
  throwUnlessApiOk(data);
  const raw = Array.isArray(data.items) ? data.items : [];
  const items = raw.filter(isRecord).map(normalizeOrderReviewItem);
  const meta =
    data.meta != null && typeof data.meta === "object" ? (data.meta as OrderReviewsListMeta) : undefined;
  const reviewJsonContractClient = parseReviewJsonContractMeta(data.meta);
  observeReviewJsonContractClient(reviewJsonContractClient, "get_reviews");
  return { items, meta, reviewJsonContractClient };
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x != null && typeof x === "object";
}

function normalizeOrderReviewItem(r: Record<string, unknown>): OrderReviewListItem {
  const reviewer_id = typeof r.reviewer_id === "string" ? r.reviewer_id : "";
  const reviewee_id = typeof r.reviewee_id === "string" ? r.reviewee_id : "";
  const score = typeof r.score === "number" && Number.isFinite(r.score) ? r.score : 0;
  const weight = typeof r.weight === "number" && Number.isFinite(r.weight) ? r.weight : undefined;
  const id = typeof r.id === "string" ? r.id : undefined;
  const order_id = typeof r.order_id === "string" ? r.order_id : undefined;
  const comment = r.comment === null || typeof r.comment === "string" ? (r.comment as string | null) : undefined;
  const created_at = typeof r.created_at === "string" ? r.created_at : undefined;
  return { id, order_id, reviewer_id, reviewee_id, score, weight, comment: comment ?? undefined, created_at };
}

export async function postReview(
  orderId: string,
  body: { score: number; comment?: string },
  idempotencyKey?: string
): Promise<OrderReviewPostResult> {
  const res = await fetch(apiUrl(routes.orderReviews(orderId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify(body),
  });
  const data = (await parseResponse(res)) as OrderReviewSubmitOk;
  logApiJsonStatusNotOk("postReview", data);
  throwUnlessApiOk(data);
  const reviewJsonContractClient = parseReviewJsonContractMeta(data.meta);
  observeReviewJsonContractClient(reviewJsonContractClient, "post_review");
  return { ...data, reviewJsonContractClient };
}

export async function postOrderDispute(
  orderId: string,
  body?: Record<string, unknown>,
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderDispute(orderId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: body ? JSON.stringify(body) : "{}",
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postOrderDispute", data);
  throwUnlessApiOk(data);
  return data;
}

/** Intents 扩展（48 routes/intents）：确认完成意向 */
export async function postOrderConfirmCompletionIntent(
  orderId: string,
  body?: Record<string, unknown>,
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderConfirmCompletionIntent(orderId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: body ? JSON.stringify(body) : "{}",
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postOrderConfirmCompletionIntent", data);
  return data;
}

/** Intents 扩展：发起争议意向 */
export async function postOrderOpenDisputeIntent(
  orderId: string,
  body?: Record<string, unknown>,
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderOpenDisputeIntent(orderId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: body ? JSON.stringify(body) : "{}",
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postOrderOpenDisputeIntent", data);
  return data;
}
