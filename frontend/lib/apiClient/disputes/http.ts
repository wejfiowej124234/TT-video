/**
 * **争议 / 证据 / 裁决**（**`crates/api/src/routes/disputes.rs`**、**`evidence.rs`**；**04** / **48** §2.2；各环境 HTTP 分岔同源）。
 *
 * **`GET /api/v1/disputes`**、**`GET /api/v1/disputes/:id`**：**无 `chain_off`** → **503** **`chain_off_unavailable`**（与 **`disputes::tests`** 一致）。**有 `chain_off` + PG 池**：列表 **`invalid_cursor`** → **400**；列表/详情走 **`db::list_disputes_public_page`** / **`get_dispute_public_detail`**；**`:id`** 非 UUID → **400**；详情未找到 → **404** **`dispute_not_found`**。列表/详情处理器**不**强制登录（与路由一致）。
 * **`POST /api/v1/orders/:id/dispute`**、**`POST /api/v1/disputes/:id/resolve`**：**无 `chain_off`** → **503**；须会话 → **401**；**`invalid_uuid`** 等见 **`order_open_dispute`** / **`dispute_resolve`**。
 * **`GET|POST /api/v1/orders/:id/evidence`**（本文件 **`getOrderEvidence`** / **`postOrderEvidence`**）：**无 `chain_off`** → **503**；**POST** 须登录 **401**；**GET** 无会话门（与 **`evidence.rs`**）；**`invalid_uuid`** → **400**。
 * **`postDisputeExecuteResolutionIntent`**：**`routes/intents.rs`**，**不**走 **`chain_off`** 分岔（见 **`orders.ts`** 同类注释）。
 */

import { apiUrl, routes } from "../../api";
import {
  requestId,
  parseResponse,
  getAuthHeaders,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "../core";

type DisputesListEnvelope = {
  status?: string;
  items?: unknown[];
  page?: { has_more?: boolean; next_cursor?: string | null };
  error?: string;
};

/**
 * **`GET /api/v1/disputes`**（分页直至 **`has_more`** 为 false；默认 **`limit=500`** 与后端上限 **500** 对齐）。**无 chain_off** → **503**；**PG** 路径 **`invalid_cursor`** → **400**（模块头）。
 */
export async function getDisputes(): Promise<unknown[]> {
  const acc: unknown[] = [];
  let cursor: string | undefined;
  const limit = 500;
  for (let guard = 0; guard < 50; guard++) {
    const qs = new URLSearchParams();
    qs.set("limit", String(limit));
    if (cursor) qs.set("cursor", cursor);
    const url = `${apiUrl(routes.disputes)}?${qs.toString()}`;
    const res = await fetch(url, {
      headers: { "x-request-id": requestId(), ...getAuthHeaders() },
    });
    const data = (await parseResponse(res)) as DisputesListEnvelope;
    logApiJsonStatusNotOk("getDisputes", data);
    throwUnlessApiOk(data);
    const chunk = Array.isArray(data.items) ? data.items : [];
    acc.push(...chunk);
    const more = data.page?.has_more === true && data.page?.next_cursor;
    if (!more) break;
    cursor = data.page!.next_cursor!;
    if (chunk.length === 0) break;
  }
  return acc;
}

/** **`GET /api/v1/disputes/:id`**：无 **`dispute`** 键时客户端抛 **`dispute_not_found`**；**503** / **400** / **404** 见模块头。 */
export async function getDispute(id: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.disputeById(id)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as { status?: string; dispute?: unknown };
  logApiJsonStatusNotOk("getDispute", data);
  throwUnlessApiOk(data);
  if (data.dispute != null) return data.dispute;
  throw new Error("dispute_not_found");
}

/** **`GET …/orders/:id/evidence`**：无 **chain_off** → **503**（**`evidence.rs`**）。 */
export async function getOrderEvidence(orderId: string): Promise<unknown[]> {
  const res = await fetch(apiUrl(routes.orderEvidence(orderId)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as { status?: string; items?: unknown[] };
  logApiJsonStatusNotOk("getOrderEvidence", data);
  throwUnlessApiOk(data);
  return Array.isArray(data.items) ? data.items : [];
}

/** **`POST …/evidence`**：**`writeRequestHeaders`**；**401** / **503** / **400** 见模块头。 */
export async function postOrderEvidence(
  orderId: string,
  body: { content_hash: string },
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderEvidence(orderId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postOrderEvidence", data);
  throwUnlessApiOk(data);
  return data;
}

/** **`POST /api/v1/disputes/:id/resolve`**：须登录；无 **chain_off** → **503**。 */
export async function postDisputeResolve(
  disputeId: string,
  body: { refund_ratio: number; slash_guide: boolean },
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.disputeResolve(disputeId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postDisputeResolve", data);
  throwUnlessApiOk(data);
  return data;
}

/**
 * **`POST /api/v1/disputes/:id/execute-resolution-intent`**（**`routes/intents.rs`**）：**不**依赖 **`chain_off`**；**202** 体常 **`status: accepted`**（非 **`ok`**，可能触发 **`logApiJsonStatusNotOk`**）；**本函数不调用 `throwUnlessApiOk`**。**400 invalid_intent**、**403 intent_blocked**、**503 outbox_persist_failed**。
 */
export async function postDisputeExecuteResolutionIntent(
  disputeId: string,
  body?: Record<string, unknown>,
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.disputeExecuteResolutionIntent(disputeId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: body ? JSON.stringify(body) : "{}",
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postDisputeExecuteResolutionIntent", data);
  return data;
}
