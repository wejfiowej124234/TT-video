import { apiUrl, routes } from "../../api";
import {
  requestId,
  parseResponse,
  getAuthHeaders,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "../core";
import { parseReviewJsonContractMeta } from "../../reviewJsonContract";
import { observeReviewJsonContractClient } from "../../reviewJsonContractObservability";
import type {
  OrderReviewListItem,
  OrderReviewsListMeta,
  OrderReviewsListResult,
  OrderReviewPostResult,
  OrderReviewSubmitOk,
} from "./types";

/** **`GET …/reviews`**：**无 chain_off** → **503**；**401**；**`meta.review_json_contract`** 等见类型注释（**04**）。 */
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

/** **`POST …/reviews`**：**无 chain_off** → **503**；**401**；幂等 **`already_reviewed`** 等见 **`reviews.rs`**。 */
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

/** **`POST /api/v1/orders/:id/dispute`**（**`routes/disputes.rs`** **`order_open_dispute`**）：**无 chain_off** → **503**；**401**；**`invalid_uuid`**。 */
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

/**
 * **`POST …/confirm-completion-intent`**（**`routes/intents.rs`**）：**不**依赖 **`chain_off`**；**202** **`status: accepted`**（非 **`ok`**，可能 **`logApiJsonStatusNotOk`**）；**不**调用 **`throwUnlessApiOk`**。**400 invalid_intent**、**403 intent_blocked**、**503 outbox_persist_failed**。
 */
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

/**
 * **`POST …/open-dispute-intent`**：同 **`postOrderConfirmCompletionIntent`**（**intents** / **outbox**，**不**经 **chain_off** 503）。
 */
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
