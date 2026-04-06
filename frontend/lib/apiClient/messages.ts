/**
 * 订单聊天 GET/POST（04 §三、48 §5.8）；写请求带幂等与统一解析（Phase 4/5）
 */

import { apiUrl, routes } from "../api";
import {
  getAuthHeaders,
  writeRequestHeaders,
  parseResponse,
  requestId,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "./core";

export async function getOrderMessages(orderId: string): Promise<{ id: string; sender_id: string; content: string; created_at: string; sender_avatar_url?: string | null; sender_name?: string | null }[]> {
  const res = await fetch(apiUrl(routes.orderMessages(orderId)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as { status?: string; items?: unknown[] };
  logApiJsonStatusNotOk("getOrderMessages", data);
  throwUnlessApiOk(data);
  return Array.isArray(data.items)
    ? (data.items as { id: string; sender_id: string; content: string; created_at: string; sender_avatar_url?: string | null; sender_name?: string | null }[])
    : [];
}

export async function postOrderMessage(
  orderId: string,
  body: { content: string },
  idempotencyKey?: string
): Promise<unknown> {
  const res = await fetch(apiUrl(routes.orderMessages(orderId)), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postOrderMessage", data);
  throwUnlessApiOk(data);
  return data;
}
